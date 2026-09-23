import CryptoKit
import Foundation
import XCTest
@testable import Rillora

final class StartHereEncryptionServiceTests: XCTestCase {
    func testEncryptsAndLocallyRecoversWithoutPuttingPrivateKeyInArtifact() throws {
        let service = CryptoKitStartHereEncryptionService()
        let bundle = try service.encrypt(preview: .cryptoFixture, preparation: .cryptoFixture)
        let recovered = try service.decrypt(
            artifact: bundle.artifact,
            recoveryKit: bundle.recoveryKit
        )

        XCTAssertEqual(recovered, StartHerePreview.cryptoFixture.package)
        XCTAssertEqual(bundle.artifact.recipients, [])
        XCTAssertFalse(bundle.artifact.boundaries.serverCanDecrypt)
        XCTAssertFalse(bundle.artifactData.contains(Data(bundle.recoveryKit.privateKey.utf8)))
        XCTAssertFalse(try JSONEncoder().encode(bundle.finalizeRequest).contains(
            Data(bundle.recoveryKit.privateKey.utf8)
        ))
    }

    func testWrapsTheContentKeyForEveryEligibleRecipientDevice() throws {
        let recipientPrivateKey = P256.KeyAgreement.PrivateKey()
        var preparation = EncryptedStartHerePreparation.cryptoFixture
        preparation = EncryptedStartHerePreparation(
            package: preparation.package,
            eligibleRecipientKeys: [
                EligibleRecipientDeviceKey(
                    publicId: "44444444-4444-4444-8444-444444444444",
                    displayName: "Synthetic Recipient",
                    deviceLabel: "Synthetic iPhone",
                    publicKey: recipientPrivateKey.publicKey.x963Representation.base64URL
                ),
            ]
        )
        let bundle = try CryptoKitStartHereEncryptionService().encrypt(
            preview: .cryptoFixture,
            preparation: preparation
        )
        let envelope = try XCTUnwrap(bundle.artifact.recipients.first)
        let info = Data("rillora:start-here:key-wrap:v1:\(preparation.package.publicId)".utf8)
        let aad = testAssociatedData(preparation.package)
        var recipient = try HPKE.Recipient(
            privateKey: recipientPrivateKey,
            ciphersuite: .P256_SHA256_AES_GCM_256,
            info: info,
            encapsulatedKey: try XCTUnwrap(Data(base64URL: envelope.encapsulatedKey))
        )
        let contentKey = try recipient.open(
            try XCTUnwrap(Data(base64URL: envelope.wrappedKey)),
            authenticating: aad
        )

        XCTAssertEqual(envelope.keyPublicId, preparation.eligibleRecipientKeys[0].publicId)
        XCTAssertEqual(contentKey.count, 32)
    }

    func testSyntheticRecipientDecryptsWithMemoryOnlyDeviceKeyAndRejectsAnotherKey() throws {
        let service = CryptoKitStartHereEncryptionService()
        let deviceKey = service.createRecipientDeviceKey()
        let keyPublicID = "77777777-7777-4777-8777-777777777777"
        var package = EncryptedStartHerePreparation.cryptoFixture.package
        package.simulationOnly = true
        package.releasePerformed = false
        let preparation = EncryptedStartHerePreparation(
            package: package,
            eligibleRecipientKeys: [
                EligibleRecipientDeviceKey(
                    publicId: keyPublicID,
                    displayName: "Synthetic Recipient",
                    deviceLabel: "Synthetic iPhone",
                    publicKey: deviceKey.publicKey
                ),
            ]
        )
        let bundle = try service.encrypt(preview: .cryptoFixture, preparation: preparation)
        let artifact = RecipientEncryptedStartHereArtifact(
            schemaVersion: bundle.artifact.schemaVersion,
            packagePublicId: bundle.artifact.packagePublicId,
            previewPublicId: bundle.artifact.previewPublicId,
            createdAt: bundle.artifact.createdAt,
            cryptoVersion: bundle.artifact.cryptoVersion,
            sourceCommitment: bundle.artifact.sourceCommitment,
            content: bundle.artifact.content,
            recipients: bundle.artifact.recipients,
            boundaries: RecipientRehearsalBoundaries(
                simulationOnly: true,
                identityVerified: false,
                deliveryPerformed: false,
                releasePerformed: false,
                serverCanDecrypt: false,
                externalCopiesRevocable: false
            )
        )

        let recovered = try service.decryptRecipient(
            artifact: artifact,
            deviceKey: deviceKey,
            keyPublicID: keyPublicID
        )

        XCTAssertEqual(recovered, StartHerePreview.cryptoFixture.package)
        XCTAssertFalse(try JSONEncoder().encode(artifact).contains(deviceKey.privateKeyData))
        XCTAssertThrowsError(try service.decryptRecipient(
            artifact: artifact,
            deviceKey: service.createRecipientDeviceKey(),
            keyPublicID: keyPublicID
        ))
    }

