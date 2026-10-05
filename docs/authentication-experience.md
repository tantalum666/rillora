# Rillora Authentication Experience Contract

Role: focused product, visual and implementation contract for account authentication  
Authority scope: Auth0 identity boundary, direct hosted iOS entry, hosted appearance, prompt-state behavior and evidence requirements  
Superseded by: later Owner direction recorded in `docs/decision-log.md`  
Do not use for: credential storage, API authorization rules, production identity approval or legal claims  
Status: HOSTED SIGN-IN OBSERVED; WEB ACCOUNT CHOICE/REAUTH VERIFIED; SIGNUP GUIDANCE APPLIED
Last updated: 2026-10-05 (Asia/Hong_Kong)

## October5 explicit account choice on ordinary Web entry

Actual continuation of the disposable-account test found that a fresh click on
Account Sign in could silently return to the previous QQ identity via Auth0 SSO,
even after the Rillora session had been signed out. Identity was checked before
any import or deletion, so no records were written to the wrong account.

Ordinary Account sign-in/signup now requests the existingselectAccount option,
which the existing API translates toprompt=login. An active Rillora session is
unchanged; only a user-triggered new identity transaction opens the hosted form.
The user can choose the intended identity. Signup still usesscreen_hint=signup;
return intent, unchecked legal control/versions and session security stay unchanged.
No account picker layout, provider configuration or tenant-wide SSO switch is added.

