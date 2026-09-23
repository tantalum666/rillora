import CryptoKit
import Foundation

protocol StartHereEncrypting: Sendable {
    func encrypt(
        preview: StartHerePreview,
        preparation: EncryptedStartHerePreparation
    ) throws -> EncryptedStartHereBundle

    func decrypt(
        artifact: EncryptedStartHereArtifact,
        recoveryKit: StartHereRecoveryKit
    ) throws -> StartHerePackage

    func createRecipientDeviceKey() -> RecipientDeviceKeyMaterial
    func decryptRecipient(
        artifact: RecipientEncryptedStartHereArtifact,
        deviceKey: RecipientDeviceKeyMaterial,
        keyPublicID: String
    ) throws -> StartHerePackage
}

enum StartHereEncryptionError: LocalizedError, Equatable {
    case invalidPreparation
    case invalidCryptoMaterial
    case recoveryVerificationFailed
    case invalidRecoveredPayload

    var errorDescription: String? {
        switch self {
        case .invalidPreparation:
            "The encryption preparation did not preserve the Start Here safety boundary."
        case .invalidCryptoMaterial:
            "The encryption material was malformed or used an unsupported algorithm."
        case .recoveryVerificationFailed:
            "The encrypted package failed its local offline-recovery test."
        case .invalidRecoveredPayload:
            "The recovered package did not preserve the reviewed Start Here boundary."
        }
    }
}

struct CryptoKitStartHereEncryptionService: StartHereEncrypting {
    static let cryptoVersion = "rillora-hpke-v1"
    static let artifactSchemaVersion = "rillora-encrypted-start-here-v1"
    static let payloadSchemaVersion = "rillora-encrypted-start-here-payload-v1"
    static let recoverySchemaVersion = "rillora-start-here-recovery-v1"

