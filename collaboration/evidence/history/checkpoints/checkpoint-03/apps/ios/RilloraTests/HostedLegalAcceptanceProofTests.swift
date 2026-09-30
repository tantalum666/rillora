import XCTest
@testable import Rillora

final class HostedLegalAcceptanceProofTests: XCTestCase {
    func testCurrentHostedReceiptProducesTheExistingAPIProof() throws {
        XCTAssertEqual(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: current)), .current)
    }

    func testMissingClaimAndMalformedTokensFailClosed() {
        for value in ["", "opaque-token", "a.b.c", token(claim: nil), String(repeating: "a", count: 32_769)] {
            XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: value))
        }
    }

    func testEveryConsentBooleanMustBeExplicitlyTrue() {
        for key in ["acceptedTerms", "acknowledgedPrivacy", "acceptedElectronicRecords"] {
            for value in [false, "true", 1] as [Any] {
                var claim = current
                claim[key] = value
                XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: claim)))
            }
        }
    }

    func testStaleVersionsAndWrongDigestAreRejected() {
        for key in ["termsVersion", "privacyVersion", "consentTextVersion", "bundleSha256"] {
            var claim = current
            claim[key] = "stale"
            XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: claim)))
        }
    }

    func testMissingAndUnexpectedFieldsAreRejected() {
        var claim = current
        claim.removeValue(forKey: "acceptedTerms")
        XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: claim)))
        claim = current
        claim["billingAccepted"] = true
        XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: claim)))
    }

    func testUnsignedReceiptIsRejectedBeforeExchange() {
        XCTAssertThrowsError(try HostedLegalAcceptanceProof.validate(accessToken: token(claim: current, algorithm: "none")))
    }

    private var current: [String: Any] {
        let data = try! JSONEncoder().encode(LegalAcceptanceProof.current)
        return try! JSONSerialization.jsonObject(with: data) as! [String: Any]
    }

    private func token(claim: [String: Any]?, algorithm: String = "RS256") -> String {
        let header = encode(["alg": algorithm, "typ": "JWT"])
        let payload = encode(claim.map { [HostedLegalAcceptanceProof.claimName: $0] } ?? [:])
        // This fixture exercises claim parsing only. API JWT verification is separate.
        return "\(header).\(payload).test-signature"
    }

    private func encode(_ object: [String: Any]) -> String {
        try! JSONSerialization.data(withJSONObject: object).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
