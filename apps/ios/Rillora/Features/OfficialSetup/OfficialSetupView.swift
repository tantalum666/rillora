import SwiftUI

struct OfficialSetupView: View {
    @State private var searchText = ""
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let overviewStore: OverviewStore?

    // Retain caller compatibility; browsing no longer observes self-reported status.
    init(service: (any OfficialSetupEditing)? = nil, overviewStore: OverviewStore? = nil) {
        self.overviewStore = overviewStore
    }

    var body: some View {
        RilloraList {
            ForEach(OfficialProviderGuideCatalog.groups) { group in
                let guides = filtered(OfficialProviderGuideCatalog.all.filter { $0.group == group.id })
                if !guides.isEmpty {
                    Section(group.localizedTitle) {
                        ForEach(guides) { guideRow($0) }
                    }
                }
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        // Keep search in this screen's safe-area layout. A navigation-bar drawer
        // changes the bar's height during push/pop and can cover the first rows.
        .safeAreaInset(edge: .top, spacing: 0) { searchField }
        .overlay {
            if !OfficialProviderGuideCatalog.isAvailable {
                ContentUnavailableView(String(localized: "Guides unavailable"), systemImage: "book.closed", description: Text(String(localized: "The guide library could not be loaded.")))
            } else if filtered(OfficialProviderGuideCatalog.all).isEmpty {
                ContentUnavailableView.search(text: searchText)
            }
        }
        .navigationTitle(String(localized: "Account inheritance"))
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("official-setup.view")
    }

    private func filtered(_ guides: [OfficialProviderGuide]) -> [OfficialProviderGuide] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        return guides.filter { $0.matches(query) || $0.localized().matches(query) }
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").accessibilityHidden(true)
            TextField(String(localized: "Search platforms"), text: $searchText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .accessibilityIdentifier("official-setup.search")
        }
        .font(.body)
        .padding(12)
        .background(RilloraTheme.actionSurface, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
        .background(RilloraTheme.canvas)
    }

    private func guideRow(_ guide: OfficialProviderGuide) -> some View {
        NavigationLink {
            OfficialProviderGuideDetailView(
                guide: guide
            )
        } label: {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 9) {
                        HStack {
                            guideIcon(guide)
                            Spacer(minLength: 12)
                        }
                        guideText(guide)
                    }
                } else {
                    HStack(spacing: 13) {
                        guideIcon(guide)
                        guideText(guide)
                    }
                }
            }
            .padding(.vertical, 4)
        }
        .accessibilityIdentifier("official-guide.\(guide.id)")
    }

    private func guideIcon(_ guide: OfficialProviderGuide) -> some View {
        OfficialProviderMark(guide: guide, size: 38)
    }

    private func guideText(_ guide: OfficialProviderGuide) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(guide.name)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text(guide.localized().summary)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
                .lineLimit(dynamicTypeSize.isAccessibilitySize ? 4 : 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

}

struct OfficialProviderGuideDetailView: View {
    private let sourceGuide: OfficialProviderGuide
    private var guide: OfficialProviderGuide { sourceGuide.localized() }
    @State private var activePart: String
    @State private var stepIndex = 0
    @RilloraReduceMotion private var reduceMotion
    @ScaledMetric(relativeTo: .title3) private var stepMarkerSize = 38.0

    init(guide: OfficialProviderGuide, initialPart: String? = nil) {
        self.sourceGuide = guide
        _activePart = State(initialValue: initialPart ?? guide.initialPart)
    }

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                guideHeader
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("official-guide.header.\(guide.id)")
                RilloraTaskTabs(tabs: taskTabs, selection: Binding(get: { activePart }, set: { stepIndex = 0; activePart = $0 }), identifierPrefix: "official-guide.part.\(guide.id)")

