import Foundation
import Observation

@MainActor @Observable
final class FamilyMaintenanceStore {
    let service: any FamilyMaintenanceServing
    private(set) var data: FamilyMaintenanceOverview?
    private(set) var isLoading = false
    private(set) var isWorking = false
    private(set) var requiresAuthentication = false
    var errorMessage: String?
    private var generation = 0
    init(service: any FamilyMaintenanceServing) { self.service = service }
    @discardableResult func reload() async -> Bool {
        generation += 1; let current = generation; isLoading = true
        defer { if current == generation { isLoading = false } }
        do {
            let result = try await service.fetchFamilyMaintenance()
            guard current == generation, !Task.isCancelled else { return false }
            guard result.isValid else { throw RilloraAPIError.invalidPayload("The review response exceeded its scope.") }
            data = result; errorMessage = nil; requiresAuthentication = false; return true
        } catch {
            guard current == generation, !Task.isCancelled else { return false }
            if (error as? RilloraAPIError)?.isAuthenticationRequired == true { data = nil; requiresAuthentication = true }
            errorMessage = error.localizedDescription; return false
        }
    }
    func perform(_ operation: () async throws -> Void) async -> Bool {
        guard !isWorking else { return false }; isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            try await operation()
            if !(await reload()) { errorMessage = "Saved. Reload to see the latest review." }
            return true
        } catch {
            if (error as? RilloraAPIError)?.isAuthenticationRequired == true { data = nil; requiresAuthentication = true }
            errorMessage = error.localizedDescription; return false
        }
    }
}
