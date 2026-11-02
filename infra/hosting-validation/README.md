# Cloudflare / Neon compatibility validation

Status: SCOPED LOCAL/CLOUD CHECKS PASSED — NOT A PRODUCTION ADAPTER

Last updated: 2026-11-03 (Asia/Hong_Kong)

This isolated package exercises existing API modules inside workerd. It does not
change the application runtime, production configuration, data or App Review build.
See [the validation contract](../../docs/architecture/cf-neon-validation-20261102.md).

Only fixed, authenticated, expiring probes may be exposed. No arbitrary SQL, URLs,
customer sign-in, payment execution or production credentials belong here. The
existing synthetic MCP candidate is evidence to reuse, not a production KMS or
recovery-journal replacement. Application deployments remain separate.

## Reproduce local checks

Use the already locked API dependencies, then install this package with
`npm ci --ignore-scripts`. Run `npm run types`, `npm run typecheck`,
`npm run build`, and `npm run check:local` from this directory. Builds are dry
runs. The test runner uses the current Miniflare 5 manifest API and no database
binding; it does not connect to production or make a real payment.

The existing Apple dependency initializes randomness at import time, so the
validation entry imports it inside a request. The build selects Pino's Node
entry for pino-http. `prepare-root.mjs` derives the ignored PEM from the existing
tracked API DER certificate, so a fresh checkout requires no untracked file.
`stage-assets.mjs` stages only that public Apple root and
checks the DER digest against the original pin. It does not copy private keys.

The HTTP probes exercise the real application router's unauthenticated paths.
The per-probe router factory is deliberately bounded; it is not a production
request lifecycle or global rate limiter. A real port must remove process-local
maintenance timers and preserve distributed limits without retaining per-request
I/O in shared state.
Crypto probes use the real SDKs and existing content cipher with synthetic
events and memory-only keys. They do not prove real KMS, a valid Apple JWS chain
with online OCSP, or authenticated customer workflows. The live DB check was a
read-only transaction against the existing synthetic project, not a migration.

## Cloud evidence and retirement

Eight bounded calls were made to the uniquely named validation Worker on Free.
The initial two DB checks took 3373ms and 771ms inside the Worker; these are wall
times from a tiny sample, not billing CPU or a production latency guarantee.
The original cloud responses are asserted offline after the client assertions
were strengthened; they are not presented as another live run.

After validation, workers.dev and Preview URLs were disabled, the URL returned
404, and the temporary Worker's DATABASE binding was removed. The underlying
shared Hyperdrive/Neon candidate was preserved. The short-lived nonce expired;
its provider-side encrypted value is not claimed deleted from version history.
There are no scheduled/queue triggers. Do not re-enable this retired endpoint
for customers.

`wrangler.jsonc` is a reproduction template for the validation binding, not a
statement that the retired cloud Worker still has that binding. Its default
expiry is deliberately in the past and public routes are disabled. A future
authorized test needs an explicit fresh bounded nonce and separate review of
its target binding; do not load a human AWS credential or production secret.

`edge-check.py` reads a short-lived validation nonce from non-echo stdin and calls
only fixed paths on the fixed synthetic host. It never accepts a user-supplied
URL or SQL. Do not rerun the passed cloud calls to refresh a receipt.

`monthly-model.py` makes the cost assumptions executable. A required unquoted
regional-control term remains null. The model is a conservative architecture,
not a promised cheapest bill or a deployment specification.

See [safe evidence](../../collaboration/verification/cf-neon-validation-20261102/README.md)
for scoped results, original failures and prices. Generated dependencies,
runtime types, local state and reproducible bundles stay excluded; source,
lockfiles, public root, build digest and sanitized observations are preserved.