    func testDecryptsPackageGeneratedByPinnedWebHPKELibrary() throws {
        struct Fixture: Decodable {
            let artifact: EncryptedStartHereArtifact
            let recoveryKit: StartHereRecoveryKit
        }
        let fixture = try JSONDecoder().decode(Fixture.self, from: Data(Self.webFixture.utf8))
        let recovered = try CryptoKitStartHereEncryptionService().decrypt(
            artifact: fixture.artifact,
            recoveryKit: fixture.recoveryKit
        )

        XCTAssertEqual(recovered.planner.displayName, "Web Fixture Planner")
        XCTAssertEqual(recovered.matters.first?.title, "Web interoperability fixture")
        XCTAssertTrue(recovered.directionsNotPasswords)
        XCTAssertTrue(recovered.legalAuthorityNotGranted)
    }

    func testRejectsCiphertextTamperingBeforeDecryption() throws {
        let service = CryptoKitStartHereEncryptionService()
        let bundle = try service.encrypt(preview: .cryptoFixture, preparation: .cryptoFixture)
        var tamperedCiphertext = try XCTUnwrap(Data(base64URL: bundle.artifact.content.ciphertext))
        tamperedCiphertext[0] ^= 0x01
        let tamperedContent = EncryptedStartHereContent(
            algorithm: bundle.artifact.content.algorithm,
            nonce: bundle.artifact.content.nonce,
            ciphertext: tamperedCiphertext.base64URL,
            ciphertextSha256: bundle.artifact.content.ciphertextSha256
        )
        let tampered = EncryptedStartHereArtifact(
            schemaVersion: bundle.artifact.schemaVersion,
            packagePublicId: bundle.artifact.packagePublicId,
            previewPublicId: bundle.artifact.previewPublicId,
            createdAt: bundle.artifact.createdAt,
            cryptoVersion: bundle.artifact.cryptoVersion,
            sourceCommitment: bundle.artifact.sourceCommitment,
            content: tamperedContent,
            recovery: bundle.artifact.recovery,
            recipients: bundle.artifact.recipients,
            boundaries: bundle.artifact.boundaries
        )

        XCTAssertThrowsError(try service.decrypt(
            artifact: tampered,
            recoveryKit: bundle.recoveryKit
        ))
    }

    private func testAssociatedData(
        _ preparation: EncryptedStartHerePreparationRecord
    ) -> Data {
        Data([
            "rillora:start-here:encrypted:v1",
            "package=\(preparation.publicId)",
            "preview=\(preparation.previewPublicId)",
            "source=\(preparation.sourceCommitment)",
        ].joined(separator: "\n").utf8)
    }

