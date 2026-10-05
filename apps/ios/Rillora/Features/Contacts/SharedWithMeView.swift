import SwiftUI
import UIKit

struct SharedWithMeView: View {
    let service: any SharingServing
    var onOpenInvitation: (() -> Void)?
    @State private var access: SharedAccessStore
    private var data: SharedWithMeEnvelope? { access.data }
    private var error: String? { access.error }
    private var loading: Bool { access.isLoading }
    init(service: any SharingServing, onOpenInvitation: (() -> Void)? = nil) {
        self.service = service; self.onOpenInvitation = onOpenInvitation
        _access = State(initialValue: SharedAccessStore(service: service))
    }
    @Environment(\.scenePhase) private var phase

    var body: some View {
        RilloraList {
            if let error {
                Section { Label(error, systemImage: "exclamationmark.circle"); Button(String(localized: "Retry")) { Task { await load() } } }
            } else if let data {
                if data.connections.isEmpty {
                    Section {
                        VStack(spacing: 18) {
                            RilloraConnectionVisual(state: .pending)
                            Text(String(localized: "No shared items")).font(.headline)
                            if let onOpenInvitation { Button(String(localized: "Accept a received invitation"), action: onOpenInvitation).buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("invitation.open") }
                        }.frame(maxWidth: .infinity).padding(.vertical, 28)
                    }.listRowBackground(Color.clear)
                }
                ForEach(data.connections) { connection in
                    Section(connection.ownerName) {
                        if connection.accessMode == .saved { Text(String(localized: "Updates paused · Saved copies")).foregroundStyle(RilloraTheme.muted) }
                        let items = data.items.filter { $0.connectionPublicId == connection.publicId }
                        ForEach(items) { item in
                            NavigationLink {
                                SharedMatterDetailView(itemID: item.id, service: service)
                            } label: {
                                Label(item.title, systemImage: "doc.text").frame(minHeight: 44)
                            }.accessibilityIdentifier("shared.item.\(item.matterPublicId)")
                        }
                        if items.isEmpty { Text(connection.accessMode == .paused ? String(localized: "Updates paused. The sender can resume sharing.") : String(localized: "No matters shared with you yet.")).foregroundStyle(RilloraTheme.muted) }
                    }
                }
                if !data.connections.isEmpty, let onOpenInvitation {
                    Section { Button(String(localized: "Accept a received invitation"), action: onOpenInvitation).frame(minHeight: 44).accessibilityIdentifier("invitation.open") }
                }
                Section { Label(String(localized: "Read only"), systemImage: "eye").foregroundStyle(RilloraTheme.muted).font(.footnote) }
                    .listRowBackground(Color.clear)
            } else { ProgressView(String(localized: "Loading shared items…")) }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .navigationTitle(String(localized: "Shared with me")).navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .primaryAction) { Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel(String(localized: "Refresh shared items")).disabled(loading) } }
        .task { await load() }.refreshable { await load() }
        .task { await recheckVisibleAccess() }
        .onChange(of: phase) { _, next in if next == .active { Task { await load() } } else { access.suspend() } }
        .accessibilityIdentifier("shared.inbox")
        .rilloraEntrance()
    }
    @MainActor private func load() async { await access.refresh() }
    @MainActor private func recheckVisibleAccess() async {
        while !Task.isCancelled {
            do { try await Task.sleep(for: .seconds(15)) } catch { return }
            if phase == .active { await access.refresh(keepingVisible: true) }
        }
    }

}

