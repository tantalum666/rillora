import SwiftUI

/// Separate local app: no AppDependencies, authentication, API client, or real records.
@main
struct RilloraComponentPreviewApp: App {
    init() { RilloraNavigationAppearance.install() }
    var body: some Scene {
        WindowGroup {
            NavigationStack { ComponentPreviewHome() }
                .preferredColorScheme(ProcessInfo.processInfo.environment["RILLORA_PREVIEW_APPEARANCE"] == "light" ? .light : .dark)
                #if DEBUG
                .modifier(RilloraUITestAccessibilityOverrides())
                #endif
        }
    }
}

private struct ComponentPreviewHome: View {
    @State private var section = "feedback"
    @State private var reduceMotion = false
    @RilloraReduceMotion private var inheritedReduceMotion

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Try the interactions")
                    .font(.system(.title, design: .serif).weight(.medium))
                    .foregroundStyle(RilloraTheme.ink)

                NavigationLink("Purchase layout") { ApplePurchaseLayoutPreview() }
                    .accessibilityIdentifier("preview.apple-purchase")

                RilloraFilterPicker(title: "Preview section", options: [
                    .init(id: "feedback", title: "Feedback"),
                    .init(id: "loading", title: "Loading"),
                    .init(id: "flow", title: "Flow"),
                ], selection: $section, identifier: "preview.section")

                Group {
                    switch section {
                    case "loading": LoadingPreview()
                    case "flow": FlowPreview()
                    default: FeedbackPreview()
                    }
                }

                Toggle("Reduce motion", isOn: $reduceMotion)
                    .tint(RilloraTheme.sage)
                    .foregroundStyle(RilloraTheme.body)
                    .accessibilityIdentifier("preview.reduce-motion")
                Text("Local preview · Nothing is saved")
                    .font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            .padding(22)
            .frame(maxWidth: 600)
            .frame(maxWidth: .infinity)
            .environment(\.rilloraMotionOverride, reduceMotion || inheritedReduceMotion)
        }
        .background(RilloraTheme.canvas.ignoresSafeArea())
        .navigationTitle("Rillora Preview")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                NavigationLink { RilloraDesignCreditsView() } label: {
                    Label("Component credits", systemImage: "info.circle")
                }
                .accessibilityIdentifier("preview.credits")
            }
        }
        .accessibilityIdentifier("preview.home")
    }
}

private struct FeedbackPreview: View {
    @State private var filter = "all"
    @State private var confirmations = 0
    @State private var attention = 0
    @State private var result = "Ready to try"
    @State private var symbol = "hand.tap"

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 20) {
                RilloraTaskEmblem(systemImage: symbol, size: 84)
                Text(result)
                    .font(.system(.title2, design: .serif))
                    .foregroundStyle(RilloraTheme.ink)
                    .contentTransition(.opacity)
            }
            .frame(maxWidth: .infinity, minHeight: 176)
            .rilloraCard()
            .rilloraConfirmation(trigger: confirmations)
            .rilloraAttention(trigger: attention)

            Button {
                symbol = "checkmark"
                result = "Confirmation"
                confirmations += 1
            } label: {
                Label("Try confirmation", systemImage: "checkmark.circle")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("preview.confirm")

            Button {
                symbol = "exclamationmark"
                result = "Needs attention"
                attention += 1
            } label: {
                Label("Try attention", systemImage: "exclamationmark.circle")
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .foregroundStyle(RilloraTheme.body)
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityIdentifier("preview.attention")

            RilloraFilterPicker(title: "Sample matter filter", options: [
                .init(id: "all", title: "All"),
                .init(id: "review", title: "To review"),
                .init(id: "added", title: "Directions added"),
            ], selection: $filter, identifier: "preview.filter")
        }
    }
}

private struct LoadingPreview: View {
    @State private var isLoading = false
    @State private var request = 0
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        VStack(spacing: 24) {
            Group {
                if isLoading {
                    RilloraLoadingSkeleton(compact: true)
                } else {
                    VStack(spacing: 18) {
                        RilloraTaskEmblem(systemImage: "checkmark")
                        Text("Ready").font(.system(.title2, design: .serif))
                            .foregroundStyle(RilloraTheme.ink)
                    }
                    .frame(maxWidth: .infinity, minHeight: 216)
                    .rilloraCard()
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(isLoading ? "Loading preview" : "Preview ready")

            Button {
                isLoading = true
                request += 1
            } label: {
                Label(isLoading ? "Loading…" : "Replay loading", systemImage: "arrow.clockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .disabled(isLoading)
            .accessibilityIdentifier("preview.loading")
        }
        .task(id: request) {
            guard request > 0 else { return }
            do { try await Task.sleep(for: .seconds(3)) } catch { return }
            withAnimation(reduceMotion ? nil : RilloraMotion.reveal) { isLoading = false }
        }
    }
}

private struct FlowPreview: View {
    @State private var step = 0
    @RilloraReduceMotion private var reduceMotion
    private let symbols = ["person.crop.circle", "slider.horizontal.3", "link"]
    private let titles = ["Person", "Access", "Link"]

    var body: some View {
        VStack(spacing: 24) {
            InvitationStepRail(current: step)
            VStack(spacing: 20) {
                RilloraTaskEmblem(systemImage: symbols[step], size: 84)
                Text(titles[step]).font(.system(.title, design: .serif))
                    .foregroundStyle(RilloraTheme.ink)
            }
            .id(step)
            .frame(maxWidth: .infinity, minHeight: 176)
            .rilloraCard()
            .transition(reduceMotion ? .identity : RilloraMotion.contentReveal)

            Button {
                withAnimation(reduceMotion ? nil : RilloraMotion.reveal) { step = (step + 1) % 3 }
            } label: {
                Label(step == 2 ? "Replay steps" : "Next step", systemImage: "arrow.right")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("preview.next-step")

            DisclosureGroup("Visible details") {
                VStack(alignment: .leading, spacing: 14) {
                    Label("Provider name", systemImage: "building.2")
                    Label("Where to find it", systemImage: "folder")
                    Label("Notes", systemImage: "note.text")
                }
                .foregroundStyle(RilloraTheme.body)
                .padding(.vertical, 8)
            }
            .foregroundStyle(RilloraTheme.ink)
            .disclosureGroupStyle(RilloraDisclosureStyle())
            .rilloraCard()
            .accessibilityIdentifier("preview.disclosure")
        }
    }
}
