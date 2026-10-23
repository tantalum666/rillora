#if os(iOS)
import SwiftUI
import UniformTypeIdentifiers

private struct ContentPaletteKey: EnvironmentKey {
    static let defaultValue = ContentPalette(background: Color(uiColor: .systemGroupedBackground), surface: Color(uiColor: .secondarySystemGroupedBackground))
}
struct ContentPalette { let background: Color; let surface: Color }
extension EnvironmentValues {
    var contentPalette: ContentPalette {
        get { self[ContentPaletteKey.self] }
        set { self[ContentPaletteKey.self] = newValue }
    }
}
struct ContentForm<Rows: View>: View {
    @Environment(\.contentPalette) private var palette
    @Environment(\.scenePhase) private var scenePhase
    @ViewBuilder let rows: () -> Rows
    var body: some View {
        Form { rows().listRowBackground(palette.surface) }
            .scrollContentBackground(.hidden).background(palette.background)
            .overlay { if scenePhase != .active { palette.background.ignoresSafeArea() } }
            .privacySensitive()
    }
}
struct ContentField: View {
    let key: String
    @Binding var text: String
    var lines = 1
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(ContentText.get(key)).font(.subheadline).foregroundStyle(.secondary)
            TextField(ContentText.get(key), text: $text, axis: lines == 1 ? .horizontal : .vertical)
                .lineLimit(lines...max(lines, 6)).accessibilityIdentifier("content." + key)
        }
    }
}
struct ContentChoicePicker: View {
    let key: String
    let choices: [ContentChoice]
    @Binding var selected: String?
    var body: some View {
        Picker(ContentText.get(key), selection: $selected) {
            Text(ContentText.get("none")).tag(String?.none)
            ForEach(choices) { Text($0.title).tag(Optional($0.id)) }
            if let selected, !choices.contains(where: { $0.id == selected }) {
                Text(ContentText.get("unavailable")).tag(Optional(selected))
            }
        }.accessibilityIdentifier("content." + key)
    }
}
struct ContentExport: Identifiable { let id = UUID(); let document: ContentDocument; let name: String; let type: UTType }

public struct ContentEntryView<Guide: View>: View {
    let transport: any ContentTransport
    let accountID: String
    let contacts: [ContentChoice]
    let matters: [ContentChoice]
    let guides: [ContentChoice]
    let palette: ContentPalette
    let authenticationRequired: () -> Void
    let guide: (String) -> Guide
    public init(transport: any ContentTransport, accountID: String, contacts: [ContentChoice], matters: [ContentChoice], guides: [ContentChoice],
                background: Color, surface: Color, authenticationRequired: @escaping () -> Void, @ViewBuilder guide: @escaping (String) -> Guide) {
        self.transport = transport; self.accountID = accountID; self.contacts = contacts; self.matters = matters; self.guides = guides
        self.palette = .init(background: background, surface: surface); self.authenticationRequired = authenticationRequired; self.guide = guide
    }
    public var body: some View {
        NavigationLink {
            ContentWorkspaceView(client: .init(transport: transport, accountID: accountID), contacts: contacts, matters: matters,
                                 guides: guides, authenticationRequired: authenticationRequired, guide: guide)
                .environment(\.contentPalette, palette).id(accountID)
        } label: {
            Label {
                VStack(alignment: .leading, spacing: 4) {
                    Text(ContentText.get("title"))
                    Text(ContentText.get("subtitle")).font(.subheadline).foregroundStyle(.secondary)
                }
            } icon: { Image(systemName: "folder.badge.person.crop") }
        }.accessibilityIdentifier("content.open")
    }
}

