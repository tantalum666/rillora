import SwiftUI
import UIKit

struct SharedWithMeView: View {
    let service: any SharingServing
    var onOpenInvitation: (() -> Void)?
    @State private var data: SharedWithMeEnvelope?
    @State private var error: String?
    @State private var loading = false
    @Environment(\.scenePhase) private var phase

    var body: some View {
        List {
            if let error {
                Section { Label(error, systemImage: "exclamationmark.circle"); Button("Retry") { Task { await load() } } }
            } else if let data {
                if data.connections.isEmpty {
                    Section {
                        VStack(spacing: 18) {
                            RilloraConnectionVisual(state: .pending)
                            Text("Nothing shared with you yet").font(.headline)
                            if let onOpenInvitation { Button("Accept a received invitation", action: onOpenInvitation).buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("invitation.open") }
                        }.frame(maxWidth: .infinity).padding(.vertical, 28)
                    }.listRowBackground(Color.clear)
                }
                ForEach(data.connections) { connection in
                    Section(connection.ownerName) {
                        let items = data.items.filter { $0.connectionPublicId == connection.publicId }
                        ForEach(items) { item in
                            NavigationLink {
                                SharedMatterDetailView(itemID: item.id, service: service)
                            } label: {
                                Label(item.title, systemImage: "doc.text").frame(minHeight: 44)
                            }.accessibilityIdentifier("shared.item.\(item.matterPublicId)")
                        }
                        if items.isEmpty { Text("No matters shared with you yet.").foregroundStyle(RilloraTheme.muted) }
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
        .onChange(of: phase) { _, next in if next == .active { Task { await load() } } }
        .accessibilityIdentifier("shared.inbox")
        .rilloraEntrance()
    }
    @MainActor private func load() async {
        guard !loading else { return }; loading = true; error = nil
        defer { loading = false }
        do { data = try await service.fetchSharedWithMe() }
        catch { data = nil; self.error = error.localizedDescription }
    }
}

private struct SharedMatterDetailView: View {
    let itemID: String
    let service: any SharingServing
    @State private var item: SharedMatterItem?
    @State private var error: String?
    @State private var loaded = false
    @State private var loading = false
    @State private var copied = false
    @Environment(\.scenePhase) private var phase
    private let keys = ["institutionName", "locationHint", "desiredOutcome", "accountHint", "valueBand", "currencyCode", "importance", "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol", "notes"]
    var body: some View {
        RilloraForm {
            if let item {
                Section {
                    Image(systemName: "doc.text").font(.system(size: 48)).foregroundStyle(RilloraTheme.tabSelection)
                        .frame(maxWidth: .infinity).padding(.vertical, 20).accessibilityHidden(true)
                    Text("\(item.ownerName) · Read only").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let category = item.fields["category"] { Text(MatterCategory(rawValue: category)?.label ?? category).font(.footnote) }
                }.listRowBackground(Color.clear)
                Section { SharedFieldsView(fields: item.fields, level: item.detailLevel) }
            } else if loaded {
                Section { Label(error ?? "Access changed. This item is no longer shared with you.", systemImage: "lock") }
            } else { ProgressView("Checking access…") }
        }.rilloraStructuredList().rilloraFocusedTask()
            .navigationTitle(item?.title ?? "Shared matter").navigationBarTitleDisplayMode(.inline)
            .task { await load() }
            .refreshable { await load() }
            .onChange(of: phase) { _, next in
                if next == .active { Task { await load() } }
                else { item = nil; loaded = false; copied = false }
            }
            .accessibilityIdentifier("shared.detail")
            .rilloraEntrance()
    }
    @MainActor private func load() async {
        guard !loading else { return }
        loading = true; loaded = false; item = nil; error = nil; copied = false
        defer { loading = false; loaded = true }
        do { item = try await service.fetchSharedWithMe().items.first { $0.id == itemID } }
        catch { self.error = error.localizedDescription }
    }
}

struct SharedFieldsView: View {
    let fields: [String: String]
    let level: SharingDetailLevel
    @State private var copied = false
    private let keys = ["institutionName", "locationHint", "desiredOutcome", "accountHint", "valueBand", "currencyCode", "importance", "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol", "notes"]
    var body: some View {
        if level == .name { Label("Only the name and category are shared.", systemImage: "eye").foregroundStyle(RilloraTheme.muted) }
        ForEach(keys, id: \.self) { key in
            if let value = fields[key], !(key == "valueBand" && value == "unknown"), !(key == "desiredOutcome" && value == "undecided") {
                VStack(alignment: .leading, spacing: 8) {
                    Text(label(key)).font(.caption).foregroundStyle(RilloraTheme.muted)
                    Text(key == "desiredOutcome" ? MatterOutcome(rawValue: value)?.label ?? value : (["cryptoCustody", "billingCycle", "valueBand", "importance"].contains(key) ? value.replacingOccurrences(of: "_", with: " ").capitalized : value))
                        .fixedSize(horizontal: false, vertical: true).textSelection(.enabled)
                    if key == "walletAddress" {
                        Button(copied ? "Copied" : "Copy address") { UIPasteboard.general.string = value; copied = true }
                            .frame(minHeight: 44).accessibilityIdentifier("shared.copy-address")
                    }
                }.padding(.vertical, 6)
            }
        }
    }
    private func label(_ key: String) -> String {
        switch key { case "institutionName": "Provider"; case "locationHint": "Where to find it"; case "desiredOutcome": "Wishes"; case "accountHint": "Masked hint"; case "valueBand": "Value range"; case "currencyCode": "Currency"; case "assetType": "Asset type"; case "debtType": "Debt type"; case "documentType": "Document type"; case "deviceModel": "Model"; case "billingCycle": "Billing cycle"; case "renewalDate": "Next renewal"; case "cryptoCustody": "Held in"; case "network": "Blockchain network"; case "walletAddress": "Public wallet address"; case "walletLabel": "Wallet app or device"; case "assetSymbol": "Asset or token"; case "notes": "Notes"; default: "Importance" }
    }
}
