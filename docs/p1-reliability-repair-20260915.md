# P1 reliability, privacy and self-service repair

Role: current UX01–06 implementation and acceptance contract  
Status: IMPLEMENTED AND SYNTHETIC-STAGING VALIDATED; REAL-MARKET AND LATER UX GATES OPEN
Last updated: 2026-10-03 (Asia/Shanghai)

Owner requested “直接开始修复” after the whole-app audit. This batch repairs six P1 groups. It preserves the selected design, direct hosted login, US$68/year and US$7.99/month. It does not close UX07–22, numerical Free1/Family5 enforcement, paid cutoff/cancel/restore, real-market acceptance or billing gates. [Audit](ui-ux-audit-20260915.md), [QA](../output/qa/rillora-p1-repair-20260915/README.md).

## October3 strict-review implementation boundary

Deletion now checks pending purchases and existing subscriptions within the same
serialized transaction as deletion, sharing checkout/reconciliation locks. A late
billing obligation produces a fresh unchecked acknowledgement on both clients; the
account is retained and delete remains disabled until the user explicitly confirms.

Web shared-review drafts and all related form guards publish dirty/busy state before
paint; repeated browser Back/Forward keeps the current view and URL synchronized.
Native editors reject overlapping writes/reloads, and an acknowledged role mutation
survives a failed follow-up list read with an explicit retry. Cancelled old-account
startup cannot reset the new account's purchase coordinator. Existing visual layout,
permissions and product semantics are retained. [Current local proof](code-review-20261002.md)
is separate from the historical September16 deployment below.

## Deployed continuation — September16

P1 is now deployed to the existing synthetic staging environment: API23, migration17, checksums0043–0047, completed1/1 rollout; Web and the current native Debug build use the matching contract. Sites legal version4 and the Auth0 form/action are published and read back.36 HTTPS and25 legal checks pass. Authenticated cloud fixtures verify invitation scope, scoped plaintext/encrypted export, full backup/import, private archive restoration and provider-backed account deletion. These are deliberately synthetic sessions, not real signup/email/consent ceremonies. Sales remain closed. [September16 deployment acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md). Runtime acceptance found and fixed the provider-check import permission gap.0047 grants only imported columns and sequence usage, retains tenant RLS, and preserves existing non-default target preparation settings. Database Date values are serialized before backup validation. Final API148 tests and the cloud import/archive/delete flow pass. Previous local-only/pending-deployment passages below describe the earlier checkpoint.

## Export audience and content

Web and native Export directions require an explicit For me / For a person choice. A recipient must be an accepted, currently active sharing connection owned by the planner. Server projection includes only that person's selected matters, bounded to Name or Directions; even Details-level access does not add typed details/Notes to the minimum guide. Never disclose is excluded from all minimum guides. The complete private map backup is a separate task and deliberately includes such records.

The preview commitment includes audience identity/version and exact projected content. Printable generation, encryption preparation and finalization recompute the scope, rejecting changed/revoked grants. Recipient guides omit other contacts, unselected matter existence, planner locale/timezone and plan readiness metadata. Personal encrypted guides use only the saved recovery key. Eligible real accepted device keys, when present, are restricted to the chosen recipient; legacy rehearsal keys do not broaden a guide. A downloaded file cannot be revoked; generation is not delivery.

## Saves, drafts and loading

The Web editor shows an error beside Save, moves focus to it and keeps the retry button visible. Save is disabled for invalid or unchanged forms. Browser refresh/leave receives a dirty-form guard. One unfinished matter is retained per verified planner per tab in session storage, for up to24hours. Recover only after verifying the same planner; save, explicit discard or sign-out clears it. Browser storage can fail; the form then explicitly says to keep the page open. There is no claim of encrypted browser draft storage or durable recovery after closing a tab.

A stable request UUID follows each new draft. The server atomically records its payload commitment and created matter. An identical retry returns the same matter. If a first response was lost and the user changed text, the client reopens the verified saved matter with those newer edits retained, then requires Save; it never silently drops the edits or creates a duplicate. The receipt lookup is owner-scoped. Existing updates retain optimistic version checks and require explicit confirmation before replacing unsaved text with a fresh version.

