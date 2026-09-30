# Invitation clarity and authenticated motion QA

Date:2026-09-11 (Asia/Hong_Kong)  
Status: implementation, scoped visual/runtime QA and Web staging update complete; cleanup verification complete.

## Owner task and reading

Free includes one outgoing relationship, but the Owner opened the receiving sheet
and expected a link/QR. They also requested generated visual references followed
by real motion in authenticated UI. Before implementation, all64 project-owned
Markdown files/18,907 lines/2,297,373 bytes were read in full. Truncated ranges were
reread and acknowledged; original source hashes were unchanged at completion.
[Inventory/ranges](reading-inventory.json), [completion](full-read-completion.json).
Newly authored specification and asset README are additions to that completed read.

## Implemented scope

- Overview and Profile/More expose Invite someone directly. Person→Access→Link
  continues to real per-item sharing and Create link & QR.
- Incoming says Accept a received invitation and belongs to Shared with me.
  Guests still need registration/signin before explicit account-bound acceptance.
- Selected second displayed ImageGen concept: Prepared Folio. The actual generated
  illustration, accessible counts, entry/press/step/permission/connection/copy
  feedback, simpler root layout and people-first Profile are implemented on both
  clients. Native tabs and desktop/mobile Web navigation remain distinct.
- Clean foreground refresh removes obsolete QR/link state after acceptance,
  revocation or an external version change. Dirty drafts are preserved.
- AX5 uses a full current-step header; reduced motion removes transforms. Received
  details omit unknown/undecided filler and preserve granted Notes/wallet values.
- Numerical commercial Free1/Family5 enforcement and paid-cutoff versions remain
  separately unfinished. Billing stays closed; there is no incomplete invite paywall.

## Verification

| Check | Result and scope |
| --- | --- |
| Native unit suite |135 passed,0 failed,1 pre-existing StoreKit environment skip; final xcresult below |
| New native regressions |Accepted recipient clears pending link; unchanged polling retains a valid link while external version change clears it |
| Web app tests |58 passed,0 failed; legal-only artifact not changed or retested |
| API sharing |11 passed in dedicated continuity_sharing_test; API source unchanged |
| Signup continuation |1 passed,48 other cases deselected in dedicated continuity_test; mock provider registration returns to same invite before acceptance |
| NativeA→WebB |Actual UI creates Parent QA invitation; B accepts and reads only Family directions at Directions level, without Notes/wallet/unselected items |
| WebA→nativeC |Actual UI creates Friend QA invitation; C accepts and reads only Wallet directions at Details level, including public locator and Notes |
| QR and copy |Core Image decodes native and Web rendered QR screenshots; Web Copy returns the same bounded fragment URL |
| Fresh Free fixture |Empty D with zero matters creates first invitation and real QR without payment or preselected sharing |
| Revocation |Web stops C; subsequent API reads show C0 items/connections while B retains1 permitted item; remaining fixtures revoked at cleanup |
| Foreground refresh |Synthetic server acceptance while Web creator remains open, followed by a focus event, removes QR and waiting copy; Connected is shown |
| Layout |Web320/390/1440 has0 horizontal overflow; QR action widths fit; native Pro default and AX5/Reduce Motion checked |
| Draft protection |Native AX5 Cancel→Keep editing retains Draft QA; explicit Discard then closes |
| Motion recording |native-entry-motion.mp4 decodes;14.343s,1206×2622, variable capture fps; not a performance benchmark |

Final native test bundle:
`/Users/tantalum/Library/Developer/XcodeBuildMCP/workspaces/app-525a0c93b7f5/result-bundles/test_sim_2026-09-11T11-39-18-792Z_pid84268_3b8051e8.xcresult`

The source layout-matrix root assertions now target Invite someone and current
Profile tools rather than removed progress/rehearsal controls. The updated matrix target compiles with build-for-testing. Full legacy deep
matrix execution was not claimed; it retains older editor/rehearsal cases requiring
alignment before that separate five-device run. This turn uses the actual targeted
browser/Simulator operations above, plus native units.

## Visual evidence

- [Combined reference/native/Web comparison](visual-comparison.png)
- [Native Overview](ios-empty-final.jpg), [Web Overview](web-empty-final.png),
  [desktop Web](web-empty-desktop.png), [320px Web](web-empty-320.png)
- [Final native QR](ios-qr-final.jpg), [Web QR](web-qr-final.png),
  [foreground Connected state](web-focus-connected.png)
- [AX5 repaired stepper](ios-ax5-stepper-final.jpg), [rejected AX5 stepper](ios-ax5-stepper-before.jpg)
- [B's permitted Web details](web-parent-read.png), [C's native Details/Notes](ios-friend-details-first.jpg)
- [Cloud receiving entry](staging-received-invitation.png)
- [Actual native entry/navigation motion](native-entry-motion.mp4),
  [actual native acceptance recording](native-invitation-acceptance.mp4)

The generated source uses a390×844 logical design target. Native system chrome
and explicit synthetic QA notices remain visible. Counts are real UI rather than
generated image text. The current root [design QA](../../../design-qa.md) records
the five fidelity surfaces and resolved iterations; final result is passed.

IAB interaction/DOM checks succeeded, but its screenshot pipeline produced
inconsistent scaling/tiling. Those images were rejected and replaced with accurate
isolated Playwright captures of the same app. No product CSS workaround was used
to hide the capture-tool problem. Earlier layout failures and a test-double
protocol-conformance build failure are retained; the corrected native suite passes.
The QA comparison HTTP server had a missing favicon request only; product console
checks have0 errors/warnings.

## Deployment

Existing synthetic staging: https://app.staging.rillora.xyz.
Only the Web deployment asset changed. The initial CDK diff fell back to template
comparison; deployment completed normally. CloudFormation UPDATE_COMPLETE,
API task revision20 desired/running1/1, pending0, rollout COMPLETED. Existing
migrations0040–0042 were not rerun or changed. [Service readback](service-after.json).

[31/31 HTTPS and built-asset checks](aws-http-verification.json) include the new
folio JPEG, SPA routes, anonymous/private/authentication rejection, no-store and
headers. Normal native cloud Debug is restored. No Auth0/provider/secret, legal
publication, ordinary entitlement, price, merchant, production or operations
schedule changed; the existing AWS session was reused without personal login.

## Documentation and cleanup

Focused contract: [invitation-motion-ux.md](../../../docs/invitation-motion-ux.md).
Current handoff, append-only decision/journey and affected specifications are
updated. Old handoff is preserved as HISTORICAL. The selected visual is an Agent
decision within the Owner's existing reversible-design authorization, not a new
Owner image-selection claim. [Changed documentation](documentation-changes.json).

[Synthetic cleanup](synthetic-cleanup.json) records all test connections revoked
and0 real messages. Planners/matters remain only in continuity_invite_motion.
[Task-owned API/Web/comparison listeners are stopped](local-server-cleanup.json); unrelated
existing listeners are preserved. No initial commit, branch or stash was created.
No source contains a real invitation token or credential; saved synthetic QR
capabilities are now invalid. Real recipient-provider identity, external delivery,
physical VoiceOver/localization, complete commercial cutoff/quotas and public
paid launch still need their own evidence.

Final documentation check:66 current owned Markdown files,460 local links,0 missing targets. [Closeout checks](closeout-checks.json).
