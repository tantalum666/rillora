import { type DatabasePool } from "./db.js";
type OverviewSession = {
    plannerPublicId: string;
    authenticationMode: string;
    authenticationMethods: string[];
    authenticatedAt: Date | string | null;
};
export declare function fetchInitialOverview(pool: DatabasePool, plannerId: string, session: OverviewSession): Promise<{
    session: OverviewSession;
    plan: {
        publicId: string;
        motivation: string | null;
        status: string;
        firstUseState: string;
        firstUseStep: number;
        policyVersion: string;
        lastReviewedAt: Date | null;
        reviewDueAt: Date | null;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    };
    matters: {
        publicId: string;
        category: string;
        details: Record<string, string>;
        notes: string | null;
        title: string;
        institutionName: string | null;
        accountHint: string | null;
        valueBand: string;
        currencyCode: string | null;
        locationHint: string | null;
        importance: string;
        desiredOutcome: string;
        status: string;
        reviewDueAt: Date | null;
        version: number;
        createdAt: Date;
        updatedAt: Date;
        archivedAt: Date | null;
    }[];
    nextCursor: string | null;
    trustedContacts: {
        publicId: string;
        displayName: string;
        relationshipLabel: string | null;
        status: string;
        roleStatus: string | null;
        invitationStatus: string | null;
        confirmationMode: string | null;
        version: number;
        createdAt: Date;
        updatedAt: Date;
    }[];
    readiness: {
        totalMatters: number;
        readyMatters: number;
        assignedOutcomes: number;
        confirmedContacts: number;
        completedOfficialChecks: number;
        completedSimulations: number;
        verifiedEmergencyPlan: boolean;
        confirmationEvidenceMayBeSimulated: boolean;
    };
}>;
export {};
