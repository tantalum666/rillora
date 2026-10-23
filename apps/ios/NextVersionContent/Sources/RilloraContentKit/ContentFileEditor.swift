#if os(iOS)
import SwiftUI
import UniformTypeIdentifiers
import AVFoundation

struct ContentFileEditor: View {
    let store: ContentStore
    let asset: ContentAsset?
    let isVoice: Bool
    @State private var metadata: ContentMetadata
    @State private var fileData: Data?
    @State private var importPresented = false
    @State private var importTask: Task<Void, Never>?
    @State private var operationTask: Task<Void, Never>?
    @State private var busy = false
    @State private var localError: String?
    @State private var voice = ContentVoice()
    @State private var attempt: UploadAttempt?
    @State private var export: ContentExport?
    @State private var exportPresented = false
    @State private var confirmDelete = false
    @State private var confirmDiscard = false
    @State private var dirty = false
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dismiss) private var dismiss
    private struct UploadAttempt { let key: String; let bytes: Data; let metadata: ContentMetadata }
    init(store: ContentStore, asset: ContentAsset?, isVoice: Bool) {
        self.store = store; self.asset = asset; self.isVoice = isVoice || asset?.kind == .voice
        _metadata = State(initialValue: asset?.metadata ?? .init(name: "", language: ContentText.chinese ? "zh-CN" : "en-US"))
    }
    private var blocked: Bool { busy || store.working || voice.phase == .recording || voice.phase == .permission || voice.transcribing }
    var body: some View {
        ContentForm {
            if let message = localError ?? store.message ?? voice.message { Section { Text(message).accessibilityIdentifier("content.editor-error") } }
            if isVoice { voiceSection }
            else if asset == nil {
                Section {
                    Button(ContentText.get(fileData == nil ? "chooseFile" : "replaceFile")) { importPresented = true }
                        .disabled(blocked || attempt != nil).accessibilityIdentifier("content.choose-file")
                    Text(ContentText.get("allowedFiles")).foregroundStyle(.secondary)
                }
            }
            Section {
                ContentField(key: "fileName", text: $metadata.name)
                ContentField(key: "fileDescription", text: $metadata.description, lines: 3)
            }.disabled(!store.canCreate || blocked || attempt != nil)
            if isVoice {
                Section(ContentText.get("transcript")) {
                    ContentField(key: "transcriptText", text: $metadata.transcript, lines: 5)
                    Toggle(ContentText.get("confirmTranscript"), isOn: $metadata.transcriptConfirmed)
                        .disabled(metadata.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        .accessibilityIdentifier("content.confirm-transcript")
                    Text(ContentText.get("transcriptBoundary")).font(.subheadline).foregroundStyle(.secondary)
                }.disabled(!store.canCreate || blocked || attempt != nil)
            }
            if let asset {
                Section {
                    Button(ContentText.get("download")) { download(asset) }.disabled(blocked || asset.state != "ready").accessibilityIdentifier("content.download")
                    Button(ContentText.get("delete"), role: .destructive) { confirmDelete = true }.disabled(blocked)
                }
            }
            if store.canCreate {
                Section {
                    Button(ContentText.get("save")) { operationTask = Task { await save() } }
                        .disabled(blocked || metadata.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || (asset == nil && (isVoice ? voice.bytes : fileData) == nil))
                        .accessibilityIdentifier("content.save-file")
                    if attempt != nil { Text(ContentText.get("retrySameUpload")).font(.subheadline).foregroundStyle(.secondary) }
                }
            }
            if busy || store.working { ProgressView() }
        }
        .navigationTitle(ContentText.get(isVoice ? "voice" : "file"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(ContentText.get("close")) { if dirty { confirmDiscard = true } else { dismiss() } }.disabled(blocked) } }
        .interactiveDismissDisabled(dirty || blocked)
        .onChange(of: metadata) { old, new in
            dirty = true
            if old.transcript != new.transcript { metadata.transcriptConfirmed = false }
        }
        .onChange(of: voice.bytes) { _, value in if value != nil { dirty = true } }
        .onChange(of: metadata.language) { _, _ in voice.discardTranscriptDraft() }
        .onChange(of: scenePhase) { _, phase in if phase == .background {
            voice.interrupted(); operationTask?.cancel(); export = nil; exportPresented = false
        } }
        .onReceive(NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)) { _ in voice.interrupted() }
        .onDisappear { importTask?.cancel(); operationTask?.cancel(); fileData = nil; attempt = nil; export = nil; voice.clear() }
        .fileImporter(isPresented: $importPresented, allowedContentTypes: [.pdf, .png, .jpeg, .webP], allowsMultipleSelection: false) { result in
            guard case .success(let urls) = result, let url = urls.first else { if case .failure(let e) = result { localError = ContentText.error(e) }; return }
            busy = true; localError = nil
            importTask = Task {
                defer { busy = false }
                do {
                    let bytes = try await ContentFileAccess.read(url)
                    guard !Task.isCancelled else { return }
                    fileData = bytes; metadata.name = String(url.lastPathComponent.prefix(160)); dirty = true
                } catch { if !Task.isCancelled { localError = ContentText.error(error) } }
            }
        }
        .fileExporter(isPresented: $exportPresented, document: export?.document, contentType: export?.type ?? .data, defaultFilename: export?.name) { result in
            if case .failure(let e) = result { localError = ContentText.error(e) }; export = nil
        }
        .alert(ContentText.get("deleteFile"), isPresented: $confirmDelete) {
            Button(ContentText.get("delete"), role: .destructive) { if let asset { operationTask = Task {
                if await store.perform({ try await store.client.remove(id: asset.id, asset: true) }) != nil { dirty = false; dismiss() }
            } } }
            Button(ContentText.get("cancel"), role: .cancel) {}
        } message: { Text(ContentText.get("savedCopies")) }
        .confirmationDialog(ContentText.get("discard"), isPresented: $confirmDiscard, titleVisibility: .visible) {
            Button(ContentText.get("discard"), role: .destructive) { dirty = false; dismiss() }
        }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .privacySensitive()
    }
    @ViewBuilder private var voiceSection: some View {
        Section {
            if asset == nil {
                if voice.phase == .recording {
                    Text("\(voice.seconds) / 180 " + ContentText.get("seconds"))
                    Button(ContentText.get("stopRecording")) { voice.finish() }.accessibilityIdentifier("content.stop-recording")
                } else {
                    Button(ContentText.get(voice.bytes == nil ? "startRecording" : "recordAgain")) {
                        metadata.beginNewRecording()
                        operationTask = Task { await voice.start() }
                    }
                        .disabled(blocked || attempt != nil).accessibilityIdentifier("content.start-recording")
                }
            }
            Button(ContentText.get(voice.playing ? "stopPlayback" : "play")) {
                if voice.playing { voice.stopPlayback() }
                else if let asset { busy = true; operationTask = Task {
                    defer { busy = false }
                    do {
                        let bytes = try await store.client.download(asset)
                        guard !Task.isCancelled, scenePhase == .active else { return }
                        voice.play(bytes)
                    } catch { if !Task.isCancelled { localError = ContentText.error(error) } }
                } }
                else { voice.play() }
            }.disabled(blocked || (asset == nil && voice.bytes == nil))
            if store.canCreate {
                Picker(ContentText.get("recordingLanguage"), selection: $metadata.language) {
                    Text(ContentText.get("mandarin")).tag("zh-CN")
                    Text(ContentText.get("english")).tag("en-US")
                }.disabled(blocked || attempt != nil).accessibilityIdentifier("content.recording-language")
            }
            if store.canCreate, asset != nil || voice.bytes != nil {
                Button(ContentText.get("transcribe")) { transcribe() }
                    .disabled(blocked || attempt != nil).accessibilityIdentifier("content.transcribe")
                if voice.transcribing {
                    Button(ContentText.get("cancelTranscription")) { voice.cancelSpeech() }
                        .accessibilityIdentifier("content.cancel-transcription")
                }
                if let draft = voice.transcriptDraft {
                    Text(draft)
                    Button(ContentText.get("useDraft")) { metadata.transcript = draft; metadata.transcriptConfirmed = false }.disabled(attempt != nil)
                }
            }
            Text(ContentText.get("voiceLimit")).foregroundStyle(.secondary)
        }
    }
    private func transcribe() {
        busy = true
        operationTask = Task {
            defer { busy = false }
            do {
                let recording: Data?
                if let asset { recording = try await store.client.download(asset) }
                else { recording = voice.bytes }
                guard !Task.isCancelled, scenePhase == .active else { return }
                await voice.transcribe(recording, language: metadata.language)
            } catch { if !Task.isCancelled { localError = ContentText.error(error) } }
        }
    }
    private func save() async {
        guard store.canCreate else { return }
        do { try ContentValidation.metadata(metadata) } catch { localError = ContentText.error(error); return }
        if let asset {
            if await store.perform({ try await store.client.update(asset, metadata: metadata) }) != nil { dirty = false; dismiss() }
        } else {
            if attempt == nil, let bytes = isVoice ? voice.bytes : fileData {
                let key = UUID().uuidString.lowercased()
                do { _ = try ContentBinary.upload(bytes, requestKey: key, kind: isVoice ? .voice : .file, metadata: metadata) }
                catch { localError = ContentText.error(error); return }
                attempt = .init(key: key, bytes: bytes, metadata: metadata)
            }
            guard let attempt else { return }
            if await store.perform({ try await store.client.upload(attempt.bytes, key: attempt.key, kind: isVoice ? .voice : .file, metadata: attempt.metadata) }) != nil {
                dirty = false; dismiss()
            }
        }
    }
    private func download(_ asset: ContentAsset) {
        busy = true; operationTask = Task { defer { busy = false }
            do {
                let bytes = try await store.client.download(asset)
                guard !Task.isCancelled, scenePhase == .active else { return }
                export = .init(document: .init(bytes: bytes), name: asset.downloadName, type: UTType(mimeType: asset.mediaType) ?? .data)
                exportPresented = true
            } catch { if !Task.isCancelled { localError = ContentText.error(error) } }
        }
    }
}
#endif
