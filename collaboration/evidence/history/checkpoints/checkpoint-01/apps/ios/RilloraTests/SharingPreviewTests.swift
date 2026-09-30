import XCTest
@testable import Rillora

final class SharingPreviewTests: XCTestCase {
    private let matter = "11111111-1111-4111-8111-111111111111"
    func testExactSelectedFieldsAreAccepted() {
        let grants = [SharingGrant(matterPublicId: matter, detailLevel: .name)]
        let preview = SharingPreview(items: [SharingPreviewItem(matterPublicId: matter, detailLevel: .name, fields: ["title": "Document", "category": "document"])], readOnly: true, purpose: "planner_directed", preview: true)
        XCTAssertTrue(preview.matches(grants))
        XCTAssertFalse(preview.matches([]))
    }
    func testMorePermissiveLevelCannotReplaceTheSelectedLevel() {
        let grants = [SharingGrant(matterPublicId: matter, detailLevel: .name)]
        let preview = SharingPreview(items: [SharingPreviewItem(matterPublicId: matter, detailLevel: .details, fields: ["title": "Document", "category": "document", "notes": "Private"])], readOnly: true, purpose: "planner_directed", preview: true)
        XCTAssertFalse(preview.matches(grants))
    }
    func testFuturePrivateFieldsAndUnselectedMatterAreRejected() {
        let grants = [SharingGrant(matterPublicId: matter, detailLevel: .details)]
        let privateField = SharingPreview(items: [SharingPreviewItem(matterPublicId: matter, detailLevel: .details, fields: ["title": "Document", "category": "document", "futurePrivateField": "Private"])], readOnly: true, purpose: "planner_directed", preview: true)
        XCTAssertFalse(privateField.matches(grants))
        let otherMatter = SharingPreview(items: [SharingPreviewItem(matterPublicId: "22222222-2222-4222-8222-222222222222", detailLevel: .details, fields: ["title": "Other", "category": "document"])], readOnly: true, purpose: "planner_directed", preview: true)
        XCTAssertFalse(otherMatter.matches(grants))
    }
}