29 focused existing Web/API-client/return checks, the review production build and
CI54 pass. The Web-only rollout is complete and86live files match. The actual hosted
form then accepted the intended disposable identity. Its later naturally aged
authentication returned403; same-account reauthentication and explicit export retry
returned200and produced a saved file. Owner subsequently retained the isolated
account and deferred final deletion; its temporary review access is now removed.
Auth0 documents the [prompt behavior](https://support.auth0.com/center/s/article/Clarification-about-what-happens-when-the-prompt-parameter-is-not-sent-to-authorize).
This is an account-choice UX control, not a substitute for server-side recent-auth
verification. Current evidence continues in[the core contract](real-core-acceptance-20261004.md).

## October2 duplicate-signup guidance

Owner reported a generic error after accidentally choosing signup for an existing
account. The Auth0 failure log identifies a duplicate. Supported signup-password
text now has a direct Sign in / Forgot password instruction for email-in-use and
a conditional instruction for generic validation failures. Existing enumeration
protection and hosted layout remain. No public account lookup or automatic linking
is introduced. Owner completed the actual expired administrator login on October2.
The same-scope CLI renewal and two-key GET/merge/PUT/readback succeeded; all other
text and security settings remain unchanged. This English prompt text is tenant-wide,
including the existing Preview hosted flow. Actual repeated error rendering has
not been retested. See the [current acceptance record](release-123-20261001.md).

## September30 sensitive-action verification

The ordinary hosted sign-in composition remains. A sensitive action with missing or
older-than-ten-minute verified authentication opens a compact Sign in again / Keep
editing prompt. Web retains its editing window while authenticating in a separate
window; native uses the hosted system session over the current editor. Cancellation
keeps the draft and original account. A successful return never automatically repeats
the sensitive action. Another identity cannot replace this bound session.
[Current implementation and provider limitations](release-engineering-20260930.md).


## 2026-09-17 Email verification continuation — deployed and verified

Owner completed real B registration/email verification/acceptance and reported that returning from verification unnecessarily required another sign-in. The local Rillora session had captured email proof only at issuance, and the Web error reused the account-switch action, which logged out and requested `prompt=login`.

Preserve the current account, legal receipt and protected invitation handoff. For a session missing verified email proof, the server looks up its exact stored issuer/subject through a dedicated Auth0 service granted only `read:users`, accepts only the matching `user_id` with boolean `email_verified=true`, and stores only the email digest in that same active session. It never sets the provider flag, accepts client-provided identity/email proof, links same-email accounts, renews session age or creates a new consent receipt. Current legal/authentication/CSRF checks still apply. User-ID lookup is [immediately consistent](https://auth0.com/docs/manage-users/user-search/get-users-by-id-or-email); verification links [update Auth0's flag](https://auth0.com/docs/manage-users/user-accounts/verify-emails).

Web/iOS retain the existing invitation composition and show `I've verified my email` after an unverified attempt. Returning to the page checks the current proof; explicit acceptance still governs sharing. Only an intentional `Use another account` invokes logout. Provider failure retains the invitation and supports retry. Migration0060 is applied with its source checksum, the dedicated secret is installed, and API30 is healthy on regular Fargate. Actual Auth0/cloud checks verify false proof is denied and a later true proof accepts the same invitation with the same opaque session and one unchanged legal receipt. The provider flag was changed only on a disposable administrator-controlled fixture; a new real signup/email ceremony after this fix is not claimed. An actual read-only lookup also matched B's already verified profile without modifying it. [Evidence](../output/qa/rillora-real-invitation-20260917/README.md).

### Latest Web return and consent ordering

Owner explicitly requests a return control and the agreement below the signup/sign-in choices. The received-invitation header now has an explicit Back link; `from=shared` is a fixed, non-secret context marker retained through resolve, authentication and reload. Only that known marker selects `/?view=shared`; other/direct entries return to Rillora. No arbitrary return URL is accepted. Both Web account and invitation choices precede the same unchecked consent block. Actions stay disabled until consent is checked and disable again when withdrawn. The current hosted/native consent form, wording, versions and digest are unchanged. Empty recipient lists use `No shared items`, including after revocation.

## 2026-09-11 Account wording, invitation signup and login return — Current

The public identity entry is always `Sign in / Sign up`, including expired sessions. Received invitations are reachable while signed out; outgoing invitations and contact management remain authenticated. The invitation offers `Create account to accept` and `Already have an account? Sign in`, retains its protected handoff, and returns to explicit acceptance after the chosen hosted flow. The signup route uses Auth0's supported `screen_hint=signup`; no public email-account lookup or account merging is added.

Native session issuance can now include an initial overview after identity and current legal-proof verification. Only after the opaque token is saved and its planner matches does the app publish that overview, without five follow-up requests or an `Opening Rillora` interstitial. A missing initial payload uses the authenticated aggregate `/v1/overview` fallback. Web also loads its core map through this endpoint and defers checks, activity and commerce. Network/provider validation still takes real time; zero latency is not promised. Source, local tests and actual UI are recorded in [this revision](account-matter-ux.md) and its QA; hosted provider settings were not changed.

## 2026-09-09 Apple restoration — Current

The Owner's default project authorization closes the earlier concrete rotation
approval question. The Owner also completed Auth0 administrator MFA. A replacement
key limited to the existing Rillora primary App was issued, downloaded directly
into the protected ignored directory and applied to the existing Auth0 Apple
connection with Services ID `com.rillora.auth`. Secret and public-option readback
matched before the exact old login key was revoked. Apple now lists only the
replacement. Only the existing Rillora iOS binding was restored.

The live email-first page displays Passkey, Google and Apple below Continue.
At 390px and 320px there is no horizontal overflow; provider buttons remain
52px high. The hosted filled-input color now uses muted gray `#DAD8CF`.
The redundant identifier introduction is omitted; Google-method guidance is
preserved and actually observed before password entry. This removes 24px from
the 390px layout and 48px from the earlier wrapping introduction at 320px.
The supported custom-text value is one space because an empty string restores
Auth0's generic default description. No CSS/font reduction or recovery-link
removal is used to obtain that compactness.
Clicking Apple in the browser reaches `appleid.apple.com/auth/authorize` for
Rillora Account with the exact Services ID and callback, without invalid-client
or development-key error. Browser Back returns to the same method chooser.
Fresh iOS entry and cancellation back to Sign in again are also observed.

This closes key/configuration and provider-entry checks, not an end-user Apple
identity, legal acceptance or private-map callback. The separate StoreKit key,
existing account mappings and consent contract are unchanged. Safe readbacks,
images and remaining limits are in [the restoration report](../output/qa/rillora-apple-restore-20260909/README.md).

## 2026-09-07 Email-first layout and Apple restoration — Earlier checkpoint

The key-approval/preparation state below is historical and closed by September 9.

The Owner explicitly places email and Continue first, with other methods below.
The shortened Google reminder remains useful while reducing header height. The
supported theme and text were applied and read back; 390px/320px and actual iOS
hosting checks confirm the order, readable wrapping and no horizontal overflow.

Apple's missing web Services ID is now registered as `com.rillora.auth`, grouped
with `com.rillora.ios`, with the exact login domain and Auth0 callback URL saved
and reopened. Both Apple and Auth0 still reference the previously exposed login
key. A replacement draft is prepared with only Rillora Sign in with Apple; no
new key has been registered and no old key revoked. Owner approval is pending
for the concrete rotation/storage/Auth0 transmission/revocation plan. Restore
the Apple binding only after that approved rotation is verified. The StoreKit
key and unrelated apps are not part of it.

Exact readbacks and images are in
[the email-first follow-up](../output/qa/rillora-email-first-20260907/README.md).

## 2026-09-06 Direct Hosted Entry — Earlier entry checkpoint

The Owner explicitly chose “删除图一，直接使用托管登录”. The native Account
intermediary is removed. Overview, Matters and Profile enter Auth0 Web Auth
immediately; the iOS domain-sharing notice is system-owned. Email, password,
provider choice and recovery stay in the existing hosted experience. This
supersedes the native/hybrid primary-entry requirement below.

The consent source moves with the entry. A required hosted `LEGAL` field and
client-scoped Post Login Action produce the exact current receipt. The iOS
service validates its fields and versions before session exchange; JWT decoding
is not signature verification, so the same access token must still be verified
by the API. The configuration stores no consent in Auth0 user metadata and creates
no M2M application, vault or secret. A new-flow marker avoids adding an extra
step to older native builds. The hosted legal confirmation can be a separate
step inside Auth0 after identity authentication; it does not collect email again
or reintroduce a native legal page.

Configuration source and apply instructions are in
[the hosted-consent configuration](../infra/auth0/hosted-consent/README.md). The
Owner completed CLI reauthentication. The required Form and Action were created,
the deployed code was checked, and the Post Login binding was read back. The
new Debug app is installed and directly reaches the hosted email screen.
The Owner completed Google identity, required hosted confirmation and the
Rillora callback; the ordinary cloud Debug app displayed the private map.
The final Form initial, unchecked-error and cancel states are independently
checked in the real hosted container without agent-submitted acceptance.
The source, test and remaining-gate report is
`output/qa/rillora-single-hosted-entry-20260906/README.md`.

### Returning-user method clarity and hosted confirmation layout

An Owner attempt exposed a real recovery problem: an existing social identity
was being mistaken for a separate email/password account. The Owner subsequently requested email first. The hosted theme now
places email and Continue above the other methods, and the password description explains
how a person who registered with Google can return through Google. This is
generic guidance shown to everyone; the public form does not disclose which
provider is attached to an arbitrary email address.

Same-email account linking is not enabled. Auth0 recommends authenticating both
identities before any linking operation. A future linking task must also
preserve the existing Rillora planner and acceptance/session relationships; an
email match alone is not authority to combine private maps. See
[Auth0 account-linking precautions](https://auth0.com/docs/manage-users/user-accounts/user-account-linking).

The first actual hosted confirmation exposed a template interaction that local
schema tests could not detect: the generic 44px action rule also made legal
links tall inline-flex boxes, and it left the Form action text left-aligned.
Legal links now remain inline; actual action buttons remain at least 44px and
center their content. The Form uses a concise Account terms title, transparent
inner surface, readable 14px legal text and a 48px primary action through the
supported Form CSS, fixed classes and semantic HTML selectors. Real visual
verification, not the definition alone, decides acceptance. The final initial
and error images are accepted. The template API returned 402, so Form-local CSS
supplies the repair while the existing global template remains unchanged.
Its rules preserve hidden controls and error-color inheritance; an earlier
broad display override and light error notice were explicitly rejected.

## 2026-09-06 Whole-app follow-up verification — Earlier Checkpoint

The Owner’s gray-input and footer-removal refinement is implemented and
visually verified in both empty and typed Account states. Every method remains
gated by the same unchecked consent, and reopening still resets it. Current
native units pass `111 / 0 / 1`; the whole-app UI ledger has 14 standard-size
passes and an additional AX5 journey. The newer report is
`output/qa/rillora-full-app-ux-20260906/README.md`. This work does not add a real
provider login or close the separate Apple identity-key gate. The runtime
verification below is retained as the earlier authentication-specific checkpoint.

## 2026-09-06 Native Account runtime verification — Historical

The already-booted `Rillora-Matrix-17-Pro` on iOS 26.5 now runs the current
native Account. Full unit coverage is `106 passed / 0 failed / 1 skipped`;
the skip is the existing StoreKit environment case. Three focused default-size
UI tests and the three-entry consent test at AX5 pass. These tests use an
explicit signed-out fixture, enter only a synthetic `.invalid` address, and do
not submit an identity or create acceptance/session records.

Runtime inspection closes native placement, initially unchecked/checked/revoked
checkbox behavior, email validity, Apple＋Passkey visibility, Google absence,
Cancel/reopen reset, native Terms/Privacy links into Safari and return, hosted
system-notice cancellation, and native Passkey request cancellation. The
Passkey request reaches Apple's cross-device UI and a Bluetooth-off notice;
Bluetooth was not changed, no credential was selected, and no completed
assertion, Auth0 token or Rillora session is claimed.

Visual review repaired horizontal method dividers, gave the email field an
explicit accessibility label, dismissed the keyboard before provider handoff,
locked input/consent while working and clarified the email fallback. AX5
screenshots exposed mid-word wrapping in the fallback label despite a passing
interaction test; optional method icons/arrows are now omitted at accessibility
sizes and the divider can grow with its text. Default and AX5 final images are
retained in `output/qa/rillora-native-hybrid-20260906/`.

Runtime builds must retain Simulator local signing. A compile-only
`CODE_SIGNING_ALLOWED=NO` artifact produced `The secure session store is
unavailable`; rebuilding with local ad-hoc signing (`CODE_SIGNING_ALLOWED=YES`,
`CODE_SIGN_IDENTITY=-`) restored the normal Keychain-backed public launch.
Do not solve that build-artifact issue by replacing the normal session store
with the volatile test fixture or by weakening Keychain errors.

The next identity proof requires the Owner to complete the system credential
ceremony with an available Rillora passkey, or first establish one through an
Owner-controlled hosted account flow. Apple identity-key rotation remains a
separate gate. The previous manual-Simulator-boot gate is closed; physical
devices remain deferred. See `docs/handoff.md` for the current action.

## Decision

### 2026-09-05 Auth0 CLI readback selects Passkey now and defers native Google

The installed Auth0 plugin provides instructions rather than an MCP server, so the official Auth0 CLI／Management API is now the configuration surface. After Owner device confirmation, sanitized readback verified the native client, Apple, Google connection, API audience, database Passkey policy, iOS Device Settings and custom-domain AASA without exposing credentials.

Auth0's Free built-in Google native-social setting currently requires an Android `app_package_name`; the official setup page is Android-specific. A minimal Apple-preserving PATCH was rejected before mutation, and Custom Token Exchange profiles are a separate paid capability. Rillora must not fake an Android package or buy an identity tier before revenue merely to remove the hosted Google step. The iOS Google code and public Google client remain dormant／hidden; hosted Google stays in `Other sign-in methods`.

Native Passkey is included on the current plan and all prerequisites passed. The Auth0 client now retains Authorization Code and adds the official WebAuthn grant; a custom-domain challenge probe returns 200 with RP ID `login.rillora.xyz`. Debug enables Passkey, Release keeps it off, and Apple remains native. System cancellation from Google／Passkey is quiet rather than rendered as an error. Final Debug test-target and Release builds pass; runtime still waits for an Owner-booted Simulator.

### 2026-09-04 Auth0 remains the backend; iOS becomes native／hybrid

The Owner approved the recommendation to separate identity authority from presentation. Auth0 continues to issue and verify identity tokens and to own hosted recovery／complex challenge fallback. The primary iOS experience is now a native Account surface. This supersedes the same-day hosted-Form plan before any tenant resource was deployed; its local Form, Action, contract and preview files were deleted.

The native Account view contains one email field and places the small unchecked Terms／Privacy／electronic-record row immediately below it. It is not another legal-only sheet: no legal heading hierarchy, disclaimer paragraph, document-version cards or separate `Agree and continue` page. Email, Apple, Google, Passkey and fallback actions all depend on the same local affirmative state and exact `.current` proof; recurring payment remains separately consented.

Apple uses the existing native `AuthenticationServices` token exchange. Google uses GoogleSignIn `9.0.0` to obtain a native Google ID token and Auth0's native-social token exchange; it is visible only when the explicit flag plus iOS and server client IDs are complete. Passkey uses Auth0.swift's passkey challenge／login methods plus Apple's platform credential provider and the `webcredentials:login.rillora.xyz` entitlement; it is visible only after its explicit flag is enabled. Email and exceptional methods retain a transparent `login.rillora.xyz` fallback, with optional validated `login_hint`, so Rillora never renders or handles an Auth0 password field.

At the end of the 2026-09-04 implementation, Debug kept Google and Passkey off pending tenant readback. The newer 2026-09-05 section closes that readback: Google remains hidden on a verified Auth0 iOS／plan boundary, while the Free native Passkey backend passes and Debug enables its button. Release still keeps both off and runtime evidence remains open.

### 2026-09-04 superseded hosted-consent attempt

The Owner rejected the actual Simulator result: a full-screen native `Terms & privacy` sheet appeared before hosted authentication and repeated a heading, product disclaimer, two version cards, long consent text and a dedicated `Agree and continue` action. The requested model is explicit: tapping sign-in should enter `login.rillora.xyz` directly, and the agreement must appear there as an understated unchecked checkbox with small linked text rather than a separate text-heavy page. This latest direction supersedes the earlier local-native-sheet approval. No physical-device deployment or test belongs to this workstream.

`AppShellView` now starts Auth0 directly and no longer owns a legal-consent sheet destination. The rejected `LegalConsentSheet.swift` file is removed. To prevent visual removal from becoming silent acceptance, the native service checks for the exact `https://rillora.xyz/legal-acceptance` claim in the Auth0 access token before session exchange; missing, malformed, false or stale proof is rejected. The Rillora API continues to receive the current exact version／digest payload only after this hosted proof passes.

Auth0's supported Free-tier path is a Post Login Form rendered before token issuance. Prompt Customization is the only supported way to place a field literally inside the existing identifier widget, but the current pricing matrix excludes it from Free; manipulating private widget DOM from the outer Liquid page is explicitly unstable. The selected Forms design remains on `login.rillora.xyz` and contains only `Terms & privacy`, one required 11px checkbox line, a 10px `Required for account access. No recurring charge.` boundary and Continue. It writes versioned Auth0 app metadata and emits the exact signed ID／access-token claim; it does not rely on the client merely displaying a checkbox.

The first staged target is only `Rillora iOS`. Web keeps its existing compact pre-auth control until the hosted iOS proof passes, avoiding a double prompt for current Web testing. The reusable contract, local preview and fail-closed Action source pass `8 / 8`; the iOS suite reports `104 passed / 0 failed / 1 skipped`. Simulator runtime proves `Profile -> Sign in / Sign up -> standard system authorization notice -> login.rillora.xyz` with no native legal page and no selected identity. Local hosted-preview interaction proves unchecked disabled and checked enabled with no console warning／error.

The development tenant did not change because both Auth0 browser sessions and the CLI required Owner reauthentication. The Owner then selected the native／hybrid direction above before deployment. Do not create the Form／Action or retain the hosted-claim check as a competing default.

### 2026-09-03 Google OAuth legal-link completion

Google Cloud project `rillora-identity` now persists the public consent-screen metadata required by the current Testing configuration: homepage `https://rillora.xyz`, Privacy `https://legal.rillora.xyz/privacy` and Terms `https://legal.rillora.xyz/terms`. The Owner confirmed the final Save action. A fresh Branding reload returned all three exact values, `rillora.xyz` remained the only authorized domain, and Save returned to disabled. Audience readback remained External／Testing, retained the test-user section and no longer showed the incomplete-configuration warning.

This change did not alter clients, JavaScript origins, redirect URIs, scopes, test users, contacts, credentials, Auth0 connections or Google publication. It is not Google verification, a production consent release, a new account acceptance or a new callback proof. At that checkpoint the compact client pre-auth controls and server record remained the account／session gate; the newer 2026-09-04 section supersedes that placement for iOS.

The Web OAuth client previously had two enabled secrets. After separate Owner action-time confirmation, the older unused item was mapped by its creation time, deactivated and deleted; the later Auth0 credential was not touched. Fresh client-detail readback shows exactly one secret entry, created at 17:00:08 GMT+8 and Enabled; the old item and Google's multiple-secret warning are absent. The single JavaScript origin and callback URI remain exact. No secret value or suffix belongs in Markdown or QA output.

### 2026-08-28 compact form-tail consent preview

The Owner observed that the Web legal control was positioned as a large surface above the account actions, while current signup forms keep legal copy and any checkbox at the form tail near the submit action. Current-run screenshots of Dropbox, Bitwarden, 1Password, Proton and GitLab confirm the placement pattern, although several use passive click-through text and reserve checkboxes for optional marketing. Rillora still requires an unchecked legal checkbox because the API records exact affirmative acceptance; the visual treatment, not the server proof, was the problem.

The local Web Account preview removes the bordered `Before you continue` fieldset, legend and duplicated `Agree and…` button labels. After the Owner found the first compact pass still too prominent, the separate `Continue securely` heading／description were also removed. The final preview uses a muted 11px native checkbox label, neutral links, a 10px shortened non-billing note, `Create account` and `Sign in`. The unchecked state disables both actions; checked enables them. Exact Terms／Privacy／electronic-record meaning, versions, digest and `POST /auth/start` proof remain unchanged.

The static Auth0 signup fixture now demonstrates the intended final placement: Email input, muted unchecked legal checkbox, short non-billing note, then `Create account`; links remain inline and the checkbox enables the button. The second pass reduces the label to 11px, the boundary to 10px and removes sage emphasis from the links so the input and CTA own the hierarchy. This fixture is visual evidence only. The tenant page template, Prompt Customization, database／passkey fields, social redirect, returning-user acceptance lookup and iOS flow have not changed. The existing Web pre-auth gate remains authoritative until a separately approved and verified cross-surface migration replaces it.

Current evidence: Web `41 / 41`, internal build, desktop and `390 × 844` Account screenshots, checked／unchecked interaction and zero Browser console warnings／errors pass. Exact visual QA and limitations are in `design-qa.md`. The next product action is Owner visual review of this compact preview, not Auth0 deployment.

Owner approval on 2026-08-29 locks the second-pass treatment: no consent heading／card／preamble, 16px unchecked native control, muted 11px label, neutral links, 10px short non-billing boundary and ordinary `Create account`／`Sign in` actions. This approves the local Web visual and static Auth0 target only. It does not authorize an unverified tenant mutation or choose between Auth0 database-field, social-redirect and Rillora post-identity checkpoint mechanisms.

Current official Auth0 verification closes the immediate migration direction. Signup／Login Prompt Partials can render and validate exactly this checkbox below database or passkey inputs, but Auth0 currently limits `Customize Signup & Login` to Professional／Enterprise; the Rillora tenant is Free. More importantly, Auth0 explicitly does not capture partial form values for social／enterprise connections, so Google／Apple would still need a Post Login Redirect or separate Rillora checkpoint. A paid partial therefore would not create one uniform acceptance path.

Superseded placement decision: the Free-tier Auth0 Form was considered after removing the legal-only sheet, but was never deployed. The later 2026-09-04 Owner decision selects a native Account surface with inline consent, native Apple／Google／Passkey as their prerequisites pass, and hosted email／challenge fallback. Web remains unchanged until its own deliberate migration.

### 2026-08-24 mandatory legal-consent preflight

The current synchronized formal contract is `terms-2026-08-27-1`, `privacy-2026-08-27-1`, `registration-clickwrap-2026-08-24-1` and bundle SHA-256 `73d9cb6039b97f72d802e543d03944355e68b2bc59a7f859326ce3236b704d2b`. The public necessary-cookie information banner is separate from this account clickwrap: selecting `Got it` does not accept Terms, acknowledge Privacy, consent to electronic records, create an account or authorize optional storage.

At the 2026-08-24 checkpoint, the Owner's then-new instruction added one pre-authentication surface without reversing Universal Login: a compact Rillora legal-consent gate with no email, password, passkey, Apple or Google control. Web kept distinct `Agree and create account`／`Agree and sign in` task buttons and iOS opened hosted authentication after a native sheet. The 2026-09-04 section supersedes that iOS placement and deletes the native sheet while retaining the same affirmative versioned evidence.

This is not client-only evidence. Web uses JSON `POST /auth/start`; iOS includes the same proof in native exchange. The API rejects the legacy GET login route, stale versions, wrong bundle digest, unknown fields and missing／false actions. It provisions the planner, append-only acceptance and session in one transaction and refuses any real Cookie／Bearer session without the current linked acceptance. Changing the legal bundle invalidates older sessions for private use and requires re-consent.

Auth0 remains credential authority. A direct Auth0 social or database identity cannot create or use a Rillora planner without the server proof. Database signup may later add a Pre User Registration validation field and social signup may use a Post Login Redirect Action as defence in depth, but neither replaces Rillora's evidence. No Auth0 tenant configuration was changed in this local work; external Action／Prompt deployment waits for publicly reachable legal URLs and rollback verification.

Rillora presents a branded account experience on the verified custom domain
`login.rillora.xyz`, while Auth0 Universal Login remains the credential and
authentication authority. The product does not embed a password form inside the
Rillora app, proxy a password through the Rillora API or use Resource Owner
Password Grant.

For the current Auth0 EU Free development tenant, the approved implementation
is:

1. New Universal Login;
2. the existing custom domain;
3. a Rillora Liquid Page Template around every standard Auth0 prompt;
4. a complete Rillora branding theme for the Auth0 widget;
5. carefully scoped custom text for the screens actually used;
6. Auth0-owned password, passkey, social-login, recovery, attack-protection and
   challenge behavior.

Advanced Customizations for Universal Login is not the current dependency. It
requires a paid tenant during its current Early Access phase and adds a
Rillora-hosted asset/CDN/CI surface to authentication. It may be reconsidered
when the standard prompt cannot meet an observed product requirement, not just
to eliminate the visual resemblance to a secure hosted login.

### Current iOS entry

All current iOS sign-in/private intents open hosted authentication directly.
There is no AccountAccessView, native email preflight or native chooser. The
deployed hosted receipt configuration, exact acceptance contract and current
evidence boundaries are described at the top of this document. Earlier native
provider and Account screenshots remain historical/configuration evidence.

## Entry Contract

- Public browsing stays available without authentication.
- Private/create/sign-in intents enter the existing hosted domain directly;
  no native email/checkbox/method page appears first.
- Registration, password entry, provider choice and recovery belong to the
  hosted experience. The exact required legal checkbox belongs to that hosted
  transaction. Cancellation returns to the source without an error.
- The new iOS route accepts no local affirmative-proof parameter. Missing,
  false, malformed or stale hosted receipts stop before API session exchange.
- Existing Rillora acceptance/planner/session atomicity, token verification and
  Keychain-only opaque session storage remain required.
- Hosted UI, Action/binding readback, real identity and session outcome are
  separate checks; compiled code is not deployed authentication.

## Visual Contract

The hosted page is part of the current graphite Rillora system, not a separate
white identity microsite.

| Role | Value |
| --- | --- |
| Canvas | `#171C1C` |
| Main surface | `#1D2322` |
| Muted/input surface | `#252C29` / canvas where contrast is clearer |
| Primary ink | `#F1ECE2` |
| Body | `#DAD8CF` |
| Muted | `#B8BAB2` |
| Eucalyptus structure | `#9BB180`; a lighter `#BFD79A` is allowed for focus and compact interactive labels |
| Clay primary action | `#CB704C`, with graphite label text where needed for accessible contrast |
| Border | `#39433F` or a higher-contrast task border |

Additional rules:

- no gradients, glow, glass, white authentication card, memorial imagery,
  password-vault imagery or fake shield claim;
- desktop may use one quiet editorial brand panel and one task panel;
- compact/mobile presentation removes the editorial panel and shows only the
  Rillora wordmark plus the authentication task;
- the page must remain vertically scrollable when Auth0 adds password rules,
  passkey education, challenge choices or error content;
- Auth0 implementation class names and internal DOM structure are not CSS
  targets because Auth0 can change them;
- the final logo is unresolved. The hosted page uses the text wordmark and
  hides the Auth0 widget logo until an approved identity asset exists;
- the unresolved favicon is represented by an empty data-URI, not a missing
  `/favicon.ico` request or an improvised product symbol;
- the browser-owned `login.rillora.xyz` chrome remains visible for hosted
  methods. Rillora does not imitate a native credential form to hide the origin;
- on the graphite hosted page, the monochrome Apple provider glyph is rendered
  white through Auth0's stable `data-provider="apple"` attributes; Google's
  multicolor brand mark is not recolored;
- the upper-right coral warning remains visible while any social connection
  uses Auth0 development keys. It must not be hidden or styled to look like a
  product error. Its disappearance may be accepted only after the relevant
  connection has an Owner-controlled OAuth client and the live prompt is
  checked again.

## Prompt Family

The same page template and theme must cover the complete reachable family. A
screen is not considered designed merely because signup looks correct.

| State | Required behavior |
| --- | --- |
| Signup identifier | `Create your account`; ask for the identifier and show configured social choices |
| Signup password | explain the password task without marketing or a security guarantee |
| Existing-account conflict | state that the account exists and offer sign-in; preserve entered identifier when Auth0 safely supports it |
| Login identifier | `Welcome back`; identify the account task rather than restating application names |
| Login password | show the identifier, password task, recovery link and safe method switching |
| Passkey enrollment/login | keep Auth0's capability and platform guidance; do not claim native iOS passkey evidence from a Web flow |
| Password recovery request | avoid account enumeration and use the same result for existing/non-existing identifiers |
| Recovery result | explain that email delivery may take time and never claim delivery before Auth0 reports it |
| Email verification | show verified, already-used, expired and unknown-error outcomes distinctly |
| Bot/MFA challenge | preserve Auth0 challenge semantics and retry/method switching |
| General error | keep a usable back/retry path and show a support path only when a real support destination exists |

Only keys observed in the current Auth0 prompt schema are customized. Default
Auth0 security and recovery wording remains when a Rillora replacement would
reduce accuracy or when the state has not been exercised.

## Responsive And Accessibility Contract

- no horizontal overflow at `320`, `390` and desktop widths;
- at least a 44-point-equivalent target for visible primary, secondary and
  method-switching actions;
- visible focus indicator and sufficient label/action contrast;
- field labels are persistent; placeholder text is not the sole label;
- zoom, larger browser text and Auth0-added error/password content must not be
  clipped by a fixed-height container;
- reduced-motion preference disables decorative movement;
- heading hierarchy and landmarks remain meaningful around the Auth0 widget;
- English is the only currently checked locale. Other locales remain unverified
  until their translated prompt copy and expansion are inspected.

## Implementation Source

- `infra/auth0/universal-login/page-template.liquid` — uploaded page shell;
- `infra/auth0/universal-login/theme.json` — desired Auth0 theme;
- `infra/auth0/universal-login/preview.html` — non-authenticating visual QA
  fixture only;
- `infra/auth0/universal-login/custom-text/*.en.json` — scoped English prompt
  dictionaries;
- `tools/auth0/apply-universal-login.sh` — backup, create-or-update and exact
  theme/template readback;
- `tools/auth0/apply-custom-text.sh` — prompt-dictionary backup, update and
  exact readback;
- `infra/auth0/README.md` — readback, apply, verification and rollback sequence.

## Verification Gate

Before reporting this experience as verified:

1. capture the existing tenant theme/template readback;
2. apply through the official CLI/Management API without exposing a token;
3. read the live theme and template back from the development tenant;
4. reach hosted signup and login from Web Account; verify iOS Profile sign-in
   and private Overview/Matters intents enter the hosted transaction directly;
5. visually inspect desktop and compact widths;
6. check Google, password, passkey/challenge visibility, recovery entry, cancel,
   callback and error behavior without creating or emailing a person unless the
   Owner performs that step;
7. before claiming Apple login complete, verify the current hosted Apple
   authorization, Auth0 callback, exact legal receipt, Rillora session,
   private-plan load and sign-out. September 9 closed configuration/key rotation;
   an Apple entry page or StoreKit evidence cannot prove the identity callback;
8. record exact checked states and every untested state.

For current iOS, `public-profile.sign-in` must begin hosted authentication.
No `account-access.*` chooser/email/consent surface should appear. Those and
`account-entry.*` identifiers are historical. Verify source/category/draft
preservation on system-notice and hosted-browser cancellation, then a fresh
transaction from Overview, Matters and Profile. In the hosted flow verify
email-first layout, available Google/Apple/passkey controls, compact spacing,
unchecked/checked/error legal states and the exact receipt before session exchange.
Provider visibility and challenge generation do not prove successful login.

This gate does not establish a production tenant, real email delivery,
physical-device behavior, full localization, WCAG audit,
production recovery security or App Store readiness.

## Native Apple Preflight History — 2026-08-17

The following records the earlier implementation and configuration checkpoint.
Its no-entry, native Account and test-count statements describe the historical
surface. The native intermediary was removed September 6; September 9's hosted
Apple configuration supersedes the old rotation requirement below. Do not repeat
key creation/revocation based on this history:

- `AuthenticationServices` collects an Apple authorization code and the
  first-response name/email scopes without adding a nonce to the Auth0 native
  social exchange;
- `Auth0.authentication(...).login(appleAuthorizationCode:...)` requests the
  existing Rillora API audience and `session:create` scope;
- the returned Auth0 access token reuses `/auth/native/session`; Apple does not
  create a parallel Rillora session model;
- `Rillora.entitlements` contains the Sign in with Apple entitlement;
- the registered Apple Developer team is fixed in the generated project as
  `8L99CFNK24` with automatic signing for the Rillora application target;
- the historical Debug configuration can still set
  `RILLORA_APPLE_SIGN_IN_ENABLED=YES`, while Release remains `NO`; neither value
  creates a current user-facing button because the signed-out shell has no
  native-Apple entry;
- current-source iOS unit tests pass `77 / 77`, including explicit-open and
  default-closed feature-gate tests; a Release Simulator build also succeeds
  while the gate remains closed.

After the Owner accepted the current Program License Agreement, the Apple
Developer team registered the explicit App ID `com.rillora.ios`. Readback shows
`Sign in with Apple` enabled and configured as the primary App ID. The dedicated
key `Rillora Auth0 Development` has also been created for that primary App ID;
Apple reports Key ID `9H3JRBA558` and marks the one-time `.p8` as downloaded.
The Owner located the downloaded file at
`/Users/tantalum/Downloads/AuthKey_9H3JRBA558.p8`, and its local permissions were
tightened to owner-only before use. After the Owner personally accepted the
Auth0 Marketplace consent and gave action-time confirmation for the sensitive
transmission, the private key was piped directly to the Auth0 Management API;
it was not printed, placed in a request file or copied into the repository.
Auth0 created Apple connection `con_W01eaZ5ruegFXB4T`. Independent readback
confirms Team ID `8L99CFNK24`, Key ID `9H3JRBA558`, `email name` scope, stored
app-secret presence and sole binding to the `Rillora iOS` client
`HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ`. Client readback independently confirms
bundle identifier `com.rillora.ios` and native Apple login enabled. The Owner
subsequently chose to retain the local `.p8` instead of deleting it. It now
lives only at `.local-secrets/apple/AuthKey_9H3JRBA558.p8` under the project
root; `.local-secrets/` is ignored by Git, the directory is mode `0700`, the
file is mode `0600`, the Downloads source no longer exists, and current build
or deployment configuration does not reference the path. This reduces
accidental inclusion risk but is not encrypted secret storage and must not be
treated as a repository artifact. No native Apple identity, authorization
callback or Rillora session exchange has been completed. The former system
Apple button is absent from the current product route; retained source and
external configuration are not login-success evidence. A later read-only Auth0
connection inventory unexpectedly returned Apple credential material in the local Agent
tool output. No secret is repeated in this repository, but the current key must
be rotated before any real Apple callback test. Release remains closed.

## Historical Hosted Development-Tenant Verification — 2026-08-17

The approved desired state is deployed on the Auth0 EU development tenant
`rillora-dev.eu.auth0.com` and is active on `login.rillora.xyz`.

- `tools/auth0/apply-universal-login.sh` first captured the absence of an
  existing default theme and template, created the initial theme, applied the
  Liquid template and read both back. The final theme id is
  `GpJAJlTXdfUIS8CxG2bjw5EnI3NZEceJ`; the versioned theme and remote template
  readback match the desired source in
  `output/qa/rillora-auth0-universal-login-20260817T080723Z/`.
- Five scoped English prompt dictionaries were backed up, written and read
  back exactly in
  `output/qa/rillora-auth0-custom-text-20260817T075929Z/`.
- Live browser checks reached signup, login and password-recovery request on
  `login.rillora.xyz`. Signup was inspected at `320`, `390` and `1440` pixels
  with no horizontal overflow; final compact login/recovery controls were at
  least 44 CSS pixels high. The checked screenshots are under
  `output/playwright/rillora-auth0-live-20260817/`.
- Web staging `/account` reached the custom-domain signup and login prompts.
  Earlier native iOS Account-child-page routes independently reached `Create
  your account` and `Welcome back` in `ASWebAuthenticationSession`; that route
  evidence is historical because the current product now opens hosted auth
  directly from Profile and genuine private-plan actions.
- The current signed-out Profile exposes only `Sign in / Sign up`; the former
  Account child page and four duplicate outer identity buttons are absent. The
  hosted iOS-client login at `390 × 844` contains passkey, Google and Apple,
  keeps Google's mark colored, renders Apple's monochrome glyph white and has
  no horizontal overflow. Configuration readback is in
  `output/qa/rillora-auth0-universal-login-20260817T151918Z/`; focused native
  and hosted-page evidence is indexed in
  `output/qa/rillora-direct-hosted-auth-20260817/README.md`.
- No email, password, MFA code or Google credential was entered. No account was
  created, no callback completed, no recovery or verification email requested,
  and no passkey, password, Google or challenge flow was completed.
- The 2026-08-17 prompt snapshot intentionally showed Auth0's development-key
  warning because the Google connection still used Auth0 development keys at
  that time. Hiding it would have falsified that environment. This is historical
  evidence; the live state after the 2026-08-18 connection change is recorded
  below.

### 2026-08-18 Owner-controlled Google OAuth configuration

The historical development-key state above has now been superseded for the
Google connection, but the completed configuration is still not a completed
login or release approval.

- Google Cloud project `rillora-identity` contains one Web OAuth client named
  `Rillora Auth0 Production`. Its only authorized JavaScript origin is
  `https://login.rillora.xyz`; its only redirect URI is
  `https://login.rillora.xyz/login/callback`.
- The Google consent configuration is External and remains in Testing. It uses
  only `openid`, email and profile scopes and currently has one Owner-controlled
  test account. No account address is recorded in the repository.
- Auth0 connection `con_p2UWW5YMzXUaTZhM / google-oauth2` stores the dedicated
  Google client id and secret. Sanitized Management API readback confirms both
  fields are present and the connection scope remains `email / profile`.
- The dedicated Auth0 connection-clients endpoint returns exactly two enabled
  applications: `Rillora Web` and `Rillora iOS`. Auth0's generic `Default App`
  was removed from the connection rather than left as an unintended third
  consumer.
- Live staging Web login no longer shows the Auth0 development-key warning.
  Google routing reaches the official Google account chooser, identifies
  Rillora and shows neither `redirect_uri_mismatch` nor an access-blocked state.
- A separately constructed iOS-client Authorization Code + PKCE prompt on the
  same custom domain shows passkey, Google and Apple, has no development-key
  warning or visible request error, and its Google action also reaches the
  official account chooser without a redirect mismatch.
- At the configuration-check stage, no account had been selected, no consent
  had been submitted and no callback, Rillora session, private-plan load,
  cancellation, error or logout path had been completed. That historical
  boundary is superseded only for the Web success path by the Owner-controlled
  callback evidence below.
- Google generated two enabled secrets during setup because the first value was
  no longer retrievable after the browser-control session reset. The second is
  the value currently stored by Auth0. After a fresh creation-time mapping and
  explicit action-time confirmation, the older unused secret was deactivated
  and deleted; exact reload now shows only the later Enabled item.
- The consent-screen homepage is `https://rillora.xyz`. Privacy Policy is now
  `https://legal.rillora.xyz/privacy` and Terms of Service is now
  `https://legal.rillora.xyz/terms`. A fresh Branding reload returned all three
  exact values; Audience remains External／Testing and broader availability
  remains closed.

The Google secret was transferred directly from temporary runtime memory to
the official Auth0 CLI over standard input. It was not printed, placed in a
command argument, written to a request file or copied into the repository.
Secret-bearing temporary variables and raw readbacks were cleared after the
sanitized readback. Redacted evidence is indexed at
`output/qa/rillora-google-oauth-20260818/README.md`.

### 2026-08-18 Owner-controlled Google Web callback

The refreshed login transaction was deliberately opened from
`https://app.staging.rillora.xyz/api/auth/login?returnTo=/`. The Owner selected
Google and completed the provider-controlled account and consent steps. The
browser then returned to `https://app.staging.rillora.xyz/` and rendered the
authenticated empty-plan Overview headed `Start your private map`.

This destination is correct for that Web transaction: `/api/auth/callback`
consumes the stored transaction, issues the opaque Rillora browser session and
redirects to the transaction's relative `return_to`; the supplied value was
`/`. The private Overview is rendered only after session status, session,
plan, matters, contacts, official checks and activity requests complete.

Evidence is the Owner's contemporaneous screenshot plus the current route and
render contracts. The Agent did not read Google credentials, consent content,
cookies or browser storage. This establishes the successful Owner-controlled
Google-to-Auth0-to-Rillora **Web** callback and an authenticated empty-plan
load. It does not establish iOS deep-link return, Apple login, account linking,
refresh persistence, cancellation/error handling, logout, all-device
revocation, Google Production publication, physical-device behavior or Release
approval.

This is development-tenant and staging-route evidence only. It is not a
production identity approval, a credential-flow regression, physical-device
evidence or release proof.

## Current Official Sources

- [Auth0 Universal Login themes](https://auth0.com/docs/customize/login-pages/universal-login/customize-themes)
- [Auth0 Universal Login page templates](https://auth0.com/docs/customize/login-pages/universal-login/customize-templates)
- [Auth0 Universal Login text elements](https://auth0.com/docs/customize/login-pages/universal-login/customize-text-elements)
- [Auth0 Advanced Customizations for Universal Login](https://auth0.com/docs/customize/login-pages/advanced-customizations)
- [Auth0 Universal versus embedded login](https://dev.auth0.com/docs/authenticate/login/universal-vs-embedded-login)
- [Auth0 Resource Owner Password Flow](https://dev.auth0.com/docs/get-started/authentication-and-authorization-flow/resource-owner-password-flow)
- [Auth0 native login trade-offs](https://auth0.com/docs/authenticate/login/native-login)
- [Auth0 native Sign in with Apple](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/apple-native)
- [Auth0 social connection development keys](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/devkeys)
- [Auth0 Google social connection](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google)
- [Auth0 dedicated connection-client endpoint migration](https://auth0.com/docs/troubleshoot/product-lifecycle/deprecations-and-migrations/migrate-dedicated-connection-endpoints)
- [Auth0 authenticating through a specific connection](https://support.auth0.com/center/s/article/Authenticating-users-through-a-specific-Connection-database-social-etc)
- [Apple App Review Guidelines, Login Services](https://developer.apple.com/app-store/review/guidelines/#login-services)
- [Google OAuth 2.0 Web server flow and redirect URI requirements](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Sign in branding guidelines](https://developers.google.com/identity/branding-guidelines)


### Reauthentication recovery after a stored session is rejected

The final restart check found a stored session that the API no longer accepted.
Read-only in-process Keychain metadata returned success and the unchanged
14:19:49 UTC creation/modification timestamps. The stored credential was not
erased or replaced during the isolated UI checks. The API returned the generic
`authentication_required` code. The versioned server default is 30 idle minutes;
the elapsed interval is consistent with that limit, but the exact deployed
override could not be read because the scoped AWS CLI session had expired.
No timeout, backend session or security setting was changed.

**Superseded on 2026-09-09:** a rejected stored session clears private content
and shows the same useful public exploration as a fresh visitor. Recovery wording
belongs in the Profile account row or the explicit private action. The Add intent
preserves its category through hosted authentication; cancel returns to its public
source. A Welcome back-only Overview is no longer permitted.

## October2 actual account completion follow-up

Owner confirmed finding the QQ email in spam or another classification. Real arrival
is now confirmed; primary-inbox placement is not. Owner also completed the native
Account terms. The Release simulator callback loaded the same one synthetic matter
created on Web and showed the synthetic recipient Connected. Actual native sign-in
and this cross-platform read are verified; password reset, detailed shared-field/
revocation boundaries and real Apple purchase/restore remain separate unfinished work.
[Current receipt](../collaboration/verification/release-123-20261002/real-account-progress-20261002.json).

## October2 password reset completion

After Owner requested a replacement for an expired link, one newly delivered reset
email led to Owner-confirmed completion and a matching Auth0 success event. This
closes the actual reset transition, not the subsequent new-password login or shared
content acceptance. The Web account page remains at its unchecked personal terms
step; no consent/password is supplied by Agent. [Evidence](../collaboration/verification/email-logo-20261002/README.md).

The Owner subsequently completed QQ Web login. A real shared-item response confirms
the expected Directions projection. The planner simulator's old session returned
authentication-required and was recovered only to a fresh unchecked terms step;
that Owner confirmation and subsequent revoke test are still pending.
