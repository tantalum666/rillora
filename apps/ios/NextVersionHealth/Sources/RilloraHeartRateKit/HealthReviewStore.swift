import Foundation
import Observation

@MainActor @Observable
final class HealthReviewStore {
    enum Phase: Equatable { case unsupported, idle, requesting, reading, ready, failed }
    private(set) var phase: Phase
    private(set) var readings: [HealthMetricReading] = []
    private(set) var window: HealthWindow?
    private(set) var requested: Set<HealthMetric> = []
    var selected = HealthMetric.initial
    @ObservationIgnored private let service: any HealthReadingService
    @ObservationIgnored private let now: () -> Date
    @ObservationIgnored private var generation = 0
    @ObservationIgnored private var task: Task<Void, Never>?
    init(service: any HealthReadingService, now: @escaping () -> Date = Date.init) {
        self.service = service; self.now = now; phase = service.available ? .idle : .unsupported
    }
    var busy: Bool { phase == .requesting || phase == .reading }
    func begin() {
        guard service.available, !busy, !selected.isEmpty else { return }
        let call = generation, selection = selected, range = HealthWindow(now: now())
        readings = []; window = nil; phase = selection.isSubset(of: requested) ? .reading : .requesting
        task = Task { [weak self] in
            guard let self else { return }
            do {
                if !selection.isSubset(of: requested) {
                    try await service.requestReadAccess(selection)
                    guard call == generation, !Task.isCancelled else { return }
                    requested.formUnion(selection)
                }
                phase = .reading
                var result: [HealthMetricReading] = []
                for metric in HealthMetric.allCases where selection.contains(metric) {
                    do { result.append(try await service.read(metric, window: range)) }
                    catch { result.append(.failed(metric)) }
                    guard call == generation, !Task.isCancelled else { return }
                }
                readings = result; window = range; phase = .ready
            } catch {
                guard call == generation, !Task.isCancelled else { return }
                readings = []; window = nil; phase = .failed
            }
        }
    }
    func clear() {
        generation += 1; task?.cancel(); task = nil; readings = []; window = nil; requested = []
        phase = service.available ? .idle : .unsupported
    }
}
