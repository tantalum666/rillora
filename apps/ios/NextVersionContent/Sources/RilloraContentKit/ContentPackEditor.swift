#if os(iOS)
import SwiftUI

struct ContentPackEditor<Guide: View>: View {
    let store: ContentStore
    let previous: ContentPack?
    let contacts: [ContentChoice], matters: [ContentChoice], guides: [ContentChoice]
    let guide: (String) -> Guide
    @State private var draft: ContentPackInput
    @State private var selectedStep: ContentStep?
    @State private var discard = false
    @State private var message: String?
    @State private var task: Task<Void, Never>?
    @Environment(\.dismiss) private var dismiss
    init(store: ContentStore, previous: ContentPack?, contacts: [ContentChoice], matters: [ContentChoice], guides: [ContentChoice], guide: @escaping (String) -> Guide) {
        self.store = store; self.previous = previous; self.contacts = contacts; self.matters = matters; self.guides = guides; self.guide = guide
        _draft = State(initialValue: previous?.draft ?? .init())
    }
    private var dirty: Bool { draft != (previous?.draft ?? .init()) }
    var body: some View {
        ContentForm {
            if let message = message ?? store.message { Section { Text(message).accessibilityIdentifier("content.editor-error") } }
            Section {
                ContentField(key: "packTitle", text: $draft.body.title)
                ContentChoicePicker(key: "person", choices: contacts, selected: $draft.personPublicId)
                Picker(ContentText.get("intent"), selection: $draft.intent) {
                    Text(ContentText.get("future")).tag(ContentIntent.after_death)
                    Text(ContentText.get("current")).tag(ContentIntent.current)
                }.accessibilityIdentifier("content.intent")
                Text(ContentText.get(draft.intent == .after_death ? "futureBoundary" : "currentBoundary")).font(.subheadline).foregroundStyle(.secondary)
                if previous?.publicationId != nil { Text(ContentText.get("existingShareBoundary")).font(.subheadline).foregroundStyle(.secondary) }
                ContentField(key: "packNote", text: $draft.body.note, lines: 3)
            }.disabled(!store.canCreate || store.working)
            Section(ContentText.get("steps")) {
                ForEach(draft.body.tasks) { step in
                    Button { selectedStep = step } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(step.title.isEmpty ? ContentText.get("untitledStep") : step.title)
                            Text(ContentText.get("action." + step.action.rawValue)).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }.accessibilityIdentifier("content.step.\(step.id)")
                }.onDelete { offsets in
                    for id in offsets.map({ draft.body.tasks[$0].id }) { draft.body.removeStep(id) }
                }.onMove { draft.body.tasks.move(fromOffsets: $0, toOffset: $1) }
                Button(ContentText.get("addStep")) { selectedStep = ContentStep() }
                    .disabled(draft.body.tasks.count >= 30).accessibilityIdentifier("content.add-step")
            }.disabled(!store.canCreate || store.working)
            Section(ContentText.get("selectedFiles")) {
                let assets = store.workspace?.assets.filter { $0.state == "ready" } ?? []
                ForEach(assets) { asset in
                    Toggle(asset.name, isOn: Binding(get: { draft.body.assetPublicIds.contains(asset.id) }, set: { selected in
                        if selected { draft.body.assetPublicIds.append(asset.id); draft.body.assetVersions[asset.id] = asset.version }
                        else { draft.body.assetPublicIds.removeAll { $0 == asset.id }; draft.body.assetVersions.removeValue(forKey: asset.id) }
                    })).disabled(!draft.body.assetPublicIds.contains(asset.id) && draft.body.assetPublicIds.count >= 20)
                }
                ForEach(draft.body.assetPublicIds.filter { id in !assets.contains { $0.id == id } }, id: \.self) { id in
                    Button(ContentText.get("removeUnavailableFile"), role: .destructive) {
                        draft.body.assetPublicIds.removeAll { $0 == id }; draft.body.assetVersions.removeValue(forKey: id)
                    }
                }
                if assets.isEmpty { Text(ContentText.get("noFiles")) }
                Text(ContentText.get("fileVersionNotice")).font(.subheadline).foregroundStyle(.secondary)
            }.disabled(!store.canCreate || store.working)
            if store.canCreate {
                Button(ContentText.get("save")) { task = Task { await save() } }
                    .disabled(store.working || draft.body.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityIdentifier("content.save-pack")
            }
        }
        .navigationTitle(ContentText.get(previous == nil ? "newPack" : "editPack")).navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button(ContentText.get("close")) { if dirty { discard = true } else { dismiss() } }.disabled(store.working) }
            ToolbarItem(placement: .primaryAction) { EditButton().disabled(!store.canCreate || store.working) }
        }
        .interactiveDismissDisabled(dirty || store.working)
        .confirmationDialog(ContentText.get("discard"), isPresented: $discard, titleVisibility: .visible) {
            Button(ContentText.get("discard"), role: .destructive) { dismiss() }
        }
        .sheet(item: $selectedStep) { step in
            NavigationStack {
                ContentStepEditor(step: step, otherSteps: draft.body.tasks.filter { $0.id != step.id }, matters: matters, guides: guides, guide: guide) { edited in
                    if let i = draft.body.tasks.firstIndex(where: { $0.id == edited.id }) { draft.body.tasks[i] = edited }
                    else { draft.body.tasks.append(edited) }
                }
            }
        }
        .onDisappear { task?.cancel() }
    }
    private func save() async {
        guard store.canCreate else { return }
        var input = draft
        let assets = store.workspace?.assets ?? []
        do {
            for id in input.body.assetPublicIds {
                guard let asset = assets.first(where: { $0.id == id && $0.state == "ready" }) else { throw ContentError.invalidInput }
                input.body.assetVersions[id] = asset.version
            }
            try ContentValidation.body(input.body)
            if await store.perform({ try await store.client.save(input, previous: previous) }) != nil { dismiss() }
        } catch { message = ContentText.error(error) }
    }
}

