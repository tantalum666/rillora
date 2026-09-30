from pathlib import Path
import json,subprocess,sys
root=Path(__file__).resolve().parents[3]
q=root/'output/qa/rillora-invite-motion-20260911'
mode=sys.argv[1];assert mode in ('diff','deploy')
count='1'
s=json.loads((q/'staging-before.json').read_text())
args=['npx','cdk',mode,'RilloraStaging','--exclusively','-c','serviceDesiredCount='+count,'-c','stripeTestIntegrationEnabled=true','-c','familyMaintenancePreviewEnabled=true','-c','appleStoreKitSandboxEnabled=false','--profile','rillora-operator','--previous-parameters','true','--require-approval','never']
for p in (s['Parameters'] if mode=='deploy' else []):
 if p['ParameterValue']!='****' and p['ParameterKey']!='BootstrapVersion':args+=['--parameters',p['ParameterKey']+'='+p['ParameterValue']]
if mode=='diff':
 args=[x for x in args if x not in ('--previous-parameters','true','--require-approval','never')]
with (q/('cloud-'+mode+'.log')).open('w') as f:
 result=subprocess.run(args,cwd=root/'infra/aws',stdout=f,stderr=subprocess.STDOUT)
print('Cloud',mode,'exit',result.returncode,flush=True)
raise SystemExit(result.returncode)
