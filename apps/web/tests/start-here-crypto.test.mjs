import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from 'node:crypto';
import {
  Aes256Gcm,
  CipherSuite,
  DhkemP256HkdfSha256,
  HkdfSha256,
} from "@hpke/core";
import {
  createEncryptedStartHere,
  createRecipientDeviceKey,
  decryptEncryptedStartHere,
  decryptEncryptedStartHereForRecipient,
} from "../src/startHereCrypto.js";

const preview = {
  export: { publicId: "11111111-1111-4111-8111-111111111111" },
  package: {
    schemaVersion: "start-here-v1",
    planner: { display_name: "Synthetic Planner", locale: "en", time_zone: "UTC" },
    plan: { status: "active" },
    matters: [{
      publicId: "33333333-3333-4333-8333-333333333333",
      category: "account",
      title: "Synthetic account",
      institutionName: "Example",
      locationHint: "Provider recovery page",
      desiredOutcome: "notify",
      status: "ready",
    }],
    trustedContacts: [],
    directionsNotPasswords: true,
    legalAuthorityNotGranted: true,
  },
};

test("creates a recovery-only package without leaking its private or content key", async () => {
  const preparation = makePreparation();
  const encrypted = await createEncryptedStartHere({ preview, preparation });
  const recovered = await decryptEncryptedStartHere(encrypted.artifact, encrypted.recoveryKit);

  assert.deepEqual(recovered.package, preview.package);
  assert.equal(encrypted.artifact.boundaries.serverCanDecrypt, false);
  assert.equal(encrypted.artifact.recipients.length, 0);
  assert.equal(encrypted.recoveryKit.privateKey.length, 43);
  assert.equal(JSON.stringify(encrypted.artifact).includes(encrypted.recoveryKit.privateKey), false);
  assert.equal(JSON.stringify(encrypted.submission).includes(encrypted.recoveryKit.privateKey), false);
  assert.equal(Object.hasOwn(encrypted.submission, "contentKey"), false);
});

test("wraps the same content key independently for an accepted recipient device", async () => {
  const suite = hpkeSuite();
  const recipientKeyPair = await suite.kem.generateKeyPair();
  const recipientPublicKey = base64url(await suite.kem.serializePublicKey(recipientKeyPair.publicKey));
  const preparation = makePreparation([{
    publicId: "44444444-4444-4444-8444-444444444444",
    displayName: "Synthetic Recipient",
    deviceLabel: "Synthetic browser",
    publicKey: recipientPublicKey,
  }]);
  const encrypted = await createEncryptedStartHere({ preview, preparation });
  const envelope = encrypted.artifact.recipients[0];
  const info = new TextEncoder().encode(
    `rillora:start-here:key-wrap:v1:${preparation.package.publicId}`,
  );
  const aad = associatedData(preparation.package);
  const recipient = await suite.createRecipientContext({
    recipientKey: recipientKeyPair.privateKey,
    enc: bytes(envelope.encapsulatedKey),
    info,
  });
  const contentKeyBytes = await recipient.open(bytes(envelope.wrappedKey), aad);
  const contentKey = await crypto.subtle.importKey(
    "raw",
    contentKeyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: bytes(encrypted.artifact.content.nonce),
    additionalData: aad,
    tagLength: 128,
  }, contentKey, bytes(encrypted.artifact.content.ciphertext));
  const payload = JSON.parse(new TextDecoder().decode(plaintext));

  assert.equal(encrypted.artifact.recipients.length, 1);
  assert.equal(payload.packagePublicId, preparation.package.publicId);
  assert.equal(payload.package.matters[0].title, "Synthetic account");
});

test("decrypts a synthetic recipient artifact with only the memory-held device key", async () => {
  const deviceKey = await createRecipientDeviceKey();
  const keyPublicId = "66666666-6666-4666-8666-666666666666";
  const preparation = makePreparation([{
    publicId: keyPublicId,
    displayName: "Synthetic Recipient",
    deviceLabel: "Synthetic browser",
    publicKey: deviceKey.publicKey,
  }]);
  preparation.package.simulationOnly = true;
  preparation.package.releasePerformed = false;
  const encrypted = await createEncryptedStartHere({ preview, preparation });
  const recipientArtifact = structuredClone(encrypted.artifact);
  delete recipientArtifact.recovery;
  recipientArtifact.boundaries.deliveryPerformed = false;
  const recovered = await decryptEncryptedStartHereForRecipient(recipientArtifact, {
    ...deviceKey,
    publicId: keyPublicId,
  });

  assert.equal(recovered.package.matters[0].title, "Synthetic account");
  assert.equal(recovered.boundaries.simulationOnly, true);
  assert.equal(recovered.boundaries.releasePerformed, false);
  assert.equal(JSON.stringify(recipientArtifact).includes(deviceKey.privateKey), false);
  await assert.rejects(
    decryptEncryptedStartHereForRecipient(recipientArtifact, {
      ...(await createRecipientDeviceKey()),
      publicId: keyPublicId,
    }),
  );
});

test("rejects tampered ciphertext and a recovery key from another package", async () => {
  const first = await createEncryptedStartHere({ preview, preparation: makePreparation() });
  const second = await createEncryptedStartHere({
    preview,
    preparation: makePreparation([], "55555555-5555-4555-8555-555555555555"),
  });
  const tampered = structuredClone(first.artifact);
  const ciphertext = bytes(tampered.content.ciphertext);
  ciphertext[0] ^= 1;
  tampered.content.ciphertext = base64url(ciphertext);

  await assert.rejects(
    decryptEncryptedStartHere(tampered, first.recoveryKit),
    /ciphertext digest is invalid/,
  );
  await assert.rejects(
    decryptEncryptedStartHere(first.artifact, {
      ...second.recoveryKit,
      packagePublicId: first.artifact.packagePublicId,
    }),
  );
});

function makePreparation(eligibleRecipientKeys = [], publicId = "22222222-2222-4222-8222-222222222222") {
  return {
    package: {
      publicId,
      previewPublicId: preview.export.publicId,
      createdAt: "2026-08-10T00:00:00.000Z",
      expiresAt: "2026-08-10T00:15:00.000Z",
      status: "generating",
      cryptoVersion: "rillora-hpke-v1",
      sourceCommitment: createHash('sha256').update(JSON.stringify(preview.package)).digest('base64url'),
      contentEncryption: "AES-256-GCM",
      keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
      serverCanDecrypt: false,
      recipientDeliveryPerformed: false,
    },
    eligibleRecipientKeys,
  };
}

function hpkeSuite() {
  return new CipherSuite({
    kem: new DhkemP256HkdfSha256(),
    kdf: new HkdfSha256(),
    aead: new Aes256Gcm(),
  });
}

function associatedData(preparation) {
  return new TextEncoder().encode([
    "rillora:start-here:encrypted:v1",
    `package=${preparation.publicId}`,
    `preview=${preparation.previewPublicId}`,
    `source=${preparation.sourceCommitment}`,
  ].join("\n"));
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function bytes(value) {
  return Buffer.from(value, "base64url");
}
