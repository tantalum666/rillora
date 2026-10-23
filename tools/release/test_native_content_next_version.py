"""Release isolation and localization contracts for the opt-in next iOS target."""
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
KIT = IOS / 'NextVersionContent/Sources/RilloraContentKit'


class NativeContentNextTests(unittest.TestCase):
    def test_current_review_target_has_no_new_packages_or_permissions(self):
        for name in ['project.yml', 'Rillora/Resources/Info.plist', 'Rillora/Rillora.entitlements',
                     'Rillora.xcodeproj/project.pbxproj']:
            self.assertNotRegex((IOS / name).read_text(), r'RilloraContentKit|NSMicrophoneUsageDescription|NSSpeechRecognitionUsageDescription|RILLORA_CONTENT_NEXT_VERSION|RILLORA_DUO_NEXT_VERSION')
        self.assertIn('RILLORA_DUO_NEXT_VERSION', (IOS / 'project.next.yml').read_text())
        self.assertIn('#if RILLORA_CONTENT_NEXT_VERSION', (IOS / 'Rillora/Core/API/APIClient.swift').read_text())
        self.assertIn('#if RILLORA_CONTENT_NEXT_VERSION', (IOS / 'Rillora/Features/Account/AuthenticatedProfileContent.swift').read_text())

    def test_both_languages_cover_literal_and_enumerated_ui(self):
        dictionaries = {}
        for language in ['en', 'zh-Hans']:
            text = (KIT / 'Resources' / (language + '.lproj') / 'Localizable.strings').read_text()
            dictionaries[language] = {json.loads(k): json.loads(v) for k, v in re.findall(r'^("(?:[^"\\]|\\.)*") = ("(?:[^"\\]|\\.)*");$', text, re.M)}
        self.assertEqual(set(dictionaries['en']), set(dictionaries['zh-Hans']))
        literal = set()
        for path in KIT.glob('*.swift'):
            literal.update(re.findall(r'ContentText\.get\("([a-zA-Z]+)"\)', path.read_text()))
        self.assertFalse(literal - dictionaries['en'].keys())
        for prefix, values in [('action', ['preserve','request_data','cancel_subscription','close_account','memorialize','other']),
                               ('status', ['not_started','ready','submitted','needs_information','completed','stopped'])]:
            self.assertTrue(all(prefix + '.' + value in dictionaries['en'] for value in values))
        for text in dictionaries['zh-Hans'].values():
            self.assertRegex(text, r'[\u4e00-\u9fff]')

    def test_health_has_no_content_transport_or_export_dependency(self):
        health = IOS / 'NextVersionHealth/Sources/RilloraHeartRateKit'
        for path in health.glob('*.swift'):
            self.assertNotRegex(path.read_text(), r'import RilloraContentKit|URLSession|URLRequest|FileManager|UserDefaults|JSONEncoder')
        for path in KIT.glob('*.swift'):
            self.assertNotRegex(path.read_text(), r'import HealthKit|HeartRateReading|HKHealthStore')
        self.assertIn('toShare: []', (health / 'HealthKitHeartRateReader.swift').read_text())

    def test_next_permission_resources_do_not_copy_whole_localization_folders(self):
        for name in ['project.next.yml', 'project.healthkit-next.yml']:
            spec = (IOS / name).read_text()
            self.assertNotRegex(spec, r'path: .*\.lproj')
            self.assertIn('sources:REPLACE:', spec)
            self.assertIn('- Resources/Info.plist', spec)
        for language in ['en', 'zh-Hans']:
            text = (IOS / 'NextVersionContent/Configuration' / (language + '.lproj') / 'InfoPlist.strings').read_text()
            for key in ['NSHealthShareUsageDescription', 'NSMicrophoneUsageDescription', 'NSSpeechRecognitionUsageDescription']:
                self.assertEqual(text.count(key), 1)
            self.assertNotIn('NSHealthUpdateUsageDescription', text)

    def test_generator_preserves_current_source_and_copies_exact_pins(self):
        spec = importlib.util.spec_from_file_location('prepare_next_ios', ROOT / 'tools/release/prepare_next_ios.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            ios = Path(directory)
            for name in module.PRESERVED:
                path = ios / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(name)
            with patch.object(module, 'IOS', ios), patch.object(module.subprocess, 'run'):
                module.main()
            target = ios / 'RilloraNext.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'
            self.assertEqual(target.read_bytes(), (ios / module.PRESERVED[-1]).read_bytes())
            def changed(*args, **kwargs): (ios / 'project.yml').write_text('unexpected mutation')
            with patch.object(module, 'IOS', ios), patch.object(module.subprocess, 'run', side_effect=changed):
                with self.assertRaisesRegex(RuntimeError, 'Current review source changed'): module.main()


if __name__ == '__main__':
    unittest.main()
