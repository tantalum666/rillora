import SwiftUI

struct SignedOutOverviewView: View {
    let onStartPrivatePlan: () -> Void
    let onExploreMatters: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 10) {
                    SectionEyebrow("Digital legacy")
                    Text("Make the important things clear.")
                        .font(.system(.title, design: .serif).weight(.medium))
                        .foregroundStyle(RilloraTheme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("public-overview.hero")
                    Text("Your important things, connected.")
                        .font(.body)
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("public-overview.purpose")
                }

                ContinuityExplorer()

                RilloraFactStrip([
                    .init(title: "Death", systemImage: "heart.slash"),
                    .init(title: "Incapacity", systemImage: "cross.case"),
                    .init(title: "Unreachable", systemImage: "antenna.radiowaves.left.and.right.slash"),
                ])

                VStack(spacing: 10) {
                    Button(action: onExploreMatters) {
                        Label("Explore matters", systemImage: "arrow.right")
                            .font(.body.weight(.medium))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(RilloraQuietButtonStyle())
                    .foregroundStyle(RilloraTheme.ink)
                    .accessibilityIdentifier("public-overview.explore")

                    Button(action: onStartPrivatePlan) {
                        HStack {
                            Text("Add my first matter")
                            Spacer()
                            Image(systemName: "plus").accessibilityHidden(true)
                        }
                    }
                    .buttonStyle(RilloraPrimaryActionButtonStyle())
                    .accessibilityIdentifier("public-overview.start-final")
                }

                CompactSafetyNote()
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 28)
        }
        .scrollIndicators(.hidden)
        .background(RilloraTheme.canvas.ignoresSafeArea())
        .accessibilityIdentifier("public-overview.scroll")
    }
}

struct SignedOutMattersView: View {
    let onAuthenticate: (MatterCategory) -> Void
    @State private var expandedGroup: PublicMatterGroup? = .accounts
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 10) {
                    SectionEyebrow("Matters")
                    Text("What would you like to organise?")
                        .font(.system(.title, design: .serif).weight(.medium))
                        .foregroundStyle(RilloraTheme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                }

                VStack(spacing: 10) {
                    ForEach(PublicMatterGroup.allCases) { group in
                        categoryRow(group)
                    }
                }

                Button { onAuthenticate(expandedGroup?.category ?? .account) } label: {
                    HStack {
                        Text("Add a matter")
                        Spacer()
                        Image(systemName: "plus").accessibilityHidden(true)
                    }
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .accessibilityIdentifier("public-matters.start")

                CompactSafetyNote()
            }
            .padding(20)
        }
        .scrollIndicators(.hidden)
        .background(RilloraTheme.canvas)
        .accessibilityIdentifier("public-matters.scroll")
    }

    private func categoryRow(_ group: PublicMatterGroup) -> some View {
        let expanded = expandedGroup == group
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(reduceMotion ? nil : .spring(duration: 0.3, bounce: 0)) {
                    expandedGroup = expanded ? nil : group
                }
            } label: {
                HStack(spacing: 14) {
                    Image(systemName: group.symbol)
                        .font(.title3)
                        .frame(width: 28)
                        .foregroundStyle(expanded ? RilloraTheme.tabSelection : RilloraTheme.ink)
                        .accessibilityHidden(true)
                    Text(group.title)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(expanded ? RilloraTheme.tabSelection : RilloraTheme.muted)
                        .rotationEffect(.degrees(expanded ? 90 : 0))
                        .accessibilityHidden(true)
                }
                .frame(minHeight: 52)
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
                .contentShape(Rectangle())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityValue(expanded ? "Expanded" : "Collapsed")
            .accessibilityIdentifier("public-matters.category.\(group.rawValue)")

            if expanded {
                VStack(alignment: .leading, spacing: 14) {
                    Text(group.explanation)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("public-matters.guidance.\(group.rawValue)")
                    Button { onAuthenticate(group.category) } label: {
                        HStack {
                            Text(group.addLabel)
                            Spacer()
                            Image(systemName: "arrow.right").accessibilityHidden(true)
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(RilloraTheme.tabSelection)
                        .frame(minHeight: 44)
                    }
                    .buttonStyle(RilloraQuietButtonStyle())
                    .accessibilityIdentifier("public-matters.add.\(group.rawValue)")
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(expanded ? RilloraTheme.actionSurface : RilloraTheme.graphiteSurface, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(expanded ? RilloraTheme.border : .clear, lineWidth: 1))
        .clipped()
    }
}

struct SignedOutProfileView: View {
    let isAuthenticating: Bool
    var requiresSignInAgain = false
    let onAuthenticate: () -> Void

    var body: some View {
        List {
            Section("Account") {
                Button(action: onAuthenticate) {
                    ProfileActionLabel(
                        title: isAuthenticating ? "Opening sign in…" : requiresSignInAgain ? "Sign in again" : "Sign in / Sign up",
                        detail: requiresSignInAgain ? "Your session ended. Public browsing is still available." : "Access your private map",
                        systemImage: "person.crop.circle",
                        accessory: .forward
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
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
