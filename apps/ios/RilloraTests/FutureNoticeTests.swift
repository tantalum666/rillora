import Foundation
import XCTest
@testable import Rillora

@MainActor
final class FutureNoticeTests: XCTestCase {
    private let id = "11111111-1111-4111-8111-111111111111"
    private let person = "22222222-2222-4222-8222-222222222222"
    private var token: String { String(repeating: "n", count: 43) }
    private var owner: String {
        #"{"publicId":"\#(id)","personPublicId":"\#(person)","emailHint":"n***@example.test","status":"pending","expiresAt":"2026-10-27T00:00:00Z","acknowledgedAt":null,"version":1,"purpose":"future_notice","contentAvailable":false}"#
    }
    private var received: String {
        #"{"publicId":"\#(id)","ownerName":"Synthetic planner","status":"pending","version":1,"purpose":"future_notice","contentAvailable":false}"#
    }
    private var preview: String {
        #"{"publicId":"\#(id)","status":"pending","expiresAt":"2026-10-27T00:00:00Z","purpose":"future_notice","contentAvailable":false}"#
    }
    private func client(_ transport: FutureTestTransport, enabled: Bool = true) -> APIClient {
        APIClient(configuration: APIConfiguration(baseURL: URL(string: "https://api.example.test/v1")!, developmentPlannerID: nil,
                                                   futureNoticesEnabled: enabled),
                  transport: transport, sessionTokenStore: FutureTestTokenStore())
    }
    func testNoticeFeatureIsOffByDefaultAndCannotEnableInClosedClient() async throws {
        let config = APIConfiguration(baseURL: URL(string: "https://api.example.test/v1")!, developmentPlannerID: nil)
        XCTAssertFalse(config.futureNoticesEnabled)
        XCTAssertFalse(APIConfiguration(baseURL: config.baseURL, developmentPlannerID: nil, customerAccessEnabled: false, futureNoticesEnabled: true).futureNoticesEnabled)
        let transport = FutureTestTransport()
        do { _ = try await client(transport, enabled: false).fetchReceivedFutureNotices(); XCTFail("Disabled feature must not call the server") }
        catch { XCTAssertTrue(error is FutureNoticeError) }
        let requests = await transport.requests
        XCTAssertTrue(requests.isEmpty)
    }
    func testOnlyExactTrustedFragmentInvitationIsAccepted() {
        let base = "https://app.rillora.xyz/future-invite"
        XCTAssertEqual(FutureNoticeLink.token(from: "\(base)?lang=zh-CN#invitation=\(token)"), token)
        for url in ["http://app.rillora.xyz/future-invite#invitation=\(token)",
                    "https://app.rillora.xyz.evil.test/future-invite#invitation=\(token)",
                    "https://user@app.rillora.xyz/future-invite#invitation=\(token)",
                    "\(base)?invitation=\(token)", "\(base)/other#invitation=\(token)",
                    "\(base)#invitation=\(token)&invitation=\(token)", "\(base)?returnTo=evil#invitation=\(token)"] {
            XCTAssertNil(FutureNoticeLink.token(from: url))
        }
    }
    func testDecodingRejectsContentFieldsAndOverstatedPermissionsAtEveryBoundary() throws {
        let decoder = JSONDecoder()
        XCTAssertEqual(try decoder.decode(FutureNotice.self, from: Data(owner.utf8)).personPublicId, person)
        XCTAssertEqual(try decoder.decode(ReceivedFutureNotice.self, from: Data(received.utf8)).ownerName, "Synthetic planner")
        for extra in [#","matters":[{"title":"Private"}]"#, #","grants":[]"#, #","key":"not-a-real-key""#] {
            for body in [owner, received, preview] {
                let data = Data((String(body.dropLast()) + extra + "}").utf8)
                if body == owner { XCTAssertThrowsError(try decoder.decode(FutureNotice.self, from: data)) }
                else if body == received { XCTAssertThrowsError(try decoder.decode(ReceivedFutureNotice.self, from: data)) }
                else { XCTAssertThrowsError(try decoder.decode(FutureNoticePreview.self, from: data)) }
            }
        }
        XCTAssertThrowsError(try decoder.decode(ReceivedFutureNotice.self, from: Data(received.replacingOccurrences(of: "false", with: "true").utf8)))
        XCTAssertThrowsError(try decoder.decode(FutureNoticePreview.self, from: Data(received.utf8)))
        XCTAssertThrowsError(try decoder.decode(FutureNoticeList.self, from: Data(#"{"notices":[\#(received)],"contentAvailable":false}"#.utf8)))
        let accepted = received.replacingOccurrences(of: "pending", with: "acknowledged")
        XCTAssertThrowsError(try decoder.decode(FutureNoticeList.self, from: Data(#"{"notices":[\#(accepted),\#(accepted)],"contentAvailable":false}"#.utf8)))
    }
    func testNativeRequestUsesNoGrantAndKeepsAnonymousResolutionFreeOfSessionHeaders() async throws {
        let transport = FutureTestTransport(responses: [
            "/v1/future-notices": #"{"notice":\#(owner),"invitationUrl":"https://app.rillora.xyz/future-invite#invitation=\#(token)"}"#,
            "/future-notices/invitations/resolve": #"{"notice":\#(preview)}"#,
            "/v1/future-notices/invitations/review": #"{"notice":\#(received)}"#,
            "/v1/future-notices/\(id)": #"{"notice":\#(owner.replacingOccurrences(of: "pending", with: "revoked"))}"#
        ])
        let api = client(transport)
        _ = try await api.createFutureNotice(personID: person, email: "notice@example.test")
        _ = try await api.resolveFutureNotice(token: token)
        _ = try await api.reviewFutureNotice(token: token)
        _ = try await api.revokeFutureNotice(publicID: id, version: 3)
        let requests = await transport.requests
        let created = try XCTUnwrap(try JSONSerialization.jsonObject(with: XCTUnwrap(requests[0].httpBody)) as? [String: Any])
        XCTAssertEqual(Set(created.keys), ["personPublicId", "email", "acknowledgedNoAccess"])
        XCTAssertEqual(created["acknowledgedNoAccess"] as? Bool, true)
        XCTAssertNil(requests[1].value(forHTTPHeaderField: "Authorization"))
        XCTAssertNil(requests[1].value(forHTTPHeaderField: "X-Dev-Planner-Id"))
        XCTAssertNotNil(requests[2].value(forHTTPHeaderField: "Authorization"))
        XCTAssertEqual(requests[3].value(forHTTPHeaderField: "If-Match"), "3")
        XCTAssertTrue(requests.allSatisfy { $0.url?.query == nil && $0.url?.fragment == nil })
    }
    func testOwnerCreatesRotatesAndRevokesWithoutPersistingInvitationAfterSuspend() async throws {
        let transport = FutureTestTransport(responses: [
            "/v1/future-notices/people/\(person)": #"{"notice":null}"#,
            "/v1/future-notices": #"{"notice":\#(owner),"invitationUrl":"https://app.rillora.xyz/future-invite#invitation=\#(token)"}"#,
            "/v1/future-notices/\(id)/link": #"{"notice":\#(owner.replacingOccurrences(of: "\"version\":1", with: "\"version\":2")),"invitationUrl":"https://app.rillora.xyz/future-invite#invitation=\#(String(repeating: "r", count: 43))"}"#,
            "/v1/future-notices/\(id)": #"{"notice":\#(owner.replacingOccurrences(of: "pending", with: "revoked"))}"#
        ])
        let store = FutureNoticeStore(personID: person, service: client(transport))
        store.email = "notice@example.test"
        XCTAssertFalse(store.canCreate)
        await store.refresh()
        XCTAssertTrue(store.canCreate)
        await store.change(.create)
        XCTAssertNotNil(store.invitationURL)
        XCTAssertFalse(store.hasDraft)
        await store.change(.regenerate)
        XCTAssertEqual(store.notice?.version, 2)
        await store.change(.revoke)
        XCTAssertEqual(store.notice?.status, .revoked)
        XCTAssertNil(store.invitationURL)
        store.suspend()
        XCTAssertNil(store.notice)
    }
    func testOldIdentityResponseCannotRestoreNoticeAfterAccountSwitch() async throws {
        let service = DeferredFutureService()
        let store = FutureInvitationStore(service: service)
        let old = Task { await store.refresh(token: token, signedIn: true) }
        await service.waitForReview()
        store.suspend()
        let result = try JSONDecoder().decode(ReceivedFutureNotice.self, from: Data(received.utf8))
        await service.finish(result)
        await old.value
        XCTAssertNil(store.notice)
        XCTAssertFalse(store.isWorking)
        XCTAssertFalse(store.done)
    }
    func testResponseDoesNotCreateReadAccessAndInboxClearsOnFailure() async throws {
        let decision = #"{"result":{"publicId":"\#(id)","status":"acknowledged","version":2,"contentAvailable":false}}"#
        let transport = FutureTestTransport(responses: [
            "/v1/future-notices/invitations/review": #"{"notice":\#(received)}"#,
            "/v1/future-notices/invitations/respond": decision,
            "/v1/future-notices/received": #"{"notices":[\#(received.replacingOccurrences(of: "pending", with: "acknowledged"))],"contentAvailable":false}"#,
            "/v1/future-notices/received/\(id)": #"{"left":true,"contentAvailable":false}"#
        ])
        let api = client(transport), store = FutureInvitationStore(service: client(transport))
        await store.refresh(token: token, signedIn: true)
        await store.respond(token: token, action: "acknowledge")
        XCTAssertTrue(store.done)
        XCTAssertNil(store.notice)
        let inbox = FutureNoticesInboxStore(service: api)
        await inbox.refresh()
        XCTAssertEqual(inbox.notices?.count, 1)
        await transport.fail()
        await inbox.refresh()
        XCTAssertNil(inbox.notices)
        XCTAssertNotNil(inbox.error)
        let requests = await transport.requests
        XCTAssertTrue(requests.allSatisfy { !$0.url!.path.contains("sharing/") && !$0.url!.path.contains("matters") })
    }
}

private actor FutureTestTokenStore: SessionTokenStore {
    func read() async throws -> String? { String(repeating: "s", count: 43) }
    func save(_ token: String) async throws {}
    func delete() async throws {}
}
private actor FutureTestTransport: HTTPTransport {
    let responses: [String: String]
    private(set) var requests: [URLRequest] = []
    var failing = false
    init(responses: [String: String] = [:]) { self.responses = responses }
    func fail() { failing = true }
    func send(_ request: URLRequest) async throws -> HTTPTransportResponse {
        requests.append(request)
        let url = try XCTUnwrap(request.url)
        let body = failing ? nil : responses[url.path]
        return HTTPTransportResponse(data: Data((body ?? #"{"error":{"code":"not_found","message":"Unavailable"}}"#).utf8),
            response: try XCTUnwrap(HTTPURLResponse(url: url, statusCode: body == nil ? 404 : 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])))
    }
}
private actor DeferredFutureService: FutureNoticeServing {
    nonisolated let futureNoticesEnabled = true
    private var continuation: CheckedContinuation<ReceivedFutureNotice, Error>?
    private var waiting: CheckedContinuation<Void, Never>?
    func reviewFutureNotice(token: String) async throws -> ReceivedFutureNotice {
        try await withCheckedThrowingContinuation { continuation = $0; waiting?.resume(); waiting = nil }
    }
    func waitForReview() async {
        if continuation != nil { return }
        await withCheckedContinuation { waiting = $0 }
    }
    func finish(_ result: ReceivedFutureNotice) { continuation?.resume(returning: result); continuation = nil }
    func fetchFutureNotice(personID: String) async throws -> FutureNotice? { throw FutureNoticeError.unavailable }
    func createFutureNotice(personID: String, email: String) async throws -> FutureNoticeMutation { throw FutureNoticeError.unavailable }
    func regenerateFutureNotice(publicID: String, version: Int) async throws -> FutureNoticeMutation { throw FutureNoticeError.unavailable }
    func revokeFutureNotice(publicID: String, version: Int) async throws -> FutureNoticeMutation { throw FutureNoticeError.unavailable }
    func resolveFutureNotice(token: String) async throws -> FutureNoticePreview { throw FutureNoticeError.unavailable }
    func respondFutureNotice(token: String, action: String, version: Int) async throws -> FutureNoticeDecision { throw FutureNoticeError.unavailable }
    func fetchReceivedFutureNotices() async throws -> [ReceivedFutureNotice] { throw FutureNoticeError.unavailable }
    func leaveFutureNotice(publicID: String, version: Int) async throws { throw FutureNoticeError.unavailable }
}
