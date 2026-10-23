import Foundation

enum HealthMetric: String, CaseIterable, Sendable, Identifiable {
    case heartRate, restingHeartRate, steps, walkingDistance, sleep, workouts
    var id: String { rawValue }
    static let initial: Set<Self> = [.heartRate, .restingHeartRate, .steps, .walkingDistance]
    var unit: String {
        switch self {
        case .heartRate, .restingHeartRate: "bpm"
        case .steps: "stepsUnit"
        case .walkingDistance: "metres"
        case .sleep, .workouts: "minutes"
        }
    }
}

// Health samples deliberately cannot be serialized into persistence or messages.
struct HealthSample: Sendable, Equatable {
    let id: UUID
    let start: Date
    let end: Date
    let value: Double
    let source: String
    let manual: Bool
}
struct HealthWindow: Sendable, Equatable {
    let start: Date
    let end: Date
    init(now: Date) { start = now.addingTimeInterval(-86400); end = now }
}
struct HealthMetricReading: Sendable, Equatable, Identifiable {
    enum State: Sendable, Equatable { case available, unavailable, failed }
    let metric: HealthMetric
    var id: String { metric.id }
    let state: State
    let value: Double?
    let measuredAt: Date?
    let sources: [String]
    let containsManual: Bool
    let excluded: Int
    let truncated: Bool
    static func failed(_ metric: HealthMetric) -> Self {
        .init(metric: metric, state: .failed, value: nil, measuredAt: nil, sources: [], containsManual: false, excluded: 0, truncated: false)
    }
}

enum HealthSummary {
    static let sampleLimit = 1000
    static func summarize(_ metric: HealthMetric, samples: [HealthSample], window: HealthWindow,
                          mergedTotal: Double? = nil, mergedSources: [String] = [], truncated: Bool = false) -> HealthMetricReading {
        var seen = Set<UUID>(), excluded = 0
        let accepted = samples.prefix(sampleLimit).filter { sample in
            let valueValid = sample.value.isFinite && (metric == .heartRate || metric == .restingHeartRate ? sample.value > 0 : sample.value >= 0)
            let datesValid = sample.start <= sample.end && sample.end <= window.end && sample.end >= window.start
            guard valueValid, datesValid, seen.insert(sample.id).inserted else { excluded += 1; return false }
            return true
        }.sorted { $0.end > $1.end }
        let value: Double?
        switch metric {
        case .steps, .walkingDistance:
            // Use HealthKit statistics, which merge sources. Never sum phone and
            // Watch samples ourselves or treat absent statistics as zero.
            value = mergedTotal.flatMap { $0.isFinite && $0 >= 0 ? $0 : nil }
        case .heartRate, .restingHeartRate: value = accepted.first?.value
        case .sleep:
            let seconds = unionDuration(accepted.map { DateInterval(start: max($0.start, window.start), end: $0.end) })
            value = seconds > 0 ? seconds / 60 : nil
        case .workouts:
            // HKWorkout.duration excludes paused time; its wall-clock span does not.
            value = accepted.first.flatMap { $0.value > 0 ? $0.value / 60 : nil }
        }
        return .init(metric: metric, state: value == nil ? .unavailable : .available, value: value,
                     measuredAt: accepted.first?.end, sources: Array(Set(mergedSources + accepted.map(\.source))).sorted(),
                     containsManual: accepted.contains(where: \.manual), excluded: excluded,
                     truncated: truncated || samples.count > sampleLimit)
    }
    static func unionDuration(_ input: [DateInterval]) -> TimeInterval {
        let sorted = input.filter { $0.duration > 0 }.sorted { $0.start < $1.start }
        guard var current = sorted.first else { return 0 }
        var total: TimeInterval = 0
        for interval in sorted.dropFirst() {
            if interval.start <= current.end { current = DateInterval(start: current.start, end: max(current.end, interval.end)) }
            else { total += current.duration; current = interval }
        }
        return total + current.duration
    }
}

@MainActor
protocol HealthReadingService: AnyObject {
    var available: Bool { get }
    func requestReadAccess(_ metrics: Set<HealthMetric>) async throws
    func read(_ metric: HealthMetric, window: HealthWindow) async throws -> HealthMetricReading
}
