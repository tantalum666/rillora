import { purchaseConsentContract } from './purchase-consent.js';
import { stripeSnapshotPriceId } from './stripe-test-adapter.js';
export function stripeExecutionEnvironment(config) {
    if (config.integrationEnvironment === 'production')
        return 'production';
    if (['development', 'test', 'staging'].includes(config.integrationEnvironment))
        return 'test';
    throw new Error('Unknown Stripe execution environment');
}
export function productionExecutionConfig(config) {
    return { ...config, integrationEnvironment: 'production', familyPlanVersion: 2, familyPriceVersion: 4,
        familyPriceIds: { annual: config.annualPriceId, monthly: '' }, production: config };
}
export function executionSnapshotPriceId(config, priceCode) {
    if (config.integrationEnvironment !== 'production')
        return stripeSnapshotPriceId(config, priceCode);
    if (priceCode === purchaseConsentContract.priceCode)
        return config.production.annualPriceId;
    return config.production.historicalPrices.find(price => price.priceCode === priceCode)?.id ?? null;
}
