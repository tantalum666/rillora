import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import pg, {type PoolClient} from 'pg';
import {loadDatabaseConfig} from './config.js';
import {databaseConnectionOptions} from './db.js';

type Client = Pick<PoolClient, 'query'>;
export type WebBillingOperation = 'inspect' | 'activate' | 'close-new-sales';
const requireFact = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
const currentPrice = 'family_usd_annual_v4';
const currentRoute = 'global_us_web_stripe_v1';

async function readCatalog(client: Client) {
  const one = async (sql: string, values: unknown[] = []) => {
    const result = await client.query(sql, values);
    requireFact(result.rows.length === 1, 'Expected exactly one current catalog row');
    return result.rows[0];
  };
  const price = await one(`select id,price_code,plan_version_id,operator_code,service_market_code,amount_minor,
    currency_code,billing_interval,tax_behavior,status,purchase_channel,minor_unit_exponent,effective_from,effective_to
    from app.commerce_prices where price_code=$1`, [currentPrice]);
  requireFact(price.amount_minor === '8899' && price.currency_code === 'USD' && price.billing_interval === 'annual'
    && price.purchase_channel === 'web' && price.minor_unit_exponent === 2, 'Current immutable price changed');
  const plan = await one('select id,plan_code,version,status,effective_from,effective_to from app.commerce_plan_versions where id=$1', [price.plan_version_id]);
  requireFact(plan.plan_code === 'family' && plan.version === 2, 'Current Family capabilities changed');
  const route = await one(`select id,policy_code,version,market_policy_id,storefront_policy_id,provider_code,purchase_route,
    enabled,status,effective_from,effective_to from app.commerce_purchase_route_policies where policy_code=$1 and version=1`, [currentRoute]);
  const market = await one(`select id,service_market_code,operating_plane_code,operator_code,sales_enabled,status,effective_from,effective_to
    from app.commerce_market_policies where id=$1`, [route.market_policy_id]);
  const storefront = await one(`select id,client_surface,planned_route,status,effective_from,effective_to
    from app.commerce_storefront_policies where id=$1`, [route.storefront_policy_id]);
  const operator = await one('select code,operating_plane_code,party_type,status,effective_from,effective_to from app.commerce_operators where code=$1', [price.operator_code]);
  const plane = await one('select code,data_region_code,status from app.commerce_operating_planes where code=$1', [operator.operating_plane_code]);
  const binding = await one(`select id,provider_account_reference,external_product_reference,external_parent_product_reference,
    status,effective_from,effective_to from app.commerce_storefront_products where price_id=$1
    and provider_code='stripe' and provider_environment='production' and status<>'retired'`, [price.id]);
  requireFact(market.service_market_code === 'GLOBAL_US' && price.service_market_code === market.service_market_code
    && market.operator_code === operator.code && market.operating_plane_code === 'global' && plane.code === 'global'
    && route.provider_code === 'stripe' && route.purchase_route === 'web_direct'
    && storefront.client_surface === 'web' && storefront.planned_route === 'web_direct'
    && binding.provider_account_reference === 'acct_1U6B2RCxTlowhyiG'
    && /^price_/.test(binding.external_product_reference) && /^prod_/.test(binding.external_parent_product_reference), 'Wrong channel, operator or provider binding');
  const capabilities = (await client.query(`select plan_version_id,capability_code,allowance,enforcement_mode from app.commerce_plan_capabilities where plan_version_id=$1
    and capability_code in ('trusted_people_multiple','family_maintenance') order by capability_code`, [plan.id])).rows;
  requireFact(capabilities.length === 2 && capabilities.some(c => c.capability_code === 'trusted_people_multiple' && c.allowance === 5)
    && capabilities.some(c => c.capability_code === 'family_maintenance' && (c.allowance === null || c.allowance > 0)), 'Family allowance changed');
  const runtime = await one('select production_entitlements_enabled,sharing_limits_enabled from app.commerce_runtime_policy where singleton');
  const data = {price, plan, route, market, storefront, operator, plane, binding, capabilities, runtime};
  return {data, sha256: createHash('sha256').update(JSON.stringify(data)).digest('hex')};
}