private struct SharedMatterDetailView: View {
    let itemID: String
    let service: any SharingServing
    @State private var access: SharedAccessStore
    private var item: SharedMatterItem? { access.data?.items.first { $0.id == itemID } }
    private var error: String? { access.error }
    private var loaded: Bool { access.hasLoaded }
    @Environment(\.scenePhase) private var phase
    init(itemID: String, service: any SharingServing) {
        self.itemID = itemID; self.service = service
        _access = State(initialValue: SharedAccessStore(service: service))
    }
    var body: some View {
        RilloraForm {
            if let item {
                Section {
                    RilloraTaskEmblem(systemImage: "doc.text")
                        .frame(maxWidth: .infinity).padding(.vertical, 20).accessibilityHidden(true)
                    Text(L10n.format("%1$@ · Read only", item.ownerName)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let saved = item.savedCopyLabel { Text(saved).font(.subheadline).foregroundStyle(RilloraTheme.muted) }
                    if let category = item.fields["category"] { Text(MatterCategory(rawValue: category)?.label ?? category).font(.footnote) }
                    if item.detailLevel == .name { Text(String(localized: "Only the name and category are shared with you.")).font(.subheadline).foregroundStyle(RilloraTheme.muted) }
                }.listRowBackground(Color.clear)
                Section { SharedMatterFields(fields: item.fields) }
                let guides = OfficialProviderGuideCatalog.suggestions(sharedFields: item.fields)
                if !guides.isEmpty { Section { MatterAccountGuides(guides: guides) } }

            } else if loaded {
                Section { Label(error ?? String(localized: "Access changed. This item is no longer shared with you."), systemImage: "lock") }
            } else { ProgressView(String(localized: "Checking access…")) }
        }.rilloraStructuredList().rilloraFocusedTask()
            .navigationTitle(item?.title ?? String(localized: "Shared matter")).navigationBarTitleDisplayMode(.inline)
            .task { await load() }
            .task { await recheckVisibleAccess() }
            .refreshable { await load() }
            .onChange(of: phase) { _, next in
                if next == .active { Task { await load() } }
                else { access.suspend() }
            }
            .accessibilityIdentifier("shared.detail")
            .rilloraEntrance()
    }
    @MainActor private func load() async { await access.refresh() }
    @MainActor private func recheckVisibleAccess() async {
        while !Task.isCancelled {
            do { try await Task.sleep(for: .seconds(15)) } catch { return }
            if phase == .active { await access.refresh(keepingVisible: true) }
        }
    }
}

struct SharedMatterFields: View {
    let fields: [String: String]
    @State private var copiedAddress = false
    private let keys = ["institutionName", "locationHint", "desiredOutcome", "accountHint", "valueBand", "currencyCode", "importance", "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol", "notes"]
    var body: some View {
                    ForEach(keys, id: \.self) { key in
                        if let value = fields[key],
                           !(key == "valueBand" && value == "unknown"),
                           !(key == "desiredOutcome" && value == "undecided") {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(label(key)).font(.caption).foregroundStyle(RilloraTheme.muted)
                                Text(displayValue(value, key: key))
                                    .fixedSize(horizontal: false, vertical: true).textSelection(.enabled)
                                if key == "walletAddress" {
                                    Button(copiedAddress ? String(localized: "Copied") : String(localized: "Copy address")) { UIPasteboard.general.string = value; copiedAddress = true }.frame(minHeight: 44)
                                        .accessibilityIdentifier("shared.copy-address")
                                }
                            }.padding(.vertical, 6)
                        }
                    }
                    .onChange(of: fields["walletAddress"]) { _, _ in copiedAddress = false }
    }
    private func displayValue(_ value: String, key: String) -> String {
        switch key {
        case "desiredOutcome": return MatterOutcome(rawValue: value)?.label ?? value
        case "cryptoCustody": return value == "exchange" ? String(localized: "An exchange") : value == "self_custody" ? String(localized: "An on-chain wallet") : value
        case "valueBand": return MatterValueBand(rawValue: value)?.label ?? value
        case "importance": return MatterImportance(rawValue: value)?.label ?? value
        case "billingCycle":
            switch value {
            case "monthly": return String(localized: "Monthly")
            case "annual": return String(localized: "Annual")
            case "other": return String(localized: "Other")
            default: return value
            }
        default: return value
        }
    }
    private func label(_ key: String) -> String {
        switch key { case "institutionName": String(localized: "Provider"); case "locationHint": String(localized: "Where to find it"); case "desiredOutcome": String(localized: "Wishes"); case "accountHint": String(localized: "Masked hint"); case "valueBand": String(localized: "Value range"); case "currencyCode": String(localized: "Currency"); case "assetType": String(localized: "Asset type"); case "debtType": String(localized: "Debt type"); case "documentType": String(localized: "Document type"); case "deviceModel": String(localized: "Model"); case "billingCycle": String(localized: "Billing cycle"); case "renewalDate": String(localized: "Next renewal"); case "cryptoCustody": String(localized: "Held in"); case "network": String(localized: "Blockchain network"); case "walletAddress": String(localized: "Public wallet address"); case "walletLabel": String(localized: "Wallet app or device"); case "assetSymbol": String(localized: "Asset or token"); case "notes": String(localized: "Notes"); default: String(localized: "Importance") }
    }
}
