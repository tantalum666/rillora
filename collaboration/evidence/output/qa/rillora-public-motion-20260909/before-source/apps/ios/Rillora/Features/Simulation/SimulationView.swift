import SwiftUI

struct SimulationView: View {
    @State private var simulationStore: SimulationStore
    let overviewStore: OverviewStore

    init(service: any SimulationRunning, overviewStore: OverviewStore) {
        _simulationStore = State(initialValue: SimulationStore(service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        @Bindable var simulationStore = simulationStore

        Form {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Test your plan")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                    Text("See how many matters, directions and trusted contacts your plan covers in a life event.")
                        .foregroundStyle(RilloraTheme.body)
                }
            } footer: {
                Text("Private rehearsal only. Nobody is contacted, nothing is released and no legal authority is created.")
            }

            Section("Choose one distinct scenario") {
                RilloraAdaptivePicker("Life event", selection: $simulationStore.selectedLifeEvent) {
                    ForEach(LifeEvent.allCases) { event in
                        Text(event.title).tag(event)
                    }
                }
                .pickerStyle(.navigationLink)
                .disabled(simulationStore.isRunning)
                .accessibilityIdentifier("simulation.event")

                Text(simulationStore.selectedLifeEvent.explanation)
                    .font(.subheadline)
                    .foregroundStyle(RilloraTheme.body)
            }

            switch simulationStore.state {
            case .ready, .failed:
                Section {
                    Button {
                        Task {
                            guard await simulationStore.run() != nil else { return }
                            await overviewStore.reconcileAfterMutation()
                        }
                    } label: {
                        Label("Run rehearsal", systemImage: "play.fill")
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .accessibilityIdentifier("simulation.run")
                }
            case .running:
                Section {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Checking your plan…")
                    }
                }
            case .completed(let simulation):
                SimulationResultSection(simulation: simulation)
                Section {
                    Button("Choose another scenario") {
                        simulationStore.reset()
                    }
                } footer: {
                    Text("Running again creates a separate private rehearsal record.")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Simulation")
        .navigationBarTitleDisplayMode(.inline)
        .alert(
            "Simulation not completed",
            isPresented: Binding(
                get: { if case .failed = simulationStore.state { true } else { false } },
                set: { if !$0 { simulationStore.clearFailure() } }
            )
        ) {
            Button("OK", role: .cancel) {
                simulationStore.clearFailure()
            }
        } message: {
            if case .failed(let message) = simulationStore.state {
                Text(message)
            }
        }
        .accessibilityIdentifier("simulation.view")
    }
}

private struct SimulationResultSection: View {
    let simulation: ClaimSimulation

    var body: some View {
        Section {
            Label("Rehearsal recorded", systemImage: "checkmark.circle.fill")
                .font(.headline)
                .foregroundStyle(RilloraTheme.sage)
            LabeledContent("Scenario", value: simulation.lifeEvent.title)
            LabeledContent("Matters in snapshot", value: String(simulation.snapshot.matterCount))
            LabeledContent("Outcomes assigned", value: String(simulation.snapshot.outcomeCount))
            LabeledContent(
                "Trusted contacts in snapshot",
                value: String(simulation.snapshot.trustedContactCount)
            )
            LabeledContent("Notifications", value: "None sent")
            LabeledContent("Data release", value: "None")
        } header: {
            Text("Result")
        } footer: {
            Text("Policy \(simulation.policyVersion). This rehearsal stores counts only.")
        }
        .accessibilityIdentifier("simulation.result")
    }
}
