import Foundation
import XCTest
@testable import Rillora

@MainActor
final class AccountIdentityTests: XCTestCase {
    private let firstID = "11111111-1111-4111-8111-111111111111"
    private let secondID = "22222222-2222-4222-8222-222222222222"

    func testIdentityDecodesVerifiedAccountAndPreservesUserText() throws {
        let data = Data(#"{"account":{"publicId":"11111111-1111-4111-8111-111111111111","displayName":"Name %@ 私人姓名","verifiedEmail":"owner@example.test"},"emailStatus":"available"}"#.utf8)
        let result = try JSONDecoder().decode(AccountIdentityResponse.self, from: data)
        XCTAssertEqual(result.account.displayName, "Name %@ 私人姓名")
        XCTAssertEqual(result.displayedEmail, "owner@example.test")
        XCTAssertTrue(result.belongs(to: firstID))
        XCTAssertFalse(result.belongs(to: secondID))
        XCTAssertFalse(result.belongs(to: "invalid"))
    }

    func testUnverifiedOrUnavailableEmailIsNeverPresented() {
        for status in [AccountIdentityResponse.EmailStatus.notProvided, .unavailable] {
            let result = response(id: firstID, email: "untrusted@example.test", status: status)
            XCTAssertNil(result.displayedEmail)
        }
        XCTAssertNil(response(id: firstID, email: "  ").displayedEmail)
        XCTAssertNil(response(id: firstID, email: nil).displayedEmail)
    }

    func testMalformedAccountIDNeverMatchesEvenAnotherMalformedID() {
        XCTAssertFalse(response(id: "invalid").belongs(to: "invalid"))
    }

    func testOpeningStoreDoesNotFetchOrUseAnAccountHint() async {
        let service = IdentityStub(result: response(id: firstID))
        let store = AccountIdentityStore()
        XCTAssertEqual(store.state, .idle)
        XCTAssertNil(store.identity(for: firstID))
        let calls = await service.calls
        XCTAssertEqual(calls, 0)
    }

    func testVerifiedResultIsBoundToTheCurrentAccountAndNotFetchedTwice() async {
        let expected = response(id: firstID)
        let service = IdentityStub(result: expected)
        let store = AccountIdentityStore()
        await store.load(plannerPublicID: firstID, service: service)
        XCTAssertEqual(store.identity(for: firstID), expected)
        XCTAssertNil(store.identity(for: secondID))
        await store.load(plannerPublicID: firstID, service: service)
        let calls = await service.calls
        XCTAssertEqual(calls, 1)
    }

    func testMismatchedResultRequiresAuthenticationAndPublishesNoIdentity() async {
        let service = IdentityStub(result: response(id: secondID))
        let store = AccountIdentityStore()
        await store.load(plannerPublicID: firstID, service: service)
        XCTAssertEqual(store.state, .authenticationRequired)
        XCTAssertNil(store.identity(for: firstID))
    }

    func testRevokedSessionIsDifferentFromAnUnavailableProvider() async {
        let service = IdentityStub(result: response(id: firstID))
        await service.setError(.server(status: 401, code: "authentication_required", message: "Private error", requestID: nil))
        let store = AccountIdentityStore()
        await store.load(plannerPublicID: firstID, service: service)
        XCTAssertEqual(store.state, .authenticationRequired)
        await service.setError(.requestFailed("Private provider diagnostic"))
        await store.load(plannerPublicID: firstID, service: service, force: true)
        XCTAssertEqual(store.state, .unavailable)
    }

    func testMissingServiceOrInvalidSessionCannotStartARead() async {
        let store = AccountIdentityStore()
        await store.load(plannerPublicID: firstID, service: nil)
        XCTAssertEqual(store.state, .unavailable)
        let service = IdentityStub(result: response(id: firstID))
        await store.load(plannerPublicID: "invalid", service: service)
        let calls = await service.calls
        XCTAssertEqual(calls, 0)
        XCTAssertEqual(store.state, .unavailable)
    }

    func testAccountSwitchDiscardsTheOldLateResponse() async {
        let service = SuspendedIdentityService()
        let store = AccountIdentityStore()
        let first = Task { await store.load(plannerPublicID: firstID, service: service) }
        await service.waitForRequests(1)
        let second = Task { await store.load(plannerPublicID: secondID, service: service) }
        await service.waitForRequests(2)
        let secondResponse = response(id: secondID, email: "second@example.test")
        await service.finish(1, with: secondResponse)
        await second.value
        await service.finish(0, with: response(id: firstID, email: "first@example.test"))
        await first.value
        XCTAssertEqual(store.identity(for: secondID), secondResponse)
        XCTAssertNil(store.identity(for: firstID))
    }

    func testClearOnLogoutDiscardsPrivateFieldsAndPendingResponses() async {
        let service = SuspendedIdentityService()
        let store = AccountIdentityStore()
        let task = Task { await store.load(plannerPublicID: firstID, service: service) }
        await service.waitForRequests(1)
        store.clear()
        await service.finish(0, with: response(id: firstID))
        await task.value
        XCTAssertNil(store.plannerPublicID)
        XCTAssertEqual(store.state, .idle)
        XCTAssertNil(store.identity(for: firstID))
    }

    func testNavigationCancellationDoesNotPublishALateResult() async {
        let service = SuspendedIdentityService()
        let store = AccountIdentityStore()
        let task = Task { await store.load(plannerPublicID: firstID, service: service) }
        await service.waitForRequests(1)
        task.cancel()
        store.cancelPendingLoad()
        await service.finish(0, with: response(id: firstID))
        await task.value
        XCTAssertEqual(store.state, .idle)
        XCTAssertNil(store.identity(for: firstID))
    }

    func testUnavailableEmailDoesNotHideTheAuthenticatedAccountName() async {
        let expected = response(id: firstID, email: nil, status: .unavailable)
        let store = AccountIdentityStore()
        await store.load(plannerPublicID: firstID, service: IdentityStub(result: expected))
        XCTAssertEqual(store.identity(for: firstID)?.account.displayName, "Synthetic account")
        XCTAssertNil(store.identity(for: firstID)?.displayedEmail)
    }

    func testAuxiliaryAuthenticationFailureClearsThePrivateOverview() {
        let overview = OverviewStore(service: IdentityTestOverviewService())
        overview.acceptAuthenticatedSnapshot(.testFixture)
        overview.invalidateAuthentication()
        XCTAssertEqual(overview.state, .signedOut)
        XCTAssertTrue(overview.requiresSignInAgain)
        XCTAssertFalse(overview.isRefreshing)
    }

    func testAPIClientFetchesIdentityThroughTheAuthenticatedReadOnlyEndpoint() async throws {
        let transport = IdentityTransport(responses: [
            "/v1/account/identity": .init(body: #"{"account":{"publicId":"11111111-1111-4111-8111-111111111111","displayName":"Name %@ 私人姓名","verifiedEmail":"owner@example.test"},"emailStatus":"available"}"#),
            "/v1/account/profile": .init(body: legacyProfileBody),
        ])
        let tokens = IdentitySessionTokenStore()
        let result = try await client(transport: transport, tokens: tokens).fetchAccountIdentity()

        XCTAssertEqual(result.account.publicId, firstID)
        XCTAssertEqual(result.account.displayName, "Name %@ 私人姓名")
        XCTAssertEqual(result.displayedEmail, "owner@example.test")
        XCTAssertEqual(result.emailStatus, .available)
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map { $0.url?.path }, ["/v1/account/identity"])
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.url?.absoluteString, "https://api.identity.example.test/v1/account/identity")
        assertAuthenticatedRead(request)
        let mutationCount = await tokens.mutationCount
        XCTAssertEqual(mutationCount, 0)
    }

