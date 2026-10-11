import CoreTransferable
import SwiftUI
import UniformTypeIdentifiers

struct PrivateMapFile: Transferable, Sendable {
    let data: Data
    let filename: String
    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .json) { $0.data }.suggestedFileName { $0.filename }
    }
}

struct AccountDataView: View {
    let service: any AccountDataServing
    let overviewStore: OverviewStore
    var onDeletionRequested: (AccountDeletionReference) async -> Void = { _ in }
    @State private var profile: AccountDataProfile?
    @State private var archived: [Matter] = []
    @State private var backupFile: PrivateMapFile?
    @State private var confirmBackup = false
    @State private var busy = false
    @State private var error: String?
    @State private var message: String?

    var body: some View {
        RilloraForm {
            if let profile { Section { HStack(spacing: 18) { RilloraTaskEmblem(systemImage: "doc.on.doc", size: 64); Text(profile.account.displayName).font(.headline) }.padding(.vertical, 8) }.listRowBackground(Color.clear) }
            if let error { Section { Label(error, systemImage: "exclamationmark.circle"); Button(String(localized: "Try again")) { Task { await load() } } } }
            if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection).contentTransition(.opacity) } }
            Section {
                Button { confirmBackup = true } label: { ProfileActionLabel(title: String(localized: "Download my complete map"), detail: "", systemImage: "square.and.arrow.down", accessory: .forward) }
                    .disabled(busy).accessibilityIdentifier("account-data.backup")
                if let backupFile {
                    ShareLink(item: backupFile, preview: SharePreview(String(localized: "Private Rillora map backup"))) { Label(String(localized: "Save private backup"), systemImage: "square.and.arrow.up") }
                        .accessibilityIdentifier("account-data.save-backup")
                }
                NavigationLink { SavedCopyReaderView(importService: service, overviewStore: overviewStore) } label: {
                    ProfileActionLabel(title: String(localized: "Open a saved copy"), detail: "", systemImage: "folder")
                }.accessibilityIdentifier("account-data.open-copy")
            }
            Section {
                DisclosureGroup(L10n.format("Archived matters · %1$lld", Int64(archived.count))) {
                    if archived.isEmpty { Text(String(localized: "No archived matters")).foregroundStyle(RilloraTheme.muted) }
                    ForEach(archived) { matter in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(matter.title)
                            Button(String(localized: "Restore privately")) { Task { await restore(matter) } }.disabled(busy)
                                .accessibilityIdentifier("account-data.restore.\(matter.publicId)")
                        }.padding(.vertical, 6)
                    }
                }
            }
            if let profile {
                Section {
                    NavigationLink { AccountDeletionView(service: service, profile: profile, onRequested: onDeletionRequested) } label: {
                        Label(String(localized: "Delete my account"), systemImage: "person.crop.circle.badge.minus").foregroundStyle(RilloraTheme.clay)
                    }.accessibilityIdentifier("account-data.delete")
                }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle(String(localized: "My data"))
        .navigationBarTitleDisplayMode(.inline).accessibilityIdentifier("account-data.view")
        .task { await load() }
        .confirmationDialog(String(localized: "Keep a complete private copy?"), isPresented: $confirmBackup, titleVisibility: .visible) {
            Button(String(localized: "Prepare my backup")) { Task { await makeBackup() } }
            Button(String(localized: "Cancel"), role: .cancel) {}
        } message: { Text(String(localized: "This file includes private matters, Notes and recorded people. Anyone with the file can read it.")) }
    }
    private func load() async {
        do { profile = try await service.fetchAccountDataProfile(); archived = try await service.fetchArchivedMatters(); error = nil }
        catch { self.error = error.localizedDescription }
    }
    private func makeBackup() async {
        busy = true; error = nil; defer { busy = false }
        do {
            let data = try await service.exportMapBackup()
            guard case .backup = try SavedCopyContent.read(data: data, filename: "backup.json") else { throw RilloraAPIError.invalidResponse }
            backupFile = PrivateMapFile(data: data, filename: "rillora-map-backup.json")
            message = String(localized: "Backup prepared. Keep the file private.")
        } catch { self.error = error.localizedDescription }
    }
    private func restore(_ matter: Matter) async {
        busy = true; error = nil; defer { busy = false }
        do {
            _ = try await service.restoreArchivedMatter(id: matter.publicId, version: matter.version)
            archived.removeAll { $0.id == matter.id }
            message = String(localized: "Restored as a private draft. Sharing stays off.")
            await overviewStore.reload()
        } catch { self.error = error.localizedDescription }
    }
}

struct SavedCopyReaderView: View {
    var importService: (any AccountDataServing)? = nil
    var overviewStore: OverviewStore? = nil
    @State private var content: SavedCopyContent?
    @State private var chooseFile = false
    @State private var recoveryFile = false
    @State private var confirmImport = false
    @State private var error: String?
    @State private var message: String?
    @State private var busy = false

