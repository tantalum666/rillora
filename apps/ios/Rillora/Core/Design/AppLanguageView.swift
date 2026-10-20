import SwiftUI
import UIKit

/// Uses Apple's per-app language control rather than changing AppleLanguages,
/// swizzling Bundle, restarting view identity, or silently discarding a draft.
struct AppLanguageView: View {
    @Environment(\.openURL) private var openURL
    @State private var settingsUnavailable = false

    var body: some View {
        RilloraList {
            Section {
                LabeledContent("App language", value: L10n.languageName)
                Text("Rillora follows your preferred language. You can choose English or Simplified Chinese for this app in iOS Settings.")
                Text("Save your changes before switching languages. iOS may restart Rillora after you change its language.")
                Button {
                    guard let url = URL(string: UIApplication.openSettingsURLString) else {
                        settingsUnavailable = true
                        return
                    }
                    openURL(url) { accepted in settingsUnavailable = !accepted }
                } label: {
                    Label("Change language in Settings", systemImage: "globe")
                }
                .accessibilityIdentifier("language.open-settings")
            } footer: {
                Text("If Language is not shown, add English or Simplified Chinese under Settings > General > Language & Region first.")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Language")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("language.view")
        .alert("Couldn’t open Settings", isPresented: $settingsUnavailable) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Open the Settings app, find Rillora, then choose Language.")
        }
    }
}

struct AppLanguageButton: View {
    var body: some View {
        NavigationLink { AppLanguageView() } label: {
            Image(systemName: "globe")
                .font(.title3)
                .foregroundStyle(RilloraTheme.ink)
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .accessibilityLabel("Language")
        .accessibilityValue(L10n.languageName)
        .accessibilityIdentifier("language.control")
    }
}
