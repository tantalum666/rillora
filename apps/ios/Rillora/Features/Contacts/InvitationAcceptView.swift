import SwiftUI

struct InvitationAcceptView: View {
    let initialToken: String?
    let service: any SharingServing
    let authenticationStore: AuthenticationStore
    let overviewStore: OverviewStore
    @State private var token: String?
    @State private var link = ""
    @State private var invitation: SharingInvitation?
    @State private var error: String?
    @State private var working = false
    @State private var showShared = false
    @State private var accepted = false
    @State private var verificationRequired = false
    @State private var authenticationRequired = false
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    private var plannerID: String? { if case .loaded(let snapshot) = overviewStore.state { snapshot.session.plannerPublicId } else { nil } }

    private var signedIn: Bool { if case .loaded = overviewStore.state { true } else { false } }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if case .loaded(let snapshot) = overviewStore.state, snapshot.session.usesDevelopmentIdentity {
                    Label(String(localized: "Local QA · test data"), systemImage: "hammer").font(.footnote).foregroundStyle(RilloraTheme.muted)
                }
                RilloraConnectionVisual(state: accepted ? .connected : invitation?.status == .accepted ? .unavailable : invitation.map { ConnectionVisualState($0.status) } ?? .pending)
                    .frame(maxWidth: .infinity).padding(.vertical, 6)
                if let invitation {
                    Text(accepted ? L10n.format("Connected with %1$@", invitation.ownerName) : L10n.format("%1$@ invited you", invitation.ownerName)).font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                    Label(L10n.format("For %1$@", invitation.emailHint), systemImage: "envelope").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if accepted {
                        Button(String(localized: "Open shared items")) { showShared = true }.buttonStyle(RilloraPrimaryActionButtonStyle())
                            .accessibilityIdentifier("invitation.open-shared")
                    } else if invitation.status == .accepted {
                        Text(String(localized: "This invitation has been accepted. Use the invited account to open shared items.")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        Button(signedIn ? String(localized: "Open shared items") : String(localized: "Sign in to view shared items")) {
                            if signedIn { showShared = true } else { Task { _ = await authenticationStore.signIn() } }
                        }.buttonStyle(RilloraPrimaryActionButtonStyle())
                    } else if invitation.status == .expired || invitation.status == .revoked {
                        Text(invitation.status == .expired ? String(localized: "This invitation expired. Ask for a new link.") : String(localized: "This invitation was revoked. Ask for a new link."))
                    } else {
                        Text(String(localized: "Only the items they choose. Read only.")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        Button {
                            Task {
                                if authenticationRequired {
                                    if await authenticationStore.signIn() { authenticationRequired = false; if let token { await resolve(token) } }
                                }
                                else if signedIn { await accept() }
                                else { _ = await authenticationStore.createAccount() }
                            }
                        } label: {
                            HStack { if working || authenticationStore.isWorking { ProgressView() }; Text(authenticationRequired ? String(localized: "Sign in to continue") : signedIn ? (verificationRequired ? String(localized: "I've verified my email") : String(localized: "Accept invitation")) : String(localized: "Create account to accept")).frame(maxWidth: .infinity); Image(systemName: "arrow.right") }
                        }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(working || authenticationStore.isWorking)
                            .accessibilityIdentifier("invitation.accept")
                        if signedIn {
                            Button(String(localized: "Use another account")) { Task { await authenticationStore.useAnotherAccount() } }
                                .frame(maxWidth: .infinity, minHeight: 44).disabled(working || authenticationStore.isWorking)
                        } else {
                            Button(String(localized: "Already have an account? Sign in")) { Task { _ = await authenticationStore.signIn() } }
                                .frame(maxWidth: .infinity, minHeight: 44).disabled(working || authenticationStore.isWorking)
                        }
                    }
                } else {
                    Text(working ? String(localized: "Opening invitation…") : String(localized: "Accept a received invitation")).font(.title2.weight(.semibold))
                    Text(String(localized: "Paste a link someone sent you.")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    RilloraTextField(title: String(localized: "Invitation link"), prompt: String(localized: "Paste the link you received"), text: $link,
                                    identifier: "invitation.link", required: true, axis: .vertical)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button(String(localized: "Continue with this link")) {
                        guard let value = ReceivedInvitation.token(from: link) else { error = String(localized: "Paste the complete invitation link."); return }
                        Task { await resolve(value) }
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(working || link.isEmpty)
                        .accessibilityIdentifier("invitation.resolve")
                }
                if let message = error ?? authenticationStore.errorMessage { Text(message).foregroundStyle(RilloraTheme.clay).font(.subheadline).accessibilityIdentifier("invitation.error") }
            }.padding(24)
        }.background(RilloraTheme.canvas).rilloraFocusedTask()
            .navigationTitle(String(localized: "Received invitation")).navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(String(localized: "Close")) { dismiss() }.disabled(working || authenticationStore.isWorking) } }
            .navigationDestination(isPresented: $showShared) { SharedWithMeView(service: service) }
            .interactiveDismissDisabled(working || authenticationStore.isWorking)
            .task(id: plannerID) { accepted = false; verificationRequired = false; authenticationRequired = false; if let value = token ?? initialToken { await resolve(value) } }
            .onChange(of: showShared) { _, shown in if !shown, let token { Task { await resolve(token) } } }
            .onChange(of: phase) { _, next in if next == .active && !showShared, let token { Task { await resolve(token); await checkEmailVerification() } } }
            .accessibilityIdentifier("invitation.view")
            .rilloraEntrance()
    }
    @MainActor private func resolve(_ value: String) async {
        guard !working else { return }
        working = true; error = nil; accepted = false
        let account = plannerID
        defer { working = false }
        do {
            let resolved = try await service.resolveSharingInvitation(token: value)
            guard plannerID == account, !Task.isCancelled else { return }
            invitation = resolved; token = value; link = ""; await checkConnection()
        }
        catch { self.error = error.localizedDescription }
    }
    @MainActor private func checkConnection() async {
        guard signedIn, let invitation, invitation.status == .accepted else { return }
        let account = plannerID
        if let data = try? await service.fetchSharedWithMe(), plannerID == account, !Task.isCancelled {
            accepted = data.connections.contains { $0.publicId == invitation.publicId }
        }
    }
    @MainActor private func accept() async {
        guard let token else { return }; working = true; error = nil
        defer { working = false }
        do { _ = try await service.acceptSharingInvitation(token: token); accepted = true; showShared = true }
        catch {
            if let invitation, let data = try? await service.fetchSharedWithMe(), data.connections.contains(where: { $0.publicId == invitation.publicId }) {
                accepted = true; showShared = true
            } else {
                if case RilloraAPIError.server(_, "verified_email_required", _, _) = error { verificationRequired = true }
                if let failure = error as? RilloraAPIError, failure.isAuthenticationRequired { authenticationRequired = true; verificationRequired = false }
                self.error = error.localizedDescription
            }
        }
    }
    @MainActor private func checkEmailVerification() async {
        guard signedIn, verificationRequired, !working else { return }
        let account = plannerID
        working = true
        defer { working = false }
        do {
            let verified = try await service.checkEmailVerification()
            guard plannerID == account, !Task.isCancelled else { return }
            if verified { verificationRequired = false; error = nil }
            else { error = String(localized: "Open the verification email, then return here to continue. Your invitation is saved.") }
        } catch {
            if plannerID == account {
                if let failure = error as? RilloraAPIError, failure.isAuthenticationRequired { authenticationRequired = true; verificationRequired = false }
                self.error = error.localizedDescription
            }
        }
    }
}
