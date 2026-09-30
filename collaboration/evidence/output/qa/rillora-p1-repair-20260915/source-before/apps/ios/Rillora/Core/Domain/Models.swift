import Foundation

struct SessionInfo: Decodable, Equatable, Sendable {
    let plannerPublicId: String
    let authenticationMode: String
    let authenticationMethods: [String]
    let authenticatedAt: String?

    var usesDevelopmentIdentity: Bool {
        authenticationMode == "development"
    }
}

struct Plan: Decodable, Equatable, Sendable {
    let publicId: String
    let motivation: String?
    let status: String
    let firstUseState: FirstUseState
    let firstUseStep: Int
    let policyVersion: String
    let lastReviewedAt: String?
    let reviewDueAt: String?
    let version: Int
    let createdAt: String
    let updatedAt: String
}

enum FirstUseState: String, Codable, Sendable {
    case available
    case guideInProgress = "guide_in_progress"
    case guidePaused = "guide_paused"
    case completed

    var showsStarter: Bool {
        self == .available || self == .guideInProgress
    }
}

enum PlanMotivation: String, CaseIterable, Identifiable, Codable, Sendable {
    case lifeChange = "life_change"
    case familyResponsibility = "family_responsibility"
    case crossBorder = "cross_border"
    case complexDigitalLife = "complex_digital_life"
    case recentEstateExperience = "recent_estate_experience"
    case generalPreparedness = "general_preparedness"
    case other

    var id: String { rawValue }

    var label: String {
        switch self {
        case .lifeChange: "A life change"
        case .familyResponsibility: "Responsibility for family or others"
        case .crossBorder: "Life or accounts across countries"
        case .complexDigitalLife: "A complex digital life"
        case .recentEstateExperience: "Recent experience handling an estate"
        case .generalPreparedness: "General preparedness"
        case .other: "Another reason"
        }
    }

    var explanation: String {
        switch self {
        case .lifeChange:
            "You are reviewing continuity after a major personal or household change."
        case .familyResponsibility:
            "Other people may depend on you or need clear directions."
        case .crossBorder:
            "Your life, accounts or responsibilities span more than one country."
        case .complexDigitalLife:
            "You have many online accounts, devices, subscriptions or digital assets."
        case .recentEstateExperience:
            "A recent experience showed how difficult fragmented information can be."
        case .generalPreparedness:
            "You want a practical plan before there is an emergency."
        case .other:
            "You have another reason. Rillora stores only this broad category, not a narrative."
        }
    }
}

struct PlanUpdateRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let motivation: PlanMotivation?
    let firstUseState: FirstUseState?
    let firstUseStep: Int?

    init(
        expectedVersion: Int,
        motivation: PlanMotivation? = nil,
        firstUseState: FirstUseState? = nil,
        firstUseStep: Int? = nil
    ) {
        self.expectedVersion = expectedVersion
        self.motivation = motivation
        self.firstUseState = firstUseState
        self.firstUseStep = firstUseStep
    }

    private enum CodingKeys: String, CodingKey {
        case expectedVersion
        case motivation
        case firstUseState
        case firstUseStep
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(expectedVersion, forKey: .expectedVersion)
        try container.encodeIfPresent(motivation, forKey: .motivation)
        try container.encodeIfPresent(firstUseState, forKey: .firstUseState)
        try container.encodeIfPresent(firstUseStep, forKey: .firstUseStep)
    }
}

struct Matter: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let category: String
    let title: String
    let institutionName: String?
    let accountHint: String?
    let valueBand: String
    let currencyCode: String?
    let locationHint: String?
    let importance: String
    let desiredOutcome: String
    let status: String
    let reviewDueAt: String?
    let version: Int
    let createdAt: String
    let updatedAt: String
    let archivedAt: String?
    var details: [String: String]? = nil
    var notes: String? = nil

    var id: String { publicId }
    var isReady: Bool { status == "ready" }
}

struct MatterEnvelope: Decodable, Sendable {
    let matter: Matter
}

enum MatterCategory: String, CaseIterable, Identifiable, Sendable {
    case financialAsset = "financial_asset"
    case debt
    case account
    case device
    case document
    case subscription
    case cryptoAsset = "crypto_asset"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .financialAsset: "Financial asset"
        case .debt: "Debt"
        case .account: "Online account"
        case .device: "Device"
        case .document: "Document"
        case .subscription: "Subscription"
        case .cryptoAsset: "Crypto asset"
        }
    }
}

enum MatterOutcome: String, CaseIterable, Identifiable, Sendable {
    case notify
    case transferRequest = "transfer_request"
    case close
    case deleteRequest = "delete_request"
    case memorialize
    case delayDisclosure = "delay_disclosure"
    case neverDisclose = "never_disclose"
    case undecided

    var id: String { rawValue }

