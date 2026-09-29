import Foundation

protocol ApplePurchaseServing: Sendable {
    func fetchAppleQuote(serviceMarket: String, storefront: String, environment: ApplePurchaseEnvironment) async throws -> AppleQuoteResponse
    func prepareApplePurchase(_ preparation: ApplePurchasePreparation, nonce: UUID, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseIntent
    func changeApplePurchase(_ reference: UUID, action: String, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseState
    func pendingApplePurchase(environment: ApplePurchaseEnvironment) async throws -> ApplePendingPurchaseResponse
    func submitAppleTransaction(_ evidence: StoreKitTransactionEvidence, environment: ApplePurchaseEnvironment) async throws -> AppleTransactionResponse
}

extension ApplePurchaseServing {
    func fetchAppleQuote(serviceMarket: String, storefront: String, environment: ApplePurchaseEnvironment) async throws -> AppleQuoteResponse { throw StoreKitClientError.productUnavailable }
    func prepareApplePurchase(_ preparation: ApplePurchasePreparation, nonce: UUID, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseIntent { throw StoreKitClientError.productUnavailable }
    func changeApplePurchase(_ reference: UUID, action: String, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseState { throw StoreKitClientError.productUnavailable }
    func pendingApplePurchase(environment: ApplePurchaseEnvironment) async throws -> ApplePendingPurchaseResponse { throw StoreKitClientError.productUnavailable }
    func submitAppleTransaction(_ evidence: StoreKitTransactionEvidence, environment: ApplePurchaseEnvironment) async throws -> AppleTransactionResponse { throw StoreKitClientError.productUnavailable }
}