    func encrypt(
        preview: StartHerePreview,
        preparation: EncryptedStartHerePreparation
    ) throws -> EncryptedStartHereBundle {
        let prepared = preparation.package
        guard preview.export.publicId == prepared.previewPublicId,
              prepared.cryptoVersion == Self.cryptoVersion,
              prepared.contentEncryption == "AES-256-GCM",
              prepared.keyWrapping == "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
              !prepared.serverCanDecrypt,
              !prepared.recipientDeliveryPerformed else {
            throw StartHereEncryptionError.invalidPreparation
        }

        let payload = EncryptedStartHerePayload(
            schemaVersion: Self.payloadSchemaVersion,
            packagePublicId: prepared.publicId,
            previewPublicId: prepared.previewPublicId,
            sourceCommitment: prepared.sourceCommitment,
            createdAt: prepared.createdAt,
            package: preview.package,
            boundaries: .init(
                directionsNotPasswords: true,
                legalAuthorityNotGranted: true,
                recipientDeliveryPerformed: false,
                simulationOnly: prepared.simulationOnly ?? false,
                releasePerformed: false
            )
        )
        let plaintext = try encoder().encode(payload)
        let associatedData = associatedData(for: prepared)
        let info = Data("rillora:start-here:key-wrap:v1:\(prepared.publicId)".utf8)
        let contentKey = SymmetricKey(size: .bits256)
        let contentKeyData = contentKey.withUnsafeBytes { Data($0) }
        let sealedContent = try AES.GCM.seal(
            plaintext,
            using: contentKey,
            authenticating: associatedData
        )
        let nonce = Data(sealedContent.nonce)
        let ciphertext = sealedContent.ciphertext + sealedContent.tag

        let recoveryPrivateKey = P256.KeyAgreement.PrivateKey()
        let recoveryEnvelope = try wrap(
            contentKeyData,
            for: recoveryPrivateKey.publicKey,
            info: info,
            associatedData: associatedData
        )
        let recovery = RecoveryKeyEnvelope(
            publicKey: recoveryPrivateKey.publicKey.x963Representation.base64URLEncodedString(),
            encapsulatedKey: recoveryEnvelope.encapsulatedKey,
            wrappedKey: recoveryEnvelope.wrappedKey
        )

        let recipients = try preparation.eligibleRecipientKeys.map { recipient in
            guard let publicKeyData = Data(base64URL: recipient.publicKey, expectedCount: 65) else {
                throw StartHereEncryptionError.invalidCryptoMaterial
            }
            let publicKey = try P256.KeyAgreement.PublicKey(x963Representation: publicKeyData)
            let envelope = try wrap(
                contentKeyData,
                for: publicKey,
                info: info,
                associatedData: associatedData
            )
            return RecipientKeyEnvelope(
                keyPublicId: recipient.publicId,
                encapsulatedKey: envelope.encapsulatedKey,
                wrappedKey: envelope.wrappedKey
            )
        }

        let artifact = EncryptedStartHereArtifact(
            schemaVersion: Self.artifactSchemaVersion,
            packagePublicId: prepared.publicId,
            previewPublicId: prepared.previewPublicId,
            createdAt: prepared.createdAt,
            cryptoVersion: Self.cryptoVersion,
            sourceCommitment: prepared.sourceCommitment,
            content: EncryptedStartHereContent(
                algorithm: "AES-256-GCM",
                nonce: nonce.base64URLEncodedString(),
                ciphertext: ciphertext.base64URLEncodedString(),
                ciphertextSha256: Data(SHA256.hash(data: ciphertext)).base64URLEncodedString()
            ),
            recovery: recovery,
            recipients: recipients,
            boundaries: EncryptedStartHereBoundaries(
                serverCanDecrypt: false,
                recipientDeliveryPerformed: false,
                externalCopiesRevocable: false,
                simulationOnly: prepared.simulationOnly,
                releasePerformed: false
            )
        )
        let recoveryKit = StartHereRecoveryKit(
            schemaVersion: Self.recoverySchemaVersion,
            packagePublicId: prepared.publicId,
            cryptoVersion: Self.cryptoVersion,
            privateKey: recoveryPrivateKey.rawRepresentation.base64URLEncodedString(),
            warning: "Anyone with this recovery key and the encrypted package can decrypt it. Rillora cannot recover this key."
        )

        let recoveredPackage = try decrypt(artifact: artifact, recoveryKit: recoveryKit)
        guard recoveredPackage == preview.package else {
            throw StartHereEncryptionError.recoveryVerificationFailed
        }

        let artifactData = try exportEncoder().encode(artifact)
        let recoveryKitData = try exportEncoder().encode(recoveryKit)
        return EncryptedStartHereBundle(
            artifact: artifact,
            recoveryKit: recoveryKit,
            artifactData: artifactData,
            recoveryKitData: recoveryKitData,
            finalizeRequest: EncryptedStartHereFinalizeRequest(
                previewPublicId: prepared.previewPublicId,
                cryptoVersion: Self.cryptoVersion,
                contentNonce: artifact.content.nonce,
                contentCiphertext: artifact.content.ciphertext,
                ciphertextSha256: artifact.content.ciphertextSha256,
                recovery: artifact.recovery,
                recipients: artifact.recipients,
                acknowledgesOfflineRecoveryRisk: true,
                acknowledgesExternalCopiesNotRevocable: true
            )
        )
    }

    func createRecipientDeviceKey() -> RecipientDeviceKeyMaterial {
        let privateKey = P256.KeyAgreement.PrivateKey()
        return RecipientDeviceKeyMaterial(
            algorithm: "p256_hpke_base",
            publicKey: privateKey.publicKey.x963Representation.base64URLEncodedString(),
            privateKeyData: privateKey.rawRepresentation
        )
    }

