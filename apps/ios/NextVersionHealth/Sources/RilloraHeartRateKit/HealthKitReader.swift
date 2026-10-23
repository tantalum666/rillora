#if os(iOS)
import Foundation
import HealthKit

@MainActor
final class HealthKitReader: HealthReadingService {
    private let store = HKHealthStore()
    var available: Bool { HKHealthStore.isHealthDataAvailable() }
    private func quantity(_ metric: HealthMetric) -> HKQuantityType? {
        switch metric {
        case .heartRate: HKQuantityType(.heartRate)
        case .restingHeartRate: HKQuantityType(.restingHeartRate)
        case .steps: HKQuantityType(.stepCount)
        case .walkingDistance: HKQuantityType(.distanceWalkingRunning)
        default: nil
        }
    }
    private func type(_ metric: HealthMetric) -> HKObjectType {
        if let type = quantity(metric) { return type }
        if metric == .sleep { return HKCategoryType(.sleepAnalysis) }
        return HKObjectType.workoutType()
    }
    func requestReadAccess(_ metrics: Set<HealthMetric>) async throws {
        guard !metrics.isEmpty else { return }
        try await store.requestAuthorization(toShare: [], read: Set(metrics.map(type)))
    }
    func read(_ metric: HealthMetric, window: HealthWindow) async throws -> HealthMetricReading {
        try Task.checkCancellation()
        let predicate = HKQuery.predicateForSamples(withStart: window.start, end: window.end)
        if let quantity = quantity(metric) {
            let unit: HKUnit = metric == .walkingDistance ? .meter() :
                (metric == .steps ? .count() : .count().unitDivided(by: .minute()))
            let merged = metric == .steps || metric == .walkingDistance
            let query = HKSampleQueryDescriptor(predicates: [.quantitySample(type: quantity, predicate: predicate)],
                sortDescriptors: [SortDescriptor(\HKQuantitySample.endDate, order: .reverse)], limit: merged ? 1 : HealthSummary.sampleLimit + 1)
            let records = try await query.result(for: store)
            var total: Double?, sources: [String] = []
            if merged {
                let statistics = try await HKStatisticsQueryDescriptor(predicate: .quantitySample(type: quantity, predicate: predicate), options: .cumulativeSum).result(for: store)
                total = statistics?.sumQuantity()?.doubleValue(for: unit)
                sources = statistics?.sources?.map { String($0.name.prefix(120)) } ?? []
            }
            try Task.checkCancellation()
            return HealthSummary.summarize(metric, samples: records.map { sample($0, value: $0.quantity.doubleValue(for: unit)) },
                window: window, mergedTotal: total, mergedSources: sources, truncated: records.count > HealthSummary.sampleLimit)
        }
        if metric == .sleep {
            let asleep = [HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                          HKCategoryValueSleepAnalysis.asleepDeep.rawValue, HKCategoryValueSleepAnalysis.asleepREM.rawValue]
            // The OR includes all asleep stages; in-bed and awake intervals do not count as sleep.
            let sleepPredicate = NSCompoundPredicate(andPredicateWithSubpredicates: [predicate,
                NSCompoundPredicate(orPredicateWithSubpredicates: asleep.map { HKQuery.predicateForCategorySamples(with: .equalTo, value: $0) })])
            let records = try await HKSampleQueryDescriptor(predicates: [.categorySample(type: HKCategoryType(.sleepAnalysis), predicate: sleepPredicate)],
                sortDescriptors: [SortDescriptor(\HKCategorySample.endDate, order: .reverse)], limit: HealthSummary.sampleLimit + 1).result(for: store)
            try Task.checkCancellation()
            return HealthSummary.summarize(metric, samples: records.map { sample($0, value: 1) }, window: window,
                truncated: records.count > HealthSummary.sampleLimit)
        }
        let records = try await HKSampleQueryDescriptor(predicates: [.workout(predicate)],
            sortDescriptors: [SortDescriptor(\HKWorkout.endDate, order: .reverse)], limit: HealthSummary.sampleLimit + 1).result(for: store)
        try Task.checkCancellation()
        return HealthSummary.summarize(metric, samples: records.map { sample($0, value: $0.duration) }, window: window,
            truncated: records.count > HealthSummary.sampleLimit)
    }
    private func sample(_ value: HKSample, value amount: Double) -> HealthSample {
        .init(id: value.uuid, start: value.startDate, end: value.endDate, value: amount,
              source: String(value.sourceRevision.source.name.prefix(120)),
              manual: (value.metadata?[HKMetadataKeyWasUserEntered] as? NSNumber)?.boolValue == true)
    }
}
#endif
