import type { JWSTransactionDecodedPayload } from '@apple/app-store-server-library';
import { z } from 'zod';
declare const binding: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodEnum<{
        "com.rillora.family.annual": "com.rillora.family.annual";
        "com.rillora.family.monthly": "com.rillora.family.monthly";
    }>;
    storefrontCountryCode: z.ZodString;
    currency: z.ZodString;
    priceMilliunits: z.ZodNumber;
    priceCode: z.ZodString;
    planVersion: z.ZodNumber;
    effectiveFrom: z.ZodISODateTime;
    effectiveUntil: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type ApplePriceBinding = z.infer<typeof binding>;
export declare class ApplePriceBindings {
    private readonly rows;
    constructor(input: unknown);
    resolve(transaction: JWSTransactionDecodedPayload): ApplePriceBinding;
}
export {};
