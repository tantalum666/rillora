#if RILLORA_DUO_NEXT_VERSION
import SwiftUI

/// Two related sections share a row only when each has enough reading space.
/// AnyLayout preserves the child identities as the window changes size.
struct RilloraAdaptivePair<First: View, Second: View>: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var availableWidth: CGFloat = 0
    private let spacing: CGFloat = 20
    private let minimumColumnWidth: CGFloat = 320
    private let first: First
    private let second: Second

    init(@ViewBuilder first: () -> First, @ViewBuilder second: () -> Second) {
        self.first = first()
        self.second = second()
    }

    var body: some View {
        let columns = !dynamicTypeSize.isAccessibilitySize
            && availableWidth >= minimumColumnWidth * 2 + spacing
        let layout = columns
            ? AnyLayout(HStackLayout(alignment: .top, spacing: spacing))
            : AnyLayout(VStackLayout(alignment: .leading, spacing: spacing))
        layout {
            first.frame(maxWidth: .infinity, alignment: .topLeading)
            second.frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { availableWidth = $0 }
    }
}
#endif
