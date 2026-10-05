import SwiftUI

struct RoleAssignmentPolicyView: View {
    let matter: Matter
    let contacts: [TrustedContact]
    @State private var store: RoleAssignmentPolicyStore
    @State private var selectedPersonPublicID: String
    @State private var newRole = RoleAssignmentRole.executor
    @State private var newScope = RoleAssignmentScope.matterSpecific
    @State private var assignmentToRevoke: RoleAssignment?
    @State private var dirtyAssignmentIDs: Set<String> = []
    @State private var showsDiscardConfirmation = false
    @Environment(\.dismiss) private var dismiss
    @RilloraReduceMotion private var reduceMotion

    init(
        matter: Matter,
        contacts: [TrustedContact],
        service: any RoleAssignmentEditing
    ) {
        self.matter = matter
        self.contacts = contacts.filter { !$0.isRevoked }
        _store = State(initialValue: RoleAssignmentPolicyStore(service: service))
        _selectedPersonPublicID = State(
            initialValue: contacts.first(where: { !$0.isRevoked })?.publicId ?? ""
        )
    }

    var body: some View {
        @Bindable var store = store

        RilloraForm {
            Section {
                HStack(spacing: 12) {
                    relationshipNode(String(localized: "Person"), symbol: "person.fill")
                    Image(systemName: "arrow.right").font(.caption).foregroundStyle(RilloraTheme.muted)
                    relationshipNode(String(localized: "Role"), symbol: newRole == .recipient ? "person.crop.square" : "shield.lefthalf.filled")
                    Image(systemName: "arrow.right").font(.caption).foregroundStyle(RilloraTheme.muted)
                    relationshipNode(String(localized: "Scope"), symbol: newScope == .planWide ? "square.stack.3d.up" : "doc.text")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .accessibilityHidden(true)
            }
            .listRowBackground(Color.clear)

            Section {
                if contacts.isEmpty {
                    Text(String(localized: "Add an active person record before assigning a role."))
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    RilloraAdaptivePicker(String(localized: "Person"), selection: $selectedPersonPublicID) {
                        ForEach(contacts) { contact in
                            Text(contact.displayName).tag(contact.publicId)
                        }
                    }
                    RilloraAdaptivePicker(String(localized: "Role"), selection: $newRole) {
                        ForEach(RoleAssignmentRole.allCases) { role in
                            Text(role.label).tag(role)
                        }
                    }
                    RilloraAdaptivePicker(String(localized: "Scope"), selection: $newScope) {
                        ForEach(RoleAssignmentScope.allCases) { scope in
                            Text(scope.label).tag(scope)
                        }
                    }
                    .disabled(newRole == .recipient)

                    Button(String(localized: "Add role record")) {
                        Task {
                            _ = await store.create(
                                personPublicID: selectedPersonPublicID,
                                role: newRole,
                                scope: newScope,
                                matterPublicID: matter.publicId
                            )
                        }
                    }
                    .disabled(store.isBusy || selectedPersonPublicID.isEmpty)
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .accessibilityIdentifier("role-policy.add")
                }
            } header: {
                Text(String(localized: "Add role"))
            } footer: {
                Text(newScope == .planWide ? String(localized: "Applies across your map.") : matter.title)
            }

            Section {
                switch store.state {
                case .idle, .loading:
                    HStack(spacing: 10) {
                        ProgressView()
                        Text(String(localized: "Loading role policy…"))
                            .foregroundStyle(RilloraTheme.muted)
                    }
                default:
                    let assignments = store.assignments(applyingTo: matter.publicId)
                    if assignments.isEmpty {
                        Text(String(localized: "No active role applies to this matter."))
                            .foregroundStyle(RilloraTheme.muted)
                    } else {
                        ForEach(assignments) { assignment in
                            RoleAssignmentEditorRow(
                                assignment: assignment,
                                matter: matter,
                                disabled: store.isBusy,
                                save: { role, scope in
                                    _ = await store.update(
                                        assignment: assignment,
                                        role: role,
                                        scope: scope,
                                        matterPublicID: matter.publicId
                                    )
                                },
                                revoke: { assignmentToRevoke = assignment },
                                onDirtyChange: { dirty in
                                    if dirty { dirtyAssignmentIDs.insert(assignment.publicId) }
                                    else { dirtyAssignmentIDs.remove(assignment.publicId) }
                                }
                            )
                        }
                    }
                }
            } header: {
                Text(String(localized: "Existing roles"))
            }

            Section {
                RilloraInfoDisclosure(String(localized: "Record only")) {
                    RilloraFactStrip([
                        .init(title: String(localized: "No invitation"), systemImage: "envelope"),
                        .init(title: String(localized: "No account access"), systemImage: "lock.shield"),
                        .init(title: String(localized: "No legal authority"), systemImage: "building.columns"),
                    ])
                    Text(String(localized: "Invitation evidence stays separate. Revoking changes only Rillora role records."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }
            }
            .listRowBackground(Color.clear)

            if let notice = store.notice {
                Section {
                    Label(notice, systemImage: "checkmark.circle")
                        .foregroundStyle(RilloraTheme.sage)
                    if store.needsReload {
                        Button(String(localized: "Reload latest")) { Task { await store.reload() } }
                            .disabled(store.isBusy || !dirtyAssignmentIDs.isEmpty)
                    }
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Role scope"))
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(!dirtyAssignmentIDs.isEmpty)
        .interactiveDismissDisabled(!dirtyAssignmentIDs.isEmpty || store.isBusy)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: newRole)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: newScope)
        .toolbar {
            if !dirtyAssignmentIDs.isEmpty {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Back")) { showsDiscardConfirmation = true }
                        .alert(String(localized: "Discard unsaved role changes?"), isPresented: $showsDiscardConfirmation) {
                            Button(String(localized: "Discard changes"), role: .destructive) { dismiss() }
                            Button(String(localized: "Keep editing"), role: .cancel) {}
                        }
                }
            }
        }
        .task { await store.loadIfNeeded() }
        .onChange(of: newRole) { _, role in
            if role == .recipient { newScope = .matterSpecific }
        }
        .alert(
            String(localized: "Role policy needs attention"),
            isPresented: Binding(
                get: { if case .failed = store.state { true } else { false } },
                set: { if !$0 { store.clearFailure() } }
            )
        ) {
            Button(String(localized: "Reload")) { Task { await store.reload() } }
            Button(String(localized: "Cancel"), role: .cancel) { store.clearFailure() }
        } message: {
            if case .failed(let message, _) = store.state { Text(message) }
        }
        .confirmationDialog(
            String(localized: "Revoke this role?"),
            isPresented: Binding(
                get: { assignmentToRevoke != nil },
                set: { if !$0 { assignmentToRevoke = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button(String(localized: "Revoke role"), role: .destructive) {
                guard let assignment = assignmentToRevoke else { return }
                assignmentToRevoke = nil
                Task {
                    if await store.revoke(assignment) { dirtyAssignmentIDs.remove(assignment.publicId) }
                }
            }
            Button(String(localized: "Cancel"), role: .cancel) { assignmentToRevoke = nil }
        } message: {
            Text(String(localized: "This does not change an external account, ownership, recovery right, or legal authority."))
        }
        .accessibilityIdentifier("role-policy.editor")
    }
    private func relationshipNode(_ title: String, symbol: String) -> some View {
        VStack(spacing: 7) {
            Image(systemName: symbol)
                .font(.system(size: 24))
                .contentTransition(.symbolEffect(.replace))
                .foregroundStyle(RilloraTheme.tabSelection)
                .frame(width: 58, height: 58)
                .background(RilloraTheme.mutedSurface, in: Circle())
                .overlay(Circle().stroke(RilloraTheme.border, lineWidth: 1))
            Text(title).font(.footnote).foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity)
    }

}

private struct RoleAssignmentEditorRow: View {
    let assignment: RoleAssignment
    let matter: Matter
    let disabled: Bool
    let save: (RoleAssignmentRole, RoleAssignmentScope) async -> Void
    let revoke: () -> Void
    let onDirtyChange: (Bool) -> Void
    @State private var role: RoleAssignmentRole
    @State private var scope: RoleAssignmentScope
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(
        assignment: RoleAssignment,
        matter: Matter,
        disabled: Bool,
        save: @escaping (RoleAssignmentRole, RoleAssignmentScope) async -> Void,
        revoke: @escaping () -> Void,
        onDirtyChange: @escaping (Bool) -> Void
    ) {
        self.assignment = assignment
        self.matter = matter
        self.disabled = disabled
        self.save = save
        self.revoke = revoke
        self.onDirtyChange = onDirtyChange
        _role = State(initialValue: assignment.role)
        _scope = State(initialValue: assignment.scope)
    }

    var body: some View {
        DisclosureGroup {
            if assignment.editable {
                RilloraAdaptivePicker(String(localized: "Role"), selection: $role) {
                    ForEach(RoleAssignmentRole.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
                RilloraAdaptivePicker(String(localized: "Scope"), selection: $scope) {
                    ForEach(RoleAssignmentScope.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
                .disabled(role == .recipient)
                Button(String(localized: "Save role changes")) {
                    Task { await save(role, scope) }
                }
                .disabled(disabled || (role == assignment.role && scope == assignment.scope))
            } else {
                Text(String(localized: "Invitation evidence is read-only."))
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }

            Button(String(localized: "Revoke role"), role: .destructive, action: revoke)
                .disabled(disabled)
        }
        label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(assignment.person.displayName).font(.headline).foregroundStyle(RilloraTheme.ink)
                Text(L10n.format("%1$@ · %2$@", assignment.role.label, assignment.scope.label))
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            .frame(minHeight: 44)
        }
        .padding(.vertical, 4)
        .onChange(of: isDirty, initial: true) { _, value in onDirtyChange(value) }
        .onChange(of: role) { _, value in
            if value == .recipient { scope = .matterSpecific }
        }
    }

    private var isDirty: Bool {
        assignment.editable && (role != assignment.role || scope != assignment.scope)
    }
}
