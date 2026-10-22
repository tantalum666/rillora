import SwiftUI

struct FutureNoticeView: View {
    let contact: TrustedContact
    @State private var store: FutureNoticeStore
    @Environment(\.scenePhase) private var phase
    init(contact: TrustedContact, service: any FutureNoticeServing) {
        self.contact = contact
        _store = State(initialValue: FutureNoticeStore(personID: contact.publicId, service: service))
    }
    var body: some View {
        @Bindable var store = store
        RilloraForm {
            Section {
                Label(contact.displayName, systemImage: "person")
                Text(String(localized: "Let this person know an arrangement exists. They will see your Rillora name, but no matter names or contents."))
                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
            }.listRowBackground(Color.clear)
            if let error = store.error {
                Section { Text(error).foregroundStyle(RilloraTheme.clay); Button(String(localized: "Retry")) { Task { await store.refresh() } }.disabled(store.isWorking) }
            }
            if store.isWorking { ProgressView(String(localized: "Loading arrangement…")) }
            if let notice = store.notice {
                Section {
                    Label(notice.status.label, systemImage: "lock")
                    Label(notice.emailHint, systemImage: "envelope").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if notice.status == .pending || notice.status == .expired {
                        Text(L10n.format("Expires %1$@", notice.expirationDate?.formatted(date: .abbreviated, time: .omitted)
                            ?? String(localized: "Unavailable"))).font(.footnote).foregroundStyle(RilloraTheme.muted)
                    }
                }
            }
            if store.hasLoaded, store.notice?.isActive != true {
                Section {
                    RilloraTextField(title: String(localized: "Their sign-in email"), prompt: "person@example.com", text: $store.email,
                                    identifier: "future.email", required: true)
                        .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button(String(localized: "Create notice invitation")) { Task { await store.change(.create) } }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!store.canCreate).accessibilityIdentifier("future.create")
                }
            }
            if let url = store.invitationURL {
                Section {
                    Text(String(localized: "Invitation ready. Send it to the person you selected.")).font(.subheadline)
                    InvitationQRCodeView(url: url).frame(maxWidth: .infinity)
                    ShareLink(item: url, subject: Text(String(localized: "After-death arrangement")),
                              message: Text(String(localized: "I have recorded an after-death arrangement for you in Rillora. This invitation does not give access to its contents."))) {
                        Label(String(localized: "Share invitation"), systemImage: "square.and.arrow.up")
                    }.frame(minHeight: 44).accessibilityIdentifier("future.share")
                }
            }
            if let notice = store.notice, notice.isActive {
                Section {
                    if notice.status != .acknowledged {
                        Button(String(localized: "Create a new link")) { Task { await store.change(.regenerate) } }
                            .frame(minHeight: 44).accessibilityIdentifier("future.regenerate")
                    }
                    Button(String(localized: "Revoke notice"), role: .destructive) { Task { await store.change(.revoke) } }
                        .frame(minHeight: 44).accessibilityIdentifier("future.revoke")
                }.disabled(store.isWorking)
            }
            Section {
                Text(String(localized: "This notice grants no access. Anything you previously chose to share remains separate."))
                Text(String(localized: "After-death verification and content delivery are not enabled by this notice."))
            }.font(.footnote).foregroundStyle(RilloraTheme.muted).listRowBackground(Color.clear)
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .navigationTitle(String(localized: "After-death arrangement")).navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .primaryAction) {
            Button { Task { await store.refresh() } } label: { Image(systemName: "arrow.clockwise") }
                .accessibilityLabel(String(localized: "Refresh arrangement")).disabled(store.isWorking || store.hasDraft)
        } }
        .task { await store.refresh() }
        .task {
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(15)) } catch { return }
                if phase == .active && !store.hasDraft { await store.refresh() }
            }
        }
        .onChange(of: phase) { _, next in if next == .active { Task { await store.refresh() } } else { store.suspend() } }
        .onDisappear { store.suspend() }
        .accessibilityIdentifier("future.owner")
    }
}