    var label: String {
        switch self {
        case .notify: "Notify someone"
        case .transferRequest: "Request transfer"
        case .close: "Request closure"
        case .deleteRequest: "Request deletion"
        case .memorialize: "Request memorialization"
        case .delayDisclosure: "Delay disclosure"
        case .neverDisclose: "Never disclose"
        case .undecided: "Not decided"
        }
    }
}

enum MatterImportance: String, CaseIterable, Identifiable, Sendable {
    case standard
    case important
    case critical

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

enum MatterStatus: String, CaseIterable, Identifiable, Sendable {
    case draft
    case ready
    case needsReview = "needs_review"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .draft: "Draft"
        case .ready: "Directions added"
        case .needsReview: "Needs review"
        }
    }
}

enum MatterValueBand: String, CaseIterable, Identifiable, Sendable {
    case none
    case under1k = "under_1k"
    case oneToTenK = "1k_10k"
    case tenToHundredK = "10k_100k"
    case hundredKPlus = "100k_plus"
    case unknown

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: "No monetary value"
        case .under1k: "Under 1,000"
        case .oneToTenK: "1,000–10,000"
        case .tenToHundredK: "10,000–100,000"
        case .hundredKPlus: "100,000+"
        case .unknown: "Unknown / not stated"
        }
    }
}

struct MatterUpdateRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let category: String
    let title: String
    let institutionName: String?
    let accountHint: String?
    let valueBand: String
    let currencyCode: String?
    let locationHint: String?
    let importance: String
    let desiredOutcome: String
    let status: String
    var details: [String: String] = [:]
    var notes: String? = nil

    private enum CodingKeys: String, CodingKey {
        case expectedVersion
        case category
        case title
        case institutionName
        case accountHint
        case valueBand
        case currencyCode
        case locationHint
        case importance
        case desiredOutcome
        case status
        case details
        case notes
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(expectedVersion, forKey: .expectedVersion)
        try container.encode(category, forKey: .category)
        try container.encode(title, forKey: .title)
        try container.encode(valueBand, forKey: .valueBand)
        try container.encode(importance, forKey: .importance)
        try container.encode(desiredOutcome, forKey: .desiredOutcome)
        try container.encode(status, forKey: .status)
        try container.encode(details, forKey: .details)
        try container.encodeNullable(notes, forKey: .notes)
        try container.encodeNullable(institutionName, forKey: .institutionName)
        try container.encodeNullable(accountHint, forKey: .accountHint)
        try container.encodeNullable(currencyCode, forKey: .currencyCode)
        try container.encodeNullable(locationHint, forKey: .locationHint)
    }
}

struct MatterCreateRequest: Encodable, Equatable, Sendable {
    let category: String
    let title: String
    let institutionName: String?
    let accountHint: String?
    let valueBand: String
    let currencyCode: String?
    let locationHint: String?
    let importance: String
    let desiredOutcome: String
    let status: String
    var details: [String: String] = [:]
    var notes: String? = nil

    private enum CodingKeys: String, CodingKey {
        case category
        case title
        case institutionName
        case accountHint
        case valueBand
        case currencyCode
        case locationHint
        case importance
        case desiredOutcome
        case status
        case details
        case notes
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(category, forKey: .category)
        try container.encode(title, forKey: .title)
        try container.encode(valueBand, forKey: .valueBand)
        try container.encode(importance, forKey: .importance)
        try container.encode(desiredOutcome, forKey: .desiredOutcome)
        try container.encode(status, forKey: .status)
        try container.encode(details, forKey: .details)
        try container.encodeNullable(notes, forKey: .notes)
        try container.encodeNullable(institutionName, forKey: .institutionName)
        try container.encodeNullable(accountHint, forKey: .accountHint)
        try container.encodeNullable(currencyCode, forKey: .currencyCode)
        try container.encodeNullable(locationHint, forKey: .locationHint)
    }
}

private extension KeyedEncodingContainer {
    mutating func encodeNullable<T: Encodable>(_ value: T?, forKey key: Key) throws {
        if let value {
            try encode(value, forKey: key)
        } else {
            try encodeNil(forKey: key)
        }
    }
}

struct TrustedContact: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let displayName: String
    let relationshipLabel: String?
    let status: String
    let roleStatus: String?
    let invitationStatus: String?
    let confirmationMode: String?
    let version: Int
    let createdAt: String
    let updatedAt: String

    var id: String { publicId }

    var hasAcceptedInvitation: Bool {
        invitationStatus == "accepted" && confirmationMode != "simulation"
    }

    var hasSimulatedAcceptance: Bool {
        invitationStatus == "accepted" && confirmationMode == "simulation"
    }

    var isRevoked: Bool {
        status == "revoked" || status == "archived"
            || roleStatus == "revoked" || invitationStatus == "revoked"
    }

    var evidenceLabel: String {
        if isRevoked { return "Role revoked" }
        if hasSimulatedAcceptance { return "Simulated acceptance" }
        if hasAcceptedInvitation { return "Invitation accepted" }
        if invitationStatus == "pending" { return "Invitation pending" }
        return "Record only — no invitation sent"
    }
}

