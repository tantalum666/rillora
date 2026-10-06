import SwiftUI

/// Secondary presentation settings. Shares the existing persisted appearance key;
/// language remains an OS-owned per-app preference with normal draft safeguards.
struct AppPreferencesView: View {
    @AppStorage(AppAppearance.storageKey) private var appearance = AppAppearance.system.rawValue

    var body: some View {
        RilloraForm {
            Section(String(localized: "Language")) {
                NavigationLink { AppLanguageView() } label: {
                    LabeledContent(String(localized: "App language"), value: L10n.languageName)
                }
                .accessibilityIdentifier("language.control")
            }
            Section(String(localized: "Appearance")) {
                Picker(String(localized: "Display mode"), selection: selection) {
                    ForEach(AppAppearance.allCases) { choice in
                        Label(choice.title, systemImage: choice.symbol)
                            .tag(choice.rawValue)
                            .accessibilityIdentifier("appearance.\(choice.rawValue)")
                    }
                }
                .pickerStyle(.inline)
                .labelsHidden()
                .accessibilityValue((AppAppearance(rawValue: appearance) ?? .system).title)
                .accessibilityIdentifier("preferences.appearance")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Language & appearance"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("preferences.view")
    }

    private var selection: Binding<String> {
        Binding(
            get: { (AppAppearance(rawValue: appearance) ?? .system).rawValue },
            set: { value in
                guard let choice = AppAppearance(rawValue: value) else { return }
                appearance = choice.rawValue
                if choice == .system { UserDefaults.standard.removeObject(forKey: AppAppearance.storageKey) }
            }
        )
    }
}
