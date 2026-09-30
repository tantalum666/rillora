import { loadAppleProductionPriceBindings } from './apple-price-catalog.js';
import { AppleProductionIntake } from './apple-production-intake.js';
import { AppleProductionVerification, createRilloraAppleProductionVerifier, createRilloraAppleReviewVerifier } from './apple-production-verification.js';
import { AppleProductionServerApi, AppleProductionSnapshotAdapter } from './apple-production-server-api.js';
import { loadAppleProductionSecret, loadAppleReviewSecret } from './apple-production-secret.js';
import { appleProductionContext, appleReviewContext } from './apple-execution-context.js';
export async function createAppleProductionIntake(pool, config) {
    return createIntake(pool, config, appleProductionContext);
}
export async function createAppleReviewIntake(pool, config) {
    return createIntake(pool, config, appleReviewContext);
}
async function createIntake(pool, config, context) {
    const credentials = await (context.validationOnly ? loadAppleReviewSecret : loadAppleProductionSecret)(config.secretArn);
    const prices = await loadAppleProductionPriceBindings(pool, context);
    const verification = new AppleProductionVerification(await (context.validationOnly ? createRilloraAppleReviewVerifier : createRilloraAppleProductionVerifier)(config.rootCertificateDirectory), new Set(credentials.allowedStorefronts), context);
    return new AppleProductionIntake(pool, verification, new AppleProductionSnapshotAdapter(new AppleProductionServerApi(credentials, undefined, context), verification, prices), context);
}
