import Foundation
import Security
import LocalAuthentication
import CryptoKit
import Darwin

enum VaultError: Error { case invalid, unavailable, unexpectedAccess }

func context(interaction: Bool) -> LAContext {
    let result = LAContext()
    result.localizedReason = "Allow Rillora to use this protected operator credential."
    result.interactionNotAllowed = !interaction
    result.touchIDAuthenticationAllowableReuseDuration = 0
    return result
}
func accountID(_ value: String) throws -> Data {
    guard let id = UUID(uuidString: value), id.uuidString.lowercased() == value else { throw VaultError.invalid }
    return Data(("rillora-operator-credential-v1|" + value).utf8)
}
func seal(_ data: Data, account: String, userPresence: Bool = true) throws -> [String: Any] {
    guard SecureEnclave.isAvailable, !data.isEmpty, data.count <= 65536 else { throw VaultError.unavailable }
    let aad = try accountID(account)
    let flags: SecAccessControlCreateFlags = userPresence ? [.privateKeyUsage, .userPresence] : [.privateKeyUsage]
    guard let access = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, flags, nil) else { throw VaultError.unavailable }
    let hardware = try SecureEnclave.P256.KeyAgreement.PrivateKey(accessControl: access)
    let ephemeral = P256.KeyAgreement.PrivateKey()
    let salt = Data((0..<32).map { _ in UInt8.random(in: .min ... .max) })
    let shared = try ephemeral.sharedSecretFromKeyAgreement(with: hardware.publicKey)
    let key = shared.hkdfDerivedSymmetricKey(using: SHA256.self, salt: salt, sharedInfo: aad, outputByteCount: 32)
    let sealed = try AES.GCM.seal(data, using: key, authenticating: aad)
    guard let combined = sealed.combined else { throw VaultError.invalid }
    return ["version": 1, "key": hardware.dataRepresentation.base64EncodedString(),
            "ephemeral": ephemeral.publicKey.x963Representation.base64EncodedString(),
            "salt": salt.base64EncodedString(), "payload": combined.base64EncodedString()]
}
func open(_ input: [String: Any], account: String, interaction: Bool = true) throws -> Data {
    guard Set(input.keys) == Set(["version", "key", "ephemeral", "salt", "payload"]),
          let version = input["version"] as? NSNumber, CFGetTypeID(version) != CFBooleanGetTypeID(), version.doubleValue == 1,
          let encodedKey = input["key"] as? String, let keyData = Data(base64Encoded: encodedKey), keyData.count <= 8192,
          let encodedPublic = input["ephemeral"] as? String, let publicData = Data(base64Encoded: encodedPublic), publicData.count == 65,
          let encodedSalt = input["salt"] as? String, let salt = Data(base64Encoded: encodedSalt), salt.count == 32,
          let encodedPayload = input["payload"] as? String, let payload = Data(base64Encoded: encodedPayload),
          payload.count >= 29, payload.count <= 65564 else { throw VaultError.invalid }
    let aad = try accountID(account)
    let hardware = try SecureEnclave.P256.KeyAgreement.PrivateKey(dataRepresentation: keyData, authenticationContext: context(interaction: interaction))
    let other = try P256.KeyAgreement.PublicKey(x963Representation: publicData)
    let shared = try hardware.sharedSecretFromKeyAgreement(with: other)
    let key = shared.hkdfDerivedSymmetricKey(using: SHA256.self, salt: salt, sharedInfo: aad, outputByteCount: 32)
    return try AES.GCM.open(AES.GCM.SealedBox(combined: payload), using: key, authenticating: aad)
}
func run(_ input: [String: Any]) throws -> [String: Any] {
    guard let operation = input["operation"] as? String else { throw VaultError.invalid }
    if operation == "probe", input.count == 1 {
        let account = UUID().uuidString.lowercased()
        let data = Data("Rillora nonsecret storage availability control".utf8)
        guard try open(seal(data, account: account), account: account) == data else { throw VaultError.invalid }
        return ["ready": true]
    }
    if operation == "test-unattended", input.count == 1 {
        // The unprotected control accepts only this fixed nonsecret value. No
        // credential operation can choose or downgrade its access-control flags.
        let account = UUID().uuidString.lowercased()
        let data = Data("Rillora nonsecret hardware test".utf8)
        let control = try seal(data, account: account, userPresence: false)
        guard try open(control, account: account, interaction: false) == data else { throw VaultError.invalid }
        let protected = try seal(data, account: account)
        var denied = false
        do { _ = try open(protected, account: account, interaction: false) } catch { denied = true }
        guard denied else { throw VaultError.unexpectedAccess }
        var tampered = control
        var bytes = Data(base64Encoded: control["payload"] as! String)!
        bytes[bytes.count - 1] ^= 1
        tampered["payload"] = bytes.base64EncodedString()
        var tamperingDenied = false, wrongAccountDenied = false
        do { _ = try open(tampered, account: account, interaction: false) } catch { tamperingDenied = true }
        do { _ = try open(control, account: UUID().uuidString.lowercased(), interaction: false) } catch { wrongAccountDenied = true }
        guard tamperingDenied, wrongAccountDenied else { throw VaultError.unexpectedAccess }
        return ["secureEnclave": true, "controlRoundTrip": true, "unattendedReadDenied": true,
                "tamperingDenied": true, "wrongAccountDenied": true]
    }
    guard let account = input["account"] as? String else { throw VaultError.invalid }
    if operation == "put", input.count == 3, let encoded = input["data"] as? String,
       let data = Data(base64Encoded: encoded) {
        return ["stored": true, "envelope": try seal(data, account: account)]
    }
    if operation == "get", input.count == 3, let envelope = input["envelope"] as? [String: Any] {
        guard isatty(STDOUT_FILENO) == 0 else { throw VaultError.invalid }
        return ["data": try open(envelope, account: account).base64EncodedString()]
    }
    if operation == "update", input.count == 4, let encoded = input["data"] as? String,
       let data = Data(base64Encoded: encoded), let envelope = input["envelope"] as? [String: Any] {
        _ = try open(envelope, account: account)
        return ["updated": true, "envelope": try seal(data, account: account)]
    }
    throw VaultError.invalid
}
do {
    var data = Data()
    while let chunk = try FileHandle.standardInput.read(upToCount: min(8192, 262145 - data.count)), !chunk.isEmpty {
        data.append(chunk)
        guard data.count <= 262144 else { throw VaultError.invalid }
    }
    guard let input = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw VaultError.invalid }
    let output = try JSONSerialization.data(withJSONObject: run(input), options: [.sortedKeys])
    try FileHandle.standardOutput.write(contentsOf: output)
} catch {
    FileHandle.standardError.write(Data("Protected Rillora credential operation did not complete.\n".utf8))
    exit(1)
}
