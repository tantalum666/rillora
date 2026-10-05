import SwiftUI

struct MattersView: View {
    let store: OverviewStore
    let matterService: any MatterEditing
    let roleAssignmentService: any RoleAssignmentEditing
    let onAuthenticate: (MatterCategory) -> Void
    @State private var presentsNewMatter = false

    var body: some View {
        Group {
            switch store.state {
            case .idle, .loading:
                OverviewLoadingView()
            case .signedOut:
                SignedOutMattersView(onAuthenticate: onAuthenticate)
            case .failed(let message):
                OverviewFailureView(
                    message: message,
                    retry: { Task { await store.reload() } }
                )
            case .loaded(let snapshot):
                MattersContent(
                    snapshot: snapshot,
                    store: store,
                    matterService: matterService,
                    roleAssignmentService: roleAssignmentService,
                    onAddMatter: { presentsNewMatter = true }
                )
                    .refreshable {
                        await store.reload()
                    }
            }
        }
        .rilloraRefreshStatus(store)
        .navigationTitle(String(localized: "Matters"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if case .loaded(let snapshot) = store.state,
                   !snapshot.matters.isEmpty {
                    Button {
                        presentsNewMatter = true
                    } label: {
                        Label(String(localized: "Add matter"), systemImage: "plus")
                    }
                    .accessibilityIdentifier("matter.add")
                }
            }
        }
        .sheet(isPresented: $presentsNewMatter) {
            NavigationStack {
                MatterEditorView(
                    matter: nil,
                    service: matterService,
                    roleAssignmentService: roleAssignmentService,
                    contacts: currentContacts,
                    overviewStore: store
                )
            }
        }
    }

    private var currentContacts: [TrustedContact] {
        guard case .loaded(let snapshot) = store.state else { return [] }
        return snapshot.trustedContacts
    }
}

private struct MattersContent: View {
    let snapshot: OverviewSnapshot
    let store: OverviewStore
    let matterService: any MatterEditing
    let roleAssignmentService: any RoleAssignmentEditing
    let onAddMatter: () -> Void
    @State private var searchText = ""
    @State private var filter = "all"
    @RilloraReduceMotion private var reduceMotion

    private var filteredMatters: [Matter] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        let candidates = snapshot.matters.filter { filter == "all" || (filter == "added" ? $0.isReady : !$0.isReady) }
        guard !query.isEmpty else { return candidates }
        return candidates.filter {
            [$0.title, $0.institutionName ?? "", MatterCategory(rawValue: $0.category)?.label ?? "", $0.category.replacingOccurrences(of: "_", with: " ")]
                .contains { $0.localizedStandardContains(query) }
        }
    }

    var body: some View {
        Group {
            if snapshot.matters.isEmpty {
                MattersEmptyState(onAddMatter: onAddMatter)
            } else {
                RilloraList {
                    Section {
                        RilloraFilterPicker(title: String(localized: "Show matters"), options: [
                            .init(id: "all", title: String(localized: "All")),
                            .init(id: "review", title: String(localized: "To review")),
                            .init(id: "added", title: String(localized: "Directions added")),
                        ], selection: $filter, identifier: "matters.filter")
                    }
                    if filteredMatters.contains(where: { !$0.isReady }) {
                        Section(String(localized: "To review")) {
                            ForEach(filteredMatters.filter { !$0.isReady }) { matter in
                                matterLink(matter)
                            }
                        }
                    }
                    if filteredMatters.contains(where: \.isReady) {
                        Section(String(localized: "Directions added")) {
                            ForEach(filteredMatters.filter(\.isReady)) { matter in
                                matterLink(matter)
                            }
                        }
                    }
                }
                .rilloraStructuredList()
                .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: filteredMatters.map(\.publicId))
                .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .automatic), prompt: String(localized: "Search matters"))
                .overlay {
                    if filteredMatters.isEmpty {
                        if searchText.isEmpty {
                            ContentUnavailableView(String(localized: "No matters match this filter"), systemImage: "line.3.horizontal.decrease.circle", description: Text(String(localized: "Choose All to see your other matters.")))
                                .accessibilityIdentifier("matters.filter-empty")
                        } else {
                            ContentUnavailableView.search(text: searchText).accessibilityIdentifier("matters.search-empty")
                        }
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("matters.list")
    }

    private func matterLink(_ matter: Matter) -> some View {
        NavigationLink {
            MatterEditorView(
                matter: matter,
                service: matterService,
                roleAssignmentService: roleAssignmentService,
                contacts: snapshot.trustedContacts,
                overviewStore: store
            )
        } label: {
            MatterSummaryRow(matter: matter)
        }
        .accessibilityIdentifier("matter.open.\(matter.publicId)")
        .rilloraEntrance()
    }
}

private struct MattersEmptyState: View {
    let onAddMatter: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                RilloraFolioArtwork()

                VStack(spacing: 7) {
                    Text(String(localized: "No matters yet"))
                        .font(.system(.title2, design: .serif).weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                        .accessibilityAddTraits(.isHeader)
                    Text(String(localized: "Start with an account, document, debt or device."))
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.muted)
                        .multilineTextAlignment(.center)
                }

                Button(action: onAddMatter) {
                    Label(String(localized: "Add your first matter"), systemImage: "plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .accessibilityIdentifier("matter.add")
            }
            .frame(maxWidth: 360)
            .padding(.horizontal, 22)
            .padding(.top, 24)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("matters.empty")
        }
        .background(RilloraTheme.canvas)
    }
}
