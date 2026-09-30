import pg from 'pg';
import { loadDatabaseConfig } from './dist/config.js';
import { databaseConnectionOptions } from './dist/db.js';
const client = new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));
const changes = [{"name": "0061_owner_selected_88_80_prices.sql", "sql": "-- Owner selected US$88.80/year and US$9.99/month on September19.\n-- Price version3 retains Family capability version2. Do not rewrite prices,\n-- provider bindings, receipts or subscriptions from previous test offers.\ninsert into app.commerce_prices (\n  price_code, plan_version_id, operator_code, service_market_code,\n  amount_minor, currency_code, billing_interval, tax_behavior, status\n)\nselect quote.code, plan.id, 'global_operator_pending', 'GLOBAL_US',\n       quote.amount_minor, 'USD', quote.billing_interval,\n       'not_configured', 'disabled_hypothesis'\nfrom app.commerce_plan_versions plan\ncross join (values\n  ('family_usd_monthly_v3', 999::bigint, 'monthly'),\n  ('family_usd_annual_v3', 8880::bigint, 'annual')\n) as quote(code, amount_minor, billing_interval)\nwhere plan.plan_code = 'family' and plan.version = 2;\n", "checksum": "38679cbeb1a6de494dd287868a16b4981a3ba458a0443befa88f09e4e1bfe579"}, {"name": "0062_current_stripe_v3_test_prices.sql", "sql": "-- Exact prices created/read back in the isolated Rillora TEST account.\n-- They are not live products and do not open a market, route or real sale.\ninsert into app.commerce_storefront_products (\n  price_id, provider_code, provider_environment, external_product_reference,\n  external_parent_product_reference, provider_account_reference, status, effective_from\n)\nselect price.id, 'stripe', 'test', binding.external_id,\n       'prod_V6O8lAFbTCDmKd', 'acct_1U6B2RCxTlowhyiG', 'test_only', now()\nfrom app.commerce_prices price\njoin (values\n  ('family_usd_annual_v3', 'price_1UHMkTCxTlowhyiGu3do5wps'),\n  ('family_usd_monthly_v3', 'price_1UHMlhCxTlowhyiGvBEPdb4x')\n) binding(code, external_id) on binding.code = price.price_code;\n", "checksum": "87c33cdeed33e2d5fb0cebf4c9ffd1b036a84d9a9de59a9a118f21515fe15965"}];
await client.connect();
try {
 await client.query('begin');
 await client.query("select pg_advisory_xact_lock(hashtext('continuity_schema_migrations'))");
 const previous = await client.query('select checksum from app.schema_migrations where name=$1',["0060_session_email_verification.sql"]);
 if(previous.rows[0]?.checksum !== "518f1463a420a6f5275392ba6330632b4398d3346556d9850c531758bf4d6f2c") throw new Error('Unexpected migration baseline');
 for (const change of changes) {
  const existing = await client.query('select checksum from app.schema_migrations where name=$1',[change.name]);
  if (existing.rows[0]) {if(existing.rows[0].checksum!==change.checksum) throw new Error('Migration checksum mismatch');continue;}
  await client.query(change.sql);
  await client.query('insert into app.schema_migrations(name,checksum) values($1,$2)',[change.name,change.checksum]);
 }
 const prices = await client.query("select price_code, amount_minor::text, status from app.commerce_prices where price_code like 'family_usd_%' order by price_code");
 const bindings = await client.query("select p.price_code,s.provider_environment,s.external_product_reference from app.commerce_storefront_products s join app.commerce_prices p on p.id=s.price_id where p.price_code in ('family_usd_annual_v3','family_usd_monthly_v3')");
 const market = await client.query("select bool_or(sales_enabled) as any_sales from app.commerce_market_policies");
 if(market.rows[0].any_sales !== false) throw new Error('Sales boundary changed');
 await client.query('commit');
 console.log(JSON.stringify({committed:true,prices:prices.rows,bindings:bindings.rows,salesEnabled:false,applied:changes.map(x=>({name:x.name,checksum:x.checksum}))}));
} catch(error) { await client.query('rollback'); console.error('Price migration failed; no sensitive output');process.exitCode=1; }
finally {await client.end();}
