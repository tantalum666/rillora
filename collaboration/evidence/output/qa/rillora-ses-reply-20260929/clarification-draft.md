# SES clarification — HISTORICAL PRE-SUBMISSION DRAFT

Prepared: 2026-09-29 (Asia/Hong_Kong)
Case: 179022088800001 · eu-central-1
Purpose: concrete clarification of the September29 refusal. Owner subsequently
authorized sending it. Submitted once through the original Support case at
2026-09-29 22:31:40+08. The exact submitted text is `clarification-submission.txt`;
spacing was normalized without changing the three questions. See the receipt.

Hello AWS Digital Messaging team,

Thank you for the September29 response. We understand that production access has
not been approved. Could you clarify the actionable next steps for this account?

1. Our current SES GetAccount response reports EnforcementStatus HEALTHY and
   SendingEnabled true, while ProductionAccessEnabled is false. Is your concern
   an observed sender-reputation problem, or evidence required for production
   onboarding? If possible, please identify the category of evidence or control
   we should improve; we are not requesting disclosure of proprietary risk rules.
2. Our request is limited to user-triggered Auth0 verification and password-reset
   messages. We can retain200messages/day and1message/second; we need production
   recipient access rather than higher volume. Can this limited access be reviewed
   while retaining the existing quota?
3. Which specific evidence, improvement or observation period would make a future
   review useful? If controlled delivery tests to owned/consenting verified
   recipients would help, please confirm what results you need. We do not want to
   generate unnecessary traffic or repeatedly resubmit unchanged material.

Our earlier correspondence already describes the recipient source, proposed
volume, domain authentication, suppression, monitoring and sample content. The
current read-only check still passes these configuration conditions. Final Auth0
sender integration and customer email acceptance remain pending; we do not claim
they are already enabled.

Thank you.
