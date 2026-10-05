import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { en, zhCN } from "../src/i18n/messages/public.js";

const publicExperienceSource = await readFile(
  new URL("../src/PublicExperience.jsx", import.meta.url),
  "utf8",
) + await readFile(new URL('../src/PublicHome.jsx', import.meta.url), 'utf8');
const explorerSource = await readFile(new URL("../src/ContinuityExplorer.jsx", import.meta.url), "utf8");
const legalDocumentSource = await readFile(
  new URL("../src/LegalDocumentPage.jsx", import.meta.url),
  "utf8",
);
const legalContractSource = await readFile(
  new URL("../src/legalContract.js", import.meta.url),
  "utf8",
);
const appSource = await readFile(
  new URL("../src/App.jsx", import.meta.url),
  "utf8",
);
const packageSource = await readFile(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const releaseValidationSource = await readFile(
  new URL("../scripts/validate-legal-release.mjs", import.meta.url),
  "utf8",
);

test("public discovery explains the real product before plan creation", () => {
  assert.doesNotMatch(publicExperienceSource, /Free to start/i);
  assert.doesNotMatch(publicExperienceSource, /Start a private plan/i);
  assert.doesNotMatch(publicExperienceSource, /free plan|free account|no card/i);
  assert.match(publicExperienceSource, /t\("public\.nav\.account"\)/);
  assert.equal(en["public.nav.account"], "Account");
  assert.equal(zhCN["public.nav.account"], "账号");
  assert.doesNotMatch(publicExperienceSource, /useState\(0\)/);
  assert.match(publicExperienceSource, /<ContinuityExplorer/);
  assert.match(publicExperienceSource, /architectural-event-grid/);
  assert.match(explorerSource, /public\.explorer\.what\.title/);
  assert.equal(en["public.explorer.what.title"], "What exists");
  assert.match(explorerSource, /public\.explorer\.next\.title/);
  assert.equal(en["public.explorer.next.title"], "What happens");
  assert.match(explorerSource, /public\.explorer\.who\.title/);
  assert.equal(en["public.explorer.who.title"], "Who can help");
  assert.doesNotMatch(publicExperienceSource, /example|synthetic/i);

  const productExplorer = publicExperienceSource.indexOf("<ContinuityExplorer");
  const eventFacts = publicExperienceSource.indexOf("architectural-event-grid");
  const createAction = publicExperienceSource.indexOf("public.appHome.addFirst");
  assert.ok(productExplorer >= 0 && eventFacts > productExplorer);
  assert.ok(createAction > eventFacts);
  assert.equal(publicExperienceSource.match(/public\.appHome\.addFirst/g)?.length, 1);
  assert.match(publicExperienceSource, /accountPathForMatter/);

});

test("public legal routes and registration clickwrap remain visible without false claims", () => {
  assert.match(publicExperienceSource, /t\("public\.nav\.privacy"\)/);
  assert.equal(en["public.nav.privacy"], "Privacy");
  assert.match(publicExperienceSource, /t\("public\.nav\.terms"\)/);
  assert.equal(en["public.nav.terms"], "Terms");
  assert.match(legalDocumentSource, /Privacy Policy/);
  assert.match(legalDocumentSource, /Terms of Service/);
  assert.match(legalDocumentSource, /<dd>Effective<\/dd>/);
  assert.doesNotMatch(legalDocumentSource, /closed.testing|not yet a production|publication candidate|release.blocked|preview-\d/i);
  assert.match(legalDocumentSource, /does not sell personal information/i);
  assert.match(legalDocumentSource, /does not provide a live claim/i);
  assert.doesNotMatch(legalDocumentSource, /globally legal|guaranteed transfer|military-grade/i);
  assert.match(legalDocumentSource, /Subscription Terms/);
  assert.match(legalDocumentSource, /Refund & Cancellation Policy/);
  assert.match(legalDocumentSource, /Acceptable Use Policy/);
  assert.match(legalDocumentSource, /Cookie Notice/);
  assert.match(legalDocumentSource, /Legal Notice/);
  assert.match(legalDocumentSource, /US\$100/);
  assert.doesNotMatch(legalDocumentSource, /binding arbitration|class-action waiver/i);
  assert.match(publicExperienceSource, /type="checkbox"/);
  assert.match(publicExperienceSource, /checked=\{hasAccepted\}/);
  assert.doesNotMatch(publicExperienceSource, />Continue securely</);
  assert.match(publicExperienceSource, /t\("public\.auth\.signup"\)/);
  assert.equal(en["public.auth.signup"], "Create account");
  assert.match(publicExperienceSource, /t\("public\.auth\.signin"\)/);
  assert.equal(en["public.auth.signin"], "Sign in");
  assert.doesNotMatch(publicExperienceSource, /Before you continue|Continue securely|Agree and create account|Agree and sign in/);
  assert.match(publicExperienceSource, /acceptedElectronicRecords: true/);
  assert.match(publicExperienceSource, /api\.startAuthentication/);
  assert.match(publicExperienceSource, /t\("public\.cookie\.title"\)/);
  assert.equal(en["public.cookie.title"], "Necessary cookies only");
  assert.match(en["public.cookie.description"], /No ads or behavioural analytics/);
  assert.match(publicExperienceSource, /rillora\.cookie-notice/);
  assert.match(publicExperienceSource, /t\("public\.cookie\.review"\)/);
  assert.equal(en["public.cookie.review"], "Review Cookie Notice");
  assert.match(publicExperienceSource, /t\("public\.cookie\.dismiss"\)/);
  assert.equal(en["public.cookie.dismiss"], "Got it");
  assert.doesNotMatch(publicExperienceSource, /Accept all cookies|Reject all cookies/i);
  assert.doesNotMatch(publicExperienceSource, /href=\{signupHref\}|href=\{loginHref\}/);
  assert.match(appSource, /startsOnPublicReadOnlyRoute/);
  assert.match(appSource, /sessionStatus="signed_out"/);
  assert.match(legalDocumentSource, /continuity_auth_tx/);
  assert.match(legalDocumentSource, /continuity_session/);
  assert.match(legalDocumentSource, /continuity_csrf/);
  assert.match(legalDocumentSource, /informational/);
  assert.match(legalDocumentSource, /prior consent for non-essential storage/i);
  assert.match(packageSource, /"build:release"/);
  assert.match(packageSource, /"build:legal"/);
  assert.match(releaseValidationSource, /VITE_LEGAL_OPERATOR_NAME/);
  assert.match(releaseValidationSource, /VITE_LEGAL_SERVICE_ADDRESS/);

  const declaredDigest = legalContractSource.match(/bundleSha256: "([0-9a-f]{64})"/)?.[1];
  assert.equal(
    declaredDigest,
    createHash("sha256").update(legalDocumentSource).digest("hex"),
  );
});
