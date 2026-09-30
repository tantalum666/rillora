import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
declare const eventSchema: z.ZodObject<{
    key: z.ZodString;
    kind: z.ZodEnum<{
        account: "account";
        connection: "connection";
        free_slot: "free_slot";
        matter: "matter";
        person: "person";
        retention_hold: "retention_hold";
        unreconciled_access: "unreconciled_access";
    }>;
    id: z.ZodUUID;
    revision: z.ZodString;
    recordedAt: z.ZodString;
    facts: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strict>;
export type RecoveryControl = z.infer<typeof eventSchema>;
export interface RecoveryJournalPublisher {
    publish(event: RecoveryControl): Promise<void>;
    checkCoverage?(generation: string): Promise<void>;
}
export declare function configureRecoveryPool(pool: Pool, publisher: RecoveryJournalPublisher): void;
export declare const recoveryCommerceInventorySchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    manualAccess: z.ZodBoolean;
    subscriptions: z.ZodArray<z.ZodObject<{
        provider: z.ZodEnum<{
            alipay: "alipay";
            local_web: "local_web";
            paddle: "paddle";
            storekit: "storekit";
            stripe: "stripe";
            unionpay: "unionpay";
            wechat: "wechat";
        }>;
        environment: z.ZodEnum<{
            internal: "internal";
            production: "production";
            sandbox: "sandbox";
            test: "test";
        }>;
        reference: z.ZodNullable<z.ZodString>;
        account: z.ZodUUID;
        customer: z.ZodNullable<z.ZodString>;
        market: z.ZodString;
        plane: z.ZodString;
        acquisition: z.ZodEnum<{
            migration: "migration";
            preview: "preview";
            purchased: "purchased";
            support_override: "support_override";
        }>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type RecoverySubscriptionReference = z.infer<typeof recoveryCommerceInventorySchema>['subscriptions'][number];
export declare function parseRecoveryControl(input: unknown): RecoveryControl;
/** No bodies/tokens/addresses are accepted from request input. SQL produces the metadata. */
export declare class DynamoRecoveryJournal implements RecoveryJournalPublisher {
    private table;
    private namespace;
    private client;
    constructor(table: string, namespace: string, client?: DynamoDBClient);
    checkCoverage(generation: string): Promise<void>;
    publish(input: RecoveryControl): Promise<void>;
}
export declare function recoveryPublisherFromEnvironment(): RecoveryJournalPublisher | null;
export declare function checkRecoveryJournal(pool: Pool): Promise<void>;
export declare function publishRecoveryTransaction(pool: Pool, client: PoolClient): Promise<void>;
export {};
