import SwiftUI

struct RilloraQuietButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @RilloraReduceMotion private var reduceMotion
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(isEnabled ? (configuration.isPressed ? 0.78 : 1) : 0.45)
            .scaleEffect(configuration.isPressed && isEnabled && !reduceMotion ? 0.975 : 1)
            .animation(reduceMotion ? nil : RilloraMotion.response, value: configuration.isPressed)
    }
}

private struct RilloraMotionOverrideKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var rilloraMotionOverride: Bool {
        get { self[RilloraMotionOverrideKey.self] }
        set { self[RilloraMotionOverrideKey.self] = newValue }
    }
}

@propertyWrapper
struct RilloraReduceMotion: DynamicProperty {
    @Environment(\.accessibilityReduceMotion) private var systemValue
    @Environment(\.rilloraMotionOverride) private var testOverride
    var wrappedValue: Bool { systemValue || testOverride }
}

struct RilloraTaskTab: Identifiable {
    let id: String
    let title: String
    let symbol: String
}

struct RilloraFilterOption: Identifiable {
    let id: String
    let title: String
}

/// Adapted from Figma SDS Tag Toggle Group. Credits are bundled in DesignCredits.txt.
/// Content-sized options wrap as a group; an individual long label can wrap too.
struct RilloraFilterPicker: View {
    let title: String
    let options: [RilloraFilterOption]
    @Binding var selection: String
    let identifier: String
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        RilloraFlowLayout(spacing: 8, rowSpacing: 8) {
            ForEach(options) { option in
                Button { selection = option.id } label: {
                    HStack(spacing: 6) {
                        if selection == option.id {
                            Image(systemName: "checkmark")
                                .font(.system(size: 13, weight: .semibold))
                                .accessibilityHidden(true)
                        }
                        Text(option.title)
                            .font(.subheadline.weight(.medium))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .multilineTextAlignment(.leading)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(minWidth: 44, minHeight: 44)
                    .foregroundStyle(selection == option.id ? RilloraTheme.tabSelection : RilloraTheme.body)
                    .background(selection == option.id ? RilloraTheme.iconSurface : .clear, in: RoundedRectangle(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(selection == option.id ? RilloraTheme.sage : RilloraTheme.cardBorder, lineWidth: 1)
                    }
                    .contentShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityLabel(option.title)
                .accessibilityAddTraits(selection == option.id ? .isSelected : [])
                .accessibilityIdentifier("\(identifier).\(option.id)")
                .rilloraConfirmation(trigger: selection, enabled: selection == option.id, subtle: true)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
        .accessibilityIdentifier(identifier)
        .animation(reduceMotion ? nil : RilloraMotion.response, value: selection)
    }
}

struct MotivationChoices: View {
    @Binding var selection: PlanMotivation?
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        ForEach(PlanMotivation.allCases) { motivation in
            Button { selection = motivation } label: {
                HStack(spacing: 14) {
                    Image(systemName: symbol(motivation)).font(.title3).frame(width: 28)
                    Text(motivation.label).frame(maxWidth: .infinity, alignment: .leading)
                    Image(systemName: selection == motivation ? "checkmark.circle.fill" : "circle")
                }
                .foregroundStyle(selection == motivation ? RilloraTheme.tabSelection : RilloraTheme.body)
                .frame(minHeight: 48)
                .contentShape(Rectangle())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityAddTraits(selection == motivation ? .isSelected : [])
            .accessibilityIdentifier("motivation.choice.\(motivation.rawValue)")
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: selection)
    }

    private func symbol(_ motivation: PlanMotivation) -> String {
        switch motivation {
        case .lifeChange: "arrow.triangle.branch"
        case .familyResponsibility: "person.2"
        case .crossBorder: "globe"
        case .complexDigitalLife: "square.stack.3d.up"
        case .recentEstateExperience: "folder"
        case .generalPreparedness: "checkmark.shield"
        case .other: "ellipsis.circle"
        }
    }
}

struct RilloraTaskTabs: View {
    let tabs: [RilloraTaskTab]
    @Binding var selection: String
    let identifierPrefix: String
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @RilloraReduceMotion private var reduceMotion
    @Namespace private var underline

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 4) { controls }
            } else {
                HStack(spacing: 4) { controls }
            }
        }
        .padding(4)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.24), value: selection)
    }

    private var controls: some View {
        ForEach(tabs) { tab in
            Button { selection = tab.id } label: {
                VStack(spacing: 6) {
                    Image(systemName: tab.symbol).font(.system(size: 21))
                    Text(tab.title).font(.footnote.weight(.medium))
                }
                .foregroundStyle(selection == tab.id ? RilloraTheme.tabSelection : RilloraTheme.muted)
                .frame(maxWidth: .infinity, minHeight: 62)
                .background(selection == tab.id ? RilloraTheme.surface : .clear, in: RoundedRectangle(cornerRadius: 10))
                .overlay(alignment: .bottom) {
                    if selection == tab.id {
                        Capsule().fill(RilloraTheme.tabSelection).frame(height: 2)
                            .matchedGeometryEffect(id: "active", in: underline)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel(tab.title)
            .accessibilityAddTraits(selection == tab.id ? .isSelected : [])
            .accessibilityIdentifier("\(identifierPrefix).\(tab.id)")
        }
    }
}

struct MatterCategoryChoices: View {
    @Binding var selection: MatterCategory
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @RilloraReduceMotion private var reduceMotion
    private let categories: [MatterCategory] = [.account, .document, .device, .financialAsset, .debt, .subscription, .cryptoAsset]

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                RilloraAdaptivePicker(String(localized: "Category"), selection: $selection) {
                    ForEach(categories) { Text($0.label).tag($0) }
                }
            } else {
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories) { category in
                                Button { selection = category } label: {
                                    VStack(spacing: 7) {
                                        Image(systemName: symbol(category)).font(.system(size: 25, weight: .regular))
                                        Text(shortTitle(category)).font(.caption.weight(.medium))
                                    }
                                    .foregroundStyle(selection == category ? RilloraTheme.tabSelection : RilloraTheme.muted)
                                    .frame(width: 80, height: 76)
                                    .background(RilloraTheme.mutedSurface.opacity(0.45), in: RoundedRectangle(cornerRadius: 13))
                                    .overlay(RoundedRectangle(cornerRadius: 13).stroke(selection == category ? RilloraTheme.tabSelection : RilloraTheme.border, lineWidth: 1))
                                    .scaleEffect(selection == category && !reduceMotion ? 1 : 0.96)
                                }
                                .buttonStyle(RilloraQuietButtonStyle())
                                .accessibilityLabel(category.label)
                                .accessibilityAddTraits(selection == category ? .isSelected : [])
                                .accessibilityIdentifier("matter.category.\(category.rawValue)")
                                .id(category)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .onAppear { proxy.scrollTo(selection, anchor: .center) }
                    .onChange(of: selection) { _, value in
                        withAnimation(reduceMotion ? nil : .easeOut(duration: 0.22)) {
                            proxy.scrollTo(value, anchor: .center)
                        }
                    }
                }
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: selection)
    }

    private func shortTitle(_ category: MatterCategory) -> String {
        switch category {
        case .account: String(localized: "Account")
        case .document: String(localized: "Document")
        case .device: String(localized: "Device")
        case .financialAsset: String(localized: "Asset")
        case .debt: String(localized: "Debt")
        case .subscription: String(localized: "Subscription")
        case .cryptoAsset: String(localized: "Crypto")
        }
    }

    private func symbol(_ category: MatterCategory) -> String {
        switch category {
        case .account: "person.crop.rectangle"
        case .document: "doc.text"
        case .device: "laptopcomputer.and.iphone"
        case .financialAsset: "building.columns"
        case .debt: "arrow.uturn.backward.circle"
        case .subscription: "repeat"
        case .cryptoAsset: "bitcoinsign.circle"
        }
    }
}

