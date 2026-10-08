import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiClientError,
  createApiClient,
} from "../src/api.js";
import { publicRoutes, resolvePublicView } from "../src/publicRoutes.js";

test("sharing rollout compatibility only treats an absent endpoint as unavailable controls", async () => {
  const client = status => createApiClient({ fetchImpl: async () => new Response(JSON.stringify({error:{code:status===404?"not_found":"authentication_required",message:"Unavailable"}}), {status,headers:{"content-type":"application/json"}}) });
  assert.deepEqual(await client(404).getSharingAccess(), {access:null});
  await assert.rejects(client(401).getSharingAccess(), error => error.status===401);
});

test("public browsing stays separate from explicit account and identity entry points", () => {
  assert.equal(publicRoutes.home, "/");
  assert.equal(publicRoutes.account, "/account");
  assert.equal(publicRoutes.privacy, "/privacy");
  assert.equal(publicRoutes.terms, "/terms");
  assert.equal(publicRoutes.subscriptions, "/subscription-terms");
  assert.equal(publicRoutes.refunds, "/refund-policy");
  assert.equal(publicRoutes.acceptableUse, "/acceptable-use");
  assert.equal(publicRoutes.cookies, "/cookies");
  assert.equal(publicRoutes.legalNotice, "/legal");
  assert.equal(resolvePublicView("/"), "home");
  assert.equal(resolvePublicView("/account"), "account");
  assert.equal(resolvePublicView("/privacy"), "privacy");
  assert.equal(resolvePublicView("/terms"), "terms");
  assert.equal(resolvePublicView("/privacy/"), "privacy");
  assert.equal(resolvePublicView("/terms/"), "terms");
  assert.equal(resolvePublicView("/subscription-terms"), "subscriptions");
  assert.equal(resolvePublicView("/refund-policy"), "refunds");
  assert.equal(resolvePublicView("/acceptable-use"), "acceptableUse");
  assert.equal(resolvePublicView("/cookies"), "cookies");
  assert.equal(resolvePublicView("/legal"), "legalNotice");
});

test("authentication starts only through an explicit legal-acceptance POST", async () => {
  let captured;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return jsonResponse({ authorizationUrl: "https://identity.example/authorize" }, 201);
    },
  });
  const legalAcceptance = {
    termsVersion: "terms-version",
    privacyVersion: "privacy-version",
    consentTextVersion: "consent-version",
    bundleSha256: "a".repeat(64),
    acceptedTerms: true,
    acknowledgedPrivacy: true,
    acceptedElectronicRecords: true,
  };
  const result = await client.startAuthentication({
    intent: "signup",
    returnTo: "/",
    legalAcceptance,
  });
  assert.deepEqual(result, { authorizationUrl: "https://identity.example/authorize" });
  assert.equal(captured.url, "/api/auth/start");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.credentials, "include");
  assert.deepEqual(JSON.parse(captured.options.body), {
    intent: "signup",
    returnTo: "/",
    legalAcceptance,
  });
});

test("API client uses credentials and the development identity only when configured", async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: "http://api.example/v1",
    devPlannerId: "11111111-1111-4111-8111-111111111111",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ plan: { version: 1 } });
    },
  });
  await client.getPlan();
  assert.equal(calls[0].url, "http://api.example/v1/plan");
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(calls[0].options.headers.get("x-rillora-client"), "web");
  assert.equal(
    calls[0].options.headers.get("x-dev-planner-id"),
    "11111111-1111-4111-8111-111111111111",
  );
});

