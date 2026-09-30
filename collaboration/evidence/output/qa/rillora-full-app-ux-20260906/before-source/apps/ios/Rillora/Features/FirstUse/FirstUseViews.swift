import SwiftUI

struct FirstUseStarterCard: View {
    let plan: Plan
    let onAddMatter: () -> Void
    let onOpenGuide: () -> Void
    let onNotNow: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center) {
                SectionEyebrow("Choose a first step")
                Spacer()
                Button("Not now", action: onNotNow)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(RilloraTheme.muted)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                    .accessibilityIdentifier("first-use.not-now")
            }

            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 10) {
                    addMatterButton
                    guideButton
                }
            } else {
                HStack(spacing: 10) {
                    addMatterButton
                    guideButton
                }
            }

            Label("Progress starts when a matter is saved", systemImage: "checkmark.circle")
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .rilloraCard()
        .accessibilityIdentifier("first-use.starter")
    }

    private var addMatterButton: some View {
        starterButton(
            title: "Add a matter",
            icon: "plus",
            fill: RilloraTheme.clay,
            foreground: RilloraTheme.canvas,
            action: onAddMatter
        )
        .accessibilityIdentifier("first-use.add-matter")
        .accessibilityHint("Create the first real account, document, debt, or device record")
    }

    private var guideButton: some View {
        starterButton(
            title: plan.firstUseState == .guideInProgress ? "Resume guide" : "2-minute guide",
            icon: "map",
            fill: RilloraTheme.actionSurface,
            foreground: RilloraTheme.ink,
            action: onOpenGuide
        )
        .accessibilityIdentifier("first-use.open-guide")
        .accessibilityHint("Open the optional two-step setup guide")
    }

    private func starterButton(
        title: String,
        icon: String,
        fill: Color,
        foreground: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .accessibilityHidden(true)
                    Spacer(minLength: 8)
                    Image(systemName: "arrow.up.right")
                        .font(.caption.weight(.bold))
                        .opacity(0.72)
                        .accessibilityHidden(true)
                }
                Text(title)
                    .font(.body.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity, minHeight: 74, alignment: .leading)
            .padding(14)
            .background(fill, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

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

        Form {
            Section {
                HStack(spacing: 7) {
                    ForEach(1...2, id: \.self) { step in
                        Capsule()
                            .fill(step <= editor.step ? RilloraTheme.sage : RilloraTheme.divider)
                            .frame(height: 7)
                    }
                }
                .accessibilityElement()
                .accessibilityLabel("Step \(editor.step) of 2")
            } footer: {
                Text("You can save and exit at any time. The guide itself does not count as preparedness.")
            }

            if editor.step == 1 {
                Section {
                    RilloraAdaptivePicker("Primary reason", selection: $editor.motivation) {
                        Text("Prefer not to say").tag(nil as PlanMotivation?)
                        ForEach(PlanMotivation.allCases) { option in
                            Text(option.label).tag(option as PlanMotivation?)
                        }
                    }
                    .pickerStyle(.navigationLink)
                    .accessibilityIdentifier("first-use.motivation")

                    if let motivation = editor.motivation {
                        Text(motivation.explanation)
                            .font(.subheadline)
                            .foregroundStyle(RilloraTheme.body)
                    }

                    Button(editor.motivation == nil ? "Skip this question" : "Continue") {
                        Task {
                            guard let saved = await editor.continueToMatter() else { return }
                            overviewStore.applySavedPlan(saved)
                        }
                    }
                    .fontWeight(.semibold)
                    .accessibilityIdentifier("first-use.continue")
                } header: {
                    Text("Why now? Optional")
                } footer: {
                    Text("This broad choice only tailors guidance. It is not evidence of death, incapacity, urgency, legal status or eligibility.")
                }
            } else {
                Section {
                    RilloraAdaptivePicker("What would you like to map?", selection: $editor.category) {
                        ForEach(MatterCategory.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .pickerStyle(.navigationLink)

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
                        Label("Add this matter", systemImage: "plus.circle.fill")
                            .fontWeight(.semibold)
                    }
                    .accessibilityIdentifier("first-use.add-matter")
                } header: {
                    Text("Add one useful matter")
                } footer: {
                    Text("Saving the matter is the first real planning action. Never enter passwords, recovery codes, private keys or seed phrases.")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .disabled(editor.isBusy)
        .navigationTitle("Optional setup")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(editor.isBusy ? "Saving…" : "Save & exit") {
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
            editorHasConflict ? "This plan changed" : "Setup not saved",
            isPresented: Binding(
                get: { if case .failed = editor.state { true } else { false } },
                set: { if !$0 { editor.clearFailure() } }
            )
        ) {
            Button("Close", role: .cancel) { editor.clearFailure() }
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
