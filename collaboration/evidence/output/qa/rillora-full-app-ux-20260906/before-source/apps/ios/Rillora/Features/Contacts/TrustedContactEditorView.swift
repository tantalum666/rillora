import SwiftUI

struct TrustedContactEditorView: View {
    @State private var editor: TrustedContactEditorStore
    @State private var showsRevokeConfirmation = false
    let overviewStore: OverviewStore

    @Environment(\.dismiss) private var dismiss

    init(
        contact: TrustedContact?,
        service: any TrustedContactEditing,
        overviewStore: OverviewStore
    ) {
        _editor = State(
            initialValue: TrustedContactEditorStore(contact: contact, service: service)
        )
        self.overviewStore = overviewStore
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

            Section {
                TextField("Name", text: $editor.draft.displayName)
                    .textContentType(.name)
                    .accessibilityIdentifier("contact.edit.name")

                TextField("Relationship (optional)", text: $editor.draft.relationshipLabel)
                    .textInputAutocapitalization(.words)
                    .accessibilityIdentifier("contact.edit.relationship")
            } header: {
                Text("Contact record")
            } footer: {
                Text("Saves a Rillora contact record. No invitation, email or text is sent.")
            }

            Section {
                RilloraBoundaryPanel("Record only", systemImage: "lock.shield") {
                    RilloraFactStrip([
                        .init(title: "No appointment", systemImage: "doc.text.magnifyingglass"),
                        .init(title: "No recovery", systemImage: "key.slash"),
                        .init(title: "No access", systemImage: "person.badge.shield.checkmark"),
                    ])
                }
            }
            .rilloraAlignedLabelRows()

            if let source = editor.source {
                Section("Current evidence") {
                    LabeledContent("Record", value: source.status.capitalized)
                    LabeledContent("Role", value: (source.roleStatus ?? "Not assigned").capitalized)
                    LabeledContent("Invitation", value: source.evidenceLabel)
                }
            }

            if let validationMessage = editor.visibleValidationMessage {
                Section {
                    Label(validationMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(RilloraTheme.clay)
                        .accessibilityIdentifier("contact.edit.validation")
                }
            }

            if !editor.isNew {
                Section {
                    if editor.canRevoke {
                        Button("Revoke trusted-contact role", role: .destructive) {
                            showsRevokeConfirmation = true
                        }
                        .accessibilityIdentifier("contact.edit.revoke")
                    } else {
                        Label("Trusted-contact role revoked", systemImage: "person.crop.circle.badge.xmark")
                            .foregroundStyle(RilloraTheme.muted)
                    }
                } footer: {
                    Text("Revokes the Rillora role only. External legal or account authority is unchanged.")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle(editor.isNew ? "New contact" : "Edit contact")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(editor.state == .saving ? "Saving…" : "Save") {
                    Task {
                        let wasNew = editor.isNew
                        guard let saved = await editor.save() else { return }
                        if wasNew {
                            overviewStore.applyCreatedTrustedContact(saved)
                        } else {
                            overviewStore.applySavedTrustedContact(saved)
                        }
                        dismiss()
                        await overviewStore.reconcileAfterMutation()
                    }
                }
                .disabled(!editor.canSave)
                .accessibilityIdentifier("contact.edit.save")
            }

            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
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
            "Revoke this trusted-contact role?",
            isPresented: $showsRevokeConfirmation,
            titleVisibility: .visible
        ) {
            Button("Revoke role", role: .destructive) {
                Task {
                    guard let revoked = await editor.revoke() else { return }
                    overviewStore.applySavedTrustedContact(revoked)
                    dismiss()
                    await overviewStore.reconcileAfterMutation()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Rillora will revoke this role and any current invitation record. No external legal or account authority changes.")
        }
        .accessibilityIdentifier("contact.editor")
    }

    private var editorFailureTitle: String {
        editorHasConflict ? "This contact changed" : "Contact not saved"
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
