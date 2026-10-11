import {
  Aes256Gcm,
  CipherSuite,
  DhkemP256HkdfSha256,
  HkdfSha256,
} from "@hpke/core";
import { committedStartHereJSON } from './startHereCommitment.js';

export const encryptedStartHereContract = Object.freeze({
  cryptoVersion: "rillora-hpke-v1",
  packageSchemaVersion: "rillora-encrypted-start-here-v1",
  payloadSchemaVersion: "rillora-encrypted-start-here-payload-v1",
  recoverySchemaVersion: "rillora-start-here-recovery-v1",
});

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function createHpkeSuite() {
  return new CipherSuite({
    kem: new DhkemP256HkdfSha256(),
    kdf: new HkdfSha256(),
    aead: new Aes256Gcm(),
  });
}

export async function createEncryptedStartHere({ preview, preparation, cryptoImpl = globalThis.crypto }) {
  assertPreparation(preview, preparation);
  if (!cryptoImpl?.subtle || typeof cryptoImpl.getRandomValues !== "function") {
    throw new Error("Web Cryptography is unavailable in this secure context.");
  }
  await verifyPackageCommitment(preview.package, preparation.package.sourceCommitment, cryptoImpl);

  const suite = createHpkeSuite();
  const aad = associatedData(preparation.package);
  const info = encoder.encode(`rillora:start-here:key-wrap:v1:${preparation.package.publicId}`);
  const contentKeyBytes = cryptoImpl.getRandomValues(new Uint8Array(32));
  const nonce = cryptoImpl.getRandomValues(new Uint8Array(12));
  const contentKey = await cryptoImpl.subtle.importKey(
    "raw",
    contentKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  const simulationOnly = preparation.package.simulationOnly === true;
  const plaintext = encoder.encode(JSON.stringify({
    schemaVersion: encryptedStartHereContract.payloadSchemaVersion,
    packagePublicId: preparation.package.publicId,
    previewPublicId: preparation.package.previewPublicId,
    sourceCommitment: preparation.package.sourceCommitment,
    createdAt: preparation.package.createdAt,
    package: preview.package,
    boundaries: {
      directionsNotPasswords: true,
      legalAuthorityNotGranted: true,
      recipientDeliveryPerformed: false,
      simulationOnly,
      releasePerformed: false,
    },
  }));
  const ciphertext = new Uint8Array(await cryptoImpl.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
    contentKey,
    plaintext,
  ));

  const recoveryKeyPair = await suite.kem.generateKeyPair();
  const recoveryPublicKey = new Uint8Array(
    await suite.kem.serializePublicKey(recoveryKeyPair.publicKey),
  );
  const recoveryPrivateKey = new Uint8Array(
    await suite.kem.serializePrivateKey(recoveryKeyPair.privateKey),
  );
  const recoveryEnvelope = await wrapContentKey(
    suite,
    recoveryKeyPair.publicKey,
    contentKeyBytes,
    info,
    aad,
  );

  const recipientEnvelopes = [];
  for (const recipient of preparation.eligibleRecipientKeys) {
    const publicKey = await suite.kem.deserializePublicKey(fromBase64Url(recipient.publicKey, 65));
    const envelope = await wrapContentKey(suite, publicKey, contentKeyBytes, info, aad);
    recipientEnvelopes.push({ keyPublicId: recipient.publicId, ...envelope });
  }

  const ciphertextSha256 = new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", ciphertext));
  const artifact = {
    schemaVersion: encryptedStartHereContract.packageSchemaVersion,
    packagePublicId: preparation.package.publicId,
    previewPublicId: preparation.package.previewPublicId,
    createdAt: preparation.package.createdAt,
    cryptoVersion: encryptedStartHereContract.cryptoVersion,
    sourceCommitment: preparation.package.sourceCommitment,
    content: {
      algorithm: "AES-256-GCM",
      nonce: toBase64Url(nonce),
      ciphertext: toBase64Url(ciphertext),
      ciphertextSha256: toBase64Url(ciphertextSha256),
    },
    recovery: {
      publicKey: toBase64Url(recoveryPublicKey),
      ...recoveryEnvelope,
    },
    recipients: recipientEnvelopes,
    boundaries: {
      serverCanDecrypt: false,
      recipientDeliveryPerformed: false,
      externalCopiesRevocable: false,
      simulationOnly,
      releasePerformed: false,
    },
  };
  const recoveryKit = {
    schemaVersion: encryptedStartHereContract.recoverySchemaVersion,
    packagePublicId: preparation.package.publicId,
    cryptoVersion: encryptedStartHereContract.cryptoVersion,
    privateKey: toBase64Url(recoveryPrivateKey),
    warning: "Anyone with this recovery key and the encrypted package can decrypt it. Rillora cannot recover this key.",
  };

  const verifiedPayload = await decryptEncryptedStartHere(artifact, recoveryKit, cryptoImpl);
  const verifiedBytes = encoder.encode(JSON.stringify(verifiedPayload));
  if (!equalBytes(verifiedBytes, plaintext)) {
    throw new Error("Local recovery verification did not reproduce the encrypted payload.");
  }

  contentKeyBytes.fill(0);
  return {
    artifact,
    recoveryKit,
    submission: {
      previewPublicId: preparation.package.previewPublicId,
      cryptoVersion: encryptedStartHereContract.cryptoVersion,
      contentNonce: artifact.content.nonce,
      contentCiphertext: artifact.content.ciphertext,
      ciphertextSha256: artifact.content.ciphertextSha256,
      recovery: artifact.recovery,
      recipients: artifact.recipients,
      acknowledgesOfflineRecoveryRisk: true,
      acknowledgesExternalCopiesNotRevocable: true,
      ...(simulationOnly ? { acknowledgesSyntheticRehearsalOnly: true } : {}),
    },
  };
}

