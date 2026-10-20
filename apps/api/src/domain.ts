import { z } from "zod";
import { matterDetailsSchema, validateMatterRequirements } from "./matter-details.js";

export const publicIdSchema = z.uuid();

export const serviceMarketCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]{1,39}$/);

export const commerceStatusQuerySchema = z
  .object({
    serviceMarketCode: serviceMarketCodeSchema.optional(),
  })
  .strict();

export const purchaseRouteRequestSchema = z
  .object({
    clientSurface: z.enum(["web", "ios"]),
    serviceMarketCode: serviceMarketCodeSchema,
    appleStorefrontCountryCode: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
    intent: z.enum(["plan_access", "family_capability"]),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.clientSurface === "ios" && !input.appleStorefrontCountryCode) {
      context.addIssue({
        code: "custom",
        message: "The current App Store storefront is required for iOS purchase routing.",
        path: ["appleStorefrontCountryCode"],
      });
    }
    if (input.clientSurface === "web" && input.appleStorefrontCountryCode !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Web purchase routing must not send an Apple storefront.",
        path: ["appleStorefrontCountryCode"],
      });
    }
  });

export const stripeTestCheckoutRequestSchema = z
  .object({
    billingPeriod: z.enum(["monthly", "annual"]),
    locale: z.enum(["en", "zh-CN"]).optional(),
  })
  .strict();

export const billingPortalRequestSchema = z.object({ locale: z.enum(["en", "zh-CN"]).optional() }).strict();

export const stripeTestIdempotencyKeySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{15,99}$/);

export const matterCategorySchema = z.enum([
  "financial_asset",
  "debt",
  "account",
  "device",
  "document",
  "subscription",
  "crypto_asset",
]);

export const valueBandSchema = z.enum([
  "none",
  "under_1k",
  "1k_10k",
  "10k_100k",
  "100k_plus",
  "unknown",
]);

export const desiredOutcomeSchema = z.enum([
  "notify",
  "transfer_request",
  "close",
  "delete_request",
  "memorialize",
  "delay_disclosure",
  "never_disclose",
  "undecided",
]);

export const planMotivationSchema = z.enum([
  "life_change",
  "family_responsibility",
  "cross_border",
  "complex_digital_life",
  "recent_estate_experience",
  "general_preparedness",
  "other",
]);

const optionalShortText = (maximum: number) => z.string().trim().min(1).max(maximum).nullable();

export const createMatterSchema = z
  .object({
    requestId: publicIdSchema.optional(),
    category: matterCategorySchema,
    details: matterDetailsSchema.default({}),
    notes: optionalShortText(2000).optional(),
    title: z.string().trim().min(1).max(120),
    institutionName: optionalShortText(160).optional(),
    accountHint: optionalShortText(160).optional(),
    valueBand: valueBandSchema.default("unknown"),
    currencyCode: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
    locationHint: optionalShortText(500).optional(),
    importance: z.enum(["standard", "important", "critical"]).default("important"),
    desiredOutcome: desiredOutcomeSchema.default("undecided"),
    status: z.enum(["draft", "ready", "needs_review"]).default("draft"),
  })
  .strict()
  .superRefine(validateMatterRequirements);

export const updateMatterSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    category: matterCategorySchema.optional(),
    details: matterDetailsSchema.optional(),
    notes: optionalShortText(2000).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    institutionName: optionalShortText(160).optional(),
    accountHint: optionalShortText(160).optional(),
    valueBand: valueBandSchema.optional(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
    locationHint: optionalShortText(500).optional(),
    importance: z.enum(["standard", "important", "critical"]).optional(),
    desiredOutcome: desiredOutcomeSchema.optional(),
    status: z.enum(["draft", "ready", "needs_review"]).optional(),
  })
  .strict();

export const updatePlanSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    motivation: planMotivationSchema.nullable().optional(),
    status: z.enum(["draft", "active", "needs_review"]).optional(),
    firstUseState: z
      .enum(["available", "guide_in_progress", "guide_paused", "completed"])
      .optional(),
    firstUseStep: z.number().int().min(0).max(2).optional(),
  })
  .superRefine((value, context) => {
    const changesFirstUse = value.firstUseState !== undefined || value.firstUseStep !== undefined;
    if (!changesFirstUse) return;
    if (value.firstUseState === undefined || value.firstUseStep === undefined) {
      context.addIssue({
        code: "custom",
        message: "firstUseState and firstUseStep must be updated together",
      });
      return;
    }
    const validPair = (value.firstUseState === "available" && value.firstUseStep === 0)
      || (value.firstUseState === "guide_in_progress" && value.firstUseStep >= 1)
      || value.firstUseState === "guide_paused"
      || (value.firstUseState === "completed" && value.firstUseStep === 2);
    if (!validPair) {
      context.addIssue({
        code: "custom",
        message: "The first-use state and step are inconsistent",
      });
    }
  })
  .strict();

export const createTrustedContactSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120),
    relationshipLabel: optionalShortText(120).optional(),
  })
  .strict();

export const updateTrustedContactSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    displayName: z.string().trim().min(1).max(120).optional(),
    relationshipLabel: optionalShortText(120).optional(),
    status: z.enum(["draft", "revoked", "archived"]).optional(),
  })
  .strict();

export const updateOfficialSetupSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    completed: z.boolean(),
  })
  .strict();

