import Foundation
import Observation

@MainActor @Observable
final class FutureNoticeStore {
    private let service: any FutureNoticeServing
    let personID: String
    var email = ""
    private(set) var notice: FutureNotice?
    private(set) var invitationURL: URL?
    private(set) var error: String?
    private(set) var isWorking = false
    private(set) var hasLoaded = false
    private var generation = 0
    var hasDraft: Bool { notice?.isActive != true && !email.isEmpty }
    var canCreate: Bool {
        let value = email.trimmingCharacters(in: .whitespacesAndNewlines)
        return hasLoaded && !isWorking && notice?.isActive != true && value.count <= 254
            && value.range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", options: .regularExpression) != nil
    }
    init(personID: String, service: any FutureNoticeServing) { self.personID = personID; self.service = service }
    func refresh() async {
        guard !isWorking else { return }
        generation += 1; let request = generation; isWorking = true; error = nil
        defer { if generation == request { isWorking = false } }
        do {
            let next = try await service.fetchFutureNotice(personID: personID)
            guard generation == request, !Task.isCancelled else { return }
            if next?.status != .pending || next?.version != notice?.version { invitationURL = nil }
            notice = next; hasLoaded = true
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            notice = nil; invitationURL = nil; self.error = FutureNoticeError.message(error); hasLoaded = false
        }
    }
    enum Action { case create, regenerate, revoke }
    func change(_ action: Action) async {
        guard !isWorking, hasLoaded, action != .create || canCreate else { return }
        generation += 1; let request = generation; isWorking = true; error = nil
        defer { if generation == request { isWorking = false } }
        do {
            let result: FutureNoticeMutation
            switch action {
            case .create: result = try await service.createFutureNotice(personID: personID, email: email.trimmingCharacters(in: .whitespacesAndNewlines))
            case .regenerate:
                guard let notice else { return }
                result = try await service.regenerateFutureNotice(publicID: notice.id, version: notice.version)
            case .revoke:
                guard let notice else { return }
                result = try await service.revokeFutureNotice(publicID: notice.id, version: notice.version)
            }
            guard generation == request, !Task.isCancelled else { return }
            notice = result.notice; invitationURL = result.invitationURL; email = ""
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            invitationURL = nil; self.error = FutureNoticeError.message(error)
        }
    }
    func suspend() { generation += 1; notice = nil; invitationURL = nil; isWorking = false; hasLoaded = false }
}

@MainActor @Observable
final class FutureNoticesInboxStore {
    private let service: any FutureNoticeServing
    private(set) var notices: [ReceivedFutureNotice]?
    private(set) var error: String?
    private(set) var isWorking = false
    private var generation = 0
    init(service: any FutureNoticeServing) { self.service = service }
    func refresh() async {
        guard !isWorking else { return }
        generation += 1; let request = generation; isWorking = true
        defer { if generation == request { isWorking = false } }
        do {
            let result = try await service.fetchReceivedFutureNotices()
            guard generation == request, !Task.isCancelled else { return }
            notices = result; error = nil
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            notices = nil; self.error = FutureNoticeError.message(error)
        }
    }
    func leave(_ notice: ReceivedFutureNotice) async {
        guard !isWorking else { return }
        generation += 1; let request = generation; isWorking = true; error = nil; notices = nil
        defer { if generation == request { isWorking = false } }
        do {
            try await service.leaveFutureNotice(publicID: notice.id, version: notice.version)
            let result = try await service.fetchReceivedFutureNotices()
            guard generation == request, !Task.isCancelled else { return }
            notices = result
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            self.error = FutureNoticeError.message(error)
        }
    }
    func suspend() { generation += 1; notices = nil; error = nil; isWorking = false }
}

@MainActor @Observable
final class FutureInvitationStore {
    private let service: any FutureNoticeServing
    private(set) var preview: FutureNoticePreview?
    private(set) var notice: ReceivedFutureNotice?
    private(set) var error: String?
    private(set) var isWorking = false
    private(set) var done = false
    private var generation = 0
    init(service: any FutureNoticeServing) { self.service = service }
    func refresh(token: String, signedIn: Bool) async {
        // Identity/scene changes invalidate all earlier reads, including a slow public lookup.
        suspend()
        let request = generation; isWorking = true
        defer { if generation == request { isWorking = false } }
        do {
            if signedIn {
                let result = try await service.reviewFutureNotice(token: token)
                guard generation == request, !Task.isCancelled else { return }
                notice = result; done = result.status == .acknowledged
            } else {
                let result = try await service.resolveFutureNotice(token: token)
                guard generation == request, !Task.isCancelled else { return }
                preview = result
            }
        } catch {
            guard generation == request, !Task.isCancelled else { return }
            self.error = FutureNoticeError.message(error)
        }
    }
    func respond(token: String, action: String) async {
        guard let notice, !isWorking, !done else { return }
        generation += 1; let request = generation; isWorking = true; error = nil
        defer { if generation == request { isWorking = false } }
        do {
            let result = try await service.respondFutureNotice(token: token, action: action, version: notice.version)
            guard generation == request, !Task.isCancelled else { return }
            guard result.publicId == notice.id, result.status.rawValue == (action == "acknowledge" ? "acknowledged" : "declined") else { throw FutureNoticeError.invalidResponse }
            done = true; self.notice = nil; preview = nil
        } catch {
            // A lost acknowledgement response is safe to resolve through a fresh, account-bound list.
            if action == "acknowledge", let current = try? await service.fetchReceivedFutureNotices(),
               generation == request, !Task.isCancelled, current.contains(where: { $0.id == notice.id }) {
                done = true; self.notice = nil; preview = nil
            } else if generation == request, !Task.isCancelled {
                self.notice = nil; self.error = FutureNoticeError.message(error)
            }
        }
    }
    func suspend() { generation += 1; preview = nil; notice = nil; error = nil; done = false; isWorking = false }
}
