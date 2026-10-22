import Foundation
import Observation

@MainActor @Observable
final class HeartRateReviewStore {
    enum Phase: Equatable { case unsupported, idle, requesting, reading, empty, ready, failed }
    private(set) var phase: Phase
    private(set) var review: HeartRateReview?
    // A completed authorization flow does not reveal whether reading was permitted.
    private(set) var authorizationFlowCompleted = false
    @ObservationIgnored private let service: any HeartRateReadingService
    @ObservationIgnored private let now: () -> Date
    @ObservationIgnored private var generation = 0
    @ObservationIgnored private var task: Task<Void, Never>?

    init(service: any HeartRateReadingService, now: @escaping () -> Date = Date.init) {
        self.service = service
        self.now = now
        phase = service.available ? .idle : .unsupported
    }
    var busy: Bool { phase == .requesting || phase == .reading }

    func begin() {
        guard service.available, !busy else { return }
        let call = generation
        review = nil
        phase = authorizationFlowCompleted ? .reading : .requesting
        task = Task { [weak self] in
            guard let self else { return }
            do {
                if !authorizationFlowCompleted {
                    try await service.requestReadAccess()
                    guard call == generation, !Task.isCancelled else { return }
                    authorizationFlowCompleted = true
                }
                phase = .reading
                let date = now()
                let records = try await service.read(since: date.addingTimeInterval(-HeartRateReview.window),
                                                     until: date, limit: HeartRateReview.maximumSamples)
                guard call == generation, !Task.isCancelled else { return }
                let result = HeartRateReview(samples: records, retrievedAt: date)
                review = result
                phase = result.readings.isEmpty ? .empty : .ready
            } catch {
                guard call == generation, !Task.isCancelled else { return }
                review = nil
                phase = .failed
            }
        }
    }

    func clear() {
        generation += 1
        task?.cancel()
        task = nil
        review = nil
        authorizationFlowCompleted = false
        phase = service.available ? .idle : .unsupported
    }
}
