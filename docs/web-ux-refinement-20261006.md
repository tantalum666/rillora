# Web navigation, language, identity and provider review

Status: SOURCE AND CLOUD BROWSER ACCEPTANCE VERIFIED; NOT DEPLOYED
Last updated: 2026-10-06 (UTC)

The Owner requested cloud-only fixes and a careful related-system review after
reporting left-biased website navigation, an English-only App experience, missing
current-account identity, and indistinguishable provider icons. Publication is to an
independent Git branch; merge, deployment, Auth0 configuration and store release are
not part of this task.

## Verified findings and changes

1. The website header centered navigation inside leftover space between unequal
   logo/actions. Equal outside grid tracks now place the desktop navigation on the
   viewport center. Account, language and appearance controls form one right-side
   group; narrower widths use the existing accessible menu before collisions.
2. Chinese catalogs already exist. Explicit choices were removed from the URL even
   when storage failed, and full-page auth returns omitted the language. Preserve
   unsupported-storage choices in the URL, carry explicit language through login,
   and carry automatic website language as a nonpersistent `langHint` only when
   the App has no explicit choice. Explicit `lang` still wins, then saved choice,
   safe hint, browser language and English. No new storage key or provider locale
   setting is added. Account settings now contains a discoverable language control.
3. The private workspace showed session controls without a clear current identity.
   A visible summary and Account panel now display the current verified email when
   available, account name and full Rillora account ID. The [shared additive API](account-identity-display-20261006.md)
   stays independent of workspace loading. Clients bind its account ID to the active
   session, discard stale requests, clear on expired/switched sessions, and keep it
   memory-only. Old-server404 and provider failures have honest name/ID fallbacks.
4. Web and iOS already contain the same six adopted graphic marks. Web substituted
   one BookOpen icon for all other providers, while native uses catalog-specific
   system symbols. Web now has18 distinct neutral symbol/initial identifiers and
   an image-error fallback. The same six original assets remain; no unreviewed logo,
   third-party icon service or private-domain lookup was added. White marks retain
   dark backing in light mode; SVG proportions and clear space stay intact.
5. Reviewing every provider route found an additional navigation defect: the Web
   route regex rejected underscores, dropping `password_manager` and `binance_us`
   after reload/Back. It now uses the exact existing provider allowlist. Every
   catalog identifier has a round-trip regression. No provider instructions or
   matching rules are changed on this Web branch.

6. Actual runner screenshots exposed cramped long provider summaries and a browser
   default border on the new account summary. Provider rows now have explicit
   vertical padding; account controls use the existing visual treatment and one
   identity heading. Expired private API responses also invalidate stale account
   UI immediately, while public sign-in failures do not erase an active workspace.

## Live deployment observation, distinct from source fixes

Anonymous HTML/bundle reads on October6 return200 for `www.rillora.xyz` and
`app.rillora.xyz`. Both accessible bundles contain the existing Chinese UI/storage
support. The live website bundle resolves its account destination to
`https://app.staging.rillora.xyz`; this agrees with the intentionally Preview-labelled
source configuration. This cloud route cannot read staging: its network tunnel
returns403. Therefore a stale English-only staging deployment is a plausible but
**unverified** explanation of the Owner's exact session. Do not claim a confirmed
missing translation catalog or change the Preview destination to bypass release
scope. Deployment must verify the artifact on the actual linked App origin.

## Review and verification boundaries

[QA coverage and results](qa/web-ux-refinement-20261006/README.md) separates source,
unit/build, synthetic browser and live observations. The shared API foundation
`8cc5e10042d5c9f3688b1093306b2e4377a92c82` passes
[CI62](https://github.com/tantalum666/rillora/actions/runs/37495149572), including
full API/database integration. The local cloud browser fails before navigation on
socket EPERM; it is not visual evidence. A browser-capable GitHub runner executes
only the compiled branch and synthetic fixtures, with no real account or API writes.

The final20/20 passing matrix onf95a1c23 covers all seven public routes in both languages at320/390/1280/
1440/1920 widths; menu/Escape/focus, eleven workspace destinations, every provider
and its failure fallback, language handoff/auth-return/reload and account mismatch.
This is broader than checking only the reported rows, but is not a claim of exhaustive
real-provider, payment, accessibility or all-browser acceptance. Official provider
instruction bodies and accepted English legal text intentionally remain English.

The native branch owns shared handoff/decision/journey and provider-link updates.
It and the Web branch share the one API foundation, avoiding duplicated backend
patches. The later operator commit08afb382 changes native commerce/docs, not these
Web/API files; integration must preserve its work and merge the two client diffs.


Final code and CI: [source](https://github.com/tantalum666/rillora/commit/f95a1c23ba702bffe1955a66386d50d582fe579a),
[source verification](https://github.com/tantalum666/rillora/actions/runs/37501697399),
[actual cloud browser](https://github.com/tantalum666/rillora/actions/runs/37501697429).
The QA page includes preserved synthetic screenshots and per-scenario evidence.
