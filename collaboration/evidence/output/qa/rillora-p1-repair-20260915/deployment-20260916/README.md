# September16 P1 deployment acceptance

Status: DEPLOYED TO THE EXISTING SYNTHETIC STAGING ENVIRONMENT; FUNCTIONAL ACCEPTANCE PASSED; SALES CLOSED  
Last updated: 2026-09-16 (Asia/Hong_Kong)

## Published result

- Web: https://app.staging.rillora.xyz ; legal custom domain: https://legal.rillora.xyz .
- Sites legal version4, exact source `dbe56567e00a728b8cc7dce60e4f71a07e05822f`; [publication](legal-publication.json). Privacy/Cookie are2026-09-15-1; Terms/electronic-consent text is unchanged. Deployed source digest matches API/native and the verified Auth0 form/action.
- AWS CloudFormation UPDATE_COMPLETE; API task revision23, desired/running1/1, pending0, completed rollout. Migration task revision17 applied0047 after the initial0043–0046 migration. [Final stack](staging-final.json), [hotfix migration](hotfix-migration-status.json), [logs](hotfix-migration-logs.json).
- Dedicated Auth0 identity-deletion secret is installed into the exact existing-stack resource. Its M2M grant remains only delete:users. No secret value was read back or placed in the source repository.
- The current repaired native Debug build was built, installed and launched against cloud with an empty override environment. The earlier pre-repair fallback build is no longer the installed app. [Native record](native-current-build.json).

## Verification

- **36/36** HTTPS/status/security-header/published-asset checks pass: [report](aws-http-verification.json).
- **25/25** legal route/security-header/version/static-asset checks pass: [report](legal-http-verification.json).
- **8 authenticated functional chains plus2 account cleanup checks** pass on the deployed API: [result](staging-functional-verification.json), [log](staging-functional-final.log). This includes real runtime bearer handling, category-aware create, account-bound invitation acceptance, directions-only projection, recipient-scoped TXT, encrypted artifact finalization/download/local recovery, full private backup, empty-map import with no grants, and private archive restoration.
- Both final test accounts reached completed deletion, their sessions returned401 and independent Auth0 lookups returned not found. All four fixture rounds' eight synthetic identity mappings are gone; no deletion job remains pending. **0043–0047** deployed checksums match source. The API runtime cannot assume the no-login account service role, and its new provider-check INSERT rights exclude setting public IDs. [Final database proof](final-database-proof.json).
- Current API build/typecheck and **148 tests** pass after the import correction: [tests](hotfix-api-tests.log), [build](hotfix-build.log). The prior native138/0/1 skip, Web68 and hosted7 checkpoints are reused; this continuation adds a native build/run, not a new complete native test run.
- Public390px browser checks confirm the new Cookie/Privacy versions, visible draft-storage disclosure, no horizontal overflow, and a signed-out reader opening the actual native-generated backup. [Browser findings](browser-verification.json), [reader](published-copy-reader-mobile.png), [cookie page](legal-cookie-mobile.png).

## What the cloud test found and corrected

Two initial smoke attempts stopped on fixture mistakes: the session endpoint has authenticationMode but no usesDevelopmentIdentity field, and the verified-email digest includes its versioned domain-separation prefix. The mismatch was rejected403 as intended. Their test accounts were still deleted and independently checked; the original reports are retained with suffixes.

The next run found a real import500: the application role could update existing provider checks but lacked INSERT rights required by the import upsert. Local fixtures had no provider checks, unlike normally provisioned accounts. Migration0047 grants only the necessary imported columns and sequence usage, retaining forced tenant RLS. A regression now imports recorded dates and preserves non-default settings in the target account; cross-owner inserts remain denied. Export validation also normalizes database Date values before schema validation. The final cloud run includes a completed provider check and passes. [Sanitized failure](import-error-diagnosis.json), [focused regression](import-hotfix-tests.log).

The app and legal build artifacts were kept separate to prevent publishing the legal-only bundle as the app. Compiled publication artifacts include already-approved operator facts and therefore live in protected local storage; QA retains only [path/hash manifests](release-artifact-manifests.json).

## Authentication and hosting boundaries

The Owner completed AWS browser login. The earlier waiting terminal no longer existed across the turn boundary, so its old authorization could not be submitted. Reusing the active browser session with a fresh local CLI callback completed credential exchange; STS verified the intended project operator. The raw OAuth code from a confirmation URL is not the CLI's full remote verification-code format. No further Owner password/MFA, permanent AWS key or weakened browser protection was required. Auth0's expired management CLI session was likewise refreshed through the already authenticated browser session, then the existing target resources were checked before mutation.

The authenticated cloud fixtures were deliberately created in synthetic staging: two disposable Auth0 database users per round, administrator-seeded bounded native bearer/consent records and reserved example.test addresses. This proves deployed API/database/provider cleanup behavior; it is **not** a real customer signup, provider login ceremony, email delivery, legal acceptance or Apple upstream token-revocation ceremony. No real user account was deleted and no real invitation was sent.

The legal host injects a Cloudflare challenge script that the existing strict script-src self policy blocks. Application modules and the legal routes render and navigate successfully; this provider console behavior is recorded, not hidden as zero-console-errors. CSP was not relaxed. The Sites UI handoff was queued for this thread; the custom domain was independently verified.

## Remaining scope

This completes deployment acceptance for the six P1 groups. UX07–22, physical-device VoiceOver, fresh real-user signup/return, numerical Free1/Family5 enforcement and paid cutoff/cancel/restore remain separate work. Prices stayUS$68/year andUS$7.99/month, and sales stay closed. See [current handoff](../../../../docs/handoff.md).
