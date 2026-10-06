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
                ProgressView(String(localized: "Checking plan access…"))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView {
                    Label(String(localized: "Plan access unavailable"), systemImage: "lock.shield")
                } description: {
                    Text(store.errorMessage ?? String(localized: "Try checking your plan again."))
                } actions: {
                    Button(String(localized: "Try again")) {
                        Task { await store.refresh() }
                    }
                }
            }
        }
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Plan & access"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("plan-access.view")
        .task {
            if store.status == nil {
                await store.refresh()
            }
        }
    }

    private func planList(_ status: CommerceStatus) -> some View {
        let hasAppleOffer = status.currentAccess.subscription == nil
            && store.applePurchase?.product != nil && store.applePurchase?.quote != nil
        return RilloraForm {
            if !hasAppleOffer {
                Section {
                    VStack(spacing: 12) {
                        RilloraTaskEmblem(systemImage: status.currentAccess.planCode == "free" ? "map" : "person.2.fill")
                        Text(store.currentPlanLabel)
                            .font(.system(.title, design: .serif).weight(.medium))
                            .foregroundStyle(RilloraTheme.ink)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                }
                .listRowBackground(Color.clear)

                if let freePlan = plan(code: "free", in: status) {
                    Section {
                        DisclosureGroup {
                            ForEach(visibleCapabilities(freePlan), id: \.code) { capability in
                                Label(capabilityLabel(capability.code), systemImage: "checkmark.circle.fill")
                                    .foregroundStyle(RilloraTheme.body)
                                    .padding(.vertical, 5)
                            }
                            Text(String(localized: "Core planning stays available without a subscription."))
                                .font(.footnote).foregroundStyle(RilloraTheme.muted)
                        } label: { Label(String(localized: "Included features"), systemImage: "checklist") }
                    }
                }

                if let familyPlan = plan(code: "family", in: status) {
                    Section {
                        DisclosureGroup {
                            RilloraCapabilityGrid(
                                items: plannedCapabilities(familyPlan).map { capabilityLabel($0.code) },
                                systemImage: "plus.circle"
                            )
                            DisclosureGroup(String(localized: "Later roadmap · not included yet")) {
                                ForEach(familyPlan.capabilities.filter { $0.enforcementMode == "planned" && !["family_maintenance", "trusted_people_multiple"].contains($0.code) && $0.availability != "retired" }, id: \.code) { capability in
                                    Text(capabilityLabel(capability.code)).foregroundStyle(RilloraTheme.muted).padding(.vertical, 4)
                                }
                            }
                            if store.applePurchase == nil && !status.offers.isEmpty {
                                if status.offers.count > 1 {
                                    RilloraFilterPicker(title: String(localized: "Billing period"), options: status.offers.map {
                                        .init(id: $0.billingInterval, title: intervalLabel($0.billingInterval))
                                    }, selection: $billingInterval, identifier: "plan-access.billing-period")
                                }
                                if let offer = selectedOffer(in: status) {
                                    LabeledContent(intervalLabel(offer.billingInterval), value: offer.formattedPrice)
                                }
                            }
                            if !status.billingOpen {
                                Label(String(localized: "Billing is not open"), systemImage: "lock")
                                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                            }
                        } label: { Label(status.billingOpen ? String(localized: "Family") : String(localized: "Family · Not available yet"), systemImage: "person.2") }
                    }
                }
            }

            if let purchase = store.applePurchase {
                ApplePurchaseSection(purchase: purchase, subscription: status.currentAccess.subscription)
            }

            if store.storeKitTestEnvironment.isEnabled {
                storeKitTestSection
            }
            Section {
                DisclosureGroup {
                    Text(String(localized: "You keep your own records and exports. Free includes one live recipient. Extra recipients retain only their permitted paid-period copy, without later updates."))
                    Text(String(localized: "You can always restrict or revoke sharing. Billing does not trigger disclosure."))
                } label: { Label(String(localized: "Access when Family ends"), systemImage: "clock.arrow.circlepath") }
                .font(.subheadline)
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
                RilloraBoundaryPanel(String(localized: "Xcode StoreKit test only"), systemImage: "testtube.2") {
                    Text(String(localized: "These products come from a local StoreKit configuration. They are not App Store Connect products, create no real charge, and never grant a Rillora entitlement."))
                }
            } else {
                RilloraBoundaryPanel(String(localized: "App Store Sandbox catalog"), systemImage: "shippingbox") {
                    Text(String(localized: "Names and prices come from App Store Connect for the current storefront. This SK1 build cannot purchase, finish a transaction, or change Rillora access."))
                }
            }

            if store.storeKitProducts.isEmpty {
                Label(
                    store.storeKitLocalTestingEnabled
                        ? String(localized: "Local products unavailable")
                        : String(localized: "Sandbox products unavailable"),
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
                    Label(String(localized: "Refresh local purchase history"), systemImage: "arrow.clockwise")
                }
                .disabled(store.isStoreKitWorking)
                .accessibilityIdentifier("storekit-local.restore")

                LabeledContent(
                    String(localized: "Verified local transactions"),
                    value: store.storeKitLocalTransactions.count.formatted()
                )
                LabeledContent(
                    String(localized: "Current local entitlements"),
                    value: store.storeKitLocalEntitlements.count.formatted()
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
                        String(localized: "An unverified StoreKit entitlement was ignored."),
                        systemImage: "exclamationmark.shield"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsUnverifiedSubscriptionStatus {
                    Label(
                        String(localized: "An unverified subscription status was ignored."),
                        systemImage: "exclamationmark.shield"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsMismatchedEntitlement {
                    Label(
                        String(localized: "A StoreKit entitlement for another account, environment, product, or storefront was ignored."),
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitContainsMismatchedSubscriptionStatus {
                    Label(
                        String(localized: "A subscription status outside this local account or catalog was ignored."),
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                    .foregroundStyle(RilloraTheme.clay)
                }

                if store.storeKitSubscriptionStatusLoadFailed {
                    Label(
                        String(localized: "Local subscription status is temporarily unavailable."),
                        systemImage: "arrow.trianglehead.2.clockwise.rotate.90"
                    )
                    .foregroundStyle(RilloraTheme.muted)
                }
            } else {
                LabeledContent(
                    String(localized: "Storefront"),
                    value: store.storefrontCountryCode ?? String(localized: "Unavailable")
                )
                Label(
                    String(localized: "Purchase waits for server verification"),
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
            Text(store.storeKitLocalTestingEnabled ? String(localized: "StoreKit local test") : String(localized: "StoreKit Sandbox"))
        } footer: {
            Text(
                store.storeKitLocalTestingEnabled
                    ? String(localized: "The production path will submit Apple-signed transaction evidence to Rillora’s server ledger before finishing a transaction or changing access.")
                    : String(localized: "Catalog display is evidence only. The server-owned access ledger remains Free.")
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
        case "monthly": String(localized: "Family · monthly test subscription")
        case "annual": String(localized: "Family · yearly test subscription")
        default: product.description
        }
    }

    private func localStatusProductLabel(_ productID: String) -> String {
        switch RilloraStoreKitCatalog.billingInterval(for: productID) {
        case "monthly": String(localized: "Monthly lifecycle")
        case "annual": String(localized: "Yearly lifecycle")
        default: String(localized: "Subscription lifecycle")
        }
    }

    private func localStatusLabel(_ status: StoreKitLocalSubscriptionStatusRecord) -> String {
        let state = switch status.state {
        case .subscribed: String(localized: "Subscribed")
        case .expired: String(localized: "Expired")
        case .inBillingRetryPeriod: String(localized: "Billing retry")
        case .inGracePeriod: String(localized: "Grace period")
        case .revoked: String(localized: "Revoked")
        case .unknown: String(localized: "Unknown")
        }
        guard status.state == .subscribed else { return state }
        return status.willAutoRenew ? L10n.format("%1$@ · renews", state) : L10n.format("%1$@ · ends", state)
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
            "data_export",
        ]
        return preferred.compactMap { code in
            plan.capabilities.first { $0.code == code && $0.enforcementMode == "included" && ($0.availability == nil || $0.availability == "available") }
        }
    }

    private func plannedCapabilities(_ plan: CommercePlan) -> [CommerceCapability] {
        let preferred = [
            "family_maintenance",
            "trusted_people_multiple",
        ]
        return preferred.compactMap { code in
            plan.capabilities.first { $0.code == code && ["planned", "included", "metered_limit"].contains($0.enforcementMode) }
        }
    }

    private func selectedOffer(in status: CommerceStatus) -> CommerceOffer? {
        status.offers.first { $0.billingInterval == billingInterval }
            ?? status.offers.first
    }

    private func intervalLabel(_ value: String) -> String {
        switch value {
        case "monthly": String(localized: "Monthly")
        case "annual": String(localized: "Yearly")
        default: value
        }
    }

    private func capabilityLabel(_ code: String) -> String {
        switch code {
        case "matter_map_core": String(localized: "Matter map")
        case "official_setup_guides": String(localized: "Official provider guides")
        case "trusted_person_basic": String(localized: "Sharing with a trusted person")
        case "rehearsal_basic": String(localized: "Basic rehearsal")
        case "data_export": String(localized: "Export and read saved copies")
        case "account_deletion": String(localized: "Account deletion")
        case "household_coplanner": String(localized: "Household co-planner")
        case "family_maintenance": String(localized: "Shared reviews and approved corrections")
        case "trusted_people_multiple": String(localized: "Multiple trusted people")
        case "role_packages_advanced": String(localized: "Advanced role packages")
        case "adaptive_reviews": String(localized: "Adaptive review reminders")
        case "version_history": String(localized: "Plan history")
        case "encrypted_attachments": String(localized: "Encrypted attachments")
        default: code
        }
    }
}
