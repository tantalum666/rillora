import SwiftUI

struct ApplePurchaseSection: View {
    let purchase: ApplePurchaseCoordinator
    let subscription: CommerceSubscription?

    var body: some View {
        Section {
            if subscription == nil, let product = purchase.product, let displayedQuote = purchase.quote {
                VStack(alignment: .leading, spacing: 20) {
                    Text(String(localized: "Family"))
                        .font(.system(.title, design: .serif).weight(.medium))
                        .foregroundStyle(RilloraTheme.ink)
                    VStack(alignment: .leading, spacing: 12) {
                        Label(String(localized: "5 live recipients (Free: 1)"), systemImage: "person.2")
                        Label(String(localized: "Review shared information together"), systemImage: "checklist")
                        Label(String(localized: "Approve corrections suggested by one trusted person"), systemImage: "pencil.line")
                    }
                    .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
                    Text(String(format: String(localized: "%@ / year"), product.displayPriceWithCurrency))
                        .font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                        .accessibilityIdentifier("apple-purchase.price")
                    if purchase.environment == .sandbox {
                        Label(String(localized: "Apple test purchase · No charge"), systemImage: "testtube.2")
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                    if purchase.pending?.state != "pending" {
                        Button {
                            Task { await purchase.purchase(accepting: displayedQuote) }
                        } label: {
                            Label(purchase.busy ? String(localized: "Checking purchase…") : String(localized: "Subscribe with Apple"), systemImage: "apple.logo")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(RilloraPrimaryActionButtonStyle())
                        .disabled(purchase.busy)
                        .accessibilityIdentifier("apple-purchase.subscribe")
                        Text(String(localized: "By subscribing, you agree to the Subscription Terms. Renews yearly at the price above until canceled in Apple Settings."))
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: 16) { policyLinks }
                            VStack(alignment: .leading, spacing: 10) { policyLinks }
                        }
                        .font(.footnote)
                    }
                }
                .padding(.vertical, 8)
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
