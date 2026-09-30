from pathlib import Path
import subprocess,json,sys
root=Path(__file__).resolve().parents[4];q=Path(__file__).resolve().parent
mode=sys.argv[1]
if mode not in ['diff','deploy']:raise SystemExit('Use diff or deploy')
args=['npx','cdk',mode,'RilloraStaging','--exclusively','-c','serviceDesiredCount=1','-c','stripeTestIntegrationEnabled=true','-c','familyMaintenancePreviewEnabled=true','-c','appleStoreKitSandboxEnabled=false','-c','accountDeletionEnabled=true','--profile','rillora-operator']
if mode=='deploy':
 args+=['--previous-parameters','true','--require-approval','never']
 for parameter in json.loads((q/'staging-before.json').read_text())['Parameters']:
  if parameter['ParameterValue']!='****' and parameter['ParameterKey']!='BootstrapVersion':args+=['--parameters',parameter['ParameterKey']+'='+parameter['ParameterValue']]
with (q/('aws-'+mode+'.log')).open('w') as log:result=subprocess.run(args,cwd=root/'infra/aws',stdout=log,stderr=subprocess.STDOUT)
print('AWS '+mode+' exit '+str(result.returncode))
sys.exit(result.returncode)
