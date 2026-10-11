import hashlib
import importlib.util
import tempfile
import json
import secrets
import subprocess
import sys
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('scan',Path(__file__).with_name('scan_repository.py'))
scan=importlib.util.module_from_spec(spec);spec.loader.exec_module(scan)

class SourceScanBoundaryTests(unittest.TestCase):
    def test_candidate_scanner_configuration_and_inline_allow_cannot_suppress_new_findings(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'config').mkdir()
            (root/'config/repository-scan-exceptions.json').write_text('{"findings":[]}')
            (root/'.gitleaks.toml').write_text('[allowlist]\ndescription="candidate bypass"\npaths=[".*"]\n')
            # Random local-only test text with no provider/account authority.
            (root/'candidate.py').write_text('api_key = "' + secrets.token_hex(22) + '" # gitleaks:allow\n')
            report=root/'scan.json'
            result=subprocess.run([sys.executable,str(Path(__file__).with_name('scan_repository.py')),
                '--source',str(root),'--report',str(report)],capture_output=True,text=True)
            self.assertEqual(result.returncode,1,result.stderr)
            evidence=json.loads(report.read_text())
            self.assertFalse(evidence['passed'])
            self.assertTrue(any(f['path']=='candidate.py' for f in evidence['unreviewedFindings']))
    def test_only_exact_reviewed_span_passes_and_changed_material_fails(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);p=root/'fixture.py';p.write_text('synthetic constant\n')
            f={'File':str(p),'RuleID':'test-rule','StartLine':1,'EndLine':1}
            e={'path':'fixture.py','rule':'test-rule','startLine':1,'endLine':1,
               'sourceSpanSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reason':'reviewed fixture'}
            self.assertEqual(len(scan.classify([f],root,[e])[0]),1)
            p.write_text('new unreviewed material\n')
            self.assertEqual(len(scan.classify([f],root,[e])[1]),1)

    def test_unapproved_file_and_outside_path_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);p=root/'new.py';p.write_text('candidate\n')
            findings=[{'File':str(p),'RuleID':'new','StartLine':1,'EndLine':1},
                      {'File':'/outside-source','RuleID':'new','StartLine':1,'EndLine':1}]
            self.assertEqual(len(scan.classify(findings,root,[])[1]),2)

if __name__=='__main__':unittest.main()
