"""Run the real matrix shell against intercepted tools, never a real simulator."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
OWNER_DEVICE = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'


@unittest.skipUnless(shutil.which('zsh'), 'The macOS matrix runner uses zsh')
class MatrixIsolationTests(unittest.TestCase):
    def run_matrix(self, fail_build=False):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'tools').mkdir()
            (root / 'apps/ios').mkdir(parents=True)
            runner = root / 'tools/run-ios-layout-matrix.sh'
            shutil.copy2(ROOT / 'tools/run-ios-layout-matrix.sh', runner)
            binaries = root / 'bin'; binaries.mkdir()
            stub = '''#!/usr/bin/env python3
import json, os, sys, uuid
from pathlib import Path
name, args = Path(sys.argv[0]).name, sys.argv[1:]
with open(os.environ['RILLORA_MATRIX_FIXTURE_LOG'], 'a') as log:
    log.write(json.dumps({'command': name, 'args': args}) + '\\n')
if name == 'curl':
    print('{"fixture":"rillora-native-ui-v1","syntheticOnly":true}')
elif name == 'xcrun':
    if args[:3] == ['simctl', 'list', 'devices']:
        print('    Rillora-Matrix-17-Pro (AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA) (Booted)')
    elif args[:2] == ['simctl', 'create']:
        print(str(uuid.uuid5(uuid.NAMESPACE_URL, args[2])).upper())
elif name == 'xcodebuild' and 'build-for-testing' in args and os.environ.get('RILLORA_MATRIX_FIXTURE_FAIL_BUILD') == '1':
    raise SystemExit(7)
'''
            for name in ['xcrun', 'xcodebuild', 'xcodegen', 'curl']:
                path = binaries / name; path.write_text(stub); path.chmod(0o700)
            log = root / 'calls.jsonl'
            result = subprocess.run(['zsh', str(runner)], env={**os.environ,
                'PATH': str(binaries) + os.pathsep + os.environ['PATH'],
                'RILLORA_MATRIX_FIXTURE_LOG': str(log),
                'RILLORA_MATRIX_FIXTURE_FAIL_BUILD': '1' if fail_build else '0'},
                text=True, capture_output=True, timeout=30)
            calls = [json.loads(line) for line in log.read_text().splitlines()]
            self.assertEqual(result.returncode, 1 if fail_build else 0, result.stderr)
            created = [row['args'][2] for row in calls if row['command'] == 'xcrun' and row['args'][:2] == ['simctl', 'create']]
            self.assertEqual(len(created), 5, 'An existing named simulator must never replace a fresh per-run device')
            changes = [row['args'][2] for row in calls if row['command'] == 'xcrun' and row['args'][:2] in [
                ['simctl', action] for action in ['boot', 'bootstatus', 'ui', 'shutdown', 'delete']]]
            self.assertNotIn(OWNER_DEVICE, changes)
            self.assertFalse(any(name.startswith('Rillora-Matrix-') for name in changes), 'Cleanup must use recorded owned IDs, not shared names')
            deleted = [row for row in calls if row['command'] == 'xcrun' and row['args'][:2] == ['simctl', 'delete']]
            self.assertEqual(len(deleted), 5)

    def test_matrix_uses_and_cleans_only_five_fresh_devices(self):
        self.run_matrix()

    def test_build_failure_cannot_close_a_preexisting_device(self):
        self.run_matrix(fail_build=True)


if __name__ == '__main__':
    unittest.main()
