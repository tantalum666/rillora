import json, os, pathlib, subprocess, sys, termios
checkout=pathlib.Path('/Users/tantalum/Documents/电子遗嘱app/.local/legal-sites-favicon-20260928')
fd=sys.stdin.fileno()
old=termios.tcgetattr(fd)
changed=old.copy(); changed[3] &= ~termios.ECHO
termios.tcsetattr(fd, termios.TCSANOW, changed)
print('READY_FOR_EPHEMERAL_CREDENTIAL', flush=True)
try:
    request=json.loads(sys.stdin.readline())
finally:
    termios.tcsetattr(fd, termios.TCSANOW, old)
c=request['credential']
assert c['repository']=='appgprj_6a98e258d72c81919ee18e46d37cfdbf'
assert c['branch']=='main' and c['auth_mode']=='http_extra_header'
assert c['remote_url'].startswith('https://git.chatgpt-team.site/')
env=os.environ.copy()
env.update(GIT_CONFIG_COUNT='2',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+c['token'],GIT_CONFIG_KEY_1='credential.helper',GIT_CONFIG_VALUE_1='',GIT_TERMINAL_PROMPT='0')
def git(*args):
    p=subprocess.run(['git',*args],cwd=checkout,env=env,capture_output=True,text=True)
    if p.returncode:
        raise RuntimeError((p.stderr or p.stdout).replace(c['token'],'[redacted]'))
    return p.stdout.strip()
if request['phase']=='open':
    assert not git('status','--porcelain'), 'Checkout must be clean before opening'
    git('fetch','--no-tags',c['remote_url'],c['branch'])
    git('merge','--ff-only','FETCH_HEAD')
    print(json.dumps({'project_id':c['repository'],'checkout_path':str(checkout),'commit_sha':git('rev-parse','HEAD')}))
elif request['phase']=='push':
    assert git('rev-parse','HEAD')==request['commit_sha']
    assert not git('status','--porcelain'), 'Only a clean, built source may publish'
    git('push',c['remote_url'],'HEAD:'+c['branch'])
    remote=git('ls-remote',c['remote_url'],'refs/heads/'+c['branch']).split()[0]
    assert remote==request['commit_sha'], 'Remote source must match local build'
    print(json.dumps({'project_id':c['repository'],'commit_sha':remote,'pushed':True}))
else:
    raise RuntimeError('Unknown phase')
