import { withCommercePlannerDatabase, type DatabasePool } from './db.js';
import { appleProductionContext, assertAppleContext, requireAppleReviewEnrollment, type AppleExecutionContext } from './apple-execution-context.js';
import { ApiError } from './errors.js';
import type { AppleProductionVerification } from './apple-production-verification.js';
import type { AppleProductionSignal } from './apple-production-evidence.js';
import type { AppleProductionSnapshotAdapter } from './apple-production-server-api.js';
import { AppleProductionInbox, type AppleDelivery } from './apple-production-inbox.js';
import { commitAppleObservation } from './apple-production-ledger.js';

type IntakeResult = Readonly<{ accepted: true; status: 'applied' | 'pending';
  finishAuthorized: boolean; authoritativeSnapshotLoaded: boolean; entitlementChanged: boolean }>;

export class AppleProductionIntake {
  private readonly inbox: AppleProductionInbox;
  constructor(private readonly pool: DatabasePool,
    private readonly verifier: Pick<AppleProductionVerification, 'verifyClientTransaction' | 'verifyNotification'>,
    private readonly snapshots: Pick<AppleProductionSnapshotAdapter, 'retrieveAuthoritativeSubscription'>,
    readonly context: AppleExecutionContext = appleProductionContext) {
    assertAppleContext(context);
    this.inbox = new AppleProductionInbox(pool, context);
  }

  async acceptClientTransaction(input: { plannerId: string; plannerPublicId: string; signedTransaction: string }): Promise<IntakeResult> {
    await withCommercePlannerDatabase(this.pool, input.plannerId, client => requireAppleReviewEnrollment(client, this.context));
    let signal: AppleProductionSignal;
    try { signal = await this.verifier.verifyClientTransaction({ signedTransaction: input.signedTransaction,
      expectedAppAccountToken: input.plannerPublicId }); }
    catch { throw new ApiError(400, 'apple_transaction_rejected', 'The Apple-signed transaction could not be verified.'); }
    if (!signal.receipt || !signal.providerSubscriptionReference || !signal.providerTransactionReference
      || signal.accountBindingReference !== input.plannerPublicId.toLowerCase()) {
      throw new ApiError(400, 'apple_transaction_rejected', 'The Apple-signed transaction is missing its account binding.');
    }
    const reservation = await this.inbox.receive(signal, input);
    // Even an already-applied receipt must refresh current provider state on restore.
    const job = await this.inbox.claim(reservation.publicId, true);
    const applied = job ? await this.process(job) : null;
    return { accepted: true, status: applied ? 'applied' : 'pending', finishAuthorized: applied !== null,
      authoritativeSnapshotLoaded: applied !== null, entitlementChanged: applied?.entitlementChanged ?? false };
  }

  async acceptNotification(signedPayload: string): Promise<{ received: true; status: string }> {
    let signal: AppleProductionSignal;
    try { signal = await this.verifier.verifyNotification(signedPayload); }
    catch { throw new ApiError(400, 'apple_notification_rejected', 'The Apple notification could not be verified.'); }
    const reservation = await this.inbox.receive(signal);
    // A 200 means the verified signal is durably queued, not that it granted access.
    return { received: true, status: reservation.status };
  }

  async retryPending(limit = 20): Promise<{ attempted: number; applied: number; pending: number; failed: number; oldestPendingSeconds: number }> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Apple retry batch exceeds its bound');
    let attempted = 0, applied = 0;
    const deadline = Date.now() + 45_000;
    while (attempted < limit && Date.now() < deadline) {
      const job = await this.inbox.claim();
      if (!job) break;
      attempted++;
      if (await this.process(job)) applied++;
    }
    return { attempted, applied, ...await this.inbox.health() };
  }

  private async process(job: AppleDelivery): Promise<{ entitlementChanged: boolean } | null> {
    let reason: 'apple_account_unavailable' | 'apple_snapshot_retry' = 'apple_account_unavailable';
    try {
      const bound = await this.inbox.bindClaim(job);
      if (!bound?.accountReference || !bound.signal.accountBindingReference || !bound.signal.providerSubscriptionReference) {
        await this.inbox.retry(job, reason);
        return null;
      }
      reason = 'apple_snapshot_retry';
      const snapshot = await this.snapshots.retrieveAuthoritativeSubscription({
        anyTransactionId: bound.signal.providerTransactionReference ?? bound.signal.providerSubscriptionReference,
        providerSubscriptionReference: bound.signal.providerSubscriptionReference,
        expectedAppAccountToken: bound.signal.accountBindingReference,
        expectedCommerceAccountReference: bound.accountReference,
      });
      return await commitAppleObservation(this.pool, bound, snapshot, this.context);
    } catch {
      // Provider bodies/JWS/credentials never enter logs or the durable error field.
      // If the database itself is unavailable, let retry recording fail and leave
      // the lease reclaimable. Never authorize finish after an ambiguous commit.
      await this.inbox.retry(job, reason);
      return null;
    }
  }
}
