import Foundation

/// Reads the current hosted-form receipt before attempting session exchange.
/// The API must still verify the signature, issuer, audience, expiry and scope
/// of this same unchanged access token. Decoding here is not JWT verification.
enum HostedLegalAcceptanceProof {
    static let claimName = "https://rillora.xyz/legal-acceptance"
    private static let keys: Set<String> = [
        "termsVersion", "privacyVersion", "consentTextVersion", "bundleSha256",
        "acceptedTerms", "acknowledgedPrivacy", "acceptedElectronicRecords",
    ]

    static func validate(accessToken: String) throws -> LegalAcceptanceProof {
        guard accessToken.utf8.count <= 32_768 else { throw Failure.missingCurrentAcceptance }
        let segments = accessToken.split(separator: ".", omittingEmptySubsequences: false)
        guard segments.count == 3, segments.allSatisfy({ !$0.isEmpty }),
              let header = object(from: segments[0]), header["alg"] as? String == "RS256",
              let payload = object(from: segments[1]),
              let claim = payload[claimName] as? [String: Any],
              Set(claim.keys) == keys,
              let data = try? JSONSerialization.data(withJSONObject: claim),
              let acceptance = try? JSONDecoder().decode(LegalAcceptanceProof.self, from: data),
              acceptance == .current else {
            throw Failure.missingCurrentAcceptance
        }
        return acceptance
    }

    private static func object(from segment: Substring) -> [String: Any]? {
        var encoded = segment.replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        encoded += String(repeating: "=", count: (4 - encoded.count % 4) % 4)
        guard let data = Data(base64Encoded: encoded) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }

    enum Failure: LocalizedError {
        case missingCurrentAcceptance

        var errorDescription: String? {
            "The sign-in service did not confirm the current Terms and Privacy acknowledgement. Please try again."
        }
    }
}
