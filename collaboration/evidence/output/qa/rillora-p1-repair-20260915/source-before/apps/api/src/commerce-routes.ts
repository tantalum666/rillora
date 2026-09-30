import type { Router } from "express";
import { Router as createRouter } from "express";
import type { PoolClient } from "pg";
import type { DatabasePool } from "./db.js";
import { withPlannerDatabase } from "./db.js";
import {
  commerceStatusQuerySchema,
  purchaseRouteRequestSchema,
} from "./domain.js";
import { asyncHandler } from "./errors.js";

type SubscriptionRow = {
  public_id: string;
  plan_code: string;
  plan_version: number;
  renewal_provider: string;
  state: string;
  current_period_ends_at: Date | null;
  cancel_at_period_end: boolean;
};

type CapabilityRow = {
  plan_code: string;
  plan_version: number;
  plan_status: string;
  capability_code: string;
  capability_status: string;
  allowance: number | null;
  enforcement_mode: string;
  baseline_trust_control: boolean;
};

type PriceRow = {
  price_code: string;
  plan_code: string;
  plan_version: number;
  amount_minor: string;
  minor_unit_exponent: number;
  currency_code: string;
  billing_interval: string;
  tax_behavior: string;
  status: string;
};

type EntitlementRow = {
  capability_code: string;
  allowance: number | null;
  source: string;
};

type RoutePolicyRow = {
  policy_code: string;
  version: number;
  purchase_route: PurchaseRoute;
  provider_code: string;
  route_enabled: boolean;
  route_status: string;
  sales_enabled: boolean;
  market_status: string;
  storefront_status: string;
  external_offer_allowed: boolean;
};

type PurchaseRoute = "stripe_web_external" | "apple_storekit" | "web_direct" | "none";

const commerceBoundaries = Object.freeze({
  serverAuthoritative: true,
  providerCallbackGrantsAccess: false,
  clientPurchaseResultGrantsAccess: false,
  billingStateCanTriggerClaim: false,
  billingStateCanTriggerDisclosure: false,
  storefrontPersistedToCustomerProfile: false,
  oneActiveRenewalProviderPerHouseholdPlan: true,
});

// Preview and price rows must resolve the same immutable capability version.
const rankedCatalogPlanVersions = `with ranked_plan_versions as (
  select pv.*, row_number() over (
    partition by pv.plan_code
    order by case pv.status when 'active' then 0 else 1 end, pv.version desc
  ) as catalog_rank
  from app.commerce_plan_versions pv
  where pv.plan_code in ('free', 'family') and pv.status in ('active', 'planned')
)`;

export function createCommerceRouter(pool: DatabasePool): Router {
  const router = createRouter();

  router.get(
    "/status",
    asyncHandler(async (request, response) => {
      const query = commerceStatusQuerySchema.parse(request.query);
      const status = await withPlannerDatabase(
        pool,
        request.auth.plannerId,
        async (client) => loadCommerceStatus(client, query.serviceMarketCode),
      );
      response.json(status);
    }),
  );

  router.post(
    "/purchase-route",
    asyncHandler(async (request, response) => {
      const input = purchaseRouteRequestSchema.parse(request.body);
      const route = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const subscription = await getCurrentSubscription(client, input.serviceMarketCode);
        if (subscription) {
          return routeResponse({
            reason: "existing_subscription",
            subscription,
            policy: null,
          });
        }

        const policy = await getRoutePolicy(
          client,
          input.clientSurface,
          input.serviceMarketCode,
          input.appleStorefrontCountryCode ?? null,
        );
        if (!policy) {
          const marketConfigured = await hasConfiguredMarket(client, input.serviceMarketCode);
          return routeResponse({
            reason: marketConfigured ? "storefront_not_eligible" : "service_market_not_configured",
            subscription: null,
            policy: null,
          });
        }

        if (
          !policy.route_enabled
          || !policy.sales_enabled
          || policy.route_status !== "active"
          || policy.market_status !== "active"
          || policy.storefront_status !== "active"
        ) {
          return routeResponse({
            reason: "billing_closed",
            subscription: null,
            policy,
          });
        }

        const providerReady = await hasActiveProviderProduct(
          client,
          input.serviceMarketCode,
          policy.provider_code,
          input.appleStorefrontCountryCode ?? null,
        );
        if (!providerReady) {
          return routeResponse({
            reason: "provider_configuration_missing",
            subscription: null,
            policy,
          });
        }

        return {
          contractVersion: "commerce-v1",
          purchaseRoute: policy.purchase_route,
          reason: "available",
          policy: {
            code: policy.policy_code,
            version: policy.version,
            externalOfferAllowed: policy.external_offer_allowed,
          },
          activeSubscription: null,
          managementDestination: "none",
          requiresFreshEvaluation: true,
          boundaries: commerceBoundaries,
        };
      });
      response.json(route);
    }),
  );

  return router;
}

