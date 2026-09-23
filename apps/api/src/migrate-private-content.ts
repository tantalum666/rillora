import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg, { type PoolClient } from "pg";
import { loadContentProtectionConfig, loadDatabaseConfig } from "./config.js";
import { configureContentPool, databaseConnectionOptions, withContentMigrationDatabase, type DatabasePool } from "./db.js";
import { contentReferenceId, protectFields, protectSnapshot, protectedSnapshotFields, type ContentSession } from "./private-content.js";

const matterColumns=["title","institution_name","account_hint","location_hint","notes","value_band","currency_code"] as const;
const aliases:Record<string,string>={title:"title",institutionName:"institution_name",accountHint:"account_hint",locationHint:"location_hint",notes:"notes",valueBand:"value_band",currencyCode:"currency_code"};
type Row=Record<string,any>;
type Bodies={matters:Row[];people:Row[];tasks:Row[];changes:Row[];saved:Row[];snapshots:Row[]};
async function bodies(client:Pick<PoolClient,"query">,owner:string,lock=false):Promise<Bodies>{
 const end=lock?" for update":"";
 return {
  matters:(await client.query(`select id::text,public_id,title,institution_name,account_hint,location_hint,notes,value_band,currency_code,details,version,updated_at from app.matter_items where planner_id=$1 order by id limit 5001${end}`,[owner])).rows,
  people:(await client.query(`select id::text,public_id,display_name,relationship_label,version,updated_at from app.people where planner_id=$1 order by id limit 5001${end}`,[owner])).rows,
  tasks:(await client.query(`select t.id::text,t.public_id,m.public_id as matter_public_id,t.source_fields,t.proposal,t.source_version,t.version,t.state from app.family_review_tasks t join app.matter_items m on m.id=t.matter_item_id and m.planner_id=t.planner_id where t.planner_id=$1 order by t.id limit 5001${lock?' for update of t':''}`,[owner])).rows,
  changes:(await client.query(`select h.id::text,h.public_id,m.public_id as matter_public_id,h.before_fields,h.after_fields,h.source_version,h.saved_version,h.created_at from app.family_review_changes h join app.matter_items m on m.id=h.matter_item_id and m.planner_id=h.planner_id where h.planner_id=$1 order by h.id limit 5001${lock?' for update of h':''}`,[owner])).rows,
  saved:(await client.query(`select s.grant_id::text,m.public_id as matter_public_id,s.fields,s.saved_at,s.cutoff_at from app.sharing_saved_items s join app.sharing_grants g on g.id=s.grant_id and g.planner_id=s.planner_id join app.matter_items m on m.id=g.matter_item_id and m.planner_id=g.planner_id where s.planner_id=$1 order by s.grant_id limit 5001${lock?' for update of s':''}`,[owner])).rows,
  snapshots:(await client.query(`select public_id,policy_snapshot,version,created_at,updated_at from app.disclosure_rehearsals where planner_id=$1 order by id limit 5001${end}`,[owner])).rows,
 };
}
function walk(value:unknown,fn:(value:string)=>unknown):unknown{
 if(typeof value==='string')return fn(value);
 if(Array.isArray(value))return value.map(v=>walk(v,fn));
 if(value && typeof value==='object' && !(value instanceof Date) && !Buffer.isBuffer(value))return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v,fn)]));
 return value;
}
function canonical(value:unknown):unknown{
 if(value instanceof Date)return value.toISOString();
 if(Array.isArray(value))return value.map(canonical);
 if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
 return value;
}
function digest(value:unknown){return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
async function logicalBodies(raw:PoolClient,session:ContentSession,ownerPublicId:string,input:Bodies){
 const requested=new Set<string>();walk(input,v=>{const id=contentReferenceId(v);if(id)requested.add(id);return v;});
 if(requested.size>20000)throw Error('Migration owner requires a smaller batch');
 const response=requested.size?(await raw.query("select app.content_read_values($1,false) as data",[[...requested]])).rows[0].data:{values:[]};
 const known=new Set<string>(response.values.filter((v:Row)=>v.owner===ownerPublicId).map((v:Row)=>v.id));
 const references=[...known].map(id=>`rce1_${id}`);const decoded=await session.open(references);
 const plain=new Map(references.map((ref,index)=>[ref,decoded[index]]));
 return {known,logical:walk(input,v=>plain.has(v)?plain.get(v):v)};
}
function needs(value:unknown,known:ReadonlySet<string>):value is string{
 if(typeof value!=='string'||!value)return false;const id=contentReferenceId(value);return !id||!known.has(id);
}
async function sealColumns(client:PoolClient,kind:'matter'|'person',id:string,row:Row,columns:readonly string[],known:ReadonlySet<string>){
 const values=Object.fromEntries(columns.filter(k=>needs(row[k],known)).map(k=>[k,row[k]]));
 const stored=await protectFields(client,{kind,publicId:id},values);return {...row,...stored};
}
async function sealProjectedFields(client:PoolClient,id:string,fields:Record<string,unknown>|null,known:ReadonlySet<string>){
 if(!fields)return fields;
 const values:Record<string,string>={};const paths:Record<string,string>={};
 for(const [key,value] of Object.entries(fields))if(protectedSnapshotFields.has(key)&&needs(value,known)){
  const field=aliases[key]??`details.${key}`;values[field]=value;paths[key]=field;
 }
 const sealed=await protectFields(client,{kind:'matter',publicId:id},values);
 return {...fields,...Object.fromEntries(Object.entries(paths).map(([key,field])=>[key,sealed[field]]))};
}

export async function migratePrivateContent(pool:DatabasePool):Promise<{owners:number;verifiedOwners:number;changedRows:number}>{
 const owners=(await pool.query("select id::text,public_id from app.planners order by id")).rows;
 let changedRows=0,verifiedOwners=0;
 for(const owner of owners){
  const changed=await withContentMigrationDatabase(pool,owner.id,async(raw,client,session)=>{
   const before=await bodies(raw,owner.id,true);
   if(Object.values(before).some(rows=>rows.length>5000)||Buffer.byteLength(JSON.stringify(before))>16*1024*1024)throw Error('Migration owner exceeds the safe batch');
   const original=await logicalBodies(raw,session,owner.public_id,before);const beforeDigest=digest(original.logical);
   const known=original.known;let changes=0;
   for(const row of before.matters){
    const next=await sealColumns(client,'matter',row.public_id,row,matterColumns,known);
    const details=Object.fromEntries(Object.entries(row.details??{}).filter(([,v])=>needs(v,known)).map(([k,v])=>[`details.${k}`,v as string]));
    const sealed=await protectFields(client,{kind:'matter',publicId:row.public_id},details);
    next.details={...row.details,...Object.fromEntries(Object.entries(sealed).map(([k,v])=>[k.slice(8),v]))};
    if(digest(next)!==digest(row)){
     await raw.query("update app.matter_items set title=$2,institution_name=$3,account_hint=$4,location_hint=$5,notes=$6,value_band=$7,currency_code=$8,details=$9 where id=$1",[row.id,...matterColumns.map(k=>next[k]),next.details]);changes++;
    }
   }
   for(const row of before.people){
    const next=await sealColumns(client,'person',row.public_id,row,['display_name','relationship_label'],known);
    if(digest(next)!==digest(row)){await raw.query('update app.people set display_name=$2,relationship_label=$3 where id=$1',[row.id,next.display_name,next.relationship_label]);changes++;}
   }
   for(const row of before.tasks){
    const source=await sealProjectedFields(client,row.matter_public_id,row.source_fields,known),proposal=await sealProjectedFields(client,row.matter_public_id,row.proposal,known);
    if(digest([source,proposal])!==digest([row.source_fields,row.proposal])){
     await raw.query('update app.family_review_tasks set source_fields=$2,proposal=$3 where id=$1',[row.id,source,proposal]);changes++;
    }
   }
   for(const row of before.changes){
    const previous=await sealProjectedFields(client,row.matter_public_id,row.before_fields,known),next=await sealProjectedFields(client,row.matter_public_id,row.after_fields,known);
    if(digest([previous,next])!==digest([row.before_fields,row.after_fields])){
     // The runtime cannot rewrite history. Only the administrative migration may
     // alter representation; logical before/after and versions are verified.
     await raw.query('update app.family_review_changes set before_fields=$2,after_fields=$3 where id=$1',[row.id,previous,next]);
     changes++;
    }
   }
   for(const row of before.saved){
    const fields=await sealProjectedFields(client,row.matter_public_id,row.fields,known);
    if(digest(fields)!==digest(row.fields)){
     await raw.query('update app.sharing_saved_items set fields=$2 where grant_id=$1',[row.grant_id,fields]);
     changes++;
    }
   }
   for(const row of before.snapshots){
    const snapshot=await protectSnapshot(client,row.public_id,row.policy_snapshot,known);
    if(digest(snapshot)!==digest(row.policy_snapshot)){
     await raw.query('update app.disclosure_rehearsals set policy_snapshot=$2 where public_id=$1',[row.public_id,snapshot]);changes++;
    }
   }
   const after=await logicalBodies(raw,session,owner.public_id,await bodies(raw,owner.id));
   if(digest(after.logical)!==beforeDigest)throw Error('Migration logical verification failed');
   return changes;
  });
  changedRows+=changed;verifiedOwners++;
 }
 return {owners:owners.length,verifiedOwners,changedRows};
}

function protectedStrings(input:unknown,sensitiveOnly=false):string[]{
 const result:string[]=[];
 const visit=(v:unknown)=>{
  if(Array.isArray(v)){for(const i of v)visit(i);return;}
  if(v&&typeof v==='object')for(const [key,value] of Object.entries(v)){
   if(typeof value==='string'&&value&&(!sensitiveOnly||protectedSnapshotFields.has(key)))result.push(value);
   else if(value&&typeof value==='object')visit(value);
  }
 };visit(input);return result;
}
export async function inspectPrivateContent(pool:Pick<DatabasePool,'query'>){
 const owners=(await pool.query('select id::text from app.planners order by id')).rows;
 let protectedValues=0,plaintextValues=0,invalidReferences=0;
 for(const owner of owners){
  const data=await bodies(pool,owner.id);
  if(Object.values(data).some(rows=>rows.length>5000))throw Error('Inspection requires a smaller batch');
  const values:string[]=[];
  for(const m of data.matters){for(const c of matterColumns)if(m[c])values.push(m[c]);values.push(...protectedStrings(m.details));}
  for(const p of data.people){if(p.display_name)values.push(p.display_name);if(p.relationship_label)values.push(p.relationship_label);}
  for(const t of data.tasks)values.push(...protectedStrings(t.source_fields),...protectedStrings(t.proposal));
  for(const h of data.changes)values.push(...protectedStrings(h.before_fields),...protectedStrings(h.after_fields));
  for(const s of data.saved)values.push(...protectedStrings(s.fields,true));
  for(const s of data.snapshots)values.push(...protectedStrings(s.policy_snapshot,true));
  const known=new Set((await pool.query('select public_id from app.private_content_values where planner_id=$1',[owner.id])).rows.map(r=>r.public_id));
  for(const value of values){const id=contentReferenceId(value);protectedValues++;if(!id)plaintextValues++;else if(!known.has(id))invalidReferences++;}
 }
 return {owners:owners.length,protectedValues,plaintextValues,invalidReferences};
}
export async function enforcePrivateContent(pool:DatabasePool){
 const client=await pool.connect();
 try{
  await client.query('begin');
  await client.query('lock table app.matter_items,app.people,app.family_review_tasks,app.family_review_changes,app.sharing_saved_items,app.disclosure_rehearsals in share row exclusive mode');
  const report=await inspectPrivateContent(client);
  if(report.plaintextValues||report.invalidReferences)throw Error('Protected plaintext or invalid reference remains');
  await client.query('update app.private_content_policy set require_encrypted_writes=true');
  await client.query('commit');return {...report,enforced:true};
 }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}

async function main(){
 const mode=process.argv[2];if(!['--check','--apply','--enforce'].includes(mode??''))throw Error('Use --check, --apply or --enforce');
 const pool=new pg.Pool({...databaseConnectionOptions(loadDatabaseConfig()),max:2,application_name:'rillora-content-migration'});
 try{
  if(mode==='--apply'){
   const config=loadContentProtectionConfig();if(!config)throw Error('KMS configuration is required');
   configureContentPool(pool,{...config,mode:'encrypted'});console.log(JSON.stringify(await migratePrivateContent(pool)));
  }
  console.log(JSON.stringify(mode==='--enforce'?await enforcePrivateContent(pool):await inspectPrivateContent(pool)));
 }finally{await pool.end();}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 void main().catch(()=>{process.stderr.write('Private content migration failed safely; no content logged.\n');process.exitCode=1;});
}