struct TrustedContactEnvelope: Decodable, Sendable {
    let trustedContact: TrustedContact
}

struct TrustedContactCreateRequest: Encodable, Equatable, Sendable {
    let displayName: String
    let relationshipLabel: String?

    private enum CodingKeys: String, CodingKey {
        case displayName
        case relationshipLabel
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(displayName, forKey: .displayName)
        try container.encodeNullable(relationshipLabel, forKey: .relationshipLabel)
    }
}

struct TrustedContactUpdateRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let displayName: String
    let relationshipLabel: String?
    let status: String?

    private enum CodingKeys: String, CodingKey {
        case expectedVersion
        case displayName
        case relationshipLabel
        case status
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(expectedVersion, forKey: .expectedVersion)
        try container.encode(displayName, forKey: .displayName)
        try container.encodeNullable(relationshipLabel, forKey: .relationshipLabel)
        try container.encodeIfPresent(status, forKey: .status)
    }
}

struct OfficialSetupCheck: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let providerKey: String
    let policyVersion: String
    let completed: Bool
    let completedAt: String?
    let version: Int
    let updatedAt: String

    var id: String { publicId }

    var providerName: String {
        switch providerKey {
        case "apple": "Apple"
        case "google": "Google"
        case "meta": "Meta"
        case "github": "GitHub"
        case "password_manager": "Password manager"
        default: providerKey.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}

struct OfficialSetupChecksEnvelope: Decodable, Sendable {
    let officialSetupChecks: [OfficialSetupCheck]
}

struct OfficialSetupCheckEnvelope: Decodable, Sendable {
    let officialSetupCheck: OfficialSetupCheck
    let evidence: String
}

struct OfficialSetupCheckUpdateRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let completed: Bool
}

enum LifeEvent: String, CaseIterable, Identifiable, Codable, Sendable {
    case death
    case incapacity
    case missing

    var id: String { rawValue }

    var title: String {
        switch self {
        case .death: "Death"
        case .incapacity: "Incapacity"
        case .missing: "Missing / unreachable"
        }
    }

    var explanation: String {
        switch self {
        case .death:
            "Rehearse a future path after death. This does not report or verify a death."
        case .incapacity:
            "Rehearse support while you are alive but unable to manage the plan. This does not grant authority."
        case .missing:
            "Rehearse a temporary missing or unreachable path. This does not declare death or incapacity."
        }
    }
}

struct SimulationSnapshot: Decodable, Equatable, Sendable {
    let schemaVersion: String
    let matterCount: Int
    let outcomeCount: Int
    let trustedContactCount: Int
    let operative: Bool
}

struct ClaimSimulation: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let lifeEvent: LifeEvent
    let policyVersion: String
    let completedAt: String
    let snapshot: SimulationSnapshot
    let simulationOnly: Bool
    let notificationsSent: Bool
    let dataReleased: Bool

    var id: String { publicId }
}

struct ClaimSimulationEnvelope: Decodable, Sendable {
    let simulation: ClaimSimulation
}

struct ClaimSimulationCreateRequest: Encodable, Equatable, Sendable {
    let lifeEvent: LifeEvent
}

enum DisclosureRehearsalAction: String, Codable, CaseIterable, Identifiable, Sendable {
    case advance
    case simulateCoolingOffElapsed = "simulate_cooling_off_elapsed"
    case appeal
    case restartReview = "restart_review"
    case cancel

    var id: String { rawValue }

    var label: String {
        switch self {
        case .advance: "Advance simulated review"
        case .simulateCoolingOffElapsed: "Simulate hold elapsed"
        case .appeal: "Place on appeal hold"
        case .restartReview: "Restart simulated review"
        case .cancel: "Cancel this rehearsal"
        }
    }
}

struct DisclosureRehearsalCreateRequest: Encodable, Equatable, Sendable {
    let lifeEvent: LifeEvent
}

struct DisclosureRehearsalActionRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let action: DisclosureRehearsalAction
    let acknowledgesSimulationOnly: Bool

    init(expectedVersion: Int, action: DisclosureRehearsalAction) {
        self.expectedVersion = expectedVersion
        self.action = action
        acknowledgesSimulationOnly = true
    }
}

struct DisclosureBoundaries: Decodable, Equatable, Sendable {
    let simulationOnly: Bool
    let operative: Bool
    let identityVerified: Bool
    let documentsVerified: Bool
    let multiPartyVerified: Bool
    let notificationsSent: Bool
    let dataReleased: Bool
    let releaseAvailable: Bool
    let legalAuthorityGranted: Bool

    var preservesSafetyBoundary: Bool {
        simulationOnly && !operative && !identityVerified && !documentsVerified
            && !multiPartyVerified && !notificationsSent && !dataReleased
            && !releaseAvailable && !legalAuthorityGranted
    }
}

struct DisclosureCheckpoint: Decodable, Equatable, Sendable {
    let code: String
    let label: String
    let simulatedAt: String
    let realEvidenceCollected: Bool
}

