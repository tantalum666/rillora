import Foundation
import Observation

@MainActor @Observable
final class ContactSharingStore {
    let contact: TrustedContact
    private let service: any SharingServing
    private(set) var connection: SharingConnection?
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
            let latest = try await service.fetchSharingConnections().first { $0.personPublicId == contact.publicId }
            if let previous = connection, previous.version != latest?.version { invitationURL = nil }
            connection = latest
            grants = isActive ? connection?.grants ?? [] : []; email = ""; hasLoaded = true
            if isConnected || !isActive { invitationURL = nil }
        } catch { errorMessage = error.localizedDescription }
    }
    @discardableResult func save() async -> Bool {
        guard canSave else { return false }
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
                result = try await service.createSharingConnection(request: SharingCreateRequest(personPublicId: contact.publicId, email: cleanEmail, grants: grants))
            }
            apply(result); return true
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
        connection = result.connection; grants = result.connection.grants; email = ""
        if let value = result.invitationUrl { invitationURL = URL(string: value) }
        if result.connection.status == .accepted || result.connection.status == .revoked { invitationURL = nil }
    }
}
