import type { Request } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
declare const propertySchemas: {
    readonly motivation_selected: z.ZodObject<{
        motivation: z.ZodEnum<{
            complex_digital_life: "complex_digital_life";
            cross_border: "cross_border";
            family_responsibility: "family_responsibility";
            general_preparedness: "general_preparedness";
            life_change: "life_change";
            other: "other";
            recent_estate_experience: "recent_estate_experience";
        }>;
    }, z.core.$strict>;
    readonly first_item_added: z.ZodObject<{}, z.core.$strict>;
    readonly five_items_completed: z.ZodObject<{}, z.core.$strict>;
    readonly item_outcome_assigned: z.ZodObject<{}, z.core.$strict>;
    readonly item_role_assigned: z.ZodObject<{
        role: z.ZodEnum<{
            executor: "executor";
            recipient: "recipient";
            trusted_contact: "trusted_contact";
        }>;
        scope: z.ZodEnum<{
            matter_specific: "matter_specific";
            plan_wide: "plan_wide";
        }>;
    }, z.core.$strict>;
    readonly official_setup_checked: z.ZodObject<{
        completed: z.ZodBoolean;
    }, z.core.$strict>;
    readonly simulation_completed: z.ZodObject<{
        lifeEvent: z.ZodEnum<{
            death: "death";
            incapacity: "incapacity";
            missing: "missing";
        }>;
        kind: z.ZodEnum<{
            count_snapshot: "count_snapshot";
            role_disclosure: "role_disclosure";
        }>;
    }, z.core.$strict>;
    readonly start_here_exported: z.ZodObject<{
        format: z.ZodEnum<{
            encrypted: "encrypted";
            plaintext: "plaintext";
        }>;
    }, z.core.$strict>;
};
export type ProductEventName = keyof typeof propertySchemas;
export type ProductEventProperties<Name extends ProductEventName> = z.input<(typeof propertySchemas)[Name]>;
export type ProductClientSource = "web" | "ios" | "unknown";
export declare function productClientSource(request: Request): ProductClientSource;
export declare function appendProductEvent<Name extends ProductEventName>(client: PoolClient, source: ProductClientSource, eventName: Name, properties: ProductEventProperties<Name>): Promise<void>;
export {};
