# Public landing and complete browser identity

Role: scoped public-website design and interaction contract
Status: FIRST ITERATION DEPLOYED; OWNER REQUESTS A CONTINUOUS, RICHER SECOND ITERATION
Last updated: 2026-09-28 (Asia/Hong_Kong)

## Owner direction and scope

Latest same-day feedback supersedes the first iteration's composition: the sections
feel disconnected and the content is too sparse. Build a coherent continuous
product story with more useful interactive content and motion. Specific provider
operation guides belong after sign-in; remove public step-by-step access while
preserving authenticated contextual guidance and Free access. Keep the explicitly
chosen Preview account destination. Video is optional; current Sora API credentials
are not configured, so do not create another paid account or block the revision.
An actual product-animation recording may be produced with existing local tools;
never call such a recording Sora-generated footage.

Owner reports a browser icon differing from the approved Logo, asks for the Web
address, then explicitly requests a carefully designed public landing page with a
top-right account entry, commercially usable components and purposeful animation.
Owner chooses the existing test app as the current Sign in destination with a
visible Preview label. Preserve authenticated App UI and production identity and
billing gates; this is an explicit public-site redesign, not a whole-App redesign.

The current testing destination is https://app.staging.rillora.xyz/account;
received invitations use https://app.staging.rillora.xyz/invite. The public website
remains https://www.rillora.xyz and the still-closed production app remains
https://app.rillora.xyz. One shared public-entry configuration controls future
switching; never silently label a test purchase or identity as production.

The complete ten-path identity03 geometry is now required in browser icons too.
This supersedes the favicon-only micro exception. Export deterministically from
the existing SVG mother artwork; retain historical concept boards unchanged.

## Selected implementation target

The references below are the HISTORICAL first iteration, already deployed. They
remain evidence of the first attempt, not authority against the latest feedback.

Agent selects a coordinated three-section ImageGen target under the Owner's
authorized redesign; this is not an invented separate Owner approval ceremony.
[Hero](../assets/concepts/rillora-landing-20260928/hero-concept.png),
[sharing](../assets/concepts/rillora-landing-20260928/sharing-concept.png),
[guidance/footer](../assets/concepts/rillora-landing-20260928/guidance-concept.png).
The generated standalone photographs are stored alongside the concepts; compressed
production derivatives live in `apps/web/src/assets/landing/`.

Tokens: paper#F5F1E8, forest#23473D, bronze#BD9473; Source Serif4 display and Inter
controls. Desktop gutters64–72px, maximum content1400px, section spacing80–120px.
Only the demonstration's shared-information sheet uses a paper panel; guides are
open ruled rows. Do not convert the page into repeated cards or paragraphs.

Allowed first-viewport copy: Rillora, How it works, Guides, Preview, Sign in,
Leave less / for them to / figure out., A private map of your important things,
shared with the people you choose., See how it works, Received an invitation?,
01 Organise,02 Choose,03 Share. Preview is the Owner's explicit addition to the
generated concept. Actual headings and controls are HTML, not flattened screenshots.

## Composition and working interaction

1. A warm-paper hero uses the generated forest-cloth folio still life with empty
   left space for the large headline. Keep natural lighting without a color wash.
   A small pointer/scroll shift belongs to artwork, never text or the brand shape.
   Header Sign in and received-invitation entry use the selected Preview host.
2. A forest section demonstrates owner-controlled sharing. Selecting Mum or Alex
   updates only illustrative permitted rows; rows expand meaningful sample details
   and unmount immediately when the recipient changes. Three stage controls explain adding,
   choosing and sending. No live data, token, invitation or recipient is created.
3. A warm-paper guidance section links directly into the existing Apple, Google
   and Coinbase guides. Two keyboard-accessible FAQ disclosures remain short.
   A forest closing band links to the Preview app; the footer provides legal and
   support routes plus a concise test-environment/sample-information notice.

Implementation primitives: pinned MIT Motion13.4.4 for restrained reveal/state/
parallax, pinned MIT Radix Accordion1.2.20 for keyboard-safe disclosure, existing
MIT Phosphor icons and OFL fonts. Keep actual copyright and license notices in the
shipped credit asset. No paid Motion+ components or unreviewed Figma assets.

## Intentional concept corrections

- Keep one header at the page top; the mid/closing concept's repeated header is a
  section-presentation artifact.
- The recipient projection must not reveal the title of an unshared matter. The
  generated Crypto/Not shared row is replaced by permitted-only rows and a count.
- Use functional initial avatars and the exact approved vector mark, avoiding a
  fabricated real person's identity and the generated cover's extra slogan/logo.
- Reuse the existing approved provider-mark component; generated Google/Apple
  glyphs do not override the actual brand-use register.
- Omit the generated handwritten slogan; it is not requested product copy.
- No always-looping glow or progress simulation. Motion responds to scroll and
  selection and becomes a stable, complete layout with reduced motion.
- The closing band reuses the approved brand artwork instead of inventing new
  contour art. Short laptop viewports use compact hero spacing so the primary
  action stays visible; mobile uses flowing media and an edge mask, not fixed
  image offsets that can collide with larger text.

## Verification required before handoff

Inspect desktop and narrow mobile, keyboard navigation, recipient/stage updates,
FAQ expansion, actual Preview sign-in/invitation/guide links, reduced motion,
asset failures and CSP/console errors. Compare stored concepts with rendered
screenshots through view_image, recording at least five concrete fidelity points.
Check original authenticated surfaces are unaffected. Verify deployed HTML points
at the full-geometry hashed favicon, including PNG fallback and hosted login.
Local tests/builds are not deployment or successful real registration evidence.

## Current verification

98Web tests pass, including permitted-only example projection and the explicitly
chosen Preview destinations. Legal build/7legal artifact checks pass. The initial
all-tests run had3legal-artifact failures because the directory held an internal
App build; rebuilding the correct legal target resolved them without weakening
assertions. Rendering was checked in Chrome at the three concept native sizes,
390px mobile and reduced motion; keyboard FAQ and sample detail expansion work.
The first desktop guidance link lazy-loads the actual existing provider directory.

WWW is published through its existing CloudFront stack. Actual Preview navigation
reaches staging/account and staging/invite, and Coinbase opens the original guide.
Current account/API/unknown metadata paths remain refused; no first-party console
error was observed. Staging and closed production client favicon updates are
verified, legalSites7succeeds, and Auth0's favicon-only patch is read back with all
other branding fields preserved. The Free-plan custom template is not applied.

The public site and favicon releases do not deploy the pending API migrations or
change production customer access, prices, private data or native UI. Exact final
asset/HTML/source/CI evidence is tracked in the current handoff and
[fidelity ledger](../output/qa/rillora-launch-goal-20260926/landing-fidelity-ledger.json).
