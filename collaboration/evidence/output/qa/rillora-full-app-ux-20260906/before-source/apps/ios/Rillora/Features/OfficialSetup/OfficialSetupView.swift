import SwiftUI

struct OfficialSetupView: View {
    @State private var setupStore: OfficialSetupStore
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let overviewStore: OverviewStore

    init(service: any OfficialSetupEditing, overviewStore: OverviewStore) {
        _setupStore = State(initialValue: OfficialSetupStore(service: service))
        self.overviewStore = overviewStore
    }

    var body: some View {
        List {
            introduction
            reviewStatus

            Section("Set up before it is needed") {
                ForEach(OfficialProviderGuideCatalog.priorityGuides) { guide in
                    guideRow(guide)
                }
            }

            Section {
                ForEach(OfficialProviderGuideCatalog.estateRequestGuides) { guide in
                    guideRow(guide)
                }
            } header: {
                Text("Other common official routes")
            } footer: {
                Text("Provider-owned request routes—not a global ranking or a promise that an account, data or asset will transfer.")
            }
        }
        .rilloraStructuredList()
        .rilloraFocusedTask()
        .refreshable {
            await setupStore.reload()
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

    private var introduction: some View {
        Section {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    HStack(spacing: 12) {
                        introductionIcon
                        Text("Official routes")
                            .font(.headline)
                            .foregroundStyle(RilloraTheme.ink)
                    }
                } else {
                    HStack(alignment: .top, spacing: 14) {
                        introductionIcon
                        introductionText
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }

    private var introductionIcon: some View {
        Image(systemName: "safari.fill")
            .font(.system(size: 20, weight: .semibold))
            .foregroundStyle(RilloraTheme.tabSelection)
            .frame(width: 42, height: 42)
            .background(RilloraTheme.actionSurface, in: RoundedRectangle(cornerRadius: 12))
            .accessibilityHidden(true)
    }

    private var introductionText: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Official routes")
                .font(.headline)
                .foregroundStyle(RilloraTheme.ink)
            Text("Open the provider’s current process. Rillora records only your review.")
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
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
            Text(guide.summary)
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

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                guideHeader

                if !guide.prepareSteps.isEmpty {
                    guideCard(title: "Do now", steps: guide.prepareSteps)
                }

                if !guide.laterSteps.isEmpty {
                    guideCard(title: "If someone handles it later", steps: guide.laterSteps)
                }

                requirementsCard
                officialLinksCard
                boundaryCard

                if guide.supportsSelfReportedCheck {
                    selfReportedCard
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
        }
        .background(RilloraTheme.canvas)
        .navigationTitle(guide.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
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
            Text(guide.name)
                .font(.title2.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text(guide.kind.label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
            Text(guide.summary)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
        }
    }

    private func guideCard(title: String, steps: [String]) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionEyebrow(title)
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(index + 1)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(RilloraTheme.canvas)
                        .frame(width: 24, height: 24)
                        .background(RilloraTheme.sage, in: Circle())
                        .accessibilityHidden(true)
                    Text(step)
                        .font(.subheadline)
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .rilloraCard()
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

            Text("Sources reviewed \(guide.lastReviewed). Requirements can change.")
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .rilloraCard()
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
                    "I reviewed this official process",
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

                Text("Self-reported only. Rillora does not verify or change the provider account.")
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
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
