import SwiftUI

/// A local reading suggestion; it neither saves a match nor changes sharing.
struct MatterAccountGuides: View {
    let guides: [OfficialProviderGuide]
    var preparing = false
    @State private var selectedGuide: OfficialProviderGuide?

    var body: some View {
        if !guides.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Account inheritance guidance")
                    .font(.caption.weight(.semibold)).foregroundStyle(RilloraTheme.muted)
                ForEach(guides) { guide in
                    Button { selectedGuide = guide } label: {
                        HStack(spacing: 12) {
                            OfficialProviderMark(guide: guide, size: 36)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("\(guide.name) guidance").font(.body.weight(.semibold))
                                Text("Prepare now · After a death").font(.footnote).foregroundStyle(RilloraTheme.muted)
                            }.frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "chevron.right").font(.caption).accessibilityHidden(true)
                        }.frame(minHeight: 44).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("matter.guide.\(guide.id)")
                }
            }
            .padding(.vertical, 8)
            .sheet(item: $selectedGuide) { guide in
                MatterAccountGuideSheet(guide: guide, preparing: preparing)
            }
        }
    }
}

private struct MatterAccountGuideSheet: View {
    let guide: OfficialProviderGuide
    let preparing: Bool
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            OfficialProviderGuideDetailView(guide: guide, initialPart: preparing ? "now" : nil)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
                }
        }.rilloraFocusedTask()
    }
}
