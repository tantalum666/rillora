import SwiftUI

struct OverviewProgressCard: View {
    let snapshot: OverviewSnapshot
    let onOpenMatters: () -> Void
    let onOpenProfile: () -> Void

    @RilloraReduceMotion private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .title2) private var progressRingSize: CGFloat = 82

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            progressHeader
            metrics
        }
        .rilloraCard()
    }

    private var progressHeader: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 14) {
                    progressRing
                    progressText
                }
            } else {
                HStack(spacing: 16) {
                    progressRing
                    progressText
                }
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.4), value: snapshot.readyCount)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("overview.progress")
    }

    private var progressText: some View {
        VStack(alignment: .leading, spacing: 5) {
            SectionEyebrow("Map progress")
            Text(progressTitle)
                .font(.title3.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
                .contentTransition(.numericText())
            Text("\(snapshot.readyCount) of \(snapshot.progressTotal) essentials mapped")
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var progressRing: some View {
        ZStack {
            Circle()
                .stroke(RilloraTheme.divider, lineWidth: 8)
            Circle()
                .trim(from: 0, to: progressFraction)
                .stroke(
                    RilloraTheme.sage,
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(reduceMotion ? nil : .easeOut(duration: 0.5), value: progressFraction)

            VStack(spacing: 0) {
                Text("\(snapshot.readyCount)")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(RilloraTheme.ink)
                    .contentTransition(.numericText())
                Text("of \(snapshot.progressTotal)")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(RilloraTheme.muted)
            }
        }
        .frame(width: progressRingSize, height: progressRingSize)
        .accessibilityElement()
        .accessibilityLabel("\(snapshot.readyCount) of \(snapshot.progressTotal) essentials mapped")
    }

    @ViewBuilder
    private var metrics: some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(spacing: 10) {
                mattersMetric
                contactMetric
            }
        } else {
            HStack(spacing: 10) {
                mattersMetric
                contactMetric
            }
        }
    }

    private var mattersMetric: some View {
        OverviewMetricButton(
            title: "Matters",
            value: "\(snapshot.matters.count)",
            detail: snapshot.matters.isEmpty ? "Add the first" : "\(snapshot.readyCount) added",
            systemImage: "square.grid.2x2.fill",
            action: onOpenMatters
        )
        .accessibilityIdentifier("overview.open-matters")
    }

    private var contactMetric: some View {
        OverviewMetricButton(
            title: "Trusted contact",
            value: snapshot.primaryTrustedContact?.displayName ?? "Not added",
            detail: snapshot.primaryTrustedContact?.evidenceLabel ?? "Record only",
            systemImage: "person.2.fill",
            action: onOpenProfile
        )
        .accessibilityIdentifier("overview.open-profile")
    }

    private var progressFraction: Double {
        guard snapshot.progressTotal > 0 else { return 0 }
        return min(max(Double(snapshot.readyCount) / Double(snapshot.progressTotal), 0), 1)
    }

    private var progressTitle: String {
        let remaining = max(snapshot.progressTotal - snapshot.readyCount, 0)
        if remaining == 0 { return "Essentials mapped" }
        if snapshot.readyCount == 0 { return "Ready to begin" }
        return "\(remaining) essential\(remaining == 1 ? "" : "s") left"
    }
}

private struct OverviewMetricButton: View {
    let title: String
    let value: String
    let detail: String
    let systemImage: String
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: systemImage)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(RilloraTheme.tabSelection)
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(RilloraTheme.muted)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(value)
                        .font(.headline)
                        .foregroundStyle(RilloraTheme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(RilloraTheme.body)
                    Text(detail)
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
            .padding(13)
            .background(
                RilloraTheme.actionSurface,
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(RilloraTheme.actionStroke, lineWidth: 1)
            }
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .accessibilityHidden(true)
        }
        .buttonStyle(RilloraQuietButtonStyle())
        .accessibilityLabel("\(title), \(value), \(detail)")
    }
}

struct MattersSummary: View {
    let snapshot: OverviewSnapshot
    let onOpenMatters: () -> Void
    let onOpenMatter: (Matter) -> Void

    private var nextMatters: [Matter] {
        Array((snapshot.matters.filter { !$0.isReady } + snapshot.matters.filter(\.isReady)).prefix(3))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                SectionEyebrow("Your matters")
                Spacer()
                Button("View all", action: onOpenMatters)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(RilloraTheme.tabSelection)
                    .frame(minHeight: 44)
            }

            ForEach(Array(nextMatters.enumerated()), id: \.element.id) { index, matter in
                Button {
                    onOpenMatter(matter)
                } label: {
                    HStack(spacing: 8) {
                        MatterSummaryRow(matter: matter)
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(RilloraTheme.muted)
                            .accessibilityHidden(true)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("overview.matter.\(matter.publicId)")
                if index < nextMatters.count - 1 {
                    Divider().overlay(RilloraTheme.divider)
                }
            }
        }
        .padding(.vertical, 6)
    }
}

struct MatterSummaryRow: View {
    let matter: Matter

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .top, spacing: 14) {
                        matterIcon
                        matterIdentity
                    }
                    matterStatus
                        .padding(.leading, 54)
                }
            } else {
                HStack(spacing: 14) {
                    matterIcon
                    matterIdentity
                    Spacer(minLength: 8)
                    matterStatus
                }
            }
        }
        .frame(minHeight: 58)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(matter.title), \(matter.preparationLabel.lowercased())")
    }

    private var matterIcon: some View {
        Image(systemName: iconName)
            .font(.system(size: 18, weight: .medium))
            .foregroundStyle(matter.isReady ? RilloraTheme.sage : RilloraTheme.ink)
            .frame(width: 40, height: 40)
            .background(
                matter.isReady ? RilloraTheme.sageSoft : RilloraTheme.peach.opacity(0.38),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .accessibilityHidden(true)
    }

    private var matterIdentity: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(matter.title)
                .font(.body.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            Text(matter.institutionName ?? matter.category.replacingOccurrences(of: "_", with: " ").capitalized)
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var matterStatus: some View {
        Text(matter.preparationLabel)
            .font(.caption.weight(.semibold))
            .foregroundStyle(matter.isReady ? RilloraTheme.sage : RilloraTheme.body)
    }

    private var iconName: String {
        switch matter.category {
        case "financial_asset": "building.columns"
        case "debt": "creditcard"
        case "account": "cloud"
        case "device": "laptopcomputer.and.iphone"
        case "document": "doc.text"
        case "subscription": "repeat"
        case "crypto_asset": "bitcoinsign.circle"
        default: "square.grid.2x2"
        }
    }
}

struct CompactSafetyNote: View {
    var body: some View {
        Label("Directions, not passwords", systemImage: "hand.raised.fill")
            .font(.footnote.weight(.semibold))
            .foregroundStyle(RilloraTheme.sage)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .accessibilityLabel("Directions, not passwords. Never save passwords, recovery codes, private keys, or seed phrases in Rillora.")
    }
}
