import Foundation
import StoreKit

protocol CommerceStorefrontProviding: Sendable {
    func currentCountryCode() async -> String?
    func countryCodeUpdates() -> AsyncStream<String>
}

struct AppleStorefrontProvider: CommerceStorefrontProviding {
    func currentCountryCode() async -> String? {
        await Storefront.current?.countryCode
    }

    func countryCodeUpdates() -> AsyncStream<String> {
        AsyncStream { continuation in
            let task = Task {
                for await storefront in Storefront.updates {
                    guard !Task.isCancelled else { break }
                    continuation.yield(storefront.countryCode)
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}

struct UnavailableStorefrontProvider: CommerceStorefrontProviding {
    func currentCountryCode() async -> String? { nil }

    func countryCodeUpdates() -> AsyncStream<String> {
        AsyncStream { continuation in continuation.finish() }
    }
}
