# October9 Stripe cloud webhook and Web checkout QA

Status: TEST CALLBACK FIX DEPLOYED/VERIFIED; OWNER ENROLLED; HOSTED WEB PURCHASE PENDING LOGIN

- Gmail notification concerns the existing staging TEST endpoint:13HTTP500attempts. Full private mail/provider payloads/auth stay excluded in .local-secrets/stripe-webhook-20261009.
- mapping-read.json confirms the8event metadata account exists only in the prior local fixture, not staging. The real Owner account remains active with one matter; prior TEST eligibility absent.
- nonlocal-account-red.log reproduces500; green.log preserves a mistaken retry-counter expectation; final.log passes2targeted tests. production-boundary.log passes13, typecheck/build pass. Source8b1f91798 and source-ci.json prove all3CI jobs success, not new hosted payment.
- deployment-diff/complete show only API/maintenance images changed. staging-runtime-verified.json recordsAPI40, ARM64,1healthy task, complete rollout and exact digest. No new schema/frontend/config changes in this phase.
- Original8provider events were manually resent to the existing endpoint. provider-delivery-readback.json records0undelivered/has_morefalse; after-redelivery.json independently records all8signatures valid/needs_mapping, not applied or granted. Automatic scheduled retries may still arrive safely.
- The old TEST9.99monthly subscription was canceled with no invoice/proration; provider receipt and actual cancellation event applied/expired_read_only agree. One August19expired/unpaid Checkout reservation was closed transactionally; paid history and one original matter preserved.
- owner-test-enrollment.log is the first guard refusal/rollback due to active billing. v2 succeeds only after actual cancellation and provider expiry readback, enrolling this existing account until2026-10-10T20:28:23.969401Z. No identity, session, consent or payment was created; ordinary billing policy unchanged.
- owner-billing-read.log preserves the Agent's wrong-column query; v2 is the successful read. webhook-http-replies.json is empty because the first log filter incorrectly expected URL/path that safe Pino serialization intentionally omits. Provider delivery plus verified inbox, rather than that filter, is the evidence.
- Current USD88.99/year v4 provider price/server binding remains; DOT retained TEST UI. Real Preview session401 means rendered entry, current hosted annual checkout/return/Family/portal await Owner's existing-account login. Do not reuse local-fixture success as current cloud/live proof.

NoLive activation or FanPass operation. Current scoped contract: docs/stripe-webhook-20261009.md. Closeout shares archive26 with Web rollout; original failed attempts remain alongside passed replacements, while actual credentials/private auth/provider payloads are excluded.
