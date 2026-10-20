import SwiftUI

struct DisclosureRehearsalView: View {
    @State private var rehearsalStore: DisclosureRehearsalStore
    @RilloraReduceMotion private var reduceMotion

    init(service: any DisclosureRehearsing) {
        _rehearsalStore = State(initialValue: DisclosureRehearsalStore(service: service))
    }

    var body: some View {
        @Bindable var rehearsalStore = rehearsalStore

        RilloraForm {
            if let rehearsal = rehearsalStore.rehearsal {
                rehearsalSections(rehearsal)
            } else {
                Section {
                    LifeEventChoices(selection: $rehearsalStore.selectedLifeEvent, identifierPrefix: "disclosure-rehearsal.event") {
                        Task { await rehearsalStore.create() }
                    }
                        .disabled(rehearsalStore.isWorking)
                        .padding(.vertical, 14)
                }
                .listRowBackground(Color.clear)

                Section {
                    Button {
                        Task { await rehearsalStore.create() }
                    } label: {
                        HStack {
                            if rehearsalStore.isWorking { ProgressView() }
                            Label(
                                rehearsalStore.isWorking
                                    ? String(localized: "Preparing preview…")
                                    : String(localized: "Preview role access"),
                                systemImage: "shield.lefthalf.filled"
                            )
                            .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .disabled(rehearsalStore.isWorking)
                    .accessibilityIdentifier("disclosure-rehearsal.create")
                }
                .listRowBackground(Color.clear)
                Section {
                    RilloraInfoDisclosure(String(localized: "Simulation only")) {
                        Text(rehearsalStore.selectedLifeEvent.explanation)
                        Text(String(localized: "Only you see this rehearsal. It verifies no evidence, contacts nobody and releases nothing. Cooling periods do not elapse automatically here."))
                            .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    }
                }
                .listRowBackground(Color.clear)
            }
        }
        .rilloraStructuredList()
        .listSectionSpacing(18)
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Role disclosure"))
        .navigationBarTitleDisplayMode(.inline)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: rehearsalStore.rehearsal?.state)
        .alert(
            String(localized: "Rehearsal not updated"),
            isPresented: Binding(
                get: { if case .failed = rehearsalStore.phase { true } else { false } },
                set: { if !$0 { rehearsalStore.clearFailure() } }
            )
        ) {
            Button(String(localized: "OK"), role: .cancel) { rehearsalStore.clearFailure() }
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
            VStack(spacing: 14) {
                Image(systemName: rehearsal.previewReady ? "eye" : "shield.lefthalf.filled")
                    .font(.system(size: 30))
                    .foregroundStyle(RilloraTheme.tabSelection)
                    .frame(width: 76, height: 76)
                    .background(RilloraTheme.sageSoft, in: Circle())
                    .accessibilityHidden(true)
                Text(DisclosurePresentation.state(rehearsal.state))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(RilloraTheme.ink)
                    .multilineTextAlignment(.center)
                    .contentTransition(.opacity)
                    .accessibilityIdentifier("disclosure-rehearsal.state")
                Text(L10n.format("%1$@ · simulation only", rehearsal.lifeEvent.title))
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
                HStack(spacing: 8) {
                    let completed = Set(rehearsal.completedCheckpoints.map(\.code))
                    ForEach(rehearsal.stateSequence) { step in
                        Capsule()
                            .fill(completed.contains(step.key) || rehearsal.state == step.key ? RilloraTheme.tabSelection : RilloraTheme.border)
                            .frame(height: 4)
                    }
                }
                .accessibilityHidden(true)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
        .listRowBackground(Color.clear)

        if !rehearsal.availableActions.isEmpty {
            Section {
                ForEach(rehearsal.availableActions) { action in
                    rehearsalAction(action)
                        .listRowSeparator(.hidden)
                }
            }
            .listRowBackground(Color.clear)
        }

        ForEach(rehearsal.projectedRoleViews) { roleView in
            DisclosureRolePreviewSection(view: roleView)
        }

        Section {
            RilloraInfoDisclosure(String(localized: "Policy path")) {
                let completed = Set(rehearsal.completedCheckpoints.map(\.code))
                ForEach(rehearsal.stateSequence) { step in
                    let isCurrent = rehearsal.state == step.key
                    Label(DisclosurePresentation.state(step.key), systemImage: completed.contains(step.key) ? "checkmark.circle.fill" : "circle")
                        .font(.subheadline)
                        .foregroundStyle(isCurrent ? RilloraTheme.tabSelection : RilloraTheme.body)
                        .accessibilityValue(isCurrent ? String(localized: "Current step") : completed.contains(step.key) ? String(localized: "Simulated") : String(localized: "Not reached"))
                }
                if let end = rehearsal.coolingOffEndsAt, rehearsal.coolingOffSimulatedAt == nil {
                    LabeledContent(String(localized: "Illustrative hold"), value: formattedDate(end))
                }
                Text(L10n.format("Policy %1$@. No evidence is verified and nobody receives these fields.", rehearsal.policyVersion))
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            Button(String(localized: "Start a separate event rehearsal")) { rehearsalStore.startSeparateEvent() }
                .disabled(rehearsalStore.isWorking)
        }
        .listRowBackground(Color.clear)
    }

    @ViewBuilder
    private func rehearsalAction(_ action: DisclosureRehearsalAction) -> some View {
        let control = Button(role: action == .cancel ? .destructive : nil) {
            Task { await rehearsalStore.perform(action) }
        } label: {
            HStack {
                if rehearsalStore.isWorking { ProgressView() }
                Text(action.label).frame(maxWidth: .infinity)
            }
        }
        .disabled(rehearsalStore.isWorking)
        .accessibilityIdentifier("disclosure-rehearsal.action.\(action.rawValue)")
        if action == .cancel || action == .appeal {
            control.buttonStyle(.bordered)
                .controlSize(.large)
        } else {
            control.buttonStyle(RilloraPrimaryActionButtonStyle())
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
            DisclosureGroup {
            LabeledContent(String(localized: "Preview stage"), value: DisclosurePresentation.stage(view.previewStage))
            Text(DisclosurePresentation.reason(view.reason))
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
                LabeledContent(String(localized: "Matter count only"), value: view.summary.matterCount.formatted())
            }
            } label: {
                HStack {
                    Text(roleTitle).fontWeight(.semibold)
                    Spacer()
                    Text(DisclosurePresentation.stage(view.previewStage))
                        .font(.footnote).foregroundStyle(RilloraTheme.muted)
                }
                .frame(minHeight: 44)
            }
        }
    }

    private var roleTitle: String {
        switch view.role {
        case "trusted_contact": String(localized: "Trusted contact")
        case "executor": String(localized: "Executor record")
        case "recipient": String(localized: "Matter recipient")
        default: view.role.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}

private struct DisclosureFieldPolicyView: View {
    let fields: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(String(localized: "Allowed fields"))
                .font(.footnote.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
            RilloraFlowLayout(spacing: 6, rowSpacing: 6) {
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
    if let category = MatterCategory(rawValue: leaf) { return category.label }
    if let outcome = MatterOutcome(rawValue: leaf) { return outcome.label }
    switch leaf {
    case "title", "displayName": return String(localized: "Name")
    case "category": return String(localized: "Category")
    case "institutionName": return String(localized: "Provider")
    case "locationHint": return String(localized: "Where to find it")
    case "desiredOutcome": return String(localized: "Wishes")
    case "timeZone": return String(localized: "Time zone")
    case "matterCount": return String(localized: "Matter count")
    default: break
    }
    return leaf
        .replacingOccurrences(of: "_", with: " ")
        .replacingOccurrences(
            of: "([a-z])([A-Z])",
            with: "$1 $2",
            options: .regularExpression
        )
        .capitalized
}
