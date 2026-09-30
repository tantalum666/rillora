import { Environment } from '@apple/app-store-server-library';
import type { PoolClient } from 'pg';
/** Selected by the configured server route, never by an unverified receipt. */
export type AppleExecutionContext = Readonly<{
    environment: 'production' | 'sandbox';
    signedEnvironment: Environment.PRODUCTION | Environment.SANDBOX;
    validationOnly: boolean;
}>;
export declare const appleProductionContext: AppleExecutionContext;
export declare const appleReviewContext: AppleExecutionContext;
export declare function assertAppleContext(context: AppleExecutionContext): void;
export declare function matchesAppleAppId(value: number | undefined, expected: number, context: AppleExecutionContext): boolean;
export declare function requireAppleReviewEnrollment(client: PoolClient, context: AppleExecutionContext): Promise<void>;
