# Role-Scoped Disclosure Policy Rehearsal

Role: focused product, state-machine and field-disclosure contract  
Authority scope: planner-only rehearsal of death, incapacity and missing-person policy  
Superseded by: a later reviewed decision recorded in `docs/decision-log.md`  
Do not use for: a real claim, evidence review, recipient delivery, legal advice or data release  
Status: LOCAL WEB/API/IOS REHEARSAL IMPLEMENTED; ALL OPERATIVE CAPABILITIES CLOSED  
Last updated: 2026-08-10

## Purpose

The rehearsal lets a planner answer two questions before an emergency:

1. which review stages would apply to one specific life event;
2. which minimum safe fields each recorded role could eventually see if a separate real process later established identity, evidence and authority.

It is a frozen, planner-visible policy snapshot. It does not notify a person, collect or verify evidence, establish authority, deliver a package or release data.

## Fixed Technical Boundary — LOCKED

Every database row and API response must preserve all of these values:

```text
simulationOnly = true
operative = false
identityVerified = false
documentsVerified = false
multiPartyVerified = false
notificationsSent = false
dataReleased = false
releaseAvailable = false
legalAuthorityGranted = false
```

The PostgreSQL constraint makes the stored operational flags immutable to an unsafe combination. Web and iOS independently reject responses that violate the boundary. The API accepts no document, identity-proof, death-certificate, authority or contact-delivery payload on this surface.

## Three Separate State Machines — LOCKED

### Death

`death_claim_opened -> death_identity_review -> death_document_review -> death_multi_party_confirmation -> death_cooling_off -> death_preview_ready`

Exceptional states: `death_appealed`, `death_canceled`.

### Incapacity

`incapacity_claim_opened -> incapacity_identity_review -> incapacity_authority_review -> incapacity_multi_party_confirmation -> incapacity_cooling_off -> incapacity_preview_ready`

Exceptional states: `incapacity_appealed`, `incapacity_canceled`.

### Missing / Unreachable

`missing_report_opened -> missing_identity_review -> missing_contact_attempts_review -> missing_multi_party_confirmation -> missing_support_cooling_off -> missing_limited_preview_ready`

Exceptional states: `missing_appealed`, `missing_canceled`.

The event prefix is part of the stored state and database check constraint, so a death row cannot silently enter an incapacity or missing-person state. A planner can advance, enter an appeal hold, restart from identity review, simulate the end of a cooling period, or cancel when that action is valid. Mutations require the latest optimistic version and a literal simulation-only acknowledgement.

No wall-clock job advances the rehearsal. The current 336-hour death, 168-hour incapacity and 72-hour missing-person holds are `PROVISIONAL` illustrative policy values, not legal conclusions or elapsed real time.

## Role And Field Policy — LOCKED FOR THIS REHEARSAL

An active role assignment determines whether a role has a projected view. Invitation evidence remains labelled `simulation`, `real` or `record_only`; none of those labels establishes legal authority.

| Life event | Role | Projected safe fields |
| --- | --- | --- |
| Death | Trusted Contact | matter title, category, desired outcome |
| Death | Executor | matter title, category, institution name, safe location hint, desired outcome |
| Death | Recipient | only matter-specific assigned title, category, safe location hint, desired outcome |
| Incapacity | Trusted Contact | matter title and category only |
| Incapacity | Executor / Recipient | no projected view; those labels do not establish incapacity authority |
| Missing | Trusted Contact | planner display name, time zone and total matter count only |
| Missing | Executor / Recipient | no projected view |

Dedicated account hints, value bands, currencies, passwords, recovery codes, seed phrases and private keys never enter a projected role view. A missing-person preview returns no matter list. The clients use explicit allowlists; iOS also rejects unknown matter-preview keys during decoding.

## Snapshot And Audit Semantics

- Creation captures the current active matters, non-revoked role assignments, planner name/time zone, invitation-evidence label and current role-policy version into `policy_snapshot`.
- Creating, editing or revoking a role—and relevant person or matter lifecycle cascades—marks older snapshots stale without rewriting their frozen history. A stale snapshot cannot advance or imply current policy; the planner must create a fresh rehearsal.
- Later plan edits do not rewrite an existing rehearsal. The planner starts a new rehearsal to review a fresh snapshot.
- Checkpoints record only that a guardrail was simulated; every checkpoint says `realEvidenceCollected: false`.
- Audit events contain the rehearsal ID, event, previous state, next state and `simulationOnly: true`; they do not contain matter content, contact details or proof documents.
- The final `preview_ready` state means only that the planner can inspect the projected role views. It is not `STAGED_RELEASE` and creates no retrieval authority for a role holder.

## Shared API

| Endpoint | Meaning |
| --- | --- |
| `GET /v1/disclosure-rehearsals` | list the authenticated planner's latest rehearsal snapshots |
| `GET /v1/disclosure-rehearsals/:publicId` | read one same-planner rehearsal |
| `POST /v1/disclosure-rehearsals` | create a death, incapacity or missing-person snapshot |
| `POST /v1/disclosure-rehearsals/:publicId/actions` | apply one versioned simulated transition |

All endpoints are planner-authenticated. Cookie mutations require CSRF proof; native Bearer mutations retain the typed session boundary. Forced RLS and same-planner queries prevent cross-tenant access.

## Platform Presentation

- Web uses a planner drawer with event selection, a policy timeline, exact role-field cards and explicit action buttons. It loads the latest snapshot, surfaces a prominent stale-policy warning and offers a fresh rehearsal rather than silently showing outdated coverage.
- iOS uses a native `Form`, navigation `Picker`, timeline rows, role sections and an injected observable Store with idle, working, loaded and recoverable failure states.
- Both clients fail closed on unsafe boundary values or forbidden projected fields and repeat that no notification, evidence verification, authority or release occurred.

Neither surface is a recipient portal. No role holder receives or can fetch the preview.

## Evidence Boundary

Local evidence on 2026-08-10 covers database constraints and RLS, separate state sequences, optimistic transitions, appeal/restart/cancel, simulated cooling-off, field minimisation, forbidden-field rejection, cross-planner isolation and role-policy snapshot invalidation. API tests pass 38/38, Web API-client tests pass 11/11, and native iOS tests pass 67/67 on iPhone 17e Simulator with iOS 26.5. Web manual QA exercised an assigned recipient preview, role revocation, stale warning and fresh snapshot; no manual iOS rehearsal/editor UI claim is made.

This does not prove a manually driven browser/iOS UI journey for these bytes, a real person's identity or consent, real evidence, a legally correct cooling period, external notification, durable recipient keys, delivery, release, physical-device/TestFlight behavior, production deployment, legal review, independent security review or market demand.
