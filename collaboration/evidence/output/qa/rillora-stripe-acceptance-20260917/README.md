# Rillora current-price Stripe acceptance — September17

Status: PROVIDER TEST ACCEPTANCE PASSED; ON-DEMAND API VERIFIED; FIXTURE CLEANUP VERIFIED; SALES CLOSED.

## Scope and continuity

Continues the Owner's non-device software completion request after “Stripe permissions enabled”. Preserve existing UI and68/year /7.99/month pricing. `reading-continuity.json` links the completed whole-project Markdown read and prior recovery. No new design workflow, real customer signup or live charge is claimed.

The Owner expanded the existing restricted-type TEST key broadly. Readback shows Core/Prices/Customers/Subscriptions/Checkout write; actual API calls work. No key value was copied. The prior SMS/Prices Read blocker is closed. This broad Owner-configured test setting is not a claim of least privilege or a production key policy. Only the independent Rillora account `acct_1U6B2RCxTlowhyiG` was used.

## Actual provider checks

- Hosted Checkout displayed and completed USD68 annual and USD7.99 monthly payments with Stripe test card and clearly synthetic details. UI and server ledger agree. Both callbacks gave Family v2 /5 places only to explicitly enrolled validation actors.
- Annual Customer Portal cancel-at-period-end preserves Family5 and the paid-through date; portal undo returns active renewal.
- Actual provider immediate termination returns Free1; it tests provider-ended cutoff, not a full elapsed year. A receiver keeps the permitted saved copy after later private edits; explicit Free resume, permanent redaction and revoke were checked again.
- Monthly test subscription was canceled and the799USD-minor-unit payment fully refunded. Stripe invoice shows refunded; after recovered delivery, the Rillora ledger is refunded and access Free1.
- Existing active subscription rejects a second checkout. Repeated pending same-price checkout uses one session. Following an ended subscription, changing period is blocked while another quote is pending; provider-confirmed session expiration permits the change. Both fresh unpaid quotes were then expired, with no Family grant.
- Re-delivering the same refund event added no extra event or reconciliation. All three refund event types are now applied. `provider-acceptance.json`, `cloud-behavior-checks.json`, `refund-duplicate-check.json` and the dated status checkpoints preserve exact results.

## Availability fault discovered and repaired

Four deliveries initially received Gateway500 before the application inbox. `gateway-refund-errors.json` records No target endpoints found at09:11:12–13 HKT. `spot-interruption.json` independently shows the only FARGATE_SPOT task stopped with SpotInterruption at09:11:10.583, with its replacement starting09:11:26.590. This was an infrastructure interruption, not a refund-signature or entitlement-calculation defect.

Added scoped read-only Gateway log access to the existing operator. Changed only the API capacity strategy to FARGATE, retaining desired count1,0.25vCPU/0.5GB and the API28 image. A stable force-deployment nonce moves the existing Spot task. `on-demand-verified.json` confirms actual FARGATE/RUNNING/HEALTHY,1/1,pending0 and completed rollout. This removes the observed Spot-reclamation cause; it is not an HA or zero-downtime guarantee.

Infra typecheck and18 tests pass (`infra-final-tests.log`);41 post-change HTTPS/security/asset checks pass. `post-switch-webhook-boundary.json` proves the public webhook path reaches application verification and still rejects an invalid signature with400. No TLS, identity, signature or production-sales gate was weakened. Application code is unchanged; prior API167/native149 plus1 old skip/Web78 are retained checkpoints, not rerun totals.

Compute-only estimate: USD8.291 per730hours using current public Frankfurt ARM rates. Database, public IPv4, network, logs, tax and other services are excluded. Inputs/publication date are in `on-demand-cost-estimate.json` and the downloaded official price file; this is not an invoice or total infrastructure cost. AWS source: [Fargate capacity/interruption behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html), [regional public prices](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonECS/current/eu-central-1/index.json).

## Operations cleanup

The failed initial RilloraOperations deployment's old retained log group and DLQ were read back as empty, deleted, and independently confirmed absent. The temporary exact-resource cleanup IAM stack is also confirmed absent; its permissions do not remain. `empty-ops-resources-deleted.json` records this. The successful monitor stack is retained, schedule configured off/0 subscribers pending the Owner's destination and delivery drill. No alert or refund receipt email was sent.

## Fixture/evidence boundaries

Three newly admin-seeded disposable API sessions/consent fixtures were used. They are not real Auth0 registration, verified customer consent or the pending real B invitation. One synthetic session idled out during diagnosis; bounded fixture-only refresh is logged without repeating Owner authentication. Both new Stripe subscriptions ended; the two later unpaid Checkout sessions were provider-expired. Legacy provider test objects are untouched. All3 disposable planners were deleted, remaining0; their old sessions return401 and the protected token file is removed. The original real Owner accounts and invitation are untouched.

The Checkout URL was once truncated during automation copying and corrected with the original returned URL before payment. Email-entry/snapshot quirks and a stale Stripe browser helper were recovered through normal visible UI; these are tool/fixture observations, not claimed app bugs. AI-agent identification was truthful; optional save-for-faster-checkout remained unchecked; only published test payment data was used.

The authenticated application API was exercised with explicit synthetic native-bearer fixtures; the hosted browser return had no Rillora cookie and correctly showed public content. This proves the provider/API pipeline and safe return boundary, not a real signed-in customer completing the entire app purchase UI.

No Web/iOS layout, legal wording, data schema, ordinary billing or live market was changed. Real B acceptance/revoke, alert destination/delivery/silence drill, normal production purchase, Apple transaction/restore and merchant/market readiness remain separate. Physical devices remain excluded.

## Documentation

Updated focused contracts: commercial completion, monetization, backend, pricing68, infrastructure roadmap/runbook, solo operations and quality gates. Append-only decision/journey entries record the evidenced change from Spot to regular capacity. Current handoff retains one next step; the in-progress handoff is archived as HISTORICAL. Final link/date/state checks and cleanup results are in the closeout record.
