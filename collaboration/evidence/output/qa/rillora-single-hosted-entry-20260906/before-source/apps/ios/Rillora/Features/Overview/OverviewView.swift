import SwiftUI

struct OverviewView: View {
    let store: OverviewStore
    let onReviewMatters: () -> Void
    let onOpenMatter: (Matter) -> Void
    let onOpenProfile: () -> Void
    let onAddFirstMatter: () -> Void
    let onOpenFirstUseGuide: () -> Void
    let onPauseFirstUse: (Plan) -> Void
    let onStartPrivatePlan: () -> Void

    var body: some View {
        Group {
            switch store.state {
            case .idle, .loading:
                OverviewLoadingView()
            case .signedOut:
                SignedOutOverviewView(
                    onStartPrivatePlan: onStartPrivatePlan
                )
            case .failed(let message):
                OverviewFailureView(
                    message: message,
                    retry: { Task { await store.reload() } }
                )
            case .loaded(let snapshot):
                OverviewContent(
                    snapshot: snapshot,
                    onReviewMatters: onReviewMatters,
                    onOpenMatter: onOpenMatter,
                    onOpenProfile: onOpenProfile,
                    onAddFirstMatter: onAddFirstMatter,
                    onOpenFirstUseGuide: onOpenFirstUseGuide,
                    onPauseFirstUse: { onPauseFirstUse(snapshot.plan) }
                )
                .refreshable {
                    await store.reload()
                }
            }
        }
        .rilloraRefreshStatus(store)
        .navigationTitle(isSignedOut ? "" : "Rillora")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isSignedOut {
                ToolbarItem(placement: .principal) {
                    Text("Rillora")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(RilloraTheme.limestone)
                }
            }
        }
        .toolbarBackground(RilloraTheme.graphite, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var isSignedOut: Bool {
        if case .signedOut = store.state { return true }
        return false
    }
}

struct OverviewContent: View {
    let snapshot: OverviewSnapshot
    let onReviewMatters: () -> Void
    let onOpenMatter: (Matter) -> Void
    let onOpenProfile: () -> Void
    let onAddFirstMatter: () -> Void
    let onOpenFirstUseGuide: () -> Void
    let onPauseFirstUse: () -> Void

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                if snapshot.session.usesDevelopmentIdentity {
                    DevelopmentIdentityBanner()
                }

                OverviewHero(
                    snapshot: snapshot,
                    onReviewMatters: onReviewMatters,
                    onOpenMatter: onOpenMatter,
                    onAddFirstMatter: onAddFirstMatter
                )

                if snapshot.plan.firstUseState.showsStarter {
                    FirstUseStarterCard(
                        plan: snapshot.plan,
                        onAddMatter: onAddFirstMatter,
                        onOpenGuide: onOpenFirstUseGuide,
                        onNotNow: onPauseFirstUse
                    )
                }

                OverviewProgressCard(
                    snapshot: snapshot,
                    onOpenMatters: onReviewMatters,
                    onOpenProfile: onOpenProfile
                )

                if !snapshot.matters.isEmpty {
                    MattersSummary(
                        snapshot: snapshot,
                        onOpenMatters: onReviewMatters,
                        onOpenMatter: onOpenMatter
                    )
                }

                CompactSafetyNote()
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 28)
        }
        .background(RilloraTheme.canvas)
        .scrollIndicators(.hidden)
        .accessibilityIdentifier("overview.scroll")
    }
}

private struct OverviewHero: View {
    let snapshot: OverviewSnapshot
    let onReviewMatters: () -> Void
    let onOpenMatter: (Matter) -> Void
    let onAddFirstMatter: () -> Void

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(snapshot.matters.isEmpty ? "Your map" : "Continue your plan")
                .font(.system(.title, design: .serif).weight(.medium))
                .foregroundStyle(RilloraTheme.ink)
                .accessibilityAddTraits(.isHeader)

            if !snapshot.plan.firstUseState.showsStarter {
                primaryAction
            }
        }
    }

    private var primaryAction: some View {
        Button {
            if let matter = snapshot.nextMatter {
                onOpenMatter(matter)
            } else {
                if snapshot.matters.isEmpty { onAddFirstMatter() }
                else { onReviewMatters() }
            }
        } label: {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(primaryActionTitle)
                            .fontWeight(.semibold)
                        if let nextMatterTitle {
                            Text(nextMatterTitle)
                                .font(.footnote)
                                .opacity(0.86)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    HStack(spacing: 12) {
                        Image(systemName: snapshot.matters.isEmpty ? "plus" : "arrow.forward")
                            .font(.system(size: 16, weight: .bold))
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(primaryActionTitle)
                                .fontWeight(.semibold)
                            if let nextMatterTitle {
                                Text(nextMatterTitle)
                                    .font(.footnote)
                                    .opacity(0.86)
                            }
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .accessibilityHidden(true)
                    }
                }
            }
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
            .padding(.horizontal, 16)
            .padding(.vertical, dynamicTypeSize.isAccessibilitySize ? 10 : 0)
        }
        .buttonStyle(.plain)
        .foregroundStyle(RilloraTheme.canvas)
        .background(
            RilloraTheme.clay,
            in: RoundedRectangle(cornerRadius: 15, style: .continuous)
        )
        .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
        .accessibilityIdentifier(snapshot.matters.isEmpty ? "overview.add-first" : "overview.review-next")
    }

    private var primaryActionTitle: String {
        if snapshot.matters.isEmpty { return "Add your first matter" }
        return snapshot.nextMatter == nil ? "View your matters" : "Review next matter"
    }

    private var nextMatterTitle: String? {
        snapshot.matters.isEmpty ? nil : snapshot.nextMatter?.title
    }
}

private struct DevelopmentIdentityBanner: View {
    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: "hammer")
                .font(.system(size: 14, weight: .semibold))
                .accessibilityHidden(true)
            Text("Local QA · test data")
                .fixedSize(horizontal: false, vertical: true)
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(RilloraTheme.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RilloraTheme.peach.opacity(0.38),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .accessibilityIdentifier("overview.development-identity")
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Local development identity. Test data, not production sign-in.")
    }
}

struct SectionEyebrow: View {
    private let title: String

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title.uppercased())
            .font(.caption.weight(.semibold))
            .tracking(dynamicTypeSize.isAccessibilitySize ? 0 : 1.1)
            .foregroundStyle(RilloraTheme.sage)
    }
}
