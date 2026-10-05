"""Dependency-free native catalog/wiring regression checks, also run by source CI.

These tests do not compile Swift, compile string catalogs, or replace Simulator QA.
"""
import json
from pathlib import Path
import plistlib
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
APP = IOS / 'Rillora'
CATALOG = APP / 'Resources/Localizable.xcstrings'
PLACEHOLDER = re.compile(r'%(?:\d+\$)?(?:lld|llu|ld|lu|[difu@])')
LITERAL = r'"(?:\\.|[^"\\])*"'
EXPLICIT = re.compile(r'(?:String\(localized:\s*|L10n\.format\(\s*)(' + LITERAL + ')')
STATIC_UI = re.compile(r'(?:Text|Button|Label|Section|Toggle|Link|Picker|ProgressView|ContentUnavailableView|LabeledContent|navigationTitle|accessibilityLabel|accessibilityValue|confirmationDialog|alert)\(\s*(' + LITERAL + ')')


def units(node):
    if 'stringUnit' in node:
        yield node['stringUnit']
    for value in node.values():
        if isinstance(value, dict):
            yield from units(value)


class NativeLocalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(CATALOG.read_text())
        cls.strings = cls.catalog['strings']
        cls.pbx = (IOS / 'Rillora.xcodeproj/project.pbxproj').read_text()

    def test_catalog_is_bilingual_with_english_fallback(self):
        self.assertEqual(self.catalog['sourceLanguage'], 'en')
        self.assertEqual(self.catalog['version'], '1.0')
        self.assertGreater(len(self.strings), 0)
        for key, entry in self.strings.items():
            self.assertEqual(set(entry['localizations']), {'en', 'zh-Hans'}, key)
            for language, localized in entry['localizations'].items():
                translated = list(units(localized))
                self.assertTrue(translated, (key, language))
                for unit in translated:
                    self.assertEqual(unit['state'], 'translated', key)
                    self.assertTrue(unit['value'].strip(), key)

    def test_placeholders_match_in_every_language_and_plural(self):
        for key, entry in self.strings.items():
            expected = sorted(PLACEHOLDER.findall(key))
            for unit in units(entry):
                self.assertEqual(sorted(PLACEHOLDER.findall(unit['value'])), expected, (key, unit['value']))

    def test_all_explicit_and_static_ui_keys_exist(self):
        ignored = {'', 'Rillora', 'English', '简体中文'}
        for path in APP.rglob('*.swift'):
            source = path.read_text()
            for pattern in (EXPLICIT, STATIC_UI):
                for match in pattern.finditer(source):
                    raw = match[1]
                    # Explicit numbered templates are inspectable without Xcode extraction.
                    self.assertNotIn('\\(', raw, (str(path.relative_to(ROOT)), raw))
                    key = json.loads(raw)
                    if key in ignored or not re.search('[A-Za-z]', key):
                        continue
                    self.assertTrue(key in self.strings, (str(path.relative_to(ROOT)), key))

    def test_glossary_does_not_confuse_disclosure_and_ownership(self):
        expected = {'Matters': '事项', 'Name': '名称', 'Directions': '查找指引',
                    'Details': '已保存的详细信息', 'Trusted contact': '可信联系人',
                    'Profile': '个人中心', 'Language': '语言'}
        for key, value in expected.items():
            self.assertEqual(self.strings[key]['localizations']['zh-Hans']['stringUnit']['value'], value)

    def test_count_messages_have_native_plural_variants(self):
        plural_count = 0
        for entry in self.strings.values():
            english = entry['localizations']['en']
            if 'variations' in english and 'plural' in english['variations']:
                plural_count += 1
                self.assertTrue({'one', 'other'} <= set(english['variations']['plural']))
                chinese = entry['localizations']['zh-Hans']
                if 'variations' in chinese:
                    self.assertIn('other', chinese['variations']['plural'])
                else:
                    self.assertIn('stringUnit', chinese)
        self.assertGreaterEqual(plural_count, 8)

    def test_app_and_preview_advertise_supported_languages(self):
        for relative in ['Rillora/Resources/Info.plist', 'RilloraComponentPreview/Info.plist']:
            with (IOS / relative).open('rb') as file:
                info = plistlib.load(file)
            self.assertEqual(info['CFBundleLocalizations'], ['en', 'zh-Hans'])
            self.assertTrue(info['UIPrefersShowingLanguageSettings'])
        spec = (IOS / 'project.yml').read_text()
        self.assertEqual(spec.count('CFBundleLocalizations: [en, zh-Hans]'), 2)
        self.assertIn('SWIFT_EMIT_LOC_STRINGS: true', spec)

    def test_resources_and_sources_are_wired_into_committed_project(self):
        # One resource build file + one phase reference per app/preview target.
        self.assertEqual(self.pbx.count('Localizable.xcstrings in Resources'), 4)
        self.assertIn('"zh-Hans",', self.pbx)
        for name in ['L10n.swift', 'AppLanguageView.swift']:
            self.assertEqual(self.pbx.count('/* ' + name + ' in Sources */'), 4, name)
        for name in ['LocalizationTests.swift', 'AccountLocalizationTests.swift', 'CoreLocalizationTests.swift', 'SharingLocalizationTests.swift']:
            self.assertEqual(self.pbx.count('/* ' + name + ' in Sources */'), 2, name)
        def block(identifier):
            start = self.pbx.index('\t\t' + identifier + ' /*')
            # Select the object definition, not an earlier parent reference.
            match = re.search(r'^\t\t' + identifier + r' /\*[^\n]+\*/ = \{(.*?)^\t\t\};', self.pbx, re.M | re.S)
            self.assertIsNotNone(match, identifier)
            return match[1]
        for name in ['L10n.swift', 'AppLanguageView.swift']:
            self.assertIn('/* ' + name + ' */', block('8DBBDD7E49AEC3D4E5F112C1'))
            for phase in ['55776018252F13489998B302', '8159291C6B711935D5264660']:
                self.assertIn('/* ' + name + ' in Sources */', block(phase))
        self.assertIn('/* Localizable.xcstrings */', block('AB6DAB15075C8FEAF3947E48'))
        for phase in ['EDD27869EF70E4DC9B4F02C6', '1F16E6A03A6B5CA29F88F532']:
            self.assertIn('/* Localizable.xcstrings in Resources */', block(phase))
        for name in ['LocalizationTests.swift', 'AccountLocalizationTests.swift', 'CoreLocalizationTests.swift', 'SharingLocalizationTests.swift']:
            self.assertIn('/* ' + name + ' */', block('C3534E5969EE148FB9508306'))
            self.assertIn('/* ' + name + ' in Sources */', block('17D774C38941D49F29094DBA'))

    def test_language_settings_preserve_os_ownership_and_view_identity(self):
        language = (APP / 'Core/Design/AppLanguageView.swift').read_text()
        self.assertIn('UIApplication.openSettingsURLString', language)
        self.assertIn('Save your changes before switching languages.', language)
        for path in APP.rglob('*.swift'):
            source = re.sub(r'//[^\n]*', '', path.read_text())
            self.assertNotRegex(source, r'set\([^\n]*forKey:\s*"AppleLanguages"')
            self.assertNotRegex(source, r'\.id\([^\n]*(?:[Ll]anguage|[Ll]ocale)')
        profile = (APP / 'Features/Account/AccountView.swift').read_text()
        self.assertLess(profile.index('AppLanguageButton()'), profile.index('AppAppearanceMenu()'))

    def test_raw_sharing_values_and_confirmation_token_are_preserved(self):
        source = (APP / 'Core/Domain/SharingModels.swift').read_text()
        self.assertRegex(source, r'case\s+name,\s*directions,\s*details')
        deletion = (APP / 'Features/Account/AccountDeletionView.swift').read_text()
        self.assertIn('"DELETE"', deletion)
        # Display translations are never keys for private payload/identifier lookup.
        for path in APP.rglob('*.swift'):
            for match in re.finditer(r'String\(localized:\s*([^\s])', path.read_text()):
                self.assertEqual(match[1], '"', str(path.relative_to(ROOT)))


if __name__ == '__main__':
    unittest.main()