test("commercial reads and route evaluation use the authenticated shared API", async () => {
  const calls = [];
  const client = createApiClient({
    csrfTokenReader: () => "commerce-csrf",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const boundaries = {
        serverAuthoritative: true,
        providerCallbackGrantsAccess: false,
        clientPurchaseResultGrantsAccess: false,
        billingStateCanTriggerClaim: false,
        billingStateCanTriggerDisclosure: false,
        storefrontPersistedToCustomerProfile: false,
        oneActiveRenewalProviderPerHouseholdPlan: true,
      };
      return url.includes("purchase-route")
        ? jsonResponse({
          contractVersion: "commerce-v1",
          purchaseRoute: "none",
          reason: "billing_closed",
          policy: null,
          activeSubscription: null,
          managementDestination: "none",
          requiresFreshEvaluation: true,
          boundaries,
        })
        : jsonResponse({
          contractVersion: "commerce-v1",
          billingOpen: false,
          serviceMarketCode: "GLOBAL_US",
          currentAccess: { planCode: "free", planVersion: 1, subscription: null },
          plans: [],
          offers: [],
          boundaries,
        });
    },
  });

  await client.getCommerceStatus("GLOBAL_US");
  await client.resolvePurchaseRoute({
    clientSurface: "web",
    serviceMarketCode: "GLOBAL_US",
    intent: "plan_access",
  });

  assert.equal(
    calls[0].url,
    "/api/v1/commerce/status?serviceMarketCode=GLOBAL_US",
  );
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers.get("x-rillora-client"), "web");
  assert.equal(calls[1].url, "/api/v1/commerce/purchase-route");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[1].options.headers.get("x-csrf-token"), "commerce-csrf");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    clientSurface: "web",
    serviceMarketCode: "GLOBAL_US",
    intent: "plan_access",
  });
});

test("public session detection uses a non-error status endpoint before private workspace loading", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url) => {
      calls.push(url);
      return jsonResponse({ authenticated: false });
    },
  });
  const status = await client.getSessionStatus();
  assert.deepEqual(status, { authenticated: false });
  assert.deepEqual(calls, ["/api/auth/session-status"]);
});

test("API client binds state changes to the CSRF cookie token", async () => {
  let captured;
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (_url, options) => {
      captured = options;
      return jsonResponse({ matter: { version: 2 } });
    },
  });
  await client.updateMatter("matter-id", { expectedVersion: 1, status: "ready" });
  assert.equal(captured.headers.get("x-csrf-token"), "csrf-proof");
  assert.equal(captured.headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(captured.body), { expectedVersion: 1, status: "ready" });
});

test("first-use progress and the first matter use the shared authenticated API", async () => {
  const calls = [];
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return url.endsWith("/plan")
        ? jsonResponse({ plan: { firstUseState: "guide_in_progress", firstUseStep: 1 } })
        : jsonResponse({ matter: { publicId: "matter-1", title: "Cloud photos" } }, 201);
    },
  });

  await client.updatePlan({
    expectedVersion: 1,
    firstUseState: "guide_in_progress",
    firstUseStep: 1,
  });
  await client.createMatter({
    category: "account",
    title: "Cloud photos",
    valueBand: "unknown",
    importance: "important",
    desiredOutcome: "undecided",
    status: "draft",
  });

  assert.equal(calls[0].url, "/api/v1/plan");
  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(calls[0].options.headers.get("x-csrf-token"), "csrf-proof");
  assert.equal(calls[1].url, "/api/v1/matters");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[1].options.headers.get("x-csrf-token"), "csrf-proof");
});

test("API client returns bounded server errors without exposing response internals", async () => {
  const client = createApiClient({
    fetchImpl: async () => jsonResponse(
      { error: { code: "version_conflict", message: "Refresh and try again." } },
      409,
      { "x-request-id": "request-123" },
    ),
  });
  await assert.rejects(
    () => client.updateMatter("matter-id", { expectedVersion: 1, status: "ready" }),
    (error) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "version_conflict");
      assert.equal(error.requestId, "request-123");
      return true;
    },
  );
});

test("API client sends a CSRF-bound all-session revocation request", async () => {
  const calls = [];
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({
        revokedSessionCount: 3,
        scope: "rillora_sessions_only",
        identityProviderSessionsRevoked: false,
      });
    },
  });

  const result = await client.logoutAll();

  assert.equal(calls[0].url, "/api/v1/auth/logout-all");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.get("x-csrf-token"), "csrf-proof");
  assert.equal(result.scope, "rillora_sessions_only");
  assert.equal(result.identityProviderSessionsRevoked, false);
});

