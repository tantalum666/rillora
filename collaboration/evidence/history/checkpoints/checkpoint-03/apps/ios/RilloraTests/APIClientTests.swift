import Foundation
import XCTest
@testable import Rillora

final class APIClientTests: XCTestCase {
    func testAppleReviewTransportUsesItsOwnRouteAndRejectsProductionAcknowledgement() async throws {
        let receipt = #"{"contractVersion":"commerce-apple-review-v1","environment":"sandbox","validationOnly":true,"result":{"accepted":true,"status":"applied","finishAuthorized":true,"authoritativeSnapshotLoaded":true,"entitlementChanged":true}}"#
        let path = "/v1/commerce/storekit/review/transactions"
        let transport = StubTransport(responses: [path: .init(body: receipt)])
        let configuration = APIConfiguration(baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")), developmentPlannerID: nil)
        let client = APIClient(configuration: configuration, transport: transport)
        let evidence = StoreKitTransactionEvidence(transactionID: 100, originalTransactionID: 100,
            productID: RilloraStoreKitCatalog.familyAnnualProductID,
            subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            appAccountToken: UUID(), environment: "Sandbox", storefrontCountryCode: "USA",
            purchaseDate: .now, expirationDate: .now.addingTimeInterval(3600), revocationDate: nil,
            transactionReason: "PURCHASE", signedTransaction: "synthetic.review.fixture", isXcodeEnvironment: false)
        let response = try await client.submitAppleTransaction(evidence, environment: .sandbox)
        XCTAssertTrue(response.isValid(for: .sandbox))
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.first?.url?.path, path)
        XCTAssertEqual(requests.first?.httpMethod, "POST")
        let production = receipt.replacingOccurrences(of: "commerce-apple-review-v1", with: "commerce-apple-production-v1")
            .replacingOccurrences(of: "sandbox", with: "production").replacingOccurrences(of: "\"validationOnly\":true", with: "\"validationOnly\":false")
        let wrong = APIClient(configuration: configuration, transport: StubTransport(responses: [path: .init(body: production)]))
        do { _ = try await wrong.submitAppleTransaction(evidence, environment: .sandbox); XCTFail("Cross-environment acknowledgement must fail") }
        catch let error as RilloraAPIError { XCTAssertEqual(error.localizedDescription, RilloraAPIError.invalidResponse.localizedDescription) }
    }

