import { SignedDataVerifier, type JWSRenewalInfoDecodedPayload, type JWSTransactionDecodedPayload, type ResponseBodyV2DecodedPayload } from "@apple/app-store-server-library";
import type { NormalizedProviderSignal } from "./commerce-provider-contract.js";
export declare const rilloraAppleSandboxContract: Readonly<{
    bundleId: "com.rillora.ios";
    appAppleId: 6803957639;
    subscriptionGroupId: "22325627";
    productIds: Set<string>;
    storefrontCountryCodes: Set<string>;
}>;
export type AppleStoreKitValidationContract = Readonly<{
    bundleId: string;
    appAppleId: number;
    subscriptionGroupId: string;
    productIds: ReadonlySet<string>;
    storefrontCountryCodes: ReadonlySet<string>;
}>;
export interface AppleSignedDataVerifying {
    verifyAndDecodeNotification(signedPayload: string): Promise<ResponseBodyV2DecodedPayload>;
    verifyAndDecodeTransaction(signedTransactionInfo: string): Promise<JWSTransactionDecodedPayload>;
    verifyAndDecodeRenewalInfo(signedRenewalInfo: string): Promise<JWSRenewalInfoDecodedPayload>;
}
export type VerifiedAppleSandboxSubscriptionStatus = Readonly<{
    transaction: JWSTransactionDecodedPayload;
    renewal: JWSRenewalInfoDecodedPayload;
}>;
export declare function createRilloraAppleSandboxVerifier(input: {
    rootCertificateDirectory: string;
    enableOnlineChecks?: boolean;
}): Promise<SignedDataVerifier>;
export declare function loadPinnedAppleRootCertificates(rootCertificateDirectory: string): Promise<Buffer[]>;
export declare function verifyAppleSandboxNotification(input: {
    signedPayload: string;
    verifier: AppleSignedDataVerifying;
    contract?: AppleStoreKitValidationContract;
}): Promise<NormalizedProviderSignal>;
export declare function verifyAppleSandboxClientTransaction(input: {
    signedTransaction: string;
    verifier: AppleSignedDataVerifying;
    expectedAppAccountToken: string;
    expectedStorefrontCountryCode: string;
    contract?: AppleStoreKitValidationContract;
}): Promise<NormalizedProviderSignal>;
export declare function verifyAppleSandboxSubscriptionStatus(input: {
    signedTransaction: string;
    signedRenewalInfo: string;
    verifier: AppleSignedDataVerifying;
    expectedOriginalTransactionId: string;
    expectedAppAccountToken: string;
    contract?: AppleStoreKitValidationContract;
}): Promise<VerifiedAppleSandboxSubscriptionStatus>;