/// Apply the same row material to sheets and pushed forms. System grouped
/// backgrounds otherwise change between these two presentation contexts.
struct RilloraForm<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        Form {
            Group { content }
                .listRowBackground(RilloraTheme.surface)
                .listRowSeparatorTint(RilloraTheme.border)
        }
        #if DEBUG
        // Sheet presentations do not inherit the root's test-only size override.
        .modifier(RilloraUITestAccessibilityOverrides())
        #endif
    }
}

struct RilloraAcknowledgementToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn.toggle() } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .font(.title3)
                    .foregroundStyle(configuration.isOn ? RilloraTheme.tabSelection : RilloraTheme.muted)
                    .accessibilityHidden(true)
                configuration.label
                    .font(.subheadline)
                    .foregroundStyle(RilloraTheme.body)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(RilloraQuietButtonStyle())
        .accessibilityValue(configuration.isOn ? String(localized: "Agreed") : String(localized: "Not agreed"))
        .accessibilityAddTraits(configuration.isOn ? .isSelected : [])
    }
}

struct RilloraFlowLayout: Layout {
    var spacing: CGFloat = 12
    var rowSpacing: CGFloat = 10

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(width: proposal.width, subviews: subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let layout = arrange(width: bounds.width, subviews: subviews)
        for index in subviews.indices {
            let frame = layout.frames[index]
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size)
            )
        }
    }

    private func arrange(width: CGFloat?, subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let finiteWidth = width.flatMap { $0.isFinite ? max($0, 1) : nil }
        let available = finiteWidth ?? .greatestFiniteMagnitude
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var contentWidth: CGFloat = 0
        var frames: [CGRect] = []
        for subview in subviews {
            let natural = subview.sizeThatFits(.unspecified)
            let size = subview.sizeThatFits(ProposedViewSize(width: min(natural.width, available), height: nil))
            if x > 0, x + size.width > available {
                x = 0
                y += rowHeight + rowSpacing
                rowHeight = 0
            }
            frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
            contentWidth = max(contentWidth, x + size.width)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return (CGSize(width: finiteWidth ?? contentWidth, height: y + rowHeight), frames)
    }
}

