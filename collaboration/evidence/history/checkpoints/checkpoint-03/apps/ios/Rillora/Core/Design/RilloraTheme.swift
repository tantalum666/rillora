import SwiftUI
import UIKit

enum RilloraTheme {
    // All product surfaces use the same trait-aware semantic roles.
    static let canvas = adaptive(light: 0xF5F1E8, dark: 0x171C1C)
    static let surface = adaptive(light: 0xFFFCF6, dark: 0x252C29)
    static let mutedSurface = adaptive(light: 0xEBE9DF, dark: 0x1D2322)
    static let ink = adaptive(light: 0x23473D, dark: 0xF1ECE2)
    static let body = adaptive(light: 0x344A40, dark: 0xDAD8CF)
    static let muted = adaptive(light: 0x596A60, dark: 0xB8BAB2)
    static let sage = adaptive(light: 0x506B38, dark: 0x9BB180)
    static let sageSoft = adaptive(light: 0xE2E9D9, dark: 0x384637)
    static let clay = adaptive(light: 0xA64C2D, dark: 0xCB704C)
    static let onClay = adaptive(light: 0xFFF9ED, dark: 0x171C1C)
    static let peach = clay.opacity(0.15)
    static let divider = adaptive(light: 0xD6DCD2, dark: 0x3C4642)
    static let border = adaptive(light: 0xC8D1C5, dark: 0x39433F)
    static let cardBorder = adaptive(light: 0xD6DCD2, dark: 0x3D4842)
    static let iconSurface = adaptive(light: 0xE5EADD, dark: 0x2E3731)
    static let actionSurface = surface
    static let actionIconSurface = iconSurface
    static let actionStroke = cardBorder
    static let graphite = canvas
    static let graphiteSurface = adaptive(light: 0xF5F1E8, dark: 0x1D2322)
    static let graphiteRaised = surface
    static let limestone = ink
    static let architecturalMuted = muted
    static let eucalyptus = sage
    static let tabSelection = adaptive(light: 0x23473D, dark: 0xCDE1B0)
    static let eucalyptusDeep = adaptive(light: 0xDDE5D5, dark: 0x4D5F4D)
    static let architecturalDivider = divider

    private static func adaptive(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            let rgb = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: CGFloat((rgb >> 16) & 255) / 255,
                           green: CGFloat((rgb >> 8) & 255) / 255,
                           blue: CGFloat(rgb & 255) / 255, alpha: 1)
        })
    }

    static let cardShape = RoundedRectangle(cornerRadius: 16, style: .continuous)
}

struct RilloraCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(RilloraTheme.surface, in: RilloraTheme.cardShape)
            .overlay {
                RilloraTheme.cardShape
                    .stroke(RilloraTheme.cardBorder, lineWidth: 1)
            }
    }
}

struct RilloraAlignedLabelStyle: LabelStyle {
    let iconColumnWidth: CGFloat
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(iconColumnWidth: CGFloat = 28) {
        self.iconColumnWidth = iconColumnWidth
    }

    func makeBody(configuration: Configuration) -> some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 8) {
                    configuration.icon
                    configuration.title
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                HStack(alignment: .center, spacing: 10) {
                    configuration.icon
                        .frame(width: iconColumnWidth, alignment: .center)
                    configuration.title
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }
}

struct RilloraAdaptivePicker<SelectionValue: Hashable, Content: View>: View {
    private let title: String
    @Binding private var selection: SelectionValue
    private let content: () -> Content
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(
        _ title: String,
        selection: Binding<SelectionValue>,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title
        _selection = selection
        self.content = content
    }

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 8) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(RilloraTheme.body)
                    Picker("", selection: $selection) {
                        content()
                    }
                        .pickerStyle(.navigationLink)
                        .labelsHidden()
                        .accessibilityLabel(title)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .accessibilityElement(children: .contain)
            } else {
                Picker(title, selection: $selection) {
                    content()
                }
            }
        }
    }
}

