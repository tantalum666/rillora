import SwiftUI

struct PlanMotivationView: View {
    @State private var editor: PlanMotivationStore
    @State private var showsDiscardConfirmation = false
    let overviewStore: OverviewStore

    @Environment(\.dismiss) private var dismiss

    init(plan: Plan, service: any PlanEditing, overviewStore: OverviewStore) {
        _editor = State(initialValue: PlanMotivationStore(plan: plan, service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        @Bindable var editor = editor

        RilloraForm {
            if editor.state == .loading {
                Section { ProgressView(String(localized: "Checking latest plan…")) }
            }
            Section {
                MotivationChoices(selection: $editor.selection)
            }
            Section {
                RilloraInfoDisclosure(String(localized: "Optional")) {
                    if let selection = editor.selection {
                        Text(selection.explanation).font(.subheadline).foregroundStyle(RilloraTheme.body)
                    }
                    Text(String(localized: "Used only to tailor suggestions. It is not evidence, diagnosis, legal status or readiness."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                }
            }
            .listRowBackground(Color.clear)
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle(String(localized: "Why I’m preparing"))
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(editor.hasUnsavedChanges)
        .interactiveDismissDisabled(editor.isBusy || editor.hasUnsavedChanges)
        .toolbar {
            if editor.hasUnsavedChanges {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Back")) { showsDiscardConfirmation = true }
                        .alert(String(localized: "Discard unsaved changes?"), isPresented: $showsDiscardConfirmation) {
                            Button(String(localized: "Discard changes"), role: .destructive) { dismiss() }
                            Button(String(localized: "Keep editing"), role: .cancel) {}
                        }
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button(editor.state == .saving ? String(localized: "Saving…") : String(localized: "Save")) {
                    Task {
                        guard let saved = await editor.save() else { return }
                        overviewStore.applySavedPlan(saved)
                        dismiss()
                        await overviewStore.reconcileAfterMutation()
                    }
                }
                .disabled(!editor.canSave)
                .accessibilityIdentifier("plan-motivation.save")
            }
        }
        .task {
            await editor.loadLatestIfNeeded()
        }
        .alert(
            editorHasConflict ? String(localized: "This plan changed") : String(localized: "Reason not saved"),
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
        .accessibilityIdentifier("plan-motivation.view")
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
