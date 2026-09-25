import type { StripeTestConfig } from './config.js';
import type { StripeProductionConfig } from './stripe-production-adapter.js';
import { stripeSnapshotPriceId } from './stripe-test-adapter.js';

export type StripeProductionExecutionConfig = Omit<StripeTestConfig, 'integrationEnvironment'> & {
  integrationEnvironment: 'production';
  production: StripeProductionConfig;
};
export type StripeExecutionConfig = StripeTestConfig | StripeProductionExecutionConfig;

export function stripeExecutionEnvironment(config: StripeExecutionConfig): 'test' | 'production' {
  if (config.integrationEnvironment === 'production') return 'production';
  if (['development', 'test', 'staging'].includes(config.integrationEnvironment)) return 'test';
  throw new Error('Unknown Stripe execution environment');
}
export function productionExecutionConfig(config: StripeProductionConfig): StripeProductionExecutionConfig {
  return { ...config, integrationEnvironment: 'production', familyPlanVersion: 2, familyPriceVersion: 3,
    familyPriceIds: { annual: config.annualPriceId, monthly: '' }, production: config };
}
export function executionSnapshotPriceId(config: StripeExecutionConfig, priceCode: string): string | null {
  if (config.integrationEnvironment !== 'production') return stripeSnapshotPriceId(config, priceCode);
  if (priceCode === 'family_usd_annual_v3') return config.production.annualPriceId;
  return config.production.historicalPrices.find(price => price.priceCode === priceCode)?.id ?? null;
}
