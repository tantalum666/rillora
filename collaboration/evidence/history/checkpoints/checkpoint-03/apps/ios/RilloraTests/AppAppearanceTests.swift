import XCTest
import SwiftUI
import UIKit
@testable import Rillora

@MainActor
final class AppAppearanceTests: XCTestCase {
    func testOldHomePreferenceMigratesWithoutReplacingExistingAppChoice() {
        let name = "rillora-appearance-test-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        defaults.set("light", forKey: "rillora.public-home.appearance.v1")
        AppAppearance.migratePreference(in: defaults)
        XCTAssertEqual(defaults.string(forKey: AppAppearance.storageKey), "light")
        XCTAssertNil(defaults.object(forKey: "rillora.public-home.appearance.v1"))
        defaults.set("dark", forKey: "rillora.public-home.appearance.v1")
        AppAppearance.migratePreference(in: defaults)
        XCTAssertEqual(defaults.string(forKey: AppAppearance.storageKey), "light")
    }

    func testSystemHasNoForcedSchemeAndInvalidLegacyValueDoesNotPersist() {
        XCTAssertNil(AppAppearance.system.colorScheme)
        let name = "rillora-appearance-test-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        defaults.set("invalid", forKey: "rillora.public-home.appearance.v1")
        AppAppearance.migratePreference(in: defaults)
        XCTAssertNil(defaults.object(forKey: AppAppearance.storageKey))
    }

    func testReadingTextAndPrimaryActionsRemainReadableInBothSchemes() {
        for style: UIUserInterfaceStyle in [.light, .dark] {
            let traits = UITraitCollection(userInterfaceStyle: style)
            for text in [RilloraTheme.ink, RilloraTheme.body, RilloraTheme.muted, RilloraTheme.sage] {
                for surface in [RilloraTheme.canvas, RilloraTheme.surface] {
                    XCTAssertGreaterThanOrEqual(contrast(text, surface, traits), 4.5)
                }
            }
            XCTAssertGreaterThanOrEqual(contrast(RilloraTheme.onClay, RilloraTheme.clay, traits), 4.5)
        }
    }

    private func contrast(_ first: Color, _ second: Color, _ traits: UITraitCollection) -> Double {
        func luminance(_ color: Color) -> Double {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            UIColor(color).resolvedColor(with: traits).getRed(&r, green: &g, blue: &b, alpha: &a)
            func linear(_ component: CGFloat) -> Double {
                let value = Double(component)
                if value <= 0.04045 { return value / 12.92 }
                return pow((value + 0.055) / 1.055, 2.4)
            }
            return linear(r) * 0.2126 + linear(g) * 0.7152 + linear(b) * 0.0722
        }
        let a = luminance(first), b = luminance(second)
        return (max(a, b) + 0.05) / (min(a, b) + 0.05)
    }
}
