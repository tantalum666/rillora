# Email image diagnosis and fresh recovery link — October2

Updated: 2026-10-02 (Asia/Shanghai)

Owner requested a fresh reset link, then confirmed the password was reset. Auth0's
success event independently agrees. The new mail was delivered at18:16local time.

- [Authorized resend and no-send reconciliation](reset-resend.json)
- [Single delivered message](reset-resend-delivery.json)
- [Owner and Auth0 password-reset completion](reset-completion.json)
- [Image metadata/HTTP/hash/browser-render checks](image-checks.json)
- [Safe sent-email header crop](email-preview-header.png)
- [Coverage and credential-bearing screenshot exclusion](coverage.json)

The three images are already present in the sent email and render in Resend's
preview. Logo visibility is not blocked by a paid-feature gate in this case.
Owner's QQ view shows all images missing; the precise recipient-side loading cause
is not proven. No speculative template/DNS/security/plan change was made.

QQ new-password Web login is now verified. [Actual API field proof](qq-shared-api-fields.json)
confirms a read-only Directions item with only5allowed fields and no-store. The
planner simulator then required authentication; [its recovery checkpoint](sharing-continuation.json)
is waiting for Owner's new terms confirmation. Revocation remains unfinished. Real-device work stays Owner-deferred.
This is evidence, not an instruction to resend, recreate identities or re-run the
already completed tests/deployments. [Current handoff](../../../docs/handoff.md).
