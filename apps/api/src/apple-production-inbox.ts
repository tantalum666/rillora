import type { PoolClient } from 'pg';
import { withCommerceInboxDatabase, type DatabasePool } from './db.js';
import { appleReceiptSchema, type AppleProductionSignal } from './apple-production-evidence.js';
import { ApiError } from './errors.js';
import { appleProductionContext, assertAppleContext, type AppleExecutionContext } from './apple-execution-context.js';

const maximumAttempts = 12;
type Owner = { plannerId: string; commerceAccountReference: string };
export type AppleDelivery = Readonly<{
  publicId: string; status: string; accountReference: string | null;
  signal: AppleProductionSignal; leaseToken: string | null; attempts: number;
}>;
type InboxRow = {
  public_id: string; processing_status: string; commerce_account_reference: string | null;
  provider_environment: 'production' | 'sandbox';
  provider_event_reference: string; event_type: string; signal_type: AppleProductionSignal['signalType'];
  provider_subscription_reference: string | null; provider_transaction_reference: string | null;
  provider_refund_reference: string | null; account_binding_reference: string | null;
  payload_sha256: Buffer; provider_occurred_at: Date; verified_receipt: unknown;
  lease_token: string | null; work_attempts: number;
};

/** Small durable transport queue. It knows ownership and retries, never grants access. */
export class AppleProductionInbox {
  constructor(private readonly pool: DatabasePool, readonly context: AppleExecutionContext = appleProductionContext) { assertAppleContext(context); }

  async receive(signal: AppleProductionSignal, authenticated?: { plannerId: string; plannerPublicId: string }): Promise<AppleDelivery> {
    if (signal.provider !== 'storekit' || signal.providerEnvironment !== this.context.environment
      || !signal.signatureVerified || signal.verificationMode !== 'apple_server_library_x5c') throw new Error('Unverified Apple delivery');
    return withCommerceInboxDatabase(this.pool, async client => {
      const owner = await findApplePurchaseOwner(client, signal, this.context);
      if (authenticated && (!owner || owner.plannerId !== authenticated.plannerId)) {
        throw new ApiError(409, 'apple_account_not_bound', 'This purchase is not bound to your current Rillora account.');
      }
      if (owner) await bindObjects(client, signal, owner.commerceAccountReference, this.context);
      const status = signal.signalType === 'unsupported' ? 'ignored' : owner ? 'needs_authoritative_snapshot' : this.context.validationOnly ? 'ignored' : 'needs_mapping';
      const result = await client.query<InboxRow>(`insert into app.commerce_provider_event_inbox(
          provider_code,provider_environment,provider_event_reference,event_type,signal_type,
          commerce_account_reference,provider_subscription_reference,provider_transaction_reference,
          provider_refund_reference,account_binding_reference,payload_sha256,signature_verified,
          provider_occurred_at,processing_status,verified_receipt,processed_at,apple_intake_version)
        values('storekit',$13,$1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,
          case when $11='ignored' then now() else null end,'verified-status-v1')
        on conflict(provider_code,provider_environment,provider_event_reference) do update
          set attempt_count=app.commerce_provider_event_inbox.attempt_count+1
          where app.commerce_provider_event_inbox.apple_intake_version='verified-status-v1'
            and app.commerce_provider_event_inbox.payload_sha256=excluded.payload_sha256
            and app.commerce_provider_event_inbox.account_binding_reference is not distinct from excluded.account_binding_reference
        returning *`, [signal.providerEventReference, signal.sourceEventType, signal.signalType,
        owner?.commerceAccountReference ?? null, signal.providerSubscriptionReference, signal.providerTransactionReference,
        signal.providerRefundReference, signal.accountBindingReference ?? null, Buffer.from(signal.payloadSha256, 'base64url'),
        signal.occurredAt, status, signal.receipt, this.context.environment]);
      if (!result.rows[0]) throw new ApiError(409, 'apple_delivery_conflict', 'The Apple delivery conflicts with its previous evidence.');
      return delivery(result.rows[0]);
    });
  }

