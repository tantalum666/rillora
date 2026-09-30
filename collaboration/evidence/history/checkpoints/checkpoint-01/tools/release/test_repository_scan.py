import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('scan',Path(__file__).with_name('scan_repository.py'))
scan=importlib.util.module_from_spec(spec);spec.loader.exec_module(scan)

class SourceScanBoundaryTests(unittest.TestCase):
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
