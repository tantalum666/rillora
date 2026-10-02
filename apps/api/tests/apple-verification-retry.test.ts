import { describe, expect, it, vi } from 'vitest';
import { VerificationException, VerificationStatus } from '@apple/app-store-server-library';
import { AppleProductionIntake } from '../src/apple-production-intake.js';
import type { DatabasePool } from '../src/db.js';

describe('Apple notification verification failure boundaries', () => {
  it.each([
    [new VerificationException(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE), 503, 'apple_verification_unavailable'],
    [new VerificationException(VerificationStatus.VERIFICATION_FAILURE), 400, 'apple_notification_rejected'],
    [{ status: VerificationStatus.RETRYABLE_VERIFICATION_FAILURE }, 400, 'apple_notification_rejected'],
  ])('keeps retryable verifier outages distinct from rejected signatures without queuing either', async (error, status, code) => {
    const connect = vi.fn();
    const pool = { connect } as unknown as DatabasePool;
    const verifier = { verifyNotification: vi.fn().mockRejectedValue(error), verifyClientTransaction: vi.fn() };
    const snapshots = { retrieveAuthoritativeSubscription: vi.fn() };
    const intake = new AppleProductionIntake(pool, verifier, snapshots);
    await expect(intake.acceptNotification('untrusted payload')).rejects.toMatchObject({ status, code, details: undefined });
    expect(connect).not.toHaveBeenCalled();
    expect(snapshots.retrieveAuthoritativeSubscription).not.toHaveBeenCalled();
  });
});
