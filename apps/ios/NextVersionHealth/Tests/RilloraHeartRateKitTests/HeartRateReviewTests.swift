import Foundation
import Testing
@testable import RilloraHeartRateKit

private let date = Date(timeIntervalSince1970: 1_700_000_000)
private func reading(_ bpm: Double = 72, id: UUID = UUID(), offset: TimeInterval = -60,
                     manual: Bool = false, watch: Bool = true) -> HeartRateReading {
    HeartRateReading(id: id, beatsPerMinute: bpm, startedAt: date.addingTimeInterval(offset),
        endedAt: date.addingTimeInterval(offset), sourceName: "Synthetic health source", deviceModel: "Watch",
        markedAsAppleWatch: watch, userEntered: manual)
}

@Test func invalidFutureDuplicateAndStaleReadingsAreNotInterpretedAsACondition() {
    let duplicate = reading()
    let result = HeartRateReview(samples: [reading(0), reading(.nan), reading(.infinity), reading(-4),
        reading(offset: 1), reading(offset: -86401), duplicate, duplicate, reading(manual: true), reading(watch: false)], retrievedAt: date)
    #expect(result.excludedCount == 7)
    #expect(result.readings.count == 3)
    #expect(result.watchCount == 1)
    #expect(result.readings.contains { $0.userEntered })
    #expect(result.readings.contains { !$0.markedAsAppleWatch })
}

@Test func reviewHasAFixedBoundAndDoesNotInventFreshnessOrPermission() {
    let result = HeartRateReview(samples: (0..<250).map { reading(offset: -Double($0 + 1)) }, retrievedAt: date)
    #expect(result.readings.count == 200)
    #expect(result.readings.first?.endedAt == date.addingTimeInterval(-1))
    #expect(HeartRateReview(samples: [], retrievedAt: date).watchCount == 0)
}

@MainActor private final class Reader: HeartRateReadingService {
    var available = true
    var requests = 0
    var queries = 0
    var readings: [HeartRateReading] = []
    var fail = false
    var suspend = false
    var continuation: CheckedContinuation<[HeartRateReading], Error>?
    func requestReadAccess() async throws { requests += 1 }
    func read(since: Date, until: Date, limit: Int) async throws -> [HeartRateReading] {
        queries += 1
        #expect(since == date.addingTimeInterval(-86400))
        #expect(until == date)
        #expect(limit == 200)
        if fail { throw CancellationError() }
        if suspend { return try await withCheckedThrowingContinuation { continuation = $0 } }
        return readings
    }
}
@MainActor private func settle(_ predicate: () -> Bool) async throws {
    for _ in 0..<100 {
        if predicate() { return }
        try await Task.sleep(for: .milliseconds(5))
    }
    #expect(predicate(), "Synthetic asynchronous action did not settle")
}

@Test @MainActor func unsupportedDeviceNeverRequestsHealthAccess() async throws {
    let reader = Reader(); reader.available = false
    let store = HeartRateReviewStore(service: reader, now: { date })
    store.begin()
    #expect(store.phase == .unsupported)
    #expect(reader.requests == 0 && reader.queries == 0)
}
@Test @MainActor func emptyResultsDoNotClaimReadPermissionOrDeath() async throws {
    let reader = Reader(), store = HeartRateReviewStore(service: Reader(), now: { date })
    #expect(store.phase == .idle)
    let actual = HeartRateReviewStore(service: reader, now: { date })
    actual.begin(); try await settle { !actual.busy }
    #expect(actual.authorizationFlowCompleted)
    #expect(actual.phase == .empty)
    #expect(actual.review?.readings.isEmpty == true)
    actual.begin(); try await settle { !actual.busy }
    #expect(reader.requests == 1 && reader.queries == 2)
}
@Test @MainActor func failureDropsOldRecordsWithoutInventingAReason() async throws {
    let reader = Reader(); reader.readings = [reading()]
    let store = HeartRateReviewStore(service: reader, now: { date })
    store.begin(); try await settle { store.phase == .ready }
    reader.fail = true
    store.begin(); try await settle { !store.busy }
    #expect(store.phase == .failed && store.review == nil)
}
@Test @MainActor func leavingCancelsAndDiscardsLateResults() async throws {
    let reader = Reader(); reader.suspend = true
    let store = HeartRateReviewStore(service: reader, now: { date })
    store.begin(); store.begin()
    try await settle { reader.continuation != nil }
    #expect(reader.requests == 1 && reader.queries == 1)
    store.clear()
    reader.continuation?.resume(returning: [reading()]); reader.continuation = nil
    try await Task.sleep(for: .milliseconds(10))
    #expect(store.phase == .idle && store.review == nil && !store.authorizationFlowCompleted)
}
