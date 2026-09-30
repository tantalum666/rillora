import SwiftUI

struct PlanMotivationView: View {
    @State private var editor: PlanMotivationStore
    let overviewStore: OverviewStore

    @Environment(\.dismiss) private var dismiss

    init(plan: Plan, service: any PlanEditing, overviewStore: OverviewStore) {
        _editor = State(initialValue: PlanMotivationStore(plan: plan, service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        @Bindable var editor = editor

        Form {
            if editor.state == .loading {
                Section {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Checking the latest plan version…")
                            .foregroundStyle(RilloraTheme.muted)
                    }
                }
            }

            Section {
                RilloraAdaptivePicker("Primary reason", selection: $editor.selection) {
                    Text("Choose a reason").tag(nil as PlanMotivation?)
                    ForEach(PlanMotivation.allCases) { motivation in
                        Text(motivation.label).tag(motivation as PlanMotivation?)
                    }
                }
                .accessibilityIdentifier("plan-motivation.picker")

                if let selection = editor.selection {
                    Text(selection.explanation)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                }
            } header: {
                Text("Why now")
            } footer: {
                Text("Used only to tailor suggestions. It is not evidence, diagnosis, legal status or readiness.")
            }

            Section {
                RilloraFactStrip([
                    .init(title: "No diagnosis", systemImage: "cross.case"),
                    .init(title: "No legal finding", systemImage: "building.columns"),
                    .init(title: "No analytics", systemImage: "chart.bar.xaxis"),
                ])
            }
            .rilloraAlignedLabelRows()
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle("Why I’m preparing")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(editor.state == .saving ? "Saving…" : "Save") {
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
            editorHasConflict ? "This plan changed" : "Reason not saved",
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
