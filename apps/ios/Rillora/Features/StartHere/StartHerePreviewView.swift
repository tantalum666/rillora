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
    @State private var exportStep = "review"
    @State private var acknowledgesRecoveryKept = false
    @State private var showsRecoveryExitWarning = false
    @State private var pendingPreviewReplacement = false
    @State private var audienceChoice = ""
    @State private var recipientConnectionID = ""
    @State private var pendingAudienceChange = false
    @Environment(\.dismiss) private var dismiss
    @RilloraReduceMotion private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

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
        .navigationTitle(String(localized: "Export directions"))
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(exportStep != "review" || hasUnkeptRecoveryKey)
        .interactiveDismissDisabled(isBusy || hasUnkeptRecoveryKey)
        .toolbar {
            if exportStep != "review" || hasUnkeptRecoveryKey {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Back")) {
                        if exportStep != "review" { exportStep = exportStep == "save" ? "format" : "review" }
                        else { pendingPreviewReplacement = false; pendingAudienceChange = false; showsRecoveryExitWarning = true }
                    }
                        .disabled(isBusy)
                }
            }
        }
        .alert(
            String(localized: "Start Here action not completed"),
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
            if case .loaded = previewStore.state {
                Button(String(localized: "Refresh and review")) {
                    previewStore.clearFailure()
                    Task { await refreshPreview() }
                }
            }
            Button(String(localized: "OK"), role: .cancel) {
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
        .confirmationDialog(String(localized: "Keep your recovery key"), isPresented: $showsRecoveryExitWarning, titleVisibility: .visible) {
            // Popover-style confirmations can omit the implicit cancel action.
            Button(String(localized: "Go to recovery key")) { exportStep = "save" }
            Button(pendingAudienceChange ? String(localized: "Change audience") : pendingPreviewReplacement ? String(localized: "Replace preview") : String(localized: "Leave anyway"), role: .destructive) {
                if pendingAudienceChange { resetAudience() }
                else if pendingPreviewReplacement { Task { await refreshPreview(discardRecovery: true) } }
                else { dismiss() }
            }
        } message: {
            Text(String(localized: "Leaving or replacing this preview can remove the only recovery key for this copy."))
        }
        .accessibilityIdentifier("start-here.view")
        .task { await previewStore.loadRecipients() }
    }

    private var readyView: some View {
        ScrollView {
            VStack(spacing: 22) {
                if !dynamicTypeSize.isAccessibilitySize {
                    Text(String(localized: "Who is this copy for?"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(RilloraTheme.ink)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                RilloraAdaptivePicker(String(localized: "Who is this copy for?"), selection: $audienceChoice) {
                    Text(String(localized: "Choose an audience…")).tag("")
                    Text(String(localized: "For me")).tag("owner")
                    Text(String(localized: "For a person")).tag("recipient")
                }.accessibilityIdentifier("start-here.audience")
                if audienceChoice == "recipient" {
                    RilloraAdaptivePicker(String(localized: "Connected person · Required"), selection: $recipientConnectionID) {
                        Text(String(localized: "Choose a person")).tag("")
                        ForEach(previewStore.recipients) { Text($0.personName).tag($0.publicId) }
                    }.accessibilityIdentifier("start-here.recipient")
                    if let message = previewStore.recipientError {
                        Text(message)
                        Button(String(localized: "Try again")) { Task { await previewStore.loadRecipients() } }
                    } else if previewStore.recipients.isEmpty {
                        Text(String(localized: "No connected people yet. Send an invitation first.")).foregroundStyle(RilloraTheme.muted)
                    }
                    Text(String(localized: "Only their currently shared matters and permitted directions.")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                } else if audienceChoice == "owner" {
                    Text(String(localized: "A personal directions overview. Choose a person before making a copy to share.")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                }
                Button {
                    Task { await refreshPreview() }
                } label: {
                    Label(String(localized: "Review this copy"), systemImage: "eye")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(RilloraPrimaryActionButtonStyle())
                .disabled(audienceChoice.isEmpty || (audienceChoice == "recipient" && recipientConnectionID.isEmpty))
                .accessibilityIdentifier("start-here.preview")
                RilloraInfoDisclosure(String(localized: "Before you export")) {
                    Text(String(localized: "The server-generated guide and recovery-file warnings remain in English. Your saved content is unchanged."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    Text(String(localized: "Only you see this preview. No file is created or shared."))
                        .font(.subheadline).foregroundStyle(RilloraTheme.body)
                    RilloraFactStrip([
                        .init(title: String(localized: "Directions only"), systemImage: "map"),
                        .init(title: String(localized: "No authority"), systemImage: "building.columns"),
                        .init(title: String(localized: "No delivery"), systemImage: "envelope"),
                    ])
                }
            }
            .padding(24)
        }
        .background(RilloraTheme.canvas)
    }

    private var loadingView: some View {
        ScrollView {
            VStack(spacing: 22) {
                guideArtwork.frame(height: 250).opacity(0.65)
                ProgressView(String(localized: "Preparing preview…"))
                    .tint(RilloraTheme.tabSelection)
                    .frame(maxWidth: .infinity, minHeight: 52)
            }
            .padding(24)
        }
        .background(RilloraTheme.canvas)
    }

    private var guideArtwork: some View {
        Image("ContinuityGuide")
            .resizable().scaledToFit()
            .rotation3DEffect(.degrees(reduceMotion ? 0 : exportFormat == .encrypted ? 5 : -3), axis: (x: 0, y: 1, z: 0))
            .animation(reduceMotion ? nil : .easeOut(duration: 0.25), value: exportFormat)
            .accessibilityHidden(true)
    }

    private func previewView(_ preview: StartHerePreview) -> some View {
        RilloraForm {
            Section {
                RilloraTaskTabs(tabs: [
                    .init(id: "review", title: String(localized: "Review"), symbol: "doc.text"),
                    .init(id: "format", title: String(localized: "Format"), symbol: "square.on.square"),
                    .init(id: "save", title: String(localized: "Save"), symbol: "square.and.arrow.down"),
                ], selection: $exportStep, identifierPrefix: "start-here.step")
                .disabled(isBusy)
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)

            if exportStep == "review" {
                Section {
                    Label(preview.package.audience?.kind == "recipient" ? L10n.format("For %1$@", preview.package.audience?.name ?? String(localized: "your recipient")) : String(localized: "Personal directions · for me"), systemImage: "eye")
                        .font(.subheadline.weight(.semibold)).foregroundStyle(RilloraTheme.tabSelection)
                        .accessibilityIdentifier("start-here.preview-result")
                    LabeledContent(String(localized: "Planner"), value: preview.package.planner.displayName)
                    Text(L10n.format("%1$lld matters in this copy", preview.package.matters.count)).foregroundStyle(RilloraTheme.muted)
                    ForEach(preview.package.matters) { matter in
                        DisclosureGroup(matter.title) {
                            VStack(alignment: .leading, spacing: 12) {
                                Text(MatterCategory(rawValue: matter.category)?.label ?? matter.category).font(.footnote)
                                if let provider = matter.institutionName { LabeledContent(String(localized: "Provider"), value: provider) }
                                if let location = matter.locationHint { VStack(alignment: .leading) { Text(String(localized: "Where to find it")).font(.caption); Text(location) } }
                                if let outcome = matter.desiredOutcome { Text(MatterOutcome(rawValue: outcome)?.label ?? outcome) }
                                else { Text(String(localized: "Name only — no directions in this copy")) }
                            }
                            .font(.subheadline).padding(.vertical, 8)
                        }
                    }
                    if !preview.package.trustedContacts.isEmpty {
                        DisclosureGroup(L10n.format("Contact names included · %1$lld", preview.package.trustedContacts.count)) {
                            ForEach(Array(preview.package.trustedContacts.enumerated()), id: \.offset) { _, contact in
                                LabeledContent(contact.displayName, value: contact.relationshipLabel ?? "")
                            }
                        }
                    }
                }
                Section {
                    Button(String(localized: "Choose a format")) { exportStep = "format" }
                        .buttonStyle(RilloraPrimaryActionButtonStyle())
                        .accessibilityIdentifier("start-here.choose-format")
                    Button(String(localized: "Change who this is for")) {
                        if hasUnkeptRecoveryKey { pendingAudienceChange = true; showsRecoveryExitWarning = true }
                        else { resetAudience() }
                    }
                }
                .listRowBackground(Color.clear)
                Section {
                    RilloraInfoDisclosure(String(localized: "Preview details")) {
                        if let expiry = formattedExpiry(preview.export.expiresAt) {
                            Text(L10n.format("Expires %1$@. Refresh after changing your map.", expiry))
                                .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        }
                        Button(String(localized: "Refresh preview")) { Task { await refreshPreview() } }
                            .disabled(isBusy)
                        RilloraFactStrip([
                            .init(title: String(localized: "No file created"), systemImage: "doc"),
                            .init(title: String(localized: "No delivery"), systemImage: "envelope"),
                            .init(title: String(localized: "No authority"), systemImage: "building.columns"),
                        ])
                    }
                }
                .listRowBackground(Color.clear)
            } else if exportStep == "format" {
                Section { guideArtwork.frame(height: 205).frame(maxWidth: .infinity) }
                    .listRowBackground(Color.clear)
                Section {
                    Group {
                        if dynamicTypeSize.isAccessibilitySize {
                            VStack(spacing: 12) { formatChoices }
                        } else {
                            HStack(spacing: 12) { formatChoices }
                        }
                    }
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("start-here.format")
                }
                .listRowBackground(Color.clear)
                Section {
                    Button(String(localized: "Continue")) { exportStep = "save" }
                        .buttonStyle(RilloraPrimaryActionButtonStyle())
                        .accessibilityIdentifier("start-here.format-continue")
                }
                .listRowBackground(Color.clear)
            } else {
                if exportFormat == .printable {
                    Section(String(localized: "Printable guide")) {
                        Text(String(localized: "The server-generated guide and recovery-file warnings remain in English. Your saved content is unchanged."))
                            .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        if case .loaded = previewStore.printableState {} else {
                            Toggle(String(localized: "I reviewed the guide and understand this file is plaintext."), isOn: $acknowledgesPlaintext)
                                .accessibilityIdentifier("start-here.ack.plaintext")
                            Toggle(String(localized: "Saved, shared or printed copies cannot be revoked."), isOn: $acknowledgesNoRevocation)
                                .accessibilityIdentifier("start-here.ack.copies")
                        }
                        printableAction(for: preview)
                    }
                    Section {
                        RilloraInfoDisclosure(String(localized: "Included information")) {
                            Text(String(localized: "The guide excludes dedicated account hints, financial values and currencies. It is not an encrypted digital package."))
                                .font(.subheadline).foregroundStyle(RilloraTheme.body)
                        }
                    }
                } else {
                    Section(String(localized: "Encrypted package")) {
                        if case .loaded = previewStore.encryptedState {} else {
                            Toggle(String(localized: "Rillora cannot replace the recovery key. Anyone holding it can decrypt this copy."), isOn: $acknowledgesRecoveryRisk)
                                .accessibilityIdentifier("start-here.ack.recovery")
                            Toggle(String(localized: "Copies saved outside Rillora cannot be remotely revoked."), isOn: $acknowledgesEncryptedCopies)
                                .accessibilityIdentifier("start-here.ack.encrypted-copies")
                        }
                        encryptedAction(for: preview)
                    }
                    Section {
                        RilloraInfoDisclosure(String(localized: "About encryption")) {
                            Text(String(localized: "Keep the recovery file separate from the encrypted package. It is a decryption secret."))
                            Text(String(localized: "Encryption and recovery testing happen on this device. The API receives ciphertext and wrapped keys, not the recovery private key or unwrapped content key."))
                                .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        }
                    }
                }
                #if DEBUG
                if showsRecipientDiagnostics { recipientRehearsalSection(preview) }
                #endif
            }
        }
        .rilloraStructuredList()
        // A new step starts at its instructions; export state belongs to this view,
        // outside the Form, so audience, format and recovery-key state are retained.
        .id(exportStep)
        .toggleStyle(RilloraAcknowledgementToggleStyle())
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: exportStep)
        .onChange(of: exportFormat) { _, _ in
            acknowledgesPlaintext = false
            acknowledgesNoRevocation = false
            acknowledgesRecoveryRisk = false
            acknowledgesEncryptedCopies = false
        }
        .task(id: preview.export.publicId) {
            #if DEBUG
            if showsRecipientDiagnostics {
                await rehearsalStore.loadContacts()
                if selectedRehearsalContactID.isEmpty {
                    selectedRehearsalContactID = rehearsalStore.contacts.first?.publicId ?? ""
                }
            }
            #endif
        }
    }

    private var formatChoices: some View {
        Group {
            formatChoice(.printable, title: String(localized: "Printable"), symbol: "printer")
            formatChoice(.encrypted, title: String(localized: "Encrypted"), symbol: "lock.fill")
        }
    }

    private func formatChoice(_ format: StartHereExportFormat, title: String, symbol: String) -> some View {
        Button { exportFormat = format } label: {
            VStack(spacing: 14) {
                HStack {
                    Spacer()
                    Image(systemName: exportFormat == format ? "largecircle.fill.circle" : "circle")
                        .font(.footnote)
                }
                Image(systemName: symbol).font(.system(size: 32))
                Text(title).font(.body.weight(.medium))
            }
            .foregroundStyle(exportFormat == format ? RilloraTheme.tabSelection : RilloraTheme.body)
            .frame(maxWidth: .infinity, minHeight: 118)
            .padding(14)
            .background(RilloraTheme.surface, in: RoundedRectangle(cornerRadius: 17))
            .overlay(RoundedRectangle(cornerRadius: 17).stroke(exportFormat == format ? RilloraTheme.tabSelection : RilloraTheme.border, lineWidth: 1))
        }
        .buttonStyle(RilloraQuietButtonStyle())
        .disabled(isBusy)
        .accessibilityAddTraits(exportFormat == format ? .isSelected : [])
        .accessibilityIdentifier("start-here.format.\(format == .printable ? "printable" : "encrypted")")
    }

    private var showsRecipientDiagnostics: Bool {
        #if DEBUG
        ProcessInfo.processInfo.environment["RILLORA_RECIPIENT_REHEARSAL_TESTING"] == "1"
        #else
        false
        #endif
    }

    @ViewBuilder
    private func recipientRehearsalSection(_ preview: StartHerePreview) -> some View {
        Section {
            Label(String(localized: "Synthetic recipient rehearsal"), systemImage: "person.badge.key.fill")
                .font(.headline)
                .foregroundStyle(RilloraTheme.ink)
            Text(String(localized: "Exercises acceptance, a memory-only device key, recipient-only package access and local decryption."))
                .foregroundStyle(RilloraTheme.body)
            switch rehearsalStore.state {
            case .idle, .failed:
                if rehearsalStore.contacts.isEmpty {
                    Text(String(localized: "Add a synthetic trusted-contact record before running this rehearsal."))
                        .foregroundStyle(RilloraTheme.muted)
                } else {
                    RilloraAdaptivePicker(String(localized: "Test contact record"), selection: $selectedRehearsalContactID) {
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
                        Label(String(localized: "Run recipient decryption rehearsal"), systemImage: "checkmark.shield")
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
                    Text(String(localized: "Running isolated acceptance and decryption…"))
                }
            case .revoking:
                HStack(spacing: 10) {
                    ProgressView()
                    Text(String(localized: "Revoking synthetic device key…"))
                }
            case .passed(let result):
                Label(String(localized: "Recipient-side decryption passed"), systemImage: "checkmark.shield.fill")
                    .foregroundStyle(RilloraTheme.sage)
                Text(L10n.format("Decrypted %1$lld matter directions. Delivery: no. Release: no.", result.decryptedMatterCount))
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.muted)
                Button(result.keyRevoked ? String(localized: "Synthetic device key revoked") : String(localized: "Revoke synthetic device key")) {
                    Task { await rehearsalStore.revokeKey() }
                }
                .disabled(result.keyRevoked || isBusy)
            }
        } header: {
            Text(String(localized: "Recipient rehearsal"))
        } footer: {
            Text(String(localized: "This verifies no identity, detects no death, sends no invitation and releases no data. Revocation cannot erase plaintext or external copies already obtained."))
        }
    }

    @ViewBuilder
    private func encryptedAction(for preview: StartHerePreview) -> some View {
        switch previewStore.encryptedState {
        case .idle, .failed:
            Button {
                Task { await previewStore.createEncrypted(preview: preview) }
            } label: {
                Label(String(localized: "Create encrypted package"), systemImage: "lock.shield")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .disabled(
                !acknowledgesRecoveryRisk
                || !acknowledgesEncryptedCopies
                || isPrintableLoading
            )
            .accessibilityIdentifier("start-here.encrypted")
        case .loading:
            HStack(spacing: 10) {
                ProgressView()
                Text(String(localized: "Encrypting and recovery-testing on this device…"))
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
            Label(String(localized: "Encrypted copy ready"), systemImage: "checkmark.shield.fill")
                .foregroundStyle(RilloraTheme.sage)
            if record.recipientKeyCount == 0 {
                Text(String(localized: "Only your recovery key can open this copy."))
                    .font(.footnote)
                    .foregroundStyle(RilloraTheme.clay)
            }
            ShareLink(
                item: recoveryDocument,
                preview: SharePreview(
                    String(localized: "Rillora offline recovery key"),
                    icon: Image(systemName: "key")
                )
            ) {
                Label(String(localized: "Save recovery key"), systemImage: "key")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("start-here.share-recovery")

            ShareLink(
                item: artifactDocument,
                preview: SharePreview(
                    String(localized: "Rillora encrypted Start Here package"),
                    icon: Image(systemName: "doc.badge.lock")
                )
            ) {
                Label(String(localized: "Save package"), systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(.bordered)
            .accessibilityIdentifier("start-here.share-encrypted")
            Toggle(String(localized: "I kept the recovery key separately."), isOn: $acknowledgesRecoveryKept)
                .accessibilityIdentifier("start-here.ack.key-kept")
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
                Label(String(localized: "Prepare printable guide"), systemImage: "doc.text")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .disabled(!acknowledgesPlaintext || !acknowledgesNoRevocation || isBusy)
            .accessibilityIdentifier("start-here.printable")
        case .loading:
            HStack(spacing: 10) {
                ProgressView()
                Text(String(localized: "Preparing the guide…"))
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
                    String(localized: "Rillora Start Here guide"),
                    icon: Image(systemName: "doc.text")
                )
            ) {
                Group {
                    if dynamicTypeSize.isAccessibilitySize {
                        Text(String(localized: "Share or print guide"))
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Label(String(localized: "Share or print guide"), systemImage: "square.and.arrow.up")
                    }
                }
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(RilloraPrimaryActionButtonStyle())
            .accessibilityIdentifier("start-here.share")

            Text(String(localized: "Guide prepared. No server copy is retained."))
                .font(.footnote)
                .foregroundStyle(RilloraTheme.muted)
        }
    }

    private var isPrintableLoading: Bool {
        if case .loading = previewStore.printableState { return true }
        return false
    }

    private var isBusy: Bool {
        if case .loading = previewStore.state { return true }
        if case .loading = previewStore.printableState { return true }
        if case .loading = previewStore.encryptedState { return true }
        if case .loading = rehearsalStore.state { return true }
        if case .revoking = rehearsalStore.state { return true }
        return false
    }

    private var hasUnkeptRecoveryKey: Bool {
        if case .loaded = previewStore.encryptedState { return !acknowledgesRecoveryKept }
        return false
    }

    private func refreshPreview(discardRecovery: Bool = false) async {
        if hasUnkeptRecoveryKey && !discardRecovery {
            pendingPreviewReplacement = true
            pendingAudienceChange = false
            showsRecoveryExitWarning = true
            return
        }
        exportStep = "review"
        if await previewStore.createPreview(recipientConnectionPublicID: audienceChoice == "recipient" ? recipientConnectionID : nil) != nil {
            acknowledgesPlaintext = false
            acknowledgesNoRevocation = false
            acknowledgesRecoveryRisk = false
            acknowledgesEncryptedCopies = false
            acknowledgesRecoveryKept = false
            selectedRehearsalContactID = ""
            rehearsalStore.reset()
        }
    }

    private func resetAudience() {
        previewStore.resetPreview()
        audienceChoice = ""; recipientConnectionID = ""; exportStep = "review"
        acknowledgesRecoveryKept = false; pendingAudienceChange = false
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
                .init(title: String(localized: "Directions only"), systemImage: "map"),
                .init(title: String(localized: "No authority"), systemImage: "building.columns"),
                .init(title: String(localized: "No delivery"), systemImage: "person.crop.circle.badge.xmark"),
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
