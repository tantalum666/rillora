from pathlib import Path
import json, subprocess, sys, os
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
phase=sys.argv[1]
if phase not in ['diff','prepare','activate','web']:raise SystemExit('Use diff, prepare or activate')
mode='diff' if phase=='diff' else 'deploy'
client=json.loads((root/'.local-secrets/email-verification/auth0-management.json').read_text())
args=['npx','cdk',mode,'RilloraStaging','--exclusively','-c','serviceDesiredCount=1','-c','stripeTestIntegrationEnabled=true','-c','familyMaintenancePreviewEnabled=true','-c','appleStoreKitSandboxEnabled=false','-c','accountDeletionEnabled=true','-c','emailVerificationEnabled='+('true' if phase in ['activate','web'] else 'false'),'--profile','rillora-operator']
if mode=='diff': args+=['--no-change-set']
else:
    result=subprocess.run(['aws','--profile','rillora-cdk-deploy','--region','eu-central-1','cloudformation','describe-stacks','--stack-name','RilloraStaging','--output','json'],capture_output=True,text=True)
    if result.returncode:raise SystemExit('Current AWS session unavailable; no deployment started.')
    stack=json.loads(result.stdout)['Stacks'][0]
    checkpoint=root/'.local-secrets/email-verification/staging-before.json'
    if not checkpoint.exists():
        fd=os.open(checkpoint,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as out:json.dump(stack,out)
    args+=['--previous-parameters','true','--require-approval','never']
    for parameter in stack['Parameters']:
        if parameter['ParameterValue']!='****' and parameter['ParameterKey'] not in ['BootstrapVersion','Auth0EmailVerificationClientId','Auth0EmailVerificationDomain']:
            args+=['--parameters',parameter['ParameterKey']+'='+parameter['ParameterValue']]
    args+=['--parameters','Auth0EmailVerificationClientId='+client['client_id'],'--parameters','Auth0EmailVerificationDomain='+client['domain']]
with (q/('aws-'+phase+'.log')).open('w') as log:r=subprocess.run(args,cwd=root/'infra/aws',stdout=log,stderr=subprocess.STDOUT)
print('AWS',phase,'exit',r.returncode)
sys.exit(r.returncode)
