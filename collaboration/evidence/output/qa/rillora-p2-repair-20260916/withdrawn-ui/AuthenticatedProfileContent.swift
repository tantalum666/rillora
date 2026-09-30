import SwiftUI

struct AuthenticatedProfileContent: View {
    let snapshot: OverviewSnapshot
    let store: OverviewStore
    let planService: any PlanEditing
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let startHereService: any StartHerePreviewing
    let sharingService: any SharingServing
    let maintenanceService: any FamilyMaintenanceServing
    let sharingRevision: Int
    let authenticationStore: AuthenticationStore
    let commerceStore: CommerceStore
    let onOpenFirstUseGuide: () -> Void
    let onOpenInvitation: () -> Void
    let addContact: () -> Void
    let editContact: (TrustedContact) -> Void

    @State private var isConfirmingAllSessionRevocation = false
    @State private var sharingConnections: [SharingConnection] = []
    @State private var sharingLoadFailed = false
    @State private var sharingLoaded = false
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        List {
            if snapshot.session.usesDevelopmentIdentity {
                developmentIdentitySection
            }

            accountSection
            contactsSection
            planSection
            preparationSection
            supportSection

            if snapshot.session.authenticationMode == "bearer" {
                sessionSection
            }
        }
        .rilloraStructuredList()
        .accessibilityIdentifier("profile.list")
        .task(id: sharingRevision) { await loadConnections() }
        .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await loadConnections() } } }
        .confirmationDialog(
            "Sign out all Rillora devices?",
            isPresented: $isConfirmingAllSessionRevocation,
            titleVisibility: .visible
        ) {
            Button("Sign out all devices", role: .destructive) {
                Task { await authenticationStore.signOutAll() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Every active Rillora app session will stop working, including this device.")
        }
    }

    private var accountSection: some View {
        Section {
            LabeledContent("Signed in", value: snapshot.session.usesDevelopmentIdentity ? "Local QA" : "Rillora account")
            if let date = snapshot.session.authenticatedAt, let value = ISO8601DateFormatter().date(from: date) {
                LabeledContent("This session", value: value.formatted(date: .abbreviated, time: .shortened))
            }
            if snapshot.plan.firstUseState == .guidePaused {
                Button("Resume quick start guide", action: onOpenFirstUseGuide).frame(minHeight: 44)
            }
        } header: { ProfileSectionHeader("Account") }
    }

    private var developmentIdentitySection: some View {
        Section {
            Label("Local QA identity", systemImage: "hammer.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
        } footer: {
            Text("Debug only · not production sign-in")
        }
        .listRowBackground(RilloraTheme.peach.opacity(0.38))
    }

    private var planSection: some View {
        Section {
            NavigationLink {
                PlanAccessView(
                    store: commerceStore,
                    appAccountToken: UUID(uuidString: snapshot.session.plannerPublicId)
                )
            } label: {
                ProfileTaskLabel(
                    title: "Plan & access",
                    detail: "Subscription and included features",
                    systemImage: "rectangle.stack.fill",
                    badge: commerceStore.currentPlanLabel
                )
            }
            .accessibilityIdentifier("plan-access.open")
            NavigationLink {
                FamilyMaintenanceView(service: maintenanceService, overviewStore: store)
            } label: {
                ProfileTaskLabel(title: "Shared reviews", detail: "Check directions and review updates together", systemImage: "person.2.badge.gearshape")
            }.accessibilityIdentifier("maintenance.open")
        } header: {
            ProfileSectionHeader("Your plan")
        }
        .rilloraProfileActionRows()
    }

    private var contactsSection: some View {
        Section {
            InviteSomeoneRow(action: addContact).accessibilityIdentifier("contact.add")
            ForEach(snapshot.trustedContacts) { contact in
                Button {
                    editContact(contact)
                } label: {
                    ProfileTaskLabel(
                        title: contact.displayName,
                        detail: contact.relationshipLabel ?? "Relationship not added",
                        systemImage: contactIcon(for: contact),
                        badge: sharingConnections.first(where: { $0.personPublicId == contact.publicId })?.status.label
                            ?? (sharingLoadFailed ? "Connection unavailable" : sharingLoaded ? "Not invited" : "Checking connection…")
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("contact.open.\(contact.publicId)")
            }

            NavigationLink {
                SharedWithMeView(service: sharingService, onOpenInvitation: onOpenInvitation)
            } label: {
                ProfileTaskLabel(title: "Shared with me", detail: "Items others let you see", systemImage: "person.2")
            }.accessibilityIdentifier("shared.open")
        } header: {
            ProfileSectionHeader("People")
        }
        .rilloraProfileActionRows()
        .rilloraEntrance()
    }

    @MainActor private func loadConnections() async {
        do {
            let current = try await sharingService.fetchSharingConnections()
            guard !Task.isCancelled else { return }
            sharingConnections = current; sharingLoadFailed = false; sharingLoaded = true
        } catch {
            guard !Task.isCancelled else { return }
            sharingConnections = []; sharingLoadFailed = true; sharingLoaded = true
        }
    }

    private var preparationSection: some View {
        Section {
            if let dataService = startHereService as? any AccountDataServing {
                NavigationLink { AccountDataView(service: dataService, overviewStore: store, onDeletionRequested: authenticationStore.endSessionAfterDeletion) } label: {
                    ProfileTaskLabel(title: "My data", detail: "Backups and saved copies", systemImage: "externaldrive")
                }.accessibilityIdentifier("account-data.open")
            }
            NavigationLink { StartHerePreviewView(service: startHereService) } label: {
                ProfileTaskLabel(title: "Start Here guide", detail: "Create a guide you can keep", systemImage: "square.and.arrow.up")
            }.accessibilityIdentifier("start-here.open")
            NavigationLink { OfficialSetupView(service: officialSetupService, overviewStore: store) } label: {
                ProfileTaskLabel(title: "Official guides", detail: "Find the official next steps", systemImage: "checklist")
            }.accessibilityIdentifier("official-setup.open")
        } header: { ProfileSectionHeader("Tools") }
        .rilloraProfileActionRows()
    }

    private var supportSection: some View {
        Section {
            NavigationLink { RilloraSafetyPrivacyView() } label: {
                ProfileTaskLabel(title: "Safety & privacy", detail: "Your data and permissions", systemImage: "lock.shield")
            }.accessibilityIdentifier("profile.safety")
            NavigationLink { AboutRilloraView() } label: {
                ProfileTaskLabel(title: "About Rillora", detail: "Version and app information", systemImage: "info.circle")
            }.accessibilityIdentifier("profile.about")
        } header: { ProfileSectionHeader("Rillora") }
        .rilloraProfileActionRows()
    }

    private var sessionSection: some View {
        Section {
            Button(role: .destructive) {
                Task { await authenticationStore.signOut() }
            } label: {
                Label(
                    authenticationStore.isWorking ? "Signing out…" : "Sign out",
                    systemImage: "rectangle.portrait.and.arrow.right"
                )
                .foregroundStyle(RilloraTheme.clay)
            }
            .disabled(authenticationStore.isWorking)
            .accessibilityIdentifier("account.sign-out")

            Button(role: .destructive) {
                isConfirmingAllSessionRevocation = true
            } label: {
                Label("Sign out all Rillora devices", systemImage: "rectangle.stack.badge.minus")
                    .foregroundStyle(RilloraTheme.clay)
            }
            .disabled(authenticationStore.isWorking)
            .accessibilityIdentifier("account.sign-out-all")
        } header: {
            ProfileSectionHeader("Sessions")
        } footer: {
            Text("Rillora sessions only")
        }
        .rilloraProfileActionRows()
    }

    private var authenticationLabel: String {
        snapshot.session.usesDevelopmentIdentity ? "Development" : "Secure session"
    }

    private var continuityStatus: String {
        snapshot.plan.status.capitalized
    }

    private var motivationLabel: String {
        guard let rawValue = snapshot.plan.motivation,
              let motivation = PlanMotivation(rawValue: rawValue) else {
            return "Not selected"
        }
        return motivation.label
    }

    private func contactIcon(for contact: TrustedContact) -> String {
        if contact.hasAcceptedInvitation { return "person.crop.circle.badge.checkmark" }
        if contact.hasSimulatedAcceptance { return "testtube.2" }
        if contact.isRevoked { return "person.crop.circle.badge.xmark" }
        return "person.crop.circle"
    }
}
