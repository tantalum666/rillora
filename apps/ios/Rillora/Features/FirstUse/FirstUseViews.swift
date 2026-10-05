import SwiftUI

struct FirstUseGuideView: View {
    @State private var editor: FirstUseGuideStore
    let matterService: any MatterEditing
    let roleAssignmentService: any RoleAssignmentEditing
    let contacts: [TrustedContact]
    let overviewStore: OverviewStore

    @Environment(\.dismiss) private var dismiss

    init(
        plan: Plan,
        planService: any PlanEditing,
        matterService: any MatterEditing,
        roleAssignmentService: any RoleAssignmentEditing,
        contacts: [TrustedContact],
        overviewStore: OverviewStore
    ) {
        _editor = State(initialValue: FirstUseGuideStore(plan: plan, service: planService))
        self.matterService = matterService
        self.roleAssignmentService = roleAssignmentService
        self.contacts = contacts
        self.overviewStore = overviewStore
    }

    var body: some View {
        @Bindable var editor = editor

        RilloraForm {
            Section {
                HStack(spacing: 7) {
                    ForEach(1...2, id: \.self) { step in
                        Capsule()
                            .fill(step <= editor.step ? RilloraTheme.sage : RilloraTheme.divider)
                            .frame(height: 7)
                    }
                }
                .accessibilityElement()
                .accessibilityLabel(L10n.format("Step %1$lld of 2", editor.step))
            }

            if editor.step == 1 {
                Section {
                    MotivationChoices(selection: $editor.motivation)

                    Button(editor.motivation == nil ? String(localized: "Skip this question") : String(localized: "Continue")) {
                        Task {
                            guard let saved = await editor.continueToMatter() else { return }
                            overviewStore.applySavedPlan(saved)
                        }
                    }
                    .fontWeight(.semibold)
                    .accessibilityIdentifier("first-use.continue")
                } header: {
                    Text(String(localized: "Why now? Optional"))
                }
            } else {
                Section {
                    MatterCategoryChoices(selection: $editor.category)

                    NavigationLink {
                        MatterEditorView(
                            matter: nil,
                            initialDraft: MatterDraft(firstUseCategory: editor.category),
                            service: matterService,
                            roleAssignmentService: roleAssignmentService,
                            contacts: contacts,
                            overviewStore: overviewStore,
                            onSaved: { dismiss() }
                        )
                    } label: {
                        Label(String(localized: "Add this matter"), systemImage: "plus.circle.fill")
                            .fontWeight(.semibold)
                    }
                    .accessibilityIdentifier("first-use.add-matter")
                } header: {
                    Text(String(localized: "Add one useful matter"))
                }
            }
            Section {
                RilloraInfoDisclosure(String(localized: "About optional setup")) {
                    Text(String(localized: "This choice only tailors guidance. Setup itself does not count as preparedness. Never enter passwords, recovery codes, private keys or seed phrases."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }
            }
            .listRowBackground(Color.clear)
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle(String(localized: "Optional setup"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(editor.isBusy ? String(localized: "Saving…") : String(localized: "Save & exit")) {
                    Task {
                        if let saved = await editor.pause() {
                            overviewStore.applySavedPlan(saved)
                            dismiss()
                        }
                    }
                }
                .disabled(editor.isBusy)
                .accessibilityIdentifier("first-use.save-exit")
            }
        }
        .interactiveDismissDisabled(editor.isBusy)
        .task {
            if let saved = await editor.startIfNeeded() {
                overviewStore.applySavedPlan(saved)
            }
        }
        .alert(
            editorHasConflict ? String(localized: "This plan changed") : String(localized: "Setup not saved"),
            isPresented: Binding(
                get: { if case .failed = editor.state { true } else { false } },
                set: { if !$0 { editor.clearFailure() } }
            )
        ) {
            Button(String(localized: "Close"), role: .cancel) { editor.clearFailure() }
        } message: {
            Text(editorFailureMessage)
        }
        .accessibilityIdentifier("first-use.guide")
    }

    private var editorHasConflict: Bool {
        guard case .failed(_, let conflict) = editor.state else { return false }
        return conflict
    }

    private var editorFailureMessage: String {
        guard case .failed(let message, _) = editor.state else { return "" }
        return message
    }
}
