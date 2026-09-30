"""Prepare one existing Web asset change; never execute the change set."""
from pathlib import Path
import copy, hashlib, json, os, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[4]
QA = Path(__file__).resolve().parent
REGION = 'eu-central-1'
STACK = 'RilloraStaging'
LOGICAL = 'WebDeploymentCustomResource08EEC474'
ROLE = 'arn:aws:iam::133857166372:role/cdk-hnb659fds-file-publishing-role-133857166372-eu-central-1'

def aws(*args, profile='rillora-cdk-deploy', env=None):
    command = ['aws', '--region', REGION, '--output', 'json']
    if profile: command += ['--profile', profile]
    result = subprocess.run(command + list(args), capture_output=True, text=True,
                            env=env, timeout=60)
    if result.returncode:
        raise RuntimeError(f'AWS operation {args[0:2]} failed: {result.stderr[-450:]}')
    return json.loads(result.stdout) if result.stdout.strip() else {}

identity = aws('sts', 'get-caller-identity', profile='rillora-operator')
assert identity['Account'] == '133857166372'
assert identity['Arn'] == 'arn:aws:iam::133857166372:user/rillora/rillora-operator'
response = aws('cloudformation', 'get-template', '--stack-name', STACK)
before = response['TemplateBody']
if isinstance(before, str): before = json.loads(before)
props = before['Resources'][LOGICAL]['Properties']
assert before['Resources'][LOGICAL]['Type'] == 'Custom::CDKBucketDeployment'
assert props['DestinationBucketName'] == {'Ref': 'WebBucket12880F5B'}
assert props['SourceBucketNames'] == ['cdk-hnb659fds-assets-133857166372-eu-central-1']
assert props['DistributionId'] == {'Ref': 'WebDistribution59C46482'}
bucket = props['SourceBucketNames'][0]
directory = QA / 'staging-client'
assert 'Rillora Legal' not in (directory/'index.html').read_text()
assert 'favicon-n-8qLNzh.svg' in (directory/'index.html').read_text()
archive = QA/'staging-web.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for path in sorted(directory.rglob('*')):
        assert not path.is_symlink()
        if path.is_file():
            name = path.relative_to(directory).as_posix()
            assert name == 'index.html' or name.startswith('assets/')
            package.write(path, name)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
key = digest + '.zip'
candidate = copy.deepcopy(before)
candidate['Resources'][LOGICAL]['Properties']['SourceObjectKeys'] = [key]
assert [name for name in before['Resources'] if before['Resources'][name] != candidate['Resources'][name]] == [LOGICAL]
candidate_file = QA/'staging-template-candidate.json'
candidate_file.write_text(json.dumps(candidate, separators=(',', ':')))
(QA/'staging-template-before.json').write_text(json.dumps(before, indent=2)+'\n')
template_key = hashlib.sha256(candidate_file.read_bytes()).hexdigest()+'.json'
assumed = aws('sts','assume-role','--role-arn',ROLE,'--role-session-name','rillora-web-guides','--duration-seconds','3600', profile='rillora-operator')['Credentials']
environment = {k:v for k,v in os.environ.items() if k not in {'AWS_PROFILE','AWS_DEFAULT_PROFILE'}}
environment.update(AWS_ACCESS_KEY_ID=assumed['AccessKeyId'], AWS_SECRET_ACCESS_KEY=assumed['SecretAccessKey'], AWS_SESSION_TOKEN=assumed['SessionToken'])
for local, remote, kind in [(archive,key,'application/zip'), (candidate_file,template_key,'application/json')]:
    aws('s3api','put-object','--bucket',bucket,'--key',remote,'--body',str(local),'--content-type',kind,profile=None,env=environment)
stack = aws('cloudformation','describe-stacks','--stack-name',STACK)['Stacks'][0]
parameters = [{'ParameterKey':p['ParameterKey'],'UsePreviousValue':True} for p in stack.get('Parameters',[])]
parameter_file = QA/'previous-parameters.json'; parameter_file.write_text(json.dumps(parameters))
name = 'rillora-guides-20260928-' + digest[:10]
created = aws('cloudformation','create-change-set','--stack-name',STACK,'--change-set-name',name,
              '--change-set-type','UPDATE','--template-url',f'https://{bucket}.s3.{REGION}.amazonaws.com/{template_key}',
              '--parameters','file://'+str(parameter_file),'--capabilities','CAPABILITY_NAMED_IAM',
              '--description','Only update Web assets for signed-in guide routing; preserve API and database')
report = {'stack':STACK,'logicalResource':LOGICAL,'changeSetName':name,'changeSetId':created['Id'],
          'assetKey':key,'oldAssetKeys':props['SourceObjectKeys'],'templateKey':template_key,
          'executed':False,'expectedChangedResources':[LOGICAL]}
(QA/'staging-change-prepared.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