struct DisclosureStateStep: Decodable, Equatable, Identifiable, Sendable {
    let key: String
    let label: String

    var id: String { key }
}

struct DisclosurePlannerPreview: Decodable, Equatable, Sendable {
    let displayName: String
    let timeZone: String
}

struct DisclosureGuardrail: Decodable, Equatable, Sendable {
    let code: String
    let label: String
    let realEvidenceCollected: Bool
}

struct DisclosureAssignedPerson: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let displayName: String
    let relationshipLabel: String?
    let assignmentStatus: String
    let invitationEvidence: String

    var id: String { publicId }

    var evidenceLabel: String {
        switch invitationEvidence {
        case "simulation": "Simulated acceptance"
        case "real": "Recorded invitation evidence"
        default: "Record only"
        }
    }
}

struct DisclosureMatterPreview: Decodable, Equatable, Sendable {
    let title: String?
    let category: String?
    let institutionName: String?
    let locationHint: String?
    let desiredOutcome: String?

    private enum CodingKeys: String, CodingKey, CaseIterable {
        case title
        case category
        case institutionName
        case locationHint
        case desiredOutcome
    }

    init(
        title: String? = nil,
        category: String? = nil,
        institutionName: String? = nil,
        locationHint: String? = nil,
        desiredOutcome: String? = nil
    ) {
        self.title = title
        self.category = category
        self.institutionName = institutionName
        self.locationHint = locationHint
        self.desiredOutcome = desiredOutcome
    }

    init(from decoder: Decoder) throws {
        let dynamic = try decoder.container(keyedBy: DisclosureDynamicCodingKey.self)
        let allowed = Set(CodingKeys.allCases.map(\.rawValue))
        let unexpected = dynamic.allKeys.map(\.stringValue).filter { !allowed.contains($0) }
        guard unexpected.isEmpty else {
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "Disclosure preview contained forbidden fields: \(unexpected.sorted())"
            ))
        }
        let container = try decoder.container(keyedBy: CodingKeys.self)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        category = try container.decodeIfPresent(String.self, forKey: .category)
        institutionName = try container.decodeIfPresent(String.self, forKey: .institutionName)
        locationHint = try container.decodeIfPresent(String.self, forKey: .locationHint)
        desiredOutcome = try container.decodeIfPresent(String.self, forKey: .desiredOutcome)
    }

    var populatedPolicyFields: Set<String> {
        var fields = Set<String>()
        if title != nil { fields.insert("matter.title") }
        if category != nil { fields.insert("matter.category") }
        if institutionName != nil { fields.insert("matter.institutionName") }
        if locationHint != nil { fields.insert("matter.locationHint") }
        if desiredOutcome != nil { fields.insert("matter.desiredOutcome") }
        return fields
    }
}

private struct DisclosureDynamicCodingKey: CodingKey {
    let stringValue: String
    let intValue: Int?

    init?(stringValue: String) {
        self.stringValue = stringValue
        intValue = nil
    }

    init?(intValue: Int) {
        stringValue = String(intValue)
        self.intValue = intValue
    }
}

struct DisclosureRoleSummary: Decodable, Equatable, Sendable {
    let matterCount: Int
}

struct DisclosureRoleView: Decodable, Equatable, Identifiable, Sendable {
    let role: String
    let previewStage: String
    let eligibleForProjectedPreview: Bool
    let reason: String
    let assignedPeople: [DisclosureAssignedPerson]
    let fieldPolicy: [String]
    let matters: [DisclosureMatterPreview]
    let summary: DisclosureRoleSummary

    var id: String { role }

    func preservesFieldBoundary(for lifeEvent: LifeEvent) -> Bool {
        let expected = Self.expectedFieldPolicy(lifeEvent: lifeEvent, role: role)
        if !eligibleForProjectedPreview {
            return fieldPolicy.isEmpty && matters.isEmpty
        }
        guard let expected, Set(fieldPolicy) == expected else { return false }
        if lifeEvent == .missing {
            return role == "trusted_contact" && matters.isEmpty
        }
        return matters.allSatisfy { $0.populatedPolicyFields.isSubset(of: expected) }
    }

    private static func expectedFieldPolicy(lifeEvent: LifeEvent, role: String) -> Set<String>? {
        switch (lifeEvent, role) {
        case (.death, "trusted_contact"):
            ["matter.title", "matter.category", "matter.desiredOutcome"]
        case (.death, "executor"):
            [
                "matter.title", "matter.category", "matter.institutionName",
                "matter.locationHint", "matter.desiredOutcome",
            ]
        case (.death, "recipient"):
            ["matter.title", "matter.category", "matter.locationHint", "matter.desiredOutcome"]
        case (.incapacity, "trusted_contact"):
            ["matter.title", "matter.category"]
        case (.missing, "trusted_contact"):
            ["planner.displayName", "planner.timeZone", "plan.matterCount"]
        default:
            nil
        }
    }
}

