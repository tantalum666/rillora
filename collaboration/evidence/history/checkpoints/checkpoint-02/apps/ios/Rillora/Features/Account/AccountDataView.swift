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
            if let error { Section { Label(error, systemImage: "exclamationmark.circle"); Button("Try again") { Task { await load() } } } }
            if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection).contentTransition(.opacity) } }
            Section {
                Button { confirmBackup = true } label: { ProfileActionLabel(title: "Download my complete map", detail: "", systemImage: "square.and.arrow.down", accessory: .forward) }
                    .disabled(busy).accessibilityIdentifier("account-data.backup")
                if let backupFile {
                    ShareLink(item: backupFile, preview: SharePreview("Private Rillora map backup")) { Label("Save private backup", systemImage: "square.and.arrow.up") }
                        .accessibilityIdentifier("account-data.save-backup")
                }
                NavigationLink { SavedCopyReaderView(importService: service, overviewStore: overviewStore) } label: {
                    ProfileActionLabel(title: "Open a saved copy", detail: "", systemImage: "folder")
                }.accessibilityIdentifier("account-data.open-copy")
            }
            Section {
                DisclosureGroup("Archived matters · \(archived.count)") {
                    if archived.isEmpty { Text("No archived matters").foregroundStyle(RilloraTheme.muted) }
                    ForEach(archived) { matter in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(matter.title)
                            Button("Restore privately") { Task { await restore(matter) } }.disabled(busy)
                                .accessibilityIdentifier("account-data.restore.\(matter.publicId)")
                        }.padding(.vertical, 6)
                    }
                }
            }
            if let profile {
                Section {
                    NavigationLink { AccountDeletionView(service: service, profile: profile, onRequested: onDeletionRequested) } label: {
                        Label("Delete my account", systemImage: "person.crop.circle.badge.minus").foregroundStyle(RilloraTheme.clay)
                    }.accessibilityIdentifier("account-data.delete")
                }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle("My data")
        .navigationBarTitleDisplayMode(.inline).accessibilityIdentifier("account-data.view")
        .task { await load() }
        .confirmationDialog("Keep a complete private copy?", isPresented: $confirmBackup, titleVisibility: .visible) {
            Button("Prepare my backup") { Task { await makeBackup() } }
            Button("Cancel", role: .cancel) {}
        } message: { Text("This file includes private matters, Notes and recorded people. Anyone with the file can read it.") }
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
            message = "Backup prepared. Keep the file private."
        } catch { self.error = error.localizedDescription }
    }
    private func restore(_ matter: Matter) async {
        busy = true; error = nil; defer { busy = false }
        do {
            _ = try await service.restoreArchivedMatter(id: matter.publicId, version: matter.version)
            archived.removeAll { $0.id == matter.id }
            message = "Restored as a private draft. Sharing stays off."
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
                Button { recoveryFile = false; chooseFile = true } label: { ProfileActionLabel(title: "Choose saved file", detail: "", systemImage: "doc.badge.arrow.up", accessory: .forward) }
                    .disabled(busy).accessibilityIdentifier("saved-copy.choose")
                Text("Files and recovery keys open on this device.").font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            if let error { Section { Label(error, systemImage: "exclamationmark.circle") } }
            if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection).contentTransition(.opacity) } }
            if let content {
                switch content {
                case .encrypted:
                    Section { Button("Choose matching recovery file") { recoveryFile = true; chooseFile = true }.accessibilityIdentifier("saved-copy.recovery") }
                case .text(let value): Section { Text(verbatim: value).textSelection(.enabled) }
                case .backup(let document, _):
                    Section { Text(document.owner.displayName).font(.headline); Text("Saved copy · Read only").foregroundStyle(RilloraTheme.muted) }
                    Section("Matters · \(document.matters.count)") {
                        ForEach(document.matters) { matter in
                            DisclosureGroup(matter.title + (matter.archivedAt == nil ? "" : " · Archived")) {
                                VStack(alignment: .leading, spacing: 12) {
                                    if let value = matter.institutionName { field("Provider", value) }
                                    if let value = matter.locationHint { field("Where to find it", value) }
                                    field("Wishes", MatterOutcome(rawValue: matter.desiredOutcome)?.label ?? matter.desiredOutcome)
                                    if let value = matter.accountHint { field("Masked reference", value) }
                                    ForEach((matter.details ?? [:]).keys.sorted(), id: \.self) { key in field(detailName(key), matter.details?[key] ?? "") }
                                    if let value = matter.notes { field("Notes", value) }
                                }.padding(.vertical, 8).textSelection(.enabled)
                            }
                        }
                    }
                    Section { DisclosureGroup("People · \(document.people.count)") { ForEach(document.people) { Text($0.displayName) } } }
                    if importService != nil { Section { Button("Import into an empty map") { confirmImport = true }.disabled(busy).accessibilityIdentifier("saved-copy.import") } }
                case .directions(let document):
                    Section { Text(document.planner.displayName).font(.headline); Text("Saved directions · Read only").foregroundStyle(RilloraTheme.muted) }
                    Section {
                        ForEach(document.matters) { matter in
                            DisclosureGroup(matter.title) {
                                VStack(alignment: .leading, spacing: 12) {
                                    if let value = matter.institutionName { field("Provider", value) }
                                    if let value = matter.locationHint { field("Where to find it", value) }
                                    if let value = matter.desiredOutcome { field("Wishes", value.replacingOccurrences(of: "_", with: " ")) }
                                    else { Text("Name only") }
                                }.padding(.vertical, 8).textSelection(.enabled)
                            }
                        }
                    }
                }
                Section { Button("Close this copy") { self.content = nil; message = nil; error = nil }.disabled(busy) }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle("Open saved copy")
        .navigationBarTitleDisplayMode(.inline).accessibilityIdentifier("saved-copy.view")
        .fileImporter(isPresented: $chooseFile, allowedContentTypes: [.json, .plainText]) { result in
            do { let url = try result.get(); try open(url) }
            catch let error as NSError where error.code == NSUserCancelledError {}
            catch { self.error = error.localizedDescription }
        }
        .confirmationDialog("Import these private records?", isPresented: $confirmImport, titleVisibility: .visible) {
            Button("Import map") { Task { await importCopy() } }
            Button("Cancel", role: .cancel) {}
        } message: { Text("Import requires an empty map. It does not replace existing records, restore invitations or grant access to anyone.") }
    }
    private func field(_ name: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) { Text(name).font(.caption).foregroundStyle(RilloraTheme.muted); Text(verbatim: value) }
    }
    private func detailName(_ key: String) -> String {
        ["cryptoCustody":"Held in", "network":"Network", "walletAddress":"Public wallet address", "walletLabel":"Wallet app or device", "assetSymbol":"Asset or token", "deviceModel":"Model", "documentType":"Document type", "assetType":"Asset type", "debtType":"Debt type", "billingCycle":"Billing cycle", "renewalDate":"Renewal date"][key] ?? key
    }
    private func open(_ url: URL) throws {
        let access = url.startAccessingSecurityScopedResource(); defer { if access { url.stopAccessingSecurityScopedResource() } }
        let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size <= (recoveryFile ? 16_384 : 2 * 1024 * 1024) else { throw RilloraAPIError.invalidPayload("The selected file is too large.") }
        let data = try Data(contentsOf: url); error = nil; message = nil
        if recoveryFile, case .encrypted(let artifact) = content {
            do {
                let key = try JSONDecoder().decode(StartHereRecoveryKit.self, from: data)
                content = .directions(try CryptoKitStartHereEncryptionService().decrypt(artifact: artifact, recoveryKit: key))
            } catch { throw RilloraAPIError.invalidPayload("This recovery file could not open the package. Check that the files belong together.") }
        } else { content = try SavedCopyContent.read(data: data, filename: url.lastPathComponent) }
    }
    private func importCopy() async {
        guard case .backup(_, let data) = content, let importService else { return }
        busy = true; error = nil; defer { busy = false }
        do { let result = try await importService.importMapBackup(data); message = "\(result.matterCount) matters imported. Sharing stays off."; await overviewStore?.reload() }
        catch { self.error = error.localizedDescription }
    }
}