export async function createRecipientDeviceKey() {
  const suite = createHpkeSuite();
  const keyPair = await suite.kem.generateKeyPair();
  return {
    algorithm: "p256_hpke_base",
    publicKey: toBase64Url(new Uint8Array(await suite.kem.serializePublicKey(keyPair.publicKey))),
    privateKey: toBase64Url(new Uint8Array(await suite.kem.serializePrivateKey(keyPair.privateKey))),
  };
}

export async function decryptEncryptedStartHereForRecipient(
  artifact,
  deviceKey,
  cryptoImpl = globalThis.crypto,
) {
  assertRecipientInputs(artifact, deviceKey);
  const envelope = artifact.recipients.find((entry) => entry.keyPublicId === deviceKey.publicId);
  if (!envelope) throw new Error("This active recipient device has no envelope in the package.");
  const suite = createHpkeSuite();
  const aad = associatedData({
    publicId: artifact.packagePublicId,
    previewPublicId: artifact.previewPublicId,
    sourceCommitment: artifact.sourceCommitment,
  });
  const info = encoder.encode(`rillora:start-here:key-wrap:v1:${artifact.packagePublicId}`);
  const privateKey = await suite.kem.deserializePrivateKey(fromBase64Url(deviceKey.privateKey, 32));
  const recipient = await suite.createRecipientContext({
    recipientKey: privateKey,
    enc: fromBase64Url(envelope.encapsulatedKey, 65),
    info,
  });
  const contentKeyBytes = new Uint8Array(await recipient.open(
    fromBase64Url(envelope.wrappedKey, 48),
    aad,
  ));
  try {
    return await decryptPayload(artifact, contentKeyBytes, aad, cryptoImpl);
  } finally {
    contentKeyBytes.fill(0);
  }
}

export async function decryptEncryptedStartHere(artifact, recoveryKit, cryptoImpl = globalThis.crypto) {
  assertRecoveryInputs(artifact, recoveryKit);
  const suite = createHpkeSuite();
  const aad = associatedData({
    publicId: artifact.packagePublicId,
    previewPublicId: artifact.previewPublicId,
    sourceCommitment: artifact.sourceCommitment,
  });
  const info = encoder.encode(`rillora:start-here:key-wrap:v1:${artifact.packagePublicId}`);
  const privateKey = await suite.kem.deserializePrivateKey(fromBase64Url(recoveryKit.privateKey, 32));
  const recipient = await suite.createRecipientContext({
    recipientKey: privateKey,
    enc: fromBase64Url(artifact.recovery.encapsulatedKey, 65),
    info,
  });
  const contentKeyBytes = new Uint8Array(await recipient.open(
    fromBase64Url(artifact.recovery.wrappedKey, 48),
    aad,
  ));
  try {
    return await decryptPayload(artifact, contentKeyBytes, aad, cryptoImpl);
  } finally {
    contentKeyBytes.fill(0);
  }
}

