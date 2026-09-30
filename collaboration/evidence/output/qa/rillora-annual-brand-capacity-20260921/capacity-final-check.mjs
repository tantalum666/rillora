import pg from 'pg';
import {loadDatabaseConfig} from './dist/config.js';
import {databaseConnectionOptions} from './dist/db.js';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));
await c.connect();
try {
 const users=(await c.query('select count(*)::int n from app.identity_accounts where issuer=$1 and subject like $2',['https://synthetic-qa.rillora.invalid/','capacity-20260921-b8954943-%'])).rows[0].n;
 const migration=(await c.query('select name,checksum from app.schema_migrations where name=$1',['0063_retire_new_monthly_offers.sql'])).rows;
 const prices=(await c.query("select price_code,status,amount_minor::text from app.commerce_prices where price_code like 'family_usd_%' order by price_code")).rows;
 const sales=(await c.query('select bool_or(sales_enabled) enabled from app.commerce_market_policies')).rows[0].enabled;
 if(users!==0||migration.length!==1||sales!==false)throw Error('Final invariant failed');
 console.log(JSON.stringify({remainingSyntheticUsers:users,migration,prices,salesEnabled:sales}));
} finally { await c.end(); }