struct DisclosureSnapshot: Decodable, Equatable, Sendable {
    let schemaVersion: String
    let capturedAt: String
    let lifeEvent: LifeEvent
    let policyIllustrative: Bool
    let operative: Bool
    let planner: DisclosurePlannerPreview
    let coolingOffDurationHours: Int
    let guardrails: [DisclosureGuardrail]
    let roleViews: [DisclosureRoleView]
}

struct DisclosureRehearsal: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let lifeEvent: LifeEvent
    let state: String
    let stateLabel: String
    let policyVersion: String
    let policyLabel: String
    let stateSequence: [DisclosureStateStep]
    let completedCheckpoints: [DisclosureCheckpoint]
    let projectedRoleViews: [DisclosureRoleView]
    let snapshot: DisclosureSnapshot
    let availableActions: [DisclosureRehearsalAction]
    let previewReady: Bool
    let snapshotFresh: Bool
    let invalidatedAt: String?
    let invalidatedReason: String?
    let coolingOffEndsAt: String?
    let coolingOffSimulatedAt: String?
    let appealedAt: String?
    let canceledAt: String?
    let version: Int
    let createdAt: String
    let updatedAt: String
    let boundaries: DisclosureBoundaries

    var id: String { publicId }

    var preservesSafetyBoundary: Bool {
        let roles = projectedRoleViews.map(\.role)
        return boundaries.preservesSafetyBoundary
            && snapshot.schemaVersion == "disclosure-rehearsal-v1"
            && snapshot.lifeEvent == lifeEvent
            && snapshot.policyIllustrative
            && !snapshot.operative
            && snapshot.guardrails.allSatisfy { !$0.realEvidenceCollected }
            && completedCheckpoints.allSatisfy { !$0.realEvidenceCollected }
            && projectedRoleViews == snapshot.roleViews
            && roles.count == 3
            && Set(roles) == ["trusted_contact", "executor", "recipient"]
            && projectedRoleViews.allSatisfy { $0.preservesFieldBoundary(for: lifeEvent) }
            && state.hasPrefix(lifeEvent.rawValue)
            && (snapshotFresh
                ? invalidatedAt == nil && invalidatedReason == nil
                : invalidatedAt != nil && invalidatedReason == "policy_source_changed"
                    && availableActions.isEmpty)
    }
}

struct DisclosureRehearsalEnvelope: Decodable, Equatable, Sendable {
    let disclosureRehearsal: DisclosureRehearsal
    let boundaries: DisclosureBoundaries
}

enum RoleAssignmentRole: String, Codable, CaseIterable, Identifiable, Sendable {
    case trustedContact = "trusted_contact"
    case executor
    case recipient

    var id: String { rawValue }

    var label: String {
        switch self {
        case .trustedContact: "Trusted contact"
        case .executor: "Executor record"
        case .recipient: "Matter recipient"
        }
    }
}

enum RoleAssignmentScope: String, Codable, CaseIterable, Identifiable, Sendable {
    case planWide = "plan_wide"
    case matterSpecific = "matter_specific"

    var id: String { rawValue }
    var label: String { self == .planWide ? "Whole plan" : "This matter" }
}

enum RoleAssignmentEvidence: String, Decodable, Sendable {
    case recordOnly = "record_only"
    case simulation
    case invitationPending = "invitation_pending"
    case invitationAccepted = "invitation_accepted"

    var label: String {
        switch self {
        case .recordOnly: "Record only"
        case .simulation: "Simulated acceptance"
        case .invitationPending: "Invitation pending"
        case .invitationAccepted: "Invitation accepted"
        }
    }
}

struct RoleAssignmentPerson: Decodable, Equatable, Sendable {
    let publicId: String
    let displayName: String
    let relationshipLabel: String?

    private enum CodingKeys: String, CodingKey, CaseIterable {
        case publicId, displayName, relationshipLabel
    }

    init(from decoder: Decoder) throws {
        try rejectUnexpectedKeys(decoder, allowed: CodingKeys.allCases.map(\.rawValue))
        let container = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try container.decode(String.self, forKey: .publicId)
        displayName = try container.decode(String.self, forKey: .displayName)
        relationshipLabel = try container.decodeIfPresent(String.self, forKey: .relationshipLabel)
    }
}

struct RoleAssignmentMatter: Decodable, Equatable, Sendable {
    let publicId: String
    let title: String

    private enum CodingKeys: String, CodingKey, CaseIterable { case publicId, title }

    init(from decoder: Decoder) throws {
        try rejectUnexpectedKeys(decoder, allowed: CodingKeys.allCases.map(\.rawValue))
        let container = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try container.decode(String.self, forKey: .publicId)
        title = try container.decode(String.self, forKey: .title)
    }
}

