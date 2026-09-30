import { z } from "zod";
export declare const publicIdSchema: z.ZodUUID;
export declare const serviceMarketCodeSchema: z.ZodString;
export declare const commerceStatusQuerySchema: z.ZodObject<{
    serviceMarketCode: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const purchaseRouteRequestSchema: z.ZodObject<{
    clientSurface: z.ZodEnum<{
        ios: "ios";
        web: "web";
    }>;
    serviceMarketCode: z.ZodString;
    appleStorefrontCountryCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    intent: z.ZodEnum<{
        family_capability: "family_capability";
        plan_access: "plan_access";
    }>;
}, z.core.$strict>;
export declare const stripeTestCheckoutRequestSchema: z.ZodObject<{
    billingPeriod: z.ZodEnum<{
        annual: "annual";
        monthly: "monthly";
    }>;
}, z.core.$strict>;
export declare const stripeTestIdempotencyKeySchema: z.ZodString;
export declare const matterCategorySchema: z.ZodEnum<{
    account: "account";
    crypto_asset: "crypto_asset";
    debt: "debt";
    device: "device";
    document: "document";
    financial_asset: "financial_asset";
    subscription: "subscription";
}>;
export declare const valueBandSchema: z.ZodEnum<{
    "100k_plus": "100k_plus";
    "10k_100k": "10k_100k";
    "1k_10k": "1k_10k";
    none: "none";
    under_1k: "under_1k";
    unknown: "unknown";
}>;
export declare const desiredOutcomeSchema: z.ZodEnum<{
    close: "close";
    delay_disclosure: "delay_disclosure";
    delete_request: "delete_request";
    memorialize: "memorialize";
    never_disclose: "never_disclose";
    notify: "notify";
    transfer_request: "transfer_request";
    undecided: "undecided";
}>;
export declare const planMotivationSchema: z.ZodEnum<{
    complex_digital_life: "complex_digital_life";
    cross_border: "cross_border";
    family_responsibility: "family_responsibility";
    general_preparedness: "general_preparedness";
    life_change: "life_change";
    other: "other";
    recent_estate_experience: "recent_estate_experience";
}>;
export declare const createMatterSchema: z.ZodObject<{
    requestId: z.ZodOptional<z.ZodUUID>;
    category: z.ZodEnum<{
        account: "account";
        crypto_asset: "crypto_asset";
        debt: "debt";
        device: "device";
        document: "document";
        financial_asset: "financial_asset";
        subscription: "subscription";
    }>;
    details: z.ZodDefault<z.ZodObject<{
        assetType: z.ZodOptional<z.ZodString>;
        debtType: z.ZodOptional<z.ZodString>;
        documentType: z.ZodOptional<z.ZodString>;
        deviceModel: z.ZodOptional<z.ZodString>;
        billingCycle: z.ZodOptional<z.ZodEnum<{
            annual: "annual";
            monthly: "monthly";
            other: "other";
        }>>;
        renewalDate: z.ZodOptional<z.ZodISODate>;
        cryptoCustody: z.ZodOptional<z.ZodEnum<{
            exchange: "exchange";
            self_custody: "self_custody";
        }>>;
        network: z.ZodOptional<z.ZodString>;
        walletAddress: z.ZodOptional<z.ZodString>;
        walletLabel: z.ZodOptional<z.ZodString>;
        assetSymbol: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodString;
    institutionName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    accountHint: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    valueBand: z.ZodDefault<z.ZodEnum<{
        "100k_plus": "100k_plus";
        "10k_100k": "10k_100k";
        "1k_10k": "1k_10k";
        none: "none";
        under_1k: "under_1k";
        unknown: "unknown";
    }>>;
    currencyCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locationHint: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    importance: z.ZodDefault<z.ZodEnum<{
        critical: "critical";
        important: "important";
        standard: "standard";
    }>>;
    desiredOutcome: z.ZodDefault<z.ZodEnum<{
        close: "close";
        delay_disclosure: "delay_disclosure";
        delete_request: "delete_request";
        memorialize: "memorialize";
        never_disclose: "never_disclose";
        notify: "notify";
        transfer_request: "transfer_request";
        undecided: "undecided";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        needs_review: "needs_review";
        ready: "ready";
    }>>;
}, z.core.$strict>;
export declare const updateMatterSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    category: z.ZodOptional<z.ZodEnum<{
        account: "account";
        crypto_asset: "crypto_asset";
        debt: "debt";
        device: "device";
        document: "document";
        financial_asset: "financial_asset";
        subscription: "subscription";
    }>>;
    details: z.ZodOptional<z.ZodObject<{
        assetType: z.ZodOptional<z.ZodString>;
        debtType: z.ZodOptional<z.ZodString>;
        documentType: z.ZodOptional<z.ZodString>;
        deviceModel: z.ZodOptional<z.ZodString>;
        billingCycle: z.ZodOptional<z.ZodEnum<{
            annual: "annual";
            monthly: "monthly";
            other: "other";
        }>>;
        renewalDate: z.ZodOptional<z.ZodISODate>;
        cryptoCustody: z.ZodOptional<z.ZodEnum<{
            exchange: "exchange";
            self_custody: "self_custody";
        }>>;
        network: z.ZodOptional<z.ZodString>;
        walletAddress: z.ZodOptional<z.ZodString>;
        walletLabel: z.ZodOptional<z.ZodString>;
        assetSymbol: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodString>;
    institutionName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    accountHint: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    valueBand: z.ZodOptional<z.ZodEnum<{
        "100k_plus": "100k_plus";
        "10k_100k": "10k_100k";
        "1k_10k": "1k_10k";
        none: "none";
        under_1k: "under_1k";
        unknown: "unknown";
    }>>;
    currencyCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locationHint: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    importance: z.ZodOptional<z.ZodEnum<{
        critical: "critical";
        important: "important";
        standard: "standard";
    }>>;
    desiredOutcome: z.ZodOptional<z.ZodEnum<{
        close: "close";
        delay_disclosure: "delay_disclosure";
        delete_request: "delete_request";
        memorialize: "memorialize";
        never_disclose: "never_disclose";
        notify: "notify";
        transfer_request: "transfer_request";
        undecided: "undecided";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        needs_review: "needs_review";
        ready: "ready";
    }>>;
}, z.core.$strict>;
export declare const updatePlanSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    motivation: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        complex_digital_life: "complex_digital_life";
        cross_border: "cross_border";
        family_responsibility: "family_responsibility";
        general_preparedness: "general_preparedness";
        life_change: "life_change";
        other: "other";
        recent_estate_experience: "recent_estate_experience";
    }>>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        draft: "draft";
        needs_review: "needs_review";
    }>>;
    firstUseState: z.ZodOptional<z.ZodEnum<{
        available: "available";
        completed: "completed";
        guide_in_progress: "guide_in_progress";
        guide_paused: "guide_paused";
    }>>;
    firstUseStep: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const createTrustedContactSchema: z.ZodObject<{
    displayName: z.ZodString;
    relationshipLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const updateTrustedContactSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    displayName: z.ZodOptional<z.ZodString>;
    relationshipLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        draft: "draft";
        revoked: "revoked";
    }>>;
}, z.core.$strict>;
export declare const updateOfficialSetupSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    completed: z.ZodBoolean;
}, z.core.$strict>;
export declare const createSimulationSchema: z.ZodObject<{
    lifeEvent: z.ZodEnum<{
        death: "death";
        incapacity: "incapacity";
        missing: "missing";
    }>;
}, z.core.$strict>;
export declare const createDisclosureRehearsalSchema: z.ZodObject<{
    lifeEvent: z.ZodEnum<{
        death: "death";
        incapacity: "incapacity";
        missing: "missing";
    }>;
}, z.core.$strict>;
export declare const updateDisclosureRehearsalSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    action: z.ZodEnum<{
        advance: "advance";
        appeal: "appeal";
        cancel: "cancel";
        restart_review: "restart_review";
        simulate_cooling_off_elapsed: "simulate_cooling_off_elapsed";
    }>;
    acknowledgesSimulationOnly: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare const createRoleAssignmentSchema: z.ZodObject<{
    personPublicId: z.ZodUUID;
    role: z.ZodEnum<{
        executor: "executor";
        recipient: "recipient";
        trusted_contact: "trusted_contact";
    }>;
    scope: z.ZodEnum<{
        matter_specific: "matter_specific";
        plan_wide: "plan_wide";
    }>;
    matterPublicId: z.ZodNullable<z.ZodUUID>;
    acknowledgesRecordOnly: z.ZodLiteral<true>;
    acknowledgesNoAuthority: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare const updateRoleAssignmentSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    role: z.ZodEnum<{
        executor: "executor";
        recipient: "recipient";
        trusted_contact: "trusted_contact";
    }>;
    scope: z.ZodEnum<{
        matter_specific: "matter_specific";
        plan_wide: "plan_wide";
    }>;
    matterPublicId: z.ZodNullable<z.ZodUUID>;
    acknowledgesRecordOnly: z.ZodLiteral<true>;
    acknowledgesNoAuthority: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare const createPrintableStartHereSchema: z.ZodObject<{
    previewPublicId: z.ZodUUID;
    acknowledgesPlaintext: z.ZodLiteral<true>;
    acknowledgesNoRevocation: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare const finalizeEncryptedStartHereSchema: z.ZodObject<{
    previewPublicId: z.ZodUUID;
    cryptoVersion: z.ZodLiteral<"rillora-hpke-v1">;
    contentNonce: z.ZodString;
    contentCiphertext: z.ZodString;
    ciphertextSha256: z.ZodString;
    recovery: z.ZodObject<{
        encapsulatedKey: z.ZodString;
        wrappedKey: z.ZodString;
        publicKey: z.ZodString;
    }, z.core.$strict>;
    recipients: z.ZodArray<z.ZodObject<{
        encapsulatedKey: z.ZodString;
        wrappedKey: z.ZodString;
        keyPublicId: z.ZodUUID;
    }, z.core.$strict>>;
    acknowledgesOfflineRecoveryRisk: z.ZodLiteral<true>;
    acknowledgesExternalCopiesNotRevocable: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare const createRecipientRehearsalSchema: z.ZodObject<{
    personPublicId: z.ZodUUID;
}, z.core.$strict>;
export declare const acceptRecipientRehearsalSchema: z.ZodObject<{
    acceptanceToken: z.ZodString;
}, z.core.$strict>;
export declare const enrollRecipientDeviceKeySchema: z.ZodObject<{
    deviceLabel: z.ZodString;
    publicKey: z.ZodString;
}, z.core.$strict>;
export declare const finalizeRecipientRehearsalPackageSchema: z.ZodObject<{
    previewPublicId: z.ZodUUID;
    cryptoVersion: z.ZodLiteral<"rillora-hpke-v1">;
    contentNonce: z.ZodString;
    contentCiphertext: z.ZodString;
    ciphertextSha256: z.ZodString;
    recovery: z.ZodObject<{
        encapsulatedKey: z.ZodString;
        wrappedKey: z.ZodString;
        publicKey: z.ZodString;
    }, z.core.$strict>;
    recipients: z.ZodArray<z.ZodObject<{
        encapsulatedKey: z.ZodString;
        wrappedKey: z.ZodString;
        keyPublicId: z.ZodUUID;
    }, z.core.$strict>>;
    acknowledgesOfflineRecoveryRisk: z.ZodLiteral<true>;
    acknowledgesExternalCopiesNotRevocable: z.ZodLiteral<true>;
    acknowledgesSyntheticRehearsalOnly: z.ZodLiteral<true>;
}, z.core.$strict>;
export declare function findForbiddenSecretField(value: unknown): string | null;