    func testAPIClientFallsBackOnlyFrom404ToTheAuthenticatedCurrentProfile() async throws {
        let transport = IdentityTransport(responses: [
            "/v1/account/identity": .init(status: 404, body: #"{"error":{"code":"not_found","message":"Unavailable"}}"#),
            "/v1/account/profile": .init(body: legacyProfileBody),
        ])
        let tokens = IdentitySessionTokenStore()
        let result = try await client(transport: transport, tokens: tokens).fetchAccountIdentity()

        XCTAssertEqual(result.account.publicId, firstID)
        XCTAssertEqual(result.account.displayName, "Legacy %@ 私人姓名")
        XCTAssertNil(result.account.verifiedEmail)
        XCTAssertNil(result.displayedEmail)
        XCTAssertEqual(result.emailStatus, .unavailable)
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map { $0.url?.path }, ["/v1/account/identity", "/v1/account/profile"])
        for request in requests { assertAuthenticatedRead(request) }
        let mutationCount = await tokens.mutationCount
        XCTAssertEqual(mutationCount, 0)
    }

    func testAPIClientDoesNotFallBackAfterIdentityAuthenticationFailure() async throws {
        try await assertIdentityFailureDoesNotFallBack(status: 401, code: "authentication_required")
    }

    func testAPIClientDoesNotFallBackAfterIdentityPermissionFailure() async throws {
        try await assertIdentityFailureDoesNotFallBack(status: 403, code: "forbidden")
    }

    func testAPIClientDoesNotFallBackAfterIdentityServerFailure() async throws {
        try await assertIdentityFailureDoesNotFallBack(status: 500, code: "internal_error")
    }

    func testAPIClientDoesNotFallBackAfterMalformedIdentitySuccessResponse() async throws {
        for body in [
            "not JSON",
            #"{"account":{},"emailStatus":"available"}"#,
            #"{"account":{"publicId":"11111111-1111-4111-8111-111111111111","displayName":"Synthetic account","verifiedEmail":true},"emailStatus":"available"}"#,
            #"{"account":{"publicId":"11111111-1111-4111-8111-111111111111","displayName":"Synthetic account","verifiedEmail":null},"emailStatus":"unknown"}"#,
        ] {
            let transport = IdentityTransport(responses: [
                "/v1/account/identity": .init(body: body),
                "/v1/account/profile": .init(body: legacyProfileBody),
            ])
            let tokens = IdentitySessionTokenStore()
            do {
                _ = try await client(transport: transport, tokens: tokens).fetchAccountIdentity()
                XCTFail("Malformed identity data must not become a successful legacy fallback")
            } catch let error as RilloraAPIError {
                guard case .invalidPayload = error else {
                    return XCTFail("Expected invalidPayload, received \(error)")
                }
            }
            let requests = await transport.recordedRequests()
            XCTAssertEqual(requests.map { $0.url?.path }, ["/v1/account/identity"])
            let mutationCount = await tokens.mutationCount
            XCTAssertEqual(mutationCount, 0)
        }
    }

