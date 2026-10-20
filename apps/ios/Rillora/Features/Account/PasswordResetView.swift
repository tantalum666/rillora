import SwiftUI

@MainActor
struct PasswordResetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var store: PasswordResetStore
    @State private var requestTask: Task<Void, Never>?
    @FocusState private var emailIsFocused: Bool

    init(authenticationStore: AuthenticationStore) {
        _store = State(initialValue: PasswordResetStore(service: authenticationStore))
    }

    var body: some View {
        @Bindable var store = store
        RilloraForm {
            if store.isSubmitted {
                Section {
                    Label(String(localized: "Check your email"), systemImage: "envelope")
                        .font(.headline)
                    Text(PasswordResetStore.confirmationMessage)
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("password-reset.confirmation")
                    Button(String(localized: "Done")) { dismiss() }
                        .accessibilityIdentifier("password-reset.done")
                }
            } else if !store.isAvailable {
                Section {
                    Text(PasswordResetError.unavailable.localizedDescription)
                        .foregroundStyle(RilloraTheme.body)
                }
            } else {
                Section {
                    TextField(String(localized: "Email address"), text: $store.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($emailIsFocused)
                        .submitLabel(.done)
                        .onSubmit { emailIsFocused = false }
                        .disabled(store.isSending)
                        .privacySensitive()
                        .accessibilityIdentifier("password-reset.email")
                } header: {
                    Text(String(localized: "Rillora account email"))
                } footer: {
                    Text(String(localized: "Enter the email used for your Rillora password account."))
                }

                Section {
                    Button(action: submit) {
                        Label(String(localized: "Send reset email"), systemImage: "envelope")
                    }
                    .disabled(!store.canSubmit)
                    .accessibilityIdentifier("password-reset.submit")
                    if store.isSending {
                        ProgressView(String(localized: "Requesting reset email…"))
                            .accessibilityIdentifier("password-reset.progress")
                    }
                    if let errorMessage = store.errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.circle")
                            .foregroundStyle(RilloraTheme.clay)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("password-reset.error")
                    }
                } footer: {
                    Text(String(localized: "This resets a Rillora email-and-password login. Manage Apple or Google passwords with that provider."))
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Reset password"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("password-reset.view")
        .onDisappear {
            requestTask?.cancel()
            requestTask = nil
            store.clear()
        }
    }

    private func submit() {
        guard store.canSubmit else { return }
        emailIsFocused = false
        requestTask = Task { _ = await store.submit() }
    }
}
