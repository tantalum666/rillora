# Resend configuration evidence — October1

Status: PROVIDER CONFIGURED; DELIVERY AND FAILURE SIMULATORS PASSED; REAL USER ACCEPTANCE OPEN
Last updated: 2026-10-01 (Asia/Shanghai)

These are new public-configuration and synthetic-test receipts, preserved exactly
from the local QA folder for Git/Dot collaboration. They are not runtime source or
instructions to rerun the tests. [Current contract](../../../docs/transaction-mail-resend-20261001.md)
and [handoff](../../../docs/handoff.md) own continuation.

| Result | Evidence |
| --- | --- |
| All prior30 DNS records retained; four additions | [Write receipt](dns-write-receipt.json), [before](dns-before.json), [after](dns-after.json) |
| Two authoritative + two public resolver checks16/16 | [DNS verification](public-dns-verification.json) |
| Separate DoH checks4/4 | [DoH verification](dns-over-https-verification.json) |
| Resend domain verified; tracking/receiving off | [API readback](resend-domain-verified.json), [screenshot](resend-domain-verified.jpg) |
| TLS enforced after saved-page reload | [Configuration UI readback](resend-tls-ui-readback.json) |
| Domain-restricted sending key; secret protected | [Non-secret key receipt](resend-sender-key-receipt.json) |
| Auth0 native provider/name/enabled/From | [Provider readback](auth0-resend-installed.json) |
| Same-scope Auth0 session renewal | [Renewal readback](auth0-renewal-readback.json) |
| Existing public support contact and valid route | [Support metadata](auth0-public-support-updated.json) |
| Direct restricted-key simulator send delivered | [Delivery event](resend-simulator-result.json) |
| Auth0 verification-template simulator send delivered; fixture absent | [Probe and cleanup](auth0-transport-probe-state.json) |
| Free limits; paid overage off | [Account limits](resend-account-limits.json) |
| Bounced, complained and suppressed simulator events | [Failure simulations](resend-failure-simulators.json) |
| Three actual expired AWS profiles | [Session boundary](aws-session-boundary.json) |
| Documentation/decision/remaining gates | [Closeout](closeout.json), [reading continuity](continuation-reading.json) |
| Every included original and explicit cache exclusions | [Coverage](coverage.json) |

Two successful messages went only to Resend's official `delivered+…@resend.dev`
simulator. Three additional official addresses simulated bounce, complaint and
suppression; all returned their expected event.
No real recipient was contacted; no verification link was followed; no Rillora API
or real identity was used. The one newly tagged Auth0 identity is confirmed absent.
The test script is retained as `.reference.txt`, not a new production mail service.

Earlier status files deliberately retain not-authenticated/pending/no-provider
observations. The final readbacks listed above supersede them. The earlier image
`resend-verified-tls.jpg` shows the verified event but has TLS below the fold; use
the explicit UI readback for TLS and `resend-domain-verified.jpg` for visual domain
proof. No email HTML/ticket, API token, private key or real recipient appears here.

The immutable September30 encrypted archives were not rebuilt or redownloaded.
Current source/publication scans and link checks are recorded beside these receipts.
[Git remote readback](remote-readback.json) confirms the provider/evidence commit
and a clean tree after normal push. The receipt follow-up changes only this proof
and its manifest; final main is checked again after that push. CI42 remains evidence for unchanged runtime
implementation, not a new mail-delivery or product-acceptance run.

[Source scan](source-scan.json) passed with29 previously reviewed non-secrets and
zero unreviewed findings. [Markdown links](markdown-links.json) checked176 owned
Markdown files and1,804 local links with no missing destination. The final
[readable evidence scan](publication-final.json) passed for the recorded readable manifest;
its own result is then added to the refreshed manifest. Product suites were not rerun.
