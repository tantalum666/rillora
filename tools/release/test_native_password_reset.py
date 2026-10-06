"""Static reset boundary guards. No native compilation or provider request is performed."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "apps/ios/Rillora"


def function_body(source, signature):
    start = source.index(signature)
    start = source.index("{", start)
    depth = 1
    for end in range(start + 1, len(source)):
        depth += (source[end] == "{") - (source[end] == "}")
        if depth == 0:
            return source[start + 1:end]
    raise AssertionError("Unbalanced function body")


class NativePasswordResetContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.configuration = (APP / "Core/API/APIConfiguration.swift").read_text()
        cls.service = (APP / "Core/Authentication/NativeAuthenticationService.swift").read_text()
        cls.authentication = (APP / "Core/Authentication/AuthenticationStore.swift").read_text()
        cls.store = (APP / "Core/Authentication/PasswordResetStore.swift").read_text()
        cls.view = (APP / "Features/Account/PasswordResetView.swift").read_text()
        cls.tests = (ROOT / "apps/ios/RilloraTests/PasswordResetTests.swift").read_text()

    def test_unknown_connection_fails_closed_without_breaking_signin(self):
        self.assertIn("passwordResetConnection: String? = nil", self.configuration)
        self.assertIn('connection == "Username-Password-Authentication" ? connection : nil', self.configuration)
        self.assertIn('"RILLORA_PASSWORD_RESET_CONNECTION"', self.configuration)
        self.assertIn('"RilloraPasswordResetConnection"', self.configuration)
        production = function_body(self.configuration, "func validateProduction()")
        self.assertNotIn("passwordResetConnection", production)
        self.assertIn("var canResetPassword: Bool { false }", self.service)
        self.assertIn("throw PasswordResetError.unavailable", self.service)

    def test_only_public_authentication_reset_api_is_used(self):
        implementation = self.service.split("final class Auth0NativeAuthenticationService", 1)[1]
        reset = function_body(implementation, "func requestPasswordReset(email: String)")
        self.assertIn("configuration.passwordResetConnection", reset)
        self.assertIn("PasswordResetEmail.normalized(email)", reset)
        self.assertIn(".authentication(clientId: configuration.clientID, domain: configuration.domain, session: session)", reset)
        self.assertIn(".resetPassword(email: email, connection: connection)", reset)
        self.assertIn(".start()", reset)
        for forbidden in [".scope(", ".webAuth(", "tokenStore.", "establishRilloraSession(",
                          "sessionExchangeURL", ".login(", ".logging(", "print(", "debugDescription", "error.localizedDescription"]:
            self.assertNotIn(forbidden, reset)

    def test_errors_are_safe_and_cancellation_does_not_show_success(self):
        reset = function_body(self.service.split("final class Auth0NativeAuthenticationService", 1)[1],
                              "func requestPasswordReset(email: String)")
        self.assertIn("providerError.statusCode == 429", reset)
        self.assertIn("providerError.isTooManyAttempts", reset)
        self.assertIn("providerError.isNetworkError", reset)
        self.assertIn("providerError.cause as? URLError", reset)
        self.assertIn("throw PasswordResetError.requestFailed", reset)
        self.assertGreaterEqual(reset.count("Task.checkCancellation()"), 2)
        self.assertIn("error as? PasswordResetError ?? .requestFailed", self.store)
        self.assertNotIn("error.localizedDescription", self.store)
        self.assertIn("activeRequestID == requestID", self.store)

    def test_reset_does_not_touch_global_session_or_authentication_state(self):
        reset = function_body(self.authentication, "func requestPasswordReset(email: String)")
        self.assertEqual(reset.strip(), "try await service.requestPasswordReset(email: email)")
        for forbidden in ["overviewStore", "commerceStore", "deletionReference", "isWorking", "errorMessage"]:
            self.assertNotIn(forbidden, reset)
        # Existing backend capability remains, even when removed from visible navigation.
        self.assertIn("func signOutAll() async throws", self.service)
        self.assertIn('allDevices ? "auth/logout-all" : "auth/logout"', self.service)

    def test_native_screen_requires_an_explicit_button_and_no_password(self):
        self.assertIn("init(authenticationStore: AuthenticationStore)", self.view)
        self.assertIn("PasswordResetStore(service: authenticationStore)", self.view)
        self.assertIn("Button(action: submit)", self.view)
        self.assertIn("guard store.canSubmit else { return }", self.view)
        self.assertIn("requestTask = Task { _ = await store.submit() }", self.view)
        self.assertNotIn(".task", self.view)
        self.assertNotIn(".onAppear", self.view)
        self.assertNotIn("SecureField", self.view)
        self.assertNotIn(".openURL", self.view)
        self.assertIn(".onSubmit { emailIsFocused = false }", self.view)
        self.assertIn(".textInputAutocapitalization(.never)", self.view)
        self.assertIn(".keyboardType(.emailAddress)", self.view)
        self.assertIn(".privacySensitive()", self.view)
        self.assertIn("Manage Apple or Google passwords with that provider.", self.view)

    def test_email_is_ephemeral_and_late_results_are_ignored(self):
        self.assertIn('var email = ""', self.store)
        self.assertIn("guard !isSending, !isSubmitted, !Task.isCancelled", self.store)
        self.assertIn("requestTask?.cancel()", self.view)
        self.assertIn("store.clear()", self.view)
        clear = function_body(self.store, "func clear()")
        self.assertIn("activeRequestID = nil", clear)
        self.assertIn('email = ""', clear)
        for source in [self.store, self.view]:
            for forbidden in ["UserDefaults", "AppStorage", "SceneStorage", "Keychain", "print(", "Logger(", "session.email", "profile.email"]:
                self.assertNotIn(forbidden, source)

    def test_confirmation_is_conditional_not_a_delivery_claim(self):
        self.assertIn("If this email has an eligible password account", self.store)
        self.assertIn("Check your spam folder too.", self.store)
        for source in [self.store, self.view]:
            self.assertNotIn('String(localized: "Email sent', source)
            self.assertNotIn('String(localized: "Password changed', source)
        catalog = json.loads((APP / "Resources/Localizable.xcstrings").read_text())["strings"]
        key = "If this email has an eligible password account, you’ll receive a reset link. Check your spam folder too."
        self.assertTrue(key in catalog, "Merge the security localization fragment before final QA")
        self.assertEqual(catalog[key]["localizations"]["en"]["stringUnit"]["value"], key)
        self.assertTrue(catalog[key]["localizations"]["zh-Hans"]["stringUnit"]["value"].startswith("如果此邮箱"))

    def test_native_tests_cover_interruption_transport_and_session_isolation(self):
        for name in ["testOpeningAndEditingTheFormNeverSendsARequest", "testDuplicateSubmissionsAreIgnoredWhileRequestIsPending",
                     "testClearIgnoresLateCompletionAndDiscardsPrivateFormData", "testTaskCancellationCannotPublishSuccessOrFailure",
                     "testSDKRequestUsesOnlyReviewedPublicResetPayloadAndLeavesTokenUntouched",
                     "testSDKRateLimitNetworkAndFailureAreMappedWithoutProviderText",
                     "testResetDoesNotChangeGlobalAuthenticationOrOverviewState", "testBilingualConfirmationIsConditionalAndNeverClaimsDelivery"]:
            self.assertIn("func " + name, self.tests)
        self.assertIn("config.protocolClasses = [ResetURLProtocol.self]", self.tests)
        self.assertIn("override class func canInit(with request: URLRequest) -> Bool { true }", self.tests)


if __name__ == "__main__":
    unittest.main()
