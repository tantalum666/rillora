import SwiftUI

struct FamilyMaintenanceView: View {
    @State private var store: FamilyMaintenanceStore
    let overviewStore: OverviewStore
    @State private var inbox = "mine"
    @RilloraReduceMotion private var reduceMotion
    @State private var choseInitialInbox = false
    @State private var sheet: FamilyReviewSheet?
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.dismiss) private var dismiss
    init(service: any FamilyMaintenanceServing, overviewStore: OverviewStore) {
        _store = State(initialValue: FamilyMaintenanceStore(service: service)); self.overviewStore = overviewStore
    }
    var body: some View {
        RilloraList {
            if let error = store.errorMessage {
                Section { Label(error, systemImage: "exclamationmark.circle"); Button(String(localized: "Reload reviews")) { Task { await store.reload() } } }
            }
            if let data = store.data {
                Section {
                    RilloraFilterPicker(title: String(localized: "Review inbox"), options: [
                        .init(id: "mine", title: String(localized: "My plan")),
                        .init(id: "incoming", title: data.incoming.contains { $0.roundState == "open" } ? L10n.format("For me %1$lld", data.incoming.filter { $0.roundState == "open" }.count) : String(localized: "For me")),
                    ], selection: $inbox, identifier: "maintenance.inbox-picker")
                }.listRowBackground(Color.clear)
                if inbox == "mine" { ownerContent(data) } else { incomingContent(data) }
            } else if store.isLoading { ProgressView(String(localized: "Loading reviews…")) }
        }
        .rilloraStructuredList().rilloraFocusedTask()
        .navigationTitle(String(localized: "Shared reviews")).navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .primaryAction) {
            Button { Task { await store.reload() } } label: { Image(systemName: "arrow.clockwise") }
                .accessibilityLabel(String(localized: "Refresh reviews")).disabled(store.isLoading)
        } }
        .task {
            await store.reload()
            if !choseInitialInbox {
                if let data = store.data, data.openRound == nil, data.incoming.contains(where: { $0.roundState == "open" }) { inbox = "incoming" }
                choseInitialInbox = true
            }
        }.refreshable { await store.reload() }
        .onChange(of: scenePhase) { _, phase in if phase == .active && sheet == nil { Task { await store.reload() } } }
        .onChange(of: store.requiresAuthentication) { _, required in
            if required { sheet = nil; Task { await overviewStore.reload() } }
        }
        .sheet(item: $sheet) { destination in
            NavigationStack { FamilyReviewSheetView(destination: destination, store: store, overviewStore: overviewStore) }
        }
        .accessibilityIdentifier("maintenance.view")
        .animation(reduceMotion ? nil : RilloraMotion.reveal, value: inbox)
    }
    @ViewBuilder private func ownerContent(_ data: FamilyMaintenanceOverview) -> some View {
        Section { FamilyReviewHero(round: data.openRound, settings: data.settings, preview: data.access.mode == "preview") }
            .listRowBackground(Color.clear)
        if let round = data.openRound {
            Section {
                ForEach(round.tasks) { task in
                    Button { sheet = .task(task, owner: true) } label: { FamilyReviewTaskRow(task: task, receiver: false) }
                        .accessibilityIdentifier("maintenance.task.\(task.publicId)")
                }
            }
            Section {
                if let url = data.shareURL, !round.canFinish, data.access.canCreate {
                    ShareLink(item: url, subject: Text(String(localized: "Rillora review")), message: Text(String(localized: "Please check the directions I shared with you."))) {
                        Label(String(localized: "Share review request"), systemImage: "square.and.arrow.up").frame(maxWidth: .infinity)
                    }.buttonStyle(.bordered).controlSize(.large).accessibilityIdentifier("maintenance.share")
                }
                Button { sheet = .close(round, complete: true) } label: { Label(String(localized: "Finish review"), systemImage: "checkmark.circle").frame(maxWidth: .infinity) }
                    .buttonStyle(RilloraPrimaryActionButtonStyle()).disabled(!round.canFinish || !data.access.canCreate)
                    .accessibilityIdentifier("maintenance.finish")
                Button(String(localized: "Cancel this review"), role: .destructive) { sheet = .close(round, complete: false) }
            }.listRowBackground(Color.clear)
        } else if data.access.canCreate {
            Section {
                if data.eligible.isEmpty {
                    Button { dismiss() } label: { Label(String(localized: "Manage trusted contacts"), systemImage: "person.2").frame(maxWidth: .infinity) }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("maintenance.connect")
                    Text(String(localized: "Connect someone and share Directions or Details first.")).foregroundStyle(RilloraTheme.muted)
                } else {
                    Button { sheet = .start } label: { Label(String(localized: "Start a shared review"), systemImage: "person.2.badge.gearshape").frame(maxWidth: .infinity) }
                        .buttonStyle(RilloraPrimaryActionButtonStyle()).accessibilityIdentifier("maintenance.start")
                }
            }.listRowBackground(Color.clear)
        } else {
            Section { Text(String(localized: "New shared reviews are not available for this plan right now.")).foregroundStyle(RilloraTheme.muted) }
        }
        Section {
            Button { sheet = .settings(data.settings, data.eligible, enabled: data.access.canCreate) } label: {
                Label { VStack(alignment: .leading, spacing: 6) {
                    Text(String(localized: "Review schedule & collaborator")).foregroundStyle(RilloraTheme.ink)
                    Text(data.settings.cadenceDays == 0 ? String(localized: "In-app reminders paused") : data.settings.nextReviewAt == nil ? String(localized: "Not scheduled · In app") : L10n.format("Every %1$lld days · In app", data.settings.cadenceDays))
                        .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                } } icon: { Image(systemName: "calendar.badge.clock").foregroundStyle(RilloraTheme.tabSelection) }
            }.frame(minHeight: 48).accessibilityIdentifier("maintenance.settings")
        }
        if !data.history.isEmpty {
            Section(String(localized: "Changes you approved")) {
                ForEach(data.history) { change in
                    DisclosureGroup {
                        FamilyReviewFieldChanges(before: change.beforeFields, after: change.afterFields)
                        Text(L10n.format("Suggested by %1$@", change.suggestedBy)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    } label: { VStack(alignment: .leading, spacing: 6) {
                        Text(change.title); Text(FamilyReviewDate.label(change.createdAt)).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                    } }.accessibilityIdentifier("maintenance.history.\(change.publicId)")
                }
            }
        }
        let past = data.rounds.filter { $0.state != "open" }
        if !past.isEmpty {
            Section { DisclosureGroup(String(localized: "Past reviews")) {
                ForEach(past) { round in
                    VStack(alignment: .leading, spacing: 14) {
                        Text(L10n.format("%1$@ · %2$@", round.state == "completed" ? String(localized: "Completed") : String(localized: "Cancelled"), FamilyReviewDate.label(round.completedAt))).font(.headline)
                        ForEach(round.tasks) { task in
                            Button { sheet = .task(task, owner: true) } label: { FamilyReviewTaskRow(task: task, receiver: false) }
                        }
                    }.padding(.vertical, 8)
                }
            } }
        }
    }
    @ViewBuilder private func incomingContent(_ data: FamilyMaintenanceOverview) -> some View {
        let incoming = data.incoming.filter { $0.roundState == "open" }
        if incoming.isEmpty {
            Section {
                VStack(spacing: 18) {
                    RilloraTaskEmblem(systemImage: "tray")
                    Text(String(localized: "Nothing waiting on you")).font(.title2)
                    Text(String(localized: "Shared review requests will appear here.")).foregroundStyle(RilloraTheme.muted)
                }.frame(maxWidth: .infinity).padding(.vertical, 24)
            }.listRowBackground(Color.clear)
        } else {
            Section {
                ForEach(incoming) { task in
                    Button { sheet = .task(task, owner: false) } label: { FamilyReviewTaskRow(task: task, receiver: true) }
                        .accessibilityIdentifier("maintenance.incoming.\(task.publicId)")
                }
            }
        }
        let previous = data.incoming.filter { $0.roundState != "open" }
        if !previous.isEmpty { Section { DisclosureGroup(String(localized: "Previous checks")) {
            ForEach(previous) { task in Button { sheet = .task(task, owner: false) } label: { FamilyReviewTaskRow(task: task, receiver: true) } }
        } } }
    }
}

