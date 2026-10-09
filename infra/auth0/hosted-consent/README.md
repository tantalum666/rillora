# iOS direct hosted login — consent configuration

## October10 current bilingual hosted consent

English and 简体中文 Forms are independently published and read back, with a required initially unchecked LEGAL field and locale-specific legal links. Both existing Actions now use terms-2026-10-09-1 / registration-clickwrap-2026-10-09-1 and bundle SHA c983dc26bb372fba66b8df467d6e4c0ea1d85a2f4d94d86104b4bffa8d7f3ddb. Tenant locales are en and zh-CN; original bindings, three exact identities and expiry2026-10-11T14:00Z remain. The original English Form is retained unchanged for rollback.

The current CLI lacks Form-write scope; the already signed-in Dashboard imported the exact prepared definitions, without new grants. The login-shell template API separately returns HTTP402, and the official support portal reports no ticket-creation access. Three old desktop English marketing lines remain; do not call that shell localized, switch authentication architecture or buy a plan implicitly. [Current evidence and boundary](../../../docs/payment-recheck-20261009.md).

## HISTORICAL — October1 production review participants

`production-review-action.cjs` separately gates the two production clients with
1–8 unique exact identity digests and an explicit expiry. Empty, malformed,
duplicate or oversized lists deny access. The original reviewer and Owner's two
existing acceptance identities are configured until the original October6 deadline;
no expiry extension or public access is implied. The same current Form and legal
receipt checks remain. Web retains its own genuine clickwrap. See the
[current acceptance contract](../../../docs/release-123-20261001.md).

The singular substitution marker is retained for compatibility with the existing
preparation script; its value may contain a validated comma-separated list.
Never put actual subjects, passwords or provider tokens in this source.

The Owner explicitly chose direct hosted login on 2026-09-06 after rejecting
the native email/method page that still led to the hosted password page. The
native Account view is removed. Authentication begins with Auth0 Web Auth from
Overview, Matters or Profile; the ordinary iOS domain notice remains system UI.

The Owner completed official CLI reauthentication on 2026-09-06. The Form,
deployed Post Login Action and binding have been applied and read back against
this source. Before application, no matching Form/Action or Post Login binding
existed. The deployment record is in
`output/qa/rillora-single-hosted-entry-20260906/tenant-readback/`.
This proves configuration, not a completed identity or accepted legal transaction.

## Hosted flow

1. The person enters the existing hosted login/signup experience.
2. After identity authentication, Auth0 renders the Account terms title, required
   `LEGAL` checkbox and Continue button from `form.json` in the same transaction.
   No email is collected again and no native legal page appears.
3. `post-login-action.cjs` accepts only that Form ID, an explicit boolean true,
   and the current server-side bundle marker. It adds the exact legal receipt
   to the access token; missing/false/stale submissions cannot produce it.
4. iOS checks the receipt before exchanging that unchanged token. The Rillora
   API still verifies the JWT signature/issuer/audience/expiry/scope and commits
   the existing acceptance/planner/session transaction.

The client-side JWT parser is not a signature verifier. An Auth0 identity alone
is not a Rillora session. The required hosted confirmation may be a separate
step inside Auth0; it is not a repeated email/login form. The Owner completed the original hosted confirmation and returned to the
private map. The final Form style is separately checked in actual initial and
unchecked-error states; the agent does not submit real legal acceptance.

No M2M application, vault credential, new secret or user metadata write is used.
Every fresh login receives an unchecked field, preserving the existing explicit
acceptance rule. The existing Rillora API ledger remains the record of acceptance.
This avoids introducing identified consent metadata into the Auth0 profile.
Other applications are excluded by the exact configured iOS client ID. The new
entry adds `rillora_auth_ui=single-hosted-v1`; existing iOS builds without that
marker keep their native acceptance path. Separately, the Apple hosted connection
was restored for the existing iOS client on 2026-09-09 after signing-key rotation,
old-key revocation and web Services ID readback. The legal Action and its client
marker were not changed by that provider configuration work.

## Validation and apply

Run the local transaction/contract tests:

```sh
node --test infra/auth0/hosted-consent/post-login-action.test.cjs
```

The Form was structurally checked against the current official Management API
`CreateFormRequestContent` schema and accepted by the live tenant. Readback matches
the local definition; the Action's deployed code and final binding also match.
`output/qa/rillora-single-hosted-entry-20260906/` retains the schema snapshot,
validation result, before-source snapshot and native test artifacts.

With a current Owner-authorized CLI session, inspect without writing:

```sh
python3 tools/auth0/apply-hosted-consent.py \
  --ios-info-plist /tmp/rillora-single-hosted-entry-20260906-derived-data/Build/Products/Debug-iphonesimulator/Rillora.app/Info.plist \
  --output output/qa/rillora-single-hosted-entry-20260906/tenant-readback
```

The same command with `--apply` creates/updates only the named Form/Action,
substitutes their public identifiers without logging credentials, verifies the
deployed code, preserves existing Post Login binding IDs/order and appends the
new binding if missing. An unexpected existing Action, incomplete list or
concurrent binding change stops the apply. No secret or client grant is created.
Do not treat successful apply/readback as completed login or user acceptance.

The Owner completed their Google and legal-confirmation ceremony, and the App
returned to the private map. Later UI checks reuse that Google session with an
explicit volatile-store signed-out launch, leaving the real Keychain session
untouched. The agent checks initial/error/cancel behavior without accepting
the legal checkbox. Source/readbacks and actual images are in the QA report.
The new Debug app is installed and directly reaches the hosted email screen.
It fails closed on a missing receipt. The earlier working bundle is retained
for rollback. Native provider adapters remain dormant code, not another chooser.

## Sources

- [Auth0 Forms: nodes and components](https://auth0.com/docs/customize/forms/nodes-and-components) defines the built-in legal field and boolean result.
- [Render Forms using Actions](https://auth0.com/docs/customize/forms/render) defines server-side vars, the continuation and returned prompt fields.
- [Management API specification](https://auth0.com/docs/oas/management/v2/management-api-oas.json) defines the Form, Action and binding payloads.

## Rollback

Use the saved pre-apply form/action/binding readbacks. Restore the prior binding
order first if the new Action prevents login, then restore previous definitions.
If resources were new, leaving them unbound is a reversible rollback; deletion
is not part of this script. Restore a known working iOS build when reverting the
hosted receipt contract. Never remove the receipt check while leaving no real
affirmative consent source.

The final style deliberately preserves Auth0 hidden controls, keeps legal links
inline despite the existing template action rule, and retains readable error
text on the graphite surface. The template Management API returned 402; no paid
upgrade or template write was used. The final runtime checks supersede the
initial failed visual versions retained under the dated QA directory.
