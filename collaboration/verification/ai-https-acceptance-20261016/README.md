# Rillora temporary HTTPS selection and revocation acceptance

Last updated: 2026-10-16 (Asia/Hong_Kong)

[Current contract](../../../docs/architecture/ai-https-acceptance-20261016.md) records the actual synthetic Web → Auth0 → Codex → public HTTPS MCP → Web revocation flow. Production/review configuration, real records, prices and billing remain unchanged; no TestFlight.

The browser saved exactly one selected matter. Real Codex OAuth and tool discovery succeeded; two official-SDK protocol calls using the client-presented credential returned only that selected summary and missing-field names. Web revocation then rejected both tools with the same still-valid token,819seconds remaining. This is not natural-language model tool selection, long-term hosting, consumer-product compatibility, indexing or directory publication.

Two product defects found during actual acceptance were corrected: MCP readiness uses the existing scoped database transaction without widening the base role; configured HTTPS uses Secure/__Host cookies consistently with the Web CSRF reader. Type checking,19MCP tests,42cookie/auth/sharing tests and27Web-client tests passed. The first41-test checkpoint is retained as intermediate evidence. Secret scanning has32reviewed non-secrets and0unknown findings.

All newly created Auth0 fixture resources, synthetic records/runtime role, owned listeners/tunnel and scoped Codex login are removed. Original other applications, connection bindings and full tenant settings match. The inactive Default App retains an explicitly documented normalization from unspecified token_endpoint_auth_method to client_secret_post because the provider rejects restoring the old empty field without more credential-management access. No secret rotation occurred; receipt wording secretUnchanged is not an independent before/after secret-byte comparison.

Archive44 contains344original paths /174deduplicated objects /4,375,200encrypted bytes; local authenticated decryption passes. Only this new work is included. Earlier archives1–43 remain immutable. Safe receipts, scripts as reference text, scoped UI screenshots and failure outcomes are readable; exact compiled candidates and installation logs are sealed. Credentials, raw Auth0 objects, login capability URLs, private operator environment and local database files stay excluded. Three earlier preflight receipts already preserved byte-for-byte are referenced instead of duplicated.

- [Selected scope in the actual browser](images/selected-synthetic-grant.png)
- [Revoked scope in the actual browser](images/revoked-synthetic-grant.png)
- [Final local cleanup and provider restoration boundary](receipts/acceptance/final-cleanup-readback.json)
- [Capture catalog](catalog.json), [snapshot](snapshot.json), [local archive authentication](archive-verification.json)

Source/archive7902622f2 is pushed. [CI169](https://github.com/tantalum666/rillora/actions/runs/38927866979) passes all three jobs. [Independent remote readback](remote-readback.json) downloaded only archive44 into empty LFS storage and authenticated all174objects/344paths against immutable GitHub metadata. [CI receipt](ci-readback.json) and final completion metadata follow as ordinary Git files without resealing or deploying.
