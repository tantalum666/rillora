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

    @State private var sharingConnections: [SharingConnection] = []
    @State private var sharingLoadFailed = false
    @State private var sharingLoaded = false
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        RilloraList {
            Section {
                AccountIdentityView(plannerPublicID: snapshot.session.plannerPublicId,
                                    service: startHereService as? any AccountIdentityServing,
                                    onAuthenticationRequired: store.invalidateAuthentication)
            }
            if snapshot.session.usesDevelopmentIdentity {
                developmentIdentitySection
            }

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

    }

    private var developmentIdentitySection: some View {
        Section {
            Label(String(localized: "Local QA identity"), systemImage: "hammer.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(RilloraTheme.ink)
        } footer: {
            Text(String(localized: "Debug only · not production sign-in"))
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
                    title: String(localized: "Plan & access"),
                    detail: String(localized: "Subscription and included features"),
                    systemImage: "rectangle.stack.fill",
                    badge: commerceStore.currentPlanLabel
                )
            }
            .accessibilityIdentifier("plan-access.open")
            NavigationLink {
                FamilyMaintenanceView(service: maintenanceService, overviewStore: store)
            } label: {
                ProfileTaskLabel(title: String(localized: "Shared reviews"), detail: String(localized: "Check directions and review updates together"), systemImage: "person.2.badge.gearshape")
            }.accessibilityIdentifier("maintenance.open")
        } header: {
            ProfileSectionHeader(String(localized: "Your plan"))
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
                        detail: contact.relationshipLabel ?? String(localized: "Relationship not added"),
                        systemImage: contactIcon(for: contact),
                        badge: sharingConnections.first(where: { $0.personPublicId == contact.publicId })?.statusLabel
                            ?? (sharingLoadFailed ? String(localized: "Connection unavailable") : sharingLoaded ? noCurrentSharingLabel : String(localized: "Checking connection…"))
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("contact.open.\(contact.publicId)")
            }

            NavigationLink {
                SharedWithMeView(service: sharingService, onOpenInvitation: onOpenInvitation)
            } label: {
                ProfileTaskLabel(title: String(localized: "Shared with me"), detail: String(localized: "Items others let you see"), systemImage: "person.2")
            }.accessibilityIdentifier("shared.open")
        } header: {
            ProfileSectionHeader(String(localized: "People"))
        }
        .rilloraProfileActionRows()
        .rilloraEntrance()
    }
    private var noCurrentSharingLabel: String {
        (sharingService as? any FutureNoticeServing)?.futureNoticesEnabled == true
            ? String(localized: "No content shared now") : String(localized: "Not invited")
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
                    ProfileTaskLabel(title: String(localized: "My data"), detail: String(localized: "Backups and saved copies"), systemImage: "externaldrive")
                }.accessibilityIdentifier("account-data.open")
            }
            NavigationLink { StartHerePreviewView(service: startHereService) } label: {
                ProfileTaskLabel(title: String(localized: "Start Here guide"), detail: String(localized: "Create a guide you can keep"), systemImage: "square.and.arrow.up")
            }.accessibilityIdentifier("start-here.open")
            NavigationLink { OfficialSetupView(service: officialSetupService, overviewStore: store) } label: {
                ProfileTaskLabel(title: String(localized: "Account inheritance"), detail: String(localized: "Preparation & after-death guidance"), systemImage: "book")
            }.accessibilityIdentifier("official-setup.open")
        } header: { ProfileSectionHeader(String(localized: "Tools")) }
        .rilloraProfileActionRows()
    }

    private var supportSection: some View {
        Section {
            NavigationLink { RilloraSafetyPrivacyView(authenticationStore: authenticationStore) } label: {
                ProfileTaskLabel(title: String(localized: "Safety & privacy"), detail: String(localized: "Your data and permissions"), systemImage: "lock.shield")
            }.accessibilityIdentifier("profile.safety")
            NavigationLink { AppPreferencesView() } label: {
                ProfileTaskLabel(title: String(localized: "Language & appearance"), detail: String(localized: "App language and display mode"), systemImage: "slider.horizontal.3")
            }.accessibilityIdentifier("profile.preferences")
            NavigationLink { AboutRilloraView() } label: {
                ProfileTaskLabel(title: String(localized: "About Rillora"), detail: String(localized: "Version and app information"), systemImage: "info.circle")
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
                    authenticationStore.isWorking ? String(localized: "Signing out…") : String(localized: "Sign out"),
                    systemImage: "rectangle.portrait.and.arrow.right"
                )
                .foregroundStyle(RilloraTheme.clay)
            }
            .disabled(authenticationStore.isWorking)
            .accessibilityIdentifier("account.sign-out")
            if let message = authenticationStore.errorMessage {
                Text(message).foregroundStyle(RilloraTheme.clay).accessibilityIdentifier("account.sign-out-error")
            }
        } header: {
            ProfileSectionHeader(String(localized: "Sessions"))
        }
        .rilloraProfileActionRows()
    }

    private var authenticationLabel: String {
        snapshot.session.usesDevelopmentIdentity ? String(localized: "Development") : String(localized: "Secure session")
    }

    private var continuityStatus: String {
        snapshot.plan.status.capitalized
    }

    private var motivationLabel: String {
        guard let rawValue = snapshot.plan.motivation,
              let motivation = PlanMotivation(rawValue: rawValue) else {
            return String(localized: "Not selected")
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
