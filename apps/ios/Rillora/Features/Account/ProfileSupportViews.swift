import SwiftUI
import UIKit

enum ProfileActionAccessory {
    case none
    case forward
    case copy

    var systemImage: String? {
        switch self {
        case .none: nil
        case .forward: "arrow.right"
        case .copy: "doc.on.doc"
        }
    }
}

struct ProfileActionLabel: View {
    let title: String
    let detail: String
    let systemImage: String
    var accessory: ProfileActionAccessory = .none

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            RilloraIconTile(systemImage: systemImage)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(RilloraTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if !detail.isEmpty {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Spacer(minLength: 8)

            if let accessoryImage = accessory.systemImage {
                Image(systemName: accessoryImage)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(RilloraTheme.tabSelection)
                    .accessibilityHidden(true)
            }
        }
        .padding(.vertical, 7)
        .contentShape(Rectangle())
    }
}

struct RilloraSafetyPrivacyView: View {
    var authenticationStore: AuthenticationStore? = nil

    var body: some View {
        RilloraList {
            if let authenticationStore, authenticationStore.canResetPassword {
                Section {
                    NavigationLink { PasswordResetView(authenticationStore: authenticationStore) } label: {
                        Label(String(localized: "Reset password"), systemImage: "key")
                    }
                    .accessibilityIdentifier("profile.security.password-reset")
                } header: {
                    Text(String(localized: "Account security"))
                } footer: {
                    Text(String(localized: "Passkey and two-step verification management is not available in this app yet. This does not mean those protections are turned off."))
                }
            }
            Section(String(localized: "Policies")) {
                Link(destination: RilloraLegalURLs.privacy) {
                    Label(String(localized: "Privacy Policy"), systemImage: "hand.raised")
                }
                Link(destination: RilloraLegalURLs.terms) {
                    Label(String(localized: "Terms"), systemImage: "doc.text")
                }
            }
            Section {
                NavigationLink { RilloraDesignCreditsView() } label: {
                    Text(String(localized: "Licenses & acknowledgements"))
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.muted)
                        .frame(minHeight: 44, alignment: .leading)
                }
                .accessibilityIdentifier("profile.safety.design-credits")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "Safety & privacy"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.safety.view")
    }
}

struct AboutRilloraView: View {
    @State private var didCopyAppInformation = false
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraList {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    RilloraBrand(height: 34)
                }
                .padding(.vertical, 6)
            }

            Section(String(localized: "Installed app")) {
                LabeledContent(String(localized: "Version"), value: appVersion)
                LabeledContent(String(localized: "Build"), value: buildNumber)
            }

            Section {
                Button(action: copyAppInformation) {
                    ProfileActionLabel(
                        title: didCopyAppInformation ? String(localized: "Copied") : String(localized: "Copy app information"),
                        detail: "",
                        systemImage: didCopyAppInformation ? "checkmark.circle.fill" : "doc.on.doc",
                        accessory: .copy
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("profile.about.copy")
                .rilloraConfirmation(trigger: didCopyAppInformation, enabled: didCopyAppInformation)
            }
            .rilloraProfileActionRows()

            Section {
                RilloraInfoDisclosure(String(localized: "About Rillora")) {
                    Text(String(localized: "A planning map, not a password vault or legal authority."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }

            }
            .rilloraAlignedLabelRows()
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle(String(localized: "About Rillora"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.about.view")
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: didCopyAppInformation)
        .task(id: didCopyAppInformation) {
            guard didCopyAppInformation else { return }
            do { try await Task.sleep(for: .seconds(2)) } catch { return }
            didCopyAppInformation = false
        }
    }

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
    }

    private var buildNumber: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
    }

    private func copyAppInformation() {
        UIPasteboard.general.string = "Rillora \(appVersion) (\(buildNumber))"
        didCopyAppInformation = true
    }
}

struct RilloraDesignCreditsView: View {
    private var credits: String {
        guard let url = Bundle.main.url(forResource: "DesignCredits", withExtension: "txt"),
              let text = try? String(contentsOf: url, encoding: .utf8) else {
            return String(localized: "Design credits are unavailable in this build.")
        }
        return text
    }

    var body: some View {
        ScrollView {
            Text(credits)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .textSelection(.enabled)
                .padding(20)
        }
        .background(RilloraTheme.canvas)
        .navigationTitle(String(localized: "Design credits"))
        .navigationBarTitleDisplayMode(.inline)
        .rilloraFocusedTask()
        .accessibilityIdentifier("profile.design-credits")
    }
}
