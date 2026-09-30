import SwiftUI
import CoreImage.CIFilterBuiltins
import UIKit

struct ContactSharingView: View {
    @State private var store: ContactSharingStore
    let matters: [Matter]
    let focusMatterID: String?
    let contactService: any TrustedContactEditing
    let overviewStore: OverviewStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.scenePhase) private var scenePhase
    @RilloraReduceMotion private var reduceMotion
    @State private var showLink = false
    @State private var showPreview = false
    @State private var copied = false
    @State private var confirmDiscard = false
    @State private var confirmRevoke = false
    @State private var confirmNewLink = false
    @State private var confirmReload = false
    @State private var savedFeedback = false
    @State private var revokedFeedback = false

    init(contact: TrustedContact, matters: [Matter], service: any SharingServing,
         contactService: any TrustedContactEditing, overviewStore: OverviewStore, focusMatterID: String? = nil) {
        _store = State(initialValue: ContactSharingStore(contact: contact, service: service))
        self.focusMatterID = focusMatterID
        self.matters = matters.sorted { $0.publicId == focusMatterID && $1.publicId != focusMatterID }; self.contactService = contactService; self.overviewStore = overviewStore
    }
    var body: some View {
        @Bindable var store = store
        RilloraForm {
            if !store.isConnected {
                Section { InvitationStepRail(current: showLink ? 2 : 1) }.listRowBackground(Color.clear)
            }
            if showPreview, let preview = store.preview {
                Section {
                    Button { showPreview = false } label: { Label("Change selection", systemImage: "arrow.left") }.frame(minHeight: 44)
                    Text("What \(store.contact.displayName) can see").font(.title2.weight(.semibold))
                    Text("Current saved details · Read only").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                }.listRowBackground(Color.clear)
                ForEach(preview.items) { item in
                    Section(item.fields["title"] ?? "Shared matter") {
                        if let category = item.fields["category"] { Text(MatterCategory(rawValue: category)?.label ?? category).font(.subheadline) }
                        SharedFieldsView(fields: item.fields, level: item.detailLevel)
                    }
                }
                if preview.items.isEmpty { Section { Text("No matters selected. You can share some later.") } }
                Section {
                    Button { Task { if await store.save() { showPreview = false; savedFeedback = true; revokedFeedback = false; if store.invitationURL != nil { showLink = true; copied = false } } } } label: {
                        Text(store.isWorking ? "Saving…" : !store.isActive || !store.email.isEmpty ? "Create link & QR" : "Save sharing").frame(maxWidth: .infinity)
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!store.canSave).accessibilityIdentifier("sharing.confirm")
                }.listRowBackground(Color.clear)
            } else if showLink, let url = store.invitationURL {
                Section {
                  VStack(alignment: .leading, spacing: 14) {
                    Button { showLink = false } label: { Label("Sharing settings", systemImage: "arrow.left") }
                        .frame(minHeight: 44)
                    Text("Ready to share").font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                    Label(store.connection?.emailHint ?? "", systemImage: "envelope")
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    InvitationQRCodeView(url: url).frame(maxWidth: .infinity)
                    if dynamicTypeSize.isAccessibilitySize { VStack(spacing: 12) { linkActions(url) } }
                    else { HStack(spacing: 12) { linkActions(url) } }
                    Text("Waiting for them to accept").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if let expires = store.connection?.expiresAt {
                        Text("Expires \(shortDate(expires))").font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                  }.padding(.vertical, 4)
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
            } else {
                Section {
                    Group { if dynamicTypeSize.isAccessibilitySize { VStack(alignment: .leading, spacing: 12) { personHeading } } else { HStack(spacing: 14) { personHeading } } }.padding(.vertical, 6)
                    if store.hasLoaded && !store.isActive { Text("Contact recorded. Create a link to invite them.").font(.subheadline).foregroundStyle(RilloraTheme.muted) }
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
                    Button { Task { if await store.previewSelection() { showPreview = true } } } label: {
                        HStack { if store.isWorking { ProgressView() }; Text(store.isWorking ? "Loading preview…" : "Preview shared details").frame(maxWidth: .infinity); Image(systemName: "arrow.right") }
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!store.canSave)
                        .accessibilityIdentifier("sharing.save")
                    if savedFeedback && !store.hasChanges { Label("Sharing saved", systemImage: "checkmark.circle.fill").foregroundStyle(RilloraTheme.tabSelection) }
                    if revokedFeedback { Label("Sharing stopped", systemImage: "lock.fill").foregroundStyle(RilloraTheme.tabSelection).accessibilityIdentifier("sharing.revoked") }
                    if store.isActive && !store.isConnected {
                        Button {
                            if store.invitationURL != nil { showLink = true } else { confirmNewLink = true }
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
                        Button("Stop sharing", role: .destructive) { confirmRevoke = true }.accessibilityIdentifier("sharing.revoke")
                    }
                    RilloraInfoDisclosure("Visible details") {
                        Text("Name: title and category.")
                        Text("Directions: provider, safe location and wishes.")
                        Text("Details: all saved fields, including category details and Notes.")
                        Text("Read only. Unselected matters remain private.")
                    }
                }.listRowBackground(Color.clear)
            }
            if let error = store.errorMessage {
                Section {
                    Text(error).foregroundStyle(RilloraTheme.clay)
                    Button("Reload current settings") { if store.hasChanges { confirmReload = true } else { Task { await store.load() } } }
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
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(store.isActive ? "Done" : "Close") { if store.hasChanges { confirmDiscard = true } else { dismiss() } }.disabled(store.isWorking) } }
        .task { await store.load() }
        .onChange(of: scenePhase) { _, next in
            if next == .active && !showPreview && !store.hasChanges && !store.isWorking {
                Task { await store.load(); if store.invitationURL == nil { showLink = false } }
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: showLink)
        .alert("Discard sharing changes?", isPresented: $confirmDiscard) { Button("Discard changes", role: .destructive) { dismiss() }; Button("Keep editing", role: .cancel) {} }
        .alert("Replace invitation link?", isPresented: $confirmNewLink) { Button("Create new link") { Task { if await store.regenerate() { showLink = true; copied = false } } }; Button("Keep current link", role: .cancel) {} } message: { Text("The previous link will stop working.") }
        .alert("Stop sharing with this person?", isPresented: $confirmRevoke) { Button("Stop sharing", role: .destructive) { Task { if await store.revoke() { revokedFeedback = true; savedFeedback = false } } }; Button("Keep sharing", role: .cancel) {} } message: { Text("Future access stops. Copies already kept cannot be erased.") }
        .alert("Replace this draft?", isPresented: $confirmReload) { Button("Load latest", role: .destructive) { Task { await store.load() } }; Button("Keep editing", role: .cancel) {} }
        .accessibilityIdentifier("sharing.editor")
        .rilloraEntrance()
    }
    @ViewBuilder private var personHeading: some View {
        RilloraConnectionVisual(state: ConnectionVisualState(store.connection?.status), compact: true)
        VStack(alignment: .leading, spacing: 5) {
            Text(store.contact.displayName).font(.headline)
            Text(store.connection?.status.label ?? (store.hasLoaded ? "Not invited" : "Checking connection…"))
                .font(.subheadline).foregroundStyle(RilloraTheme.muted).fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("sharing.status")
        }.frame(maxWidth: .infinity, alignment: .leading)
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
    }
    private func shortDate(_ text: String) -> String {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = fractional.date(from: text) ?? ISO8601DateFormatter().date(from: text)
        return date?.formatted(date: .abbreviated, time: .omitted) ?? "Unavailable"
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