struct RoleAssignment: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let person: RoleAssignmentPerson
    let role: RoleAssignmentRole
    let scope: RoleAssignmentScope
    let matter: RoleAssignmentMatter?
    let status: String
    let evidence: RoleAssignmentEvidence
    let invitationStatus: String?
    let editable: Bool
    let version: Int
    let createdAt: String
    let updatedAt: String

    var id: String { publicId }

    var preservesSafetyBoundary: Bool {
        let scopeValid = scope == .planWide ? matter == nil : matter != nil
        let recipientValid = role != .recipient || scope == .matterSpecific
        let editableValid = !editable || (status == "draft" && evidence == .recordOnly)
        return scopeValid && recipientValid && editableValid && version > 0
    }

    private enum CodingKeys: String, CodingKey, CaseIterable {
        case publicId, person, role, scope, matter, status, evidence, invitationStatus
        case editable, version, createdAt, updatedAt
    }

    init(from decoder: Decoder) throws {
        try rejectUnexpectedKeys(decoder, allowed: CodingKeys.allCases.map(\.rawValue))
        let container = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try container.decode(String.self, forKey: .publicId)
        person = try container.decode(RoleAssignmentPerson.self, forKey: .person)
        role = try container.decode(RoleAssignmentRole.self, forKey: .role)
        scope = try container.decode(RoleAssignmentScope.self, forKey: .scope)
        matter = try container.decodeIfPresent(RoleAssignmentMatter.self, forKey: .matter)
        status = try container.decode(String.self, forKey: .status)
        evidence = try container.decode(RoleAssignmentEvidence.self, forKey: .evidence)
        invitationStatus = try container.decodeIfPresent(String.self, forKey: .invitationStatus)
        editable = try container.decode(Bool.self, forKey: .editable)
        version = try container.decode(Int.self, forKey: .version)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
}

struct RoleAssignmentBoundaries: Decodable, Equatable, Sendable {
    let recordOnlyByDefault: Bool
    let invitationSent: Bool
    let identityBound: Bool
    let legalAuthorityGranted: Bool
    let accountAccessGranted: Bool
    let releaseAvailable: Bool

    var preservesSafetyBoundary: Bool {
        recordOnlyByDefault && !invitationSent && !identityBound
            && !legalAuthorityGranted && !accountAccessGranted && !releaseAvailable
    }
}

struct RoleAssignmentsEnvelope: Decodable, Sendable {
    let roleAssignments: [RoleAssignment]
    let boundaries: RoleAssignmentBoundaries
}

struct RoleAssignmentEnvelope: Decodable, Sendable {
    let roleAssignment: RoleAssignment
    let invalidatedDisclosureRehearsalCount: Int
    let boundaries: RoleAssignmentBoundaries
}

struct RoleAssignmentRevokeEnvelope: Decodable, Sendable {
    let revoked: Bool
    let invalidatedDisclosureRehearsalCount: Int
    let boundaries: RoleAssignmentBoundaries
}

struct RoleAssignmentCreateRequest: Encodable, Equatable, Sendable {
    let personPublicId: String
    let role: RoleAssignmentRole
    let scope: RoleAssignmentScope
    let matterPublicId: String?
    let acknowledgesRecordOnly = true
    let acknowledgesNoAuthority = true
}

struct RoleAssignmentUpdateRequest: Encodable, Equatable, Sendable {
    let expectedVersion: Int
    let role: RoleAssignmentRole
    let scope: RoleAssignmentScope
    let matterPublicId: String?
    let acknowledgesRecordOnly = true
    let acknowledgesNoAuthority = true
}

struct RoleAssignmentMutationResult: Equatable, Sendable {
    let assignment: RoleAssignment?
    let invalidatedDisclosureRehearsalCount: Int
}

private func rejectUnexpectedKeys(
    _ decoder: Decoder,
    allowed: [String]
) throws {
    let dynamic = try decoder.container(keyedBy: DisclosureDynamicCodingKey.self)
    let allowedSet = Set(allowed)
    let unexpected = dynamic.allKeys.map(\.stringValue).filter { !allowedSet.contains($0) }
    guard unexpected.isEmpty else {
        throw DecodingError.dataCorrupted(.init(
            codingPath: decoder.codingPath,
            debugDescription: "Role policy contained forbidden fields: \(unexpected.sorted())"
        ))
    }
}

struct StartHereExportRecord: Decodable, Equatable, Identifiable, Sendable {
    let publicId: String
    let createdAt: String
    let expiresAt: String?
    let status: String
    let encryptedPackageCreated: Bool

    var id: String { publicId }
}

struct StartHerePlanner: Codable, Equatable, Sendable {
    let displayName: String
    let locale: String
    let timeZone: String

    private enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
        case locale
        case timeZone = "time_zone"
    }
}

struct StartHereTrustedContact: Codable, Equatable, Sendable {
    let displayName: String
    let relationshipLabel: String?
}

struct StartHerePlan: Codable, Equatable, Sendable {
    let status: String
}

struct StartHereMatter: Codable, Equatable, Identifiable, Sendable {
    let publicId: String
    let category: String
    let title: String
    let institutionName: String?
    let locationHint: String?
    let desiredOutcome: String
    let status: String

    var id: String { publicId }
}

