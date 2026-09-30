import SwiftUI

struct OfficialSetupView: View {
    @State private var setupStore: OfficialSetupStore
    @State private var searchText = ""
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let overviewStore: OverviewStore

    init(service: any OfficialSetupEditing, overviewStore: OverviewStore) {
        _setupStore = State(initialValue: OfficialSetupStore(service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        List {
            reviewStatus

            Section("Set up now") {
                ForEach(filtered(OfficialProviderGuideCatalog.priorityGuides)) { guide in
                    guideRow(guide)
                }
            }

            Section {
                ForEach(filtered(OfficialProviderGuideCatalog.estateRequestGuides)) { guide in
                    guideRow(guide)
                }
            } header: {
                Text("Other routes")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .refreshable {
            await setupStore.reload()
        }
        .searchable(text: $searchText, prompt: "Find a service")
        .overlay {
            if filtered(OfficialProviderGuideCatalog.priorityGuides).isEmpty
                && filtered(OfficialProviderGuideCatalog.estateRequestGuides).isEmpty {
                ContentUnavailableView.search(text: searchText)
            }
        }
        .navigationTitle("Official checks")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await setupStore.loadIfNeeded()
        }
        .alert(
            setupStore.mutationFailure?.conflict == true
                ? "This check changed"
                : "Check not saved",
            isPresented: Binding(
                get: { setupStore.mutationFailure != nil },
                set: { if !$0 { setupStore.clearMutationFailure() } }
            )
        ) {
            if setupStore.mutationFailure?.conflict == true {
                Button("Reload latest") {
                    setupStore.clearMutationFailure()
                    Task { await setupStore.reload() }
                }
                Button("Keep current view", role: .cancel) {
                    setupStore.clearMutationFailure()
                }
            } else {
                Button("OK", role: .cancel) {
                    setupStore.clearMutationFailure()
                }
            }
        } message: {
            Text(setupStore.mutationFailure?.message ?? "")
        }
        .accessibilityIdentifier("official-setup.view")
    }

    private func filtered(_ guides: [OfficialProviderGuide]) -> [OfficialProviderGuide] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        return query.isEmpty ? guides : guides.filter {
            $0.name.localizedStandardContains(query) || $0.summary.localizedStandardContains(query)
        }
    }

    @ViewBuilder
    private var reviewStatus: some View {
        switch setupStore.state {
        case .idle, .loading:
            Section {
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Loading your review status…")
                        .foregroundStyle(RilloraTheme.muted)
                }
            }
        case .failed(let message, _):
            Section {
                Button {
                    Task { await setupStore.reload() }
                } label: {
                    Label("Retry review status", systemImage: "arrow.clockwise")
                }
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }
        case .loaded:
            EmptyView()
        }
    }

    private func guideRow(_ guide: OfficialProviderGuide) -> some View {
        NavigationLink {
            OfficialProviderGuideDetailView(
                guide: guide,
                setupStore: setupStore,
                overviewStore: overviewStore
            )
        } label: {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 9) {
                        HStack {
                            guideIcon(guide)
                            Spacer(minLength: 12)
                            reviewStatusIcon(guide)
                        }
                        guideText(guide)
                    }
                } else {
                    HStack(spacing: 13) {
                        guideIcon(guide)
                        guideText(guide)
                        reviewStatusIcon(guide)
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
            Text(guide.kind.label)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
                .lineLimit(dynamicTypeSize.isAccessibilitySize ? 4 : 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func reviewStatusIcon(_ guide: OfficialProviderGuide) -> some View {
        if let check = check(for: guide), check.completed {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(RilloraTheme.sage)
                .accessibilityLabel("Reviewed in Rillora")
        }
    }

    private func check(for guide: OfficialProviderGuide) -> OfficialSetupCheck? {
        setupStore.checks.first { $0.providerKey == guide.id }
    }
}

private struct OfficialProviderGuideDetailView: View {
    let guide: OfficialProviderGuide
    let setupStore: OfficialSetupStore
    let overviewStore: OverviewStore

    @State private var activePart: String
    @State private var stepIndex = 0
    @RilloraReduceMotion private var reduceMotion

    init(guide: OfficialProviderGuide, setupStore: OfficialSetupStore, overviewStore: OverviewStore) {
        self.guide = guide
        self.setupStore = setupStore
        self.overviewStore = overviewStore
        _activePart = State(initialValue: guide.prepareSteps.isEmpty ? "later" : "now")
    }

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                guideHeader
                officialLinksCard

                RilloraTaskTabs(tabs: taskTabs, selection: $activePart, identifierPrefix: "official-guide.part.\(guide.id)")

                if activePart == "details" {
                    requirementsCard
                    boundaryCard
                    RilloraInfoDisclosure("About this route") {
                        Text(guide.summary).font(.subheadline).foregroundStyle(RilloraTheme.body)
                        Text("Sources reviewed \(guide.lastReviewed). Requirements can change.")
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                } else {
                    stepReader
                    if guide.supportsSelfReportedCheck { selfReportedCard }
                }
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
        if !guide.prepareSteps.isEmpty { tabs.append(.init(id: "now", title: "Set up", symbol: "checklist")) }
        if !guide.laterSteps.isEmpty { tabs.append(.init(id: "later", title: "Later", symbol: "person.2")) }
        tabs.append(.init(id: "details", title: "Details", symbol: "info.circle"))
        return tabs
    }

    private var currentSteps: [String] { activePart == "now" ? guide.prepareSteps : guide.laterSteps }

    private var stepReader: some View {
        VStack(alignment: .leading, spacing: 18) {
            if !currentSteps.isEmpty {
                let index = min(stepIndex, currentSteps.count - 1)
                HStack(spacing: 12) {
                    Text("\(index + 1)")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(RilloraTheme.canvas)
                        .frame(width: 38, height: 38)
                        .background(RilloraTheme.tabSelection, in: Circle())
                    Text("of \(currentSteps.count)").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    Spacer()
                }
                Text(currentSteps[index])
                    .font(.body).foregroundStyle(RilloraTheme.body)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(minHeight: 80, alignment: .topLeading)
                    .contentTransition(.opacity)
                    .accessibilityIdentifier("official-guide.step.\(guide.id)")
                HStack {
                    Button { stepIndex = max(0, stepIndex - 1) } label: {
                        Label("Previous", systemImage: "arrow.left").frame(minHeight: 44)
                    }
                    .disabled(index == 0)
                    Spacer()
                    Button { stepIndex = min(currentSteps.count - 1, stepIndex + 1) } label: {
                        Label("Next", systemImage: "arrow.right").frame(minHeight: 44)
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
            SectionEyebrow("Usually requested")
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
            SectionEyebrow("Official links")
            ForEach(Array(guide.links.enumerated()), id: \.element.id) { index, link in
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

    @ViewBuilder
    private var selfReportedCard: some View {
        if let check {
            VStack(alignment: .leading, spacing: 10) {
                Toggle(
                    "Self-reported review",
                    isOn: Binding(
                        get: { setupStore.displayedCompleted(for: check) },
                        set: { completed in
                            Task {
                                guard await setupStore.setCompleted(
                                    publicID: check.publicId,
                                    completed: completed
                                ) != nil else { return }
                                await overviewStore.reconcileAfterMutation()
                            }
                        }
                    )
                )
                .disabled(setupStore.isSaving(check))
                .accessibilityIdentifier("official-setup.toggle.\(check.providerKey)")

            }
            .rilloraCard()
        }
    }

    private var check: OfficialSetupCheck? {
        setupStore.checks.first { $0.providerKey == guide.id }
    }
}

private struct OfficialProviderMark: View {
    let guide: OfficialProviderGuide
    let size: CGFloat

    var body: some View {
        mark
            .frame(width: size, height: size)
            .background(
                RilloraTheme.actionIconSurface,
                in: RoundedRectangle(cornerRadius: size * 0.29, style: .continuous)
            )
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var mark: some View {
        switch guide.id {
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
