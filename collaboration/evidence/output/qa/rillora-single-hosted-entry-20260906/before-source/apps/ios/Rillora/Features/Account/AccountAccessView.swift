import AuthenticationServices
import SwiftUI

struct AccountAccessView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

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
                        TextField(
                            "Email address",
                            text: $email,
                            prompt: Text(verbatim: "you@example.com").foregroundColor(RilloraTheme.muted)
                        )
                            .font(.body)
                            .foregroundColor(RilloraTheme.body)
                            .tint(RilloraTheme.tabSelection)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textContentType(.emailAddress)
                            .focused($isEmailFocused)
                            .submitLabel(.done)
                            .onSubmit { isEmailFocused = false }
                            .disabled(authenticationStore.isWorking)
                            .padding(.horizontal, 14)
                            .frame(minHeight: 52)
                            .background(
                                RilloraTheme.surface,
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                            )
                            .overlay {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(isEmailFocused ? RilloraTheme.sage : RilloraTheme.divider, lineWidth: 1)
                            }
                            .accessibilityLabel("Email address")
                            .accessibilityIdentifier("account-access.email")
                    }

                    AccountLegalConsentControl(isAccepted: $hasAccepted)
                        .disabled(authenticationStore.isWorking)

                    if let errorMessage = authenticationStore.errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.circle")
                            .font(.subheadline)
                            .foregroundStyle(RilloraTheme.body)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("account-access.error")
                    }

                    Button(action: continueWithEmail) {
                        HStack(spacing: 10) {
                            Text(authenticationStore.isWorking ? "Opening…" : "Continue with email")
                            Spacer()
                            if !dynamicTypeSize.isAccessibilitySize {
                                Image(systemName: "arrow.right")
                                    .accessibilityHidden(true)
                            }
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
                                if !dynamicTypeSize.isAccessibilitySize {
                                    Image(systemName: "person.badge.key.fill")
                                        .foregroundStyle(RilloraTheme.clay)
                                        .accessibilityHidden(true)
                                }
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
                            if !dynamicTypeSize.isAccessibilitySize {
                                Image(systemName: "ellipsis.circle")
                                    .accessibilityHidden(true)
                            }
                            Text("Other sign-in methods")
                            Spacer()
                            if !dynamicTypeSize.isAccessibilitySize {
                                Image(systemName: "arrow.up.right")
                                    .accessibilityHidden(true)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(RilloraTheme.muted)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .disabled(!canUseAnotherMethod)
                    .opacity(canUseAnotherMethod ? 1 : 0.55)
                    .accessibilityIdentifier("account-access.hosted-fallback")
                }
                .frame(maxWidth: 520, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 22)
                .padding(.bottom, 36)
            }
            .scrollIndicators(.hidden)
            .accessibilityIdentifier("account-access.scroll")
            .scrollDismissesKeyboard(.interactively)
            .background(RilloraTheme.canvas.ignoresSafeArea())
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        authenticationStore.errorMessage = nil
                        dismiss()
                    }
                        .disabled(authenticationStore.isWorking)
                        .accessibilityIdentifier("account-access.cancel")
                }
            }
        }
        .tint(RilloraTheme.tabSelection)
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
        isEmailFocused = false
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
            Text("Your private map")
                .font(.system(.title, design: .serif).weight(.medium))
                .foregroundStyle(RilloraTheme.ink)
            Text("Sign in or create an account.")
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
            .accessibilityLabel("Agree to the Terms, acknowledge the Privacy Policy, and consent to electronic records")
            .accessibilityValue(isAccepted ? "Checked" : "Unchecked")
            .accessibilityIdentifier("account-access.legal-consent")

            VStack(alignment: .leading, spacing: 3) {
                Text(agreement)
                    .font(.caption2)
                    .foregroundStyle(RilloraTheme.muted)
                    .tint(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Required for every sign-in method.")
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
            RilloraTheme.divider.frame(height: 1)
            Text("OR")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
            RilloraTheme.divider.frame(height: 1)
        }
        .frame(minHeight: 16)
        .accessibilityHidden(true)
    }
}

private struct AccountSecondaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(RilloraTheme.ink.opacity(isEnabled ? 1 : 0.46))
            .padding(.vertical, 12)
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
