import SwiftUI

enum ConnectionVisualState: Equatable {
    case uninvited, pending, connected, unavailable
    init(_ status: SharingConnectionStatus?) {
        switch status {
        case .accepted: self = .connected
        case .pending: self = .pending
        case .expired, .revoked: self = .unavailable
        case nil: self = .uninvited
        }
    }
}

struct RilloraConnectionVisual: View {
    var state: ConnectionVisualState = .uninvited
    var compact = false
    @RilloraReduceMotion private var reduceMotion
    @State private var appeared = false

    var body: some View {
        HStack(spacing: compact ? 8 : 18) {
            Image(systemName: "person.crop.circle.fill")
                .foregroundStyle(RilloraTheme.tabSelection)
            VStack(spacing: 5) {
                if state == .connected {
                    Image(systemName: "checkmark").font(.caption.weight(.bold))
                }
                Rectangle()
                    .fill(state == .connected ? RilloraTheme.sage : RilloraTheme.muted.opacity(0.45))
                    .frame(height: 1)
                    .mask { if state == .connected { Rectangle() } else { HStack(spacing: 5) { ForEach(0..<4) { _ in Rectangle() } } } }
                    .scaleEffect(x: appeared || reduceMotion ? 1 : 0, anchor: .leading)
            }.foregroundStyle(RilloraTheme.sage).frame(width: compact ? 28 : 64)
            Image(systemName: state == .connected ? "person.crop.circle.fill" : state == .pending ? "person.crop.circle.badge.clock" : state == .unavailable ? "person.crop.circle.badge.xmark" : "plus.circle.dashed")
                .foregroundStyle(state == .connected ? RilloraTheme.sage : RilloraTheme.clay)
                .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace))
        }
        .font(.system(size: compact ? 34 : 52, weight: .regular))
        .frame(height: compact ? 48 : 86)
        .accessibilityHidden(true)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.4), value: appeared)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.25), value: state)
        .onAppear { appeared = true }
    }
}

struct RilloraFolioArtwork: View {
    var compact = false
    @RilloraReduceMotion private var reduceMotion
    @State private var appeared = false
    var body: some View {
        Image("RilloraFolioCutout")
            .resizable().scaledToFit()
            .frame(maxWidth: compact ? 220 : 340)
            .frame(height: compact ? 164 : 280)
            .clipped()
            .rotation3DEffect(.degrees(appeared || reduceMotion ? 0 : 9), axis: (x: 0, y: 1, z: 0))
            .offset(y: appeared || reduceMotion ? 0 : 12)
            .animation(reduceMotion ? nil : .spring(duration: 0.65, bounce: 0.12), value: appeared)
            .onAppear { appeared = true }
            .accessibilityHidden(true)
    }
}

struct InvitationStepRail: View {
    let current: Int
    @Environment(\.dynamicTypeSize) private var size
    @RilloraReduceMotion private var reduceMotion
    private let labels = [String(localized: "Person"), String(localized: "Access"), String(localized: "Link")]
    var body: some View {
      Group {
        if size.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 8) {
                Text(labels[current]).font(.headline).foregroundStyle(RilloraTheme.ink)
                Text(L10n.format("Step %1$lld of 3", current + 1)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                ProgressView(value: Double(current + 1), total: 3).tint(RilloraTheme.sage)
            }
        } else { HStack(spacing: 6) {
            ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                VStack(spacing: 7) {
                    Capsule().fill(index <= current ? RilloraTheme.sage : RilloraTheme.divider).frame(height: 3)
                    Text(label).font(.caption.weight(index == current ? .semibold : .regular))
                        .foregroundStyle(index <= current ? RilloraTheme.tabSelection : RilloraTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }.frame(maxWidth: .infinity)
            }
        } }
      }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.25), value: current)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(L10n.format("Step %1$lld of 3: %2$@", current + 1, labels[current]))
    }
}

struct InviteSomeoneRow: View {
    var state: ConnectionVisualState = .uninvited
    var title = String(localized: "Invite someone")
    var detail = String(localized: "Share by link or QR")
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var size
    var body: some View {
        Button(action: action) {
            Group {
                if size.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 10) { RilloraConnectionVisual(state: state, compact: true); identity }
                } else {
                    HStack(spacing: 16) { RilloraConnectionVisual(state: state, compact: true); identity; Image(systemName: "chevron.right").font(.footnote) }
                }
            }.frame(maxWidth: .infinity, minHeight: 74, alignment: .leading).padding(.vertical, 10)
                .contentShape(Rectangle())
        }.buttonStyle(RilloraQuietButtonStyle())
    }
    private var identity: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.body.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
            Text(detail).font(.subheadline).foregroundStyle(RilloraTheme.muted)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct RilloraEntrance: ViewModifier {
    @RilloraReduceMotion private var reduceMotion
    @State private var appeared = false
    func body(content: Content) -> some View {
        content.offset(y: appeared || reduceMotion ? 0 : 8)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.28), value: appeared)
            .onAppear { appeared = true }
    }
}

extension View {
    func rilloraEntrance() -> some View { modifier(RilloraEntrance()) }
}
