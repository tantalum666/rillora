import SwiftUI

struct SimulationView: View {
    @State private var simulationStore: SimulationStore
    let overviewStore: OverviewStore
    @RilloraReduceMotion private var reduceMotion

    init(service: any SimulationRunning, overviewStore: OverviewStore) {
        _simulationStore = State(initialValue: SimulationStore(service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        @Bindable var simulationStore = simulationStore
        RilloraForm {
            Section {
                LifeEventChoices(selection: $simulationStore.selectedLifeEvent, identifierPrefix: "simulation.event", compact: hasResult) {
                    runRehearsal()
                }
                    .disabled(simulationStore.isRunning)
                    .padding(.vertical, 14)
            }
            .listRowBackground(Color.clear)

            Section {
                Button {
                    runRehearsal()
                } label: {
                    HStack {
                        if simulationStore.isRunning { ProgressView() }
                        Label(simulationStore.isRunning ? "Checking plan…" : "Run rehearsal", systemImage: "play.fill")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .disabled(simulationStore.isRunning)
                .accessibilityIdentifier("simulation.run")
            }
            .listRowBackground(Color.clear)

            if case .completed(let simulation) = simulationStore.state {
                Section {
                    SimulationResultSection(simulation: simulation)
                }
            }

            Section {
                RilloraInfoDisclosure("Simulation only") {
                    Text(simulationStore.selectedLifeEvent.explanation)
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    RilloraFactStrip([
                        .init(title: "No contact", systemImage: "envelope"),
                        .init(title: "No release", systemImage: "lock.shield"),
                        .init(title: "No legal authority", systemImage: "building.columns"),
                    ])
                    if case .completed(let simulation) = simulationStore.state {
                        LabeledContent("Notifications", value: "None sent")
                        LabeledContent("Data release", value: "None")
                        Text("Policy \(simulation.policyVersion) · counts only")
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                }
            }
            .listRowBackground(Color.clear)
        }
        .rilloraStructuredList()
        .listSectionSpacing(18)
        .rilloraFocusedTask()
        .navigationTitle("Rehearsal")
        .navigationBarTitleDisplayMode(.inline)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: simulationStore.state)
        .alert(
            "Simulation not completed",
            isPresented: Binding(
                get: { if case .failed = simulationStore.state { true } else { false } },
                set: { if !$0 { simulationStore.clearFailure() } }
            )
        ) {
            Button("OK", role: .cancel) { simulationStore.clearFailure() }
        } message: {
            if case .failed(let message) = simulationStore.state { Text(message) }
        }
        .accessibilityIdentifier("simulation.view")
    }

    private var hasResult: Bool {
        if case .completed = simulationStore.state { return true }
        return false
    }

    private func runRehearsal() {
        Task {
            guard await simulationStore.run() != nil else { return }
            await overviewStore.reconcileAfterMutation()
        }
    }
}

private struct SimulationResultSection: View {
    let simulation: ClaimSimulation
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(spacing: 18) {
            Label("Rehearsal recorded", systemImage: "checkmark.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 18) { metrics }
            } else {
                HStack(alignment: .top, spacing: 12) { metrics }
            }
        }
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("simulation.result")
    }

    private var metrics: some View {
        Group {
            metric("Matters", symbol: "doc.text", count: simulation.snapshot.matterCount)
            metric("Directions", symbol: "arrow.triangle.branch", count: simulation.snapshot.outcomeCount)
            metric("People", symbol: "person.2", count: simulation.snapshot.trustedContactCount)
        }
    }

    private func metric(_ title: String, symbol: String, count: Int) -> some View {
        VStack(spacing: 6) {
            Image(systemName: symbol).font(.title3).foregroundStyle(RilloraTheme.tabSelection)
            Text(count, format: .number).font(.title2.weight(.semibold)).contentTransition(.numericText())
            Text(title).font(.footnote).foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(count) \(title.lowercased())")
    }
}
