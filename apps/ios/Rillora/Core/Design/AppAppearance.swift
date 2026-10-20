import SwiftUI

enum AppAppearance: String, CaseIterable, Identifiable {
    case system, light, dark
    static let storageKey = "rillora.appearance.v1"
    private static let legacyKey = "rillora.public-home.appearance.v1"
    var id: String { rawValue }
    var title: String {
        switch self {
        case .system: String(localized: "System")
        case .light: String(localized: "Light")
        case .dark: String(localized: "Dark")
        }
    }
    var colorScheme: ColorScheme? {
        switch self { case .system: nil; case .light: .light; case .dark: .dark }
    }
    var symbol: String {
        switch self { case .system: "iphone"; case .light: "sun.max"; case .dark: "moon" }
    }

    static func migratePreference(in defaults: UserDefaults = .standard) {
        if defaults.string(forKey: storageKey) == nil,
           let old = defaults.string(forKey: legacyKey),
           let choice = Self(rawValue: old), choice != .system {
            defaults.set(choice.rawValue, forKey: storageKey)
        }
        defaults.removeObject(forKey: legacyKey)
    }
}

struct AppAppearanceMenu: View {
    @AppStorage(AppAppearance.storageKey) private var preference = AppAppearance.system.rawValue
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Menu {
            ForEach(AppAppearance.allCases) { choice in
                Button {
                    preference = choice.rawValue
                    if choice == .system { UserDefaults.standard.removeObject(forKey: AppAppearance.storageKey) }
                } label: {
                    Label(choice.title, systemImage: preference == choice.rawValue ? "checkmark" : choice.symbol)
                }
                .accessibilityIdentifier("appearance.\(choice.rawValue)")
            }
        } label: {
            Image(systemName: colorScheme == .dark ? "moon" : "sun.max")
                .font(.title3).foregroundStyle(RilloraTheme.ink)
                .frame(width: 44, height: 44).contentShape(Rectangle())
        }
        .accessibilityLabel("Appearance")
        .accessibilityValue((AppAppearance(rawValue: preference) ?? .system).title)
        .accessibilityIdentifier("appearance.control")
    }
}
