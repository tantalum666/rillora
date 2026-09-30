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
    var sharingService: (any SharingServing)? = nil
    var sharingRevision = 0
    var onInviteSomeone: () -> Void = {}
    var onOpenShared: () -> Void = {}
    var onOpenContact: (TrustedContact) -> Void = { _ in }

    var body: some View {
        Group {
            switch store.state {
            case .idle, .loading:
                OverviewLoadingView()
            case .signedOut:
                SignedOutOverviewView(
                    onStartPrivatePlan: onStartPrivatePlan,
                    onExploreMatters: onReviewMatters
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
                    onPauseFirstUse: { onPauseFirstUse(snapshot.plan) },
                    sharingService: sharingService,
                    sharingRevision: sharingRevision,
                    onInviteSomeone: onInviteSomeone,
                    onOpenShared: onOpenShared,
                    onOpenContact: onOpenContact
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
    var sharingService: (any SharingServing)? = nil
    var sharingRevision = 0
    var onInviteSomeone: () -> Void = {}
    var onOpenShared: () -> Void = {}
    var onOpenContact: (TrustedContact) -> Void = { _ in }

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

                if !snapshot.matters.isEmpty {
                    MattersSummary(
                        snapshot: snapshot,
                        onOpenMatters: onReviewMatters,
                        onOpenMatter: onOpenMatter
                    )
                }
                if !snapshot.matters.isEmpty {
                    Button(action: onAddFirstMatter) { Label("Add a matter", systemImage: "plus.circle").frame(maxWidth: .infinity, minHeight: 48, alignment: .leading) }
                        .buttonStyle(RilloraQuietButtonStyle()).accessibilityIdentifier("overview.add-matter")
                }

                OverviewPeopleSection(contacts: snapshot.trustedContacts, service: sharingService,
                    revision: sharingRevision, onInvite: onInviteSomeone, onOpenContact: onOpenContact)

                Button(action: onOpenShared) {
                    HStack(spacing: 14) {
                        Image(systemName: "tray.and.arrow.down").foregroundStyle(RilloraTheme.sage)
                        Text("Shared with me").foregroundStyle(RilloraTheme.ink)
                        Spacer(); Image(systemName: "chevron.right").font(.footnote)
                    }.frame(minHeight: 54).contentShape(Rectangle())
                }.buttonStyle(RilloraQuietButtonStyle()).accessibilityIdentifier("overview.shared")



                if snapshot.plan.firstUseState.showsStarter {
                    Button("Quick start guide", action: onOpenFirstUseGuide)
                        .font(.subheadline).frame(minHeight: 44)
                }
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
            if snapshot.matters.isEmpty {
                VStack(spacing: 5) {
                    Text("Your map").font(.system(.largeTitle, design: .serif).weight(.medium))
                        .foregroundStyle(RilloraTheme.ink).accessibilityAddTraits(.isHeader)
                    Text("0 matters").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                }.frame(maxWidth: .infinity).multilineTextAlignment(.center)
            } else { HStack(alignment: .firstTextBaseline) {
                Text("Your map")
                .font(.system(.title, design: .serif).weight(.medium))
                .foregroundStyle(RilloraTheme.ink)
                .accessibilityAddTraits(.isHeader)
                Spacer()
                if !dynamicTypeSize.isAccessibilitySize { Image("RilloraFolio").resizable().scaledToFit().frame(width: 78, height: 78).accessibilityHidden(true) }
                Text("\(snapshot.matters.count) \(snapshot.matters.count == 1 ? "matter" : "matters")").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    .contentTransition(.numericText())
            } }
            if snapshot.matters.isEmpty {
                Button(action: onAddFirstMatter) { RilloraFolioArtwork().frame(maxWidth: .infinity) }
                    .buttonStyle(RilloraQuietButtonStyle()).accessibilityLabel("Add a matter")
            }
            primaryAction
        }
        .rilloraEntrance()
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
        .buttonStyle(RilloraQuietButtonStyle())
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

private struct OverviewPeopleSection: View {
    let contacts: [TrustedContact]
    let service: (any SharingServing)?
    let revision: Int
    let onInvite: () -> Void
    let onOpenContact: (TrustedContact) -> Void
    @State private var connections: [SharingConnection]?
    @State private var failed = false
    @Environment(\.scenePhase) private var phase

    var body: some View {
        VStack(spacing: 4) {
            if let connection = connections?.first(where: { $0.status == .pending || $0.status == .expired }) ?? connections?.first(where: { $0.status == .accepted }),
               let contact = contacts.first(where: { $0.publicId == connection.personPublicId }) {
                InviteSomeoneRow(state: ConnectionVisualState(connection.status), title: contact.displayName,
                    detail: connection.status.label, action: { onOpenContact(contact) })
                    .accessibilityIdentifier("overview.open-profile")
                Button("Invite someone", action: onInvite).frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    .accessibilityIdentifier("overview.invite")
            } else {
                InviteSomeoneRow(detail: failed ? "Share by link or QR · refresh unavailable" : "Share by link or QR", action: onInvite)
                    .accessibilityIdentifier("overview.invite")
            }
            Divider().overlay(RilloraTheme.divider)
        }.task(id: revision) { await load() }
            .onChange(of: phase) { _, next in if next == .active { Task { await load() } } }
    }
    private func load() async {
        guard let service else { return }
        do {
            let current = try await service.fetchSharingConnections()
            guard !Task.isCancelled else { return }
            connections = current; failed = false
        } catch {
            guard !Task.isCancelled else { return }
            connections = nil; failed = true
        }
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
