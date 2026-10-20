import SwiftUI

struct SharingPreviewContent: View {
    let grants: [SharingGrant]
    let service: any SharingServing
    var connectionPublicID: String? = nil
    var connectionState: String = ""
    @State private var preview: SharingPreview?
    @State private var error: String?
    @State private var retry = 0
    private var selection: String { grants.map { "\($0.matterPublicId):\($0.detailLevel.rawValue)" }.sorted().joined(separator: ",") }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let error {
                Text(error).foregroundStyle(RilloraTheme.clay)
                Button(String(localized: "Retry preview")) { retry += 1 }.frame(minHeight: 44)
            } else if let preview {
                if preview.accessMode == .saved { Text(String(localized: "Updates paused · Currently visible saved copies")).foregroundStyle(RilloraTheme.muted) }
                if preview.items.isEmpty { Text(grants.isEmpty ? String(localized: "No matters selected.") : String(localized: "No saved copy is available for this selection. Resume updates to share new content.")) }
                ForEach(preview.items) { item in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(item.fields["title"] ?? "").font(.headline)
                        if let category = item.fields["category"] { Text(MatterCategory(rawValue: category)?.label ?? category).font(.subheadline) }
                        if item.detailLevel == .name { Text(String(localized: "Only the name and category are shared.")).font(.subheadline) }
                        SharedMatterFields(fields: item.fields)
                    }
                }
                Text(String(localized: "Read only. Unselected matters remain private.")).font(.footnote).foregroundStyle(RilloraTheme.muted)
            } else { ProgressView(String(localized: "Loading visible details…")) }
        }.task(id: "\(selection)-\(retry)-\(connectionPublicID ?? "new")-\(connectionState)") {
            preview = nil; error = nil
            do {
                let value = try await service.previewSharing(grants: grants, connectionPublicID: connectionPublicID)
                guard !Task.isCancelled else { return }
                preview = value
            } catch {
                guard !Task.isCancelled else { return }
                self.error = error.localizedDescription
            }
        }
    }
}
