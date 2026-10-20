# Official provider-link audit — 2026-10-06

Status: completed destination/provenance review; restricted forms remain untested  
Checked: 2026-10-06 UTC  
Baseline: `tantalum666/rillora` commit `e229c4668b9868f29dbb44c938fa3930cdd60b77`, `config/provider-guides.json`  
Scope: all 18 guide entries, official primary sources only

This document preserves the completed read-only research. Writing it did not repeat
the external checks. No provider sign-in, personal-data entry, submission, account
change or payment was performed. Search-index evidence is identified separately
from readable pages. A documented destination, successful fetch or redirect does
not prove form completion, legal authority, provider approval or permanent reachability.

## Applied changes and evidence boundary

The implementation's [change record](official-link-changes.json)
records Microsoft, X and Coinbase URL normalization and separate Bitwarden
preparation/request instructions. The current catalog also marks the 1Password
family recovery plan as preparation-only. These are destination/phase changes;
the individual September 18 content-review dates remain unchanged.

Keep descriptive official links; removing duplicate raw-URL UI must not remove
necessary documentation or the distinction between preparation, requests, and
general support. The research recommendations below do not imply every optional
link was implemented. Full content review and native/browser end-to-end acceptance
are separate evidence classes.

## Provider findings

### 1. Apple (`apple`)

- Preparation, readable: <https://support.apple.com/en-us/102631>
- Legacy Contact request, official destination: <https://digital-legacy.apple.com/>
  returned a loading shell; authenticated/dynamic request steps were not tested
- No-key/legal-document/deletion instructions, readable:
  <https://support.apple.com/en-us/102431>
- The latter article explicitly links <https://digital-legacy-account.apple.com/>
  for deletion. Following it redirected to Apple's `idmsa.apple.com` sign-in; the
  tool could not fetch the redirected authentication flow. No sign-in was attempted
- **Disposition:** retain existing three links. A separately labelled deletion
  action is an optional addition, not a replacement for no-key access instructions
- Preserve access-key versus legal-document routes and country-specific evidence.
  Source publication dates observed: September 14, 2026 (preparation), August 10,
  2026 (family access)

### 2. Google (`google`)

- Preparation entry: <https://myaccount.google.com/inactive> redirected to Google
  sign-in; no authentication performed
- Preparation explanation, readable:
  <https://support.google.com/accounts/answer/3036546?hl=en>
- Deceased-user selector, readable:
  <https://support.google.com/accounts/troubleshooter/6357590?hl=en>
- **Disposition:** retain all three. The selector is already the exact official
  entry for closure, funds or content requests. Subsequent choices/submissions were
  not exercised. Preserve the warning to request required content before closure

### 3. Microsoft (`microsoft`)

- Existing URL checked:
  <https://support.microsoft.com/en-us/account-billing/accessing-outlook-com-onedrive-and-other-microsoft-services-when-someone-has-died-ebbd2860-917e-4b39-9913-212362da6b2f>
- Observed final URL, readable:
  <https://support.microsoft.com/en-us/accounts-billing/manage/accessing-outlook-com-onedrive-and-other-microsoft-services-when-someone-has-died>
- **Disposition:** canonical redirect target applied. This specific article is the
  supported entry, not a universal submission form. Preserve China/Germany
  alternatives, regional legal-service requirements and non-guaranteed disclosure

### 4. Dropbox (`dropbox`)

- Readable instructions:
  <https://help.dropbox.com/account-settings/access-account-of-someone-who-passed-away>
- Its documented support-ticket link: <https://www.dropbox.com/support> returned
  an empty text extraction; ticket UI/completion was not verified
- **Disposition:** retain the death-specific article. General support is a necessary
  documented next step, not evidence that a dedicated deceased-account form exists
- Preserve lawful-access/court-order requirements and review caveat. Article
  updated April 2, 2025

### 5. Yahoo (`yahoo`)

- Existing U.S. URL: <https://help.yahoo.com/kb/SLN2021.html>
- Existing global URL: <https://en-global.help.yahoo.com/kb/SLN2021.html>
- Both short URLs returned tool fetch errors. Official search-index content
  established the corresponding descriptive pages:
  - <https://help.yahoo.com/kb/account/options-yahoo-account-owner-passes-sln2021.html>
  - <https://en-global.help.yahoo.com/kb/account/options-yahoo-account-owner-passes-sln2021.html>
  - Additional regional evidence:
    <https://uk.help.yahoo.com/kb/options-yahoo-account-owner-passes-sln26120.html>
- Direct fetches of all three descriptive pages returned HTTP 429. The search
  index reported crawls one to two weeks earlier, not successful live form access
