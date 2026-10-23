import SwiftUI

/// The Owner-selected Legacy Imprint identity, with outlined lettering.
struct RilloraBrand: View {
    var height: CGFloat = 28
    var tint: Color = RilloraTheme.limestone

    var body: some View {
        Image("RilloraBrandLockup")
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            #if RILLORA_DUO_NEXT_VERSION
            // Keep the complete mark, while honoring a narrower toolbar proposal.
            .frame(maxWidth: height * 870 / 208, maxHeight: height)
            #else
            .frame(width: height * 870 / 208, height: height)
            #endif
            .foregroundStyle(tint)
            .accessibilityLabel("Rillora")
            .accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("brand.rillora")
    }
}