async function loadCommerceStatus(client: PoolClient, serviceMarketCode?: string) {
  const subscription = await getCurrentSubscription(client, serviceMarketCode);
  const capabilities = await client.query<CapabilityRow>(
      `${rankedCatalogPlanVersions}
       select pv.plan_code, pv.version as plan_version, pv.status as plan_status,
              pc.capability_code, c.status as capability_status,
              pc.allowance, pc.enforcement_mode, c.baseline_trust_control
       from ranked_plan_versions pv
       join app.commerce_plan_capabilities pc on pc.plan_version_id = pv.id
       join app.commerce_capabilities c on c.code = pc.capability_code
       where pv.catalog_rank = 1
       order by pv.plan_code desc, pc.capability_code`,
    );
  const entitlements = await getEffectiveEntitlements(client, serviceMarketCode);
  const prices: { rows: PriceRow[] } = serviceMarketCode
    ? await client.query<PriceRow>(
          `${rankedCatalogPlanVersions}, ranked_prices as (
           select price.price_code, pv.plan_code, pv.version as plan_version,
                  price.amount_minor::text, price.minor_unit_exponent, price.currency_code,
                  price.billing_interval, price.tax_behavior, price.status,
                  row_number() over (
                    partition by pv.plan_code, price.currency_code, price.billing_interval
                    order by case price.status when 'active' then 0 else 1 end, price.id desc
                  ) as price_rank
           from app.commerce_prices price
           join ranked_plan_versions pv on pv.id = price.plan_version_id and pv.catalog_rank = 1
           where price.service_market_code = $1
             and price.status <> 'retired'
             and (price.effective_from is null or price.effective_from <= now())
             and (price.effective_to is null or price.effective_to > now())
           ) select * from ranked_prices where price_rank = 1
           order by billing_interval, currency_code, plan_code`,
          [serviceMarketCode],
        )
    : { rows: [] };
  const market: { rows: Array<{ sales_enabled: boolean; status: string; version: number }> } =
    serviceMarketCode
      ? await client.query<{ sales_enabled: boolean; status: string; version: number }>(
          `select sales_enabled, status, version
           from app.commerce_market_policies
           where service_market_code = $1
           order by version desc
           limit 1`,
          [serviceMarketCode],
        )
      : { rows: [] };

  const planMap = new Map<string, {
    planCode: string;
    planVersion: number;
    status: string;
    capabilities: Array<{
      code: string;
      status: string;
      allowance: number | null;
      enforcementMode: string;
      baselineTrustControl: boolean;
    }>;
  }>();
  for (const row of capabilities.rows) {
    const key = `${row.plan_code}:${row.plan_version}`;
    const plan = planMap.get(key) ?? {
      planCode: row.plan_code,
      planVersion: row.plan_version,
      status: row.plan_status,
      capabilities: [],
    };
    plan.capabilities.push({
      code: row.capability_code,
      status: row.capability_status,
      allowance: row.allowance,
      enforcementMode: row.enforcement_mode,
      baselineTrustControl: row.baseline_trust_control,
    });
    planMap.set(key, plan);
  }

  const marketRow = market.rows[0] ?? null;
  return {
    contractVersion: "commerce-v1",
    billingOpen: marketRow?.sales_enabled === true && marketRow.status === "active",
    serviceMarketCode: serviceMarketCode ?? null,
    marketPolicyVersion: marketRow?.version ?? null,
    currentAccess: {
      planCode: subscription?.plan_code ?? "free",
      planVersion: subscription?.plan_version ?? 1,
      subscription: subscription ? mapSubscription(subscription) : null,
      managementDestination: subscription
        ? managementDestination(subscription.renewal_provider)
        : "none",
    },
    entitlements: entitlements.map((row) => ({
      code: row.capability_code,
      allowance: row.allowance,
      source: row.source,
    })),
    plans: [...planMap.values()],
    offers: prices.rows.map((row) => ({
      priceCode: row.price_code,
      planCode: row.plan_code,
      planVersion: row.plan_version,
      amountMinor: safeMinorAmount(row.amount_minor),
      minorUnitExponent: row.minor_unit_exponent,
      currencyCode: row.currency_code,
      billingInterval: row.billing_interval,
      taxBehavior: row.tax_behavior,
      status: row.status,
      purchasable: row.status === "active" && marketRow?.sales_enabled === true
        && marketRow.status === "active",
    })),
    boundaries: commerceBoundaries,
  };
}