- **Disposition:** retain existing regional links; descriptive URLs are official
  alternatives but not endorsed here as fully live-verified replacements. U.S.
  requests explicitly exclude non-U.S. accounts. UK/regional content-disclosure
  rules differ; global closure-only instructions must not be generalized universally

### 6. Facebook (`meta`)

- Preparation: <https://www.facebook.com/help/1070665206293088>
- After-death guidance: <https://www.facebook.com/help/275013292838654>
- Both redirected to Facebook login/temporary-block pages. No sign-in attempted
- Official indexed memorialization/removal category:
  <https://www.facebook.com/help/1111566045566400?locale=es_LA>
  was discoverable; opening <https://www.facebook.com/help/1111566045566400>
  also reached login/temporary-block content
- Official indexed eligibility reference:
  <https://www.facebook.com/help/991335594313139?locale=en_GB>
  describes adult/minor eligibility as region-dependent. This is a future content
  review flag for the catalog's fixed age-18 wording, not full live verification
- **Disposition:** retain existing destinations with restricted-verification status.
  Do not guess replacement contact-form IDs or refresh a full content-review date

### 7. Instagram (`instagram`)

- Instructions: <https://help.instagram.com/264154560391256> returned HTTP 429
- Memorialization: <https://help.instagram.com/contact/452224988254813>
  returned a fetch error
- Removal: <https://help.instagram.com/contact/1474899482730688> returned HTTP 429
- **Disposition:** retain existing precise destinations rather than guessing IDs.
  Current bodies/forms were not independently verified live. Preserve separate
  memorialization and authorized-removal outcomes and the existing review date

### 8. LinkedIn (`linkedin`)

- Existing article, readable:
  <https://www.linkedin.com/help/linkedin/answer/a1336663/memorialize-or-close-the-account-of-a-deceased-member?lang=en>
- Its closure action: <https://www.linkedin.com/help/linkedin/ask/ts-rmdmlp>
- Its memorialization action: <https://www.linkedin.com/help/linkedin/ask/TS-RDMLP>
- The exact targets above were obtained by following the article's links; both
  were robots-restricted. Preserve spelling/case, and do not claim their form UI
  or submission succeeded
- **Disposition:** keep the article; adding separately labelled action links is
  optional. Closure requires qualifying court-issued representative documents;
  the article excludes a will or power of attorney alone as proof for that route

### 9. X (`x`)

- Readable official guidance:
  <https://help.x.com/en/rules-and-policies/contact-x-about-a-deceased-family-members-account>
- Old catalog form, not accessible through the tool:
  <https://help.twitter.com/forms/account-access/deactivate-or-close-account/deactivate-account-for-deceased>
- Current article links:
  <https://help.x.com/forms/account-access/deactivate-or-close-account/deactivate-account-for-deceased>
- Observed final destination:
  <https://help.x.com/en/forms/account-access/deactivate-or-close-account/deactivate-account-for-deceased>
  displayed a supported-browser requirement rather than usable form controls
- **Disposition:** final `help.x.com/en/` URL applied. Preserve the distinction
  between deceased and incapacitated selections; the documented outcome is
  deactivation, not access to the deceased person's account

### 10. PayPal (`paypal`)

- Exact readable U.S. procedure:
  <https://www.paypal.com/us/cshelp/article/how-do-i-close-the-paypal-account-of-a-deceased-relative-help220>
- **Disposition:** retain. The page provides document-delivery instructions rather
  than a dedicated web claim form. Keep U.S./entity scope, authorized executor or
  administrator requirement, estate W-9 and regional balance-handling limits.
  Neither account login nor funds transfer was tested

### 11. Coinbase (`coinbase`)

- Readable claim instructions:
  <https://help.coinbase.com/en/coinbase/managing-my-account/other/how-do-i-gain-access-to-a-deceased-family-members-coinbase-account>
- Its exact Executor Services link and old catalog URL:
  <https://help.coinbase.com/cant-sign-in?category=executor-services>
- Observed redirect target:
  <https://help.coinbase.com/en/cant-sign-in?category=executor-services>
- The target produced a generic account-access/select-issue shell. Its claim
  purpose is verified through the official article; authenticated controls,
  verification-code generation and submission were not exercised
- **Disposition:** `/en/` target applied; keep instructions. Claimants use their own
  account. Do not replace the category parameter or imply an account-holder-login
  workaround

### 12. Binance (`binance`)

- Readable instructions:
  <https://www.binance.com/en/support/faq/detail/89413ec723d94a1d8fb038e3e1130e0a>
- Exact article-linked action:
  <https://www.binance.com/en/my/risk/appeal?templateId=T192d41590>
