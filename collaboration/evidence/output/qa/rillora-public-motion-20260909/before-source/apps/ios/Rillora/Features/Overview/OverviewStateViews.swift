import SwiftUI

private struct RilloraRefreshStatusModifier: ViewModifier {
    let store: OverviewStore

    func body(content: Content) -> some View {
        content.safeAreaInset(edge: .top, spacing: 0) {
            if store.refreshError != nil {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Showing your last loaded map")
                        .font(.subheadline.weight(.semibold))
                    Button("Couldn’t refresh. Try again") {
                        Task { await store.reload() }
                    }
                    .font(.footnote)
                    .frame(minHeight: 44)
                    .disabled(store.isRefreshing)
                    .accessibilityIdentifier("overview.refresh-retry")
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .foregroundStyle(RilloraTheme.body)
                .background(RilloraTheme.mutedSurface)
            }
        }
    }
}

extension View {
    func rilloraRefreshStatus(_ store: OverviewStore) -> some View {
        modifier(RilloraRefreshStatusModifier(store: store))
    }
}

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
                Button(action: retry) {
                    Text("Try again")
                        .frame(minWidth: 100, minHeight: 44)
                }
                    .buttonStyle(.bordered)
                    .tint(RilloraTheme.tabSelection)
                    .accessibilityIdentifier("overview.retry")
            }
        }
    }
}
