import Foundation

/// Owner-facing organization only. These helpers never change readiness or shared-review state.
enum MatterListPresentation {
    static let categories: [MatterCategory] = [
        .account, .document, .device, .financialAsset, .debt, .subscription, .cryptoAsset,
    ]

    static func filteredMatters(
        _ matters: [Matter],
        categoryID: String,
        query: String,
        categoryLabel: (MatterCategory) -> String = { $0.label }
    ) -> [Matter] {
        let search = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return matters.filter { matter in
            guard categoryID == "all" || matter.category == categoryID else { return false }
            guard !search.isEmpty else { return true }
            let translatedCategory = MatterCategory(rawValue: matter.category).map(categoryLabel) ?? ""
            return [matter.title, matter.institutionName ?? "", translatedCategory,
                    matter.category.replacingOccurrences(of: "_", with: " ")]
                .contains { $0.localizedStandardContains(search) }
        }
    }

    static func nextAction(in matters: [Matter]) -> MatterOrganizationAction? {
        for matter in matters {
            if let title = requiredLocatorActionTitle(for: matter) {
                return MatterOrganizationAction(matter: matter, title: title)
            }
        }
        return nil
    }

    static func summaryMatters(_ matters: [Matter]) -> [Matter] {
        let incomplete = matters.filter { requiredLocatorActionTitle(for: $0) != nil }
        let other = matters.filter { requiredLocatorActionTitle(for: $0) == nil }
        return Array((incomplete + other).prefix(3))
    }

    static func ownerStatusLabel(for matter: Matter) -> String {
        matter.status == MatterStatus.needsReview.rawValue
            ? String(localized: "To organize")
            : matter.preparationLabel
    }

    /// Uses the editor's required-field definitions, not status or optional sharing choices.
    static func requiredLocatorActionTitle(for matter: Matter) -> String? {
        guard MatterCategory(rawValue: matter.category) != nil else { return nil }
        let draft = MatterDraft(matter: matter)
        if draft.requiresProvider && draft.institutionName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return L10n.format("Add %1$@", draft.category.providerTitle.lowercased())
        }
        if draft.category.requiresLocation && draft.locationHint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return String(localized: "Add where to find it")
        }
        if draft.category == .cryptoAsset && !["exchange", "self_custody"].contains(draft.cryptoCustody) {
            return String(localized: "Choose crypto storage type")
        }
        for field in draft.category.detailFields(custody: draft.cryptoCustody) where field.required {
            if (draft.applicableDetails[field.id] ?? "").isEmpty {
                return L10n.format("Add %1$@", field.title.lowercased())
            }
        }
        return nil
    }
}

struct MatterOrganizationAction {
    let matter: Matter
    let title: String
}