@MainActor
enum RilloraNavigationAppearance {
    static func install() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(RilloraTheme.canvas)
        appearance.shadowColor = .clear
        let baseTitleFont = UIFont.systemFont(ofSize: 17, weight: .semibold)
        let titleFont = baseTitleFont.fontDescriptor.withDesign(.serif).map {
            UIFont(descriptor: $0, size: 17)
        } ?? baseTitleFont
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor(RilloraTheme.limestone),
            .font: titleFont,
        ]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor(RilloraTheme.limestone)]

        let navigationBar = UINavigationBar.appearance()
        navigationBar.standardAppearance = appearance
        navigationBar.scrollEdgeAppearance = appearance
        navigationBar.compactAppearance = appearance
        navigationBar.compactScrollEdgeAppearance = appearance

        UIBarButtonItem.appearance().tintColor = UIColor(RilloraTheme.eucalyptus)

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = adaptiveTabColor(light: .init(red: 245/255, green: 241/255, blue: 232/255, alpha: 1), dark: UIColor(RilloraTheme.graphiteSurface))
        tabAppearance.shadowColor = UIColor(RilloraTheme.divider)
        configureTabItem(tabAppearance.stackedLayoutAppearance)
        configureTabItem(tabAppearance.inlineLayoutAppearance)
        configureTabItem(tabAppearance.compactInlineLayoutAppearance)

        let tabBar = UITabBar.appearance()
        tabBar.standardAppearance = tabAppearance
        tabBar.scrollEdgeAppearance = tabAppearance
        tabBar.tintColor = adaptiveTabColor(light: .init(red: 35/255, green: 71/255, blue: 61/255, alpha: 1), dark: UIColor(RilloraTheme.tabSelection))
        tabBar.unselectedItemTintColor = adaptiveTabColor(light: .darkGray, dark: UIColor(RilloraTheme.muted))
        UITableView.appearance().backgroundColor = UIColor(RilloraTheme.canvas)
        UICollectionView.appearance().backgroundColor = UIColor(RilloraTheme.canvas)
    }

    private static func adaptiveTabColor(light: UIColor, dark: UIColor) -> UIColor {
        UIColor { traits in traits.userInterfaceStyle == .dark ? dark : light }
    }

    private static func configureTabItem(_ item: UITabBarItemAppearance) {
        item.normal.iconColor = adaptiveTabColor(light: .darkGray, dark: UIColor(RilloraTheme.muted))
        item.normal.titleTextAttributes = [
            .foregroundColor: adaptiveTabColor(light: .darkGray, dark: UIColor(RilloraTheme.muted)),
        ]
        item.selected.iconColor = adaptiveTabColor(light: .init(red: 35/255, green: 71/255, blue: 61/255, alpha: 1), dark: UIColor(RilloraTheme.tabSelection))
        item.selected.titleTextAttributes = [
            .foregroundColor: adaptiveTabColor(light: .init(red: 35/255, green: 71/255, blue: 61/255, alpha: 1), dark: UIColor(RilloraTheme.tabSelection)),
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold),
        ]
    }
}

struct RilloraPrimaryActionButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @RilloraReduceMotion private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            // The on-accent role retains readable contrast in both appearances.
            .foregroundStyle(isEnabled ? RilloraTheme.onClay : RilloraTheme.muted)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 14)
            .background(
                isEnabled
                    ? RilloraTheme.clay.opacity(configuration.isPressed ? 0.72 : 1)
                    : RilloraTheme.mutedSurface,
                in: RoundedRectangle(cornerRadius: 15, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            .scaleEffect(configuration.isPressed && isEnabled && !reduceMotion ? 0.97 : 1)
            .animation(reduceMotion ? nil : RilloraMotion.response, value: configuration.isPressed)
    }
}

private struct RilloraStructuredListModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(RilloraTheme.canvas.ignoresSafeArea())
            .foregroundStyle(RilloraTheme.body)
            .tint(RilloraTheme.eucalyptus)
            .listSectionSpacing(18)
            .contentMargins(.top, 8, for: .scrollContent)
            .scrollDismissesKeyboard(.interactively)
            .disclosureGroupStyle(RilloraDisclosureStyle())
    }
}

private struct RilloraProfileActionRowsModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .listRowBackground(RilloraTheme.actionSurface)
            .listRowSeparatorTint(RilloraTheme.actionStroke)
            .foregroundStyle(RilloraTheme.ink)
    }
}

