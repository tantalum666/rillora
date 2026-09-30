#if DEBUG
import SwiftUI

/// An explicit presentation test only: no keychain read, identity or API call.
struct ExpiredSessionOverviewFixture: OverviewServing {
    func hasLocalSession() async throws -> Bool { true }
    func fetchOverview() async throws -> OverviewSnapshot {
        throw RilloraAPIError.server(
            status: 401, code: "authentication_required",
            message: "Test session expired", requestID: nil
        )
    }
}

struct RilloraUITestAccessibilityOverrides: ViewModifier {
    func body(content: Content) -> some View {
        content
            .environment(
                \.rilloraMotionOverride,
                ProcessInfo.processInfo.environment["RILLORA_UI_TEST_REDUCE_MOTION"] == "1"
            )
            .transformEnvironment(\.dynamicTypeSize) { size in
                if ProcessInfo.processInfo.environment["RILLORA_UI_TEST_LARGE_TEXT"] == "1" {
                    size = .accessibility5
                }
            }
    }
}
#endif
