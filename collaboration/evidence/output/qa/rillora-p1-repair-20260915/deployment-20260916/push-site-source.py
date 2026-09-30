import json,os,subprocess,sys,termios
from pathlib import Path
fd=sys.stdin.fileno();settings=termios.tcgetattr(fd);settings[3]&=~termios.ECHO;termios.tcsetattr(fd,termios.TCSANOW,settings)
print('Ready for the in-memory scoped source credential.',flush=True)
credential=json.loads(sys.stdin.readline())
root=Path(__file__).resolve().parents[4];web=root/'apps/web'
if credential['auth_mode']!='http_extra_header' or credential['branch']!='main' or 'appgprj_6a98e258d72c81919ee18e46d37cfdbf.git' not in credential['remote_url']:raise SystemExit('Unexpected source destination')
env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.'+credential['remote_url']+'.extraheader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+credential['token'],GIT_TERMINAL_PROMPT='0')
r=subprocess.run(['git','push',credential['remote_url'],'HEAD:refs/heads/'+credential['branch']],cwd=web,env=env,text=True,capture_output=True)
if r.returncode:
 print('Source push failed; secret suppressed. '+r.stderr.replace(credential['token'],'[redacted]')[-700:]);raise SystemExit(r.returncode)
sha=subprocess.check_output(['git','rev-parse','--verify','HEAD'],cwd=web,text=True).strip()
print('Source push succeeded. Commit: '+sha)
(root/'output/qa/rillora-p1-repair-20260915/deployment-20260916/site-source-commit.txt').write_text(sha+'\n')
