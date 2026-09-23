import Foundation

protocol OverviewServing: Sendable {
    func hasLocalSession() async throws -> Bool
    func fetchOverview() async throws -> OverviewSnapshot
}

protocol CommerceServing: Sendable {
    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus
    func resolvePurchaseRoute(
        request: CommercePurchaseRouteRequest
    ) async throws -> CommercePurchaseRouteResponse
    func submitStoreKitSandboxTransaction(
        request: StoreKitSandboxTransactionRequest
    ) async throws -> StoreKitSandboxTransactionResponse
}

extension CommerceServing {
    func submitStoreKitSandboxTransaction(
        request: StoreKitSandboxTransactionRequest
    ) async throws -> StoreKitSandboxTransactionResponse {
        throw RilloraAPIError.requestFailed(
            "StoreKit Sandbox server verification is unavailable."
        )
    }
}

extension OverviewServing {
    func hasLocalSession() async throws -> Bool { true }
}

protocol PlanEditing: Sendable {
    func fetchPlan() async throws -> Plan
    func updatePlan(request: PlanUpdateRequest) async throws -> Plan
}

protocol MatterEditing: Sendable {
    func fetchCreatedMatter(requestID: String) async throws -> Matter?
    func fetchMatter(publicID: String) async throws -> Matter
    func createMatter(request: MatterCreateRequest) async throws -> Matter
    func updateMatter(publicID: String, request: MatterUpdateRequest) async throws -> Matter
    func archiveMatter(publicID: String, expectedVersion: Int) async throws
}

extension MatterEditing {
    func fetchCreatedMatter(requestID: String) async throws -> Matter? { nil }
}

protocol TrustedContactEditing: Sendable {
    func fetchTrustedContacts() async throws -> [TrustedContact]
    func createTrustedContact(request: TrustedContactCreateRequest) async throws -> TrustedContact
    func updateTrustedContact(
        publicID: String,
        request: TrustedContactUpdateRequest
    ) async throws -> TrustedContact
}

protocol OfficialSetupEditing: Sendable {
    func fetchOfficialSetupChecks() async throws -> [OfficialSetupCheck]
    func updateOfficialSetupCheck(
        publicID: String,
        request: OfficialSetupCheckUpdateRequest
    ) async throws -> OfficialSetupCheck
}

protocol SimulationRunning: Sendable {
    func runSimulation(request: ClaimSimulationCreateRequest) async throws -> ClaimSimulation
}

protocol DisclosureRehearsing: Sendable {
    func createDisclosureRehearsal(
        request: DisclosureRehearsalCreateRequest
    ) async throws -> DisclosureRehearsal
    func updateDisclosureRehearsal(
        publicID: String,
        request: DisclosureRehearsalActionRequest
    ) async throws -> DisclosureRehearsal
}

protocol RoleAssignmentEditing: Sendable {
    func fetchRoleAssignments() async throws -> [RoleAssignment]
    func createRoleAssignment(
        request: RoleAssignmentCreateRequest
    ) async throws -> RoleAssignmentMutationResult
    func updateRoleAssignment(
        publicID: String,
        request: RoleAssignmentUpdateRequest
    ) async throws -> RoleAssignmentMutationResult
    func revokeRoleAssignment(
        publicID: String,
        expectedVersion: Int
    ) async throws -> RoleAssignmentMutationResult
}

