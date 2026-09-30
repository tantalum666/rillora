import type { StripeTestConfig } from './config.js';
import type { StripeProductionConfig } from './stripe-production-adapter.js';
export type StripeProductionExecutionConfig = Omit<StripeTestConfig, 'integrationEnvironment'> & {
    integrationEnvironment: 'production';
    production: StripeProductionConfig;
};
export type StripeExecutionConfig = StripeTestConfig | StripeProductionExecutionConfig;
export declare function stripeExecutionEnvironment(config: StripeExecutionConfig): 'test' | 'production';
export declare function productionExecutionConfig(config: StripeProductionConfig): StripeProductionExecutionConfig;
export declare function executionSnapshotPriceId(config: StripeExecutionConfig, priceCode: string): string | null;
