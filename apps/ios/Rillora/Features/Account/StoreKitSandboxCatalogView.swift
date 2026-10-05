import SwiftUI

struct StoreKitSandboxCatalogView: View {
    let store: CommerceStore

    var body: some View {
        List {
            Section {
                RilloraFactStrip([
                    .init(
                        title: store.storeKitSandboxPurchaseTestingEnabled
                            ? String(localized: "Sandbox purchase")
                            : String(localized: "Catalog only"),
                        systemImage: "shippingbox"
                    ),
                    .init(
                        title: store.storeKitSandboxPurchaseTestingEnabled
                            ? String(localized: "Server-gated finish")
                            : String(localized: "No purchase"),
                        systemImage: "lock.shield"
                    ),
                ])
            }

            Section(String(localized: "Current storefront")) {
                LabeledContent(
                    String(localized: "Storefront"),
                    value: store.storefrontCountryCode ?? String(localized: "Unavailable")
                )
            }

            Section(String(localized: "Rillora Family")) {
                if store.isStoreKitWorking {
                    ProgressView(String(localized: "Loading App Store products…"))
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else if store.storeKitProducts.isEmpty {
                    Label(String(localized: "Products unavailable"), systemImage: "exclamationmark.triangle")
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    ForEach(store.storeKitProducts) { product in
                        if store.storeKitSandboxPurchaseTestingEnabled {
                            Button {
                                Task {
                                    await store.purchaseStoreKitSandboxProduct(
                                        productID: product.productID
                                    )
                                }
                            } label: {
                                productRow(product, showsAction: true)
                            }
                            .buttonStyle(RilloraQuietButtonStyle())
                            .disabled(store.isStoreKitWorking)
                            .accessibilityIdentifier(
                                "storekit-sandbox.purchase.\(RilloraStoreKitCatalog.billingInterval(for: product.productID) ?? product.productID)"
                            )
                        } else {
                            productRow(product, showsAction: false)
                                .accessibilityElement(children: .combine)
                                .accessibilityIdentifier(
                                    "storekit-sandbox.product.\(RilloraStoreKitCatalog.billingInterval(for: product.productID) ?? product.productID)"
                                )
                        }
                    }
                }

                if let message = store.storeKitMessage {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.body)
                }
            }

            if store.storeKitSandboxPurchaseTestingEnabled {
                Section(String(localized: "Server gate")) {
                    if let status = store.storeKitSandboxServerStatus {
                        LabeledContent(String(localized: "Last server state"), value: status)
                    }
                    if store.storeKitSandboxTransactionPending {
                        Button {
                            Task {
                                await store.retryStoreKitSandboxServerVerification()
                            }
                        } label: {
                            Label(String(localized: "Retry authoritative verification"), systemImage: "arrow.clockwise")
                        }
                        .disabled(store.isStoreKitWorking)
                        .accessibilityIdentifier("storekit-sandbox.retry-server")
                    }
                    Text(String(localized: "Apple purchase success never grants Rillora access. The transaction is finished only after the signed App Store Server API status is durably committed; entitlement mutation stays off."))
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.body)
                }
            }
        }
        .rilloraStructuredList()
        .navigationTitle(String(localized: "StoreKit Sandbox"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("storekit-sandbox.catalog")
        .task { await store.startSandboxCatalog() }
    }

    private func productRow(
        _ product: StoreKitProductSnapshot,
        showsAction: Bool
    ) -> some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 3) {
                Text(product.displayName)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(RilloraTheme.ink)
                Text(intervalLabel(product.productID))
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }
            Spacer(minLength: 12)
            Text(product.displayPrice)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
            if showsAction {
                Image(systemName: "arrow.right")
                    .foregroundStyle(RilloraTheme.muted)
            }
        }
        .contentShape(Rectangle())
    }

    private func intervalLabel(_ productID: String) -> String {
        switch RilloraStoreKitCatalog.billingInterval(for: productID) {
        case "monthly": String(localized: "Monthly test subscription")
        case "annual": String(localized: "Yearly test subscription")
        default: String(localized: "Test subscription")
        }
    }
}
