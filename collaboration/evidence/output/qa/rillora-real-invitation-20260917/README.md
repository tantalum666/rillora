# Real B acceptance, revocation and verification continuation — complete software checkpoint

Date: 2026-09-17, Asia/Hong_Kong. Preserve the existing UI and distinguish real identity, synthetic tests and deployment.

## Real A/B results

Owner completed A's native Google/terms flow, manually transferred the invitation and completed B's actual signup/email verification/acceptance. B read only the selected disposable document, permitted location and Notes. A read back Connected, then Stop sharing produced Disconnected/0 of1 Free place. B reload showed an empty inbox. Real accounts and the A test records remain; access is revoked.

The original human capability URL was not retained before revocation, so its exact browser re-open is not claimed. The prior browser-policy restriction was respected: no alternative automated route or replacement link bypassed it. The new blank public invite page/Back control contains no capability. The after-fix fresh real signup/mail ceremony is also unclaimed; B's real ceremony preceded the repair.

## Repairs and published result

- Server rechecks missing email proof for the exact current-session issuer/subject using a separate read:users service. Matching user ID plus boolean verified email is required; only the digest is stored. Current token age, legal receipt and account mapping persist. No public email lookup, profile flag write, account merge or credential handling in the app.
- Web/native retain the invitation; verification return/retry does not invoke logout or another login. Actual session expiry offers explicit sign-in.
- Visible shared views revalidate every15seconds without loading flicker. Revocation/failure clears the fields; existing foreground/background generation protections remain.
- Owner-requested Web Back control returns to Shared with me through an allowlisted marker retained across resolve/auth/reload; direct entries fall back to Rillora. Signup/sign-in choices precede the unchanged mandatory unchecked consent. No shared items replaces the misleading initial-only empty copy.

API30/migration23, source checksum0060, the dedicated credential and final Web are deployed. [Runtime state](final-runtime-state.json), [final Web artifact](final-web-artifact.json), [42 HTTP/security/asset checks](aws-http-verification.json). The actual task is FARGATE/RUNNING/HEALTHY, desired/running1, pending0 and completed rollout. Normal native build is installed and launched on Matrix17Pro with env{}; its prior user session expired, so the observed current entry is public Overview.

## Validation

- API177 pass: exact identity, wrong issuer/subject, malformed proof, CSRF, caller-supplied proof refusal, same cookie/native bearer and legal receipt, provider failure, revoke during verification.
- Web78 app tests pass. [Final rendered loop](browser-qa-final.json) verifies0 login/logout calls, preserved invitation, outage recovery, explicit401 sign-in, automatic visible revocation around15.4seconds, Back and reload context, consent below choices, checked/unchecked gating and320px no overflow.
- [Native full checkpoint](native-tests.json):151 pass/0 fail/1 pre-existing StoreKit skip. [Final shared-store tests](native-store-tests.json):4 pass. Later view/copy changes compile in the [final ordinary build](native-final-build.json); no new full-suite run is implied.
- Infra19 pass. The additional secret raised expected resource counts; initial cold parallel tests hit the existing5-second limit, then19 passed with a30-second runner timeout. No assertion was removed.
- [Actual provider read](provider-read-proof.json) matched B's already verified profile without modification. [Cloud continuation](cloud-email-checks.json) used separate administrator-seeded disposable sessions and a temporary Auth0 profile: false proof denied, administrator-set true proof accepted with the same token, allowed fields read, revoke denied reads and reuse of the exact old capability. This is not email delivery or real signup proof.

The Browser skill was not available; isolated Playwright CLI validated the localhost source components with mocked service responses. CUA was used for actual A/B and the live published Back link. Dev HMR local-network warnings and intentionally injected403/503 responses are not a zero-console-error claim. Initial fixture import/query-string handling was corrected before the final pass. Legal-artifact tests against an app build were excluded from the app-only run; legal source/version/hosting was not changed.

## Cleanup and records

[Cloud cleanup logs](email-cleanup-logs.json) show both planners absent and exactly1 session/1 receipt per actor before deletion. [Independent cleanup](cleanup-verification.json) confirms old tokens401, temporary Auth0 identity absent and protected fixture token file removed. The configured read-only runtime credential stays protected/ignored. Real A/B remain untouched by fixture cleanup. Local QA process cleanup is recorded in the closeout file.

Updated authentication, sharing, identity, backend, infrastructure, quality, commercial and behavior contracts; product gateway, Web AGENTS, current handoff, decision log and project journey are synchronized. Existing Stripe test completion, unchanged68/7.99 pricing, closed production sales and the pending monitor destination/Apple/merchant gates retain their separate evidence.
