import Foundation

// Deliberately not Codable: this feature has no persistence, server or sharing contract.
struct HeartRateReading: Identifiable, Sendable, Equatable {
    let id: UUID
    let beatsPerMinute: Double
    let startedAt: Date
    let endedAt: Date
    let sourceName: String
    let deviceModel: String?
    let markedAsAppleWatch: Bool
    let userEntered: Bool
}

struct HeartRateReview: Sendable, Equatable {
    static let maximumSamples = 200
    static let window: TimeInterval = 24 * 60 * 60
    let readings: [HeartRateReading]
    let excludedCount: Int
    let retrievedAt: Date
    // This is a device metadata label, not proof of the wearer's identity or condition.
    var watchCount: Int { readings.filter { $0.markedAsAppleWatch && !$0.userEntered }.count }

    init(samples: [HeartRateReading], retrievedAt: Date) {
        self.retrievedAt = retrievedAt
        var identifiers = Set<UUID>()
        var selected: [HeartRateReading] = []
        var excluded = 0
        for sample in samples.prefix(Self.maximumSamples) {
            guard sample.beatsPerMinute.isFinite, sample.beatsPerMinute > 0,
                  sample.startedAt >= retrievedAt.addingTimeInterval(-Self.window),
                  sample.endedAt >= sample.startedAt, sample.endedAt <= retrievedAt,
                  identifiers.insert(sample.id).inserted else {
                excluded += 1
                continue
            }
            selected.append(sample)
        }
        readings = selected.sorted { $0.endedAt > $1.endedAt }
        excludedCount = excluded
    }
}

@MainActor
protocol HeartRateReadingService: AnyObject {
    var available: Bool { get }
    func requestReadAccess() async throws
    func read(since: Date, until: Date, limit: Int) async throws -> [HeartRateReading]
}
