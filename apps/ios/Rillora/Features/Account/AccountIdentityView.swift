import SwiftUI

struct AccountIdentityView: View {
    let plannerPublicID: String
    let service: (any AccountIdentityServing)?
    let onAuthenticationRequired: () -> Void
    @State private var store = AccountIdentityStore()

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Label(String(localized: "Signed-in account"), systemImage: "person.crop.circle")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
            if let identity = store.identity(for: plannerPublicID) {
                let name = identity.account.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
                if !name.isEmpty {
                    Text(verbatim: name)
                        .font(.headline)
                        .foregroundStyle(RilloraTheme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("profile.identity.name")
                }
                if let email = identity.displayedEmail {
                    Text(verbatim: email)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("profile.identity.email")
                } else {
                    accountReference
                    Text(identity.emailStatus == .notProvided
                         ? String(localized: "Your sign-in service has not provided a verified email.")
                         : String(localized: "Your account email is temporarily unavailable."))
                        .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    if identity.emailStatus != .notProvided { retryButton }
                }
            } else if store.state == .loading || store.state == .idle || store.plannerPublicID != plannerPublicID {
                Text(String(localized: "Loading account information…"))
                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
            } else {
                accountReference
                Text(String(localized: "Account information is temporarily unavailable."))
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
                if service != nil { retryButton }
            }
        }
        .padding(.vertical, 6)
        .privacySensitive()
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("profile.identity")
        .task(id: plannerPublicID) {
            await store.load(plannerPublicID: plannerPublicID, service: service)
        }
        .onChange(of: store.state) { _, state in
            if state == .authenticationRequired { onAuthenticationRequired() }
        }
        .onDisappear { store.cancelPendingLoad() }
    }

    private var accountReference: some View {
        Group {
            if let publicID = UUID(uuidString: plannerPublicID) {
                Text(L10n.format("Account reference: %1$@", String(publicID.uuidString.lowercased().suffix(8))))
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    .accessibilityIdentifier("profile.identity.reference")
            }
        }
    }

    private var retryButton: some View {
        Button(String(localized: "Refresh account information")) {
            Task { await store.load(plannerPublicID: plannerPublicID, service: service, force: true) }
        }
        .font(.subheadline)
        .disabled(store.state == .loading)
        .accessibilityIdentifier("profile.identity.retry")
    }
}
