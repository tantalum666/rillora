import { type KeyInput } from "jose";
import type { NormalizedProviderSignal } from "./commerce-provider-contract.js";
export declare function verifySyntheticStripeWebhook(input: {
    rawBody: Uint8Array;
    signatureHeader: string;
    endpointSecrets: readonly string[];
    now: Date;
    toleranceSeconds?: number;
}): NormalizedProviderSignal;
/**
 * Test-only Apple verifier. Production App Store JWS uses an x5c certificate chain
 * rooted in Apple PKI and must use Apple's Server Library or an independently reviewed
 * equivalent. This helper intentionally accepts only a pinned synthetic ES256 key.
 */
export declare function verifySyntheticAppleNotification(input: {
    signedPayload: string;
    trustedPublicKeys: ReadonlyMap<string, KeyInput>;
    expectedBundleId: string;
}): Promise<NormalizedProviderSignal>;
