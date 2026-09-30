import os,re,select,subprocess,sys,time,json
from pathlib import Path
p=subprocess.Popen(['aws','login','--profile','rillora-operator','--region','eu-central-1','--remote'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
b=b'';deadline=time.monotonic()+45
while time.monotonic()<deadline:
    ready,_,_=select.select([p.stdout],[],[],1)
    if ready:
        data=os.read(p.stdout.fileno(),8192)
        if not data:raise SystemExit('AWS login exited before authorization URL')
        b+=data
        found=re.search(rb'https://eu-central-1\.signin\.aws\.amazon\.com/v1/authorize\?[^\s]+',b)
        if found:
            print(found.group().decode(),flush=True);break
else:p.terminate();raise SystemExit('No AWS authorization URL')
print('WAITING_FOR_PROTECTED_PAGE_EXPORT_PATH',flush=True)
path=Path(input().strip()).resolve()
if not path.is_file():p.terminate();raise SystemExit('Export file missing')
os.chmod(path,0o600)
body=path.read_text()
# The exact visible-code extraction is selected only after inspecting the exported document structure.
print(json.dumps({'exportPath':str(path),'bytes':len(body.encode()),'lines':len(body.splitlines()),'codeNotPrinted':True}),flush=True)
print('WAITING_FOR_EXACT_CODE_LINE_NUMBER',flush=True)
line=int(input().strip())
code=body.splitlines()[line-1].strip().removeprefix('`').removesuffix('`')
if not re.fullmatch(r'[A-Za-z0-9_\-+/=.]{20,8192}',code):p.terminate();raise SystemExit('Unexpected verification code shape; no code submitted')
p.stdin.write((code+'\n').encode());p.stdin.flush()
output=p.communicate(timeout=45)[0].decode(errors='replace')
# Never echo provider output: it can contain credential/session material.
print(json.dumps({'loginExitCode':p.returncode,'success':p.returncode==0,'providerOutputSuppressed':True}),flush=True)
if p.returncode:raise SystemExit(1)
r=subprocess.run(['aws','--profile','rillora-operator','sts','get-caller-identity','--output','json'],capture_output=True,text=True,timeout=30)
if r.returncode:raise SystemExit('Identity verification failed; raw output suppressed')
x=json.loads(r.stdout);assert x.get('Account')=='133857166372';assert x.get('Arn')=='arn:aws:iam::133857166372:user/rillora/rillora-operator'
print(json.dumps({'accountMatched':True,'operatorMatched':True,'CLIReady':True}),flush=True)