    func decryptRecipient(
        artifact: RecipientEncryptedStartHereArtifact,
        deviceKey: RecipientDeviceKeyMaterial,
        keyPublicID: String
    ) throws -> StartHerePackage {
        guard artifact.boundaries.preservesSafetyBoundary,
              deviceKey.algorithm == "p256_hpke_base",
              let envelope = artifact.recipients.first(where: { $0.keyPublicId == keyPublicID })
        else { throw StartHereEncryptionError.invalidCryptoMaterial }
        let ownerCompatibleArtifact = EncryptedStartHereArtifact(
            schemaVersion: artifact.schemaVersion,
            packagePublicId: artifact.packagePublicId,
            previewPublicId: artifact.previewPublicId,
            createdAt: artifact.createdAt,
            cryptoVersion: artifact.cryptoVersion,
            sourceCommitment: artifact.sourceCommitment,
            content: artifact.content,
            recovery: RecoveryKeyEnvelope(
                publicKey: deviceKey.publicKey,
                encapsulatedKey: envelope.encapsulatedKey,
                wrappedKey: envelope.wrappedKey
            ),
            recipients: artifact.recipients,
            boundaries: EncryptedStartHereBoundaries(
                serverCanDecrypt: false,
                recipientDeliveryPerformed: false,
                externalCopiesRevocable: false,
                simulationOnly: true,
                releasePerformed: false
            )
        )
        let recoveryCompatibleKey = StartHereRecoveryKit(
            schemaVersion: Self.recoverySchemaVersion,
            packagePublicId: artifact.packagePublicId,
            cryptoVersion: artifact.cryptoVersion,
            privateKey: deviceKey.privateKeyData.base64URLEncodedString(),
            warning: "Memory-only synthetic recipient key."
        )
        return try decrypt(
            artifact: ownerCompatibleArtifact,
            recoveryKit: recoveryCompatibleKey
        )
    }

    func decrypt(
        artifact: EncryptedStartHereArtifact,
        recoveryKit: StartHereRecoveryKit
    ) throws -> StartHerePackage {
        guard artifact.schemaVersion == Self.artifactSchemaVersion,
              recoveryKit.schemaVersion == Self.recoverySchemaVersion,
              artifact.packagePublicId == recoveryKit.packagePublicId,
              artifact.cryptoVersion == Self.cryptoVersion,
              recoveryKit.cryptoVersion == Self.cryptoVersion,
              artifact.content.algorithm == "AES-256-GCM",
              !artifact.boundaries.serverCanDecrypt else {
            throw StartHereEncryptionError.invalidCryptoMaterial
        }
        guard let privateKeyData = Data(base64URL: recoveryKit.privateKey, expectedCount: 32),
              let encapsulatedKey = Data(
                base64URL: artifact.recovery.encapsulatedKey,
                expectedCount: 65
              ),
              let wrappedKey = Data(base64URL: artifact.recovery.wrappedKey, expectedCount: 48),
              let nonceData = Data(base64URL: artifact.content.nonce, expectedCount: 12),
              let ciphertextAndTag = Data(
                base64URL: artifact.content.ciphertext,
                countRange: 17...65_536
              ),
              let expectedDigest = Data(
                base64URL: artifact.content.ciphertextSha256,
                expectedCount: 32
              ) else {
            throw StartHereEncryptionError.invalidCryptoMaterial
        }
        guard Data(SHA256.hash(data: ciphertextAndTag)) == expectedDigest else {
            throw StartHereEncryptionError.recoveryVerificationFailed
        }

        let privateKey = try P256.KeyAgreement.PrivateKey(rawRepresentation: privateKeyData)
        let info = Data("rillora:start-here:key-wrap:v1:\(artifact.packagePublicId)".utf8)
        let associatedData = associatedData(
            packagePublicId: artifact.packagePublicId,
            previewPublicId: artifact.previewPublicId,
            sourceCommitment: artifact.sourceCommitment
        )
        var recipient = try HPKE.Recipient(
            privateKey: privateKey,
            ciphersuite: .P256_SHA256_AES_GCM_256,
            info: info,
            encapsulatedKey: encapsulatedKey
        )
        let contentKeyData = try recipient.open(wrappedKey, authenticating: associatedData)
        let contentKey = SymmetricKey(data: contentKeyData)
        let ciphertext = ciphertextAndTag.dropLast(16)
        let tag = ciphertextAndTag.suffix(16)
        let sealedBox = try AES.GCM.SealedBox(
            nonce: AES.GCM.Nonce(data: nonceData),
            ciphertext: ciphertext,
            tag: tag
        )
        let plaintext = try AES.GCM.open(
            sealedBox,
            using: contentKey,
            authenticating: associatedData
        )
        let payload = try decoder().decode(EncryptedStartHerePayload.self, from: plaintext)
        guard payload.schemaVersion == Self.payloadSchemaVersion,
              payload.packagePublicId == artifact.packagePublicId,
              payload.previewPublicId == artifact.previewPublicId,
              payload.sourceCommitment == artifact.sourceCommitment,
              payload.boundaries.directionsNotPasswords,
              payload.boundaries.legalAuthorityNotGranted,
              !payload.boundaries.recipientDeliveryPerformed,
              payload.boundaries.releasePerformed != true,
              artifact.boundaries.simulationOnly != true || payload.boundaries.simulationOnly == true else {
            throw StartHereEncryptionError.invalidRecoveredPayload
        }
        return payload.package
    }

