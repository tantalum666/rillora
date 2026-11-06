#if os(iOS)
import SwiftUI

public struct CheckInEntryView: View {
    let store: CheckInPhoneStore
    public init(store: CheckInPhoneStore) { self.store = store }
    public var body: some View {
        NavigationLink { CheckInPhoneView(store: store) } label: {
            Label(CheckInText.get("title"), systemImage: "checkmark.circle")
        }.accessibilityIdentifier("checkin.open")
    }
}

public struct CheckInPhoneView: View {
    @Bindable var store: CheckInPhoneStore
    @State private var cadence: CheckInCadence = .day
    @Environment(\.scenePhase) private var scenePhase
    public init(store: CheckInPhoneStore) { self.store = store }
    public var body: some View {
        Form {
            if let state = store.state, store.active {
                Section {
                    Button(CheckInText.get("confirm")) { Task { await store.confirm() } }
                        .buttonStyle(.borderedProminent).disabled(store.busy).accessibilityIdentifier("checkin.confirm")
                    if let confirmation = state.confirmation {
                        LabeledContent(CheckInText.get("lastConfirmation"), value: confirmation.reportedAt.formatted(date: .abbreviated, time: .shortened))
                        Text(CheckInText.get(confirmation.origin == .watch ? "receivedFromWatch" : "confirmedHere"))
                            .accessibilityIdentifier("checkin.confirmed")
                        if confirmation.origin == .watch {
                            LabeledContent(CheckInText.get("receivedAt"), value: confirmation.receivedAt.formatted(date: .abbreviated, time: .shortened))
                        }
                    } else { Text(CheckInText.get("notConfirmed")) }
                    if store.reminderScheduled, let due = state.nextDue {
                        LabeledContent(CheckInText.get(due <= Date() ? "awaitingSince" : "nextReminder"), value: due.formatted(date: .abbreviated, time: .shortened))
                    }
                }
                Section {
                    Picker(CheckInText.get("cadence"), selection: $cadence) {
                        ForEach(CheckInCadence.allCases, id: \.self) { value in Text(CheckInText.cadence(value)).tag(value) }
                    }.disabled(store.busy).accessibilityIdentifier("checkin.cadence")
                    Button(CheckInText.get(state.enabled ? "saveSchedule" : "enable")) { Task { await store.configure(enabled: true, cadence: cadence) } }
                        .disabled(store.busy).accessibilityIdentifier("checkin.enable")
                    if state.enabled {
                        Button(CheckInText.get("pause")) { Task { await store.configure(enabled: false, cadence: cadence) } }
                            .disabled(store.busy).accessibilityIdentifier("checkin.pause")
                        if store.notificationsAllowed && !store.reminderScheduled { Text(CheckInText.get("scheduleFailed")) }
                        if !store.notificationsAllowed {
                            Text(CheckInText.get("permissionDenied"))
                            if let url = URL(string: UIApplication.openSettingsURLString) { Link(CheckInText.get("settings"), destination: url) }
                        }
                    } else { Text(CheckInText.get("paused")).accessibilityIdentifier("checkin.paused") }
                } footer: { Text(CheckInText.get("cadenceExplanation")) }
            } else { Text(CheckInText.get("unlinked")) }
            if let message = store.message { Section {
                Text(message).accessibilityIdentifier("checkin.message")
                if message == CheckInText.get("permissionDenied"), store.state?.enabled != true,
                   let url = URL(string: UIApplication.openSettingsURLString) {
                    Link(CheckInText.get("settings"), destination: url).accessibilityIdentifier("checkin.settings")
                }
            } }
            Section { Text(CheckInText.get("boundary")).foregroundStyle(.secondary) }
        }
        .navigationTitle(CheckInText.get("title")).navigationBarTitleDisplayMode(.inline)
        .task { cadence = store.state?.cadence ?? .day; await store.refreshPermission() }
        .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await store.refreshPermission() } } }
        .overlay { if scenePhase != .active { Color(uiColor: .systemBackground).ignoresSafeArea() } }
        .privacySensitive().accessibilityIdentifier("checkin.view")
    }
}
#endif
