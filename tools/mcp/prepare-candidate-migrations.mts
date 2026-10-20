// Candidate-only plan generator. Apply all output statements in one transaction; never to production.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {migrationOwnershipRole,migrationTransactionStatements} from '../../apps/api/src/migration-sql.js';
import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
const {values}=parseArgs({options:{out:{type:'string'}}});
if(!values.out)throw Error('Supply a new --out directory; this command does not connect to a database');
const folder=resolve(import.meta.dirname,'../../apps/api/migrations'),out=resolve(values.out);
await mkdir(out); // Refuse to overwrite an earlier migration plan.

const statements=["set local standard_conforming_strings = on", "select pg_advisory_xact_lock(hashtext('continuity_schema_migrations'))",
 "do $$ begin if current_database()<>'rillora_ai_candidate' or exists(select 1 from pg_namespace where nspname='app') then raise exception 'requires the new empty Rillora candidate database'; end if; end $$",
 'create schema app', 'create table app.schema_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now())'];
const inventory=[];
for(const name of (await readdir(folder)).filter(n=>/^\d+_[a-z0-9_]+\.sql$/.test(n)).sort()) {
 const sql=await readFile(`${folder}/${name}`,'utf8'),sha=createHash('sha256').update(sql).digest('hex');
 const prepared=migrationTransactionStatements(sql).map((statement,index)=>{
  const role=migrationOwnershipRole(statement);
  if(!role)return statement;
  const delimiter=`$candidate_owner_${index}$`;
  if(statement.includes(delimiter))throw Error('Unexpected SQL delimiter');
  return `do $candidate_wrapper$ declare added boolean; begin
   added := not has_schema_privilege('${role}','app','CREATE');
   if added then grant create on schema app to ${role}; end if;
   execute ${delimiter}${statement}${delimiter};
   if added then revoke create on schema app from ${role}; end if;
  end $candidate_wrapper$;`;
 });
 statements.push(...prepared,`insert into app.schema_migrations(name,checksum) values('${name}','${sha}')`);
 inventory.push({name,sha256:sha});
}
let chunk=[],bytes=0,index=0;
for(const statement of statements){
 if(bytes+statement.length>50000&&chunk.length){await writeFile(`${out}/part-${index++}.json`,JSON.stringify(chunk));chunk=[];bytes=0;}
 chunk.push(statement);bytes+=statement.length;
}
if(chunk.length)await writeFile(`${out}/part-${index++}.json`,JSON.stringify(chunk));
await writeFile(`${out}/inventory.json`,JSON.stringify({migrations:inventory,parts:index,statements:statements.length},null,2)+'\n');
console.log(JSON.stringify({migrations:inventory.length,parts:index,statements:statements.length}));
