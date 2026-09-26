import { loadAppleProductionPriceBindings } from './apple-price-catalog.js';
import { AppleProductionIntake } from './apple-production-intake.js';
import { AppleProductionVerification, createRilloraAppleProductionVerifier } from './apple-production-verification.js';
import { AppleProductionServerApi, AppleProductionSnapshotAdapter } from './apple-production-server-api.js';
import { loadAppleProductionSecret } from './apple-production-secret.js';
import type { DatabasePool } from './db.js';

export async function createAppleProductionIntake(pool: DatabasePool,
  config: { secretArn: string; rootCertificateDirectory: string }): Promise<AppleProductionIntake> {
  const credentials = await loadAppleProductionSecret(config.secretArn);
  const prices = await loadAppleProductionPriceBindings(pool);
  const verification = new AppleProductionVerification(await createRilloraAppleProductionVerifier(config.rootCertificateDirectory),
    new Set(credentials.allowedStorefronts));
  return new AppleProductionIntake(pool, verification,
    new AppleProductionSnapshotAdapter(new AppleProductionServerApi(credentials), verification, prices));
}
