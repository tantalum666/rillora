import SwiftUI

enum ContinuityFocus: String, CaseIterable, Identifiable {
    case what, next, who

    var id: String { rawValue }
    var shortTitle: String {
        switch self {
        case .what: "What"
        case .next: "Next step"
        case .who: "Who"
        }
    }
    var title: String {
        switch self {
        case .what: "What exists"
        case .next: "What happens"
        case .who: "Who can help"
        }
    }
    var symbol: String {
        switch self {
        case .what: "doc.text.fill"
        case .next: "arrow.triangle.branch"
        case .who: "person.2.fill"
        }
    }
    var explanation: String {
        switch self {
        case .what: "Accounts · Documents · Devices"
        case .next: "Your wishes: keep, transfer or close."
        case .who: "Choose who can help."
        }
    }
    var tilt: Double {
        switch self {
        case .what: 0
        case .next: -8
        case .who: 8
        }
    }
}

/// A public explanation, with no planner, account or personal-data fixture.
/// Selection is local and never starts authentication or writes to the API.
struct ContinuityExplorer: View {
    @State private var selection: ContinuityFocus = .what
    @Namespace private var selectionBackground
    @RilloraReduceMotion private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(spacing: 12) {
            illustration
                .frame(height: dynamicTypeSize.isAccessibilitySize ? 190 : 220)
                .accessibilityHidden(true)

            selector

            Text(selection.explanation)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: dynamicTypeSize.isAccessibilitySize ? 0 : 30)
                .contentTransition(.opacity)
                .accessibilityIdentifier("public-overview.focus-description")
        }
        .animation(reduceMotion ? nil : .spring(duration: 0.36, bounce: 0.12), value: selection)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("public-overview.explorer")
    }

    private var illustration: some View {
        GeometryReader { geometry in
            let width = min(geometry.size.width, 380)
            let origin = (geometry.size.width - width) / 2
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height * 0.62)

            ZStack {
                ForEach(ContinuityFocus.allCases) { focus in
                    let end = nodePosition(focus, width: width, origin: origin, height: geometry.size.height)
                    Path { path in
                        path.move(to: center)
                        path.addQuadCurve(
                            to: end,
                            control: CGPoint(x: end.x, y: center.y - 90)
                        )
                    }
                    .stroke(
                        selection == focus ? RilloraTheme.tabSelection : RilloraTheme.divider,
                        style: StrokeStyle(lineWidth: selection == focus ? 2 : 1, lineCap: .round)
                    )
                    .opacity(selection == focus ? 0.9 : 0.55)
                }

                Image("ContinuityMap")
                    .resizable()
                    .scaledToFit()
                    .frame(width: width * 0.69, height: geometry.size.height * 0.96)
                    .rotation3DEffect(.degrees(reduceMotion ? 0 : selection.tilt), axis: (x: 0, y: 1, z: 0))
                    .position(center)
                    .allowsHitTesting(false)

                ForEach(ContinuityFocus.allCases) { focus in
                    let active = selection == focus
                    Button { selection = focus } label: {
                        Image(systemName: focus.symbol)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(active ? RilloraTheme.canvas : RilloraTheme.ink)
                            .frame(width: 56, height: 56)
                            .background(active ? RilloraTheme.tabSelection : RilloraTheme.graphiteSurface, in: Circle())
                            .overlay(Circle().stroke(active ? RilloraTheme.tabSelection : RilloraTheme.border, lineWidth: 1))
                            .shadow(color: .black.opacity(0.14), radius: 8, y: 4)
                    }
                    .buttonStyle(RilloraQuietButtonStyle())
                    .scaleEffect(active && !reduceMotion ? 1.07 : 1)
                    .position(nodePosition(focus, width: width, origin: origin, height: geometry.size.height))
                }
            }
        }
    }

    private func nodePosition(_ focus: ContinuityFocus, width: CGFloat, origin: CGFloat, height: CGFloat) -> CGPoint {
        switch focus {
        case .what: CGPoint(x: origin + width * 0.5, y: 30)
        case .next: CGPoint(x: origin + width * 0.10, y: height * 0.67)
        case .who: CGPoint(x: origin + width * 0.90, y: height * 0.67)
        }
    }

    private var selector: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 6) { selectorButtons }
            } else {
                HStack(spacing: 4) { selectorButtons }
            }
        }
        .padding(4)
        .background(RilloraTheme.graphiteSurface, in: RoundedRectangle(cornerRadius: 25))
        .overlay(RoundedRectangle(cornerRadius: 25).stroke(RilloraTheme.border, lineWidth: 1))
    }

    private var selectorButtons: some View {
        ForEach(ContinuityFocus.allCases) { focus in
            Button { selection = focus } label: {
                Label(dynamicTypeSize.isAccessibilitySize ? focus.title : focus.shortTitle, systemImage: focus.symbol)
                    .font(.footnote.weight(.semibold))
                    .labelStyle(.titleAndIcon)
                    .foregroundStyle(selection == focus ? RilloraTheme.canvas : RilloraTheme.ink)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .padding(.horizontal, 5)
                    .background {
                        if selection == focus {
                            Capsule()
                                .fill(RilloraTheme.tabSelection)
                                .matchedGeometryEffect(id: "selection", in: selectionBackground)
                        }
                    }
                    .contentShape(Capsule())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel(focus.title)
            .accessibilityAddTraits(selection == focus ? .isSelected : [])
            .accessibilityIdentifier("public-overview.focus.\(focus.rawValue)")
        }
    }
}

enum PublicMatterGroup: String, CaseIterable, Identifiable {
    case accounts, documents, devices, other
    var id: String { rawValue }
    var title: String {
        switch self {
        case .accounts: "Accounts"
        case .documents: "Documents"
        case .devices: "Devices"
        case .other: "Other matters"
        }
    }
    var symbol: String {
        switch self {
        case .accounts: "person.crop.rectangle"
        case .documents: "doc.text"
        case .devices: "laptopcomputer.and.iphone"
        case .other: "ellipsis.circle"
        }
    }
    var explanation: String {
        switch self {
        case .accounts: "Service · Safe hint · Next step"
        case .documents: "Document · Location · Who needs it"
        case .devices: "Device · Location · Official access route"
        case .other: "Assets · Debts · Subscriptions"
        }
    }
    var category: MatterCategory {
        switch self {
        case .accounts: .account
        case .documents: .document
        case .devices: .device
        case .other: .financialAsset
        }
    }
    var addLabel: String {
        switch self {
        case .accounts: "Add an account"
        case .documents: "Add a document"
        case .devices: "Add a device"
        case .other: "Add a matter"
        }
    }
}