struct StartHerePackage: Codable, Equatable, Sendable {
    let schemaVersion: String
    let planner: StartHerePlanner
    let plan: StartHerePlan
    let matters: [StartHereMatter]
    let trustedContacts: [StartHereTrustedContact]
    let directionsNotPasswords: Bool
    let legalAuthorityNotGranted: Bool
}

struct StartHerePreview: Decodable, Equatable, Sendable {
    let export: StartHereExportRecord
    let package: StartHerePackage
}

struct StartHerePreviewRequest: Encodable, Equatable, Sendable {}

struct StartHerePrintableRequest: Encodable, Equatable, Sendable {
    let previewPublicId: String
    let acknowledgesPlaintext: Bool
    let acknowledgesNoRevocation: Bool
}

struct StartHerePrintableArtifact: Equatable, Sendable {
    let exportPublicId: String
    let filename: String
    let data: Data
    let serverCopyRetained: Bool
}

struct EncryptedStartHerePreparation: Decodable, Equatable, Sendable {
    let package: EncryptedStartHerePreparationRecord
    let eligibleRecipientKeys: [EligibleRecipientDeviceKey]
}

struct EncryptedStartHerePrepareRequest: Encodable, Equatable, Sendable {
    let previewPublicId: String
}

struct EncryptedStartHerePreparationRecord: Decodable, Equatable, Sendable {
    let publicId: String
    let previewPublicId: String
    let createdAt: String
    let expiresAt: String
    let status: String
    let cryptoVersion: String
    let sourceCommitment: String
    let contentEncryption: String
    let keyWrapping: String
    let serverCanDecrypt: Bool
    let recipientDeliveryPerformed: Bool
    var simulationOnly: Bool? = nil
    var releasePerformed: Bool? = nil
}

struct EligibleRecipientDeviceKey: Decodable, Equatable, Sendable {
    let publicId: String
    let displayName: String
    let deviceLabel: String
    let publicKey: String
}

struct HPKEKeyEnvelope: Codable, Equatable, Sendable {
    let encapsulatedKey: String
    let wrappedKey: String
}

struct RecoveryKeyEnvelope: Codable, Equatable, Sendable {
    let publicKey: String
    let encapsulatedKey: String
    let wrappedKey: String
}

struct RecipientKeyEnvelope: Codable, Equatable, Sendable {
    let keyPublicId: String
    let encapsulatedKey: String
    let wrappedKey: String
}

struct EncryptedStartHereContent: Codable, Equatable, Sendable {
    let algorithm: String
    let nonce: String
    let ciphertext: String
    let ciphertextSha256: String
}

struct EncryptedStartHereBoundaries: Codable, Equatable, Sendable {
    let serverCanDecrypt: Bool
    let recipientDeliveryPerformed: Bool
    let externalCopiesRevocable: Bool
    var simulationOnly: Bool? = nil
    var releasePerformed: Bool? = nil
}

struct EncryptedStartHereArtifact: Codable, Equatable, Sendable {
    let schemaVersion: String
    let packagePublicId: String
    let previewPublicId: String
    let createdAt: String
    let cryptoVersion: String
    let sourceCommitment: String
    let content: EncryptedStartHereContent
    let recovery: RecoveryKeyEnvelope
    let recipients: [RecipientKeyEnvelope]
    let boundaries: EncryptedStartHereBoundaries
}

struct StartHereRecoveryKit: Codable, Equatable, Sendable {
    let schemaVersion: String
    let packagePublicId: String
    let cryptoVersion: String
    let privateKey: String
    let warning: String
}

struct EncryptedStartHereFinalizeRequest: Encodable, Equatable, Sendable {
    let previewPublicId: String
    let cryptoVersion: String
    let contentNonce: String
    let contentCiphertext: String
    let ciphertextSha256: String
    let recovery: RecoveryKeyEnvelope
    let recipients: [RecipientKeyEnvelope]
    let acknowledgesOfflineRecoveryRisk: Bool
    let acknowledgesExternalCopiesNotRevocable: Bool
    var acknowledgesSyntheticRehearsalOnly: Bool? = nil
}

struct EncryptedStartHereFinalizedEnvelope: Decodable, Equatable, Sendable {
    let encryptedPackage: EncryptedStartHereFinalizedRecord
}

struct EncryptedStartHereFinalizedRecord: Decodable, Equatable, Sendable {
    let publicId: String
    let status: String
    let cryptoVersion: String
    let sourceCommitment: String
    let recipientKeyCount: Int
    let offlineRecoveryEnvelopeCreated: Bool
    let offlineRecoveryPrivateKeyReceivedByServer: Bool
    let recipientDeliveryPerformed: Bool
    let serverCanDecrypt: Bool
    let externalCopiesRevocable: Bool
}

struct EncryptedStartHereBundle: Equatable, Sendable {
    let artifact: EncryptedStartHereArtifact
    let recoveryKit: StartHereRecoveryKit
    let artifactData: Data
    let recoveryKitData: Data
    let finalizeRequest: EncryptedStartHereFinalizeRequest
}

