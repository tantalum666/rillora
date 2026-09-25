import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { z } from 'zod';
import type { StripeProductionConfig } from './stripe-production-adapter.js';

export const stripeProductionSecretArnPattern = /^arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora\/production\/stripe-billing-[A-Za-z0-9]{6}$/;
const providerID = (prefix: string) => z.string().regex(new RegExp('^' + prefix + '[A-Za-z0-9_]+$')).max(255);
const returnURL = z.string().url().refine(value => {
  const url = new URL(value);
  return url.origin === 'https://app.rillora.xyz' && !url.username && !url.password && !url.hash;
});
const schema = z.object({
  schemaVersion: z.literal(1), environment: z.literal('production'),
  apiKey: z.string().startsWith('rk_live_').min(20).max(255),
  webhookSecret: z.string().startsWith('whsec_').min(20).max(255),
  expectedAccountId: z.literal('acct_1U6B2RCxTlowhyiG'), familyProductId: providerID('prod_'), annualPriceId: providerID('price_'),
  historicalPrices: z.array(z.object({ id: providerID('price_'), priceCode: z.string().regex(/^family_usd_(annual|monthly)_v[0-9]+$/),
    amountMinor: z.number().int().positive().max(1_000_000), currency: z.literal('usd'), interval: z.enum(['year', 'month']),
    planVersion: z.number().int().positive() }).strict()).max(30),
  checkoutSuccessUrl: returnURL, checkoutCancelUrl: returnURL, portalReturnUrl: returnURL, portalConfigurationId: providerID('bpc_'),
  tax: z.object({ mode: z.enum(['automatic', 'reviewed_no_collection']), assessmentReference: z.string().trim().min(8).max(200),
    productTaxCode: providerID('txcd_'), activeRegistrationIds: z.array(providerID('taxreg_')).max(100) }).strict(),
}).strict();

export function parseStripeProductionSecret(text: string): StripeProductionConfig {
  // Never surface parser/provider error text that could quote credential bytes.
  try {
    if (Buffer.byteLength(text) > 64 * 1024) throw new Error();
    const { schemaVersion: _version, environment: _environment, ...config } = schema.parse(JSON.parse(text));
    if (config.tax.mode === 'automatic' && config.tax.activeRegistrationIds.length === 0) throw new Error();
    const ids = [config.annualPriceId, ...config.historicalPrices.map(price => price.id)];
    const codes = ['family_usd_annual_v3', ...config.historicalPrices.map(price => price.priceCode)];
    if (new Set(ids).size !== ids.length || new Set(codes).size !== codes.length) throw new Error();
    return Object.freeze(config);
  } catch { throw new Error('Production billing secret does not match its reviewed schema'); }
}

export async function loadStripeProductionSecret(arn: string): Promise<StripeProductionConfig> {
  if (!stripeProductionSecretArnPattern.test(arn)) throw new Error('Only the named Rillora production billing secret is allowed');
  const client = new SecretsManagerClient({ region: 'eu-central-1' });
  try {
    const result = await client.send(new GetSecretValueCommand({ SecretId: arn, VersionStage: 'AWSCURRENT' }));
    if (!result.SecretString) throw new Error();
    return parseStripeProductionSecret(result.SecretString);
  } catch { throw new Error('Production billing configuration could not be loaded'); }
  finally { client.destroy(); }
}
