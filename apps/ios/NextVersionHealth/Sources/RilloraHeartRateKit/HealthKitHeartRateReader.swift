#if os(iOS)
import Foundation
import HealthKit

@MainActor
final class HealthKitHeartRateReader: HeartRateReadingService {
    private let healthStore = HKHealthStore()
    private let type = HKQuantityType(.heartRate)
    var available: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestReadAccess() async throws {
        // No write permission, clinical records, location, activity or background delivery.
        try await healthStore.requestAuthorization(toShare: [], read: [type])
    }

    func read(since: Date, until: Date, limit: Int) async throws -> [HeartRateReading] {
        let predicate = HKQuery.predicateForSamples(withStart: since, end: until, options: [.strictStartDate, .strictEndDate])
        let query = HKSampleQueryDescriptor(predicates: [.quantitySample(type: type, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\HKQuantitySample.startDate, order: .reverse)],
            limit: min(max(limit, 1), HeartRateReview.maximumSamples))
        let samples = try await query.result(for: healthStore)
        try Task.checkCancellation()
        let unit = HKUnit.count().unitDivided(by: .minute())
        return samples.map { sample in
            HeartRateReading(id: sample.uuid, beatsPerMinute: sample.quantity.doubleValue(for: unit),
                startedAt: sample.startDate, endedAt: sample.endDate,
                sourceName: String(sample.sourceRevision.source.name.prefix(120)),
                deviceModel: sample.device?.model.map { String($0.prefix(80)) },
                markedAsAppleWatch: sample.device?.manufacturer == "Apple Inc." && sample.device?.model?.hasPrefix("Watch") == true,
                userEntered: (sample.metadata?[HKMetadataKeyWasUserEntered] as? NSNumber)?.boolValue == true)
        }
    }
}
#endif
