# AWS optimization and isolated worker repair — 2026-11-04

Status: COST CONTROLS AND BOTH WORKERS DEPLOYED; NO ORDINARY API/REVIEW/DATA MIGRATION

[Execution and growth report](../../../docs/aws-optimization-20261104.md), [grant preparation](../../../docs/aws-activate-preparation-20261104.md), [cost-control tools](../../../tools/cost-management/README.md).

## Actual outcomes

- [Deployment receipts](deployments.json) separate optional-metrics changes from later worker image updates. Both stacks completed; Preview worker revision4 and production revision10 run the same immutable repaired image. Ordinary API task/deployment, roles, credentials, configuration and resource sizing remain unchanged.
- [Production dependencies](production-dependency-verification.json) verify the actual maintenance-broker code/environment/role and operator policy after CloudFormation reevaluated unchanged dependency references. [Public health](public-health-after.json) returned ok/failed0.
- [Cost controls](cost-controls-verification.json) record four original-recipient budget notifications, gross-cost accounting without changing the budget amount/scope, lower daily anomaly threshold and standard free Optimizer enrollment. Paid enhanced metrics remain inactive. A new email has not yet been observed in the [focused check](notification-mail-check.json); configuration is not delivery proof.
- [Seven-day resources](utilization-summary.json) and [gateway totals](gateway-utilization-summary.json) are low-volume operational observations, not load/capacity results. [Early worker memory](early-worker-memory.json) is explicitly short-window evidence.
- [Current free usage and activities](free-benefits.json) confirms applicable allowances and two uncompleted20USDactivities. No credit was awarded or Activate application submitted. [November1–3 costs](november-cost-daily.json) are current-period data, not a final invoice.

## Reproduction and source

[Worker metadata](worker-image.json), the two compiled `.js.reference.txt` files and their `.diff.txt` files preserve the exact small overlay. The base is the existing immutable Rillora worker image; rebuilding may produce a different image timestamp/digest, so validate module hashes and runtime configuration rather than inventing reproducible manifest equality. The actual deployed digest is retained in the existing ECR repository.

The dated `.reference.txt` operator helpers are evidence, not new execution instructions. They rely on private baseline files that are intentionally not published; never replay completed changes or stale stack/resource values. For a later operation, read current project authority and live configuration first.

[Linux before](tls-linux-before.json) and [Linux after](tls-linux-after.json) use the actual old/candidate image modules,600 verified localhost TLS connections, no network egress or real database, and a768MiB test-container limit. The test limit allows the original growth to be measured; the production worker remains512MiB. [Mac before](tls-before.json) and [Mac after](tls-after.json) are the initial independent diagnostic. The runtime benchmark source is preserved; its private keys were freshly generated synthetic test material and are excluded.

[Growth model](growth-model.json) and [Frankfurt RDS rate extraction](growth-rds-prices.json) accompany the [calculator](../../../tools/cost-management/growth_model.py). These are complete hypothetical AWS bills with explicit quantities/reserves, not new capacity or financial outcomes.

## Validation and boundaries

[Scope summary](scope-and-validation.json) records28infra tests,16TLS/config/proof tests,14isolated business cases,4cost-control boundary tests and6arithmetic checks. The selected original failure logs and later passes are kept separately. Published log copies normalize trailing blank lines only; unchanged raw originals remain in local QA. The old localhost5432fixture's migration checksum was not rewritten; a fresh isolated PostgreSQL16.14cluster on55434passed and was stopped. The Rillora build VM was returned to its initial stopped state; other project profiles were not operated.

No real-data migration, native/TestFlight/review action, price/sales change, paid commitment, cloud CI, subagent or supplier message occurred. Preview remains online and bounded worker execution is not implemented. The73.35/65.71USDtargets, grant awards, sustained bill reduction and long-term memory curve remain distinct future results.

Raw AWS templates/configuration, account/session/mail data, private credential material, certificate keys, local databases and reproducible dependency/build caches remain local-only. Old archives and prior payment/MCP/CF checks are unchanged. After this final readable receipt, rebuild the complete manifest and run the exact-base publication gate using `f017648cada6d39144a88aa12b5a42d470c40e5d`; final gate/remote/Actions readbacks are saved under ignored `output/qa/rillora-aws-optimization-20261104/`.
