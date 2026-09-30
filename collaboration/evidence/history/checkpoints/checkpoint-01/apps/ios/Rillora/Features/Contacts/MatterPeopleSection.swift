import SwiftUI

// Rows inside the existing matter form; all actions reuse the existing contact/sharing screens.
struct MatterPeopleSection: View {
    let matter: Matter
    let overviewStore: OverviewStore
    let sharingService: any SharingServing
    let contactService: any TrustedContactEditing
    @State private var connections: [SharingConnection]?
    @State private var error: String?
    @State private var showsInvite = false
    @State private var createdContact: TrustedContact?

    private var snapshot: OverviewSnapshot? {
        if case .loaded(let value) = overviewStore.state { return value }; return nil
    }
    private var contacts: [TrustedContact] { (snapshot?.trustedContacts ?? []).filter { !["revoked", "archived"].contains($0.status) } }

    var body: some View {
        if matter.desiredOutcome == "never_disclose" {
            Label("Never disclose. This matter stays private.", systemImage: "lock").font(.subheadline).foregroundStyle(RilloraTheme.muted)
        } else {
            if let error {
                Text(error).font(.subheadline).foregroundStyle(RilloraTheme.clay)
                Button("Retry sharing status") { Task { await load() } }
            } else if let connections {
                if contacts.isEmpty { Label("Only you can see this matter.", systemImage: "lock").font(.subheadline).foregroundStyle(RilloraTheme.muted) }
                ForEach(contacts) { person in
                    let connection = connections.first { $0.personPublicId == person.publicId && $0.isActive }
                    let grant = connection?.grants.first { $0.matterPublicId == matter.publicId }
                    NavigationLink {
                        ContactSharingView(contact: person, matters: snapshot?.matters ?? [matter], service: sharingService,
                            contactService: contactService, overviewStore: overviewStore, focusMatterID: matter.publicId)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(person.displayName)
                            Text(grant.map { "\($0.detailLevel.title) · \(connection?.statusLabel ?? "Not invited")" } ?? "Not shared")
                                .font(.footnote).foregroundStyle(RilloraTheme.muted)
                        }
                    }.accessibilityIdentifier("matter.sharing.person.\(person.publicId)")
                }
            } else { ProgressView("Checking sharing…") }
            Button { createdContact = nil; showsInvite = true } label: { Label("Invite someone", systemImage: "person.badge.plus") }
                .accessibilityIdentifier("matter.sharing.invite")
                .sheet(isPresented: $showsInvite, onDismiss: { Task { await load() } }) {
                    NavigationStack {
                        if let createdContact {
                            ContactSharingView(contact: createdContact, matters: snapshot?.matters ?? [matter], service: sharingService,
                                contactService: contactService, overviewStore: overviewStore, focusMatterID: matter.publicId)
                        } else {
                            TrustedContactEditorView(contact: nil, service: contactService, overviewStore: overviewStore,
                                onCreated: { createdContact = $0 })
                        }
                    }
                }
                .task { await load() }
        }
    }
    @MainActor private func load() async {
        error = nil
        do { connections = try await sharingService.fetchSharingConnections() }
        catch { connections = nil; self.error = error.localizedDescription }
    }
}
