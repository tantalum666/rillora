import SwiftUI

struct MatterEditorView: View {
    @State private var editor: MatterEditorStore
    @State private var showsArchiveConfirmation = false
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

        Form {
            if editor.state == .loading {
                Section {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Checking the latest version…")
                            .foregroundStyle(RilloraTheme.muted)
                    }
                }
            }

            Section("Matter") {
                TextField("Name", text: $editor.draft.title)
                    .textInputAutocapitalization(.sentences)
                    .accessibilityIdentifier("matter.edit.title")

                RilloraAdaptivePicker("Category", selection: $editor.draft.category) {
                    ForEach(MatterCategory.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }

                TextField("Institution or provider", text: $editor.draft.institutionName)
                    .textContentType(.organizationName)
                    .accessibilityIdentifier("matter.edit.institution")
            }

            Section {
                RilloraAdaptivePicker("Intended outcome", selection: $editor.draft.desiredOutcome) {
                    ForEach(MatterOutcome.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }

                RilloraAdaptivePicker("Preparation status", selection: $editor.draft.status) {
                    ForEach(MatterStatus.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
            } header: {
                Text("Directions")
            } footer: {
                Text("A saved direction is a request—not external completion, legal authority or ownership transfer.")
            }

            Section {
                TextField("Masked account hint, e.g. ending 42", text: $editor.draft.accountHint)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .accessibilityIdentifier("matter.edit.account-hint")

                TextField(
                    "Where an authorized person can locate documents or instructions",
                    text: $editor.draft.locationHint,
                    axis: .vertical
                )
                .lineLimit(2...5)
                .accessibilityIdentifier("matter.edit.location")
            } header: {
                Text("Locator")
            } footer: {
                Text("Use a masked hint or document location. Never save a password, recovery code, private key or seed phrase.")
            }

            Section("Value context") {
                RilloraAdaptivePicker("Value range", selection: $editor.draft.valueBand) {
                    ForEach(MatterValueBand.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }

                if editor.draft.valueBand != .none {
                    TextField("Currency code (optional)", text: $editor.draft.currencyCode)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("matter.edit.currency")
                }
            }

            Section("Review priority") {
                if dynamicTypeSize.isAccessibilitySize {
                    RilloraAdaptivePicker("Importance", selection: $editor.draft.importance) {
                        ForEach(MatterImportance.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                } else {
                    Picker("Importance", selection: $editor.draft.importance) {
                        ForEach(MatterImportance.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }

            if let source = editor.source {
                Section {
                    NavigationLink {
                        RoleAssignmentPolicyView(
                            matter: source,
                            contacts: contacts,
                            service: roleAssignmentService
                        )
                    } label: {
                        Label("Roles and disclosure scope", systemImage: "person.2.badge.gearshape")
                    }
                    .accessibilityIdentifier("matter.edit.role-policy")
                } footer: {
                    Text("Record only. No invitation, external access or legal authority is created.")
                }
            }

            if let validationMessage = editor.visibleValidationMessage {
                Section {
                    Label(validationMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(RilloraTheme.clay)
                        .accessibilityIdentifier("matter.edit.validation")
                }
            }

            if !editor.isNew {
                Section {
                    Button("Archive matter", role: .destructive) {
                        showsArchiveConfirmation = true
                    }
                    .accessibilityIdentifier("matter.edit.archive")
                } footer: {
                    Text("Archives only this Rillora record. The external account or asset is unchanged.")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle(editor.isNew ? "New matter" : "Edit matter")
        .navigationBarTitleDisplayMode(.inline)
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

            if editor.isNew {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
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

    private var editorFailureMessage: String {
        guard case .failed(let message, _) = editor.state else { return "" }
        return message
    }

    private var editorHasConflict: Bool {
        guard case .failed(_, let conflict) = editor.state else { return false }
        return conflict
    }
}
