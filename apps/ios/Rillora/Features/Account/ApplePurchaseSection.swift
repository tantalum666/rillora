import SwiftUI

struct ApplePurchaseSection: View {
    let purchase: ApplePurchaseCoordinator
    let subscription: CommerceSubscription?

    var body: some View {
        Section {
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
                .accessibilityIdentifier("apple-purchase.benefits")
                if let product = purchase.product ?? purchase.catalogProduct {
                    if subscription != nil {
                        Text(String(localized: "Current App Store price"))
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                    Text(String(format: String(localized: "%@ / year"), product.displayPriceWithCurrency))
                        .font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                        .accessibilityIdentifier("apple-purchase.price")
                } else if purchase.isLoadingQuote {
                    ProgressView(String(localized: "Loading App Store price…"))
                } else {
                    Text(String(localized: "App Store price is unavailable. Pull down to try again."))
                        .font(.footnote).foregroundStyle(RilloraTheme.muted)
                }
                if purchase.environment == .sandbox {
                    Label(String(localized: "Apple test purchase · No charge"), systemImage: "testtube.2")
                        .font(.footnote).foregroundStyle(RilloraTheme.muted)
                }
                if let subscription {
                    Label(String(localized: "Subscribed"), systemImage: "checkmark.circle.fill")
                        .font(.subheadline).foregroundStyle(RilloraTheme.sage)
                    if subscription.renewalProvider == "storekit" {
                        Link(destination: URL(string: "https://apps.apple.com/account/subscriptions")!) {
                            Text(String(localized: "Manage Apple subscription"))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(RilloraPrimaryActionButtonStyle())
                        .accessibilityIdentifier("apple-purchase.manage")
                    }
                } else if purchase.pending?.state != "pending" {
                    let displayedQuote = purchase.quote
                    Button {
                        Task { await purchase.purchase(accepting: displayedQuote) }
                    } label: {
                        Label(purchase.busy ? String(localized: "Checking purchase…") : String(localized: "Subscribe with Apple"), systemImage: "apple.logo")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .disabled(purchase.busy || displayedQuote == nil)
                    .accessibilityIdentifier("apple-purchase.subscribe")
                    if displayedQuote == nil, purchase.catalogProduct != nil, !purchase.isLoadingQuote {
                        Text(String(localized: "Purchases are temporarily unavailable. Pull down to try again."))
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
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
            Button {
                Task { await purchase.restore() }
            } label: {
                Label(purchase.pending == nil ? String(localized: "Restore purchases") : String(localized: "Check pending purchase"), systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderless)
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
