# September 19 release readiness and price revision

Status: CURRENT CHECKPOINT COMPLETE; APPLE ANNUAL PRICE CHOICE PENDING; PUBLIC PRODUCT / SALES CLOSED  
Date: 2026-09-19 Asia/Shanghai

## Scope and recovery

Owner prioritizes formal launch, supplies the daily Gmail alert destination, defers business/registration, then explicitly changes both prices to US$88.80/year and US$9.99/month. Preserve the existing UI, Free one / Family five outgoing allowances, separate production environment and no-hiring model. No initial root Git commit, branch or stash was created. No existing real relationship, receipt or private data was replaced.

[Full body reading](full-read-completion.json) covered 92 project-owned Markdown files, 20,554 lines and 206 chunks. The manifest, complete bodies and acknowledged ranges are retained. Truncated or lost chunks 107–108, 110–111 and 156 were supplemented; sources did not change during reading. After compaction reuse this ledger and read only current authority and relevant changed files.

## Operations evidence

- AWS authentication was restored using existing browser state; STS confirmed the project account. No permanent credentials or repeated Owner password/MFA prompt was needed. One SNS command using `/dev/stdin` failed JSON parsing before mutation; protected transient JSON succeeded and was deleted.
- The selected mailbox was verified against the Gmail connector. The confirmation message initially arrived in SPAM, was moved to Inbox, and its exact SNS topic was confirmed. The confirmation capability was not printed or retained in the final evidence. [Subscription evidence](sns-confirmed.json).
- CloudWatch history showed `not authorized to perform SNS:Publish`. The SNS policy contained a TLS deny without a publisher allow. The fix permits only the CloudWatch service, this source account and the four exact alarm ARNs, while retaining TLS enforcement. Diagnostic permissions are exact-resource reads. Infra typecheck, 20 tests, diff and deployment passed. [Failure history](alarm-action-history-before-fix.json), [deployment](operations-policy-deploy.log).
- Intentionally forcing the Unhealthy alarm proves the notification route, not a real outage. Its ALARM at 09:10:51 UTC and automatic OK at 09:11:38 UTC both arrived in Inbox.
- A cloud probe passed 7/7 at 09:00:58 UTC with scheduling disabled. Actual silence caused MissingHeartbeat ALARM at 10:16:24 UTC. A recovery probe passed 7/7 at 11:38:16 UTC; automatic OK followed at 11:39:24 UTC. Both messages arrived in Inbox. MissingHeartbeat was not forced with SetAlarmState. The observed detection delay was 75.4 minutes because of CloudWatch lookback; three 15-minute periods must not be described as a 45-minute maximum.
- The existing 15-minute schedule was enabled only after that evidence. [Final readback](operations-final-readback.json) confirms ENABLED and one subsequent scheduled invocation with all seven checks passing. [Four delivered messages](all-alarm-delivery-evidence.json). Coverage is public/staging metadata, without private response bodies, customer credentials, repair permissions or a production SLA.

## Dependencies and deployment

Updated API qs to 6.16.0, API/infra Vitest to 4.1.11, Web Browserslist to 4.29.0 and baseline-browser-mapping to 2.11.25. Related test-tool transitive updates remain in lockfiles; pre-update manifests are in `dependency-before/`. npm 10.9.8 repeatedly hit an Arborist `edgesOut` error. The scoped official npm 11.11.0 command succeeded without changing system npm or using force.

After the dependency change, API typecheck/build and 177 tests, Web 80 tests/release build, and infra 20 tests passed. Final full npm audits for API, Web and infra each report zero known advisories. This is not an independent security certification.

The first container build failed with ECONNRESET during npm ci, before service deployment. An unchanged retry succeeded and deployed API31; 42 HTTP checks then passed. That checkpoint was later superseded by the pricing deployment. [Dependency deployment](dependency-deploy.log).

## Price revision and compatibility

