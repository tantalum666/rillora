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
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
                .frame(width: 42, height: 42)
                .background(
                    RilloraTheme.actionIconSurface,
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(RilloraTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
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
    var body: some View {
        List {
            Section("Choose a safety check") {
                NavigationLink {
                    RilloraSafeInformationChecklistView()
                } label: {
                    ProfileActionLabel(
                        title: "Safe information checklist",
                        detail: "Check what belongs in a matter before you save it.",
                        systemImage: "checklist.checked"
                    )
                }
                .accessibilityIdentifier("profile.safety.safe-information")

                NavigationLink {
                    RilloraReleaseSafeguardsView()
                } label: {
                    ProfileActionLabel(
                        title: "Disclosure safeguards",
                        detail: "See how events, authority and release stay separate.",
                        systemImage: "arrow.triangle.branch"
                    )
                }
                .accessibilityIdentifier("profile.safety.disclosure")
            }
            .rilloraProfileActionRows()
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Safety & privacy")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.safety.view")
    }
}

struct RilloraSafeInformationChecklistView: View {
    var body: some View {
        List {
            Section("Useful to record") {
                SafetyChecklistRow("The provider or institution name", isAllowed: true)
                SafetyChecklistRow("A masked hint or document location", isAllowed: true)
                SafetyChecklistRow("The official next step you want followed", isAllowed: true)
            }

            Section("Never save here") {
                SafetyChecklistRow("A password or complete recovery code", isAllowed: false)
                SafetyChecklistRow("A seed phrase or private key", isAllowed: false)
                SafetyChecklistRow("Any single secret that can move money", isAllowed: false)
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Safe information")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.safety.safe-information.view")
    }
}

private struct SafetyChecklistRow: View {
    let title: String
    let isAllowed: Bool

    init(_ title: String, isAllowed: Bool) {
        self.title = title
        self.isAllowed = isAllowed
    }

    var body: some View {
        Label {
            Text(title)
                .foregroundStyle(RilloraTheme.body)
        } icon: {
            Image(systemName: isAllowed ? "checkmark.circle.fill" : "xmark.octagon.fill")
                .foregroundStyle(isAllowed ? RilloraTheme.tabSelection : RilloraTheme.clay)
        }
        .labelStyle(RilloraAlignedLabelStyle())
    }
}

private enum ReleaseSafetyTopic: Hashable {
    case death
    case incapacity
    case unreachable
}

struct RilloraReleaseSafeguardsView: View {
    @State private var expandedTopic: ReleaseSafetyTopic?

    var body: some View {
        List {
            Section("Separate events") {
                releaseTopic(
                    .death,
                    title: "Death reported",
                    detail: "A report starts evidence checks. It does not release a matter by itself."
                )
                releaseTopic(
                    .incapacity,
                    title: "Incapacity reported",
                    detail: "Authority and scope must be checked for this event separately."
                )
                releaseTopic(
                    .unreachable,
                    title: "Person unreachable",
                    detail: "Silence can start a welfare check, never an automatic disclosure."
                )
            }
            .rilloraProfileActionRows()

            Section("Before any disclosure") {
                LabeledContent("1", value: "Event evidence")
                LabeledContent("2", value: "Claimant identity")
                LabeledContent("3", value: "Legal authority")
                LabeledContent("4", value: "Allowed information scope")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Disclosure safeguards")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.safety.disclosure.view")
    }

    private func releaseTopic(
        _ topic: ReleaseSafetyTopic,
        title: String,
        detail: String
    ) -> some View {
        DisclosureGroup(
            isExpanded: Binding(
                get: { expandedTopic == topic },
                set: { isExpanded in expandedTopic = isExpanded ? topic : nil }
            )
        ) {
            Text(detail)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
                .padding(.vertical, 6)
        } label: {
            Text(title)
                .font(.headline)
                .foregroundStyle(RilloraTheme.ink)
        }
        .accessibilityIdentifier("profile.safety.disclosure.\(topic)")
    }
}

struct AboutRilloraView: View {
    @State private var didCopyAppInformation = false

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Rillora")
                        .font(.system(.title2, design: .serif).weight(.semibold))
                        .foregroundStyle(RilloraTheme.limestone)
                    Text("A private map for what comes next.")
                        .font(.body)
                        .foregroundStyle(RilloraTheme.body)
                }
                .padding(.vertical, 6)
            }

            Section("Installed app") {
                LabeledContent("Version", value: appVersion)
                LabeledContent("Build", value: buildNumber)
                LabeledContent("Product", value: "Digital legacy planning")
            }

            Section {
                Button(action: copyAppInformation) {
                    ProfileActionLabel(
                        title: "Copy app information",
                        detail: "Copy the version and build for troubleshooting.",
                        systemImage: "doc.on.doc",
                        accessory: .copy
                    )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("profile.about.copy")
            }
            .rilloraProfileActionRows()

            Section("Product boundary") {
                Label("Planning map—not a password vault or legal authority.", systemImage: "map")
                    .foregroundStyle(RilloraTheme.body)
            }
            .rilloraAlignedLabelRows()
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("About Rillora")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.about.view")
        .alert("App information copied", isPresented: $didCopyAppInformation) {
            Button("OK", role: .cancel) {}
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
