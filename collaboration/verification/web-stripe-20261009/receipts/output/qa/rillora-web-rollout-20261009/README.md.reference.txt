# October9 actual Web rollout QA

Status: DEPLOYED / PUBLIC UI VERIFIED / PRIVATE IDENTITY ACCEPTANCE PENDING OWNER LOGIN

- Retained full reading: reading.json → October8 full inventory. Current source starts f82179e44; old PR2/CI100/browser43 evidence is retained, not rerun here.
- WWW: public-reviewed-diff.json, cloud-after.json, www-assets-live.json and www-browser-live.json.31files match; public responsive navigation was actually clicked in EN/ZH.
- Client delivery: RilloraStaging and RilloraProductionWeb reviewed-diff/complete files; preview-assets-live/formal-assets-live each86files match. Static-only phase retains live API templates.
- Backend discrepancy: staging-before-api.json and schema-inventory/read show API38/schema75. Backup readbacks precede18pending migrations; staging-migration-complete records93matching/TLS/no credential rotation. API39's exact image/config verification is retained; the subsequent Stripe directory records finalAPI40.
- Build correction: image-preparation-corrections.json differentiates the Agent's wrongAMD64 candidate from existing correctARM64 infrastructure. CA verification, pinned public PEM, buildx/install/build logs and failed attempts are preserved; source6219c8296 CI passes.
- www-live-desktop-zh.png and www-live-mobile-menu-en.png are proper viewport proof. The mobile-zh/tablet-zh screenshot API initially emitted scaled rasters; they are retained diagnostics and not claimed as exact viewport pixels. Actual DOM geometry/interaction is separately recorded.
- staging-public-health.json contains the initial invalid public /api/health404 probe. The correct direct API endpoint200 is staging-direct-health.json. Wrong probes are not product defects or passed checks.
- After long idle, real Preview private requests401/authentication_required; owner-login handoff is pending. No session/consent was forged. Original account active/one matter retained, with private identifiers only in protected/raw evidence.
- Release bytes are output/release/rillora-web-rollout-20261009. Active QA preview server4399 was verified and stopped; no global process/device cleanup.

Closeout changes docs/web-rollout-20261009.md, docs/stripe-webhook-20261009.md, product routing, Web focused status, prior Stripe checkpoint pointer, handoff/history, decision log, journey and source-control/collaboration records. The new decision entry records Owner sequencing and bounded Agent operational choices, not new prices/markets. Links/terminology and all-work Git verification are recorded separately; no product suite is rerun for document changes.