    func testEmailVerificationKeepsTheNativeSessionAndSendsNoClientIdentityClaim() async throws {
        let token = String(repeating: "v", count: 43)
        let store = StubSessionTokenStore(token: token)
        let transport = StubTransport(responses: ["/v1/sharing/email-verification": .init(body: #"{"verified":true}"#)])
        let client = APIClient(configuration: APIConfiguration(baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")), developmentPlannerID: nil), transport: transport, sessionTokenStore: store)
        let verified = try await client.checkEmailVerification()
        XCTAssertTrue(verified)
        let savedToken = try await store.read()
        XCTAssertEqual(savedToken, token)
        let requests = await transport.recordedRequests()
        let sent = try XCTUnwrap(requests.first)
        XCTAssertEqual(sent.httpMethod, "POST")
        XCTAssertEqual(sent.value(forHTTPHeaderField: "Authorization"), "Bearer \(token)")
        XCTAssertEqual(String(data: try XCTUnwrap(sent.httpBody), encoding: .utf8), "{}")
    }

    func testEmailVerificationRejectsUnprovenProviderState() async throws {
        for body in [#"{"verified":false}"#, #"{"verified":"true"}"#] {
            let client = APIClient(configuration: APIConfiguration(baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")), developmentPlannerID: nil), transport: StubTransport(responses: ["/v1/sharing/email-verification": .init(body: body)]))
            do { let verified = try await client.checkEmailVerification(); XCTAssertFalse(verified) }
            catch { XCTAssertEqual(body, #"{"verified":"true"}"#) }
        }
    }
    func testValidationReceiptCannotClaimChangedAccessBeforeAuthoritativeAcknowledgement() {
        func receipt(verified: Bool) -> StoreKitSandboxTransactionResponse {
            StoreKitSandboxTransactionResponse(contractVersion: "commerce-storekit-sandbox-v2",
                result: StoreKitSandboxTransactionResult(validationOnly: true, accepted: true,
                    status: verified ? "applied" : "needs_authoritative_snapshot", providerEventReference: "synthetic-validation-receipt",
                    finishAuthorized: verified, authoritativeSnapshotLoaded: verified, entitlementChanged: true, sandboxOnly: true),
                boundaries: StoreKitSandboxTransactionBoundaries(validationOnly: true, sandboxOnly: true, serverAuthoritative: true,
                    authoritativeSnapshotLoaded: verified, transactionFinishAuthorized: verified,
                    entitlementMutationEnabled: true, purchaseRouteEnabled: false))
        }
        XCTAssertFalse(receipt(verified: false).preservesSafetyBoundary)
        XCTAssertTrue(receipt(verified: true).preservesSafetyBoundary)
    }
    func testSharingRolloutFallbackDoesNotSwallowAuthenticationFailure() async throws {
        let configuration = APIConfiguration(baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")), developmentPlannerID: nil)
        let old = APIClient(configuration: configuration, transport: StubTransport(responses: [:], fallback: .init(status: 404,
            body: #"{"error":{"code":"not_found","message":"Unavailable"}}"#)))
        let allowance = try await old.fetchSharingAllowance()
        XCTAssertNil(allowance)
        let denied = APIClient(configuration: configuration, transport: StubTransport(responses: [:], fallback: .init(status: 401,
            body: #"{"error":{"code":"authentication_required","message":"Sign in"}}"#)))
        do { _ = try await denied.fetchSharingAllowance(); XCTFail("Expected sign-in failure") }
        catch let error as RilloraAPIError { XCTAssertTrue(error.isAuthenticationRequired) }
    }
    func testLegalLinksUseThePublicCustomDomain() {
        XCTAssertEqual(
            RilloraLegalURLs.terms.absoluteString,
            "https://legal.rillora.xyz/terms"
        )
        XCTAssertEqual(
            RilloraLegalURLs.privacy.absoluteString,
            "https://legal.rillora.xyz/privacy"
        )
    }

    func testNativeSessionExchangeCarriesTheExactAffirmativeLegalProof() throws {
        let data = try Auth0NativeAuthenticationService.sessionExchangeBody(
            legalAcceptance: .current
        )
        let payload = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )
        let acceptance = try XCTUnwrap(payload["legalAcceptance"] as? [String: Any])
        XCTAssertEqual(
            acceptance["termsVersion"] as? String,
            "terms-2026-08-27-1"
        )
        XCTAssertEqual(
            acceptance["privacyVersion"] as? String,
            "privacy-2026-09-15-1"
        )
        XCTAssertEqual(
            acceptance["consentTextVersion"] as? String,
            "registration-clickwrap-2026-08-24-1"
        )
        XCTAssertEqual(
            acceptance["bundleSha256"] as? String,
            "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602"
        )
        XCTAssertEqual(acceptance["acceptedTerms"] as? Bool, true)
        XCTAssertEqual(acceptance["acknowledgedPrivacy"] as? Bool, true)
        XCTAssertEqual(acceptance["acceptedElectronicRecords"] as? Bool, true)
    }

    func testNativeAuthenticationIntentKeepsEmailAndGoogleRoutesDistinct() {
        XCTAssertEqual(
            Auth0NativeAuthenticationService.authorizationParameters(for: .signIn),
            ["prompt": "login", "rillora_auth_ui": "single-hosted-v1"]
        )
        XCTAssertEqual(
            Auth0NativeAuthenticationService.authorizationParameters(for: .createAccount),
            ["prompt": "login", "screen_hint": "signup", "rillora_auth_ui": "single-hosted-v1"]
        )
        XCTAssertEqual(
            Auth0NativeAuthenticationService.authorizationParameters(for: .google),
            ["prompt": "login", "connection": "google-oauth2", "rillora_auth_ui": "single-hosted-v1"]
        )
        XCTAssertEqual(
            Auth0NativeAuthenticationService.authorizationParameters(
                for: .signIn,
                loginHint: "  Person@Example.com  "
            ),
            ["prompt": "login", "login_hint": "Person@Example.com", "rillora_auth_ui": "single-hosted-v1"]
        )
    }

    func testAppleSignInFeatureGateDefaultsClosed() throws {
        let bundle = Bundle(for: APIClientTests.self)
        let configuration = try NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: [
                "RILLORA_AUTH0_DOMAIN": "login.example.test",
                "RILLORA_AUTH0_CLIENT_ID": "client-id",
                "RILLORA_AUTH0_AUDIENCE": "urn:example:api",
                "RILLORA_NATIVE_SESSION_URL": "https://api.example.test/auth/native/session",
            ]
        )

        XCTAssertEqual(configuration?.appleNativeSignInEnabled, false)
        XCTAssertEqual(configuration?.googleNativeSignInEnabled, false)
        XCTAssertNil(configuration?.googleIOSClientID)
        XCTAssertNil(configuration?.googleServerClientID)
        XCTAssertEqual(configuration?.passkeyNativeSignInEnabled, false)
    }

    func testAppleSignInFeatureGateRequiresExplicitEnablement() throws {
        let bundle = Bundle(for: APIClientTests.self)
        let configuration = try NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: [
                "RILLORA_AUTH0_DOMAIN": "login.example.test",
                "RILLORA_AUTH0_CLIENT_ID": "client-id",
                "RILLORA_AUTH0_AUDIENCE": "urn:example:api",
                "RILLORA_NATIVE_SESSION_URL": "https://api.example.test/auth/native/session",
                "RILLORA_APPLE_SIGN_IN_ENABLED": "true",
            ]
        )

        XCTAssertEqual(configuration?.appleNativeSignInEnabled, true)
    }

    func testNativeGoogleRequiresBothOAuthClientIdentifiersBeforeEnablement() throws {
        XCTAssertEqual(
            Auth0NativeAuthenticationService.googleSubjectTokenType,
            "http://auth0.com/oauth/token-type/google-id-token"
        )
        let bundle = Bundle(for: APIClientTests.self)
        let baseEnvironment = [
            "RILLORA_AUTH0_DOMAIN": "login.example.test",
            "RILLORA_AUTH0_CLIENT_ID": "auth0-native-client",
            "RILLORA_AUTH0_AUDIENCE": "urn:example:api",
            "RILLORA_NATIVE_SESSION_URL": "https://api.example.test/auth/native/session",
            "RILLORA_GOOGLE_NATIVE_SIGN_IN_ENABLED": "true",
            "RILLORA_GOOGLE_IOS_CLIENT_ID": "google-ios-client",
        ]

        XCTAssertThrowsError(try NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: baseEnvironment
        )) { error in
            XCTAssertEqual(error as? APIConfigurationError, .incompleteNativeAuthentication)
        }

        var completeEnvironment = baseEnvironment
        completeEnvironment["RILLORA_GOOGLE_SERVER_CLIENT_ID"] = "google-server-client"
        let configuration = try XCTUnwrap(NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: completeEnvironment
        ))
        XCTAssertTrue(configuration.googleNativeSignInEnabled)
        XCTAssertEqual(configuration.googleIOSClientID, "google-ios-client")
        XCTAssertEqual(configuration.googleServerClientID, "google-server-client")
    }

    func testNativePasskeyRequiresExplicitEnablement() throws {
        let bundle = Bundle(for: APIClientTests.self)
        let configuration = try XCTUnwrap(NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: [
                "RILLORA_AUTH0_DOMAIN": "login.example.test",
                "RILLORA_AUTH0_CLIENT_ID": "client-id",
                "RILLORA_AUTH0_AUDIENCE": "urn:example:api",
                "RILLORA_NATIVE_SESSION_URL": "https://api.example.test/auth/native/session",
                "RILLORA_PASSKEY_NATIVE_SIGN_IN_ENABLED": "yes",
            ]
        ))
        XCTAssertTrue(configuration.passkeyNativeSignInEnabled)
    }

    func testFetchOverviewUsesDevelopmentIdentityAndDecodesSharedContract() async throws {
        let transport = StubTransport(responses: Fixtures.successResponses)
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let overview = try await client.fetchOverview()

        XCTAssertEqual(overview.session.authenticationMode, "development")
        XCTAssertEqual(overview.readyCount, 3)
        XCTAssertEqual(overview.progressTotal, 5)
        XCTAssertEqual(overview.nextMatter?.title, "Insurance")
        XCTAssertEqual(overview.primaryTrustedContact?.displayName, "Maya Chen")
        XCTAssertEqual(overview.primaryTrustedContact?.hasSimulatedAcceptance, true)
        XCTAssertEqual(overview.primaryTrustedContact?.hasAcceptedInvitation, false)
        XCTAssertEqual(overview.primaryTrustedContact?.evidenceLabel, "Simulated acceptance")

        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.count, 1)
        XCTAssertTrue(requests.allSatisfy {
            $0.value(forHTTPHeaderField: "x-dev-planner-id") == Fixtures.plannerID
        })
        XCTAssertTrue(requests.allSatisfy {
            $0.value(forHTTPHeaderField: "x-rillora-client") == "ios"
        })
        XCTAssertEqual(
            Set(requests.compactMap(\.url?.path)),
            Set(["/v1/overview"])
        )
    }

    func testAuthenticationFailureIsPreservedForTheUI() async throws {
        let transport = StubTransport(responses: [:], fallback: .init(
            status: 401,
            body: #"{"error":{"code":"authentication_required","message":"Authentication is required."}}"#
        ))
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
            developmentPlannerID: nil
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.fetchOverview()
            XCTFail("Expected authentication failure")
        } catch let error as RilloraAPIError {
            XCTAssertTrue(error.isAuthenticationRequired)
            XCTAssertEqual(error.localizedDescription, "Authentication is required.")
        }
    }

    func testFetchOverviewUsesKeychainBackedBearerWhenDevelopmentIdentityIsDisabled() async throws {
        let transport = StubTransport(responses: Fixtures.successResponses)
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: nil
        )
        let tokenStore = StubSessionTokenStore(token: String(repeating: "n", count: 43))
        let client = APIClient(
            configuration: configuration,
            transport: transport,
            sessionTokenStore: tokenStore
        )

        _ = try await client.fetchOverview()

        let requests = await transport.recordedRequests()
        XCTAssertTrue(requests.allSatisfy {
            $0.value(forHTTPHeaderField: "Authorization")
                == "Bearer \(String(repeating: "n", count: 43))"
        })
        XCTAssertTrue(requests.allSatisfy {
            $0.value(forHTTPHeaderField: "x-dev-planner-id") == nil
        })
    }

    func testLocalSessionPresenceUsesOnlyExplicitDevelopmentOrStoredBearerState() async throws {
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
            developmentPlannerID: nil
        )
        let signedOutTransport = StubTransport(responses: [:])
        let signedOutClient = APIClient(
            configuration: configuration,
            transport: signedOutTransport,
            sessionTokenStore: StubSessionTokenStore(token: nil)
        )

        let hasSignedOutSession = try await signedOutClient.hasLocalSession()
        let signedOutRequests = await signedOutTransport.recordedRequests()
        XCTAssertFalse(hasSignedOutSession)
        XCTAssertTrue(signedOutRequests.isEmpty)

        let signedInClient = APIClient(
            configuration: configuration,
            transport: StubTransport(responses: [:]),
            sessionTokenStore: StubSessionTokenStore(token: String(repeating: "s", count: 43))
        )
        let hasSignedInSession = try await signedInClient.hasLocalSession()
        XCTAssertTrue(hasSignedInSession)

        let developmentClient = APIClient(
            configuration: APIConfiguration(
                baseURL: configuration.baseURL,
                developmentPlannerID: Fixtures.plannerID
            ),
            transport: StubTransport(responses: [:])
        )
        let hasDevelopmentSession = try await developmentClient.hasLocalSession()
        XCTAssertTrue(hasDevelopmentSession)
    }

    func testUpdateMatterSendsOptimisticVersionAndExplicitNulls() async throws {
        let transport = StubTransport(responses: [
            "/v1/matters/30000000-0000-4000-8000-000000000004": .init(
                body: Fixtures.updatedMatterEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)
        let update = MatterUpdateRequest(
            expectedVersion: 1,
            category: "document",
            title: "Insurance",
            institutionName: nil,
            accountHint: nil,
            valueBand: "unknown",
            currencyCode: nil,
            locationHint: "Blue folder",
            importance: "critical",
            desiredOutcome: "notify",
            status: "ready"
        )

        let saved = try await client.updateMatter(
            publicID: "30000000-0000-4000-8000-000000000004",
            request: update
        )

        XCTAssertEqual(saved.version, 2)
        XCTAssertEqual(saved.status, "ready")
        let requests = await transport.recordedRequests()
        let recorded = try XCTUnwrap(requests.first)
        XCTAssertEqual(recorded.httpMethod, "PATCH")
        XCTAssertEqual(recorded.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(recorded.value(forHTTPHeaderField: "x-dev-planner-id"), Fixtures.plannerID)
        let body = try XCTUnwrap(recorded.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["expectedVersion"] as? Int, 1)
        XCTAssertTrue(json["institutionName"] is NSNull)
        XCTAssertTrue(json["accountHint"] is NSNull)
        XCTAssertTrue(json["currencyCode"] is NSNull)
    }

    func testMatterVersionConflictIsPreservedForRecoveryUI() async throws {
        let transport = StubTransport(responses: [:], fallback: .init(
            status: 409,
            body: #"{"error":{"code":"version_conflict","message":"The record changed. Refresh and try again."}}"#
        ))
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
            developmentPlannerID: nil
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.updateMatter(
                publicID: "30000000-0000-4000-8000-000000000004",
                request: Fixtures.updateRequest
            )
            XCTFail("Expected a version conflict")
        } catch let error as RilloraAPIError {
            XCTAssertTrue(error.isVersionConflict)
        }
    }

    func testCreateAndArchiveMatterUseTheSharedMutationContract() async throws {
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let createTransport = StubTransport(responses: [
            "/v1/matters": .init(status: 201, body: Fixtures.createdMatterEnvelope),
        ])
        let createClient = APIClient(configuration: configuration, transport: createTransport)

        let created = try await createClient.createMatter(request: Fixtures.createRequest)

        XCTAssertEqual(created.title, "Emergency fund")
        let createRequests = await createTransport.recordedRequests()
        let createRequest = try XCTUnwrap(createRequests.first)
        XCTAssertEqual(createRequest.httpMethod, "POST")
        XCTAssertEqual(createRequest.value(forHTTPHeaderField: "x-dev-planner-id"), Fixtures.plannerID)

        let archiveTransport = StubTransport(
            responses: [:],
            fallback: .init(status: 204, body: "")
        )
        let archiveClient = APIClient(configuration: configuration, transport: archiveTransport)

        try await archiveClient.archiveMatter(publicID: created.publicId, expectedVersion: 1)

        let archiveRequests = await archiveTransport.recordedRequests()
        let archiveRequest = try XCTUnwrap(archiveRequests.first)
        XCTAssertEqual(archiveRequest.httpMethod, "DELETE")
        XCTAssertEqual(archiveRequest.value(forHTTPHeaderField: "If-Match"), "1")
    }

    func testCreateAndRevokeTrustedContactUseExplicitEvidenceContract() async throws {
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let createTransport = StubTransport(responses: [
            "/v1/trusted-contacts": .init(
                status: 201,
                body: Fixtures.createdTrustedContactEnvelope
            ),
        ])
        let createClient = APIClient(configuration: configuration, transport: createTransport)

        let created = try await createClient.createTrustedContact(
            request: TrustedContactCreateRequest(
                displayName: "Avery Stone",
                relationshipLabel: nil
            )
        )

        XCTAssertEqual(created.roleStatus, "draft")
        XCTAssertEqual(created.invitationStatus, nil)
        XCTAssertEqual(created.evidenceLabel, "Record only — no invitation sent")
        let createRequests = await createTransport.recordedRequests()
        let createRequest = try XCTUnwrap(createRequests.first)
        XCTAssertEqual(createRequest.httpMethod, "POST")
        let createBody = try XCTUnwrap(createRequest.httpBody)
        let createJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: createBody) as? [String: Any]
        )
        XCTAssertTrue(createJSON["relationshipLabel"] is NSNull)

        let revokeTransport = StubTransport(responses: [
            "/v1/trusted-contacts/55555555-5555-4555-8555-555555555555": .init(
                body: Fixtures.revokedTrustedContactEnvelope
            ),
        ])
        let revokeClient = APIClient(configuration: configuration, transport: revokeTransport)

        let revoked = try await revokeClient.updateTrustedContact(
            publicID: created.publicId,
            request: TrustedContactUpdateRequest(
                expectedVersion: 1,
                displayName: created.displayName,
                relationshipLabel: created.relationshipLabel,
                status: "revoked"
            )
        )

        XCTAssertEqual(revoked.status, "revoked")
        XCTAssertEqual(revoked.roleStatus, "revoked")
        XCTAssertEqual(revoked.invitationStatus, "revoked")
        XCTAssertEqual(revoked.evidenceLabel, "Role revoked")
        let revokeRequests = await revokeTransport.recordedRequests()
        let revokeRequest = try XCTUnwrap(revokeRequests.first)
        XCTAssertEqual(revokeRequest.httpMethod, "PATCH")
        let revokeBody = try XCTUnwrap(revokeRequest.httpBody)
        let revokeJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: revokeBody) as? [String: Any]
        )
        XCTAssertEqual(revokeJSON["expectedVersion"] as? Int, 1)
        XCTAssertEqual(revokeJSON["status"] as? String, "revoked")
    }

    func testFetchAndUpdateOfficialSetupUseSelfReportedContract() async throws {
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let fetchTransport = StubTransport(responses: [
            "/v1/official-setup-checks": .init(body: Fixtures.officialSetupChecksEnvelope),
        ])
        let fetchClient = APIClient(configuration: configuration, transport: fetchTransport)

        let checks = try await fetchClient.fetchOfficialSetupChecks()

        XCTAssertEqual(checks.count, 2)
        XCTAssertEqual(checks.first?.providerName, "Apple")
        XCTAssertEqual(checks.first?.completed, false)

        let updateTransport = StubTransport(responses: [
            "/v1/official-setup-checks/66666666-6666-4666-8666-666666666666": .init(
                body: Fixtures.officialSetupMutationEnvelope
            ),
        ])
        let updateClient = APIClient(configuration: configuration, transport: updateTransport)

        let saved = try await updateClient.updateOfficialSetupCheck(
            publicID: "66666666-6666-4666-8666-666666666666",
            request: OfficialSetupCheckUpdateRequest(expectedVersion: 1, completed: true)
        )

        XCTAssertTrue(saved.completed)
        XCTAssertEqual(saved.version, 2)
        let requests = await updateTransport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.httpMethod, "PATCH")
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["expectedVersion"] as? Int, 1)
        XCTAssertEqual(json["completed"] as? Bool, true)
    }

    func testOfficialSetupRejectsEvidenceThatIsNotSelfReported() async throws {
        let transport = StubTransport(responses: [
            "/v1/official-setup-checks/66666666-6666-4666-8666-666666666666": .init(
                body: Fixtures.unverifiedOfficialSetupMutationEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.updateOfficialSetupCheck(
                publicID: "66666666-6666-4666-8666-666666666666",
                request: OfficialSetupCheckUpdateRequest(expectedVersion: 1, completed: true)
            )
            XCTFail("Expected an invalid evidence failure")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }

    func testRunSimulationSendsOneDistinctLifeEventAndDecodesSafeResult() async throws {
        let transport = StubTransport(responses: [
            "/v1/simulations": .init(status: 201, body: Fixtures.simulationEnvelope),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let simulation = try await client.runSimulation(
            request: ClaimSimulationCreateRequest(lifeEvent: .missing)
        )

        XCTAssertEqual(simulation.lifeEvent, .missing)
        XCTAssertTrue(simulation.simulationOnly)
        XCTAssertFalse(simulation.notificationsSent)
        XCTAssertFalse(simulation.dataReleased)
        XCTAssertFalse(simulation.snapshot.operative)
        let requests = await transport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.httpMethod, "POST")
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["lifeEvent"] as? String, "missing")
    }

    func testRunSimulationRejectsAnyOperativeResponse() async throws {
        let transport = StubTransport(responses: [
            "/v1/simulations": .init(
                status: 201,
                body: Fixtures.unsafeSimulationEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.runSimulation(
                request: ClaimSimulationCreateRequest(lifeEvent: .death)
            )
            XCTFail("Expected an invalid non-operative boundary")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }

    func testDisclosureRehearsalUsesVersionedSimulationOnlyMutations() async throws {
        let publicID = "99999999-9999-4999-8999-999999999999"
        let transport = StubTransport(responses: [
            "/v1/disclosure-rehearsals": .init(
                status: 201,
                body: Fixtures.disclosureRehearsalEnvelope
            ),
            "/v1/disclosure-rehearsals/\(publicID)/actions": .init(
                body: Fixtures.disclosureRehearsalEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let created = try await client.createDisclosureRehearsal(
            request: DisclosureRehearsalCreateRequest(lifeEvent: .death)
        )
        _ = try await client.updateDisclosureRehearsal(
            publicID: created.publicId,
            request: DisclosureRehearsalActionRequest(
                expectedVersion: created.version,
                action: .advance
            )
        )

        XCTAssertTrue(created.preservesSafetyBoundary)
        XCTAssertFalse(created.boundaries.notificationsSent)
        XCTAssertFalse(created.boundaries.dataReleased)
        XCTAssertEqual(created.projectedRoleViews.count, 3)
        XCTAssertEqual(
            created.projectedRoleViews.first(where: { $0.role == "trusted_contact" })?.fieldPolicy,
            ["matter.title", "matter.category", "matter.desiredOutcome"]
        )
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map(\.url?.path), [
            "/v1/disclosure-rehearsals",
            "/v1/disclosure-rehearsals/\(publicID)/actions",
        ])
        let createBody = try XCTUnwrap(requests.first?.httpBody)
        let createJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: createBody) as? [String: Any]
        )
        XCTAssertEqual(createJSON["lifeEvent"] as? String, "death")
        let actionBody = try XCTUnwrap(requests.last?.httpBody)
        let actionJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: actionBody) as? [String: Any]
        )
        XCTAssertEqual(actionJSON["expectedVersion"] as? Int, 1)
        XCTAssertEqual(actionJSON["action"] as? String, "advance")
        XCTAssertEqual(actionJSON["acknowledgesSimulationOnly"] as? Bool, true)
    }

    func testDisclosureRehearsalFailsClosedOnReleaseOrForbiddenPreviewFields() async throws {
        for unsafe in [
            Fixtures.unsafeDisclosureReleaseEnvelope,
            Fixtures.unsafeDisclosureFieldEnvelope,
        ] {
            let transport = StubTransport(responses: [
                "/v1/disclosure-rehearsals": .init(status: 201, body: unsafe),
            ])
            let configuration = APIConfiguration(
                baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
                developmentPlannerID: Fixtures.plannerID
            )
            let client = APIClient(configuration: configuration, transport: transport)

            do {
                _ = try await client.createDisclosureRehearsal(
                    request: DisclosureRehearsalCreateRequest(lifeEvent: .death)
                )
                XCTFail("Expected an unsafe disclosure response to fail closed")
            } catch let error as RilloraAPIError {
                guard case .invalidPayload = error else {
                    return XCTFail("Expected invalidPayload, received \(error)")
                }
            }
        }
    }

    func testRoleAssignmentRequestsAreVersionedAndExplicitlyRecordOnly() async throws {
        let publicID = "77777777-7777-4777-8777-777777777777"
        let mutationTransport = StubTransport(responses: [
            "/v1/role-assignments": .init(status: 201, body: Fixtures.roleAssignmentEnvelope),
            "/v1/role-assignments/\(publicID)": .init(body: Fixtures.roleAssignmentEnvelope),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: mutationTransport)
        let created = try await client.createRoleAssignment(request: RoleAssignmentCreateRequest(
            personPublicId: "44444444-4444-4444-8444-444444444444",
            role: .executor,
            scope: .matterSpecific,
            matterPublicId: "30000000-0000-4000-8000-000000000001"
        ))
        _ = try await client.updateRoleAssignment(
            publicID: publicID,
            request: RoleAssignmentUpdateRequest(
                expectedVersion: 1,
                role: .recipient,
                scope: .matterSpecific,
                matterPublicId: "30000000-0000-4000-8000-000000000001"
            )
        )
        XCTAssertEqual(created.assignment?.evidence, .recordOnly)
        XCTAssertFalse(created.assignment?.editable == false)

        let requests = await mutationTransport.recordedRequests()
        let createJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: try XCTUnwrap(requests.first?.httpBody))
                as? [String: Any]
        )
        XCTAssertEqual(createJSON["acknowledgesRecordOnly"] as? Bool, true)
        XCTAssertEqual(createJSON["acknowledgesNoAuthority"] as? Bool, true)
        XCTAssertEqual(createJSON["scope"] as? String, "matter_specific")
        let updateJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: try XCTUnwrap(requests.last?.httpBody))
                as? [String: Any]
        )
        XCTAssertEqual(updateJSON["expectedVersion"] as? Int, 1)

        let revokeTransport = StubTransport(responses: [
            "/v1/role-assignments/\(publicID)": .init(body: Fixtures.roleAssignmentRevokeEnvelope),
        ])
        let revokeClient = APIClient(configuration: configuration, transport: revokeTransport)
        let revoked = try await revokeClient.revokeRoleAssignment(
            publicID: publicID,
            expectedVersion: 2
        )
        XCTAssertNil(revoked.assignment)
        let revokeRequests = await revokeTransport.recordedRequests()
        let revokeRequest = try XCTUnwrap(revokeRequests.first)
        XCTAssertEqual(revokeRequest.httpMethod, "DELETE")
        XCTAssertEqual(revokeRequest.value(forHTTPHeaderField: "If-Match"), "2")
    }

    func testRoleAssignmentListPreservesScopeAndNoAuthorityBoundary() async throws {
        let transport = StubTransport(responses: [
            "/v1/role-assignments": .init(body: Fixtures.roleAssignmentsEnvelope),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let assignments = try await APIClient(
            configuration: configuration,
            transport: transport
        ).fetchRoleAssignments()
        XCTAssertEqual(assignments.count, 1)
        XCTAssertEqual(assignments[0].scope, .matterSpecific)
        XCTAssertEqual(assignments[0].matter?.title, "Bank account")
        XCTAssertTrue(assignments[0].preservesSafetyBoundary)
    }

    func testRoleAssignmentFailsClosedOnAuthorityOrUnexpectedSecretField() async throws {
        for unsafe in [Fixtures.unsafeRoleAuthorityEnvelope, Fixtures.unsafeRoleSecretEnvelope] {
            let transport = StubTransport(responses: [
                "/v1/role-assignments": .init(status: 201, body: unsafe),
            ])
            let configuration = APIConfiguration(
                baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
                developmentPlannerID: Fixtures.plannerID
            )
            do {
                _ = try await APIClient(
                    configuration: configuration,
                    transport: transport
                ).createRoleAssignment(request: RoleAssignmentCreateRequest(
                    personPublicId: "44444444-4444-4444-8444-444444444444",
                    role: .executor,
                    scope: .matterSpecific,
                    matterPublicId: "30000000-0000-4000-8000-000000000001"
                ))
                XCTFail("Expected unsafe role policy to be rejected")
            } catch let error as RilloraAPIError {
                guard case .invalidPayload = error else {
                    return XCTFail("Expected invalidPayload, received \(error)")
                }
            }
        }
    }

    func testStartHereDecodesNoFilePreviewAndSendsEmptyJSONBody() async throws {
        let transport = StubTransport(responses: [
            "/v1/exports/start-here/preview": .init(
                status: 201,
                body: Fixtures.startHerePreviewEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let preview = try await client.previewStartHere()

        XCTAssertEqual(preview.export.status, "previewed")
        XCTAssertFalse(preview.export.encryptedPackageCreated)
        XCTAssertEqual(preview.package.planner.displayName, "Local Planner")
        XCTAssertEqual(preview.package.planner.timeZone, "Asia/Shanghai")
        XCTAssertEqual(preview.package.matters.count, 1)
        XCTAssertTrue(preview.package.directionsNotPasswords)
        XCTAssertTrue(preview.package.legalAuthorityNotGranted)
        let requests = await transport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try XCTUnwrap(request.httpBody)
        XCTAssertEqual(String(decoding: body, as: UTF8.self), "{}")
    }

    func testStartHereRejectsAResponseThatClaimsAnEncryptedPackage() async throws {
        let transport = StubTransport(responses: [
            "/v1/exports/start-here/preview": .init(
                status: 201,
                body: Fixtures.unsafeStartHerePreviewEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.previewStartHere()
            XCTFail("Expected the unsafe export claim to be rejected")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }

    func testCreatePrintableStartHereValidatesHeadersAndSendsAcknowledgements() async throws {
        let transport = StubTransport(responses: [
            "/v1/exports/start-here/printable": .init(
                status: 201,
                body: Fixtures.printableStartHere,
                headers: Fixtures.printableStartHereHeaders
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let artifact = try await client.createPrintableStartHere(
            previewPublicID: "99999999-9999-4999-8999-999999999999"
        )

        XCTAssertEqual(artifact.exportPublicId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        XCTAssertEqual(artifact.filename, "rillora-start-here-2026-08-10.txt")
        XCTAssertFalse(artifact.serverCopyRetained)
        XCTAssertEqual(String(data: artifact.data, encoding: .utf8), Fixtures.printableStartHere)
        let requests = await transport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.value(forHTTPHeaderField: "Accept"), "text/plain")
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["previewPublicId"] as? String, "99999999-9999-4999-8999-999999999999")
        XCTAssertEqual(json["acknowledgesPlaintext"] as? Bool, true)
        XCTAssertEqual(json["acknowledgesNoRevocation"] as? Bool, true)
    }

    func testCreatePrintableStartHereRejectsRetainedServerCopyClaim() async throws {
        var headers = Fixtures.printableStartHereHeaders
        headers["x-rillora-server-copy-retained"] = "true"
        let transport = StubTransport(responses: [
            "/v1/exports/start-here/printable": .init(
                status: 201,
                body: Fixtures.printableStartHere,
                headers: headers
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        do {
            _ = try await client.createPrintableStartHere(
                previewPublicID: "99999999-9999-4999-8999-999999999999"
            )
            XCTFail("Expected the retained-copy claim to be rejected")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }

    func testEncryptedStartHerePreparationAndFinalizePreserveClientKeyBoundary() async throws {
        let packageID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        let transport = StubTransport(responses: [
            "/v1/exports/start-here/encrypted/prepare": .init(
                status: 201,
                body: Fixtures.encryptedPreparationEnvelope
            ),
            "/v1/exports/start-here/encrypted/\(packageID)/finalize": .init(
                status: 201,
                body: Fixtures.encryptedFinalizedEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let preparation = try await client.prepareEncryptedStartHere(
            previewPublicID: "99999999-9999-4999-8999-999999999999"
        )
        XCTAssertFalse(preparation.package.serverCanDecrypt)
        XCTAssertFalse(preparation.package.recipientDeliveryPerformed)
        XCTAssertEqual(preparation.eligibleRecipientKeys, [])

        let request = EncryptedStartHereFinalizeRequest(
            previewPublicId: preparation.package.previewPublicId,
            cryptoVersion: "rillora-hpke-v1",
            contentNonce: String(repeating: "A", count: 16),
            contentCiphertext: String(repeating: "B", count: 24),
            ciphertextSha256: String(repeating: "C", count: 43),
            recovery: RecoveryKeyEnvelope(
                publicKey: String(repeating: "D", count: 87),
                encapsulatedKey: String(repeating: "E", count: 87),
                wrappedKey: String(repeating: "F", count: 64)
            ),
            recipients: [],
            acknowledgesOfflineRecoveryRisk: true,
            acknowledgesExternalCopiesNotRevocable: true
        )
        let finalized = try await client.finalizeEncryptedStartHere(
            packagePublicID: packageID,
            request: request
        )
        XCTAssertEqual(finalized.recipientKeyCount, 0)
        XCTAssertFalse(finalized.offlineRecoveryPrivateKeyReceivedByServer)
        XCTAssertFalse(finalized.serverCanDecrypt)

        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map(\.url?.path), [
            "/v1/exports/start-here/encrypted/prepare",
            "/v1/exports/start-here/encrypted/\(packageID)/finalize",
        ])
        let finalizeBody = try XCTUnwrap(requests.last?.httpBody)
        let finalizeJSON = try XCTUnwrap(
            JSONSerialization.jsonObject(with: finalizeBody) as? [String: Any]
        )
        XCTAssertNil(finalizeJSON["privateKey"])
        XCTAssertNil(finalizeJSON["contentKey"])
        XCTAssertEqual(finalizeJSON["acknowledgesOfflineRecoveryRisk"] as? Bool, true)
        XCTAssertEqual(finalizeJSON["acknowledgesExternalCopiesNotRevocable"] as? Bool, true)
    }

    func testSyntheticRecipientAcceptanceAndEnrollmentUseIsolatedMemorySession() async throws {
        let acceptanceToken = String(repeating: "a", count: 43)
        let sessionToken = String(repeating: "s", count: 43)
        let transport = StubTransport(responses: [
            "/v1/recipient-rehearsals": .init(
                status: 201,
                body: Fixtures.recipientRehearsalCreatedEnvelope
            ),
            "/recipient-rehearsals/accept": .init(
                status: 201,
                body: Fixtures.recipientRehearsalAcceptedEnvelope
            ),
            "/recipient-rehearsals/device-keys": .init(
                status: 201,
                body: Fixtures.recipientDeviceKeyEnvelope
            ),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let created = try await client.createRecipientRehearsal(
            personPublicID: "44444444-4444-4444-8444-444444444444"
        )
        let accepted = try await client.acceptRecipientRehearsal(
            acceptanceToken: created.acceptanceToken
        )
        let enrolled = try await client.enrollRecipientDeviceKey(
            sessionToken: accepted.sessionToken,
            request: RecipientDeviceKeyCreateRequest(
                deviceLabel: "Synthetic iOS session",
                publicKey: String(repeating: "p", count: 87)
            )
        )

        XCTAssertEqual(created.acceptanceToken, acceptanceToken)
        XCTAssertEqual(accepted.sessionToken, sessionToken)
        XCTAssertEqual(enrolled.status, "active")
        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.map(\.url?.path), [
            "/v1/recipient-rehearsals",
            "/recipient-rehearsals/accept",
            "/recipient-rehearsals/device-keys",
        ])
        XCTAssertEqual(requests[0].value(forHTTPHeaderField: "x-dev-planner-id"), Fixtures.plannerID)
        XCTAssertEqual(requests[0].value(forHTTPHeaderField: "x-rillora-client"), "ios")
        XCTAssertNil(requests[1].value(forHTTPHeaderField: "x-dev-planner-id"))
        XCTAssertNil(requests[1].value(forHTTPHeaderField: "x-rillora-client"))
        XCTAssertNil(requests[1].value(forHTTPHeaderField: "Authorization"))
        XCTAssertFalse(requests[1].httpShouldHandleCookies)
        XCTAssertEqual(
            requests[2].value(forHTTPHeaderField: "Authorization"),
            "Rillora-Rehearsal \(sessionToken)"
        )
        XCTAssertNil(requests[2].value(forHTTPHeaderField: "x-rillora-client"))
        XCTAssertFalse(requests[2].httpShouldHandleCookies)
        XCTAssertFalse(requests[1].url!.absoluteString.contains(acceptanceToken))
        XCTAssertFalse(requests[2].url!.absoluteString.contains(sessionToken))
        let enrollmentBody = String(decoding: try XCTUnwrap(requests[2].httpBody), as: UTF8.self)
        XCTAssertFalse(enrollmentBody.contains("privateKey"))
    }

    func testFetchAndUpdatePlanMotivationUseLatestOptimisticVersion() async throws {
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4180/v1/")),
            developmentPlannerID: Fixtures.plannerID
        )
        let fetchTransport = StubTransport(responses: [
            "/v1/plan": Fixtures.successResponses["/v1/plan"]!,
        ])
        let fetchClient = APIClient(configuration: configuration, transport: fetchTransport)

        let plan = try await fetchClient.fetchPlan()

        XCTAssertEqual(plan.motivation, "complex_digital_life")
        XCTAssertEqual(plan.firstUseState, .completed)
        XCTAssertEqual(plan.firstUseStep, 2)
        XCTAssertEqual(plan.version, 1)

        let updateTransport = StubTransport(responses: [
            "/v1/plan": .init(body: Fixtures.updatedPlanEnvelope),
        ])
        let updateClient = APIClient(configuration: configuration, transport: updateTransport)

        let saved = try await updateClient.updatePlan(
            request: PlanUpdateRequest(
                expectedVersion: plan.version,
                motivation: .generalPreparedness
            )
        )

        XCTAssertEqual(saved.motivation, "general_preparedness")
        XCTAssertEqual(saved.version, 2)
        let requests = await updateTransport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.httpMethod, "PATCH")
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["expectedVersion"] as? Int, 1)
        XCTAssertEqual(json["motivation"] as? String, "general_preparedness")
    }

    func testCommerceStatusAndPurchaseRouteUseServerAuthoritativeContracts() async throws {
        let transport = StubTransport(responses: [
            "/v1/commerce/status": .init(body: Fixtures.commerceStatusEnvelope),
            "/v1/commerce/purchase-route": .init(body: Fixtures.commerceRouteEnvelope),
        ])
        let configuration = APIConfiguration(
            baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
            developmentPlannerID: Fixtures.plannerID,
            serviceMarketCode: "GLOBAL_US"
        )
        let client = APIClient(configuration: configuration, transport: transport)

        let status = try await client.fetchCommerceStatus(serviceMarketCode: "GLOBAL_US")
        let route = try await client.resolvePurchaseRoute(
            request: .iOS(
                serviceMarketCode: "GLOBAL_US",
                appleStorefrontCountryCode: "USA"
            )
        )

        XCTAssertFalse(status.billingOpen)
        XCTAssertEqual(status.currentAccess.planCode, "free")
        XCTAssertEqual(status.offers.first?.amountMinor, 999)
        XCTAssertEqual(status.offers.first?.minorUnitExponent, 2)
        XCTAssertEqual(route.purchaseRoute, "none")
        XCTAssertEqual(route.reason, "billing_closed")
        XCTAssertTrue(status.boundaries.preservesSafetyBoundary)

        let requests = await transport.recordedRequests()
        XCTAssertEqual(requests.count, 2)
        XCTAssertEqual(
            URLComponents(url: requests[0].url!, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "serviceMarketCode" })?.value,
            "GLOBAL_US"
        )
        XCTAssertEqual(requests[1].httpMethod, "POST")
        let body = try XCTUnwrap(requests[1].httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["clientSurface"] as? String, "ios")
        XCTAssertEqual(json["appleStorefrontCountryCode"] as? String, "USA")
    }

    func testCommerceContractRejectsClientGrantedAccessBoundary() async throws {
        let unsafeBody = Fixtures.commerceStatusEnvelope.replacingOccurrences(
            of: #""clientPurchaseResultGrantsAccess":false"#,
            with: #""clientPurchaseResultGrantsAccess":true"#
        )
        let client = APIClient(
            configuration: APIConfiguration(
                baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
                developmentPlannerID: Fixtures.plannerID
            ),
            transport: StubTransport(responses: [
                "/v1/commerce/status": .init(body: unsafeBody),
            ])
        )

        do {
            _ = try await client.fetchCommerceStatus(serviceMarketCode: "GLOBAL_US")
            XCTFail("Expected unsafe commercial boundary rejection")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }

    func testStoreKitSandboxTransactionUsesServerAuthoritativeFinishContract() async throws {
        let transport = StubTransport(responses: [
            "/v1/commerce/storekit/sandbox/transactions": .init(
                body: Fixtures.storeKitSandboxTransactionEnvelope
            ),
        ])
        let client = APIClient(
            configuration: APIConfiguration(
                baseURL: try XCTUnwrap(URL(string: "http://127.0.0.1:4182/v1/")),
                developmentPlannerID: Fixtures.plannerID
            ),
            transport: transport
        )

        let response = try await client.submitStoreKitSandboxTransaction(
            request: StoreKitSandboxTransactionRequest(
                signedTransaction: "header.payload.signature",
                storefrontCountryCode: "USA"
            )
        )

        XCTAssertTrue(response.preservesSafetyBoundary)
        XCTAssertTrue(response.result.finishAuthorized)
        XCTAssertFalse(response.result.entitlementChanged)
        let requests = await transport.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(
            request.value(forHTTPHeaderField: "x-dev-planner-id"),
            Fixtures.plannerID
        )
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(
            JSONSerialization.jsonObject(with: body) as? [String: Any]
        )
        XCTAssertEqual(json["storefrontCountryCode"] as? String, "USA")
        XCTAssertEqual(json["signedTransaction"] as? String, "header.payload.signature")
    }

    func testStoreKitSandboxTransactionRejectsEntitlementMutationBoundary() async throws {
        let unsafeBody = Fixtures.storeKitSandboxTransactionEnvelope.replacingOccurrences(
            of: #""entitlementMutationEnabled":false"#,
            with: #""entitlementMutationEnabled":true"#
        )
        let client = APIClient(
            configuration: APIConfiguration(
                baseURL: try XCTUnwrap(URL(string: "https://api.example.test/v1/")),
                developmentPlannerID: Fixtures.plannerID
            ),
            transport: StubTransport(responses: [
                "/v1/commerce/storekit/sandbox/transactions": .init(body: unsafeBody),
            ])
        )

        do {
            _ = try await client.submitStoreKitSandboxTransaction(
                request: StoreKitSandboxTransactionRequest(
                    signedTransaction: "header.payload.signature",
                    storefrontCountryCode: "USA"
                )
            )
            XCTFail("Expected unsafe StoreKit Sandbox response rejection")
        } catch let error as RilloraAPIError {
            guard case .invalidPayload = error else {
                return XCTFail("Expected invalidPayload, received \(error)")
            }
        }
    }
}

private actor StubSessionTokenStore: SessionTokenStore {
    private var token: String?

    init(token: String?) {
        self.token = token
    }

    func read() async throws -> String? { token }
    func save(_ token: String) async throws { self.token = token }
    func delete() async throws { token = nil }
}

private actor StubTransport: HTTPTransport {
    struct Response: Sendable {
        let status: Int
        let body: String
        let headers: [String: String]

        init(status: Int = 200, body: String, headers: [String: String] = [:]) {
            self.status = status
            self.body = body
            self.headers = headers
        }
    }

    private let responses: [String: Response]
    private let fallback: Response
    private var requests: [URLRequest] = []

    init(
        responses: [String: Response],
        fallback: Response = Response(status: 404, body: #"{"error":{"code":"not_found","message":"Not found"}}"#)
    ) {
        self.responses = responses
        self.fallback = fallback
    }

    func send(_ request: URLRequest) async throws -> HTTPTransportResponse {
        requests.append(request)
        let response = responses[request.url?.path ?? ""] ?? fallback
        let url = try XCTUnwrap(request.url)
        let defaultHeaders = ["Content-Type": "application/json", "x-request-id": "test-request"]
        let headerFields = defaultHeaders.merging(response.headers) { _, responseValue in
            responseValue
        }
        let httpResponse = try XCTUnwrap(HTTPURLResponse(
            url: url,
            statusCode: response.status,
            httpVersion: "HTTP/1.1",
            headerFields: headerFields
        ))
        return HTTPTransportResponse(data: Data(response.body.utf8), response: httpResponse)
    }

    func recordedRequests() -> [URLRequest] {
        requests
    }
}

private enum Fixtures {
    static let plannerID = "11111111-1111-4111-8111-111111111111"

    static let legacyResponses: [String: StubTransport.Response] = [
        "/v1/session": .init(body: #"{"plannerPublicId":"11111111-1111-4111-8111-111111111111","authenticationMode":"development","authenticationMethods":[],"authenticatedAt":null}"#),
        "/v1/plan": .init(body: #"{"plan":{"publicId":"22222222-2222-4222-8222-222222222222","motivation":"complex_digital_life","status":"active","firstUseState":"completed","firstUseStep":2,"policyVersion":"initial-v1","lastReviewedAt":null,"reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z"}}"#),
        "/v1/matters": .init(body: matterEnvelope),
        "/v1/trusted-contacts": .init(body: #"{"trustedContacts":[{"publicId":"44444444-4444-4444-8444-444444444444","displayName":"Maya Chen","relationshipLabel":"Sister","status":"confirmed","roleStatus":"accepted","invitationStatus":"accepted","confirmationMode":"simulation","version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z"}]}"#),
        "/v1/readiness": .init(body: #"{"readiness":{"totalMatters":5,"readyMatters":3,"assignedOutcomes":4,"confirmedContacts":1,"completedOfficialChecks":0,"completedSimulations":0,"verifiedEmergencyPlan":false,"confirmationEvidenceMayBeSimulated":true}}"#),
    ]

    static let successResponses: [String: StubTransport.Response] = {
        var responses = legacyResponses
        var overview: [String: Any] = [:]
        for (path, response) in legacyResponses {
            let decoded = try! JSONSerialization.jsonObject(with: Data(response.body.utf8)) as! [String: Any]
            if path == "/v1/session" { overview["session"] = decoded }
            else { overview.merge(decoded) { _, new in new } }
        }
        responses["/v1/overview"] = .init(body: String(data: try! JSONSerialization.data(withJSONObject: overview), encoding: .utf8)!)
        return responses
    }()


    static let commerceBoundaries = #"{"serverAuthoritative":true,"providerCallbackGrantsAccess":false,"clientPurchaseResultGrantsAccess":false,"billingStateCanTriggerClaim":false,"billingStateCanTriggerDisclosure":false,"storefrontPersistedToCustomerProfile":false,"oneActiveRenewalProviderPerHouseholdPlan":true}"#

    static let commerceStatusEnvelope = #"{"contractVersion":"commerce-v1","billingOpen":false,"serviceMarketCode":"GLOBAL_US","marketPolicyVersion":1,"currentAccess":{"planCode":"free","planVersion":1,"subscription":null,"managementDestination":"none"},"entitlements":[{"code":"matter_map_core","allowance":null,"source":"free_baseline"}],"plans":[{"planCode":"free","planVersion":1,"status":"active","capabilities":[{"code":"matter_map_core","status":"active","allowance":null,"enforcementMode":"included","baselineTrustControl":true}]}],"offers":[{"priceCode":"family_usd_monthly_v1","planCode":"family","planVersion":1,"amountMinor":999,"minorUnitExponent":2,"currencyCode":"USD","billingInterval":"monthly","taxBehavior":"not_configured","status":"disabled_hypothesis","purchasable":false}],"boundaries":\#(commerceBoundaries)}"#

    static let commerceRouteEnvelope = #"{"contractVersion":"commerce-v1","purchaseRoute":"none","reason":"billing_closed","policy":{"code":"global_us_ios_stripe_v1","version":1,"externalOfferAllowed":false},"activeSubscription":null,"managementDestination":"none","requiresFreshEvaluation":true,"boundaries":\#(commerceBoundaries)}"#

    static let storeKitSandboxTransactionEnvelope = #"{"contractVersion":"commerce-storekit-sandbox-v1","result":{"accepted":true,"status":"applied","providerEventReference":"9002","finishAuthorized":true,"authoritativeSnapshotLoaded":true,"entitlementChanged":false,"sandboxOnly":true},"boundaries":{"sandboxOnly":true,"serverAuthoritative":true,"authoritativeSnapshotLoaded":true,"transactionFinishAuthorized":true,"entitlementMutationEnabled":false,"purchaseRouteEnabled":false}}"#

    static let updateRequest = MatterUpdateRequest(
        expectedVersion: 1,
        category: "document",
        title: "Insurance",
        institutionName: "Harbor Mutual",
        accountHint: nil,
        valueBand: "unknown",
        currencyCode: nil,
        locationHint: nil,
        importance: "important",
        desiredOutcome: "notify",
        status: "ready"
    )

    static let createRequest = MatterCreateRequest(
        category: "financial_asset",
        title: "Emergency fund",
        institutionName: "Northstar Bank",
        accountHint: nil,
        valueBand: "under_1k",
        currencyCode: "USD",
        locationHint: nil,
        importance: "important",
        desiredOutcome: "notify",
        status: "draft"
    )

    static let updatedMatterEnvelope = #"{"matter":{"publicId":"30000000-0000-4000-8000-000000000004","category":"document","title":"Insurance","institutionName":null,"accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":"Blue folder","importance":"critical","desiredOutcome":"notify","status":"ready","reviewDueAt":null,"version":2,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T01:00:00.000Z","archivedAt":null}}"#

    static let createdMatterEnvelope = #"{"matter":{"publicId":"30000000-0000-4000-8000-000000000006","category":"financial_asset","title":"Emergency fund","institutionName":"Northstar Bank","accountHint":null,"valueBand":"under_1k","currencyCode":"USD","locationHint":null,"importance":"important","desiredOutcome":"notify","status":"draft","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null}}"#

    static let createdTrustedContactEnvelope = #"{"trustedContact":{"publicId":"55555555-5555-4555-8555-555555555555","displayName":"Avery Stone","relationshipLabel":null,"status":"draft","roleStatus":"draft","invitationStatus":null,"confirmationMode":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z"}}"#

    static let revokedTrustedContactEnvelope = #"{"trustedContact":{"publicId":"55555555-5555-4555-8555-555555555555","displayName":"Avery Stone","relationshipLabel":null,"status":"revoked","roleStatus":"revoked","invitationStatus":"revoked","confirmationMode":"real","version":2,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T01:00:00.000Z"}}"#

    static let officialSetupChecksEnvelope = #"{"officialSetupChecks":[{"publicId":"66666666-6666-4666-8666-666666666666","providerKey":"apple","policyVersion":"initial-2026-08-04","completed":false,"completedAt":null,"version":1,"updatedAt":"2026-08-08T00:00:00.000Z"},{"publicId":"77777777-7777-4777-8777-777777777777","providerKey":"password_manager","policyVersion":"initial-2026-08-04","completed":false,"completedAt":null,"version":1,"updatedAt":"2026-08-08T00:00:00.000Z"}]}"#

    static let officialSetupMutationEnvelope = #"{"officialSetupCheck":{"publicId":"66666666-6666-4666-8666-666666666666","providerKey":"apple","policyVersion":"initial-2026-08-04","completed":true,"completedAt":"2026-08-09T00:00:00.000Z","version":2,"updatedAt":"2026-08-09T00:00:00.000Z"},"evidence":"self_reported"}"#

    static let unverifiedOfficialSetupMutationEnvelope = #"{"officialSetupCheck":{"publicId":"66666666-6666-4666-8666-666666666666","providerKey":"apple","policyVersion":"initial-2026-08-04","completed":true,"completedAt":"2026-08-09T00:00:00.000Z","version":2,"updatedAt":"2026-08-09T00:00:00.000Z"},"evidence":"provider_verified"}"#

    static let simulationEnvelope = #"{"simulation":{"publicId":"88888888-8888-4888-8888-888888888888","lifeEvent":"missing","policyVersion":"mvp-2026-08-04","completedAt":"2026-08-09T00:00:00.000Z","snapshot":{"schemaVersion":"simulation-v1","matterCount":5,"outcomeCount":4,"trustedContactCount":1,"operative":false},"simulationOnly":true,"notificationsSent":false,"dataReleased":false}}"#

    static let unsafeSimulationEnvelope = #"{"simulation":{"publicId":"88888888-8888-4888-8888-888888888888","lifeEvent":"death","policyVersion":"mvp-2026-08-04","completedAt":"2026-08-09T00:00:00.000Z","snapshot":{"schemaVersion":"simulation-v1","matterCount":5,"outcomeCount":4,"trustedContactCount":1,"operative":true},"simulationOnly":false,"notificationsSent":true,"dataReleased":true}}"#

    private static let disclosureBoundaries = #"{"simulationOnly":true,"operative":false,"identityVerified":false,"documentsVerified":false,"multiPartyVerified":false,"notificationsSent":false,"dataReleased":false,"releaseAvailable":false,"legalAuthorityGranted":false}"#

    private static let disclosureRoleViews = #"[{"role":"trusted_contact","previewStage":"guidance","eligibleForProjectedPreview":true,"reason":"Projected guidance only.","assignedPeople":[{"publicId":"44444444-4444-4444-8444-444444444444","displayName":"Maya Chen","relationshipLabel":"Sister","assignmentStatus":"accepted","invitationEvidence":"simulation"}],"fieldPolicy":["matter.title","matter.category","matter.desiredOutcome"],"matters":[{"title":"Bank account","category":"financial_asset","desiredOutcome":"notify"}],"summary":{"matterCount":1}},{"role":"executor","previewStage":"none","eligibleForProjectedPreview":false,"reason":"No assignment.","assignedPeople":[],"fieldPolicy":[],"matters":[],"summary":{"matterCount":0}},{"role":"recipient","previewStage":"none","eligibleForProjectedPreview":false,"reason":"No assignment.","assignedPeople":[],"fieldPolicy":[],"matters":[],"summary":{"matterCount":0}}]"#

    static var disclosureRehearsalEnvelope: String {
        #"{"boundaries":\#(disclosureBoundaries),"disclosureRehearsal":{"publicId":"99999999-9999-4999-8999-999999999999","lifeEvent":"death","state":"death_claim_opened","stateLabel":"Death claim opened","policyVersion":"disclosure-rehearsal-2026-08-10-v1","policyLabel":"Death claim rehearsal","stateSequence":[{"key":"death_claim_opened","label":"Death claim opened"},{"key":"death_identity_review","label":"Identity review"},{"key":"death_document_review","label":"Document review"},{"key":"death_multi_party_confirmation","label":"Multi-party confirmation"},{"key":"death_cooling_off","label":"Illustrative cooling-off"},{"key":"death_preview_ready","label":"Preview ready"}],"completedCheckpoints":[{"code":"death_claim_opened","label":"Claim recorded only inside the rehearsal","simulatedAt":"2026-08-10T00:00:00.000Z","realEvidenceCollected":false}],"projectedRoleViews":\#(disclosureRoleViews),"snapshot":{"schemaVersion":"disclosure-rehearsal-v1","capturedAt":"2026-08-10T00:00:00.000Z","lifeEvent":"death","policyIllustrative":true,"operative":false,"planner":{"displayName":"Alex Chen","timeZone":"Asia/Shanghai"},"coolingOffDurationHours":336,"guardrails":[{"code":"death_identity_review","label":"Identity review","realEvidenceCollected":false}],"roleViews":\#(disclosureRoleViews)},"availableActions":["advance","cancel"],"previewReady":false,"snapshotFresh":true,"invalidatedAt":null,"invalidatedReason":null,"coolingOffEndsAt":null,"coolingOffSimulatedAt":null,"appealedAt":null,"canceledAt":null,"version":1,"createdAt":"2026-08-10T00:00:00.000Z","updatedAt":"2026-08-10T00:00:00.000Z","boundaries":\#(disclosureBoundaries)}}"#
    }

    static var unsafeDisclosureReleaseEnvelope: String {
        disclosureRehearsalEnvelope.replacingOccurrences(
            of: #""dataReleased":false"#,
            with: #""dataReleased":true"#
        )
    }

    static var unsafeDisclosureFieldEnvelope: String {
        disclosureRehearsalEnvelope.replacingOccurrences(
            of: #""desiredOutcome":"notify""#,
            with: #""desiredOutcome":"notify","accountHint":"forbidden""#
        )
    }

    private static let roleBoundaries = #"{"recordOnlyByDefault":true,"invitationSent":false,"identityBound":false,"legalAuthorityGranted":false,"accountAccessGranted":false,"releaseAvailable":false}"#

    private static let roleAssignment = #"{"publicId":"77777777-7777-4777-8777-777777777777","person":{"publicId":"44444444-4444-4444-8444-444444444444","displayName":"Maya Chen","relationshipLabel":"Sister"},"role":"executor","scope":"matter_specific","matter":{"publicId":"30000000-0000-4000-8000-000000000001","title":"Bank account"},"status":"draft","evidence":"record_only","invitationStatus":null,"editable":true,"version":1,"createdAt":"2026-08-10T00:00:00.000Z","updatedAt":"2026-08-10T00:00:00.000Z"}"#

    static var roleAssignmentEnvelope: String {
        #"{"roleAssignment":\#(roleAssignment),"invalidatedDisclosureRehearsalCount":1,"boundaries":\#(roleBoundaries)}"#
    }

    static var roleAssignmentsEnvelope: String {
        #"{"roleAssignments":[\#(roleAssignment)],"boundaries":\#(roleBoundaries)}"#
    }

    static var roleAssignmentRevokeEnvelope: String {
        #"{"revoked":true,"invalidatedDisclosureRehearsalCount":1,"boundaries":\#(roleBoundaries)}"#
    }

    static var unsafeRoleAuthorityEnvelope: String {
        roleAssignmentEnvelope.replacingOccurrences(
            of: #""legalAuthorityGranted":false"#,
            with: #""legalAuthorityGranted":true"#
        )
    }

    static var unsafeRoleSecretEnvelope: String {
        roleAssignmentEnvelope.replacingOccurrences(
            of: #""updatedAt":"2026-08-10T00:00:00.000Z""#,
            with: #""updatedAt":"2026-08-10T00:00:00.000Z","privateKey": "[REDACTED_CREDENTIAL]""#
        )
    }

    static let startHerePreviewEnvelope = #"{"export":{"publicId":"99999999-9999-4999-8999-999999999999","createdAt":"2026-08-09T00:00:00.000Z","expiresAt":"2026-08-09T00:15:00.000Z","status":"previewed","encryptedPackageCreated":false},"package":{"schemaVersion":"start-here-v1","planner":{"display_name":"Local Planner","locale":"en","time_zone":"Asia/Shanghai"},"plan":{"publicId":"22222222-2222-4222-8222-222222222222","motivation":"complex_digital_life","status":"active","firstUseState":"completed","firstUseStep":2,"policyVersion":"mvp-2026-08-04","lastReviewedAt":null,"reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z"},"matters":[{"publicId":"30000000-0000-4000-8000-000000000001","category":"financial_asset","title":"Bank account","institutionName":"Northstar Bank","accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"notify","status":"ready","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null}],"trustedContacts":[{"displayName":"Maya Chen","relationshipLabel":"Sister"}],"directionsNotPasswords":true,"legalAuthorityNotGranted":true}}"#

    static let printableStartHere = "RILLORA — START HERE\nRillora cannot revoke that copy\n"

    static let printableStartHereHeaders = [
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"rillora-start-here-2026-08-10.txt\"",
        "x-rillora-export-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "x-rillora-server-copy-retained": "false",
    ]

    static let encryptedPreparationEnvelope = #"{"package":{"publicId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","previewPublicId":"99999999-9999-4999-8999-999999999999","createdAt":"2026-08-10T00:00:00.000Z","expiresAt":"2026-08-10T00:15:00.000Z","status":"generating","cryptoVersion":"rillora-hpke-v1","sourceCommitment":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","contentEncryption":"AES-256-GCM","keyWrapping":"HPKE-Base-P256-HKDF-SHA256-AES-256-GCM","serverCanDecrypt":false,"recipientDeliveryPerformed":false},"eligibleRecipientKeys":[]}"#

    static let encryptedFinalizedEnvelope = #"{"encryptedPackage":{"publicId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","status":"ready","cryptoVersion":"rillora-hpke-v1","sourceCommitment":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","recipientKeyCount":0,"offlineRecoveryEnvelopeCreated":true,"offlineRecoveryPrivateKeyReceivedByServer":false,"recipientDeliveryPerformed":false,"serverCanDecrypt":false,"externalCopiesRevocable":false}}"#

    static let recipientRehearsalCreatedEnvelope = #"{"recipientRehearsal":{"publicId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","personPublicId":"44444444-4444-4444-8444-444444444444","displayName":"Synthetic Recipient","status":"pending","expiresAt":"2026-08-10T00:30:00.000Z","acceptedAt":null,"revokedAt":null,"createdAt":"2026-08-10T00:00:00.000Z","simulationOnly":true},"acceptanceToken":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","boundaries":{"simulationOnly":true,"identityVerified":false,"deliveryPerformed":false,"releasePerformed":false,"serverCanDecrypt":false,"externalCopiesRevocable":false}}"#

    static let recipientRehearsalAcceptedEnvelope = #"{"recipientRehearsal":{"publicId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","status":"accepted","expiresAt":"2026-08-10T00:30:00.000Z"},"sessionToken": "[REDACTED_CREDENTIAL]","boundaries":{"simulationOnly":true,"identityVerified":false,"deliveryPerformed":false,"releasePerformed":false,"serverCanDecrypt":false,"externalCopiesRevocable":false}}"#

    static let recipientDeviceKeyEnvelope = #"{"deviceKey":{"publicId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","deviceLabel":"Synthetic iOS session","publicKey":"ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp","status":"active","createdAt":"2026-08-10T00:01:00.000Z","revokedAt":null,"simulationOnly":true},"boundaries":{"simulationOnly":true,"identityVerified":false,"deliveryPerformed":false,"releasePerformed":false,"serverCanDecrypt":false,"externalCopiesRevocable":false}}"#

    static var unsafeStartHerePreviewEnvelope: String {
        startHerePreviewEnvelope.replacingOccurrences(
            of: #""encryptedPackageCreated":false"#,
            with: #""encryptedPackageCreated":true"#
        )
    }

    static let updatedPlanEnvelope = #"{"plan":{"publicId":"22222222-2222-4222-8222-222222222222","motivation":"general_preparedness","status":"active","firstUseState":"completed","firstUseStep":2,"policyVersion":"mvp-2026-08-04","lastReviewedAt":null,"reviewDueAt":null,"version":2,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-09T00:00:00.000Z"}}"#

    private static let matterEnvelope = #"{"matters":[{"publicId":"30000000-0000-4000-8000-000000000001","category":"financial_asset","title":"Bank account","institutionName":"Northstar Bank","accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"notify","status":"ready","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null},{"publicId":"30000000-0000-4000-8000-000000000002","category":"account","title":"Cloud photos","institutionName":"Apple","accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"transfer_request","status":"ready","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null},{"publicId":"30000000-0000-4000-8000-000000000003","category":"account","title":"GitHub projects","institutionName":"GitHub","accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"transfer_request","status":"ready","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null},{"publicId":"30000000-0000-4000-8000-000000000004","category":"document","title":"Insurance","institutionName":"Harbor Mutual","accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"undecided","status":"draft","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null},{"publicId":"30000000-0000-4000-8000-000000000005","category":"subscription","title":"Subscriptions","institutionName":null,"accountHint":null,"valueBand":"unknown","currencyCode":null,"locationHint":null,"importance":"important","desiredOutcome":"close","status":"draft","reviewDueAt":null,"version":1,"createdAt":"2026-08-08T00:00:00.000Z","updatedAt":"2026-08-08T00:00:00.000Z","archivedAt":null}],"nextCursor":null}"#
}
