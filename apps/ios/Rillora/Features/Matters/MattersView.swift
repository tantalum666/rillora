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
        MatterListPresentation.filteredMatters(snapshot.matters, categoryID: filter, query: searchText)
    }

    private var categoryOptions: [RilloraFilterOption] {
        [.init(id: "all", title: String(localized: "All"))]
            + MatterListPresentation.categories.map { .init(id: $0.rawValue, title: $0.label) }
    }

    var body: some View {
        Group {
            if snapshot.matters.isEmpty {
                MattersEmptyState(onAddMatter: onAddMatter)
            } else {
                RilloraList {
                    Section {
                        MatterCategoryFilter(options: categoryOptions, selection: $filter)
                            .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    }
                    Section {
                        ForEach(filteredMatters) { matter in
                            matterLink(matter)
                        }
                        if filteredMatters.isEmpty {
                            if searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                ContentUnavailableView(String(localized: "No matters in this category"), systemImage: "line.3.horizontal.decrease.circle", description: Text(String(localized: "Choose All to see your other matters.")))
                                    .accessibilityIdentifier("matters.filter-empty")
                            } else {
                                ContentUnavailableView.search(text: searchText)
                                    .accessibilityIdentifier("matters.search-empty")
                            }
                            if filter != "all" {
                                Button(String(localized: "Show all categories")) { filter = "all" }
                                    .frame(maxWidth: .infinity, minHeight: 44)
                                    .accessibilityIdentifier("matters.filter-reset")
                            }
                        }
                    }
                }
                .rilloraStructuredList()
                .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: filteredMatters.map(\.publicId))
                .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .automatic), prompt: String(localized: "Search matters"))
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

private struct MatterCategoryFilter: View {
    let options: [RilloraFilterOption]
    @Binding var selection: String
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(options) { option in
                        Button { selection = option.id } label: {
                            Text(option.title)
                                .font(.subheadline.weight(.semibold))
                                .fixedSize(horizontal: true, vertical: true)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .foregroundStyle(selection == option.id ? RilloraTheme.tabSelection : RilloraTheme.muted)
                                .background(selection == option.id ? RilloraTheme.sageSoft : .clear, in: Capsule())
                                .frame(minWidth: 44, minHeight: 44)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(selection == option.id ? .isSelected : [])
                        .accessibilityIdentifier("matters.filter.\(option.id)")
                        .id(option.id)
                    }
                }
            }
            .onChange(of: selection) { _, selected in
                withAnimation(reduceMotion ? nil : RilloraMotion.response) {
                    proxy.scrollTo(selected, anchor: .center)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(String(localized: "Filter by category"))
        .accessibilityIdentifier("matters.filter")
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
