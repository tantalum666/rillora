# Password-reset resend and missing-image diagnosis

Updated: 2026-10-02 (Asia/Shanghai)

This is a focused continuation of the existing complete-read release workflow.
Owner requested a fresh password-reset email after reporting an expired link and
asked whether invisible email logos require payment. Owner then confirmed that all
body images are missing and supplied a screenshot with image placeholders.

One TLS handshake failed before transmission; provider listing showed no new mail.
After reconciliation, one request was accepted200 and one email was delivered at
2026-10-02 10:16:35UTC (18:16Asia/Shanghai). Owner subsequently confirmed resetting
the password; Auth0 recorded scp success at10:26:59UTC. No password was set/read by
Agent. Old-link expiry cause/lifetime was not inferred or changed.

The sent HTML already contains the Rillora PNG plus two Auth0 PNGs. All three
public image URLs return200. The Rillora bytes match the current source SHA256.
In the authenticated Resend preview, all3images complete and render at their
expected sizes. No paid feature denial was observed. The Owner's missing-image
screenshot therefore points to the receiving client's external-image loading path;
specific QQ settings, network or image-proxy cause remain unresolved. No plan,
HTML template, DNS, image host, security setting or product implementation changed.

The safe header crop excludes the recovery URL. The Owner-provided screenshot
contains a recovery capability and is deliberately excluded from Git; only sanitized
findings are retained. No full email HTML/body, ticket, cookie or real recipient is
published. Existing Free/provider/physical-device boundaries remain unchanged.

Docs updated: transaction-mail-resend, authentication-experience, release123 and
handoff; journey appended. No new product decision was made, so decision-log needs
no duplicate entry. Existing tests/CI44 retained; no product test/build/deployment
rerun is needed for this read-only diagnosis and authorized resend.

Later Owner completion: QQ successfully signed in with the new password. The actual
shared Directions item loaded. A fresh-tab network read confirms200/no-store/readOnly
and exactly5permitted fields; Notes and the private reference marker are absent.
Planner simulator authentication subsequently failed. Only its old local session
was signed out; the existing Google identity was reused and a new unchecked Account
terms step is awaiting Owner. Revocation has not been attempted or claimed.
