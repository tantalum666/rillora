# Expiry follow-up — retained information and ongoing Family service

Date: 2026-09-10 (Asia/Hong_Kong)  
Scope: continuation of the same packaging review after the Owner challenged the proposal.  
Status: COMPLETE — 58 Markdown files / 271 local links pass; referenced runtime files unchanged. Snapshot/paid implementation remains open.

## Context and reading

The earlier review completed a full read of 55 project-owned Markdown files /
16,011 lines before edits. Its [full-read proof](../full-read-completion.json)
and original source ranges remain unchanged. This follow-up reused that completed
workflow, reread current AGENTS/product/handoff/decisions and the relevant current
monetization/sharing/UI/platform/MVP sections, and preserved the previous handoff
before editing. See `recovery.json`. No new full-read completion is claimed.

The Owner identified a real design weakness: permitting all accepted recipients
to keep seeing new owner edits after expiry gives lasting multi-person service
for a single paid month. The earlier same-day proposal is explicitly superseded
in the append-only decision log and journey.

## Corrected provisional contract

- Cancel renewal: keep the already-paid period, then apply Free at its actual end.
- Planner: keep own core text readable/editable/exportable and trust/exit controls.
- One designated Free recipient: continue to see current permitted content.
- Other accepted paid recipients: retrieve only their last authorized paid-term
  version, with an as-of date and Updates paused; no later values or broader fields.
- Pending above-limit recipients: cannot accept into paid/live or archived access.
- Co-editing, automated reviews and new paid history capture stop at expiry;
  previously authorized outputs remain retrievable within the retention contract.
- Revocation, narrowing, never-disclose, source archive/delete and account deletion
  still restrict/redact hosted saved data. External copies cannot be recalled.
- Repurchasing allows paid service during the new period; it does not silently
  restore revoked sharing or grant a new person access.

The snapshot/access-mode mechanism **does not exist in current runtime code**.
The source audit in the parent report remains the implementation baseline. No
new paid wall, quota enforcement, data snapshot, provider change or deployment
was applied in this follow-up.

## Policy walkthrough — expected behavior, not executed app tests

| Scenario | Required outcome |
| --- | --- |
| Cancel halfway through a paid month | Full purchased capability until its authoritative end |
| End paid month with B and C accepted; B selected for Free | B gets current scope; C's eligible paid-term version stays dated and static |
| Owner changes a direction after expiry | Own record and B may update; C cannot see the later value |
| Owner narrows C's scope or revokes C | Hosted saved content is redacted/denied; later broadening does not silently restore it |
| Snapshot job is late or absent | Never copy post-cutoff plan data or fall back to live reads; prove the snapshot contract before selling |
| Replace the Free live contact | Atomic old-live removal/new-live activation; no refreshed paid archive minted |
| Replayed callback, device-time change, repeated cancel/restart | No extension of authoritative paid/grace window or additional live slots |
| Buy another month later and explicitly resume selected scopes | Paid service works for that new term; normal monthly use is allowed |

Copying/exporting one's own information and normal month-by-month purchases are
not fraud. Enforce concurrency and paid service boundaries; do not add an export
paywall, hidden minimum term, cancellation penalty, invasive device fingerprint
or shared-IP household ban. Annual value still requires an actual joint-review
workflow and observed recurring use. No demand/conversion result is claimed.

## Sources checked

- [1Password frozen account](https://support.1password.com/frozen-account/): existing
  item viewing/copying remains; adding/editing/inviting stops. This is an analogy,
  not Rillora's policy for its own Free text editing.
- [Apple iCloud+ downgrade](https://support.apple.com/en-us/108318): cancellation
  takes effect at the term end; exceeding the new allowance pauses sync/update.
  Rillora does not inherit Apple's plan terms or storage-retention commitments.

## Saved changes and boundary

Updated [monetization](../../../../docs/monetization.md),
[sharing](../../../../docs/trusted-sharing.md),
[commercial UI](../../../../docs/free-paid-ui-audit.md),
[platform](../../../../docs/platform-contract.md),
[MVP](../../../../docs/mvp.md), [product](../../../../docs/product.md),
[current handoff](../../../../docs/handoff.md),
[decision log](../../../../docs/decision-log.md) and
[journey](../../../../docs/journey/PROJECT_JOURNEY.md).
The prior 99-line handoff is archived as HISTORICAL in the existing history file
and `handoff-before.md`. Previous validation numbers remain dated evidence, not
a re-run of this correction.

No runtime code, public legal text, price, payment, real recipient, message,
market experiment or app test changed. The next engineering item is a local,
default-disabled cutoff-safe live/archival lifecycle, before sale or enforcement.
