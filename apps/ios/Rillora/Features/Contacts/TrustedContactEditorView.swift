import SwiftUI

struct TrustedContactEditorView: View {
    @State private var editor: TrustedContactEditorStore
    @State private var showsRevokeConfirmation = false
    @State private var showsDiscardConfirmation = false
    @RilloraReduceMotion private var reduceMotion
    @ScaledMetric(relativeTo: .title2) private var avatarSize: CGFloat = 76
    let overviewStore: OverviewStore
    let onCreated: ((TrustedContact) -> Void)?

    @Environment(\.dismiss) private var dismiss

    init(
        contact: TrustedContact?,
        service: any TrustedContactEditing,
        overviewStore: OverviewStore,
        onCreated: ((TrustedContact) -> Void)? = nil
    ) {
        _editor = State(
            initialValue: TrustedContactEditorStore(contact: contact, service: service)
        )
        self.overviewStore = overviewStore
        self.onCreated = onCreated
    }

    var body: some View {
        @Bindable var editor = editor

        RilloraForm {
            Section {
                if editor.isNew && onCreated != nil { InvitationStepRail(current: 0) }
                ZStack {
                    Circle().fill(RilloraTheme.sageSoft)
                    if avatarInitials.isEmpty {
                        Image(systemName: "person.fill").font(.system(size: 32))
                    } else {
                        Text(avatarInitials).font(.title2.weight(.semibold)).contentTransition(.opacity)
                    }
                }
                .foregroundStyle(RilloraTheme.tabSelection)
                .frame(width: avatarSize, height: avatarSize)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: avatarInitials)
                .accessibilityHidden(true)
            }
            .listRowBackground(Color.clear)

            if editor.state == .loading {
                Section {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text(String(localized: "Checking the latest version…"))
                            .foregroundStyle(RilloraTheme.muted)
                    }
                }
            }

            Section {
                RilloraTextField(
                    title: String(localized: "Contact name", defaultValue: "Name"),
                    prompt: String(localized: "Who would you trust to help?"),
                    text: $editor.draft.displayName,
                    identifier: "contact.edit.name",
                    required: true
                )
                    .textContentType(.name)

                RilloraTextField(
                    title: String(localized: "Relationship"),
                    prompt: String(localized: "How you know this person"),
                    text: $editor.draft.relationshipLabel,
                    identifier: "contact.edit.relationship"
                )
                    .textInputAutocapitalization(.words)
            } header: {
                if !(editor.isNew && onCreated != nil) { Text(String(localized: "Contact record")) }
            }

            Section {
                if let source = editor.source {
                    Label(source.evidenceLabel, systemImage: "person.badge.shield.checkmark")
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }
                if editor.isNew && onCreated != nil {
                    Label(String(localized: "Next: choose access, then get a link or QR."), systemImage: "link")
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                } else { RilloraInfoDisclosure(String(localized: "Record only")) {
                    Text(String(localized: "No invitation, email or text is sent."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    RilloraFactStrip([
                        .init(title: String(localized: "No appointment"), systemImage: "doc.text"),
                        .init(title: String(localized: "No recovery"), systemImage: "key.slash"),
                        .init(title: String(localized: "No account access"), systemImage: "lock.shield"),
                    ])
                    if let source = editor.source {
                        LabeledContent(String(localized: "Record"), value: contactStatusLabel(source.status))
                        LabeledContent(String(localized: "Role"), value: contactStatusLabel(source.roleStatus))
                    }
                } }
            }
            .listRowBackground(Color.clear)

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
                        Button(String(localized: "Revoke trusted-contact role"), role: .destructive) {
                            showsRevokeConfirmation = true
                        }
                        .accessibilityIdentifier("contact.edit.revoke")
                    } else {
                        Label(String(localized: "Trusted-contact role revoked"), systemImage: "person.crop.circle.badge.xmark")
                            .foregroundStyle(RilloraTheme.muted)
                    }
                } footer: {
                    Text(String(localized: "Revokes the Rillora role only. External legal or account authority is unchanged."))
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle(editor.isNew && onCreated != nil ? String(localized: "Invite someone") : editor.isNew ? String(localized: "New contact") : String(localized: "Edit contact"))
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(editor.isBusy || editor.hasUnsavedChanges)
        .navigationBarBackButtonHidden(editor.isBusy || editor.hasUnsavedChanges)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(editor.state == .saving ? String(localized: "Saving…") : editor.isNew && onCreated != nil ? String(localized: "Next") : String(localized: "Save")) {
                    Task {
                        let wasNew = editor.isNew
                        guard let saved = await editor.save() else { return }
                        if wasNew {
                            overviewStore.applyCreatedTrustedContact(saved)
                        } else {
                            overviewStore.applySavedTrustedContact(saved)
                        }
                        if wasNew, let onCreated { onCreated(saved) } else { dismiss() }
                        await overviewStore.reconcileAfterMutation()
                    }
                }
                .disabled(!editor.canSave)
                .accessibilityIdentifier("contact.edit.save")
            }

            ToolbarItem(placement: .cancellationAction) {
                Button(String(localized: "Cancel")) {
                    if editor.hasUnsavedChanges { showsDiscardConfirmation = true }
                    else { dismiss() }
                }
                .disabled(editor.isBusy)
                .accessibilityIdentifier("contact.edit.cancel")
                .alert(String(localized: "Discard unsaved changes?"), isPresented: $showsDiscardConfirmation) {
                    Button(String(localized: "Discard changes"), role: .destructive) { dismiss() }
                    Button(String(localized: "Keep editing"), role: .cancel) {}
                } message: {
                    Text(String(localized: "Your changes to this contact have not been saved."))
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
                Button(String(localized: "Reload latest")) {
                    Task { await editor.loadLatest() }
                }
                Button(String(localized: "Keep editing"), role: .cancel) {
                    editor.clearFailure()
                }
            } else {
                Button(String(localized: "OK"), role: .cancel) {
                    editor.clearFailure()
                }
            }
        } message: {
            Text(editorFailureMessage)
        }
        .confirmationDialog(
            String(localized: "Revoke this trusted-contact role?"),
            isPresented: $showsRevokeConfirmation,
            titleVisibility: .visible
        ) {
            Button(String(localized: "Revoke role"), role: .destructive) {
                Task {
                    guard let revoked = await editor.revoke() else { return }
                    overviewStore.applySavedTrustedContact(revoked)
                    dismiss()
                    await overviewStore.reconcileAfterMutation()
                }
            }
            Button(String(localized: "Cancel"), role: .cancel) {}
        } message: {
            Text(String(localized: "Rillora will revoke this role and any current invitation record. No external legal or account authority changes."))
        }
        .accessibilityIdentifier("contact.editor")
        .rilloraEntrance()
    }

    // Presentation only: stored statuses and permission checks keep their raw values.
    private func contactStatusLabel(_ status: String?) -> String {
        switch status {
        case nil: String(localized: "Not assigned")
        case "draft": String(localized: "Draft")
        case "active": String(localized: "Active")
        case "pending": String(localized: "Pending")
        case "revoked": String(localized: "Revoked")
        case "archived": String(localized: "Archived")
        default: String(localized: "Unknown status")
        }
    }

    private var avatarInitials: String {
        editor.draft.displayName.split(whereSeparator: { $0.isWhitespace })
            .prefix(2).compactMap { $0.first.map(String.init) }.joined().uppercased()
    }

    private var editorFailureTitle: String {
        editorHasConflict ? String(localized: "This contact changed") : String(localized: "Contact not saved")
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
