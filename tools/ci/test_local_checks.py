import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('verify_local', Path(__file__).with_name('verify_local.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class LocalChecksTests(unittest.TestCase):
    def test_ambient_credentials_database_and_shell_hooks_are_not_inherited(self):
        env = runner.clean_environment({'PATH': '/usr/bin:/bin', 'HOME': '/tmp/test-home',
            'DATABASE_URL': 'do-not-use', 'TEST_DATABASE_URL': 'do-not-use', 'PGHOST': 'remote.example',
            'AWS_ACCESS_KEY_ID': 'do-not-use', 'STRIPE_SECRET_KEY': 'do-not-use',
            'NODE_OPTIONS': '--require unreviewed.js', 'BASH_ENV': '/tmp/unreviewed.sh'})
        for key in ('DATABASE_URL', 'TEST_DATABASE_URL', 'PGHOST', 'AWS_ACCESS_KEY_ID', 'STRIPE_SECRET_KEY', 'NODE_OPTIONS', 'BASH_ENV'):
            self.assertNotIn(key, env)
        self.assertEqual(env['HOME'], '/tmp/test-home')
        self.assertEqual(env['AWS_SHARED_CREDENTIALS_FILE'], os.devnull)
        self.assertEqual(env['AWS_EC2_METADATA_DISABLED'], 'true')

    def test_active_cloud_workflow_cannot_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); directory = root / '.github/workflows'; directory.mkdir(parents=True)
            (directory / 'checks.yml').write_text('name: unexpected cloud job\n')
            with self.assertRaises(ValueError): runner.cloud_policy(root)
            (directory / 'checks.yml').rename(root / 'checks.yml.disabled')
            runner.cloud_policy(root)

    def test_failure_and_timeout_are_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); env = runner.clean_environment(os.environ)
            failed = runner.run_step(['/bin/sh', '-c', 'exit 7'], root, env, root / 'failure.log', 2)
            self.assertEqual(failed['exitCode'], 7)
            timed = runner.run_step(['/bin/sh', '-c', 'sleep 10'], root, env, root / 'timeout.log', 0.1)
            self.assertEqual(timed['exitCode'], 124); self.assertTrue(timed['timedOut'])
            self.assertLess(timed['seconds'], 5)

    def test_moving_and_noncommit_authorities_are_rejected(self):
        with self.assertRaises(ValueError): runner.exact_base(runner.ROOT, 'origin/main')
        with self.assertRaises(subprocess.CalledProcessError): runner.exact_base(runner.ROOT, '0' * 40)

    def test_trusted_policy_is_checked_out_before_candidate_is_scanned(self):
        calls = []
        def capture(name, command, cwd, extra_env=None): calls.append((name, command, cwd))
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            runner.trusted_guard(root, '1' * 40, root / 'reports', {}, capture)
        self.assertEqual(calls[1][1][0:3], ['git', 'checkout', '1' * 40])
        self.assertEqual(calls[1][1][-1], 'config/repository-scan-exceptions.json')
        self.assertIn('--exception-base-ref', calls[3][1])
        self.assertIn('1' * 40, calls[3][1])
        for _, command, _ in calls[2:]:
            self.assertIn('/policy/tools/', command[1])


if __name__ == '__main__': unittest.main()