test("API client validates and returns the minimum-disclosure printable artifact", async () => {
  let captured;
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (_url, options) => {
      captured = options;
      return new Response("RILLORA — START HERE\nDirections, not passwords.\n", {
        status: 201,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-disposition": "attachment; filename=\"rillora-start-here-2026-08-10.txt\"",
          "x-rillora-export-id": "99999999-9999-4999-8999-999999999999",
          "x-rillora-server-copy-retained": "false",
        },
      });
    },
  });

  const artifact = await client.createPrintableStartHere(
    "88888888-8888-4888-8888-888888888888",
  );

  assert.equal(captured.method, "POST");
  assert.equal(captured.headers.get("x-csrf-token"), "csrf-proof");
  assert.deepEqual(JSON.parse(captured.body), {
    previewPublicId: "88888888-8888-4888-8888-888888888888",
    acknowledgesPlaintext: true,
    acknowledgesNoRevocation: true,
  });
  assert.equal(artifact.filename, "rillora-start-here-2026-08-10.txt");
  assert.equal(artifact.serverCopyRetained, false);
  assert.match(await artifact.blob.text(), /Directions, not passwords/);
});

test("API client rejects a printable response that claims a retained server copy", async () => {
  const client = createApiClient({
    fetchImpl: async () => new Response("unsafe", {
      status: 201,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": "attachment; filename=\"rillora-start-here-2026-08-10.txt\"",
        "x-rillora-export-id": "99999999-9999-4999-8999-999999999999",
        "x-rillora-server-copy-retained": "true",
      },
    }),
  });

  await assert.rejects(
    () => client.createPrintableStartHere("88888888-8888-4888-8888-888888888888"),
    (error) => error instanceof ApiClientError && error.code === "invalid_export_response",
  );
});

test('a delayed printable body cannot escape after the workspace account changed',async()=>{
  let release,started,changed=false;
  const body=new Promise(resolve=>{release=resolve;});
  const reading=new Promise(resolve=>{started=resolve;});
  const client=createApiClient({csrfTokenReader:()=>null,fetchImpl:async url=>{
    if(url.endsWith('/session'))return changed
      ? jsonResponse({error:{code:'account_changed',message:'Account changed'}},409)
      : jsonResponse({plannerPublicId:'planner-A'});
    const response=new Response('',{status:201,headers:{'content-type':'text/plain; charset=utf-8',
      'content-disposition':'attachment; filename="rillora-start-here-2026-10-03.txt"',
      'x-rillora-export-id':'99999999-9999-4999-8999-999999999999','x-rillora-server-copy-retained':'false'}});
    response.blob=()=>{started();return body;};
    return response;
  }});
  await client.getSession();
  const exportRequest=client.createPrintableStartHere('88888888-8888-4888-8888-888888888888');
  await reading;changed=true;
  await assert.rejects(client.getSession(),error=>error.code==='account_changed');
  release(new Blob(['Planner A synthetic directions']));
  await assert.rejects(exportRequest,error=>error.code==='account_changed');
});

test("synthetic recipient capabilities stay in request bodies and the isolated authorization header", async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: "http://api.example/v1",
    csrfTokenReader: () => "planner-csrf",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ ok: true }, 201);
    },
  });
  const acceptanceToken = "a".repeat(43);
  const sessionToken = "s".repeat(43);
  await client.acceptRecipientRehearsal(acceptanceToken);
  await client.enrollRecipientDeviceKey(sessionToken, {
    deviceLabel: "Synthetic browser",
    publicKey: "p".repeat(87),
  });

  assert.equal(calls[0].url, "http://api.example/recipient-rehearsals/accept");
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].options.headers.has("x-rillora-client"), false);
  assert.equal(calls[0].options.headers.has("x-csrf-token"), false);
  assert.equal(calls[0].url.includes(acceptanceToken), false);
  assert.deepEqual(JSON.parse(calls[0].options.body), { acceptanceToken });
  assert.equal(calls[1].url.includes(sessionToken), false);
  assert.equal(calls[1].options.headers.get("authorization"), `Rillora-Rehearsal ${sessionToken}`);
  assert.equal(calls[1].options.credentials, "omit");
  assert.equal(calls[1].options.headers.has("x-rillora-client"), false);
  assert.equal(JSON.stringify(calls[1].options.body).includes("privateKey"), false);
});