    var body: some View {
        RilloraForm {
            Section {
                Button { recoveryFile = false; chooseFile = true } label: { ProfileActionLabel(title: String(localized: "Choose saved file"), detail: "", systemImage: "doc.badge.arrow.up", accessory: .forward) }
                    .disabled(busy).accessibilityIdentifier("saved-copy.choose")
                Text(String(localized: "Files and recovery keys open on this device.")).font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            if let error { Section { Label(error, systemImage: "exclamationmark.circle") } }
            if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection).contentTransition(.opacity) } }
            if let content {
                switch content {
                case .encrypted:
                    Section { Button(String(localized: "Choose matching recovery file")) { recoveryFile = true; chooseFile = true }.accessibilityIdentifier("saved-copy.recovery") }
                case .text(let value): Section { Text(verbatim: value).textSelection(.enabled) }
                case .backup(let document, _):
                    Section { Text(document.owner.displayName).font(.headline); Text(String(localized: "Saved copy · Read only")).foregroundStyle(RilloraTheme.muted) }
                    Section(L10n.format("Matters · %1$lld", Int64(document.matters.count))) {
                        ForEach(document.matters) { matter in
                            DisclosureGroup(matter.archivedAt == nil ? matter.title : L10n.format("%1$@ · Archived", matter.title)) {
                                VStack(alignment: .leading, spacing: 12) {
                                    if let value = matter.institutionName { field(String(localized: "Provider"), value) }
                                    if let value = matter.locationHint { field(String(localized: "Where to find it"), value) }
                                    field(String(localized: "Wishes"), MatterOutcome(rawValue: matter.desiredOutcome)?.label ?? matter.desiredOutcome)
                                    if let value = matter.accountHint { field(String(localized: "Masked reference"), value) }
                                    ForEach((matter.details ?? [:]).keys.sorted(), id: \.self) { key in field(detailName(key), matter.details?[key] ?? "") }
                                    if let value = matter.notes { field(String(localized: "Notes"), value) }
                                }.padding(.vertical, 8).textSelection(.enabled)
                            }
                        }
                    }
                    Section { DisclosureGroup(L10n.format("People · %1$lld", Int64(document.people.count))) { ForEach(document.people) { Text($0.displayName) } } }
                    if importService != nil { Section { Button(String(localized: "Import into an empty map")) { confirmImport = true }.disabled(busy).accessibilityIdentifier("saved-copy.import") } }
                case .directions(let document):
                    Section { Text(document.planner.displayName).font(.headline); Text(String(localized: "Saved directions · Read only")).foregroundStyle(RilloraTheme.muted) }
                    Section {
                        ForEach(document.matters) { matter in
                            DisclosureGroup(matter.title) {
                                VStack(alignment: .leading, spacing: 12) {
                                    if let value = matter.institutionName { field(String(localized: "Provider"), value) }
                                    if let value = matter.locationHint { field(String(localized: "Where to find it"), value) }
                                    if let value = matter.desiredOutcome { field(String(localized: "Wishes"), MatterOutcome(rawValue: value)?.label ?? value) }
                                    else { Text(String(localized: "Name only")) }
                                }.padding(.vertical, 8).textSelection(.enabled)
                            }
                        }
                    }
                }
                Section { Button(String(localized: "Close this copy")) { self.content = nil; message = nil; error = nil }.disabled(busy) }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle(String(localized: "Open saved copy"))
        .navigationBarTitleDisplayMode(.inline).accessibilityIdentifier("saved-copy.view")
        .fileImporter(isPresented: $chooseFile, allowedContentTypes: [.json, .plainText]) { result in
            Task {
                do { let url = try result.get(); try await open(url) }
                catch let error as NSError where error.code == NSUserCancelledError {}
                catch { self.error = error.localizedDescription }
            }
        }
        .confirmationDialog(String(localized: "Import these private records?"), isPresented: $confirmImport, titleVisibility: .visible) {
            Button(String(localized: "Import map")) { Task { await importCopy() } }
            Button(String(localized: "Cancel"), role: .cancel) {}
        } message: { Text(String(localized: "Import requires an empty map. It does not replace existing records, restore invitations or grant access to anyone.")) }
    }
    private func field(_ name: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) { Text(name).font(.caption).foregroundStyle(RilloraTheme.muted); Text(verbatim: value) }
    }
    private func detailName(_ key: String) -> String {
        ["cryptoCustody":String(localized: "Held in"), "network":String(localized: "Network"), "walletAddress":String(localized: "Public wallet address"), "walletLabel":String(localized: "Wallet app or device"), "assetSymbol":String(localized: "Asset or token"), "deviceModel":String(localized: "Model"), "documentType":String(localized: "Document type"), "assetType":String(localized: "Asset type"), "debtType":String(localized: "Debt type"), "billingCycle":String(localized: "Billing cycle"), "renewalDate":String(localized: "Renewal date")][key] ?? key
    }
    private func open(_ url: URL) async throws {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        let data = try await BoundedDocumentReader.read(url, maximumBytes: recoveryFile ? 16_384 : 2 * 1024 * 1024)
        error = nil; message = nil
        if recoveryFile, case .encrypted(let artifact) = content {
            do {
                let key = try JSONDecoder().decode(StartHereRecoveryKit.self, from: data)
                content = .directions(try CryptoKitStartHereEncryptionService().decrypt(artifact: artifact, recoveryKit: key))
            } catch { throw RilloraAPIError.invalidPayload(String(localized: "This recovery file could not open the package. Check that the files belong together.")) }
        } else { content = try SavedCopyContent.read(data: data, filename: url.lastPathComponent) }
    }
    private func importCopy() async {
        guard case .backup(_, let data) = content, let importService else { return }
        busy = true; error = nil; defer { busy = false }
        do { let result = try await importService.importMapBackup(data); message = L10n.format("%1$lld matters imported. Sharing stays off.", Int64(result.matterCount)); await overviewStore?.reload() }
        catch { self.error = error.localizedDescription }
    }
}
