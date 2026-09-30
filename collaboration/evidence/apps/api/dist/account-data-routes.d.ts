import type { AppConfig } from "./config.js";
import { z } from "zod";
import { type DatabasePool } from "./db.js";
export declare const mapBackupSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"rillora-map-backup-v1">;
    createdAt: z.ZodString;
    owner: z.ZodObject<{
        displayName: z.ZodString;
    }, z.core.$strip>;
    plan: z.ZodObject<{
        motivation: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            complex_digital_life: "complex_digital_life";
            cross_border: "cross_border";
            family_responsibility: "family_responsibility";
            general_preparedness: "general_preparedness";
            life_change: "life_change";
            other: "other";
            recent_estate_experience: "recent_estate_experience";
        }>>>;
    }, z.core.$strip>;
    matters: z.ZodArray<z.ZodObject<{
        publicId: z.ZodUUID;
        category: z.ZodEnum<{
            account: "account";
            crypto_asset: "crypto_asset";
            debt: "debt";
            device: "device";
            document: "document";
            financial_asset: "financial_asset";
            subscription: "subscription";
        }>;
        title: z.ZodString;
        institutionName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        locationHint: z.ZodOptional<z.ZodNullable<z.ZodString>>;
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
        status: z.ZodEnum<{
            archived: "archived";
            draft: "draft";
            needs_review: "needs_review";
            ready: "ready";
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
        archivedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    people: z.ZodArray<z.ZodObject<{
        publicId: z.ZodUUID;
        displayName: z.ZodString;
        relationshipLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        status: z.ZodEnum<{
            archived: "archived";
            confirmed: "confirmed";
            draft: "draft";
            invited: "invited";
            revoked: "revoked";
        }>;
        archivedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    roles: z.ZodArray<z.ZodObject<{
        personPublicId: z.ZodUUID;
        matterPublicId: z.ZodNullable<z.ZodUUID>;
        role: z.ZodEnum<{
            executor: "executor";
            recipient: "recipient";
            trusted_contact: "trusted_contact";
        }>;
        scope: z.ZodEnum<{
            matter_specific: "matter_specific";
            plan_wide: "plan_wide";
        }>;
        status: z.ZodEnum<{
            accepted: "accepted";
            draft: "draft";
            invited: "invited";
            revoked: "revoked";
        }>;
    }, z.core.$strip>>;
    officialChecks: z.ZodArray<z.ZodObject<{
        providerKey: z.ZodEnum<{
            apple: "apple";
            github: "github";
            google: "google";
            meta: "meta";
            password_manager: "password_manager";
        }>;
        completed: z.ZodBoolean;
        policyVersion: z.ZodString;
        completedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    boundaries: z.ZodObject<{
        containsPrivateMap: z.ZodLiteral<true>;
        restoresAccess: z.ZodLiteral<false>;
        credentialsIncluded: z.ZodLiteral<false>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare function createAccountDataRouter(pool: DatabasePool, config: AppConfig): import("express-serve-static-core").Router;
