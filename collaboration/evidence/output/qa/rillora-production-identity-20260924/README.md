# Production identity, mail and public website QA

Updated: 2026-09-25 (Asia/Hong_Kong). Same release workflow; prior full-reading baseline retained.

## Completed observations

- `reading-record.json`: current recovery ranges and previous complete-body baseline. Link scanning is not a full reread.
- `auth0-plan-readback.json`: actual Free25,000MAU/one-tenant quota;35USD is the paid500MAU starting tier. No paid Auth0 plan.
- `auth0-production-prepared.json`: production clients/audience prepared with connections disabled, old bindings preserved; no secret in output.
- `google-production-readback.json`, `google-credential-receipt.json`, `auth0-original-google-unchanged.json`: Owner-approved brand/client/scopes saved, protected credential outside Git, stillTesting and original Auth0 connection unchanged.
- `mail-identity-readback.json`, `mail-configuration-readback.json`, `mail-events-readback.json`, `dns-acceptance.json`: actual safety configuration, six added records/four resolvers and prior-zone preservation.
- `mail-simulator-submission.json`, `mail-simulator-metrics.json`, `mail-alarm-actions.json`: provider event and SNS-action proof; not ordinary inbox/spam/suppression acceptance.
- `public-cloudfront-acceptance.json`, `www-acceptance.json`, `public-browser-qa.json`: actual artifact, routes, private-origin protections, DNS/TLS and desktop/390px rendering.
- `root-forward-acceptance.json` is the early HTTP302/HTTPS-failure checkpoint. `root-browser-acceptance.json` and `root-monitor-compatibility.json` supersede its current rootHTTPS status: Chrome and current Node monitor verify HTTPS redirect. Earlier client differences remain evidence, not diagnosed causes.
- `cname-guard-live-acceptance.json`: temporary create/replace/read/cleanup passes; legacywww CLI failure remains separate from successful normal-console edit.
- `operations-public-cloud-result.json`:12targets, actualok/failed0.

## SES external gate

`ses-account-after-request.json` is the first PENDING result; `ses-account-final.json` is the later DENIED API flag, with production sending disabled. `ses-support-console-readback.json` records the actual case message asking for additional details and examples, not a stated terminal refusal. The ordinary Support Console works without a paid support plan; the API returned SubscriptionRequiredException.

`ses-followup-draft.txt` contains the approved factual reply. Owner said to proceed; it was submitted once and read back in the case at01:12:39+08:00, status“客户操作已完成”. See `ses-followup-submission.json`. No external Auth0 provider or SES sender credential exists yet. AWS CLI renewal has passed STS after Owner login; no repeat login is currently needed.

## Verification and source closeout

- 36infra pass with2workers; first unbounded run had4five-second timeouts, retained in its log.
- 9public/guide,8DNS guard,6monitor and13release/recovery guard tests pass. Public and internal Web builds pass.
- API212 was not rerun locally but is newly verified in GitHub CI8. iOS and real recovery retain their earlier checkpoints.
- Final source scan is873files,22reviewed nonsecrets and0unknown;137Markdown files have no missing local links. Private Git local/remote match and CI8success are recorded in `source-publication.json`. CI7failure(two5-second CDK synthesis timeouts) is retained;20-second test budget with2workers passes without assertion changes. A passing launch preflight is not claimed: customer identity/mail/billing/final artifacts and Owner-deferred gates remain.

Changed contracts: `docs/production-identity-mail-20260924.md`, `docs/public-product-website-20260924.md`, product/release/quality/infrastructure routing, Auth0/AWS/DNS runbooks and release-gates.json. Decisions appended September24–25 for Free/cutover and approved Google configuration; handoff is compact, prior handoff archived asHISTORICAL, journey appended. No new product scope, UI redesign, price change, E2EE claim, FanPass change or customer release.

Secrets are in the ignored protected directory, never in QA or Git. Generated evidence is intentionally not uploaded with source.

Final documentation-only commit uses [skip ci] after local source/link checks; it changes no executable file or test. The engineering proof remains CI8 on f8d1344. This prevents redundant full-suite reruns solely for recording their result. The task-owned local public preview was stopped; the live public website remains available.

## Submitted reply continuation

Owner authorized the prepared message; submission receipt and case readback are stored. The new check_mail_readiness.py only reads the fixed account/region/identity/configuration. Seven targeted boundary tests pass; mail-readiness-after-reply.json shows14passing conditions and production access stillfalse. Customer mail acceptance remainsfalse by contract. No raw account contact/use-case fields are emitted. New source/CI checks are recorded separately from the earlierCI8 result; this is not a rerun of recovery or iOS.

Continuation closeout: source37761e2 / CI9 https://github.com/tantalum666/rillora/actions/runs/36033511894 succeeds in all3jobs (212API,36infra, Web/legal/public builds). Local release guards20pass; source scan875files/22reviewed/0unknown;137Markdown/1322local links/0missing. Results are in source-after-reply.json, source-scan-after-reply.json and markdown-links-after-reply.json. Documentation-only closeout again preserves the tested engineering commit.
