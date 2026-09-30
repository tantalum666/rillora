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
                Section { Label(error, systemImage: "exclamationmark.circle"); Button("Retry") { Task { await load() } } }
            } else if let data {
                if data.connections.isEmpty {
                    Section {
                        VStack(spacing: 18) {
                            RilloraConnectionVisual(state: .pending)
                            Text("No shared items").font(.headline)
                            if let onOpenInvitation { Button("Accept a received invitation", action: onOpenInvitation).buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("invitation.open") }
                        }.frame(maxWidth: .infinity).padding(.vertical, 28)
                    }.listRowBackground(Color.clear)
                }
                ForEach(data.connections) { connection in
                    Section(connection.ownerName) {
                        if connection.accessMode == .saved { Text("Updates paused · Saved copies").foregroundStyle(RilloraTheme.muted) }
                        let items = data.items.filter { $0.connectionPublicId == connection.publicId }
                        ForEach(items) { item in
                            NavigationLink {
                                SharedMatterDetailView(itemID: item.id, service: service)
                            } label: {
                                Label(item.title, systemImage: "doc.text").frame(minHeight: 44)
                            }.accessibilityIdentifier("shared.item.\(item.matterPublicId)")
                        }
                        if items.isEmpty { Text(connection.accessMode == .paused ? "Updates paused. The sender can resume sharing." : "No matters shared with you yet.").foregroundStyle(RilloraTheme.muted) }
                    }
                }
                if !data.connections.isEmpty, let onOpenInvitation {
                    Section { Button("Accept a received invitation", action: onOpenInvitation).frame(minHeight: 44).accessibilityIdentifier("invitation.open") }
                }
                Section { Label("Read only", systemImage: "eye").foregroundStyle(RilloraTheme.muted).font(.footnote) }
                    .listRowBackground(Color.clear)
            } else { ProgressView("Loading shared items…") }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .navigationTitle("Shared with me").navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .primaryAction) { Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel("Refresh shared items").disabled(loading) } }
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
                    Text("\(item.ownerName) · Read only").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let saved = item.savedCopyLabel { Text(saved).font(.subheadline).foregroundStyle(RilloraTheme.muted) }
                    if let category = item.fields["category"] { Text(MatterCategory(rawValue: category)?.label ?? category).font(.footnote) }
                    if item.detailLevel == .name { Text("Only the name and category are shared with you.").font(.subheadline).foregroundStyle(RilloraTheme.muted) }
                }.listRowBackground(Color.clear)
                Section { SharedMatterFields(fields: item.fields) }
                let guides = OfficialProviderGuideCatalog.suggestions(sharedFields: item.fields)
                if !guides.isEmpty { Section { MatterAccountGuides(guides: guides) } }

            } else if loaded {
                Section { Label(error ?? "Access changed. This item is no longer shared with you.", systemImage: "lock") }
            } else { ProgressView("Checking access…") }
        }.rilloraStructuredList().rilloraFocusedTask()
            .navigationTitle(item?.title ?? "Shared matter").navigationBarTitleDisplayMode(.inline)
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
                                    Button(copiedAddress ? "Copied" : "Copy address") { UIPasteboard.general.string = value; copiedAddress = true }.frame(minHeight: 44)
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
        case "cryptoCustody": return value == "exchange" ? "An exchange" : value == "self_custody" ? "An on-chain wallet" : value
        case "valueBand": return MatterValueBand(rawValue: value)?.label ?? value
        case "billingCycle", "importance": return value.replacingOccurrences(of: "_", with: " ").capitalized
        default: return value
        }
    }
    private func label(_ key: String) -> String {
        switch key { case "institutionName": "Provider"; case "locationHint": "Where to find it"; case "desiredOutcome": "Wishes"; case "accountHint": "Masked hint"; case "valueBand": "Value range"; case "currencyCode": "Currency"; case "assetType": "Asset type"; case "debtType": "Debt type"; case "documentType": "Document type"; case "deviceModel": "Model"; case "billingCycle": "Billing cycle"; case "renewalDate": "Next renewal"; case "cryptoCustody": "Held in"; case "network": "Blockchain network"; case "walletAddress": "Public wallet address"; case "walletLabel": "Wallet app or device"; case "assetSymbol": "Asset or token"; case "notes": "Notes"; default: "Importance" }
    }
}