struct FutureNoticesInboxSection: View {
    let store: FutureNoticesInboxStore
    var body: some View {
        Section(String(localized: "Your arrangement notices")) {
            if let error = store.error {
                Text(error).foregroundStyle(RilloraTheme.clay)
                Button(String(localized: "Retry")) { Task { await store.refresh() } }.disabled(store.isWorking)
            } else if let notices = store.notices {
                if notices.isEmpty { Text(String(localized: "No acknowledged arrangements")).foregroundStyle(RilloraTheme.muted) }
                ForEach(notices) { notice in
                    VStack(alignment: .leading, spacing: 12) {
                        Label(L10n.format("Arrangement from %1$@", notice.ownerName), systemImage: "lock")
                        Text(String(localized: "Acknowledging this notice does not give access to any matters. Contents remain private."))
                            .font(.footnote).foregroundStyle(RilloraTheme.muted)
                        Button(String(localized: "Leave this arrangement")) { Task { await store.leave(notice) } }
                            .disabled(store.isWorking).frame(minHeight: 44).accessibilityIdentifier("future.leave.\(notice.id)")
                    }
                }
            } else { ProgressView(String(localized: "Loading arrangement…")) }
        }
    }
}

struct FutureNoticeInvitationView: View {
    let token: String
    let authenticationStore: AuthenticationStore
    let overviewStore: OverviewStore
    @State private var store: FutureInvitationStore
    @Environment(\.scenePhase) private var phase
    @Environment(\.dismiss) private var dismiss
    private var plannerID: String? { if case .loaded(let snapshot) = overviewStore.state { snapshot.session.plannerPublicId } else { nil } }
    init(token: String, service: any FutureNoticeServing, authenticationStore: AuthenticationStore, overviewStore: OverviewStore) {
        self.token = token; self.authenticationStore = authenticationStore; self.overviewStore = overviewStore
        _store = State(initialValue: FutureInvitationStore(service: service))
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Image(systemName: "lock.doc").font(.largeTitle).foregroundStyle(RilloraTheme.tabSelection).accessibilityHidden(true)
                Text(String(localized: "An after-death arrangement")).font(.title2.weight(.semibold))
                if store.isWorking { ProgressView(String(localized: "Loading arrangement…")) }
                if store.done {
                    Text(String(localized: "Your response has been saved. No content access was granted.")).accessibilityIdentifier("future.done")
                    Button(String(localized: "Close")) { dismiss() }.buttonStyle(RilloraPrimaryActionButtonStyle())
                } else {
                    if let notice = store.notice {
                        Text(L10n.format("%1$@ has named you for an after-death arrangement.", notice.ownerName))
                        Text(String(localized: "Acknowledging this notice does not give access to any matters. Contents remain private."))
                            .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        Button(String(localized: "I acknowledge this arrangement")) { Task { await store.respond(token: token, action: "acknowledge") } }
                            .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(store.isWorking).accessibilityIdentifier("future.acknowledge")
                        Button(String(localized: "Decline")) { Task { await store.respond(token: token, action: "decline") } }
                            .frame(minHeight: 44).disabled(store.isWorking).accessibilityIdentifier("future.decline")
                    } else if store.preview != nil {
                        Text(String(localized: "Sign in with the invited email to see who sent this. No contents will be opened."))
                            .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        Button(String(localized: "Sign in to continue")) { Task { _ = await authenticationStore.signIn() } }
                            .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(authenticationStore.isWorking)
                        Button(String(localized: "Create account")) { Task { _ = await authenticationStore.createAccount() } }
                            .frame(minHeight: 44).disabled(authenticationStore.isWorking)
                    }
                    if let error = store.error {
                        Text(error).foregroundStyle(RilloraTheme.clay).accessibilityIdentifier("future.error")
                        Button(String(localized: "Retry")) { Task { await refresh() } }.disabled(store.isWorking)
                    }
                    if plannerID != nil {
                        Button(String(localized: "Use another account")) {
                            store.suspend()
                            Task { await authenticationStore.useAnotherAccount() }
                        }.frame(minHeight: 44).disabled(store.isWorking || authenticationStore.isWorking)
                    }
                }
            }.padding(24)
        }.background(RilloraTheme.canvas).rilloraFocusedTask()
            .navigationTitle(String(localized: "After-death arrangement")).navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(String(localized: "Close")) { dismiss() }.disabled(store.isWorking || authenticationStore.isWorking) } }
            .task(id: plannerID) { await refresh() }
            .onChange(of: phase) { _, next in if next == .active { Task { await refresh() } } else { store.suspend() } }
            .onDisappear { store.suspend() }
            .interactiveDismissDisabled(store.isWorking || authenticationStore.isWorking)
            .accessibilityIdentifier("future.invitation")
    }
    @MainActor private func refresh() async { await store.refresh(token: token, signedIn: plannerID != nil) }
}
