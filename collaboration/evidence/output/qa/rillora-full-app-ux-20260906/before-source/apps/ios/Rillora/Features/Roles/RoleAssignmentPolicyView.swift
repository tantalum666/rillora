import SwiftUI

struct RoleAssignmentPolicyView: View {
    let matter: Matter
    let contacts: [TrustedContact]
    @State private var store: RoleAssignmentPolicyStore
    @State private var selectedPersonPublicID: String
    @State private var newRole = RoleAssignmentRole.executor
    @State private var newScope = RoleAssignmentScope.matterSpecific
    @State private var assignmentToRevoke: RoleAssignment?

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

        Form {
            Section {
                RilloraBoundaryPanel("Record only", systemImage: "lock.shield") {
                    RilloraFactStrip([
                        .init(title: "No invitation", systemImage: "envelope.badge"),
                        .init(title: "No access", systemImage: "lock.shield"),
                        .init(title: "No authority", systemImage: "building.columns"),
                    ])
                }
            }
            .rilloraAlignedLabelRows()

            Section {
                if contacts.isEmpty {
                    Text("Add an active person record before assigning a role.")
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    RilloraAdaptivePicker("Person", selection: $selectedPersonPublicID) {
                        ForEach(contacts) { contact in
                            Text(contact.displayName).tag(contact.publicId)
                        }
                    }
                    RilloraAdaptivePicker("Role", selection: $newRole) {
                        ForEach(RoleAssignmentRole.allCases) { role in
                            Text(role.label).tag(role)
                        }
                    }
                    RilloraAdaptivePicker("Scope", selection: $newScope) {
                        ForEach(RoleAssignmentScope.allCases) { scope in
                            Text(scope.label).tag(scope)
                        }
                    }
                    .disabled(newRole == .recipient)

                    Button("Add role record") {
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
                }
            } header: {
                Text("Add role")
            } footer: {
                Text(newScope == .planWide ? "Whole-plan roles apply to every matter." : "This role applies only to \(matter.title). Recipient roles are always matter-specific.")
            }

            Section {
                switch store.state {
                case .idle, .loading:
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Loading role policy…")
                            .foregroundStyle(RilloraTheme.muted)
                    }
                default:
                    let assignments = store.assignments(applyingTo: matter.publicId)
                    if assignments.isEmpty {
                        Text("No active role applies to this matter.")
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
                                revoke: { assignmentToRevoke = assignment }
                            )
                        }
                    }
                }
            } header: {
                Text("Roles affecting this matter")
            } footer: {
                Text("Invitation evidence stays separate. Revoking changes only Rillora role records.")
            }

            if let notice = store.notice {
                Section {
                    Label(notice, systemImage: "checkmark.circle")
                        .foregroundStyle(RilloraTheme.sage)
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Role scope")
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.loadIfNeeded() }
        .onChange(of: newRole) { _, role in
            if role == .recipient { newScope = .matterSpecific }
        }
        .alert(
            "Role policy not saved",
            isPresented: Binding(
                get: { if case .failed = store.state { true } else { false } },
                set: { if !$0 { store.clearFailure() } }
            )
        ) {
            Button("Reload") { Task { await store.reload() } }
            Button("Cancel", role: .cancel) { store.clearFailure() }
        } message: {
            if case .failed(let message, _) = store.state { Text(message) }
        }
        .confirmationDialog(
            "Revoke this role?",
            isPresented: Binding(
                get: { assignmentToRevoke != nil },
                set: { if !$0 { assignmentToRevoke = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Revoke role", role: .destructive) {
                guard let assignment = assignmentToRevoke else { return }
                assignmentToRevoke = nil
                Task { _ = await store.revoke(assignment) }
            }
            Button("Cancel", role: .cancel) { assignmentToRevoke = nil }
        } message: {
            Text("This does not change an external account, ownership, recovery right, or legal authority.")
        }
        .accessibilityIdentifier("role-policy.editor")
    }
}

private struct RoleAssignmentEditorRow: View {
    let assignment: RoleAssignment
    let matter: Matter
    let disabled: Bool
    let save: (RoleAssignmentRole, RoleAssignmentScope) async -> Void
    let revoke: () -> Void
    @State private var role: RoleAssignmentRole
    @State private var scope: RoleAssignmentScope
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(
        assignment: RoleAssignment,
        matter: Matter,
        disabled: Bool,
        save: @escaping (RoleAssignmentRole, RoleAssignmentScope) async -> Void,
        revoke: @escaping () -> Void
    ) {
        self.assignment = assignment
        self.matter = matter
        self.disabled = disabled
        self.save = save
        self.revoke = revoke
        _role = State(initialValue: assignment.role)
        _scope = State(initialValue: assignment.scope)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 6) {
                        assignmentIdentity
                        assignmentScope
                    }
                } else {
                    HStack {
                        assignmentIdentity
                        Spacer()
                        assignmentScope
                    }
                }
            }

            if assignment.editable {
                RilloraAdaptivePicker("Role", selection: $role) {
                    ForEach(RoleAssignmentRole.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
                RilloraAdaptivePicker("Scope", selection: $scope) {
                    ForEach(RoleAssignmentScope.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
                .disabled(role == .recipient)
                Button("Save role changes") {
                    Task { await save(role, scope) }
                }
                .disabled(disabled || (role == assignment.role && scope == assignment.scope))
            } else {
                Text("Invitation-backed evidence is read-only. Revoke it explicitly instead of changing its meaning.")
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }

            Button("Revoke role", role: .destructive, action: revoke)
                .disabled(disabled)
        }
        .padding(.vertical, 4)
        .onChange(of: role) { _, value in
            if value == .recipient { scope = .matterSpecific }
        }
    }

    private var assignmentIdentity: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(assignment.person.displayName).font(.headline)
            Text(assignment.evidence.label)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var assignmentScope: some View {
        Text(assignment.scope == .planWide ? "Whole plan" : matter.title)
            .font(.footnote)
            .foregroundStyle(RilloraTheme.muted)
    }
}
