import { loadAppleProductionSecret, loadAppleReviewSecret } from './apple-production-secret.js';
import { loadAppleProductionPriceBindings } from './apple-price-catalog.js';
import { AppleProductionVerification, createRilloraAppleProductionVerifier, createRilloraAppleReviewVerifier } from './apple-production-verification.js';
import { AppleProductionServerApi, AppleProductionSnapshotAdapter } from './apple-production-server-api.js';
import { appleProductionContext, appleReviewContext } from './apple-execution-context.js';
import { loadStripeProductionSecret } from './stripe-production-secret.js';
import { StripeProductionAdapter } from './stripe-production-adapter.js';
export function createRecoveryProviderReader(pool, config) {
    const apples = new Map();
    let stripe;
    return async (ref, owner) => {
        if (ref.acquisition !== 'purchased' || !ref.reference || ref.plane !== 'global' || ref.market !== 'GLOBAL_US')
            throw Error('Recovery provider scope is unsupported');
        if (ref.provider === 'storekit' && (ref.environment === 'sandbox' || ref.environment === 'production')) {
            const review = ref.environment === 'sandbox', context = review ? appleReviewContext : appleProductionContext;
            const arn = review ? config.appleReviewArn : config.appleProductionArn;
            if (!arn)
                throw Error('Recovery provider credential is not configured');
            if (!apples.has(ref.environment))
                apples.set(ref.environment, (async () => {
                    const credentials = await (review ? loadAppleReviewSecret : loadAppleProductionSecret)(arn);
                    const verifier = new AppleProductionVerification(await (review ? createRilloraAppleReviewVerifier : createRilloraAppleProductionVerifier)(config.appleRoots), new Set(credentials.allowedStorefronts), context);
                    return new AppleProductionSnapshotAdapter(new AppleProductionServerApi(credentials, undefined, context), verifier, await loadAppleProductionPriceBindings(pool, context));
                })());
            const snapshot = await (await apples.get(ref.environment)).retrieveAuthoritativeSubscription({ anyTransactionId: ref.reference,
                providerSubscriptionReference: ref.reference, expectedAppAccountToken: owner, expectedCommerceAccountReference: ref.account });
            return { snapshot, apple: snapshot };
        }
        if (ref.provider === 'stripe' && ref.environment === 'production' && ref.customer) {
            if (!config.stripeProductionArn)
                throw Error('Recovery provider credential is not configured');
            stripe ??= loadStripeProductionSecret(config.stripeProductionArn).then(c => new StripeProductionAdapter(c));
            const result = await (await stripe).retrieveRecoverySubscription({ providerSubscriptionReference: ref.reference,
                expectedCommerceAccountReference: ref.account, expectedStripeCustomerReference: ref.customer });
            return { snapshot: result.snapshot, financialOverride: result.financial.override, disputeResolved: result.financial.resolvedDispute,
                stripePrice: result.price, stripeProduct: result.product };
        }
        throw Error('Recovery provider environment is unsupported');
    };
}