- New catalog quotes are exactly 8880 / 999 minor USD units, price version 3 and the same Family capability version 2. Additive migrations 0061/0062 preserve all v1/v2 amounts, bindings and receipts.
- The independent Rillora Stripe TEST product now has six prices. New IDs, amounts and intervals are recorded in [Stripe readback](stripe-v3-price-readback.json). No payment at the new v3 prices was completed. September 17's actual 68/7.99 test lifecycle remains a separate dated result.
- The adapter separates price revision from capability version, checks exact provider amount/metadata, and retains historical v1/v2 reconciliation. Final API tests: **179 passed**. An intermediate fixture expected only four Stripe bindings and produced one failure / 178 passes in `api-tests-price-v3-final.log`. Updating that fixture to explicitly retain the old four plus the new two produced 179 passes in `api-tests-price-v3-accepted.log`; no assertion was dropped. Infra remained 20 passed.
- The source-checksummed migrations ran transactionally in the existing scoped migration task and exited zero. [Cloud logs](price-v3-migration-logs.json) confirm new and unchanged old prices, exact bindings and `salesEnabled=false`. Dispatch occurred while the final fixture run was still running; that run's later failure was the obsolete binding expectation, not a rejected migration.
- API32 and migration definition25 deployed successfully. ECS has one desired/running task, zero pending tasks and a completed rollout. [Runtime](final-runtime-state.json), [deployment](aws-activate.log), [42 final HTTP/security/asset checks](aws-http-verification.json). Database migrations end at 0062. Ordinary sales and Apple cloud integration remain off. Legal Sites5 and Web artifact `430a74040cebd84049e01c0c0f1e5e1880176952b307f41b7e496930c5a3cdc0.zip` are unchanged.
- Native/Web pricing is server-driven. No new native build/full suite or fresh personal login result is claimed for this price change. The [new model](../../finance/rillora-price-88-80-20260919/results.json) changes only prices against frozen September 11 cost inputs; 33 independent arithmetic/accounting checks pass. It is not a new fee quote, invoice, profit or willingness-to-pay result. Historical workbooks are untouched.

## Apple control plane

Owner completed the current App Store Connect login. Readback confirmed the Rillora app, valid free/paid agreements, available bank state and tax forms in use; private bank/tax values were not copied. Both subscription products remain Prepare for Submission, same level 1, with Family Sharing off and the existing eight-country availability selection unchanged.

Saved subtitle, Productivity category, description, promotional text, keywords, existing support URL and copyright into the unpublished draft. The version now requires manual release after review. A reload confirmed saved copy and the manual-release radio. No review submission, screenshot upload, fabricated review account or legal agreement acceptance occurred.

The earlier 68/7.99 draft prices were superseded by the latest Owner request. Monthly US$9.99 / HK$88 is now saved and read back. Exact annual US$88.80 is absent from the complete Apple picker; nearby options are US$88.00, US$88.90 and US$88.99. The specific choice is pending, so annual remains US$68 without a silent approximation. [Apple price readback](apple-price-readback.json). Backend Apple Sandbox still maps v1 and needs versioned alignment before actual purchase testing.

## Documentation and final verification

Updated the current release and price contracts, product authority, monetization, economics, MVP activation wording, operations/infrastructure, quality/commercial evidence, registries, AWS runbook and README. The old 68 contract is historical. Corrected stale active price clauses, the root README's Spot/real-invitation status, and the legal contract's Sites4 header to the existing Sites5 checkpoint without a legal redeployment or consent change.

The decision log records two Owner decisions: formal-release priority and both new prices. No additional product decision was required for factual documentation cleanup. The [current handoff](../../../docs/handoff.md) contains one next step and the pending Apple amount; the [journey entry](../../../docs/journey/PROJECT_JOURNEY.md) records goal, attempts, changed findings, result and remaining work. Exact modified Markdown files and link results are in [final documentation validation](document-validation.json).

Release preflight unit tests passed five cases. The current preflight correctly fails because required production/merchant/Apple/artifact evidence is still absent or deferred. A passed local test is not publication approval. Final closeout checks do not rerun earlier application suites, deployment, authentication or financial model calculations.
