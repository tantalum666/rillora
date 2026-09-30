import SwiftUI

enum AppTab: Hashable {
    case overview
    case matters
    case profile

    @ViewBuilder
    func label(isSelected: Bool) -> some View {
        Group {
            switch self {
            case .overview:
                Label("Overview", systemImage: "house")
            case .matters:
                Label("Matters", systemImage: "list.bullet.rectangle")
            case .profile:
                Label("Profile", systemImage: "person.crop.circle")
            }
        }
        .symbolVariant(isSelected ? .fill : .none)
    }
}
