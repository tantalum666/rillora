import { Environment } from '@apple/app-store-server-library';
import type { PoolClient } from 'pg';
import { ApiError } from './errors.js';

/** Selected by the configured server route, never by an unverified receipt. */
export type AppleExecutionContext = Readonly<{
  environment: 'production' | 'sandbox';
  signedEnvironment: Environment.PRODUCTION | Environment.SANDBOX;
  validationOnly: boolean;
}>;
export const appleProductionContext: AppleExecutionContext = Object.freeze({
  environment: 'production', signedEnvironment: Environment.PRODUCTION, validationOnly: false,
});
export const appleReviewContext: AppleExecutionContext = Object.freeze({
  environment: 'sandbox', signedEnvironment: Environment.SANDBOX, validationOnly: true,
});

export function assertAppleContext(context: AppleExecutionContext): void {
  if (context !== appleProductionContext && context !== appleReviewContext) {
    throw new Error('Apple execution requires a configured immutable context');
  }
}

export function matchesAppleAppId(value: number | undefined, expected: number,
  context: AppleExecutionContext): boolean {
  // Apple may omit appAppleId in Sandbox. Bundle/group/product and signatures
  // remain mandatory; the production requirement is unchanged.
  return value === expected || (context.validationOnly && value === undefined);
}

export async function requireAppleReviewEnrollment(client: PoolClient,
  context: AppleExecutionContext): Promise<void> {
  assertAppleContext(context);
  if (context.validationOnly && !(await client.query(
    'select app.apple_review_account_enabled(app.current_planner_id()) as enabled')).rows[0]?.enabled) {
    throw new ApiError(403, 'apple_review_not_enrolled', 'This account is not enrolled for Apple purchase testing.');
  }
}
