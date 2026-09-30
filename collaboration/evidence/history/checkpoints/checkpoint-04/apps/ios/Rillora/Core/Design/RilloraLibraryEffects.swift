import Pow
import Shimmer
import SwiftUI

private struct RilloraConfirmationEffect<Value: Equatable>: ViewModifier {
    let value: Value
    let enabled: () -> Bool
    let subtle: Bool
    @RilloraReduceMotion private var reduceMotion

    func body(content: Content) -> some View {
        content
            .changeEffect(.jump(height: subtle ? 2 : 5), value: value, isEnabled: enabled() && !reduceMotion)
            .changeEffect(.pulse(shape: RoundedRectangle(cornerRadius: 16), count: 1), value: value,
                          isEnabled: enabled() && !subtle && !reduceMotion)
            .tint(RilloraTheme.sage)
    }
}

private struct RilloraAttentionEffect<Value: Equatable>: ViewModifier {
    let value: Value
    @RilloraReduceMotion private var reduceMotion
    func body(content: Content) -> some View {
        content.changeEffect(.shake, value: value, isEnabled: !reduceMotion)
    }
}

private struct RilloraLoadingShimmer: ViewModifier {
    @Environment(\.scenePhase) private var scenePhase
    @RilloraReduceMotion private var reduceMotion
    @State private var isVisible = false

    func body(content: Content) -> some View {
        content
            .shimmering(active: isVisible && scenePhase == .active && !reduceMotion,
                        animation: .linear(duration: 1.5).repeatForever(autoreverses: false),
                        bandSize: 0.3)
            .onAppear { isVisible = true }
            .onDisappear { isVisible = false }
    }
}

extension View {
    func rilloraConfirmation<Value: Equatable>(trigger: Value, enabled: @autoclosure @escaping () -> Bool = true, subtle: Bool = false) -> some View {
        modifier(RilloraConfirmationEffect(value: trigger, enabled: enabled, subtle: subtle))
    }

    func rilloraAttention<Value: Equatable>(trigger: Value) -> some View {
        modifier(RilloraAttentionEffect(value: trigger))
    }
}

extension RilloraMotion {
    static var contentReveal: AnyTransition {
        .asymmetric(insertion: .movingParts.blur.combined(with: .move(edge: .top)), removal: .identity)
    }
}

struct RilloraLoadingSkeleton: View {
    var compact = false
    var body: some View {
        VStack(spacing: compact ? 12 : 20) {
            RoundedRectangle(cornerRadius: 18)
                .fill(RilloraTheme.surface).frame(height: compact ? 96 : 160)
            ForEach(0..<(compact ? 2 : 3), id: \.self) { _ in
                RoundedRectangle(cornerRadius: 12)
                    .fill(RilloraTheme.surface).frame(height: compact ? 48 : 56)
            }
        }
        .modifier(RilloraLoadingShimmer())
        .accessibilityHidden(true)
    }
}
