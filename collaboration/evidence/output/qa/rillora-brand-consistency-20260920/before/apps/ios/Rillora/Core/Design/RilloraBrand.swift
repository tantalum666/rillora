import SwiftUI

/// The Owner-selected Legacy Imprint identity, with outlined lettering.
struct RilloraBrand: View {
    var height: CGFloat = 28
    var compact = true

    var body: some View {
        Image(compact ? "RilloraBrandCompact" : "RilloraBrandLockup")
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            .frame(width: height * 870 / 208, height: height)
            .foregroundStyle(RilloraTheme.limestone)
            .accessibilityLabel("Rillora")
            .accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("brand.rillora")
    }
}
