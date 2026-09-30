import SwiftUI

struct MatterEditorView: View {
    @State private var editor: MatterEditorStore
    @State private var showsArchiveConfirmation = false
    @State private var showsDiscardConfirmation = false
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
                RilloraTextField(
                    title: "Name",
                    prompt: "Give this matter a short name",
                    text: $editor.draft.title,
                    identifier: "matter.edit.title",
                    required: true
                )
                    .textInputAutocapitalization(.sentences)

                RilloraAdaptivePicker("Category", selection: $editor.draft.category) {
                    ForEach(MatterCategory.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }

                RilloraTextField(
                    title: "Institution or provider",
                    prompt: "Bank, service or organization",
                    text: $editor.draft.institutionName,
                    identifier: "matter.edit.institution"
                )
                    .textContentType(.organizationName)
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
                RilloraTextField(
                    title: "Masked account hint",
                    prompt: "For example, ending 42",
                    text: $editor.draft.accountHint,
                    identifier: "matter.edit.account-hint"
                )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                RilloraTextField(
                    title: "Where to find it",
                    prompt: "Document location or instructions for an authorized person",
                    text: $editor.draft.locationHint,
                    identifier: "matter.edit.location",
                    axis: .vertical
                )
                .lineLimit(2...5)
            } header: {
                Text("Locator")
            } footer: {
                Text("Use a masked hint or document location. Never save a password, recovery code, private key or seed phrase.")
            }

            Section {
                DisclosureGroup("Value and review details") {
                    RilloraAdaptivePicker("Value range", selection: $editor.draft.valueBand) {
                        ForEach(MatterValueBand.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }

                    if editor.draft.valueBand != .none {
                        RilloraTextField(
                            title: "Currency code",
                            prompt: "USD, EUR or another code",
                            text: $editor.draft.currencyCode,
                            identifier: "matter.edit.currency"
                        )
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                    }
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
                .accessibilityIdentifier("matter.edit.details")
            } footer: {
                Text("Optional. Add value context and review priority when useful.")
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