test("disclosure rehearsal mutations are CSRF-bound, versioned, and explicitly simulation-only", async () => {
  const calls = [];
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(disclosureRehearsalResponse());
    },
  });

  await client.createDisclosureRehearsal("death");
  await client.updateDisclosureRehearsal(
    "99999999-9999-4999-8999-999999999999",
    1,
    "advance",
  );

  assert.equal(calls[0].url, "/api/v1/disclosure-rehearsals");
  assert.equal(calls[0].options.headers.get("x-csrf-token"), "csrf-proof");
  assert.deepEqual(JSON.parse(calls[0].options.body), { lifeEvent: "death" });
  assert.equal(
    calls[1].url,
    "/api/v1/disclosure-rehearsals/99999999-9999-4999-8999-999999999999/actions",
  );
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    expectedVersion: 1,
    action: "advance",
    acknowledgesSimulationOnly: true,
  });
});

test("disclosure rehearsal responses fail closed if release or high-risk fields appear", async () => {
  const unsafeRelease = disclosureRehearsalResponse();
  unsafeRelease.disclosureRehearsal.boundaries.dataReleased = true;
  const releaseClient = createApiClient({
    fetchImpl: async () => jsonResponse(unsafeRelease),
  });
  await assert.rejects(
    () => releaseClient.createDisclosureRehearsal("death"),
    (error) => error instanceof ApiClientError
      && error.code === "invalid_disclosure_rehearsal_response",
  );

  const unsafeField = disclosureRehearsalResponse();
  unsafeField.disclosureRehearsal.projectedRoleViews[0].matters = [{
    title: "Bank account",
    accountHint: "do-not-render",
  }];
  const fieldClient = createApiClient({
    fetchImpl: async () => jsonResponse(unsafeField),
  });
  await assert.rejects(
    () => fieldClient.createDisclosureRehearsal("death"),
    (error) => error instanceof ApiClientError
      && error.code === "invalid_disclosure_rehearsal_response",
  );
});

test("role assignment mutations stay versioned, explicit, and record-only", async () => {
  const calls = [];
  const client = createApiClient({
    csrfTokenReader: () => "csrf-proof",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(roleAssignmentResponse());
    },
  });
  const input = {
    personPublicId: "44444444-4444-4444-8444-444444444444",
    role: "executor",
    scope: "matter_specific",
    matterPublicId: "30000000-0000-4000-8000-000000000001",
  };
  await client.createRoleAssignment(input);
  await client.updateRoleAssignment(
    "77777777-7777-4777-8777-777777777777",
    { ...input, expectedVersion: 1, role: "recipient" },
  );
  await client.revokeRoleAssignment("77777777-7777-4777-8777-777777777777", 2);

  assert.deepEqual(JSON.parse(calls[0].options.body), {
    ...input,
    acknowledgesRecordOnly: true,
    acknowledgesNoAuthority: true,
  });
  assert.equal(calls[0].options.headers.get("x-csrf-token"), "csrf-proof");
  assert.equal(JSON.parse(calls[1].options.body).expectedVersion, 1);
  assert.equal(JSON.parse(calls[1].options.body).acknowledgesNoAuthority, true);
  assert.equal(calls[2].options.method, "DELETE");
  assert.equal(calls[2].options.headers.get("if-match"), "2");
});

