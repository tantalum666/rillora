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
                SectionEyebrow("Get started")
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

        }
        .rilloraCard()
        .accessibilityElement(children: .contain)
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
            title: [.guideInProgress, .guidePaused].contains(plan.firstUseState) ? "Resume guide" : "Optional guide",
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
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 17, weight: .semibold))
                    .accessibilityHidden(true)
                Text(title)
                    .font(.body.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .padding(10)
            .background(fill, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(RilloraQuietButtonStyle())
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
                .accessibilityLabel("Step \(editor.step) of 2")
            }

            if editor.step == 1 {
                Section {
                    MotivationChoices(selection: $editor.motivation)

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
                        Label("Add this matter", systemImage: "plus.circle.fill")
                            .fontWeight(.semibold)
                    }
                    .accessibilityIdentifier("first-use.add-matter")
                } header: {
                    Text("Add one useful matter")
                }
            }
            Section {
                RilloraInfoDisclosure("About optional setup") {
                    Text("This choice only tailors guidance. Setup itself does not count as preparedness. Never enter passwords, recovery codes, private keys or seed phrases.")
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }
            }
            .listRowBackground(Color.clear)
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
