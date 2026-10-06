"""Source-level native UX regressions. These are not a substitute for Xcode/UI QA."""
import json
from pathlib import Path
import plistlib
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
APP = IOS / 'Rillora'


class NativeUXRefinementTests(unittest.TestCase):
    def test_bundled_guides_do_not_flash_unrelated_loading_row(self):
        source = (APP / 'Features/OfficialSetup/OfficialSetupView.swift').read_text()
        state = source[source.index('private var reviewStatus:'):source.index('private func guideRow')]
        loading = state[state.index('case .idle, .loading:'):state.index('case .failed')]
        self.assertIn('EmptyView()', loading)
        self.assertNotIn('ProgressView', loading)
        self.assertNotIn('Loading your review status', source)
        self.assertIn('case .failed(let message', state)
        self.assertIn('await setupStore.reload()', state)
        self.assertIn('Guides unavailable', source)

    def test_guides_keep_official_actions_without_duplicate_raw_links_or_acknowledgement(self):
        source = (APP / 'Features/OfficialSetup/OfficialSetupView.swift').read_text()
        for removed in ['Original source links', 'selfReportedCard', 'I reviewed this guide', 'setCompleted(', 'official-setup.toggle.']:
            self.assertNotIn(removed, source)
        self.assertIn('officialLinksCard', source)
        self.assertIn('guide.links(for: activePart)', source)
        self.assertIn('Link(destination: url)', source)
        self.assertIn('Sources reviewed %1$@. Requirements can change.', source)

    def test_safety_controls_are_actionable_and_credits_are_secondary(self):
        source = (APP / 'Features/Account/ProfileSupportViews.swift').read_text()
        for retired in ['RilloraSafeInformationChecklistView', 'RilloraReleaseSafeguardsView', 'profile.safety.safe-information', 'profile.safety.disclosure', 'profile.about.design-credits']:
            self.assertNotIn(retired, source)
        safety = source[source.index('struct RilloraSafetyPrivacyView'):source.index('struct AboutRilloraView')]
        self.assertIn('authenticationStore.canResetPassword', safety)
        self.assertIn('PasswordResetView(authenticationStore:', safety)
        self.assertIn('profile.safety.design-credits', safety)
        self.assertIn('Licenses & acknowledgements', safety)
        self.assertIn('.font(.footnote)', safety)
        self.assertIn('does not mean those protections are turned off', safety)
        self.assertNotIn('Toggle(', safety)
        self.assertTrue((APP / 'Resources/DesignCredits.txt').exists())

    def test_profile_preferences_are_secondary_for_both_session_states(self):
        profile = (APP / 'Features/Account/AccountView.swift').read_text()
        self.assertNotIn('AppAppearanceMenu()', profile)
        self.assertNotIn('AppLanguageButton()', profile)
        for path, identifier in [('Features/Account/AuthenticatedProfileContent.swift', 'profile.preferences'),
                                 ('Features/Overview/SignedOutExperienceViews.swift', 'public-profile.preferences')]:
            source = (APP / path).read_text()
            self.assertIn('AppPreferencesView()', source)
            self.assertIn(identifier, source)
        preferences = (APP / 'Features/Account/AppPreferencesView.swift').read_text()
        self.assertIn('AppAppearance.storageKey', preferences)
        self.assertIn('AppLanguageView()', preferences)
        self.assertNotIn('AppleLanguages', preferences)

    def test_only_current_signout_is_visible_but_revocation_implementation_is_retained(self):
        profile = (APP / 'Features/Account/AuthenticatedProfileContent.swift').read_text()
        self.assertEqual(profile.count('authenticationStore.signOut()'), 1)
        for removed in ['signOutAll()', 'account.sign-out-all', 'isConfirmingAllSessionRevocation']:
            self.assertNotIn(removed, profile)
        self.assertIn('func signOutAll()', (APP / 'Core/Authentication/AuthenticationStore.swift').read_text())
        self.assertIn('revokeSession(allDevices: true)', (APP / 'Core/Authentication/NativeAuthenticationService.swift').read_text())

    def test_disclosure_does_not_combine_row_height_with_spring_translation_or_press_scale(self):
        source = (APP / 'Core/Design/RilloraSurfaceMotion.swift').read_text()
        style = source[source.index('struct RilloraDisclosureStyle:'):source.index('/// List and Form')]
        self.assertIn('transaction.disablesAnimations = true', style)
        self.assertIn('withTransaction(transaction)', style)
        self.assertIn('.transition(.identity)', style)
        self.assertIn('.buttonStyle(.plain)', style)
        for removed in ['withAnimation(', 'RilloraMotion.reveal', 'RilloraMotion.contentReveal', 'RilloraQuietButtonStyle', 'scaleEffect', '.move(']:
            self.assertNotIn(removed, style)

    def test_identity_is_private_current_account_bound_and_transient(self):
        model = (APP / 'Core/Domain/AccountIdentityModels.swift').read_text()
        store = (APP / 'Features/Account/AccountIdentityStore.swift').read_text()
        view = (APP / 'Features/Account/AccountIdentityView.swift').read_text()
        self.assertIn('emailStatus == .available', model)
        self.assertIn('UUID(uuidString: account.publicId)', model)
        self.assertIn('result.belongs(to: expectedID)', store)
        self.assertIn('requestGeneration == generation', store)
        self.assertIn('!Task.isCancelled', store)
        self.assertIn('apiError.isAuthenticationRequired', store)
        self.assertIn('onAuthenticationRequired()', view)
        self.assertIn('.privacySensitive()', view)
        self.assertIn('Text(verbatim: email)', view)
        self.assertIn('Text(verbatim: name)', view)
        self.assertIn('identity(for: plannerPublicID)', view)
        for forbidden in ['UserDefaults', 'AppStorage', 'Keychain', 'print(', 'logger.', 'issuer', 'subject']:
            # Model comment may document excluded fields; inspect executable store/view.
            self.assertNotIn(forbidden, store + view)

    def test_identity_transport_has_only_authenticated_get_and_bounded_legacy_fallback(self):
        source = (APP / 'Core/API/APIClient.swift').read_text()
        function = source[source.index('    func fetchAccountIdentity()'):source.index('    func ', source.index('    func fetchAccountIdentity()') + 10)]
        self.assertIn('get("account/identity")', function)
        self.assertIn('server(status: 404', function)
        self.assertIn('fetchAccountDataProfile()', function)
        self.assertIn('verifiedEmail: nil', function)
        self.assertIn('emailStatus: .unavailable', function)
        for forbidden in ['POST', 'credentials', 'UserDefaults', 'queryItems', 'auth0.com']:
            self.assertNotIn(forbidden, function)

    def test_reviewed_reset_connection_is_explicit_in_build_spec_and_plist(self):
        spec = (IOS / 'project.yml').read_text()
        self.assertEqual(spec.count('RILLORA_PASSWORD_RESET_CONNECTION: "Username-Password-Authentication"'), 2)
        with (APP / 'Resources/Info.plist').open('rb') as file:
            info = plistlib.load(file)
        self.assertEqual(info['RilloraPasswordResetConnection'], '$(RILLORA_PASSWORD_RESET_CONNECTION)')
        self.assertEqual(info['CFBundleLocalizations'], ['en', 'zh-Hans'])

    def test_canonical_links_keep_phase_and_safety_boundaries(self):
        document = json.loads((ROOT / 'config/provider-guides.json').read_text())
        guides = {guide['id']: guide for guide in document['guides']}
        self.assertEqual(len(guides), 18)
        self.assertEqual(guides['microsoft']['links'][0]['urlString'], 'https://support.microsoft.com/en-us/accounts-billing/manage/accessing-outlook-com-onedrive-and-other-microsoft-services-when-someone-has-died')
        self.assertEqual(guides['x']['links'][1]['urlString'], 'https://help.x.com/en/forms/account-access/deactivate-or-close-account/deactivate-account-for-deceased')
        bitwarden = guides['password_manager']['links'][:2]
        self.assertEqual([link['phase'] for link in bitwarden], ['prepare', 'afterDeath'])
        self.assertIn('request-and-grant-emergency-access', bitwarden[1]['urlString'])
        self.assertTrue(all(link['urlString'].startswith('https://') for guide in guides.values() for link in guide['links']))
        self.assertEqual(set(document['selfReportedProviderKeys']), {'apple', 'google', 'meta', 'github', 'password_manager'})


if __name__ == '__main__':
    unittest.main()
