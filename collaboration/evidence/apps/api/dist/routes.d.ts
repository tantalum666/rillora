import type { Router } from "express";
import type { PoolClient } from "pg";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
export declare function createApiRouter(pool: DatabasePool, config: AppConfig): Router;
export type StartHerePackageSnapshot = {
    schemaVersion: "start-here-v1";
    audience?: {
        kind: "owner" | "recipient";
        connectionPublicId: string | null;
        name: string | null;
        version: number | null;
    };
    planner: {
        display_name: string;
        locale: string;
        time_zone: string;
    };
    plan: {
        status: string;
    };
    matters: Array<{
        publicId: string;
        category: string;
        title: string;
        institutionName: string | null;
        locationHint: string | null;
        desiredOutcome: string | null;
        status: string | null;
    }>;
    trustedContacts: Array<{
        displayName: string;
        relationshipLabel: string | null;
    }>;
    directionsNotPasswords: true;
    legalAuthorityNotGranted: true;
};
export declare function collectStartHerePackage(client: PoolClient, connectionPublicId?: string | null): Promise<StartHerePackageSnapshot>;
export declare function startHereSnapshotCommitment(snapshot: StartHerePackageSnapshot): Buffer;