private enum ContentModal: Identifiable {
    case pack(ContentPack?), file(ContentAsset?), voice
    var id: String {
        switch self { case .pack(let p): "pack-" + (p?.id ?? "new"); case .file(let f): "file-" + (f?.id ?? "new"); case .voice: "voice" }
    }
}
struct ContentWorkspaceView<Guide: View>: View {
    @State private var store: ContentStore
    @State private var tab = 0
    @State private var modal: ContentModal?
    @State private var export: ContentExport?
    @State private var exportPresented = false
    @State private var deletePack: ContentPack?
    @State private var publishPack: ContentPack?
    @State private var showNotice = false
    @Environment(\.scenePhase) private var scenePhase
    let contacts: [ContentChoice], matters: [ContentChoice], guides: [ContentChoice]
    let authenticationRequired: () -> Void
    let guide: (String) -> Guide
    init(client: ContentClient, contacts: [ContentChoice], matters: [ContentChoice], guides: [ContentChoice], authenticationRequired: @escaping () -> Void, guide: @escaping (String) -> Guide) {
        _store = State(initialValue: ContentStore(client: client)); self.contacts = contacts; self.matters = matters; self.guides = guides
        self.authenticationRequired = authenticationRequired; self.guide = guide
    }
    var body: some View {
        ContentForm {
            Section {
                Picker(ContentText.get("sections"), selection: $tab) {
                    Text(ContentText.get("packs")).tag(0); Text(ContentText.get("files")).tag(1); Text(ContentText.get("received")).tag(2)
                }.pickerStyle(.menu).accessibilityIdentifier("content.sections")
                if store.loading { ProgressView() }
                if let message = store.message { Text(message).accessibilityIdentifier("content.message") }
            }
            if let workspace = store.workspace {
                if tab != 2 && !workspace.acceptedNotice {
                    Section { Button(ContentText.get("reviewNotice")) { showNotice = true }.accessibilityIdentifier("content.review-notice") }
                } else if tab != 2 && (!workspace.canCreate || !workspace.writesEnabled) {
                    Section { Text(ContentText.get(workspace.writesEnabled ? "familyRequired" : "writesClosed")).foregroundStyle(.secondary) }
                }
                if tab == 0 { packs(workspace) }
                else if tab == 1 { files(workspace) }
                else { received(workspace) }
                Section { Button(ContentText.get("privacy")) { showNotice = true } }
            }
        }
        .navigationTitle(ContentText.get("title")).navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("content.workspace")
        .toolbar { Button { Task { await store.reload() } } label: { Image(systemName: "arrow.clockwise") }
            .accessibilityLabel(ContentText.get("refresh")).disabled(store.working || store.loading) }
        .task { await store.reload() }
        .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await store.reload() } } }
        .onChange(of: store.authenticationRequired) { _, needed in if needed { modal = nil; export = nil; authenticationRequired() } }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .privacySensitive()
        .sheet(item: $modal) { item in
            NavigationStack {
                switch item {
                case .pack(let p): ContentPackEditor(store: store, previous: p, contacts: contacts, matters: matters, guides: guides, guide: guide)
                case .file(let asset): ContentFileEditor(store: store, asset: asset, isVoice: false)
                case .voice: ContentFileEditor(store: store, asset: nil, isVoice: true)
                }
            }
        }
        .sheet(isPresented: $showNotice) {
            if let workspace = store.workspace { ContentNoticeView(store: store, notice: workspace.notice, accepted: workspace.acceptedNotice) }
        }
        .fileExporter(isPresented: $exportPresented, document: export?.document, contentType: export?.type ?? .json, defaultFilename: export?.name) { result in
            if case .failure(let error) = result { store.fail(error) }; export = nil
        }
        .alert(ContentText.get("deletePack"), isPresented: Binding(get: { deletePack != nil }, set: { if !$0 { deletePack = nil } })) {
            Button(ContentText.get("delete"), role: .destructive) { if let p = deletePack { Task { _ = await store.perform { try await store.client.remove(id: p.id, asset: false) } } } }
            Button(ContentText.get("cancel"), role: .cancel) {}
        } message: { Text(ContentText.get("savedCopies")) }
        .confirmationDialog(ContentText.get("shareNow"), isPresented: Binding(get: { publishPack != nil }, set: { if !$0 { publishPack = nil } }), titleVisibility: .visible) {
            Button(ContentText.get("confirmShare")) { if let p = publishPack { Task { _ = await store.perform { try await store.client.publish(p) } } } }
        } message: { Text(ContentText.get("shareBoundary")) }
    }
    @ViewBuilder private func packs(_ data: ContentWorkspace) -> some View {
        Section {
            Button(ContentText.get("newPack")) { modal = .pack(nil) }.disabled(!store.canCreate || store.working).accessibilityIdentifier("content.new-pack")
            if data.packs.isEmpty { Text(ContentText.get("noPacks")).foregroundStyle(.secondary) }
        }
        ForEach(data.packs) { pack in
            Section {
                Text(pack.body.title).font(.headline)
                Text(ContentText.get(pack.publicationId == nil ? "privateDraft" : "published")).foregroundStyle(.secondary)
                if let published = pack.publishedVersion {
                    Text(ContentText.get("publishedVersion") + " \(published)").font(.subheadline)
                    Text(ContentText.get("existingShareBoundary")).font(.subheadline).foregroundStyle(.secondary)
                } else if pack.intent == .after_death { Text(ContentText.get("futureBoundary")).font(.subheadline) }
                Button(ContentText.get("edit")) { modal = .pack(pack) }.accessibilityIdentifier("content.edit-pack.\(pack.id)")
                Button(ContentText.get("exportPack")) {
                    do {
                        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
                        export = .init(document: .init(bytes: try encoder.encode(pack)), name: "rillora-action-pack.json", type: .json); exportPresented = true
                    } catch { store.fail(error) }
                }
                if let id = pack.publicationId {
                    NavigationLink(ContentText.get("viewPublished")) { ContentPublicationView(client: store.client, id: id, guides: guides, guide: guide) }
                    Button(ContentText.get("revoke"), role: .destructive) { Task { _ = await store.perform { try await store.client.revoke(pack) } } }
                }
                if pack.intent == .current {
                    Button(ContentText.get("shareNow")) { publishPack = pack }.disabled(!store.canCreate || pack.personPublicId == nil || store.working)
                }
                Button(ContentText.get("delete"), role: .destructive) { deletePack = pack }
            }.disabled(store.working)
        }
    }
    @ViewBuilder private func files(_ data: ContentWorkspace) -> some View {
        Section {
            Button(ContentText.get("importFile")) { modal = .file(nil) }.accessibilityIdentifier("content.import-file")
            Button(ContentText.get("recordVoice")) { modal = .voice }.accessibilityIdentifier("content.record-voice")
        }.disabled(!store.canCreate || store.working)
        ForEach(data.assets) { asset in
            Section {
                Button { modal = .file(asset) } label: {
                    Label(asset.name, systemImage: asset.kind == .voice ? "waveform" : "doc")
                }.accessibilityIdentifier("content.asset.\(asset.id)")
                if asset.state != "ready" { Text(ContentText.get("uploading")) }
            }
        }
        if data.assets.isEmpty { Text(ContentText.get("noFiles")).foregroundStyle(.secondary) }
    }
    @ViewBuilder private func received(_ data: ContentWorkspace) -> some View {
        ForEach(data.received) { item in
            NavigationLink { ContentPublicationView(client: store.client, id: item.id, guides: guides, guide: guide) } label: {
                VStack(alignment: .leading, spacing: 4) { Text(item.body.title); if let owner = item.ownerName { Text(owner).foregroundStyle(.secondary) } }
            }.accessibilityIdentifier("content.received.\(item.id)")
        }
        if data.received.isEmpty { Text(ContentText.get("noReceived")).foregroundStyle(.secondary) }
        if data.receivedNextCursor != nil { Button(ContentText.get("loadMore")) { Task { await store.loadMore() } }.disabled(store.loading) }
    }
}

struct ContentNoticeView: View {
    let store: ContentStore
    let notice: ContentNotice
    let accepted: Bool
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        let copy = ContentText.chinese ? notice.chinese : notice.en
        NavigationStack {
            ContentForm {
                Section { Text(copy.storage); Text(copy.access); Text(copy.retention) }
                Section(ContentText.get("voice")) { Text(ContentText.get("nativeVoicePrivacy")) }
                Section { Text(copy.limits) }
                if !accepted {
                    Button(ContentText.get("acknowledge")) { Task {
                        if await store.perform({ try await store.client.consent(version: notice.version) }) != nil { dismiss() }
                    } }.disabled(store.working).accessibilityIdentifier("content.acknowledge")
                }
                if let message = store.message { Text(message) }
            }.navigationTitle(ContentText.get("privacy")).navigationBarTitleDisplayMode(.inline)
                .toolbar { Button(ContentText.get("close")) { dismiss() }.disabled(store.working) }
        }
    }
}
#endif
