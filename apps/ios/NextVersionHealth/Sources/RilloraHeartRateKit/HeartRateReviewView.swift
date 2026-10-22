#if os(iOS)
import SwiftUI

private enum HealthText {
    static func text(_ key: String) -> String { Bundle.module.localizedString(forKey: key, value: key, table: "Localizable") }
}

/// Only included through the separate next-version project configuration.
public struct HeartRateEntryView: View {
    public init() {}
    public var body: some View {
        NavigationLink { HeartRateReviewView() } label: {
            Label(HealthText.text("title"), systemImage: "heart.text.square")
        }.accessibilityIdentifier("health-review.open")
    }
}

struct HeartRateReviewView: View {
    @State private var store = HeartRateReviewStore(service: HealthKitHeartRateReader())
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        List {
            Section {
                Text(HealthText.text("purpose"))
                Text(HealthText.text("privacy")).foregroundStyle(.secondary)
            }
            Section {
                status
                if store.phase != .unsupported {
                    Button(HealthText.text(store.authorizationFlowCompleted ? "refresh" : "start")) { store.begin() }
                        .disabled(store.busy).accessibilityIdentifier("health-review.read")
                    if store.busy || store.review != nil {
                        Button(HealthText.text("clear")) { store.clear() }.accessibilityIdentifier("health-review.clear")
                    }
                }
            }
            if let review = store.review, !review.readings.isEmpty {
                Section {
                    LabeledContent(HealthText.text("readAt"), value: review.retrievedAt.formatted(date: .abbreviated, time: .shortened))
                    LabeledContent(HealthText.text("watchLabels"), value: review.watchCount.formatted())
                    if review.excludedCount > 0 {
                        LabeledContent(HealthText.text("excluded"), value: review.excludedCount.formatted())
                    }
                    Text(HealthText.text("notLive")).foregroundStyle(.secondary)
                }
                Section(HealthText.text("records")) {
                    ForEach(review.readings) { sample in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(sample.beatsPerMinute, format: .number.precision(.fractionLength(0...1)))
                                Text(HealthText.text("unit"))
                                Spacer()
                                Text(sample.endedAt, format: .dateTime.hour().minute()).foregroundStyle(.secondary)
                            }
                            Text(sample.sourceName).font(.subheadline).foregroundStyle(.secondary)
                            if sample.userEntered { Text(HealthText.text("manual")).font(.subheadline) }
                            else if !sample.markedAsAppleWatch { Text(HealthText.text("otherDevice")).font(.subheadline) }
                        }.accessibilityElement(children: .combine)
                    }
                }
            }
            Section { Text(HealthText.text("scope")).foregroundStyle(.secondary) }
        }
        .navigationTitle(HealthText.text("title"))
        .navigationBarTitleDisplayMode(.inline)
        .privacySensitive()
        // Do not query on appearance or retain records when the scene is hidden.
        .onDisappear { store.clear() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .background { store.clear() }
        }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .accessibilityIdentifier("health-review.view")
    }

    @ViewBuilder private var status: some View {
        switch store.phase {
        case .unsupported: Text(HealthText.text("unsupported"))
        case .idle: Text(HealthText.text("idle"))
        case .requesting: ProgressView(HealthText.text("requesting"))
        case .reading: ProgressView(HealthText.text("reading"))
        case .empty: Text(HealthText.text("empty"))
        case .ready: Text(HealthText.text("ready"))
        case .failed: Text(HealthText.text("failed"))
        }
    }
}
#endif