protocol StartHerePreviewing: Sendable {
    func previewStartHere() async throws -> StartHerePreview
    func previewStartHere(recipientConnectionPublicID: String?) async throws -> StartHerePreview
    func exportRecipients() async throws -> [SharingConnection]
    func createPrintableStartHere(previewPublicID: String) async throws -> StartHerePrintableArtifact
    func prepareEncryptedStartHere(
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation
    func finalizeEncryptedStartHere(
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws -> EncryptedStartHereFinalizedRecord
    func recipientRehearsalContacts() async throws -> [TrustedContact]
    func createRecipientRehearsal(personPublicID: String) async throws -> RecipientRehearsalCreateEnvelope
    func acceptRecipientRehearsal(acceptanceToken: String) async throws -> RecipientRehearsalAcceptEnvelope
    func enrollRecipientDeviceKey(
        sessionToken: String,
        request: RecipientDeviceKeyCreateRequest
    ) async throws -> RecipientDeviceKeyRecord
    func prepareRecipientRehearsalPackage(
        rehearsalPublicID: String,
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation
    func finalizeRecipientRehearsalPackage(
        rehearsalPublicID: String,
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws
    func fetchRecipientRehearsalPackage(
        sessionToken: String,
        packagePublicID: String
    ) async throws -> RecipientEncryptedStartHereArtifact
    func revokeRecipientDeviceKey(sessionToken: String, keyPublicID: String) async throws
    func revokeRecipientRehearsal(publicID: String) async throws
}

extension StartHerePreviewing {
    func previewStartHere(recipientConnectionPublicID: String?) async throws -> StartHerePreview {
        guard recipientConnectionPublicID == nil else { throw RilloraAPIError.requestFailed("Recipient exports are unavailable.") }
        return try await previewStartHere()
    }
    func exportRecipients() async throws -> [SharingConnection] { [] }
    func recipientRehearsalContacts() async throws -> [TrustedContact] {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func createRecipientRehearsal(personPublicID: String) async throws -> RecipientRehearsalCreateEnvelope {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func acceptRecipientRehearsal(acceptanceToken: String) async throws -> RecipientRehearsalAcceptEnvelope {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func enrollRecipientDeviceKey(
        sessionToken: String,
        request: RecipientDeviceKeyCreateRequest
    ) async throws -> RecipientDeviceKeyRecord {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func prepareRecipientRehearsalPackage(
        rehearsalPublicID: String,
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func finalizeRecipientRehearsalPackage(
        rehearsalPublicID: String,
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func fetchRecipientRehearsalPackage(
        sessionToken: String,
        packagePublicID: String
    ) async throws -> RecipientEncryptedStartHereArtifact {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func revokeRecipientDeviceKey(sessionToken: String, keyPublicID: String) async throws {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func revokeRecipientRehearsal(publicID: String) async throws {
        throw RilloraAPIError.requestFailed("Synthetic recipient rehearsal is unavailable.")
    }

    func prepareEncryptedStartHere(
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        throw RilloraAPIError.requestFailed("Encrypted Start Here is unavailable.")
    }

    func finalizeEncryptedStartHere(
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws -> EncryptedStartHereFinalizedRecord {
        throw RilloraAPIError.requestFailed("Encrypted Start Here is unavailable.")
    }
}

actor APIClient: OverviewServing, PlanEditing, MatterEditing, TrustedContactEditing, OfficialSetupEditing, SimulationRunning, DisclosureRehearsing, RoleAssignmentEditing, StartHerePreviewing, CommerceServing, SharingServing, FamilyMaintenanceServing, AccountDataServing {
    private let configuration: APIConfiguration
    private let transport: any HTTPTransport
    private let sessionTokenStore: (any SessionTokenStore)?
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(
        configuration: APIConfiguration,
        transport: any HTTPTransport = URLSessionTransport.live(),
        sessionTokenStore: (any SessionTokenStore)? = nil
    ) {
        self.configuration = configuration
        self.transport = transport
        self.sessionTokenStore = sessionTokenStore
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    func hasLocalSession() async throws -> Bool {
        if configuration.developmentPlannerID != nil { return true }
        return try await sessionTokenStore?.read() != nil
    }

    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        var query = URLComponents()
        query.queryItems = [URLQueryItem(name: "serviceMarketCode", value: serviceMarketCode)]
        guard let encodedQuery = query.percentEncodedQuery else {
            throw RilloraAPIError.invalidResponse
        }
        let status: CommerceStatus = try await get("commerce/status?\(encodedQuery)")
        guard status.contractVersion == "commerce-v1",
              status.boundaries.preservesSafetyBoundary,
              status.offers.allSatisfy({
                  $0.amountMinor > 0 && (0...3).contains($0.minorUnitExponent)
              }) else {
            throw RilloraAPIError.invalidPayload(
                "The commercial status did not preserve the server-authoritative safety boundary."
            )
        }
        return status
    }

    func resolvePurchaseRoute(
        request: CommercePurchaseRouteRequest
    ) async throws -> CommercePurchaseRouteResponse {
        let route: CommercePurchaseRouteResponse = try await send(
            path: "commerce/purchase-route",
            method: "POST",
            body: try encoder.encode(request)
        )
        guard route.contractVersion == "commerce-v1",
              route.requiresFreshEvaluation,
              route.boundaries.preservesSafetyBoundary,
              route.purchaseRoute == "none" || route.reason == "available" else {
            throw RilloraAPIError.invalidPayload(
                "The purchase route did not preserve the server-authoritative safety boundary."
            )
        }
        return route
    }

    func submitStoreKitSandboxTransaction(
        request: StoreKitSandboxTransactionRequest
    ) async throws -> StoreKitSandboxTransactionResponse {
        let response: StoreKitSandboxTransactionResponse = try await send(
            path: "commerce/storekit/sandbox/transactions",
            method: "POST",
            body: try encoder.encode(request)
        )
        guard response.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload(
                "The StoreKit Sandbox response exceeded the server-authoritative safety boundary."
            )
        }
        return response
    }

    func fetchOverview() async throws -> OverviewSnapshot {
        try await get("overview")
    }

    func fetchPlan() async throws -> Plan {
        let envelope: PlanEnvelope = try await get("plan")
        return envelope.plan
    }

    func updatePlan(request: PlanUpdateRequest) async throws -> Plan {
        let envelope: PlanEnvelope = try await send(
            path: "plan",
            method: "PATCH",
            body: try encoder.encode(request)
        )
        return envelope.plan
    }

    func fetchMatter(publicID: String) async throws -> Matter {
        let envelope: MatterEnvelope = try await send(
            path: "matters/\(publicID)",
            method: "GET"
        )
        return envelope.matter
    }

    func updateMatter(publicID: String, request: MatterUpdateRequest) async throws -> Matter {
        let envelope: MatterEnvelope = try await send(
            path: "matters/\(publicID)",
            method: "PATCH",
            body: try encoder.encode(request)
        )
        return envelope.matter
    }

    func createMatter(request: MatterCreateRequest) async throws -> Matter {
        let envelope: MatterEnvelope = try await send(
            path: "matters",
            method: "POST",
            body: try encoder.encode(request)
        )
        return envelope.matter
    }

    func fetchCreatedMatter(requestID: String) async throws -> Matter? {
        let envelope: MatterEnvelope = try await send(path: "matters/creation/\(requestID)", method: "GET")
        return envelope.matter
    }

    func archiveMatter(publicID: String, expectedVersion: Int) async throws {
        let result = try await perform(
            path: "matters/\(publicID)",
            method: "DELETE",
            additionalHeaders: ["If-Match": String(expectedVersion)]
        )
        guard result.response.statusCode == 204 else {
            throw decodeServerError(from: result)
        }
    }

    func fetchTrustedContacts() async throws -> [TrustedContact] {
        let envelope: TrustedContactsEnvelope = try await get("trusted-contacts")
        return envelope.trustedContacts
    }

    func createTrustedContact(
        request: TrustedContactCreateRequest
    ) async throws -> TrustedContact {
        let envelope: TrustedContactEnvelope = try await send(
            path: "trusted-contacts",
            method: "POST",
            body: try encoder.encode(request)
        )
        return envelope.trustedContact
    }

    func updateTrustedContact(
        publicID: String,
        request: TrustedContactUpdateRequest
    ) async throws -> TrustedContact {
        let envelope: TrustedContactEnvelope = try await send(
            path: "trusted-contacts/\(publicID)",
            method: "PATCH",
            body: try encoder.encode(request)
        )
        return envelope.trustedContact
    }

    func fetchOfficialSetupChecks() async throws -> [OfficialSetupCheck] {
        let envelope: OfficialSetupChecksEnvelope = try await get("official-setup-checks")
        return envelope.officialSetupChecks
    }

    func updateOfficialSetupCheck(
        publicID: String,
        request: OfficialSetupCheckUpdateRequest
    ) async throws -> OfficialSetupCheck {
        let envelope: OfficialSetupCheckEnvelope = try await send(
            path: "official-setup-checks/\(publicID)",
            method: "PATCH",
            body: try encoder.encode(request)
        )
        guard envelope.evidence == "self_reported" else {
            throw RilloraAPIError.invalidPayload(
                "Official setup evidence was not marked as self-reported."
            )
        }
        return envelope.officialSetupCheck
    }

    func runSimulation(
        request: ClaimSimulationCreateRequest
    ) async throws -> ClaimSimulation {
        let envelope: ClaimSimulationEnvelope = try await send(
            path: "simulations",
            method: "POST",
            body: try encoder.encode(request)
        )
        let simulation = envelope.simulation
        guard simulation.simulationOnly,
              !simulation.notificationsSent,
              !simulation.dataReleased,
              !simulation.snapshot.operative else {
            throw RilloraAPIError.invalidPayload(
                "The rehearsal response did not preserve the non-operative boundary."
            )
        }
        return simulation
    }

    func createDisclosureRehearsal(
        request: DisclosureRehearsalCreateRequest
    ) async throws -> DisclosureRehearsal {
        let envelope: DisclosureRehearsalEnvelope = try await send(
            path: "disclosure-rehearsals",
            method: "POST",
            body: try encoder.encode(request)
        )
        return try validatedDisclosureRehearsal(envelope)
    }

    func updateDisclosureRehearsal(
        publicID: String,
        request: DisclosureRehearsalActionRequest
    ) async throws -> DisclosureRehearsal {
        let envelope: DisclosureRehearsalEnvelope = try await send(
            path: "disclosure-rehearsals/\(publicID)/actions",
            method: "POST",
            body: try encoder.encode(request)
        )
        return try validatedDisclosureRehearsal(envelope)
    }

    private func validatedDisclosureRehearsal(
        _ envelope: DisclosureRehearsalEnvelope
    ) throws -> DisclosureRehearsal {
        guard envelope.boundaries.preservesSafetyBoundary,
              envelope.disclosureRehearsal.boundaries == envelope.boundaries,
              envelope.disclosureRehearsal.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload(
                "The disclosure rehearsal response did not preserve its simulation-only safety boundary."
            )
        }
        return envelope.disclosureRehearsal
    }

    func fetchRoleAssignments() async throws -> [RoleAssignment] {
        let envelope: RoleAssignmentsEnvelope = try await get("role-assignments")
        guard envelope.boundaries.preservesSafetyBoundary,
              envelope.roleAssignments.allSatisfy(\.preservesSafetyBoundary) else {
            throw RilloraAPIError.invalidPayload(
                "The role policy response exceeded its record-only or no-authority boundary."
            )
        }
        return envelope.roleAssignments
    }

    func createRoleAssignment(
        request: RoleAssignmentCreateRequest
    ) async throws -> RoleAssignmentMutationResult {
        let envelope: RoleAssignmentEnvelope = try await send(
            path: "role-assignments",
            method: "POST",
            body: try encoder.encode(request)
        )
        return try validatedRoleAssignment(envelope)
    }

    func updateRoleAssignment(
        publicID: String,
        request: RoleAssignmentUpdateRequest
    ) async throws -> RoleAssignmentMutationResult {
        let envelope: RoleAssignmentEnvelope = try await send(
            path: "role-assignments/\(publicID)",
            method: "PATCH",
            body: try encoder.encode(request)
        )
        return try validatedRoleAssignment(envelope)
    }

    func revokeRoleAssignment(
        publicID: String,
        expectedVersion: Int
    ) async throws -> RoleAssignmentMutationResult {
        let result = try await perform(
            path: "role-assignments/\(publicID)",
            method: "DELETE",
            additionalHeaders: ["If-Match": String(expectedVersion)]
        )
        guard (200..<300).contains(result.response.statusCode) else {
            throw decodeServerError(from: result)
        }
        let envelope: RoleAssignmentRevokeEnvelope
        do { envelope = try decoder.decode(RoleAssignmentRevokeEnvelope.self, from: result.data) }
        catch { throw RilloraAPIError.invalidPayload(error.localizedDescription) }
        guard envelope.revoked, envelope.boundaries.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload(
                "The role revocation response exceeded its no-authority boundary."
            )
        }
        return RoleAssignmentMutationResult(
            assignment: nil,
            invalidatedDisclosureRehearsalCount: envelope.invalidatedDisclosureRehearsalCount
        )
    }

    private func validatedRoleAssignment(
        _ envelope: RoleAssignmentEnvelope
    ) throws -> RoleAssignmentMutationResult {
        guard envelope.boundaries.preservesSafetyBoundary,
              envelope.roleAssignment.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload(
                "The role policy response exceeded its record-only or no-authority boundary."
            )
        }
        return RoleAssignmentMutationResult(
            assignment: envelope.roleAssignment,
            invalidatedDisclosureRehearsalCount: envelope.invalidatedDisclosureRehearsalCount
        )
    }

    func previewStartHere() async throws -> StartHerePreview {
        try await previewStartHere(recipientConnectionPublicID: nil)
    }

    func exportRecipients() async throws -> [SharingConnection] {
        try await fetchSharingConnections().filter { $0.status == .accepted }
    }

    func previewStartHere(recipientConnectionPublicID: String?) async throws -> StartHerePreview {
        let preview: StartHerePreview = try await send(
            path: "exports/start-here/preview",
            method: "POST",
            body: try encoder.encode(StartHerePreviewRequest(recipientConnectionPublicId: recipientConnectionPublicID))
        )
        guard preview.export.status == "previewed",
              !preview.export.encryptedPackageCreated,
              preview.package.directionsNotPasswords,
              preview.package.legalAuthorityNotGranted else {
            throw RilloraAPIError.invalidPayload(
                "The Start Here response exceeded the safe preview boundary."
            )
        }
        if let recipientConnectionPublicID,
           preview.package.audience?.connectionPublicId != recipientConnectionPublicID {
            throw RilloraAPIError.invalidPayload("The preview did not match the selected person.")
        }
        return preview
    }

    func createPrintableStartHere(
        previewPublicID: String
    ) async throws -> StartHerePrintableArtifact {
        let request = StartHerePrintableRequest(
            previewPublicId: previewPublicID,
            acknowledgesPlaintext: true,
            acknowledgesNoRevocation: true
        )
        let result = try await perform(
            path: "exports/start-here/printable",
            method: "POST",
            body: try encoder.encode(request),
            additionalHeaders: ["Accept": "text/plain"]
        )
        guard (200..<300).contains(result.response.statusCode) else {
            throw decodeServerError(from: result)
        }

        let contentType = result.response.value(forHTTPHeaderField: "Content-Type") ?? ""
        let exportPublicID = result.response.value(forHTTPHeaderField: "x-rillora-export-id") ?? ""
        let serverCopyRetained = result.response.value(
            forHTTPHeaderField: "x-rillora-server-copy-retained"
        )
        let disposition = result.response.value(forHTTPHeaderField: "Content-Disposition") ?? ""
        let prefix = "attachment; filename=\""
        let suffix = "\""
        guard contentType.lowercased().hasPrefix("text/plain"),
              UUID(uuidString: exportPublicID) != nil,
              serverCopyRetained == "false",
              disposition.hasPrefix(prefix),
              disposition.hasSuffix(suffix) else {
            throw RilloraAPIError.invalidPayload(
                "The printable guide response did not preserve its safety boundary."
            )
        }
        let filename = String(disposition.dropFirst(prefix.count).dropLast(suffix.count))
        guard filename.range(
            of: #"^rillora-start-here-\d{4}-\d{2}-\d{2}\.txt$"#,
            options: .regularExpression
        ) != nil,
              let text = String(data: result.data, encoding: .utf8),
              text.hasPrefix("RILLORA — START HERE\n"),
              text.contains("Rillora cannot revoke that copy") else {
            throw RilloraAPIError.invalidPayload(
                "The printable guide content did not preserve its safety boundary."
            )
        }

        return StartHerePrintableArtifact(
            exportPublicId: exportPublicID,
            filename: filename,
            data: result.data,
            serverCopyRetained: false
        )
    }

    func prepareEncryptedStartHere(
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        let preparation: EncryptedStartHerePreparation = try await send(
            path: "exports/start-here/encrypted/prepare",
            method: "POST",
            body: try encoder.encode(EncryptedStartHerePrepareRequest(
                previewPublicId: previewPublicID
            ))
        )
        guard preparation.package.previewPublicId == previewPublicID,
              preparation.package.status == "generating",
              preparation.package.cryptoVersion == "rillora-hpke-v1",
              preparation.package.contentEncryption == "AES-256-GCM",
              preparation.package.keyWrapping == "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
              !preparation.package.serverCanDecrypt,
              !preparation.package.recipientDeliveryPerformed else {
            throw RilloraAPIError.invalidPayload(
                "The encrypted-package preparation exceeded its safety boundary."
            )
        }
        return preparation
    }

    func finalizeEncryptedStartHere(
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws -> EncryptedStartHereFinalizedRecord {
        let envelope: EncryptedStartHereFinalizedEnvelope = try await send(
            path: "exports/start-here/encrypted/\(packagePublicID)/finalize",
            method: "POST",
            body: try encoder.encode(request)
        )
        let finalized = envelope.encryptedPackage
        guard finalized.publicId == packagePublicID,
              finalized.status == "ready",
              finalized.cryptoVersion == "rillora-hpke-v1",
              finalized.offlineRecoveryEnvelopeCreated,
              !finalized.offlineRecoveryPrivateKeyReceivedByServer,
              !finalized.recipientDeliveryPerformed,
              !finalized.serverCanDecrypt,
              !finalized.externalCopiesRevocable else {
            throw RilloraAPIError.invalidPayload(
                "The encrypted package response exceeded its safety boundary."
            )
        }
        return finalized
    }

    func recipientRehearsalContacts() async throws -> [TrustedContact] {
        try await fetchTrustedContacts().filter { !$0.isRevoked }
    }

    func createRecipientRehearsal(
        personPublicID: String
    ) async throws -> RecipientRehearsalCreateEnvelope {
        let envelope: RecipientRehearsalCreateEnvelope = try await send(
            path: "recipient-rehearsals",
            method: "POST",
            body: try encoder.encode(RecipientRehearsalCreateRequest(
                personPublicId: personPublicID
            ))
        )
        guard envelope.recipientRehearsal.status == "pending",
              envelope.recipientRehearsal.simulationOnly == true,
              envelope.boundaries.preservesSafetyBoundary,
              envelope.acceptanceToken.count == 43 else {
            throw RilloraAPIError.invalidPayload("The synthetic rehearsal boundary was not preserved.")
        }
        return envelope
    }

    func acceptRecipientRehearsal(
        acceptanceToken: String
    ) async throws -> RecipientRehearsalAcceptEnvelope {
        let envelope: RecipientRehearsalAcceptEnvelope = try await sendPublicRequest(
            path: "recipient-rehearsals/accept",
            method: "POST",
            body: try encoder.encode(RecipientRehearsalAcceptRequest(
                acceptanceToken: acceptanceToken
            )),
            authentication: .unauthenticated
        )
        guard envelope.recipientRehearsal.status == "accepted",
              envelope.boundaries.preservesSafetyBoundary,
              envelope.sessionToken.count == 43 else {
            throw RilloraAPIError.invalidPayload("The synthetic acceptance boundary was not preserved.")
        }
        return envelope
    }

    func enrollRecipientDeviceKey(
        sessionToken: String,
        request: RecipientDeviceKeyCreateRequest
    ) async throws -> RecipientDeviceKeyRecord {
        let envelope: RecipientDeviceKeyEnvelope = try await sendPublicRequest(
            path: "recipient-rehearsals/device-keys",
            method: "POST",
            body: try encoder.encode(request),
            authentication: .rehearsal(sessionToken)
        )
        guard envelope.deviceKey.status == "active",
              envelope.deviceKey.simulationOnly,
              envelope.boundaries.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload("The synthetic device-key boundary was not preserved.")
        }
        return envelope.deviceKey
    }

    func prepareRecipientRehearsalPackage(
        rehearsalPublicID: String,
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        let preparation: EncryptedStartHerePreparation = try await send(
            path: "recipient-rehearsals/\(rehearsalPublicID)/packages/prepare",
            method: "POST",
            body: try encoder.encode(EncryptedStartHerePrepareRequest(
                previewPublicId: previewPublicID
            ))
        )
        guard preparation.package.previewPublicId == previewPublicID,
              preparation.package.simulationOnly == true,
              preparation.package.releasePerformed == false,
              !preparation.package.serverCanDecrypt,
              !preparation.package.recipientDeliveryPerformed,
              !preparation.eligibleRecipientKeys.isEmpty else {
            throw RilloraAPIError.invalidPayload("The synthetic encryption preparation was invalid.")
        }
        return preparation
    }

    func finalizeRecipientRehearsalPackage(
        rehearsalPublicID: String,
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws {
        var rehearsalRequest = request
        rehearsalRequest.acknowledgesSyntheticRehearsalOnly = true
        let envelope: RecipientRehearsalFinalizedEnvelope = try await send(
            path: "recipient-rehearsals/\(rehearsalPublicID)/packages/\(packagePublicID)/finalize",
            method: "POST",
            body: try encoder.encode(rehearsalRequest)
        )
        guard envelope.encryptedPackage.publicId == packagePublicID,
              envelope.encryptedPackage.status == "ready",
              envelope.encryptedPackage.simulationOnly,
              !envelope.encryptedPackage.releasePerformed,
              !envelope.encryptedPackage.serverCanDecrypt,
              envelope.boundaries.preservesSafetyBoundary else {
            throw RilloraAPIError.invalidPayload("The finalized rehearsal exceeded its safety boundary.")
        }
    }

    func fetchRecipientRehearsalPackage(
        sessionToken: String,
        packagePublicID: String
    ) async throws -> RecipientEncryptedStartHereArtifact {
        let artifact: RecipientEncryptedStartHereArtifact = try await sendPublicRequest(
            path: "recipient-rehearsals/packages/\(packagePublicID)",
            method: "GET",
            authentication: .rehearsal(sessionToken)
        )
        guard artifact.packagePublicId == packagePublicID,
              artifact.boundaries.preservesSafetyBoundary,
              !artifact.recipients.isEmpty else {
            throw RilloraAPIError.invalidPayload("The recipient-only artifact boundary was not preserved.")
        }
        return artifact
    }

    func revokeRecipientDeviceKey(sessionToken: String, keyPublicID: String) async throws {
        let result = try await perform(
            path: "recipient-rehearsals/device-keys/\(keyPublicID)",
            method: "DELETE",
            baseURL: publicAPIBaseURL,
            authentication: .rehearsal(sessionToken)
        )
        guard result.response.statusCode == 204 else { throw decodeServerError(from: result) }
    }

    func revokeRecipientRehearsal(publicID: String) async throws {
        let result = try await perform(
            path: "recipient-rehearsals/\(publicID)",
            method: "DELETE"
        )
        guard result.response.statusCode == 204 else { throw decodeServerError(from: result) }
    }

    func fetchSharingConnections() async throws -> [SharingConnection] {
        let result: SharingConnectionsEnvelope = try await get("sharing/connections")
        guard result.connections.allSatisfy(\.isValid) else { throw RilloraAPIError.invalidPayload("Sharing permissions could not be verified.") }
        return result.connections
    }
    func fetchSharingAllowance() async throws -> SharingAllowance? {
        let result: SharingAllowanceEnvelope
        do { result = try await get("sharing/access") }
        catch RilloraAPIError.server(status: 404, code: "not_found", message: _, requestID: _) {
            // A rolling deployment may still serve the previous API. The
            // server remains the authority; only the new controls are absent.
            return nil
        }
        guard (1...5).contains(result.access.limit), result.access.used >= 0, result.access.version >= 0 else {
            throw RilloraAPIError.invalidPayload("Sharing availability could not be verified.")
        }
        return result.access
    }
    func selectSharingLive(publicID: String, request: SharingLiveRequest) async throws -> SharingMutation {
        try validateSharing(await send(path: "sharing/connections/\(publicID)/live", method: "POST", body: encoder.encode(request)))
    }
    func pauseSharingLive(publicID: String, request: SharingPauseRequest) async throws -> SharingMutation {
        try validateSharing(await send(path: "sharing/connections/\(publicID)/pause", method: "POST", body: encoder.encode(request)))
    }
    private func validateSharing(_ result: SharingMutation) throws -> SharingMutation {
        guard result.connection.isValid else { throw RilloraAPIError.invalidPayload("Sharing permissions could not be verified.") }
        if let link = result.invitationUrl {
            guard ReceivedInvitation.token(from: link) != nil, let url = URL(string: link), ["https", "http"].contains(url.scheme ?? "") else { throw RilloraAPIError.invalidPayload("The invitation link is invalid.") }
        }
        return result
    }
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation {
        try validateSharing(await send(path: "sharing/connections", method: "POST", body: encoder.encode(request)))
    }
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation {
        try validateSharing(await send(path: "sharing/connections/\(publicID)", method: "PATCH", body: encoder.encode(request)))
    }
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation {
        try validateSharing(await send(path: "sharing/connections/\(publicID)/link", method: "POST", body: encoder.encode(request)))
    }
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation {
        let response = try await perform(path: "sharing/connections/\(publicID)", method: "DELETE", additionalHeaders: ["If-Match": String(expectedVersion)])
        guard response.response.statusCode == 200 else { throw decodeServerError(from: response) }
        return try validateSharing(decoder.decode(SharingMutation.self, from: response.data))
    }
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation {
        let result: SharingInvitationEnvelope = try await sendPublicRequest(path: "sharing/invitations/resolve", method: "POST", body: encoder.encode(SharingInvitationRequest(invitationToken: token)), authentication: .unauthenticated)
        guard UUID(uuidString: result.invitation.publicId) != nil else { throw RilloraAPIError.invalidPayload("The invitation could not be verified.") }
        return result.invitation
    }
    func acceptSharingInvitation(token: String) async throws -> String {
        let result: SharingAcceptanceEnvelope = try await send(path: "sharing/invitations/accept", method: "POST", body: encoder.encode(SharingAcceptRequest(invitationToken: token)))
        guard result.readOnly, result.purpose == "planner_directed", result.connection.status == .accepted else { throw RilloraAPIError.invalidPayload("Invitation acceptance could not be verified.") }
        return result.connection.publicId
    }
    func checkEmailVerification() async throws -> Bool {
        struct Result: Decodable { let verified: Bool }
        let result: Result = try await send(path: "sharing/email-verification", method: "POST", body: Data("{}".utf8))
        return result.verified
    }
    func previewSharing(grants: [SharingGrant]) async throws -> SharingPreview {
        try await previewSharing(grants: grants, connectionPublicID: nil)
    }
    func previewSharing(grants: [SharingGrant], connectionPublicID: String?) async throws -> SharingPreview {
        let result: SharingPreview = try await send(path: "sharing/preview", method: "POST", body: encoder.encode(SharingPreviewRequest(grants: grants, connectionPublicId: connectionPublicID)))
        guard result.matches(grants) else { throw RilloraAPIError.invalidPayload("The preview exceeded its selected scope.") }
        return result
    }
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope {
        let result: SharedWithMeEnvelope = try await get("sharing/shared-with-me")
        guard result.isValid else { throw RilloraAPIError.invalidPayload("Shared information exceeded its allowed detail level.") }
        return result
    }

    private func get<Response: Decodable & Sendable>(_ path: String) async throws -> Response {
        try await send(path: path, method: "GET")
    }

    func fetchAccountDataProfile() async throws -> AccountDataProfile { try await get("account/profile") }
    func requestAccountDeletion(receipt: String, acknowledgesBilling: Bool) async throws -> AccountDeletionEnvelope {
        let body = try JSONSerialization.data(withJSONObject: ["confirmation": "DELETE", "receipt": receipt, "acknowledgesSavedCopies": true, "acknowledgesBilling": acknowledgesBilling])
        return try await send(path: "account/delete", method: "POST", body: body)
    }
    func accountDeletionStatus(receipt: String) async throws -> AccountDeletionEnvelope {
        let result = try await perform(path: "account-deletions/status", method: "GET", additionalHeaders: ["Authorization": "Deletion-Receipt \(receipt)"], baseURL: publicAPIBaseURL, authentication: .unauthenticated)
        guard (200..<300).contains(result.response.statusCode) else { throw decodeServerError(from: result) }
        return try decoder.decode(AccountDeletionEnvelope.self, from: result.data)
    }
    func exportMapBackup() async throws -> Data {
        let body = try JSONSerialization.data(withJSONObject: ["acknowledgesPrivateCopy": true])
        let result = try await perform(path: "account/map/export", method: "POST", body: body)
        guard (200..<300).contains(result.response.statusCode) else { throw decodeServerError(from: result) }
        guard result.response.value(forHTTPHeaderField: "x-rillora-server-copy-retained") == "false",
              case .backup = try SavedCopyContent.read(data: result.data, filename: "backup.json") else {
            throw RilloraAPIError.invalidPayload("The backup did not preserve its data boundary.")
        }
        return result.data
    }
    func importMapBackup(_ data: Data) async throws -> MapImportResult {
        guard case .backup = try SavedCopyContent.read(data: data, filename: "backup.json") else { throw RilloraAPIError.invalidPayload("Choose a complete map backup.") }
        let body = try JSONSerialization.data(withJSONObject: ["backup": JSONSerialization.jsonObject(with: data), "acknowledgesPrivateImport": true])
        let result: MapImportResult = try await send(path: "account/map/import", method: "POST", body: body)
        guard !result.sharingRestored else { throw RilloraAPIError.invalidPayload("Imported records must stay private.") }
        return result
    }
    func fetchArchivedMatters() async throws -> [Matter] {
        let result: MattersEnvelope = try await get("account/archived-matters")
        return result.matters
    }
    func restoreArchivedMatter(id: String, version: Int) async throws -> Matter {
        let body = try JSONSerialization.data(withJSONObject: ["expectedVersion": version])
        let result: MatterEnvelope = try await send(path: "account/archived-matters/\(id)/restore", method: "POST", body: body)
        return result.matter
    }

    func fetchFamilyMaintenance() async throws -> FamilyMaintenanceOverview {
        let response: FamilyMaintenanceOverview = try await get("maintenance/overview")
        guard response.isValid else { throw RilloraAPIError.invalidPayload("Review information exceeded its allowed scope.") }
        return response
    }
    func startFamilyReview(_ request: FamilyReviewStartRequest) async throws {
        let _: FamilyReviewAcknowledgement = try await send(path: "maintenance/rounds", method: "POST", body: encoder.encode(request))
    }
    func saveFamilyReviewSettings(_ request: FamilyReviewSettingsRequest) async throws {
        let _: FamilyReviewAcknowledgement = try await send(path: "maintenance/settings", method: "PATCH", body: encoder.encode(request))
    }
    func respondToFamilyReview(_ id: String, request: FamilyReviewResponseRequest) async throws {
        let _: FamilyReviewAcknowledgement = try await send(path: "maintenance/tasks/\(id)/respond", method: "POST", body: encoder.encode(request))
    }
    func decideFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws {
        let _: FamilyReviewAcknowledgement = try await send(path: "maintenance/tasks/\(id)/decide", method: "POST", body: encoder.encode(request))
    }
    func closeFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws {
        let _: FamilyReviewAcknowledgement = try await send(path: "maintenance/rounds/\(id)/close", method: "POST", body: encoder.encode(request))
    }

    private func send<Response: Decodable & Sendable>(
        path: String,
        method: String,
        body: Data? = nil
    ) async throws -> Response {
        let result = try await perform(path: path, method: method, body: body)
        guard (200..<300).contains(result.response.statusCode) else {
            throw decodeServerError(from: result)
        }

        do {
            return try decoder.decode(Response.self, from: result.data)
        } catch {
            throw RilloraAPIError.invalidPayload(error.localizedDescription)
        }
    }

    private func sendPublicRequest<Response: Decodable & Sendable>(
        path: String,
        method: String,
        body: Data? = nil,
        authentication: APIRequestAuthentication
    ) async throws -> Response {
        let result = try await perform(
            path: path,
            method: method,
            body: body,
            baseURL: publicAPIBaseURL,
            authentication: authentication
        )
        guard (200..<300).contains(result.response.statusCode) else {
            throw decodeServerError(from: result)
        }
        do { return try decoder.decode(Response.self, from: result.data) }
        catch { throw RilloraAPIError.invalidPayload(error.localizedDescription) }
    }

    private func perform(
        path: String,
        method: String,
        body: Data? = nil,
        additionalHeaders: [String: String] = [:],
        baseURL: URL? = nil,
        authentication: APIRequestAuthentication = .planner
    ) async throws -> HTTPTransportResponse {
        let parts = path.split(separator: "?", maxSplits: 1).map(String.init)
        var urlComponents = URLComponents(
            url: (baseURL ?? configuration.baseURL).appendingPathComponent(parts[0]),
            resolvingAgainstBaseURL: false
        )
        if parts.count == 2 {
            urlComponents?.percentEncodedQuery = parts[1]
        }
        guard let url = urlComponents?.url else {
            throw RilloraAPIError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        for (field, value) in additionalHeaders {
            request.setValue(value, forHTTPHeaderField: field)
        }
        switch authentication {
        case .planner:
            request.setValue("ios", forHTTPHeaderField: "x-rillora-client")
            if let plannerID = configuration.developmentPlannerID {
                request.setValue(plannerID, forHTTPHeaderField: "x-dev-planner-id")
            } else if let token = try await sessionTokenStore?.read() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        case .rehearsal(let token):
            request.httpShouldHandleCookies = false
            request.setValue("Rillora-Rehearsal \(token)", forHTTPHeaderField: "Authorization")
        case .unauthenticated:
            request.httpShouldHandleCookies = false
        }

        do {
            return try await transport.send(request)
        } catch let error as RilloraAPIError {
            throw error
        } catch {
            throw RilloraAPIError.requestFailed(error.localizedDescription)
        }
    }

    private var publicAPIBaseURL: URL {
        var components = URLComponents(url: configuration.baseURL, resolvingAgainstBaseURL: false)!
        var path = components.path
        while path.hasSuffix("/") { path.removeLast() }
        if path.hasSuffix("/v1") { path.removeLast(3) }
        components.path = path.isEmpty ? "/" : "\(path)/"
        return components.url!
    }

    private func decodeServerError(from result: HTTPTransportResponse) -> RilloraAPIError {
        let requestID = result.response.value(forHTTPHeaderField: "x-request-id")
        guard let payload = try? decoder.decode(ErrorEnvelope.self, from: result.data) else {
            return .server(
                status: result.response.statusCode,
                code: "request_failed",
                message: "The continuity service could not complete the request.",
                requestID: requestID
            )
        }
        return .server(
            status: result.response.statusCode,
            code: payload.error.code,
            message: payload.error.message,
            requestID: requestID
        )
    }
}

private enum APIRequestAuthentication: Sendable {
    case planner
    case rehearsal(String)
    case unauthenticated
}

private struct ErrorEnvelope: Decodable {
    struct Payload: Decodable {
        let code: String
        let message: String
    }

    let error: Payload
}

struct UnavailableOverviewService: OverviewServing {
    let message: String

    func fetchOverview() async throws -> OverviewSnapshot {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableCommerceService: CommerceServing {
    let message: String

    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        throw RilloraAPIError.requestFailed(message)
    }

    func resolvePurchaseRoute(
        request: CommercePurchaseRouteRequest
    ) async throws -> CommercePurchaseRouteResponse {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailablePlanService: PlanEditing {
    let message: String

    func fetchPlan() async throws -> Plan {
        throw RilloraAPIError.requestFailed(message)
    }

    func updatePlan(request: PlanUpdateRequest) async throws -> Plan {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableMatterService: MatterEditing {
    let message: String

    func fetchMatter(publicID: String) async throws -> Matter {
        throw RilloraAPIError.requestFailed(message)
    }

    func updateMatter(publicID: String, request: MatterUpdateRequest) async throws -> Matter {
        throw RilloraAPIError.requestFailed(message)
    }

    func createMatter(request: MatterCreateRequest) async throws -> Matter {
        throw RilloraAPIError.requestFailed(message)
    }

    func archiveMatter(publicID: String, expectedVersion: Int) async throws {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableTrustedContactService: TrustedContactEditing {
    let message: String

    func fetchTrustedContacts() async throws -> [TrustedContact] {
        throw RilloraAPIError.requestFailed(message)
    }

    func createTrustedContact(
        request: TrustedContactCreateRequest
    ) async throws -> TrustedContact {
        throw RilloraAPIError.requestFailed(message)
    }

    func updateTrustedContact(
        publicID: String,
        request: TrustedContactUpdateRequest
    ) async throws -> TrustedContact {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableOfficialSetupService: OfficialSetupEditing {
    let message: String

    func fetchOfficialSetupChecks() async throws -> [OfficialSetupCheck] {
        throw RilloraAPIError.requestFailed(message)
    }

    func updateOfficialSetupCheck(
        publicID: String,
        request: OfficialSetupCheckUpdateRequest
    ) async throws -> OfficialSetupCheck {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableSimulationService: SimulationRunning {
    let message: String

    func runSimulation(
        request: ClaimSimulationCreateRequest
    ) async throws -> ClaimSimulation {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableDisclosureRehearsalService: DisclosureRehearsing {
    let message: String

    func createDisclosureRehearsal(
        request: DisclosureRehearsalCreateRequest
    ) async throws -> DisclosureRehearsal {
        throw RilloraAPIError.requestFailed(message)
    }

    func updateDisclosureRehearsal(
        publicID: String,
        request: DisclosureRehearsalActionRequest
    ) async throws -> DisclosureRehearsal {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableRoleAssignmentService: RoleAssignmentEditing {
    let message: String

    func fetchRoleAssignments() async throws -> [RoleAssignment] {
        throw RilloraAPIError.requestFailed(message)
    }

    func createRoleAssignment(
        request: RoleAssignmentCreateRequest
    ) async throws -> RoleAssignmentMutationResult {
        throw RilloraAPIError.requestFailed(message)
    }

    func updateRoleAssignment(
        publicID: String,
        request: RoleAssignmentUpdateRequest
    ) async throws -> RoleAssignmentMutationResult {
        throw RilloraAPIError.requestFailed(message)
    }

    func revokeRoleAssignment(
        publicID: String,
        expectedVersion: Int
    ) async throws -> RoleAssignmentMutationResult {
        throw RilloraAPIError.requestFailed(message)
    }
}

struct UnavailableStartHereService: StartHerePreviewing {
    let message: String

    func previewStartHere() async throws -> StartHerePreview {
        throw RilloraAPIError.requestFailed(message)
    }

    func createPrintableStartHere(
        previewPublicID: String
    ) async throws -> StartHerePrintableArtifact {
        throw RilloraAPIError.requestFailed(message)
    }

    func prepareEncryptedStartHere(
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        throw RilloraAPIError.requestFailed(message)
    }

    func finalizeEncryptedStartHere(
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws -> EncryptedStartHereFinalizedRecord {
        throw RilloraAPIError.requestFailed(message)
    }
}
