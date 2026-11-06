import Foundation
import Testing
@testable import RilloraHeartRateKit

private let date = Date(timeIntervalSince1970: 1_700_000_000)
private func sample(_ value: Double = 72, id: UUID = UUID(), start: TimeInterval = -60, end: TimeInterval = -60, manual: Bool = false) -> HealthSample {
    .init(id: id, start: date.addingTimeInterval(start), end: date.addingTimeInterval(end), value: value, source: "Synthetic source", manual: manual)
}
private let window = HealthWindow(now: date)

@Test func heartReadingsRejectInvalidFutureOldAndDuplicateRecords() {
    let same = sample()
    let result = HealthSummary.summarize(.heartRate, samples: [sample(0), sample(.nan), sample(.infinity), sample(-4),
        sample(start: 1, end: 1), sample(start: -86401, end: -86401), same, same, sample(80, end: -30, manual: true)], window: window)
    #expect(result.value == 80); #expect(result.excluded == 7); #expect(result.containsManual)
}
@Test func absentActivityStatisticsRemainUnknownRatherThanZero() {
    let result = HealthSummary.summarize(.steps, samples: [], window: window)
    #expect(result.state == .unavailable); #expect(result.value == nil); #expect(result.measuredAt == nil)
    let actualZero = HealthSummary.summarize(.steps, samples: [], window: window, mergedTotal: 0)
    #expect(actualZero.state == .available); #expect(actualZero.value == 0)
}
@Test func activityUsesMergedStatisticsWithoutAddingOverlappingSources() {
    let result = HealthSummary.summarize(.steps, samples: [sample(100), sample(100)], window: window, mergedTotal: 110,
        mergedSources: ["Phone", "Watch"])
    #expect(result.value == 110); #expect(result.sources.contains("Phone")); #expect(result.sources.contains("Watch"))
    #expect(HealthSummary.summarize(.walkingDistance, samples: [], window: window, mergedTotal: .infinity).value == nil)
    #expect(HealthSummary.summarize(.steps, samples: [], window: window, mergedTotal: -1).value == nil)
}
@Test func sleepOverlapsDuplicatesAndWindowEdgesDoNotInflateDuration() {
    let result = HealthSummary.summarize(.sleep, samples: [sample(1, start: -90000, end: -82800),
        sample(1, start: -85000, end: -80000), sample(1, start: -85000, end: -80000), sample(1, start: -78000, end: -77400)], window: window)
    #expect(result.value == (6400 + 600) / 60.0)
    #expect(HealthSummary.unionDuration([]) == 0)
    #expect(HealthSummary.summarize(.sleep, samples: [], window: window).value == nil)
}
@Test func workoutUsesLatestRecordedDurationInsteadOfPausedWallClockTime() {
    let result = HealthSummary.summarize(.workouts, samples: [sample(1200, start: -7200, end: -6000), sample(600, start: -3600, end: -60)], window: window)
    #expect(result.value == 10)
    #expect(result.measuredAt == date.addingTimeInterval(-60))
}
@Test func resultLimitAndManualSourcesStayVisible() {
    let samples = (0..<1001).map { _ in sample(manual: true) }
    let result = HealthSummary.summarize(.restingHeartRate, samples: samples, window: window)
    #expect(result.truncated); #expect(result.containsManual)
    #expect(window.start == date.addingTimeInterval(-86400))
}

@MainActor private final class Reader: HealthReadingService {
    var available = true
    var requests: [Set<HealthMetric>] = []
    var queries: [HealthMetric] = []
    var values: [HealthSample] = []
    var failing: Set<HealthMetric> = []
    var suspend = false
    var continuation: CheckedContinuation<HealthMetricReading, Error>?
    func requestReadAccess(_ metrics: Set<HealthMetric>) async throws { requests.append(metrics) }
    func read(_ metric: HealthMetric, window: HealthWindow) async throws -> HealthMetricReading {
        queries.append(metric)
        #expect(window.start == date.addingTimeInterval(-86400)); #expect(window.end == date)
        if failing.contains(metric) { throw CancellationError() }
        if suspend { return try await withCheckedThrowingContinuation { continuation = $0 } }
        return HealthSummary.summarize(metric, samples: values, window: window)
    }
}
@MainActor private func settle(_ predicate: () -> Bool) async throws {
    for _ in 0..<200 { if predicate() { return }; try await Task.sleep(for: .milliseconds(5)) }
    #expect(predicate(), "Synthetic asynchronous action did not settle")
}
@Test @MainActor func unsupportedOrEmptySelectionNeverRequestsPermission() async throws {
    let reader = Reader(); reader.available = false
    let store = HealthReviewStore(service: reader, now: { date }); store.begin()
    #expect(store.phase == .unsupported); #expect(reader.requests.isEmpty)
    reader.available = true; store.selected = []; store.begin(); #expect(reader.requests.isEmpty)
}
@Test @MainActor func onlySelectedTypesAreRequestedAndRefreshDoesNotRepeatPermission() async throws {
    let reader = Reader()
    let actual = HealthReviewStore(service: reader, now: { date })
    #expect(actual.phase == .idle); actual.selected = [.sleep]
    actual.begin(); try await settle { !actual.busy }
    #expect(reader.requests == [[.sleep]]); #expect(reader.queries == [.sleep])
    #expect(actual.readings.first?.state == .unavailable)
    actual.begin(); try await settle { !actual.busy }; #expect(reader.requests.count == 1)
    actual.selected.insert(.steps); actual.begin(); try await settle { !actual.busy }
    #expect(reader.requests.last == [.sleep, .steps])
}
@Test @MainActor func oneTypeFailureDoesNotEraseOtherTypesOrReuseOldValues() async throws {
    let reader = Reader(); reader.values = [sample()]
    let store = HealthReviewStore(service: reader, now: { date }); store.selected = [.heartRate, .sleep]
    store.begin(); try await settle { !store.busy }; #expect(store.readings.first?.value == 72)
    reader.failing = [.heartRate]; store.begin(); try await settle { !store.busy }
    #expect(store.readings.first?.state == .failed); #expect(store.readings.first?.value == nil)
    #expect(store.readings.count == 2)
}
@Test @MainActor func leavingCancelsAndDiscardsLateResults() async throws {
    let reader = Reader(); reader.suspend = true
    let store = HealthReviewStore(service: reader, now: { date }); store.selected = [.heartRate]
    store.begin(); store.begin(); try await settle { reader.continuation != nil }
    #expect(reader.requests.count == 1); #expect(reader.queries.count == 1)
    store.clear(); reader.continuation?.resume(returning: HealthSummary.summarize(.heartRate, samples: [sample()], window: window)); reader.continuation = nil
    try await Task.sleep(for: .milliseconds(10))
    #expect(store.phase == .idle); #expect(store.readings.isEmpty); #expect(store.requested.isEmpty)
}
