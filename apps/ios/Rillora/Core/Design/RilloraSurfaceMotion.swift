import SwiftUI

enum RilloraMotion {
    static let response = Animation.spring(duration: 0.28, bounce: 0.12)
    static let reveal = Animation.spring(duration: 0.38, bounce: 0.06)
}

/// The same neutral plate is used by task rows and focused-page symbols.
struct RilloraIconTile: View {
    let systemImage: String
    var size: CGFloat = 42
    var emphasized = false
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        Image(systemName: systemImage)
            .font(.system(size: size * 0.42, weight: .medium))
            .foregroundStyle(RilloraTheme.tabSelection)
            .frame(width: size, height: size)
            .background(RilloraTheme.iconSurface, in: RoundedRectangle(cornerRadius: size * 0.28, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                    .stroke(RilloraTheme.cardBorder, lineWidth: 1)
            }
            .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace))
            .scaleEffect(emphasized && !reduceMotion ? 1.06 : 1)
            .animation(reduceMotion ? nil : RilloraMotion.response, value: emphasized)
            .accessibilityHidden(true)
    }
}

/// One short entrance; no repeating animation, timer, or implied progress.
struct RilloraTaskEmblem: View {
    let systemImage: String
    var size: CGFloat = 76
    @State private var appeared = false
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraIconTile(systemImage: systemImage, size: size)
            .overlay {
                RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                    .trim(from: 0, to: appeared || reduceMotion ? 1 : 0)
                    .stroke(RilloraTheme.sage.opacity(0.45), style: StrokeStyle(lineWidth: 1, lineCap: .round))
                    .allowsHitTesting(false)
            }
            .scaleEffect(appeared || reduceMotion ? 1 : 0.92)
            .animation(reduceMotion ? nil : RilloraMotion.reveal, value: appeared)
            .onAppear { appeared = true }
            .accessibilityHidden(true)
    }
}

struct RilloraDisclosureStyle: DisclosureGroupStyle {
    @RilloraReduceMotion private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(reduceMotion ? nil : RilloraMotion.reveal) {
                    configuration.isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 12) {
                    configuration.label.frame(maxWidth: .infinity, alignment: .leading)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(RilloraTheme.sage)
                        .rotationEffect(.degrees(configuration.isExpanded ? 90 : 0))
                        .accessibilityHidden(true)
                }
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityValue(configuration.isExpanded ? String(localized: "Expanded") : String(localized: "Collapsed"))

            if configuration.isExpanded {
                configuration.content
                    .padding(.top, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(reduceMotion ? .identity : RilloraMotion.contentReveal)
            }
        }
    }
}

/// List and Form share row material; no UIKit default gray on child screens.
struct RilloraList<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        List {
            Group { content }
                .listRowBackground(RilloraTheme.surface)
                .listRowSeparatorTint(RilloraTheme.cardBorder)
        }
    }
}
