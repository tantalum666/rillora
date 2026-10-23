"""Release isolation and bilingual resource checks; not device HealthKit evidence."""
from pathlib import Path
import plistlib
import re
import unittest

IOS = Path(__file__).resolve().parents[2] / 'apps/ios'
NEXT = IOS / 'NextVersionHealth'


class NextVersionHealthTests(unittest.TestCase):
    def test_current_release_does_not_request_health_access(self):
        for file in ['project.yml', 'Rillora/Rillora.entitlements', 'Rillora/Resources/Info.plist',
                     'Rillora.xcodeproj/project.pbxproj']:
            self.assertNotRegex((IOS / file).read_text(), r'RilloraHeartRateKit|NSHealth|com.apple.developer.healthkit')
        profile = (IOS / 'Rillora/Features/Account/AuthenticatedProfileContent.swift').read_text()
        self.assertRegex(profile, r'#if RILLORA_HEALTHKIT_NEXT_VERSION\s+HealthEntryView\(\)\s+#endif')

    def test_next_capability_adds_only_healthkit_to_existing_entitlements(self):
        current = plistlib.loads((IOS / 'Rillora/Rillora.entitlements').read_bytes())
        future = plistlib.loads((NEXT / 'Configuration/RilloraNext.entitlements').read_bytes())
        self.assertEqual(future.pop('com.apple.developer.healthkit'), True)
        self.assertEqual(future, current)
        spec = (IOS / 'project.healthkit-next.yml').read_text()
        self.assertIn('name: RilloraHealthNext', spec)
        self.assertIn('path: NextVersionHealth/Configuration/Info.plist', spec)
        self.assertNotIn('NSHealthUpdateUsageDescription', spec)

    def test_both_languages_cover_the_same_health_view_and_permission_copy(self):
        resources = NEXT / 'Sources/RilloraHeartRateKit/Resources'
        strings = {}
        for language in ['en', 'zh-Hans']:
            text = (resources / (language + '.lproj') / 'Localizable.strings').read_text()
            strings[language] = dict(re.findall(r'^"([^"]+)" = "([^"]+)";', text, re.M))
            permission = (NEXT / 'Configuration' / (language + '.lproj') / 'InfoPlist.strings').read_text()
            self.assertEqual(permission.count('NSHealthShareUsageDescription'), 1)
            self.assertNotIn('NSHealthUpdateUsageDescription', permission)
        self.assertEqual(set(strings['en']), set(strings['zh-Hans']))
        self.assertGreater(len(strings['en']), 15)
        for value in strings['zh-Hans'].values():
            self.assertRegex(value, r'[\u4e00-\u9fff]')