Unknown/loading, confirmed401, cold503/offline and an authenticated refresh failure are separate states. Only confirmed signed-out state becomes the normal public entry. Service failures offer Retry/Browse; a loaded map remains visible during a failed refresh. Record labels use Draft / Needs review / Directions added. A saved draft is an existing record, not Not added.

## My data and saved files

Web Settings and native Profile → My data provide:

- Complete owner JSON backup, including Notes, typed fields, masked references, archived records, people, recorded roles and official checks. No active invitations/grants, authentication credentials or billing/security records. Known provider-check timestamps are retained; existing non-default preparation settings in the target account are preserved. Plaintext disclosure requires confirmation. Limits are500matters/200people/1,000roles/50checks and2MB reader/import payloads; overflow fails visibly rather than silently truncating.
- Local reading of supported JSON/TXT, including decryption with the matching recovery file. Signed-out users can read their selected local files. Recovery keys are used on-device, not submitted with imports.
- Import into an empty map only, with atomic validation, deduplication and new record IDs. Imported active matters become Draft, recorded roles do not grant access, and no invitation or sharing is restored. Existing records are never overwritten.
- Archive and private restore on both platforms. Archiving removes a matter from live shared projections; restore clears previous direct grants and requires sharing to be chosen again.

A complete map backup is not a copy of every internal service or financial record. Files saved/shared outside Rillora remain outside remote deletion control.

## Account deletion

A signed-in user opens Delete my account, reviews current account/billing state, acknowledges external-copy limits, types DELETE and confirms. Billing acknowledgement is shown only where a subscription record exists; deletion does not pretend to cancel provider billing. Sales remain closed, and a real paid lifecycle still needs separate release acceptance.

Before submitting, the client creates a random status-only receipt; Web keeps it in tab storage and offers a file, native uses a separate device-only Keychain item and offers the same portable file. It is not a Rillora login token. A lost response leads to status checking rather than a false success claim. A completed receipt is queryable for30days; pending requests remain queryable.

The authenticated API/CSRF transaction marks the account deletion_pending, revokes its sessions and both directions of live sharing, and queues its exact stored identity mappings. A leased worker deletes those Auth0 identities through a dedicated delete:users-only M2M service. A real account cannot start deletion while the identity service is unconfigured; it receives a visible error and stays unchanged. Transient failures after a configured request stay pending and retry; only successful/absent identity results permit active-map removal. The private map, people, sessions, identity mappings and stored export ciphertext are cascaded away. Existing consent records retain their approved minimized digest with identity/planner foreign keys cleared; required bounded financial evidence is retained separately. Routine backup/legal retention follows the Privacy Policy. No client-supplied provider user ID can select another account.

Native clears its local session without launching an unnecessary hosted logout browser, resets private navigation stacks, and shows the receipt page. Web clears private state before showing status. A new login cannot reprovision an identity while its deletion is pending.

## Capability truth and release dependency

The current Free list names actual tasks; removed rehearsal and unimplemented paid promises are absent. Family's planned core and later roadmap are separate, without completed checkmarks. The backend carries an availability marker; it is not a client-side entitlement grant. Existing local shared-review preview does not open paid access.

The necessary draft/receipt storage and self-service paths require the prepared Privacy/Cookie update: privacy-2026-09-15-1, cookies-2026-09-15-1; Terms and electronic consent wording stay unchanged. The source bundle digest is3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602. Web/API/native and the hosted-consent action match locally. Publish the legal artifact and coordinate API/native/Web/Auth0 deployment; do not update the hosted action alone against the old API.

Migrations0043–0047 and dedicated AWS secret injection are now applied to synthetic staging. The Auth0 deletion M2M exists, and an exact fresh disposable Auth0 database identity was removed with independent provider404 and local-map deletion readback. This is not a fresh real-user signup, Apple upstream revocation, actual recipient delivery or production deletion claim. The earlier expired AWS authentication blocker was resolved through the Owner’s completed browser login and a fresh CLI callback. The coordinated P1 code/policy release and import correction are now deployed; see the deployed continuation above.
