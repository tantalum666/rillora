import AuthenticationServices
import SwiftUI

struct AccountAccessView: View {
    @Environment(\.dismiss) private var dismiss

    let authenticationStore: AuthenticationStore
    let onAuthenticated: () -> Void

    @State private var email = ""
    @State private var hasAccepted = false
    @FocusState private var isEmailFocused: Bool

    private var normalizedEmail: String {
        AccountAccessValidation.normalizedEmail(email)
    }

    private var canUseEmail: Bool {
        hasAccepted
            && AccountAccessValidation.isValidEmail(normalizedEmail)
            && !authenticationStore.isWorking
    }

    private var canUseAnotherMethod: Bool {
        hasAccepted && !authenticationStore.isWorking
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    AccountAccessHeader()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email address")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(RilloraTheme.body)
                        TextField("you@example.com", text: $email)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textContentType(.emailAddress)
                            .focused($isEmailFocused)
                            .padding(.horizontal, 14)
                            .frame(minHeight: 52)
                            .background(
                                RilloraTheme.canvas,
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                            )
                            .overlay {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(RilloraTheme.divider, lineWidth: 1)
                            }
                            .accessibilityIdentifier("account-access.email")
                    }

                    AccountLegalConsentControl(isAccepted: $hasAccepted)

                    Button(action: continueWithEmail) {
                        HStack(spacing: 10) {
                            Text(authenticationStore.isWorking ? "Opening…" : "Continue with email")
                            Spacer()
                            Image(systemName: "arrow.right")
                                .accessibilityHidden(true)
                        }
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .disabled(!canUseEmail)
                    .accessibilityIdentifier("account-access.email-continue")

                    AccountMethodDivider()

                    if authenticationStore.canSignInWithApple {
                        SignInWithAppleButton(.continue) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { result in
                            continueWithApple(result)
                        }
                        .signInWithAppleButtonStyle(.whiteOutline)
                        .frame(height: 52)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .disabled(!canUseAnotherMethod)
                        .opacity(canUseAnotherMethod ? 1 : 0.46)
                        .accessibilityIdentifier("account-access.apple")
                    }

                    if authenticationStore.canSignInWithGoogle {
                        Button(action: continueWithGoogle) {
                            HStack(spacing: 12) {
                                Image("GoogleGLogo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 20, height: 20)
                                    .accessibilityHidden(true)
                                Text("Continue with Google")
                                Spacer()
                            }
                        }
                        .buttonStyle(AccountSecondaryButtonStyle())
                        .disabled(!canUseAnotherMethod)
                        .accessibilityIdentifier("account-access.google")
                    }

                    if authenticationStore.canSignInWithPasskey {
                        Button(action: continueWithPasskey) {
                            HStack(spacing: 12) {
                                Image(systemName: "person.badge.key.fill")
                                    .foregroundStyle(RilloraTheme.clay)
                                    .accessibilityHidden(true)
                                Text("Continue with a passkey")
                                Spacer()
                            }
                        }
                        .buttonStyle(AccountSecondaryButtonStyle())
                        .disabled(!canUseAnotherMethod)
                        .accessibilityIdentifier("account-access.passkey")
                    }

                    Button(action: continueWithHostedFallback) {
                        HStack(spacing: 10) {
                            Image(systemName: "ellipsis.circle")
                                .accessibilityHidden(true)
                            Text("Other sign-in methods")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .accessibilityHidden(true)
                        }
                    }
                    .buttonStyle(AccountSecondaryButtonStyle())
                    .disabled(!canUseAnotherMethod)
                    .accessibilityIdentifier("account-access.hosted-fallback")

                    Text("Account recovery and any methods not shown here continue securely on login.rillora.xyz.")
                        .font(.caption2)
                        .foregroundStyle(RilloraTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)

                    if let errorMessage = authenticationStore.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(RilloraTheme.clay)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("account-access.error")
                    }
                }
                .frame(maxWidth: 520, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 22)
                .padding(.bottom, 36)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .background(RilloraTheme.canvas.ignoresSafeArea())
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: dismiss.callAsFunction)
                        .disabled(authenticationStore.isWorking)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func continueWithEmail() {
        guard canUseEmail else { return }
        authenticate {
            await authenticationStore.signIn(
                loginHint: normalizedEmail,
                legalAcceptance: .current
            )
        }
    }

    private func continueWithHostedFallback() {
        guard canUseAnotherMethod else { return }
        authenticate {
            await authenticationStore.signIn(legalAcceptance: .current)
        }
    }

    private func continueWithGoogle() {
        guard canUseAnotherMethod else { return }
        authenticate {
            await authenticationStore.signInWithGoogle(legalAcceptance: .current)
        }
    }

    private func continueWithPasskey() {
        guard canUseAnotherMethod else { return }
        authenticate {
            await authenticationStore.signInWithPasskey(legalAcceptance: .current)
        }
    }

    private func continueWithApple(_ result: Result<ASAuthorization, Error>) {
        guard canUseAnotherMethod else { return }
        authenticate {
            await authenticationStore.signInWithApple(
                result: result,
                legalAcceptance: .current
            )
        }
    }

    private func authenticate(_ action: @escaping @MainActor () async -> Bool) {
        Task {
            guard await action() else { return }
            dismiss()
            onAuthenticated()
        }
    }
}

