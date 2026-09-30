import SwiftUI

struct SignedOutOverviewView: View {
    var requiresSignInAgain = false
    let onStartPrivatePlan: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private let indexItems = [
        ArchitecturalIndexItem(
            id: 0,
            title: "What exists",
            systemImage: "square.stack.3d.up",
            summary: "Accounts, files and records"
        ),
        ArchitecturalIndexItem(
            id: 1,
            title: "What happens",
            systemImage: "arrow.triangle.branch",
            summary: "Keep, transfer or close"
        ),
        ArchitecturalIndexItem(
            id: 2,
            title: "Who can help",
            systemImage: "person.2",
            summary: "People you trust"
        ),
    ]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                hero
                if requiresSignInAgain {
                    primaryAction
                } else {
                    architecturalIndex
                    primaryAction
                    eventBoundary
                    CompactSafetyNote()
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 28)
        }
        .scrollIndicators(.hidden)
        .background(RilloraTheme.canvas.ignoresSafeArea())
        .accessibilityIdentifier("public-overview.scroll")
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionEyebrow("Overview")
            Text(requiresSignInAgain ? "Welcome back" : "A clear plan for what comes next.")
                .font(.system(.title, design: .serif).weight(.medium))
                .foregroundStyle(RilloraTheme.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("public-overview.hero")

            Text(requiresSignInAgain
                 ? "Sign in again to continue to your private map."
                 : "Map what matters and leave the next step for someone you trust.")
                .font(.body)
                .foregroundStyle(RilloraTheme.body)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("public-overview.purpose")
        }
    }

    private var architecturalIndex: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionEyebrow("Your private map")
                .padding(.bottom, 10)

            ForEach(indexItems) { item in
                if item.id > 0 {
                    Divider().overlay(RilloraTheme.divider)
                }
                architecturalIndexRow(item)
                    .accessibilityIdentifier("public-overview.index.\(item.id + 1)")
            }
        }
        .rilloraCard()
    }

    private func architecturalIndexRow(_ item: ArchitecturalIndexItem) -> some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 8) {
                    indexIcon(item)
                    indexText(item)
                }
            } else {
                HStack(spacing: 12) {
                    indexIcon(item)
                    indexText(item)
                }
            }
        }
        .frame(maxWidth: .infinity, minHeight: 64, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    private func indexIcon(_ item: ArchitecturalIndexItem) -> some View {
        Image(systemName: item.systemImage)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(RilloraTheme.tabSelection)
            .frame(width: 40, height: 40)
            .background(RilloraTheme.actionIconSurface, in: RoundedRectangle(cornerRadius: 12))
            .accessibilityHidden(true)
    }

    private func indexText(_ item: ArchitecturalIndexItem) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(item.title)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text(item.summary)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var eventBoundary: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionEyebrow("Separate processes")
            RilloraFactStrip([
                .init(title: "Death", systemImage: "heart.slash"),
                .init(title: "Incapacity", systemImage: "cross.case"),
                .init(
                    title: "Unreachable",
                    systemImage: "antenna.radiowaves.left.and.right.slash"
                ),
            ])
        }
    }

    private var primaryAction: some View {
        Button(action: onStartPrivatePlan) {
            HStack(spacing: 10) {
                Text(requiresSignInAgain ? "Sign in again" : "Create my private map")
                Spacer()
                Image(systemName: "arrow.right")
                    .accessibilityHidden(true)
            }
        }
        .buttonStyle(RilloraPrimaryActionButtonStyle())
        .accessibilityIdentifier("public-overview.start-final")
    }
}

private struct ArchitecturalIndexItem: Identifiable {
    let id: Int
    let title: String
    let systemImage: String
    let summary: String
}

struct SignedOutMattersView: View {
    let onAuthenticate: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Image(systemName: "list.bullet.rectangle.portrait")
                    .font(.system(size: 25, weight: .semibold))
                    .foregroundStyle(RilloraTheme.tabSelection)
                    .frame(width: 52, height: 52)
                    .background(RilloraTheme.actionIconSurface, in: RoundedRectangle(cornerRadius: 16))
                    .accessibilityHidden(true)

                Text("Keep important matters in one place")
                    .font(.system(.title, design: .serif).weight(.medium))
                    .foregroundStyle(RilloraTheme.ink)
                    .accessibilityAddTraits(.isHeader)
                Text("Save one useful locator and the next step—never a password.")
                    .font(.body)
                    .foregroundStyle(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)

                LazyVGrid(columns: columns, spacing: 10) {
                    matterField("What", systemImage: "square.stack.3d.up")
                    matterField("Where", systemImage: "mappin.and.ellipse")
                    matterField("Next step", systemImage: "arrow.triangle.branch")
                    matterField("Who", systemImage: "person.2")
                }

                Button(action: onAuthenticate) {
                    HStack(spacing: 10) {
                        Text("Add a matter")
                        Spacer()
                        Image(systemName: "arrow.right")
                            .accessibilityHidden(true)
                    }
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .accessibilityIdentifier("public-matters.start")

                CompactSafetyNote()
            }
            .padding(20)
        }
        .background(RilloraTheme.canvas)
        .accessibilityIdentifier("public-matters.scroll")
    }

    private func matterField(_ label: String, systemImage: String) -> some View {
        HStack(alignment: .center, spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
                .frame(width: 24, height: 30)
                .accessibilityHidden(true)
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
        }
        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
        .padding(.vertical, 4)
    }

    private var columns: [GridItem] {
        dynamicTypeSize.isAccessibilitySize
            ? [GridItem(.flexible())]
            : [GridItem(.flexible()), GridItem(.flexible())]
    }
}

struct SignedOutProfileView: View {
    let isAuthenticating: Bool
    let onAuthenticate: () -> Void

    var body: some View {
        List {
            Section("Account") {
                Button(action: onAuthenticate) {
                    ProfileActionLabel(
                        title: isAuthenticating ? "Opening sign in…" : "Sign in / Sign up",
                        detail: "Access your private map",
                        systemImage: "person.crop.circle",
                        accessory: .forward
                    )
                }
                .buttonStyle(.plain)
                .disabled(isAuthenticating)
                .accessibilityIdentifier("public-profile.sign-in")
            }
            .rilloraProfileActionRows()

            Section("Rillora") {
                NavigationLink {
                    RilloraSafetyPrivacyView()
                } label: {
                    ProfileActionLabel(
                        title: "Safety & privacy",
                        detail: "Storage and disclosure controls",
                        systemImage: "lock.shield"
                    )
                }
                .accessibilityIdentifier("public-profile.safety")

                NavigationLink {
                    AboutRilloraView()
                } label: {
                    ProfileActionLabel(
                        title: "About Rillora",
                        detail: "Version and build",
                        systemImage: "info.circle"
                    )
                }
                .accessibilityIdentifier("public-profile.about")
            }
            .rilloraProfileActionRows()
        }
        .rilloraStructuredList()
        .accessibilityIdentifier("public-profile.list")
    }
}
