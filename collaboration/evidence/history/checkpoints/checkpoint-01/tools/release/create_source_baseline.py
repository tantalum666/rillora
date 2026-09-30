#!/usr/bin/env python3
"""Create the first root commit from the reviewed source snapshot, preserving child Git history."""
from pathlib import Path
import hashlib
import json
import os
import subprocess

ROOT=Path(__file__).resolve().parents[2]
QA=ROOT/'output/qa/rillora-production-recovery-20260923'
SOURCE=ROOT/'.local/github-preflight/source'

def git(*args,data=None,env=None):
    return subprocess.check_output(['git','-C',str(ROOT),*args],input=data,env=env,stderr=subprocess.PIPE).decode().strip()

def main():
    if subprocess.run(['git','-C',str(ROOT),'rev-parse','--verify','HEAD'],capture_output=True).returncode==0:
        raise SystemExit('Root already has history; this initial-baseline tool must not replace it')
    if git('ls-files','-s') or git('remote'):
        raise SystemExit('Existing index/remote requires review; no replacement performed')
    if git('symbolic-ref','HEAD')!='refs/heads/main':
        raise SystemExit('Unexpected initial root branch; no branch change performed')
    manifest=json.loads((QA/'repository-candidate.json').read_text())
    if not json.loads((QA/'repository-scan.json').read_text())['passed']:
        raise SystemExit('Source scan has not passed')
    actor=json.loads(subprocess.check_output(['gh','api','user','--jq','{login,id}']))
    if actor['login']!='tantalum666':raise SystemExit('Unexpected GitHub account')
    childBefore=subprocess.check_output(['git','-C',str(ROOT/'apps/web'),'rev-parse','HEAD']).decode().strip()
    def verify():
        for item in manifest['files']:
            for base in (ROOT,SOURCE):
                p=base/item['path']
                if p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest()!=item['sha256']:
                    raise RuntimeError('Source changed since review: '+item['path'])
    verify()
    index=ROOT/'.local/github-preflight/root-index'
    if index.exists():raise SystemExit('Previous prepared index exists; inspect rather than overwrite')
    env={**os.environ,'GIT_INDEX_FILE':str(index),'GIT_AUTHOR_NAME':actor['login'],
         'GIT_COMMITTER_NAME':actor['login'],'GIT_AUTHOR_EMAIL':f"{actor['id']}+{actor['login']}@users.noreply.github.com",
         'GIT_COMMITTER_EMAIL':f"{actor['id']}+{actor['login']}@users.noreply.github.com"}
    git('read-tree','--empty',env=env)
    records=[]
    for item in manifest['files']:
        p=SOURCE/item['path'];oid=git('hash-object','-w','--stdin',data=p.read_bytes())
        mode='100755' if p.stat().st_mode&0o111 else '100644'
        records.append(f"{mode} {oid}\t{item['path']}\0".encode())
    git('update-index','-z','--index-info',data=b''.join(records),env=env)
    tree=git('write-tree',env=env)
    commit=git('commit-tree',tree,'-m','chore: establish reviewed Rillora source baseline',env=env)
    verify()
    git('update-ref','refs/heads/main',commit,'0'*40)
    # read-tree updates only the root index; it never moves child .git metadata.
    git('read-tree','HEAD')
    childAfter=subprocess.check_output(['git','-C',str(ROOT/'apps/web'),'rev-parse','HEAD']).decode().strip()
    if childBefore!=childAfter:raise RuntimeError('Child history changed unexpectedly')
    entries=git('ls-tree','-r','HEAD').splitlines()
    if any(line.startswith('160000') for line in entries):raise RuntimeError('Source baseline contains an unintended gitlink')
    result={'commit':commit,'tree':tree,'fileCount':len(entries),'childWebCommitPreserved':childAfter,
            'fanpassChanged':False,'remotePushPerformed':False,'scope':'Reviewed source snapshot; not a production release or database backup'}
    (QA/'source-baseline.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

if __name__=='__main__':main()