test("role assignment responses fail closed on unsafe authority or secret fields", async () => {
  const unsafeBoundary = roleAssignmentResponse();
  unsafeBoundary.boundaries.legalAuthorityGranted = true;
  const boundaryClient = createApiClient({
    fetchImpl: async () => jsonResponse(unsafeBoundary),
  });
  await assert.rejects(
    () => boundaryClient.getRoleAssignments(),
    (error) => error instanceof ApiClientError && error.code === "invalid_role_assignment_response",
  );

  const unsafeField = roleAssignmentResponse();
  unsafeField.roleAssignment.privateKey = "never";
  const fieldClient = createApiClient({
    fetchImpl: async () => jsonResponse(unsafeField),
  });
  await assert.rejects(
    () => fieldClient.getRoleAssignments(),
    (error) => error instanceof ApiClientError && error.code === "invalid_role_assignment_response",
  );
});

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function disclosureRehearsalResponse() {
  const boundaries = {
    simulationOnly: true,
    operative: false,
    identityVerified: false,
    documentsVerified: false,
    multiPartyVerified: false,
    notificationsSent: false,
    dataReleased: false,
    releaseAvailable: false,
    legalAuthorityGranted: false,
  };
  return {
    boundaries: { ...boundaries },
    disclosureRehearsal: {
      publicId: "99999999-9999-4999-8999-999999999999",
      lifeEvent: "death",
      state: "death_claim_opened",
      snapshotFresh: true,
      invalidatedAt: null,
      invalidatedReason: null,
      version: 1,
      completedCheckpoints: [{ realEvidenceCollected: false }],
      projectedRoleViews: [{ role: "trusted_contact", matters: [{ title: "Bank account" }] }],
      snapshot: {
        operative: false,
        policyIllustrative: true,
        guardrails: [{ realEvidenceCollected: false }],
      },
      boundaries: { ...boundaries },
    },
  };
}

function roleAssignmentResponse() {
  return {
    boundaries: {
      recordOnlyByDefault: true,
      invitationSent: false,
      identityBound: false,
      legalAuthorityGranted: false,
      accountAccessGranted: false,
      releaseAvailable: false,
    },
    roleAssignment: {
      publicId: "77777777-7777-4777-8777-777777777777",
      person: {
        publicId: "44444444-4444-4444-8444-444444444444",
        displayName: "Maya Chen",
        relationshipLabel: "Sister",
      },
      role: "executor",
      scope: "matter_specific",
      matter: {
        publicId: "30000000-0000-4000-8000-000000000001",
        title: "Bank account",
      },
      status: "draft",
      evidence: "record_only",
      invitationStatus: null,
      editable: true,
      version: 1,
    },
  };
}

test('workspace pins the verified account across pagination and later writes despite a changed CSRF cookie', async () => {
  const calls = []; let csrf = 'A';
  const first = Array.from({length:50},(_,i)=>({publicId:`matter-${i}`,title:`Matter ${i}`}));
  const client = createApiClient({csrfTokenReader:()=>csrf, fetchImpl:async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/overview')) return jsonResponse({session:{plannerPublicId:'planner-A'},plan:{},matters:first,nextCursor:'matter-49'});
    if(url.includes('cursor=')) return jsonResponse({matters:[{publicId:'matter-50',title:'Last matter'}],nextCursor:null});
    return jsonResponse({error:{code:'account_changed',message:'Account changed'}},409);
  }});
  const overview=await client.getOverview();
  assert.equal(overview.matters.length,51); assert.equal(overview.matters[50].title,'Last matter');
  assert.equal(calls[1].options.headers.get('x-rillora-planner'),'planner-A');
  csrf='B';
  await assert.rejects(client.createMatter({title:'A private draft'}),error=>error.code==='account_changed');
  assert.equal(calls[2].options.headers.get('x-csrf-token'),'B');
  assert.equal(calls[2].options.headers.get('x-rillora-planner'),'planner-A');
  await assert.rejects(client.getPlan(),error=>error.code==='account_changed');
  assert.equal(calls.length,3);
});

test('missing original draft records can be checked by ID without discarding archived or failed results', async () => {
  for(const [status,payload] of [[200,{matter:{publicId:'a/b',archivedAt:null}}],
    [200,{matter:{publicId:'a/b',archivedAt:'2026-09-30'}}],
    [404,{error:{code:'matter_not_found'}}],[503,{error:{code:'temporarily_unavailable'}}]]) {
    let requested;
    const client=createApiClient({fetchImpl:async url=>{requested=url;return jsonResponse(payload,status);}});
    if(status===200) assert.deepEqual(await client.getMatter('a/b'),payload);
    else await assert.rejects(client.getMatter('a/b'),error=>error.status===status);
    assert.equal(requested,'/api/v1/matters/a%2Fb');
  }
});

