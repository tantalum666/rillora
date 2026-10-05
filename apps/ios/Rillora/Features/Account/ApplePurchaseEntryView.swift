import SwiftUI

/// An App Store intent opens the existing plan flow. It never implies consent,
/// reserves an order, or opens a payment sheet before the user chooses to buy.
struct ApplePurchaseEntryView: View {
    let store: OverviewStore
    let authentication: AuthenticationStore
    let commerce: CommerceStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if case .loaded(let snapshot) = store.state {
                    PlanAccessView(store: commerce, appAccountToken: UUID(uuidString: snapshot.session.plannerPublicId))
                } else {
                    ContentUnavailableView {
                        Label(String(localized: "Continue with Rillora"), systemImage: "person.crop.circle")
                    } description: {
                        Text(authentication.errorMessage ?? String(localized: "Sign in to choose the account for your subscription."))
                    } actions: {
                        Button(authentication.isWorking ? String(localized: "Signing in…") : String(localized: "Sign in / up")) {
                            Task { _ = await authentication.signIn() }
                        }
                        .disabled(authentication.isWorking)
                    }
                    .navigationTitle(String(localized: "Plan & access"))
                }
            }
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(String(localized: "Close")) { dismiss() } } }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
