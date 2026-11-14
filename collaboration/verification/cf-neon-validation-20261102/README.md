# Cloudflare / Neon validation — November 2–3

Status: SCOPED RUNTIME PASS / PROBE RETIRED / COMPLETE PRODUCTION QUOTE OPEN

[Report](../../../docs/architecture/cf-neon-validation-20261102.md) and
[source](../../../infra/hosting-validation/README.md) preserve the Owner-selected
CF/Neon validation. No production data, native build, App Review, pricing or sale
configuration changed. No paid plan, cloud CI or subagent was used.

`edge-results.json` contains the original eight bounded cloud calls. The later
`edge-assertions.json` checks those saved responses with strengthened client
assertions; it is not another live run. HTTP, SDK/crypto and readonly DB results
remain separate from real KMS, full authenticated flows, paid seven-day recovery
and private/regional deployment, which were not verified.

`logs/` retains the actual failures and passes, with the local machine path
normalized. Initial Miniflare setup failures are distinct from the application
portability failures (Apple import-time randomness and Pino browser resolution).
The original truncated screenshot remains only in local QA; the published image
shows the complete no-bindings state. No fixture failures were discarded or
reclassified as success.

`artifact.json` binds the tested JavaScript and pinned public certificate to
their digests. Source, dependency locks and build recipe reproduce the bundle;
generated dependencies, runtime types and build caches are not committed as
source. This phase produced no signed iOS artifact. Existing archives 1–59 are
unchanged; safe JSON, text and cropped screenshots use ordinary Git rather than
another encrypted archive.

`closure.json` records both URL types disabled, public 404, no attached database
binding and no scheduled triggers. The old shared Hyperdrive and synthetic Neon
project remain. The expired encrypted nonce is not claimed erased from provider
history; its value is absent from these records.

`aws-frankfurt-price-evidence.json` is a bounded extraction of the current
official regional Price List, not an account query. `monthly-model.json` keeps
all assumptions and leaves the required regional quote null. Eight Frankfurt
endpoint services follow the current Neon guide; a one-service subset is only a
sensitivity pending provider confirmation. These are engineering budget cases,
not a purchased configuration, proven capacity or cheapest-price guarantee.

`sources.json` lists the primary sources and the observed free-plan boundaries.
Provider questions are drafted but not sent. Final source/manifest and exact-base
local publication checks are recorded in the task QA, followed by exact remote
head and cloud-run readback. Earlier application suites and payment evidence are
inherited, not reported as rerun.
