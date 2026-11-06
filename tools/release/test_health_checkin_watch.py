"""Next-target isolation, data boundaries and complete bilingual resources."""
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
KIT = IOS / 'NextVersionCheckIn/Sources/RilloraCheckInKit'


class HealthCheckInWatchTests(unittest.TestCase):
    def test_review_configuration_has_no_watch_or_checkin_dependency(self):
        for name in ['project.yml', 'Rillora.xcodeproj/project.pbxproj', 'Rillora/Resources/Info.plist', 'Rillora/Rillora.entitlements']:
            self.assertNotRegex((IOS / name).read_text(), r'RilloraCheckInKit|RilloraWatchNext|RILLORA_CHECKIN_NEXT_VERSION|WKCompanion')
        next_spec = (IOS / 'project.next.yml').read_text()
        self.assertIn('WKApplication: true', next_spec)
        self.assertIn('WKCompanionAppBundleIdentifier: com.rillora.ios', next_spec)
        self.assertIn('platform: watchOS', next_spec)
        self.assertIn('- Resources/Localizable.xcstrings', next_spec)

    def test_raw_health_module_cannot_serialize_or_feed_checkin_delivery(self):
        for file in (IOS / 'NextVersionHealth/Sources/RilloraHeartRateKit').glob('*.swift'):
            self.assertNotRegex(file.read_text(), r'Codable|Encodable|JSONEncoder|URLSession|FileManager|UserDefaults|import RilloraCheckInKit|HKWorkoutSession|enableBackgroundDelivery')
        for file in KIT.glob('*.swift'):
            self.assertNotRegex(file.read_text(), r'import HealthKit|import RilloraHeartRateKit|HealthSample|HKQuantitySample|URLSession|URLRequest')
        widget = (IOS / 'NextVersionWatch/Widget/RilloraCheckInWidget.swift').read_text()
        self.assertNotRegex(widget, r'CheckInWatchCache|Keychain|HealthKit|appGroup|UserDefaults')

    def test_all_checkin_localization_keys_have_both_languages(self):
        copies = {}
        for language in ['en', 'zh-Hans']:
            text = (KIT / 'Resources' / (language + '.lproj') / 'Localizable.strings').read_text()
            copies[language] = {json.loads(k): json.loads(v) for k, v in re.findall(r'^("(?:[^"\\]|\\.)*") = ("(?:[^"\\]|\\.)*");$', text, re.M)}
        self.assertEqual(set(copies['en']), set(copies['zh-Hans']))
        literals = set()
        for file in KIT.glob('*.swift'):
            literals.update(re.findall(r'CheckInText\.get\("([^".]+)"\)', file.read_text()))
        self.assertFalse(literals - copies['en'].keys())
        for value in copies['zh-Hans'].values(): self.assertRegex(value, r'[\u4e00-\u9fff]')

    def test_notification_catalogue_is_next_only_and_deferred(self):
        notice = json.loads((IOS / 'NextVersionCheckIn/Configuration/NotificationStrings.xcstrings').read_text())['strings']
        current = json.loads((IOS / 'Rillora/Resources/Localizable.xcstrings').read_text())['strings']
        self.assertFalse(set(notice) & set(current))
        self.assertEqual(len(notice), 2)
        for entry in notice.values():
            self.assertEqual(set(entry['localizations']), {'en', 'zh-Hans'})
        source = (KIT / 'CheckInNotifications.swift').read_text()
        for key in notice:
            self.assertIn('localizedUserNotificationString(forKey: "' + key + '"', source)

    def test_watch_app_reuses_the_exact_selected_brand_icon(self):
        original = IOS / 'Rillora/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'
        watch = IOS / 'NextVersionWatch/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'
        self.assertEqual(hashlib.sha256(original.read_bytes()).digest(), hashlib.sha256(watch.read_bytes()).digest())


if __name__ == '__main__': unittest.main()
