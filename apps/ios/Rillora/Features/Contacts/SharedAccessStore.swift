import Foundation
import Observation

@MainActor @Observable
final class SharedAccessStore {
    private let service: any SharingServing
    private var generation = 0
    private(set) var data: SharedWithMeEnvelope?
    private(set) var error: String?
    private(set) var isLoading = false
    private(set) var hasLoaded = false

    init(service: any SharingServing) { self.service = service }

    func suspend() {
        generation += 1
        data = nil; error = nil; isLoading = false; hasLoaded = false
    }

    func refresh(keepingVisible: Bool = false) async {
        guard !isLoading else { return }
        generation += 1
        let request = generation
        if !keepingVisible { data = nil; hasLoaded = false }
        error = nil; isLoading = true
        do {
            let current = try await service.fetchSharedWithMe()
            guard request == generation else { return }
            if Task.isCancelled { isLoading = false; return }
            guard current.isValid else { throw RilloraAPIError.invalidPayload("Shared information could not be verified.") }
            data = current
        } catch {
            guard request == generation else { return }
            data = nil
            self.error = error.localizedDescription
        }
        guard request == generation else { return }
        hasLoaded = true; isLoading = false
    }
}
