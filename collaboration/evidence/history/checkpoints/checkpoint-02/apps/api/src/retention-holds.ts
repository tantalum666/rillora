import {z} from 'zod';
import type {DatabasePool} from './db.js';
import {publishRecoveryTransaction} from './recovery-journal.js';

const schema=z.object({category:z.enum(['product_event','audit_event','legal_acceptance','closed_payment','deletion_receipt']),
 recordId:z.uuid(),reason:z.enum(['legal_requirement','unresolved_dispute','security_incident']),active:z.boolean()}).strict();
export async function setRetentionHold(pool:DatabasePool,input:unknown):Promise<void>{
 const hold=schema.parse(input),client=await pool.connect();
 try{
  await client.query('begin');
  if(!(await client.query("select pg_has_role(session_user,'continuity_recovery_service','member') as allowed")).rows[0]?.allowed)
   throw Error('Administrative retention operation required');
  const lookup={product_event:'select 1 from app.product_events where public_id=$1',audit_event:'select 1 from app.audit_events where public_id=$1',
   legal_acceptance:'select 1 from app.legal_acceptances where public_id=$1',closed_payment:'select 1 from app.closed_account_payment_records where deletion_public_id=$1',
   deletion_receipt:'select 1 from app.account_deletions where public_id=$1'}[hold.category];
  if(!(await client.query(lookup,[hold.recordId])).rowCount)throw Error('Retention record is unavailable');
  if(hold.active)await client.query(`insert into app.retention_holds(category,record_id,reason_code) values($1,$2,$3)
   on conflict(category,record_id,reason_code) do update set released_at=null`,[hold.category,hold.recordId,hold.reason]);
  else if(!(await client.query(`update app.retention_holds set released_at=coalesce(released_at,now())
   where category=$1 and record_id=$2 and reason_code=$3 returning public_id`,[hold.category,hold.recordId,hold.reason])).rowCount)throw Error('Retention hold is unavailable');
  await publishRecoveryTransaction(pool,client);
  await client.query('commit');
 }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}