async function decryptPayload(artifact, contentKeyBytes, aad, cryptoImpl) {
  const contentKey = await cryptoImpl.subtle.importKey(
    "raw",
    contentKeyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const ciphertext = fromBase64UrlRange(artifact.content.ciphertext, 17, 65_536);
  const digest = new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", ciphertext));
  if (!equalBytes(digest, fromBase64Url(artifact.content.ciphertextSha256, 32))) {
    throw new Error("The encrypted package ciphertext digest is invalid.");
  }
  const plaintext = await cryptoImpl.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64Url(artifact.content.nonce, 12),
      additionalData: aad,
      tagLength: 128,
    },
    contentKey,
    ciphertext,
  );
  const payload = JSON.parse(decoder.decode(plaintext));
  if (
    payload?.schemaVersion !== encryptedStartHereContract.payloadSchemaVersion
    || payload.packagePublicId !== artifact.packagePublicId
    || payload.previewPublicId !== artifact.previewPublicId
    || payload.sourceCommitment !== artifact.sourceCommitment
    || payload?.boundaries?.directionsNotPasswords !== true
    || payload?.boundaries?.legalAuthorityNotGranted !== true
  ) {
    throw new Error("The decrypted payload did not preserve the Start Here boundary.");
  }
  await verifyPackageCommitment(payload.package, artifact.sourceCommitment, cryptoImpl);
  return payload;
}

async function verifyPackageCommitment(packageValue, commitment, cryptoImpl) {
  const actual = toBase64Url(new Uint8Array(await cryptoImpl.subtle.digest('SHA-256', encoder.encode(committedStartHereJSON(packageValue)))));
  if (actual !== commitment) throw new Error('The decrypted package does not match the reviewed contents.');
}

async function wrapContentKey(suite, publicKey, contentKeyBytes, info, aad) {
  const sender = await suite.createSenderContext({ recipientPublicKey: publicKey, info });
  const wrappedKey = new Uint8Array(await sender.seal(contentKeyBytes, aad));
  return {
    encapsulatedKey: toBase64Url(new Uint8Array(sender.enc)),
    wrappedKey: toBase64Url(wrappedKey),
  };
}

function associatedData(preparation) {
  return encoder.encode([
    "rillora:start-here:encrypted:v1",
    `package=${preparation.publicId}`,
    `preview=${preparation.previewPublicId}`,
    `source=${preparation.sourceCommitment}`,
  ].join("\n"));
}

function assertPreparation(preview, preparation) {
  const prepared = preparation?.package;
  if (
    preview?.export?.publicId !== prepared?.previewPublicId
    || prepared?.cryptoVersion !== encryptedStartHereContract.cryptoVersion
    || prepared?.serverCanDecrypt !== false
    || prepared?.recipientDeliveryPerformed !== false
    || !Array.isArray(preparation?.eligibleRecipientKeys)
  ) {
    throw new Error("The encryption preparation response did not preserve its safety boundary.");
  }
}

function assertRecoveryInputs(artifact, recoveryKit) {
  if (
    artifact?.schemaVersion !== encryptedStartHereContract.packageSchemaVersion
    || recoveryKit?.schemaVersion !== encryptedStartHereContract.recoverySchemaVersion
    || artifact.packagePublicId !== recoveryKit.packagePublicId
    || artifact.cryptoVersion !== encryptedStartHereContract.cryptoVersion
    || recoveryKit.cryptoVersion !== encryptedStartHereContract.cryptoVersion
    || artifact?.content?.algorithm !== "AES-256-GCM"
    || artifact?.boundaries?.serverCanDecrypt !== false
  ) {
    throw new Error("The encrypted package and recovery key do not share the required contract.");
  }
}

function assertRecipientInputs(artifact, deviceKey) {
  if (
    artifact?.schemaVersion !== encryptedStartHereContract.packageSchemaVersion
    || artifact?.cryptoVersion !== encryptedStartHereContract.cryptoVersion
    || artifact?.content?.algorithm !== "AES-256-GCM"
    || artifact?.boundaries?.serverCanDecrypt !== false
    || artifact?.boundaries?.simulationOnly !== true
    || artifact?.boundaries?.releasePerformed !== false
    || artifact?.boundaries?.deliveryPerformed !== false
    || deviceKey?.algorithm !== "p256_hpke_base"
    || typeof deviceKey?.publicId !== "string"
    || !Array.isArray(artifact?.recipients)
  ) {
    throw new Error("The recipient package did not preserve the synthetic rehearsal boundary.");
  }
}

function toBase64Url(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value, expectedLength) {
  const bytes = fromBase64UrlRange(value, expectedLength, expectedLength);
  return bytes;
}

function fromBase64UrlRange(value, minimumLength, maximumLength) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Crypto material is not canonical base64url data.");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/")
    + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.length < minimumLength || bytes.length > maximumLength || toBase64Url(bytes) !== value) {
    throw new Error("Crypto material has an invalid encoded length.");
  }
  return bytes;
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
