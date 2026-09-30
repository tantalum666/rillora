from pathlib import Path
import json,subprocess,sys
root=Path(__file__).resolve().parents[3]
q=root/'output/qa/rillora-account-matter-ux-20260911'
count=sys.argv[1];assert count in ('0','1')
s=json.loads((q/'staging-before.json').read_text())
args=['npx','cdk','deploy','RilloraStaging','--exclusively','-c','serviceDesiredCount='+count,'-c','stripeTestIntegrationEnabled=true','-c','familyMaintenancePreviewEnabled=true','-c','appleStoreKitSandboxEnabled=false','--profile','rillora-operator','--previous-parameters','true','--require-approval','never']
for p in s['Parameters']:
 if p['ParameterValue']!='****' and p['ParameterKey']!='BootstrapVersion':args+=['--parameters',p['ParameterKey']+'='+p['ParameterValue']]
with (q/('deploy-phase-'+count+'.log')).open('w') as f:
 result=subprocess.run(args,cwd=root/'infra/aws',stdout=f,stderr=subprocess.STDOUT)
print('Deploy desired count',count,'exit',result.returncode,flush=True)
raise SystemExit(result.returncode)
