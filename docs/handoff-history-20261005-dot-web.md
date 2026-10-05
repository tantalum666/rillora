# HISTORICAL — Dot Web localization branch before consolidation

# Rillora Current Handoff

Status: CHINESE WEB IMPLEMENTED; LOCAL CHECKS PASS; BROWSER ACCEPTANCE BLOCKED; NOT DEPLOYED
Last updated: 2026-10-05 (Asia/Hong_Kong)

## Current task

Owner requested a maintainable Chinese interface and Git push. This branch implements
Simplified Chinese + English for the Web application and public website on the actual
strict-review baseline 2cc95f77. The [localization contract](web-localization-20261005.md)
records coverage, architecture and maintenance. Branch: codex/chinese-web-20261005.

## Completed and evidence

- 1,274 paired semantic messages, central React locale context, explicit-only local
preference, language switch, English fallback, plural/interpolation and Intl formatting.
- Core navigation/forms/invitations/sharing/reviews/export/data/settings/billing display
and public website localized. Existing layouts/full03, API enum values and permissions,
USD 88.99 annual / Free 1 / Family 5, real saved content and exact DELETE confirmation retained.
- 162 App/locale tests and 7 legal-fixture tests pass. Actual internal/public/legal/closed/review
builds pass. Closed/review artifacts use fake CI legal fields and are not publishable.
- 98 API-call ASTs unchanged; 13 protected legal/API/crypto/provider/catalog files unchanged.
[QA](qa/chinese-web-20261005/README.md) and [remote receipt](qa/chinese-web-20261005/remote-verification.json)
separate local checks, actual Git/CI state and browser limits.

## Boundaries and blocker

Chromium cannot create its socket in this executor; the supported cloud preview is
blocked before navigation. No screenshot or rendered responsive/keyboard/draft-flow
acceptance is claimed. [Reproduction and unfinished matrix](qa/chinese-web-20261005/BROWSER-QA.md).
English operative legal text/receipt versions, hosted Auth0, mail, native iOS, official
guide bodies and server-generated English export remain separate language scopes.
No merge, deployment, market/billing activation or provider configuration changed.

The prior disposable-identity acceptance dependency and temporary restricted runtime
were not rechecked or altered. Their exact dated state remains in the [historical
handoff](handoff-history-20261005-before-chinese-web.md); localization does not close
that work, renew access or reopen deferred physical-device/merchant tasks.

## Single next step

Complete the documented Chinese/English browser acceptance on an executor with a
working browser, then separately review merge/deployment. Preserve the prior real-core
acceptance browser and its existing user-confirmation dependency.
