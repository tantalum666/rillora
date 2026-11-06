#if os(iOS)
import SwiftUI

enum HealthText {
    static func text(_ key: String) -> String { Bundle.module.localizedString(forKey: key, value: key, table: "Localizable") }
}

public struct HealthEntryView: View {
    public init() {}
    public var body: some View {
        NavigationLink { HealthReviewView() } label: {
            Label(HealthText.text("title"), systemImage: "heart.text.square")
        }.accessibilityIdentifier("health-review.open")
    }
}

struct HealthReviewView: View {
    @State private var store: HealthReviewStore
    @State private var selecting = true
    @Environment(\.scenePhase) private var scenePhase
    init() {
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["RILLORA_HEALTH_UI_FIXTURE"] == "1" {
            _store = State(initialValue: HealthReviewStore(service: SyntheticHealthReader()))
            return
        }
        #endif
        _store = State(initialValue: HealthReviewStore(service: HealthKitReader()))
    }
    var body: some View {
        List {
            Section {
                Button(HealthText.text("readSelected")) { selecting = false; store.begin() }
                    .disabled(store.busy || store.selected.isEmpty || store.phase == .unsupported)
                    .accessibilityIdentifier("health-review.read")
                if store.busy { ProgressView(HealthText.text(store.phase == .requesting ? "requesting" : "reading")) }
                if store.phase == .unsupported { Text(HealthText.text("unsupported")) }
                if store.phase == .failed { Text(HealthText.text("failed")) }
                DisclosureGroup(HealthText.text("chooseTypes"), isExpanded: $selecting) {
                    ForEach(HealthMetric.allCases) { metric in
                        Toggle(HealthText.text(metric.rawValue), isOn: Binding(get: { store.selected.contains(metric) }, set: { value in
                            if value { store.selected.insert(metric) } else { store.selected.remove(metric) }
                            store.clear()
                        })).disabled(store.busy).accessibilityIdentifier("health-review.type." + metric.rawValue)
                    }
                }
            } footer: { Text(HealthText.text("purpose")) }
            if let window = store.window {
                Section {
                    LabeledContent(HealthText.text("period"), value: HealthText.text("last24Hours"))
                    LabeledContent(HealthText.text("readAt"), value: window.end.formatted(date: .abbreviated, time: .shortened))
                }
                ForEach(store.readings) { reading in
                    Section(HealthText.text(reading.metric.rawValue)) {
                        if let value = reading.value {
                            HStack(alignment: .firstTextBaseline) {
                                Text(value, format: .number.precision(.fractionLength(0...(reading.metric == .steps ? 0 : 1))))
                                    .font(.title2.monospacedDigit())
                                Text(HealthText.text(reading.metric.unit)).foregroundStyle(.secondary)
                            }.accessibilityElement(children: .combine)
                                .accessibilityIdentifier("health-review.value." + reading.metric.rawValue)
                        } else { Text(HealthText.text(reading.state == .failed ? "failed" : "empty")) }
                        if let date = reading.measuredAt {
                            LabeledContent(HealthText.text("measuredAt"), value: date.formatted(date: .abbreviated, time: .shortened))
                        }
                        if reading.truncated { Text(HealthText.text("partialRecords")).foregroundStyle(.secondary) }
                        if reading.excluded > 0 { LabeledContent(HealthText.text("excluded"), value: reading.excluded.formatted()) }
                        if !reading.sources.isEmpty {
                            DisclosureGroup(HealthText.text("sources")) {
                                ForEach(reading.sources, id: \.self) { Text($0) }
                                if reading.containsManual { Text(HealthText.text("manual")) }
                                if reading.metric == .steps || reading.metric == .walkingDistance { Text(HealthText.text("systemMerged")) }
                            }
                        }
                    }
                }
            }
            if store.busy || store.window != nil {
                Button(HealthText.text("clear")) { store.clear() }.accessibilityIdentifier("health-review.clear")
            }
            Section { Text(HealthText.text("privacy")).foregroundStyle(.secondary) }
        }
        .navigationTitle(HealthText.text("title")).navigationBarTitleDisplayMode(.inline)
        .privacySensitive()
        .onDisappear { store.clear() }
        .onChange(of: scenePhase) { _, phase in if phase == .background { store.clear() } }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .accessibilityIdentifier("health-review.view")
    }
}

#if DEBUG && targetEnvironment(simulator)
@MainActor
private final class SyntheticHealthReader: HealthReadingService {
    let available = true
    func requestReadAccess(_ metrics: Set<HealthMetric>) async throws {}
    func read(_ metric: HealthMetric, window: HealthWindow) async throws -> HealthMetricReading {
        let samples = [HealthSample(id: UUID(), start: window.end.addingTimeInterval(-3600), end: window.end.addingTimeInterval(-60),
            value: 72, source: HealthText.text("syntheticSource"), manual: false)]
        return HealthSummary.summarize(metric, samples: samples, window: window,
            mergedTotal: metric == .steps ? 1234 : (metric == .walkingDistance ? 900 : nil))
    }
}
#endif
#endif
