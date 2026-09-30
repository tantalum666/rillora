import SwiftUI

struct OverviewLoadingView: View {
    var body: some View {
        ZStack {
            RilloraTheme.canvas.ignoresSafeArea()
            VStack(spacing: 14) {
                ProgressView()
                    .tint(RilloraTheme.sage)
                Text("Opening Rillora…")
                    .font(.callout)
                    .foregroundStyle(RilloraTheme.muted)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Loading continuity plan")
        }
    }
}

struct OverviewFailureView: View {
    let message: String
    let retry: () -> Void

    init(
        message: String,
        retry: @escaping () -> Void
    ) {
        self.message = message
        self.retry = retry
    }

    var body: some View {
        ZStack {
            RilloraTheme.canvas.ignoresSafeArea()
            ContentUnavailableView {
                Label(
                    "Rillora is unavailable",
                    systemImage: "wifi.exclamationmark"
                )
            } description: {
                Text(message)
            } actions: {
                Button("Try again", action: retry)
                    .buttonStyle(.bordered)
                    .accessibilityIdentifier("overview.retry")
            }
        }
    }
}
