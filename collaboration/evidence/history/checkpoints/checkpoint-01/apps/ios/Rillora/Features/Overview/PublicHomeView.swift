import SwiftUI

struct SignedOutOverviewView: View {
    let onStartPrivatePlan: () -> Void
    let onExploreMatters: () -> Void
    var onSignIn: () -> Void = {}
    var onOpenInvitation: () -> Void = {}
    var isAuthenticating = false
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize = 47
    private var palette: PublicHomePalette { PublicHomePalette(scheme: colorScheme) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header.padding(.horizontal, 24)
                hero
                PublicHomeSharingDemo(palette: palette)
                    .padding(.horizontal, 24).padding(.vertical, 36)
                destinations.padding(.horizontal, 24)
                closing.padding(24).padding(.vertical, 24)
            }
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
        .scrollIndicators(.hidden)
        .background(palette.paper.ignoresSafeArea())
        .accessibilityIdentifier("public-overview.scroll")
    }

    private var header: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                RilloraBrand(height: 24, tint: palette.ink)
                Spacer(minLength: 8)
                headerActions
            }
            VStack(alignment: .leading, spacing: 12) {
                RilloraBrand(height: 26, tint: palette.ink)
                HStack { Spacer(); headerActions }
            }
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) { palette.rule.frame(height: 1) }
    }

    private var headerActions: some View {
        HStack(spacing: 8) {
            Button(action: onSignIn) {
                HStack(spacing: 6) {
                    if isAuthenticating { ProgressView().tint(palette.onAccent) }
                    Text(isAuthenticating ? "Opening…" : "Sign in")
                        .font(.subheadline.weight(.medium)).fixedSize()
                }
                .padding(.horizontal, 16).frame(minHeight: 44)
                .background(palette.accent, in: Capsule()).foregroundStyle(palette.onAccent)
            }
            .buttonStyle(.plain).disabled(isAuthenticating)
            .accessibilityIdentifier("public-home.sign-in")
            AppAppearanceMenu()
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 20) {
                Text("Leave less\nfor them to\nfigure out.")
                    .font(.system(size: titleSize, weight: .regular, design: .serif))
                    .tracking(-0.9).lineSpacing(-1)
                    .foregroundStyle(palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("public-overview.hero")
                Text("A private map of your important things, shared with the people you choose.")
                    .font(.body).foregroundStyle(palette.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("public-overview.purpose")
                PublicHomeAction(title: "Explore matters", palette: palette, action: onExploreMatters)
                    .accessibilityIdentifier("public-overview.explore")
                Button(action: onOpenInvitation) {
                    Label("Received an invitation?", systemImage: "link")
                        .font(.subheadline).foregroundStyle(palette.ink)
                        .frame(minHeight: 44)
                }
                .buttonStyle(.plain).accessibilityIdentifier("public-home.invitation")
            }
            .padding(.horizontal, 24).padding(.top, 28)
            Image("PublicHomeHero")
                .resizable().scaledToFill()
                .frame(height: dynamicTypeSize.isAccessibilitySize ? 220 : 250)
                .clipped()
                .mask(LinearGradient(stops: [
                    .init(color: .clear, location: 0), .init(color: .black, location: 0.1),
                    .init(color: .black, location: 0.86), .init(color: .clear, location: 1)
                ], startPoint: .top, endPoint: .bottom))
                .accessibilityHidden(true)
        }
    }

    private var destinations: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: onExploreMatters) {
                destinationLabel("A place for what matters.", detail: "Accounts, documents, devices.", symbol: "square.stack.3d.up")
            }.buttonStyle(.plain)
            NavigationLink {
                RilloraSafetyPrivacyView()
                    .toolbar(.visible, for: .navigationBar)
            } label: {
                destinationLabel("Stay in control.", detail: "Your information. Your choices.", symbol: "hand.raised")
            }.buttonStyle(.plain).accessibilityIdentifier("public-home.privacy")
        }
    }

    private func destinationLabel(_ title: String, detail: String, symbol: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: symbol).font(.title3).frame(width: 28).padding(.top, 3)
            VStack(alignment: .leading, spacing: 7) {
                Text(title).font(.system(.title2, design: .serif))
                Text(detail).font(.subheadline).foregroundStyle(palette.muted)
            }
            Spacer(minLength: 0)
            Image(systemName: "arrow.right").padding(.top, 3)
        }
        .foregroundStyle(palette.ink).fixedSize(horizontal: false, vertical: true)
        .padding(.vertical, 24).frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { palette.rule.frame(height: 1) }
        .contentShape(Rectangle())
    }

    private var closing: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Make the important\nthings clear.")
                .font(.system(.largeTitle, design: .serif)).foregroundStyle(palette.ink)
                .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
            PublicHomeAction(title: "Start your map", palette: palette, action: onStartPrivatePlan)
                .disabled(isAuthenticating).accessibilityIdentifier("public-overview.start-final")
            Text("Directions, not passwords.")
                .font(.footnote).foregroundStyle(palette.muted)
        }
    }
}

struct PublicHomeAction: View {
    let title: String
    let palette: PublicHomePalette
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Text(title).font(.body.weight(.medium))
                Spacer(minLength: 8)
                Image(systemName: "arrow.right").accessibilityHidden(true)
            }
            .padding(.horizontal, 22).padding(.vertical, 16)
            .frame(maxWidth: .infinity, minHeight: 54)
            .foregroundStyle(palette.onAccent).background(palette.accent, in: Capsule())
            .contentShape(Capsule())
        }.buttonStyle(.plain)
    }
}
