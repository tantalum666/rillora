import CoreTransferable
import SwiftUI
import UniformTypeIdentifiers

struct StartHerePreviewView: View {
    @State private var previewStore: StartHerePreviewStore
    @State private var rehearsalStore: RecipientRehearsalStore
    @State private var acknowledgesPlaintext = false
    @State private var acknowledgesNoRevocation = false
    @State private var acknowledgesRecoveryRisk = false
    @State private var acknowledgesEncryptedCopies = false
    @State private var selectedRehearsalContactID = ""
    @State private var exportFormat = StartHereExportFormat.printable

    init(service: any StartHerePreviewing) {
        _previewStore = State(initialValue: StartHerePreviewStore(service: service))
        _rehearsalStore = State(initialValue: RecipientRehearsalStore(service: service))
    }

    var body: some View {
        Group {
            switch previewStore.state {
            case .ready, .failed:
                readyView
            case .loading:
                loadingView
            case .loaded(let preview):
                previewView(preview)
            }
        }
        .rilloraFocusedTask()
        .navigationTitle("Start Here")
        .navigationBarTitleDisplayMode(.inline)
        .alert(
            "Start Here action not completed",
            isPresented: Binding(
                get: {
                    if case .failed = previewStore.state { return true }
                    if case .failed = previewStore.printableState { return true }
                    if case .failed = previewStore.encryptedState { return true }
                    if case .failed = rehearsalStore.state { return true }
                    return false
                },
                set: { if !$0 { previewStore.clearFailure() } }
            )
        ) {
            Button("OK", role: .cancel) {
                previewStore.clearFailure()
                rehearsalStore.clearFailure()
            }
        } message: {
            if case .failed(let message) = previewStore.state {
                Text(message)
            } else if case .failed(let message) = previewStore.printableState {
                Text(message)
            } else if case .failed(let message) = previewStore.encryptedState {
                Text(message)
            } else if case .failed(let message) = rehearsalStore.state {
                Text(message)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("start-here.view")
    }

    private var readyView: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("A guide for someone you trust")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                    Text("Review the directions from your map before choosing a printable or encrypted copy.")
                        .foregroundStyle(RilloraTheme.body)
                }
            }