- Initial direct fetch failed; following the official article's link returned a
  dynamic shell. Authenticated form content/submission was not verified
- **Disposition:** retain both. Preserve the template ID, claimant's own-account
  requirement, entity/local-law review and Binance.US separation. Instructions
  updated November 28, 2025; this is an after-death appeal, not legacy-contact setup

### 13. Binance.US (`binance_us`)

- Readable specific procedure:
  <https://support.binance.us/en/articles/10395308-collecting-funds-from-a-deceased-user-s-account>
- **Disposition:** retain. Article dated June 3, 2026, directs claimants to support
  after preparing the specified video and documents. No dedicated public claim
  form was linked or verified. Do not use the Binance.com appeal for this entity

### 14. GitHub (`github`)

- Readable preparation:
  <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/maintaining-ownership-continuity-of-your-personal-accounts-repositories>
- Readable deceased-user policy:
  <https://docs.github.com/en/site-policy/other-site-policies/github-deceased-user-policy>
- Policy-linked request entry: <https://support.github.com/> redirected to
  <https://help.github.com/> with only a minimal text shell
- **Disposition:** keep both catalog documents. The support portal is the necessary
  documented next step; no deceased-specific form was verified. Setup and accepted
  successor status must remain distinct from an approved after-death request

### 15. Bitwarden & 1Password (`password_manager`)

- Existing readable Bitwarden overview: <https://bitwarden.com/help/emergency-access/>
- Its readable preparation instructions:
  <https://bitwarden.com/help/add-and-manage-trusted-emergency-contacts/>
- Its readable request instructions:
  <https://bitwarden.com/help/request-and-grant-emergency-access/>
- Readable 1Password family plan:
  <https://support.1password.com/family-recovery-plan/>
- Readable 1Password recovery limits: <https://support.1password.com/recovery/>
- **Disposition:** separate Bitwarden `prepare`/`afterDeath` links applied; 1Password
  family plan changed from `both` to `prepare`. Keep recovery requirements as
  reference, not a deceased-account transfer form. 1Password still requires the
  member's email participation. Bitwarden requires prearranged emergency access;
  neither feature itself establishes inheritance authority
- 1Password publication dates observed: August 17, 2026 (plan), August 3, 2026
  (recovery). No vault was accessed or recovery operation attempted

### 16. Adobe (`adobe`)

- Readable procedure:
  <https://helpx.adobe.com/account/individual/subscriptions-and-plans/renewals-and-cancellations/close-account-behalf-someone-else.html>
- Exact article-linked inquiry form:
  <https://survey.adobe.com/jfe/form/SV_4ZtmRXB3s9kLfca>
- Direct form fetch initially failed; following the article's link returned
  “JavaScript is required” content. Form completion was not tested
- **Disposition:** retain both. The generic privacy entry is intentional: Adobe's
  April 17, 2026 instructions place requester-email verification before selecting
  the death/incapacitation request. Do not guess a death-prefilled form URL

### 17. Netflix (`netflix`)

- Readable deceased-member cancellation instructions:
  <https://help.netflix.com/en/node/110165>
- **Disposition:** retain. The no-account-access branch sends the claimant to
  official support; an ordinary cancel-membership/login link would not replace
  this route. Provide billing information only directly to Netflix; never collect
  it in Rillora. No cancellation or authenticated support flow was exercised

### 18. Steam (`steam`)

- Readable transfer restrictions:
  <https://store.steampowered.com/subscriber_agreement/>
- Support entry: <https://help.steampowered.com/> redirected to
  <https://help.steampowered.com/en/>
- The support extraction included a temporary request error alongside the generic
  support/sign-in navigation. No estate-specific support form was verified
- **Disposition:** retain terms/reference plus general-support labels. Do not
  describe this as a dedicated account-inheritance or game-library transfer service

## Maintenance and follow-through

- Readable pages, official-document-linked but restricted forms, search-index-only
  evidence, and failed fetches are different outcomes. Do not stamp all entries
  “live verified” or infer validity from HTTPS/HTTP 200 alone
- Keep regional Yahoo, Microsoft, PayPal and Binance boundaries; keep preparation,
  authorized requests, recovery limitations, cancellation and ownership distinct
- Optional Apple-deletion/LinkedIn-form additions and Facebook eligibility wording
  are recommendations only. This document does not claim they were implemented
- The implementation owner maintains the focused guide contract, decision log,
  handoff and journey. This scoped documentation task modifies this file only;
  it introduces no new product decision, provider setting or recurring monitor
- This dated audit is not a reachability SLA, a new full content-review date,
  provider approval, legal advice, or proof of a completed native UI flow
