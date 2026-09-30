import SwiftUI
import UIKit

enum RilloraTheme {
    // DG-01 through DG-04 make graphite the product default, not a public-only
    // landing treatment. These semantic names remain so every existing screen
    // moves together instead of maintaining a second light design system.
    static let canvas = Color(red: 23 / 255, green: 28 / 255, blue: 28 / 255)
    static let surface = Color(red: 29 / 255, green: 35 / 255, blue: 34 / 255)
    static let mutedSurface = Color(red: 37 / 255, green: 44 / 255, blue: 41 / 255)
    static let ink = Color(red: 241 / 255, green: 236 / 255, blue: 226 / 255)
    static let body = Color(red: 218 / 255, green: 216 / 255, blue: 207 / 255)
    static let muted = Color(red: 184 / 255, green: 186 / 255, blue: 178 / 255)
    static let sage = Color(red: 155 / 255, green: 177 / 255, blue: 128 / 255)
    static let sageSoft = Color(red: 77 / 255, green: 95 / 255, blue: 77 / 255).opacity(0.52)
    static let clay = Color(red: 203 / 255, green: 112 / 255, blue: 76 / 255)
    static let peach = Color(red: 203 / 255, green: 112 / 255, blue: 76 / 255).opacity(0.24)
    static let divider = Color.white.opacity(0.16)
    // Interactive rows need to read as controls against the graphite canvas.
    // Keep this brighter than a passive card instead of relying on a chevron
    // or a small tint change to communicate tap affordance.
    static let actionSurface = Color(red: 47 / 255, green: 58 / 255, blue: 53 / 255)
    static let actionIconSurface = Color(red: 67 / 255, green: 84 / 255, blue: 68 / 255)
    static let actionStroke = Color(red: 155 / 255, green: 177 / 255, blue: 128 / 255).opacity(0.32)

    // Architectural aliases keep public source compatibility while the same
    // visual language now applies to the complete product.
    static let graphite = Color(red: 23 / 255, green: 28 / 255, blue: 28 / 255)
    static let graphiteSurface = Color(red: 29 / 255, green: 35 / 255, blue: 34 / 255)
    static let graphiteRaised = Color(red: 37 / 255, green: 44 / 255, blue: 41 / 255)
    static let limestone = Color(red: 241 / 255, green: 236 / 255, blue: 226 / 255)
    static let architecturalMuted = Color(red: 184 / 255, green: 186 / 255, blue: 178 / 255)
    static let eucalyptus = Color(red: 155 / 255, green: 177 / 255, blue: 128 / 255)
    static let tabSelection = Color(red: 205 / 255, green: 225 / 255, blue: 176 / 255)
    static let eucalyptusDeep = Color(red: 77 / 255, green: 95 / 255, blue: 77 / 255)
    static let architecturalDivider = Color.white.opacity(0.18)

    static let cardShape = RoundedRectangle(cornerRadius: 16, style: .continuous)
}

struct RilloraCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(RilloraTheme.surface, in: RilloraTheme.cardShape)
            .overlay {
                RilloraTheme.cardShape
                    .stroke(RilloraTheme.divider.opacity(0.75), lineWidth: 1)
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
        tabAppearance.backgroundColor = UIColor(RilloraTheme.graphiteSurface)
        tabAppearance.shadowColor = UIColor(RilloraTheme.divider)
        configureTabItem(tabAppearance.stackedLayoutAppearance)
        configureTabItem(tabAppearance.inlineLayoutAppearance)
        configureTabItem(tabAppearance.compactInlineLayoutAppearance)

        let tabBar = UITabBar.appearance()
        tabBar.standardAppearance = tabAppearance
        tabBar.scrollEdgeAppearance = tabAppearance
        tabBar.tintColor = UIColor(RilloraTheme.tabSelection)
        tabBar.unselectedItemTintColor = UIColor(RilloraTheme.muted)
        UITableView.appearance().backgroundColor = UIColor(RilloraTheme.canvas)
        UICollectionView.appearance().backgroundColor = UIColor(RilloraTheme.canvas)
    }

    private static func configureTabItem(_ item: UITabBarItemAppearance) {
        item.normal.iconColor = UIColor(RilloraTheme.muted)
        item.normal.titleTextAttributes = [
            .foregroundColor: UIColor(RilloraTheme.muted),
        ]
        item.selected.iconColor = UIColor(RilloraTheme.tabSelection)
        item.selected.titleTextAttributes = [
            .foregroundColor: UIColor(RilloraTheme.tabSelection),
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold),
        ]
    }
}

struct RilloraPrimaryActionButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            // Canvas on clay is 4.89:1. Limestone on clay was 2.99:1 and
            // failed normal-text contrast even though it looked visually soft.
            .foregroundStyle(isEnabled ? RilloraTheme.canvas : RilloraTheme.muted)
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
            .scrollDismissesKeyboard(.interactively)
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

    init(_ facts: [RilloraFact]) {
        self.facts = facts
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(facts) { fact in
                factView(fact)
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
        .frame(maxWidth: .infinity, alignment: .leading)
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

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(required ? "\(title) · Required" : "\(title) · Optional")
                .font(.caption.weight(.semibold))
                .foregroundStyle(RilloraTheme.muted)
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
