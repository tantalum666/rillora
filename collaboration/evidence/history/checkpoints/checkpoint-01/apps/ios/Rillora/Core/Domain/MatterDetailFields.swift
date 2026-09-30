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
        case .financialAsset: "Institution"
        case .debt: "Creditor"
        case .device: "Manufacturer"
        case .document: "Issuer"
        case .cryptoAsset: "Exchange"
        default: "Provider"
        }
    }

    var locationTitle: String {
        switch self {
        case .device: "Where you keep it"
        case .document: "Document location"
        case .account: "Recovery information location"
        case .debt: "Agreement location"
        default: "Where to find the records"
        }
    }

    var requiresLocation: Bool { self == .document || self == .device }
    var hasValue: Bool { [.financialAsset, .debt, .cryptoAsset].contains(self) }

    func detailFields(custody: String) -> [MatterDetailField] {
        switch self {
        case .account: []
        case .financialAsset: [.init(id: "assetType", title: "Asset type", prompt: "Savings, investment or insurance")]
        case .debt: [.init(id: "debtType", title: "Debt type", prompt: "Mortgage, loan or credit card")]
        case .document: [.init(id: "documentType", title: "Document type", prompt: "Will, policy or certificate")]
        case .device: [.init(id: "deviceModel", title: "Model", prompt: "Device model")]
        case .subscription: [.init(id: "renewalDate", title: "Next renewal", prompt: "YYYY-MM-DD", maximum: 10)]
        case .cryptoAsset:
            (custody == "self_custody" ? [
                .init(id: "network", title: "Blockchain network", prompt: "Ethereum, Bitcoin or another network", required: true, maximum: 80),
                .init(id: "walletAddress", title: "Public wallet address", prompt: "Public address only", required: true, maximum: 200),
                .init(id: "walletLabel", title: "Wallet app or device", prompt: "Where you manage this wallet"),
            ] : []) + [.init(id: "assetSymbol", title: "Asset or token", prompt: "BTC, ETH, USDC…", maximum: 40)]
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
            return "Add the \(category.providerTitle.lowercased())."
        }
        if category.requiresLocation && locationHint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Add where to find it."
        }
        if category == .cryptoAsset && !["exchange", "self_custody"].contains(cryptoCustody) {
            return "Choose an exchange or an on-chain wallet."
        }
        for field in category.detailFields(custody: cryptoCustody) {
            let value = applicableDetails[field.id] ?? ""
            if field.required && value.isEmpty { return "Add the \(field.title.lowercased())." }
            if value.count > field.maximum { return "\(field.title) must be \(field.maximum) characters or fewer." }
        }
        if let address = applicableDetails["walletAddress"], address.range(of: "^[A-Za-z0-9:._-]+$", options: .regularExpression) == nil {
            return "Use a public wallet address without spaces."
        }
        if let date = applicableDetails["renewalDate"] {
            let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withFullDate]
            guard date.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil,
                  let parsed = formatter.date(from: date), formatter.string(from: parsed) == date else { return "Use a valid renewal date: YYYY-MM-DD." }
        }
        if notes.count > 2000 { return "Notes must be 2,000 characters or fewer." }
        return nil
    }
}