            Section {
                Button {
                    Task { await refreshPreview() }
                } label: {
                    Label("Preview my guide", systemImage: "eye")
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .accessibilityIdentifier("start-here.preview")
            } footer: {
                Text("Only you see this preview. No file is created or shared.")
            }

            StartHereBoundarySection()
        }
        .rilloraStructuredList()
    }

    private var loadingView: some View {
        VStack(spacing: 14) {
            ProgressView()
            Text("Preparing your preview…")
                .foregroundStyle(RilloraTheme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func previewView(_ preview: StartHerePreview) -> some View {
        List {
            Section {
                Label("Preview ready — no file created", systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .foregroundStyle(RilloraTheme.sage)
                    .accessibilityIdentifier("start-here.preview-result")
                LabeledContent("Planner", value: preview.package.planner.displayName)
                LabeledContent("Continuity status", value: preview.package.plan.status.capitalized)
                LabeledContent("Matters", value: String(preview.package.matters.count))
                LabeledContent(
                    "Trusted contacts",
                    value: String(preview.package.trustedContacts.count)
                )
            } footer: {
                if let expiry = formattedExpiry(preview.export.expiresAt) {
                    Text("Preview expires \(expiry). Refresh it after changing your map.")
                } else {
                    Text("Refresh this preview after changing your map.")
                }
            }

            Section("Matter directions") {
                ForEach(preview.package.matters) { matter in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(matter.title)
                            .font(.body.weight(.semibold))
                            .foregroundStyle(RilloraTheme.ink)
                        Text(matter.desiredOutcome.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.footnote)
                            .foregroundStyle(RilloraTheme.muted)
                    }
                    .accessibilityElement(children: .combine)
                }
            }

            Section("Trusted-contact records") {
                if preview.package.trustedContacts.isEmpty {
                    Text("No trusted-contact records")
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    ForEach(
                        Array(preview.package.trustedContacts.enumerated()),
                        id: \.offset
                    ) { _, contact in
                        LabeledContent(
                            contact.displayName,
                            value: contact.relationshipLabel ?? "Relationship not added"
                        )
                    }
                }
            }

            StartHereBoundarySection()

            Section("Save a copy") {
                RilloraAdaptivePicker("Format", selection: $exportFormat) {
                    Text("Printable guide").tag(StartHereExportFormat.printable)
                    Text("Encrypted package").tag(StartHereExportFormat.encrypted)
                }
                .disabled(isBusy)
                .accessibilityIdentifier("start-here.format")
            }

            if exportFormat == .printable {
            Section {
                Toggle(
                    "I reviewed the included directions and understand this file is plaintext.",
                    isOn: $acknowledgesPlaintext
                )
                Toggle(
                    "I understand a saved, shared or printed copy cannot be revoked by Rillora.",
                    isOn: $acknowledgesNoRevocation
                )
            } header: {
                Text("Plaintext acknowledgement")
            } footer: {
                Text("The guide excludes dedicated account hints, financial values and currencies. It is not an encrypted digital package.")
            }

            Section {
                printableAction(for: preview)

            }
            } else {
            Section {
                Label("Encrypted package", systemImage: "lock.shield")
                    .font(.headline)
                    .foregroundStyle(RilloraTheme.ink)
                Text("Protect a saved copy with encryption. You must keep a separate recovery key to open it later.")
                    .foregroundStyle(RilloraTheme.body)
                DisclosureGroup("How encryption works") {
                    Text("A fresh AES-256 content key is created on this device and wrapped with RFC 9180 HPKE for eligible accepted recipient devices and a one-time Owner recovery key. The API receives ciphertext and wrapped keys, not the recovery private key or unwrapped content key.")
                        .font(.footnote)
                        .foregroundStyle(RilloraTheme.muted)
                }
            } header: {
                Text("Encrypted option")
            } footer: {
                Text("Real recipient enrollment and post-death delivery are not active yet.")
            }

            Section {
                Toggle(
                    "I understand Rillora cannot recover the offline recovery key and anyone holding it can decrypt this package.",
                    isOn: $acknowledgesRecoveryRisk
                )
                Toggle(
                    "I understand copies saved outside Rillora cannot be remotely revoked.",
                    isOn: $acknowledgesEncryptedCopies
                )
            } header: {
                Text("Recovery acknowledgement")
            } footer: {
                Text("The recovery file is a decryption secret. Store it separately from the encrypted package.")
            }

            Section {
                encryptedAction(for: preview)
            }
            }

            Section {
                Button("Refresh preview") {
                    Task { await refreshPreview() }
                }
                .disabled(isBusy)
            }

            #if DEBUG
            recipientRehearsalSection(preview)
            #endif
        }
        .rilloraStructuredList()
        .task(id: preview.export.publicId) {
            #if DEBUG
            await rehearsalStore.loadContacts()
            if selectedRehearsalContactID.isEmpty {
                selectedRehearsalContactID = rehearsalStore.contacts.first?.publicId ?? ""
            }
            #endif
        }
    }

    @ViewBuilder
    private func recipientRehearsalSection(_ preview: StartHerePreview) -> some View {
        Section {
            Label("Synthetic recipient rehearsal", systemImage: "person.badge.key.fill")
                .font(.headline)
                .foregroundStyle(RilloraTheme.ink)
            Text("Exercises acceptance, a memory-only device key, recipient-only package access and local decryption.")
                .foregroundStyle(RilloraTheme.body)
            switch rehearsalStore.state {
            case .idle, .failed:
                if rehearsalStore.contacts.isEmpty {
                    Text("Add a synthetic trusted-contact record before running this rehearsal.")
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    RilloraAdaptivePicker("Test contact record", selection: $selectedRehearsalContactID) {
                        ForEach(rehearsalStore.contacts) { contact in
                            Text(contact.displayName).tag(contact.publicId)
                        }
                    }
                    Button {
                        Task {
                            await rehearsalStore.run(
                                preview: preview,
                                personPublicID: selectedRehearsalContactID
                            )
                        }
                    } label: {
                        Label("Run recipient decryption rehearsal", systemImage: "checkmark.shield")
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(RilloraTheme.sage)
                    .disabled(selectedRehearsalContactID.isEmpty || isBusy)
                    .accessibilityIdentifier("start-here.recipient-rehearsal")
                }
            case .loading:
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Running isolated acceptance and decryption…")
                }
            case .revoking:
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Revoking synthetic device key…")
                }
            case .passed(let result):
                Label("Recipient-side decryption passed", systemImage: "checkmark.shield.fill")
                    .foregroundStyle(RilloraTheme.sage)
                Text("Decrypted \(result.decryptedMatterCount) matter directions. Delivery: no. Release: no.")
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
                Button(result.keyRevoked ? "Synthetic device key revoked" : "Revoke synthetic device key") {
                    Task { await rehearsalStore.revokeKey() }
                }
                .disabled(result.keyRevoked || isBusy)
            }
        } header: {
            Text("Recipient rehearsal")
        } footer: {
            Text("This verifies no identity, detects no death, sends no invitation and releases no data. Revocation cannot erase plaintext or external copies already obtained.")
        }
    }

    @ViewBuilder
    private func encryptedAction(for preview: StartHerePreview) -> some View {
        switch previewStore.encryptedState {
        case .idle, .failed:
            Button {
                Task { await previewStore.createEncrypted(preview: preview) }
            } label: {
                Label("Create encrypted package", systemImage: "lock.shield")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(.borderedProminent)
            .tint(RilloraTheme.sage)
            .disabled(
                !acknowledgesRecoveryRisk
                || !acknowledgesEncryptedCopies
                || isPrintableLoading
            )
            .accessibilityIdentifier("start-here.encrypted")
        case .loading:
            HStack(spacing: 10) {
                ProgressView()
                Text("Encrypting and recovery-testing on this device…")
            }
            .frame(maxWidth: .infinity, alignment: .center)
        case .loaded(let bundle, let record):
            let recoveryDocument = StartHereJSONDocument(
                data: bundle.recoveryKitData,
                filename: "rillora-recovery-\(record.publicId).json"
            )
            let artifactDocument = StartHereJSONDocument(
                data: bundle.artifactData,
                filename: "rillora-encrypted-start-here-\(record.publicId).json"
            )
            Label("Encrypted and locally recovery-tested", systemImage: "checkmark.shield.fill")
                .foregroundStyle(RilloraTheme.sage)
            Text("Accepted recipient device keys: \(record.recipientKeyCount). Recipient delivery performed: no.")
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
            if record.recipientKeyCount == 0 {
                Text("No eligible accepted recipient device key exists yet. Only the offline Owner recovery key can currently open this package.")
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.clay)
            }
            ShareLink(
                item: recoveryDocument,
                preview: SharePreview(
                    "Rillora offline recovery key",
                    icon: Image(systemName: "key")
                )
            ) {
                Label("Save offline recovery key", systemImage: "key")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("start-here.share-recovery")

            ShareLink(
                item: artifactDocument,
                preview: SharePreview(
                    "Rillora encrypted Start Here package",
                    icon: Image(systemName: "doc.badge.lock")
                )
            ) {
                Label("Save encrypted package", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(.bordered)
            .accessibilityIdentifier("start-here.share-encrypted")
        }
    }

    @ViewBuilder
    private func printableAction(for preview: StartHerePreview) -> some View {
        switch previewStore.printableState {
        case .idle, .failed:
            Button {
                Task {
                    await previewStore.createPrintable(previewPublicID: preview.export.publicId)
                }
            } label: {
                Label("Prepare printable guide", systemImage: "doc.text")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .disabled(!acknowledgesPlaintext || !acknowledgesNoRevocation || isBusy)
            .accessibilityIdentifier("start-here.printable")
        case .loading:
            HStack(spacing: 10) {
                ProgressView()
                Text("Preparing the guide…")
            }
            .frame(maxWidth: .infinity, alignment: .center)
        case .loaded(let artifact):
            let document = StartHerePrintableDocument(
                data: artifact.data,
                filename: artifact.filename
            )
            ShareLink(
                item: document,
                preview: SharePreview(
                    "Rillora Start Here guide",
                    icon: Image(systemName: "doc.text")
                )
            ) {
                Label("Share or print guide", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("start-here.share")

            Text("Guide prepared. No server copy is retained.")
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
    }

    private var isPrintableLoading: Bool {
        if case .loading = previewStore.printableState { return true }
        return false
    }

    private var isBusy: Bool {
        if case .loading = previewStore.printableState { return true }
        if case .loading = previewStore.encryptedState { return true }
        if case .loading = rehearsalStore.state { return true }
        if case .revoking = rehearsalStore.state { return true }
        return false
    }

    private func refreshPreview() async {
        if await previewStore.createPreview() != nil {
            acknowledgesPlaintext = false
            acknowledgesNoRevocation = false
            acknowledgesRecoveryRisk = false
            acknowledgesEncryptedCopies = false
            selectedRehearsalContactID = ""
            rehearsalStore.reset()
        }
    }

    private func formattedExpiry(_ value: String?) -> String? {
        guard let value else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value) else {
            return nil
        }
        return date.formatted(date: .omitted, time: .shortened)
    }
}

private enum StartHereExportFormat: Hashable {
    case printable
    case encrypted
}

private struct StartHereBoundarySection: View {
    var body: some View {
        Section {
            RilloraFactStrip([
                .init(title: "Directions only", systemImage: "map"),
                .init(title: "No authority", systemImage: "building.columns"),
                .init(title: "No delivery", systemImage: "person.crop.circle.badge.xmark"),
            ])
        }
    }
}

private struct StartHereJSONDocument: Transferable, Sendable {
    let data: Data
    let filename: String

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .json) { document in
            document.data
        }
        .suggestedFileName { document in
            document.filename
        }
    }
}

private struct StartHerePrintableDocument: Transferable, Sendable {
    let data: Data
    let filename: String

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .plainText) { document in
            document.data
        }
        .suggestedFileName { document in
            document.filename
        }
    }
}
