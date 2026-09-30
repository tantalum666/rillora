export declare const appleReviewSecretArnPattern: RegExp;
export declare const appleProductionSecretArnPattern: RegExp;
export declare function parseAppleReviewSecret(raw: string): {
    schemaVersion: 1;
    environment: "production";
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
} | {
    schemaVersion: 1;
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
    environment: "sandbox";
};
export declare function parseAppleProductionSecret(raw: string): {
    schemaVersion: 1;
    environment: "production";
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
} | {
    schemaVersion: 1;
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
    environment: "sandbox";
};
export declare function loadAppleProductionSecret(secretArn: string): Promise<{
    schemaVersion: 1;
    environment: "production";
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
} | {
    schemaVersion: 1;
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
    environment: "sandbox";
}>;
export declare function loadAppleReviewSecret(secretArn: string): Promise<{
    schemaVersion: 1;
    environment: "production";
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
} | {
    schemaVersion: 1;
    bundleId: "com.rillora.ios";
    keyId: string;
    issuerId: string;
    privateKey: string;
    allowedStorefronts: string[];
    environment: "sandbox";
}>;
