import Foundation
import Observation

@MainActor @Observable
final class ContactSharingStore {
    let contact: TrustedContact
    private let service: any SharingServing
    private(set) var connection: SharingConnection?
    private(set) var allowance: SharingAllowance?
    private var connections: [SharingConnection] = []
    var replacement: SharingConnection? {
        guard !isActive, let allowance, allowance.enforcementEnabled, allowance.limit == 1, allowance.used >= 1 else { return nil }
        return connections.first { $0.publicId == allowance.freeConnectionPublicId }
    }
    private(set) var isWorking = false
    private(set) var hasLoaded = false
    private(set) var invitationURL: URL?
    var errorMessage: String?
    var email = ""
    var grants: [SharingGrant] = []

    init(contact: TrustedContact, service: any SharingServing) { self.contact = contact; self.service = service }
    var isConnected: Bool { connection?.status == .accepted }
    var isActive: Bool { connection?.isActive == true }
    var emailIsValid: Bool { email.trimmingCharacters(in: .whitespacesAndNewlines).range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", options: .regularExpression) != nil && email.count <= 254 }
    var hasChanges: Bool {
        let original = isActive ? connection?.grants ?? [] : []
        return Dictionary(uniqueKeysWithValues: grants.map { ($0.matterPublicId, $0.detailLevel) })
            != Dictionary(uniqueKeysWithValues: original.map { ($0.matterPublicId, $0.detailLevel) })
            || !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    var canSave: Bool { hasLoaded && !isWorking && (isActive ? hasChanges && (email.isEmpty || emailIsValid) : emailIsValid) }
    func selected(_ id: String) -> Bool { grants.contains { $0.matterPublicId == id } }
    func level(_ id: String) -> SharingDetailLevel { grants.first { $0.matterPublicId == id }?.detailLevel ?? .name }
    func setSelected(_ id: String, _ selected: Bool) {
        grants.removeAll { $0.matterPublicId == id }
        if selected { grants.append(SharingGrant(matterPublicId: id, detailLevel: .name)) }
    }
    func setLevel(_ id: String, _ level: SharingDetailLevel) {
        if let index = grants.firstIndex(where: { $0.matterPublicId == id }) { grants[index].detailLevel = level }
    }
    func load() async {
        guard !isWorking else { return }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            async let currentAllowance = service.fetchSharingAllowance()
            connections = try await service.fetchSharingConnections()
            let latest = connections.first { $0.personPublicId == contact.publicId }
            allowance = try await currentAllowance
            if let previous = connection, previous.version != latest?.version { invitationURL = nil }
            connection = latest
            grants = isActive ? connection?.grants ?? [] : []; email = ""; hasLoaded = true
            if isConnected || !isActive || latest?.status == .expired || latest?.access?.mode == .paused { invitationURL = nil }
        } catch { errorMessage = error.localizedDescription }
    }
    @discardableResult func selectLive(useFreeSlot: Bool) async -> Bool {
        guard !isWorking, !hasChanges, let connection, let allowance else { return false }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            apply(try await service.selectSharingLive(publicID: connection.publicId,
                request: SharingLiveRequest(expectedVersion: connection.version, expectedAccessVersion: allowance.version, useFreeSlot: useFreeSlot)))
            return true
        } catch { errorMessage = error.localizedDescription; return false }
    }
    @discardableResult func save(replacingIncluded: Bool = false) async -> Bool {
        guard canSave else { return false }
        guard replacement == nil || replacingIncluded else { return false }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            let result: SharingMutation
            let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
            if let connection, connection.isActive {
                if !cleanEmail.isEmpty && connection.status != .accepted {
                    result = try await service.regenerateSharingLink(publicID: connection.publicId,
                        request: SharingLinkRequest(expectedVersion: connection.version, email: cleanEmail, grants: grants))
                } else {
                    result = try await service.updateSharingConnection(publicID: connection.publicId,
                        request: SharingUpdateRequest(expectedVersion: connection.version, grants: grants))
                }
            } else {
                var request = SharingCreateRequest(personPublicId: contact.publicId, email: cleanEmail, grants: grants)
                if let replacement, let allowance, replacingIncluded {
                    request.replaceConnection = SharingReplacement(publicId: replacement.publicId, expectedVersion: replacement.version, expectedAccessVersion: allowance.version)
                }
                result = try await service.createSharingConnection(request: request)
            }
            apply(result); return true
        } catch { errorMessage = error.localizedDescription; return false }
    }
    @discardableResult func pauseUpdates() async -> Bool {
        guard !isWorking, !hasChanges, let connection, let allowance else { return false }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            apply(try await service.pauseSharingLive(publicID: connection.publicId,
                request: SharingPauseRequest(expectedVersion: connection.version, expectedAccessVersion: allowance.version)))
            return true
        } catch { errorMessage = error.localizedDescription; return false }
    }
    @discardableResult func regenerate() async -> Bool {
        guard !isWorking, let connection, connection.status == .pending || connection.status == .expired else { return false }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            apply(try await service.regenerateSharingLink(publicID: connection.publicId,
                request: SharingLinkRequest(expectedVersion: connection.version, email: nil, grants: grants)))
            return true
        } catch { errorMessage = error.localizedDescription; return false }
    }
    @discardableResult func revoke() async -> Bool {
        guard !isWorking, let connection, connection.isActive else { return false }
        isWorking = true; errorMessage = nil
        defer { isWorking = false }
        do {
            apply(try await service.revokeSharingConnection(publicID: connection.publicId, expectedVersion: connection.version))
            grants = []; invitationURL = nil; return true
        } catch { errorMessage = error.localizedDescription; return false }
    }
    private func apply(_ result: SharingMutation) {
        if let access = result.access { allowance = access }
        connection = result.connection; grants = result.connection.grants; email = ""
        if let value = result.invitationUrl { invitationURL = URL(string: value) }
        if [.accepted, .revoked, .expired].contains(result.connection.status) || result.connection.access?.mode == .paused { invitationURL = nil }
    }
}
