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
    @Environment(\.dismiss) private var dismiss

    private var signedIn: Bool { if case .loaded = overviewStore.state { true } else { false } }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if case .loaded(let snapshot) = overviewStore.state, snapshot.session.usesDevelopmentIdentity {
                    Label("Local QA · test data", systemImage: "hammer").font(.footnote).foregroundStyle(RilloraTheme.muted)
                }
                HStack(spacing: 18) {
                    Image(systemName: "person.crop.circle.fill").foregroundStyle(RilloraTheme.tabSelection)
                    Image(systemName: "ellipsis").font(.title3).foregroundStyle(RilloraTheme.muted)
                    Image(systemName: "person.crop.circle.fill").foregroundStyle(RilloraTheme.clay)
                }.font(.system(size: 70)).frame(maxWidth: .infinity).padding(.vertical, 22).accessibilityHidden(true)
                if let invitation {
                    Text("\(invitation.ownerName) invited you").font(.title2.weight(.semibold)).foregroundStyle(RilloraTheme.ink)
                    Label("For \(invitation.emailHint)", systemImage: "envelope").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    if invitation.status == .expired || invitation.status == .revoked {
                        Text(invitation.status == .expired ? "This invitation expired. Ask for a new link." : "This invitation was revoked. Ask for a new link.")
                    } else {
                        Text("Only the items they choose. Read only.").font(.subheadline).foregroundStyle(RilloraTheme.muted)
                        Button {
                            Task {
                                if signedIn { await accept() }
                                else { _ = await authenticationStore.createAccount() }
                            }
                        } label: {
                            HStack { if working || authenticationStore.isWorking { ProgressView() }; Text(signedIn ? "Accept invitation" : "Create account to accept").frame(maxWidth: .infinity); Image(systemName: "arrow.right") }
                        }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(working || authenticationStore.isWorking)
                            .accessibilityIdentifier("invitation.accept")
                        if signedIn {
                            Button("Use another account") { Task { await authenticationStore.signOut(); _ = await authenticationStore.signIn() } }
                                .frame(maxWidth: .infinity, minHeight: 44).disabled(working || authenticationStore.isWorking)
                        } else {
                            Button("Already have an account? Sign in") { Task { _ = await authenticationStore.signIn() } }
                                .frame(maxWidth: .infinity, minHeight: 44).disabled(working || authenticationStore.isWorking)
                        }
                    }
                } else {
                    Text(working ? "Opening invitation…" : "Open an invitation").font(.title2.weight(.semibold))
                    RilloraTextField(title: "Invitation link", prompt: "Paste the link you received", text: $link,
                                    identifier: "invitation.link", required: true, axis: .vertical)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("Open invitation") {
                        guard let value = ReceivedInvitation.token(from: link) else { error = "Paste the complete invitation link."; return }
                        Task { await resolve(value) }
                    }.buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(working || link.isEmpty)
                        .accessibilityIdentifier("invitation.resolve")
                }
                if let error { Text(error).foregroundStyle(RilloraTheme.clay).font(.subheadline).accessibilityIdentifier("invitation.error") }
            }.padding(24)
        }.background(RilloraTheme.canvas).rilloraFocusedTask()
            .navigationTitle("Invitation").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() }.disabled(working || authenticationStore.isWorking) } }
            .navigationDestination(isPresented: $showShared) { SharedWithMeView(service: service) }
            .interactiveDismissDisabled(working || authenticationStore.isWorking)
            .task { if let initialToken, invitation == nil { await resolve(initialToken) } }
            .accessibilityIdentifier("invitation.view")
    }
    @MainActor private func resolve(_ value: String) async {
        working = true; error = nil
        defer { working = false }
        do { invitation = try await service.resolveSharingInvitation(token: value); token = value; link = "" }
        catch { self.error = error.localizedDescription }
    }
    @MainActor private func accept() async {
        guard let token else { return }; working = true; error = nil
        defer { working = false }
        do { _ = try await service.acceptSharingInvitation(token: token); showShared = true }
        catch { self.error = error.localizedDescription }
    }
}
