import { createPrivateKey } from 'node:crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { z } from 'zod';

export const appleProductionSecretArnPattern = /^arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora\/production\/apple-iap-[A-Za-z0-9]{6}$/;
const secretSchema = z.object({ schemaVersion: z.literal(1), environment: z.literal('production'),
  bundleId: z.literal('com.rillora.ios'),
  keyId: z.string().regex(/^[A-Z0-9]{10}$/), issuerId: z.uuid(), privateKey: z.string().min(100).max(8192),
  allowedStorefronts: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1).max(175),
}).strict();

export function parseAppleProductionSecret(raw: string) {
  try {
    if (Buffer.byteLength(raw) > 16 * 1024) throw new Error();
    const result = secretSchema.parse(JSON.parse(raw));
    const key = createPrivateKey(result.privateKey);
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1'
      || new Set(result.allowedStorefronts).size !== result.allowedStorefronts.length) throw new Error();
    return result;
  } catch { throw new Error('Production Apple IAP secret does not match its reviewed schema'); }
}

export async function loadAppleProductionSecret(secretArn: string) {
  if (!appleProductionSecretArnPattern.test(secretArn)) throw new Error('Only the named production Apple IAP secret is allowed');
  const secrets = new SecretsManagerClient({ region: 'eu-central-1' });
  try {
    const response = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn, VersionStage: 'AWSCURRENT' }));
    if (!response.SecretString) throw new Error();
    return parseAppleProductionSecret(response.SecretString);
  } catch { throw new Error('Production Apple IAP configuration could not be loaded'); }
  finally { secrets.destroy(); }
}
