import unittest
import json
import tempfile
from pathlib import Path
from snapshot_policy import directory_exclusion, file_exclusion, public_path
from build_snapshot import redact, freeze_file
from verify_archives import safe_relative
from verify_publication import write_manifest, verify


class SnapshotBoundaries(unittest.TestCase):
    def test_credentials_and_real_database_stay_local(self):
        self.assertIsNotNone(directory_exclusion('.local-secrets/storekit'))
        self.assertIsNotNone(directory_exclusion('.local/backups'))
        for name in ['apps/api/.env.production', 'session.key', 'owner.sqlite', '.npmrc']:
            self.assertIsNotNone(file_exclusion(name))
        self.assertIsNone(file_exclusion('apps/api/.env.example'))

    def test_archives_are_preserved_but_machine_diagnostics_are_not(self):
        self.assertIsNone(directory_exclusion('output/release/Rillora.xcarchive/dSYMs'))
        self.assertIsNone(file_exclusion('output/Tests.xcresult/Data/result.db'))
        self.assertIsNotNone(directory_exclusion('output/Tests.xcresult/simctl_diagnostics'))
        self.assertIsNotNone(directory_exclusion('output/derived-release/Build'))

    def test_old_instruction_files_are_reference_data(self):
        self.assertTrue(public_path('history/AGENTS.md').endswith('.md.reference.txt'))

    def test_private_literals_and_capability_urls_are_redacted(self):
        original = 'owner@example.net https://app.example.test/invite?token=capability-value "accessToken":"fixture-value" private-owner-field'
        text, changed = redact(original, {'private-owner-field'})
        self.assertTrue(changed)
        self.assertNotIn('fixture-value', text)
        self.assertNotIn('capability-value', text)
        self.assertNotIn('private-owner-field', text)
        self.assertIn('owner@example.net', text)

    def test_real_emails_are_removed_without_removing_support_address(self):
        value = 'person@personal-domain.com support@rillora.xyz'
        redacted, changed = redact(value, set())
        self.assertTrue(changed)
        self.assertNotIn('person@personal-domain.com', redacted)
        self.assertIn('support@rillora.xyz', redacted)

    def test_restore_rejects_path_traversal(self):
        for name in ['../outside', '/absolute', 'a/../../b', 'a\\..\\b', '']:
            with self.assertRaises(ValueError):
                safe_relative(name)
        self.assertEqual(str(safe_relative('output/release/README.md')), 'output/release/README.md')

    def test_later_log_appends_cannot_change_captured_bytes(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / 'active.log'
            source.write_text('first record\n')
            frozen, _ = freeze_file(source, root)
            with source.open('a') as stream:
                stream.write('later record\n')
            self.assertEqual(frozen.read_text(), 'first record\n')

    def test_manifest_handles_path_order_and_detects_changed_bytes(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            base = root / 'collaboration'
            (base / 'alpha').mkdir(parents=True)
            (base / 'alpha/note.txt').write_text('nested')
            (base / 'alpha.txt').write_text('sibling')
            (base / 'snapshot.json').write_text(json.dumps({'archives': [], 'catalogFiles': [], 'workFiles': 0}))
            write_manifest(root)
            self.assertTrue(verify(root)['passed'])
            (base / 'alpha.txt').write_text('changed')
            with self.assertRaises(ValueError):
                verify(root)


if __name__ == '__main__':
    unittest.main()