  async claim(publicId?: string, refreshApplied = false): Promise<AppleDelivery | null> {
    return withCommerceInboxDatabase(this.pool, async client => {
      // Serialize only the short claim operation, not the provider request. This also
      // prevents two processes leasing different events for the same subscription.
      await client.query("select pg_advisory_xact_lock(hashtextextended('apple-claim:' || $1,0))", [this.context.environment]);
      await client.query(`update app.commerce_provider_event_inbox set processing_status='failed',
        last_error_code='apple_worker_attempts_exhausted',lease_token=null,lease_until=null,processed_at=now()
        where provider_code='storekit' and provider_environment=$2 and apple_intake_version='verified-status-v1'
          and processing_status='processing' and lease_until<now() and work_attempts>=$1`, [maximumAttempts,this.context.environment]);
      const candidate = (await client.query<InboxRow>(`select i.* from app.commerce_provider_event_inbox i
        where i.provider_code='storekit' and i.provider_environment=$4 and i.apple_intake_version='verified-status-v1'
          and ($1::uuid is null or i.public_id=$1::uuid)
          and ((i.processing_status in ('received','needs_mapping','needs_authoritative_snapshot','processing')
            and i.work_attempts<$3 and i.next_attempt_at<=now())
            or ($1::uuid is not null and $2 and i.processing_status='applied'))
          and (i.lease_until is null or i.lease_until<now())
          and not exists(select 1 from app.commerce_provider_event_inbox other
            where other.provider_code='storekit' and other.provider_environment=$4 and other.apple_intake_version='verified-status-v1'
              and other.id<>i.id and other.provider_subscription_reference=i.provider_subscription_reference
              and other.lease_until>now())
        order by i.next_attempt_at,i.id limit 1 for update of i skip locked`,
      [publicId ?? null, refreshApplied, maximumAttempts, this.context.environment])).rows[0];
      if (!candidate) return null;
      const claimed = (await client.query<InboxRow>(`update app.commerce_provider_event_inbox
        set processing_status='processing',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',
          work_attempts=case when processing_status='applied' then 1 else work_attempts+1 end,
          last_attempt_at=now(),processed_at=null
        where public_id=$1 returning *`, [candidate.public_id])).rows[0]!;
      return delivery(claimed);
    });
  }

  async bindClaim(job: AppleDelivery): Promise<AppleDelivery | null> {
    return withCommerceInboxDatabase(this.pool, async client => {
      const owner = await findApplePurchaseOwner(client, job.signal, this.context);
      await requireAppleLease(client, job, this.context);
      if (!owner) return null;
      if (job.accountReference && job.accountReference !== owner.commerceAccountReference) throw new Error('Apple delivery owner changed');
      await bindObjects(client, job.signal, owner.commerceAccountReference, this.context);
      await client.query(`update app.commerce_provider_event_inbox set commerce_account_reference=$2
        where public_id=$1 and lease_token=$3`, [job.publicId, owner.commerceAccountReference, job.leaseToken]);
      return { ...job, accountReference: owner.commerceAccountReference };
    });
  }

  async retry(job: AppleDelivery, reason: 'apple_account_unavailable' | 'apple_snapshot_retry'): Promise<void> {
    await withCommerceInboxDatabase(this.pool, client => client.query(`update app.commerce_provider_event_inbox
      set processing_status=case when work_attempts>=$4 then 'failed'
          when $3='apple_account_unavailable' then 'needs_mapping' else 'needs_authoritative_snapshot' end,
        next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,least(work_attempts,7))::integer)),
        last_error_code=$3,lease_token=null,lease_until=null,
        processed_at=case when work_attempts>=$4 then now() else null end
      where public_id=$1 and lease_token=$2 and provider_environment=$5`, [job.publicId, job.leaseToken, reason, maximumAttempts,this.context.environment]));
  }

  async health(): Promise<{ pending: number; failed: number; oldestPendingSeconds: number }> {
    return withCommerceInboxDatabase(this.pool, async client => {
      const row = (await client.query(`select
          count(*) filter(where processing_status not in ('applied','ignored','failed'))::int as pending,
          count(*) filter(where processing_status='failed')::int as failed,
          coalesce(extract(epoch from now()-min(received_at) filter(
            where processing_status not in ('applied','ignored','failed'))),0)::float8 as oldest
        from app.commerce_provider_event_inbox where provider_code='storekit' and provider_environment=$1 and apple_intake_version='verified-status-v1'`, [this.context.environment])).rows[0];
      return { pending: row.pending, failed: row.failed, oldestPendingSeconds: Math.max(0, row.oldest) };
    });
  }
}

