import SwiftUI

struct PlanAccessView: View {
    let store: CommerceStore
    let appAccountToken: UUID?
    @State private var billingInterval = "annual"

    var body: some View {
        Group {
            if let status = store.status {
                planList(status)
            } else if store.isLoading {
                ProgressView("Checking plan access…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView {
                    Label("Plan access unavailable", systemImage: "lock.shield")
                } description: {
                    Text(store.errorMessage ?? "Purchases remain unavailable until plan access can be checked securely.")
                } actions: {
                    Button("Try again") {
                        Task { await store.refresh() }
                    }
                }
            }
        }
        .rilloraFocusedTask()
        .navigationTitle("Plan & access")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("plan-access.view")
        .task {
            if store.status == nil {
                await store.refresh()
            }
        }
    }

    private func planList(_ status: CommerceStatus) -> some View {
        List {
            Section("Current access") {
                LabeledContent(
                    "Plan",
                    value: status.currentAccess.planCode == "free"
                        ? "Free"
                        : status.currentAccess.planCode.capitalized
                )

                Label("Core planning stays available without a subscription", systemImage: "checkmark.shield")
                    .foregroundStyle(RilloraTheme.body)
            }

            if let freePlan = plan(code: "free", in: status) {
                Section("Included") {
                    RilloraCapabilityGrid(
                        items: visibleCapabilities(freePlan).map { capabilityLabel($0.code) },
                        systemImage: "checkmark.circle.fill"
                    )
                }
            }

            if let familyPlan = plan(code: "family", in: status) {
                Section {
                    RilloraCapabilityGrid(
                        items: plannedCapabilities(familyPlan).map { capabilityLabel($0.code) },
                        systemImage: "plus.circle"
                    )

                    if !status.offers.isEmpty {
                        Picker("Billing period", selection: $billingInterval) {
                            ForEach(status.offers, id: \.billingInterval) { offer in
                                Text(intervalLabel(offer.billingInterval))
                                    .tag(offer.billingInterval)
                            }
                        }
                        .pickerStyle(.segmented)

                        if let offer = selectedOffer(in: status) {
                            LabeledContent(
                                intervalLabel(offer.billingInterval),
                                value: offer.formattedPrice
                            )
                        }
                    }

                    RilloraBoundaryPanel("Billing is not open", systemImage: "lock") {
                        Text("This page shows the planned Family tier. This build cannot start a purchase or trial.")
                    }
                } header: {
                    Text("Rillora Family — planned")
                }
            }

            if store.storeKitTestEnvironment.isEnabled {
                storeKitTestSection
            }

            if let message = store.errorMessage {
                Section {
                    Label(message, systemImage: "exclamationmark.shield")
                        .foregroundStyle(RilloraTheme.muted)
                }
            }
        }
        .rilloraStructuredList()
        .refreshable { await store.refresh() }
    }

