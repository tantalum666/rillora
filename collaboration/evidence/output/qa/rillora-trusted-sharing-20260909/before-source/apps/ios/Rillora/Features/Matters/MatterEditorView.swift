import SwiftUI

struct MatterEditorView: View {
    @State private var editor: MatterEditorStore
    @State private var showsArchiveConfirmation = false
    @State private var showsDiscardConfirmation = false
    @State private var activePart = "details"
    @RilloraReduceMotion private var reduceMotion
    let overviewStore: OverviewStore
    let roleAssignmentService: any RoleAssignmentEditing
    let contacts: [TrustedContact]
    let onSaved: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(
        matter: Matter?,
        initialDraft: MatterDraft? = nil,
        service: any MatterEditing,
        roleAssignmentService: any RoleAssignmentEditing,
        contacts: [TrustedContact],
        overviewStore: OverviewStore,
        onSaved: (() -> Void)? = nil
    ) {
        _editor = State(
            initialValue: MatterEditorStore(
                matter: matter,
                initialDraft: initialDraft,
                service: service
            )
        )
        self.overviewStore = overviewStore
        self.roleAssignmentService = roleAssignmentService
        self.contacts = contacts
        self.onSaved = onSaved
    }

    var body: some View {
        @Bindable var editor = editor

        RilloraForm {
            Section {
                RilloraTaskTabs(tabs: [
                    .init(id: "details", title: "Details", symbol: "doc.text"),
                    .init(id: "directions", title: "Directions", symbol: "arrow.triangle.branch"),
                    .init(id: "people", title: "People", symbol: "person.2"),
                ], selection: $activePart, identifierPrefix: "matter.section")
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)

            if editor.state == .loading {
                Section { ProgressView("Checking latest version…") }
            }

            if activePart == "details" {
                Section {
                    MatterCategoryChoices(selection: $editor.draft.category)
                    RilloraTextField(
                        title: "Name", prompt: "Name this matter",
                        text: $editor.draft.title, identifier: "matter.edit.title", required: true
                    )
                    .textInputAutocapitalization(.sentences)
                    RilloraTextField(
                        title: "Where to find it", prompt: "A useful location, never a password",
                        text: $editor.draft.locationHint, identifier: "matter.edit.location", axis: .vertical
                    )
                    .lineLimit(4)
                }

                Section {
                    DisclosureGroup("More details") {
                        RilloraTextField(
                            title: "Institution or provider", prompt: "Bank, service or organisation",
                            text: $editor.draft.institutionName, identifier: "matter.edit.institution"
                        )
                        .textContentType(.organizationName)
                        RilloraTextField(
                            title: "Masked account hint", prompt: "For example, ending 42",
                            text: $editor.draft.accountHint, identifier: "matter.edit.account-hint"
                        )
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        RilloraAdaptivePicker("Value range", selection: $editor.draft.valueBand) {
                            ForEach(MatterValueBand.allCases) { Text($0.label).tag($0) }
                        }
                        RilloraTextField(
                            title: "Currency", prompt: "USD, HKD or another currency",
                            text: $editor.draft.currencyCode, identifier: "matter.edit.currency"
                        )
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        RilloraAdaptivePicker("Importance", selection: $editor.draft.importance) {
                            ForEach(MatterImportance.allCases) { Text($0.label).tag($0) }
                        }
                    }
                    .accessibilityIdentifier("matter.edit.details")
                }
            } else if activePart == "directions" {
                Section("Intended outcome") {
                    ForEach(MatterOutcome.allCases) { outcome in
                        Button { editor.draft.desiredOutcome = outcome } label: {
                            HStack(spacing: 12) {
                                Text(outcome.label).foregroundStyle(RilloraTheme.ink)
                                Spacer()
                                Image(systemName: editor.draft.desiredOutcome == outcome ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(editor.draft.desiredOutcome == outcome ? RilloraTheme.tabSelection : RilloraTheme.muted)
                            }
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(RilloraQuietButtonStyle())
                        .accessibilityAddTraits(editor.draft.desiredOutcome == outcome ? .isSelected : [])
                        .accessibilityIdentifier("matter.outcome.\(outcome.rawValue)")
                    }
                }
                Section {
                    RilloraAdaptivePicker("Preparation status", selection: $editor.draft.status) {
                        ForEach(MatterStatus.allCases) { Text($0.label).tag($0) }
                    }
                    RilloraInfoDisclosure("About directions") {
                        Text("A saved direction is a request—not external completion, legal authority or ownership transfer.")
                            .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    }
                }
            } else {
                Section {
                    if let source = editor.source {
                        NavigationLink {
                            RoleAssignmentPolicyView(matter: source, contacts: contacts, service: roleAssignmentService)
                        } label: {
                            Label("Roles and disclosure scope", systemImage: "person.2.badge.gearshape")
                        }
                        .accessibilityIdentifier("matter.edit.role-policy")
                    } else {
                        Label("Save this matter before adding people.", systemImage: "person.badge.plus")
                            .foregroundStyle(RilloraTheme.muted)
                        Button("Back to details") { activePart = "details" }
                    }
                    RilloraInfoDisclosure("Record only") {
                        RilloraFactStrip([
                            .init(title: "No invitation", systemImage: "envelope"),
                            .init(title: "No account access", systemImage: "lock.shield"),
                            .init(title: "No legal authority", systemImage: "building.columns"),
                        ])
                    }
                }
            }

            if let validationMessage = editor.visibleValidationMessage {
                Section {
                    Label(validationMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(RilloraTheme.clay)
                        .accessibilityIdentifier("matter.edit.validation")
                }
            }
            if !editor.isNew, activePart == "details" {
                Section {
                    Button("Archive matter", role: .destructive) { showsArchiveConfirmation = true }
                        .accessibilityIdentifier("matter.edit.archive")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: activePart)
        .navigationTitle(editor.isNew ? "New matter" : "Edit matter")
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(editor.isBusy || editor.hasUnsavedChanges)
        .navigationBarBackButtonHidden(!editor.isNew && (editor.isBusy || editor.hasUnsavedChanges))
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(editor.state == .saving ? "Saving…" : "Save") {
                    Task {
                        let wasNew = editor.isNew
                        guard let saved = await editor.save() else { return }
                        if wasNew {
                            overviewStore.applyCreatedMatter(saved)
                        } else {
                            overviewStore.applySavedMatter(saved)
                        }
                        dismiss()
                        await overviewStore.reconcileAfterMutation()
                        onSaved?()
                    }
                }
                .disabled(!editor.canSave)
                .accessibilityIdentifier("matter.edit.save")
            }

            if editor.isNew || editor.hasUnsavedChanges || editor.isBusy {
                ToolbarItem(placement: .cancellationAction) {
                    Button(editor.isNew ? "Cancel" : "Back", action: requestDismiss)
                        .disabled(editor.isBusy)
                        .alert("Discard unsaved changes?", isPresented: $showsDiscardConfirmation) {
                            Button("Discard changes", role: .destructive) { dismiss() }
                            Button("Keep editing", role: .cancel) {}
                        } message: {
                            Text("Your changes to this matter have not been saved.")
                        }
                }
            }
        }
        .task {
            await editor.loadLatestIfNeeded()
        }
        .alert(
            editorFailureTitle,
            isPresented: Binding(
                get: { if case .failed = editor.state { true } else { false } },
                set: { if !$0 { editor.clearFailure() } }
            )
        ) {
            if editorHasConflict {
                Button("Reload latest") {
                    Task { await editor.loadLatest() }
                }
                Button("Keep editing", role: .cancel) {
                    editor.clearFailure()
                }
            } else {
                Button("OK", role: .cancel) {
                    editor.clearFailure()
                }
            }
        } message: {
            Text(editorFailureMessage)
        }
        .confirmationDialog(
            "Archive this matter?",
            isPresented: $showsArchiveConfirmation,
            titleVisibility: .visible
        ) {
            Button("Archive matter", role: .destructive) {
                Task {
                    guard let publicID = await editor.archive() else { return }
                    overviewStore.applyArchivedMatter(publicID: publicID)
                    dismiss()
                    await overviewStore.reconcileAfterMutation()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("The Rillora record will leave the active map. No external account or asset is changed.")
        }
        .accessibilityIdentifier("matter.editor")
    }

    private var editorFailureTitle: String {
        editorHasConflict ? "This matter changed" : "Matter not saved"
    }

    private func requestDismiss() {
        if editor.hasUnsavedChanges { showsDiscardConfirmation = true }
        else { dismiss() }
    }

    private var editorFailureMessage: String {
        guard case .failed(let message, _) = editor.state else { return "" }
        return message
    }

    private var editorHasConflict: Bool {
        guard case .failed(_, let conflict) = editor.state else { return false }
        return conflict
    }
}