enum FamilyReviewSheet: Identifiable {
    case start
    case settings(FamilyReviewSettings, [FamilyReviewSelection], enabled: Bool)
    case task(FamilyReviewTask, owner: Bool)
    case close(FamilyReviewRound, complete: Bool)
    var id: String {
        switch self { case .start: "start"; case .settings: "settings"; case .task(let t, _): t.publicId; case .close(let r, _): r.publicId }
    }
}
private struct FamilyReviewHero: View {
    let round: FamilyReviewRound?; let settings: FamilyReviewSettings; let preview: Bool
    @Environment(\.dynamicTypeSize) private var typeSize
    @RilloraReduceMotion private var reduceMotion
    private var fraction: Double { guard let round, !round.tasks.isEmpty else { return 0 }; return Double(round.resolvedCount) / Double(round.tasks.count) }
    var body: some View {
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 18)) : AnyLayout(HStackLayout(alignment: .center, spacing: 22))
        layout {
            ZStack {
                Circle().stroke(RilloraTheme.divider, lineWidth: 6)
                Circle().trim(from: 0, to: fraction).stroke(RilloraTheme.tabSelection, style: StrokeStyle(lineWidth: 6, lineCap: .round)).rotationEffect(.degrees(-90))
                    .animation(reduceMotion ? nil : .easeInOut(duration: 0.35), value: fraction)
                if let round { Text(L10n.format("%1$lld/%2$lld", round.resolvedCount, round.tasks.count)).font(.system(size: 24, weight: .medium)) }
                else { Image(systemName: "person.2").font(.system(size: 30)) }
            }.frame(width: 94, height: 94).foregroundStyle(RilloraTheme.ink).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 8) {
                Text(preview ? String(localized: "Family preview") : String(localized: "Shared reviews")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                Text(round == nil ? String(localized: "Keep directions current") : String(localized: "Check together")).font(.system(.title2, design: .serif)).foregroundStyle(RilloraTheme.ink)
                Text(round.map { L10n.format("Reviewed: %1$lld of %2$lld · Due %3$@", $0.resolvedCount, $0.tasks.count, FamilyReviewDate.label($0.dueAt)) }
                     ?? L10n.format("Next review · %1$@", FamilyReviewDate.label(settings.nextReviewAt))).font(.subheadline).foregroundStyle(RilloraTheme.muted)
            }
        }.padding(.vertical, 16)
    }
}
struct FamilyReviewTaskRow: View {
    let task: FamilyReviewTask; let receiver: Bool
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: task.symbol).font(.system(size: 24)).foregroundStyle(RilloraTheme.tabSelection).frame(width: 28).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 7) {
                Text(task.title).foregroundStyle(RilloraTheme.ink)
                Text(receiver ? task.ownerName : task.personName).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                Text(task.statusLabel).font(.subheadline).foregroundStyle(task.isResolved ? RilloraTheme.tabSelection : RilloraTheme.clay)
            }.frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.right").font(.system(size: 16)).foregroundStyle(RilloraTheme.muted).accessibilityHidden(true)
        }.padding(.vertical, 9).frame(minHeight: 48).contentShape(Rectangle())
    }
}
struct FamilyReviewFieldChanges: View {
    let before: [String: String]; let after: [String: String]
    var body: some View {
        ForEach(["institutionName", "locationHint"].filter { after[$0] != nil && after[$0] != before[$0] }, id: \.self) { key in
            VStack(alignment: .leading, spacing: 10) {
                Text(key == "locationHint" ? String(localized: "Where to find it") : String(localized: "Provider")).font(.subheadline).foregroundStyle(RilloraTheme.muted)
                Text(before[key].flatMap { $0.isEmpty ? nil : $0 } ?? String(localized: "Not added")).foregroundStyle(RilloraTheme.muted)
                Image(systemName: "arrow.down").foregroundStyle(RilloraTheme.muted).accessibilityLabel(String(localized: "changes to"))
                Text(after[key] ?? "").foregroundStyle(RilloraTheme.tabSelection)
            }.padding(.vertical, 10).fixedSize(horizontal: false, vertical: true)
        }
    }
}