export async function requireAppleLease(client: PoolClient, job: AppleDelivery, context: AppleExecutionContext = appleProductionContext): Promise<void> {
  assertAppleContext(context);
  if (!job.leaseToken || !(await client.query(`select 1 from app.commerce_provider_event_inbox
    where public_id=$1 and provider_code='storekit' and provider_environment=$3
      and apple_intake_version='verified-status-v1' and processing_status='processing' and lease_token=$2 and lease_until>now() for update`,
  [job.publicId, job.leaseToken, context.environment])).rowCount) throw new Error('Apple delivery lease expired');
}

export async function findApplePurchaseOwner(client: PoolClient, signal: AppleProductionSignal, context: AppleExecutionContext): Promise<Owner | null> {
  if (!signal.accountBindingReference) return null;
  await client.query("set local lock_timeout = '250ms'");
  let rows: Array<{planner_id:string;commerce_account_reference:string}>;
  try { rows = (await client.query<{ planner_id: string; commerce_account_reference: string }>(
    'select planner_id::text,commerce_account_reference::text from app.resolve_apple_purchase_owner($1::uuid,$2,$3,$4::jsonb)',
    [signal.accountBindingReference,context.environment,signal.providerSubscriptionReference,signal.receipt])).rows; }
  catch(error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '55P03') {
      throw new ApiError(503,'apple_reconciliation_busy','This purchase is being checked. Try again shortly.');
    }
    throw error;
  }
  if (rows.length !== 1) return null;
  return { plannerId: rows[0]!.planner_id, commerceAccountReference: rows[0]!.commerce_account_reference };
}

async function bindObjects(client: PoolClient, signal: AppleProductionSignal, account: string, context: AppleExecutionContext): Promise<void> {
  const objects = [['original_transaction', signal.providerSubscriptionReference], ['transaction', signal.providerTransactionReference]] as const;
  // One original can equal its first transaction; the table intentionally owns the
  // reference once. Sorting also prevents opposite-order lock acquisition.
  for (const [kind, reference] of [...objects].sort((a, b) => (a[1] ?? '').localeCompare(b[1] ?? ''))) {
    if (!reference) continue;
    await client.query(`insert into app.commerce_provider_object_links(provider_code,provider_environment,
      provider_object_type,provider_object_reference,commerce_account_reference)
      values('storekit',$4,$1,$2,$3) on conflict(provider_code,provider_environment,provider_object_reference) do nothing`, [kind, reference, account,context.environment]);
    if (!(await client.query(`select 1 from app.commerce_provider_object_links where provider_code='storekit'
      and provider_environment=$3 and provider_object_reference=$1 and commerce_account_reference=$2`,
    [reference, account,context.environment])).rowCount) throw new ApiError(409, 'apple_purchase_owner_conflict', 'This purchase belongs to a different Rillora account.');
  }
}

function delivery(row: InboxRow): AppleDelivery {
  return { publicId: row.public_id, status: row.processing_status, accountReference: row.commerce_account_reference,
    leaseToken: row.lease_token, attempts: row.work_attempts,
    signal: { provider: 'storekit', providerEnvironment: row.provider_environment, providerEventReference: row.provider_event_reference,
      sourceEventType: row.event_type, signalType: row.signal_type, occurredAt: row.provider_occurred_at.toISOString(),
      providerSubscriptionReference: row.provider_subscription_reference, providerTransactionReference: row.provider_transaction_reference,
      providerRefundReference: row.provider_refund_reference, accountBindingReference: row.account_binding_reference,
      payloadSha256: row.payload_sha256.toString('base64url'), signatureVerified: true,
      verificationMode: 'apple_server_library_x5c', requiresAuthoritativeSnapshot: true,
      receipt: row.verified_receipt == null ? null : appleReceiptSchema.parse(row.verified_receipt) } };
}
