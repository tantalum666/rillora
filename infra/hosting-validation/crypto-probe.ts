import { createHash, createHmac, randomBytes, randomUUID, X509Certificate } from 'node:crypto';
import Stripe from 'stripe';
import { SignedDataVerifier, Environment } from '@apple/app-store-server-library';
import appleRootPem from './apple-root-g3.pem';
import { LegacyContentCipher } from '../../apps/api/src/legacy-content/crypto.js';
import type { ContentKeyContext, ContentKeyProvider } from '../../apps/api/src/private-content.js';

/** Memory-only synthetic key fixture. It deliberately does NOT claim KMS proof. */
async function contentRoundTrip(bytes: number) {
  const root = randomBytes(32);
  const context = { owner: randomUUID(), resource: randomUUID(), purpose: 'asset' as const, version: 1 };
  const validate = (value: ContentKeyContext) => {
    if (value.namespace !== 'hosting-validation' || value.owner !== context.owner || value.id !== context.resource) {
      throw new Error('Synthetic content context mismatch');
    }
  };
  const provider: ContentKeyProvider = {
    async check() {},
    async generate(value) {
      validate(value);
      return { plaintext: Buffer.from(root), wrapped: Buffer.from('synthetic-memory-reference'),
        wrappingKeyRef: 'synthetic-memory-only' };
    },
    async unwrap(wrapped, ref, value) {
      validate(value);
      if (ref !== 'synthetic-memory-only' || wrapped.toString() !== 'synthetic-memory-reference') {
        throw new Error('Synthetic wrapping reference mismatch');
      }
      return Buffer.from(root);
    },
  };
  const plaintext = Buffer.alloc(bytes, 0x61);
  let opened: Buffer | undefined;
  let ciphertext: Buffer | undefined;
  try {
    const cipher = new LegacyContentCipher('hosting-validation', provider);
    const sealed = await cipher.seal(plaintext, context);
    ciphertext = sealed.ciphertext;
    opened = await cipher.open(ciphertext, sealed.header, context, bytes);
    const equal = createHash('sha256').update(opened).digest('hex') === createHash('sha256').update(plaintext).digest('hex');
    let wrongOwnerRejected = false, tamperRejected = false;
    try { await cipher.open(ciphertext, sealed.header, { ...context, owner: randomUUID() }, bytes); }
    catch { wrongOwnerRejected = true; }
    ciphertext[0] = ciphertext[0]! ^ 1;
    try { await cipher.open(ciphertext, sealed.header, context, bytes); }
    catch { tamperRejected = true; }
    return { bytes, equal, wrongOwnerRejected, tamperRejected,
      passed: equal && wrongOwnerRejected && tamperRejected };
  } finally {
    root.fill(0); plaintext.fill(0); opened?.fill(0); ciphertext?.fill(0);
  }
}

export async function probeCrypto(large: boolean) {
  if (large) return { evidence: 'actual-content-cipher-with-memory-only-synthetic-key',
    kmsVerified: false, file: await contentRoundTrip(8 * 1024 * 1024) };
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = randomBytes(48).toString('hex');
  const payload = JSON.stringify({ id: 'evt_synthetic_hosting_validation', object: 'event',
    type: 'invoice.paid', data: { object: { id: 'in_synthetic_hosting_validation' } } });
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const stripe = new Stripe('sk_test_' + randomBytes(32).toString('hex'));
  const event = stripe.webhooks.constructEvent(payload, `t=${timestamp},v1=${signature}`, secret);
  let tamperedStripeRejected = false;
  try { stripe.webhooks.constructEvent(payload + ' ', `t=${timestamp},v1=${signature}`, secret); }
  catch { tamperedStripeRejected = true; }
  const certificate = new X509Certificate(appleRootPem);
  const pinnedRoot = createHash('sha256').update(certificate.raw).digest('hex')
    === '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179';
  const verifier = new SignedDataVerifier([certificate.raw], true, Environment.SANDBOX, 'com.rillora.ios');
  let invalidAppleRejected = false;
  try { await verifier.verifyAndDecodeTransaction('not.a.valid-signed-transaction'); }
  catch { invalidAppleRejected = true; }
  const file = await contentRoundTrip(4096);
  const stripeVerified = event.id === 'evt_synthetic_hosting_validation';
  const rootSignatureVerified = certificate.verify(certificate.publicKey);
  return { evidence: 'real-sdks-and-content-cipher-with-synthetic-input',
    stripeVerified, tamperedStripeRejected, pinnedRoot, rootSignatureVerified, invalidAppleRejected, file,
    realPurchaseVerified: false, appleValidChainAndOnlineOcspVerified: false, kmsVerified: false,
    passed: stripeVerified && tamperedStripeRejected && pinnedRoot && rootSignatureVerified && invalidAppleRejected && file.passed };
}