struct RilloraBoundaryPanel<Content: View>: View {
    let title: String
    let systemImage: String
    let content: Content

    init(
        _ title: String,
        systemImage: String = "shield",
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.systemImage = systemImage
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
            content
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 6)
    }
}

struct RilloraFact: Identifiable, Hashable {
    let title: String
    let systemImage: String

    var id: String { "\(systemImage)-\(title)" }
}

/// A compact visual replacement for repeated low-contrast disclaimer lists.
/// It keeps critical boundaries visible without asking people to parse a wall
/// of caption text before completing the task in front of them.
struct RilloraFactStrip: View {
    let facts: [RilloraFact]
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(_ facts: [RilloraFact]) {
        self.facts = facts
    }

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(facts) { factView($0) }
                }
            } else {
                RilloraFlowLayout {
                    ForEach(facts) { factView($0) }
                }
            }
        }
        .accessibilityElement(children: .contain)
    }

    private func factView(_ fact: RilloraFact) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: fact.systemImage)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(RilloraTheme.tabSelection)
                .frame(width: 20, height: 20)
                .accessibilityHidden(true)
            Text(fact.title)
                .font(.subheadline)
                .foregroundStyle(RilloraTheme.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(fact.title)
    }
}

/// A persistent label keeps a field understandable after its prompt disappears.
/// Literal prompts and explicit foreground colors avoid automatic link tinting.
struct RilloraTextField: View {
    let title: String
    let prompt: String
    @Binding var text: String
    let identifier: String
    var required = false
    var axis: Axis = .horizontal
    @FocusState private var isFocused: Bool
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(required ? "\(title) · Required" : "\(title) · Optional")
                .font(.caption.weight(.semibold))
                .foregroundStyle(isFocused ? RilloraTheme.tabSelection : RilloraTheme.muted)
            TextField(
                title,
                text: $text,
                prompt: Text(verbatim: prompt).foregroundColor(RilloraTheme.muted),
                axis: axis
            )
            .font(.body)
            .foregroundColor(RilloraTheme.body)
            .tint(RilloraTheme.tabSelection)
            .frame(minHeight: 44, alignment: .leading)
            .focused($isFocused)
            .submitLabel(.done)
            .onSubmit { isFocused = false }
            .accessibilityLabel(required ? "\(title), required" : "\(title), optional")
            .accessibilityIdentifier(identifier)
        }
        .padding(.vertical, 5)
        .contentShape(Rectangle())
        .onTapGesture { isFocused = true }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("\(identifier).control")
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(RilloraTheme.tabSelection)
                .frame(height: 1)
                .opacity(isFocused ? 0.8 : 0)
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: isFocused)
    }
}

struct RilloraCapabilityGrid: View {
    let items: [String]
    let systemImage: String
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: systemImage)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(RilloraTheme.tabSelection)
                        .accessibilityHidden(true)
                    Text(item)
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(RilloraTheme.body)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(RilloraTheme.actionSurface, in: RoundedRectangle(cornerRadius: 11))
            }
        }
    }

    private var columns: [GridItem] {
        dynamicTypeSize.isAccessibilitySize
            ? [GridItem(.flexible())]
            : [GridItem(.flexible()), GridItem(.flexible())]
    }
}

private struct RilloraFocusedTaskModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(RilloraTheme.canvas)
            .toolbar(.hidden, for: .tabBar)
    }
}

extension View {
    func rilloraCard() -> some View {
        modifier(RilloraCardModifier())
    }

    func rilloraAlignedLabelRows(iconColumnWidth: CGFloat = 28) -> some View {
        labelStyle(RilloraAlignedLabelStyle(iconColumnWidth: iconColumnWidth))
    }

    func rilloraStructuredList() -> some View {
        modifier(RilloraStructuredListModifier())
    }

    func rilloraProfileActionRows() -> some View {
        modifier(RilloraProfileActionRowsModifier())
    }

    func rilloraFocusedTask() -> some View {
        modifier(RilloraFocusedTaskModifier())
    }

}
