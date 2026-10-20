import test from "node:test";
import assert from "node:assert/strict";
import { readWorkspaceRoute, workspaceURL, drawerRoute } from "../src/workspaceNavigation.js";

test("restores existing root destinations, filters and selected matter", () => {
  const route = readWorkspaceRoute("/?view=matters&q=Bank&filter=review&task=matter&matter=11111111-1111-4111-8111-111111111111");
  assert.deepEqual(readWorkspaceRoute(workspaceURL(route)), route);
  for (const view of ["settings", "more", "contacts", "maintenance", "guides", "access", "activity"]) assert.equal(readWorkspaceRoute(`/?view=${view}`).view, view);
});
test("unknown tasks and invalid identifiers cannot become arbitrary navigation", () => {
  const route = readWorkspaceRoute("/?view=https://example.test&task=delete-account&matter=not-an-id&filter=hidden");
  assert.equal(route.view, "overview"); assert.equal(route.task, null); assert.equal(route.id, null); assert.equal(route.filter, "all");
});
test("draft fields and invitation credentials stay out of history", () => {
  const safe = drawerRoute({ type: "matter-create", category: "crypto_asset", title: "Private title", notes: "Private notes", invitationToken: "private-token" });
  const url = workspaceURL({view:"matters",q:"",filter:"all",...safe});
  assert.equal(url, "/?view=matters&task=matter-create&category=crypto_asset");
  assert.equal(readWorkspaceRoute(url).category, "crypto_asset");
});
test("account and authentication-return destinations remain intact", () => {
  assert.equal(readWorkspaceRoute("/account").view, "settings");
  assert.equal(readWorkspaceRoute("/?next=reviews").view, "maintenance");
  assert.equal(readWorkspaceRoute("/?next=shared").view, "shared");
});

test('legacy guide and account continuations hydrate only the authenticated guide task', () => {
  for (const path of ['/guides?service=coinbase', '/account?next=guides&service=coinbase&matter=11111111-1111-4111-8111-111111111111']) {
    const route=readWorkspaceRoute(path);
    assert.equal(workspaceURL(route),'/?view=guides&task=provider-guide&provider=coinbase');
    assert.equal(route.id,null);
  }
  assert.equal(workspaceURL(readWorkspaceRoute('/guides?service=unknown&task=delete-account')), '/?view=guides');
});

test('every catalog guide survives drawer navigation, reload and Back round trips', async () => {
  const { guideIdentifiers } = await import('../src/guideIdentifiers.js');
  for (const providerKey of guideIdentifiers) {
    const route = readWorkspaceRoute(`/?view=guides&task=provider-guide&provider=${providerKey}`);
    assert.equal(route.providerKey, providerKey);
    assert.equal(readWorkspaceRoute(workspaceURL(route)).providerKey, providerKey);
  }
  assert.equal(readWorkspaceRoute('/?view=guides&task=provider-guide&provider=unknown-provider').providerKey, null);
});

test("retired My plan links safely return to Overview without hiding billing", () => {
  assert.equal(readWorkspaceRoute("/?view=plan").view, "overview");
  assert.equal(readWorkspaceRoute("/account/billing").view, "access");
});
