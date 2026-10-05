import SwiftUI

struct ApplePurchaseSection: View {
    let purchase: ApplePurchaseCoordinator
    let subscription: CommerceSubscription?
    @State private var acceptedTerms = false

    var body: some View {
        Section {
            if purchase.environment == .sandbox {
                Label(String(localized: "Apple test purchase · No charge"), systemImage: "testtube.2")
                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
            }
            if subscription == nil, let product = purchase.product, purchase.quote != nil {
                LabeledContent(String(localized: "Family · yearly"), value: product.displayPrice)
                    .foregroundStyle(RilloraTheme.ink)
                Text(String(localized: "5 live recipients · Shared reviews"))
                    .font(.subheadline).foregroundStyle(RilloraTheme.body)
                if purchase.pending?.state != "pending" {
                    Text("Subscription consent is shown in English. The English text is authoritative.")
                        .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    Toggle(isOn: $acceptedTerms) {
                        Text(verbatim: "I agree to the subscription terms and yearly renewal at \(product.displayPrice). I can cancel in Apple Settings.")
                            .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    }
                    .tint(RilloraTheme.sage)
                    .disabled(purchase.busy)
                    .accessibilityIdentifier("apple-purchase.consent")
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 16) { policyLinks }
                        VStack(alignment: .leading, spacing: 10) { policyLinks }
                    }
                    .font(.footnote)
                    Button {
                        Task { await purchase.purchase(acceptedTerms: acceptedTerms) }
                    } label: {
                        Label(purchase.busy ? String(localized: "Checking purchase…") : String(localized: "Subscribe with Apple"), systemImage: "apple.logo")
                    }
                    .disabled(!acceptedTerms || purchase.busy)
                    .accessibilityIdentifier("apple-purchase.subscribe")
                }
            }
            if subscription?.renewalProvider == "storekit" {
                Link(String(localized: "Manage Apple subscription"), destination: URL(string: "https://apps.apple.com/account/subscriptions")!)
            }
            Button {
                Task { await purchase.restore() }
            } label: {
                Label(purchase.pending == nil ? String(localized: "Restore purchases") : String(localized: "Check pending purchase"), systemImage: "arrow.clockwise")
            }
            .disabled(purchase.busy)
            .accessibilityIdentifier("apple-purchase.restore")
            if let message = purchase.message {
                Text(message).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    .accessibilityIdentifier("apple-purchase.status")
            }
        }
        .onChange(of: purchase.quote) { _, _ in acceptedTerms = false }
    }

    @ViewBuilder private var policyLinks: some View {
        Link(String(localized: "Terms"), destination: RilloraLegalURLs.subscriptions)
            .fixedSize().frame(minHeight: 44)
        Link(String(localized: "Privacy"), destination: RilloraLegalURLs.privacy)
            .fixedSize().frame(minHeight: 44)
        Link(String(localized: "Refunds"), destination: RilloraLegalURLs.refunds)
            .fixedSize().frame(minHeight: 44)
    }
}
