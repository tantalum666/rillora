# Apple review response — unsent draft

Status: HISTORICAL PREPARED DRAFT / FOLLOW-UP SENT AND RESUBMITTED NOVEMBER14

The Owner later explicitly instructed sending and resubmitting. The [exact sent text](../review18-resubmission-20261114/apple-response-sent.txt) adds the same-build resubmission sentence; [the actual receipt](../review18-resubmission-20261114/README.md) supersedes this earlier unsent state. The preparation text below is retained unchanged.
Prepared: 2026-11-14
Applies to: Rillora 1.0(18), November12 guideline2.1(a) login rejection

Thank you for the screenshot. We identified and corrected a server-side issue in the identity-status validation performed when a new Rillora session is created. The request used an unsupported field projection in the identity provider's API, causing the session exchange to fail even after successful password authentication.

The correction is now deployed to the production service. It retains the existing account-blocking, deletion, password-reset and session security checks. The dedicated review account and its password in App Review Information have not changed, and this server correction does not require a replacement build.

We verified a fresh login with that same review account through the production identity service and API, including the existing matter, account and plan reads, a Web reload, and a native app termination/relaunch without another login. Native verification used the frozen 1.0(18) Release source and matching production configuration on an iPad Air 11-inch (M3) simulator running iPadOS 27.0. We are not claiming a physical iPadOS 27.2.1 test.

For sign-in, choose the existing email/password account using the credentials already provided in App Review Information. Complete the displayed account terms, and if the optional passkey-enrollment page appears, choose to continue without a passkey. Successful sign-in opens the review account's existing matter map. No new account or email verification is required to inspect that account's original plan.

We have also corrected our pre-submission validation procedure: any change affecting identity or session issuance must be followed by a fresh production sign-in through the final backend and release candidate. Health checks and an unblocked user record are not accepted as substitutes for that flow.

## Attachment provenance

The images in this directory prefixed `fresh-` are actual captures from this acceptance, not designed App Store marketing artwork. Native images come from the above simulator; Web images come from the production Web session. They demonstrate sign-in and retained data, not a new purchase or physical-device transaction. Do not attach the earlier failed screenshot as if it showed the correction.
