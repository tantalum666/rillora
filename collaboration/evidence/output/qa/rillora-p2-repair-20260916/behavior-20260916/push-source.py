import os,sys,json,subprocess,termios
settings=termios.tcgetattr(sys.stdin.fileno());quiet=termios.tcgetattr(sys.stdin.fileno());quiet[3]&=~termios.ECHO
termios.tcsetattr(sys.stdin.fileno(),termios.TCSADRAIN,quiet)
print('Ready for scoped source credential.',flush=True)
try: value=json.loads(sys.stdin.readline())
finally: termios.tcsetattr(sys.stdin.fileno(),termios.TCSADRAIN,settings)
env=os.environ.copy()
for key in ['GIT_TRACE','GIT_TRACE_CURL','GIT_CURL_VERBOSE']:env.pop(key,None)
env.update(GIT_TERMINAL_PROMPT='0',GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+value['token'])
result=subprocess.run(['git','push',value['remote_url'],'HEAD:'+value['branch']],cwd=value['cwd'],env=env,text=True,capture_output=True)
if result.returncode:print(result.stderr.replace(value['token'],'[redacted]'))
else:print('Exact source pushed successfully.')
sys.exit(result.returncode)
