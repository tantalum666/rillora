import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg, { type PoolClient } from 'pg';
import { loadDatabaseConfig } from './config.js';
import { databaseConnectionOptions } from './db.js';

type Client = Pick<PoolClient, 'query'>;
type Operation = 'inspect' | 'prepare' | 'renew-review' | 'enroll-review';
const requireFact = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const offers = [
  { country: 'USA', currency: 'USD', minor: '11999' },
  { country: 'HKG', currency: 'HKD', minor: '88800' },
] as const;
const policy = '20261013';

async function readCatalog(client: Client) {
  const read = async (sql: string) => (await client.query(sql)).rows;
  const data = {
    prices: await read('select * from app.commerce_prices order by price_code'),
    plans: await read('select * from app.commerce_plan_versions order by id'),
    capabilities: await read('select * from app.commerce_plan_capabilities order by plan_version_id,capability_code'),
    bindings: await read('select * from app.commerce_apple_price_bindings order by binding_code'),
    products: await read('select * from app.commerce_storefront_products order by id'),
    storefronts: await read('select * from app.commerce_storefront_policies order by id'),
    routes: await read('select * from app.commerce_purchase_route_policies order by id'),
    markets: await read('select * from app.commerce_market_policies order by id'),
    runtime: await read('select * from app.commerce_runtime_policy'),
    // Existing, deliberately enrolled QA accounts only. Do not emit names, email or subjects.
    review: await read(`select v.planner_id::text,v.expires_at,p.status,
      encode(sha256(convert_to(i.issuer||chr(31)||i.subject,'UTF8')),'hex') as identity_digest
      from app.commerce_validation_accounts v join app.planners p on p.id=v.planner_id
      join app.identity_accounts i on i.planner_id=p.id order by v.planner_id,identity_digest`),
  };
  requireFact(Object.values(data).every(rows => rows.length <= 500), 'Catalog exceeds the reviewed bound');
  return { data, sha256: createHash('sha256').update(JSON.stringify(data)).digest('hex') };
}

