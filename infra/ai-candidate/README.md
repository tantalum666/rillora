# Isolated AI hosting candidate

Status: SYNTHETIC ONLY — NOT A CUSTOMER OR APP REVIEW DEPLOYMENT
Last updated: 2026-10-17 (Asia/Hong_Kong)

This package hosts the next-version selected-matter MCP service at the explicitly managed
`https://rillora-ai-candidate.rillora-candidate.workers.dev/mcp`. It reuses the API's
selected-field domain service, content envelope format, signed database transactions and
read-only MCP tool definitions. Production and the submitted iOS build stay independent.

Cloudflare Workers Free runs the service. Its EU-jurisdiction OAuth KV namespace holds
independent pre-registered client grants. Hyperdrive uses an isolated Neon Free database,
origin certificate verification and disabled query caching. Neon has a low project quota
and was observed to suspend after idle. No paid upgrade, production database copy or DNS
migration is needed. Free limits are not an availability guarantee.

One dedicated Auth0 first-party application handles upstream sign-in. A signup-disabled,
non-domain connection exposes only the synthetic account. Downstream Claude, Claude Code,
Cursor and Qwen Code registrations have different client IDs. Global Auth0 DCR, provider
token exchange, CIMD and arbitrary callback registration are disabled. Existing Auth0
applications and connection bindings are unchanged.

The candidate enforces its exact origin, synthetic identity, PKCE S256, canonical resource,
registered client and requested scopes. Explicit matter selection uses a recent verified
Auth0 login, browser-bound consent, same-origin CSRF and current item versions. Each access
token remains bound to the original database connection UUID. Access tokens last 15 minutes;
rotating refresh tokens have a fixed eight-hour lifetime and recheck the current connection.
Database grants expire within seven days. Revocation blocks old and refreshed tokens immediately
on the next read and rejects subsequent refreshes. It cannot remove data already received by an AI.

Only synthetic records are accepted. A dedicated Worker secret wraps content keys; this is
**not** equivalent to production AWS KMS, independently enforced recovery publication or a
customer readiness decision. The production recovery and deployment sequence remains in
[the integration contract](../../integrations/ai/README.md). `HOSTING_MODE` cannot be changed
to production to activate this package. No general user signup, customer data import, payments,
sharing, exports or release-of-information operation is exposed.

## Build and configuration

Install the API dependencies first, then this package. The dry build contacts no provider:

```sh
npm ci --prefix apps/api
npm ci --ignore-scripts --prefix infra/ai-candidate
npm run typecheck --prefix infra/ai-candidate
npm test --prefix infra/ai-candidate
npm run build --prefix infra/ai-candidate
```

`wrangler.jsonc` contains public resource identifiers and the exact required secret names.
Never insert secret values into that file or generated client packages. The local operator
credentials are stored in the existing Secure Enclave envelope; deployed values are protected
Worker secrets, while the database password is held by Hyperdrive. An authenticated deploy
updates only `rillora-ai-candidate`; the Git workflow performs a dry build, not a deployment.

Operator endpoints require a separate secret and accept only the fixed candidate status,
known-client registration and two-item synthetic seed operations. They never accept SQL,
arbitrary callback URLs or a customer identity. Normal browser sessions can list and revoke
only their own existing grants. No operator credential is sent to the browser.

Read [the current hosted evidence](../../docs/architecture/ai-hosting-20261017.md) before
continuing. Earlier capability probes are retained as dated QA evidence, not active runtime
modules. The old probe Worker's public route is disabled; the Neon Function ingress test did
not become the application hosting path.

The empty-database migration adapter is available as `tools/mcp/prepare-candidate-migrations.mts`.
It emits a new directory of statement arrays, preserves the original SQL checksums and refuses
to prepare over an existing output. Its database guard accepts only an empty
`rillora_ai_candidate` database. Submit all arrays together in **one** provider transaction;
never apply each file as its own transaction or reuse this adapter for production.
