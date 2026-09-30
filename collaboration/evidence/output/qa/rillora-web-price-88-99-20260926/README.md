# Web US$88.99 execution evidence

Current result is recorded in [work-state](work-state.json). Owner's instruction
changes Web annual pricing only. Price-v4=8899cents, Family-v2, annual-only new
sales. Apple differentiation remains unresolved; production sales remain closed.

- Current tests: API244, Web89, infrastructure39; typecheck and build logs use final
  filenames. Earlier failing drafts are kept separately and do not override final results.
- [Stripe/UI fixture](browser-price-check.json) is synthetic; actual provider Price
  creation/archive is a separate TEST-account observation in work-state.
- [Migration receipt](migration-receipt.json), [runtime readback](staging-runtime-readback.json)
  and [staging HTTP](staging-http-final.json) establish the staging deployment.
- [Production Web](production-web-acceptance.json) proves seven closed-route/artifact
  checks. Production API remains task1/schema0070, not migrated or opened.
- [Source scan](source-scan.json), [links](markdown-links.json) and [CI14](ci-readback.json)
  receipts establish source publication separately from deployed runtime and payments.

The full-read release-workflow baseline is reused with focused compaction recovery.
Current price/backend/release specs, append-only decision/journey, archived old
handoff and compact current handoff are updated before final reporting. Dated old
prices/models are retained; monthly-v4, Apple-price approval and live billing are
not inferred. Temporary local UI harness/server/tab are removed/stopped/closed.
