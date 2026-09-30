from pathlib import Path
import json, subprocess, secrets, hashlib, uuid, sys
root=Path(__file__).resolve().parents[3]; q=Path(__file__).resolve().parent
private=root/'.local-secrets/stripe-acceptance-20260917/commerce-fixtures.json'
issuer='https://synthetic-qa.rillora.invalid/'
run='stripe-acceptance-20260917'
def task(code,label):
 path=q/(label+'.mjs');path.write_text(code)
 subprocess.run(['python3',str(q/'cloud-task.py'),'start',label,str(path)],check=True)
base="import pg from 'pg';import {verifiedEmailDigest} from './dist/sharing-identity.js';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';import {currentLegalContract as l} from './dist/legal-contract.js';const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();await c.query('begin');"
mode=sys.argv[1]
if mode=='seed':
 if private.exists():raise SystemExit('Fixture already exists; do not duplicate')
 actors=[{'role':r,'subject':run+'-'+str(uuid.uuid4()),'token':secrets.token_urlsafe(32),'csrf':secrets.token_urlsafe(32)} for r in ['annual','monthly','reader']]
 private.write_text(json.dumps({'run':run,'issuer':issuer,'actors':actors},indent=2));private.chmod(0o600)
 values=[{'role':a['role'],'subject':a['subject'],'tokenHash':hashlib.sha256(a['token'].encode()).hexdigest(),'csrfHash':hashlib.sha256(a['csrf'].encode()).hexdigest(),'identityHash':hashlib.sha256((issuer+'\x1f'+a['subject']).encode()).hexdigest()} for a in actors]
 code=base+"const out=[];for(const f of "+json.dumps(values)+"){const i=(await c.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',["+json.dumps(issuer)+",f.subject,'Synthetic billing '+f.role,'en','UTC'])).rows[0];const a=(await c.query(\"insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id\",[i.planner_id,i.identity_account_id,l.termsVersion,l.privacyVersion,l.consentTextVersion,Buffer.from(l.bundleSha256,'hex'),Buffer.from(f.identityHash,'hex')])).rows[0];await c.query(\"insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '2 hours',now())\",[i.planner_id,i.identity_account_id,a.id,Buffer.from(f.tokenHash,'hex'),Buffer.from(f.csrfHash,'hex')]);await c.query('update app.auth_sessions set verified_email_hash=$1 where token_hash=$2',[verifiedEmailDigest(f.role+'-commercial-20260917@example.test'),Buffer.from(f.tokenHash,'hex')]);if(f.role!=='reader')await c.query(\"insert into app.commerce_validation_accounts(planner_id,expires_at,reason) values($1,now()+interval '3 hours','Disposable current-price Stripe acceptance')\",[i.planner_id]);out.push({role:f.role,plannerPublicId:i.planner_public_id});}await c.query('commit');console.log(JSON.stringify({purpose:'Admin-seeded synthetic sessions; no provider login or consent ceremony',actors:out}));await c.end();"
 task(code,'billing-seed')
elif mode=='activate':
 sql=(root/'tools/commerce/activate-sharing.sql').read_text()
 code=base+"await c.query('rollback');await c.query("+json.dumps(sql)+");const policy=(await c.query('select * from app.commerce_runtime_policy')).rows;console.log(JSON.stringify({policy}));await c.end();"
 task(code,'sharing-activation')
elif mode in ('lifecycle-grant','lifecycle-end'):
 state=json.loads(private.read_text());assert state['run']==run and state['issuer']==issuer
 actor=next(a for a in state['actors'] if a['role']=='annual');assert actor['subject'].startswith(run+'-')
 prefix=base+"const p=(await c.query('select planner_id from app.identity_accounts where issuer=$1 and subject=$2',["+json.dumps(issuer)+","+json.dumps(actor['subject'])+"])).rows[0];if(!p)throw Error('Missing disposable planner');"
 if mode=='lifecycle-grant':
  code=prefix+"await c.query(\"insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at) select $1,id,'trusted_people_multiple','manual_override','commercial-20260917-lifecycle-fixture',5,now(),now()+interval '15 minutes' from app.commerce_accounts where planner_id=$1 and operating_plane_code='global'\",[p.planner_id]);await c.query('commit');console.log(JSON.stringify({purpose:'ADMIN SYNTHETIC LIFECYCLE FIXTURE; not Stripe/Apple purchase evidence',durationMinutes:15}));await c.end();"
 else:
  code=prefix+"const r=await c.query(\"update app.commerce_entitlement_grants set expires_at=clock_timestamp() where planner_id=$1 and source_type='manual_override' and source_reference='commercial-20260917-lifecycle-fixture' returning id\",[p.planner_id]);if(r.rowCount!==1)throw Error('Expected one synthetic lifecycle grant');await c.query('commit');console.log(JSON.stringify({syntheticGrantEnded:true,providerSubscriptionUnchanged:true}));await c.end();"
 task(code,mode)
elif mode=='refresh':
 state=json.loads(private.read_text());assert state['run']==run and state['issuer']==issuer
 values=[{'subject':a['subject'],'hash':hashlib.sha256(a['token'].encode()).hexdigest()} for a in state['actors']]
 code=base+"let count=0;for(const f of "+json.dumps(values)+"){const r=await c.query(\"update app.auth_sessions s set last_seen_at=now(),expires_at=now()+interval '60 minutes' from app.identity_accounts i where i.id=s.identity_account_id and i.issuer=$1 and i.subject=$2 and s.token_hash=$3 and s.revoked_at is null\",["+json.dumps(issuer)+",f.subject,Buffer.from(f.hash,'hex')]);count+=r.rowCount;}if(count!==3)throw Error('Expected three disposable sessions');await c.query('commit');console.log(JSON.stringify({refreshedDisposableSessions:count,providerLoginClaim:false}));await c.end();"
 task(code,'billing-refresh')
elif mode=='cleanup':
 state=json.loads(private.read_text());assert state['run']==run and state['issuer']==issuer
 subjects=[a['subject'] for a in state['actors']];assert all(s.startswith(run+'-') for s in subjects)
 code=base+"const ids=(await c.query('select planner_id from app.identity_accounts where issuer=$1 and subject=any($2::text[])',["+json.dumps(issuer)+","+json.dumps(subjects)+"])).rows;for(const item of ids)await c.query('delete from app.planners where id=$1',[item.planner_id]);const count=(await c.query('select count(*)::int n from app.identity_accounts where issuer=$1 and subject=any($2::text[])',["+json.dumps(issuer)+","+json.dumps(subjects)+"])).rows[0].n;if(count!==0)throw Error('Fixture cleanup incomplete');await c.query('commit');console.log(JSON.stringify({removedSyntheticPlanners:ids.length,remaining:count}));await c.end();"
 task(code,'billing-cleanup')
else:raise SystemExit('Use seed/activate/cleanup')