async function getCurrentSubscription(
  client: PoolClient,
  serviceMarketCode?: string,
): Promise<SubscriptionRow | null> {
  const result = await client.query<SubscriptionRow>(
    `select subscription.public_id, subscription.plan_code,
            plan_version.version as plan_version,
            subscription.renewal_provider, subscription.state,
            subscription.current_period_ends_at,
            subscription.cancel_at_period_end
     from app.commerce_subscriptions subscription
     join app.commerce_plan_versions plan_version on plan_version.id = subscription.plan_version_id
     join app.commerce_accounts account
       on account.id = subscription.commerce_account_id
      and account.planner_id = subscription.planner_id
     where subscription.planner_id = app.current_planner_id()
       and ($1::text is null or account.service_market_code = $1)
       and subscription.provider_environment <> 'test'
       and subscription.state in ('previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due')
     order by subscription.created_at desc, subscription.id desc
     limit 1`,
    [serviceMarketCode ?? null],
  );
  return result.rows[0] ?? null;
}

async function getEffectiveEntitlements(
  client: PoolClient,
  serviceMarketCode?: string,
): Promise<EntitlementRow[]> {
  const result = await client.query<EntitlementRow>(
    `with entitlement_candidates as (
       select pc.capability_code, pc.allowance, 'free_baseline'::text as source,
              10 as priority, '-infinity'::timestamptz as effective_at
       from app.commerce_plan_versions pv
       join app.commerce_plan_capabilities pc on pc.plan_version_id = pv.id
       join app.commerce_capabilities c on c.code = pc.capability_code
       where pv.id = (
           select current_free.id
           from app.commerce_plan_versions current_free
           where current_free.plan_code = 'free' and current_free.status = 'active'
           order by current_free.version desc
           limit 1
         )
         and pv.status = 'active' and c.status = 'active'
         and pc.enforcement_mode = 'included'
       union all
       select entitlement.capability_code, entitlement.allowance,
              entitlement.source_type as source,
              case entitlement.source_type
                when 'manual_override' then 40
                when 'migration' then 30
                else 20
              end as priority,
              entitlement.effective_at
       from app.commerce_entitlement_grants entitlement
       join app.commerce_accounts account
         on account.id = entitlement.commerce_account_id
        and account.planner_id = entitlement.planner_id
       left join app.commerce_subscriptions subscription
         on subscription.id = entitlement.subscription_id
        and subscription.planner_id = entitlement.planner_id
        and subscription.commerce_account_id = entitlement.commerce_account_id
       where entitlement.planner_id = app.current_planner_id()
         and ($1::text is null or account.service_market_code = $1)
         and entitlement.effective_at <= now()
         and (entitlement.expires_at is null or entitlement.expires_at > now())
         and entitlement.revoked_at is null
         and (
           entitlement.source_type <> 'subscription'
           or subscription.state in ('previewing', 'active', 'cancel_at_period_end', 'grace')
         )
     )
     select distinct on (capability_code) capability_code, allowance, source
     from entitlement_candidates
     order by capability_code, priority desc, effective_at desc`,
    [serviceMarketCode ?? null],
  );
  return result.rows;
}