    private var legacyProfileBody: String {
        #"{"account":{"publicId":"11111111-1111-4111-8111-111111111111","displayName":"Legacy %@ 私人姓名","email":"unverified@example.test"},"billing":null}"#
    }

    private func client(transport: IdentityTransport, tokens: IdentitySessionTokenStore) throws -> APIClient {
        APIClient(configuration: APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "https://api.identity.example.test/v1")),
            developmentPlannerID: nil
        ), transport: transport, sessionTokenStore: tokens)
    }

    private func assertAuthenticatedRead(_ request: URLRequest) {
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer identity-fixture-token")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Cache-Control"), "no-store")
        XCTAssertEqual(request.value(forHTTPHeaderField: "x-rillora-client"), "ios")
        XCTAssertNil(request.value(forHTTPHeaderField: "x-dev-planner-id"))
        XCTAssertNil(request.url?.query)
        XCTAssertNil(request.httpBody)
    }

    private func assertIdentityFailureDoesNotFallBack(status: Int, code: String) async throws {
        let transport = IdentityTransport(responses: [
            "/v1/account/identity": .init(status: status, body: #"{"error":{"code":"\#(code)","message":"Synthetic failure"}}"#),
            "/v1/account/profile": .init(body: legacyProfileBody),
        ])
        let tokens = IdentitySessionTokenStore()
        do {
            _ = try await client(transport: transport, tokens: tokens).fetchAccountIdentity()
            XCTFail("Identity HTTP \(status) must propagate without a fallback")
        } catch {
            XCTAssertEqual(error as? RilloraAPIError, .server(
                status: status, code: code, message: "Synthetic failure", requestID: "identity-test-request"
            ))
        }
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map { $0.url?.path }, ["/v1/account/identity"])
        let mutationCount = await tokens.mutationCount
        XCTAssertEqual(mutationCount, 0)
    }

    private func response(id: String, email: String? = "owner@example.test", status: AccountIdentityResponse.EmailStatus = .available) -> AccountIdentityResponse {
        AccountIdentityResponse(account: .init(publicId: id, displayName: "Synthetic account", verifiedEmail: email), emailStatus: status)
    }
}

private actor IdentityStub: AccountIdentityServing {
    var calls = 0
    let result: AccountIdentityResponse
    var error: RilloraAPIError?
    init(result: AccountIdentityResponse) { self.result = result }
    func setError(_ error: RilloraAPIError?) { self.error = error }
    func fetchAccountIdentity() async throws -> AccountIdentityResponse {
        calls += 1
        if let error { throw error }
        return result
    }
}

private actor SuspendedIdentityService: AccountIdentityServing {
    private var requests: [CheckedContinuation<AccountIdentityResponse, Error>] = []
    func fetchAccountIdentity() async throws -> AccountIdentityResponse {
        try await withCheckedThrowingContinuation { requests.append($0) }
    }
    func waitForRequests(_ count: Int) async {
        while requests.count < count { await Task.yield() }
    }
    func finish(_ index: Int, with response: AccountIdentityResponse) { requests[index].resume(returning: response) }
}

private struct IdentityTestOverviewService: OverviewServing {
    func fetchOverview() async throws -> OverviewSnapshot { .testFixture }
}

private actor IdentitySessionTokenStore: SessionTokenStore {
    private(set) var mutationCount = 0
    func read() async throws -> String? { "identity-fixture-token" }
    func save(_ token: String) async throws { mutationCount += 1 }
    func delete() async throws { mutationCount += 1 }
}

/// In-process transport only: no URLSession or provider request is created by these tests.
private actor IdentityTransport: HTTPTransport {
    struct Response: Sendable {
        var status = 200
        let body: String
    }

    private let responses: [String: Response]
    private var requests: [URLRequest] = []

    init(responses: [String: Response]) { self.responses = responses }

    func send(_ request: URLRequest) async throws -> HTTPTransportResponse {
        requests.append(request)
        let url = try XCTUnwrap(request.url)
        let response = try XCTUnwrap(responses[url.path], "Unexpected identity transport route: \(url.path)")
        let httpResponse = try XCTUnwrap(HTTPURLResponse(
            url: url, statusCode: response.status, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json", "x-request-id": "identity-test-request"]
        ))
        return HTTPTransportResponse(data: Data(response.body.utf8), response: httpResponse)
    }

    func recordedRequests() -> [URLRequest] { requests }
}
