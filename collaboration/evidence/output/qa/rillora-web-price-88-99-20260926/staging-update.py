from pathlib import Path
import subprocess,json,sys
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
phase=sys.argv[1]
assert phase in ['diff','deploy']
before=json.loads((q/'staging-stack-before.json').read_text())
args=['npx','cdk',phase,'RilloraStaging','--exclusively','--profile','rillora-cdk-session']
for key,value in {'serviceDesiredCount':'1','stripeTestIntegrationEnabled':'true','familyMaintenancePreviewEnabled':'true','appleStoreKitSandboxEnabled':'false','accountDeletionEnabled':'true','emailVerificationEnabled':'true','contentProtectionMode':'encrypted','contentMigrationEnabled':'false'}.items():args+=['-c',key+'='+value]
if phase=='diff':args+=['--no-change-set']
else:
 args+=['--previous-parameters','true','--require-approval','never','--outputs-file',str(q/'staging-outputs-after.json')]
 for item in before['Parameters']:
  if item['ParameterValue']!='****' and item['ParameterKey']!='BootstrapVersion':args+=['--parameters',item['ParameterKey']+'='+item['ParameterValue']]
with (q/('staging-'+phase+'.log')).open('w') as log:r=subprocess.run(args,cwd=root/'infra/aws',stdout=log,stderr=subprocess.STDOUT)
print(json.dumps({'phase':phase,'exit':r.returncode}));sys.exit(r.returncode)