async function getRoutePolicy(
  client: PoolClient,
  clientSurface: "web" | "ios",
  serviceMarketCode: string,
  appleStorefrontCountryCode: string | null,
): Promise<RoutePolicyRow | null> {
  const result = await client.query<RoutePolicyRow>(
    `select route.policy_code, route.version, route.purchase_route,
            route.provider_code, route.enabled as route_enabled,
            route.status as route_status, market.sales_enabled,
            market.status as market_status, storefront.status as storefront_status,
            storefront.external_offer_allowed
     from app.commerce_purchase_route_policies route
     join app.commerce_market_policies market on market.id = route.market_policy_id
     join app.commerce_storefront_policies storefront on storefront.id = route.storefront_policy_id
     where market.service_market_code = $1
       and storefront.client_surface = $2
       and (
         ($2 = 'web' and storefront.apple_storefront_country_code is null)
         or ($2 = 'ios' and storefront.apple_storefront_country_code = $3)
       )
       and (route.effective_from is null or route.effective_from <= now())
       and (route.effective_to is null or route.effective_to > now())
     order by route.version desc
     limit 1`,
    [serviceMarketCode, clientSurface, appleStorefrontCountryCode],
  );
  return result.rows[0] ?? null;
}

async function hasConfiguredMarket(client: PoolClient, serviceMarketCode: string): Promise<boolean> {
  const result = await client.query<{ configured: boolean }>(
    `select exists(
       select 1 from app.commerce_market_policies where service_market_code = $1
     ) as configured`,
    [serviceMarketCode],
  );
  return result.rows[0]?.configured === true;
}

async function hasActiveProviderProduct(
  client: PoolClient,
  serviceMarketCode: string,
  providerCode: string,
  appleStorefrontCountryCode: string | null,
): Promise<boolean> {
  const result = await client.query<{ configured: boolean }>(
    `select exists(
       select 1
       from app.commerce_storefront_products product
       join app.commerce_prices price on price.id = product.price_id
       where price.service_market_code = $1
         and price.status = 'active'
         and product.provider_code = $2
         and product.status = 'active'
         and (
           product.storefront_country_code is null
           or product.storefront_country_code = $3
         )
         and (product.effective_from is null or product.effective_from <= now())
         and (product.effective_to is null or product.effective_to > now())
     ) as configured`,
    [serviceMarketCode, providerCode, appleStorefrontCountryCode],
  );
  return result.rows[0]?.configured === true;
}

function routeResponse(input: {
  reason: "existing_subscription" | "storefront_not_eligible" | "service_market_not_configured" | "billing_closed" | "provider_configuration_missing";
  subscription: SubscriptionRow | null;
  policy: RoutePolicyRow | null;
}) {
  return {
    contractVersion: "commerce-v1",
    purchaseRoute: "none" as const,
    reason: input.reason,
    policy: input.policy
      ? {
          code: input.policy.policy_code,
          version: input.policy.version,
          externalOfferAllowed: false,
        }
      : null,
    activeSubscription: input.subscription ? mapSubscription(input.subscription) : null,
    managementDestination: input.subscription
      ? managementDestination(input.subscription.renewal_provider)
      : "none",
    requiresFreshEvaluation: true,
    boundaries: commerceBoundaries,
  };
}

function mapSubscription(row: SubscriptionRow) {
  return {
    publicId: row.public_id,
    planCode: row.plan_code,
    planVersion: row.plan_version,
    renewalProvider: row.renewal_provider,
    state: row.state,
    currentPeriodEndsAt: row.current_period_ends_at?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

function managementDestination(provider: string): "rillora_billing_portal" | "app_store_subscriptions" | "provider_support" {
  if (["stripe", "paddle", "wechat", "alipay", "unionpay", "local_web"].includes(provider)) {
    return "rillora_billing_portal";
  }
  if (provider === "storekit") return "app_store_subscriptions";
  return "provider_support";
}

function safeMinorAmount(value: string): number {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Commerce price amount is outside the supported JSON integer range");
  }
  return amount;
}
