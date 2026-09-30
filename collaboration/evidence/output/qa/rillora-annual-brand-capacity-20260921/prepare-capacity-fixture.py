"""Prepare disposable staging users; credentials stay in a private local file."""
from pathlib import Path
import base64, hashlib, json, os, secrets, uuid

ROOT = Path(__file__).resolve().parents[3]
QA = Path(__file__).resolve().parent
private = ROOT / '.local-secrets/annual-capacity'
private.mkdir(mode=0o700, exist_ok=True)
state_file = private / 'fixture.json'
if state_file.exists():
    raise SystemExit('Fixture already prepared; reuse it instead of duplicating users.')
run = 'capacity-20260921-' + uuid.uuid4().hex[:8]
tokens = [secrets.token_urlsafe(32) for _ in range(100)]
csrf = secrets.token_urlsafe(32)
state = {'run': run, 'issuer': 'https://synthetic-qa.rillora.invalid/', 'tokens': tokens, 'csrf': csrf}
fd = os.open(state_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as stream:
    json.dump(state, stream)
hashes = base64.b64encode(b''.join(hashlib.sha256(t.encode()).digest() for t in tokens)).decode()
code = """import pg from 'pg';
import {createHash} from 'node:crypto';
import {loadDatabaseConfig} from './dist/config.js';
import {databaseConnectionOptions} from './dist/db.js';
import {currentLegalContract as l} from './dist/legal-contract.js';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));
const run=RUN,issuer='https://synthetic-qa.rillora.invalid/',hashes=Buffer.from(HASHES,'base64');
await c.connect();await c.query('begin');
try {
 if((await c.query('select count(*)::int n from app.identity_accounts where issuer=$1 and subject like $2',[issuer,run+'-%'])).rows[0].n)throw Error('Fixture exists');
 for(let index=0;index<100;index++){
  const subject=run+'-'+index;
  const p=(await c.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',[issuer,subject,'Synthetic capacity '+index,'en','UTC'])).rows[0];
  const a=(await c.query("insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id",[p.planner_id,p.identity_account_id,l.termsVersion,l.privacyVersion,l.consentTextVersion,Buffer.from(l.bundleSha256,'hex'),createHash('sha256').update(issuer+'\\x1f'+subject).digest()])).rows[0];
  await c.query("insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '2 hours',now())",[p.planner_id,p.identity_account_id,a.id,hashes.subarray(index*32,index*32+32),Buffer.from(CSRF,'hex')]);
  await c.query("insert into app.matter_items(planner_id,plan_id,category,title,institution_name) select $1,p.id,'account','Synthetic account '||n,'Example provider' from app.plans p cross join generate_series(1,20) n where p.planner_id=$1",[p.planner_id]);
 }
 const prices=(await c.query("select price_code,status,amount_minor::text from app.commerce_prices where price_code like 'family_usd_%' order by price_code")).rows;
 await c.query('commit');console.log(JSON.stringify({run,syntheticUsers:100,syntheticMatters:2000,providerLoginTested:false,realConsentTested:false,prices}));
}catch(e){await c.query('rollback');console.error('Capacity fixture transaction failed: '+e.message);process.exitCode=1;}finally{await c.end();}
"""
code = code.replace('RUN', json.dumps(run)).replace('HASHES', json.dumps(hashes)).replace('CSRF', json.dumps(hashlib.sha256(csrf.encode()).hexdigest()))
size = len(json.dumps({'containerOverrides':[{'name':'Migration','command':['node','--input-type=module','-e',code]}]}).encode())
assert size < 8192, size
(QA / 'capacity-seed.mjs').write_text(code)
cleanup = """import pg from 'pg';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();await c.query('begin');
try{const users=(await c.query('select planner_id from app.identity_accounts where issuer=$1 and subject like $2',['https://synthetic-qa.rillora.invalid/',RUN+'-%'])).rows;if(users.length!==100)throw Error('Expected exactly100 disposable users');
for(const p of users)await c.query('delete from app.planners where id=$1',[p.planner_id]);await c.query('commit');console.log(JSON.stringify({removedSyntheticUsers:100,remaining:0}));}catch(e){await c.query('rollback');console.error('Exact fixture cleanup failed: '+e.message);process.exitCode=1;}finally{await c.end();}
""".replace('RUN',json.dumps(run))
(QA / 'capacity-cleanup.mjs').write_text(cleanup)
print(json.dumps({'preparedUsers':100,'mattersPerUser':20,'overrideBytes':size,'credentialsPrinted':False}))