    @ViewBuilder
    private var storeKitTestSection: some View {
        Section {
            if store.storeKitLocalTestingEnabled {
                RilloraBoundaryPanel("Xcode StoreKit test only", systemImage: "testtube.2") {
                    Text("These products come from a local StoreKit configuration. They are not App Store Connect products, create no real charge, and never grant a Rillora entitlement.")
                }
            } else {
                RilloraBoundaryPanel("App Store Sandbox catalog", systemImage: "shippingbox") {
                    Text("Names and prices come from App Store Connect for the current storefront. This SK1 build cannot purchase, finish a transaction, or change Rillora access.")
                }
            }

            if store.storeKitProducts.isEmpty {
                Label(
                    store.storeKitLocalTestingEnabled
                        ? "Local products unavailable"
                        : "Sandbox products unavailable",
                    systemImage: "exclamationmark.triangle"
                )
                    .foregroundStyle(RilloraTheme.muted)
            } else {
                ForEach(store.storeKitProducts) { product in
                    if store.storeKitLocalTestingEnabled {
                        Button {
                            Task {
                                await store.purchaseLocalStoreKitProduct(productID: product.productID)
                            }
                        } label: {
                            storeKitProductRow(product)
                        }
                        .disabled(store.isStoreKitWorking || appAccountToken == nil)
                        .accessibilityIdentifier(
                            "storekit-local.purchase.\(RilloraStoreKitCatalog.billingInterval(for: product.productID) ?? product.productID)"
                        )
                    } else {
                        storeKitProductRow(product)
                            .accessibilityElement(children: .combine)
                            .accessibilityIdentifier(
                                "storekit-sandbox.product.\(RilloraStoreKitCatalog.billingInterval(for: product.productID) ?? product.productID)"
                            )
                    }
                }
            }

            if store.storeKitLocalTestingEnabled {
                Button {
                    Task { await store.restoreLocalStoreKitPurchases() }
                } label: {
                    Label("Refresh local purchase history", systemImage: "arrow.clockwise")
                }
                .disabled(store.isStoreKitWorking)
                .accessibilityIdentifier("storekit-local.restore")

                LabeledContent(
                    "Verified local transactions",
                    value: "\(store.storeKitLocalTransactions.count)"
                )
                LabeledContent(
                    "Current local entitlements",
                    value: "\(store.storeKitLocalEntitlements.count)"
                )

                ForEach(store.storeKitLocalSubscriptionStatuses) { status in
                    LabeledContent(localStatusProductLabel(status.productID)) {
                        Label(
                            localStatusLabel(status),
                            systemImage: localStatusIcon(status.state)
                        )
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(localStatusColor(status.state))
                        .accessibilityIdentifier(
                            "storekit-local.status.\(status.state.rawValue)"
                        )
                    }
                }

                if store.storeKitContainsUnverifiedEntitlement {
                    Label(
                        "An unverified StoreKit entitlement was ignored.",
                        systemImage: "exclamationmark.shield"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsUnverifiedSubscriptionStatus {
                    Label(
                        "An unverified subscription status was ignored.",
                        systemImage: "exclamationmark.shield"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsMismatchedEntitlement {
                    Label(
                        "A StoreKit entitlement for another account, environment, product, or storefront was ignored.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsMismatchedSubscriptionStatus {
                    Label(
                        "A subscription status outside this local account or catalog was ignored.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitSubscriptionStatusLoadFailed {
                    Label(
                        "Local subscription status is temporarily unavailable.",
                        systemImage: "arrow.trianglehead.2.clockwise.rotate.90"
                    )
                    .foregroundStyle(RilloraTheme.muted)
                }
            } else {
                LabeledContent(
                    "Storefront",
                    value: store.storefrontCountryCode ?? "Unavailable"
                )
                Label(
                    "Purchase waits for server verification",
                    systemImage: "lock.shield"
                )
                .foregroundStyle(RilloraTheme.muted)
            }

            if let message = store.storeKitMessage {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.body)
                    .accessibilityIdentifier("storekit-local.message")
            }
        } header: {
            Text(store.storeKitLocalTestingEnabled ? "StoreKit local test" : "StoreKit Sandbox")
        } footer: {
            Text(
                store.storeKitLocalTestingEnabled
                    ? "The production path will submit Apple-signed transaction evidence to Rillora’s server ledger before finishing a transaction or changing access."
                    : "Catalog display is evidence only. The server-owned access ledger remains Free."
            )
        }
    }

    private func storeKitProductRow(_ product: StoreKitProductSnapshot) -> some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 3) {
                Text(product.displayName)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(RilloraTheme.ink)
                Text(localProductDetail(product))
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }
            Spacer(minLength: 12)
            Text(product.displayPrice)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
        }
        .contentShape(Rectangle())
    }

    private func localProductDetail(_ product: StoreKitProductSnapshot) -> String {
        switch RilloraStoreKitCatalog.billingInterval(for: product.productID) {
        case "monthly": "Family · monthly test subscription"
        case "annual": "Family · yearly test subscription"
        default: product.description
        }
    }

    private func localStatusProductLabel(_ productID: String) -> String {
        switch RilloraStoreKitCatalog.billingInterval(for: productID) {
        case "monthly": "Monthly lifecycle"
        case "annual": "Yearly lifecycle"
        default: "Subscription lifecycle"
        }
    }

    private func localStatusLabel(_ status: StoreKitLocalSubscriptionStatusRecord) -> String {
        let state = switch status.state {
        case .subscribed: "Subscribed"
        case .expired: "Expired"
        case .inBillingRetryPeriod: "Billing retry"
        case .inGracePeriod: "Grace period"
        case .revoked: "Revoked"
        case .unknown: "Unknown"
        }
        guard status.state == .subscribed else { return state }
        return status.willAutoRenew ? "\(state) · renews" : "\(state) · ends"
    }

    private func localStatusIcon(_ state: StoreKitSubscriptionState) -> String {
        switch state {
        case .subscribed: "checkmark.circle.fill"
        case .inGracePeriod: "clock.badge.checkmark"
        case .inBillingRetryPeriod: "creditcard.trianglebadge.exclamationmark"
        case .expired: "clock.badge.xmark"
        case .revoked: "xmark.shield.fill"
        case .unknown: "questionmark.circle"
        }
    }

    private func localStatusColor(_ state: StoreKitSubscriptionState) -> Color {
        switch state {
        case .subscribed: RilloraTheme.tabSelection
        case .inGracePeriod: RilloraTheme.sage
        case .inBillingRetryPeriod, .expired, .revoked: RilloraTheme.clay
        case .unknown: RilloraTheme.muted
        }
    }

    private func plan(code: String, in status: CommerceStatus) -> CommercePlan? {
        status.plans.first { $0.planCode == code }
    }

    private func visibleCapabilities(_ plan: CommercePlan) -> [CommerceCapability] {
        let preferred = [
            "matter_map_core",
            "official_setup_guides",
            "trusted_person_basic",
            "rehearsal_basic",
            "data_export",
            "account_deletion",
        ]
        return preferred.compactMap { code in
            plan.capabilities.first { $0.code == code && $0.enforcementMode == "included" }
        }
    }

    private func plannedCapabilities(_ plan: CommercePlan) -> [CommerceCapability] {
        let preferred = [
            "household_coplanner",
            "trusted_people_multiple",
            "role_packages_advanced",
            "adaptive_reviews",
            "version_history",
            "encrypted_attachments",
        ]
        return preferred.compactMap { code in
            plan.capabilities.first { $0.code == code && $0.enforcementMode == "planned" }
        }
    }

    private func selectedOffer(in status: CommerceStatus) -> CommerceOffer? {
        status.offers.first { $0.billingInterval == billingInterval }
            ?? status.offers.first
    }

    private func intervalLabel(_ value: String) -> String {
        switch value {
        case "monthly": "Monthly"
        case "annual": "Yearly"
        default: value.capitalized
        }
    }

    private func capabilityLabel(_ code: String) -> String {
        switch code {
        case "matter_map_core": "Matter map"
        case "official_setup_guides": "Official provider guides"
        case "trusted_person_basic": "One trusted person"
        case "rehearsal_basic": "Basic rehearsal"
        case "data_export": "Data export"
        case "account_deletion": "Account deletion"
        case "household_coplanner": "Household co-planner"
        case "trusted_people_multiple": "Multiple trusted people"
        case "role_packages_advanced": "Advanced role packages"
        case "adaptive_reviews": "Adaptive review reminders"
        case "version_history": "Plan history"
        case "encrypted_attachments": "Encrypted attachments"
        default: code.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}
