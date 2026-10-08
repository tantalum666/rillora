# Rillora external-link guard and hosting investigation

Date: 2026-10-08. Baseline: c0cec8680c613c3f6889f800754818fddf901031.
Status: source safeguard; hosting migration is not deployed.

## Finding

The reported Safari page named chatgpt.site while the address bar remained
legal.rillora.xyz. Current application links point directly to the legal hostname.
Sites control-plane readback confirms its CNAME target is custom-domains.chatgpt.site;
this is a hosting dependency rather than evidence of an authored GPT redirect.
The exact device/network security trigger is unknown. Successful cloud browser
checks do not establish that the original device block is fixed.

Privacy belongs to the same seven-document legal bundle: /privacy, /terms,
/subscription-terms, /refund-policy, /acceptable-use, /cookies and /legal.
All seven rendered in the cloud browser on October 7; Privacy and Terms also had
successful 200/no-redirect HTTP checks and an actual Privacy-to-Terms click.
October 8 readback still finds Sites active/public version 10 and the same CNAME.
The WWW /legal page is a directory pointing back to this host, not a fallback;
WWW /privacy and /terms did not provide equivalent documents.

## Narrow source change

The new external-url-hygiene.test.mjs is automatically included by the existing
Web CI test glob. It checks authored Web/native source, guide and attribution
links, public listing links, and legal integration references. It rejects exposed
Sites URLs, GPT tracking parameters and common GPT redirect wrappers, including
scheme-relative targets. It inspects escaped source URLs and checks complete guide
URLs for raw whitespace/control characters before parsing.

Official OpenAI help/docs references remain valid. No runtime URL is rewritten,
and functional authentication/provider parameters are preserved. Existing
provider-owned-host assertions remain active. Tests contain synthetic negative
examples only, never runtime destinations.

The initial source inventory covered 18 guides/35 provider links and found no GPT
tracking suffix or intermediary URL. The continuation retains the latest upstream
native files without editing them. A source test cannot prove DNS, arbitrary
provider redirects or all future links universally safe; hosting inventory and
post-deployment DNS/HTTP/browser checks are separate requirements.

## Verification

- 177 Web tests passed on the current baseline, including three new guard tests
- Internal Web build passed during this continuation
- Prior public build and seven legal packaging fixture tests passed October 7;
  those results are retained as dated evidence, not claimed as newly rerun here
- Xcode/native runtime and migration acceptance were not run

See [aggregate verification](summary.json). Detailed suite logs are not uploaded.
No application route, accepted legal body/version/digest, production configuration,
shared product/decision/handoff document, DNS, AWS resource or billing setting is
changed by this focused publication. Broader shared-document updates were blocked
by review and are not included or transmitted under another filename.

## Current migration scope and access

The Owner asks to audit every Rillora public hostname/preview that depends on GPT
hosting and move those portions toward Cloudflare Pages. This includes Privacy,
not only Terms. Distinguish production from design/motion previews, preserve all
seven branded legal URLs/content/security boundaries, and leave unrelated personal
Sites and official provider references alone. The authenticated AWS backend is
outside this public-host migration. Current known-host inventory: legal is Sites-backed; WWW, app and app.staging use
CloudFront, and login uses Auth0. Root redirects to WWW. A separate restricted
Rillora motion-review Site is a design preview, not production; its audience must
remain restricted. Planned api/docs/status hostnames are not currently provisioned.
Inventory is bounded to known Rillora hosts and owned/shared-editable Sites; no
universal completion claim is made.

Cloud access preflight: no AWS CLI/profile/environment credential is available;
AWS Console shows Site Unavailable before a login form, making auth state unknown.
GoDaddy redirects to sign-in; its available connector has no DNS management.
Cloudflare connector discovery returned no eligible integration. Its dashboard
login page shows a verification error and disabled Sign in; a supported manual
handoff is being assessed. No new credential or persistent grant
has been created, and none is implied by this source publication.

Next: complete the Rillora-only hosting inventory, obtain working authorized
provider access, prepare and verify the provider-neutral legal artifact, then
perform only approved public-host changes with rollback and independent DNS/TLS/
route/content/click acceptance. The original hosting block remains unresolved.

A fresh October 8 anonymous legal-root request returned Cloudflare HTTP 403/error
1010 while the known AWS public roots returned 200. This is a client-specific edge
rejection, not a browser redirect or proof of universal failure. No alternate-path
probe was used to bypass that rejection. Only the new guard/report and aggregate
counts are included; denied detailed logs and shared-document payloads are omitted.