enum AccountAccessValidation {
    static func normalizedEmail(_ email: String) -> String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    static func isValidEmail(_ email: String) -> Bool {
        email.count <= 254
            && email.range(
                of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#,
                options: .regularExpression
            ) != nil
    }
}

private struct AccountAccessHeader: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Rillora")
                .font(.system(.title3, design: .serif).weight(.bold))
                .foregroundStyle(RilloraTheme.ink)
            Text("Sign in or create an account")
                .font(.title2.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text("Access your private map.")
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.muted)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct AccountLegalConsentControl: View {
    @Binding var isAccepted: Bool

    private var agreement: AttributedString {
        (try? AttributedString(
            markdown: "I agree to the [Terms](https://legal.rillora.xyz/terms), acknowledge the [Privacy Policy](https://legal.rillora.xyz/privacy), and consent to electronic records.",
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        )) ?? AttributedString("I agree to the Terms, acknowledge the Privacy Policy, and consent to electronic records.")
    }

    var body: some View {
        HStack(alignment: .top, spacing: 6) {
            Button {
                isAccepted.toggle()
            } label: {
                Image(systemName: isAccepted ? "checkmark.square.fill" : "square")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(isAccepted ? RilloraTheme.tabSelection : RilloraTheme.muted)
                    .frame(width: 44, height: 44, alignment: .top)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Agree to the Terms, Privacy Policy, and electronic records")
            .accessibilityValue(isAccepted ? "Checked" : "Unchecked")
            .accessibilityIdentifier("account-access.legal-consent")

            VStack(alignment: .leading, spacing: 3) {
                Text(agreement)
                    .font(.caption2)
                    .foregroundStyle(RilloraTheme.muted)
                    .tint(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Required for account access. No recurring charge.")
                    .font(.caption2)
                    .foregroundStyle(RilloraTheme.muted.opacity(0.84))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.top, 2)
        }
    }
}

private struct AccountMethodDivider: View {
    var body: some View {
        HStack(spacing: 12) {
            Divider().overlay(RilloraTheme.divider)
            Text("OR")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
            Divider().overlay(RilloraTheme.divider)
        }
        .frame(height: 16)
        .accessibilityHidden(true)
    }
}

private struct AccountSecondaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(RilloraTheme.ink.opacity(isEnabled ? 1 : 0.46))
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 14)
            .background(
                RilloraTheme.surface,
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(RilloraTheme.divider, lineWidth: 1)
            }
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .opacity(configuration.isPressed ? 0.72 : 1)
    }
}