/** Fixed policy rows only. Never creates orders, touches customers or revokes existing access. */
export async function configureProductionWebBilling(client: Client, operation: WebBillingOperation, expected?: string) {
  requireFact(['inspect', 'activate', 'close-new-sales'].includes(operation), 'Unknown billing operation');
  if (operation !== 'inspect') requireFact(typeof expected === 'string' && /^[a-f0-9]{64}$/.test(expected), 'A freshly inspected catalog fingerprint is required');
  await client.query(operation === 'inspect' ? 'begin isolation level repeatable read read only' : 'begin isolation level serializable');
  try {
    await client.query("set local statement_timeout='15s'");
    if (operation !== 'inspect') await client.query("select pg_advisory_xact_lock(hashtextextended('rillora-web-sales-activation',0))");
    const before = await readCatalog(client);
    if (operation !== 'inspect') requireFact(before.sha256 === expected, 'Catalog changed after inspection');
    const d = before.data;
    if (operation === 'activate') {
      for (const row of [d.price,d.plan,d.route,d.market,d.storefront,d.operator,d.plane,d.binding]) {
        requireFact(row.status !== 'retired', 'Retired policy cannot be reactivated');
        requireFact((row.effective_from === null || row.effective_from === undefined || new Date(row.effective_from).getTime() <= Date.now())
          && (row.effective_to === null || row.effective_to === undefined || new Date(row.effective_to).getTime() > Date.now()), 'Catalog outside effective window');
      }
      await client.query("update app.commerce_operating_planes set status='active' where code=$1", [d.plane.code]);
      await client.query("update app.commerce_operators set status='active' where code=$1", [d.operator.code]);
      await client.query("update app.commerce_plan_versions set status='active' where id=$1", [d.plan.id]);
      await client.query(`update app.commerce_plan_capabilities set enforcement_mode='included' where plan_version_id=$1
        and capability_code in ('trusted_people_multiple','family_maintenance')`, [d.plan.id]);
      await client.query("update app.commerce_prices set status='active',tax_behavior='provider_determined' where id=$1", [d.price.id]);
      await client.query("update app.commerce_storefront_products set status='active' where id=$1", [d.binding.id]);
      await client.query("update app.commerce_storefront_policies set status='active' where id=$1", [d.storefront.id]);
      await client.query("update app.commerce_runtime_policy set production_entitlements_enabled=true,sharing_limits_enabled=true where singleton");
      await client.query("update app.commerce_purchase_route_policies set enabled=true,status='active' where id=$1", [d.route.id]);
      await client.query("update app.commerce_market_policies set sales_enabled=true,status='active' where id=$1", [d.market.id]);
    } else if (operation === 'close-new-sales') {
      await client.query('update app.commerce_market_policies set sales_enabled=false where id=$1', [d.market.id]);
      await client.query('update app.commerce_purchase_route_policies set enabled=false where id=$1', [d.route.id]);
    }
    const after = operation === 'inspect' ? before : await readCatalog(client);
    await client.query('commit');
    return {operation, before, after, userRecordsModified: false, pricesChanged: false,
      historicalAccessRevoked: false, taxExemptionClaimed: false};
  } catch (error) { await client.query('rollback'); throw error; }
}

async function main() {
  const config = loadDatabaseConfig();
  requireFact(process.env.CONTENT_KEY_NAMESPACE === 'rillora-production' && process.env.RECOVERY_ENVIRONMENT === 'production'
    && config.sslMode === 'verify-full' && config.host?.endsWith('.eu-central-1.rds.amazonaws.com')
    && !config.connectionString && config.database === 'rillora', 'Only the stack-selected protected production database is allowed');
  const operation = process.argv[2] as WebBillingOperation;
  const client = new pg.Client({...databaseConnectionOptions(config), application_name:'rillora-web-sales-configuration'});
  await client.connect();
  try {
    requireFact((await client.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl === true, 'Verified TLS is required');
    requireFact((await client.query("select exists(select 1 from app.schema_migrations where name='0103_isolated_identity_deletion.sql') as ready")).rows[0]?.ready, 'Protected production schema is required');
    console.log(JSON.stringify(await configureProductionWebBilling(client, operation, process.env.RILLORA_BILLING_EXPECTED_SNAPSHOT)));
  } finally { await client.end(); }
}
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error(JSON.stringify({billingConfigurationFailed:true, privateValuesSuppressed:true})); process.exitCode=1; });
}
