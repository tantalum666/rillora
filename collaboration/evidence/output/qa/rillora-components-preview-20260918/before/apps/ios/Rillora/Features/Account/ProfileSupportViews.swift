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
    var body: some View {
        RilloraList {
            Section("Choose a safety check") {
                NavigationLink {
                    RilloraSafeInformationChecklistView()
                } label: {
                    ProfileActionLabel(
                        title: "What to record",
                        detail: "",
                        systemImage: "checklist.checked"
                    )
                }
                .accessibilityIdentifier("profile.safety.safe-information")

                NavigationLink {
                    RilloraReleaseSafeguardsView()
                } label: {
                    ProfileActionLabel(
                        title: "Disclosure checks",
                        detail: "",
                        systemImage: "arrow.triangle.branch"
                    )
                }
                .accessibilityIdentifier("profile.safety.disclosure")
            }
            .rilloraProfileActionRows()
            Section("Policies") {
                Link(destination: RilloraLegalURLs.privacy) {
                    Label("Privacy Policy", systemImage: "hand.raised")
                }
                Link(destination: RilloraLegalURLs.terms) {
                    Label("Terms", systemImage: "doc.text")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Safety & privacy")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("profile.safety.view")
    }
}

struct RilloraSafeInformationChecklistView: View {
    @State private var category = "keep"
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraForm {
            Section {
                RilloraTaskTabs(tabs: [
                    .init(id: "keep", title: "Keep", symbol: "checkmark.shield"),
                    .init(id: "avoid", title: "Leave out", symbol: "key.slash"),
                ], selection: $category, identifierPrefix: "profile.safety.information")
            }
            .listRowBackground(Color.clear)
            Section {
                RilloraTaskEmblem(systemImage: category == "keep" ? "checkmark.shield" : "key.slash")
                    .frame(maxWidth: .infinity, minHeight: 100)
                    .accessibilityHidden(true)
                if category == "keep" {
                    SafetyChecklistRow("Provider name", isAllowed: true)
                    SafetyChecklistRow("Masked hint or location", isAllowed: true)
                    SafetyChecklistRow("Intended next step", isAllowed: true)
                } else {
                    SafetyChecklistRow("Passwords or complete recovery codes", isAllowed: false)
                    SafetyChecklistRow("Seed phrases or private keys", isAllowed: false)
                    SafetyChecklistRow("Secrets that can move money", isAllowed: false)
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Safe information")
        .navigationBarTitleDisplayMode(.inline)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: category)
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
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraList {
            Section("Separate events") {
                releaseTopic(
                    .death,
                    title: "Death reported",
                    detail: "A report alone must never release information. A live claims service is not available yet."
                )
                releaseTopic(
                    .incapacity,
                    title: "Incapacity reported",
                    detail: "Authority and scope must be checked for this event separately."
                )
                releaseTopic(
                    .unreachable,
                    title: "Person unreachable",
                    detail: "Rillora does not run welfare checks. Silence never releases information."
                )
            }
            .rilloraProfileActionRows()

            Section("Before disclosure") {
                RilloraFlowLayout(spacing: 14, rowSpacing: 14) {
                    safeguard("Evidence", symbol: "doc.text.magnifyingglass")
                    safeguard("Identity", symbol: "person.crop.rectangle")
                    safeguard("Authority", symbol: "building.columns")
                    safeguard("Scope", symbol: "eye")
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("Disclosure safeguards")
        .navigationBarTitleDisplayMode(.inline)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: expandedTopic)
        .accessibilityIdentifier("profile.safety.disclosure.view")
    }

    private func safeguard(_ title: String, symbol: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: symbol).font(.title2).foregroundStyle(RilloraTheme.tabSelection)
            Text(title).font(.footnote).foregroundStyle(RilloraTheme.body)
        }
        .frame(width: 74, height: 68)
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
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraList {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Rillora")
                        .font(.system(.title2, design: .serif).weight(.semibold))
                        .foregroundStyle(RilloraTheme.limestone)
                }
                .padding(.vertical, 6)
            }

            Section("Installed app") {
                LabeledContent("Version", value: appVersion)
                LabeledContent("Build", value: buildNumber)
            }

            Section {
                Button(action: copyAppInformation) {
                    ProfileActionLabel(
                        title: didCopyAppInformation ? "Copied" : "Copy app information",
                        detail: "",
                        systemImage: didCopyAppInformation ? "checkmark.circle.fill" : "doc.on.doc",
                        accessory: .copy
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("profile.about.copy")
            }
            .rilloraProfileActionRows()

            Section {
                RilloraInfoDisclosure("About Rillora") {
                    Text("A planning map, not a password vault or legal authority.")
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                }
                NavigationLink {
                    RilloraDesignCreditsView()
                } label: {
                    Label("Design credits", systemImage: "text.book.closed")
                }
                .accessibilityIdentifier("profile.about.design-credits")
            }
            .rilloraAlignedLabelRows()
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .navigationTitle("About Rillora")
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

private struct RilloraDesignCreditsView: View {
    private var credits: String {
        guard let url = Bundle.main.url(forResource: "DesignCredits", withExtension: "txt"),
              let text = try? String(contentsOf: url, encoding: .utf8) else {
            return "Design credits are unavailable in this build."
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
        .navigationTitle("Design credits")
        .navigationBarTitleDisplayMode(.inline)
        .rilloraFocusedTask()
        .accessibilityIdentifier("profile.design-credits")
    }
}
