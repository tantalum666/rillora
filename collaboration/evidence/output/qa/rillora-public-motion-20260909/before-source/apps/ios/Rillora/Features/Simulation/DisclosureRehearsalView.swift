import SwiftUI

struct DisclosureRehearsalView: View {
    @State private var rehearsalStore: DisclosureRehearsalStore

    init(service: any DisclosureRehearsing) {
        _rehearsalStore = State(initialValue: DisclosureRehearsalStore(service: service))
    }

    var body: some View {
        @Bindable var rehearsalStore = rehearsalStore

        Form {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("See who could see what")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                    Text("Walk through the required checks and preview the information allowed for each role.")
                        .foregroundStyle(RilloraTheme.body)
                }
            } footer: {
                Text("Only you see this rehearsal. It verifies no evidence, contacts nobody and releases nothing.")
            }

            if let rehearsal = rehearsalStore.rehearsal {
                rehearsalSections(rehearsal)
            } else {
                Section("Choose one separate event") {
                    RilloraAdaptivePicker("Life event", selection: $rehearsalStore.selectedLifeEvent) {
                        ForEach(LifeEvent.allCases) { event in
                            Text(event.title).tag(event)
                        }
                    }
                    .pickerStyle(.navigationLink)
                    .disabled(rehearsalStore.isWorking)
                    .accessibilityIdentifier("disclosure-rehearsal.event")

                    Text(rehearsalStore.selectedLifeEvent.explanation)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                }

                Section {
                    Button {
                        Task { await rehearsalStore.create() }
                    } label: {
                        HStack {
                            if rehearsalStore.isWorking { ProgressView() }
                            Label(
                                rehearsalStore.isWorking
                                    ? "Preparing preview…"
                                    : "Preview role access",
                                systemImage: "shield.lefthalf.filled"
                            )
                            .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .disabled(rehearsalStore.isWorking)
                    .accessibilityIdentifier("disclosure-rehearsal.create")
                } footer: {
                    Text("Cooling periods are illustrative and do not elapse automatically here.")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Role disclosure")
        .navigationBarTitleDisplayMode(.inline)
        .alert(
            "Rehearsal not updated",
            isPresented: Binding(
                get: { if case .failed = rehearsalStore.phase { true } else { false } },
                set: { if !$0 { rehearsalStore.clearFailure() } }
            )
        ) {
            Button("OK", role: .cancel) { rehearsalStore.clearFailure() }
        } message: {
            if case .failed(let message) = rehearsalStore.phase {
                Text(message)
            }
        }
        .accessibilityIdentifier("disclosure-rehearsal.view")
    }

    @ViewBuilder
    private func rehearsalSections(_ rehearsal: DisclosureRehearsal) -> some View {
        Section {
            Label("\(rehearsal.lifeEvent.title) · simulation only", systemImage: "shield.checkered")
                .font(.headline)
                .foregroundStyle(RilloraTheme.sage)
            LabeledContent("Current state", value: rehearsal.stateLabel)
            LabeledContent("Policy snapshot", value: rehearsal.policyVersion)
            if let end = rehearsal.coolingOffEndsAt,
               rehearsal.coolingOffSimulatedAt == nil {
                LabeledContent("Illustrative hold", value: formattedDate(end))
            }
        } header: {
            Text("Current rehearsal")
        } footer: {
            Text("This state is visible to the planner only. A ready preview is not a delivery or release.")
        }

        Section("Illustrative policy path") {
            let completed = Set(rehearsal.completedCheckpoints.map(\.code))
            ForEach(rehearsal.stateSequence) { step in
                let isCurrent = rehearsal.state == step.key
                Label {
                    Text(step.label)
                        .fontWeight(isCurrent ? .semibold : .regular)
                } icon: {
                    Image(systemName: completed.contains(step.key)
                        ? "checkmark.circle.fill"
                        : "circle")
                        .foregroundStyle(completed.contains(step.key)
                            ? RilloraTheme.sage
                            : RilloraTheme.muted)
                }
                .accessibilityValue(isCurrent ? "Current step" : completed.contains(step.key) ? "Simulated" : "Not reached")
            }

            if !rehearsal.stateSequence.contains(where: { $0.key == rehearsal.state }) {
                Label(rehearsal.stateLabel, systemImage: "exclamationmark.shield")
                    .foregroundStyle(RilloraTheme.clay)
            }
        }

        ForEach(rehearsal.projectedRoleViews) { roleView in
            DisclosureRolePreviewSection(view: roleView)
        }

        if !rehearsal.availableActions.isEmpty {
            Section {
                ForEach(rehearsal.availableActions) { action in
                    Button(role: action == .cancel ? .destructive : nil) {
                        Task { await rehearsalStore.perform(action) }
                    } label: {
                        HStack {
                            if rehearsalStore.isWorking { ProgressView() }
                            Text(action.label)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .disabled(rehearsalStore.isWorking)
                    .accessibilityIdentifier("disclosure-rehearsal.action.\(action.rawValue)")
                }
            } header: {
                Text("Rehearsal controls")
            } footer: {
                Text("Every transition remains simulated. Advancing cannot verify evidence or contact a role holder.")
            }
        }

        Section {
            Button("Start a separate event rehearsal") {
                rehearsalStore.startSeparateEvent()
            }
            .disabled(rehearsalStore.isWorking)
        }
    }

    private func formattedDate(_ value: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: value) else { return value }
        return date.formatted(date: .abbreviated, time: .shortened)
    }
}

private struct DisclosureRolePreviewSection: View {
    let view: DisclosureRoleView

    var body: some View {
        Section {
            LabeledContent("Preview stage", value: view.previewStage.capitalized)
            Text(view.reason)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)

            ForEach(view.assignedPeople) { person in
                VStack(alignment: .leading, spacing: 4) {
                    Text(person.displayName).fontWeight(.semibold)
                    Text(person.evidenceLabel)
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.muted)
                }
            }

            if !view.fieldPolicy.isEmpty {
                DisclosureFieldPolicyView(fields: view.fieldPolicy)
            }

            ForEach(Array(view.matters.enumerated()), id: \.offset) { _, matter in
                DisclosureMatterPreviewView(matter: matter)
            }

            if view.eligibleForProjectedPreview,
               view.matters.isEmpty,
               view.summary.matterCount > 0 {
                LabeledContent("Matter count only", value: String(view.summary.matterCount))
            }
        } header: {
            Text(roleTitle)
        } footer: {
            Text("Projected to you only. Nobody in this role received these fields.")
        }
    }

    private var roleTitle: String {
        switch view.role {
        case "trusted_contact": "Trusted contact"
        case "executor": "Executor record"
        case "recipient": "Matter recipient"
        default: view.role.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}

private struct DisclosureFieldPolicyView: View {
    let fields: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("Allowed fields")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(fields, id: \.self) { field in
                        Text(fieldLabel(field))
                            .font(.footnote)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(RilloraTheme.sageSoft, in: Capsule())
                    }
                }
            }
        }
    }
}

private struct DisclosureMatterPreviewView: View {
    let matter: DisclosureMatterPreview

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            if let title = matter.title { Text(title).fontWeight(.semibold) }
            if let category = matter.category { Text(fieldLabel(category)) }
            if let institution = matter.institutionName { Text(institution) }
            if let location = matter.locationHint { Text(location) }
            if let outcome = matter.desiredOutcome { Text(fieldLabel(outcome)) }
        }
        .font(.subheadline)
        .foregroundStyle(RilloraTheme.body)
    }
}

private func fieldLabel(_ value: String) -> String {
    let leaf = value.split(separator: ".").last.map(String.init) ?? value
    return leaf
        .replacingOccurrences(of: "_", with: " ")
        .replacingOccurrences(
            of: "([a-z])([A-Z])",
            with: "$1 $2",
            options: .regularExpression
        )
        .capitalized
}
