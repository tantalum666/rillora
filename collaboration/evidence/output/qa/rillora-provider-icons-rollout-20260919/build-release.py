from pathlib import Path
import os, shlex, subprocess, sys
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
env=os.environ.copy()
for line in (root/'.local-secrets/legal/release.env').read_text().splitlines():
    line=line.strip()
    if not line or line.startswith('#'):continue
    if line.startswith('export '):line=line[7:]
    key,value=line.split('=',1);env[key.strip()]=' '.join(shlex.split(value,comments=True))
with (q/'web-release-build.log').open('w') as log:
    r=subprocess.run(['npm','run','build:release'],cwd=root/'apps/web',env=env,stdout=log,stderr=subprocess.STDOUT)
print('Release build exit',r.returncode)
sys.exit(r.returncode)
