#if DEBUG
import Foundation

extension OverviewSnapshot {
    static let preview = OverviewSnapshot(
        session: SessionInfo(
            plannerPublicId: "11111111-1111-4111-8111-111111111111",
            authenticationMode: "development",
            authenticationMethods: [],
            authenticatedAt: nil
        ),
        plan: Plan(
            publicId: "22222222-2222-4222-8222-222222222222",
            motivation: "complex_digital_life",
            status: "active",
            firstUseState: .completed,
            firstUseStep: 2,
            policyVersion: "initial-v1",
            lastReviewedAt: nil,
            reviewDueAt: nil,
            version: 1,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-08T00:00:00.000Z"
        ),
        matters: [
            previewMatter("Bank account", "financial_asset", "Northstar Bank", true),
            previewMatter("Cloud photos", "account", "Apple", true),
            previewMatter("GitHub projects", "account", "GitHub", true),
            previewMatter("Insurance", "document", "Harbor Mutual", false),
            previewMatter("Subscriptions", "subscription", nil, false),
        ],
        trustedContacts: [
            TrustedContact(
                publicId: "44444444-4444-4444-8444-444444444444",
                displayName: "Maya Chen",
                relationshipLabel: "Sister",
                status: "confirmed",
                roleStatus: "accepted",
                invitationStatus: "accepted",
                confirmationMode: "simulation",
                version: 1,
                createdAt: "2026-08-08T00:00:00.000Z",
                updatedAt: "2026-08-08T00:00:00.000Z"
            ),
        ],
        readiness: Readiness(
            totalMatters: 5,
            readyMatters: 3,
            assignedOutcomes: 4,
            confirmedContacts: 1,
            completedOfficialChecks: 0,
            completedSimulations: 0,
            verifiedEmergencyPlan: false,
            confirmationEvidenceMayBeSimulated: true
        )
    )

    private static func previewMatter(
        _ title: String,
        _ category: String,
        _ institution: String?,
        _ ready: Bool
    ) -> Matter {
        Matter(
            publicId: UUID().uuidString,
            category: category,
            title: title,
            institutionName: institution,
            accountHint: nil,
            valueBand: "unknown",
            currencyCode: nil,
            locationHint: nil,
            importance: "important",
            desiredOutcome: ready ? "notify" : "undecided",
            status: ready ? "ready" : "draft",
            reviewDueAt: nil,
            version: 1,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-08T00:00:00.000Z",
            archivedAt: nil
        )
    }
}
#endif

#if DEBUG
import SwiftUI

#Preview("Overview") {
    NavigationStack {
        OverviewContent(
            snapshot: .preview,
            onReviewMatters: {},
            onOpenMatter: { _ in },
            onOpenProfile: {},
            onAddFirstMatter: {},
            onOpenFirstUseGuide: {},
            onPauseFirstUse: {}
        )
            .navigationTitle("Rillora")
            .navigationBarTitleDisplayMode(.inline)
    }
}
#endif
