import type { Pool } from 'pg';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { type RecoveryControl } from './recovery-journal.js';
export type RecoveryCoverage = {
    version: 1;
    startedAt: string;
    databaseGeneration?: string;
};
export declare function validateRecoveryWindow(snapshotTime: string, coverage: RecoveryCoverage, clock?: number): void;
export declare function readRecoveryJournal(table: string, client?: DynamoDBClient): Promise<{
    events: {
        key: string;
        kind: "account" | "connection" | "free_slot" | "matter" | "person" | "retention_hold" | "unreconciled_access";
        id: string;
        revision: string;
        recordedAt: string;
        facts: Record<string, unknown>;
    }[];
    coverage: RecoveryCoverage;
}>;
export declare function validateRecoveryHost(host: string, sslVerified: boolean): void;
/** Only an isolated administrative clone connection may call this function. */
export declare function replayRecoveryControls(pool: Pool, events: RecoveryControl[], expectedGeneration?: string): Promise<{
    applied: number;
    sessionsInvalidated: number;
}>;
