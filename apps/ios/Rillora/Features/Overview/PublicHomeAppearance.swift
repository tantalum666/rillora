import SwiftUI

/// Public Home has its own appearance; private workspace screens retain Graphite.
enum PublicHomeAppearance: String, CaseIterable, Identifiable {
    case system, light, dark
    static let storageKey = "rillora.public-home.appearance.v1"
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var colorScheme: ColorScheme? {
        switch self { case .system: nil; case .light: .light; case .dark: .dark }
    }
    var symbol: String {
        switch self { case .system: "iphone"; case .light: "sun.max"; case .dark: "moon" }
    }
}

struct PublicHomePalette {
    let scheme: ColorScheme
    var isDark: Bool { scheme == .dark }
    var paper: Color { isDark ? Self.color(0x171F1B) : Self.color(0xF5F1E8) }
    var ink: Color { isDark ? Self.color(0xF1ECE2) : Self.color(0x23473D) }
    var muted: Color { isDark ? Self.color(0xB8BAB2) : Self.color(0x62756B) }
    var rule: Color { ink.opacity(0.18) }
    var sheet: Color { isDark ? Self.color(0x212D25) : Self.color(0xFCF9F2) }
    var accent: Color { isDark ? Self.color(0xCDE1B0) : Self.color(0x23473D) }
    var onAccent: Color { isDark ? Self.color(0x171F1B) : Self.color(0xF5F1E8) }
    var bronze: Color { Self.color(0xBD9473) }

    private static func color(_ rgb: UInt32) -> Color {
        Color(red: Double((rgb >> 16) & 255) / 255,
              green: Double((rgb >> 8) & 255) / 255,
              blue: Double(rgb & 255) / 255)
    }
}
