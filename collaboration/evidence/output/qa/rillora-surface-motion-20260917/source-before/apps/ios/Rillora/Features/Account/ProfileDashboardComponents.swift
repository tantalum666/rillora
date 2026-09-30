import SwiftUI

struct ProfileSectionHeader: View {
    let title: String
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(dynamicTypeSize.isAccessibilitySize ? 0 : 1)
            .foregroundStyle(RilloraTheme.sage)
            .textCase(nil)
    }
}

struct ProfileTaskLabel: View {
    let title: String
    let detail: String
    let systemImage: String
    var badge: String?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 10) {
                    icon
                    text
                    badgeView.frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                HStack(alignment: .center, spacing: 13) {
                    icon
                    text
                    badgeView
                }
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }

    private var icon: some View {
        Image(systemName: systemImage)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(RilloraTheme.tabSelection)
            .frame(width: 42, height: 42)
            .background(
                RilloraTheme.actionIconSurface,
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .accessibilityHidden(true)
    }

    private var text: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(detail)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var badgeView: some View {
        if let badge {
            Text(badge)
                .font(.caption.weight(.semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .background(RilloraTheme.sageSoft, in: Capsule())
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct ProfilePreparationGrid: View {
    let store: OverviewStore
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let startHereService: any StartHerePreviewing

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var destination: ProfilePreparationDestination?

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            Button {
                destination = .officialChecks
            } label: {
                ProfileToolTile(title: "Official checks", detail: "Review each provider’s process", systemImage: "checklist.checked")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel("Official provider checks")
            .accessibilityIdentifier("official-setup.open")

            Button {
                destination = .simulation
            } label: {
                ProfileToolTile(title: "Simulation", detail: "Check your plan in a life event", systemImage: "play.rectangle.fill")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel("Simulation rehearsal")
            .accessibilityIdentifier("simulation.open")

            Button {
                destination = .disclosure
            } label: {
                ProfileToolTile(title: "Role disclosure", detail: "Preview what each role could see", systemImage: "person.2.fill")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel("Role disclosure rehearsal")
            .accessibilityIdentifier("disclosure-rehearsal.open")

            Button {
                destination = .startHere
            } label: {
                ProfileToolTile(title: "Start Here guide", detail: "Preview and export your directions", systemImage: "doc.text.fill")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel("Start Here guide")
            .accessibilityIdentifier("start-here.open")
        }
        .navigationDestination(item: $destination) { destination in
            switch destination {
            case .officialChecks:
                OfficialSetupView(service: officialSetupService, overviewStore: store)
            case .simulation:
                SimulationView(service: simulationService, overviewStore: store)
            case .disclosure:
                DisclosureRehearsalView(service: disclosureRehearsalService)
            case .startHere:
                StartHerePreviewView(service: startHereService)
            }
        }
    }

    private var columns: [GridItem] {
        [GridItem(.flexible())]
    }
}

struct ProfileSupportGrid: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var destination: ProfileSupportDestination?

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            Button {
                destination = .safety
            } label: {
                ProfileToolTile(title: "Safety & privacy", detail: "Storage and disclosure controls", systemImage: "lock.shield.fill")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityIdentifier("profile.safety")

            Button {
                destination = .about
            } label: {
                ProfileToolTile(title: "About Rillora", detail: "Version and app information", systemImage: "info.circle.fill")
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel("About Rillora")
            .accessibilityIdentifier("profile.about")
        }
        .navigationDestination(item: $destination) { destination in
            switch destination {
            case .safety:
                RilloraSafetyPrivacyView()
            case .about:
                AboutRilloraView()
            }
        }
    }

    private var columns: [GridItem] {
        [GridItem(.flexible())]
    }
}

private enum ProfilePreparationDestination: Hashable, Identifiable {
    case officialChecks
    case simulation
    case disclosure
    case startHere

    var id: Self { self }
}

private enum ProfileSupportDestination: Hashable, Identifiable {
    case safety
    case about

    var id: Self { self }
}

private struct ProfileToolTile: View {
    let title: String
    let detail: String
    let systemImage: String
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            if !dynamicTypeSize.isAccessibilitySize {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(RilloraTheme.tabSelection)
                    .frame(width: 38, height: 38)
                    .background(
                        RilloraTheme.actionIconSurface,
                        in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                    )
                    .accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(RilloraTheme.ink)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
            }
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
                .accessibilityHidden(true)
        }
        .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
        .padding(14)
        .background(
            RilloraTheme.actionSurface,
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(RilloraTheme.actionStroke, lineWidth: 1)
        }
        .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
