import XCTest
@testable import Rillora

final class OfficialProviderGuideCatalogTests: XCTestCase {
    func testCatalogContainsUniqueActionableCommonProviderGuides() throws {
        let guides = OfficialProviderGuideCatalog.all

        XCTAssertEqual(guides.count, 11)
        XCTAssertEqual(Set(guides.map(\.id)).count, guides.count)
        XCTAssertEqual(
            Set(OfficialProviderGuideCatalog.priorityGuides.map(\.id)),
            OfficialProviderGuideCatalog.selfReportedProviderKeys
        )
        XCTAssertTrue(Set(guides.map(\.id)).isSuperset(of: [
            "apple", "google", "meta", "github", "password_manager",
            "microsoft", "linkedin", "x", "paypal", "coinbase", "binance",
        ]))
        XCTAssertTrue(guides.allSatisfy { !$0.prepareSteps.isEmpty })
        XCTAssertTrue(guides.allSatisfy { !$0.laterSteps.isEmpty })
        XCTAssertTrue(guides.allSatisfy { !$0.links.isEmpty })
    }

    func testEveryGuideUsesHTTPSOnAnOfficialHost() throws {
        let allowedHosts: Set<String> = [
            "support.apple.com",
            "digital-legacy.apple.com",
            "myaccount.google.com",
            "support.google.com",
            "www.facebook.com",
            "docs.github.com",
            "bitwarden.com",
            "support.1password.com",
            "support.microsoft.com",
            "www.linkedin.com",
            "help.x.com",
            "www.paypal.com",
            "help.coinbase.com",
            "www.binance.com",
            "support.binance.us",
        ]

        for guide in OfficialProviderGuideCatalog.all {
            for link in guide.links {
                let url = try XCTUnwrap(link.url, "Invalid URL for \(guide.name): \(link.urlString)")
                XCTAssertEqual(url.scheme, "https")
                XCTAssertTrue(
                    allowedHosts.contains(try XCTUnwrap(url.host)),
                    "Unexpected host for \(guide.name): \(url.host ?? "nil")"
                )
            }
        }
    }

    func testBinanceIsNotPresentedAsAProactiveLegacyContactFeature() throws {
        let binance = try XCTUnwrap(OfficialProviderGuideCatalog.guide(for: "binance"))

        XCTAssertEqual(binance.kind, .estateRequest)
        XCTAssertFalse(binance.supportsSelfReportedCheck)
        XCTAssertTrue(binance.boundary.contains("No public global Binance Legacy Contact switch was verified"))
        XCTAssertTrue(binance.links.contains { $0.urlString == "https://www.binance.com/en/chat" })
    }

    func testAppleAndGoogleProvideSetupAndAfterDeathRoutes() throws {
        for providerKey in ["apple", "google"] {
            let guide = try XCTUnwrap(OfficialProviderGuideCatalog.guide(for: providerKey))
            XCTAssertEqual(guide.kind, .prepareAndRequest)
            XCTAssertGreaterThanOrEqual(guide.links.count, 2)
            XCTAssertTrue(guide.supportsSelfReportedCheck)
        }
    }
}
