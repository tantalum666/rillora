import SwiftUI

struct AuthenticatedProfileContent: View {
    let snapshot: OverviewSnapshot
    let store: OverviewStore
    let planService: any PlanEditing
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let startHereService: any StartHerePreviewing
    let authenticationStore: AuthenticationStore
    let commerceStore: CommerceStore
    let onOpenFirstUseGuide: () -> Void
    let addContact: () -> Void
    let editContact: (TrustedContact) -> Void

    @State private var isConfirmingAllSessionRevocation = false

    var body: some View {
        List {
            if snapshot.session.usesDevelopmentIdentity {
                developmentIdentitySection
            }

            planSection
            contactsSection
            detailsSection
            preparationSection
            supportSection

            if snapshot.session.authenticationMode == "bearer" {
                sessionSection
            }
        }
        .rilloraStructuredList()
        .accessibilityIdentifier("profile.list")
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
                    detail: "\(continuityStatus) · \(authenticationLabel)",
                    systemImage: "rectangle.stack.fill",
                    badge: commerceStore.currentPlanLabel
                )
            }
            .accessibilityIdentifier("plan-access.open")
        } header: {
            ProfileSectionHeader("Your plan")
        }
        .rilloraProfileActionRows()
    }

    private var contactsSection: some View {
        Section {
            ForEach(snapshot.trustedContacts) { contact in
                Button {
                    editContact(contact)
                } label: {
                    ProfileTaskLabel(
                        title: contact.displayName,
                        detail: contact.relationshipLabel ?? "Relationship not added",
                        systemImage: contactIcon(for: contact),
                        badge: contact.evidenceLabel
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("contact.open.\(contact.publicId)")
            }

            Button(action: addContact) {
                ProfileTaskLabel(
                    title: "Add trusted contact",
                    detail: "Record only · sends nothing",
                    systemImage: "person.badge.plus"
                )
            }
            .buttonStyle(RilloraQuietButtonStyle())
            .accessibilityIdentifier("contact.add")
        } header: {
            ProfileSectionHeader("Trusted contacts")
        }
        .rilloraProfileActionRows()
    }

    private var detailsSection: some View {
        Section {
            NavigationLink {
                PlanMotivationView(
                    plan: snapshot.plan,
                    service: planService,
                    overviewStore: store
                )
            } label: {
                ProfileTaskLabel(
                    title: "Why I’m preparing",
                    detail: motivationLabel,
                    systemImage: "scope"
                )
            }
            .accessibilityIdentifier("plan-motivation.open")

            if snapshot.plan.firstUseState != .completed {
                Button(action: onOpenFirstUseGuide) {
                    ProfileTaskLabel(
                        title: snapshot.plan.firstUseState == .guidePaused ? "Resume setup" : "Optional setup",
                        detail: "Optional · 2 short steps",
                        systemImage: "map.fill"
                    )
                }
                .buttonStyle(RilloraQuietButtonStyle())
                .accessibilityIdentifier("first-use.account-open")
            }
        } header: {
            ProfileSectionHeader("Plan details")
        }
        .rilloraProfileActionRows()
    }

    private var preparationSection: some View {
        Section {
            ProfilePreparationGrid(
                store: store,
                officialSetupService: officialSetupService,
                simulationService: simulationService,
                disclosureRehearsalService: disclosureRehearsalService,
                startHereService: startHereService
            )
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
        } header: {
            ProfileSectionHeader("Preparation")
        }
    }

    private var supportSection: some View {
        Section {
            ProfileSupportGrid()
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
        } header: {
            ProfileSectionHeader("Rillora")
        }
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