struct RecipientRehearsalBoundaries: Codable, Equatable, Sendable {
    let simulationOnly: Bool
    let identityVerified: Bool
    let deliveryPerformed: Bool
    let releasePerformed: Bool
    let serverCanDecrypt: Bool
    let externalCopiesRevocable: Bool

    var preservesSafetyBoundary: Bool {
        simulationOnly && !identityVerified && !deliveryPerformed
            && !releasePerformed && !serverCanDecrypt && !externalCopiesRevocable
    }
}

struct RecipientRehearsalRecord: Decodable, Equatable, Sendable {
    let publicId: String
    let personPublicId: String?
    let displayName: String?
    let status: String
    let expiresAt: String
    let acceptedAt: String?
    let revokedAt: String?
    let createdAt: String?
    let simulationOnly: Bool?
}

struct RecipientRehearsalCreateRequest: Encodable, Equatable, Sendable {
    let personPublicId: String
}

struct RecipientRehearsalCreateEnvelope: Decodable, Equatable, Sendable {
    let recipientRehearsal: RecipientRehearsalRecord
    let acceptanceToken: String
    let boundaries: RecipientRehearsalBoundaries
}

struct RecipientRehearsalAcceptRequest: Encodable, Equatable, Sendable {
    let acceptanceToken: String
}

struct RecipientRehearsalAcceptEnvelope: Decodable, Equatable, Sendable {
    let recipientRehearsal: RecipientRehearsalRecord
    let sessionToken: String
    let boundaries: RecipientRehearsalBoundaries
}

struct RecipientDeviceKeyMaterial: Equatable, Sendable {
    let algorithm: String
    let publicKey: String
    let privateKeyData: Data
}

struct RecipientDeviceKeyCreateRequest: Encodable, Equatable, Sendable {
    let deviceLabel: String
    let publicKey: String
}

struct RecipientDeviceKeyRecord: Decodable, Equatable, Sendable {
    let publicId: String
    let deviceLabel: String
    let publicKey: String
    let status: String
    let createdAt: String
    let revokedAt: String?
    let simulationOnly: Bool
}

struct RecipientDeviceKeyEnvelope: Decodable, Equatable, Sendable {
    let deviceKey: RecipientDeviceKeyRecord
    let boundaries: RecipientRehearsalBoundaries
}

struct RecipientEncryptedStartHereArtifact: Codable, Equatable, Sendable {
    let schemaVersion: String
    let packagePublicId: String
    let previewPublicId: String
    let createdAt: String
    let cryptoVersion: String
    let sourceCommitment: String
    let content: EncryptedStartHereContent
    let recipients: [RecipientKeyEnvelope]
    let boundaries: RecipientRehearsalBoundaries
}

struct RecipientRehearsalFinalizedEnvelope: Decodable, Equatable, Sendable {
    struct Record: Decodable, Equatable, Sendable {
        let publicId: String
        let status: String
        let cryptoVersion: String
        let sourceCommitment: String
        let recipientKeyCount: Int
        let serverCanDecrypt: Bool
        let simulationOnly: Bool
        let releasePerformed: Bool
    }

    let encryptedPackage: Record
    let boundaries: RecipientRehearsalBoundaries
}

struct Readiness: Decodable, Equatable, Sendable {
    let totalMatters: Int
    let readyMatters: Int
    let assignedOutcomes: Int
    let confirmedContacts: Int
    let completedOfficialChecks: Int
    let completedSimulations: Int
    let verifiedEmergencyPlan: Bool
    let confirmationEvidenceMayBeSimulated: Bool
}

struct OverviewSnapshot: Decodable, Equatable, Sendable {
    let session: SessionInfo
    let plan: Plan
    let matters: [Matter]
    let trustedContacts: [TrustedContact]
    let readiness: Readiness

    var readyCount: Int {
        matters.lazy.filter(\.isReady).count
    }

    var progressTotal: Int {
        max(5, matters.count)
    }

    var nextMatter: Matter? {
        matters.first(where: { !$0.isReady })
    }

    var primaryTrustedContact: TrustedContact? {
        trustedContacts.first
    }
}

struct SessionEnvelope: Decodable, Sendable {
    let plannerPublicId: String
    let authenticationMode: String
    let authenticationMethods: [String]
    let authenticatedAt: String?

    var value: SessionInfo {
        SessionInfo(
            plannerPublicId: plannerPublicId,
            authenticationMode: authenticationMode,
            authenticationMethods: authenticationMethods,
            authenticatedAt: authenticatedAt
        )
    }
}

struct PlanEnvelope: Decodable, Sendable {
    let plan: Plan
}

struct MattersEnvelope: Decodable, Sendable {
    let matters: [Matter]
    let nextCursor: String?
}

struct TrustedContactsEnvelope: Decodable, Sendable {
    let trustedContacts: [TrustedContact]
}

struct ReadinessEnvelope: Decodable, Sendable {
    let readiness: Readiness
}
