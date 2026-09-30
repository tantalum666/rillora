import type { StripeProductionConfig } from './stripe-production-adapter.js';
export declare const stripeProductionSecretArnPattern: RegExp;
export declare function parseStripeProductionSecret(text: string): StripeProductionConfig;
export declare function loadStripeProductionSecret(arn: string): Promise<StripeProductionConfig>;
