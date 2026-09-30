import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { ApiError } from './errors.js';

const eventSchema=z.object({key:z.string().min(1).max(100),kind:z.enum(['account','connection','matter','person','free_slot','unreconciled_access']),
 id:z.uuid(),revision:z.string().regex(/^[1-9][0-9]{0,18}$/),recordedAt:z.string(),facts:z.record(z.string(),z.unknown())}).strict()
 .refine(e=>e.key===`${e.kind}:${e.id}`,'Invalid journal key');
export type RecoveryControl=z.infer<typeof eventSchema>;
export interface RecoveryJournalPublisher {publish(event:RecoveryControl):Promise<void>;checkCoverage?(generation:string):Promise<void>}
const publishers=new WeakMap<Pool,RecoveryJournalPublisher>();

export function configureRecoveryPool(pool:Pool,publisher:RecoveryJournalPublisher):void{publishers.set(pool,publisher);}
const deleted=z.object({deleted:z.literal(true)}).strict();
const factsByKind={
 account:z.union([deleted,z.object({status:z.enum(['active','locked','deletion_pending','closed'])}).strict()]),
 connection:z.union([deleted,z.object({status:z.enum(['pending','accepted','revoked']),recipient:z.uuid().nullable(),version:z.number().int().positive(),
  grants:z.array(z.object({matter:z.uuid(),level:z.enum(['name','directions','details'])}).strict()).max(5000)}).strict()]),
 matter:z.union([deleted,z.object({version:z.number().int().positive(),archived:z.boolean(),private:z.boolean()}).strict()]),
 person:z.union([deleted,z.object({version:z.number().int().positive(),restricted:z.boolean()}).strict()]),
 free_slot:z.union([deleted,z.object({connection:z.uuid().nullable()}).strict()]),
 unreconciled_access:z.object({}).strict(),
};
export function parseRecoveryControl(input:unknown):RecoveryControl{
 const event=eventSchema.parse(input);factsByKind[event.kind].parse(event.facts);return event;
}

/** No bodies/tokens/addresses are accepted from request input. SQL produces the metadata. */
export class DynamoRecoveryJournal implements RecoveryJournalPublisher {
 constructor(private table:string,private namespace:string,private client=new DynamoDBClient({region:'eu-central-1',maxAttempts:3})){
  if(!/^[A-Za-z0-9_.-]{3,255}$/.test(table)||namespace!=='rillora-production')throw new Error('Invalid recovery journal scope');
 }
 async checkCoverage(generation:string):Promise<void>{
  const result=await this.client.send(new GetItemCommand({TableName:this.table,Key:{pk:{S:this.namespace},sk:{S:'__coverage'}},ConsistentRead:true}),{abortSignal:AbortSignal.timeout(5000)});
  const coverage=JSON.parse(result.Item?.payload?.S??'null');
  if(coverage?.version!==1||coverage.databaseGeneration!==generation)throw new Error('Recovery coverage is unavailable');
 }
 async publish(input:RecoveryControl):Promise<void>{
  const event=parseRecoveryControl(input),payload=JSON.stringify(event);
  if(Buffer.byteLength(payload)>300_000)throw new Error('Recovery control exceeds the safe journal limit');
  try{
   await this.client.send(new PutItemCommand({TableName:this.table,Item:{pk:{S:this.namespace},sk:{S:event.key},
    revision:{N:event.revision},payload:{S:payload},expiresAt:{N:String(Math.floor(Date.now()/1000)+90*86400)}},
    ConditionExpression:'attribute_not_exists(revision) OR revision < :incoming',ExpressionAttributeValues:{':incoming':{N:event.revision}}}),
    {abortSignal:AbortSignal.timeout(10_000)});
  }catch(error){
   // A later authorized transaction already journaled the same entity. Never
   // overwrite it with a stale retry; all other failures prevent DB commit.
   if(!(error instanceof Error&&error.name==='ConditionalCheckFailedException'))throw new Error('Recovery journal is unavailable');
  }
 }
}

export function recoveryPublisherFromEnvironment():RecoveryJournalPublisher|null{
 const table=process.env.RECOVERY_JOURNAL_TABLE;
 return table?new DynamoRecoveryJournal(table,process.env.CONTENT_KEY_NAMESPACE??''):null;
}

export async function checkRecoveryJournal(pool:Pool):Promise<void>{
 const publisher=publishers.get(pool);if(!publisher)return;
 const client=await pool.connect();let policy;
 try{
  await client.query('begin');await client.query('set local role continuity_auth');
  policy=(await client.query('select app.recovery_status() as policy')).rows[0]?.policy;
  await client.query('commit');
 }catch(error){await client.query('rollback');throw error;}finally{client.release();}
 if(!policy?.enforced)throw new Error('Recovery journal is not enforced');
 await publisher.checkCoverage?.(policy.generation);
}

export async function publishRecoveryTransaction(pool:Pool,client:PoolClient):Promise<void>{
 const publisher=publishers.get(pool);
 if(!publisher)return; // SQL's deferred guard still rejects unjournaled writes when enforced.
 const result=await client.query<{events:unknown[]}>('select app.recovery_pending() as events');
 for(const raw of result.rows[0]?.events??[]){
  const event=parseRecoveryControl(raw);
  try{await publisher.publish(event);}catch{
   throw new ApiError(503,'recovery_journal_unavailable','Changes could not be saved safely. Please try again shortly.');
  }
  await client.query('select app.recovery_mark_published($1)',[event.revision]);
 }
}
