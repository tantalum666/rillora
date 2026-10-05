import SwiftUI
import CoreImage.CIFilterBuiltins
import UIKit

struct ContactSharingView: View {
    @State private var store: ContactSharingStore
    let matters: [Matter]
    let sharingService: any SharingServing
    let contactService: any TrustedContactEditing
    let overviewStore: OverviewStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @RilloraReduceMotion private var reduceMotion
    @State private var showLink = false
    @State private var copied = false
    @State private var confirmation: SharingConfirmation?
    @State private var savedFeedback = false
    @State private var revokedFeedback = false

    init(contact: TrustedContact, matters: [Matter], service: any SharingServing,
         contactService: any TrustedContactEditing, overviewStore: OverviewStore, focusMatterID: String? = nil) {
        _store = State(initialValue: ContactSharingStore(contact: contact, service: service))
        self.sharingService = service
        self.matters = matters.sorted { $0.publicId == focusMatterID && $1.publicId != focusMatterID }; self.contactService = contactService; self.overviewStore = overviewStore
    }
    var body: some View {
        @Bindable var store = store
        RilloraForm {
            if !store.isConnected {
                Section { InvitationStepRail(current: showLink ? 2 : 1) }.listRowBackground(Color.clear)
            }
            if showLink, let url = store.invitationURL {
                Section {
                  VStack(alignment: .leading, spacing: 14) {
                    Button { showLink = false } label: { Label(String(localized: "Sharing settings"), systemImage: "arrow.left") }
                        .frame(minHeight: 44)
                    Text(String(localized: "Ready to share")).font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                    Label(store.connection?.emailHint ?? "", systemImage: "envelope")
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    InvitationQRCodeView(url: url).frame(maxWidth: .infinity)
                    SharingAdaptiveRow(spacing: 12) { linkActions(url) }
                    Text(String(localized: "Waiting for them to accept")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let expires = store.connection?.expiresAt {
                        Text(L10n.format("Expires %1$@", shortDate(expires))).font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                  }.padding(.vertical, 4)
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
            } else {
                Section {
                    SharingAdaptiveRow(spacing: 14) { personHeading }.padding(.vertical, 6)
                    if let allowance = store.allowance, allowance.enforcementEnabled {
                        Text(L10n.format("Sharing places used: %1$lld of %2$lld", allowance.used, allowance.limit)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    }
                    if !store.hasLoaded && store.isWorking { ProgressView(String(localized: "Loading sharing…")) }
                }.listRowBackground(Color.clear)
                if !store.isActive {
                    Section {
                        RilloraTextField(title: String(localized: "Recipient's sign-in email"), prompt: "person@example.com", text: $store.email,
                                        identifier: "sharing.recipient-email", required: true)
                            .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    }
                } else if let connection = store.connection {
                    Section { Label(connection.emailHint, systemImage: "envelope").foregroundStyle(RilloraTheme.muted) }
                        .listRowBackground(Color.clear)
                }
                Section(String(localized: "Choose what to share")) {
                    ForEach(matters) { matter in
                        VStack(alignment: .leading, spacing: 9) {
                            if matter.desiredOutcome == MatterOutcome.neverDisclose.rawValue {
                                Label(L10n.format("%1$@ · Private", matter.title), systemImage: "lock")
                                    .foregroundStyle(RilloraTheme.muted).frame(minHeight: 44)
                            } else {
                                Toggle(isOn: Binding(get: { store.selected(matter.publicId) }, set: { store.setSelected(matter.publicId, $0) })) {
                                    Label(matter.title, systemImage: "doc.text")
                                }.toggleStyle(RilloraAcknowledgementToggleStyle())
                                    .accessibilityIdentifier("sharing.matter.\(matter.publicId)")
                                if store.selected(matter.publicId) {
                                    SharingLevelChoices(selection: Binding(get: { store.level(matter.publicId) }, set: { store.setLevel(matter.publicId, $0) }), matterID: matter.publicId)
                                    Text(store.level(matter.publicId).summary).font(.footnote).foregroundStyle(RilloraTheme.muted)
                                }
                            }
                        }.padding(.vertical, 4)
                            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: store.selected(matter.publicId))
                    }
                    if matters.isEmpty { Text(String(localized: "Invite now. Choose matters later.")).foregroundStyle(RilloraTheme.muted) }
                }
                Section {
                    Button { if store.replacement != nil { confirmation = .replacement } else { save() } } label: {
                        HStack { if store.isWorking { ProgressView() }; Text(saveLabel).frame(maxWidth: .infinity); Image(systemName: "arrow.right") }
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!store.canSave)
                        .accessibilityIdentifier("sharing.save")
                    if savedFeedback && !store.hasChanges { Label(String(localized: "Sharing saved"), systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection) }
                    if revokedFeedback { Label(String(localized: "Sharing stopped"), systemImage: "lock.fill").foregroundStyle(RilloraTheme.tabSelection).accessibilityIdentifier("sharing.revoked") }
                    if store.isActive && !store.isConnected {
                        Button {
                            if store.invitationURL != nil { showLink = true } else { confirmation = .newLink }
                        } label: { Label(store.invitationURL == nil ? String(localized: "Create new link") : String(localized: "Show invitation"), systemImage: "link") }
                            .disabled(store.isWorking || store.hasChanges).frame(minHeight: 44)
                            .accessibilityIdentifier("sharing.new-link")
                    }
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
                if store.isActive && !store.isConnected {
                    Section {
                        DisclosureGroup(String(localized: "Change invited email")) {
                            RilloraTextField(title: String(localized: "New sign-in email"), prompt: "person@example.com", text: $store.email, identifier: "sharing.replace-email")
                                .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                        }
                    }
                }
                Section {
                    NavigationLink(String(localized: "Edit contact record")) {
                        TrustedContactEditorView(contact: store.contact, service: contactService, overviewStore: overviewStore)
                    }.disabled(store.hasChanges).accessibilityIdentifier("contact.record.edit")
                    if store.isActive {
                        Button(String(localized: "Stop sharing"), role: .destructive) { confirmation = .revoke }.accessibilityIdentifier("sharing.revoke")
                    }
                    if store.isActive, store.connection?.status != .expired, store.allowance?.enforcementEnabled == true {
                        if store.connection?.access?.mode == .live {
                            Button(String(localized: "Pause current updates")) { confirmation = .pause }.disabled(store.hasChanges)
                        }
                        if store.connection?.access?.isFreeRecipient == true {
                            Text(String(localized: "Your included place")).foregroundStyle(RilloraTheme.muted)
                        } else {
                            Button(String(localized: "Use included place")) { confirmation = .freeRecipient }.disabled(store.hasChanges)
                        }
                        if store.connection?.access?.mode != .live, store.allowance?.paidUntil != nil {
                            Button(String(localized: "Resume current updates")) { Task { await store.selectLive(useFreeSlot: false) } }.disabled(store.hasChanges)
                        }
                    }
                    RilloraInfoDisclosure(String(localized: "Visible details")) {
                        SharingPreviewContent(grants: store.grants, service: sharingService,
                            connectionPublicID: store.isActive && store.connection?.access != nil ? store.connection?.publicId : nil,
                            connectionState: "\(store.connection?.version ?? 0)-\(store.connection?.access?.mode.rawValue ?? "live")")
                    }
                }.listRowBackground(Color.clear)
            }
            if let error = store.errorMessage {
                Section {
                    Text(error).foregroundStyle(RilloraTheme.clay)
                    Button(String(localized: "Reload current settings")) { if store.hasChanges { confirmation = .reload } else { Task { await store.load() } } }
                }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .listSectionSpacing(12)
        .disabled(store.isWorking)
        .navigationTitle(showLink ? L10n.format("Invite %1$@", store.contact.displayName) : L10n.format("Share with %1$@", store.contact.displayName))
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(store.hasChanges || store.isWorking)
        .navigationBarBackButtonHidden(store.hasChanges || store.isWorking)
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(store.isActive ? String(localized: "Done") : String(localized: "Close")) { if store.hasChanges { confirmation = .discard } else { dismiss() } }.disabled(store.isWorking) } }
        .task { await store.load() }
        .onChange(of: scenePhase) { _, next in
            if next == .active && !store.hasChanges && !store.isWorking && confirmation == nil {
                Task { await store.load(); if store.invitationURL == nil { showLink = false } }
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: showLink)
        .alert(confirmation?.title ?? "", isPresented: Binding(
            get: { confirmation != nil }, set: { if !$0 { confirmation = nil } }
        ), presenting: confirmation) { choice in
            confirmationActions(choice)
        } message: { choice in
            Text(confirmationMessage(choice))
        }
        .accessibilityIdentifier("sharing.editor")
        .rilloraEntrance()
    }
    private enum SharingConfirmation {
        case discard, revoke, newLink, reload, freeRecipient, replacement, pause
        var title: String {
            switch self {
            case .discard: String(localized: "Discard sharing changes?")
            case .revoke: String(localized: "Stop sharing with this person?")
            case .newLink: String(localized: "Replace invitation link?")
            case .reload: String(localized: "Replace this draft?")
            case .freeRecipient: String(localized: "Use your included place for this person?")
            case .replacement: String(localized: "Replace current updates?")
            case .pause: String(localized: "Pause current updates?")
            }
        }
    }
    private func confirmationMessage(_ choice: SharingConfirmation) -> String {
        switch choice {
        case .discard, .reload: String(localized: "Your unsaved changes will be discarded.")
        case .revoke: String(localized: "Future access stops. Copies already kept cannot be erased.")
        case .newLink: String(localized: "The previous link will stop working.")
        case .freeRecipient: String(localized: "This person receives current updates. Your previous choice keeps only an eligible saved copy unless covered by Family.")
        case .replacement: L10n.format("Your included place moves from %1$@ to %2$@. Only an eligible saved copy remains for the previous person.", store.replacement?.personName ?? String(localized: "the current person"), store.contact.displayName)
        case .pause: String(localized: "This frees a sharing place. Only an eligible paid-period saved copy remains available.")
        }
    }
    @ViewBuilder private func confirmationActions(_ choice: SharingConfirmation) -> some View {
        switch choice {
        case .discard:
            Button(String(localized: "Discard changes"), role: .destructive) { dismiss() }
            Button(String(localized: "Keep editing"), role: .cancel) {}
        case .reload:
            Button(String(localized: "Load latest"), role: .destructive) { Task { await store.load() } }
            Button(String(localized: "Keep editing"), role: .cancel) {}
        case .newLink:
            Button(String(localized: "Create new link")) { Task { if await store.regenerate() { showLink = true; copied = false } } }
            Button(String(localized: "Keep current link"), role: .cancel) {}
        case .revoke:
            Button(String(localized: "Stop sharing"), role: .destructive) { Task { if await store.revoke() { revokedFeedback = true; savedFeedback = false } } }
            Button(String(localized: "Keep sharing"), role: .cancel) {}
        case .freeRecipient:
            Button(String(localized: "Use included place")) { Task { await store.selectLive(useFreeSlot: true) } }
            Button(String(localized: "Keep current choice"), role: .cancel) {}
        case .replacement:
            Button(String(localized: "Replace and create invitation")) { save(replacing: true) }
            Button(String(localized: "Keep editing"), role: .cancel) {}
        case .pause:
            Button(String(localized: "Pause updates")) { Task { await store.pauseUpdates() } }
            Button(String(localized: "Keep updating"), role: .cancel) {}
        }
    }
    private var saveLabel: String {
        if store.isWorking { return String(localized: "Saving…") }
        if store.replacement != nil { return String(localized: "Replace included person") }
        return !store.isActive || !store.email.isEmpty ? String(localized: "Create link & QR") : String(localized: "Save sharing")
    }
    private func save(replacing: Bool = false) {
        Task {
            if await store.save(replacingIncluded: replacing) {
                savedFeedback = true; revokedFeedback = false
                if store.invitationURL != nil { showLink = true; copied = false }
            }
        }
    }
    @ViewBuilder private var personHeading: some View {
        RilloraConnectionVisual(state: ConnectionVisualState(store.connection?.status), compact: true)
        VStack(alignment: .leading, spacing: 5) {
            Text(store.contact.displayName).font(.headline)
            Text(store.connection?.statusLabel ?? (store.hasLoaded ? String(localized: "Not invited") : String(localized: "Checking connection…")))
                .font(.footnote).foregroundStyle(RilloraTheme.muted)
                .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("sharing.status")
        }
    }
    @ViewBuilder private func linkActions(_ url: URL) -> some View {
        ShareLink(item: url) { Label(String(localized: "Share"), systemImage: "square.and.arrow.up").frame(maxWidth: .infinity) }
            .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityLabel(String(localized: "Share invitation"))
            .accessibilityIdentifier("sharing.invitation.share")
        Button { UIPasteboard.general.string = url.absoluteString; copied = true } label: {
            Label(copied ? String(localized: "Copied") : String(localized: "Copy link"), systemImage: copied ? "checkmark.circle.fill" : "link")
                .font(.body.weight(.semibold)).foregroundStyle(RilloraTheme.tabSelection)
                .frame(maxWidth: .infinity, minHeight: 52).padding(.horizontal, 14)
                .background(RilloraTheme.actionSurface, in: RoundedRectangle(cornerRadius: 15))
        }.buttonStyle(RilloraQuietButtonStyle()).accessibilityIdentifier("sharing.invitation.copy")
            .rilloraConfirmation(trigger: copied, enabled: copied)
    }
    private func shortDate(_ text: String) -> String {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = fractional.date(from: text) ?? ISO8601DateFormatter().date(from: text)
        return date?.formatted(date: .abbreviated, time: .omitted) ?? String(localized: "Unavailable")
    }
}

private struct SharingAdaptiveRow<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder let content: () -> Content
    @Environment(\.dynamicTypeSize) private var size
    var body: some View {
        if size.isAccessibilitySize { VStack(alignment: .leading, spacing: 12, content: content) }
        else { HStack(spacing: spacing, content: content) }
    }
}

private struct SharingLevelChoices: View {
    @Binding var selection: SharingDetailLevel
    let matterID: String
    @Environment(\.dynamicTypeSize) private var size
    @RilloraReduceMotion private var reduceMotion
    var body: some View {
        Group { if size.isAccessibilitySize { VStack(spacing: 3) { controls } } else { HStack(spacing: 3) { controls } } }
            .padding(3).background(RilloraTheme.canvas, in: RoundedRectangle(cornerRadius: 10))
            .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: selection)
    }
    private var controls: some View {
        ForEach(SharingDetailLevel.allCases) { level in
            Button { selection = level } label: {
                Text(level.title).font(.footnote).frame(maxWidth: .infinity, minHeight: 44)
                    .foregroundStyle(selection == level ? RilloraTheme.canvas : RilloraTheme.body)
                    .background(selection == level ? RilloraTheme.tabSelection : .clear, in: RoundedRectangle(cornerRadius: 8))
            }.buttonStyle(RilloraQuietButtonStyle()).accessibilityAddTraits(selection == level ? .isSelected : [])
                .accessibilityIdentifier("sharing.level.\(matterID).\(level.rawValue)")
        }
    }
}

struct InvitationQRCodeView: View {
    let url: URL
    @State private var image: UIImage?
    var body: some View {
        Group {
            if let image { Image(uiImage: image).interpolation(.none).resizable().scaledToFit() }
            else { ProgressView() }
        }.aspectRatio(1, contentMode: .fit).frame(maxWidth: 240).padding(16).background(.white, in: RoundedRectangle(cornerRadius: 18))
            .accessibilityElement(children: .ignore).accessibilityLabel(String(localized: "Invitation QR code"))
            .task(id: url) {
                let filter = CIFilter.qrCodeGenerator(); filter.message = Data(url.absoluteString.utf8); filter.correctionLevel = "M"
                if let output = filter.outputImage, let bitmap = CIContext().createCGImage(output, from: output.extent) { image = UIImage(cgImage: bitmap) }
            }
    }
}
