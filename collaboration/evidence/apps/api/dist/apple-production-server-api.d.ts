import { AppStoreServerAPIClient } from '@apple/app-store-server-library';
import { type RequestInit, type Response } from 'node-fetch';
import { type AppleReceiptEvidence } from './apple-production-evidence.js';
import { ApplePriceBindings } from './apple-price-bindings.js';
import { AppleProductionVerification } from './apple-production-verification.js';
import type { AppleAppStoreServerApi } from './apple-storekit-server-api.js';
import type { AuthoritativeSubscriptionSnapshot } from './commerce-provider-contract.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
export type AppleSubscriptionLookup = Readonly<{
    anyTransactionId: string;
    providerSubscriptionReference: string;
    expectedAppAccountToken: string;
    expectedCommerceAccountReference: string;
}>;
export type AppleProductionSnapshot = AuthoritativeSubscriptionSnapshot & Readonly<{
    provider: 'storekit';
    providerEnvironment: 'production' | 'sandbox';
    priceCode: string;
    planVersion: number;
    priceBindingId: string;
    providerTransactionReference: string;
    storefrontCountryCode: string;
    currency: string;
    priceMilliunits: number;
    graceEndsAt: string | null;
    transactionSignedAt: string;
    renewalSignedAt: string;
    receipt: AppleReceiptEvidence;
}>;
type AppleHttpRequest = (url: string, options: RequestInit) => Promise<Response>;
type AppleServerCredentials = Readonly<{
    privateKey: string;
    keyId: string;
    issuerId: string;
}>;
/** Official JWT/schema handling, with a bounded, read-only production transport. */
export declare class AppleProductionServerApi extends AppStoreServerAPIClient implements AppleAppStoreServerApi {
    private readonly request;
    private readonly context;
    constructor(credentials: AppleServerCredentials, request?: AppleHttpRequest, context?: AppleExecutionContext);
    protected makeFetchRequest(path: string, query: URLSearchParams, method: string, body: string | Buffer | undefined, headers: {
        [key: string]: string;
    }): Promise<Response>;
}
/** Produces evidence only. Persistence, duplicate-provider checks and grants belong to the executor. */
export declare class AppleProductionSnapshotAdapter {
    private readonly serverApi;
    private readonly verification;
    private readonly prices;
    private readonly now;
    constructor(serverApi: AppleAppStoreServerApi, verification: AppleProductionVerification, prices: ApplePriceBindings, now?: () => Date);
    retrieveAuthoritativeSubscription(input: AppleSubscriptionLookup): Promise<AppleProductionSnapshot>;
}
export {};
