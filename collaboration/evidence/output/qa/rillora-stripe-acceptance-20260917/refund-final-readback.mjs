import pg from 'pg';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();
const events=(await c.query(`select received_at,processed_at,event_type,signal_type,processing_status,last_error_code,attempt_count,provider_event_reference,provider_refund_reference,provider_transaction_reference,provider_subscription_reference from app.commerce_provider_event_inbox where provider_code='stripe' and provider_environment='test' and received_at>now()-interval '1 hour' and (provider_customer_reference='cus_VH1kABBrn3o59A' or signal_type='refund_changed') order by id desc limit 20`)).rows;
console.log(JSON.stringify({events}));await c.end();
