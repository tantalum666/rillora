import XCTest
@testable import Rillora

final class AccountDataTests: XCTestCase {
    func testBillingAcknowledgementIncludesPendingPurchaseAndDecodesOlderProfiles() throws {
        for (fields, expected) in [
            (#""hasSubscription":false,"hasPendingPurchase":true"#, true),
            (#""hasSubscription":false"#, false),
            (#""hasSubscription":true"#, true)
        ] {
            let data = Data("{\(fields),\"providers\":[\"stripe\"]}".utf8)
            let billing = try JSONDecoder().decode(AccountDataProfile.Billing.self, from: data)
            XCTAssertEqual(billing.requiresAcknowledgement, expected)
        }
    }
    func testDeletionReferenceIsPortableAndCannotBeAnAccountToken() throws {
        let reference = try AccountDeletionReference.create()
        XCTAssertTrue(reference.isValid)
        XCTAssertNotEqual(reference.receipt, try AccountDeletionReference.create().receipt)
        XCTAssertEqual(try JSONDecoder().decode(AccountDeletionReference.self, from: JSONEncoder().encode(reference)).receipt, reference.receipt)
        XCTAssertFalse(AccountDeletionReference(receipt: "not-a-receipt", createdAt: 0).isValid)
    }
    func testLocalReaderRejectsUnknownPartialAndOversizeFiles() throws {
        for text in ["{}", "null", "{\"schemaVersion\":\"rillora-map-backup-v1\"}"] {
            XCTAssertThrowsError(try SavedCopyContent.read(data: Data(text.utf8), filename: "map.json"))
        }
        XCTAssertThrowsError(try SavedCopyContent.read(data: Data(repeating: 65, count: 2 * 1024 * 1024 + 1), filename: "guide.txt"))
        guard case .text(let text) = try SavedCopyContent.read(data: Data("A saved guide".utf8), filename: "guide.txt") else { return XCTFail("Expected local guide") }
        XCTAssertEqual(text, "A saved guide")
    }
}
