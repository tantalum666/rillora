import Foundation

struct MatterDetailField: Identifiable, Sendable {
    let id: String
    let title: String
    let prompt: String
    var required = false
    var maximum = 160
}

extension MatterCategory {
    var providerTitle: String {
        switch self {
        case .financialAsset: String(localized: "Institution")
        case .debt: String(localized: "Creditor")
        case .device: String(localized: "Manufacturer")
        case .document: String(localized: "Issuer")
        case .cryptoAsset: String(localized: "Exchange")
        default: String(localized: "Provider")
        }
    }

    var locationTitle: String {
        switch self {
        case .device: String(localized: "Where you keep it")
        case .document: String(localized: "Document location")
        case .account: String(localized: "Recovery information location")
        case .debt: String(localized: "Agreement location")
        default: String(localized: "Where to find the records")
        }
    }

    var requiresLocation: Bool { self == .document || self == .device }
    var hasValue: Bool { [.financialAsset, .debt, .cryptoAsset].contains(self) }

    func detailFields(custody: String) -> [MatterDetailField] {
        switch self {
        case .account: []
        case .financialAsset: [.init(id: "assetType", title: String(localized: "Asset type"), prompt: String(localized: "Savings, investment or insurance"))]
        case .debt: [.init(id: "debtType", title: String(localized: "Debt type"), prompt: String(localized: "Mortgage, loan or credit card"))]
        case .document: [.init(id: "documentType", title: String(localized: "Document type"), prompt: String(localized: "Will, policy or certificate"))]
        case .device: [.init(id: "deviceModel", title: String(localized: "Model"), prompt: String(localized: "Device model"))]
        case .subscription: [.init(id: "renewalDate", title: String(localized: "Next renewal"), prompt: String(localized: "YYYY-MM-DD"), maximum: 10)]
        case .cryptoAsset:
            (custody == "self_custody" ? [
                .init(id: "network", title: String(localized: "Blockchain network"), prompt: String(localized: "Ethereum, Bitcoin or another network"), required: true, maximum: 80),
                .init(id: "walletAddress", title: String(localized: "Public wallet address"), prompt: String(localized: "Public address only"), required: true, maximum: 200),
                .init(id: "walletLabel", title: String(localized: "Wallet app or device"), prompt: String(localized: "Where you manage this wallet")),
            ] : []) + [.init(id: "assetSymbol", title: String(localized: "Asset or token"), prompt: String(localized: "BTC, ETH, USDC…"), maximum: 40)]
        }
    }
}

extension MatterDraft {
    var cryptoCustody: String { details["cryptoCustody"] ?? "" }
    var requiresProvider: Bool {
        [.account, .financialAsset, .debt, .subscription].contains(category)
            || (category == .cryptoAsset && cryptoCustody == "exchange")
    }
    var showsAccountHint: Bool { category != .document && !(category == .cryptoAsset && cryptoCustody == "self_custody") }
    var showsProvider: Bool { category != .cryptoAsset || cryptoCustody == "exchange" }
    var applicableDetails: [String: String] {
        var keys = Set(category.detailFields(custody: cryptoCustody).map(\.id))
        if category == .cryptoAsset { keys.insert("cryptoCustody") }
        if category == .subscription { keys.insert("billingCycle") }
        return details.reduce(into: [:]) { result, item in
            let value = item.value.trimmingCharacters(in: .whitespacesAndNewlines)
            if keys.contains(item.key), !value.isEmpty { result[item.key] = value }
        }
    }
    var detailValidationMessage: String? {
        if requiresProvider && institutionName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return L10n.format("Add the %1$@.", category.providerTitle.lowercased())
        }
        if category.requiresLocation && locationHint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return String(localized: "Add where to find it.")
        }
        if category == .cryptoAsset && !["exchange", "self_custody"].contains(cryptoCustody) {
            return String(localized: "Choose an exchange or an on-chain wallet.")
        }
        for field in category.detailFields(custody: cryptoCustody) {
            let value = applicableDetails[field.id] ?? ""
            if field.required && value.isEmpty { return L10n.format("Add the %1$@.", field.title.lowercased()) }
            if value.count > field.maximum { return L10n.format("%1$@ must be %2$lld characters or fewer.", field.title, field.maximum) }
        }
        if let address = applicableDetails["walletAddress"], address.range(of: "^[A-Za-z0-9:._-]+$", options: .regularExpression) == nil {
            return String(localized: "Use a public wallet address without spaces.")
        }
        if let date = applicableDetails["renewalDate"] {
            let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withFullDate]
            guard date.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil,
                  let parsed = formatter.date(from: date), formatter.string(from: parsed) == date else { return String(localized: "Use a valid renewal date: YYYY-MM-DD.") }
        }
        if notes.count > 2000 { return String(localized: "Notes must be 2,000 characters or fewer.") }
        return nil
    }
}
