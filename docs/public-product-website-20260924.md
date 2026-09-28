# Public product website

Role: public-entry implementation and publication boundary

Status: DESIGNED PUBLIC LANDING WITH OWNER-SELECTED PREVIEW ACCOUNT GATEWAY

Last updated: 2026-09-28 (Asia/Hong_Kong)

## September28 latest navigation, system-theme and legal placement

Owner's later screenshot correction supersedes the long serial V2 composition.
The public website now uses Product/Security/Pricing/Support subpages, automatic
paper/ink-green system themes, a centered proportional cover symbol and useful
manual interactions. The walkthrough/timers/chapter rails are removed. Legal
information includes a normal third-party notices page; the terms-site footer
links there while accepted documents/versions remain unchanged.

The edge allowlist now includes `/product`, `/security`, `/pricing`, `/legal` and
`/legal/licenses`, plus Home/Support. Old guides still redirect through the fixed
Preview account gateway. CSP, private origin, refusal of private/unknown/write
requests and customer activation boundaries are retained.
[Current contract](landing-page-20260928.md).

## HISTORICAL — September28 second iteration

## September28 continuous landing and signed-in guides

Owner chooses the staging app for top-right Preview / Sign in, then requests a
continuous richer landing and moves specific provider guidance after sign-in.
The current paper/forest design adds interactive matter categories, a finite
walkthrough, permitted-only sharing, life situations, control disclosures, explicit
plan-review comparison and FAQ. Support shares its header/background/footer.

Account and invitation destinations use `config/public-entry.json`. WWW has no
account form or API. `/guides` and `/guides/` now302to the account gateway, retaining
only a known catalog ID. Only `/` and `/support` serve the public HTML; existing
asset allowlist, CSP and rejection of unknown/private/write routes remain. The
public bundle includes guide IDs only; authenticated content is unchanged.
[Current target and checks](landing-page-20260928.md). Current live readback is in
[handoff](handoff.md), not inferred from the build.

## Historical September24 establishment

The following records the original public website, DNS and monitoring checkpoint.
The old public-guide availability, no-account-entry composition and Graphite public
layout are superseded above; infrastructure isolation/transport evidence remains.

## Purpose

The production identity/email work needs a real public product homepage. Reuse the
approved Graphite/Prepared Folio experience and Legacy Imprint03 rather than redesign
the App. `www.rillora.xyz` is the independent public information host; the future
authenticated product remains `app.rillora.xyz`. The root GoDaddy Coming Soon
configuration is handled separately from the www publication.

Public content contains the existing interactive map, matter categories,18existing
account inheritance guides and real support/privacy/security contact links. It
states that accounts are not open. The public build has no account form, API client,
payment, consent collection, customer file upload, cookie notice storage or tracking.
Current legal documents are linked at their existing `legal.rillora.xyz` URLs.

## Shared code and publication guard

Extract `PublicHome` as a shared component. The authenticated-product public entry
still supplies its original `onStart` behavior; only the separate public website
omits account creation and links to related guides. Guide data, marks, permissions,
wording and the App layout remain unchanged.

`npm run build:public` uses a separate entry/output directory and ignores environment
files. Its checked manifest/hash distinguishes it from an internal/private App build.
`RilloraPublicWeb` accepts only that artifact. S3 is private, TLS-only and versioned;
CloudFront OAC is its only viewer path. Old object versions expire after30days and
the bucket is retained. The one named public hostname uses a non-exportable ACM
certificate in the required us-east-1 region. This is a public content resource,
not relocation of private Frankfurt customer data.

The edge router permits only `/`, `/guides`, `/support` and fixed asset paths;
account, invitation, API, unknown and write paths cannot fall through to a private
App. CSP denies network connections, forms, objects and embedding; fonts, scripts
and images are first-party. No analytics product or long-term hosting commitment
is added. Hosting providers still process ordinary network requests; this is not
a claim of zero provider telemetry.

## Verification

The flow is home → interactive map selection → guide search → Binance steps →
All platforms with retained search → home/support. Actual Chrome rendering under
the final CSP has been checked at desktop and390px; the guide is readable and home
document width equals the viewport. App console errors were absent; the existing
MetaMask extension emitted its own warnings, which are not attributed to Rillora.
Four public entry/router checks and five existing guide checks pass. Infra tests
cover private origin, no API/database/secrets, public-artifact rejection and the
certificate region. The full36infra suite passes with bounded worker concurrency;
the first unbounded concurrent run timed out at5seconds while other builds ran,
not on a failed resource assertion.

Before changing `www`, verify the deployed CloudFront artifact/headers/negative
routes over HTTPS. Then replace only that CNAME with an exact-zone before/after
comparison and independent DNS/readback. Root redirection, Google publication,
SES production approval and end-user authentication/delivery remain separate gates.
Live status belongs in[handoff](handoff.md) and[QA](../output/qa/rillora-production-identity-20260924/).

## Actual publication result

RilloraPublicWeb is CREATE_COMPLETE. DistributionE1H3EWWIZNTZDO serves the exact
accepted HTML digest; the public routes return200, private/unknown routes404 and
writes403, with no Set-Cookie. The non-exportablewww certificate isISSUED.
`www.rillora.xyz` now points to the verified CloudFront distribution; CLI, both
authoritative servers and1.1.1.1/8.8.8.8 agree. Actual custom-host HTTPS and Chrome
render the intended page. All26non-www records match the pre-change snapshot.

The oldwww record could not be replaced through the CLI, and remained intact.
The GoDaddy edit UI applied it successfully. A bounded CNAME replacement guard
was separately verified with a temporary record and complete cleanup; this does
not claim the provider's legacy record limitation is solved.

Root-domain forwarding to `https://www.rillora.xyz/` is now saved as302 during
prelaunch, without masking or a nameserver change. Only the oldrootA changes to
GoDaddy's two forwarding addresses; all other records match. ActualHTTP302 passes.
At the initial September24 check, RootHTTPS did not pass while GoDaddy reported
that forwarding certificate activation could take hours. This initial result is
superseded by the verified September25 browser and monitor result below; no TLS
bypass was used. The verifiedwww address remains the canonical homepage.

Bothwww health and its private-route refusal join the deployed monitor:12public
targets, actual Lambda invocationok/failed0. Existing alert delivery/heartbeat
proof remains its dated checkpoint; no new end-user subscription or App release.


## September25 root HTTPS resolution

Chrome now follows `https://rillora.xyz/` to the correct renderedwww page without
any security-interstitial bypass. The actual Node/OpenSSL3 monitor request also
gets302with a verified TLS1.3 peer. Earlier Python LibreSSL2.8.3 rejected the TLS
protocol; an earlier plain Node request negotiated TLS but returned403. Retain those
raw results as client/time-specific differences, not proof of a missing certificate
or a diagnosed proxy/bot issue. Root browsing and the current monitor-client check
pass; universal legacy-client compatibility is not claimed. The GoDaddy rootA
change preserves every unrelated record, and the anonymous S3 object returns403
with actual BlockPublicAccess/versioning/encryption readback.
