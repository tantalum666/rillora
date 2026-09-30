import SwiftUI

struct MatterEditorView: View {
    @State private var editor: MatterEditorStore
    @State private var showsArchiveConfirmation = false
    @State private var showsDiscardConfirmation = false
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
            if editor.state == .loading {
                Section { ProgressView("Checking latest version…") }
            }
            Section {
                RilloraAdaptivePicker("Category", selection: $editor.draft.category) {
                    ForEach(MatterCategory.allCases) { Text($0.label).tag($0) }
                }
                .accessibilityIdentifier("matter.edit.category")
                RilloraTextField(title: "Name", prompt: "Name this matter", text: $editor.draft.title,
                                 identifier: "matter.edit.title", required: true)
                    .textInputAutocapitalization(.sentences)
            }
            Section {
                if editor.draft.category == .cryptoAsset {
                    RilloraAdaptivePicker("Held in · Required", selection: detailBinding("cryptoCustody")) {
                        Text("Choose…").tag("")
                        Text("An exchange").tag("exchange")
                        Text("An on-chain wallet").tag("self_custody")
                    }.accessibilityIdentifier("matter.edit.crypto-custody")
                }
                if editor.draft.showsProvider {
                    RilloraTextField(title: editor.draft.category.providerTitle, prompt: editor.draft.category.providerTitle,
                                     text: $editor.draft.institutionName, identifier: "matter.edit.institution",
                                     required: editor.draft.requiresProvider)
                        .textContentType(.organizationName)
                }
                ForEach(editor.draft.category.detailFields(custody: editor.draft.cryptoCustody)) { field in
                    RilloraTextField(title: field.title, prompt: field.prompt, text: detailBinding(field.id),
                                     identifier: "matter.edit.\(field.id)", required: field.required,
                                     axis: field.id == "walletAddress" ? .vertical : .horizontal)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                if editor.draft.category == .subscription {
                    RilloraAdaptivePicker("Billing cycle", selection: detailBinding("billingCycle")) {
                        Text("Not added").tag("")
                        Text("Monthly").tag("monthly")
                        Text("Annual").tag("annual")
                        Text("Other").tag("other")
                    }
                }
                RilloraTextField(title: editor.draft.category.locationTitle, prompt: "A useful location, never a password",
                                 text: $editor.draft.locationHint, identifier: "matter.edit.location",
                                 required: editor.draft.category.requiresLocation, axis: .vertical)
                if editor.draft.showsAccountHint {
                    RilloraTextField(title: editor.draft.category == .device ? "Masked serial hint" : "Username or masked reference",
                                     prompt: "For example, ending 42", text: $editor.draft.accountHint,
                                     identifier: "matter.edit.account-hint")
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                if editor.draft.category.hasValue {
                    DisclosureGroup("Value · Optional") {
                        RilloraAdaptivePicker("Value range", selection: $editor.draft.valueBand) {
                            ForEach(MatterValueBand.allCases) { Text($0.label).tag($0) }
                        }
                        RilloraTextField(title: "Currency", prompt: "USD or HKD", text: $editor.draft.currencyCode,
                                         identifier: "matter.edit.currency")
                            .textInputAutocapitalization(.characters).autocorrectionDisabled()
                    }
                }
            } header: { Text("Details") }
            Section {
                RilloraAdaptivePicker("Preferred outcome", selection: $editor.draft.desiredOutcome) {
                    ForEach(MatterOutcome.allCases) { Text($0.label).tag($0) }
                }
                DisclosureGroup("More options") {
                    RilloraAdaptivePicker("Importance", selection: $editor.draft.importance) {
                        ForEach(MatterImportance.allCases) { Text($0.label).tag($0) }
                    }
                    RilloraAdaptivePicker("Preparation status", selection: $editor.draft.status) {
                        ForEach(MatterStatus.allCases) { Text($0.label).tag($0) }
                    }
                    if let source = editor.source {
                        NavigationLink {
                            RoleAssignmentPolicyView(matter: source, contacts: contacts, service: roleAssignmentService)
                        } label: { Label("Recorded roles", systemImage: "person.2") }
                            .disabled(editor.hasUnsavedChanges)
                            .accessibilityIdentifier("matter.edit.role-policy")
                    }
                }
            } header: { Text("Directions · Optional") }
            Section {
                Label(editor.isNew ? "Private until you choose to share" : "Access is managed in Trusted contacts", systemImage: "person.crop.circle.badge.checkmark")
                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
            } header: { Text("People") }
            Section {
                RilloraTextField(title: "Notes", prompt: "Anything else someone should know", text: $editor.draft.notes,
                                 identifier: "matter.edit.notes", axis: .vertical)
                    .lineLimit(3...8)
            } footer: {
                Text("Keep passwords, private keys and recovery phrases out.")
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
                    Button("Archive matter", role: .destructive) { showsArchiveConfirmation = true }
                        .accessibilityIdentifier("matter.edit.archive")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: editor.draft.category)
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

    private func detailBinding(_ key: String) -> Binding<String> {
        Binding(get: { editor.draft.details[key] ?? "" }, set: { editor.draft.details[key] = $0 })
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
