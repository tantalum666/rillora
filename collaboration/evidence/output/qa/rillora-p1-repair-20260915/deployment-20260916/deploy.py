from pathlib import Path
import subprocess,json,sys
ROOT=Path(__file__).resolve().parents[4]
Q=Path(__file__).resolve().parent
mode=sys.argv[1]
if mode not in ('diff','0','1'):raise SystemExit('Choose diff,0,1')
s=json.loads((Q/'staging-before.json').read_text())
args=['npx','cdk','diff' if mode=='diff' else 'deploy','RilloraStaging','--exclusively','-c','serviceDesiredCount='+('0' if mode=='diff' else mode),'-c','stripeTestIntegrationEnabled=true','-c','familyMaintenancePreviewEnabled=true','-c','appleStoreKitSandboxEnabled=false','-c','accountDeletionEnabled='+('true' if mode=='1' else 'false'),'--profile','rillora-operator']
if mode!='diff':args+=['--previous-parameters','true','--require-approval','never']
for p in s['Parameters']:
 if p['ParameterValue']!='****' and p['ParameterKey'] not in ('BootstrapVersion','Auth0DeletionDomain','Auth0DeletionClientId'):args+=['--parameters',p['ParameterKey']+'='+p['ParameterValue']]
args+=['--parameters','Auth0DeletionClientId=[REDACTED_SCANNER_LITERAL]','--parameters','Auth0DeletionDomain=rillora-dev.eu.auth0.com']
with (Q/('aws-'+mode+'.log')).open('w') as out:r=subprocess.run(args,cwd=ROOT/'infra/aws',stdout=out,stderr=subprocess.STDOUT)
print('AWS '+mode+' finished with exit '+str(r.returncode),flush=True)
raise SystemExit(r.returncode)