    private static let webFixture = #"{"artifact":{"schemaVersion":"rillora-encrypted-start-here-v1","packagePublicId":"22222222-2222-4222-8222-222222222222","previewPublicId":"11111111-1111-4111-8111-111111111111","createdAt":"2026-08-10T00:00:00.000Z","cryptoVersion":"rillora-hpke-v1","sourceCommitment":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","content":{"algorithm":"AES-256-GCM","nonce":"19L5mE9V7WYvuSWm","ciphertext":"I80m92f0XI_UArl56K29INNUI8FZUtReajPLtD1LJtU6KSjaWZNfblg_gR1yBwM9ayX6nybSmOpkK5G5j0oWNeX4XOb31Q8bytkWiYdFjQRJMSNFud_BCmdDoaZab2QfVd9wJ13zanxa3hKJ75ZO8dA1eenbfu7IEBXcTmvvYk3a3Z0f_6wVGNoJ-Jymp930KCDHTxMoeqo-BfChVMHW_ih1C6LwuP1KmNdJqxoYhbxHU8a4Ehc0GErqoYkTgu3PTjS7LIENEsNu03_qyUDRizVkbqhV3YuzNC35IhjVxALlD95W-WN3x_2H3nmOX9bhmsDF03w61czycAwasGgBKnSo3DctgJW0N29Aa3tKb7GcyoqVSwwDuDQUEiGdeamUb2QeeuQzTPYuFC9cDSVOy4F-e5KCMARQPA9vn2tXaySI3kOFCFJvRmr0ch8qmKs-evEhgbgxvPw7Fkb2r16m9ka7fQyYagQx3YUoUh4-yPTh8dqBh_oEd2-8Ugvr1_MXSO3EXSHrDB3va9dZjvMTeTXE4ijxdjjIOKUXQnteZTKlvxfJczQJUl0I9lnE0Wkyw5aCoysQhyQgWluQMFVpnAyBNLYlivepRhrGvg9QCCNwfqL5lTM5a4BIaoQhdLFW0Bxs_sURDUn8DMQGmV-IWahE9firaLIYxALjkgudQI6dIpbHYlTs-pmCo12crd_fGxJD14qm-Yo0OHVOVd5FB-sUL_uCmVMOtSwTi0xORlWUj7hrCo8vhiUVAAQS8vecA-VfUStj1QQnFZ5M3Xqj87EtC-knywVDubU_UCQnNE91UJanOdzK4A0hJl1bNLKbL_3yDfhgX2q2aSjJTwxhOowjkZWMMW00uuXiDI0ujAMokj-J2MzUWw-SkrOyE9ZSWT5shvBQe3H8qNfB2Hj2KAcAyrNyrJWmQU-oyAGROtQHKxZMi2ovWeV7z_gDaAzhSJ6tEtAM9dDxc3WiB10Y1rRXBMDCyb_LZ7yv90CVBEF92AiltuSElFmdS1kiHXPJmey6I13mzzbdgKMbn55B8SWLUa98ppseag3hti9byHhIla1TkwxZFu4hoqLSFSPtcR5DadXJmNEM2Mt-LoCHnM7DqCJ_IOTyItwNnAEzPoVm48hTUOkDJSqouSFXPxFb-amqwKse2Xge0lE","ciphertextSha256":"jFg4mx9zVn5eoXkHqhBmfe9gTkArQcGLxgdWA9PCR9M"},"recovery":{"publicKey":"BK8mvU0grtY2-KXJfykKpM5h9dL26PTSysE9_kz7dXZexLbd0ix85rQ1_nc7dlZYPBw0eBVifakD3Bu869XavZc","encapsulatedKey":"BM5pIcKgfB6kGSyRkkytIdAqhRyYZ07cxknAOo8RR2o32IJHcbCKpevPmeTIQy1HF8GmEdkP03J6qVisyIBz57I","wrappedKey":"lA5-mHdg0op9ElLH5FdKA3Gge3kkePjDnYwh7IuxUPBHKS2yT9Nkw_L0ntV3RbDH"},"recipients":[],"boundaries":{"serverCanDecrypt":false,"recipientDeliveryPerformed":false,"externalCopiesRevocable":false}},"recoveryKit":{"schemaVersion":"rillora-start-here-recovery-v1","packagePublicId":"22222222-2222-4222-8222-222222222222","cryptoVersion":"rillora-hpke-v1","privateKey":"v2fFtB9FTNkTWwGSB6-6yKPypPvNH1ID9W5Motn8xXY","warning":"Anyone with this recovery key and the encrypted package can decrypt it. Rillora cannot recover this key."}}"#
}

private extension StartHerePreview {
    static let cryptoFixture = StartHerePreview(
        export: StartHereExportRecord(
            publicId: "11111111-1111-4111-8111-111111111111",
            createdAt: "2026-08-10T00:00:00.000Z",
            expiresAt: "2026-08-10T00:15:00.000Z",
            status: "previewed",
            encryptedPackageCreated: false
        ),
        package: StartHerePackage(
            schemaVersion: "start-here-v1",
            planner: StartHerePlanner(displayName: "Synthetic Planner", locale: "en", timeZone: "UTC"),
            plan: StartHerePlan(status: "active"),
            matters: [],
            trustedContacts: [],
            directionsNotPasswords: true,
            legalAuthorityNotGranted: true
        )
    )
}

private extension EncryptedStartHerePreparation {
    static let cryptoFixture = EncryptedStartHerePreparation(
        package: EncryptedStartHerePreparationRecord(
            publicId: "22222222-2222-4222-8222-222222222222",
            previewPublicId: "11111111-1111-4111-8111-111111111111",
            createdAt: "2026-08-10T00:00:00.000Z",
            expiresAt: "2026-08-10T00:15:00.000Z",
            status: "generating",
            cryptoVersion: "rillora-hpke-v1",
            sourceCommitment: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            contentEncryption: "AES-256-GCM",
            keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
            serverCanDecrypt: false,
            recipientDeliveryPerformed: false
        ),
        eligibleRecipientKeys: []
    )
}

private extension Data {
    init?(base64URL: String) {
        var base64 = base64URL.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
        self.init(base64Encoded: base64)
    }

    var base64URL: String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
