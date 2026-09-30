from pathlib import Path
import subprocess,json,base64
q=Path(__file__).resolve().parent
def aws(*args):return json.loads(subprocess.check_output(['aws',*args,'--region','eu-central-1','--output','json'],text=True))
s=aws('cloudformation','describe-stacks','--stack-name','RilloraOperations','--profile','rillora-cdk-deploy')['Stacks'][0]
if s['StackStatus'] not in ['CREATE_COMPLETE','UPDATE_COMPLETE']:raise SystemExit('Operations stack not complete')
o={x['OutputKey']:x['OutputValue'] for x in s['Outputs']};(q/'ops-outputs.json').write_text(json.dumps(o,indent=2))
r=aws('lambda','invoke','--function-name',o['CheckerFunctionName'],'--payload','{}','--cli-binary-format','raw-in-base64-out','--log-type','Tail',str(q/'ops-invocation-response.json'),'--profile','rillora-staging-operator')
logs=base64.b64decode(r.get('LogResult','')).decode('utf-8');(q/'ops-invocation.log').write_text(logs)
print(json.dumps({'status':r['StatusCode'],'functionError':r.get('FunctionError'),'response':json.loads((q/'ops-invocation-response.json').read_text())}));print(logs)