test('pagination fails visibly instead of silently truncating or looping on a repeated cursor',async()=>{
  const client=createApiClient({fetchImpl:async url=>jsonResponse(url.endsWith('/overview')
    ? {session:{plannerPublicId:'a'},matters:[],nextCursor:'same'} : {matters:[],nextCursor:'same'})});
  await assert.rejects(client.getOverview(),error=>error.code==='invalid_pagination');
});

test('every API operation used by a rendered Web consumer exists on the client contract',async()=>{
  const {readdir,readFile}=await import('node:fs/promises');
  const root=new URL('../src/',import.meta.url),client=createApiClient();
  for(const file of await readdir(root,{recursive:true})) {
    if(!/\.jsx$/.test(file))continue;
    const source=await readFile(new URL(file,root),'utf8');
    for(const [,method]of source.matchAll(/\b(?:api|apiClient)\.([A-Za-z][A-Za-z0-9_]*)\s*\(/g)) {
      assert.equal(typeof client[method],'function',`${file} calls missing API client method ${method}`);
    }
  }
});

test('current account identity is bound to the active planner and degrades only for an older server', async () => {
  const publicId='11111111-1111-4111-8111-111111111111', calls=[];
  const client=createApiClient({fetchImpl:async(url)=>{
    calls.push(url);
    if(url.endsWith('/session'))return Response.json({plannerPublicId:publicId});
    if(url.endsWith('/account/identity'))return Response.json({error:{code:'not_found'}},{status:404});
    return Response.json({account:{publicId,displayName:'Synthetic owner'}});
  }});
  await client.getSession();
  assert.deepEqual(await client.getAccountIdentity(),{account:{publicId,displayName:'Synthetic owner',verifiedEmail:null},emailStatus:'unavailable'});
  assert.equal(calls.length,3);
  const changed=createApiClient({fetchImpl:async(url)=>Response.json(url.endsWith('/session')?{plannerPublicId:publicId}:{account:{publicId:'other',displayName:'Other',verifiedEmail:'other@example.test'},emailStatus:'available'})});
  await changed.getSession();
  await assert.rejects(changed.getAccountIdentity(),error=>error.code==='account_changed');
});
test('identity outages never become a stale fallback email or silently select another endpoint',async()=>{
  let requests=0;
  const client=createApiClient({fetchImpl:async()=>{requests++;return Response.json({error:{code:'offline'}},{status:503});}});
  await assert.rejects(client.getAccountIdentity(),error=>error.status===503); assert.equal(requests,1);
  const absent=createApiClient({fetchImpl:async()=>Response.json({account:{publicId:'current',displayName:'Current',verifiedEmail:'not-authoritative@example.test'},emailStatus:'not_provided'})});
  assert.equal((await absent.getAccountIdentity()).account.verifiedEmail,null);
});

test('a private401 invalidates displayed identity but a public sign-in failure does not',async()=>{
  const prior=globalThis.window,target=new EventTarget();let expired=0;target.addEventListener('rillora:session-expired',()=>expired++);globalThis.window=target;
  try{
    const client=createApiClient({fetchImpl:async()=>Response.json({error:{code:'authentication_required'}},{status:401})});
    await assert.rejects(client.getAccountIdentity());assert.equal(expired,1);
    await assert.rejects(client.startAuthentication({}));assert.equal(expired,1);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});

test('identity preserves current verified email across UUID casing and rejects whitespace-only email', async () => {
  const publicId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const client = createApiClient({ fetchImpl: async url => Response.json(url.endsWith('/session')
    ? { plannerPublicId: publicId }
    : { account: { publicId: publicId.toUpperCase(), displayName: 'Current', verifiedEmail: ' owner@example.test ' }, emailStatus: 'available' }) });
  await client.getSession();
  assert.equal((await client.getAccountIdentity()).account.verifiedEmail, 'owner@example.test');
  const invalid = createApiClient({ fetchImpl: async () => Response.json({ account: { publicId, displayName: 'Current', verifiedEmail: '  ' }, emailStatus: 'available' }) });
  await assert.rejects(invalid.getAccountIdentity(), error => error.code === 'invalid_identity');
});
