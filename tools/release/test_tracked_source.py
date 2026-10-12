import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

def module(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(name+'.py'))
    loaded=importlib.util.module_from_spec(spec);spec.loader.exec_module(loaded)
    return loaded

tracked=module('tracked_source')
scan=module('scan_repository')

class TrackedSourceTests(unittest.TestCase):
    def repository(self,root):
        subprocess.run(['git','init','-q',str(root)],check=True)

    def git(self,root,*args):
        return subprocess.check_output(['git','-c','user.name=Rillora QA','-c','user.email=qa@example.test',*args],cwd=root,text=True).strip()

    def test_force_tracked_ignored_file_is_scanned_but_untracked_private_file_is_not(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.repository(root)
            (root/'.gitignore').write_text('*.env\n.local-secrets/\n')
            (root/'fixture.env').write_text('SYNTHETIC_ONLY=1\n')
            (root/'.local-secrets').mkdir();(root/'.local-secrets/local.env').write_text('SYNTHETIC_ONLY=2\n')
            self.git(root,'add','-f','fixture.env')
            self.assertEqual(tracked.tracked_source_paths(root),{'fixture.env'})
            self.git(root,'add','-f','.local-secrets/local.env')
            with self.assertRaises(ValueError):tracked.tracked_source_paths(root)

    def test_candidate_cannot_approve_a_new_scan_exception(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.repository(root);(root/'config').mkdir()
            registry=root/'config/repository-scan-exceptions.json';registry.write_text('{"findings":[]}')
            self.git(root,'add','.');self.git(root,'commit','-qm','trusted base')
            base=self.git(root,'rev-parse','HEAD')
            registry.write_text(json.dumps({'findings':[{'reason':'candidate self-approval'}]}))
            self.assertEqual(scan.load_exceptions(root,base,root),[])
            self.assertEqual(len(scan.load_exceptions(root)),1)
            with self.assertRaises(ValueError):scan.load_exceptions(root,'HEAD:other',root)

    def test_worktree_git_pointer_never_enters_the_generated_source_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'repository';self.repository(root)
            (root/'main.txt').write_text('source fixture\n');self.git(root,'add','.');self.git(root,'commit','-qm','fixture')
            worktree=Path(directory)/'worktree';self.git(root,'worktree','add','--detach',str(worktree),'HEAD')
            self.assertTrue((worktree/'.git').is_file())
            report=Path(directory)/'report.json'
            subprocess.run(['python3',str(Path(__file__).with_name('prepare_repository.py')),'--repository',str(worktree),'--report',str(report)],check=True,capture_output=True)
            snapshot=worktree/'.local/github-preflight/source'
            self.assertFalse((snapshot/'.git').exists())
            self.assertNotIn('.git',[entry['path'] for entry in json.loads(report.read_text())['files']])
            self.assertEqual((snapshot/'main.txt').read_text(),'source fixture\n')

if __name__=='__main__':unittest.main()
