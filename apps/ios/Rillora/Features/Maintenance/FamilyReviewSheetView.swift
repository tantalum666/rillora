import SwiftUI

struct FamilyReviewSheetView: View {
    let destination: FamilyReviewSheet
    @Bindable var store: FamilyMaintenanceStore
    let overviewStore: OverviewStore
    @Environment(\.dismiss) private var dismiss
    @State private var selected: Set<String> = []
    @State private var due = Date().addingTimeInterval(7 * 86400)
    @State private var requestKey = UUID().uuidString
    @State private var cadence = 90
    @State private var collaborator = ""
    @State private var suggesting = false
    @State private var provider = ""
    @State private var location = ""
    @State private var dirty = false
    @State private var discard = false
    @State private var initialized = false

    var body: some View {
        RilloraForm {
            if let error = store.errorMessage { Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(RilloraTheme.muted) } }
            switch destination {
            case .start: startContent
            case .settings(let settings, let people, let enabled): settingsContent(settings, people: people, enabled: enabled)
            case .task(let task, let owner): taskContent(task, owner: owner)
            case .close(let round, let complete): closeContent(round, complete: complete)
            }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .navigationTitle(title).navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(hasChanges || store.isWorking)
        .toolbar { ToolbarItem(placement: .cancellationAction) {
            Button("Done") { if hasChanges { discard = true } else { dismiss() } }.disabled(store.isWorking)
                .accessibilityIdentifier("maintenance.sheet.close")
        } }
        .alert("Discard this draft?", isPresented: $discard) {
            Button("Discard draft", role: .destructive) { dismiss() }
            Button("Keep editing", role: .cancel) {}
        }
        .task {
            guard !initialized else { return }; initialized = true; store.errorMessage = nil
            switch destination {
            case .settings(let s, _, _): cadence = s.cadenceDays; collaborator = s.collaboratorConnectionPublicId ?? ""
            case .task(let t, _): provider = t.fields["institutionName"] ?? ""; location = t.fields["locationHint"] ?? ""
            default: break
            }
        }
        .accessibilityIdentifier("maintenance.sheet")
    }
    private var title: String {
        switch destination {
        case .start: "Choose what to check"
        case .settings: "Review settings"
        case .task(let task, _): task.title
        case .close(_, let complete): complete ? "Finish review" : "Cancel review"
        }
    }
    private var hasChanges: Bool {
        switch destination {
        case .start: !selected.isEmpty || dirty
        case .settings(let settings, _, _): cadence != settings.cadenceDays || collaborator != (settings.collaboratorConnectionPublicId ?? "")
        case .task(let task, _): suggesting && !proposedFields(task).isEmpty
        case .close: false
        }
    }
    private func run(changesMap: Bool = false, _ action: @escaping () async throws -> Void) {
        Task {
            if await store.perform(action) {
                dirty = false; dismiss()
                if changesMap { await overviewStore.reload() }
            }
        }
    }
    @ViewBuilder private var startContent: some View {
        let eligible = store.data?.eligible ?? []
        Section {
            DatePicker("Review by", selection: $due, in: Date()...Date().addingTimeInterval(365 * 86400), displayedComponents: .date)
                .onChange(of: due) { _, _ in dirty = true }.disabled(store.isWorking)
        }
        Section {
            ForEach(eligible) { item in
                Toggle(isOn: Binding(get: { selected.contains(item.id) }, set: { value in
                    if value { selected.insert(item.id) } else { selected.remove(item.id) }; dirty = true
                })) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text(item.title).foregroundStyle(RilloraTheme.ink)
                        Text(item.personName).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        if item.missingLocation { Text("Location missing").font(.subheadline).foregroundStyle(RilloraTheme.clay) }
                    }
                }.tint(RilloraTheme.tabSelection).padding(.vertical, 5).disabled(store.isWorking)
                    .accessibilityIdentifier("maintenance.select.\(item.connectionPublicId).\(item.matterPublicId)")
            }
            if eligible.isEmpty { Text("Connect someone and share Directions or Details first.") }
        }
        Section {
            Button {
                let items = eligible.filter { selected.contains($0.id) }.map { FamilyReviewStartRequest.Item(connectionPublicId: $0.connectionPublicId, matterPublicId: $0.matterPublicId) }
                run { try await store.service.startFamilyReview(.init(requestKey: requestKey, dueAt: due.ISO8601Format(), items: items)) }
            } label: { Label("Request \(selected.count) \(selected.count == 1 ? "check" : "checks")", systemImage: "arrow.right").frame(maxWidth: .infinity) }
                .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(selected.isEmpty || store.isWorking)
                .accessibilityIdentifier("maintenance.request")
        } footer: { Text("Appears in their Rillora review inbox.") }
        .listRowBackground(Color.clear)
    }
    @ViewBuilder private func settingsContent(_ original: FamilyReviewSettings, people: [FamilyReviewSelection], enabled: Bool) -> some View {
        let unique = people.reduce(into: [FamilyReviewSelection]()) { result, item in if !result.contains(where: { $0.connectionPublicId == item.connectionPublicId }) { result.append(item) } }
        Section {
            Picker("Review cadence", selection: $cadence) {
                Text("Off").tag(0); Text("Every month").tag(30); Text("Every 3 months").tag(90)
                Text("Every 6 months").tag(180); Text("Every year").tag(365)
            }.onChange(of: cadence) { _, _ in if initialized { dirty = true } }.disabled(!enabled || store.isWorking)
            Picker("Who can suggest corrections?", selection: $collaborator) {
                Text("No one · checks only").tag("")
                ForEach(unique) { person in Text(person.personName).tag(person.connectionPublicId) }
            }.onChange(of: collaborator) { _, _ in if initialized { dirty = true } }.disabled(!enabled || store.isWorking)
                .accessibilityIdentifier("maintenance.collaborator")
        } footer: { Text("You approve changes before your map updates.") }
        Section {
            Button {
                run { try await store.service.saveFamilyReviewSettings(.init(expectedVersion: original.version, cadenceDays: cadence,
                    collaboratorConnectionPublicId: collaborator.isEmpty ? nil : collaborator,
                    nextReviewAt: cadence == original.cadenceDays ? original.nextReviewAt : nil)) }
            } label: { Label("Save settings", systemImage: "checkmark").frame(maxWidth: .infinity) }
                .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!hasChanges || !enabled || store.isWorking)
                .accessibilityIdentifier("maintenance.settings.save")
            if !enabled {
                Button("Pause reviews and suggestions") {
                    run { try await store.service.saveFamilyReviewSettings(.init(expectedVersion: original.version, cadenceDays: 0, collaboratorConnectionPublicId: nil, nextReviewAt: nil)) }
                }.disabled(store.isWorking)
            }
        }.listRowBackground(Color.clear)
    }
    @ViewBuilder private func taskContent(_ task: FamilyReviewTask, owner: Bool) -> some View {
        Section {
            Label("\(owner ? task.personName : task.ownerName) · \(task.statusLabel)", systemImage: task.symbol)
                .foregroundStyle(RilloraTheme.muted)
            direction("Provider", task.fields["institutionName"])
            direction("Where to find it", task.fields["locationHint"])
        }
        if let reason = task.reason { Section { Label(reasonLabel(reason), systemImage: "exclamationmark.circle").foregroundStyle(RilloraTheme.clay) } }
        if let proposal = task.proposal {
            Section("Suggested correction") { FamilyReviewFieldChanges(before: task.fields, after: task.fields.merging(proposal) { _, new in new }) }
        }
        if task.isStale || !task.scopeAvailable { Section { Text(task.isStale ? "The matter changed. A fresh check is needed." : "Sharing changed. This check is no longer current.") } }
        if owner && task.canManage {
            Section {
                if task.state == "suggested" && !task.isStale && task.scopeAvailable && task.canSuggest {
                    Button { decide(task, "apply", changesMap: true) } label: { Label("Apply update", systemImage: "checkmark").frame(maxWidth: .infinity) }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("maintenance.apply")
                }
                if ["suggested", "needs_update"].contains(task.state) { Button("Keep current directions") { decide(task, "dismiss") }.accessibilityIdentifier("maintenance.keep") }
                Button("Request a fresh check") { decide(task, "reopen") }.accessibilityIdentifier("maintenance.reopen")
            }.disabled(store.isWorking).listRowBackground(Color.clear)
        }
        if !owner && task.canRespond {
            if suggesting {
                Section("Suggest a correction") {
                    VStack(alignment: .leading, spacing: 10) { Text("Provider").font(.subheadline); TextField("Provider", text: $provider).foregroundStyle(RilloraTheme.body).onChange(of: provider) { _, next in provider = String(next.prefix(160)); dirty = true } }
                    VStack(alignment: .leading, spacing: 10) { Text("Where to find it").font(.subheadline); TextField("Where to find it", text: $location, axis: .vertical).lineLimit(3...8).foregroundStyle(RilloraTheme.body).onChange(of: location) { _, next in location = String(next.prefix(500)); dirty = true }.accessibilityIdentifier("maintenance.suggestion.location") }
                }.disabled(store.isWorking)
                Section {
                    Button { respond(task, "suggested", proposal: proposedFields(task)) } label: { Label("Send for approval", systemImage: "arrow.right").frame(maxWidth: .infinity) }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(proposedFields(task).isEmpty || proposedFields(task).values.contains(where: { $0.isEmpty }) || store.isWorking)
                        .accessibilityIdentifier("maintenance.suggestion.send")
                }.listRowBackground(Color.clear)
            } else {
                Section {
                    Button { respond(task, "confirmed") } label: { Label("I can find it", systemImage: "checkmark.circle").frame(maxWidth: .infinity) }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("maintenance.confirm")
                    ForEach(["cannot_find", "outdated", "unclear"], id: \.self) { reason in
                        Button(reasonLabel(reason)) { respond(task, "needs_update", reason: reason) }.frame(minHeight: 44)
                            .accessibilityIdentifier("maintenance.reason.\(reason)")
                    }
                    if task.canSuggest { Button("Suggest a correction") { suggesting = true }.frame(minHeight: 44).accessibilityIdentifier("maintenance.suggest") }
                }.disabled(store.isWorking).listRowBackground(Color.clear)
            }
        }
    }
    @ViewBuilder private func closeContent(_ round: FamilyReviewRound, complete: Bool) -> some View {
        Section {
            Image(systemName: "checkmark.circle").font(.system(size: 58)).foregroundStyle(RilloraTheme.tabSelection).frame(maxWidth: .infinity).padding(.vertical, 20)
            Text(complete ? "These checks and your decisions stay in review history." : "Existing directions and sharing stay unchanged.")
            Button {
                run { try await store.service.closeFamilyReview(round.publicId, request: .init(expectedVersion: round.version, action: complete ? "complete" : "cancel")) }
            } label: { Label(complete ? "Finish review" : "Cancel review", systemImage: "checkmark").frame(maxWidth: .infinity) }
                .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(store.isWorking).accessibilityIdentifier("maintenance.close.confirm")
        }.listRowBackground(Color.clear)
    }
    private func direction(_ title: String, _ value: String?) -> some View {
        VStack(alignment: .leading, spacing: 9) { Text(title).font(.subheadline).foregroundStyle(RilloraTheme.muted); Text(value.flatMap { $0.isEmpty ? nil : $0 } ?? "Not added").foregroundStyle(RilloraTheme.ink).fixedSize(horizontal: false, vertical: true) }.padding(.vertical, 8)
    }
    private func proposedFields(_ task: FamilyReviewTask) -> [String: String] {
        var changes: [String: String] = [:]
        if provider.trimmingCharacters(in: .whitespacesAndNewlines) != task.fields["institutionName"] { changes["institutionName"] = provider.trimmingCharacters(in: .whitespacesAndNewlines) }
        if location.trimmingCharacters(in: .whitespacesAndNewlines) != task.fields["locationHint"] { changes["locationHint"] = location.trimmingCharacters(in: .whitespacesAndNewlines) }
        return changes
    }
    private func respond(_ task: FamilyReviewTask, _ response: String, reason: String? = nil, proposal: [String: String]? = nil) {
        run { try await store.service.respondToFamilyReview(task.publicId, request: .init(expectedVersion: task.version, response: response, reason: reason, proposal: proposal)) }
    }
    private func decide(_ task: FamilyReviewTask, _ action: String, changesMap: Bool = false) {
        run(changesMap: changesMap) { try await store.service.decideFamilyReview(task.publicId, request: .init(expectedVersion: task.version, action: action)) }
    }
    private func reasonLabel(_ value: String) -> String { switch value { case "cannot_find": "Can't find it"; case "outdated": "Out of date"; default: "Directions unclear" } }
}
