import { SignedDataVerifier, type JWSTransactionDecodedPayload, type JWSRenewalInfoDecodedPayload } from '@apple/app-store-server-library';
import { type AppleSignedDataVerifying } from './apple-storekit-adapter.js';
import { type AppleProductionSignal } from './apple-production-evidence.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
export declare const rilloraAppleIdentity: Readonly<{
    bundleId: "com.rillora.ios";
    appAppleId: 6803957639;
    subscriptionGroupId: "22325627";
    annualProductId: "com.rillora.family.annual";
    historicalMonthlyProductId: "com.rillora.family.monthly";
}>;
export declare function createRilloraAppleProductionVerifier(rootCertificateDirectory: string): Promise<SignedDataVerifier>;
export declare function createRilloraAppleReviewVerifier(rootCertificateDirectory: string): Promise<SignedDataVerifier>;
/** One strict verifier per configured environment; no receipt-driven fallback. */
export declare class AppleProductionVerification {
    private readonly source;
    readonly context: AppleExecutionContext;
    private readonly storefronts;
    constructor(source: AppleSignedDataVerifying | Promise<AppleSignedDataVerifying>, allowedStorefronts: ReadonlySet<string>, context?: AppleExecutionContext);
    verifyClientTransaction(input: {
        signedTransaction: string;
        expectedAppAccountToken: string;
    }): Promise<AppleProductionSignal>;
    verifyNotification(signedPayload: string): Promise<AppleProductionSignal>;
    verifySubscriptionStatus(input: {
        signedTransaction: string;
        signedRenewalInfo: string;
        expectedOriginalTransactionId: string;
        expectedAppAccountToken: string;
    }): Promise<{
        transaction: JWSTransactionDecodedPayload;
        renewal: JWSRenewalInfoDecodedPayload;
    }>;
    private transaction;
    private renewal;
    private signal;
}
