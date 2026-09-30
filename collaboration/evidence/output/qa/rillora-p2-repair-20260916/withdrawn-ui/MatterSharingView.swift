import SwiftUI

struct MatterSharingView: View {
    let matter: Matter
    let service: any SharingServing
    let contactService: any TrustedContactEditing
    let overviewStore: OverviewStore
    @State private var connections: [SharingConnection]?
    @State private var error: String?
    @State private var showsInvite = false
    @State private var createdContact: TrustedContact?

    private var snapshot: OverviewSnapshot? {
        if case .loaded(let value) = overviewStore.state { return value }; return nil
    }
    private var people: [TrustedContact] { (snapshot?.trustedContacts ?? []).filter { !["revoked", "archived"].contains($0.status) } }
    var body: some View {
        List {
            Section { Text(matter.title).font(.headline) }
            if matter.desiredOutcome == "never_disclose" {
                Section { Label("Never disclose is selected. This matter stays private.", systemImage: "lock") }
            } else if let error {
                Section { Text(error); Button("Retry") { Task { await load() } } }
            } else if let connections {
                if !connections.contains(where: { $0.isActive && $0.grants.contains(where: { $0.matterPublicId == matter.publicId }) }) {
                    Section { Label("Only you can see this matter.", systemImage: "lock") }.listRowBackground(Color.clear)
                }
                Section("People") {
                    ForEach(people) { person in
                        let connection = connections.first { $0.personPublicId == person.publicId && $0.isActive }
                        let grant = connection?.grants.first { $0.matterPublicId == matter.publicId }
                        NavigationLink {
                            ContactSharingView(contact: person, matters: snapshot?.matters ?? [matter], service: service,
                                contactService: contactService, overviewStore: overviewStore, focusMatterID: matter.publicId)
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(person.displayName)
                                Text(grant.map { "\($0.detailLevel.title) · \(connection!.status.label)" } ?? "Not shared")
                                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                            }.padding(.vertical, 4)
                        }
                    }
                    Button { createdContact = nil; showsInvite = true } label: { Label("Invite someone", systemImage: "person.badge.plus") }
                }
            } else { ProgressView("Checking who can see this…") }
        }.rilloraStructuredList().rilloraFocusedTask()
            .navigationTitle("Who can see this").navigationBarTitleDisplayMode(.inline)
            .task { await load() }.refreshable { await load() }
            .sheet(isPresented: $showsInvite, onDismiss: { Task { await load() } }) {
                NavigationStack {
                    if let createdContact {
                        ContactSharingView(contact: createdContact, matters: snapshot?.matters ?? [matter], service: service,
                            contactService: contactService, overviewStore: overviewStore, focusMatterID: matter.publicId)
                    } else {
                        TrustedContactEditorView(contact: nil, service: contactService, overviewStore: overviewStore,
                            onCreated: { createdContact = $0 })
                    }
                }
            }
    }
    @MainActor private func load() async {
        error = nil
        do { connections = try await service.fetchSharingConnections() }
        catch { connections = nil; self.error = error.localizedDescription }
    }
}
