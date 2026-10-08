import XCTest
@testable import Rillora

final class OfficialProviderGuideCatalogTests: XCTestCase {
    func testChineseGuidesPreserveEvidenceAndCompleteEveryReadingMode() throws {
        for source in OfficialProviderGuideCatalog.all {
            let chinese = source.localized(localeIdentifier: "zh-Hans")
            XCTAssertNotEqual(chinese.summary, source.summary)
            XCTAssertEqual(chinese.prepareSteps.count, source.prepareSteps.count)
            XCTAssertEqual(chinese.laterSteps.count, source.laterSteps.count)
            XCTAssertEqual(chinese.usuallyRequested.count, source.usuallyRequested.count)
            XCTAssertEqual(chinese.links.map(\.urlString), source.links.map(\.urlString))
            XCTAssertEqual(chinese.links.map(\.phase), source.links.map(\.phase))
            XCTAssertEqual(chinese.lastReviewed, source.lastReviewed)
            XCTAssertEqual(chinese.matterMatch, source.matterMatch)
            XCTAssertEqual(source.localized(localeIdentifier: "en"), source)
            XCTAssertEqual(source.localized(localeIdentifier: "fr"), source)
            XCTAssertEqual(source.localized(localeIdentifier: "zh_CN"), chinese)
        }
    }

    func testMissingChineseOverlayFallsBackToEnglish() throws {
        let data = try Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: "provider-guides", withExtension: "json")))
        let document = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        var first = try XCTUnwrap((document["guides"] as? [[String: Any]])?.first)
        first.removeValue(forKey: "translations")
        let source = try JSONDecoder().decode(OfficialProviderGuide.self, from: JSONSerialization.data(withJSONObject: first))
        XCTAssertEqual(source.localized(localeIdentifier: "zh-CN"), source)
        first["translations"] = ["zh-Hans": ["summary": 12]]
        let malformed = try JSONDecoder().decode(OfficialProviderGuide.self, from: JSONSerialization.data(withJSONObject: first))
        XCTAssertEqual(malformed.localized(localeIdentifier: "zh-CN").summary, source.summary)
    }

    func testSuggestionsUseOnlyVisibleAccountContextWithoutFalseRegionalMatches() throws {
        struct MatchCase: Decodable { let name: String; let fields: [String: String]; let expected: [String] }
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "provider-guide-match-cases", withExtension: "json"))
        let cases = try JSONDecoder().decode([MatchCase].self, from: Data(contentsOf: url))
        for value in cases {
            XCTAssertEqual(OfficialProviderGuideCatalog.suggestions(sharedFields: value.fields).map(\.id), value.expected, value.name)
        }
    }
    func testCatalogContainsUniqueActionableCommonProviderGuides() throws {
        let guides = OfficialProviderGuideCatalog.all

        XCTAssertTrue(OfficialProviderGuideCatalog.isAvailable)
        XCTAssertEqual(guides.count, 18)
        XCTAssertEqual(Set(guides.map(\.id)).count, guides.count)
        XCTAssertEqual(
            Set(OfficialProviderGuideCatalog.priorityGuides.map(\.id)),
            OfficialProviderGuideCatalog.selfReportedProviderKeys
        )
        XCTAssertTrue(Set(guides.map(\.id)).isSuperset(of: [
            "apple", "google", "meta", "github", "password_manager",
            "microsoft", "linkedin", "x", "paypal", "coinbase", "binance",
            "instagram", "binance_us", "dropbox", "adobe", "yahoo", "netflix", "steam",
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
            "www.facebook.com", "help.instagram.com",
            "docs.github.com",
            "bitwarden.com",
            "support.1password.com",
            "support.microsoft.com",
            "www.linkedin.com",
            "help.x.com", "help.twitter.com", "survey.adobe.com",
            "www.paypal.com",
            "help.coinbase.com",
            "www.binance.com",
            "support.binance.us",
            "help.dropbox.com", "helpx.adobe.com", "help.yahoo.com", "en-global.help.yahoo.com",
            "help.netflix.com", "store.steampowered.com", "help.steampowered.com",
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
        XCTAssertEqual(binance.initialPart, "later")
        XCTAssertTrue(binance.laterSteps.first?.contains("your own Binance account") == true)
        XCTAssertTrue(binance.links.contains { $0.urlString == "https://www.binance.com/en/my/risk/appeal?templateId=T192d41590" })
    }

    func testRegionalGuidesAndAliasesRemainDistinct() throws {
        let us = try XCTUnwrap(OfficialProviderGuideCatalog.guide(for: "binance_us"))
        XCTAssertFalse(us.supportsSelfReportedCheck)
        XCTAssertTrue(us.usuallyRequested.contains { $0.localizedCaseInsensitiveContains("selfie video") })
        XCTAssertEqual(Set(OfficialProviderGuideCatalog.all.filter { $0.matches("币安") }.map(\.id)), ["binance", "binance_us"])
        XCTAssertTrue(OfficialProviderGuideCatalog.guide(for: "google")?.matches("Gmail") == true)
        let apple = try XCTUnwrap(OfficialProviderGuideCatalog.guide(for: "apple"))
        XCTAssertTrue(apple.links(for: "now").allSatisfy { $0.phase != "afterDeath" })
        XCTAssertTrue(apple.links(for: "later").allSatisfy { $0.phase != "prepare" })
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