                if activePart == "details" {
                    requirementsCard
                    boundaryCard
                    RilloraInfoDisclosure(String(localized: "About this route")) {
                        Text(guide.summary).font(.subheadline).foregroundStyle(RilloraTheme.body)
                        Text(L10n.format("Sources reviewed %1$@. Requirements can change.", guide.lastReviewed))
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                } else {
                    stepReader
                }
                officialLinksCard

            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
        }
        .background(RilloraTheme.canvas)
        .navigationTitle(guide.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .onChange(of: activePart) { _, _ in stepIndex = 0 }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: activePart)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: stepIndex)
        .accessibilityIdentifier("official-guide-detail.\(guide.id)")
    }

    private var guideHeader: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 12) {
                    guideHeaderIcon
                    guideHeaderText
                }
            } else {
                HStack(alignment: .center, spacing: 15) {
                    guideHeaderIcon
                    guideHeaderText
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var guideHeaderIcon: some View {
        OfficialProviderMark(guide: guide, size: 56)
    }

    private var guideHeaderText: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(guide.kind.label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
        }
    }

    private var taskTabs: [RilloraTaskTab] {
        var tabs: [RilloraTaskTab] = []
        if !guide.prepareSteps.isEmpty { tabs.append(.init(id: "now", title: String(localized: "Prepare"), symbol: "checklist")) }
        if !guide.laterSteps.isEmpty { tabs.append(.init(id: "later", title: String(localized: "After a death"), symbol: "person.2")) }
        tabs.append(.init(id: "details", title: String(localized: "Documents"), symbol: "doc.text"))
        return tabs
    }

    private var currentSteps: [String] { activePart == "now" ? guide.prepareSteps : guide.laterSteps }

    private var stepReader: some View {
        VStack(alignment: .leading, spacing: 18) {
            if !currentSteps.isEmpty {
                let index = min(stepIndex, currentSteps.count - 1)
                HStack(spacing: 12) {
                    Text((index + 1).formatted())
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(RilloraTheme.canvas)
                        .frame(width: stepMarkerSize, height: stepMarkerSize)
                        .background(RilloraTheme.tabSelection, in: Circle())
                    Text(L10n.format("of %1$lld", currentSteps.count)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    Spacer()
                }
                Text(currentSteps[index])
                    .font(.body).foregroundStyle(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(minHeight: 80, alignment: .topLeading)
                    .contentTransition(.opacity)
                    .accessibilityIdentifier("official-guide.step.\(guide.id)")
                let controls = dynamicTypeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12))
                    : AnyLayout(HStackLayout())
                controls {
                    Button { stepIndex = max(0, stepIndex - 1) } label: {
                        Label(String(localized: "Previous"), systemImage: "arrow.left").frame(minHeight: 44)
                    }
                    .disabled(index == 0)
                    if !dynamicTypeSize.isAccessibilitySize { Spacer() }
                    Button { stepIndex = min(currentSteps.count - 1, stepIndex + 1) } label: {
                        Label(String(localized: "Next"), systemImage: "arrow.right").frame(minHeight: 44)
                    }
                    .disabled(index == currentSteps.count - 1)
                    .accessibilityIdentifier("official-guide.next.\(guide.id)")
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .foregroundStyle(RilloraTheme.tabSelection)
            }
        }
        .padding(.vertical, 6)
    }

    private var requirementsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionEyebrow(String(localized: "Documents & information"))
            ForEach(guide.usuallyRequested, id: \.self) { item in
                Label(item, systemImage: "doc.text")
                    .font(.subheadline)
                    .foregroundStyle(RilloraTheme.body)
            }
        }
        .rilloraCard()
    }

    private var officialLinksCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionEyebrow(String(localized: "Official links"))
            ForEach(Array(guide.links(for: activePart).enumerated()), id: \.element.id) { index, link in
                if let url = link.url {
                    Link(destination: url) {
                        Group {
                            if dynamicTypeSize.isAccessibilitySize {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        linkIcon
                                        Spacer(minLength: 12)
                                        linkArrow
                                    }
                                    linkText(link)
                                }
                            } else {
                                HStack(spacing: 12) {
                                    linkIcon
                                    linkText(link)
                                    linkArrow
                                }
                            }
                        }
                        .frame(minHeight: 44)
                        .padding(.horizontal, 12)
                        .background(RilloraTheme.actionSurface, in: RoundedRectangle(cornerRadius: 13))
                        .contentShape(Rectangle())
                    }
                    .accessibilityIdentifier("official-guide-link.\(guide.id).\(index)")
                }
            }

        }
    }

    private var linkIcon: some View {
        Image(systemName: "safari.fill")
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(RilloraTheme.tabSelection)
            .frame(width: 36, height: 36)
            .background(RilloraTheme.sageSoft, in: RoundedRectangle(cornerRadius: 10))
    }

    private var linkArrow: some View {
        Image(systemName: "arrow.up.right")
            .font(.caption.weight(.bold))
            .foregroundStyle(RilloraTheme.muted)
    }

    private func linkText(_ link: OfficialProviderLink) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(link.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text(link.hostLabel)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var boundaryCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "exclamationmark.shield.fill")
                .foregroundStyle(RilloraTheme.clay)
                .accessibilityHidden(true)
            Text(guide.boundary)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .rilloraCard()
    }


}

struct OfficialProviderMark: View {
    let guide: OfficialProviderGuide
    let size: CGFloat

    var body: some View {
        mark
            .frame(width: size, height: size)
            .background(
                ["coinbase", "instagram", "github", "x"].contains(guide.id)
                    ? Color(red: 46 / 255, green: 55 / 255, blue: 49 / 255)
                    : RilloraTheme.actionIconSurface,
                in: RoundedRectangle(cornerRadius: size * 0.29, style: .continuous)
            )
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var mark: some View {
        switch guide.id {
        case "coinbase":
            Image("CoinbaseLogo")
                .renderingMode(.original).resizable().scaledToFit().padding(size * 0.18)
        case "meta":
            Image("FacebookLogo")
                .renderingMode(.original).resizable().scaledToFit().padding(size * 0.18)
        case "dropbox":
            // The official SVG already includes its own clear space.
            Image("DropboxGlyph")
                .renderingMode(.original).resizable().scaledToFit()
        case "instagram":
            Image("InstagramGlyph")
                .resizable().scaledToFit().padding(size * 0.22)
        case "github":
            Image("GitHubInvertocat")
                .resizable()
                .scaledToFit()
                .padding(size * 0.22)
        case "x":
            Image("XLogo")
                .resizable()
                .scaledToFit()
                .padding(size * 0.25)
        default:
            Image(systemName: guide.systemImage)
                .font(.system(size: size * 0.44, weight: .semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
        }
    }
}