struct RilloraInfoDisclosure<Content: View>: View {
    let title: String
    let content: Content
    @State private var expanded = false
    @RilloraReduceMotion private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(_ title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            content.padding(.vertical, 8)
        } label: {
            Group {
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "info.circle").accessibilityHidden(true)
                        Text(title).fixedSize(horizontal: false, vertical: true)
                    }
                } else {
                    Label(title, systemImage: "info.circle")
                }
            }
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.muted)
                .frame(minHeight: 44)
        }
        .tint(RilloraTheme.tabSelection)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: expanded)
    }
}

struct LifeEventChoices: View {
    @Binding var selection: LifeEvent
    let identifierPrefix: String
    var compact = false
    var onRun: (() -> Void)?
    @RilloraReduceMotion private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Namespace private var positions

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 8) { choices }
            } else if compact {
                HStack(alignment: .top, spacing: 8) { choices }
            } else {
                GeometryReader { geometry in
                    let center = CGPoint(x: geometry.size.width / 2, y: 132)
                    ZStack {
                        ForEach(LifeEvent.allCases) { event in
                            let point = position(event, width: geometry.size.width)
                            Path { path in
                                path.move(to: center)
                                if event == .death {
                                    path.addQuadCurve(to: CGPoint(x: point.x, y: point.y - 12), control: CGPoint(x: center.x + 80, y: 85))
                                } else { path.addLine(to: point) }
                            }
                                .stroke(selection == event ? RilloraTheme.tabSelection.opacity(0.65) : RilloraTheme.border, lineWidth: 1)
                            choice(event)
                                .frame(width: geometry.size.width / 3)
                                .position(point)
                        }
                        if let onRun {
                            Button(action: onRun) {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 25))
                                    .foregroundStyle(RilloraTheme.ink)
                                    .frame(width: 62, height: 62)
                                    .background(RilloraTheme.surface, in: Circle())
                                    .overlay(Circle().stroke(RilloraTheme.border, lineWidth: 1))
                            }
                            .buttonStyle(RilloraQuietButtonStyle())
                            .accessibilityLabel("Run selected rehearsal")
                            .position(center)
                        }
                    }
                }
                .frame(height: 285)
            }
        }
        .animation(reduceMotion ? nil : .spring(duration: 0.3, bounce: 0.1), value: selection)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.26), value: compact)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(identifierPrefix)
    }

    private var choices: some View {
        ForEach(LifeEvent.allCases) { event in
            choice(event)
        }
    }

    private func choice(_ event: LifeEvent) -> some View {
            Button { selection = event } label: {
                Group {
                    if dynamicTypeSize.isAccessibilitySize {
                        HStack(spacing: 12) {
                            symbol(event)
                            Text(displayTitle(event))
                            Spacer(minLength: 0)
                            if selection == event { Image(systemName: "checkmark") }
                        }
                    } else {
                        VStack(spacing: 8) {
                            symbol(event)
                            Text(displayTitle(event)).font(.footnote.weight(.medium))
                        }
                    }
                }
                .foregroundStyle(RilloraTheme.ink)
                .frame(maxWidth: .infinity, minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityLabel(event.title)
            .accessibilityAddTraits(selection == event ? .isSelected : [])
            .accessibilityIdentifier("\(identifierPrefix).\(event.rawValue)")
            .matchedGeometryEffect(id: event.rawValue, in: positions, properties: .position)
    }

    private func position(_ event: LifeEvent, width: CGFloat) -> CGPoint {
        switch event {
        case .death: CGPoint(x: width / 2, y: 46)
        case .incapacity: CGPoint(x: width * 0.18, y: 220)
        case .missing: CGPoint(x: width * 0.82, y: 220)
        }
    }

    private func symbol(_ event: LifeEvent) -> some View {
        Image(systemName: eventSymbol(event))
            .font(.system(size: 24, weight: .medium))
            .foregroundStyle(selection == event ? RilloraTheme.canvas : RilloraTheme.tabSelection)
            .frame(width: 56, height: 56)
            .background(selection == event ? RilloraTheme.tabSelection : RilloraTheme.mutedSurface, in: Circle())
            .scaleEffect(selection == event && !reduceMotion ? 1.04 : 1)
            .accessibilityHidden(true)
    }

    private func eventSymbol(_ event: LifeEvent) -> String {
        switch event {
        case .death: "heart.slash"
        case .incapacity: "cross.case.fill"
        case .missing: "antenna.radiowaves.left.and.right.slash"
        }
    }

    private func displayTitle(_ event: LifeEvent) -> String {
        event == .missing ? String(localized: "Unreachable") : event.title
    }
}