struct ContentStepEditor<Guide: View>: View {
    @State var step: ContentStep
    let otherSteps: [ContentStep]
    let matters: [ContentChoice], guides: [ContentChoice]
    let guide: (String) -> Guide
    let save: (ContentStep) -> Void
    @State private var selectedGuide: ContentChoice?
    @State private var message: String?
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        ContentForm {
            Section {
                ContentField(key: "stepTitle", text: $step.title)
                Picker(ContentText.get("action"), selection: $step.action) {
                    ForEach(ContentAction.allCases, id: \.self) { Text(ContentText.get("action." + $0.rawValue)).tag($0) }
                }
                ContentChoicePicker(key: "matter", choices: matters, selected: $step.matterPublicId)
                ContentField(key: "instructions", text: $step.instructions, lines: 4)
                ContentChoicePicker(key: "provider", choices: guides, selected: $step.providerId)
                if let selected = guides.first(where: { $0.id == step.providerId }) {
                    Button(ContentText.get("openGuide")) { selectedGuide = selected }
                }
            }
            Section(ContentText.get("prerequisites")) {
                ForEach(otherSteps) { other in
                    Toggle(other.title, isOn: Binding(get: { step.dependsOn.contains(other.id) }, set: { selected in
                        if selected { step.dependsOn.append(other.id) } else { step.dependsOn.removeAll { $0 == other.id } }
                    })).disabled(!step.dependsOn.contains(other.id) && step.dependsOn.count >= 10)
                }
                if otherSteps.isEmpty { Text(ContentText.get("noPrerequisites")) }
            }
            if let message { Text(message) }
            Button(ContentText.get("saveStep")) {
                do {
                    try ContentValidation.text(step.title, max: 180, required: true); try ContentValidation.text(step.instructions, max: 2500)
                    save(step); dismiss()
                } catch { message = ContentText.error(error) }
            }.accessibilityIdentifier("content.save-step")
        }
        .navigationTitle(ContentText.get("step")).navigationBarTitleDisplayMode(.inline)
        .toolbar { Button(ContentText.get("cancel")) { dismiss() } }
        .interactiveDismissDisabled()
        .sheet(item: $selectedGuide) { item in
            NavigationStack { guide(item.id).toolbar { Button(ContentText.get("close")) { selectedGuide = nil } } }
        }
    }
}
#endif
