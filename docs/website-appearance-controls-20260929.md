# Website appearance controls and Home navigation

Status: PUBLIC WEBSITE AND LEGAL SUPPLEMENT PUBLISHED; EXACT EVIDENCE IN HANDOFF
Last updated: 2026-09-29 (Asia/Hong_Kong)

## Owner direction

Add Home to top navigation and provide manual light/dark switching while retaining
the earlier system default. Owner then explicitly places the appearance control
on the right of Sign in, near the far-right edge. This placement applies on both
desktop and narrow mobile; do not hide the control inside the mobile menu.

## Behavior and implementation

- One icon button opens System/Light/Dark choices. Navigation and appearance panels
  are mutually exclusive. Native radios support keyboard changes; Escape returns
  focus to the trigger, and outside interaction closes the panel.
- System is the default and follows device changes. Selecting Light/Dark records
  that explicit choice in a single local value, `rillora.website.appearance.v1`.
  System deletes the value. No value is written just because someone visits.
- The preference contains only `light` or `dark`; no account/content/identifier.
  It remains until cleared or reset to System. Storage failure still allows the
  current-page change and shows an accurate non-persistence explanation.
- A single idempotent bootstrap supplies the store to both a small hashed script
  before the public module/styles and the React fallback. No inline CSP exception.
  Images, wordmarks, root colors and browser theme-color follow the resolved choice.
- Other tabs synchronize the same key. Unknown values/keys are ignored. Actual
  product/private App themes and account/identity state remain separate.
- Public build marker v2 declares this specific functional preference. The cloud
  artifact guard permits exactly that key/purpose with cookies and tracking off;
  it still rejects private-app flags, extra storage keys and tracking. Legacy
  no-storage artifacts remain accepted for a reviewed rollback.

## Clear disclosure

The chooser explains on-device persistence and System reset before a choice.
`/legal#appearance` explains key, values, duration, purpose and clearing. The public
Privacy/Cookie publication shell displays the same dated website-only update, so
its prior storage descriptions are not silently left as an exhaustive current
list. Existing accepted document bodies, identity clickwrap versions and core
consent digest are unchanged; there is no new account acceptance ceremony.

The [ICO appearance guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
was reviewed for clear information, appearance-only purpose and simple objection.
This is a scoped implementation/disclosure assessment, not worldwide legal
clearance or permission to add analytics. Selecting System is the free reset.

## Free export question

Owner asks for a recommendation, not an entitlement change. Keep the existing
Free basic exports, recovery/backups, recipient-authorized retrieval and exit rights.
Agent recommends charging for ongoing coordination or new optional higher-level
services, not removing these existing abilities. Free1/Family5limits live online
relationships; it cannot and should not pretend to prevent an owner forwarding a
personal offline copy. Offline copies do not become additional live shared accounts.

Bitwarden's [official comparison](https://bitwarden.com/help/password-manager-plans/)
includes encrypted export in Free, while advanced reports/emergency access differ.
Proton's [export instructions](https://proton.me/support/pass-export) describe
backup/migration uses; do not infer every free/paid entitlement from that article.
These are reference patterns, not proof of Rillora conversion or revenue. No
export paywall, new paid report, price change or automatic retention promise is
implemented in this request.

## Checks

Behavior tests cover system changes without writes, saved override/reset, invalid
values, unavailable storage and cross-tab/bootstrap behavior. Cloud tests reject
extra keys/tracking. Browser QA must verify explicit choice, reload and subpage
persistence, System reset, both theme assets, Home, far-right placement, keyboard
and320/390px. Results and source/deployment evidence are recorded separately in
[QA](../output/qa/rillora-launch-goal-20260926/landing-theme-controls/).

Browser QA also found incorrect subscription/refund URLs in the legal index. These
now use the same canonical route constants as the actual legal publication.