    private func wrap(
        _ contentKey: Data,
        for publicKey: P256.KeyAgreement.PublicKey,
        info: Data,
        associatedData: Data
    ) throws -> HPKEKeyEnvelope {
        var sender = try HPKE.Sender(
            recipientKey: publicKey,
            ciphersuite: .P256_SHA256_AES_GCM_256,
            info: info
        )
        let wrappedKey = try sender.seal(contentKey, authenticating: associatedData)
        return HPKEKeyEnvelope(
            encapsulatedKey: sender.encapsulatedKey.base64URLEncodedString(),
            wrappedKey: wrappedKey.base64URLEncodedString()
        )
    }

    private func associatedData(for preparation: EncryptedStartHerePreparationRecord) -> Data {
        associatedData(
            packagePublicId: preparation.publicId,
            previewPublicId: preparation.previewPublicId,
            sourceCommitment: preparation.sourceCommitment
        )
    }

    private func associatedData(
        packagePublicId: String,
        previewPublicId: String,
        sourceCommitment: String
    ) -> Data {
        Data(
            [
                "rillora:start-here:encrypted:v1",
                "package=\(packagePublicId)",
                "preview=\(previewPublicId)",
                "source=\(sourceCommitment)",
            ].joined(separator: "\n").utf8
        )
    }

    private func encoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return encoder
    }

    private func exportEncoder() -> JSONEncoder {
        let encoder = encoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return encoder
    }

    private func decoder() -> JSONDecoder { JSONDecoder() }
}

private struct EncryptedStartHerePayload: Codable, Equatable, Sendable {
    let schemaVersion: String
    let packagePublicId: String
    let previewPublicId: String
    let sourceCommitment: String
    let createdAt: String
    let package: StartHerePackage
    let boundaries: EncryptedStartHerePayloadBoundaries
}

private struct EncryptedStartHerePayloadBoundaries: Codable, Equatable, Sendable {
    let directionsNotPasswords: Bool
    let legalAuthorityNotGranted: Bool
    let recipientDeliveryPerformed: Bool
    let simulationOnly: Bool?
    let releasePerformed: Bool?
}

private extension Data {
    init?(base64URL value: String, expectedCount: Int) {
        self.init(base64URL: value, countRange: expectedCount...expectedCount)
    }

    init?(base64URL value: String, countRange: ClosedRange<Int>) {
        guard !value.isEmpty,
              value.range(of: #"^[A-Za-z0-9_-]+$"#, options: .regularExpression) != nil else {
            return nil
        }
        var base64 = value.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
        guard let decoded = Data(base64Encoded: base64),
              countRange.contains(decoded.count),
              decoded.base64URLEncodedString() == value else {
            return nil
        }
        self = decoded
    }

    func base64URLEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