export const createSimulationSchema = z
  .object({
    lifeEvent: z.enum(["death", "incapacity", "missing"]),
  })
  .strict();

export const createDisclosureRehearsalSchema = z
  .object({
    lifeEvent: z.enum(["death", "incapacity", "missing"]),
  })
  .strict();

export const updateDisclosureRehearsalSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    action: z.enum([
      "advance",
      "simulate_cooling_off_elapsed",
      "appeal",
      "restart_review",
      "cancel",
    ]),
    acknowledgesSimulationOnly: z.literal(true),
  })
  .strict();

const roleAssignmentRoleSchema = z.enum(["trusted_contact", "executor", "recipient"]);
const roleAssignmentScopeSchema = z.enum(["plan_wide", "matter_specific"]);

export const createRoleAssignmentSchema = z
  .object({
    personPublicId: publicIdSchema,
    role: roleAssignmentRoleSchema,
    scope: roleAssignmentScopeSchema,
    matterPublicId: publicIdSchema.nullable(),
    acknowledgesRecordOnly: z.literal(true),
    acknowledgesNoAuthority: z.literal(true),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.scope === "matter_specific") !== (input.matterPublicId !== null)) {
      context.addIssue({
        code: "custom",
        message: "Matter-specific assignments require exactly one matter; plan-wide assignments require none.",
        path: ["matterPublicId"],
      });
    }
    if (input.role === "recipient" && input.scope !== "matter_specific") {
      context.addIssue({
        code: "custom",
        message: "Recipient assignments must be matter-specific.",
        path: ["scope"],
      });
    }
  });

export const updateRoleAssignmentSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    role: roleAssignmentRoleSchema,
    scope: roleAssignmentScopeSchema,
    matterPublicId: publicIdSchema.nullable(),
    acknowledgesRecordOnly: z.literal(true),
    acknowledgesNoAuthority: z.literal(true),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.scope === "matter_specific") !== (input.matterPublicId !== null)) {
      context.addIssue({
        code: "custom",
        message: "Matter-specific assignments require exactly one matter; plan-wide assignments require none.",
        path: ["matterPublicId"],
      });
    }
    if (input.role === "recipient" && input.scope !== "matter_specific") {
      context.addIssue({
        code: "custom",
        message: "Recipient assignments must be matter-specific.",
        path: ["scope"],
      });
    }
  });

export const createPrintableStartHereSchema = z
  .object({
    previewPublicId: publicIdSchema,
    acknowledgesPlaintext: z.literal(true),
    acknowledgesNoRevocation: z.literal(true),
    locale: z.enum(["en", "zh-CN"]).default("en"),
  })
  .strict();

const base64UrlSchema = (length: number) => z
  .string()
  .length(length)
  .regex(/^[A-Za-z0-9_-]+$/);

const hpkeEnvelopeSchema = z
  .object({
    encapsulatedKey: base64UrlSchema(87),
    wrappedKey: base64UrlSchema(64),
  })
  .strict();

export const finalizeEncryptedStartHereSchema = z
  .object({
    previewPublicId: publicIdSchema,
    cryptoVersion: z.literal("rillora-hpke-v1"),
    contentNonce: base64UrlSchema(16),
    contentCiphertext: z.string().min(23).max(87_382).regex(/^[A-Za-z0-9_-]+$/),
    ciphertextSha256: base64UrlSchema(43),
    recovery: hpkeEnvelopeSchema.extend({
      publicKey: base64UrlSchema(87),
    }),
    recipients: z.array(hpkeEnvelopeSchema.extend({
      keyPublicId: publicIdSchema,
    })).max(20),
    acknowledgesOfflineRecoveryRisk: z.literal(true),
    acknowledgesExternalCopiesNotRevocable: z.literal(true),
  })
  .strict();

export const createRecipientRehearsalSchema = z
  .object({ personPublicId: publicIdSchema })
  .strict();

export const acceptRecipientRehearsalSchema = z
  .object({ acceptanceToken: base64UrlSchema(43) })
  .strict();

export const enrollRecipientDeviceKeySchema = z
  .object({
    deviceLabel: z.string().trim().min(1).max(80),
    publicKey: base64UrlSchema(87),
  })
  .strict();

export const finalizeRecipientRehearsalPackageSchema = finalizeEncryptedStartHereSchema.extend({
  acknowledgesSyntheticRehearsalOnly: z.literal(true),
});

const forbiddenSecretKeys = new Set([
  "password",
  "passcode",
  "pin",
  "secret",
  "seedphrase",
  "mnemonic",
  "privatekey",
  "recoverycode",
  "credentials",
]);

export function findForbiddenSecretField(value: unknown): string | null {
  return findForbiddenSecretFieldAt(value, "", 0);
}

function findForbiddenSecretFieldAt(value: unknown, path: string, depth: number): string | null {
  if (!value || typeof value !== "object" || depth > 12) return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenSecretFieldAt(value[index], `${path}[${index}]`, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = path ? `${path}.${key}` : key;
    const normalized = key.replaceAll(/[_\-\s]/g, "").toLowerCase();
    if (forbiddenSecretKeys.has(normalized)) return nestedPath;
    const found = findForbiddenSecretFieldAt(nested, nestedPath, depth + 1);
    if (found) return found;
  }
  return null;
}
