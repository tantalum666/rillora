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
                    Button { showLink = false } label: { Label("Sharing settings", systemImage: "arrow.left") }
                        .frame(minHeight: 44)
                    Text("Ready to share").font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                    Label(store.connection?.emailHint ?? "", systemImage: "envelope")
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    InvitationQRCodeView(url: url).frame(maxWidth: .infinity)
                    SharingAdaptiveRow(spacing: 12) { linkActions(url) }
                    Text("Waiting for them to accept").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let expires = store.connection?.expiresAt {
                        Text("Expires \(shortDate(expires))").font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                  }.padding(.vertical, 4)
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
            } else {
                Section {
                    SharingAdaptiveRow(spacing: 14) { personHeading }.padding(.vertical, 6)
                    if let allowance = store.allowance, allowance.enforcementEnabled {
                        Text("\(allowance.used) of \(allowance.limit) sharing \(allowance.limit == 1 ? "place" : "places") used").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    }
                    if !store.hasLoaded && store.isWorking { ProgressView("Loading sharing…") }
                }.listRowBackground(Color.clear)
                if !store.isActive {
                    Section {
                        RilloraTextField(title: "Recipient's sign-in email", prompt: "person@example.com", text: $store.email,
                                        identifier: "sharing.recipient-email", required: true)
                            .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    }
                } else if let connection = store.connection {
                    Section { Label(connection.emailHint, systemImage: "envelope").foregroundStyle(RilloraTheme.muted) }
                        .listRowBackground(Color.clear)
                }
                Section("Choose what to share") {
                    ForEach(matters) { matter in
                        VStack(alignment: .leading, spacing: 9) {
                            if matter.desiredOutcome == MatterOutcome.neverDisclose.rawValue {
                                Label("\(matter.title) · Private", systemImage: "lock")
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
                    if matters.isEmpty { Text("Invite now. Choose matters later.").foregroundStyle(RilloraTheme.muted) }
                }
                Section {
                    Button { if store.replacement != nil { confirmation = .replacement } else { save() } } label: {
                        HStack { if store.isWorking { ProgressView() }; Text(saveLabel).frame(maxWidth: .infinity); Image(systemName: "arrow.right") }
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!store.canSave)
                        .accessibilityIdentifier("sharing.save")
                    if savedFeedback && !store.hasChanges { Label("Sharing saved", systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection) }
                    if revokedFeedback { Label("Sharing stopped", systemImage: "lock.fill").foregroundStyle(RilloraTheme.tabSelection).accessibilityIdentifier("sharing.revoked") }
                    if store.isActive && !store.isConnected {
                        Button {
                            if store.invitationURL != nil { showLink = true } else { confirmation = .newLink }
                        } label: { Label(store.invitationURL == nil ? "Create new link" : "Show invitation", systemImage: "link") }
                            .disabled(store.isWorking || store.hasChanges).frame(minHeight: 44)
                            .accessibilityIdentifier("sharing.new-link")
                    }
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
                if store.isActive && !store.isConnected {
                    Section {
                        DisclosureGroup("Change invited email") {
                            RilloraTextField(title: "New sign-in email", prompt: "person@example.com", text: $store.email, identifier: "sharing.replace-email")
                                .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                        }
                    }
                }
                Section {
                    NavigationLink("Edit contact record") {
                        TrustedContactEditorView(contact: store.contact, service: contactService, overviewStore: overviewStore)
                    }.disabled(store.hasChanges)
                    if store.isActive {
                        Button("Stop sharing", role: .destructive) { confirmation = .revoke }.accessibilityIdentifier("sharing.revoke")
                    }
                    if store.isActive, store.connection?.status != .expired, store.allowance?.enforcementEnabled == true {
                        if store.connection?.access?.mode == .live {
                            Button("Pause current updates") { confirmation = .pause }.disabled(store.hasChanges)
                        }
                        if store.connection?.access?.isFreeRecipient == true {
                            Text("Your included place").foregroundStyle(RilloraTheme.muted)
                        } else {
                            Button("Use included place") { confirmation = .freeRecipient }.disabled(store.hasChanges)
                        }
                        if store.connection?.access?.mode != .live, store.allowance?.paidUntil != nil {
                            Button("Resume current updates") { Task { await store.selectLive(useFreeSlot: false) } }.disabled(store.hasChanges)
                        }
                    }
                    RilloraInfoDisclosure("Visible details") {
                        SharingPreviewContent(grants: store.grants, service: sharingService,
                            connectionPublicID: store.isActive && store.connection?.access != nil ? store.connection?.publicId : nil,
                            connectionState: "\(store.connection?.version ?? 0)-\(store.connection?.access?.mode.rawValue ?? "live")")
                    }
                }.listRowBackground(Color.clear)
            }
            if let error = store.errorMessage {
                Section {
                    Text(error).foregroundStyle(RilloraTheme.clay)
                    Button("Reload current settings") { if store.hasChanges { confirmation = .reload } else { Task { await store.load() } } }
                }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .listSectionSpacing(12)
        .disabled(store.isWorking)
        .navigationTitle(showLink ? "Invite \(store.contact.displayName)" : "Share with \(store.contact.displayName)")
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(store.hasChanges || store.isWorking)
        .navigationBarBackButtonHidden(store.hasChanges || store.isWorking)
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(store.isActive ? "Done" : "Close") { if store.hasChanges { confirmation = .discard } else { dismiss() } }.disabled(store.isWorking) } }
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
            case .discard: "Discard sharing changes?"
            case .revoke: "Stop sharing with this person?"
            case .newLink: "Replace invitation link?"
            case .reload: "Replace this draft?"
            case .freeRecipient: "Use your included place for this person?"
            case .replacement: "Replace current updates?"
            case .pause: "Pause current updates?"
            }
        }
    }
    private func confirmationMessage(_ choice: SharingConfirmation) -> String {
        switch choice {
        case .discard, .reload: "Your unsaved changes will be discarded."
        case .revoke: "Future access stops. Copies already kept cannot be erased."
        case .newLink: "The previous link will stop working."
        case .freeRecipient: "This person receives current updates. Your previous choice keeps only an eligible saved copy unless covered by Family."
        case .replacement: "Your included place moves from \(store.replacement?.personName ?? "the current person") to \(store.contact.displayName). Only an eligible saved copy remains for the previous person."
        case .pause: "This frees a sharing place. Only an eligible paid-period saved copy remains available."
        }
    }
    @ViewBuilder private func confirmationActions(_ choice: SharingConfirmation) -> some View {
        switch choice {
        case .discard:
            Button("Discard changes", role: .destructive) { dismiss() }
            Button("Keep editing", role: .cancel) {}
        case .reload:
            Button("Load latest", role: .destructive) { Task { await store.load() } }
            Button("Keep editing", role: .cancel) {}
        case .newLink:
            Button("Create new link") { Task { if await store.regenerate() { showLink = true; copied = false } } }
            Button("Keep current link", role: .cancel) {}
        case .revoke:
            Button("Stop sharing", role: .destructive) { Task { if await store.revoke() { revokedFeedback = true; savedFeedback = false } } }
            Button("Keep sharing", role: .cancel) {}
        case .freeRecipient:
            Button("Use included place") { Task { await store.selectLive(useFreeSlot: true) } }
            Button("Keep current choice", role: .cancel) {}
        case .replacement:
            Button("Replace and create invitation") { save(replacing: true) }
            Button("Keep editing", role: .cancel) {}
        case .pause:
            Button("Pause updates") { Task { await store.pauseUpdates() } }
            Button("Keep updating", role: .cancel) {}
        }
    }
    private var saveLabel: String {
        if store.isWorking { return "Saving…" }
        if store.replacement != nil { return "Replace included person" }
        return !store.isActive || !store.email.isEmpty ? "Create link & QR" : "Save sharing"
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
            Text(store.connection?.statusLabel ?? (store.hasLoaded ? "Not invited" : "Checking connection…"))
                .font(.footnote).foregroundStyle(RilloraTheme.muted)
                .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("sharing.status")
        }
    }
    @ViewBuilder private func linkActions(_ url: URL) -> some View {
        ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity) }
            .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityLabel("Share invitation")
            .accessibilityIdentifier("sharing.invitation.share")
        Button { UIPasteboard.general.string = url.absoluteString; copied = true } label: {
            Label(copied ? "Copied" : "Copy link", systemImage: copied ? "checkmark.circle.fill" : "link")
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
        return date?.formatted(date: .abbreviated, time: .omitted) ?? "Unavailable"
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
            .accessibilityElement(children: .ignore).accessibilityLabel("Invitation QR code")
            .task(id: url) {
                let filter = CIFilter.qrCodeGenerator(); filter.message = Data(url.absoluteString.utf8); filter.correctionLevel = "M"
                if let output = filter.outputImage, let bitmap = CIContext().createCGImage(output, from: output.extent) { image = UIImage(cgImage: bitmap) }
            }
    }
}
