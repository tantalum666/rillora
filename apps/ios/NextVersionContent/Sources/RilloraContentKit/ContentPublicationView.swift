#if os(iOS)
import SwiftUI
import UniformTypeIdentifiers

struct ContentPublicationView<Guide: View>: View {
    @State private var store: ContentPublicationStore
    @State private var selectedGuide: ContentChoice?
    @State private var export: ContentExport?
    @State private var exportPresented = false
    @State private var voice = ContentVoice()
    @State private var downloadTask: Task<Void, Never>?
    @State private var downloading = false
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.contentPalette) private var palette
    let guides: [ContentChoice]
    let guide: (String) -> Guide
    init(client: ContentClient, id: String, guides: [ContentChoice], guide: @escaping (String) -> Guide) {
        _store = State(initialValue: ContentPublicationStore(client: client, id: id)); self.guides = guides; self.guide = guide
    }
    var body: some View {
        ContentForm {
            if let message = store.message { Section { Text(message).accessibilityIdentifier("content.publication-error") } }
            if let value = store.value {
                Section { Text(value.body.title).font(.headline); Text(value.body.note); Text(ContentText.get("progressBoundary")).font(.subheadline).foregroundStyle(.secondary) }
                ForEach(value.body.tasks) { step in
                    Section(step.title) {
                        Text(ContentText.get("action." + step.action.rawValue))
                        Text(step.instructions)
                        if !step.dependsOn.isEmpty {
                            Text(ContentText.get("prerequisites") + ": " + step.dependsOn.compactMap { id in value.body.tasks.first { $0.id == id }?.title }.joined(separator: " · "))
                        }
                        if let provider = guides.first(where: { $0.id == step.providerId }) { Button(ContentText.get("openGuide")) { selectedGuide = provider } }
                        ContentProgressEditor(store: store, step: step, value: value)
                    }
                }
                ForEach(value.assets) { asset in
                    Section(asset.name) {
                        Text(asset.description)
                        if asset.transcriptConfirmed, !asset.transcript.isEmpty { Text(asset.transcript) }
                        Button(ContentText.get("download")) { download(asset, play: false) }.disabled(downloading || store.working)
                            .accessibilityIdentifier("content.publication-download.\(asset.id)")
                        if asset.kind == .voice {
                            Button(ContentText.get(voice.playing ? "stopPlayback" : "play")) {
                                if voice.playing { voice.stopPlayback() } else { download(asset, play: true) }
                            }.disabled(downloading || store.working)
                        }
                    }
                }
            } else {
                Section { Text(ContentText.get("checkingAccess")); Button(ContentText.get("refresh")) { Task { await store.refresh() } } }
            }
        }
        .id(store.value?.publicId ?? "no-publication")
        .disabled(!store.verified)
        .accessibilityHidden(!store.verified)
        .navigationTitle(ContentText.get("receivedPack")).navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("content.publication")
        .task(id: scenePhase) {
            guard scenePhase == .active else { store.hide(); return }
            while !Task.isCancelled {
                await store.refresh()
                try? await Task.sleep(for: .seconds(15))
            }
        }
        .onChange(of: store.verified) { _, verified in if !verified { voice.clear(); downloadTask?.cancel(); export = nil; exportPresented = false } }
        .onChange(of: scenePhase) { _, phase in if phase != .active { store.hide(); voice.clear(); downloadTask?.cancel() } }
        .onDisappear { store.clear(); voice.clear(); downloadTask?.cancel(); export = nil }
        .overlay {
            if !store.verified {
                VStack(spacing: 16) {
                    Text(store.message ?? ContentText.get("checkingAccess"))
                    Button(ContentText.get("refresh")) { Task { await store.refresh() } }
                }.frame(maxWidth: .infinity, maxHeight: .infinity).background(palette.background)
            }
        }
        .sheet(item: $selectedGuide) { item in
            NavigationStack { guide(item.id).toolbar { Button(ContentText.get("close")) { selectedGuide = nil } } }
        }
        .fileExporter(isPresented: $exportPresented, document: export?.document, contentType: export?.type ?? .data, defaultFilename: export?.name) { result in
            if case .failure(let error) = result { store.message = ContentText.error(error) }; export = nil
        }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .privacySensitive()
    }
    private func download(_ asset: ContentAsset, play: Bool) {
        guard store.verified, let publication = store.value else { return }
        downloading = true
        downloadTask = Task {
            defer { downloading = false }
            do {
                let data = try await store.client.download(asset, from: publication)
                guard !Task.isCancelled, scenePhase == .active, store.verified else { return }
                if play { voice.play(data) }
                else { export = .init(document: .init(bytes: data), name: asset.downloadName, type: UTType(mimeType: asset.mediaType) ?? .data); exportPresented = true }
            } catch { if !Task.isCancelled { store.message = ContentText.error(error) } }
        }
    }
}

struct ContentProgressEditor: View {
    let store: ContentPublicationStore
    let step: ContentStep
    let value: ContentPublication
    @State private var draft: ContentProgressInput
    @State private var version: Int
    @State private var saved: ContentProgressInput
    @State private var task: Task<Void, Never>?
    @State private var expanded = false
    init(store: ContentPublicationStore, step: ContentStep, value: ContentPublication) {
        self.store = store; self.step = step; self.value = value
        let p = value.progress.first { $0.taskId == step.id }
        let initial = p?.input ?? .init(taskId: step.id)
        _draft = State(initialValue: initial); _saved = State(initialValue: initial); _version = State(initialValue: p?.version ?? 0)
    }
    private var ready: Bool { step.dependsOn.allSatisfy { id in value.progress.contains { $0.taskId == id && $0.status == .completed } } }
    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            Picker(ContentText.get("progress"), selection: $draft.status) {
                ForEach(ContentStatus.allCases, id: \.self) { status in
                    Text(ContentText.get("status." + status.rawValue)).tag(status).disabled(!ready && [.submitted, .completed].contains(status))
                }
            }.pickerStyle(.menu).accessibilityIdentifier("content.progress-status.\(step.id)")
            ContentField(key: "reference", text: $draft.reference)
            ContentField(key: "progressNote", text: $draft.note, lines: 3)
            if !ready { Text(ContentText.get("prerequisitesPending")).font(.subheadline) }
            Button(ContentText.get("saveProgress")) { task = Task {
                if let result = await store.report(draft, version: version) { version = result.version; saved = result.input }
            } }.disabled(draft == saved || !store.verified || (!ready && [.submitted, .completed].contains(draft.status)))
                .accessibilityIdentifier("content.progress-save.\(step.id)")
        } label: {
            Text(ContentText.get("progress")).accessibilityIdentifier("content.progress-editor.\(step.id)")
        }
        .disabled(store.working)
        .onChange(of: value.progress.first { $0.taskId == step.id }?.version) { _, _ in
            if draft == saved, let progress = value.progress.first(where: { $0.taskId == step.id }) {
                draft = progress.input; saved = progress.input; version = progress.version
            }
        }
        .onDisappear { task?.cancel() }
    }
}
#endif