/** Add separate production policy rows; never rewrite Sandbox history or enable a market. */
export async function configureProductionApple(client: Client, operation: Operation,
  options: { expected?: string | undefined; reviewDigests?: string[] | undefined; reviewExpiresAt?: string | undefined } = {}) {
  requireFact(['inspect', 'prepare', 'renew-review', 'enroll-review'].includes(operation), 'Unknown Apple configuration operation');
  if (operation !== 'inspect') requireFact(/^[a-f0-9]{64}$/.test(options.expected ?? ''), 'Fresh catalog fingerprint required');
  await client.query(operation === 'inspect' ? 'begin isolation level repeatable read read only' : 'begin isolation level serializable');
  try {
    await client.query("set local statement_timeout='15s'");
    if (operation !== 'inspect') await client.query("select pg_advisory_xact_lock(hashtextextended('rillora-apple-release-configuration',0))");
    const before = await readCatalog(client), d = before.data;
    if (operation !== 'inspect') requireFact(before.sha256 === options.expected, 'Catalog changed after inspection');
    if (operation === 'prepare') {
      const web = d.prices.find(p => p.price_code === 'family_usd_annual_v4');
      requireFact(web?.amount_minor === '8899' && web.currency_code === 'USD' && web.service_market_code === 'GLOBAL_US'
        && web.purchase_channel === 'web', 'Original Web price and market must be retained');
      const plan = d.plans.find(p => p.id === web.plan_version_id);
      requireFact(plan?.plan_code === 'family' && plan.version === 2 && plan.status === 'active', 'Existing Family plan is required');
      const market = d.markets.find(m => m.policy_code === 'global_us_market_v1' && m.version === 1);
      requireFact(market?.operator_code === web.operator_code && market.operating_plane_code === 'global', 'Existing global operator required');
      for (const offer of offers) {
        const country = offer.country.toLowerCase(), currency = offer.currency.toLowerCase();
        const priceCode = `family_apple_${currency}_${offer.minor}_${policy}`;
        const bindingCode = `apple_production_${country}_${offer.minor}_${policy}`;
        const storefrontCode = `global_ios_${country}_storekit_${policy}`;
        const routeCode = `global_us_ios_${country}_storekit_${policy}`;
        // Require the already verified provider price, never derive a new amount from FX or an old SKU.
        const reviewBinding = d.bindings.filter(b => b.provider_environment === 'sandbox' && b.status === 'active'
          && b.storefront_country_code === offer.country && b.product_reference === 'com.rillora.family.annual');
        requireFact(reviewBinding.length === 1, 'Exactly one verified Sandbox price is required');
        const reference = d.prices.find(p => p.id === reviewBinding[0].price_id);
        requireFact(reference?.amount_minor === offer.minor && reference.currency_code === offer.currency
          && reference.minor_unit_exponent === 2 && reference.billing_interval === 'annual'
          && reference.plan_version_id === web.plan_version_id, 'Provider price must match the approved current annual amount');
        requireFact(!d.bindings.some(b => b.provider_environment === 'production' && b.status === 'active'
          && b.storefront_country_code === offer.country && b.binding_code !== bindingCode), 'Unexpected production binding already exists');
        await client.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,
          amount_minor,minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel,effective_from)
          values($1,$2,$3,'GLOBAL_US',$4,2,$5,'annual','provider_determined','active','apple_app_store',now())
          on conflict(price_code) do nothing`, [priceCode, web.plan_version_id, web.operator_code, offer.minor, offer.currency]);
        const price = (await client.query('select * from app.commerce_prices where price_code=$1', [priceCode])).rows[0];
        requireFact(price?.amount_minor === offer.minor && price.currency_code === offer.currency && price.status === 'active'
          && price.plan_version_id === web.plan_version_id && price.operator_code === web.operator_code
          && price.purchase_channel === 'apple_app_store' && price.service_market_code === 'GLOBAL_US'
          && price.billing_interval === 'annual' && price.minor_unit_exponent === 2 && price.tax_behavior === 'provider_determined'
          && price.effective_to === null, 'Conflicting prepared price');
        await client.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,
          storefront_country_code,effective_from,status,provider_environment)
          values($1,$2,'com.rillora.family.annual',$3,now(),'active','production') on conflict(binding_code) do nothing`,
          [bindingCode, price.id, offer.country]);
        await client.query(`insert into app.commerce_storefront_policies(policy_code,version,client_surface,
          apple_storefront_country_code,planned_route,external_offer_allowed,status,effective_from)
          values($1,1,'ios',$2,'apple_storekit',false,'active',now()) on conflict(policy_code,version) do nothing`,
          [storefrontCode, offer.country]);
        const storefront = (await client.query('select * from app.commerce_storefront_policies where policy_code=$1 and version=1', [storefrontCode])).rows[0];
        requireFact(storefront?.client_surface === 'ios' && storefront.apple_storefront_country_code === offer.country
          && storefront.planned_route === 'apple_storekit' && !storefront.external_offer_allowed
          && storefront.status === 'active' && storefront.effective_to === null, 'Conflicting prepared storefront');
        await client.query(`insert into app.commerce_purchase_route_policies(policy_code,version,market_policy_id,
          storefront_policy_id,purchase_route,provider_code,enabled,status,effective_from)
          values($1,1,$2,$3,'apple_storekit','storekit',true,'active',now()) on conflict(policy_code,version) do nothing`,
          [routeCode, market.id, storefront.id]);
        const bindings = (await client.query('select * from app.commerce_apple_price_bindings where binding_code=$1', [bindingCode])).rows;
        requireFact(bindings.length === 1 && bindings[0].price_id === price.id && bindings[0].provider_environment === 'production'
          && bindings[0].product_reference === 'com.rillora.family.annual' && bindings[0].storefront_country_code === offer.country
          && bindings[0].status === 'active' && bindings[0].effective_to === null, 'Conflicting prepared binding');
        const routes = (await client.query('select * from app.commerce_purchase_route_policies where policy_code=$1 and version=1', [routeCode])).rows;
        requireFact(routes.length === 1 && routes[0].market_policy_id === market.id && routes[0].storefront_policy_id === storefront.id
          && routes[0].provider_code === 'storekit' && routes[0].purchase_route === 'apple_storekit'
          && routes[0].enabled === true && routes[0].status === 'active' && routes[0].effective_to === null, 'Conflicting prepared route');
      }
      // One merchandising SKU serves versioned storefront price bindings. It is
      // separate from the historical Sandbox SKU and does not price transactions.
      const usaPrice = (await client.query('select id from app.commerce_prices where price_code=$1', [`family_apple_usd_11999_${policy}`])).rows[0];
      await client.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,
        external_product_reference,external_parent_product_reference,provider_account_reference,status,effective_from)
        values($1,'storekit','production','com.rillora.family.annual','22325627','com.rillora.ios','active',now())
        on conflict(provider_code,provider_environment,external_product_reference) do nothing`, [usaPrice.id]);
      const products = (await client.query(`select * from app.commerce_storefront_products where provider_code='storekit'
        and provider_environment='production' and external_product_reference='com.rillora.family.annual'`)).rows;
      requireFact(products.length === 1 && products[0].price_id === usaPrice.id && products[0].status === 'active'
        && products[0].storefront_country_code === null && products[0].external_parent_product_reference === '22325627'
        && products[0].provider_account_reference === 'com.rillora.ios' && products[0].effective_to === null, 'Conflicting prepared product');
    } else if (operation === 'renew-review' || operation === 'enroll-review') {
      const digests = options.reviewDigests ?? [], expiry = Date.parse(options.reviewExpiresAt ?? '');
      requireFact(digests.length > 0 && digests.length <= 3 && new Set(digests).size === digests.length
        && digests.every(value => /^[a-f0-9]{64}$/.test(value)), 'Exact original review identity digests required');
      requireFact(Number.isFinite(expiry) && expiry > Date.now() && expiry <= Date.now() + 31 * 86400_000, 'Review expiry must be within 31 days');
      for (const digest of digests) {
        const accounts = operation === 'renew-review'
          ? d.review.filter(r => r.identity_digest === digest && r.status === 'active')
          : (await client.query(`select p.id::text as planner_id from app.planners p join app.identity_accounts i on i.planner_id=p.id
            where p.status='active' and encode(sha256(convert_to(i.issuer||chr(31)||i.subject,'UTF8')),'hex')=$1`, [digest])).rows;
        requireFact(accounts.length === 1, 'Only an existing active review identity can be configured');
        const id = accounts[0].planner_id;
        const live = await client.query(`select exists(select 1 from app.commerce_orders where planner_id=$1 and provider_environment='production')
          or exists(select 1 from app.commerce_subscriptions where planner_id=$1 and provider_environment='production') as present`, [id]);
        requireFact(!live.rows[0]?.present, 'Real customer accounts cannot become review accounts');
        if (operation === 'renew-review') {
          await client.query('update app.commerce_validation_accounts set expires_at=$2 where planner_id=$1', [id, options.reviewExpiresAt]);
        } else {
          // The fixed maintenance broker requires this digest and deadline to be
          // inside the stack's deployed review scope before it can run this command.
          await client.query(`insert into app.commerce_validation_accounts(planner_id,expires_at,reason)
            values($1,$2,'Apple release review; exact deployed identity scope')
            on conflict(planner_id) do update set expires_at=excluded.expires_at`, [id, options.reviewExpiresAt]);
        }
      }
    }
    const after = operation === 'inspect' ? before : await readCatalog(client);
    // Shared sale controls, Web prices and historical catalog rows stay byte-for-byte intact.
    for (const key of ['markets', 'runtime', 'plans', 'capabilities'] as const) requireFact(JSON.stringify(after.data[key]) === JSON.stringify(d[key]), 'Shared commercial policy changed');
    if (operation === 'prepare') {
      for (const key of ['prices', 'bindings', 'products', 'storefronts', 'routes'] as const) {
        requireFact(d[key].every(row => after.data[key].some(next => JSON.stringify(next) === JSON.stringify(row))), 'Historical catalog row changed');
      }
    }
    await client.query('commit');
    return { operation, before, after, marketSalesChanged: false, userContentChanged: false, historicalPaymentsChanged: false };
  } catch (error) { await client.query('rollback'); throw error; }
}

async function main() {
  const db = loadDatabaseConfig();
  requireFact(process.env.CONTENT_KEY_NAMESPACE === 'rillora-production' && process.env.RECOVERY_ENVIRONMENT === 'production'
    && db.sslMode === 'verify-full' && db.host?.endsWith('.eu-central-1.rds.amazonaws.com')
    && !db.connectionString && db.database === 'rillora', 'Only the stack-selected protected production database is allowed');
  const client = new pg.Client({ ...databaseConnectionOptions(db), application_name: 'rillora-apple-release-configuration' });
  await client.connect();
  try {
    requireFact((await client.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl === true, 'Verified TLS required');
    requireFact((await client.query("select exists(select 1 from app.schema_migrations where name='0103_isolated_identity_deletion.sql') as ready")).rows[0]?.ready, 'Protected schema required');
    console.log(JSON.stringify(await configureProductionApple(client, process.argv[2] as Operation, {
      expected: process.env.RILLORA_APPLE_EXPECTED_SNAPSHOT, reviewDigests: process.env.APPLE_REVIEW_IDENTITY_SHA256?.split(','),
      reviewExpiresAt: process.env.APPLE_REVIEW_EXPIRES_AT,
    })));
  } finally { await client.end(); }
}
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error(JSON.stringify({ appleConfigurationFailed: true, privateValuesSuppressed: true })); process.exitCode = 1; });
}
