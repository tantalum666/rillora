# Product Decision Log

Role: append-only approval, rejection and supersession record  
Authority scope: explicit product and process decisions  
Superseded by: later entries in this file  
Do not use for: treating casual feedback as global approval  
Status: ACTIVE  
Last updated: 2026-10-23 (Asia/Hong_Kong)

新条目使用以下模板：

```md
## YYYY-MM-DD — Short decision name

- Status: LOCKED | PROVISIONAL | DEPRECATED
- Scope:
- Decision:
- Evidence:
- Supersedes:
- Does not imply:
- Implementation impact:
```

## 2026-08-04 — Global product ambition

- Status: LOCKED
- Scope: product market vision.
- Decision: do not limit the product to China; design the product, data model and research program for global users.
- Evidence: Owner explicit instruction.
- Supersedes: any China-only framing.
- Does not imply: simultaneous legal launch in every country or a globally valid electronic will.
- Implementation impact: separate common product core from jurisdiction and provider rules.

## 2026-08-04 — Product-led MVP validation

- Status: LOCKED
- Scope: market discovery method.
- Decision: validate the market through a usable MVP and observed product behavior instead of choosing the audience only from interviews or intuition.
- Evidence: Owner explicit instruction.
- Supersedes: an interview-only validation sequence.
- Does not imply: building the complete production, legal and automated release system before testing.
- Implementation impact: instrument completion, invitation, acceptance, simulation, export and payment behavior in the first build.

## 2026-08-04 — Web and iOS in the same MVP wave

- Status: LOCKED
- Scope: first product surfaces.
- Decision: develop Web and iOS together rather than treating iOS as a later port.
- Evidence: Owner explicit instruction.
- Supersedes: Web-only validation recommendation.
- Does not imply: identical layouts, shared UI code or forced App installation for recipients.
- Implementation impact: both clients share one domain/API contract and must complete the core path before external market validation.

## 2026-08-04 — Markdown authority system

- Status: LOCKED
- Scope: project memory, constraints and handoff.
- Decision: establish a compact Markdown authority system modeled on the useful FanPass pattern: one canonical entry, focused contracts, append-only decisions, current handoff and ongoing journey.
- Evidence: Owner explicit instruction and prior FanPass context-drift lessons.
- Supersedes: relying on chat history as the project source of truth.
- Does not imply: every research note or concept becomes authoritative.
- Implementation impact: every meaningful workstream must update the relevant contract, handoff and journey.

## 2026-08-04 — Map, not passwords

- Status: LOCKED
- Scope: first product data boundary.
- Decision: store existence, location, intention and role information; do not store bank passwords, full seed phrases or direct-transfer secrets in the MVP.
- Evidence: platform rules, legal boundaries and the catastrophic impact of credential compromise.
- Supersedes: a general-purpose death-triggered password vault as the first product.
- Does not imply: credentials can never be supported through audited integrations or external password managers.
- Implementation impact: data model, copy and onboarding must distinguish account discovery from account access.

## 2026-08-04 — Initial audience remains behavior-selected

- Status: PROVISIONAL
- Scope: first paying segment.
- Decision: recruit several high-complexity/ high-responsibility cohorts and let completion, contact invitation, simulation and payment behavior identify the first market.
- Evidence: insufficient public evidence to select a global young-adult segment confidently.
- Supersedes: defining the audience only by age.
- Does not imply: all groups receive equal marketing investment after evidence appears.
- Implementation impact: capture motivation and complexity safely in onboarding and analytics.

## 2026-08-04 — Calm Continuity selected

- Status: LOCKED
- Scope: first Web and iOS product/visual direction.
- Decision: build direction 1, Calm Continuity, using the first displayed generated result as the canonical visual source.
- Evidence: Owner selected `1`; source file is `assets/concepts/visual-directions-20260804/01-calm-continuity.png`.
- Supersedes: directions 2 and 3 as active implementation targets; they remain historical concept evidence.
- Does not imply: final brand name, pixel-perfect generated copy, production backend, legal validity, security certification or market validation.
- Implementation impact: create `DESIGN.md`, implement matching interactive Web and iOS product surfaces, and verify both against the selected source before handoff.

## 2026-08-04 — Backend before external testing

- Status: LOCKED
- Scope: current execution sequence.
- Decision: keep the approved Calm Continuity visual direction, defer external testing for now and build the shared backend foundation before expanding market validation.
- Evidence: Owner reported no material issue in the current experience and explicitly asked to complete backend work first.
- Supersedes: the prior handoff gate requiring another Owner prototype review before any backend work.
- Does not imply: external validation is unnecessary or the current prototype/backend is production-ready.
- Implementation impact: create the repository threat model, PostgreSQL schema/migrations, versioned API, audit and local security/integration evidence without changing the approved visual direction.

## 2026-08-04 — No blockchain in the core MVP

- Status: LOCKED
- Scope: MVP storage, identity, claim and release architecture.
- Decision: do not put plans, contacts, intent, documents, ciphertext, linkable hashes, identities, claims, keys or release logic on a blockchain; use a mutable off-chain system of record.
- Evidence: the product requires correction, revocation, deletion, appeals and regional control; final EDPB guidance, NIST privacy research and public-chain technical properties show structural conflict, while blockchain does not solve death or legal-authority verification.
- Supersedes: any assumption that Web3 or a smart contract is required to make the product trustworthy.
- Does not imply: cryptographic integrity proofs are forbidden forever.
- Implementation impact: PostgreSQL remains authoritative. A future batched, non-linkable integrity anchor is research-only and requires necessity analysis, DPIA, legal and independent cryptographic review.

## 2026-08-04 — MVP backend stack and fail-closed capability boundary

- Status: LOCKED
- Scope: first shared backend foundation.
- Decision: use a TypeScript/Express 5 API and PostgreSQL with server-derived tenant context, forced RLS, least-privilege roles, optimistic versions and append-only application audit events.
- Evidence: the stack supports the required mutable global data model, local verification and future regional deployment without introducing wallet or chain dependencies.
- Supersedes: the previously unselected shared backend stack.
- Does not imply: production identity issuance, KMS encryption, attachments, real invitations, real claims, real release or independent audit is complete.
- Implementation impact: production startup rejects development authentication; capability metadata explicitly reports unavailable sensitive functions; clients must integrate through the versioned API before real-data testing.

## 2026-08-05 — First production identity and data-region candidate

- Status: PROVISIONAL
- Scope: production identity boundary, account recovery direction and first application-data region.
- Decision: implement against standard OIDC Authorization Code + PKCE with Auth0 EU as the first identity candidate, and use AWS Frankfurt `eu-central-1` as the first business-data-region candidate for PostgreSQL/RDS, S3 and regional KMS.
- Evidence: Auth0 documents EU tenant regions, passkeys, OIDC PKCE, sessions and native iOS integration; AWS documents Frankfurt service availability, regional S3 behavior and KMS/envelope-encryption controls.
- Supersedes: the fully unselected provider/region item; provider and region remain provisional until live tenancy, contracts and assurance tests exist.
- Does not imply: a live Auth0/AWS account, completed passkey recovery, data-residency compliance, KMS encryption, deployment or vendor lock-in.
- Implementation impact: API stores only OIDC `issuer + subject`, issues its own opaque session, never persists provider access/refresh tokens, fails closed without production OIDC configuration, and reports `eu-central-1` as the local candidate region.

## 2026-08-05 — Web core state moves to the shared API

- Status: LOCKED
- Scope: current Web implementation and evidence boundary.
- Decision: replace fixture-only Web state with same-origin API reads/writes for session, plan, matters, trusted contacts, official checks, readiness and audit activity; keep local development identity explicit and non-production.
- Evidence: API client/build tests and browser verification show mutation persistence after reload, with the approved initial fixture restored afterward.
- Supersedes: the Web prototype's local-only state as the active implementation path.
- Does not imply: production identity, real invitations, native iOS API parity, external testing or production deployment.
- Implementation impact: Web uses `/api` as a BFF-style same-origin boundary, sends CSRF only on state changes, stores no auth token in browser storage and shows connection failures rather than fabricating data.

## 2026-08-06 — Retain Rillora while opening a new naming round

- Status: LOCKED
- Scope: brand candidate routing, not final brand approval.
- Decision: keep `Rillora` on the active shortlist while generating and pre-clearing several additional single-word water/wood candidates.
- Evidence: Owner explicit instruction: “Rillora先保留，再想几个并且清查一遍”.
- Supersedes: the prior binary handoff that required either advancing only `Rillora` or discarding the whole batch before generating more names.
- Does not imply: `Rillora` is the final name, its one-letter App/trademark and occupied `.com` risks are accepted, any candidate is legally cleared, or a domain/mark/logo may be purchased or finalized.
- Implementation impact: development remains paused; all retained and new names are compared under the same trademark, product/App and domain evidence standard before logo equity is created.

## 2026-08-06 — Rillora selected as the product brand

- Status: LOCKED
- Scope: official global master brand name for the product, Web and iOS.
- Decision: the product brand is `Rillora`, with exact capitalization `Rillora`; all other English naming candidates are closed and retained only as research history.
- Evidence: Owner explicit instruction: “确认Rillora为品牌名”.
- Supersedes: the same-day decision that retained `Rillora` only as a candidate, all active candidate rankings and the unnamed product state.
- Does not imply: trademark registration or legal clearance, ownership of `rillora.com`, acceptance of the one-letter `Rilora` collision, a selected Chinese name, final Logo, tagline, domain purchase, public launch or resumed development.
- Implementation impact: canonical documentation and future product/brand work use `Rillora`; formal similarity clearance remains a launch and final-identity gate, while Chinese naming and Logo exploration stay open.

## 2026-08-06 — Reopen Logo concept space beyond the letter R

- Status: LOCKED
- Scope: Rillora Logo exploration method and concept range, not final identity approval.
- Decision: do not require the Logo or app symbol to use the English letter `R`; reject all visual directions shown so far as final candidates and restart from a research-led symbol and identity process.
- Evidence: Owner rejected the displayed rounds as insufficiently premium and explicitly stated “不一定要英文字母R做logo”, then requested global research into professional Logo design methods.
- Supersedes: the working assumption that a black-and-white `R` lettermark or wordmark-derived app glyph should lead the exploration.
- Does not imply: the letter `R` is prohibited, a non-letter symbol has been selected, a new visual direction is approved, the mark is legally clear or development may resume.
- Implementation impact: audit adjacent-category marks, create a broad black-thumbnail concept matrix, compare letter/non-letter/combination systems equally, and test small-size and visual distinctiveness before polished presentation.

## 2026-08-06 — Advance three Logo directions to Owner review

- Status: PROVISIONAL
- Scope: discovery-stage Rillora symbol shortlist, not final identity approval.
- Decision: advance `Relay Seam`, `Proof Trace` and `Open Threshold` from the 40-sketch matrix; recommend `Relay Seam` as the strongest current direction.
- Evidence: adjacent-category visual crowding map, eight-family/40-thumbnail matrix, six-candidate comparison and 64/32/24/16px, reverse, app-tile and horizontal-lockup tests in the editable Figma file; detailed lineage is recorded in `docs/logo-discovery.md`.
- Supersedes: the open execution step that still required the crowding map and 40 sketches. It does not supersede the Owner's rejection of earlier generated Logo boards.
- Does not imply: Owner selection, final vector geometry, final wordmark typography, trademark clearance, production export, public release or permission to resume development.
- Implementation impact: pause further Logo expansion until the Owner selects `1`, `2`, `3` or rejects all three. Product development remains paused.

## 2026-08-07 — Reject the Figma geometric Logo round

- Status: LOCKED
- Scope: `Relay Seam`, `Proof Trace`, `Open Threshold` and their primitive-based construction method.
- Decision: reject all three marks; do not refine, vector-polish or reuse them as the basis of the Rillora identity.
- Evidence: Owner asked whether the marks were hand drawn and judged them “太丑了”; the implementation was confirmed to be programmatic Figma primitive assembly rather than professional free-form drawing.
- Supersedes: the provisional decision to advance those three directions and recommend `Relay Seam`.
- Does not imply: approval of any replacement image-generated mark, abandonment of the `Rillora` brand name, permission to resume development or trademark clearance.
- Implementation impact: use free-form visual ideation before vectorization; the first replacement set contains three standalone raster symbols awaiting Owner feedback. Figma construction remains paused until a visual target is chosen.

## 2026-08-07 — Reject the free-form image-generated symbol round

- Status: LOCKED
- Scope: the three standalone black raster symbols in `output/imagegen/rillora-symbol-option-1.png` through `rillora-symbol-option-3.png`.
- Decision: reject all three; do not refine, vectorize or reuse them as the basis of the Rillora identity.
- Evidence: Owner judged the replacement round “还是太丑了” and requested a deeper review of how strong company Logos are actually designed.
- Supersedes: the open feedback gate for the free-form symbol round and the expectation that changing from Figma primitives to image generation would produce a viable symbol direction.
- Does not imply: approval of a wordmark, final typography, abandonment of `Rillora`, trademark clearance or permission to resume product development.
- Implementation impact: stop standalone-symbol generation. Case research supports a provisional wordmark-first process in which exact `Rillora` lettering is evaluated in real contexts before any app symbol is derived; Owner approval is still required.

## 2026-08-07 — Keep the graphic-mark category open

- Status: LOCKED
- Scope: interpretation of Owner rejection across Logo categories.
- Decision: the Owner rejected the displayed graphic marks because their visual execution was ugly; this does not reject graphic marks as a category. The standalone `R` route remains rejected, while non-letter graphic marks remain valid.
- Evidence: Owner explicit correction: “图形标是因为你设计的太丑了所以我才否决”.
- Supersedes: the inference that two rejected symbol rounds justified a mandatory wordmark-first route.
- Does not imply: approval of any prior mark, permission to disguise an `R`, selection of a combination mark, final identity approval or trademark clearance.
- Implementation impact: evaluate future directions as complete systems containing a non-letter graphic mark, the full `Rillora` name and real product applications; judge each execution on its own quality.

## 2026-08-07 — Present three complete identity directions

- Status: PROVISIONAL
- Scope: the three identity boards displayed after the graphic-mark clarification.
- Decision: advance all three generated complete-system concepts to Owner review without a design-team recommendation.
- Evidence: each board shows a non-letter graphic mark, exact `Rillora` name, App-icon behavior and Web/iOS/document applications; files and visible-order mapping are recorded in `docs/logo-discovery.md`.
- Supersedes: the open execution step that still required the corrected complete-system round to be created.
- Does not imply: Owner approval, final vector geometry, final typography, trademark clearance, production export, public launch or permission to resume development.
- Implementation impact: stop expansion and wait for the Owner to choose `1 / 2 / 3`, request a focused combination/revision or reject the round.

## 2026-08-07 — Reject all three complete identity directions

- Status: LOCKED
- Scope: `rillora-identity-round-20260807-a.png`, `-b.png` and `-c.png`.
- Decision: reject all three; do not refine, combine, vectorize or reuse them as the basis of the Rillora identity.
- Evidence: Owner explicit instruction: “全部否决”.
- Supersedes: the provisional decision that advanced the three complete identity boards to Owner review.
- Does not imply: rejection of graphic marks as a category, reopening of the standalone `R` route, abandonment of `Rillora`, trademark clearance or permission to resume product development.
- Implementation impact: stop visual generation until the Owner's aesthetic target is calibrated against real high-quality identity references; preserve the rejected boards only as failure evidence.

## 2026-08-07 — Select Logo aesthetic coordinates

- Status: LOCKED
- Scope: visual calibration for the next Rillora non-letter graphic-mark round, not final Logo selection.
- Decision: use `Apple / Mastercard / Chase / Polestar` as aesthetic coordinates for compact silhouette, disciplined construction, structural negative space and restrained visual tension.
- Evidence: Owner submitted the exact selection through the real-logo calibration board.
- Supersedes: the open calibration gate that still required the Owner to choose two to four reference marks.
- Does not imply: permission to copy, combine or trace any selected mark; preference for fruit, overlapping circles, rotating wedges, stars, a final Rillora shape, trademark clearance or resumed development.
- Implementation impact: translate the selection into explicit non-copying form boundaries before generating the next three concepts; the allowed territories are single mass/controlled cut, two masses/emergent space and balanced convergence.

## 2026-08-07 — Approve the next non-letter mark boundaries

- Status: LOCKED
- Scope: the ten design boundaries and three structural territories in `docs/logo-discovery.md`.
- Decision: approve the boundaries and authorize exactly three new Rillora graphic-mark concepts, one per structural territory.
- Evidence: Owner explicit response: “通过”.
- Supersedes: the gate that required Owner confirmation before a new Logo generation round.
- Does not imply: approval of any generated result, permission to imitate selected reference marks, final vector geometry, trademark clearance, finished identity work, public launch or resumed development.
- Implementation impact: generate and display one single-mass/controlled-cut mark, one two-mass/emergent-space mark and one balanced-convergence mark; wait for Owner feedback before refinement.

## 2026-08-07 — Present three calibrated non-letter mark concepts

- Status: PROVISIONAL
- Scope: the three bounded raster concept proofs displayed after approval of the aesthetic coordinates and mark boundaries.
- Decision: advance exactly the three generated concepts to Owner review in conversation display order, with no design-team recommendation.
- Evidence: each approved structural territory received one independent concept proof; the stable file mapping is recorded in `docs/logo-discovery.md`.
- Supersedes: the execution step that still required the three approved structural territories to be generated and displayed.
- Does not imply: Owner approval, final vector geometry, production small-size quality, trademark clearance, font licensing, finished identity work, public launch or permission to resume development.
- Implementation impact: stop generation and wait for the Owner to choose `1 / 2 / 3`, request focused refinement or reject the round.

## 2026-08-08 — Reject calibrated mark 1 and revise marks 2 and 3

- Status: LOCKED for rejection of mark `1`; PROVISIONAL for the two revisions.
- Scope: the first calibrated mark round and the two focused revision proofs displayed afterward.
- Decision: permanently exclude original concept `1`; keep the structural territories behind original concepts `2` and `3` open only through the newly displayed focused revisions.
- Evidence: Owner explicit feedback: “1排除，23看看能不能再调整一下”.
- Supersedes: the provisional review state in which all three calibrated concepts remained equally open.
- Does not imply: approval of either revision, permission to revive concept `1`, permission to add a fourth territory, final vector geometry, trademark clearance, finished identity work or resumed development.
- Implementation impact: preserve the new revision files and stop for Owner feedback. Current conversation order is revision `1` = original concept `2`; revision `2` = original concept `3`.

## 2026-08-08 — Reject both focused Logo revisions and restart in black and white

- Status: LOCKED for rejection; PROVISIONAL for the new reset round.
- Scope: the two focused revision proofs and the order of the next visual exploration.
- Decision: close both revised marks because the Owner remains dissatisfied; restart from fresh non-letter topologies and judge monochrome form before introducing colour.
- Evidence: Owner explicit instruction: “你再设计一下，总体来说还是不满意，可以先用黑白，设计好后再上色”.
- Supersedes: the open choice between structurally redrawing the high-risk two-block revision or formally closing the three-mass revision.
- Does not imply: approval of any newly displayed mark, permanent rejection of graphic marks, approval of colour, production vector quality, trademark clearance, finished identity work or resumed product development.
- Implementation impact: preserve the three newly displayed standalone black-and-white raster concepts in conversation order; stop for Owner shape feedback before small-size production tests, colour, wordmark/application work or new clearance.

## 2026-08-08 — Reject the black-and-white reset round

- Status: LOCKED.
- Scope: `rillora-bw-reset-round-20260808-a.png`, `-b.png` and `-c.png`.
- Decision: reject all three; do not refine, trace, combine or reuse them as Rillora Logo candidates.
- Evidence: Owner explicit feedback: “全部否决，真的很像小朋友画图”.
- Supersedes: the provisional review gate for the three reset marks.
- Does not imply: rejection of non-letter graphic marks as a category, approval of a wordmark, approval of a replacement workflow, trademark clearance or permission to resume development.
- Implementation impact: stop further raster Logo generation. Research how professional AI-assisted Logo workflows separate concepting, controlled vector generation, human reconstruction and optical testing before proposing another round.

## 2026-08-08 — Lock the AI-assisted production workflow for Logo work only

- Status: LOCKED.
- Scope: Rillora Logo concepting, AI-assisted variation, vector reconstruction, optical QA and similarity screening only; not the whole project.
- Decision: adopt `strategy -> text-only concept propositions -> proprietary skeletons -> sketch-conditioned/native-vector AI variations -> manual vector reconstruction -> optical and similarity gates -> colour and identity application`, with the mandatory gates and evidence labels in `docs/logo-ai-workflow.md`.
- Evidence: Owner explicit approval and scope correction: “通过，并且你把这份写死在一份.md文件里面，避免后面记忆错乱或者漂移” and “这个不是整个项目的要求，只是设计logo时候的要求，请注意区分”.
- Supersedes: the provisional state that awaited Owner approval of the method, and direct polished-raster Logo generation as a production route.
- Does not imply: a selected Logo, rejection of non-letter graphic marks, a general project workflow, restrictions on product/Web/iOS/backend work, trademark clearance, public launch or permission to resume development.
- Implementation impact: route future Rillora Logo work through `docs/logo-ai-workflow.md`; next submit exactly three text-only concept propositions with structural-skeleton briefs and no Logo images in that gate.

## 2026-08-08 — Present three Gate 0 Logo concept propositions

- Status: PROVISIONAL.
- Scope: Gate 0 concept-strategy evidence only, not Logo sketches or Logo candidates.
- Decision: advance exactly `The Deliberate Interval / The Next Reader / One Plan, Different Endings` as the three text-only propositions for Owner review; preserve the design-side recommendation `2 > 1 > 3` without treating it as Owner approval.
- Evidence: all four required fields and a text-only structural-skeleton brief are recorded for each proposition in `docs/logo-discovery.md`; no Logo image was generated or displayed.
- Supersedes: the execution step that still required Gate 0 propositions to be produced.
- Does not imply: approval of any proposition, permission to draw actual skeletons, an active Logo candidate, trademark clearance, finished identity work or resumed development.
- Implementation impact: wait for Owner to select one or more proposition numbers, request text revision or reject all three; only explicitly approved propositions may enter Gate 1.

## 2026-08-08 — Select The Next Reader for Gate 1

- Status: LOCKED.
- Scope: Gate 0 Rillora Logo concept proposition only, not visual execution.
- Decision: select the design-side recommendation `2 — The Next Reader / 后来者可读` as the sole concept allowed to enter Gate 1; close concepts `1 — The Deliberate Interval` and `3 — One Plan, Different Endings`.
- Evidence: Owner explicit response to the recommendation order `2 > 1 > 3`: “就按照你的推荐来”.
- Supersedes: the provisional review state in which all three Gate 0 propositions awaited Owner selection.
- Does not imply: approval of a skeleton, Logo mark, wordmark, identity system, AI-generated vector, trademark clearance, public launch or resumed development.
- Implementation impact: develop proprietary structural skeletons only for `The Next Reader`; rejected concepts may not be drawn in parallel or revived under new labels.

## 2026-08-08 — Advance Resolved Seam to Gate 1 Owner review

- Status: PROVISIONAL.
- Scope: Gate 1 structural-skeleton evidence for `The Next Reader` only, not Logo selection or visual execution approval.
- Decision: close internal hypotheses `Full boundary seam / Reoriented plane / Cadence resolve` and submit only `Resolved Seam` for Owner review.
- Evidence: the internal Figma workbench showed A as an S/yin-yang-like full split, C as a generic wave and D as network/data convergence; B alone preserved one continuous field while a single seam entered once, changed direction once and resolved internally. The owner-review page passed screenshot legibility QA after text auto-height correction.
- Supersedes: the open execution step that still required a proprietary Gate 1 skeleton to survive internal category screening.
- Does not imply: Owner approval, a Logo candidate, approval of the grey envelope, corners, line width, curvature, colour, wordmark, AI variation, trademark clearance, public launch or resumed development.
- Implementation impact: pause new skeleton expansion and all AI Logo generation until the Owner approves, modifies or rejects the `Resolved Seam` structural logic.

## 2026-08-08 — Reset Gate 1 around yin-yang feel without copying taijitu

- Status: LOCKED for the preference reset and pause of `Resolved Seam`; PROVISIONAL for the new skeleton recommendation.
- Scope: Gate 1 structural feeling for the locked `The Next Reader` concept only, not final Logo or cultural-symbol adoption.
- Decision: interpret the Owner's yin-yang preference as a compact complete silhouette, two interdependent fields, non-mechanical balance and flowing curvature; explicitly exclude dots, standard fish forms, exact halves and traditional taijitu proportions. Pause `Resolved Seam` and reopen balanced interdependence as the active Gate 1 territory.
- Evidence: Owner said “我可能更喜欢阴阳那个图标的感觉” and then approved the proposed reinterpretation with “可以”. The resulting Figma workbench compares `Dual Embrace / Offset Balance / Continuous Turn`; screenshot review makes `Offset Balance` the current design-side recommendation, retains `Dual Embrace` only as a high-similarity calibration edge and closes `Continuous Turn` for whirlpool, `G`, `@` and wave misreads.
- Supersedes: the provisional advancement of `Resolved Seam` as the sole Gate 1 review skeleton and the earlier internal assumption that any yin-yang reading was automatically disqualifying.
- Does not imply: permission to copy or adapt the taijitu, Owner approval of any new skeleton, a Logo candidate, AI variation, colour, wordmark, trademark clearance, public launch or resumed development.
- Implementation impact: wait for the Owner to accept, modify or reject `Offset Balance`, including whether it should move toward the stronger interlocking feel of `Dual Embrace`; keep all AI Logo generation paused.

## 2026-08-08 — Select Dual Embrace as the Gate 1 skeleton

- Status: LOCKED.
- Scope: Gate 1 structural skeleton for the locked `The Next Reader` concept only, not final Logo approval.
- Decision: select `01 — Dual Embrace / 双域互含` as the sole skeleton allowed to enter Gate 2; close `02 — Offset Balance` and `03 — Continuous Turn`, while keeping `Resolved Seam` paused.
- Evidence: Owner explicit response after reviewing the three-skeleton Figma board: “采用01”.
- Supersedes: the provisional design-side recommendation to advance `Offset Balance` and the state in which the yin-yang-feel Gate 1 reset awaited Owner selection.
- Does not imply: permission to copy the taijitu, approval of dots, standard fish forms, exact halves, traditional taijitu proportions, the current path as a production master, colour, wordmark, trademark clearance, public launch or resumed product development.
- Implementation impact: begin Gate 2 only from the approved complete-silhouette and dual-interdependence relationship; hold no-dot black/white topology fixed and vary only seam asymmetry and curvature rhythm in the first `6–12` editable-vector comparison.

## 2026-08-08 — Advance A4, C2 and C4 as the Gate 2 shortlist

- Status: PROVISIONAL.
- Scope: Gate 2 controlled vector evidence for the locked `Dual Embrace` skeleton, not final Logo selection.
- Decision: close seven near-equal variants at the mechanical screen, close C1 and C3 for insufficient incremental semantic value, and advance `A4 — Deep / C2 — Weighted / C4 — Maximum` to the Owner selection gate; recommend C2.
- Evidence: the deterministic generator produced 12 editable SVGs in two single-variable families plus an extended range of the same asymmetry variable. All retained two black masses at 32/64/320px. The predeclared full-size mass-balance heuristic `[0.55, 0.90)` retained `A4 / C1 / C2 / C3 / C4`; visual review then selected the three positions that best represent Gate 1 fidelity, balanced distinctiveness and maximum distinctiveness. Generator reruns produced identical SVG/JSON hashes, and 14 SVG files passed XML validation.
- Supersedes: the execution state in which Gate 2 was ready but not started.
- Does not imply: Owner approval, final path geometry, optical correction, cultural suitability, trademark clearance, a wordmark, App icon, public launch or resumed development.
- Implementation impact: stop at this brand-level gate and ask the Owner to select A4, C2 or C4, or request a focused interpolation; only the selected result may enter Gate 3 manual reconstruction.

## 2026-08-08 — Reject the Gate 2 seam shortlist and close its topology

- Status: LOCKED for rejection; PROVISIONAL for the replacement execution method.
- Scope: Rillora Logo Gate 1/2 visual execution only, not the locked brand name or product.
- Decision: reject `A4 / C2 / C4`, close all twelve variants and stop using the complete-circle plus S-shaped boundary seam as an active `Dual Embrace` skeleton. Retain `The Next Reader` as a concept proposition, but require the next work to be form-first rather than a diagram of the product relationship.
- Evidence: Owner said the three looked the same, were too monotonous and likely to collide with similar registered marks. USPTO and WIPO each maintain explicit yin-yang figurative classifications, supporting the crowding concern at the topology level. The next automatic three-territory rough was also judged “还是好丑” and failed the design-side submission threshold.
- Supersedes: the provisional advancement and recommendation of `A4 / C2 / C4`, and the prior lock of the circle/S implementation of `Dual Embrace`; it does not supersede the Logo-only AI-assisted production contract or the selected `The Next Reader` concept.
- Does not imply: rejection of non-letter graphic marks, trademark legal clearance, approval of a replacement mark, colour or wordmark approval, public launch or resumed product development.
- Implementation impact: do not refine, interpolate, recolour, re-present or use the rejected seam family. Establish a form-first creative brief and internal blind-review threshold before generating another Owner-facing mark; keep rough AI/programmatic outputs internal unless they pass.

## 2026-08-08 — Pause native raster ideation after a zero-survivor blind screen

- Status: PROVISIONAL execution decision; no Logo selection.
- Scope: the source of the next Rillora graphic-mark form, not the locked brand name, concept proposition or later AI-assisted vector variation.
- Decision: pause further native raster prompt iteration as the source of the next Owner-facing mark. Require designer-led broad sketching, selection, manual vector construction and optical correction while retaining the hard-fail and `84/100` internal gate in `docs/logo-form-brief.md`.
- Evidence: five topologically distinct families received up to two isolated generation attempts each. Every family triggered at least one hard fail; best diagnostic scores were `73 / 74 / 49 / 60 / 63`. Independent visual review confirmed repeated generic soft-block, link/fintech, `G`/Pac-Man and central-Y/module readings. No output was promoted or copied into the project candidate directory.
- Supersedes: the exact-next assumption that another controlled native-image generation wave could provide qualifying starting forms. It does not supersede the Logo-only hybrid contract or prohibit AI from later controlled variation of a designer-selected skeleton.
- Does not imply: a selected replacement direction, rejection of non-letter marks, authorization to hire or contact anyone, trademark clearance, product launch or resumed development.
- Implementation impact: stop changing prompts and do not expose the failed images. External commissioning, paid tools or communication require explicit Owner authorization; until then preserve the completed creative brief as the handoff artifact.

## 2026-08-08 — Close unconditioned Figma Agent ideation after a bounded zero-survivor test

- Status: PROVISIONAL execution decision; no Logo selection.
- Scope: use of Figma Agent as the source of a new Rillora graphic-mark form, not Figma as a vector editor or later controlled-variation environment.
- Decision: do not continue asking an unconditioned Figma Agent to invent the next Owner-facing starting form. Preserve Figma for manual reconstruction, board organization and AI assistance only after a designer-selected proprietary sketch or skeleton exists.
- Evidence: Owner authorized the test with “开始尝试”. Across an initial icon misread, a corrected F1 solid-silhouette pass and a topologically different F2 counterform pass, every result triggered at least one hard fail. Visible outputs regressed to circle-X/pencil/gem icons, bite-like blobs, a detached satellite, a speech bubble, an app/camera body and eye/donut-like voids. The editable experiment remains on Figma node `36:2`; no output was promoted, scored or exported as a candidate.
- Supersedes: the open possibility that Figma Agent alone could replace designer-led broad sketching as the next form-origin route.
- Does not imply: rejection of Figma, rejection of AI-assisted controlled variation, a selected mark, authorization for external commissioning, trademark clearance, public launch or resumed product development.
- Implementation impact: keep the manual identity-design gate unchanged. Do not run further prompt-only F1–F5 batches; wait for a human-selected sketch before returning to vector AI assistance.

## 2026-08-08 — Resume product development while deferring the Logo

- Status: LOCKED.
- Scope: project execution sequence, not final identity selection.
- Decision: resume reversible product, Web, iOS and backend development immediately. Keep the unresolved Rillora Logo as a separate paused workstream; it no longer blocks engineering.
- Evidence: Owner explicit instruction: “那先吧logo的事情放一边，继续开发工作”.
- Supersedes: the prior execution gate that paused all product development until a Logo direction was approved.
- Does not imply: Logo approval or abandonment, trademark clearance, domain acquisition, production authentication, external testing, deployment, App Store/TestFlight release or public launch.
- Implementation impact: preserve all Logo constraints and rejection history without creating new Logo output; continue from the previously recorded engineering next step by establishing a native SwiftUI client and connecting the shared API.

## 2026-08-09 — Assign AWS, Auth0 and Vercel distinct platform roles

- Status: LOCKED for platform role allocation; PROVISIONAL for exact services, sizing and cost.
- Scope: first production-shaped hosting and identity topology, not external resource creation, deployment or a data-residency certification.
- Decision: use Auth0 EU for customer identity; use AWS Frankfurt `eu-central-1` for the authenticated Rillora Web, Express API, PostgreSQL data and future reviewed encrypted storage; restrict Vercel to public content or synthetic-data previews. Do not run the production API on Vercel or route authenticated planner responses/session cookies through a Vercel project.
- Evidence: after reviewing the Vercel/AWS trade-off and the recommendation “AWS Frankfurt为核心基础设施 + Auth0 EU负责身份 + Vercel仅作为可选公开站点”, Owner explicitly replied “就按照你的建议来”.
- Supersedes: the open platform-choice question and the earlier state in which AWS Frankfurt/Auth0 EU were candidates without a decided Vercel role. It does not supersede the local implementation evidence or production-open gates.
- Does not imply: creation of an Auth0 tenant, AWS account resources, Vercel project, domain, production key or paid plan; permission to use real user data; a fixed monthly bill; data-residency compliance; deployment, external testing or public launch.
- Implementation impact: keep the existing Express/PostgreSQL architecture; plan ECS Fargate/ALB, RDS, private S3/regional KMS and least-privilege AWS identities; use AWS CDK TypeScript as the provisional IaC default; maintain a separate explicit Owner gate before each external account/resource mutation and refresh all prices before purchase.

## 2026-08-09 — Authorize Auth0 Free development provisioning only

- Status: LOCKED for the authorization boundary; live configuration still pending.
- Scope: the first external identity-development step, not hosting, payment, real-user use or production release.
- Decision: create and configure an Auth0 EU Free development tenant for Web/iOS OIDC integration, using only synthetic development identities. Do not add a payment method, accept a paid upgrade, create AWS/Vercel resources, purchase a domain or use real user data under this authorization.
- Evidence: Owner explicit instruction: “先使用free进行开发”. The first Dashboard visit reached Auth0's official login page; no tenant, application, key or other external resource was created in this step.
- Supersedes: the gate that awaited explicit permission to create/configure the Auth0 EU development tenant. It does not supersede the separate approval gates for credentials, payment, AWS, Vercel, email, KMS, domains or external testing.
- Does not imply: that Auth0 Free will satisfy production requirements, that a live EU tenant exists, that passkey/recovery controls have been verified, or that production authentication and data-residency claims are complete.
- Implementation impact: resume provisioning only after the Owner signs in to Auth0; then verify the selected region and Free plan before creation, register exact Web/iOS callbacks, and keep all secrets outside the repository and browser-visible evidence.

## 2026-08-09 — Replace the auto-created US tenant with an EU Free tenant

- Status: LOCKED for the region choice and authorized deletion; EU creation pending reauthentication.
- Scope: the empty Auth0 development tenant created during account registration, not any Rillora application or user dataset.
- Decision: permanently delete `dev-635blalpcjqzlmr0` in `US-5` and use the single Free tenant allowance for a new EU development tenant.
- Evidence: after the regional trade-off was explained, Owner replied “确认”. The deletion dialog required the exact tenant name and two irreversible-action acknowledgements; submission invalidated the tenant session and redirected to Auth0 login.
- Supersedes: the incidental US-5 tenant created by Auth0 signup and the temporary deletion-confirmation gate.
- Does not imply: that post-login tenant-list verification is complete, that an EU tenant or application already exists, that the Free trial is a production plan, or that any identity/recovery assurance has passed.
- Implementation impact: Owner must reauthenticate; then verify the US tenant is absent, create a deliberately named EU development tenant without billing, and proceed with synthetic Web/iOS OIDC integration only.

## 2026-08-09 — Use Auth0 CLI and typed local sessions for the EU development tenant

- Status: LOCKED for the development integration boundary; production assurance remains open.
- Scope: Auth0 EU Free development configuration and Web/iOS local authentication, not production identity, payment or cloud deployment.
- Decision: configure `rillora-dev.eu.auth0.com` through the official Auth0 CLI; register separate regular-Web and native-public clients plus the `urn:rillora:api` RS256 audience; use a browser Cookie/CSRF session for Web and a distinct native Bearer session for iOS. iOS may use an Auth0 API access token only to call `POST /auth/native/session`; the server must verify issuer, audience, RS256, expiry, native `azp` and `session:create`, then discard the provider token. The two local credential kinds must never be interchangeable.
- Evidence: real Web Universal Login/logout and iOS Auth0.swift system-browser Code + PKCE, API loading, process-restart Keychain recovery and logout succeeded with disposable `.invalid` identities. API 24/24 and iOS 44/44 tests passed. Auth0 CLI logs corroborated successful code exchange; both synthetic Auth0 users and their local synthetic planner rows were deleted after validation.
- Tooling boundary: the official Auth0 MCP server exists but remains Beta and was not installed in this Codex session, so the stable CLI was used. Client secrets were injected only into the local API process and were not committed; the native public client has no secret.
- Supersedes: the pending-EU-tenant and simulated-provider-only implementation state. It does not supersede the Free-only, synthetic-identity, no-payment, no-AWS/Vercel/domain authorisation boundary.
- Does not imply: passkey, fallback, recovery notification, Guardian-factor, account-takeover, production domain, Release configuration, real-device, data-residency, deployment or independent-security completion.
- Implementation impact: keep Debug Auth0 parameters separate from Release, store only the Rillora opaque native session in device-only Keychain, preserve development-adapter failure closure, and make synthetic passkey/recovery validation the next identity gate.

## 2026-08-09 — Enable development Web Passkeys and keep provider sessions separate

- Status: LOCKED for the development configuration and product-truth boundary; production recovery assurance remains open.
- Scope: the Auth0 EU Free development tenant, synthetic Web Passkey validation and Rillora local-session control; not real Apple credentials, paid Auth0 capability, production domain or full account recovery.
- Decision: use New Universal Login with Identifier First; keep password enabled while enabling Passkey button/autofill plus progressive and local enrollment. Add an authenticated `logout-all` control that revokes every active Rillora Cookie/Bearer session for the server-derived planner, but explicitly report that Auth0 identity-provider sessions were not revoked.
- Evidence: Owner authorized continuation with “开始吧”. A Chrome virtual WebAuthn authenticator completed password-first enrollment and two subsequent Passkey logins; Auth0 logged `gd_enrollment_complete` and `performed_amr: ["phr"]`. A live browser action revoked three same-planner Rillora sessions, and API tests proved another planner was unaffected. Existing and absent `.invalid` recovery addresses received the same HTTP 200 response, while the intended invalid-domain delivery failed. API 26/26, iOS 44/44, Web API-client 4/4, Web product-truth 3/3 and Sites 4/4 tests passed; builds passed.
- Cleanup: the exact synthetic Auth0 user, virtual Passkey and local planner row were permanently deleted after validation. The tenant retains the approved development Passkey configuration; no Owner Keychain, biometric, real mailbox, payment, AWS/Vercel resource or domain was used.
- Supersedes: the state in which Passkey was disabled and bulk local-session revocation was unimplemented. It does not supersede the Free-only, synthetic-identity, no-payment/no-domain authorization boundary.
- Does not imply: real recovery-email delivery or link consumption, Guardian/backup-factor verification, post-recovery freezing, Auth0-provider bulk session revocation, breached-password detection, native Apple Passkey, production Release configuration, real-device testing or complete account-takeover protection.
- Implementation impact: keep the UI/API phrase “Rillora sessions only”; do not claim global logout. Auth0 Management API user-session deletion remains unavailable on the current Free boundary, and native Passkey remains gated by a separately approved test Apple identity plus reviewed domain/Associated Domains configuration.

## 2026-08-09 — Acquire rillora.xyz and assign login.rillora.xyz to Auth0

- Status: LOCKED for domain role and current development configuration; public DNS/TLS and production identity remain open.
- Scope: the Owner-acquired `rillora.xyz`, Auth0 development custom domain and its one DNS validation record; not public launch, trademark clearance, AWS/Vercel deployment or a paid production plan.
- Decision: reserve the apex `rillora.xyz` for a future public site and use `login.rillora.xyz` as the Auth0 identity domain. Owner added an Auth0 verification card and stored a GoDaddy PAT locally; create only the Auth0-managed-certificate CNAME returned by Auth0 and do not alter the apex or unrelated DNS records.
- Evidence: Owner explicitly confirmed the domain purchase and card/PAT setup. Registry RDAP showed registration on 2026-08-09 with GoDaddy `ns73/ns74.domaincontrol.com`; GoDaddy v3 DNS read returned HTTP 200 with no existing `login`, create returned HTTP 201, and readback showed the new TTL 600 CNAME pointing to `rillora-dev-cd-k3ahlphxomlhvypl.edge.tenants.eu.auth0.com.`. The `.xyz` parent zone later published the delegation and Google/Cloudflare returned the CNAME. Auth0 created custom-domain ID `cd_k3ahlpHxoMLhVypl` but remains `pending_verification`; TLS and issuer migration are still open.
- Supersedes: the prior no-domain/no-payment-method development boundary only for this exact domain acquisition, local API credential and Auth0 card verification. It does not approve a paid Auth0 tier or any other external spend.
- Does not imply: public DNS reachability, certificate issuance, issuer/client migration, native Apple Passkey, trademark ownership, production readiness, deployment, real-user use or legal clearance.
- Security impact: the PAT value stays in macOS Keychain and outside the repository. Because Owner temporarily granted all scopes, rotate it after setup to only `domains.domain:read` and `domains.dns:update`; never reuse it as an application runtime secret. A legacy GoDaddy domain-detail response unexpectedly emitted the EPP transfer code once; its temp file was removed, the domain remains locked/privacy-enabled and transfer-ineligible until 2026-10-08, and Owner must regenerate the code through the account or official support before any future unlock/transfer.

## 2026-08-09 — Promote login.rillora.xyz to the default development issuer

- Status: LOCKED for the current Auth0 development issuer and Web validation evidence; native runtime and production Release evidence remain open.
- Scope: Auth0 EU development custom-domain verification, managed TLS, default-domain selection, Web issuer migration and iOS Debug configuration; not production deployment, real-user migration, native Passkey or public launch.
- Decision: use `https://login.rillora.xyz/` as the development OIDC issuer. Make the verified custom domain the Auth0 default, keep the canonical tenant iOS callback temporarily as a rollback path, and keep the full hostname as the narrow default Passkey RP ID instead of widening it to the apex.
- Evidence: Auth0 reported the custom domain `ready / verified`, managed Let’s Encrypt certificate `provisioned`, default and primary. HTTPS, OIDC discovery and authorize/token/JWKS/logout metadata all resolved under `login.rillora.xyz`. A disposable `.invalid` Web identity completed Universal Login, Cookie session creation, plan loading and logout with the database identity row showing issuer `https://login.rillora.xyz`; the exact Auth0 user, planner cascade and temporary Keychain entries were then deleted with zero matching identity rows remaining. iOS Debug now uses `login.rillora.xyz`; Auth0 callback/logout allowlists include the custom-domain callback, XcodeGen succeeded, 44 tests passed, and Debug install/launch plus Release simulator build passed.
- Supersedes: the immediately preceding `pending_verification` execution state. It does not erase that earlier step’s DNS and security evidence.
- Does not imply: iOS custom-domain runtime login, Apple Associated Domains, native Passkey, production Release identity, AWS/Vercel deployment, real recovery, real users, legal clearance or launch readiness.
- Security follow-up: regenerate the accidentally exposed EPP transfer code before any unlock or transfer, and replace the temporary all-scope GoDaddy PAT with a token limited to `domains.domain:read` and `domains.dns:update`. These are Owner-controlled actions and remain open.

## 2026-08-10 — Verify native Debug on the custom identity issuer

- Status: LOCKED for native Debug runtime evidence; Apple Passkey, Release and production identity remain open.
- Scope: a disposable synthetic Auth0 database identity, iPhone 17e Simulator, local API/PostgreSQL and `https://login.rillora.xyz/`; not a real Apple identity, real mailbox, physical device, Release build identity or production deployment.
- Decision: accept the narrow custom-domain native runtime gate only after the app completes system-browser Code + PKCE, provider-token exchange into a typed Rillora Bearer session, shared-API reads, process-restart recovery from device-only Keychain and explicit logout revocation under the exact custom issuer.
- Evidence: the synthetic identity completed each required step; the database identity issuer was exactly `https://login.rillora.xyz`, the active native session survived app termination/relaunch, logout changed it to revoked, subsequent unauthenticated reads returned 401, and Auth0 logs corroborated successful authentication, code exchange and logout for the native client. API tests passed 26/26, iOS tests passed 44/44, and API typecheck/build passed.
- Cleanup: the exact Auth0 user, local planner cascade, native session and temporary Keychain services were removed with zero matching identity rows and active sessions remaining. A simulator password item accidentally saved during the synthetic run was moved to Recently Deleted instead of being permanently purged; no Owner credential, biometric, mailbox or Apple account was used.
- Supersedes: the open iOS custom-domain runtime gate in the 2026-08-09 issuer decision. It does not supersede the narrow RP ID, rollback callback or production-open gates.
- Does not imply: native Apple Passkey, Associated Domains, real recovery, Guardian/backup factors, Auth0 provider-session revocation, Release identity, physical-device/TestFlight evidence, AWS/Vercel deployment, legal assurance or launch readiness.
- Implementation impact: remove iOS custom-domain runtime from active blockers. The next reversible P0 product gate is a separately bounded encrypted/printable Start Here export contract; external identity, deployment and registrar security actions retain their own authorization and evidence gates.

## 2026-08-10 — Add a minimum-disclosure printable Start Here guide

- Status: LOCKED for the current plaintext guide and its non-revocation disclosure; PROVISIONAL for any encrypted digital package.
- Scope: authenticated planner preview and printable generation in the local API, React Web and native SwiftUI client using synthetic/local fixture data; not recipient delivery, production storage, a physical printer, legal authority or encryption.
- Decision: separate “printable minimum guidance” from “encrypted digital package.” The first stage is universally readable UTF-8 plaintext generated only from an unexpired 15-minute preview after two literal acknowledgements: the file is plaintext, and saved/shared/printed copies cannot be revoked by Rillora. It excludes dedicated account hints, value bands and currencies, and never includes passwords or direct-transfer secrets.
- Lifecycle: the preview returns only printable-review fields and stores a SHA-256 commitment to the exact sanitized printable projection. Generation recomputes it and rejects a changed plan before building the response in memory; the API then returns strict plaintext/filename/export headers and retains only export metadata plus an `export.generated` audit event. Web uses a short-lived object URL; iOS uses an in-memory Core Transferable item. Neither path permits a claim that external copies were deleted or revoked.
- Evidence: API tests passed 27/27, iOS tests passed 48/48, Web API-client tests passed 6/6, Web product-truth and Sites tests passed, and production builds passed. iPhone 17e Simulator completed preview, both confirmations, guide generation and native share-sheet presentation; no Files, Print or send action was selected.
- Cleanup: the two temporary export records and two related audit events created during local validation were permanently deleted by exact public ID, returning export records to zero. They contained only synthetic metadata; no exported file was saved by the test.
- Supersedes: the Start Here “no-file preview only” implementation state. It does not supersede the map-not-password rule or any identity, release, legal, deployment or data-region gate.
- Does not imply: encrypted export, recipient acceptance, remote revocation, legal validity, physical-device/TestFlight evidence, production readiness, actual printing/sharing or market validation.
- Implementation impact: printable Start Here is no longer a P0 engineering blocker. Encrypted-package implementation pauses at the Owner decision among shared passphrase, recipient public-key wrapping and server/KMS-held release keys; current recommendation is the hybrid recipient-key model recorded in `docs/start-here-export.md`.

## 2026-08-10 — Lock hybrid recipient-key encryption with offline Owner recovery

- Status: LOCKED for the cryptographic architecture and current local Owner-recovery implementation; recipient enrollment, delivery and real release remain CLOSED.
- Owner decision: after reviewing the shared-passphrase, recipient-public-key and server/KMS-held-key alternatives, Owner approved the recommended hybrid recipient-public-key model with “可以”.
- Decision: clients generate a fresh AES-256-GCM data key and nonce for each reviewed Start Here package, encrypt the minimum-disclosure JSON snapshot, and wrap the same data key independently for every eligible accepted recipient device plus a fresh offline Owner recovery key. The server stores ciphertext, authenticated metadata, public keys and HPKE key envelopes, but never plaintext, an unwrapped data key or the recovery private key.
- Crypto contract: RFC 9180 HPKE Base mode with DHKEM(P-256, HKDF-SHA256), HKDF-SHA256 and AES-256-GCM; Web pins `@hpke/core` `1.9.0`, iOS uses CryptoKit. Package ID, preview ID and the SHA-256 commitment to the full safe snapshot are authenticated associated data. Finalization fails closed when the snapshot or exact eligible-recipient device-key set changed.
- Recovery boundary: both clients locally decrypt the just-created package with the recovery key before upload. The recovery private key exists only in client memory until the planner explicitly downloads or shares it. Anyone holding both files can decrypt; loss can make a recovery-only package unreadable; Rillora cannot recover or revoke external copies.
- Current product scope: because no real accepted invitation has enrolled a device key, the current visible package is recovery-only and its recipient count is zero. The data model supports per-recipient envelopes, but no enrollment endpoint, real invitation delivery, recipient portal or release operation exists.
- Evidence: API 29/29; Web API-client 6/6, product-truth 3/3, crypto 3/3 and Sites 4/4; iOS 54/54; API/Web production builds, dependency audits and iOS Release-simulator build pass. iOS successfully decrypts a fixed package produced by Web `@hpke/core`. A local browser completed the recovery-only encrypted flow without downloading either file.
- Cleanup: exact synthetic package `2e58712c-0477-4234-ab01-f318620fc8db`, preview `f56406b9-85c0-4b5e-b9ce-3183a540d577`, three audit rows and two export rows were permanently deleted after validation; exact-match checks returned zero. No recovery or package file was downloaded.
- Supersedes: the prior `PROVISIONAL` encrypted-model choice and the Owner decision gate in the printable Start Here entry. It does not supersede map-not-password, invitation identity, release, legal, data-region or deployment gates.
- Does not imply: recipient acceptance/enrollment/delivery, production end-to-end encryption, KMS or object storage, revocation after export, physical-device recovery, TestFlight, post-death release, legal validity, independent security review or market validation.
- Implementation impact: the next reversible local gate is synthetic invitation acceptance, recipient device-key enrollment/revocation and recipient-side decryption rehearsal. External invitation delivery, cloud resources and any real release still require their own authorization.

## 2026-08-10 — Isolate synthetic recipient decryption from planner and production authority

- Status: LOCKED for the local rehearsal boundary; real invitation, identity, delivery and release remain CLOSED.
- Scope: synthetic invitation acceptance, recipient P-256 device-key enrollment/revocation and recipient-side Start Here decryption in the local API, Web and native iOS client; not a production recipient portal.
- Decision: expose the rehearsal only behind `ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL=true`, and make production startup refuse that flag. A planner may create a 30-minute simulation invitation/rehearsal for an existing active trusted-contact record, but the API sends nothing. It returns a one-time random acceptance capability in the response body, stores only its SHA-256 digest, then exchanges it for a different short-lived `Rillora-Rehearsal` session whose digest is also the only stored form.
- Authorization boundary: public rehearsal calls carry neither planner Cookie/Bearer authority nor CSRF state. A separate least-privilege PostgreSQL role and forced RLS restrict a session to one rehearsal, its public device keys and its recipient envelope. Synthetic device keys and rehearsal-linked packages are excluded from the ordinary encrypted Start Here routes.
- Key boundary: the clients create a P-256 key pair in memory and submit only the public point. The API recursively rejects private-key/secret-shaped fields, limits and deduplicates active device keys, binds finalization to the exact active key set and returns no Owner recovery envelope. Revocation stops future retrieval but cannot revoke plaintext or external copies already obtained.
- Evidence: API 31/31, Web API-client 7/7, Web encrypted-crypto 4/4, product-truth 3/3, Sites 4/4 and Web production build pass. Native iOS tests pass 56/56 on iPhone 17e Simulator with iOS 26.5. Tests cover one-time acceptance/replay rejection, stored token digests, recursive private-key rejection, standard/simulation isolation, RLS-limited retrieval, recipient decryption, wrong-key rejection, public-call credential separation and revocation denial. No new manually driven browser/simulator end-to-end rehearsal is claimed.
- Supersedes: the implementation state in which recipient enrollment/decrypt rehearsal was absent. It does not supersede the hybrid encryption model, map-not-password rule or any production identity/release gate.
- Does not imply: a real person's identity or consent, email/SMS delivery, durable device-private-key storage or recovery, external package delivery, production end-to-end encryption, death/incapacity/missing verification, legal authority, release, physical-device/TestFlight evidence, deployment or market validation.
- Implementation impact: the next reversible local product gate is a role-scoped disclosure-policy rehearsal with separate death, incapacity and missing-person case state machines and no operative notification or release. Real delivery, cloud resources and any external test retain separate Owner gates.

## 2026-08-10 — Keep role-scoped disclosure rehearsal permanently non-operative

- Status: LOCKED for the local rehearsal boundary and exact role projections; real claims, evidence verification, notification and release remain CLOSED.
- Scope: planner-authenticated disclosure-policy rehearsal in the local PostgreSQL/API, React Web and native SwiftUI client, using existing local fixture data; not a claimant portal, evidence intake system, real timer, legal workflow or recipient delivery.
- Decision: model death, incapacity and missing/unreachable as three distinct event-prefixed rehearsal state machines. Each may demonstrate multi-party review, an illustrative cooling period, planner cancellation, appeal and restart, but every record and response must remain `simulationOnly` with operative, identity-verified, documents-verified, multi-party-verified, notifications-sent and data-released flags false.
- Disclosure policy: render exact server-owned allowlists rather than filtering a broad Matter object in the clients. Death may show the trusted contact `title/category/outcome`, executor `title/category/institution/location/outcome`, and a matter-specific recipient `title/category/location/outcome`; incapacity exposes only `title/category` to the trusted contact; missing exposes only planner name, time zone and matter count to the trusted contact and no Matter rows. Empty executor/recipient views are meaningful denial states.
- Security boundary: migration `0017_disclosure_rehearsals.sql` adds forced RLS, event/state consistency and hard-false operation checks. Actions require the current optimistic version and literal rehearsal acknowledgement; API, Web and iOS independently reject unsafe flags or forbidden preview fields. Audit events retain action/state metadata only.
- Evidence: API typecheck/build and 34/34 integration tests pass; Web API-client 9/9, product-truth 3/3, crypto 4/4, Sites 4/4 and production build pass; native iOS 61/61 passes on iPhone 17e Simulator with iOS 26.5. Tests cover all three paths, role fields, invalid transitions, version conflict, RLS, cancellation, appeal and client failure closure. No manual new-path browser/simulator UI run is claimed.
- Supersedes: the prior implementation state in which role-scoped disclosure policy was only the next proposed gate. It does not supersede the separation of real life events or any production safety/legal gate.
- Does not imply: real identity or document verification, a legally appropriate cooling period, elapsed backend timers, notification, consent, authority, recipient delivery, disclosure, release, legal validity, production readiness or market validation.
- Implementation impact: the next reversible local gate is planner-authored per-matter role and disclosure-scope editing across Web/iOS, with explicit plan-wide versus matter-specific assignment, record-only versus invitation evidence, optimistic versions, minimal audit and invalidation of stale rehearsal snapshots. It still sends nothing and grants no authority.

## 2026-08-10 — Keep planner-authored role policy record-only and invalidate stale disclosure snapshots

- Status: LOCKED for the local role-policy contract; real invitation, identity, authority, delivery and release remain CLOSED.
- Scope: planner-authenticated role assignment records in PostgreSQL/API, React Web and native SwiftUI, using synthetic/local plan data.
- Decision: `trusted_contact` and `executor` may be plan-wide or matter-specific; `recipient` must be matter-specific. Active duplicates are forbidden. `record_only` draft assignments may be edited with optimistic versions; any invitation-backed evidence freezes the record and requires explicit revoke/recreate rather than historical rewrite.
- Authority boundary: every response keeps authority, account access, ownership transfer, disclosure and release false. A role record is not consent, identity proof, appointment, platform authorisation or ownership.
- Lifecycle: role revoke also revokes attached invitation state; person revoke/archive revokes all of that person's roles and invitations; matter archive revokes matter-scoped roles and invitations. Every relevant policy change advances the role-policy version and marks existing disclosure snapshots stale without rewriting their frozen contents.
- Platform decision: Web provides batch coverage plus create/edit/revoke drawers and protects unsaved Matter work; iOS provides native Matter-level `Form` editing with an injected store. The two platforms share state and semantics, not pixel layout.
- Evidence: API 38/38, Web API-client 11/11 and native iOS 67/67 pass. Web manual QA covered create, edit to matter recipient, disclosure preview, revoke, stale warning, fresh snapshot and unsaved-Matter confirmation. No manual iOS role-editor UI run is claimed.
- Supersedes: the prior handoff state in which planner-authored per-matter role policy and snapshot invalidation were only the next proposed gate.
- Does not imply: real invitation delivery or acceptance, recipient identity, legal authority, external account access, real disclosure, release, production deployment or market validation.

## 2026-08-10 — Use a strict first-party local event contract before any analytics vendor

- Status: LOCKED for the current local MVP event contract; production collection, consent, retention operations and market claims remain CLOSED.
- Decision: the API, not the client, appends eight progress events after successful domain mutations: `motivation_selected`, `first_item_added`, `five_items_completed`, `item_outcome_assigned`, `item_role_assigned`, `official_setup_checked`, `simulation_completed` and `start_here_exported`.
- Privacy boundary: each event has an exact database-enforced property key/value set. Matter titles, institutions, account hints, locations, values, currencies, contact identity, free text, capabilities, ciphertext and identity-provider identifiers are prohibited. Clients can provide only `web|ios` coarse provenance; invalid or absent provenance becomes `unknown`, and public synthetic-recipient calls send none.
- Access boundary: forced RLS applies. The application runtime can insert product events but cannot select, update or delete them; there is no arbitrary tracking endpoint or third-party analytics SDK.
- Retention truth: `expires_at` defaults to 90 days, but no cleanup worker exists. This is a deletion deadline marker, not evidence of automatic erasure.
- Evidence: the 38/38 API integration suite covers strict properties, provenance, insert-only privileges, RLS, retention marker and database rejection of an extra title field. Web 11/11 and iOS 67/67 cover planner provenance and public-call omission.
- Does not imply: consent approval, production analytics, dashboard access, aggregation, deletion completion, real cohort behavior, activation, retention, payment or market validation.
- Implementation impact: any external collector, dashboard, operator access, scheduled deletion or new event/property requires a separate privacy/security decision and evidence update.

## 2026-08-11 — Make authentication the default Web product entry

- Status: LOCKED for the Owner-facing and default local Web entry; production identity, recovery and release remain CLOSED.
- Scope: React Web unauthenticated state, Express BFF authorization entry points and the existing Auth0 EU development tenant; not real-user onboarding completion or a production deployment.
- Decision: an unauthenticated visitor must first see explicit `Sign in` and `Create account` actions. The Owner-facing/default localhost runtime must use real Auth0 and fail closed; `ALLOW_DEV_AUTH` and `VITE_DEV_PLANNER_ID` are permitted only when an automated or local QA run explicitly opts into a bounded synthetic identity, never as the default preview or any production entry.
- Registration boundary: `Create account` uses the same-origin BFF and may forward only the exact allowlisted `screen_hint=signup`; arbitrary hint values are ignored. Auth0 remains the credential boundary, and no password or provider token is collected by the React client.
- Provider presentation: the Auth0 clients display as `Rillora Web` and `Rillora iOS`, tenant friendly name is `Rillora`, and Universal Login uses the current Calm Continuity primary/background colors. The final Rillora Logo remains unresolved, so no placeholder has been promoted to a final brand asset.
- Evidence: API typecheck, production build and 39/39 integration tests pass; Web production build, API-client 12/12, product-truth 3/3, crypto 4/4 and Sites 4/4 pass. With `ALLOW_DEV_AUTH=false` and no Web planner override, `/v1/session` and a request carrying the development identity header both return 401. Chrome showed the explicit local authentication gate, then separately reached `login.rillora.xyz` login and registration forms.
- Supersedes: the accidental Owner-facing runtime state that inherited the synthetic planner bypass used for UI alignment QA. It does not remove the bounded development identity mechanism from automated/local tests.
- Does not imply: a real account was created, a new real-user login completed, email ownership or recovery was verified, production callbacks/Release identity are ready, or invitation, disclosure and release are operational.

## 2026-08-11 — Let visitors understand Rillora before authentication

- Status: LOCKED for the public Web entry and progressive account gate; private data authentication and production identity gates remain unchanged.
- Owner decision: after viewing the immediate sign-in/create-account entry, Owner clarified that the website should not ask visitors to authenticate on arrival and requested a distinct Account page, with authentication triggered only when someone chooses to act.
- Decision: `/` is a public product-understanding surface with no private plan data and no account requirement. It explains the promise, workflow, separate death/incapacity/unreachable paths and map-not-password boundary. `Account` and plan-start actions move to `/account`; only that surface offers `Sign in` and `Create account`, which then enter the existing same-origin BFF/Auth0 routes.
- Security boundary: public browsing does not weaken private API authorization. Unauthenticated plan reads and every write still return 401; the development identity remains opt-in only. Public content must not render fixtures as if they belong to the visitor, cache authenticated responses or collect credentials.
- Interaction and visual boundary: the public surface uses a full editorial introduction and restrained entrance/reveal motion; the authenticated application retains its compact workspace. Account is a route, not a modal forced over the first viewport, and remains directly addressable at `/account`.
- Evidence: Web production build and the existing API-client 12/12, product-truth 3/3, crypto 4/4 and Sites 4/4 suites pass. Desktop Chrome verified the public root DOM and first viewport, the plan-start transition to `http://localhost:4173/account`, and the Account page’s exact sign-in/create-account hrefs. No mobile-browser viewport, real registration or new authenticated session is claimed.
- Supersedes: only the 2026-08-11 decision that an unauthenticated visitor must see sign-in/create-account as the first product screen. It preserves that decision’s real Auth0 default, exact signup allowlist and ban on default synthetic planner bypass.
- Does not imply: a public deployment, final marketing copy, final Logo, real-user onboarding completion, production authentication, recovery readiness, invitation delivery, disclosure or release.

## 2026-08-11 — Keep post-registration guidance optional and non-blocking

- Status: LOCKED for the no-gate first-run boundary; PROVISIONAL for exact copy, layout and guide length.
- Owner decision: after directly experiencing the authenticated competitors, Owner rejected registration that immediately forces a questionnaire and asked for a better first-use model.
- Decision: account creation or sign-in opens a usable private overview. The product presents three independent choices: `Add your first matter`, `Use the 2-minute guide` and `Explore an example`. Guided setup must expose skip, save-and-exit, progress and resume; direct navigation and manual matter creation remain available at all times.
- Motivation boundary: `Why now` is an optional accelerator inside guided setup, not an authentication requirement, profile completion gate or readiness credit. Registration, answering a question and reading recommendations do not mean the person is protected, legally prepared or ready for release.
- Interaction boundary: use small, just-in-time questions within a chosen task; explain why sensitive fields are asked; do not default to a blocking questionnaire or collect a complete household profile before the first useful action.
- Platform boundary: Web lands on a usable overview with a non-blocking starter panel. iOS may use a dismissible sheet, banner or checklist, but not a full-screen flow without a visible exit. Shared labels, progress semantics and resume state remain aligned.
- Evidence: current-run authenticated observation found Everplans lets users enter a dashboard and uses a one-question password-location task; DGLegacy also opens the dashboard but includes a prohibited password field and premature protection／inheritance states; MyLifeLedger blocks the underlying dashboard with a non-dismissible Quick Win despite using minimal fields. Screenshots and step-level findings are recorded in `docs/competitor-ux-audit.md` and `output/competitor-auth-audit-20260811/`.
- Does not imply: the new first-run is implemented or usability-tested, the competitor flows are fully audited, any external invitation is authorized, or a readiness score proves security, legal effectiveness, disclosure eligibility or market demand.

## 2026-08-11 — Implement first use as persisted, non-blocking cross-platform state

- Status: IMPLEMENTED AND LOCALLY VERIFIED for the locked first-use boundary; exact copy, guide duration, external usability and production deployment remain PROVISIONAL.
- Scope: migration `0021`, the shared Plan API, authenticated React Overview/Settings and native SwiftUI Overview/More sheets. It does not change public authentication, invitation, release or legal-effect boundaries.
- Shared contract: persist only the valid pairs `available / 0`, `guide_in_progress / 1..2`, `guide_paused / 0..2` and `completed / 2`. Clients update state and step together. An explicit first-Matter save completes first use; registration, guide answers, skips, pause and synthetic preview do not add readiness.
- Platform decision: Web presents the three choices inline on a usable Overview and resumes through Settings. iOS keeps the same meaning with native sheets and resumes through More. The example is clearly synthetic and remains unsaved until the user explicitly chooses Save.
- Accessibility boundary: Web text actions use a `44px` minimum target and retain all routes at `390 × 844` without horizontal overflow. iOS `Not now` measures `314 × 44pt`, More resume measures `358 × 52pt`, and the first-use surface remains scrollable at Simulator Text Size level `5`.
- Evidence: API 40/40, Web API-client 13/13, Web first-use 3/3, product-truth 3/3, crypto 4/4, Sites 4/4 and iOS 71/71 pass. Browser QA proved the synthetic example did not enter `matters`, explicit Save did, and readiness stayed `0/5` before a qualifying planning action. A real Simulator tap changed the Plan from `available / 0` to `guide_paused / 0`; Account then exposed Resume. The editable [Figma audit section](https://www.figma.com/design/xms4CTEsq37oYcVnM3xu7F?node-id=6-3) records implementation truth rather than a new design authority.
- Does not imply: a real new-user signup was completed, the guide actually takes two minutes, VoiceOver speech order is fully certified, physical-device behavior is proven, external usability succeeded, or market demand, legal preparation, invitation, disclosure or release is established.

## 2026-08-11 — 手机端一级导航压缩为三个系统级目的地

- Status: LOCKED for eliminating crowded five-to-seven-item phone bars and using one native iOS shell; PROVISIONAL for the exact `More` label and secondary ordering until external usability evidence exists.
- Context: Owner observed that the iOS-facing navigation looked inconsistent and that the custom bottom bar contained too many equal options. Inspection found three coexisting models: six-plus-Settings on desktop Web, seven icons on phone-width Web, five tabs in the older mobile prototype, and three native tabs in the shipping SwiftUI app. The shipping app also mixed inline and automatic large-title modes across roots.
- Decision: desktop Web retains the complete workspace side rail. Phone-width Web and shipping iOS expose exactly `Overview / Matters / More`; `My plan`, trusted contacts, official guides, activity, preferences and account/session controls are secondary destinations under More. Shipping iOS uses only SwiftUI `TabView` plus per-tab `NavigationStack`, and all three root titles use native inline mode. The browser-based `apps/ios-prototype` may demonstrate the same information architecture but cannot prove native iOS chrome.
- Evidence: at `390 × 844`, Web renders three approximately `111 × 54px` targets, zero document overflow and persistent More selection on nested Settings. The mobile prototype passes integrity/build and 9/9 Playwright tests. iPhone 17e / iOS 26.5 runtime accessibility exposes only `Overview / Matters / More`; the authenticated More surface is reachable, the build succeeds and 71/71 tests pass.
- Supersedes: the prior rule that phone-width Web must display every desktop top-level destination directly, and the older five-tab prototype navigation. Historical screenshots remain evidence of those prior states only.
- Does not imply: desktop Web must be reduced to three destinations, the exact More ordering is externally validated, the browser prototype is a native app, or physical-device/complete VoiceOver navigation has passed.

## 2026-08-11 — 允许Owner用自有邮箱验证原生iOS真实身份链路

- Status: APPROVED for one Owner-controlled account in the Auth0 EU development tenant; production identity and external-user testing remain CLOSED.
- Owner decision: stop using the synthetic development planner for the hands-on trial and let the Owner register and sign in with an email account they control.
- Configuration boundary: native access-token verification may run with `OIDC_ISSUER_URL + NATIVE_OIDC_CLIENT_ID + OIDC_API_AUDIENCE` without loading the Web confidential-client secret. Web OIDC remains an independent complete set, and production still requires its full reviewed configuration.
- Credential boundary: the Owner enters email, password, verification code and recovery information directly in Auth0 Universal Login. The Agent and Rillora clients must not read, echo, persist or proxy the password.
- Evidence at this decision: API configuration tests pass 8/8, typecheck and build pass; a real-auth API on port 4180 rejects unauthenticated and spoofed development-identity requests with 401; iPhone 17 Pro Max Debug rebuilt without a development planner and reached the live `login.rillora.xyz` page. No email was entered and no account or Rillora session had yet been created.
- Does not imply: verified mailbox delivery, completed signup/login, recovery readiness, production Release identity, physical-device behavior, external-user testing, invitation, disclosure or release.

## 2026-08-11 — Owner交互体验停止依赖本地后端并转向Frankfurt云端staging

- Status: LOCKED for hands-on product environments using a hosted HTTPS API rather than localhost; PROVISIONAL for the synthetic-staging network until live AWS verification.
- Owner decision: backend and API should no longer be local for product trials; development should move gradually toward a publishable real product.
- Environment boundary: local PostgreSQL and API processes remain permitted only for isolated automated tests. Both existing interactive listeners were stopped before the Owner entered an email. The pending real-email registration trial is deferred until the cloud endpoint and database are live.
- Staging topology: the first synthetic-only stack uses AWS Frankfurt `eu-central-1`, API Gateway HTTP API, VPC Link, Cloud Map, one ARM Fargate task and private encrypted Single-AZ RDS PostgreSQL. The task has public egress to Auth0 without a NAT Gateway, but application ingress is restricted to the VPC Link; real sensitive data requires a new private-egress and production review.
- Database boundary: migrations use the generated RDS administrator only in a one-off task. The API receives a separate generated, non-inheriting login that may assume only `continuity_app / continuity_auth / continuity_rehearsal`. Production startup requires `verify-full` database TLS and the pinned AWS RDS CA bundle.
- Safety gate: CDK defaults to zero API tasks. The first paid deploy creates infrastructure without an active service; only after the checksum migration and runtime-role task succeeds may a second deploy set one task. No source change or synth authorises `cdk bootstrap` or `cdk deploy`.
- Cost boundary: current Frankfurt public Price List gives about `$29.45/month` for the base one-task stack; with API requests, logs, ECR, traffic, tax and variance the staging planning range is `$30–40/month`. The proposed hard Owner approval gate is `$50/month`; Free Tier/credits may offset charges but cannot be assumed before target-account inspection.
- Evidence: API typecheck/build, production dependency audit and `48 / 48` tests pass. AWS CDK typecheck, `4 / 4` assertions and full Frankfurt synthesis pass. AWS CLI `2.36.20` is installed but has no authenticated profile; Docker image build, AWS bootstrap/deploy, migrations, HTTPS health, cloud OIDC exchange and actual regional/billing evidence are not complete.
- Does not imply: a cloud resource exists, the environment is free, a real email account has been created, Web cookies are production-routed, the topology is approved for real sensitive data, or production identity, availability, backup, recovery, legal or independent-security gates are closed.

## 2026-08-12 — Deploy a synthetic-only Frankfurt plane and keep Web authentication same-origin

- Status: IMPLEMENTED AND LIVE for the exact synthetic staging revision; real sensitive data and production readiness remain CLOSED.
- Owner decisions: use AWS rather than Vercel for authenticated Web/API/data, remain on the AWS Free Plan/credits for development, use the lower-cost Single-AZ RDS plus Fargate Spot alternative, and continue without blockchain.
- Infrastructure decision: deploy in `eu-central-1` through a nonroot MFA operator and CDK bootstrap roles. API Gateway HTTP API reaches an ARM Fargate Spot service through VPC Link and Cloud Map; private encrypted Single-AZ RDS stores mutable data; generated administrator/runtime/Web secrets remain separated. The migration/runtime-role task must succeed before service count becomes one.
- Web decision: store static assets in a private S3 bucket and serve them through CloudFront. Only `/api/*` is proxied to API Gateway, preserving same-origin HttpOnly Cookie and CSRF semantics. Express supports both native `/v1` and Web `/api/v1` paths behind identical authentication. Public browsing uses a 200 session-presence probe so an expected signed-out state is not a console error.
- Cost/availability boundary: a `$25` monthly Cost Budget exists, but has no notification recipient and is not an automatic stop. Fargate Spot, Single-AZ RDS and one-day backup retention are accepted only for synthetic development. Credits do not prove zero cost.
- Evidence: CloudFormation is `UPDATE_COMPLETE`; migration exited zero; ECS is 1/1; live/readiness are 200; Web root and `/account` are 200; unauthenticated private API is 401; login is an Auth0 303 with exact CloudFront callback; CSP, HSTS and no-store are present. Playwright desktop and `390 × 844` checks end with zero console errors and no horizontal overflow. API 55/55, Web 30 focused tests, iOS 71/71 and infra 7/7 pass; production dependency audits are zero.
- Does not imply: a production environment, real-user security review, redundant database, production KMS/attachments, real invitations, legal validity, claims, notification or release. Owner iOS cloud login remains open.
- Custom-domain result: the operator requested only a DNS-validated `EC_prime256v1` certificate for the exact staging hostname in `us-east-1` and may inspect/delete only the tagged staging certificate. CloudFront now uses the explicit certificate ARN, one fixed alias and TLS 1.2_2021; Auth0/API callback and CORS origin use the formal domain while localhost and the distribution hostname remain temporary rollback entries. GoDaddy validation and app CNAMEs were each conflict-checked and read back; authoritative and public DNS, TLS SAN, Web/Account/session/private/login routes, API readiness, CORS, CSP/HSTS, desktop 1280px and mobile 390×844 were verified. This makes the staging domain live, not the product production-ready.

## 2026-08-12 — iOS signed-out launch is a public product state, not an authentication wall

- Status: LOCKED for public-before-account ordering on both shipping platforms; exact public copy remains PROVISIONAL.
- Owner correction: launching iOS without a Rillora session must not immediately demand registration or sign-in. The earlier full-screen `Sign-in required` state was an implementation regression, not a valid interpretation of private API authentication.
- Decision: signed-out iOS opens a native public Overview with product explanation and a safe synthetic example. The example is readable without an account. `Create account / Sign in / Not now` appears only after an explicit private intent: start a plan, add a Matter, adapt/save the example, or open Account. Signed-out Matters and More stay useful and explanatory without rendering authenticated empty states or private editors.
- Security boundary: the app checks for a local session before loading Overview and makes zero private Overview requests when none exists. A 401 transitions to the same signed-out product state; it is not shown as a network failure. All private reads and writes still require a valid Rillora session, and the public example never writes to the plan.
- Authentication intent: account creation and existing-account sign-in remain distinct Auth0 requests; cancelling Auth0 returns to the public product without presenting a failure alert.
- Evidence: focused iPhone 17 Pro Max UI automation covers public launch, no automatic Account surface, example browsing, explicit Account entry, `Not now`, signed-out Matters and More, and minimum Account targets. Native unit tests pass 75/75, including local-session presence, zero-fetch signed-out state, 401 mapping and exact Auth0 intent parameters. The updated five-device／12-content-size matrix passes 23/23 slices with zero failures; evidence is recorded in `docs/ios-layout-matrix.md` and `output/qa/ios-layout-matrix-20260812-232931/`.
- Supersedes: any code, screenshot or handoff wording that treated an unauthenticated iOS launch as an authentication error or made native Account the automatic first screen.
- Does not imply: public access to private data, a completed real registration, true guest persistence, external usability validation, production Release identity, a physical-device pass, invitation, disclosure or release.

## 2026-08-13 — iOS public Overview is an entry, not a brochure

- Status: SUPERSEDED for its minimal four-element composition by the later 2026-08-13 correction below. Public-before-account and progressive disclosure remain LOCKED.
- Owner correction: removing the authentication wall did not justify filling the replacement screen with product explanation. The first public implementation still exposed a headline, explanatory paragraph, three detailed workflow rows and a second privacy card before the user had chosen a task.
- Decision: the signed-out Overview carries only one short promise, one supporting line, one concrete safe-example card and one quiet private-plan action. Workflow education and security/legal qualifications move to the example and signed-out Matters／More, where they answer an expressed question. Do not solve excess copy by shrinking type, compressing line height or stacking smaller cards.
- Visual structure: the synthetic `Cloud photos` card is the sole focal object and remains explorable without an account. `Start a private plan` stays visible but visually secondary; it still opens the explicit Account choice instead of Auth0 directly.
- Accessibility boundary: the surface remains a ScrollView and uses scalable type without capping Dynamic Type. Both actions remain at least 44pt; compact-height and large-text layouts may scroll instead of truncating.
- Evidence: iPhone 17 Pro Max build/run and direct screenshot review show the reduced hierarchy; iPhone SE at default and `accessibility-extra-extra-extra-large` passes the complete signed-out journey and action-target checks. Unit tests pass 75/75. The expanded matrix ran the signed-out journey on every representative default-size device and all 12 iPhone SE Dynamic Type categories. Every new public-entry assertion passed. The raw first run recorded 22/23 slices green because one pre-existing authenticated iPhone 17 Pro landscape test injected a native `Matters` tab tap without changing selection; its unchanged exact test passed immediately on a clean rerun. Raw and rerun evidence are both retained in `output/qa/ios-layout-matrix-20260813-001645/`.
- Supersedes: the 2026-08-12 public Overview composition with the three-step explanatory card and repeated `Your plan is not public content` card. It does not supersede public-before-account, map-not-password, or progressive-disclosure safety rules.

## 2026-08-13 — Reduce prose without removing product meaning

- Status: LOCKED for the signed-out iOS information hierarchy; exact English copy and visual treatment remain PROVISIONAL.
- Owner correction: the previous pass treated “too much text” as a request for minimalism. Removing nearly all explanatory structure produced an attractive but ambiguous screen: a visitor could see `Cloud photos` without understanding that Rillora organizes accounts, documents, wishes and trusted people for future handling.
- Decision: the public Overview must answer three questions at a glance: what Rillora helps organize, what directions it records, and who may need to act. Express these with compact visual modules rather than paragraphs. Keep two distinct actions: browse a safe example without an account, or start a private plan and then choose account creation/sign-in.
- Current composition: `Put your digital life in order.` states the job; one short line states the beneficiary; a structured plan card shows `What exists / What happens / Who helps`; `Explore a safe example` and a visually primary `Start my private plan` expose the two next steps. No password-vault, legal-effect or automatic-release claim is introduced.
- Accessibility boundary: ordinary Dynamic Type uses the three-column scan; accessibility sizes reflow the modules vertically and use a scalable semantic title rather than multiplying the custom display size. The page remains scrollable and actions keep the 44pt minimum.
- Supersedes: only the earlier same-day requirement that the page contain exactly one short promise, one supporting line, one example card and one quiet action. It preserves the removal of long workflow prose, the separate Account choice and all private API authentication boundaries.

## 2026-08-13 — Design the full commercial catalog now and launch only one paid tier

- Status: LOCKED for the catalog/entitlement shape and trust boundary; future tier activation remains PROVISIONAL.
- Owner decision: combine the initial feasibility/commercial research with the new free-versus-paid analysis, design the future multi-tier system before billing code hardens, but expose only one paid tier at the beginning.
- Decision: Rillora launches with a permanent `Free` baseline and exactly one paid entitlement tier, `Rillora Family`. Monthly and annual are billing periods for the same tier, not separate tiers. Dormant `Personal`, human-service add-on and professional catalogs may be represented in the model but must not appear to customers until separately activated by evidence and decision.
- Free boundary: provider-owned setup guidance, a useful lightweight Matter map, one basic trusted-person path, basic rehearsal/export, authentication/security/privacy controls, cancellation/deletion and recipient basic access cannot be made paid-only. Rillora charges for recurring coordination, collaboration, maintenance, history, advanced role packages, future production attachments and bounded service—not for facts a user can configure for free elsewhere.
- Architecture: entitlements derive from immutable `plan_code + plan_version + capability`; price, billing interval, storefront and subscription state remain separate records. Clients and APIs must not use `isPremium` as the authorization source. Recipients are actors, not billable seats. Web and iOS resolve the same entitlement even when payment adapters differ.
- Lifecycle boundary: cancellation or payment failure can end paid capabilities only after the paid term/grace policy; it cannot delete the account, block core export/recipient access, or initiate death, incapacity, unreachable, claim or release state.
- Evidence: the combined commercial contract is `docs/monetization.md`; its source register links current official competitor and Apple platform pages reviewed 2026-08-13.
- Does not imply: payments are implemented or authorized, exact limits/prices are market-validated, future tiers are approved for launch, App Store review/tax/legal work is complete, or any real user has subscribed.

## 2026-08-13 — Use monthly and annual Family price hypotheses without a launch auto-converting trial

- Status: PROVISIONAL research recommendation; exact price, refund wording, local prices and trial activation remain unvalidated.
- Price test: replace the earlier rough `about US$49/year` hypothesis with `US$6.99/month` or `US$59/year` for the same `Rillora Family` entitlements. Annual is US$4.92/month equivalent and 29.7% below twelve monthly payments. Display both full charges and the exact saving.
- Trial decision: the launch Free plan is the initial evaluation path. Do not enable an auto-converting paid trial at launch. Use a 30-day first-purchase money-back policy target for direct Web software purchases, excluding consumed human services and subject to applicable law. App Store refund decisions remain with Apple.
- Future experiment: support but default-disable one 14-day Family capability preview per household, preferably without a card. It may be activated only after tested expiry/downgrade behavior, explicit messaging and a defined conversion hypothesis; it never includes real claim/release or human services.
- Pricing evidence: current public anchors reviewed include MyLifeLedger at US$39/year, Quicken LifeHub regular US$47.88/year, DGLegacy Gold at US$9.99/month or US$95.88/year, Everplans at US$99.99/year, Trustworthy from US$120/year, 1Password Families monthly/annual plus 14-day trial and Bitwarden Families at US$47.88/year. These are heterogeneous anchors, not proof of Rillora willingness to pay.
- Supersedes: only the old single-price `about US$49/year` test hypothesis in `docs/mvp.md`. It does not supersede the real-payment validation threshold or authorize checkout/provider spend.

## 2026-08-13 — Reframe US$59 as a bounded founder cell and plan the business around a US$89 standard-price hypothesis

- Status: PROVISIONAL financial and pricing recommendation; exact price, founder-offer promise, merchant structure, launch markets, payment activation and external spend remain Owner gates.
- Owner intent: plan pricing and costs early enough that Rillora can later withstand financing or acquisition diligence rather than optimizing only for the first checkout conversion.
- Price decision: use `US$8.99/month` or `US$89/year` as the primary standard-list hypothesis for `Rillora Family`; the annual price is 17.5% below twelve monthly charges. Retain `US$6.99/month` or `US$59/year` only as a pre-bounded Founder/WTP cell, not a permanent list or lifetime-grandfather promise. Keep `US$9.99/month` or `US$99/year` as an upper sensitivity, not a launch offer.
- Economic model: distinguish gross billings, tax, cash settlement, refunds, recognized subscription revenue, deferred revenue, commerce fees, variable contribution margin and fully allocated reported gross margin. The Base model at the US$89 hypothesis produces US$70.25 annual contribution profit, 77.7% contribution margin and a US$42.58 CAC ceiling at 3.0x LTV:CAC; these are model outputs, not observed results.
- Scale boundary: the same model produces -55.0% reported gross margin at 100 paid households, 51.1% at 1,000, 69.7% at 10,000 and 73.7% at 50,000 after fixed direct production COGS placeholders. Do not present the per-household contribution margin as company gross margin.
- Commerce recommendation: use Paddle Merchant of Record as the initial Web planning baseline and Stripe direct as a sensitivity until the merchant entity and countries are chosen. Preserve provider-neutral price, entitlement, invoice and transaction records. Apple's 15% rate is only an eligibility assumption and storefront contracts remain separate.
- Services decision: the earlier US$99–149 human setup/review hypothesis is superseded. Keep the add-on dormant; a preliminary US$199–299 range may be tested only after time-and-motion, insurance/QA and separate services-margin evidence.
- Readiness contract: measure full-price paid households, 30/90-day maintenance, refund/cancellation, annual renewal when mature, support minutes, attributed CAC, channel concentration and both margin views. Maintain a diligence-ready data room for entity/cap table, IP, revenue reconciliation, entitlement history, privacy/security, vendors and separate services economics.
- Cash boundary: the editable 18-month scenarios are planning reserves, not a financing ask. Validation/founder-led, Core small-team and Accelerated cash needs are modeled at approximately US$269k, US$902k and US$1.886m including 15% contingency; entity, payroll, market and vendor quotes must replace every placeholder before external use.
- Evidence: focused contract `docs/unit-economics.md`; editable workbook `output/finance/rillora-unit-economics-20260813/Rillora_Unit_Economics.xlsx`; portable reviewed report `output/finance/rillora-unit-economics-20260813/Rillora_Pricing_And_Fundability_Report.html`; official commerce/platform, tax/privacy and directional benchmark sources are registered in `docs/research.md`.
- Supersedes: the prior same-day decision only where it treated US$6.99/US$59 as the main price recommendation and US$99–149 as the human-service range. It preserves permanent Free, one visible paid Family tier, monthly/annual as billing periods, no launch auto-converting trial, 30-day direct-Web purchase-risk target and all safe-downgrade boundaries.
- Does not imply: willingness to pay, profitability, a valuation, an approved raise, App Store eligibility, global tax/privacy compliance, an executed payment-provider contract or authorization to charge a user.

## 2026-08-13 — Centralize Free/Family explanation and keep capability gates server-owned

- Status: IMPLEMENTED LOCALLY for commercial presentation; billing and entitlement enforcement remain CLOSED.
- Owner request: re-audit the interface against the newly defined Free and Family boundaries instead of treating pricing as a separate report.
- Decision: make Free explicit at private-plan creation (`free`, `no card`) and expose one public `Plan & access` comparison on Web and iOS. The authenticated destination remains under the Web workspace and iOS `More`; phone navigation stays `Overview / Matters / More`.
- Paid-prompt rule: do not spread crowns, locks or generic Premium badges across the product. Future Family prompts occur only at a specific paid-capability intent and name the ongoing collaboration value. Until shared entitlements exist, the UI is a billing-closed pricing preview and cannot gate or grant access.
- State-language decision: distinguish continuity-plan, identity/session and subscription states. Native `Plan status: Active` becomes `Continuity status`; development access to unfinished capabilities is explicitly not a purchase.
- Truth correction: remove the Web Settings reminder/guidance checkboxes that appeared active without persistence and collided with the proposed paid adaptive-reminder value.
- Safe-downgrade decision: comparison surfaces state that ending Family does not remove the core readable/exportable map or baseline security controls.
- Evidence: focused audit `docs/free-paid-ui-audit.md`; Web 32/32 focused tests, production build, high-severity dependency audit, 390px overflow and 44px visible-target checks pass. Native build and 75/75 unit tests pass; the effective final simulator coverage is 23/23 slices, with the raw 19 PASS/4 FAIL execution and all four corrected/unchanged-source reruns retained under `output/qa/ios-layout-matrix-20260813-224908/` and explained in `docs/ios-layout-matrix.md`.
- Does not imply: exact price validation, shipped Family capabilities, payment activation, a StoreKit/Web checkout, subscription state, server authorization or market demand.

## 2026-08-14 — Select AI-01 Architectural Index for the public experience and extend it into a truthful long page

- Status: LOCKED for the signed-out public visual direction and information sequence; exact English copy and external comprehension remain PROVISIONAL.
- Owner decision: from the latest generated public-UI round, Owner selected option `2`, preserved as `AI-01 · Architectural Index`, and asked for an optimized long-page implementation rather than another concept-only screen.
- Visual scope: `AI-01` governs the signed-out Web landing and native iOS public Overview. The authenticated workspace, Account choice and private editors retain the quieter Calm Continuity product language. This is a scoped public-entry evolution, not a whole-product redesign and not a Logo decision.
- Information sequence: lead with one legible job statement and explicit Free private-plan intent; make `What exists / What should happen / Who helps` an interactive architectural index; then show a safe synthetic handoff, a concise Free baseline, the planned Family coordination layer, safe-downgrade controls, the separate `Death / Incapacity / Unreachable` boundary and a final action. The detailed entitlement comparison remains in `Plan & access`.
- Interaction boundary: the top and final start actions both enter the Account choice, never Auth0 directly. The safe example remains public and synthetic. No public screen reads private APIs, stores a password or treats registration as consent to a questionnaire.
- Commercial boundary: the page may explain `US$8.99 monthly / US$89 yearly` only as the current planned Family hypothesis, with billing closed. It does not activate a tier, checkout, trial, entitlement or payment-provider contract. Free map/export/security truth and safe downgrade remain intact.
- Platform decision: Web uses a responsive long document with desktop and compact layouts; iOS uses native SwiftUI safe areas, `ScrollView`, Dynamic Type and the existing `Overview / Matters / More` system shell. Shared semantics do not require pixel-identical navigation chrome.
- Evidence: source assets and hashes are registered under `assets/concepts/rillora-ui-directions-20260814/`. Combined source/implementation comparisons are `output/qa/rillora-ai-01-20260814/web-source-comparison-final.jpg` and `ios-source-comparison.jpg`. Web build, 32/32 focused tests and dependency audit pass; desktop, `390 × 844` and `320 × 568` browser checks report zero horizontal overflow and no visible interaction below `44 × 44px`. Native unit tests pass 75/75. The raw iOS matrix retains 22 PASS / 1 FAIL; the one standard-device landscape `More` observation passed unchanged in an exact 1/1 rerun, giving effective 23/23 named-slice coverage without rewriting the original run.
- Supersedes: the exact public composition and public Calm Continuity styling described in the 2026-08-13 reduced/three-module iOS entries. It does not supersede public-before-account, the non-blocking first-use contract, mobile three-destination navigation, map-not-password, Free/Family entitlement boundaries or private Calm Continuity workspace behavior.
- Does not imply: final Logo, public deployment, market validation, production payment, real invitation/release, legal effect, physical-device accessibility, localized copy or external usability approval.

## 2026-08-14 — Defer pricing until explicit paid-feature intent and reduce the public page

- Status: LOCKED for public commercial timing and public information hierarchy; exact copy and the future contextual paywall presentation remain PROVISIONAL.
- Owner correction: a truthful Free/Family comparison is still premature when placed in public navigation or the homepage. Price or plan detail should appear only after a user explicitly asks to review plans or attempts a named paid capability. The selected AI-01 long page also contained too much repeated explanation.
- Decision: public Web navigation/home, native signed-out Overview and signed-out More must not promote Plans, Family or price amounts. Keep one quiet `Free to start · No card required` reassurance near explicit creation intent. Preserve one centralized `Plan & access` destination inside the authenticated workspace and as the future contextual landing for a named Family-capability intent; do not create a generic interruption or a fourth phone tab.
- Information sequence: one practical job statement, one expandable three-part synthetic example, one compact `Death / Incapacity / Unreachable` boundary and one final action. Do not repeat the index as a second handoff, a Free feature catalogue, a Family card and a downgrade list on the same public page.
- Interaction boundary: safe example remains public; both start actions still enter Account choice, not Auth0 or payment. Existing plan/price hypotheses, Free baseline, safe downgrade and server-owned capability model remain valid but move out of public discovery.
- Evidence: before/after Web and iOS captures are in `output/qa/rillora-home-reduction-20260814/`. At `390 × 844`, Web height changes from approximately `4745px` to `2405px`, with zero horizontal overflow, no visible target below `44 × 44px` and no rendered Plans/Family/price string. Web build, 33/33 focused tests and zero-vulnerability audit pass; current-source native unit tests pass 75/75. The raw iOS matrix records 22 PASS／1 FAIL; the only unchanged SE landscape navigation observation passes an exact 1/1 rerun, and every updated signed-out commercial-deferral test passes across the named matrix.
- Supersedes: the 2026-08-13 decision to expose a comparison from public discovery and the 2026-08-14 AI-01 information sequence that placed Free/Family and exact price in the public long page. It preserves the commercial catalog, price research, public-before-account, AI-01 visual direction and map-not-password boundary.
- Does not imply: a finished contextual paywall, activated billing, validated price, market conversion evidence, staging deployment or external usability approval.

## 2026-08-15 — Let visitors sample the product before any creation prompt

- Status: LOCKED for the public-entry sequence; exact copy and market performance remain PROVISIONAL.
- Owner correction: do not write `Free to start` on the public home and do not show `Start a private plan` as soon as the visitor arrives. Recheck real polished products before refining the screen.
- Evidence: the current-run public audit found immediate Free/signup CTAs across Everplans, DGLegacy, Life Ledger and Trustworthy, while Airbnb, Notion Marketplace and 1Password's public tool demonstrate a stronger product-before-account sequence. Trustworthy's later interactive sample is useful; its immediate conversion pressure is not.
- Decision: Web and signed-out iOS first viewports show the product job, map-not-password boundary and operable architectural index. They do not show `Free`, price, or a create/start-private-plan CTA. `Account` stays visible as a utility. The safe synthetic example is discovered from the index, and the first creation CTA appears only after exploration at the bottom or when the user tries to save/adapt something private.
- Supersedes: the 2026-08-14 requirement to keep `Free to start · No card required` next to explicit public creation intent, and the earlier public composition that treated the private-plan action as a required above-fold element.
- Does not imply: hiding the Free baseline at the Account or plan-review stage, removing authentication from private data, removing the final creation path, copying any comparator's visual identity, or claiming a conversion improvement without external evidence.
- Implementation impact: remove the hero creation/example action block and all public `Free to start` reassurance, retain the index and its embedded safe synthetic sample, keep the native full safe-example action, rename the bottom action to `Create my private map`, preserve `/account` and the native Account sheet, and rerun Web/iOS responsive evidence.

## 2026-08-15 — Remove plan economics from every signed-out and Account entry

- Status: LOCKED for signed-out and identity-entry commercial timing; exact English copy remains PROVISIONAL.
- Owner correction: removing `Free to start` from the first Overview viewport was insufficient because signed-out Matters and More still made `Create or access a free plan` the most prominent action, repeated `No card is required`, and the Account sheet still used `Create free account`.
- Decision: unauthenticated Overview／Matters／More and Web／iOS Account choice use product, task and identity language only. Matters demonstrates a compact synthetic item and uses `Add a matter`; More exposes a plain `Account` row; identity offers `Create account / Sign in / Not now`. `Free`, `no card`, plan names and prices appear only in `Plan & access` after explicit plan-review or named paid-capability intent.
- Supersedes: the 2026-08-13 requirement to make Free explicit at private-plan creation and the 2026-08-15 allowance to explain Free at the Account stage. It does not supersede the permanent Free entitlement, the one-Family-tier catalog, authentication for private data, safe downgrade or contextual paid-capability prompts.
- Product reasoning: account creation does not begin billing, so the UI should demonstrate that through the absence of payment and truthful lifecycle behavior rather than solving an unraised pricing objection with a dominant Free label.
- Implementation impact: remove Free/no-card copy from native `AccountEntryView`, signed-out Matters and More, and Web `/account`; add source/UI assertions that commercial copy stays absent before a true commercial intent.

## 2026-08-15 — Make graphite the default visual system across every product surface

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; full device-matrix and external comprehension gates remain open until their evidence completes.
- Owner correction: public Overview looked like a dark premium product while Matters, More and their child routes still looked like a separate cream application. Default appearance must be dark, and child routes must be redesigned from ImageGen targets rather than receiving a background-color patch.
- Decision: signed-out roots, authenticated roots, navigation chrome, sheets, editors, guided preparation, rehearsal and export use one matte graphite system with limestone text, eucalyptus structure/current state and rust-clay primary intent. White cards, glass, gradients, neon and the earlier cream private-workspace treatment are no longer active visual truth.
- Visual evidence: the coordinated `DG-01 / DG-02 / DG-03 / DG-04` board set and hashes are registered in `docs/dark-ui-redesign-brief.md`. Generated placeholder copy, people, amounts, providers and device chrome are not adopted product facts.
- Implementation boundary: shipping UI remains native SwiftUI and semantic Web code. Product behavior, authentication, map-not-password safety, commercial timing, domain terms and accessibility identifiers remain unchanged unless a separately documented product decision requires change.
- Supersedes: only the public-dark/private-light scope split in the 2026-08-14 `AI-01` decision and the cream color treatment inherited from Calm Continuity. It preserves the product-before-account sequence, three-destination navigation, core plan hierarchy, Free/Family entitlement contract and all legal/security boundaries.
- Does not imply: final Logo, final brand typography, a user-selectable theme, physical-device accessibility, public staging deployment of these changes, external usability approval or release readiness.

## 2026-08-16 — Make Add a matter a full navigation task and simplify signed-out More

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; external comprehension and physical-device gates remain open.
- Owner correction: the selected `More` tab was too faint, the repeated `Security boundary` block added no value on the signed-out More root, and the half-height Account sheet opened by `Add a matter` did not reliably show its complete task.
- Decision: strengthen the native selected-tab foreground with a brighter eucalyptus token and filled SF Symbol while retaining Apple’s system TabView; remove the complete repeated boundary section from signed-out More; route `Add a matter` to a full Account child page inside the Matters navigation stack instead of the medium/large Detent sheet.
- Navigation boundary: the pushed Account page uses system Back, hides the Tab Bar while focused and removes sheet-only `Close / Not now` controls. Other short, dismissible Account contexts may continue using the existing sheet. Authentication, Auth0 actions and private API authorization do not change.
- Accessibility correction: at accessibility Dynamic Type sizes the Account heading steps down one relative text style and action buttons use a vertical icon/action layout. The user’s Dynamic Type setting is not capped, and the page remains scrollable.
- Evidence: `output/qa/rillora-entry-navigation-20260816/` contains final ordinary iPhone 17 Pro Max and iPhone SE largest-accessibility-size screenshots plus focused logs. Final focused tests pass `2 / 2` on the ordinary device and the complete signed-out path passes `1 / 1` on the SE at `accessibility-extra-extra-extra-large`; current-source unit tests pass `75 / 75`.
- Supersedes: only the requirement that every private-intent Account choice use a native Account sheet and the signed-out More composition that repeated three safety-boundary rows. It preserves product-before-account, commercial deferral, map-not-password truth, the three-tab information architecture and the global graphite direction.
- Does not imply: a redesigned Auth0 provider screen, a new authenticated Matter editor flow, staging deployment, physical-device accessibility, external usability approval or release readiness.

## 2026-08-16 — Separate death evidence, claimant authority and professional assistance

- Status: LOCKED for the four independent verification questions and the rule that unverified uploads cannot release data; PROVISIONAL for specific providers, professional-service partners and jurisdiction corridors.
- Context: after establishing that Apple Watch cannot prove death, the next questions were whether a friend must provide evidence, how Rillora can stop forged death certificates without building an internal document-review team, whether a Meituan-style licensed-professional path can help, and whether authoritative global sources are callable in practice.
- Decision: every real case must separately establish `DeathFactVerification`, `ClaimantIdentityVerification`, `AuthorityVerification` and `RilloraDisclosureScope`. A trusted-contact record, a single applicant statement, an obituary, a scanned certificate or one professional opinion cannot substitute for the four decisions. OCR and AI tamper checks may extract fields and raise risk but cannot upgrade an unverifiable image into authoritative evidence.
- Architecture: implement future source integrations as a provider-neutral evidence rail. Direct authorized records, verifiable signed documents and scope-limited regulated-institution attestations can support the exact fact they prove; an uploaded scan/photo remains case intake only. Prefer a push model in which a claimant or qualified institution obtains a verifiable local credential over global registry polling.
- Professional boundary: lawyers, notaries and probate practitioners may help identify the jurisdiction, obtain court/registry documents or submit a bounded structured attestation. They do not become a universal death oracle or replace courts, registries, claimant identity, planner intent and minimum disclosure. Any future Assisted Case service needs local engagement, conflict, confidentiality, insurance, referral-fee, data-role and complaints review.
- Release gate: global planning and guidance may continue, but real automated or semi-automated disclosure opens only inside a separately approved `Verified Release Corridor`. No corridor is currently approved; the non-operative rehearsal remains zero notification, zero document verification and zero release.
- Evidence: official-source synthesis and citations are preserved in `docs/death-verification-evidence-research.md`; the operative boundary is mirrored in `docs/trust-safety-legal.md`.
- Does not imply: a contracted lawyer network, government API access, verified document vendor, legal advice, production claim handling, or authorization to collect/release real information.

## 2026-08-16 — Rename native More to Profile and centralize Account there

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; exact child-page copy remains PROVISIONAL and external usability remains open.
- Owner correction: Account should not be duplicated in the signed-out Overview toolbar; the third tab can become Account or Profile, and the existing More root was too empty to justify a permanent primary destination.
- Decision: native iOS uses `Overview / Matters / Profile`. `Profile` is preferred over `Account` because the destination owns account entry plus app settings, product explanation, safety/privacy and version information; calling that entire family Account would make the non-account routes misleading. Mobile Web keeps `More` until its own contract is deliberately changed.
- Signed-out structure: remove the Overview top-right Account button. Profile contains Account, Open a safe example, How Rillora works, Safety & privacy, App settings and About Rillora. Account remains neutral and appears only when the user deliberately opens that row or expresses a private save/add/create intent; the page does not reintroduce Free, plan or price promotion.
- Authenticated structure: existing plan/access, contacts, plan context, optional setup, provider checks, rehearsals, Start Here, security and session controls remain under Profile; settings/support is added without changing API authorization or session behavior.
- Evidence: current-source unit tests pass `75 / 75`; strengthened signed-out UI regressions pass `2 / 2` on iPhone 17 Pro Max and `1 / 1` on iPhone SE 3. The first authenticated `0 / 3` attempt stopped at the unavailable synthetic QA API before product assertions and remains retained; after starting the existing isolated QA API, the exact portrait／orientation／deep-route set passed `3 / 3`, and the listener was stopped. Full evidence is in `output/qa/rillora-profile-navigation-20260816/`.
- Supersedes: only the exact native `More` label, the requirement that native Overview retain a quiet Account header utility and the intentionally sparse signed-out More composition. It preserves the three-destination limit, system TabView, public-before-account, commercial deferral and mobile Web More label.
- Does not imply: a Web navigation rename, authenticated cloud regression pass, full fresh device matrix, physical-device accessibility, external comprehension, staging deployment or release readiness.

## 2026-08-16 — Replace Profile filler with five distinct actions and one safety hub

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; exact English descriptions remain PROVISIONAL and external comprehension remains open.
- Owner correction: Profile controls were still too close in color to the canvas, several rows existed mainly to hold explanatory copy, and Safety & privacy was duplicated at the Profile root and inside App settings.
- Decision: signed-out Profile has exactly five distinct tasks: Account, Open a safe example, Safety & privacy, iPhone settings and About Rillora. Remove `How Rillora works` because the interactive Overview already owns that explanation. Remove the intermediate `App settings` page because Dark and device-controlled language were not mutable Rillora preferences; the iPhone Settings row now performs the external system action directly. Remove the authenticated passive `Security boundary` section and centralize that material in the single Safety & privacy destination.
- Safety interaction: Safety & privacy is a task hub, not a disclaimer screen. It offers a safe-information checklist and disclosure-safeguard tool; the latter progressively reveals separate death, incapacity and unreachable meanings and preserves the four independent evidence／identity／authority／scope gates. About Rillora exposes actual version and build values plus a working copy action.
- Visual decision: tappable Profile/settings rows use a dedicated `#2F3A35` action surface, filled icon tile, limestone title, readable purpose text and visible push／external accessory. Passive status and explanation rows remain quieter, so interaction is not signaled only by a low-contrast chevron. Check and prohibition rows use both different symbols and eucalyptus／clay color.
- Evidence: final current-source unit tests pass `75 / 75`; the complete signed-out path passes `2 / 2` on ordinary iPhone 17 Pro Max and `1 / 1` on iPhone SE at `accessibility-extra-extra-extra-large`. Two retained SE prerequisite failures exposed test assumptions that an offscreen lazy row must already exist and that a returned-to row must be hittable without scrolling; both were corrected with visibility-aware scrolling, not smaller text or hidden content. The iPhone Settings action was directly tapped and opened the Settings app. Evidence is in `output/qa/rillora-profile-actions-20260816/`.
- Supersedes: the exact six-entry signed-out Profile structure and four educational/settings child pages in the immediately preceding Profile decision. It preserves the `Profile` tab name, Account centralization, native NavigationStack, commercial deferral, system TabView and mobile Web `More` label.
- Does not imply: Rillora currently has notification preferences, a live privacy-policy URL, production disclosure, a full fresh five-device matrix, physical-device accessibility, staging deployment or external usability approval.

## 2026-08-16 — Remove duplicate example and taskless iPhone Settings from Profile

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; focused visual and compile evidence complete, automated UI rerun intentionally withheld.
- Owner correction: the safe example was still duplicated inside Profile even though Overview already owns product exploration, and a generic `iPhone settings` jump did not complete a named Rillora task. A row that merely opens another app is not meaningful product functionality.
- Decision: signed-out Profile has exactly three tasks: Account, the single Safety & privacy hub and About Rillora. The synthetic example remains available from Overview and first-use contexts; it is removed only from Profile. Remove the iPhone Settings shortcut from signed-out and authenticated Profile. Do not replace either row with another filler item.
- Product rule: a future system-settings deep link may appear only contextually beside a real permission-dependent capability, with the exact permission/state named and a clear recovery task—for example after the user has enabled a notification capability and notifications are disabled. Profile must not expose a generic device-settings route in anticipation of capabilities Rillora does not yet ship.
- Composition: rename the residual group from `Privacy & settings` to `Rillora`, shorten supporting descriptions, preserve the higher-contrast action surface and keep Safety and About as working NavigationStack destinations.
- Evidence: the final Rillora build installs on the ordinary iPhone 17 Pro Max; current-source unit tests pass `75 / 75`; both `Rillora` and `RilloraLayoutMatrix` schemes compile. `output/qa/rillora-profile-simplification-20260816/profile-signed-out-17-pro-max.png` records the three-task Profile. The temporary Debug-only Profile start used to capture it was reverted to the normal Overview default and rebuilt.
- Automation boundary: current iOS 26.5 crash reports show SpringBoard failing in `XCTAutomationSession` during accessibility automation. The UI-test assertions were updated to require the removed rows to be absent, but the UI suite was not run in this workstream; no UI-test pass is claimed.
- Supersedes: the exact five-task structure and direct iPhone Settings action in the immediately preceding Profile decision. It preserves the `Profile` tab name, one Safety hub, About functionality, action contrast, native TabView/NavigationStack and public-before-account sequence.

## 2026-08-17 — Make every native Account entry a full child page

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; focused ordinary-device runtime evidence complete, fresh device／Dynamic Type automation remains open.
- Owner correction: changing only `Add a matter` was incomplete. Profile still opened Account as a bottom sheet, so the task could be clipped and the same destination behaved differently depending on where it was entered.
- Decision: every native Account trigger uses a full pushed child page inside the originating tab's independent `NavigationStack`. This includes the Profile Account row, Overview's final private-map intent, `Add a matter`, and save／adapt after the public synthetic example. The public example itself and optional guide may remain sheets; dismissing the example before an Account intent completes first, then the Overview stack pushes Account.
- Navigation contract: the Account page has a system Back action, an inline `Account` title, a scrollable body, no visible Tab Bar while focused and no sheet drag handle, `Close` or `Not now`. Successful authentication clears the originating path and returns to authenticated Overview. The neutral `Create account / Sign in` actions, commercial deferral and Auth0 behavior do not change.
- Evidence: the ordinary iPhone 17 Pro Max runtime semantic snapshot exposes only `Profile` Back, `Create account`, `Sign in` and the Account scroll view; `output/qa/rillora-account-navigation-20260817/profile-account-child-page.jpg` records the complete child page. The Rillora app builds, installs and launches; current-source unit tests pass `75 / 75`; the RilloraLayoutMatrix scheme compiles with updated assertions for all four Account routes.
- Automation boundary: the UI suite was not executed because the current iOS 26.5 runtime has a retained SpringBoard crash in `XCTAutomationSession`. Compile, semantic runtime inspection and one ordinary-device screenshot do not prove SE／maximum Dynamic Type, VoiceOver, physical-device behavior or a fresh complete matrix.
- Supersedes: the 2026-08-16 allowance for Profile, example or other “short” Account contexts to use a dismissible sheet, and the narrower decision that only `Add a matter` required a pushed page. It preserves sheets for non-Account public examples／optional guides, per-tab native navigation, public-before-account and all privacy／commercial boundaries.

## 2026-08-17 — Remove unreadable repeated safety captions from Overview and Account

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY; ordinary-device visual and compile evidence complete.
- Owner correction: the small uppercase event labels plus disclaimer under the public event boundary, and the caption safety footer below Account actions, did not need emphasis and were difficult to read in real use.
- Decision: remove both caption groups rather than making them louder. Public Overview keeps the readable `Three events. Three separate processes.` heading and moves directly to `Make this map yours.`; Account ends after `Create account / Sign in`. Do not replace the removed material with icons, badges, smaller footnotes or another passive card.
- Information boundary: this is de-duplication, not a change to safety truth. `Directions, not passwords.` remains a readable public principle, while detailed password／secret and separate-event boundaries remain in Safety & privacy and the relevant planning／disclosure tasks.
- Evidence: `output/qa/rillora-small-copy-pruning-20260817/overview-without-repeated-small-copy.jpg` and `account-without-footer-copy.jpg` record the ordinary iPhone 17 Pro Max result. Rillora builds, installs and launches; current-source unit tests pass `75 / 75`; RilloraLayoutMatrix compiles with absence assertions for the removed strings.
- Automation boundary: the current iOS 26.5 `XCTAutomationSession`／SpringBoard fault still prevents claiming a newly executed UI matrix. The screenshots and semantic inspection do not prove physical-device accessibility, localization or external comprehension.
- Supersedes: only the exact Overview caption trio／disclaimer and Account map／secret footer. It preserves the event-state contract, map-not-password product rule, full Account child-page navigation and Safety task ownership.

## 2026-08-17 — Retire prototype examples and make 01 the real product default

- Status: OWNER-DIRECTED and IMPLEMENTED LOCALLY across shipping Web/iOS surfaces; focused runtime, build and unit evidence complete.
- Owner correction: the architectural index repeatedly entered with `02` selected, and `Synthetic example / Safe example / Explore an example` made the application feel like a prototype instead of a product moving toward release.
- Decision: every public Overview enters with `01 · What exists` expanded. The three expandable rows describe real capabilities and their boundaries; they do not expose invented personal records, an example label, a preview CTA or a demonstration sheet. This is not a vocabulary swap from `example` to `preview`.
- Scope: remove the public example sheet, its Account-after-example state, the first-use example sheet, the third first-use choice, the prefilled demonstration `MatterDraft`, signed-out Matters' fake insurance record, Web example drawer, related callbacks, routes, CSS and accessibility identifiers. First use now offers exactly two paths: add a real Matter or use the optional resumable guide. Signed-out Matters explains the real four-part Matter structure rather than impersonating saved data.
- Safety/product boundary: public-before-account remains intact, no fake private plan is created, no private API is read, and `Directions, not passwords.` remains. Detailed safety information stays contextual instead of being attached to fictional records.
- Evidence: ordinary iPhone 17 Pro Max runtime semantics report index 01 `Expanded` and 02/03 `Collapsed`; switching to 02 reverses only those states. `output/qa/rillora-real-product-index-20260817/` records Overview and Matters. Rillora builds, installs and launches; iOS unit tests pass `75 / 75`; Web production build and all focused Web tests pass `34 / 34`; RilloraLayoutMatrix compiles with updated default/absence assertions.
- Automation boundary: the current iOS 26.5 `XCTAutomationSession`／SpringBoard fault remains, so no fresh XCUITest device／Dynamic Type matrix is claimed. No staging deployment, Auth0/API/payment change, external test or real-data handling occurred.
- Supersedes: all prior current-composition decisions that kept public or first-use synthetic/safe examples, including their role in Profile, Account routing and the three-path first-use contract. It preserves the architectural index, deferred Account/price timing, two-step optional guide, real Matter creation, map-not-password and all legal/safety boundaries.

## 2026-08-17 — Brand Auth0 Universal Login without moving credentials into Rillora

- Status: OWNER-APPROVED ARCHITECTURE and VERSIONED LOCAL IMPLEMENTATION; development-tenant apply and live prompt verification remain pending Owner Auth0 CLI authorization.
- Owner decision: the generic Auth0 signup sheet is not an acceptable finished product surface. Proceed with the recommended Rillora-owned authentication experience while preserving Auth0 as the identity provider.
- Architecture: keep New Universal Login, Code + PKCE, the verified `login.rillora.xyz` custom domain and Auth0-owned password／passkey／social／recovery／challenge handling. Add a Rillora Liquid Page Template around the supported Auth0 widget, a full graphite widget theme and narrowly scoped prompt text. Do not embed a password form in SwiftUI/Web, proxy credentials through the Rillora API or use Resource Owner Password Grant.
- Plan boundary: use Theme + Page Template on the current Free development tenant. ACUL is not a current dependency because Auth0 currently makes it a paid-tenant Early Access capability and it adds Rillora-hosted CDN/CI assets to the authentication attack and availability surface. Reconsider it only for a demonstrated prompt requirement the supported hosted controls cannot meet.
- Visual decision: authentication uses the existing `#171C1C / #1D2322 / #F1ECE2 / #DAD8CF / #9BB180 / #CB704C` graphite system. Desktop has one restrained editorial brand panel and one task panel; compact widths remove the editorial panel and keep only the Rillora text wordmark plus the authentication task. The Auth0 widget logo stays hidden because the final Rillora symbol remains unresolved. No white card, gradient, glow, security illustration, Free／price copy or registration-onboarding questionnaire is introduced.
- Accessibility boundary: the clay Auth0 primary button uses graphite label text for normal-text contrast; mobile layout is scrollable and locally checks without horizontal overflow at 320px and 390px. Auth0 internal generated classes and private DOM are not styled.
- Source: `docs/authentication-experience.md`, `infra/auth0/universal-login/theme.json`, `page-template.liquid`, the local non-authenticating `preview.html` and `tools/auth0/apply-universal-login.sh` provide the product contract, versioned desired state, readback and rollback sequence.
- Current evidence: the local visual fixture was directly inspected at 390px and desktop; DOM metrics show no horizontal overflow at 320／390／1440px. JSON, required Liquid tags and apply-script syntax pass local checks. This does not prove that Auth0 accepted the configuration or that any live prompt changed.
- Does not imply: production identity, a final logo, ACUL adoption, Sign in with Apple, real signup/recovery email delivery, physical-device behavior, localization, full accessibility conformance, App Store compliance or release readiness.

## 2026-08-17 — Deploy and live-check the branded Auth0 development-tenant experience

- Status: IMPLEMENTED AND READ BACK on the Auth0 EU development tenant; live no-credential Web/iOS route checks complete; production and full credential regression remain open.
- Owner authorization: Owner completed the official Auth0 CLI device authorization and approved continuing with the recommended hosted-login direction. The Agent did not read or enter the Owner's Auth0, email, Google, password or MFA credentials.
- Deployment decision: preserve the New Universal Login architecture and apply the versioned Graphite theme, shared Liquid template and five scoped English custom-text dictionaries to `rillora-dev.eu.auth0.com`. The first apply found no default theme or page template, recorded those absence states, created theme `GpJAJlTXdfUIS8CxG2bjw5EnI3NZEceJ`, then required post-write readback. Future applies update the exact returned theme id; they do not assume a default already exists.
- Interaction correction: use an empty data-URI favicon while identity remains unresolved, and raise visible inline account-switch／recovery links through semantic `a` and `button` selectors to a 44px minimum. Do not target Auth0 private generated classes or hide provider warnings.
- Live evidence: browser checks reached signup, login and password-recovery request on `login.rillora.xyz`; signup at 320／390／1440px had no horizontal overflow and the checked compact login/recovery controls were at least 44px. Staging Web `/account` reached both custom-domain identity prompts. Native iOS Create account and Sign in reached `Create your account` and `Welcome back` in the system authentication session, and cancelling each returned to the complete Account child page without an alert. Evidence is indexed by `output/qa/rillora-auth0-live-20260817/README.md`.
- Google boundary: the visible Auth0 Dev Keys warning is accurate because the current Google connection still uses Auth0 development keys. It must remain visible. Production social login requires an Owner-controlled Google OAuth client and separate consent/callback/error/logout verification.
- Untested boundary: no identifier, password, MFA code or Google credential was submitted; no account was created; no authenticated callback, password, passkey, Google, recovery delivery, email verification, challenge or logout flow was completed in this workstream.
- Supersedes: only the immediately preceding entry's `local implementation / remote apply pending` status. It preserves Auth0-owned credentials, custom-domain browser chrome, no embedded login, no ROPG, no ACUL dependency, public-before-account and all commercial/safety boundaries.
- Does not imply: production identity, physical-device behavior, complete accessibility or localization, real email delivery, App Store readiness, security certification or release approval.

## 2026-08-17 — Use native Apple plus hosted credentials on iOS

- Status: OWNER-DIRECTED ARCHITECTURE and LOCAL PREFLIGHT IMPLEMENTED; Apple Developer and Auth0 external enablement remain CLOSED.
- Owner correction: a branded Auth0 page inside `ASWebAuthenticationSession` still looks like an external login because it is an external user-agent. The earlier plan to add Apple login had not been implemented or configured and must not be described as complete.
- Decision: iOS uses a hybrid identity chooser. `Continue with Apple` uses Apple's native `AuthenticationServices` authorization and Auth0 native-social token exchange; email/password/passkey/recovery continue on the verified hosted domain. Web remains hosted. Do not add a SwiftUI password form merely to hide browser chrome.
- Session contract: Auth0 exchanges the Apple authorization code and returns an access token for `urn:rillora:api`; iOS then reuses the existing `/auth/native/session` exchange and Keychain-backed opaque Rillora session. Apple does not create a second authorization/session model.
- App Store boundary: because the iOS experience currently offers Google as a primary-account social method, an equivalent privacy-preserving login option is required unless the product removes that social method or qualifies for a documented exception. Native Sign in with Apple is the selected route; this is not a claim of App Store approval.
- Fail-closed rule: the system Apple button is hidden unless `RilloraAppleSignInEnabled` is explicitly true. It remains false in Debug and Release until the Apple App ID/capability, development team, dedicated Apple key, Auth0 Apple connection, native-social device setting and real native callback all pass. No placeholder button or browser-only Apple test may satisfy this gate.
- Local implementation: add the Apple entitlement, system button integration, authorization-code validation, Auth0 `login(appleAuthorizationCode:)` exchange and two explicit feature-gate tests. Current-source iOS tests pass `77 / 77`.
- External finding: the Auth0 tenant currently has no Apple connection and the iOS client has no native Apple setting. The Apple Developer team is reachable but resource access is blocked until the Owner accepts the current Program License Agreement. No key was created, downloaded, uploaded or written to the repository.
- Supersedes: only the assumption that hosted branding could by itself feel fully native and the unresolved promise that Apple login was already part of the current iOS surface. It preserves Auth0 as identity authority, hosted credential entry, public-before-account and all existing Rillora session/security boundaries.
- Does not imply: a working Apple login, account linking, physical-device behavior, production signing, App Store compliance, release evidence or permission to accept legal agreements on the Owner's behalf.

## 2026-08-17 — Register the Rillora Apple App ID without opening the login gate

- Status: APP ID AND CAPABILITY REGISTERED; Apple key, Auth0 connection, native client setting and callback remain CLOSED.
- Owner action: the Owner personally accepted the current Apple Developer Program License Agreement. The Agent did not accept or represent acceptance of a legal agreement.
- External change: after an action-time confirmation, register the explicit App ID `com.rillora.ios` under Apple Developer team `8L99CFNK24`, enable `Sign in with Apple`, and configure it as the primary App ID. Direct configuration readback confirms the checked capability and primary status.
- Local change: set the Rillora application target's `DEVELOPMENT_TEAM` to `8L99CFNK24` and `CODE_SIGN_STYLE` to `Automatic` in `apps/ios/project.yml`, regenerate the Xcode project, and pass a Debug Simulator build with code signing disabled.
- Credential boundary: the dedicated key form may be prepared, but the key must not be registered, downloaded or submitted to Auth0 until the Owner gives a separate immediate confirmation. The `.p8` private key must never enter the repository, shell output, browser storage or project logs.
- Fail-closed result: `RilloraAppleSignInEnabled` remains `NO` in Debug and Release. Registration of an App ID does not establish an Auth0 Apple connection, native token exchange, account linking, signed-device behavior, App Store compliance or release readiness.
- Supersedes: only the previous finding that Apple Developer access was PLA-blocked and that no App ID/capability mutation had occurred. It preserves the hybrid identity architecture and every remaining external verification gate.

## 2026-08-17 — Create the dedicated Apple key but stop at Owner-only Auth0 consent

- Status: APPLE KEY CREATED AND AUTH0 NATIVE CLIENT SETTINGS VERIFIED; Apple connection, private-key submission and callback remain CLOSED.
- Authorized change: after the Owner explicitly confirmed the full sensitive-credential sequence, register `Rillora Auth0 Development` for the Rillora primary App ID. Apple reports Key ID `9H3JRBA558` and marks the one-time `.p8` as downloaded.
- Auth0 client change: patch only the `Rillora iOS` native client with `mobile.ios.team_id=8L99CFNK24`, `mobile.ios.app_bundle_identifier=com.rillora.ios`, and `native_social_login.apple.enabled=true`; direct Management API readback matches all three values.
- Download boundary: Chrome's protected download surface did not expose the downloaded `.p8` path to the Agent. Do not inspect browser profiles, bypass the browser policy, recreate another key or revoke the current key. The Owner must locate the download without pasting its contents into chat.
- Legal boundary: creating the Auth0 Apple integration displays consent to Apple and Auth0 Marketplace terms. The Agent must not accept this on the Owner's behalf, even though the technical connection work is authorized. Connection creation therefore stops until the Owner personally clicks `Continue`.
- Fail-closed result: the Apple connection is still absent and `RilloraAppleSignInEnabled` remains `NO`. Client metadata alone does not prove native token exchange, account linking, logout, physical-device signing, App Store compliance or release readiness.

## 2026-08-17 — Store the dedicated Apple key in one Auth0 iOS connection

- Status: AUTH0 APPLE CONNECTION CREATED AND READ BACK; local key deletion and native callback remain OPEN.
- Owner actions: the Owner personally accepted the Auth0 Marketplace consent, located the one-time Apple key download and gave an immediate confirmation identifying the exact private key, Auth0 EU tenant and Rillora iOS destination before transmission. The Owner also personally approved the CLI device-code request for the connection-management scopes required by the API.
- Connection decision: create exactly one `apple` connection, id `con_W01eaZ5ruegFXB4T`, with Team ID `8L99CFNK24`, Key ID `9H3JRBA558`, Apple `email name` scope and `on_each_login` root-attribute synchronization. Bind it only to native client `Rillora iOS / HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ`; do not enable the Web client or a domain-level connection.
- Credential handling: read the owner-only `.p8` from its explicit Downloads path and stream it to the Auth0 Management API without printing it or writing a JSON request artifact. Readback may assert only secret presence and non-secret option keys; it must never return the private-key value to logs or documentation.
- Evidence: independent connection readback confirms Team ID, Key ID, `email name` scope and stored-secret presence. The current Auth0 clients endpoint returns only the Rillora iOS client, and separate client readback confirms Team ID `8L99CFNK24`, bundle identifier `com.rillora.ios` and native Apple enabled.
- Fail-closed result: external configuration is necessary but not sufficient. `RilloraAppleSignInEnabled` remains `NO` until the local key-copy deletion is resolved and a bounded Debug native callback test is prepared. Release remains closed until native authorization, Auth0 exchange, Rillora session/private-plan load, cancellation, logout, account-linking policy and physical-device/release gates have their own evidence.

## 2026-08-17 — Retain the local Apple key only in an ignored restricted directory

- Status: OWNER-DIRECTED LOCAL RETENTION; implemented with repository and build exclusion.
- Superseding direction: the Owner no longer wants the downloaded `.p8` deleted. Retain one local copy inside the project folder without turning it into a source-controlled project asset.
- Storage decision: move the file from Downloads to `.local-secrets/apple/AuthKey_9H3JRBA558.p8`; ignore the whole `.local-secrets/` tree in the repository root, set the directory to mode `0700` and the file to mode `0600`.
- Verification: the original Downloads path is absent; `git check-ignore` resolves the new file to the explicit root rule; full Git status does not list the directory or filename; current application, infrastructure, tool and QA configuration contains no reference that would package or deploy it.
- Security boundary: Git ignore and POSIX permissions reduce accidental disclosure but do not encrypt the key, provide rotation, create a backup or make it safe for cloud synchronization. The key must never be committed, attached to a ticket, copied into documentation, emitted by a command, placed in an Xcode target or included in a deployment artifact.
- Supersedes: only the earlier intent to delete the local key after Auth0 readback and the prior statement that deletion blocked callback preparation. It does not weaken the real native-callback, account-linking, logout, physical-device or Release gates.

## 2026-08-17 — Open native Apple only in Debug for the first real callback

- Status: DEBUG ENTRY ENABLED AND LOCALLY VISIBLE; authorization and callback remain UNVERIFIED; Release remains CLOSED.
- Gate decision: after App ID, key, Auth0 connection, sole-client binding, native client metadata and local key isolation all passed exact readback, set only the Debug `RILLORA_APPLE_SIGN_IN_ENABLED` build setting to `YES`. Keep Release at `NO`.
- Runtime evidence: regenerate the Xcode project, build/install/launch on the configured iPhone 17 Pro Max Simulator and verify Profile → Account exposes the system `Continue with Apple` target with accessibility identifier `account-entry.apple`. Current-source unit tests pass `77 / 77`.
- Release evidence: a separate Release Simulator build succeeds, and its built Info.plist resolves `RilloraAppleSignInEnabled` to `NO`.
- Human-authentication boundary: the Agent must not select or expose the Owner's Apple identity, email, relay choice, password or verification challenge. The Owner initiates and controls the real system authorization; subsequent validation may inspect only product state, Auth0 status/log classification and Rillora session behavior needed for the requested test.
- Does not imply: Apple authorization success, token exchange, account creation or linking, private-plan access, cancellation, logout, physical-device signing, App Store compliance or release approval.

## 2026-08-17 — Group Apple and Google before the email account paths

- Status: LOCKED UX; LOCAL IMPLEMENTATION VERIFIED; PROVIDER CALLBACKS REMAIN OPEN.
- Scope: signed-out native iOS Account identity chooser.
- Decision: Apple and Google are peer identity-provider actions in one adaptive group above a single `or use email` divider. On a sufficiently wide device they appear side by side; narrower widths stack the same controls without shrinking either below 44 points. `Create account` and `Sign in` remain the separate hosted email paths below the divider.
- Implementation truth: Apple remains native `AuthenticationServices`. Google remains Auth0 Web Auth, but the visible Google action passes the exact `connection=google-oauth2` authorization parameter and therefore enters that provider directly instead of reopening the generic method chooser. Do not label Google as native until a separately configured native Google SDK/token exchange exists.
- Brand boundary: use Google's current pre-approved iOS light-pill asset at its original `188 × 44` ratio; do not redraw, recolor or stretch the Google mark. The Apple control remains Apple's system component.
- Evidence: Auth0 read-only state contains active connection `google-oauth2 / con_p2UWW5YMzXUaTZhM`; the current iPhone 17 Pro Max runtime exposes `account-entry.apple`, `account-entry.google`, `account-entry.create` and `account-entry.sign-in`. Final Debug build/install/launch succeeds and current-source unit tests pass `77 / 77`. Screenshot and evidence index are in `output/qa/rillora-account-social-group-20260817/`.
- Intermediate correction: adding the first Asset Catalog caused Xcode to infer an unresolved `AppIcon` name. Because the Rillora logo remains unapproved, the generated-project source explicitly leaves `ASSETCATALOG_COMPILER_APPICON_NAME` empty rather than creating a fake app icon; the final build and tests then pass.
- Supersedes: only the single Apple button presentation and the indirect Google method choice inside the generic hosted prompt.
- Does not imply: Google credential submission, Google callback, Owner-controlled production Google OAuth keys, Apple authorization, account linking, physical-device evidence, Release enablement or App Store approval.

## 2026-08-17 — Treat the current Apple key as exposed after over-broad CLI readback

- Status: BLOCKING SECURITY GATE; ROTATION REQUIRES OWNER ACTION-TIME CONFIRMATION.
- Scope: current Apple signing key used by the Auth0 development Apple connection; not the Apple ID password or App Store signing certificate.
- Incident: a read-only `auth0 api get connections` inventory returned broader connection options than the requested safe field set and included long-lived Apple credential material in the local Agent tool output. The value is not repeated in source, documentation, QA artifacts or the user-facing response, but the session trace violates the locked no-output/no-log boundary.
- Decision: treat the current key as exposed. Do not perform a real Apple authorization or enable Release with it. Keep the Debug control only for non-authenticating layout inspection until rotation completes.
- Required remediation: after fresh Owner confirmation, create a replacement Apple key for the same primary App ID, update the existing Auth0 Apple connection without printing the secret, read back only non-secret identifiers/presence, revoke the old Apple key and replace the ignored owner-only local copy. Verify Auth0 native client binding again before callback testing.
- Current action boundary: no key was deleted, revoked, created, uploaded or replaced in this workstream because those are destructive external credential changes. The existing local file remains where the Owner directed.
- Evidence: no-secret incident record at `output/qa/rillora-apple-key-exposure-20260817/README.md`.
- Does not affect: the Apple/Google Account layout, Google connection route, email authentication, API data, the Release-closed setting or the no-password product boundary.

## 2026-08-17 — Put email actions first and stack Apple above Google

- Status: LOCKED UX; LOCAL IMPLEMENTATION VERIFIED.
- Scope: signed-out native iOS Account action order and provider layout.
- Owner correction: the horizontal Apple/Google row remains visually awkward. Move both provider actions below the email actions and never render them side by side.
- Decision: the fixed order is `Create account` → `Sign in` → `or continue with` → `Continue with Apple` → `Sign in with Google`. Apple and Google are always a centered vertical stack at the official `188 × 44` provider-control size; the layout no longer switches to a horizontal row on wide iPhones.
- Implementation: remove `ViewThatFits` and the social-first `or use email` structure. Preserve the same real Apple and Google handlers, identifiers, brand assets, 44-point targets, hosted-email boundary and provider-specific authentication truth.
- Evidence: current iPhone 17 Pro Max runtime semantic order is `account-entry.create`, `account-entry.sign-in`, `account-entry.apple`, `account-entry.google`; Debug build/install/launch succeeds, current-source unit tests pass `77 / 77`, and the RilloraLayoutMatrix scheme compiles with explicit frame-order assertions. Evidence is indexed by `output/qa/rillora-account-entry-order-20260817/`.
- Supersedes: the immediately preceding decision to place Apple/Google above email and allow a wide horizontal provider row. It does not supersede provider parity, official brand assets, Google `google-oauth2` routing or the Apple credential-rotation gate.
- Does not imply: Apple/Google callback success, provider account linking, production Google OAuth, Release Apple enablement or App Store approval.

## 2026-08-17 — Make provider controls full-width and replace the incompatible Google SVG

- Status: LOCKED VISUAL CORRECTION; LOCAL IMPLEMENTATION VERIFIED.
- Scope: signed-out native iOS Account provider-control proportions and Google brand rendering only.
- Owner finding: the centered `188 × 44` provider pills are too small relative to the full-width account actions, and the visible Google mark is malformed rather than the recognizable official multicolor `G`.
- Root cause: the selected current Google SVG contains `foreignObject`, filters and an angular gradient that Xcode's Asset Catalog renderer does not reproduce correctly. Preserving the file's nominal aspect ratio did not preserve its actual on-device appearance.
- Decision: Apple and Google remain a vertical stack below email, but both now fill the Account content column at `54pt` high with the same `15pt` corner radius and spacing. Apple remains the system `SignInWithAppleButton`. Google uses the unscaled multicolor `G` and outlined Google Sans label from Google's current official iOS PNG branding bundle inside a white control with the prescribed `#747775` border. Do not restore the incompatible SVG, a hand-drawn mark or intrinsic-width pills.
- Dependency decision: do not add the Google Sign-In authentication SDK only to paint a button while Auth0 remains the actual Google authorization/session route. The official static brand resource is sufficient for this surface and avoids a second identity stack.
- Regression contract: runtime order stays `create / sign-in / apple / google`; Apple and Google frames must be equal in width and height, and the provider width must be at least 95% of the primary Account action width on the checked device.
- Evidence: Debug build/install/launch succeeds, current-source unit tests pass `77 / 77`, the RilloraLayoutMatrix scheme compiles with the new sizing assertions, and the iPhone 17 Pro Max visual is indexed by `output/qa/rillora-account-provider-proportion-20260817/`.
- Supersedes: only the preceding `188 × 44` intrinsic-width provider sizing and SVG asset-format choice. It preserves provider order, Auth0 Google routing, native Apple architecture, the Apple credential-rotation gate and Release closure.
- Does not imply: Apple or Google callback success, production Google OAuth credentials, account linking, physical-device evidence, App Store approval or permission to use provider credentials during visual QA.

## 2026-08-17 — Synchronize Account verbs, type scale and center axis

- Status: LOCKED VISUAL AND COPY CORRECTION; LOCAL IMPLEMENTATION VERIFIED.
- Scope: signed-out native iOS Account action labels and alignment only.
- Owner finding: the provider controls used different verbs and visibly different type scales, while the upper email-action labels were offset by their leading and trailing decoration instead of sharing the centered axis used below.
- Decision: Apple and Google both use the `Sign in with …` verb, with a single `or sign in with` divider. The official Google iOS raster content is uniformly scaled from its `156 × 20` logical content size to `195 × 25` so its rendered label has the same visual type scale as the system Apple control; its aspect ratio, multicolor `G`, outlined Google Sans lettering, white background and prescribed border remain unchanged.
- Alignment contract: `Create account` and `Sign in` labels are centered against the full button frame. Leading symbols and trailing arrows are decorative edge affordances and must not shift the text axis. At accessibility Dynamic Type sizes, omit those decorative symbols so the centered label can wrap without collision.
- Regression contract: runtime labels are exactly `Create account`, `Sign in`, `Sign in with Apple` and `Sign in with Google`; the four action centers share the content-column center axis, and the two provider frames remain equal in width and height.
- Evidence: Debug build/install/launch succeeds, current-source unit tests pass `77 / 77`, the RilloraLayoutMatrix scheme compiles with exact-label and center-axis assertions, and the runtime semantic snapshot exposes both synchronized provider labels. Screenshot and evidence index are in `output/qa/rillora-account-label-alignment-20260817/`.
- Supersedes: only the mixed `Continue with Apple` / `Sign in with Google` copy, the `or continue with` divider, the smaller Google label rendering and the left-biased email-action label layout. Authentication handlers, provider order, official brand ownership and security gates are unchanged.
- Does not imply: Apple or Google callback success, production Google OAuth credentials, account linking, physical-device evidence, App Store approval or permission to use provider credentials during visual QA.

## 2026-08-17 — Separate the Google mark from its label to match Apple type visually

- Status: LOCKED VISUAL CORRECTION; LOCAL IMPLEMENTATION VERIFIED.
- Scope: signed-out native iOS Google provider rendering and brand-resource packaging only.
- Owner rejection: uniformly enlarging the complete official Google raster still left its label visibly smaller than the system Apple label, while further whole-image enlargement would make the already-prominent Google G too large. The preceding screenshot is therefore not the accepted visual result.
- Decision: do not render a complete `G + label` raster. Compose the Google control from two independently constrained official elements: the current official multicolor G at `20 × 20pt`, and `Sign in with Google` in bundled `GoogleSans-Medium` at a fixed `20pt`. Keep `12pt` spacing, white fill, `#747775` one-point border, `54pt` outer height and the same centered group axis as the Apple system control.
- Resource boundary: the G is cropped mechanically from Google's current pre-approved iOS light asset without redrawing or recoloring it. `GoogleSans-Medium.ttf` is fetched from the current official Google Fonts delivery endpoint and registered through `UIAppFonts`; it is used only for this provider label.
- Regression contract: the Google button must continue to expose `Sign in with Google`; the official font and G asset must both load from the application bundle; Apple and Google outer frames remain equal; provider order and authentication handlers do not change.
- Evidence: Debug build/install/launch succeeds, current-source unit tests pass `78 / 78`, including brand-resource bundle checks; the RilloraLayoutMatrix scheme compiles; runtime semantics retain both synchronized labels. The accepted visual and evidence index are in `output/qa/rillora-account-provider-type-match-20260817/`.
- Supersedes: only the preceding `195 × 25` complete Google-content raster and its claim of a matched provider type scale. It preserves the unified `Sign in with …` copy, geometric centering, official provider marks, native Apple architecture, Auth0 Google route and every existing security gate.
- Does not imply: Google or Apple callback success, Google app-verification acceptance, production Google OAuth credentials, account linking, physical-device evidence, App Store approval or Release readiness.

## 2026-08-17 — Align all four Account actions to one visual type system

- Status: LOCKED DEFAULT-SIZE VISUAL CORRECTION; LOCAL IMPLEMENTATION VERIFIED.
- Scope: signed-out native iOS Account action typography at the checked default text size.
- Owner finding: the first separated Google label corrected its size, but Google Sans Medium still read lighter than the system Apple label, while `Create account` and `Sign in` retained the smaller default body size. The four actions therefore still lacked one hierarchy.
- Decision: use a `20pt` semibold visual baseline for all four Account actions. `Create account` and `Sign in` use SF Semibold at an explicit fixed `20pt`; Apple remains the unmodified system `SignInWithAppleButton`; Google uses the official Google Sans family at `20pt` with the separately bundled SemiBold weight and the unchanged current multicolor G. Preserve each provider's typeface and mark while matching visible size and stroke weight.
- Brand-review boundary: Google's published custom-button reference names Google Sans Medium. SemiBold is a deliberate prototype visual-parity correction within the official family, not proof of Google app-verification acceptance. Before production submission, confirm the final weight through provider-brand review rather than silently reverting the UI or claiming compliance.
- Regression contract: the four labels remain geometrically centered, their outer controls remain `54pt` high, provider frames stay equal, semantic labels and authentication handlers do not change, and the bundled `GoogleSans-SemiBold` plus `GoogleGLogo` must load successfully.
- Evidence: Debug build/install/launch succeeds, current-source unit tests pass `78 / 78`, RilloraLayoutMatrix build-for-testing compiles and runtime semantics retain all four actions. The accepted default-size screenshot and evidence index are in `output/qa/rillora-account-action-type-system-20260817/`.
- Supersedes: only the preceding Google Sans Medium weight and the smaller implicit font used by the two email actions. It preserves provider order, unified copy, centering, native Apple architecture, Auth0 Google route and all credential, callback and Release gates.
- Does not imply: complete Dynamic Type matrix evidence, Google brand approval, provider callback success, production OAuth credentials, account linking, physical-device evidence, App Store approval or Release readiness.

## 2026-08-17 — Let Universal Login own the identity chooser

- Status: LOCKED IOS ENTRY AND PROVIDER-OWNERSHIP DECISION; DEVELOPMENT-TENANT VISUAL DEPLOYED.
- Owner decision: because the Auth0 system session already contains email, passkey, Google and Apple, remove the duplicate native Account child page and all four outer identity controls. Signed-out Profile instead begins with one FanPass-like `Sign in / Sign up` action; it and genuine private-plan intents open `login.rillora.xyz` directly. App launch remains public-first.
- Provider ownership: Universal Login is the only current iOS provider chooser. The native shell must not independently tune or duplicate Apple/Google labels, type, ordering or authentication handlers. Previously implemented native-Apple exchange code remains dormant and fail-closed with no signed-out product entry.
- Hosted visual correction: use Auth0's stable `data-provider="apple"` attributes to render only the monochrome Apple glyph white on the graphite page. Preserve Google's multicolor mark. Do not target generated class names.
- Warning boundary: the upper-right coral exclamation is Auth0's `Dev Keys` warning for the current Google development-key connection. It stays visible until an Owner-controlled Google OAuth client is configured and separately verified; hiding it would falsify environment state.
- Supersedes: the Account child-page navigation default, the outer native Apple/Google provider group and the later typography/proportion corrections for that removed group. Their source and evidence remain historical rather than current UI authority.
- Evidence: current-source unit tests pass `77 / 77`; focused signed-out Profile/Matters/Safety/About and commercial-deferral UI tests pass `2 / 2` on iPhone 17 Pro Max. The live `390 × 844` hosted prompt has no horizontal overflow, Apple computes to the white filter and Google remains colored. Evidence is indexed in `output/qa/rillora-direct-hosted-auth-20260817/README.md`; tenant readback is in `output/qa/rillora-auth0-universal-login-20260817T151918Z/`.
- Does not imply: Apple or Google authorization success, callback/session success, production Google OAuth credentials, Apple key rotation, account linking, physical-device evidence, App Store approval or Release readiness.

## 2026-08-18 — Use one Owner-controlled Google OAuth client through Auth0

- Status: LOCKED IDENTITY ARCHITECTURE; DEVELOPMENT-TENANT CONFIGURED; CALLBACK OPEN.
- Scope: Google OAuth ownership, redirect boundary, Auth0 application binding and release evidence.
- Decision: use one dedicated Google Cloud Web OAuth client in project `rillora-identity` with Auth0 custom domain `login.rillora.xyz` as the only JavaScript origin and `https://login.rillora.xyz/login/callback` as the only Google redirect. Auth0 remains the broker and method chooser; Rillora Web and iOS do not receive or store the Google client secret.
- Least-privilege boundary: request only `openid / email / profile`. Enable the Auth0 Google connection for exactly `Rillora Web` and `Rillora iOS`; disable `Default App` instead of accepting an implicit third consumer.
- Evidence: sanitized Auth0 readback confirms client id/secret presence, `email / profile` scope and exactly two enabled clients. Live Web and iOS-client prompts have no development-key warning, both Google actions reach the official Google account chooser under the Rillora name, and neither shows `redirect_uri_mismatch` or access blocking. Evidence is indexed in `output/qa/rillora-google-oauth-20260818/README.md`.
- Consent boundary: Google remains External / Testing with one unrecorded Owner test account. Privacy and Terms URLs remain unset because the intended public routes return 404.
- Credential-debt boundary: a first, now-unretrievable Google secret remains enabled after the setup browser session reset; Auth0 stores the second secret. Revocation of the unused first secret requires explicit action-time confirmation after a successful callback.
- Supersedes: Auth0 development keys and the prior current-state claim that the coral Dev Keys warning must remain visible. It does not supersede the rule that a genuine development-key warning may never be hidden with CSS.
- Does not imply: submitted Google consent, callback, Rillora session, private-plan access, logout/error-path verification, Google production publication, App Store readiness or Release identity approval.
- Implementation impact: Owner personally completes the account-selection and consent step; Agent then verifies callback/session/private-plan/logout without reading credentials, followed by a separate security confirmation before old-secret revocation.

## 2026-08-18 — Default to autonomous reversible execution

- Status: LOCKED PROJECT PROCESS.
- Scope: routine product, design, engineering, documentation, testing and reversible external configuration work.
- Decision: do not ask the Owner to approve every ordinary step. Reversible work inside the approved project scope is default-approved and should continue autonomously to the next genuine decision or safety gate.
- Evidence: Owner explicit instruction on 2026-08-18.
- Supersedes: any workflow habit that waits for repeated `继续`, `开始` or confirmation on routine reversible steps.
- Does not imply: permission to spend money, start billing, publish publicly, send external communications, accept legal agreements, select personal accounts, create or revoke long-term credentials, expand high-risk permissions, delete production data or bypass platform-required action-time confirmations.
- Implementation impact: pause only for material security, money, legal, destructive, publishing or personally authenticated actions; record autonomous tradeoffs and evidence boundaries at handoff.

## 2026-08-18 — Implement truthful closed-testing Privacy and Terms before publication

- Status: PROVISIONAL LEGAL COPY IMPLEMENTED; PUBLIC RELEASE BLOCKED.
- Scope: public Web `/privacy` and `/terms`, Google OAuth production prerequisites and first-launch legal inputs.
- Decision: create complete English working drafts that describe the current product and explicitly expose their closed-testing status. Do not invent an operator entity, address, privacy email, governing law, venue, production deletion proof or international-transfer mechanism. Direct legal routes must remain readable without login or a live product API.
- Evidence: Owner asked Agent to write Privacy and Terms; current code, trust/safety contracts, Google official verification rules, ICO privacy-notice requirements, CPPA and FTC primary sources were reviewed. Local 1440 × 1000 and 390 × 844 rendering, public routing and focused Web tests pass.
- Provisional detail: closed testing is restricted to people aged at least 18 who have reached the age of legal majority where they live; first-launch counsel and market selection may change this rule.
- Does not imply: legal advice, public deployment, user acceptance, Google production verification, global compliance, a selected controller, public support channel, production deletion or approved governing law.
- Implementation impact: complete the operator/contact/jurisdiction/data-flow inputs and qualified legal review, then obtain explicit Owner publication approval before deploying the pages or entering them as Google production legal URLs.

## 2026-08-19 — Operate personally through first public release and pre-plan company conversion

- Status: OWNER-LOCKED OPERATING MODEL; PUBLICATION, PAYMENT AND FIRST MARKET REMAIN CLOSED.
- Owner decision: development, closed testing and first public release remain under the Owner as an individual. Do not require a company merely to launch, and do not fabricate `Rillora Inc.`, `Rillora Ltd.` or another entity. Consider incorporation only after the product demonstrates traction or reaches a funding, team, contract, platform or liability trigger.
- Identity consequence: `Rillora` is the product/brand. The real individual is the seller, contracting service provider and data controller where those roles apply. Exact legal name, residence/tax country, publishable address and final public contacts are personal pre-publication inputs and are not guessed or committed as fixtures.
- Commerce decision: iOS digital entitlements plan against StoreKit/In-App Purchase. Web plans against Paddle MoR as the first individual-compatible candidate, contingent on actual KYC, domain and payout acceptance. Direct Stripe remains dormant while the real operator country is unsupported. All channels remain adapters to one server-owned catalog, entitlement and finance ledger. This does not activate payment.
- Market decision: do not launch globally at once. Select one reviewed English market first; the US is a provisional research candidate, not an approved jurisdiction. EU/EEA, UK and mainland China remain closed until their additional privacy, trader/contact, consumer, filing, cross-border, payment and operational gates pass.
- Company trigger and migration: funding, equity/team creation, B2B/vendor requirements, regulated/high-liability service expansion, material personal exposure, or stable full-price traction opens the formation decision. Conversion must preserve identities, Matters, subscriptions and financial history; it includes IP/domain assignment, Apple membership/app/Sign in with Apple migration, Google/Auth0/AWS/provider ownership, controller/terms notices and accounting cutover.
- Source of truth: `docs/individual-operator-launch-plan.md`, with supporting updates to monetization, unit economics, public legal pages and region contracts.
- Evidence boundary: official Apple, Google, Paddle, Stripe, EU/UK and PRC sources were reviewed on 2026-08-19. No company was formed, payment provider onboarded, platform agreement accepted, storefront opened, legal page published or legal/tax service purchased.

## 2026-08-19 — Reopen Stripe through a genuine Hong Kong route and pre-separate mainland

- Status: RESEARCH-BACKED ARCHITECTURAL DIRECTION; PROVIDER, BUSINESS REGISTRATION, TAX POSITION AND MAINLAND RELEASE REMAIN OPEN.
- New Owner fact: the Owner holds mainland identity and a non-permanent Hong Kong identity card and expects any future mainland product to be distinguishable from the Global product. This changes provider feasibility but is not permission to choose a legal/tax status on the Owner's behalf.
- Identity boundary: HKID can satisfy the identity element of Stripe's stated Hong Kong individual path, but it does not by itself establish the right to conduct business under the Owner's condition of stay, a real sole proprietorship/Business Registration, a Hong Kong bank/address/phone, Hong Kong-only tax residence or exemption from PRC worldwide-income reporting. These facts remain separate gates.
- Commerce correction: Stripe HK direct becomes the primary **technical** Global-Web candidate if the genuine Hong Kong operating and cross-border tax/accounting chain passes. Paddle remains the lower-operations MoR fallback. Stripe Managed Payments is a conditional third route because it is currently public preview and excludes China buyers. iOS remains StoreKit. No payment account or charge is authorized.
- Region direction: use a shared product/domain model but separable Global and mainland data, identity, payment, legal/operator and release planes. Do not automatically merge accounts or move sensitive maps across the boundary. The independent app remains the primary mainland product; a mini-program can only be a later limited companion and does not bypass app filing or privacy duties.
- Sequence: do not make a simultaneous Global-plus-mainland paid launch the critical path. Prepare mainland adapters and classification in parallel, but stage Global Free/paid and mainland Free/paid through independent gates.
- Support email: a zero-cost custom-domain mailbox is possible through Zoho Free where available; Cloudflare Email Routing is inbound forwarding rather than a complete send/reply mailbox and would require a DNS-authority migration. No MX/nameserver change is authorized by this decision.
- Supersedes: only the earlier statement that Paddle is the primary Web candidate and direct Stripe is dormant because no supported operator route exists. It preserves individual-through-first-public-release, provider-neutral entitlements, payment closure and per-market review.
- Source of truth: `docs/global-mainland-commerce-plan.md`, with synchronized updates to individual operation, monetization, unit economics, legal-page and data-region contracts.
- Evidence boundary: official provider, Hong Kong IRD/Immigration, PRC tax, MIIT/CAC and Apple materials were reviewed. No immigration or tax conclusion, provider acceptance, business registration, DNS/email change, mainland filing, publication or payment occurred.

## 2026-08-19 — Make each regional public release paid-ready and separate the two launch dates

- Status: OWNER-DIRECTED COMMERCIAL SEQUENCE; IMPLEMENTATION AND EXTERNAL MONEY/LEGAL ACTIONS REMAIN CLOSED.
- Owner intent: users must be able to subscribe when a regional product publicly launches. Permanent Free remains a real baseline, but a region no longer has a separate public Free-only stage followed later by commerce.
- Regional decision: Global and mainland China are independent launches. Global targets an English US-market allowlist first and does not wait for mainland approval. Mainland opens later only after its operator/licence classification, App/ICP filing, local data plane, privacy/security, local payments and tax/support gates pass.
- Pricing decision: move the paid-launch planning center from US$8.99/month or US$89/year to **US$9.99/month or US$99/year**. The prior center becomes a downside sensitivity and US$6.99/US$59 remains a bounded Founder/WTP cell. All remain provisional and do not authorize real products or charges. Mainland ¥68/month or ¥698/year is a separate validation hypothesis.
- Apple decision: model standard subscription downside at 30% outside mainland China and 25% in mainland China. Apply for Small Business Program, but do not assume its 15% outside-mainland or 12% mainland rate before qualification. Apple commission is separate from applicable transaction tax and operator income/profits tax.
- Global Web decision: target Stripe HK direct after genuine HK business/tax/KYC gates; at week 8, switch the launch implementation to Paddle MoR if direct-merchant tax/operations or underwriting is not ready. Stripe Managed Payments is not a launch dependency.
- Mainland infrastructure decision: Alibaba Cloud China South 1 (Shenzhen) is the primary production candidate, with eligible prepaid ECS for filing, cross-AZ app instances, RDS PostgreSQL HA, private OSS, KMS, WAF and SLS. Tencent Cloud remains a fallback; selecting it does not grant WeChat Pay access.
- Mainland payments: iOS uses StoreKit. Web targets approved WeChat Pay and Alipay merchant products; UnionPay/Cloud QuickPass is post-launch. Recurring deduction is a separately approved capability; absent approval, Web may sell annual prepaid access with manual renewal but cannot claim automatic renewal.
- Mainland blocker: individual filing is not treated as permission to sell paid SaaS. Before a mainland paid date, obtain written product/licence/operator classification from the access provider, competent authority channel and qualified mainland counsel. If an individual route is unavailable and no mainland entity/partner exists, keep mainland public payment closed and proceed with Global.
- Source of truth: `docs/global-mainland-commerce-plan.md`, synchronized with monetization, unit economics, operator, legal and region contracts. The Chinese Data Analytics report is `output/reports/rillora-global-mainland-commerce-20260819/artifact.json`.
- Evidence boundary: official Apple, Stripe, Paddle, MIIT/CAC, Alibaba Cloud, Tencent Cloud, WeChat Pay, Alipay and UnionPay materials were reviewed on 2026-08-19. Budget bands are internal planning reserves, not quotes. No product, contract, cloud resource, filing, licence, market or real payment was created.

## 2026-08-19 — Use Stripe external Web checkout for the US iOS storefront

- Status: OWNER-REQUESTED, RESEARCH-BACKED PURCHASE ROUTING DECISION; APP REVIEW, KYC, LEGAL REVIEW AND PAYMENT REMAIN CLOSED.
- Product classification: `Rillora Family` remains consumer/family digital SaaS used inside iOS. It is not classified as a Reader App, physical good, financial transfer, enterprise-only service or 1:1 human service merely to obtain an exception.
- US decision: Global first launches only in the US App Store storefront. Web and US iOS use the same Rillora-owned Web subscription page and Stripe Checkout. iOS may expose the route only after explicit `Plan & access` or named Family-capability intent and must open the system browser, not embed a digital-goods checkout in WebView or native Stripe PaymentSheet.
- Non-US decision: hide the external purchase CTA. Enable StoreKit for a paid iOS market, or allow already-entitled Web subscribers to sign in without any in-app purchase steering. Mainland China keeps StoreKit as its paid iOS route. EU/EEA remains closed because Apple's external-offer terms add entitlement, API, reporting and Apple-fee obligations rather than creating a zero-fee route.
- Architecture: Stripe, StoreKit and future providers write to one server-owned catalog, subscription, entitlement and finance ledger. Storefront/purchase-route policy is versioned; callback URLs never grant entitlement; duplicate cross-channel subscriptions must be prevented.
- Economics: at US$99, selected Stripe HK international-card + Billing + Tax Basic components total approximately US$5.35, leaving US$93.65 before excluded costs, versus US$84.15 after Apple 15%. The external route must preserve about 89.9% of an assumed IAP conversion rate before the listed-fee advantage disappears. This is a break-even calculation, not conversion evidence.
- Supersedes: only the blanket prior assumption `Global iOS = StoreKit`. StoreKit remains the US review fallback and the default adapter for future non-US storefronts. The permanent Free/one Family tier, contextual pricing, personal operation, US-first market, Hong Kong operating gates and no-payment authorization all remain.
- Source of truth: `docs/ios-external-payment-research.md`, synchronized with `docs/global-mainland-commerce-plan.md`, `docs/monetization.md`, `docs/unit-economics.md`, `docs/individual-operator-launch-plan.md`, `docs/product.md` and the current handoff.
- Evidence boundary: current Apple, Stripe and official product materials were reviewed on 2026-08-19. Apple has not approved Rillora, Stripe has not accepted the operator/product, and no product, checkout, storefront, contract, tax registration or real payment was created.

## 2026-08-19 — Route iOS commerce by storefront without treating Apple Account region as residence

- Status: RESEARCH-BACKED ROUTING AND DATA-CONTRACT DECISION; MARKET OPENING, ENTITLEMENTS, PROVIDER ONBOARDING AND PAYMENTS REMAIN CLOSED.
- Region decision: use StoreKit `Storefront.current.countryCode` immediately before displaying products or purchase actions; United States is `USA`. Listen for `Storefront.updates` and fail closed when storefront is unavailable. Do not use IP, GPS, locale, language, SIM, time zone or a general Apple ID profile as substitutes, and do not persist storefront as a customer-profile／marketing attribute.
- Legal boundary: storefront controls Apple purchase presentation only. Service availability uses a separate declared／server-allowlisted market; billing country comes from the payment provider for tax and risk; the active renewal provider controls management and migration. A US storefront is not proof of US residence.
- Dual-provider decision: Stripe and StoreKit coexist behind one provider-neutral catalog, subscription, entitlement and financial ledger, but the UI exposes only one new-purchase route and the database permits only one active Family renewal provider per household. Storefront changes do not cancel, migrate or create subscriptions; provider switches require cancellation and paid-through expiry before a new route opens.
- Regional decision: US remains the Stripe external-Web first market. Ordinary non-US storefronts use StoreKit. Japan and Brazil remain StoreKit-first despite alternative-payment eligibility because current rules require simultaneous IAP, disclosures, transaction reporting and continuing Apple fees. South Korea remains StoreKit-first because external payment requires a Korea-only binary and one PSP, while Stripe is not on Apple's pre-approved list. EU/EEA remains separately closed; Netherlands dating-app relief does not apply to Rillora; Russia is not a paid launch market.
- Stripe surface decision: Stripe remains valid for reviewed Global Web／PWA markets, US iOS external checkout, later direct-distribution surfaces and genuinely separate real-time 1:1 human-service SKUs. It is not a mainland bypass, and payment-method availability is not proof of recurring-subscription support.
- Source of truth: expanded `docs/ios-external-payment-research.md` and `output/reports/rillora-storefront-commerce-routing-20260819/artifact.json`.
- Evidence boundary: Apple StoreKit, App Review, Japan, Brazil, EU, South Korea, Netherlands and App Store availability materials plus Stripe global／Checkout／payment-method／Tax materials were reviewed on 2026-08-19. No storefront, entitlement, IAP, Stripe product, provider account, legal market or charge was created.

## 2026-08-19 — Keep commerce server-authoritative and disabled through Phase 0

- Status: IMPLEMENTED ARCHITECTURE; SALES, PROVIDER ONBOARDING, STAGING DEPLOYMENT AND PAID ENTITLEMENT MUTATION REMAIN CLOSED.
- Scope: provider-neutral commerce persistence, server API, Web consumption, iOS storefront observation and local verification.
- Decision: one server-owned `commerce-v1` contract controls catalog, immutable plan versions, capabilities, prices, current entitlements and purchase-route evaluation. Amounts use integer minor units plus an explicit decimal exponent. Market, storefront and purchase-route policies are versioned and disabled by default. Clients never infer paid access from copy, a callback, a provider page or a local purchase result.
- Integrity decision: a household／plan may have only one active renewal provider. Cross-record database constraints bind subscription to the matching plan price, entitlements to the same commerce account/subscription, and order/payment/settlement/refund snapshots to one provider/environment/currency lineage. Effective-subscription and entitlement reads are scoped to the requested service market, de-duplicate capabilities and only honor a subscription grant while its linked same-account subscription is still in an access-bearing state, so Global/Mainland access cannot leak across planes and a stale grant cannot outlive an expired subscription. Provider events retain a digest and processing state rather than becoming product analytics payloads.
- Storefront decision: iOS reads `Storefront.current.countryCode` only for the current purchase decision, listens for `Storefront.updates`, re-evaluates on change and fails closed when the value is missing or invalid. Storefront is not written to the customer profile. Web must not submit an Apple storefront.
- Runtime decision: ordinary application roles have read-only access to Phase 0 commerce records. All seeded US/Global/Mainland route policies and US$9.99／99 and ¥68／698 price hypotheses are disabled; no provider product or payment adapter is seeded.
- Evidence: migrations `0022_provider_neutral_commerce.sql`, `0023_commerce_currency_precision.sql` and `0024_commerce_cross_record_integrity.sql`; `GET /v1/commerce/status`; `POST /v1/commerce/purchase-route`; Web and native iOS safe consumers. Local verification reached API `59 / 59`, Web `37 / 37` plus production build, and iOS `81 / 81`.
- Supersedes: the handoff statement that provider-neutral Phase 0 was still the next engineering gate.
- Does not imply: Stripe, Paddle, StoreKit, WeChat Pay or Alipay onboarding; a product, checkout, webhook, receipt, transaction, entitlement activation, tax result, App Review approval, staging deployment, production security approval or real charge.
- Implementation impact: the next reversible gate is a local adapter/reconciliation harness driven only by synthetic signed-event fixtures; any external provider contract, product creation, sandbox account mutation or paid agreement remains an Owner money/legal gate.

## 2026-08-19 — Require an authoritative provider snapshot after every payment signal

- Status: PHASE 1A LOCAL-VERIFIED WITH SYNTHETIC FIXTURES; PRODUCTION PROVIDER VERIFICATION, DATABASE MUTATION AND PAYMENT REMAIN CLOSED.
- Decision: a webhook／App Store notification is a wake-up signal, not commercial authority. Even a cryptographically verified delivery cannot create an entitlement by itself. Reconciliation must retrieve or receive a fresh authoritative provider subscription snapshot observed at or after the signal, normalize it into the provider-neutral state model and only then produce a grant／revoke／hold decision.
- Failure decision: repeated and out-of-order events are idempotent; stale snapshots hold access state; equally recent but mutually inconsistent authoritative snapshots are rejected instead of being selected by array order; refund／revocation／expiry／past-due revoke; grace and cancel-at-period-end can remain access-bearing through the provider's paid-through date; more than one access-bearing subscription for one household plan, including two from the same provider, is a conflict and holds instead of guessing.
- Fixture boundary: the Stripe-style adapter verifies a bounded unmodified body with rotating HMAC secrets, a timestamp window and `livemode=false`. The Apple-style adapter verifies outer and nested ES256 JWS with a pinned synthetic public key and exact bundle／environment／subject, while refusing Production and `x5c`. They are deliberately test-only and cannot be re-labelled as Stripe production verification or Apple's real PKI chain.
- Privacy decision: normalization retains only minimal external references, event kind/time and a SHA-256 digest; it does not retain a raw webhook body, Apple payload, email, card data or provider page fields.
- Evidence: `commerce-provider-contract.ts`, `commerce-synthetic-adapters.ts`, `commerce-reconciliation.ts` and eight adapter/reconciliation test cases; complete API regression reached `67 / 67`.
- Supersedes: the handoff statement that the synthetic adapter/reconciliation harness was still the next reversible engineering gate.
- Does not imply: a real provider account, official Stripe SDK, Apple App Store Server Library／`x5c` trust verification, webhook route, database executor, sandbox product, checkout, paid entitlement, staging deployment or charge.
- Implementation impact: the next step crosses an Owner money／legal／external-contract gate. It begins only after the real operator/KYC/tax path, provider agreements and publication legal-review path are explicitly authorised.

## 2026-08-19 — Create an isolated Rillora Stripe HK test account

- Status: OWNER-CONFIRMED EXTERNAL ACCOUNT CREATION; TEST MODE ONLY; LIVE COMMERCE CLOSED.
- Isolation decision: create `Rillora` as a standalone Stripe account instead of placing it inside the existing `X` organization. Stripe stated that the standalone path does not share data, team members or reports with `X`; the post-create account switcher continued to list FanPass separately.
- Verified result: Stripe created Hong Kong account `acct_1U6B2RCxTlowhyiG`, loaded `Rillora` in test mode and exposed its default `Rillora 沙盒`. Additional named sandboxes are disabled until merchant verification.
- Connector boundary: the installed Stripe MCP still returns `requires reauthentication`. It may not be used for provider writes until a readback proves it is connected to `acct_1U6B2RCxTlowhyiG`; a different Account ID is a hard stop protecting FanPass.
- Safety boundary: no merchant-verification／KYC submission, live-mode change, product, price, Checkout, webhook, credential reveal or manual credential creation, charge or entitlement activation was performed. No secret was copied or stored. Account creation does not prove business permission, Business Registration, banking, tax, underwriting, legal-page readiness or launch eligibility.
- Supersedes: only prior current-state claims that no Stripe provider account existed. It does not supersede the disabled provider-neutral architecture, provisional prices, individual-operator gates or the requirement for separate authorization before credentials, contracts, KYC and real payments.

## 2026-08-19 — Bind the official Stripe test adapter without opening sales

- Status: PHASE 1B LOCAL-VERIFIED AND PROVIDER TEST CATALOG CREATED; SECRETS, HTTP COMMERCE ROUTES, LEDGER MUTATION, LIVE MODE AND SALES REMAIN CLOSED.
- Connector decision: after Stripe MCP reauthorization, require `get_stripe_account_info` to return exact Account ID `acct_1U6B2RCxTlowhyiG` before any provider write. The readback matched. FanPass remains a separate hard-stop boundary.
- Provider result: create one non-live `Rillora Family` Product (`prod_V6O8lAFbTCDmKd`) and two non-live recurring Prices: US$9.99 monthly (`price_1U6BMoCxTlowhyiG7qsmBrdY`) and US$99 annual (`price_1U6BMnCxTlowhyiGJEC1w596`). There is no default Price, trial, promotion, Checkout, Customer, webhook, Portal Session or live object.
- Runtime decision: use official Stripe Node SDK `22.5.0` behind a test-only all-or-none configuration rejected in production. Every first provider operation verifies the current Account. Checkout uses only server-mapped Price IDs, quantity one, fixed same-origin return URLs, metadata on Session and Subscription, and a stable server-owned idempotency key. Portal receives only a Customer ID recovered from Rillora's server mapping. Neither client may submit a provider Price or Customer ID.
- Verification decision: webhook verification requires the raw body, `Stripe-Signature`, endpoint secret and the official SDK, caps payloads at 256 KB, rejects `livemode=true`, retains only normalized references and a SHA-256 digest, and still requires a later authoritative snapshot. Subscription retrieval binds Customer, commerce-account metadata, `family-v1`, exact Product and either exact Price; `trialing` is rejected because launch policy has no auto-converting trial, while unpaid／past-due and incomplete／paused states fail closed.
- Data decision: migration `0025_stripe_test_catalog_binding.sql` stores only non-secret Account／Product／Price references with `test_only` status. US/Mainland sales and purchase-route policies remain disabled and the application role remains read-only for commerce.
- Security decision: redact `Stripe-Signature`; accept only `sk_test_` or preferably restricted `rk_test_` API keys; reject partial Stripe configuration, live keys and cross-origin return URLs. No credential was generated, revealed, copied or stored in this phase.
- Evidence: API typecheck and build pass; complete API regression is `77 / 77`; complete and production-only dependency audits report zero findings. This is local evidence and migration `0025` is not deployed to Frankfurt staging.
- Next gate: Owner-confirmed creation and secret-manager placement of a least-privilege `rk_test_` key plus a future test webhook `whsec_`, followed by a separately privileged durable provider-event/order/payment executor and an end-to-end test-mode Checkout flow. No sales switch may be enabled during that gate.

## 2026-08-20 — Use GPT-5.6 Sol 1M context globally without weakening Markdown authority

- Status: GLOBAL CODEX CONFIGURATION SAVED AND PARSE-VERIFIED; RESTARTED NEW TASK REQUIRED; NO PRODUCT OR PROVIDER STATE CHANGED.
- Scope: Codex user-level working context only. This is not a product feature, repository runtime setting, deployment decision or release claim.
- Decision: retain `gpt-5.6-sol` as the global default and set `model_context_window = 1000000` with `model_auto_compact_token_limit = 900000` at the top level of `/Users/tantalum/.codex/config.toml`. The values apply to restarted new Codex tasks unless a task／CLI override supersedes them.
- Rationale: Rillora combines a long decision history with Web, iOS, backend, security, legal, regional and commerce contracts. A larger supported window can postpone compaction and retain more direct evidence, but it does not guarantee better reasoning and may increase latency or usage. Project-owned Markdown remains the durable source of truth.
- Verification: local Codex reports `codex-cli 0.148.0-alpha.15`; exact top-level values were read back; `codex features list` parsed the configuration without error. The closeout API rerun also exposed and removed a wall-clock dependency in two Stripe signature fixtures by passing the frozen receive time to the official SDK verifier; typecheck, build, `77 / 77` tests and the complete dependency audit then passed.
- Continuity boundary: the already-running task does not resize. Owner must fully quit and reopen Codex, then start a new task and follow the `AGENTS.md` Markdown recovery protocol.
- Security boundary: this decision does not authorise Stripe restricted-key／webhook-secret creation. Commerce remains at disabled Phase 1B and the credential gate still needs explicit Owner confirmation.

## 2026-08-20 — Authorize Stripe test credentials and a disabled durable executor

- Status: OWNER-CONFIRMED SECURITY ACTION; LOCAL PHASE 1C EXECUTOR VERIFIED; AWS/STRIPE SECRET CREATION PENDING OWNER LOGIN.
- Scope: Rillora Stripe test mode only, exact Account `acct_1U6B2RCxTlowhyiG`, a least-privilege restricted API key, one exact test Webhook endpoint/signing secret, AWS Secrets Manager storage and the disabled provider-neutral ledger executor.
- Decision: create and safely store one `rk_test_` and the endpoint-specific `whsec_`; implement an authenticated test-only Hosted Checkout/Portal surface, raw-body signature-verified Webhook, durable minimal provider-event inbox, independent `continuity_commerce` database role and authoritative-Subscription reconciliation. Keep every market, sales and purchase-route policy disabled, and never mutate a Family entitlement from this test executor.
- Evidence: Owner replied exactly `确认创建并安全存放 Rillora Stripe 测试 rk_test_ 与 whsec_`. Local API typecheck/build, `81 / 81` tests and both dependency audits pass; infra typecheck/build, `8 / 8` tests and disabled/enabled synth pass. The Stripe connector independently read back `Rillora / acct_1U6B2RCxTlowhyiG` in test mode.
- Supersedes: the security gate that awaited explicit Owner confirmation for these two test secrets. It does not supersede the requirement that the Owner personally complete AWS/Stripe login or any new action-time confirmation required by the official control plane.
- Does not imply: `sk_test_`, live keys, live mode, KYC, tax registration, `automatic_tax`, sales-route activation, entitlement activation, real card use, a real charge, App Review, public legal publication or release approval.
- Implementation impact: migration `0026` adds the isolated inbox/customer/object-link/reconciliation records and least-privilege role; the API exposes only gated `/v1/commerce/test/*` routes and `/api/commerce/stripe/webhook`; ordinary commerce status excludes test subscriptions. CDK creates a dedicated Stripe test Secret and injects its two fields only when `stripeTestIntegrationEnabled=true`; the staging operator may put/describe but not read the secret. Cloud deployment and secret creation resume after the Owner completes the current `rillora-operator` login/MFA handoff.

## 2026-08-20 — Deploy the least-privilege Stripe test executor without opening sales

- Status: PHASE 1C TEST EXECUTOR DEPLOYED AND CHECKOUT-CREATION VERIFIED; SIGNED PAYMENT WEBHOOK／SUBSCRIPTION RECONCILIATION AWAITS OWNER MONEY-GATE CONFIRMATION; LIVE COMMERCE CLOSED.
- Credential result: create one restricted test key named `Rillora Phase 1C test executor` and one endpoint-specific signing secret. Store them as two independent scalar AWS Secrets Manager values. The staging operator can put／describe only those exact secrets and cannot read them; the ECS execution role can read them only when the explicit Stripe test integration flag is enabled.
- Restricted-key decision: grant only `Checkout Sessions: Write`, `Customer Portal: Write` and `Subscriptions: Read`. Reject Stripe's current `Core: Read` because it automatically inherits broad Balance／Customers and related reads. This supersedes the Phase 1B runtime rule that every first operation calls `GET /v1/account`; account separation now relies on the independently read-back Account `acct_1U6B2RCxTlowhyiG` and account-specific Product／Price／Customer／Subscription references, which fail closed under a cross-account key.
- Webhook result: create enabled test endpoint `we_1U6ELcCxTlowhyiG6Foqyniw` at the exact staging path with fourteen Checkout／Subscription／Invoice payment／Refund／Dispute events. It is `livemode=false`. No webhook secret value is retained in this log.
- Runtime result: deploy migration `0026`, global minimal inbox, Customer／provider-object links, reconciliation records, independent `continuity_commerce`, authenticated Checkout／Portal／status routes and raw-body Webhook. `continuity_app` cannot write the inbox; `continuity_commerce` cannot write entitlement grants. Ordinary sales／route evaluation remains closed and test subscriptions remain absent from ordinary commercial status.
- Checkout evidence: create and idempotently replay two monthly test Checkout Sessions. Both remain `open / unpaid / livemode=false`, with no Customer or Subscription. The first exposed a staging-metadata defect and is retained as test history; the second proves exact monthly Price／Family Product, `automatic_tax=false`, `customer=null` and `rillora_environment=staging`. No card, signed payment event, authoritative Subscription reconciliation, entitlement activation or real charge occurred.
- Security-debt decision: Stripe's API-key page DOM incidentally surfaced the existing broad standard test secret during inspection. Owner replied `因为这是在测试模式，先不用管暴露`, so it is not rotated in this workstream. Rillora did not copy, reuse or store that value. This is an Owner-accepted test-only debt and does not authorise exposure of the new restricted key, webhook secret, any live credential or future production secret.
- Validation: live stack `UPDATE_COMPLETE`; API task revision `14` steady at `1 / 1`; six readiness probes return 200; invalid Webhook signature returns sanitized 400; API typecheck/build/`80 / 80`; infrastructure typecheck/build/`8 / 8`; enabled／disabled synthesis passes. API and infrastructure production／complete dependency audits are zero after upgrading to `aws-cdk-lib 2.266.0` and `aws-cdk 2.1138.0` and deploying the resulting helper layer.
- Next gate: ask Owner immediately before completing one Stripe test-card Checkout. That simulated money action may create test Customer／Subscription／charge objects solely to prove signed Webhook persistence, authoritative retrieval, reconciliation, duplicate delivery and the hard-disabled entitlement mutation. It does not authorise live mode, real card use, KYC, tax registration, legal agreement, App Review, sales-route activation or public release.

## 2026-08-20 — Default-authorize test mode and keep lifecycle mutations outside ordinary entitlement

- Status: TEST PAYMENT, SIGNED WEBHOOK, CUSTOMER PORTAL AND SCHEDULED CANCELLATION VERIFIED; FULL REFUND DURABLY NEEDS MAPPING; LOCAL RESOLVER VERIFIED BUT PERMISSION SAVE BLOCKED BY HCAPTCHA.
- Owner rule: `测试模式下全部默认授权`. This authorises reversible Stripe test objects and synthetic card／subscription／refund lifecycle work without repeated project-level confirmation. It does not authorise CAPTCHA solving without the browser-required explicit permission, live mode, real cards, real charges, KYC, contracts, tax changes or public sales.
- Payment evidence: complete one US$9.99 monthly Checkout with public Stripe test card data and synthetic identity/address fields. Checkout becomes `complete / paid / livemode=false`; test Customer `cus_V6S0gTGRZC1hm5` and Subscription `sub_1U6F69CxTlowhyiGgLRdwz1Z` are created. Four signed payment／subscription events persist as `applied`; four authoritative decisions propose `grant / active`, but every decision records `entitlementMutationApplied=false`. Ordinary `commerce-v1` stays Free with no active ordinary subscription.
- Portal and cancellation decision: hosted Portal creation is part of the restricted-key proof. Stripe Portal now schedules cancellation using future `cancel_at` plus `cancellation_requested`, while leaving `cancel_at_period_end=false`. Normalize either provider representation to Rillora `cancel_at_period_end` when the Subscription remains active. Revision `15` and a fresh signed update prove the corrected state without applying entitlement mutation.
- Refund evidence: a full sandbox refund succeeds and emits `refund.created`, `charge.refunded` and `refund.updated`. The deployed executor persists all three in the global inbox as `needs_mapping / subscription_reference_missing`, which is a safe failure rather than an incorrect grant or revoke.
- Resolver decision: use Stripe's current authoritative relationship `Refund or Charge -> PaymentIntent -> Invoice Payments -> Invoice parent.subscription -> Subscription`. Verify matching test Charge／Invoice／Customer, and override the Subscription snapshot to `refunded` only when the refund succeeded and the Charge is fully refunded; partial or failed refunds retain the authoritative Subscription state. Local unit and integration evidence is `81 / 81`, including `revoke / refunded` with `entitlementMutationApplied=false`.
- Least-privilege impact: add only `Charges and Refunds: Read` and `Invoices: Read` to the existing key; keep Core, Customers, Balance, Prices／Products, Payment Intents, Payouts and all unrelated resources `None`. Stripe sent an OTP, but the permission form presented an invisible hCaptcha before any OTP field. The change is not saved and the resolver is not deployed until the Owner explicitly authorises CAPTCHA solving.

## 2026-08-20 — Complete authoritative full-refund reconciliation and duplicate delivery proof

- Status: PHASE 1C TEST LIFECYCLE CLOSED THROUGH PAYMENT, SCHEDULED CANCEL, FULL REFUND AND DUPLICATE DELIVERY; ORDINARY ACCESS AND ENTITLEMENT MUTATION REMAIN CLOSED.
- Permission result: after Owner reaffirmed that all test-mode actions are authorised, Stripe phone verification saved exactly `Charges and Refunds: Read` and `Invoices: Read`. Existing Checkout write, Customer Portal write and Subscriptions read remain; Core, Customers, Balance, Payment Intents, Prices／Products, Payouts and unrelated resources remain `None`.
- Deployment result: refund resolver is live in API task revision `16`; migration task definition revision is `11`. Stack is `UPDATE_COMPLETE`, ECS is steady `1 / 1`, and final CDK diff is empty.
- Provider proof: Workbench resent historical `refund.updated` event `evt_3U6F68CxTlowhyiG1NBrm0FD`. The durable inbox row advanced from `needs_mapping` to `applied`; authoritative Refund／Charge／Invoice Payments／Invoice／Subscription reads produced Subscription state `refunded` and reconciliation `revoke / refunded / authoritative_non_access_state` with `entitlementMutationApplied=false`.
- Idempotency proof: resending the exact same Stripe event again left one planner-visible `refund.updated` record and one `refunded` reconciliation. The executor did not duplicate state history or reconciliation work.
- Historical boundary: `refund.created` and `charge.refunded` rows that previously returned `needs_mapping` remain as durable historical evidence rather than being silently rewritten. A future controlled replay facility may process them, but current truth is already established by the applied `refund.updated` delivery.
- Product boundary: ordinary `commerce-v1` remains `billingOpen=false`, `planCode=free`, `subscription=null`, no subscription-sourced entitlements and `providerCallbackGrantsAccess=false`. No test payment, cancellation or refund changed ordinary access.
- Verification: API typecheck/build/`81 / 81`, infrastructure typecheck/build/`8 / 8`, both projects' production／complete audits zero, Web and readiness 200, invalid signature sanitized 400, stack `UPDATE_COMPLETE`, ECS revision `16` completed, CDK diff zero.

## 2026-08-20 — Complete dispute and renewal-failure recovery while ordinary access stays Free

- Status: PHASE 1C STRIPE TEST LIFECYCLE COMPLETE THROUGH DISPUTE AND PAST-DUE RECOVERY; NO ORDINARY ENTITLEMENT MUTATION.
- Dispute permission: add only `Payment Disputes: Read`. Existing Charge／Refund, Invoice and Subscription reads remain; Customers, Payment Intents, Core, Prices／Products and Payouts remain `None`.
- Dispute mapping: accept current Stripe `du_` IDs; resolve Dispute／Charge PaymentIntent through Invoice Payments and Invoice parent Subscription. Treat `needs_response`, `under_review`, warnings requiring response and `lost` as authoritative `revoked`; treat `won`, `prevented` and `warning_closed` as a signal to use the current Subscription state.
- Provider evidence: Stripe's official `4000 0000 0000 0259` sandbox card created a successful second subscription payment followed by fraudulent `charge.dispute.created`. The deployed resolver advanced that historical 202 delivery to `applied`, produced `revoke / revoked`, and handled an exact duplicate without duplication. Submitting official `winning_evidence` emitted `charge.dispute.updated` and `closed`; the Subscription returned to active. A later recovery payment made with the same dispute card correctly created another dispute; it too was closed as won before final state was accepted.
- Renewal failure evidence: Portal attached official recurring-failure test card `0341`; a subscription-linked US$9.99 invoice was finalized and manually attempted. `invoice.payment_failed` plus Subscription updates became applied, Subscription became `past_due`, and reconciliation revoked without applying entitlement. Customer／Subscription defaults were restored to a normal `4242` test PaymentMethod; the same invoice paid and signed invoice／Subscription events returned the Subscription to active.
- End state: Rillora test ledger contains one active Subscription and the prior refunded Subscription. Ordinary `commerce-v1` remains `billingOpen=false`, Free, no ordinary Subscription, no subscription-sourced entitlement and callback-grants-access false. All payment, cancel, refund, dispute, past-due and recovery reconciliations keep `entitlementMutationApplied=false`.
- Verification: API task revision `17`, migration task definition `12`, API `82 / 82`, infra `8 / 8`, both projects' production／complete audits zero, stack `UPDATE_COMPLETE`, ECS `1 / 1`, Web／readiness 200, sanitized invalid-signature 400 and no CDK diff.
- Next gate: Stripe test-mode provider lifecycle no longer contains an unverified core branch. StoreKit sandbox／Apple paid agreements, live Stripe merchant activation, KYC, tax, consumer-law review, App Review and public sales remain separate money／legal gates.

## 2026-08-20 — Start StoreKit with an isolated local Xcode phase before Apple contracts

- Status: STOREKIT SK0 LOCAL FOUNDATION IMPLEMENTED AND BUILD-VERIFIED; EXECUTABLE STOREKITTEST／VISIBLE PURCHASE EVIDENCE PENDING A BOOTED SIMULATOR; APP STORE CONNECT AND ENTITLEMENT MUTATION CLOSED.
- Scope: StoreKit 2 product loading, local Xcode StoreKit configuration, purchase／restore／transaction-update handling, provider-neutral test catalog and evidence boundary. It does not cover App Store Connect product creation, Apple paid agreements, banking／tax, server credentials, App Review or live IAP.
- Decision: implement a separate `RilloraStoreKitLocal` Debug scheme with one local subscription group and exact monthly／annual product identifiers. Keep the ordinary Debug／Release schemes outside the local harness. A local verified transaction may be recorded and finished only after it matches the synthetic signed-in Rillora planner UUID, exact product allowlist, Xcode environment and current storefront; it never mutates ordinary subscription or entitlement state.
- Product identifiers: local monthly `com.rillora.family.monthly` maps to `family_usd_monthly_v1`; local annual `com.rillora.family.annual` maps to `family_usd_annual_v1`. Both are one Family capability level in subscription group `D7BCE9A1`; Family Sharing remains disabled. These are local/test identifiers until a later Owner-authorised App Store Connect action confirms them externally.
- Client boundary: use `Product.products(for:)`, `Product.purchase` with `appAccountToken`, `Transaction.updates`, `Transaction.currentEntitlements` and explicit-user-action `AppStore.sync()`. Reject unverified, mismatched-account, wrong-product, non-Xcode or storefront-mismatched evidence and do not finish it. Signed JWS is transient in SK0 and is not placed in UI, logs or documentation.
- Server boundary: migration `0027` adds only `storekit / test / USA / test_only` storefront-product bindings. No market, sales or purchase-route policy changes. The future sandbox/production path must verify Apple `x5c` chains through the official App Store Server Library, bind bundle／product／group／appAccountToken／original transaction／storefront／environment, retrieve authoritative state, persist before acknowledgement and keep entitlement mutation disabled until a separate gate.
- Evidence: all 45 pre-existing project-owned Markdown files were read in full before work. XcodeGen generation and the local scheme's StoreKit／environment readback pass; iOS build-for-testing passes. StoreKit-focused state tests cover verified purchase, account mismatch, unverified evidence and explicit restore. API typecheck/build and `82 / 82` tests pass with migration `0027`. No Simulator was booted, so neither the StoreKitTest integration case nor a visible purchase sheet is claimed as executed.
- Supersedes: the prior handoff state in which StoreKit remained only a storefront observer, synthetic Apple-JWS fixture and future sandbox gate. It does not supersede the US Stripe-first routing decision or make StoreKit an active public purchase route.
- Does not imply: Paid Apps Agreement acceptance, Apple banking／tax setup, an App Store Connect product or subscription group, Sandbox Apple Account, App Store Server API key, Notifications V2 endpoint, signed Apple server event, entitlement activation, App Review, real charge or public release.
- Next action: after the Owner boots the existing iPhone 17 Pro Max Simulator, run `RilloraStoreKitLocal` tests and one visible local annual purchase, prove current local entitlement evidence while ordinary Rillora access stays Free, then complete the remaining local renewal／expiration／retry／grace／refund／restore matrix. Stop again before the Apple legal／money／long-term-key gates.

## 2026-08-20 — Accept Xcode Run as SK0 runtime proof and isolate the iOS 26.5 StoreKitTest regression

- Status: STOREKIT SK0 LOCAL PURCHASE／CANCEL／REFUND-REVOCATION RUNTIME VERIFIED; ORDINARY ACCESS FREE; REMAINING LOCAL LIFECYCLE AND ALL APPLE EXTERNAL GATES OPEN.
- Evidence decision: a visible Xcode Run system sheet plus signed StoreKit readback is valid local-runtime evidence; build success, a static `.storekit` file or a simulated UI alone is not. The booted matrix Simulator loaded both exact products, completed the annual Xcode purchase, exposed one verified local transaction and one current entitlement, and left `commerce-v1` Free with callback／client-result grants disabled.
- Failure-path decision: closing the system confirmation is a quiet cancellation and creates no entitlement. A verified Xcode refund/revocation update is recorded by the app-shell listener and removes the item from `Transaction.currentEntitlements`; it still cannot mutate ordinary server access.
- Restore boundary: the explicit restore action correctly delegates to `AppStore.sync()` and reached Apple's system account prompt. The prompt was cancelled because platform-required personal login remains an Owner action. This proves only the system handoff, not post-login restore.
- Tooling decision: retain the real `SKTestSession` integration test, but skip it explicitly on iOS 26.5 before product loading because current Xcode automated execution fails to synchronize the local configuration to `storekitd` and can hang. Do not weaken StoreKit verification or mislabel that Apple-tool regression as a Rillora failure. On unaffected runtimes the test still executes its exact-product, account-token, Xcode-environment, signed-transaction and current-entitlement assertions.
- Verification: iOS `87 passed / 0 failed / 1 skipped`; Debug build-for-testing succeeds; a fresh Release Simulator build succeeds and contains no `.storekit`; API remains typecheck/build/`82 / 82`. Five SHA-256-bound evidence images are stored under `qa/storekit-local-2026-08-20/`.
- Remaining SK0 gate: pending／Ask to Buy, renewal, expiration, billing retry／grace and storefront-change runtime evidence; post-login restore waits for the Owner's Apple-account interaction. App Store Connect products, Paid Apps Agreement, banking／tax, server key, sandbox PKI／Notifications V2, App Review, ordinary entitlement activation and any real charge remain closed.

## 2026-08-20 — Replace authenticated root prose stacks with one visual action hierarchy

- Status: OWNER-DIRECTED AUTHENTICATED IOS UX; IMPLEMENTED AND VERIFIED IN THE CURRENT EMPTY-PLAN SIMULATOR STATE.
- Owner correction: after signing in, Overview still presented a wall of explanatory cards and Profile mixed inconsistent green／black card surfaces. The Owner explicitly required less text, consistent Profile cards and a stronger UX using icons, imagery or motion where useful.
- Overview decision: do not repeat one empty fact through hero copy, progress, Matter, contact and safety cards. Use one short title, one primary action and one shared progress surface with a native ring plus actionable Matter/contact status modules. Keep only the compact `Directions, not passwords` reminder; detailed authority and secret boundaries belong inside their tasks.
- First-use decision: when both start choices are active, do not repeat `Add matter` in the hero and starter. Show `Add a matter / 2-minute guide` as compact visual actions, retain `Not now`, and state only that progress begins after a Matter is saved.
- Matters decision: an empty plan uses one icon-led empty state and one Add action. Do not show empty `Added / Needs review` sections or a root paragraph explaining legal authority.
- Profile decision: every root task uses one action-surface／icon／stroke grammar. Remove root `Policy version` and mixed passive/action status blocks; summarize plan, continuity and session inside `Plan & access`. Contact creation uses `Record only · sends nothing`. Preparation and support use icon tiles, two columns normally and one column at accessibility sizes.
- Motion/accessibility decision: animate only numeric/ring progress changes, and stop those animations under Reduce Motion. At accessibility sizes, reflow labels vertically, move badges beside icons and never fragment words to preserve a horizontal layout.
- Maintainability decision: split the former large Account/Overview files into root orchestration, authenticated content, dashboard components and support views. Preserve business services, navigation destinations, data contracts and existing accessibility identifiers.
- Evidence: current-run before／after and AX5 evidence is in `qa/authenticated-ux-audit-2026-08-20/`; combined Overview, Profile and Matters comparisons were inspected. Debug build/run, Release build, `87 passed / 0 failed / 1 skipped`, and `RilloraLayoutMatrix` build-for-testing pass. The one skip remains the unrelated iOS 26.5 StoreKitTest configuration-sync regression.
- Does not imply: changed planner data, an invitation, authority, authentication change, billing/entitlement change, external usability result, complete device matrix, physical-device accessibility, staging deployment or release approval.

## 2026-08-20 — Turn official checks into provider-owned action guides

- Status: OWNER-DIRECTED PRODUCT GUIDANCE; OFFICIAL-SOURCE RESEARCH AND LOCAL WEB／IOS IMPLEMENTATION VERIFIED.
- Owner correction: naming Apple, Google, Binance and other providers without linking their official process or telling the user what to do does not satisfy Rillora's execution job.
- Classification decision: separate `prepare now` from `estate request`. Apple, Google, Facebook, GitHub and selected password-manager designs support a living-user setup path; Microsoft, LinkedIn, X, PayPal, Coinbase and Binance mainly expose a later representative/request process. Do not label every provider mechanism as a Legacy Contact.
- Catalog decision: ship a curated eleven-category catalog covering Apple, Google, Facebook／Instagram, GitHub, password managers, Microsoft, LinkedIn, X, PayPal, Coinbase and Binance. Selection reflects common global relevance plus a provider-owned public route; it is not an exhaustive popularity ranking.
- Link decision: every action uses HTTPS and an exact provider-owned host allowlist. iOS opens the system browser and hides the Tab Bar on the focused provider detail; Web opens a separate browser tab. Rillora never embeds or collects the provider credential or applicant documents.
- Status decision: the five existing API checks remain reversible planner self-reports. The six added reference guides do not create database rows, readiness credit, provider verification, invitation, authority or entitlement.
- Binance correction: no public global Binance Legacy Contact switch was verified. The current guide records a region/entity-specific inheritance-support application, links global support and a separate Binance.US process, and keeps self-custody outside exchange recovery.
- Density/accessibility decision: root rows carry only provider, one-line purpose and reviewed indicator. Steps, usual materials, links, review date and limitations appear after navigation. Accessibility sizes reflow rows and links vertically; text stays uncapped and scrollable.
- Evidence: focused contract `docs/provider-death-account-guides.md`; Web production build and `40 / 40`; native XcodeGen／Debug build, `91 passed / 0 failed / 1 skipped`, default-size and AX5 inspection, Apple detail with hidden Tab Bar, and a real system-browser open to `support.apple.com`. The retained skip is the unrelated iOS 26.5 StoreKitTest tool regression.
- Does not imply: legal advice, every regional provider route, completed external setup, a valid death／authority document, provider acceptance, login access, memorialization, deletion, content delivery, asset transfer, ownership, market usability, staging deployment or release approval.

## 2026-08-20 — Use one compact visual system before and after sign-in

- Status: OWNER-DIRECTED WEB／IOS UX SYSTEM IMPLEMENTED AND LOCALLY VERIFIED; NO PUBLIC DEPLOYMENT.
- Owner correction: provider marks should come from official resources when the exact use is permitted, signed-out and authenticated states should not feel like different products, Profile cards must use one color grammar, child tasks must be reviewed, and safety truth must not become piles of tiny gray copy.
- Shell decision: signed-out Overview／Matters／Profile now use the same title scale, 16px tonal cards, icon blocks, action surfaces and clay primary action as authenticated roots. The public map is three static icon rows and three visual event facts; Matters is a four-tile field map; the Account row uses the same Profile action surface. Web mirrors the same compact product map and account hierarchy.
- Product-before-account timing: a tall viewport may show `Create my private map` only after the product map and distinct-event facts are already visible. This supersedes the older literal requirement that the first creation action always sit below the first physical viewport; it does not restore a login wall, public plan comparison, price or `Free` promotion.
- Task-density decision: repeated disclaimer paragraphs and secondary disclosure lists become a shared `RilloraFactStrip`; plan capabilities use `RilloraCapabilityGrid`; editor footers are one concise task-specific truth. Pushed editors, safety pages, plan pages and preparation tools hide the Tab Bar. Primary helper／boundary copy uses footnote or subheadline semantic sizes rather than `caption2`.
- Contrast decision: clay buttons use graphite canvas text. Measured contrast is approximately `4.89:1`; the former limestone-on-clay treatment was approximately `2.99:1` and is retired for normal text on Web and iOS.
- Provider-mark decision: never fabricate or approximate a provider logo. GitHub and X use unmodified official white assets on the neutral action-icon plate; Apple uses its system symbol. Google sign-in resources, Microsoft, LinkedIn, Bitwarden, 1Password and aggregated Meta／password-manager rows remain neutral system／library icons because their current terms do not clearly permit this directory placement. Provenance and SHA-256 values are in `docs/asset-licenses.md`.
- Evidence: `qa/full-ui-system-audit-2026-08-20/` contains current-run before, after, AX5 and five combined comparison images. iOS Debug build and `91 passed / 0 failed / 1 skipped` succeed; Web production build and `40 / 40` tests succeed; local mobile Web console contains no app errors or warnings. The single iOS skip remains the previously isolated iOS 26.5 StoreKitTest synchronization regression.
- Does not imply: final Rillora logo approval, permission to use any additional provider mark, provider endorsement, changed provider policy, physical-device accessibility, full VoiceOver／localization coverage, market comprehension, staging deployment or release approval.

## 2026-08-21 — Treat verified subscription status as evidence, never as access

- Status: STOREKIT SK0 SIGNED STATUS AND ACCELERATED RENEWAL UPDATES VERIFIED; ORDINARY ACCESS FREE; REMAINING LOCAL AND ALL APPLE EXTERNAL GATES OPEN.
- Evidence-model decision: the StoreKit adapter must verify and retain both the signed transaction and signed renewal-info representations for a subscription status. A local status is accepted only when account token, product allowlist, subscription group `D7BCE9A1`, Xcode environment and storefront match. The visible record strips signatures and contains only bounded lifecycle fields.
- State decision: model `subscribed`, `inGracePeriod`, `inBillingRetryPeriod`, `expired`, `revoked` and `unknown` explicitly. Read current status and listen to `Product.SubscriptionInfo.Status.all` in addition to transaction updates and current entitlements. No status, purchase result or local entitlement may mutate ordinary Rillora access.
- Isolation decision: preserve existing local transaction evidence. Create a separate `Rillora-StoreKit-Lifecycle` Simulator for destructive or accelerated lifecycle exploration instead of deleting the original transaction rows.
- Runtime-evidence decision: a clean monthly purchase displayed `Subscribed · renews`; the prior refunded yearly transaction displayed `Revoked`. With Xcode renewal temporarily accelerated to two seconds, one purchase caused the live verified-local-transaction count to reach 49 before current local entitlements returned to zero. This closes local renewal-update evidence but does not close an explicit app-visible `.expired` state.
- Negative-result decision: a slower 30-second configuration with billing retry and grace enabled produced a subscribed purchase but no next renewal in 85 seconds. Do not infer retry／grace from enabled controls; those cases remain open. Restore the StoreKit configuration to real time, retry off, grace off, Ask to Buy off, interrupted purchases off and dialogs on after testing.
- Tooling decision: retain the real `SKTestSession` integration body. On iOS 26.5, skip by default after an explicit retry hung and allow deliberate retry with `RILLORA_RUN_UNSTABLE_STOREKITTEST=1`. Apple’s official iOS 26.4 arm64 runtime was then installed; clean filename and `contentsOf:` runs both reproduced `SKInternalErrorDomain Code=3` plus an empty catalog, including after Xcode GUI and both 26.5 Simulators were shut down. Record this as current-machine Xcode 26.5 toolchain evidence, not an Apple-confirmed general defect, and do not blindly download more runtimes.
- Verification: the final iOS 26.4 suite discovers 95 tests and reports `94 passed / 0 failed / 1 skipped`; a fresh Release Simulator build succeeds and contains no `.storekit`; local `commerce-v1` remains `billingOpen=false / planCode=free / subscription=null`. Hash-bound evidence and the two-runtime negative-result logs are under `qa/storekit-local-2026-08-20/`.
- Supersedes: the earlier SK0 remaining-gate sentence only where it listed renewal as open. Pending／Ask to Buy, explicit expired-state, billing retry／grace, storefront change and post-login restore remain open. It does not supersede the Stripe-first US route or any Apple legal／money／credential gate.
- Does not imply: Apple sandbox, App Store Connect products, Paid Apps Agreement, banking／tax completion, App Store server credentials, Notifications V2, server PKI, entitlement activation, App Review, a charge or release.

## 2026-08-21 — Complete SK0 lifecycle through supported Xcode controls and isolate StoreKitTest tooling

- Status: STOREKIT SK0 LOCAL LIFECYCLE COMPLETE EXCEPT OWNER-CONTROLLED POST-LOGIN RESTORE; ORDINARY ACCESS FREE; ALL APPLE EXTERNAL GATES CLOSED.
- Test-resource decision: `Rillora.storekit` belongs to both the Debug application and `RilloraTests`; the integration resolves `Bundle(for:)`. This follows Apple’s test-target requirement while Release continues to exclude the configuration.
- Tooling decision: the resource correction is retained even though it does not clear the Xcode 26.5 failure. Focused CLI testing on iOS 26.4 still logs Code 3／empty catalog, and Xcode Run→wait→stop→Test reaches the same Code 3 and stops progressing. Default-skip the integration on both installed iOS 26.4 and 26.5 runtimes; retain `RILLORA_RUN_UNSTABLE_STOREKITTEST=1` only for explicit diagnostics. A matching Apple Developer Forums report is supporting context, not proof of a universal defect.
- Pending decision: only the real Ask to Buy system path counts. Apple’s `Ask Permission` sheet returned an app-visible pending message and changed no access; manager approval then produced subscribed status. The older `Purchase Intent` success notice without an app event remains insufficient historical evidence.
- Expiration decision: a same-account, non-renewing monthly transaction dated one month in the past is valid local expired-state evidence only after the relaunched app’s verified status path displays `Expired`.
- Billing decision: retry and grace are separate observable states. A 30-second renewal yielded app-visible billing retry; a five-minute rate plus a six-minute-old same-account transaction created a stable app-visible grace window. Enabled configuration controls alone remain insufficient.
- Storefront decision: a live USA→Canada default-storefront change must update product currency without restart and trigger a fresh service route. The checked run produced `CA$`, while `CAN + GLOBAL_US` returned `none / storefront_not_eligible`, kept `requiresFreshEvaluation=true` and did not persist storefront to the customer profile.
- Safety decision: pending, subscribed, expired, retry, grace and storefront change all preserve `commerce-v1 / billingOpen=false / Free / subscription=null`. No local transaction, status, manager action or client result becomes a normal entitlement.
- Cleanup decision: finish every lifecycle run at `No Transactions`, `USA / Real Time / retry off / grace off / Ask to Buy off / interrupted off / dialogs on`, with Xcode and the test Simulator stopped.
- Verification: final XcodeBuildMCP suite `94 passed / 0 failed / 1 skipped`; fresh Release Simulator build passes and contains no `.storekit`; hash-bound evidence `11–17` and the exact observation are under `qa/storekit-local-2026-08-20/`.
- Supersedes: the immediately preceding decision only where it listed pending／Ask to Buy, explicit expired state, billing retry／grace or storefront change as open. Post-login restore remains at the Owner Apple-account gate. The StoreKitTest skip remains open until a future toolchain can execute it.
- Does not imply: Apple sandbox, App Store Connect products, Paid Apps Agreement, banking／tax completion, App Store server credentials, Notifications V2, server PKI, entitlement activation, App Review, a charge or release.

## 2026-08-21 — Update to Xcode 26.6, but require the unavailable iOS 26.6 runtime before retrying StoreKitTest

- Status: XCODE 26.6 INSTALLED AND VERIFIED; IOS 26.4／26.5 STOREKITTEST STILL CODE 3; IOS 26.6 RUNTIME UNAVAILABLE; DEFAULT SKIP RETAINED.
- Source decision: Apple DTS’s accepted forum answer marks the matching `SKTestSession` configuration issue as known. Apple’s iOS 26.6 release note separately says Simulator test-environment connection is fixed. These are now valid reasons for a targeted toolchain/runtime update, not proof that any installed environment passes.
- Update decision: update the existing Mac App Store Xcode from 26.5 to official 26.6 (`17F113`). The update completed without Agent entry of a Mac password, Apple credential or acceptance of a new legal agreement. Do not install unofficial Xcode or runtime packages.
- Runtime result: Xcode 26.6 still produces Code 3 on the retained iOS 26.4 Simulator. A newly created clean iOS 26.5 Simulator also produces Code 3 and an empty catalog; it was deleted after the scoped test so it cannot be confused with retained evidence devices.
- Availability decision: the exact official command requesting iOS 26.6 arm64 returns `iOS 26.6 (arm64Only) is not available for download`. Do not substitute another historical runtime or treat the release note as local execution proof.
- Verification: Xcode 26.6／iOS 26.5 full suite `94 passed / 0 failed / 1 skipped`; fresh Release Simulator build passes and excludes `.storekit`. Evidence `18–22` and hashes are recorded under `qa/storekit-local-2026-08-20/`.
- Retry decision: retain the installed-runtime default guard and explicit `RILLORA_RUN_UNSTABLE_STOREKITTEST=1` diagnostic. The next automated retry occurs only when the official iOS 26.6 runtime becomes available, or a newer Apple release explicitly supersedes this boundary.
- Supersedes: the immediately preceding decision only where it described Xcode 26.5 as the current toolchain or a generic future toolchain update as the next retry. It does not change the completed manual SK0 lifecycle matrix, the Owner restore-login gate or any external Apple legal／money／credential gate.
- Does not imply: an automated StoreKitTest pass, Apple sandbox, App Store Connect products, Paid Apps Agreement, banking／tax completion, server credentials, entitlement activation, App Review or a charge.

## 2026-08-21 — Complete explicit restore inside the Xcode-local authentication simulation

- Status: STOREKIT SK0 LOCAL USER-FLOW MATRIX COMPLETE; AUTOMATED STOREKITTEST AND ALL APPLE EXTERNAL GATES REMAIN OPEN.
- Prompt decision: the `AppStore.sync()` sheet in the active `RilloraStoreKitLocal` environment explicitly said `Press “OK” to simulate authenticating with an Apple Account` and `[Environment: Xcode]`. It exposed no Apple ID, password, MFA field or account selector. Under the Owner's standing authorization for all test-mode actions, selecting `OK` was a reversible local test operation rather than a personal-credential action.
- Runtime result: the app displayed `Local StoreKit history was refreshed. Ordinary Rillora access is still server-owned.` Verified local transactions and current local entitlements both remained zero. A concurrent API read returned `commerce-v1 / billingOpen=false / planCode=free / subscription=null` with only Free baseline entitlements.
- Evidence: `qa/storekit-local-2026-08-20/23-post-restore-local-auth.jpg`, SHA-256 `d2635c998884ab9abfa5240c7edcc91f9f0e5cbf26490c33cb2a513ee0b08de5`, plus `24-restore-xcode-simulated-auth-prompt.jpg`, SHA-256 `25f4977cd4cabdb82f2c30fdd474151bc966f44132d5513ac9f68e4c4e449a57`.
- Supersedes: the prior current-state statement that post-login restore still required Owner Apple-account input. It does not rewrite the earlier cancelled prompt observation or claim a real App Store account was used.
- Does not imply: real App Store／Sandbox Apple Account authentication, restoration of an App Store Connect transaction, an automated `SKTestSession` pass, Apple sandbox, App Store Connect products, Paid Apps Agreement, banking／tax completion, server credentials, entitlement activation, App Review or a charge.
- Implementation impact: no code or data mutation is required. SK0 is complete except for the independently tool-blocked automated integration; the next actionable phase is SK1 and remains behind explicit Owner legal／money decisions for Apple agreements, banking, tax and external product creation.

## 2026-08-21 — Authorize SK1 inspection while keeping Apple legal and financial forms personal

- Status: SK1 START AUTHORISED; APP STORE CONNECT LOGIN AT OWNER CREDENTIAL GATE; NO APPLE COMMERCIAL OBJECT CREATED.
- Owner decision: “开始吧” authorises opening App Store Connect, checking the exact Rillora team／app／bundle and proceeding toward the already specified non-live subscription group and two product identifiers. It does not authorise live availability, App Review submission, a real charge or ordinary entitlement mutation.
- Personal-action boundary: the Owner must personally enter Apple credentials and MFA／passkey, accept any Paid Apps Agreement and submit banking, tax or identity information. The Agent may prepare and verify the page state but must not read or enter those values or accept the legal agreement.
- Current result: all 48 project-owned Markdown files were reread before work. Owner personally completed Apple login, Paid Apps acceptance, bank and U.S. tax inputs, and the DSA declaration matching the locked US-first／EU-closed scope. Readback confirms team `8L99CFNK24`, individual membership active, both Free／Paid Apps Agreements active, the Hong Kong receiving bank available and both U.S. tax forms active. The New App control is restored, but no Rillora App, subscription group, product, storefront availability or key exists yet.
- App-record draft decision: use iOS name `Rillora`, primary language `en-US`, existing explicit bundle `com.rillora.ios`, full account access and immutable internal SKU `RILLORA-GLOBAL-IOS-001`. The SKU names the current Global plane so a later separately approved Mainland app cannot be confused with this record; it is not customer-visible or a release claim.
- Exact next action: after Owner gives action-time confirmation for the final Apple external submission, click `Create` and read back the resulting App ID／state. Then create one non-live subscription group and `com.rillora.family.monthly`／`com.rillora.family.annual`, recording their exact external state without availability or review submission.
- Does not imply: Paid Apps Agreement acceptance, banking／tax completion, App Store Connect app existence, product creation, sandbox transaction, In-App Purchase server key, Notifications V2, App Review, entitlement activation, sale or charge.

## 2026-08-21 — Create the non-live Rillora App and one same-level Family subscription group

- Status: APP STORE CONNECT APP／GROUP／MONTHLY／ANNUAL RECORDS CREATED; PRICE／AVAILABILITY／SANDBOX／REVIEW CLOSED.
- App record: iOS `Rillora`, Apple App ID `6803957639`, bundle `com.rillora.ios`, SKU `RILLORA-GLOBAL-IOS-001`, primary language `en-US`, full account access, `Prepare for Submission`.
- Subscription group: `Rillora Family`, Apple group ID `22325627`, `Prepare for Submission`.
- Products: monthly `Rillora Family Monthly / com.rillora.family.monthly / Apple ID 6803958645 / one month`; annual `Rillora Family Yearly / com.rillora.family.annual / Apple ID 6803959021 / one year`. Both are `Prepare for Submission`.
- Entitlement-level correction: Apple initially placed monthly at level 1 and annual at level 2. Because both grant the same `family-v1` capabilities, they were moved into the same level 1 rather than being modeled as an upgrade／downgrade. Family Sharing remains off.
- Environment boundary: local Xcode group `D7BCE9A1` and App Store Connect group `22325627` are different environment identifiers. Future sandbox code must select the correct group explicitly; do not replace the local fixture ID globally or accept any arbitrary group.
- Closed actions: no price, availability, localization, offer, build, review metadata, `Add for Review`, App Review, storefront sale, ordinary entitlement, transaction or charge was created.
- Exact next gate: Owner decides whether to set the provisional US$9.99／US$99 prices and USA-only availability required for sandbox propagation. A Sandbox Apple Account is created only after that money／market decision and a separate credential/account-creation confirmation.
- Does not imply: sandbox product load, Sandbox Apple Account, signed transaction, server PKI, Notifications V2, StoreKit entitlement, App Review approval, sale, revenue or public release.

## 2026-08-22 — Separate US-first release scope from multi-storefront payment testing

- Status: SANDBOX COVERAGE CORRECTED; PRICE／AVAILABILITY STILL AWAIT OWNER MONEY／MARKET APPROVAL.
- Correction: withdraw the prior recommendation to use USA as the only StoreKit sandbox availability. It conflated the first public launch market with the engineering evidence needed for both Stripe and StoreKit.
- Testing decision: do not manually test all 175 storefronts. Cover policy and currency classes with `USA / CAN / GBR / IRL / JPN / BRA / KOR / HKG`, while automated route-policy tests cover the full country-code table. One Sandbox Apple Account may be switched between these storefronts.
- Provider decision: US iOS tests both the Stripe external-Web primary route and an explicit StoreKit review fallback, never simultaneously. Representative non-US storefronts test StoreKit. Stripe test mode independently covers international cards and lifecycle behavior; additional presentment currencies require separate versioned catalog prices and cannot be inferred from StoreKit localization.
- Regional boundary: `CHN` remains outside the Global app sandbox availability because Mainland requires a separate app, operator, data, identity, filing and payment plane. EU public distribution remains closed even though `IRL` is included for StoreKit sandbox behavior.
- Release safety: App Store Connect availability is not a sandbox-only field. Before any App Review submission, read it back and restrict it to the then-approved launch markets. Sandbox coverage never becomes publication authorization.
- Exact next gate: Owner approves or rejects the provisional US$9.99／US$99 price metadata and the eight-storefront sandbox availability set; then create one purpose-limited Sandbox Apple Account under a separate account／credential confirmation.

## 2026-08-22 — Isolate Xcode and App Store subscription groups before Sandbox purchase work

- Status: SANDBOX CATALOG HARNESS IMPLEMENTED AND COMPILED; APP STORE METADATA AND RUNTIME EVIDENCE STILL OPEN.
- Environment decision: replace the single implicit StoreKit group with explicit `disabled / xcodeLocal / appStoreSandboxCatalog` selection. Xcode local accepts only `D7BCE9A1`; App Store Sandbox catalog accepts only `22325627`; both process flags together fail closed. The product allowlist remains unchanged.
- Evidence decision: apply the selected group to product loading, current entitlements, transaction updates, point-in-time subscription status and status updates. A product list from the other group is incomplete evidence and must be rejected rather than accepted through a broad known-group allowlist.
- Purchase-boundary decision: SK1 Sandbox code is catalog-read-only. It may display App Store Connect localized names, prices and storefront, but exposes no purchase／restore control and cannot finish a transaction. Sandbox purchase remains blocked until SK2 can send Apple-signed evidence to the authenticated server and wait for durable acknowledgement; ordinary access remains server-owned Free.
- Scheme decision: add `RilloraStoreKitSandboxCatalog` as a Debug-only scheme with `RILLORA_STOREKIT_SANDBOX_CATALOG_TESTING=1` and no active local StoreKit configuration. Retain `RilloraStoreKitLocal` unchanged for Xcode-only lifecycle testing.
- Verification: XcodeGen lists four schemes; the Sandbox catalog scheme builds and build-for-testing succeeds. Two CommerceStore tests cover App Store-group loading without purchase and rejection of the Xcode group. All Simulators were shutdown, so no test execution or App Store product load is claimed.
- External-state boundary: the App Store Connect localization form was opened but no value was saved. Price, availability, localization, Sandbox account, review and sale remain unchanged pending the one required action-time write confirmation.
- Exact next gate: save only the documented group／product localizations, US$9.99／US$99 prices and `USA / CAN / GBR / IRL / JPN / BRA / KOR / HKG` availability; read back the result; then wait for propagation before booted-Simulator catalog validation.

## 2026-08-22 — Configure the bounded Sandbox catalog and adopt Apple’s official JWS verifier without a server key

- Status: APP STORE SANDBOX METADATA／TESTER COMPLETE; OFFICIAL VERIFIER FOUNDATION COMPLETE; RUNTIME LOAD／PURCHASE／SERVER API／REVIEW OPEN.
- Metadata decision: save `en-US` group／monthly／annual localizations, monthly US$9.99 and annual US$99.00. Select exactly `USA / CAN / GBR / IRL / JPN / BRA / KOR / HKG` for both products, disable automatic future-country availability and keep `CHN` out of the Global app. Annual is one-year prepaid; do not enable Apple’s distinct twelve-month monthly-payment contract.
- Price readback: monthly `USD 9.99 / CAD 12.99 / GBP 9.99 / EUR 9.99 / JPY 1,500 / BRL 59.90 / KRW 17,000 / HKD 88`; annual `USD 99.00 / CAD 129 / GBP 99 / EUR 99 / JPY 15,000 / BRL 599.90 / KRW 149,000 / HKD 788`. These are Apple-localized Sandbox metadata, not Stripe price records or market evidence.
- Tester decision: create one purpose-limited Sandbox tester with initial USA storefront and store the generated credentials only in macOS Keychain under `Rillora StoreKit Sandbox Tester`. Do not retain the credential identifier or password in project files, Markdown, command arguments or output. The first reserved-domain attempt failed without creating an account; one tester exists after the valid-domain retry. Do not accept mere item existence as storage proof: replace the incorrect non-interactive CLI value through Security.framework stdin, then use one-time Owner `Allow` to verify only expected length／complexity／suffix. Never select `Always Allow` for this check.
- Verification-library decision: use Apple’s official `@apple/app-store-server-library` `3.1.0`, not payload splitting or an unofficial decoder. Download the three roots from Apple PKI, pin their exact SHA-256 values and package them in the non-root runtime image. Keep online certificate checks enabled by default when a real verifier is constructed.
- Binding decision: verified Sandbox data must match `com.rillora.ios`, group `22325627`, the exact Family product allowlist and representative storefront matrix. Device transactions additionally match the authenticated planner’s UUID token and current storefront. The planner token is an account-binding reference and must not be misstored as the commerce-account ID.
- Evidence decision: normalized signals keep reference fields plus a SHA-256 digest and never retain raw JWS. Even verified Apple data still requires an authoritative Server API snapshot. This implementation exposes no HTTP intake, writes no provider inbox row, grants no entitlement and finishes no transaction.
- Regional-route verification: the Apple adapter accepts exact evidence for all eight test storefronts, but the server keeps `CAN / GBR / IRL / JPN / BRA / KOR / HKG` outside `GLOBAL_US` routing as `storefront_not_eligible`; App Store test availability does not authorize a purchase route.
- Verification: API typecheck／build, `89 / 89` tests, production audit with zero known vulnerabilities, Docker build, official verifier import and three-root runtime packaging pass. The official library’s transitive `jsrsasign@11.1.5` maintenance deprecation warning is recorded and monitored; it is not hidden or treated as an audit finding.
- Does not imply: metadata propagation completed, booted-Simulator product load, Sandbox login, purchase, restore, Notifications V2 delivery, durable inbox, Server API key, authoritative snapshot, entitlement, App Review, sale or revenue.
- Exact next gate: boot a retained Simulator for catalog-load evidence after propagation; in parallel implement authenticated signed-transaction intake and durable account-binding／inbox mapping. Creating the In-App Purchase key remains a separate long-term credential action.

## 2026-08-22 — Persist verified StoreKit evidence, but stop both endpoints before authoritative state

- Status: AUTHENTICATED CLIENT INTAKE AND PUBLIC SANDBOX NOTIFICATION INBOX COMPLETE; SERVER API KEY／SNAPSHOT／FINISH／ENTITLEMENT OPEN.
- Client-intake decision: expose authenticated `POST /v1/commerce/storekit/sandbox/transactions`. Verify device JWS against the authenticated planner public UUID and current storefront, reserve／reuse the tenant’s active Global commerce account, persist the digest and original／transaction references, and return `finishAuthorized=false / entitlementChanged=false` with HTTP 202 until an authoritative snapshot exists.
- Notification decision: expose public, Sandbox-gated `POST /api/commerce/storekit/sandbox/notifications`. Do not authenticate Apple by network address; authenticate the data by verifying the top-level notification and nested transaction／renewal JWS. Persist before response, deduplicate by notification UUID and use HTTP 202 for `needs_mapping` or `needs_authoritative_snapshot`.
- Account-mapping decision: a verified `appAccountToken` is a planner binding. A security-definer resolver may map it only to an already active `global / GLOBAL_US` commerce account. Public notifications cannot create accounts, subscriptions or entitlements. The authenticated client route may reserve its own account because planner authentication has already established tenancy.
- Ledger decision: add `needs_authoritative_snapshot` to the inbox state and add `original_transaction / transaction` object-link types. Do not insert `commerce_provider_events`, `commerce_subscriptions` or grants before App Store Server API reconciliation. Repeated client transactions and notification UUIDs only increment the inbox attempt counter and return duplicate.
- Migration decision: `0028_storekit_sandbox_intake.sql` adds the binding／state／link schema. When a later function was accidentally appended after `0028` had been applied locally, checksum enforcement rejected the suite before tests. Restore the exact `0028` checksum and add `0029_storekit_notification_binding.sql`; never rewrite applied migrations.
- Verification: API typecheck／build, `93 / 93` tests, zero-known-vulnerability production audit, Docker build, runtime module import, three pinned roots and packaged `0028／0029` pass. Tests prove non-US Global routes stay closed, `CHN` evidence is rejected, duplicate intake is idempotent, planner binding differs from commerce-account ID, and zero StoreKit provider events exist before snapshot.
- Does not imply: deployed endpoint, real Apple notification, App Store Server API authentication, authoritative subscription state, transaction finish, purchase UI, restore, entitlement, review, sale or revenue.
- Exact next gate: boot a retained Simulator for catalog evidence. Server progression requires an Owner-approved In-App Purchase key, issuer ID and key ID stored in isolated secret management; that is a long-term persistent-access action and is not defaulted from test-mode authorization.

## 2026-08-22 — Require durable Apple authoritative status before Sandbox transaction finish

- Status: LOCKED FOR STOREKIT SANDBOX EXECUTION; CREDENTIAL AND DEPLOYMENT OPEN.
- Scope: App Store Sandbox catalog inspection, App Store Server API status, transaction finish and secret isolation.
- Decision: the Debug Sandbox scheme may expose one development-only catalog diagnostic without a private Rillora session because product metadata is non-private and the screen has no purchase, restore or finish action. A real Sandbox transaction may receive `finishAuthorized=true` only after Apple Server API status is retrieved, both returned JWS values pass the official verifier and the provider event, subscription history and reconciliation commit durably.
- Evidence: the diagnostic root ran on `Rillora-Matrix-17-Pro-Max` and read storefront `USA`, but the two products were unavailable. API typecheck／build and `98 / 98` tests prove status mapping, binding rejection, retry, durable write and duplicate acknowledgement. iOS reports `97 passed / 0 failed / 1 skipped`. AWS IaC reports `9 / 9` and enabled synthesis only.
- Secret decision: key ID, issuer ID and PKCS#8 private key are a complete set and three separate scalar secret values. The MFA staging operator may put／describe but not read them; the ECS execution role receives them only in the opt-in Apple task. No deployment occurs from synthesis.
- Supersedes: the current-state statement that the App Store Server API client and authoritative reconciliation were unimplemented. It does not supersede the open long-term credential gate or the prohibition on ordinary entitlement mutation.
- Does not imply: product propagation, Sandbox tester authentication, a purchase, real Apple notification, generated/downloaded key, AWS secret creation, stack deployment, entitlement activation, App Review, sale or revenue.
- Implementation impact: `RilloraStoreKitSandboxCatalog` owns the diagnostic root; `AppleStoreKitSandboxSnapshotAdapter` and the StoreKit executor enforce the finish gate; migration `0030` binds the real Sandbox group/products; `appleStoreKitSandboxEnabled` remains off until a separately confirmed credential and money-impact deployment sequence.

## 2026-08-24 — Create one long-term IAP key, but do not bypass the protected download boundary

- Status: KEY CREATED; APPLE MARKS ONE-TIME DOWNLOAD COMPLETE; PRIVATE FILE HANDOFF OPEN; RUNTIME／DEPLOYMENT CLOSED.
- Scope: the App Store Connect In-App Purchase key used by the Sandbox App Store Server API adapter.
- Owner decision: after the browser-required action-time gate, the Owner said “你直接生成,” authorizing the exact `Rillora StoreKit Server` persistent credential creation and its one-time download.
- External result: App Store Connect now lists exactly one active key and records it as downloaded on 2026-08-24. The page no longer offers a download action. No second key was created and no key was revoked.
- Local result: the page-provided Issuer ID and Key ID are stored under ignored `.local-secrets/storekit/` with directory mode `0700` and file mode `0600`; value-blind UUID／ten-character validation passed and the clipboard was cleared. Values are not recorded in source or Markdown.
- Protected-download decision: the in-app browser consumed the one-time download but did not expose a file handle. Searches of ordinary Downloads, Codex temporary/support paths and macOS application containers found no accessible `.p8`／PKCS#8 file; the Owner also saw no file. Computer History recorded only the two embedded-browser clicks, with no system save panel or file path. Do not inspect browser profile databases or call the credential runtime-ready. Treat the private key as unrecoverable.
- Does not imply: complete local credential storage, Apple Server API authentication, AWS Secrets Manager values, AWS deployment, Sandbox product load／login／purchase／restore／notification, transaction finish, entitlement mutation, App Review, sale or revenue.
- Implementation impact: keep `appleStoreKitSandboxEnabled=false`. Create a replacement key first and capture its second-stage download correctly; validate its `.p8` locally before revoking the original under a separate destructive confirmation. Then rerun local Server API and Sandbox catalog checks before any separate money-impacting deployment decision.

## 2026-08-24 — Stop using the in-app Browser for Apple one-time IAP private-key downloads

- Status: LOCKED PROCESS CORRECTION; TWO UNUSABLE KEYS ACTIVE; CHROME OWNER-LOGIN GATE OPEN.
- Trigger: the Owner approved one replacement. `Rillora StoreKit Server 2` was created while the original remained active.
- Controlled retry: Apple’s first download control opened the warning as expected. Before the second-stage final `Download`, the Browser event listener was installed and awaited for the full supported timeout. Apple marked the key downloaded, but no event／file handle arrived and filesystem search again returned zero PKCS#8 files.
- Decision: the in-app Browser is not an acceptable surface for Apple one-time `.p8` downloads. Do not create a third key there. Retain both key IDs in ignored mode-`0600` local metadata solely for later revocation; neither key is runtime authority.
- Recovery surface: connected Chrome supports normal Finder-visible downloads. The Owner personally completed App Store Connect login. `Rillora StoreKit Server 3` is prepared with `Generate` enabled and has not been submitted. After a new persistent-key action-time confirmation, create this final replacement in Chrome, verify its private file first, then request a separate destructive confirmation to revoke both unusable keys.
- Does not imply: a usable App Store Server API credential, AWS secret, deployment, Sandbox transaction, finish, entitlement, review, sale or revenue.

## 2026-08-24 — Accept the Chrome third key as the usable local credential

- Status: FINAL LOCAL CREDENTIAL COMPLETE; TWO UNUSABLE KEYS AWAIT REVOCATION; CLOUD／PURCHASE CLOSED.
- Owner confirmation: the Owner explicitly confirmed creation of `Rillora StoreKit Server 3`, then confirmed the downloaded file was visible in Chrome Downloads.
- File result: exactly one `.p8` newer than the pre-download baseline was moved from Downloads to ignored `.local-secrets/storekit/iap-private-key.p8`. The directory is `0700`; private key, fingerprint, current Key ID, Issuer ID and two revocation IDs are `0600`.
- Validation: size `257`, PKCS#8 delimiters, `openssl pkey` parse, `openssl pkcs8 -nocrypt` parse, stored SHA-256 fingerprint, strict Git-ignore checks and official Sandbox client construction pass. No network request or AWS deployment occurred.
- Logging deviation: one diagnostic command accidentally emitted an eight-character Base64 tail fragment from the private file to local agent tool output. It did not expose the full key or usable credentials, but the no-fragment discipline was violated and all later checks were made silent. The limited fragment does not make the EC key cryptographically recoverable; the deviation remains recorded.
- Key selection: `Rillora StoreKit Server 3` is the only candidate to retain. The first two private keys are unrecoverable; their IDs are stored only for exact revocation and must never be injected.
- Exact next gate: destructive action-time confirmation to revoke the first two keys while retaining the third. Then perform local/server Sandbox validation before any money-impacting AWS Secrets Manager deployment.
- Does not imply: revoked old keys, Apple Server API network success, Sandbox product load／login／purchase／restore／notification, transaction finish, entitlement mutation, App Review, sale or revenue.

## 2026-08-24 — Revoke both no-private-file keys and retain only the validated Chrome key

- Status: KEY ROTATION CLEANUP COMPLETE; ONE ACTIVE KEY; CLOUD／PURCHASE CLOSED.
- Owner confirmation: the Owner explicitly confirmed destructive revocation of `Rillora StoreKit Server` and `Rillora StoreKit Server 2`, while retaining `Rillora StoreKit Server 3`.
- Selection proof: Chrome Edit mode showed exactly two selected rows; the final key checkbox was unchecked. Apple’s final warning was accepted once.
- External readback: App Store Connect now shows `Active (1)` containing only the final key and `Revoked (2)` containing the first two keys, both with revocation date 2026-08-24. Apple states revoked rows remain visible for 30 days.
- Local readback: old IDs moved to ignored `.local-secrets/storekit/revoked/` with a revocation-date marker; the retained private key silently parses after the move. No active credential file changed.
- Supersedes: all prior current-state entries describing two or three active keys. They remain historical evidence of the recovery process.
- Does not imply: Apple Server API network success, AWS Secrets Manager, staging deployment, Sandbox product load／login／purchase／restore／notification, transaction finish, entitlement mutation, App Review, sale or revenue.
- Exact next gate: local/server Sandbox validation with the retained key; money-impacting AWS secret creation and deployment remain separately Owner-gated.

## 2026-08-24 — Separate the real Sandbox purchase path from stale Xcode StoreKit state

- Status: LIVE USA SANDBOX CATALOG VERIFIED; DEBUG-ONLY SERVER-GATED PURCHASE HARNESS IMPLEMENTED; TESTER LOGIN／PURCHASE COMPLETION OPEN.
- Root-cause decision: the earlier Pro Max `Products unavailable` result was caused by a retained Xcode-local StoreKit account, receipt and `ASOctaneSupportXPCService`; logs showed requests going to a local `localhost` catalog. It was not proof that App Store Connect metadata had failed to propagate.
- Runtime decision: preserve the negative result, but use a clean booted Simulator and direct app install／launch for real Sandbox catalog evidence. `Rillora-Matrix-17-Pro` then loaded both exact App Store products at USA prices. Do not mix a Simulator previously attached to `RilloraStoreKitLocal` into an App Store Sandbox conclusion without log verification or cleanup.
- Credential decision: a bounded read-only official Server API probe with a nonexistent synthetic transaction ID returned Apple `4040010 / TRANSACTION_ID_NOT_FOUND`, not authentication failure. This establishes current Sandbox JWT acceptance only; it does not establish a real transaction or subscription.
- Purchase decision: add `RilloraStoreKitSandboxPurchase` as a separate Debug-only scheme. It binds the synthetic planner UUID, real App Store group `22325627`, both product IDs and local API 4182. A verified StoreKit transaction is submitted to the authenticated server; the client may finish only after Apple authoritative signed status is durably persisted. Pending／failed snapshots remain unfinished and retryable. Every response must keep `entitlementChanged=false`, `entitlementMutationEnabled=false` and ordinary access Free.
- Secret-handling decision: `tools/storekit/run-local-sandbox-api.sh` reads the ignored mode-`0600` key／issuer／private-key files directly, verifies Git ignore and permissions, and starts the local Apple-enabled API without printing values or embedding them in command arguments.
- Evidence: real USA catalog load; Apple 4040010 credential probe; XcodeGen five-scheme readback; purchase-scheme build; iOS `101 passed / 0 failed / 1 skipped`; API typecheck／build／`98 / 98`; production audit zero; local migrations／seed／4182 readiness. The annual button reached Apple's real Sandbox Apple Account/password prompt.
- Does not imply: tester credential submission, completed purchase, signed transaction intake, authoritative snapshot for a real transaction, finish, restore, notification, entitlement mutation, AWS deployment, App Review, sale or revenue.
- Exact next action: complete the purpose-limited tester login and annual test purchase, then verify durable rows and ordinary Free access before approaching the independent AWS money gate.

## 2026-08-24 — Treat repeatable Simulator Sandbox authentication failure as an Apple external block

- Status: TESTER CREDENTIAL SUBMISSION CONFIRMED AND EXECUTED; LIVE USA CATALOG VERIFIED ON IOS 26.4／26.5; SIMULATOR AUTHENTICATION BLOCKED BEFORE TRANSACTION; ORDINARY ACCESS FREE.
- Owner confirmation: the Owner explicitly confirmed transmitting the purpose-limited Keychain Sandbox email／password to Apple and completing the `US$99.00` annual test purchase. This authorised only Apple Sandbox authentication and a no-charge test transaction; it did not open production billing, AWS deployment or entitlement mutation.
- Cross-runtime evidence: the original tester and a fresh replacement on clean iOS 26.5, then an independently rotated tester on a newly created directly installed iOS 26.4 Simulator, all reached AuthKit recognition but failed Apple account credential verification with `AMSErrorDomain 100`; the nested error was `AMSErrorDomain 2 / Password reuse not available for account / The account state does not support password reuse`. Both clean runtime families load the real USA annual／monthly catalog. StoreKit returned cancellation before any payment sheet or transaction.
- Attribution decision: classify this as an Apple Simulator Sandbox account-persistence block, not as Rillora product propagation, StoreKit product-ID, server-key or reconciliation failure. Apple Developer Forum threads document the same error on Simulator, while current Apple Developer System Status reports App Store Sandbox available; therefore do not claim a broad acknowledged outage.
- Credential incident and rotation: one iOS 26.4 automation path reused an invalid secure-field reference and put the replacement password into the account field, which caused a local automation snapshot to echo the test credential. Submission was cancelled. The exact `StoreKit2 Rillora` tester and `Rillora StoreKit Sandbox Tester 2` Keychain entry were deleted, the value was cleared from process memory, and a separately generated USA tester was stored only as `Rillora StoreKit Sandbox Tester 3`. The original tester remains for diagnostic history. No exposed replacement credential remains active.
- Ledger and entitlement proof: local API `4182` received no StoreKit transaction. StoreKit Sandbox inbox rows, provider events, subscriptions, reconciliations and entitlement mutations are all zero; the synthetic planner gained no commerce account or grant from these attempts. Fresh ordinary `commerce-v1` remains `billingOpen=false / planCode=free / subscription=null`, with ten Free-baseline entitlements and both callback／client-purchase access grants false. No finish, restore, authoritative transaction snapshot or Notifications V2 delivery exists.
- Supersedes: the immediately preceding current gate that waited only for Simulator credential submission. Historical pre-login evidence remains valid, but tester credential submission is no longer missing.
- Exact next gate: bring the paired physical iPhone online and execute the development-signed Sandbox purchase with Keychain item `Rillora StoreKit Sandbox Tester 3`, or retry after an Apple runtime／service change. Require durable Apple-authoritative reconciliation before `Transaction.finish()` and re-read ordinary Free access. AWS secret creation／deployment remains a separate money-impact gate.
- Does not imply: a completed Sandbox purchase, signed transaction intake, Server API status for a real transaction, finish, restore, notification, App Review, sale, revenue, live payment or ordinary entitlement mutation.

## 2026-08-24 — Adopt a liability-minimising no-external-counsel legal candidate and mandatory versioned clickwrap

- Status: OWNER-DIRECTED LEGAL CANDIDATE AND LOCAL ENFORCEMENT COMPLETE; REAL OPERATOR FACTS／PUBLICATION／AUTH0 DEFENCE-IN-DEPTH／PURCHASE CONSENT OPEN.
- Owner direction: the Owner does not intend to hire a lawyer, asked the Agent to act with lawyer-level drafting rigor, minimize the Owner's responsibility as far as reasonably lawful, identify missing facts, and require every user to agree before registration／use.
- Professional-status boundary: the Agent may prepare a source-backed candidate but is not represented as a licensed lawyer. Rillora must not claim counsel review or guaranteed enforceability. Non-excludable fraud, wilful misconduct, applicable gross-negligence, death／personal-injury, privacy and mandatory consumer duties remain carved out; an absolute exclusion that is likely invalid is rejected as weaker protection.
- Document decision: expand Web legal routes to Privacy, Terms, Subscription Terms, Refund & Cancellation, Acceptable Use, Cookie Notice and Legal Notice. Terms include electronic records, no attorney／fiduciary／custody／agency relationship, user content／third-party duties, prohibited secrets, provider／export／beta boundaries, disclaimers, indirect／consequential-loss exclusion, proposed aggregate cap `max(US$100, prior-12-month fees)`, indemnity, force majeure, proposed one-year claim period, severability／assignment and proposed Hong Kong law／non-exclusive Hong Kong courts with mandatory-rights savings. No US binding arbitration／class waiver is activated without a real forum, fees and enforceability.
- Commerce decision: registration consent never authorizes a charge. Subscription price, recurring period, renewal, cancellation, refund and provider require a separate affirmative action immediately before purchase. Direct-Web candidate is non-refundable except mandatory law or written exception; cancellation stops the next renewal and ordinarily preserves the paid period; Apple controls App Store refunds. Ordinary billing remains closed.
- Web／iOS UX decision: both use unchecked clickwrap, no preselected acceptance and no marketing／plan language. Web opens Terms／Privacy separately; iOS uses one compact local-state Sheet before hosted Auth0 and adds no provider or credential controls. Buttons remain disabled until the control is selected. Legal pages support print／save.
- Server decision: replace Web direct GET login with `POST /auth/start`; native exchange requires the same proof. Accept only the exact Terms／Privacy／consent-copy versions, normalized bundle SHA-256 and literal true Terms／Privacy-acknowledgement／electronic-record fields. Unknown fields fail. Planner, append-only acceptance and typed session commit atomically; old／stale sessions fail. `GET /auth/legal-contract` and authenticated `GET /v1/legal/acceptance` expose bounded evidence.
- Data-minimization decision: legal evidence stores versions, bundle digest, client surface, server time and a one-way identity-reference digest. It stores no document body, IP, user-agent or map content. Planner／identity deletion nulls direct links while retaining only the minimal contract record; Web and iOS acceptances de-duplicate separately.
- Auth0 decision: Rillora's server remains authority. A direct Auth0 identity alone cannot provision or use Rillora. Database Pre User Registration and social Post Login Redirect are defence in depth and remain undeployed until public legal URLs and rollback are ready.
- Verification: API typecheck／build／`103 / 103`／zero production vulnerabilities; Web `41 / 41` plus production build; iOS `102 passed / 0 failed / 1 skipped` plus Release build; IaC `9 / 9`; Browser desktop DOM／screenshot／console and Simulator consent-state runtime evidence pass. Browser viewport emulation was unavailable, so no new mobile-Web screenshot is claimed.
- Required Owner facts: English legal name, residence／tax country, public service address, monitored support／privacy／security mailboxes, final governing-law choice, liability cap, refund rule, retention schedule and US-first allowlist. Until confirmed, environment placeholders and the `Not yet a production legal notice` banner remain.
- Supersedes: the product/authentication rule only where private actions opened hosted Auth0 immediately. They now pass through one concise legal preflight; the prohibition on embedded credentials and duplicate provider buttons remains.
- Does not imply: legal advice, counsel review, universal enforceability, public legal publication, Google OAuth production verification, Auth0 Action deployment, a real user acceptance, purchase consent, billing activation, App Review or release.

## 2026-08-25 — Clarify Hong Kong law, channel refunds, decades-long continuity retention and broad ready-market launch

- Status: OWNER CLARIFICATION RECORDED; RETENTION CANDIDATE UPDATED; US-ONLY RELEASE DIRECTION SUPERSEDED; EXACT FIRST-WAVE ROWS／OPERATOR FACTS STILL OPEN.
- Governing-law decision: Hong Kong law with non-exclusive Hong Kong courts and a 30-day informal-resolution step remains the recommended default only if the actual operator／business has a genuine Hong Kong connection. HKID alone is insufficient. Mandatory consumer rights where the user lives remain preserved. Exclusive Hong Kong venue is not selected because the extra apparent protection may be more vulnerable in a consumer standard-form contract.
- Liability-cap decision: retain `max(US$100, prior-12-month fees)` as a conspicuous candidate, not a Hong Kong／US statutory safe harbour. Hong Kong consumer／standard-form exemption and indemnity clauses remain subject to reasonableness; US enforceability varies by state and claim. Fraud, wilful misconduct, non-excludable negligence／personal injury, privacy and mandatory consumer liabilities remain outside the cap.
- Refund clarification: the policy is channel-specific, not Web-only. Rillora controls direct Web／Stripe refunds; Apple controls App Store refund decisions; any future Google Play／other store uses its mandatory channel. The default questionnaire now asks for the direct-Web rule, while the public policy describes all channels. Registration still does not authorize recurring payment.
- Retention correction: the earlier shorthand `30-day active / 90-day backup` was post-deletion cleanup, not ordinary plan lifetime. An active digital-continuity plan may be retained for years or decades while its purpose continues. Inactivity, missed sign-in／review, device silence, payment failure, cancellation or Family→Free downgrade never automatically deletes, declares abandonment, proves death or permits disclosure. Users may review／export／delete; verified deletion starts 30-day active-system and 90-day backup expiry. Minimal contract／payment records may remain seven years; security logs up to 12 months.
- Market decision: supersede the artificial `US storefront only` public-charge launch. Open every versioned market-register row that is genuinely ready. `USA` and `HKG` are first-wave core candidates; additional ready rows may launch concurrently. Apple offers 175 storefront selections, but `All Countries or Regions` is not used while any row is legally／operationally closed. Hong Kong iOS may use StoreKit after App／operator gates; Hong Kong Web Stripe additionally requires actual right to operate, business commencement／registration, KYC, bank, tax and support. EU／EEA, UK, mainland China and special tax／filing／payment rows retain their own gates.
- Implementation impact: Privacy／Terms now state life-of-active-account retention and distinguish post-deletion cleanup; Terms／Privacy advance to `2026-08-25-preview-2`, the remaining legal-page labels advance to preview-2, and the legal bundle digest plus Web／API／iOS contract were rotated together. Product, monetization, individual-operator and handoff authorities now use broadest-ready-market language. Earlier 30-day direct-Web money-back wording is retained only as a dormant experiment and no longer conflicts with the current non-refundable-except-law-or-written-exception candidate.
- Does not imply: Hong Kong business registration, immigration／condition-of-stay clearance, Stripe live activation, an approved market row, public App availability, legal enforceability, billing or release.

## 2026-08-27 — Use one Zoho mailbox with privacy and security aliases

- Status: ROLE MAIL ADDRESS CREATION, PUBLIC DNS, INTERNAL DELIVERY LOOP AND ORGANIZATION TFA ENFORCEMENT COMPLETE; EXTERNAL DELIVERY／NEXT-LOGIN FACTOR ENROLMENT／MONITORING OPEN.
- Provider decision: use Zoho Mail for human role correspondence. Keep one licensed mailbox, `support@rillora.xyz`, and route `privacy@rillora.xyz` plus `security@rillora.xyz` into it as aliases. Do not buy two more users, create groups or enable ZeptoMail merely to separate public roles.
- DNS decision: configure exactly Zoho's three MX records, one root SPF record and the `zmail._domainkey` DKIM TXT. Preserve the existing `_dmarc` policy, Auth0 `login` CNAME and AWS staging records. Manual DNS mapping is preferred to granting Zoho broad GoDaddy-account access.
- External readback: Zoho reported every setup record verified and the Admin Console reports MX／SPF／DKIM `1/1`. GoDaddy lists all six new Zoho verification／mail records. Independent DNS returned all three MX routes and root SPF; after propagation, the exact DKIM TXT also resolved through GoDaddy's authoritative nameserver, Google Public DNS and Cloudflare DNS.
- Security boundary: after exact action-time Owner confirmation, organization TFA enforcement was enabled and read back checked. Zoho will require every user to enrol TFA on next login; the retained session did not complete or expose personal factor, QR, OTP or recovery data. No password, recovery factor or mailbox secret is written to the repository or Markdown.
- Communication result: after exact representational-action confirmation, three purpose-limited messages completed `support@ → privacy@ → security@ → support@`. All three Sent rows report `Delivered`; Inbox contains all three; expanded headers show the exact expected From／To aliases and display names. Message bodies contain no personal or product data.
- Communication boundary: the loop proves Zoho-local sending／receipt and alias-header selection. It does not prove independent external-provider delivery, spam placement, Internet reply behaviour, active human monitoring or SLA performance. The production-contact gate closes only after next-login factor enrolment, external inbound／outbound reply testing and an owned response process.
- Legal impact: the three addresses may remain the candidate public role contacts and environment defaults. Their existence reduces one factual publication gap but does not complete operator name／country／address, governing law, refund, first-wave market, public deployment or purchase-consent gates.
- Does not imply: a production legal notice, public availability, legal sufficiency, external user support, transactional-email capability, live billing, payment, public release or completed security hardening.

## 2026-08-27 — Confirm a privacy-minimised individual legal configuration without publishing private facts

- Status: OWNER CONTRACT PREFERENCES CONFIRMED; PRIVATE OPERATOR INPUTS RECEIVED; IMMIGRATION／BUSINESS-REGISTRATION／PUBLIC-ADDRESS／PRODUCTION-OPERATIONS／PUBLICATION GATES OPEN.
- Scope: first-publication operator inputs, candidate contract defaults, first-wave market intent and personal-information minimisation. This does not itself publish or configure those values.
- Private-fact decision: the Owner supplied the English legal-name input, stated Hong Kong as the residence／tax-country input and supplied a candidate address privately. Exact values must remain outside Git, source, Markdown, test fixtures, logs, screenshots and ordinary QA output. The stated tax-country input is not an independently verified tax conclusion.
- Contract decision: retain Hong Kong law with non-exclusive Hong Kong courts and the 30-day informal-resolution step; retain the proposed `max(US$100, prior-12-month fees)` aggregate cap, proposed one-year claim period, channel-specific refund model, life-of-active-account continuity retention and separate purchase clickwrap. All remain subject to mandatory law, reasonableness and non-excludable-rights savings.
- Market decision: use `USA` and `HKG` as the intended first-wave candidate rows, not as opened markets. Operate personally rather than inventing a company; apply the recommended age／consumer-right, production-data and purchase-consent boundaries.
- Privacy decision: disclose only the minimum facts required by the applicable platform and law. Never publish an HKID number. Prefer a documented lawful service address or P.O. Box where accepted; do not automatically turn the privately supplied residential address into the public service address. An individual App Store seller cannot hide the legal developer name, and an EU trader listing would require additional public contact fields, so EU stays closed unless that disclosure is consciously accepted.
- Operating gate: “individual operation” does not prove the right to establish or join a business under the Owner's exact condition of stay. The current e-Visa／conditions／NOL or right-of-abode／right-to-land evidence must be checked privately. If the paid internet business is carried on in Hong Kong, IRD treats Internet activity for gain as business and generally requires sole-proprietorship registration within one month after actual commencement; business registration is not itself an operating licence.
- Communication decision: the Owner agrees in principle to next-login factor enrolment, external delivery／reply testing and an owned monitoring process, but the personal factor, external representational messages and SLA have not yet been performed or selected.
- Evidence: current official Immigration Department, IRD, Apple, PCPD and US ROSCA sources were rechecked on 2026-08-27. No legal page text or legal-bundle digest changed in this decision-only closeout.
- Does not imply: immigration clearance, self-employment permission, business commencement, Business Registration, tax-residence proof, Stripe live KYC, a privacy-preserving public address accepted by every platform, US state-law completion, production data-flow completion, external mail proof, TFA factor enrolment, App Review, legal enforceability, billing or publication.
- Implementation impact: keep every legal page banner and placeholder, keep exact operator facts outside the repository, and narrow the next gate to private status/address verification plus the remaining mail／production operations before any candidate text rotation or publication action.

## 2026-08-27 — Keep immigration classification outside the legal-drafting workstream

- Status: OWNER SCOPE CORRECTION — LOCKED.
- Scope: the current seven-document legal-candidate work and its next action.
- Owner correction: “terms should move in the lawful direction” means draft the contract, privacy, subscription, refund, liability, retention and market-applicability language against current law and platform rules while minimizing public personal information. It does not ask the Agent to determine the Owner's visa type, NOL, condition of stay, self-employment permission or Business Registration eligibility.
- Decision: do not request immigration／visa evidence and do not make immigration classification the next legal-drafting gate. Treat any operating-permission or registration conclusion as a separate Owner／qualified-adviser／authority matter outside this workstream. The legal candidate may state only the neutral boundary that publication does not itself establish a licence or regulatory permission.
- Privacy decision: continue keeping exact operator values outside the repository; use environment-supplied minimum public facts and prefer a lawful privacy-preserving service address where available.
- Does not imply: immigration or business clearance, removal of any applicable legal duty, permission to publish, billing activation or market readiness.
- Implementation impact: the legal next step returns to text-level legal alignment and minimum disclosure using the facts and preferences already supplied; publication and real payment remain separate action-time gates.

## 2026-08-27 — Use an informational necessary-cookie notice and make the Chinese legal pack the Owner review surface

- Scope: the seven Global legal candidates, their review language, the public Web storage notice and the next legal confirmation gate.
- Legal-text decision: align the English closed-testing pack to the Owner-confirmed contract defaults and minimum-disclosure direction, add a translation hierarchy, and rotate Terms／Privacy to `2026-08-27-preview-3`. The normalized body SHA-256 is `cebdbd3997e81a07b9034c3e14ffabb749620cd986e68466f0f063832aca09a6`; Web, API and iOS must carry the same value. Exact operator identity and address values remain outside the repository.
- Language decision: `docs/legal-candidate-zh.md` is the complete Owner-facing Chinese review companion. The intended Global production contract language is English. A translation is convenience-only where law permits and cannot override a mandatory local-language or interpretation rule. The Chinese companion is not itself a public contract or evidence of legal review.
- Cookie decision: the current public Web uses only authentication-transaction, authenticated-session and CSRF cookies plus a local notice-version value. With no advertising, cross-site tracking or third-party behavioural analytics active, show a compact `Necessary cookies only` information notice with `Review Cookie Notice` and `Got it`. Do not display fake `Accept all`／`Reject all` controls and do not treat dismissal as consent to any future optional technology.
- Future-control decision: optional analytics, advertising or other non-essential storage remains disabled until any applicable prior consent, equally accessible rejection, management, withdrawal and opt-out-preference handling is implemented. A provider may set its own storage only after the user opens its sign-in or payment surface; public reading must not preload that surface.
- Verification: Web `41 / 41` and production build, API typecheck／build and `103 / 103`, iOS `APIClientTests` `32 / 32`, digest readback and `git diff --check` pass. Browser QA passes at default desktop and `390 × 844`: compact nonblank notice, `/cookies` navigation, no duplicate notice on that route, dismissal persistence after reload and zero warning／error console entries.
- Evidence boundary: this is local implementation and review evidence. It does not prove lawyer review, global compliance, public deployment, production processing accuracy, real user acceptance, optional-cookie consent, payment, market opening or release approval.
- Next gate: the Owner reviews and confirms or edits the twelve choices in `docs/legal-candidate-zh.md`. Publication and private operator-value injection remain separately blocked on production facts and explicit approval.

## 2026-08-27 — Promote the approved legal pack to formal release text and fail closed on missing publication facts

- Status: OWNER APPROVED — FORMAL TEXT COMPLETE; CONTROLLED CONFIGURATION AND DEPLOYMENT OPEN.
- Owner approval: items 1–11 are confirmed in full and item 12 requires no additional change. The Chinese file records that approval and becomes a reference translation rather than an approval checklist.
- Formal-version decision: remove every user-visible `closed-testing`, `candidate`, `preview`, non-production banner and release-blocker sentence. All seven pages display `Effective`. Terms／Privacy become `terms-2026-08-27-1` and `privacy-2026-08-27-1`; other documents use matching `2026-08-27-1` versions; bundle SHA-256 is `73d9cb6039b97f72d802e543d03944355e68b2bc59a7f859326ce3236b704d2b` across Web／API／iOS.
- Risk decision: retain the confirmed `max(US$100, prior-12-month fees)` cap and one-year claim period but strengthen lawful scope rather than use absolute waivers. The cap now aggregates all claims, events and legal theories; mandatory fraud, wilful misconduct, applicable non-limitable gross negligence, death／personal injury, privacy／consumer and other non-excludable liabilities remain carved out. Electronic-record disclosures, provider／export allocation, urgent security action, Hong Kong law／interim relief, indemnity procedure, good-faith AUP enforcement and simple cancellation are tightened.
- Enforceability rationale: Hong Kong consumer exemption, standard-term and indemnity clauses remain subject to reasonableness and unconscionability controls. Current US ROSCA still requires clear material terms, express informed charge consent and a simple cancellation mechanism after the 2024 FTC rule was vacated. The final text uses conspicuous bounded terms and mandatory-right savings instead of a likely-fragile absolute disclaimer.
- Privacy decision: exact legal name, HKID and residential address remain outside source and Markdown. The Web release build must obtain operator name, country／region, lawful public service address and three role emails from controlled environment configuration.
- Build decision: add `npm run build:release` and a validator that rejects missing, bracket-placeholder, `.invalid` and malformed email fields without printing values. Keep an internal build for engineering. This prevents accidental publication with placeholders while avoiding personal-data hard-coding.
- Verification: Web `41 / 41`, internal build, negative release guard and synthetic-field release build pass; API typecheck／build and `103 / 103` pass; iOS `APIClientTests` pass `32 / 32`; digest and whitespace checks pass. Browser desktop／`390 × 844` direct Terms／Privacy／Cookie pages display `Effective`, final versions, no forbidden preview language, responsive liability text and zero console warnings／errors.
- Evidence boundary: no deployment, public URL update, Auth0／Google mutation, real acceptance, market opening, payment or legal-review claim occurred. Formal text readiness is not universal enforceability or release completion.
- Next gate: select the lawful minimum-disclosure service-address form, inject and verify the six publication fields, complete role-mail factor／external delivery／monitoring evidence, then request separate deployment approval.

## 2026-08-27 — Authorize the privately supplied address as Rillora's public legal service address

- Status: OWNER PUBLIC-DISCLOSURE AUTHORIZATION — CONFIRMED.
- Clarification: the address value was already privately supplied. The only unresolved point was whether minimum-disclosure instructions permitted that address to appear publicly in the legal pages and frontend bundle.
- Owner decision: expressly authorize the previously supplied address for `VITE_LEGAL_SERVICE_ADDRESS` and public display as Rillora's legal service address.
- Privacy boundary: record only the authorization state. Do not reproduce the address, legal name or HKID in Git, Markdown, fixtures, logs, screenshots or ordinary build artifacts. The HKID remains excluded entirely.
- Publication-field result: operator name, Hong Kong country／region, public legal service address and support／privacy／security emails are all privately available and authorized for their stated public roles.
- Does not imply: that the values have been injected, that a release bundle containing them exists, that the pages are deployed, that mail monitoring passes, or that any market／billing／Auth0／Google gate is open.
- Next gate: controlled release-time injection and page readback, plus mail factor／external-delivery／monitoring evidence, before separate deployment approval.

## 2026-08-29 — Approve the low-prominence form-tail legal-consent visual

- Status: OWNER VISUAL APPROVAL — LOCKED FOR THE NEXT AUTHENTICATION IMPLEMENTATION.
- Approved Web treatment: no `Before you continue` card, no `Continue securely` heading／preamble, a 16px unchecked native checkbox, muted 11px label, ordinary-color Terms／Privacy links, a 10px `Required for account access. No recurring charge.` boundary, and plain `Create account`／`Sign in` actions.
- Approved hosted-signup target: place the same low-prominence checkbox immediately below the actual identity input and above `Create account`; input and CTA remain visually dominant.
- Preserved legal behavior: no pre-checking, Terms／Privacy links remain readable and focusable, unchecked blocks account/session issuance, and the server continues to require exact versions／digest／affirmative actions.
- Scope boundary: approval covers the local Web visual and static Auth0 fixture. It does not prove or authorize an external tenant apply, Advanced／Prompt Customization availability, social-login field capture, returning-user lookup, API protocol, iOS parity or deployed behavior.
- Evidence: two current-run visual iterations, Web `41 / 41`, internal build, desktop／`390 × 844` Browser states, enabled／disabled interaction, zero overflow, zero console warning／error and `design-qa.md` final `passed`.
- Next gate: determine the current official Auth0 mechanism for database／passkey signup and social login, then implement a local fail-closed identity-first protocol that avoids repeated acceptance for current returning users before any external apply.

## 2026-08-29 — Keep the approved compact Web consent as the real gate on Auth0 Free

- Official capability result: Auth0 Universal Login Signup／Login Partials support checkbox capture and validation below database／passkey inputs, but `Customize Signup & Login` is currently limited to Professional／Enterprise and is unavailable on the Rillora Free tenant.
- Cross-provider result: Auth0 does not capture partial values for social／enterprise connections. Google／Apple would still require a Post Login Redirect／Forms flow or a separate Rillora checkpoint, so paying for partials would not create one uniform evidence path.
- Decision: do not upgrade Auth0, deploy partials, add Redirect Actions, or refactor API／iOS session issuance merely to mimic the static target. Keep the Owner-approved low-prominence Web checkbox as the actual cross-provider pre-auth gate; it already sends exact versions／digest／affirmative actions to the authoritative Rillora API.
- UX consequence: existing users still see the compact checkbox before a new sign-in transaction. This is accepted for the current tier rather than replaced by an extra post-identity screen without Owner review.
- Evidence boundary: official docs and current pricing were checked on 2026-08-29; no Management API write, plan upgrade, Action, Form, partial, tenant setting, API migration or iOS change occurred.
- Future reconsideration: compare a paid mixed Auth0 design against a provider-neutral Rillora post-identity checkpoint only if repeated-consent friction becomes an observed problem or the Owner explicitly reopens the architecture.

## 2026-08-29 — Store authorized legal fields in an ignored local release configuration without printing values

- Decision: use hidden local terminal input and an ignored `0700/0600` file rather than command-line values, Markdown, source defaults or visible shell history for the authorized operator name and public service address.
- Implementation: `tools/legal/configure-release.sh` captures the two personal values from `/dev/tty` with echo disabled, supplies Hong Kong and the three role emails, and writes `.local-secrets/legal/release.env`; `tools/legal/run-release-build.sh` enforces mode `0600` and invokes the fail-closed release build.
- Result: six field names present, exact values not printed; release validator and production build pass; `/terms`, `/privacy` and `/legal` return local HTTP 200 on port `4174`.
- Privacy boundary: the release bundle necessarily contains the fields authorized for public display. The Agent does not inspect, screenshot or transcribe them; Owner readback is personal. The ignored source file is local persistent state, not Git, backup or deployment secret management.
- Does not imply: public deployment, public-domain availability, OAuth URL update, external email monitoring, real user acceptance, market opening or billing.
- Next gate: Owner personal page readback, then mail-factor／external-delivery／monitoring evidence before separate deployment approval.

## 2026-08-29 — Accept Owner personal readback of the local release legal pages

- Owner evidence: after the controlled release build opened locally, the Owner explicitly confirmed the rendered identity／address／contact information.
- Scope: local Terms, Privacy and Legal Notice field correctness in the current release bundle. The Agent did not read, screenshot or transcribe the personal values.
- Result: close the six-field local configuration, fail-closed build and Owner personal-readback gate.
- Does not imply: public deployment, public-domain readback, external mailbox delivery, personal TFA enrollment, monitoring SLA, production user acceptance, market availability or billing.
- Next gate: personal Zoho factor enrollment followed by separately approved external inbound／outbound reply tests and monitoring ownership.

## 2026-08-29 — Accept Owner confirmation of Zoho personal two-step enrollment and select connected Gmail for external rehearsal

- Owner fact: personal Zoho two-step enrollment is complete.
- External test surface: use the already connected personal Gmail account as the independent provider; the Gmail profile connector call succeeds without reading messages or exposing the address.
- Boundary: this confirmation does not authorize inferred message content or silent sending. Representational external messages still require the exact recipient／subject／body preview and action-time approval.
- Next gate: send three purpose-limited Gmail messages to the Zoho role addresses, verify receipt／spam placement, reply from each matching alias, and record monitoring ownership／SLA.

## 2026-08-29 — Verify three independent Gmail role-mail loops and define monitoring targets

- Status: PERSONAL TWO-STEP／EXTERNAL INBOUND／MATCHING-ALIAS OUTBOUND／INBOX PLACEMENT／MONITORING OWNERSHIP DEFINITION COMPLETE; LONG-TERM PERFORMANCE AND PUBLIC DEPLOYMENT OPEN.
- Execution rule: the Owner corrected repeated project-level pauses and reaffirmed that purpose-limited test-mode actions with no real-user data, money, production publication, persistent credential change, permission expansion or destructive effect are default authorized. Platform-required personal login／TFA, CAPTCHA, public release, money and other protected gates remain separate. The later `可以了` restored the Zoho login and served as grouped approval for the already defined three-reply sequence.
- External inbound result: Gmail sent one message to each role address under exact test IDs `RLM-20260829-SUPPORT`, `RLM-20260829-PRIVACY` and `RLM-20260829-SECURITY`. Zoho displayed all three in Inbox, not Spam. Bodies contained only the role, test ID, acknowledgment request and a no-personal／no-product-data boundary.
- External outbound result: before each send, the compose state exposed the matching `support@`／`privacy@`／`security@` From identity, exact Gmail recipient, thread subject and one-line acknowledgment. Zoho Sent then exposed the matching role identity and body for each thread. Gmail independently returned all three replies in Inbox from the expected role addresses with exact subjects and acknowledgment snippets.
- Monitoring decision: the Owner／operator owns the single shared mailbox. Support and privacy are checked every business day with acknowledgment targeted within two business days. Security is checked daily with acknowledgment targeted within 24 hours. Urgent security events are escalated immediately. These are internal operating targets, not a customer-facing guarantee or evidence of historical SLA performance.
- Evidence boundary: this proves six messages on one date through one personal Gmail provider and the defined operating owner／targets. It does not prove all-provider deliverability, future spam placement, DMARC report health, continuous staffing, response quality, contractual SLA performance, transactional-email capability or public support readiness under load.
- Publication impact: the legal-field injection／Owner readback and role-mail factor／external-rehearsal／monitoring-definition gates are now closed. The exact next legal-publication gate is separate Owner action-time approval for public deployment, followed by public-domain Terms／Privacy／Legal readback before any Google／Auth0 production-facing legal-link update.
- Does not imply: public deployment, real-user acceptance, market opening, billing, payment, legal sufficiency, guaranteed support or production monitoring performance.

## 2026-08-29 — Approve public legal deployment, save Sites version 1 and preserve the hosting boundary when deployment fails

- Status: OWNER PUBLICATION APPROVAL CONFIRMED; FORMAL ARTIFACT／SOURCE／SITES VERSION SAVED; PUBLIC DEPLOYMENT TECHNICALLY BLOCKED; NO PUBLIC URL.
- Owner approval: the Owner explicitly confirmed public deployment of the formal English legal pages and six previously authorized public fields. This approval does not open product registration, real-user data, market rows, billing or payment.
- Root-host finding: `rillora.xyz` currently uses GoDaddy's free Coming Soon site. The root returns 200 while `/terms` returns 404. Its signed-in editor supports only that Coming Soon page; multi-page routes require upgrading the plan. Publication approval is not treated as purchase approval, so no plan or GoDaddy content changed.
- Staging decision: the existing CloudFront distribution is hard-bound to `app.staging.rillora.xyz` and the synthetic-only product stack. Do not publish formal legal pages by replacing or aliasing that staging surface merely because it already exists. No AWS or DNS mutation occurred.
- Sites decision: reuse the Web subproject's existing `.openai/hosting.json`／worker／packaging contract. Persist the returned project ID, initialize a Git repository only at `apps/web`, push the exact validated source with a short-lived per-command credential, and save the release artifact as version 1. Do not create a second Sites project for the same local site.
- Verification: release validator, formal release build, Web `41 / 41`, Sites worker `4 / 4`, hosting-manifest equality and local `/`／`/terms`／`/privacy`／`/legal` 200 checks pass. The temporary artifact archive was deleted after upload and the local preview was stopped.
- Platform block: Sites accepted project creation, source push and version save, then returned `project_not_found` from project readback, private deployment and explicitly approved public deployment. One bounded post-propagation retry returned the same result. No public URL exists and no deployment claim is permitted.
- Recovery rule: reuse the project ID persisted in `apps/web/.openai/hosting.json` and saved version 1 when Sites project visibility is restored. If immediate publication uses GoDaddy upgrade, AWS or another provider, obtain a separate money／provider choice; do not silently spend, create billable resources or move the production-intended text to staging.
- Does not imply: public availability, root-domain legal routes, Google／Auth0 production legal-link completion, real acceptance, market opening, billing, payment or long-term monitoring performance.

## 2026-08-29 — Adopt a zero-new-fixed-cost infrastructure roadmap and a legal-only portable publication artifact

- Status: OWNER DIRECTION LOCKED; FUTURE ROADMAP DOCUMENTED; LEGAL-ONLY BUILD／SECURITY／PERFORMANCE CONTRACT PASS LOCALLY; EXTERNAL SAVE／DEPLOY REMAINS SITES-BLOCKED.
- Owner objective: before real revenue, balance performance, security, price and future migration while minimizing new spend. The current target is zero new recurring cost for public legal hosting, not a claim that the existing domain, Zoho or synthetic AWS stack cost nothing.
- Current hosting decision: keep GoDaddy as registrar and authoritative DNS; preserve the root Coming Soon page; target one explicit `legal.rillora.xyz` host with seven paths; keep `login.rillora.xyz` narrow; reserve `app.rillora.xyz` for a future separately gated production app; never use `app.staging.rillora.xyz` as a publication shortcut.
- Cost decision: do not add Route 53, a GoDaddy Website Builder upgrade, new AWS static resources, NAT, production database, D1／R2 or another paid provider for the current step. Static public facts come first. If the Owner does not approve a real-data production baseline later, do not collect external users' private plans on a cheaper unsafe substitute.
- Migration decision: DNS is the cutover switch; use explicit records, host-only cookies, OCI API images, standard PostgreSQL plus versioned migrations, provider-neutral object keys, OIDC `issuer + subject`, IaC and value-free source builds. Never promote synthetic staging in place.
- Phase decision: separate public facts, synthetic／Owner validation, real-user alpha, paid beta and scale／company stages. Each stage has a data boundary, resource floor, performance target and explicit cost trigger in `docs/infrastructure-roadmap.md`.
- Build decision: add a dedicated legal HTML／React entry, Latin-only fonts, legal Sites packaging and an allowlisted edge worker. The artifact has no Account／workspace／API／auth／analytics／cookie-banner code. Root redirects to Terms; seven legal paths are allowed; account／API／unknown／write requests return 404; CSP denies connections, forms and framing.
- Verification: after correcting an initial late entry transformation that retained unused product code, the final artifact excludes inspected product／Account／API strings. It is approximately 572KB across 13 files; JS is about 245KB raw／77KB gzip and CSS about 54KB raw／10KB gzip. Existing plus new Web tests pass `47 / 47`; release field validation and hosting-manifest equality pass.
- Sites recovery decision: saved version 1 predates the legal-only split and must not deploy. The new source is committed locally, but Sites still returns `project_not_found` for readback, deployment and new source-credential issuance. The expired original token was not persisted and a push correctly failed 403. When visibility returns, push current HEAD, rebuild, save version 2 or later and deploy only that version; never create a duplicate project.
- Does not imply: public URL, custom-domain activation, AWS cost approval, production identity／data safety, real users, market opening, billing or payment.

## 2026-09-03 — Replace the inaccessible Sites object once and publish legal-only version 3 at `legal.rillora.xyz`

- Status: EXTERNAL SITES BLOCK CLOSED; FORMAL LEGAL-ONLY VERSION 3／PUBLIC ACCESS／CUSTOM DOMAIN／DNS／TLS／ROUTE／HEADER／RENDERED-PAGE EVIDENCE PASS.
- Orphan decision: official OpenAI documentation says a created Site remains in the Owner's Sites list. Five days after the failed attempt, both the signed-in ChatGPT Sites UI and connector Owner list showed zero sites while the old ID still returned `project_not_found`. Treat the old object as an inaccessible orphan, not a delayed valid project. Permit exactly one controlled replacement and require immediate list／direct-project readback before changing local binding.
- Ownership result: the replacement immediately appeared in both surfaces with the current user as sole Owner, no external visitor, custom owner-only access and public access available. Only after this double readback was its project ID written to `apps/web/.openai/hosting.json`.
- Source／archive decision: push the exact clean nested `apps/web` commit with short-lived per-command credentials. Because the historical Sites package helper is no longer installed, add `tools/legal/package-legal-sites.sh`; it packages only validated `dist/`, preserves the required top-level directory, enforces mode `0600`, rejects manifest mismatch／symlinks／missing entries and is deleted after each save. The first archive attempt without `dist/` was rejected before save; the tool was corrected against the explicit server-entry error.
- Deployment corrections: accessible version 1 exposed static-root bypass and 307 redirects; accessible version 2 exposed clean-URL canonicalization from `legal.html` to `/legal`. Public access was returned to Owner-only before each correction. Version 3 embeds the Vite HTML shell inside the Worker and removes all client HTML, so public HTML cannot bypass the Worker or be canonicalized into the wrong document.
- Verification: final local suite is `48 / 48`. Current version 3 deployed Owner-only, then public. Anonymous provider-domain and custom-domain checks return 200 for seven legal routes, root 308 to Terms and 404 for Account／API／unknown／former-template／POST. Security headers, TLS, titles, H1s, formal versions, `Effective`, no placeholders, no forms and same-origin resources pass without returning personal field values.
- DNS decision: add only one `legal` CNAME and two Sites verification TXT records. GoDaddy's signed-in UI was blocked by its own chunk-loading failure, so use the existing Keychain PAT through official v3 API with the token supplied to curl over stdin. Exact-name preflight was empty; each create returned 201. When Sites rotated one verification value, replace the existing record by stable record ID with one PUT; never add a duplicate. Preserve root, nameservers, MX／SPF／DKIM／DMARC, Auth0 and AWS records.
- Domain result: GoDaddy API, authoritative and public resolver checks pass; Sites reports domain／provider／SSL active. `legal.rillora.xyz` presents a managed certificate for that hostname and all final route checks pass.
- Hosting-fact decision: the application has no analytics SDK, form, API, auth, local storage or cookie writer. Sites nevertheless exposes aggregate unique-visitor／page-view analytics and Cloudflare sets host-only necessary `__cf_bm` for bot protection. Existing Privacy／Cookie text already covers infrastructure request metadata and necessary request-protection cookies, so the legal body, versions and digest do not rotate. Do not claim zero provider telemetry or zero response cookies.
- Link-alignment result: API `/auth/legal-contract`, native `RilloraLegalURLs` and the static Auth0 design target now use the live `legal.rillora.xyz` Terms／Privacy paths. API typecheck／build／`103 / 103` pass with exact URL assertions. An iOS source assertion was added, but no simulator test ran because no simulator was booted; no native runtime claim is added.
- Cost／scope result: no GoDaddy purchase, Route 53, AWS change or new recurring infrastructure commitment. Root Coming Soon, synthetic staging, Auth0, product accounts, private data, markets and billing are unchanged.
- Superseded next action: Google OAuth homepage／Privacy／Terms configuration is now saved and read back under `External / Testing`; see the newer decision below. Auth0 partial／Action work remains separately deferred.

## 2026-09-03 — Persist public legal links in Google OAuth Branding without publishing consent

- Status: GOOGLE OAUTH HOMEPAGE／PRIVACY／TERMS SAVED AND RELOADED; AUDIENCE REMAINS EXTERNAL／TESTING; INCOMPLETE-CONFIGURATION WARNING CLOSED.
- Preflight: Google Cloud project `rillora-identity` showed application `Rillora`, homepage `https://rillora.xyz`, authorized domain `rillora.xyz`, empty Privacy／Terms fields and a Testing-state verification message. Audience separately showed publishing status Testing, user type External and the existing test-user section.
- Owner approval and write: after the final action-time confirmation, save only Privacy `https://legal.rillora.xyz/privacy` and Terms `https://legal.rillora.xyz/terms`. Homepage was already correct and remained unchanged.
- Readback: after Save disabled again, a fresh Branding reload returned the exact three URLs and authorized domain. Audience again returned External／Testing, retained the test-user section and no longer displayed `OAuth configuration incomplete`.
- Scope boundary: no client, JavaScript origin, redirect URI, scope, test user, developer contact, credential, Auth0 connection or Google publication state changed. This is persisted Testing metadata, not Google verification, production publication, a new user acceptance or a new callback.
- Security preflight: the Web client still has two enabled secrets and Google displays its multiple-secret risk warning. Existing project evidence identifies the later-created value as the credential held by Auth0 and already used by the successful Owner-controlled Web callback. Do not store secret values or suffixes in project records.
- Superseded exact next gate: the older unused secret was subsequently removed under separate confirmation; see the newer decision below.

## 2026-09-03 — Remove only the obsolete Google OAuth secret and retain the active Auth0 credential

- Status: OLDER UNUSED GOOGLE OAUTH SECRET DEACTIVATED AND DELETED; EXACTLY ONE LATER ENABLED SECRET REMAINS; ORIGIN／CALLBACK UNCHANGED.
- Action-time preflight: client detail returned two enabled secret controls. The first control's smallest secret container mapped only to creation time 2026-08-18 16:41:09 GMT+8; the second mapped only to 17:00:08. Existing evidence identifies the later credential as the value stored by Auth0 and already used by the successful Owner-controlled Web callback.
- Owner approval and destructive action: after the Owner explicitly confirmed the exact older target and retained later target, deactivate only the 16:41:09 secret. Its card alone changed to Disabled and exposed the only enabled `Delete client secret` control. Delete that one item; do not create a replacement or alter Auth0.
- Readback: a fresh client-detail reload's `Client secrets` section contains exactly one secret entry. It is the 17:00:08 item and is Enabled. The older time, any Disabled item and Google's multiple-secret warning are absent from that section. The exact `https://login.rillora.xyz` JavaScript origin and `https://login.rillora.xyz/login/callback` redirect remain present.
- Privacy boundary: no secret plaintext was read or stored; no secret value or suffix is written to source, Markdown or QA artifacts. Creation times are the non-secret control-plane identifiers used to disambiguate the operation.
- Scope boundary: Google consent remains External／Testing. No client, origin, callback, scope, test user, Branding link, Auth0 connection, application publication, market or billing setting changed.
- Superseded exact next gate: the legal／Google arc was complete and the next gate returned to the physical StoreKit path at this checkpoint. The Owner subsequently deferred physical-device work and selected the newer iOS authentication direction below.

## 2026-09-04 — Replace the iOS native legal page with compact hosted consent

- Status: OWNER PLACEMENT CORRECTION LOCKED; NATIVE FULL-PAGE CONSENT REMOVED; SIMULATOR DIRECT-TO-`LOGIN.RILLORA.XYZ` PASS; HOSTED FORM／ACTION DESIRED STATE `8 / 8`; LIVE AUTH0 APPLY BLOCKED ONLY ON OWNER LOGIN; NO PHYSICAL-DEVICE WORK.
- Owner correction: the Simulator must not show a native `Terms & privacy` page before hosted authentication. Legal consent belongs in the `login.rillora.xyz` flow as an understated unchecked checkbox with small Terms／Privacy copy, not a heading, product disclaimer, version cards and long legal paragraphs. This supersedes the 2026-08-28 iOS native-sheet placement; physical deployment／testing is explicitly deferred.
- Cause: `AppShellView.beginAuthentication()` selected a `LegalConsentDestination`, and only that native sheet later started Auth0. The approved compact checkbox existed only in the static Auth0 preview, not in the live Liquid template or a tenant Form.
- Native implementation: delete `LegalConsentSheet.swift`, its sheet state／route／destination, and start Auth0 directly. Require the returned access token to contain the exact current `https://rillora.xyz/legal-acceptance` object before native session exchange; missing, malformed, false or stale claims fail closed. Continue sending the exact current proof to the existing API only after that hosted claim passes.
- Supported-host decision: do not inject JavaScript into Auth0's private widget DOM. Current official docs say outer Page Templates cannot safely depend on widget HTML; current pricing excludes in-widget Prompt Customization from Free but includes bounded Actions + Forms. Select a Free-tier Post Login Form on the tenant domain before token issuance. It is a compact hosted step rather than literal insertion inside the existing email widget.
- Staging decision: target only `Rillora iOS` first. Web keeps its current compact pre-auth checkbox until iOS hosted proof passes, preventing a temporary double prompt on Web.
- Desired Form: one required `rillora_legal_acceptance` Legal field with Terms／Privacy links, 11px presentation target, one 10px `Required for account access. No recurring charge.` line and Continue disabled while unchecked. Exclude the rejected product explanation, document-version cards, separate disclaimer and `Agree and continue` page.
- Action boundary: restrict to client name `Rillora iOS` and custom domain `login.rillora.xyz`; deny missing Form ID, non-custom-domain execution, mismatched continuation and false checkbox. After acceptance, store only current version／digest metadata and emit the exact signed ID／access-token claim. Unrelated Auth0 applications are unchanged.
- Verification: Action／contract tests `8 / 8`; iOS build／run succeeds and full suite reports `104 passed / 0 failed / 1 skipped`. Booted Simulator runtime reaches the standard iOS authorization notice then live `login.rillora.xyz` directly with no native legal sheet and no identity selection. Local hosted preview has meaningful DOM, no framework overlay, zero warning／error, unchecked Continue disabled and checked Continue enabled.
- External boundary: Auth0 CLI and both available browser contexts require Owner login. No Form, Action, binding, app metadata or live hosted consent changed. Until apply, the live page has no checkbox and the new iOS build intentionally refuses any completed identity flow without the signed claim.
- Superseded exact next gate: the Owner selected the native／hybrid direction before any Form／Action deployment. Do not create the hosted consent resources; see the newer decision below.

## 2026-09-04 — Keep Auth0 as identity backend and move iOS primary login into native／hybrid UI

- Status: OWNER DIRECTION LOCKED; NATIVE ACCOUNT SURFACE IMPLEMENTED; APP／TEST TARGETS BUILD; APPLE NATIVE READY; GOOGLE NATIVE／PASSKEY CODE CONFIG-GATED; HOSTED FORM ARTIFACTS RETIRED; GOOGLE IOS CLIENT PREPARED BUT NOT CREATED; NO SIMULATOR OR PHYSICAL RUNTIME CLAIM.
- Direction: Auth0 remains the identity authority, token issuer and hosted recovery／complex-challenge fallback. Universal Login no longer owns the primary iOS account experience. This supersedes the undeployed same-day hosted Form／Action plan without a tenant rollback because no resource had been created.
- UI decision: present one full-screen native Account task from every signed-out private intent. It contains a compact header, email field, the approved small unchecked Terms／Privacy／electronic-record row immediately below the field, and account methods. It contains no legal-only headline, product disclaimer, version cards or wall of copy. Every method is disabled until acceptance.
- Provider split: native Apple uses the existing `AuthenticationServices` and Auth0 Apple token exchange. Email and exceptional methods use a transparent hosted fallback with optional validated `login_hint`; Rillora never receives an Auth0 password. Native Google and Passkey render only after their exact configuration gates pass.
- Google implementation: add official GoogleSignIn iOS package `9.0.0`. Require explicit enablement plus both Google iOS and server Web client IDs. Obtain a native Google ID token, exchange it with Auth0 using subject type `http://auth0.com/oauth/token-type/google-id-token`, then use the existing Rillora native session exchange. Incomplete configuration fails during app configuration and leaves the button hidden.
- Passkey implementation: use Auth0.swift native challenge／login APIs and Apple's `ASAuthorizationPlatformPublicKeyCredentialProvider`; add `webcredentials:login.rillora.xyz`. Keep the button hidden until explicit enablement after Auth0 Passkey grant, database policy, Apple Team／Bundle Device Settings and AASA readback. Code and entitlement are preparation, not proof of tenant availability or a passkey ceremony.
- Verification: XcodeGen succeeds; the final no-device Simulator build passes; `build-for-testing` compiles app and unit-test targets into reusable Simulator test products without booting a device. GoogleSignIn resolves at `9.0.0`; the only warning is the unrelated Apple `StoreKitTest` SDK deprecation header. The final Markdown pass checks 141 local links across 50 project files with zero broken targets. All installed Simulators are shut down, so no runtime screenshot, checkbox interaction, Apple prompt, Google exchange, Passkey ceremony or executed test count is claimed for the new Account view.
- Google preflight: project `rillora-identity` contains only the existing Web client. The unsaved creation form now contains type iOS, name `Rillora iOS`, Bundle ID `com.rillora.ios`, blank App Store ID and blank Team ID; Firebase App Check is unchanged. `Create` is enabled.
- Current exact next gate: obtain action-time confirmation to create exactly that one public Google iOS OAuth client. It creates no client secret. After exact readback, write its public ID／reversed URL scheme into disabled local configuration, then separately restore Auth0 Dashboard access and enable native Google token exchange. Runtime QA waits for the Owner to boot a Simulator; physical-device work remains deferred.

## 2026-09-05 — Create the Google iOS OAuth client and wire public identifiers behind the disabled native gate

- Status: GOOGLE IOS CLIENT CREATED AND READ BACK; PUBLIC IOS／SERVER CLIENT IDS AND OFFICIAL URL SCHEME WIRED LOCALLY; NATIVE GOOGLE REMAINS DISABLED; AUTH0 OWNER LOGIN REQUIRED; NO SIMULATOR OR PHYSICAL RUNTIME CLAIM.
- Authorization: after the prepared form and exact scope were shown, the Owner replied `确认创建`. Create exactly one type-iOS client named `Rillora iOS` for Bundle ID `com.rillora.ios`; keep App Store ID／Team ID blank and do not enable Firebase App Check.
- Google readback: the creation result confirms one public client ID and no client secret. Fresh client detail confirms the exact name／Bundle ID, blank optional identifiers, provider-supplied iOS URL scheme and Firebase App Check disabled／unchecked. The list has one new `Rillora iOS` item plus the existing Web client. The Web origin, callback and secret were not edited; OAuth audience remains Testing.
- Local implementation: add the Google URL scheme to `CFBundleURLTypes`, write the public iOS and existing public server Web client IDs into Debug, forward SwiftUI open-URL callbacks to `GIDSignIn.sharedInstance.handle`, and keep `RILLORA_GOOGLE_NATIVE_SIGN_IN_ENABLED=NO`. Release also retains the callback scheme but no enabled native-Google configuration. No client ID is copied into narrative Markdown or QA evidence.
- Verification: XcodeGen succeeds. After adding the callback handler, final Debug `build-for-testing` compiles the app and test targets and Release Simulator compile passes; built Debug／Release Info.plists contain the expected callback scheme, Debug contains both expected public IDs, and both Google enable flags read back false. No Simulator was booted and no test was executed.
- Current exact next gate: the exact Auth0 `Rillora iOS` settings URL redirects to official Auth0 Dashboard login. The Owner must complete login in the handed-off browser tab. After that, read the current application, Google connection and native token-exchange capability before any write; do not enable the iOS button merely because Google Cloud and local configuration now exist.

## 2026-09-05 — Use Auth0 CLI／API, defer native Google on the verified iOS boundary, and enable Free native Passkey in Debug

- Status: AUTH0 CLI／MANAGEMENT API REAUTHORIZED; SANITIZED TENANT READBACK COMPLETE; GOOGLE NATIVE IOS DEFERRED WITHOUT MUTATION; PASSKEY GRANT AND CHALLENGE PASS; DEBUG APPLE＋PASSKEY; RELEASE PROVIDER GATES OFF; SIMULATOR RUNTIME OPEN.
- Tooling decision: the installed Auth0 plugin provides the Auth0 skill but no MCP server in this session. Its CLI fallback is available. After the Owner confirmed the official device-code page, CLI `1.32.0` reauthenticated to the existing EU development tenant; no M2M app, long-lived credential or secret was created.
- Readback: `Rillora iOS` remains a first-party OIDC native public client with no token-endpoint secret, existing callbacks, exact Team／Bundle Device Settings and Apple native enabled. The Google connection retains its configured Web ID／secret, minimal scopes and two bindings including iOS; its public ID matches local configuration. The Rillora API remains RS256, 900 seconds, `session:create` only, no offline access and first-party consent skipping.
- Google boundary: Custom Token Exchange profile listing returns an explicit paid-plan 403. Built-in Native Social Login is separate and Free-rate-limited, but current Auth0 configuration documents Google for Android. An Apple-preserving PATCH to add Google was rejected because `app_package_name` is required. Fresh readback proves no mutation. Do not fake an Android package for iOS, buy a plan before revenue or enable the local Google flag; retain hosted Google fallback and dormant source for future provider／plan change.
- Passkey change: database password＋passkey policy, button＋autofill, progressive／local enrollment, database-client binding, exact iOS Device Settings and custom-domain AASA all already pass. Add `urn:okta:params:oauth:grant-type:webauthn` to the client while preserving `authorization_code`; sanitized `POST /passkey/challenge` returns 200 with session, WebAuthn options, challenge, timeout and RP ID `login.rillora.xyz`.
- Local change: enable only Debug `RILLORA_PASSKEY_NATIVE_SIGN_IN_ENABLED`; keep Release Passkey and both Google flags off. Normalize Google／Passkey system cancellation to `CancellationError` so dismissal is quiet. XcodeGen, final Debug `build-for-testing`, Release Simulator compile and built Info.plist flags pass; no Simulator boot, test execution, provider identity, token or Rillora session is claimed.
- Current exact next gate: Owner manually boots the intended iOS Simulator. Then run and inspect Account placement, unchecked gating, Apple＋Passkey visibility, Google absence, legal links and cancellation; execute prepared unit tests. Physical-device work remains deferred.

## 2026-09-06 — Verify native Account and keep configuration separate from credential assurance

- Status: REVERSIBLE UI／QA CORRECTION; EXISTING OWNER ARCHITECTURE PRESERVED.
- Scope: current native Account readability, accessibility, regression tests and active documentation routing.
- Decision: use horizontal method rules; keep explicit email accessibility and working-state guards; at accessibility text sizes omit decorative method icons/arrows so labels receive the full width. Preserve the compact unchecked legal row and the existing server proof.
- Evidence: current-run default and AX5 screenshots, `106 / 0 / 1` native unit tests, default UI `3 / 3`, AX5 consent `1 / 1`, Safari Terms/Privacy opens and hosted/Passkey system cancellations. The first AX5 interaction pass missed the mid-word label defect, which was fixed after visual review.
- Supersedes: stale active contract clauses requiring direct-hosted-only iOS, no native Apple entry or the retired expandable public index. The September native/hybrid decision controls; historical results remain unchanged.
- Security clarification: no evidence closes the earlier Sign in with Apple key-rotation gate. Native Apple visibility is not authorization to use that key, and StoreKit IAP key rotation is unrelated.
- Does not imply: a completed Passkey assertion, Auth0 token, Rillora session, real acceptance, tenant mutation, physical-device evidence, complete device matrix, legal publication change or release.

## 2026-09-06 — Refine the entire native app around clear tasks and consistent controls

- Owner request: the email field should use gray text, the bottom domain helper should be removed, and the review must cover the entire app rather than Account alone.
- Scope: retain the selected graphite direction, native three-tab shell and current shared domain/authentication contracts. The implementation covers public entry, Account, private roots, editors, Profile tools, official guides, rehearsals, guide preview/export selection, empty states and recovery.
- Reversible product decisions: named Overview actions open the exact matter; review-needed matters precede added ones; Matters has native search; fields retain required/optional labels and protect unsaved drafts; Profile tools explain their purpose; static facts lose nested button-like cards; provider links move above long detail; Start Here exposes one export format at a time with its existing unchecked acknowledgements. Internal chevrons and external arrows keep distinct meanings.
- Visual detail: literal gray prompts and body-colored input, sage focus, readable neutral disabled actions, consistent button padding and a graphite launch background. The progress ring scales with Dynamic Type. Debug identity labeling stays concise and explicit.
- Recovery: transient refresh failure keeps the loaded map with retry; expired authentication still clears private content. Account errors appear in the relevant task. Synthetic recipient UI and its bootstrap read are Debug-only.
- Judgment correction: a small contact-sheet image initially suggested horizontal overflow in Role scope. The full-size before/after pair disproved that default-size interpretation; the accepted finding is excessive nested-card emphasis. Largest-text boundaries are separately checked.
- Landscape follow-up: declared supported orientations, then verified actual width greater than height using an opt-in Debug UIKit scene-geometry request because this Simulator did not react to device rotation alone. Full-screen capture fixes the runtime’s rotated app-crop problem. Automatic motion-driven rotation remains separate.
- Evidence and remaining boundaries: use the current-run report at `output/qa/rillora-full-app-ux-20260906/README.md`. Local development fixtures and Simulator checks do not establish a real native identity login, physical accessibility, external comprehension, release, billing or recipient delivery. No new brand or legal/security promise was approved.


## 2026-09-06 — Remove the native account intermediary and use direct hosted login

- Owner supplied the native email page and hosted password page, pointed out that the first adds no value if authentication still happens on the hosted domain, and explicitly selected “删除图一，直接使用托管登录”.
- This supersedes the 2026-09-04 native/hybrid primary-entry decision and the Account portion of the earlier whole-app polish. The other whole-app changes remain active.
- Every iOS private/sign-in intent opens Auth0 Web Auth directly. `AccountAccessView`, its native email collection, method chooser, route state and local checkbox UI are removed. Native provider adapters/configuration remain dormant code; they are not another user-facing chooser.
- The existing exact consent contract is preserved through a required hosted legal field. A client-scoped Post Login Action candidate validates the submitted Form, boolean and server-side bundle marker, then issues the receipt used before Rillora session exchange. No Auth0 consent metadata, M2M application or new secret is introduced; the API ledger remains authoritative.
- New requests carry `rillora_auth_ui=single-hosted-v1`, so the candidate Action does not add a hosted consent step to older native builds. Other Auth0 applications remain outside its scope.
- Initial checkpoint: local code and configuration tests were not live tenant evidence; the CLI and management browser needed Owner reauthentication. That gate is closed by the follow-up below.

### 2026-09-06 — Hosted apply, returning-user guidance and actual Form repair

- The Owner completed official CLI authorization. Fresh preflight found no named Form/Action or Post Login bindings; the scoped resources were created, deployed and read back. The native intermediary stays removed.
- The Owner's actual attempt exposed confusion between an existing Google identity and a database password. The account lookup was read-only. The product response places social methods before email and adds generic Google guidance on login and password pages. It does not disclose provider membership for arbitrary email addresses or automatically merge same-email identities.
- Any later account-linking feature must authenticate both identities and preserve the existing Rillora planner, acceptance and session relationships. The current pass creates no duplicate identity or new linking permission.
- Apple had native configuration but no web Services ID. The Rillora iOS client's Apple connection binding is paused until the separate identity-key rotation and hosted configuration gates are complete; other clients and credentials are unchanged. This connection pause applies across versions of that iOS client, independently of the new Action's migration marker.
- The Owner completed Google, the required hosted confirmation and the code exchange, and the ordinary cloud Debug app displayed the private map. This closes that exact Owner-controlled hosted callback. It does not verify Apple, a real passkey, physical-device behavior or release.
- The first actual Form screenshot failed visual review. Supported Form CSS repairs the inline legal sentence, checkbox, inner backgrounds and primary action; unchecked error/cancel states are checked in the real hosted container. The template API currently returns 402, so the existing global template is left unchanged and no paid upgrade is made.


### 2026-09-06 — Explain a rejected stored session

- The post-QA restart retained the original Keychain item but the API required reauthentication. The default 30 idle minutes is consistent with the elapsed interval; a live override was not verified because the scoped AWS management session was expired. No timeout or remote session was changed.
- Overview now distinguishes a new visitor from a rejected stored session. Welcome back / Sign in again replaces the create-map pitch in that recovery state, with public tabs still available and no automatic credential page.
- Reset, recovery and authentication rejection are covered by the final 116 / 0 / 1 native suite. Debug runtime and Release compile pass. This change clarifies the existing state; it does not extend authorization or manufacture acceptance.


## 2026-09-07 — Email first, other sign-in methods below

- Owner explicitly reverses the earlier agent placement of social methods above email and requests less empty space plus Apple restoration.
- Email/Continue now precede the alternatives. The Google reminder is shortened, with 390px/320px and actual iOS visual evidence. No native intermediary returns.
- The missing Apple Services ID and exact web URLs are created and read back. The exposed login key remains active in both Apple and Auth0, so replacement is prepared at the final registration step and the Owner is asked for the required credential-operation approval.
- A configured Services ID and a draft key are not completed Apple authentication. Apple stays paused until the approved rotation, readback and scoped binding restoration are verified. StoreKit is outside this operation.


## 2026-09-09 — Default project authorization and confirmation

- Owner explicitly states: all project operations are authorized and confirmed by default. This supersedes the prior project-level per-action approval gates, including the pending concrete Apple rotation plan.
- AGENTS.md is updated. Authorization remains distinct from execution/evidence and does not create unrelated goals or bypass required platform presence/information.
- Fresh preflight finds the old Apple login key still active and no replacement file. Apple portal access resumes; Auth0 CLI renewal reaches an OTP challenge. The necessary next input is the current platform code, not another authorization decision.

### 2026-09-09 — Apple key rotation and hosted entry restored

- Owner completed the official Auth0 MFA challenge. The scoped replacement Apple login key was created for the existing primary App and stored only in the ignored 0700/0600 directory.
- The existing Auth0 Apple connection received the replacement plus `com.rillora.auth`; private key equality and preserved public options/bindings were checked before the old login key was revoked. The Apple list then contained only the replacement. Only the existing iOS connection binding was restored.
- Email remains first. Hosted filled-input text is now muted gray. Live 390px/320px checks show Passkey, Google and Apple below email/Continue without horizontal overflow. Apple reaches the official Rillora Account authorization screen with the exact callback; Browser Back returns to the chooser.
- Final compactness pass removes the identifier-page introduction while retaining and observing Google-method guidance before password entry. It shortens the 390px page by 24px and the 320px page by 48px without shrinking text or dropping recovery/signup. An empty custom-text value restored the default introduction; the supported space value is retained and read back.
- Fresh iOS entry/cancel is observed. Personal Apple identity, hosted acceptance and the Rillora callback remain separate proof. No same-email account linking, user-data change, StoreKit credential operation or paid plan change occurred.

## 2026-09-09 — Restore public browsing and revise every page depth

- Owner rejects the expired-session Welcome back-only Overview. Public product exploration remains available regardless of prior login; private data still clears on rejected authorization. This supersedes the September 6 recovery presentation, not its authentication boundary.
- Owner requests another complete UI/UX pass using ImageGen/video references and working motion, then explicitly extends it to every child and multi-level page.
- Owner further rejects text-heavy pages: graphical choices and actions should lead, with detail disclosed when needed. This supersedes agent-generated paragraph-heavy deep-page concepts.
- Generated references guide implementation within the existing Rillora palette; they are not working UI, data, identity or new safety promises. All necessary project work remains authorized without repeated approval.


## 2026-09-09 — Full-depth control-led interaction implementation

- Owner direction: useful public exploration before login and after expiry; every child/multi-level page participates; reject text-heavy screens. This supersedes the static product index and Welcome back-only recovery home.
- Working reference: selected compact deep-page ImageGen v2 plus generated RGBA map/guide artwork. The rejected first board is retained only as rejected evidence.
- Implementation decision within existing authorization: Details/Directions/People, single-step guides, live scope selection, separate-event rehearsal and Review/Format/Save. Full legal documents remain deliberate reading destinations; exact agreement/receipt content is not changed.
- Action safety is part of the UX: preserved dirty drafts; whole-field focus; whole-row acknowledgement controls; explicit recovery-key return/abandon choices; no browser-blocking confirm for ordinary Web editing.
- Actual role-revocation testing found CORS omitted `if-match`; allow that existing version-condition header without changing trusted origins, authentication or version enforcement.
- Local evidence and remaining real-device/identity boundaries: [verification report](../output/qa/rillora-public-motion-20260909/README.md). No publication, charge, message, real identity merge or recipient release is implied.


## 2026-09-09 — Real invitations and independent B/C sharing requested

Owner explicitly requests that A invite family B by link/QR, B sign in or create
a Web/iOS account and accept, then view only allowed information. Friend C may
receive different matters/detail levels. This authorizes implementation of
account-bound direct sharing; contact-only records do not satisfy the task.
Default grants stay empty; each person/matter is explicit; future death/incapacity/
unreachable release remains a different closed workflow. See [sharing contract](trusted-sharing.md).


## 2026-09-10 — Account-bound sharing local implementation and deployment boundary

- Empty-by-default per-person/per-matter Name, Directions and Details levels are implemented in Web/iOS and enforced by recipient projections.
- Invitation acceptance binds to the authenticated account after verified target-email matching; no email-based account merge or implied whole-plan grant.
- Per-invitation handoffs preserve simultaneous links through login; private/archived matters remove grants without silent reactivation.
- Local A/B/C, QR decoding, negative access checks, revocation and AX5 evidence pass. API/Web/native unit totals are 115/48/124 (one existing native skip).
- AWS CLI is expired and the cached console session returned 400; the Owner was asked to complete the official IAM login/MFA. Local image/synthesis does not mean deployment. No real invitation/message, new Auth0 key, billing or event release occurred.
- [Verification and continuation](../output/qa/rillora-trusted-sharing-20260909/README.md).

### 2026-09-10 — Deploy account-bound sharing to existing synthetic staging

- The Owner requested the AWS login page again. A fresh `aws login --profile rillora-operator` completed successfully; no new project confirmation was requested.
- Preflight preserved the current stack parameters and existing services. CDK's first attempt with an already-assumed deployment profile could not publish assets; it failed before a stack update. Using the existing operator profile let CDK assume its purpose-specific publishing roles. No IAM policy expansion was made.
- Two-phase deployment completed: service stopped, migration task revision 13 exited 0 with migration and runtime-role success, then API revision 18 reached desired/running 1/1 and CloudFormation UPDATE_COMPLETE. Web assets match the local build exactly. Stripe test integration stays enabled and Apple IAP stays disabled.
- Eighteen HTTPS/asset checks pass. Fresh 390px browser checks cover the public interactive home, Account and invitation entry; the Who choice changes state without authentication. No real legal acceptance, recipient identity or external message was created during this verification.
- Corrected stale active platform-contract wording that still described the removed native Account page and static public map, using the already-recorded September 6/9 decisions. This is documentation alignment, not a new product direction.
- The next review is the designated recipient's actual hosted sign-in/acceptance in the normal cloud build. [Deployment evidence](../output/qa/rillora-trusted-sharing-20260909/README.md).

## 2026-09-10 — Full-read continuity and Free / Family packaging clarification

- **Owner instruction:** read all project-owned Markdown before a new workflow,
  recover concisely after compaction, and update focused docs, handoff and journey
  before finishing. The full read covered 55 files / 16,011 lines; coverage and
  unchanged-at-read fingerprints are retained in the QA record.
- **Existing decisions retained:** permanent Free, one launch Family tier,
  monthly/annual entitlement parity, provisional US$9.99/month or US$99/year,
  free baseline security/export/recipient access, no automatic trial and closed
  public billing. The Free one-person path was already documented.
- **Agent-selected reversible design, PROVISIONAL:** Free 1 / Family 5 outgoing
  relationships per plan; one additional Family co-planner. Contact records and
  incoming shares are not charged seats. Per-item privacy levels, default-private
  behavior and revoke remain included in both plans. The five-person number is
  not an Owner-validated market result or an active catalog value.
- **Lifecycle clarification:** pending invites reserve a slot; expiry/revoke
  frees it; reactivation and replacement require transactional quota checks.
  Preserve accepted read-only relationships and text updates after paid expiry;
  stop above-limit new connections and paid collaboration/automation. The
  setup-only monthly-use tradeoff is explicit: recurring maintenance must justify
  renewal. These future commercial behaviors require implementation and tests.
- **Current implementation truth:** Free allowance 1 exists in the catalog,
  but sharing routes do not enforce it. Family multi-person is planned/null;
  co-planning, adaptive review and history are not delivered as paid features.
  No quota wall, paid entitlement, migration, source UI change or checkout was
  activated by this review. Preserve synthetic B/C access while billing is closed.
- **Supersession and housekeeping:** AGENTS now requires range coverage and
  closeout-before-final. The old 1,121-line handoff is archived unchanged; current
  handoff is 99 lines with one next work item. Corrected stale active references
  to 30-day refunds, US$89 as current list, USA-only launch, native Account-first
  authentication, static map, unused email scope and pending cloud deployment.
  These align existing decisions; legal texts, provider settings and old dated
  test evidence were not rewritten or revalidated.
- [Current packaging contract](monetization.md), [QA and source audit](../output/qa/rillora-packaging-review-20260910/README.md),
  [historical handoff](handoff-history-20260910.md). The Owner's newer packaging
  request supersedes the prior receiving-flow review as the active work item;
  actual recipient-provider acceptance remains an open evidence gate.


## 2026-09-10 — Owner challenges one-month permanent-sharing loophole

- Owner questions whether Family still means only extra contacts and asks what
  remains after paying one month and cancelling. This continues the same packaging
  review; its completed full read was reused with focused current-document reads.
- **Supersedes the earlier same-day Agent proposal:** do not preserve live updates
  for every accepted paid recipient after expiry. Planned Free keeps one designated
  live relationship; others retain only their last authorized paid-term version,
  explicitly dated with updates paused. Own core text remains editable/exportable.
- Cancellation stops renewal and preserves the paid term; it does not instantly
  end access. Normal monthly use and later one-month resubscription are legitimate.
  Prevent continued paid service after expiry, not ownership/copying of user data.
- Archival copies are a new required commercial lifecycle capability, not shipped
  functionality. They must be sealed at the authoritative cutoff from already
  authorized content, continue to obey restrictive permissions/revocation/deletion,
  and cannot fall back to current live data on a missing/delayed snapshot.
- Free slot swaps are atomic and cannot mint fresh paid archives. Scope grants,
  relationship acceptance and commercial live/archival/none access are separate.
  Replayed callbacks, changed device time and repeated cancellation cannot extend
  paid access or grace; resubscribing cannot silently restore revoked disclosure.
- Family must demonstrate current multi-person updates, scoped co-editing and a
  review/change workflow before being sold as such. Contact count alone does not
  validate US$99/year. No new tier, price, minimum term, trial, refund policy or
  data-export restriction is introduced.
- The prior 99-line handoff is preserved in the historical archive. Current
  handoff is updated to the corrected lifecycle as its one next engineering item.
  No code, payment, real recipient, deployment or public legal text changed.
- [Corrected contract](monetization.md) and [follow-up evidence](../output/qa/rillora-packaging-review-20260910/expiry-followup/README.md).


## 2026-09-10 — Competitor paid-value and pricing evidence refresh

- Owner asks what similar platforms sell and how Rillora differs. This is another
  continuation of the same packaging review; full-read evidence was reused and
  current/focused authority recovered before edits.
- Current official public sources cover MyLifeLedger, Quicken LifeHub, Everplans,
  Trustworthy and GoodTrust. They advertise assisted capture, automation, full
  organization, collaboration, document creation or human service. These advertised
  offers do not prove customer conversion, retention or independent security.
- Corrected the comparison basis: MyLifeLedger's current pricing page says US$49
  despite older US$39 pages; LifeHub uses annual billing and introductory monthly
  equivalents; Trustworthy's current collaborators differ from Free Legacy Access.
  Everplans downgrade quotas and GoodTrust family counts have source conflicts,
  so unresolved precise limits are not adopted.
- “Map, not passwords”, granular sharing and reminders are not proven Rillora
  exclusives. Existing code does not match all the automation/document-generation
  capabilities in the compared offers. Different event/authority boundaries remain
  product principles, not proof of a market advantage or a live release service.
- Retain the existing Free/Family and corrected expiry design. The US$99 model
  price remains provisional and must face lower-priced direct alternatives in
  task-outcome/WTP work; this review changes no price, catalog or billing interval.
- Updated evidence registers, commercial/economics implications, product gateway,
  current handoff and journey; archived the prior handoff. No runtime code, paid
  account, real data, recruitment, message or deployment was used.
- [Current comparison](competitor-ux-audit.md) and [source/validation record](../output/qa/rillora-packaging-review-20260910/competitor-followup/README.md).


## 2026-09-10 — Implement Family shared maintenance and deploy its preview

- Owner explicitly requests concrete planning and implementation of US$99 value,
  superseding the earlier quota-only next item. Selected the shared-review loop:
  request -> scoped check/issue -> one designated contributor's suggestion ->
  owner approval -> actual Matter/history update -> next review.
- Implemented API/Web/iOS, link-based inbox entry, cadence and versioned history.
  Suggestions affect provider/location only; no direct co-owner edit, hidden-field
  grant or event release follows. This implements a bounded collaborator role,
  not the entire future Family feature list.
- Capability is checked against the owner, with a default-off preview permitted
  only locally or on the exact existing synthetic staging. No subscription/paid
  entitlement mutation, live charge or real recipient message was created.
- Migrations 0037–0039 enforce private owner/receiver boundaries, serialize closure
  and late responses, and preserve owner-approved history/cadence when a contributor
  deletes their account. New immutable planned Family v2 adds the capability;
  old price/subscription versions remain intact.
- Local evidence: API129 (14 focused review cases), Web54 product/source plus7
  separate legal-artifact checks, native129/one existing skip plus5 final focused,
  infrastructure10. Actual Web A/B/C and native A/B/AX5/draft/history/cadence paths
  passed. These are synthetic functional tests, not WTP or real delivery.
- Existing staging updated in two phases: migration revision14 exit0 and both
  success logs, APIrevision19 at1/1, CloudFormation/rollout complete,27 HTTPS/asset
  checks passed. Preview on, dev auth off, Stripe test preserved, Apple Sandbox off.
  Existing profiles supplied their intended CFN/ECS/log rights; no IAM expansion.
- [Feature contract](family-maintenance.md), [full verification](../output/qa/rillora-family-maintenance-20260910/README.md).
  Full paid-cutoff sharing/quotas, external reminders, complete co-owner functions,
  real-provider receiving proof and live billing remain separate gates.

## 2026-09-10 — Reprice current self-service scope; retire reviews as US$99 core value

- Owner explicitly says review still does not justify99 and asks to reprice from
  costs/profit/margins or build materially sufficient value. This continues the
  read-complete commercial workflow; current/focused authority was recovered.
- Agent chooses the repricing route under the current task/default authorization:
  prospective Family US$49/year or US$6.99/month, permanent Free and one paid tier.
  This is a reversible validation hypothesis, not an Owner-confirmed optimal price
  or market WTP. US$39/59 are sensitivities, old89 is historical,99 is deferred
  expanded-product research. No active founder promotion or new tier.
- Supersedes the earlier99 planning center and the idea that shared reviews alone
  form its core paid benefit. Reviews remain useful supporting functionality.
  No unbuilt capability is represented as included in a current paid offer.
- Rebuilt an editable five-sheet model using official current HK Stripe/Apple
  components and explicit estimates for Free/retained users, support, fixed COGS,
  operations, acquisition, monthly survival and owner labor. Added previously
  missing USD payout fees and Apple post-year renewal rate; old89 workbook archived
  by authority note, not relabeled or overwritten.
- Base49 new annual contribution26.72 /56.2%; at1,000 annual households gross
  margin48.2%. All-new cohort after assumed CAC loses7,502/year; steady state after
  replacement CAC and part-time labor yields3,101 before tax. Full-time model
  breaks even around2,350 annual households using unquoted identity reserves.
  These are scenario outputs, not operating results, quotes or financing claims.
- The99 extension would need demonstrably faster accurate capture, consent-based
  change delivery and a scoped action/materials workspace. Estimate280–480 hours
  plus4,800/year fixed and10.80/household variable. Expanded99 contribution60.2%
  in base; no included human concierge. Demand and scope remain conditional, not
  an automatic development commitment just to defend a price.
- The normal one-month customer is legitimate; do not tax cancellation, restrict
  export or bypass current privacy/expiry design. Base one-month6.99 contributes
  only0.48 before CAC/fixed costs, so short-month paid acquisition is unsuitable.
- No API/catalog/provider price/UI deployment, real transaction, recruitment or
  message. Old99/9.99 Sandbox amounts and receipts keep their exact history. AWS
  actual-cost read failed due to expired login; no bill or renewed auth is claimed.
- [Current economics and source/assumption boundaries](unit-economics.md),
  [QA and workbook validation](../output/qa/rillora-pricing-reset-20260910/README.md).
  Next engineering item remains the now49-scoped accurate sharing/expiry lifecycle
  with new prospective price records; sales remain closed until evidenced.

## 2026-09-10 — Stage operating costs and distinguish software margins from founder cash draw

- Owner rejects the flat-cost conclusion and asks for sector classification,
  normal margins and0/100/etc. stages with AI-first support/acquisition. This
  supersedes the old2,350-household full-time case as a current decision guide.
- Classify the business model as consumer SaaS for family continuity. Sector
  research uses Benchmarkit subscription81%/total77%/professional-services30%
  medians, listed software aggregates and Dropbox/Duolingo company examples.
  These are different populations/periods, not one averaged internet benchmark.
  Set a75–85% scale gross-margin objective, with marginal contribution near80%.
- Keep the49 annual reference and6.99 monthly hypothesis unchanged. Compare stages
  without continuing to manipulate price to cover an unevidenced mature budget.
- New model separates recurring cash spending, fully loaded direct gross margin,
  all founder labor and optional3,000/month owner cash draw. No unpaid labor is
  silently deleted from economic cost and no generic15 CAC is imposed without
  an acquired-customer denominator. Marketing/R&D are OPEX, not direct COGS.
- Public Frankfurt ARM Fargate/RDS/GP3 rates plus explicit budgets give a43.55
  small-production reference. Use45/75/120 stage budgets, retaining the existing
  synthetic staging separately at40. Not a deployed production or real bill.
  Real-data isolation/identity/protected ingress/7-day backup/restore remain gates;
  a zero-paid real alpha still needs production, unlike the synthetic zero row.
- Support is conversation volume × AI cost + escalations × minutes.90% independent
  resolution is a target, not an evaluated fact. The60%-resolution/higher-demand
  case exposes labor failure rather than labeling founder work free. Acquisition
  content may use AI, but0 advertising spend does not establish zero CAC or demand.
- Base100 annual households: cash221.63/month before owner pay/one-offs/tax and
  fully loaded direct GM65.9%. Base1,000: cash3,120.51 and GM76.0%; approved15%
  Apple sensitivity80.7%. About30 annual households cover only recurring small-
  cohort cash spending. These are conditional operating assumptions, not revenue.
- Owner asks whether1,000 households end15%. Official rules use combined App Store
  proceeds across all apps/associated accounts and the1-million-USD threshold,
  plus application/approval.1,000×49 is only49,000 gross annual sales even if all
  use Apple. Other-app proceeds and actual approval remain unknown. Base stays30%,
  not an automatic15%; post-paid-year subscription rules are separate.
- New four-sheet workbook passed177 numerical/boundary/export conditions against
  independent Python calculations; zero formula-error matches. All sheets rendered
  and reviewed; native Excel/WPS recalculation was not performed. No AI service,
  resource scaling, subscription, message or real recipient data was used.
- [Current contract](unit-economics.md),
  [QA and sources](../output/qa/rillora-staged-economics-20260910/README.md).
  Next bounded cost-validation item is measurable AI self-service and exception
  handling, with real resolution/token/labor instrumentation. Full commerce and
  production/merchant/identity evidence remain prerequisites for sale.

## 2026-09-10 — Price49–88 for a small, low-maintenance business

- Owner asks to test49–88 annual pricing, targets80–90% gross margin and clarifies
  quick launch, personal low-maintenance income or future acquisition as the goal.
  This is an operating-priority change, not permission to present forecasts as facts.
- Hold existing stage delivery costs, Free population and support workload constant
  for the price comparison. No optimistic channel mix or unpaid-labor deletion is
  smuggled into a higher-price row. Gross margin retains direct support/operations.
- Agent recommends79/year as the main test candidate and88 as the upper comparison,
  paired with proposed8.99/month.49/59/69 are lower cells, not extra public plans.
  These supersede49/6.99 as the main prospective proposal, but no price is verified,
  approved by market demand or written into a live catalog. Old99 test amounts stay.
- Base70% Web/30% Apple at standard first-year30%:1,000-household GM79.95% at79 and
  80.61% at88. Approved15% sensitivity gives84.59%/85.25%. At100 households even88
  only gives74.96%/79.59%, so the stated price band cannot guarantee80% from day1.
- The base mixed-channel theoretical ceiling is86.38% before any cloud/support;
  price alone cannot reach90%. Approved15% lifts the channel ceiling to91.02%, but
  88/year still has finite service costs.80–85% is the practical initial target;
  90% remains a conditional efficiency/distribution goal, not a base forecast.
- After scope freeze, explicitly budget maintenance/growth/admin hours separately
  from active development. At79 and100 payers, modeled cash before owner pay431.09
  minus128 recurring replacement labor leaves303.09/month before tax and one-offs,
  at4.83 hours/month.1,000 payers still need17.83 hours. These are not actual profit,
  paid contractor quotes, SDE, passive-income proof or acquisition valuation.
- A roughly10.6% relative payer loss could offset79→88 contribution gains under
  otherwise fixed workload. Do not assume identical paid counts after a price rise.
- Quick-launch scope now excludes building a full custom AI support platform first.
  Use short help, self-service recovery, existing support mail and AI-assisted
  responses initially. Measure real work. Return engineering to the minimum sellable
  sharing/expiry/price lifecycle, with existing production/merchant/identity gates.
- Three-sheet price model passed202 numeric/inverse/fee/scope/zero-labor/save checks
  against independent Python calculations; no formula errors. Rendered all sheets.
  No native Excel/WPS validation, runtime change, provider price change or outreach.
- [Current price/scope contract](pricing-band-20260910.md),
  [QA and workbook](../output/qa/rillora-price-band-20260910/README.md).

## 2026-09-11 — Owner68 annual, selected7.99 monthly and no-hiring automation/portability

- Status: annual68 and no-hiring direction LOCKED by explicit Owner instruction;
  monthly7.99 selected by Agent within delegated pricing scope. Demand, actual
  margins, supplier quotes and automated resolution remain PROVISIONAL.
- Supersedes79/88 as current offers and hiring/outsourcing as default scale route.
  Permanent Free plus one Family remains;29.1% annual saving against twelve monthly
  payments does not imply12-month monthly retention. No hidden introductory renewal.
- Plan every main user journey for self-service and every recurring operating task
  for bounded deployed automation, including support, content, acquisition,
  notifications, billing, costs, backup and security. Keep a phased roadmap rather
  than implementing a custom support platform/CRM/microservices before first sale.
  Historical manual-designer wording is not a hiring prerequisite; rejected logo
  forms remain rejected. Actual legal/event responsibility is not delegated to AI.
- Preserve provider-independent businessUUIDs, plan/price versions, own entitlement
  ledger, portable containers/Postgres, job contracts and content assets. Registries
  record current/planned status, upgrade triggers and concrete exit tests for
  Auth0, AWS, DNS/Cloudflare, object storage, payments, email, AI and marketing.
  Auth0 outbound password/MFA export is eligibility/support-gated; R2 is only a
  subset of S3 APIs. Neither is promised as one-click migration.
- Implemented migration0040 and effective/ranked catalog selection locally: new
  disabled6800/799 minor-unit prices against Familyv2; old99/9.99 records/bindings
  untouched. Tests verify future/expired prices and closed markets. API typecheck,
  build and130 tests pass; cloud/provider prices and UI not updated.
- Implemented a credential-free public probe and optional independent cloud stack:
  15-minute schedule disabled by default, bounded retries, encrypted dead letters,
  failure/silence/invocation/dead-letter alarms.6 probe tests,15 infra tests and
  synth pass.7 independent HTTPS status/header checks pass; Mac fake-IP DNS is
  rejected by the guarded Node path. No private response body is retained.
- AWS operator STS session is expired; no login/deploy/cloud invocation/alert
  subscription occurred. Continuous monitoring requires actual activation and
  delivered failure/recovery/silence evidence. Other jobs remain planned, and no
  external message/social post/support AI was activated.
- The68 no-hiring model separately reports cash delivery GM and direct owner shadow
  work.100/300/1,000 annual households give77.4/81.1/83.4% cash GM at baseline30%
  Apple, or82.1/85.7/88.1% if approved15%.87 independent Decimal/numerical checks
  pass. These are budgets with unmeasured usage/AI containment, not audited gross
  margin, actual net profit, passive income or acquisition valuation.
- [Current price contract](pricing-68-20260911.md),
  [full operating/portability contract](solo-operations-and-portability.md),
  [QA](../output/qa/rillora-automation-foundation-20260911/README.md).
  Next is the minimum sellable cutoff/allowance/cancel/restore lifecycle and truthful
  two-client pricing, with minimal ops activation inside launch acceptance.

## 2026-09-11 — Account, invitation and category-aware matter entry

- Owner replaces Sign in again with Sign in / Sign up, restricts outgoing invitations to authenticated accounts, requires new recipients to register before accepting, requests a direct post-login experience, removes Profile simulation/filler and combines the three matter sections with meaningful required fields and type-specific details/Notes. This supersedes the September9 editor tabs and Profile rehearsal/motivation entries; it does not remove nonoperative backend safety tests.
- Agent chooses required name/category plus provider for accounts/assets/debts/subscriptions, location for documents/devices, exchange for exchange custody, and network/public address for on-chain wallets. Outcome/people/Notes stay optional. All writes validate the final record; typed details and Notes require explicit Details-level sharing and stay out of minimum exports/events. No private-key/seed/password field or email-account auto-merge is introduced.
- Native session response carries its verified initial map, eliminating five follow-up calls when present; Web uses one core-map endpoint and defers secondary panels. No zero-time/provider-network claim. Signup retains the same invitation and still needs explicit verified-account acceptance.
- Source and checks: API136 cases plus1 focused signup-return case; native133 pass/one existing StoreKit skip; Web58 app cases; actual native/Web save/reload, invitation signup entry/cancel, AX5/reduced motion and a secondary-failure save case. The initial generic Web command incorrectly included legal-artifact tests against an app build; app-mode checks pass and legal publication is unchanged.
- Deployed existing synthetic staging: migration15 exit0, API20 1/1, CloudFormation complete,30 HTTPS/asset checks; read-only DB checksum readback matches0040–0042. No sales/real-data/operations gate opens and no real invite delivery occurs.
- Owner reported Chrome ERR_BLOCKED_BY_CLIENT at127.0.0.1 after password/MFA. The actual waiting CLI completed and STS verified rillora-operator, so the unused --remote attempt was cancelled. Future login diagnosis must check CLI/STS before asking the Owner again; documented automatic refresh is up to12hours. No permanent credential or weakened MFA/browser protection.
- [Contract](account-matter-ux.md), [QA](../output/qa/rillora-account-matter-ux-20260911/README.md), [current handoff](handoff.md). Previous commercial lifecycle work resumes after this completed UX revision.

- Final same-workflow refinement: hidden generic account/value/currency inputs are neither submitted nor validated after a category/custody change; the local draft remains available when switching back. Final native133/0/1 and Web58 checks pass. Only the final Web asset is republished; API20 and the verified0040–0042 migrations remain unchanged.

## 2026-09-11 — Distinguish outgoing invitations and bring authenticated UI to life

- Owner asks why Free's one-person path does not create a QR/link from Open invitation, and requests image-first authenticated motion. The old label described receiving; it was not the sender entry. Outgoing is now Invite someone on Overview/Profile/More; incoming is Accept a received invitation under Shared with me. Person→Access→Link generates real QR/copy handoff, with account-bound acceptance and per-item levels preserved.
- Agent selected the second displayed Prepared Folio concept under standing reversible design authorization. This replaces nested Overview progress cards with actual generated imagery, real counts and clear actions. Native/Web retain their respective navigation; motion accompanies entry, press, permission expansion, step progress and confirmed state. AX5 uses a full current-step header; reduced motion and dirty-draft preservation remain required.
- Returning to clean sharing state refreshes acceptance/revocation/version changes and removes obsolete QR/link presentation. Same-version pending links remain usable; dirty drafts are not auto-replaced. Native135 tests pass/one existing skip, including two new stale-link regressions; Web58 pass. API source unchanged;11 sharing and1 signup-return checks pass.
- Actual synthetic NativeA→WebB and WebA→nativeC verify independent Directions versus Details/Notes. QR images decode, Web copy works, C revocation preserves B's access, and a fresh zero-matter Free fixture creates its first link. All test connections are revoked at cleanup, no external message sent. Visual comparison,320/390/1440, AX5 and14.34-second actual native recording are retained.
- Existing synthetic staging received only Web assets;31 HTTPS/asset checks pass. CloudFormation UPDATE_COMPLETE, API20 stays1/1 with completed rollout; no new migration, sales, provider repricing, Auth0 change or operations schedule. Free1/Family5 numeric enforcement and paid-cutoff/cancellation remain the separate commercial launch work; this UI must not create an incomplete paywall.
- [Focused contract](invitation-motion-ux.md), [QA](../output/qa/rillora-invite-motion-20260911/README.md), [current handoff](handoff.md).

## 2026-09-15 — Whole-app UI/UX audit takes current priority

- Status: LOCKED for the Owner-requested audit scope; repair ordering is the Agent's evidence-based recommendation.
- Scope: current Web, native SwiftUI and connected subpages, including sharing, entry, exports, reviews, failures and accessibility.
- Decision: Owner requests a complete, careful audit. Complete this read/capture/inspect/report work before resuming the previous commercial next step. Preserve68/year and7.99/month, hosted native login, gray inputs, per-item privacy and billing closure. The audit is not a new visual selection or an instruction to restore removed Simulation/motivation pages.
- Evidence:66 owned Markdown files/18,108 lines fully read; actual synthetic A/B/C runtime, QR decode, saved TXT, native Debug build, compiled local legal pages, keyboard/AX5/reduced motion. [Report](ui-ux-audit-20260915.md), [QA](../output/qa/rillora-complete-ui-ux-audit-20260915/README.md).
- Result:22 open finding groups (6P1/14P2/2P3). Recommended next repair batch is UX01–06: export scope, failure/draft retention, session loading, saved-state meaning, self-service data exit and capability truth.
- Supersedes: September11 handoff's commercial lifecycle as the immediate active task, not its governing product decisions.
- Does not imply: findings already fixed, a confirmed security breach, actual provider signup/recipient delivery, production deployment, legal/VoiceOver certification or payment evidence. No product/API implementation changed and no historical test suite is reported as newly run.

## 2026-09-16 — Repair the six P1 UI/UX findings

- Owner's “直接开始修复” authorizes the audit's first reliability/privacy batch under the existing blanket project authorization. UX01–06 are now implemented and locally accepted across Web/native/API; UX07–22 and commercial launch work remain open.
- Choose the export audience before generation; project only that connection's granted safe directions, omit Never disclose and other-person existence, and bind previews/encryption to audience/version. Full private JSON backups and local readers are separate from minimum guides and delivery claims.
- Preserve a verified account's tab-local matter draft for at most24hours; keep failures/retry visible, use stable create request IDs, and recover a previously committed record without discarding subsequent edits. Use explicit loading/unavailable/guest states and Draft/Needs review/Directions added labels.
- My data now supports backup/read/empty-map import/archive restoration and explicit account deletion with a portable status receipt. Imports never restore grants. A durable worker revokes live access and removes the exact stored Auth0 identity before active-map deletion; absent service configuration leaves a real account unchanged, transient failures retry, and required retained records remain minimized.
- The new necessary-storage/self-service facts require a prepared Privacy/Cookie revision and matching Web/API/native/hosted bundle. Terms/electronic-consent wording stays unchanged. This is a reversible implementation/factual-publication decision under standing authorization, not real user acceptance or a legal opinion.
- Final API147, native138/0/1 existing skip, Web68 app+7 legal artifact, hosted action7, infra16 and builds/synth pass. Actual400/409/503/offline mobile error checks, lost-response deduplication, B/C projections, native Files and cross-client readers, Web import/archive and both-client deletion status pass. A newly created disposable Auth0 identity was deleted and independently read back as absent. No real customer or Apple upstream ceremony was used.
- AWS personal authorization expired. Cached browser400 was resolved with a new IAM session; a fresh remote request is open at handoff. No P1 code or new policy has been remotely deployed. Keep API/client/legal/hosted rollout coordinated, sales closed, and the normal Simulator matched to existing cloud until that deployment.
- [Repair contract](p1-reliability-repair-20260915.md), [QA](../output/qa/rillora-p1-repair-20260915/README.md), [current handoff](handoff.md). This supersedes the audit's unimplemented P1 before-state only; it does not close later navigation/hierarchy findings.

## 2026-09-16 — Deploy and verify P1 in the existing staging environment

- Owner completed the requested AWS browser login. The former waiting terminal had ended, so the active browser session was reused for a fresh local CLI callback and STS confirmed the project operator. Auth0 management authorization was refreshed through its existing authenticated browser session. No further Owner password/MFA or permanent AWS credential was needed.
- Published legal Sites version4 from exact nested-Web source dbe56567e00a728b8cc7dce60e4f71a07e05822f; updated and read back the existing hosted form/action; installed the dedicated deletion secret; deployed API23 and migration17 with0043–0047. Web/native/hosted/API use the matching Privacy/Cookie contract. Existing Stripe-test/maintenance-preview flags remain; development auth and ordinary sales stay closed.
- Actual cloud acceptance exposed a missing INSERT permission for provider checks during backup import.0047 adds only imported columns and sequence usage under forced tenant RLS. Import preserves existing non-default preparation settings, restores known timestamps and normalizes database dates before export validation. The regression includes normally present provider checks and a denied cross-owner insert; API148 passes.
-36 HTTPS and25 legal checks plus8 authenticated synthetic functional chains and2 final deletion cleanups pass. Eight temporary identity mappings across the setup/debug/final rounds are gone; no deletion job remains pending; five migration checksums and restricted role grants are read back. Fresh native build/install/run against cloud passes; earlier138 native tests are reused, not represented as newly rerun.
- These fixture sessions are not real provider login/email/consent ceremonies. The Cloudflare-injected challenge is blocked by retained strict CSP while document modules/navigation work; no zero-console-error or weakened-security claim. UX07–22, paid lifecycle and real-market gates remain open.
- Supersedes only the prior pending-authentication/local-only deployment state. [Deployed acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md), [handoff](handoff.md).

## 2026-09-16 — Preserve the existing UI while repairing defects

- Status: LOCKED by the Owner's explicit correction: “我不是叫你重做ui，你怎么把我的ui给改了”.
- The instruction to continue fixing bugs does not authorize homepage re-layout, navigation consolidation, Profile restructuring or a new visual direction. Existing blanket execution authorization stays in force within the corrected scope.
- Withdraw this continuation's two image-generated populated-page concepts and associated UI changes. Restore pre-turn visual/navigation files; retain earlier P1 data/reliability work. The proposed sharing preview/matter-sharing flow and API were also removed from active source pending a narrower design-consistent approach.
- Retained local edits concern URL/history, unsaved-return handling, invitation state, foreground permission refresh and existing factual messages. Current9 focused Web tests, actual Chromium navigation and normal-cloud native build pass; no P2 cloud publication or full native invitation/revocation acceptance is claimed.
- Supersedes the Agent's inferred redesign plan and any automatic treatment of audit remedies as product decisions; it does not erase the underlying audit findings or re-open billing.
- [Current handoff](handoff.md), [rollback and QA](../output/qa/rillora-p2-repair-20260916/README.md).

## 2026-09-16 — Ship behavior fixes within the preserved UI

- Owner's “开始修吧” continues repair under the no-redesign boundary. Use existing People/contacts and Visible details controls; no new intermediate page or mandatory preview step. The read-only owner preview endpoint is reintroduced for this narrower purpose, superseding only its earlier wholesale withdrawal, not the rejected redesign.
- Correct page/history/draft return, paused-guide recovery, completed/lost-response invitation state and foreground permission refresh. Prior responses cannot repopulate newly restricted recipient content. Add appropriate missing state feedback, safe context links, term/date consistency and accessibility-only reflow.
- Preserve homepage composition, root navigation and normal Profile layout. Public feedback stays within the original selector; review-first matter ordering changes data priority without resizing the folio. Printing explicitly uses white/light output, dark text and no page-entry animation. No legal wording/version/digest change.
- API149, native145/0/1 existing skip, Web75 and legal artifact7 pass. Existing staging API24/Web and legal Sites5 are published;37 final application/API HTTP/asset checks,25 legal checks and12 authenticated synthetic cloud projection checks pass. Two synthetic fixture planners/identities removed and both sessions denied. No provider account, real consent, delivery, payment or physical VoiceOver proof is claimed.
- UX12/13 structural redesign and UX20 on-screen layout remain Owner-retained choices; broad audit closure must not be inferred. Sales remain closed and pricing/quotas/lifecycle are unchanged.
- [Contract](ux-behavior-repair-20260916.md), [QA](../output/qa/rillora-p2-repair-20260916/behavior-20260916/README.md), [handoff](handoff.md).

## 2026-09-16 — Complete remaining software, excluding physical devices

- Owner explicitly requests all remaining items except physical-device acceptance. This expands the current continuation from UX repairs into the recorded quotas, cutoff and payment implementation; the no-redesign boundary remains locked.
- Use server-serialized reservations and a bounded per-grant paid-term projection captured while access is eligible. Expiry never lazily copies current post-expiry values. Restrictive changes permanently redact/remove hosted copies. A new paid period requires explicit resumption of paused relationships.
- Separate verified provider reconciliation from ordinary billing activation. Expiring validation-account enrollment permits actual test/sandbox entitlement acceptance without granting all users Family or opening production sales.
- Existing contacts need a usable atomic replacement path when Free is full; preserve the draft and require a named consequence confirmation. Do not introduce a dead-end purchase wall while the merchant route is closed.
- This is an in-progress local decision/implementation record; no new release, real B acceptance or payment evidence is claimed. See [completion contract](commercial-completion-20260916.md).

## 2026-09-17 — Activate software limits and keep provider evidence separate

- Implements the Owner's existing non-device completion request within the preserved UI. No new price, paid tier, root navigation or visual target is approved. Free1/Family5, paid-period-only copies, permanent restrictive redaction and explicit resumption are now enforced in synthetic staging, with deliberate legacy single-connection migration.
- Test/sandbox entitlement application is limited to expiring enrolled accounts; production activation and ordinary sales remain closed. Actual Stripe TEST68/7.99 prices are independently created/read back while preserving old99/9.99 records. Real current-price payment is not yet completed because Stripe requires Owner SMS verification of the existing key's Prices Read setting. No broad Core access or runtime secret read was used.
- Add CSRF/enrollment, pending-checkout reuse/close, provider duplicate-subscription preflight, exact hosted destinations and return to existing Plan & access. Configuration validation runs before new reservation. Unknown provider outcomes retain their idempotency key; they cannot be released merely because a later preflight fails. The lost-response regression proves a retry does not create a second provider session.
- Public monitoring is now independently deployed and a real AWS invocation passes all7 checks. Remove the unsupported per-function concurrency reservation; retain15-second timeout, one15-minute schedule, bounded retries and scoped operator verification. Keep scheduling disabled until the Owner selects the alert destination and alarm/recovery/silence delivery is verified. No alert message has been sent.
- API167, native149/0/1 pre-existing skip, Web78, infra17 and scoped cloud sharing/HTTP acceptance are technical evidence. Real B acceptance, new-price Stripe transaction, Apple sandbox transaction/restore, production merchant/market readiness and physical-device evidence are not inferred. [Current contract](commercial-completion-20260916.md), [QA](../output/qa/rillora-launch-completion-20260916/README.md).

## 2026-09-17 — Verify current-price Stripe and replace the interrupted API baseline

- Owner reports Stripe permissions enabled. Readback and actual test calls confirm the former Prices Read/SMS blocker is resolved. The Owner expanded the existing restricted-type test key broadly; do not continue calling it least privilege or requesting the same login. Production keys/merchant/sales remain separate.
- Actual68 annual and7.99 monthly hosted test payments grant Family5 only to enrolled fixtures. Annual portal cancel/resume, provider-ended Free1 and saved projections, full monthly test refund, same-event dedupe, active-subscription duplicate prevention and unfinished-checkout period recovery pass. Two new test subscriptions ended; two later unpaid sessions were provider-expired. No real charge or full authenticated customer purchase ceremony is inferred.
- Verified operational cause: ECS stopCode SpotInterruption at09:11:10 HKT; four Gateway500 responses at09:11:12–13 reported no target endpoints. Under the existing repair authorization, use one regular Fargate task for the interactive API/payment receiver, retaining0.25vCPU/0.5GB and the same API28 image. Stable deployment nonce and actual task readback confirm the change. This supersedes the single-Spot baseline, not the closed production/market gates.
- Add only read-only Gateway diagnostics to the existing operator. No runtime secret read or signature relaxation. Infra18 and41 post-change HTTP checks pass; application167/149 plus1 skip/78 suites are retained prior evidence, not rerun. Compute-only published-price estimate8.29USD/month is not total spend, invoice, profit or a new product-price decision.
- Verified-empty artifacts from the first failed monitor deployment were removed, their absence checked and the temporary cleanup permission stack removed. This run's3 disposable planners are removed, old sessions401 and local tokens deleted. Legacy provider objects and real Owner accounts remain.
- B actual acceptance, alert destination/delivery, Apple transaction/restore, normal production purchase and merchant/market gates remain open. [Provider/incident evidence](../output/qa/rillora-stripe-acceptance-20260917/README.md), [current handoff](handoff.md).

## 2026-09-17 — Preserve the recipient session after email verification

- Owner completed B's real signup/email verification/acceptance and identified an unnecessary second login. Under existing repair authorization, keep the original account, current legal receipt and invitation handoff; do not treat email verification as account switching.
- Select the exact provider identity from the authenticated Rillora session and read only current user_id/email/email_verified using a separate read:users service. Persist only the verified digest after rechecking session/account activity. No same-email merge, browser-supplied proof, provider flag write or fabricated consent; genuine session expiry still requires explicit sign-in.
- Preserve the existing Web/native invitation layouts and change only state/actions. Add15-second revalidation while a shared view remains visible, retaining unchanged content during routine checks and clearing it on revocation/failure. Existing foreground/background and stale-response boundaries remain.
- Local API177/Web78/native151 plus1 existing skip and4 final shared-store tests/infra19, mocked rendered flow and actual read-only provider lookup pass. Prepare cloud rollout has started after actual Owner AWS login;0060, secret installation, activation and cloud acceptance are still pending. [QA](../output/qa/rillora-real-invitation-20260917/README.md).

## 2026-09-17 — Publish recipient continuation and the Owner's Web navigation/consent corrections

- Owner clarified the missing sender view, missing Back control and desired consent order. Revocation intentionally removes the sender from the recipient list; use No shared items without implying no prior acceptance. Add explicit return to the known Shared with me origin and keep only a fixed non-secret return marker across authentication/reload.
- Place Web account and invitation signup/sign-in choices above the same unchecked consent block. Withdrawal disables both choices again. No legal wording/version/digest, hosted/native consent form or visual-direction change.
- API30/0060, dedicated read:users credential and final Web are deployed. Actual same-token provider/cloud proof, allowed projection and old-capability rejection pass; temporary cloud/Auth0 fixtures are removed.42 publication checks and the recorded local suites/rendered loop pass. This supersedes the preceding pending-rollout state only.
- The exact original human invitation token was not retained; do not claim its browser re-open was verified or recreate a link to manufacture that evidence. After-fix fresh real signup remains distinct from the actual earlier B ceremony and deployed synthetic acceptance. [QA](../output/qa/rillora-real-invitation-20260917/README.md).


## 2026-09-17 — Unify signed-in materials and add purposeful motion within the selected UI

- Status: LOCKED for the Owner's new bounded direction; exact tuning is a reversible implementation choice.
- Owner explicitly requests consistent post-login card colors, richer child-page feedback and commercially usable animation/components. Retain Prepared Folio, root composition, navigation and Profile grouping. Standard cards/actions now share neutral#252C29; icon/edge/text communicates state. This supersedes the earlier different passive/action card fills only, not the September16 no-redesign boundary outside this scope.
- Use project-authored SwiftUI/CSS and existing MIT Phosphor icons. Pow MIT was checked but not installed; Figma searches yielded no reusable Card/Button component and no Community/paid asset was imported. Native symbols remain on Apple platforms. No new concept or recurring cost is adopted.
- Add bounded entry/press/disclosure/confirmed-state feedback and preserve a static Reduce Motion equivalent. Fix the absent-icon narrow feature column and outdated Free allowance wording. A rendered check found category changes creating extra New matter history entries; replace that draft route so Keep editing preserves category and confirmed discard exits in one step.
- Full reading:78 files/19,271lines/269 body chunks before implementation. New native152pass/0fail/1 existing StoreKit skip; final Web78pass, release build and scoped rendered320/390/AX5/reduced-motion checks pass. Actual19.615-second native recording retained.
- Final Web-only staging artifact published and17 HTTP/exact-file checks pass; API30 remains1/1/FARGATE. Ordinary cloud Simulator updated with env{}; isolated QA server/Simulator stopped. No new actual authentication, payment, permission, recipient delivery or physical-device proof is implied.
- [Contract](surface-motion-20260917.md), [QA](../output/qa/rillora-surface-motion-20260917/README.md), [current handoff](handoff.md).


## 2026-09-18 — Adopt permitted components with attribution; fix clipped filters

- Owner explicitly says commercially permitted libraries should be used and their notices included, and asks for a real Figma license search. Do not treat attribution as a blocker or a reason to avoid a suitable library. Existing scope/visual boundaries remain.
- Confirmed free Community CC BY4.0 terms and Figma SDS code MIT license. Found SDS in the Owner's editable file libraries, imported Tag Toggle Group, read actual context and adapted it for native content-sized single-select filters with wrapping,44pt targets and Reduce Motion. Source and changes are credited in bundled Design credits and THIRD_PARTY_NOTICES. No paid library or new runtime package is required.
- Fix the equal-width Matters segmented cells that truncated Directions added; apply the shared control to review inbox and billing period. Actual normal/AX5/SE3,5/2/3 filter counts, inbox/billing switch and credit rendering pass; ordinary native build installed. This is a presentation follow-up, not a redesign or new permission/billing operation.
- September17's no-library-import statement remains historical and does not govern future adoption. Prior suites/cloud publication were not rerun. [QA](../output/qa/rillora-filter-fit-20260918/README.md), [license register](asset-licenses.md), [handoff](handoff.md).


## 2026-09-18 — Install motion libraries and a separate hands-on preview

- Owner explicitly asks to find usable components/effects and install them in Simulator. Add MIT Pow and SwiftUI-Shimmer to actual shared native controls, and a separate local Rillora Preview app for direct Feedback/Loading/Flow comparison without login. This is not a consumer Simulation feature or new product layout.
- Pin Pow's official1b4b1dda28c50b95f0872927ee2226fe8b58950e fix after numbered1.0.5 fails current Xcode on ambiguous `.pi`; pin Shimmer1.5.1. No vendor fork or floating branch. Preserve notices in both app bundles and retain SDS credit.
- Main app uses bounded selection/confirmation effects, blur insertion with immediate removal, and active/visible/reduced-motion-aware shimmer. Attention shake remains a preview candidate. The preview's three-second delay and local states never become real data or production waiting behavior.
- New main unit run152pass/0fail/1 existing StoreKit skip; final main/preview builds and actual copied-state interaction pass. Preview controls/reduced mode/credits/loading-to-ready checked; final15.938-second recording and exact-time moving-band frames retained. Normal app installed separately; preview left running on Feedback with motion enabled. No new real identity, invitation, payment or Web/API deployment.
- [Contract](component-preview-20260918.md), [QA](../output/qa/rillora-components-preview-20260918/README.md), [handoff](handoff.md). This supersedes the evaluated-only Pow state and advances the current next step to Owner review of the installed effects.


## 2026-09-18 — Make platform guidance visible, concrete and shared

- Status: LOCKED for the Owner's guidance-first direction; catalog breadth and presentation are reversible implementation choices.
- Owner cannot find Apple/Google/Binance guidance in Simulator and asks to include other well-known platforms/software, emphasizing instructions. This supersedes preview tuning as the current task. Keep the selected UI; expose Platform guides in signed-out and signed-in native Profile, public Web Guides and the existing authenticated guide destination.
- Expand eleven categories to eighteen entries, split Instagram and Binance.US, and share one versioned JSON source between both clients. Reading is public; original five optional self-report IDs remain unchanged, without new readiness credit or backend grants.
- Put numbered Prepare / After a death instructions and Documents before phase-specific official links. Correct Binance's old generic-chat guidance to its published Legacy Inheritance / Inheritance Appeal process. Keep regional differences and cancellation/access/asset-transfer limits explicit.
- Sixteen entries receive September18 full-content review. Facebook/Instagram retain August20 dates after provider help access returned login/temporary block. No claim is made that a Rillora check or a help link completes inheritance, grants access or submits an application.
- New native153pass/1 old StoreKit skip and Web79pass; final content follow-up native5/Web4 and sites4 pass. Actual public desktop/390/320, native normal/AX5 with Reduce Motion and Back/search checked. AX5 exposed broken Previous/Next and a fixed-size badge; stack/scale repaired and observed. Final main app installed with env{} on Matrix17Pro. Web-only artifact6dec833e8f0a72c291b2cdd3fae5e37b02103263fa042c3a738a776781783299 deployed;20 HTTPS/exact-build checks and actual cloud guide rendering pass.
- AWS required fresh personal login; Owner completed it, CLI and STS succeeded. No new authorization gate or permanent credentials. No provider claim, document upload, real account mutation or production sales change. [Content contract](provider-death-account-guides.md), [QA](../output/qa/rillora-platform-guidance-20260918/README.md), [handoff](handoff.md).


## 2026-09-19 — Put account guidance beside the matter, within its shared scope

- Status: LOCKED for Owner's contextual guidance direction; wording and local matching are reversible implementation decisions.
- Owner requests official company icons, a clearer guide name, automatic relevant guidance during A’s matter entry and B’s permitted reading, and a check of the actual official routes with original URLs. Rename the entry Account inheritance and keep the existing navigation/visual system.
- Match provider first, then title, using explicit shared rules with word boundaries/brand aliases, Binance.US precedence, single-letter X restriction and known self-custody exclusion. Do not scan notes, account/email hints or hidden owner fields. Suggestions do not persist a guessed association or alter sharing. A reads without losing draft state; B uses only the server's projection.
- Adopt Meta’s original Instagram white glyph under its published brand conditions and preserve existing permitted GitHub/X marks. Do not infer general commercial rights from a download, icon-pack license or Figma membership. Google/Microsoft restrictions remain; attribution/source/non-affiliation notes are bundled.
- Recheck actual official pages and initial form/login boundaries. Correct Instagram’s URL to help.instagram.com and expose its original memorialization/removal links; update Facebook menu variants, Google’s conditional court/translation requirements and direct Adobe/X/Coinbase routes. Coinbase’s unauthenticated selector did not advance; no end-to-end claim. No official request, data upload, account login or legal acknowledgment performed.
- New native154pass/0fail/1 existing StoreKit skip; Web80pass. Shared19-case matching fixture, actual synthetic local A/B recommendation/hidden-provider checks, draft return,320px original-link rendering and revocation clear private data. Native may retain an already-open public guide after revocation; it contains no matter fields, and Close returns to Access changed.
- Web-only staging artifactbe1a6893de0f06d3d59ddaeffa66a4ea011142aede51b8ea22954cfd0d01d7f1 published;20 HTTP/exact-file checks pass. No API, account ceremony, legal version, production sales or real sharing scope change. [QA](../output/qa/rillora-contextual-guidance-20260918/README.md), [original sources and limits](../output/qa/rillora-contextual-guidance-20260918/official-source-links.md), [current handoff](handoff.md).


## 2026-09-19 — Reassess provider marks by use context, not a blanket prohibition

- Owner challenges the logo restriction and asks for another review. Research separates vendor-granted permission from honest identifying use under Hong Kong Trade Marks Ordinance21 and from independent copyright/contract/jurisdiction questions. Absence of a general license is not proof that every reference is unlawful; an exception is not worldwide clearance.
- Adopt original Facebook primary logo and current Dropbox553-byte Glyph only as secondary identifiers of independent instructional guides. Dropbox's education/instruction clause is materially different from its advertising/product-branding rules. Meta's standard compliant reference usage is assessed separately from co-branding approval. Preserve art/color/proportions/spacing; add source/ownership/non-affiliation notices.
- Retain Instagram/GitHub/X. Record Google media/business ambiguity and explicit software/logo restrictions separately. PayPal has an actual HTML-logo/direct-traffic exception, which must not be erased by quoting only its general mark reservation. Native/internal-navigation use is a separate scope. Unknown or scoped grants are not labelled globally illegal.
- Native and release Web builds succeed, sites4 pass, actual images/spacing/load checked. Web-only artifacte7635129f00c693e6b802a0eee2ae504327b883aae7c312df9b0bd85ab8163e3 deployed;20 HTTP/build checks pass and extra raster hash/readback validates the Facebook file. Main Simulator updated with env{}; no API, permission, guide matching or commercial behavior change.
- New full native/Web/API suites were not run for this reversible asset/presentation change. Prior154 native/80 Web tests remain the preceding contextual-guidance checkpoint. [Purpose review](provider-mark-usage.md), [QA](../output/qa/rillora-provider-marks-20260919/README.md), [handoff](handoff.md). The legal assessment is bounded/provisional, not counsel sign-off or individual company approval.


## 2026-09-19 — Evaluate functional account identifiers separately from brand marketing

- Status: PROVISIONAL for the purpose-specific implementation method, not a new Owner legal approval or individual-brand license.
- Owner requests deeper research because many other apps/sites use company logos. Official Bitwarden/1Password/KeePassXC documentation and Home Assistant's brand repository confirm website/account/service identification as an actual product pattern. Bitwarden's pinned fetching/controller code confirms domain-based icon retrieval and fallback; unpublished licensing contracts remain unknown.
- Do not require a separately signed vendor agreement as the only possible route for every accurate small reference. Record public permissions, functional-reference legal assessment, specific agreements and unresolved scope separately. Favicon semantics, another app's presence or icon-library licensing alone are insufficient proof of rights. Matter identifiers, independent instructional content and marketing/integration/sign-in claims remain distinct placements.
- Correct the Microsoft record: its official Microsoft365/Azure sets permit specified documentation/training/architecture uses. Check original exact product art and conditions; do not use that to clear the corporate mark or a whole-account directory icon. Simple Icons' maintainer-reported Microsoft notification and actual removal show why source and modification conditions matter.
- Prefer the existing small bundled/first-party catalog to remote domain-based icon requests. B must still use only disclosed fields. No new runtime icon request, dependency, runtime asset, legal acceptance, App Review submission, build/test or deployment occurs in this research checkpoint; five existing adopted marks remain the preceding installed baseline.
- [Research](provider-icon-practice-research.md), [current use contract](provider-mark-usage.md), [QA](../output/qa/rillora-icon-practice-20260919/README.md). This supersedes a vendor-letter-only interpretation, not the asset-specific conditions or the existing privacy/launch gates.


## 2026-09-19 — Adopt the supported Coinbase mark and preserve unresolved conditions

- Owner directs using as many company logos as possible within lawful bounds, specifically naming Coinbase and Netflix. Continue the existing UI; no wholesale redesign or permission/guide-content change.
- Adopt Coinbase's official CDS24px mark geometry and documented dark-mode white from pinned revision `1e9dd1347462254cea684fd8f8b325cac6c955fb`. Source copyright is Apache-2.0; the original path is mechanically extracted into a static SVG with modification notice. Trademark identification is a separate bounded/provisional assessment, not a claim that Apache grants all logo rights or Coinbase individually approved Rillora.
- Include exact source, copyright, full Apache text and non-affiliation scope in root notices and native credits. Web now ships the same credits as a first-party text resource with a quiet directory link. No remote Matter-domain icon requests or new runtime dependency.
- Reread Netflix's actual rendered terms: its approval requirement explicitly covers content/materials. Do not label the unapproved use compliant with Owner's condition. Binance's newsroom points to a now-private style-guide page; no password/access attempt. Yahoo/Steam and the existing limited-use exceptions remain separately recorded. Neutral identifiers do not assert universal illegality.
- Native build/run succeeds with no reported warnings/errors; normal Matrix17Pro directory/detail visibly show the original Coinbase glyph. Release Web build succeeds, sites4 pass, source geometry/hash/credits equality checked, local and published24px image inspected. The final Web-only diff changes one source artifact to `430a74040cebd84049e01c0c0f1e5e1880176952b307f41b7e496930c5a3cdc0.zip`; deployment completes and21 HTTP/exact-build checks pass. Published credits return200/text/plain and exactly match the build. Existing AWS session works.
- No new full native/Web/API suite or A/B sharing ceremony was run for this asset/credits change. Previous154 native/80 Web checks remain dated to the contextual-guidance checkpoint. API30/0060, legalSites5 and sales gates are unchanged. [Current mark contract](provider-mark-usage.md), [rollout QA](../output/qa/rillora-provider-icons-rollout-20260919/README.md), [handoff](handoff.md).


## 2026-09-19 — Formal release preparation becomes the primary workstream

- Status: LOCKED
- Scope: current engineering/release priority, preserving UI and no-hiring scope.
- Decision: treat subsequent work as formal Web+iOS launch preparation. Freeze optional visual/provider expansion and future features outside the release path. The Owner selects the daily Gmail for operational alerts and says to defer business/registration; do not ask for those documents or infer completion. Keep physical-device evidence separate under its previous exclusion.
- Evidence: Owner explicit launch request and two async answers; full92-file body read and current source/control-plane checks in[release QA](../output/qa/rillora-release-readiness-20260919/README.md).
- Supersedes: the ordinary provider-icon walkthrough as the active next step; old high-cost staffed operating defaults and historical mandatory-counsel assumptions are not current launch prerequisites.
- Does not imply: live merchant eligibility, production deployment, device acceptance, App Review or paid launch. No counsel approval is invented.
- Implementation impact: one release contract/gate register/preflight; actual alert and missing-heartbeat acceptance; security dependency updates; truthful Apple submission preparation. The old simulation-based “Verified Emergency Plan” activation metric becomes a connected useful-map task with an actual permitted reader, not legal verification.

## 2026-09-19 — Owner selects88.80annual and9.99monthly

- Status: LOCKED
- Scope: new FamilyUSDquotes, not the capability bundle or historical receipts.
- Decision: annualUS$88.80,monthlyUS$9.99; sameFamilycapabilityversion2. Priceversion3is independent. Annual saving25.9%versus12monthlypayments. Preserve allv1/v2priceobjects,transactions andacceptedterms; noautomatictrial orminimumterm.
- Evidence: Owner explicitly states the new amounts and price-increase concern. Newlocalcatalog andStripeTESTprices areimplemented. [Currentprice](pricing-88-80-20260919.md).
- Supersedes:68annual/7.99monthlyasnewpurchasequote; itdoesnotrewritehistoricaltestpayments orfinancialmodels.
- Does not imply: demand/profit,salesopening,newv3payment,Appleexact88.80availabilityoragreedalternative. Applepickeronlyoffers88.00/88.90/88.99nearby;theOwner'sspecificchoiceispending.
- Implementation impact: additive0061/0062;price/capabilityversionseparation;legacyproviderreconciliationtests;frozen-inputeconomicrecalculation;server-pricedWeb/iOSandindependentprovidercatalogrecords.


## 2026-09-19 — Owner revokes all previous Logo restrictions and delegates the redesign

- Status: LOCKED within the Logo design scope.
- Decision: restart Rillora Logo design now, with Agent choosing the direction and execution. Owner explicitly says “推翻之前我所有的logo限制，你直接自己重新设计”.
- Supersedes: all earlier Logo-specific motif/letter/topology exclusions, fixed concept requirements, rejected-form reuse prohibitions, score thresholds, candidate counts, required tools and sequential approval gates. The temporary pause is lifted. Do not demand a hired designer or repeat the former gate questions.
- Preserves: the established Rillora name and product facts, existing App UI, account/security scope, third-party rights and truthful evidence boundaries. The Owner did not request a whole-app redesign or public release.
- Implementation: built-in ImageGen explores distinct directions; Agent selects a primary direction and develops an editable first identity with practical size/contrast/export checks. [Current Logo brief](logo-design-20260919.md).
- Does not imply: final Owner adoption, trademark registration/clearance, App Store submission or permission to fabricate commercial facts.


## 2026-09-19 — Preserve Flowing R and make a second independent identity

- Status: LOCKED for preserving the first design; the new design remains an alternative.
- Evidence: Owner says “先保留这版，再另外设计一版”.
- Decision: keep all Flowing R assets and its Figma page intact. Add Open Folio as a separate direction with its own symbol, typography, palette and exports; provide a comparison without rewriting the first source.
- Supersedes: an assumption that the next step must refine only the R direction. The earlier revocation of all Logo restrictions remains active.
- Does not imply: final Owner adoption of either design, trademark clearance, App branding deployment or an App-wide UI change.
- Evidence: 37 first-design file hashes captured before work and compared afterward; Figma page49:2 retains its original children and geometry. New work lives on page53:2. [Current brief](logo-design-20260919.md), [QA](../output/qa/rillora-logo-alternative-20260919/README.md).


## 2026-09-19 — Reject Open Folio for weak meaning and product relevance

- Status: LOCKED for rejecting identity02; the new identity direction is exploratory.
- Evidence: Owner says “不要这版，没有意义也没有关联，再给我一版”.
- Decision: close the Open Folio/book-page design, preserving its source only as history. Keep the earlier explicitly retained Flowing R unchanged. Develop a fresh symbol with a more legible relationship to personal digital legacy and trusted people.
- Does not imply: rejection of identity01, a restoration of older Logo constraints, approval of the next design, permission to claim biometrics or guaranteed inheritance, or an App branding deployment.
- Implementation: new ImageGen exploration and separate editable outputs; do not disguise a page-symbol revision as a new direction. [Current brief](logo-design-20260919.md).

- Implementation checkpoint: Legacy Imprint/03 is now exported as separate SVG/PNG/Figma sources and compared only with retained01. Twelve artifact checks and visual review cover rendering, not human comprehension or clearance. The initial overlong Figma call was rejected by schema before canvas execution; splitting the payload completed the writes without changing permissions.


## 2026-09-19 — Retain03, request a clearer tree, and reject the first leafy attempt

- Owner says “这版也保留，在这版的基础上再做一版，让它更像树”. Preserve01 and03; the requested change is an evolution of03, not a new unrelated identity.
- The first tree-focused ImageGen/contour attempt adds solid leaves and a scalloped canopy. Owner then says “不喜欢这个”. Close that04 attempt without inventing a stated rejection reason.
- Agent diagnosis: the solid foliage changes03's line language too much. Continue from03 with clearer trunk/forks/root anatomy and the same visual language. This is a design judgment, not Owner feedback wording.
- No retained source was modified;04 stays internal rejected evidence and is not promoted to a new production asset. Old Logo restrictions remain revoked.


## 2026-09-19 — Owner selects Legacy Imprint03 and requests commercial font verification

- Status: LOCKED for identity selection and preservation of existing UI.
- Decision: Owner supplies the original03 board and says “还是用这版吧”. Adopt that symbol and Source Serif4 SemiBold outlined wordmark;01/02/04/05 remain historical alternatives. No more05 feedback gate or old Logo-specific restriction applies.
- Implementation: separate canonical asset folder and brand.json; compact reverse uses03's existing micro geometry; main iOSAppIcon and existing Web/native brand positions adopt03. Preserve all37 original03 files and the current Graphite/Prepared Folio layout, card palette and navigation.
- Font evidence: original Adobe/GoogleFonts/InterOFL1.1 plus bundledWOFF metadata confirm commercial Logo/Web/paid-App use. The package-level SourceSerifcopyright header was incomplete; full source notices now accompany the canonical assets, Web/native credits and same-origin legal/app resource. Outlined artwork/app code do not inheritOFL. No paid font licence purchase or additional font dependency.
- Verification: ordinary native build/run and actual title/home-screen icon;80 application tests and7 separate legal artifact checks;31 stagingHTTP/asset matches; legalSites6 published with31 anonymous checks and narrow rendered brand verification. Wrong-build-mode legal failures and a pre-existing asset-budget guard were corrected without weakening the retained1JS/1CSS/size/security guards.
- Does not imply: productionRelease,AppStore submission,trademark clearance,new full native/API suite or Auth0 hostedLogo replacement. Pricing and deferred Owner/device questions remain separate. Closeout after midnight onSeptember20 is document completion, not a new Owner decision.
- [Brand contract](logo-design-20260919.md), [font sources](brand-font-license-20260919.md), [QA](../output/qa/rillora-brand-adoption-20260919/README.md).


## 2026-09-20 — Correct inconsistent mobile brand geometry

- Scope: enforce the existing Owner-selected03 design; no new identity or UI direction.
- Evidence: Owner's mobile screenshot shows fewer outer ridges than the selected board. The native brand view defaults to a micro-symbol asset, and the Web compact branch uses the same simplified lockup.
- Decision: remove alternate geometry from app/page brand lockups. Use the complete03 master at every header size, scaling proportionally. Web compact controls CSS size only; native uses one image asset with configurable height. Tiny browser favicon assets remain a separate context.
- This corrects the Agent's adoption choice; it is not a font problem or device-rendering limitation. Original03 source files, typography, header dimensions, UI layout and mainAppIcon stay unchanged. Simplified lockup guidance in the prior adoption is superseded.
- Implementation and checks: native build/install succeeds; actualSimulator screenshot shows complete ridges. Web release build and4 existingworker tests pass; Web-only deployment/resource verification is recorded in the [correction QA](../output/qa/rillora-brand-consistency-20260920/README.md). No full business-test rerun, new authentication or legalSite publication is implied.


## 2026-09-21 — Review one-month setup use without treating advice as a pricing decision

- Owner asks how to handle low frequency, one-month subscriptions and potential restrictions. This is a question, not approval to revoke data access, remove monthly sales or change paid features.
- Existing authority remains88.80annual/9.99monthly, Free1/Family5 and paid-cutoff authorized copies. Current source and earlier acceptance record agree on that boundary; no new live lifecycle test was run.
- Agent recommendation: first-sale annual-onlyFamily plus permanentFree, preserving prior commitments and retrieval; complete useful ongoing notification/coordination before claiming recurring value. This recommendation is not yet an adopted catalog decision.
- Four exact payment scenarios are computed from the current catalog. One month9.99 and four isolated months39.96 are arithmetic, not measured retention,ARR or a forecast. Annual-only could reduce conversion and does not prove next-year renewal.
- No runtime, provider, consent, access or price change. Corrected stale68/7.99 references in the focused maintenance/current-price pointers. [Analysis](subscription-value-20260921.md), [QA](../output/qa/rillora-subscription-value-20260921/README.md).


## 2026-09-21 — Research channel-specific prices without changing the offer

- Owner asks whether Apple pricing may exceed Web because of Apple fees, whether other products do this and whether Apple permits it. This is a research request, not a saved-price decision.
- Primary-source finding: Apple pricing/link/multiplatform rules and Telegram/Patreon official help support different channel prices. External links and lower-price messaging remain storefront-dependent. Distinguish AppStoreIAP from using an iPhone or buying on the Web.
- Fee-only recommendation: keep Web88.80 as reference; consider Apple99.99annual if15% is actually approved/effective, or119.99under30%. Conditional monthly candidates10.99/12.99 do not adopt or reject the preceding annual-only proposal. Same Family capability and no double subscription.
- StripeHK standard-rate inputs,15%/30% Apple conditions, tax/payout exclusions and management-margin denominator are documented. The amounts are illustrative fee balances, not actual settlements, margin projections, price-point approval or evidence of demand.
- No catalog/provider/entitlement/market/consent change, SmallBusiness enrollment, production transaction or deployment. [Research](channel-pricing-20260921.md), [QA](../output/qa/rillora-channel-pricing-20260921/README.md).

## 2026-09-21 — Owner adopts annual-only new sales and requests full brand/capacity checks

- Owner explicitly says “那就取消月付吧”, superseding the earlier recommendation-only status. New Family purchases are annual88.80; no higher Apple channel price is approved. Free1/Family5, historical paid terms, safe cutoff copies and free data exit stay intact.
- Keep immutable monthly prices/receipts and restoration support; retire their offer status and block new purchases. API33/0063 is deployed to existing staging, Stripe's three TEST monthly Prices are archived and the never-released Apple monthly product selects0territories. Ordinary sales remain closed.
- Preserve selected03 and existingUI. Repair Preview's missing icon; basic Auth0 branding and client logos are saved. Actual custom-domain Liquid is still text-only and Free API402 blocks its update, despite the default-domain preview showing the newlogo. Stripe/Google uploads require the Owner's Chrome file permission; no tool-policy bypass or automatic subscription purchase.
- Use real quotas, metrics and bounded own-API fixtures for100-user assessment. Auth0Free2/25kMAU does not require a headcount upgrade; production mail and advanced customization are separate feature constraints. Mixed load results and same-sourceIP300/15minute limit remain visible; no claimed100concurrent capacity or production readiness.
- Reused complete-read baseline with incremental recovery; no Git initialization/commit, live charge, broad authentication change or unrelated UI redesign. [Execution](annual-brand-capacity-20260921.md), [QA](../output/qa/rillora-annual-brand-capacity-20260921/README.md).

## 2026-09-21 — Resolve provider Logo upload and evaluate security positioning

- Owner reports Chrome extension setup and asks how to match competitors' bank-level information protection. Successful uploads now prove the file permission works; approved03 is saved to Rillora TEST Stripe icon/wordmark and Google OAuth branding. Google staysTesting, prices and runtime permissions unchanged.
- The security question is evaluated as a design/positioning request, not approval to advertise a certification or silently migrate online data. Source inspection distinguishes transparent RDS encryption, plaintext business columns/saved copies, client-encrypted recovery exports, and a possible future onlineE2EE system.
- Agent recommends application-level envelope encryption plus production controls under solo-operator/launch constraints. This is a proposal, not Owner adoption, implementation, independent audit or proof of provider-unreadability. Baseline security remains shared byFree/Family; no certification badge or security paywall is added.
- [Focused research](security-positioning-20260921.md), [design comparison](security-hardening-20260921/hardening.md), [QA](../output/qa/rillora-security-positioning-20260921/README.md).

## 2026-09-22 — Clarify E2EE effort without assuming selection

- Owner asks whetherE2EE is a large task and whetherRillora can reach competitor capabilities. This is feasibility clarification, not selection of clientE2EE or permission to advertise completed equivalence.
- Rechecked the prior12 source/evidence hashes, scoped Web/native export and sharing paths, and current primary competitor pages. Existing recovery-package crypto is reusable; online sharing, offline-owner invitations, device/recovery keys and cutoff copies remain distinct work.
- Agent's preliminary engineering budgets are8–15workdays for envelope encryption and24–40for full onlineE2EE. Confidence ismedium-low; exclude other release work, external review, platform and real-device waiting. These are not measured velocity, guaranteed calendar dates or certification timelines.
- Keep the current recommendation conditional on launch speed/self-service versus provider-unreadability. No runtime, provider, pricing, permissions, tests or deployment changed. [Estimate](e2ee-effort-20260922.md), [QA](../output/qa/rillora-e2ee-effort-20260922/README.md).

## 2026-09-22 — Owner authorizes Option2 implementation

- Owner explicitly says to implement the recommended approach now and considerE2EE later. Application content envelope encryption plus independent managed keys is selected; prior unselected/advice-only statements are historical.
- Preserve plaintextAPI contracts after authorization, existingUI, Free/Family parity, scoped sharing, paid snapshots and self-service recovery/export. The application can still decrypt, so this is notE2EE or certification.
- Implementation uses immutable encrypted values and opaque references to preserve the existing SQL field projection/cutoff rules; resolution repeats authorization for the exact current permitted references. Include retained copies and prevent plaintext write fallback.
- New KMS, migration, rollback and tests are necessary authorized engineering work; deployment and real data outcomes remain separately evidenced. No new annual price, billing activation or independent-review claim. [Implementation](security-hardening-20260921/implementation/envelope.md).

## 2026-09-23 — Implement and verify the selected content-key boundary

- Scope: implement Owner's September22 Option2 selection. Preserve existing client contracts, Free/Family parity, exact sharing, paid copies and user-controlled exports. Full onlineE2EE stays deferred.
- Engineering: AES-256-GCM bodies with wrapped per-planner data keys, one retained/rotatingKMS key, immutable references, exact-reference authorization and DB plaintext guards. Migration-only SQL access is isolated from runtime role membership; temporary migrationKMS permission is removed after backfill.
- Migration: compatibleAPI34 then encryptedAPI35,0064–0067; pre-migration encryptedRDS snapshot available. Both existing accounts verified, five protected values/two rows converted, second pass zero changes, plaintext0/invalidrefs0/enforced. No private contents or raw data keys logged.
- Validation:198API and23infra tests pass; realKMS A/B/C, cutoff, revocation, wrongcontext and20/200-item reads verified. Final key task proves denied GenerateDataKey/Decrypt for migration role while normalAPI works. Follow-up catches and fixes a revoked-review403 being incorrectly masked as503; local and real cloud regression pass.
- Final runtime:API37/migration30,1/1, rolloutCOMPLETED,30HTTP/asset checks; final synthetic fixtures removed. Source stays uncommitted; no initial Git commit, UI redesign, price change, live sale or production launch.
- Limits: server runtime can decrypt; metadata and external exports differ from protected bodies. Old manual snapshot retains RDS-encrypted prior representation and has no automatic expiry. Production isolation/internalTLS, identitymail, seven-day backup, isolatedrestore/deletionreplay and independent review remain open. NoE2EE, zero-knowledge, certification or universal latency promise.
- [Implementation](security-hardening-20260921/implementation/envelope.md),[operations](security-hardening-20260921/implementation/operations.md),[QA](../output/qa/rillora-content-encryption-20260922/README.md).

## 2026-09-23 — Start isolated production/recovery and preserve separate projects

- Owner requests starting production and recovery and asks aboutGitHub rollback benefits. Owner then explicitly requires preservingFanPass and existing repository use. Rillora must have a separate private source destination; no existing repository/history is deleted, moved or replaced.
- Agent implementation choice under existing project authorization: a closed production data foundation before customer ingress, exact7-day retention, independent keys/credentials/network and isolated recovery workers. Actual provider refusal cannot be bypassed by silently reducing backup guarantees.
- Keep source history, deployment artifacts and database/control-state recovery separate. Source publication excludes credentials/private evidence/build caches; maintain the existingWeb Git metadata in place. Repository creation/push and restore need their own actual readback.
- No new pricing, fullE2EE, live billing, public traffic or market activation. [Execution contract](production-recovery-20260923.md).

## 2026-09-23 — Private source baseline and an actual production plan limit

- Owner confirmed at action time that the existing repository-scoped GitHub token may add only Rillora. FanPass access/history and nested Web Git metadata remain unchanged. Private `tantalum666/rillora` was created, reviewed source pushed, and visibility/commit/tree read back.
- Actual production creation now confirms the requested7-day backup exceeds this AWS Free Plan's allowance. Keep7days; do not infer an exact free maximum, downgrade the requirement or upgrade billing without the pending Owner account step. CloudFormation rolled back; production data/runtime does not exist.
- Engineering choice: source CI uses pinned first-party actions, an exact-digest scanner and ephemeral PostgreSQL, with no cloud credentials/deployment. Recovery resource operations require exact source/account/IDs, ownership tags and separate security groups; a created clone remains quarantined pending application acceptance.
- No UI, price, E2EE, live sale or public release change. [Execution](production-recovery-20260923.md), [source control](source-control.md).

## 2026-09-23 — Owner authorizes direct AWS Paid Plan upgrade

- Owner explicitly says “你来升级”. The Agent successfully used the existing operator's official UpgradeAccountPlan permission; readback isPAID/ACTIVE and111.95USD credits at that check. No new IAM grant or Organizations/ControlTower side path was needed. The prior billing-console restriction was not an upgrade-API denial.
- The original7-day backup requirement is preserved. Production data foundation is deployed and migrated through0070, with independent control metadata outside RDS. Customer HTTP services, live billing and public release remain closed.
- Source controls journal before commit and reject missing publication. Replay is conservative and quarantines unsupported post-snapshot entitlement changes for provider reconciliation; it does not promise an atomic cross-service transaction, zero data loss or unattended failover. Cloud restore is a separate in-progress acceptance. [Control contract](recovery-control-journal.md).

## 2026-09-23 — Verify the closed production data/recovery checkpoint

- Actual production migration0070, independent journal initialization, encrypted synthetic seed, RDS snapshot, later C revocation/D erasure, isolated restore, KMS read and replay passed. The restored copy first contained the old D key/session; after replay B retained access, C was denied, D/key/body and old sessions were gone, and repeat replay made no new changes.
- Recovery-role probes actually confirmed original-network isolation, denied new key generation and denied journal writes. Exact source fixtures, clone and drill snapshot were cleaned/read back; original production remains private/encrypted/protected with7-day backups and365-day KMS rotation.
- Retain quarantine for unsupported post-snapshot commerce changes and keep public runtime/identity/mail/billing/submission separate. This bounded four-account experiment is not automatic failover, zero-RPO, broad capacity proof, E2EE or independent certification. [Acceptance](../output/qa/rillora-production-recovery-20260923/README.md).

## 2026-09-24 — Prepare closed production HTTPS and retain flexible billing

- Owner requests the next production step plus usage/package comparison. Agent selects the later small-production cost contract: one regular ARM task, strict VPC Link-only ingress, private-address HTTPS with a single managed exportable certificate, private RDS and unchanged recovery floor. This supersedes the older mandatory private-subnet/NAT assumption; public task IPv4 is disclosed as outbound connectivity, not called a private subnet.
- Source permits only closed production mode in this increment, exposing health checks and rejecting every account/private/provider route. Certificate material stays out of disk/build/env/logs; local renewal verifies the presented peer certificate actually changes. Callback/path/raw-error logging is removed. Existing staging is not redeployed.
- Keep on-demand while baseline use settles. A one-year no-upfront RDS reservation is a later option (4.67USD/month compute saving), not a purchase; current t4g is outside the official provisioned Database Savings Plans generation scope. No new price, long-term commitment, bundle, market or sales activation.
- Local API212/infra29 and live-template diff pass; cloud TLS/network acceptance is still pending GoDaddy owner login. The current Google management identity does not expose the old Auth0 tenant; request the original administrator method rather than create another tenant. [Runtime](production-runtime-20260924.md),[cost comparison](cloud-cost-options-20260924.md).

## 2026-09-24 — Apply the exact certificate and install the requested GoDaddy CLI

- Owner explicitly confirms the one ACM verification CNAME, then requests GoDaddy CLI setup and confirms its exact OAuth capabilities/terms. Save only the reviewed record; preserve the other19records. Official gddy0.2.20 uses keyring OAuth with domain-read/DNS-update/offline/default-registry-read. Project commands pin rillora.xyz/prod; the underlying vendor grant remains account-wide.
- Actual production desired0→1 deployment iscomplete: issued/exported/renewable certificate, healthy regular task, Gateway privateTLS and closed private routes. Original data/keys/schema0070 preserved. Three production checks join the existing active public monitor without changing its historical metric dimension, subscriber or alarm resources.
- Preserve the inconsistent local bareTCP probe as inconclusive; actual provider ingress has only the VPC Link group and direct-IPTLS does not respond. Bounded transport/configuration evidence is not a broad penetration test or customer-release approval.
- Actual gddy temporaryTXT preview/create/read/cleanup restores the whole original20-record zone. No FanPass, domain purchase, nameserver, new pricing or long-term commitment change. Auth0 original email/password/MFA administration is recovered; production identities/mail remain their next separate gate. [Runtime](production-runtime-20260924.md),[CLI](../tools/godaddy/README.md).

## 2026-09-24 — Retain Free Auth0 and prepare a controlled prelaunch transition

- Owner proposes testing now and cleaning before launch, then asks why Free has25,000MAU while a paid quote has500. Fresh account/official pricing checks confirm both:35USD is only the paid starting tier. Agent adopts Free for this stage; no paid Auth0 plan or second tenant is created.
- Prepare separate production Web/native clients and API audience, keep their connections disabled, and preserve current test accounts. Before customer activation, retire staging identity credentials/bindings/sessions and review exact test-data disposition. This supersedes the immediate paid simultaneous-tenant recommendation; separate application IDs are not claimed to isolate tenant-wide deletion.
- Owner explicitly accepts the Google API User Data Policy for the prepared Rillora production project. Brand initialization, selected03Logo and real public/legal URLs are saved. OAuth credential creation and production publication remain separate actions.
- SES has a separate verified sending domain, requiredTLS, suppression configuration and aggregate event alarms. Its production-access request is submitted/PENDING, not approved or installed in Auth0. Public WWW is deployed with the existing visual language and no account/API/checkout surface. Root302 forwarding is configured; incoming rootHTTPS still awaits provider activation.
- The legacyWWW CLI edit failed without changing its prior value; use the normal console then require independent readback. A new bounded CNAME replacement/rollback guard passes synthetic local and actual temporary-record checks. Keep FanPass, mail/login/staging records and the original production data/runtime intact. [Identity/mail](production-identity-mail-20260924.md),[public website](public-product-website-20260924.md).

## 2026-09-25 — Protected Google client and actual SES review meaning

- Owner explicitly approves the exact Google hosted OAuth client and protected storage. The client is created, downloaded once, validated against the approved origin/callback and stored mode0600 outside Git; the downloaded copy is removed. Saved scopes are only openid/email/profile. The new project stays Testing, and actual Auth0 readback preserves the old Google connection.
- Root HTTPS now passes actual Chrome redirection and the Node/OpenSSL3 monitor request; earlier LibreSSL failure and plain-Node403 remain dated client observations, not a diagnosis. WWW/private-origin/negative-route proof and the12-target monitor are complete for public information only.
- Owner completes AWS password/MFA renewal; fresh CLI/STS is verified. SES API DENIED does not match a terminal refusal in the actual case text: Support asks for more information and message examples for continued review. Use the accessible ordinary console; do not buy Premium Support just because DescribeCases requires it.
- A factual follow-up is drafted and filled, with no secret or real customer content. Sending it requires explicit message authorization; account setup, simulator success and a draft are not submission or real email delivery. Preserve Free, the working test identities, closed customer access, existing data/recovery and annual-only pricing.
- Source and documentation closeout proceeds separately from external approval. [Identity/mail](production-identity-mail-20260924.md),[public site](public-product-website-20260924.md),[QA](../output/qa/rillora-production-identity-20260924/README.md).

- Validation closeout: private source commitsaf69a6e/f8d1344 are pushed. CI8 passes source,212API and Web/infrastructure36 checks. CI7 exposed two5-second CDK synthesis timeouts; only that test runtime budget changed to20seconds, with assertions unchanged. Documentation-only evidence completion preserves the tested engineering commit; no new product decision or cloud deployment follows.

## 2026-09-25 — Submit the reviewed SES follow-up

- Owner says to proceed immediately after the concrete reply/submission request. Submit the exact prepared message once; the case recordsrillora-operator at01:12:39+08:00 and status“客户操作已完成”. This supersedes the pending-send-authorization gate only; no production-send approval follows.
- A reusable read-only SES check validates the exact AWS account, named Frankfurt identity/configuration, TLS/suppression/events and actual ProductionAccessEnabled. It sends no mail or changes and cannot certify customer flow/inbox acceptance. Seven boundary tests pass; actual14configuration checks pass and production access still fails.
- Keep Free and all current identity/customer activation boundaries. Provider review, Auth0 installation and real verification/recovery remain distinct. No new subscription, scheduled automation, customer email or test-account cleanup. [Submission evidence](../output/qa/rillora-production-identity-20260924/ses-followup-submission.json).

## 2026-09-25 - Release gap review and parallel preparation

- Owner asks what remains before launch. Current source/preflight confirms seven engineering/release gates and two Owner-deferred gates; these are not a completion percentage.
- Under the existing release goal, prepare closed production Web/iOS connections while SES awaits review. Payment implementation and submission materials can proceed independently. This supersedes treating the SES wait as a stop for all release work, without opening customers or clearing test data.
- AWS STS now reports an expired session; the earlier mail result is retained with its actual time. No new login, deployment, transaction or test is claimed. No new product, price, market or Owner-deferred decision. [Current checklist](release-readiness.md).

## 2026-09-25 - Start closed client delivery under the release plan

- Owner explicitly says to start the remaining engineering. Prepare/deploy an independent closed Web client and exact native production connections while retaining the existing backend closure, identity bindings, UI, price and test data.
- A client flag is not authorization: backend private routes remain503 and Auth0 connections remain disabled. Source/compiled values alone cannot pass the final release gate. Native sessions/deletion receipts are origin-isolated while the exact old staging namespace is preserved.
- Actual certificate/DNS/private-origin/HTTP/browser/Simulator/monitor checkpoints pass. Correct the investigation inference about a JPG: its absent WWW URL is not a broken referenced public asset; the full product artifact uses it and now serves it. Build-time route checks prevent future omissions.
- Stripe CLI upgrade and reading official integration references do not constitute production commerce implementation, provider configuration or a charge. No additional product/market/pricing approval or customer activation follows. [Contract](production-clients-20260925.md).

## 2026-09-26 - Prepare ordinary annual commerce without opening sales

- Under the existing release instruction, add a distinct production Stripe boundary,
  named-vault configuration, exact annual quote, separate current purchase consent,
  durable order/idempotency and authoritative provider reconciliation. Test paths
  retain their environment restrictions; no new pricing or commercial approval.
- Correct the Web route to web_direct, add its commerce read-only policy permission,
  retain resumable subscriptions in duplicate-purchase checks and preserve original
  checkout parameters after ambiguous delivery. Verified events use bounded retry;
  browser returns do not grant access and closing sales does not remove management.
- Only the closed Web artifact and return routes are deployed. Local tests and a
  synthetic browser fixture do not prove a live purchase, accepted merchant/tax facts,
  cloud retry operation or final release. Production API/schema/identity stay closed.
- Owner-deferred business/device items remain deferred. Apple session actually expired;
  request only the required本人login while independent closeout continues. SES still
  awaits production access; do not resubmit the already-authorized follow-up.
  [Contract](production-commerce-20260926.md).

## 2026-09-26 - Apple production foundation and individual purchase boundary

- Owner completes Apple management login. Fresh portal readback, not the old session,
  restores actual Rillora access. Official800-point USA CSV confirms88.80absent;
  ask the concrete annual choice without changing Web88.80 or saving an assumption.
- Apple's new default multiseat setting does not match the locked household model.
  Disable it on both unsubmitted products; actual readback shows App Store only,
  multiseat not allowed, monthly still zero territories. Do not enable Family Sharing,
  twelve-month monthly-payment contracts, new regions or submit for review.
- Add separate strict production verification and reviewed signed-price binding
  foundations. Preserve Sandbox and historical records; no production endpoint,
  entitlement, real transaction, signed artifact or release follows from local tests.
  [Contract](production-apple-20260926.md).

## 2026-09-26 - Restore cost-based Apple/Web channel differentiation

- Owner points out the previous channel-price discussion. The agent's later
  nearest88.80-point recommendation lost that purpose; withdraw88.90/88.99/88.00
  and its pending question. Treat the correction as direction to resume differential
  payment-channel pricing, with identical cross-client Family rights.
- Web stays88.80.99.99at effective15%and119.99under standard30%remain the prior
  conditional Apple candidates, not newly approved/saved amounts. Both exist in the
  official CSV. Paid Apps Agreement is active; the SBP enrollment page is not proof
  that15%was approved or effective. No enrollment, price or runtime mutation.
- Correct the live handoff/specs/register before continuing, retain old passages
  only as historical evidence, and do not ask Owner to answer the withdrawn question.
  No new application tests or deployment; retain CI13's dated foundation result.

## 2026-09-26 — Owner selects Web US$88.99/year

- Status: LOCKED. Owner explicitly says“官网定88.99吧”. This supersedes Web88.80
  only; it does not adopt Apple parity or change Family capability-v2.
- Use immutable price-v4/8899cents and a fresh purchase-consent version. Retire old
  v3 for new quotes while preserving its8880amount, subscriptions and receipts.
  New purchases remain annual-only; no monthly-v4 is created.
- Create the exact new annual Price in the isolated Rillora TEST account and archive
  its old88.80Price. Apply additive staging migrations and compatible API/Web;
  update closed production Web only. No live payment, merchant/tax activation,
  production API migration or Apple price change is implied.
- Fix active quote/roadmap drift; preserve dated financial models and earlier
  decisions as history. [Current contract](pricing-88-99-20260926.md),
  [QA](../output/qa/rillora-web-price-88-99-20260926/work-state.json).


## 2026-09-26 — Final-launch long goal and actual SES refusal

- Owner explicitly requests an active long task through launch readiness, autonomous
  decomposition, careful review and maintainable code. Preserve the existing
  product/UI/price/rights/FanPass boundaries and honestly record deferred facts.
  Continue independent engineering across provider waits; evidence, not checklist
  edits, closes release gates. The refreshed full147-file body read is complete.
- Owner completed AWS login. The stale Chrome-tab debugger state was repaired using
  a fresh controlled tab and the same login; fresh STS confirms the exact operator.
  Do not repeat the password/MFA request or blame the extension without evidence.
- AWS's new September26 01:28+08 reply is an actual refusal following the authorized
  supplement, superseding the old information-request-only interpretation. Owner
  asks to check Gmail; both substantive support messages confirm the sequence and
  disclose no specific refusal criterion. Simulator alarm counts do not prove
  reputation harm or denial causality; account-health readback remains normal.
- Evaluate a legitimate alternative transactional sender with the same security,
  suppression and actual delivery requirements. No new message, case reopening,
  vendor purchase, provider switch or customer activation is implied.
  [Release execution](release-readiness.md),[mail facts](production-identity-mail-20260924.md).


## 2026-09-26 — Propose bounded Resend Free account-mail integration

- After the actual SES refusal, Agent prefers the directly supported Resend/Auth0
  path for necessary account messages. Actual pricing isUSD0/3000monthly/100daily/
  3domains; US email/log storage and30-day retention are explicit. No private map
  content, cold invitations, marketing or paid upgrade is included.
- This is a prepared proposal, not Owner account/terms acceptance or production
  installation. Chrome signup is handed off because a new password and current
  binding terms require the Owner. Preserve old identity/test flows and continue
  independent engineering. Actual quota, suppression, TLS, notices, billing limits
  and real delivery must be checked; current Free price is not guaranteed forever.
  [Mail contract](production-identity-mail-20260924.md).

## 2026-09-28 — Prefer existing AWS mail before adding a sender

- Status: PROVISIONAL implementation priority; not an adopted identity migration.
- Owner questions service sprawl, asks about AWS reconsideration and why Auth0
  does not cover verification/reset delivery. Fresh official documentation confirms
  Auth0 owns the workflows but its built-in email provider is test-only; SES is an
  already-supported alternative to Resend.
- Agent supersedes the September26 Resend-first recommendation: retain AWS/Auth0,
  prioritize a concrete SES reconsideration and keep Resend as fallback. Withdraw
  the active Resend signup request for now; do not purchase or configure a provider.
- AWS documents reopening within14days/related cases later, but reconsideration
  does not promise approval. Prepare an accurate unsent draft; no new support
  message or case reopening is authorized merely by this explanatory question.
- Cognito consolidation would require new identity acceptance and still uses SES
  beyond its50/day default. No identity rewrite or production shortcut is adopted.
  [Current mail contract](production-identity-mail-20260924.md).

## 2026-09-28 — Owner authorizes SES reconsideration submission

- Owner explicitly says to apply for AWS reconsideration directly. Submit the
  prepared limited transactional-use explanation on the original case; no repeat
  send permission is needed and no new paid plan or scope is introduced.
- After actual browser MFA, verify correct account and current Frankfurt sandbox,
  submit once, then read back the new correspondence and Reopened status.
  Approval and actual message delivery remain separate release gates.
- Owner also asks about a later Auth0-to-AWS migration and relative price. This is
  a planning question, not permission to change the identity provider. Preserve
  current Auth0 and all account/consent/permission mappings while recording the
  code-based migration boundary and current usage-based comparison.
  [Assessment](auth0-cognito-migration-20260928.md),
  [mail result](production-identity-mail-20260924.md).

## 2026-09-28 — Public landing redesign and complete browser mark

- Owner identifies the simplified favicon and explicitly requests a carefully
  designed public landing with top-right account access and commercial-use motion
  components. This authorizes the public redesign only; keep private App UI intact.
- Owner selects the staging app as the account destination with a visible Preview
  label. Use the real account/invitation routes and sample-data notice; do not
  silently open production identity or commerce. Store routing in one config.
- Withdraw the microfavicon exception. Use all10paths of the approved03SVG and
  content-hashed resources on WWW, staging, production client, legal and Auth0.
  Preserve historical concept boards; add a deterministic exporter.
- Agent selects three coordinated ImageGen section references and standalone
  artwork, then implements real controls using pinned MIT Motion/Radix. Correct
  generated extra slogans, duplicate headers and unshared-title disclosure rather
  than treating image output as product authority. Full notices are shipped.
  [Contract](landing-page-20260928.md).

## 2026-09-28 — Owner requests a continuous, richer landing and signed-in guides

- The first deployed landing is judged too fragmented and sparse. Replace its
  disconnected section treatment with a continuous product narrative, more useful
  demonstrations/content and richer purposeful motion. Retain the approved brand
  and Preview-labelled staging account entry.
- Specific platform-operation guides move behind sign-in. This changes discovery
  and access placement, not their factual content or a new paid entitlement; keep
  contextual guidance for authenticated planners/recipients and preserve return
  context from old guide links. Private App layout is not generally redesigned.
- Owner suggests video as an option. Current Sora environment lacks API credentials;
  do not require new vendor/payment setup to complete the task. Native interactive
  animation or an honestly labeled recording may satisfy the motion direction.
  [Revision scope](landing-page-20260928.md).

## 2026-09-28 — Continuous landing implementation and guide return

- Implement the Owner's second-iteration direction with a continuous paper
  surface, real category/recipient/life-state controls and progressive disclosure.
  Agent-selected new references are implementation targets, not a separate Owner
  approval or a redesign of the private App.
- Keep planned pricing behind Explore plans; read the annual amount from the
  canonical catalog, preserve annual-only new sales and label Preview honestly.
- Old guide links retain known catalog IDs through authentication; public website
  omits guide bodies, native guest Profile omits the directory link. Free guidance
  and authenticated contextual matching remain. This is navigation placement,
  not secrecy of provider instructions or a newly purchased capability.
- Use a16-second opt-in interactive walkthrough with pause/stop and a separate
  real browser recording for review. No Sora API purchase/key or artificial
  account data is introduced. [Contract](landing-page-20260928.md).

## 2026-09-28 — Owner corrects website purpose, navigation and notices

- Centre the full approved mark on the actual folio cover; use proportional
  positioning rather than a fixed-size mark drifting with image layout.
- Website follows system appearance, with the earlier ink-green dark palette.
  Keep one shared token system and matching imagery; no preference storage needed.
- Remove the timed walkthrough and serial chapter/stage numbering. Keep purposeful
  recipient/category/disclosure feedback, with separate top-navigation pages.
- Place full third-party notices under legal information, linked from the Terms
  publication shell. They are acknowledgements, not extra user acceptance or
  amendments to the accepted service terms. Raw Credits leaves the homepage footer.
- Stripe/Privy are navigation/content references only. No new package, metric,
  endorsement, provider permission or paid feature is inferred from those sites.
  [Current contract](landing-page-20260928.md).


## 2026-09-29 — Home and far-right appearance control

- Owner requests manual light/dark switching, retains the earlier system default,
  and adds Home. Latest placement is explicitly to the right of Sign in, near the
  far-right edge, including mobile. Do not hide it in the mobile menu.
- Agent implements System/Light/Dark with one optional on-device value. System
  clears it; unavailable storage still permits the current-page selection. This
  supersedes the previous system-only/no-storage website rule, not the App theme.
- A dated display-preference notice appears in WWW legal information and the
  existing Privacy/Cookie publication shell. Accepted legal bodies and account
  consent versions stay unchanged. The publication guard permits this one named
  functional preference only; no analytics, cookies or private API are introduced.
- Owner's Free export question remains a request for advice. Recommend preserving
  the existing basic export/backup/exit baseline; no paid gate, changed entitlement
  or new paid archive/report promise is adopted. Offline copying is not an extra
  live contact relationship. [Focused contract](website-appearance-controls-20260929.md).


## 2026-09-29 — Owner selects website visual for native public Home

- After clarifying why the Simulator still showed the old homepage, Owner explicitly
  selects adopting the new website visual in the native App homepage. This replaces
  the old keep-native-public-composition rule for the signed-out Overview only.
- Implement with native SwiftUI, the selected paper/ink-green hero assets, full03
  mark, concise real actions and labeled local sharing examples. Preserve the
  authenticated workspace, existing tabs, guides/privacy rules and all data.
- A homepage appearance preference follows System by default; explicit Light/Dark
  is remembered locally and System removes it. Existing private screens remain
  Graphite. This is neither a WebView shell nor an App Store/production release.
  [Native Home contract](native-home-20260929.md).

## 2026-09-29 — App-wide appearance and evidence-based UI/UX repair

- Owner reports the Profile dark-mode jump and requests careful full Web/iOS audit;
  explicitly chooses Web workspace System/Light/Dark too. This supersedes both the
  native Home-only exception and fixed-dark private Web scope. Keep established
  layout,03brand, permissions, annual prices and real data.
- Use one native migrated preference and the existing Web store/shared chooser.
  Carry only a strict display enum between fixed public/App origins; no account
  identifier, tracker or remote preference service. Disclose both surfaces without
  revising the accepted legal bodies or creating another consent step.
- Repair current observed task recovery, contrast, disabled feedback, audience
  wording, persistent return controls, target sizes and network messages. Use a
  transparent derivative of existing artwork; no new visual direction or library.
- Authenticated journey evidence is isolated synthetic data. Current tests,
  Simulator install and Preview/WWW/legal publication are separate from live
  identity, mail, paid transactions and App Store release. [Audit](ui-ux-audit-20260929.md).

## 2026-09-29 — Owner authorizes SES clarification submission

- After reviewing the refusal and the prepared three-question draft, Owner explicitly
  instructs direct sending. This supersedes the earlier read-only/unsent scope.
- Submit once to the original AWS Support case179022088800001 using the supported
  console correspondence channel; preserve the existing contact and avoid a new
  case or reply to the no-reply address. No provider, paid plan or customer access
  change is approved by this communication.
- Submission/readback at22:31:40+08 and Reopened are confirmed; SES approval remains
  absent. [Mail record](production-identity-mail-20260924.md).

## 2026-09-29–30 — Apple review context and Small Business enrollment

- Owner prioritizes Apple-related release work. Agent reuses the current strict
  production lifecycle with an explicit, separately configured Sandbox review
  context and expiring enrolled accounts. This adds no public paid plan, test
  authentication bypass, real charge or change to the Free/Family contract.
- Native environment comes from verified AppTransaction.shared. PurchaseIntent
  routes through the existing sign-in/consent/account flow; receiving an intent
  is not permission to buy. Keep new sales annual-only and historical restore.
- Owner confirms no associated developer accounts and prior-year aggregate App
  Store proceeds no more thanUS$1million; separately confirms the final accuracy
  attestation and submission. Submit one Small Business Program application.
  Apple's acknowledgement proves submission only;15%approval/effectiveness staysopen.
- Signed archive/export and draft website/support metadata are allowed release
  preparation. Customer accessNO and the actual TestFlight no-build state remain;
  do not upload a closed/untestable artifact as a ready release. Apple rejects
  Streamlined Purchasing disable until an approved PurchaseIntent binary exists.
- No final Apple99.99/119.99price is adopted; annualUSA68/CAD99 readback stays an
  existing test catalog fact. [Current Apple contract](apple-review-validation-20260929.md).

## 2026-09-30 — Owner requests a saved cross-chat checkpoint

- Save all current work and make the next chat able to continue without omissions.
  This is a handoff request, not a new product decision, price approval or launch.
- Preserve existing authorizations and the single next step in the current handoff.
  Keep source/docs in the private repository and raw evidence/distribution artifacts
  in their existing local locations; credentials stay protected and uncommitted.
- Do not repeat tests, provider applications, deployments or authentication simply
  because the conversation changes. A new workflow still follows the repository's
  complete Markdown reading protocol. [Resume entry](chat-resume-20260930.md).

## 2026-09-30 — Independent prelaunch work, restricted review and bounded controls

- Owner explicitly asks to finish work outside their participation/confirmation and
  the existing AWS reply wait. Continue those preparations under standing authority;
  park actual legal/login/provider ceremonies rather than asking for repeated blanket
  approval. Preserve UI,pricing,real data,history andFanPass.
- Agent chooses an expiring exact-identity Action/API allowlist on the existing tenant
  and separate production service credentials. CLI create:connections is unavailable;
  reuse the existing database connection without changing Preview options. This does
  not adopt a new identity provider,paid plan or public customer activation.
- Use genuine signed auth_time for the existing recent-authentication requirement.
  Ten minutes is the bounded action window; token iat is insufficient. Keep editors
  and sessions during verification,bind the same account and never auto-retry a
  sensitive mutation. Reductions,pausing and revocation stay immediately available.
- Implement published retention windows as a bounded worker with independent legal/
  security hold reasons and privacy-journal replay. Pin manual-snapshot retirement
  to the one known resource and its actual90day deadline; no inactivity-based private
  map deletion or broad backup purge is introduced.
- Restore commerce only from fresh current provider evidence with source freeze,
  clone/journal/ownership gates. Legacy or unproven markers cannot reopen traffic;
  authentic API observations are not described as verified webhooks.
- Keep store artifacts/drafts separate from actual upload/declarations/TestFlight.
  Direct JPEG screenshots preserve the app UI while meeting the no-alpha requirement.
  No final Apple price,SBP approval,SES approval or merchant fact is inferred.
  [Focused contract](release-engineering-20260930.md).

## 2026-09-30 — Owner requests designed App Store presentation

- Owner explicitly rejects bare screenshots as sufficiently designed store imagery.
  Treat the existing captures as source/evidence and create a real marketing sequence.
- Agent uses the selected paper/forest identity,full03logo,licensed serif/sans type,
  actual UI in device frames and one magnified existing disclosure control. No app UI,
  price,real record or new feature/security/financial claim changes.
- Four iPhone and two separately composed iPad assets are rendered as an editable
  first set. This does not assert Owner's final visual approval or authorize an upload.
  [Current contract](app-store-presentation-20260930.md).

## 2026-09-30 — Dot review修复取代独立工程已完成的判断

- Status: LOCKED
- Owner指出Dot审阅出现大量问题，重申可维护代码要求；此反馈是当前发布目标的纠正。
- 报告只作为待核实证据，不把第三方建议当作Owner指令。确认的权限、账户一致性、并发和调用合同问题必须修复并补触发原问题的验证。
- 撤回旧独立工程完成判断，保留原部署／测试的具体历史事实。设计、定价、真实数据和FanPass保持。
- [修复合同](code-review-repair-20260930.md)与[当前交接](handoff.md)管理该质量门。

## 2026-09-30 — Owner要求所有Rillora工作进入Git，支持Dot协作

- Status: LOCKED scope; implementation choices recorded below.
- Owner明确：“把所有rillora的工作都推到git上，我可能会使用dot协作，注意是所有”。该要求取代September23仅源码／规范、raw output全部本地保留的策略。
- 在现有私有Rillora仓库保存代码、文档、设计源稿、发布候选、QA原件及历史；不改仓库可见性、不新建仓库、不重写历史，也不碰FanPass。
- Agent采用可读脱敏副本＋逐文件目录＋age加密原件／Git LFS。实际凭据、真实数据库备份、整机诊断及可重建缓存按明确规则排除；密钥仅在本机受保护位置，Dot普通源码协作不需要密钥。
- 旧Web与法律站Git历史经扫描后使用独立archive tags保留；本地内部检查点只提取项目源码，不发布夹带缓存／秘密的完整内部对象。
- 连续写入的旧QA日志须先冻结再归档；保留原服务和原件。归档清单、原始对象、密文、远端对象与CI分别验证；保存成功不等于修复部署或正式上线。[完整合同](source-control.md)。
- 最后对受保护目录做元数据核对，识别出305个旧客户端构建文件／包。它们是非凭据工作产物，按精确路径白名单补充密文保存；不是导出凭据库，也不生成可读个人法律身份副本。最终范围见snapshot.json。

## 2026-10-01 — Owner adopts Resend; SES-first direction superseded

- Status: LOCKED provider choice; actual acceptance boundaries retained.
- Owner explicitly says to use Resend after registering and installing its plugin,
  then confirms local CLI credentials are configured. This supersedes September28
  SES-first/reconsideration priority without migrating Auth0 or purchasing a plan.
- Reuse GoDaddy's installed official CLI and its refreshable grant; add exactly the
  four domain records while preserving root Zoho and every prior record. Retain old
  SES resources/case without duplicate applications or support messages.
- Use the retained tenant's native Resend provider and a dedicated domain-restricted
  sending key, protected in Keychain/provider storage. Keep operator credentials
  separate; enforce TLS and leave tracking/receiving disabled. Provider configuration
  is tenant-wide and therefore also changes Preview's delivery transport.
- Two official simulator sends establish direct and Auth0-generated mail transport.
  Only a uniquely tagged temporary identity is removed; no link is followed or real
  user marked verified. Free limits and disabled pay-as-you-go are read back; three
  additional official failure simulations verify bounced/complained/suppressed event
  visibility. Real-user acceptance and launch gates remain open. Preserve US message/log processing facts and current legal
  versions; no assertion of final legal compliance is made.
- No runtime UI, pricing, real data, FanPass, public customer access or Apple release
  state changes. [Current sender contract](transaction-mail-resend-20261001.md).

## 2026-10-01 — Owner prioritizes release packages1/2/3 and confirms real A/B participants

- Owner explicitly requests the first three remaining packages and confirms reuse
  of the previous two controlled mailboxes for planner/recipient acceptance.
- Preserve those existing verified provider identities and their data; do not create
  duplicates or falsify verification/consent. Their exact subjects remain protected.
- Agent uses the existing expiring review boundary for these two participants plus
  the original reviewer. Match Auth0 and API lists, cap at8 unique exact identities,
  retain the original expiry,legal Form/versions and other client bindings.
- Build restricted-review clients separately and require explicit Web deployment
  selection; ordinary public customers and live billing remain closed. An enabled
  client entry does not prove a completed user journey or authorize public release.
- Existing unchanged tests are retained. New configuration/guard checks and actual
  cloud/provider/user outcomes are recorded separately in[the execution contract](release-123-20261001.md).

## 2026-10-02 — Actual acceptance corrects duplicate-signup and notification assumptions

- Owner says the apparent QQ login failure was accidental signup and requests clear
  existing-account guidance. Use supported Auth0 text keys; retain conditional generic
  validation wording, anti-enumeration controls and existing account mappings.
- Preserve Owner's missing-inbox report despite provider delivered/SMTP250 evidence.
  The single assisted invitation email and direct-link acceptance are separate facts;
  neither implies automatic in-app email delivery or successful inbox placement.
- Actual Apple TEST delivery failed because certificate-status requests timed out in
  HTTPS-only egress. Agent allows TCP80 only within Apple17/8 on the two review-mode
  groups, retains online cryptographic checks, and maps actual retryable verifier
  exceptions to503 without accepting unverified input. Fresh official TEST SUCCESS
  follows deployment; no purchase, entitlement or public release is inferred.
- Keep the original review expiry, source/UI/pricing/data boundaries, and distinguish
  later session expiry from completed rollout. [Execution contract](release-123-20261001.md).

## 2026-10-02 — Owner reaffirms physical-device deferral during Sandbox preparation

- Owner explicitly chooses to keep real-device steps deferred after the prepared
  build and actual locked-device read were explained. Do not install or operate on
  the phone, or infer that pairing authorizes resuming deferred acceptance.
- Continue the already authorized backend/enrollment, account recovery and evidence
  work. Owner completed the actual AWS MFA; this is renewed access, not a deployment
  or purchase result. Preserve the original review expiry and test-only boundaries.

## 2026-10-02 — Complete independent preparation before returning personal gates

- Owner explicitly asks to do all work not requiring their participation. This
  supersedes waiting on the fresh simulator Account terms as the sole executable
  task; actual consent, deferred devices/merchant facts and final declarations are
  not silently waived or repeatedly requested.
- Agent prepares a separate1.0(2) distribution from unchanged native source with
  build-only version/account-entry overrides. Upload is restricted to internal
  TestFlight. This establishes the distribution path before later personal device
  acceptance, without asserting purchase success or making an untested external
  release available. Original server allowlist/expiry and closed live billing stay.
- Use the existing six designed store images in the reversible unsubmitted draft;
  save existing public beta support information and accurate test instructions.
  This is Agent execution under current scope, not invented Owner visual approval,
  final declaration or review submission. [Evidence](independent-release-closeout-20261002.md).


## 2026-10-02 — Strict whole-project review supersedes the parked release next step

- Status: LOCKED
- Scope: Current engineering workflow only.
- Owner requests every project code file reviewed very carefully and problems repaired directly.
- Continue code/correctness/security-boundary work under existing authorization; preserve current UI, price decisions, real data and FanPass. Personal consent, physical-device and merchant deferrals are not reopened.
- Full Markdown reading, file-level review coverage, reproduced defects, fixes, tests and deployment remain distinct evidence. Initial repairs do not close the whole review or launch.
- Evidence: [current review contract](code-review-20261002.md).

## 2026-10-03 — Strict-review safety and preservation choices

- Existing Owner authority covers28confirmed correctness/toolchain fixes; no new
  UI direction, price, legal consent, billing activation or real-data decision.
- Preserve all91applied migration bytes; implement permission-history and retention
  serialization as0092/0093. Ambiguous legacy accepted-sharing history requires
  quarantined reconciliation instead of inventing intermediate restriction evidence.
- Bound uncertain ECS retries by exact request/token and fresh isolation/freeze
  checks. Fixture mutation targets must be explicitly disposable/local, and native
  matrix cleanup may affect only per-run created simulators.
- Keep the CDK bundled advisory visible: latest upstream still contains it. Do not
  substitute an ineffective update, suppressed audit or bespoke postinstall rewrite
  for a genuine upstream fix. Direct source review is not the failed optional scan.
- Save current source/tests/contracts and all eligible QA/build artifacts on the
  strict-review branch under the standing all-work Git policy. Production rollout
  remains separate from code review, CI and encrypted-original preservation.
  [Full evidence and limits](code-review-20261002.md).

## 2026-10-03 — Owner selects reviewed rollout and the new native candidate

- Owner explicitly selects remaining packages1and2. Existing project authorization
  applies to restricted deployment, new signed artifact/upload and bounded checks;
  personal declarations, physical-device/merchant deferrals and public/live activation
  remain distinct. Preserve identities, original review expiry, UI, prices and FanPass.
- Agent uses a bounded0task maintenance window for0092/0093 so old/new permission
  logic cannot overlap, then restores1healthy task. No data/network/key/secret resource
  replacement or permission expansion is introduced; only expected image/count changes.
- Build3has normal upload eligibility and no testers. Source/third-party/linked-framework
  evidence supports Apple's OS-only encryption option. The final formal declaration
  still awaits Owner action-time confirmation under the browser rule; no silent Save.
- Existing full suites/CI47 are retained; actual new deployment/artifact evidence has
  its own date. [Execution and proof](review-rollout-20261003.md).

## 2026-10-03 — Owner confirms the specific native3OS-only encryption declaration

- Owner explicitly confirms提交这份声明 for the prepared1.0(3)option excluding
  proprietary and non-OS standard algorithms. The technical basis is the current
  CryptoKit/Security/HTTPS implementation and linked dependency inventory.
- Save completed and Apple's build list now shows准备提交. This is the specific
  App Store Connect documentation declaration, not a blanket legal clearance or
  a statement that Rillora has no encryption. No other personal/store declaration
  or market/price decision is implied.
- Record the same non-exempt-encryption=false Info.plist metadata for future builds;
  all other plist values and runtime cryptography stay unchanged. Reassess if the
  crypto/dependency basis changes. Existing build3uses the saved portal record and
  is not rebuilt/re-uploaded. No tester invite, review submission or physical use.

## 2026-10-04 — Owner resumes real two-platform core acceptance

- Owner explicitly selects the remaining real Web/native core journeys after the
  completed deployment/build packages. Continue existing controlled identities and
  synthetic test content, restoring authentication only on actual signed-out state.
- Preserve existing completed mail/reset/invitation evidence and the original review
  identity/expiry restriction. Physical-device purchase and merchant deferrals remain.
- Update the older installed simulator app to reviewed-source Release for acceptance,
  preserving data/Keychain. It is not another store upload or physical-device result.
- Account deletion must use a deliberately disposable identity, never the Owner's
  Gmail/QQ records. Personal terms and any irreversible final UI action retain their
  action-time rules. [Current evidence](real-core-acceptance-20261004.md).


## 2026-10-04 — Bounded disposable acceptance and observed native export repair

- Preserve the original three review identities and expiry. Add exactly one isolated,
  unverified disposable identity for actual delete acceptance, then restore the three;
  no new connection binding, false verification/consent, public access or live billing.
- Fix the observed native competing-alert defect under existing direct-repair authority.
  Preserve draft state only for the exact recent-auth error and require explicit retry.
  No new product/price/crypto decision is introduced. Focused red/green and actual
  saved-file-to-Web-decrypt evidence support the fix; build3predates it and a new
  signed candidate is needed. [Current acceptance](real-core-acceptance-20261004.md).


## 2026-10-05 — Owner confirms disposable Web terms and actual SSO choice is repaired

- Owner explicitly says确认，继续工作 in reply to the pending isolated-account Web
  terms confirmation. Proceed with that exact identity/terms; the irreversible final
  deletion still has its separate action-time rule.
- Actual ordinary sign-in reused the old QQ SSO identity before any import/delete.
  Under existing direct-repair authority, request the already-supported account
  selection option from intentional Account signin/signup. Preserve active Rillora
  sessions, layout, legal versions, provider settings and all data; no tenant-wide
  SSO disablement or public access expansion. Verify the real deployed choice.


## 2026-10-05 — Owner retains the isolated account and defers actual deletion

- At the prepared final account-deletion dialog, Owner explicitly chooses保留，暂不删除.
  Keep that Auth0 identity and its1synthetic matter/1person/1role. No deletion request
  or provider user deletion is submitted. This supersedes executing the prepared purge.
- Agent cancels the final dialog, clears the confirmation, verifies retained data and
  ends the test session. Restore the original three expiring review identities as
  bounded test cleanup; this is reversible access restriction, not account deletion.
  Runtime13and Auth0 readbacks match the original set/expiry, with one healthy task
  and unchanged application image, roles, network and secret references.
- Actual import and Web recent-auth retry are verified. Deletion remains unverified
  and Owner-deferred, alongside the existing physical-device/merchant deferrals.
  Do not automatically reopen any of those decisions or call the complete launch ready.

## 2026-10-05 — Chinese UI explicitly includes native iOS

- Status: LOCKED
- Scope: Owner-requested Chinese interface includes the shipping native SwiftUI app.
- Evidence: Owner明确「不只是做web哦，ios也要做」。
- Decision: preserve English and add Simplified Chinese with Apple String Catalogs,
standard system/per-app language selection and shared Web/native terminology.
- Supersedes: treating a Web-only localization delivery as completing this request.
- Does not imply: translation of operative legal texts/provider-controlled content,
market/price changes, compilation, deployment, store upload or public release.
- Implementation: [native contract](native-localization-20261005.md); isolated source
branch, static checks and explicit Mac acceptance gate.

## 2026-10-05 — Maintainable Chinese Web interface

- Owner explicitly requests a Chinese interface, direct implementation and Git push, with maintainable code.
- Implement Simplified Chinese plus English for Web/app and public website on 2cc95f77, using central semantic catalogs/context, browser preference, explicit choice handoff and Intl formatting. Future Traditional Chinese can be a separate catalog; none is claimed now.
- Preserve English operative legal content/digests, provider/hosted-auth/transaction-mail/native scopes, user data, API/permission enums, markets and actual currency/amount. Locale is presentation only.
- Implementation/local testing and Git/CI readback are distinct from rendered acceptance and deployment. Browser sockets/cloud preview are blocked; no actual responsive/keyboard screenshot pass or production release is claimed.
- [Contract](web-localization-20261005.md), [QA](qa/chinese-web-20261005/README.md).

## 2026-10-05 — 保存 AI/MCP 接口预留方案，实施仍为提案

- Status: LOCKED（本轮文档与 Git 交付范围）；技术分期与接口设计为 PROVISIONAL。
- Scope: 未来用户通过 AI 使用 Rillora 的接口准备与工程交接。
- Decision: Owner 提出需预留 AI 接口，并明确要求“整理好也推到git去”。保存[AI/MCP 计划](architecture/ai-mcp-plan-20261005.md)，将版本化领域 API、MCP 适配与公开目录分开；不新增当前首发阻塞项。
- Evidence: 本轮 Owner 的两条直接请求；当前官方资料及 strict-review 源码映射记录在计划中。
- Supersedes: 无；不取代已锁定的地图/密码边界、共享权限、加密、当前真实核心验收或发布门。
- Does not imply: 技术方案已经实现、MCP 已部署、AI 数据披露已获用户同意、公开目录审核通过，或允许创建凭据/配置身份/提交发布。
- Implementation impact: 后续按计划 C0–C6 独立接手；建议先规划者只读、再独立草稿与可信确认写入。实际实现前重新核对授权、源码和平台规则。

## 2026-10-05 — Follow Dot branches without reopening superseded personal gates

- Owner asks to follow GitHub progress. Consolidate the four dated Dot tips on a new
integration branch based on03c97fc; retain the latest account-choice/export repairs,
Owner keep-account decision and original-three cleanup evidence.
- Resolve current documentation by preserving both additive decision/journey records
and archiving branch-specific handoffs. No old pending deletion step regains authority.
- Apply narrow reproduced focus/status/date/email fixes and Notes disclosure clarity
under standing repair authorization; no new permission level, pricing, layout direction
or legal consent. Optional AI/MCP/Events remains PROPOSAL, with no runtime work.
- Source integration/local tests are distinct from restricted deployment/store upload.
[Scope and evidence](qa/dot-followup-20261005/README.md).


## 2026-10-05 — Owner requests careful Chinese product copy

- Owner explicitly asks to scrutinize Chinese wording during Dot integration. Review
both actual Web and native catalogs in full,not only translation completeness.
- Agent adopts plain你voice,shared terminology,clear action/status copy and explicit
Notes/key/copy/legal boundaries. Export instructions are distinct from quick start.
Separate native Contact name from matterNamewhile keeping its English displayName.
- No new price,entitlement,legal text,market,provider or user-data decision. Exact copy
is an Agent editorial choice under this scope,not claimed individual Owner approval.
[Copy contract and coverage](chinese-copy-guidelines-20261005.md).

## 2026-10-05 — Owner selects packages1/2 and prioritizes Stripe Web

- Complete bilingual/remaining UX acceptance and corresponding restricted rollout/new
nativecandidate. Payment acceptance priority is StripeWebbeforeApplephysicaltransactions.
- Preserve prior actual StripeTESTresults at their old price and fixture scope;do not
mislabel them current88.99signed-inbrowser orlivecharge acceptance.
- Default project authorization continues. Physicalphone/account-deletion/merchant fact
choices are not silently reopened;provider authentication only on observed expiry.
[Execution contract](release-12-stripe-20261005.md).

## 2026-10-06 — Rillora-only TEST CLI approval and current-price acceptance

- Owner explicitly completed the new Rillora CLI device authorization after the earlier
code expired. Scope is only the existing Rillora account/testmode; no FanPass/live grant.
Reusing this valid credential needs no repeated login request. Existing restricted TEST
key was reused without new permission or key creation.
- Current88.99hosted browser/TEST lifecycle is executed under the selected payment scope.
Synthetic cookie identity/consent is labelled; human consent, live money, cloud live
callbacks and a complete accounting ledger are not inferred from it.
- Agent fixes observed native AX5 label/scroll issues within standing repair scope and
uses only task-created simulators for actual OS-language acceptance. No new UI direction,
price, sharing permission or data policy. Existing deletion/phone/merchant deferrals remain.
- New1.0(5) retains the previously approved OS-only declaration because cryptography has
not changed. Upload is authorized distribution preparation, not App Review or public release.

## 2026-10-06 — Owner resumes physical-device and configuration work

- Owner explicitly requests starting physical-device acceptance and release configuration,
then reconnects/unlocks the previously paired phone and chooses direct on-phone operation.
This supersedes the physical-device deferral. Do not take over iPhone Mirroring.
- Resume investigating and preparing Apple/Stripe configuration, using truthful existing
facts. The request supplies no missing merchant/tax/banking values and is not a final
legal attestation, live-charge completion or permission to fabricate them.
- Retain the explicit keep-account decision; no irreversible QA-account deletion.
Reuse processed build5/current deployments and completed TEST evidence. Send a TestFlight
invitation only after the specific recipient/action is explicitly authorized.
[Current scope](device-config-20261006.md).

## 2026-10-06 — Final Apple price, scoped invitations and Stripe activation

- Owner reiterates that68was rejected, then explicitly selects Apple USA USD119.99/year.
Web USD88.99 and annual-only Family-v2 remain. Retire68for new review quotes; retain
historical immutable amounts/receipts. Synchronize actual Apple price and versioned
server binding before any next Sandbox purchase. SBP15%is not inferred from this price.
- Owner explicitly authorizes invitations to the three named inboxes, clarifies the
existing Apple holder address, then defers the two external invitations at their contact
step. The internal holder invite/install continues; no App Store Connect roles granted.
- Owner explicitly approves reusing X identity/bank details for Rillora, and personally
submits Stripe's final account/terms form. Shared legal-entity website edits are cancelled
after Stripe warns they affect linked accounts. Only Rillora account-level descriptor/
product/support-display settings are changed; FanPass is preserved.
- Fix the observed missing-app-receipt recovery under standing repair authority. Explicit
Restore may refresh AppTransaction and prompt Apple authentication; startup stays silent,
only verified production/sandbox environments are accepted, and account-generation guards
remain. Tests/builds are not a completed physical purchase/restore claim.


## 2026-10-06 — Rillora Live access and backend credential approval

- Owner completed the prepared Rillora-only Live plugin authorization. Actual connector
readback includes the same Rillora account in both TEST and Live; no FanPass grant.
- Owner then explicitly approved the separate production billing runtime key with only
Customers/Checkout Sessions/Customer Portal write and9specified verification reads,
and protected local/AWS Secrets Manager storage. This authorizes the concrete key,
not arbitrary financial operations or broader permissions. Stripe additionally requires
an emailed identity-verification link; that provider step is pending, not a new permission request.
- No sales-tax registration or reviewed-no-collection policy is approved by the Owner's
question about identity numbers. A missing Stripe Tax registration is not itself proof
that registration is required, or that no collection is needed. Use actual market facts.


## 2026-10-06 — Owner switches phone acceptance to Mirroring

Owner now explicitly asks Agent to inspect through iPhone Mirroring, superseding the
earlier direct-phone-only preference for this acceptance. Observe/control the existing
app; do not change the main Apple/media account or unrelated phone settings. Owner
personally completes the actual Apple password prompt. Verified Sandbox identification
is observed afterward; history sync failure remains a separate unresolved result.

## 2026-10-06 — Explicit currency and consistent Apple checkout quote

Owner confirms the Sandbox purchase succeeded, then explicitly requests currency
prefixes and agreement between the in-app quote and Apple's final payment sheet.
The observed app quote was AUD199.99; signed server evidence confirms the purchase
was HKG/HKD888.00. Preserve the authoritative receipt and active test subscription.
The old AUD preflight is already closed/canceled by reconciliation, not rewritten.
Fix price/consent presentation and the launch-time freshness gap around cached
StoreKit products; reuse the existing storefront-change mechanism rather than
creating another payment flow. No new price decision or live charge is authorized.

## 2026-10-07 — Owner simplifies the Apple purchase page

- Owner explicitly rejects visible Large text test controls and an extra subscription
checkbox. Present the real Family differences, explicit currency/full annual amount and
one purchase button. Keep concise renewal/cancellation disclosure and policy links by
the button; Apple owns final payment confirmation. Restore remains a secondary action.
- This supersedes the earlier native unchecked-toggle presentation. The explicit button
tap accepts its captured, displayed quote; loading a page does not record consent. The
existing semantic acceptance contract and legal document versions are unchanged. Account
registration clickwrap is separate and unchanged; no checkbox is silently preselected.
- Build7 is already uploaded/processed but is not distributed. Hold it and prepare build8
with this requested flow. Preserve the verified HKD888 Sandbox subscription; no repeat
purchase or account reset is needed for the layout fix.

## 2026-10-07 — Owner requests cloud UX repairs and visible account identity

Owner explicitly requests fixes to the native guide flash, redundant source links and guide acknowledgement; removes passive safety cards; moves licenses and language/appearance into secondary settings; limits visible session actions to current logout; distinguishes matter categories from optional recipient review. Home suggests concrete organization, not blanket review. This supersedes conflicting older UI placement requirements, not backend permissions, legal consent or raw status values.

Both clients must show the current authenticated account. Use server-selected identity and transient verified email, never inferred email or stale cross-account content. Native password reset uses the existing public Auth0 database flow with explicit user submission. No provider/grant configuration, actual email, MFA/passkey enrollment or production deployment occurs. Unsupported account-security management is not represented by fake controls.

Source and validation documentation are approved for isolated Git branches in tantalum666/rillora; no main merge or deployment. Preserve shared identity8cc5e100 and operator08afb382 purchase changes. Current cloud checks do not establish an Xcode build. See [native contract](native-ux-refinement-20261006.md).

## 2026-10-07 — Owner authorizes reviewing, fixing and merging Dot delivery

Owner explicitly asks to read the latest GitHub work, merge if sound and directly fix
issues first. This supersedes the prior separate-cloud-branches/no-merge instruction
for the three delivered identity/Web/native branches. Review against the latest active
operator baseline, retain build8/prices/real data, and use necessary local validation.
No provider settings, actual password reset mail, purchase, review-window extension or
public release follows from a code merge. [Current scope](dot-integration-20261007.md).

## 2026-10-07 — Owner authorizes deployment and the next release step

- Status: LOCKED
- Scope: deploy the reviewed Dot merge and continue release preparation.
- Decision: Owner explicitly says “开始部署和下一步”; this supersedes the prior review-only
  no-deployment boundary. Reuse exact-source validation and current credentials.
- Implementation choice: Agent announced a bounded extension for the same three review
  identities and existing planner Sandbox qualification to2026-10-08T20:00:00Z, under
  retained release authorization. This timestamp is an Agent operational choice, not
  a new Owner pricing/market/legal decision. No additional identity or security scope.
- Does not imply: ordinary customer/Live sales activation, repeat purchase, deferred
  account deletion/external invitations, invented business facts or App Review success.
- Evidence: [reviewed deployment](dot-rollout-20261007.md), provider readbacks and signed9.

## 2026-10-07 — Owner rejects the actual build9 plan/restore result

Owner confirms1.0(9)and original matters on the phone, then reports the benefits/price are
still absent and Restore opens Settings again. Treat this as failed actual acceptance and
fix the subscriber/unavailable-quote branch; the approved simple plan page applies to the
whole real flow, not just a nil-subscription preview. Existing subscribers keep the same
benefits/current catalog view and an appropriate management action under the existing
one-renewal-provider rule. No duplicate purchase or relaxed server verification follows.
Owner explicitly chooses to operate the phone directly for this turn, superseding the
prior mirroring preference for this acceptance. Provider build selection/installation,
local correction/tests and actual restoration remain separate evidence.

## 2026-10-08 — Owner chooses direct iPhone iteration and pauses incremental TestFlight distribution

- Status: LOCKED
- Scope: current native fixes and acceptance delivery.
- Decision: continue resolving issues, install directly on Owner's phone, and batch
  changes before a later TestFlight release. Prefer the already paired wireless path
  when reachable; a cable is not inherently required for every install.
- Supersedes: the previous per-fix TestFlight upload/distribution next step. Previously
  uploaded/distributed builds remain dated evidence; do not revoke or re-upload them.
- Does not imply: phone/account resets, data deletion, purchase bypass, new billing
  activation, new store pricing, new testers or public release.
- Implementation: local development export from the retained matching Release archive,
  exact-device signing check, in-place com.rillora.ios installation and actual readback.

## 2026-10-08 — Direct installation can use either a cable or Wi-Fi

- Status: LOCKED
- Scope: connection method for the current direct-device iteration.
- Decision: Owner clarifies that wireless is not required; a cable is appropriate when
  more convenient. Choose the available, reliable method without resetting the device.
- Supersedes: treating the earlier wireless question as a requirement or a fixed priority.
- Does not imply: resuming incremental TestFlight distribution or changing phone accounts.

## 2026-10-08 — Refine the native Matters category presentation

- Status: LOCKED
- Scope: Owner rejects the crowded category block in the supplied physical-device screenshot.
- Decision: improve that native category UI within the current product/brand and direct-install workflow.
- Agent implementation choice: a single horizontally scrollable row, one soft selected background,
  unchanged categories/search,44pt targets and selected accessibility traits. This is a reversible
  scoped implementation, not Owner approval of a new global visual system.
- Does not imply: changing category meaning, stored matters, plan prices, billing or TestFlight policy.

## 2026-10-08 — Follow up Dot work and execute the legal hostname cutover

- Status: LOCKED
- Scope: review, directly fix and merge the newly delivered Dot branches; complete the legal hosting continuation.
- Decision: after Agent identified the documented DNS deferral, Owner explicitly states “不是暂缓，是由你来执行”.
  Agent now executes the Rillora legal CNAME step using existing GoDaddy/Cloudflare access, preserving content and TTL.
- Supersedes: the earlier hosting handoff's pause on the Mac/GoDaddy step. No renewed approval is needed for this
  concrete cutover; only actual provider-required authentication or higher-priority tool conditions can require Owner.
- Boundaries: no mail/other-host DNS change, secret export, repeat same-version deployment, TestFlight distribution,
  account deletion, live billing activation or FanPass operation. DNS application and actual TLS/page acceptance remain distinct.


## 2026-10-09 — Owner requires actual Web delivery and then Stripe diagnosis

- Status: LOCKED within the existing release scope.
- Owner disputes the live www navigation and asks to check app.staging, then explicitly queues Gmail Stripe webhook diagnosis and Web checkout after current work.
- Continue actual rollout/verification under retained authorization. A merge, old loopback TEST, or provider setup cannot replace live-file/UI/cloud-callback evidence.
- Agent operational choices: apply only pending Preview migrations, retain the approved pinned CA bytes for reproducible images, retain nonlocal signed TEST events as needs_mapping, cancel the exact obsolete TEST monthly subscription and close its expired/unpaid reservation, then grant only the already observed Preview owner48hours of TEST checkout.
- These choices do not change USD88.99/Apple119.99, historical paid records, ordinary/live billing, market eligibility, user consent, production review expiry, TestFlight pause or FanPass. Preview login is handed back only after actual401.
- Evidence: [Web deployment](web-rollout-20261009.md) and [Stripe repair/remaining acceptance](stripe-webhook-20261009.md).


## 2026-10-09 — Owner directs Live configuration without waiting for BR completion

- Status: LOCKED within Rillora configuration/release preparation.
- Owner explicitly says the registration is not urgent, refers to the one-month-after-commencement rule, and instructs Agent to configure directly.
- Supersedes: treating completed BR or an unanswered general business-information question as a blocker to all further technical configuration.
- Official IRD supports the stated timeframe for sole proprietorship/partnership and other specified business forms; incorporated companies use separate procedures. Do not invent commencement date, filed registration, tax exemption, headquarters or declarations.
- Reuse the already approved Rillora Live account/catalog/Portal/webhook/scoped runtime credentials. Preserve TEST/Live separation, data, price, FanPass and provider-specific human steps. Actual customer opening/real charges remain independently evidenced actions.
- [Current work and evidence](live-configuration-20261009.md).

## 2026-10-09 — Correct the Agent-created Live payment testing prerequisite

- Status: LOCKED by applicable provider testing rules, not a new Owner payment authorization.
- Scope: Stripe release validation after Owner asks whether a real payment is returned or remains in Stripe.
- Evidence: [Stripe testing](https://docs.stripe.com/testing) prohibits testing live mode using real payment details; [refunds](https://docs.stripe.com/refunds) describes explicit original-method refunds and retained processing fees.
- Decision: withdraw the earlier Agent-created prelaunch real-money purchase/refund prerequisite. Reuse completed Sandbox lifecycle evidence and verify actual Live configuration, signatures and access boundaries. Observe legitimate customer payments/refunds when they occur; do not create merchant self-payments or artificial transactions for testing.
- Does not imply: production checkout/tax readiness is complete, any Live money has moved, refunds are automatic/free, or Owner has instructed a charge/refund now.
- Implementation impact: documentation/register/handoff only; no source, credentials, provider state, prices or real data changed.


## 2026-10-09 — Owner requests consolidated phone delivery and another payment review

- Status: LOCKED within current launch work.
- Owner explicitly requests installing the fixed version on the original phone and rechecking Web/iOS purchase/refund flows because money handling matters.
- This authorizes a fresh scoped review/test cycle; prior evidence remains dated and is not relabelled as new. Use Stripe TEST/Apple Sandbox, no artificial real-card Live charges.
- Agent operational choice: renew only the existing three review identities and original Sandbox qualification to2026-10-11T14:00Z, preserving genuine consent and ordinary customer closure. Direct1.0(12) is a new development artifact; no incremental TestFlight.

## 2026-10-09 — Owner requires complete selected-language presentation

- Status: LOCKED for Web/iOS and their payment/consent/legal presentation.
- Decision: selected Chinese displays Chinese; selected English displays English. Remove bilingual duplicate explanations, Chinese-reference wording and English-prevails presentation, including English-labelled legal links. Keep proper service names and user/provider-supplied original data where translation would alter identity or evidence.
- Supersedes: earlier English-only consent with Chinese reference and language-boundary disclaimers for these controlled surfaces.
- Does not imply: changing prices, bank details, jurisdiction facts or previously accepted receipts. Any actual document/consent version change must preserve historical evidence and be implemented consistently rather than silently changing a stored acceptance.
- Evidence: Owner's current explicit instruction; implementation/validation recorded in the current payment recheck contract.

## 2026-10-10 — Defer optional Stripe Tax automation; distinguish processor capability

- Owner asks to leave Stripe tax configuration for later and points out that payments are already enabled. Treat this as a deferral of the Stripe Tax automation service, not a waiver of actual tax obligations.
- Fresh Rillora Live readback confirms charges_enabled/payouts_enabled/details_submitted true, card_payments active, no currently_due/past_due fields and no disabled_reason.
- Official Checkout creation documents automatic_tax as optional. Supersedes treating Tax Settings pending/head_office missing as a Stripe-imposed universal prerequisite for charging or for all launch work.
- Rillora's independent new-sales switches and current explicit tax-strategy guard still exist. A deferred automation setup is not a fabricated reviewed_no_collection assessment, a checkout deployment, customer activation or payment instruction.
- Preserve pricing, provider/account boundaries and remaining release work. Current execution continues independent financial recovery acceptance; do not re-create credentials/catalog or repeat purchases.

## 2026-10-10 — Owner selects final safety and post-restore billing acceptance

- Owner explicitly selects release item3: final artifacts, permission boundaries, rollback configuration and financial reconciliation after restoring old data.
- Reuse previous foundation/release evidence; execute needed isolated verification and directly fix demonstrated gaps. A scoped disposable recovery target and temporary verified source quiescence are implementation choices within this work, not customer cutover.
- Preserve real source data, pricing, FanPass, existing subscriptions, deferred Stripe Tax automation and incremental TestFlight pause. No artificial Live payment, account deletion or public support post follows.

## 2026-10-11 — Owner selects remediation of the recent Rillora audit reports

- Owner explicitly asks to fix the recent findings and clarifies that this means Rillora audit reports, not Codex/Daybreak tooling.
- Supersedes the report-only restriction for these reported application findings and the old release-item2 next step. The paused deep scan is not resumed, and original export provenance is retained.
- Agent choices: isolated branch at647317834, deduplicate73records into35boundaries, targeted fixes, synthetic/local verification, one fresh read-only investigator and one fresh read-only candidate reviewer. No pricing, data, ordinary sales, real payment, device installation or TestFlight change follows.
- The candidate adds bounded work, explicit protected configuration and purpose-limited operations. Source/test changes and deployed results remain separate. Runtime-compromise and metadata risks are calibrated against existing trust contracts, not claimed fixed by unrelated endpoint repairs.
- Automatic approval review specifically requires Owner confirmation for the explicit live configuration capability and the exact test-fixture scan registry update. These two drafts are pending, not new Owner approvals and not a revocation of the existing project authorization. See[the repair record](security-findings-remediation-20261011.md).

## 2026-10-11 — Owner approves both precise security source operations

- Owner answers “批准这项源码修复，线上保持原状” for the explicit live configuration branch, and “批准这些精确的测试夹具登记” for the reviewed scan registry proposal.
- This authorizes applying those exact source/test changes; the prior automatic-review approval blockers are resolved. The current proposal's28entries are verified against their exact byte hashes, with mechanical line relocation only where the approved code moves an unchanged span.
- No live runtime mode, customer opening, payment, provider setting, installation or deployment is authorized by this source-only confirmation. Preserve the online state explicitly.
- Applied result: API495/495/typecheck/build and source scan32reviewed matches/0unknown. Continue Git preservation under the existing all-work authorization; do not request these two confirmations again.

## 2026-10-11 — Owner requests code and tests for remaining groups31–35

- Owner explicitly asks to fix all five remaining groups, complete code/tests first, keep online unchanged, then push the complete result to GitHub.
- Supersedes the prior task boundary that only classified these stronger-compromise and metadata risks. Preserve their original report evidence and identify exact containment rather than promising protection from all host/API compromise.
- Continue from b6f5b8c97 in the same attached security worktree. Necessary database authority, journal attestation, deletion-worker isolation, owner-scoped email matching and protected local-credential tooling are in scope.
- No deployment, existing credential movement/rotation/deletion, real-account deletion, purchase/refund, phone/TestFlight delivery or restart of the paused scan follows from this source/test instruction.

- Implementation result: groups31–35 have scoped code/local validation, source74a9c66ac, CI125 success and archive32 remote authenticated readback. The unchanged exact scan spans only move3line positions under the existing approval. Implementation choices and preservation receipts introduce no new price, market or deployment approval.

## 2026-10-12 — Owner starts the coordinated security rollout

- Owner explicitly requests deploying this security batch in the documented cutover order, preserving existing data, pricing and sales switches, with no TestFlight distribution.
- Supersedes the source-only online-freeze instruction for this deployment task, not the closed customer/billing boundary or retained-account decision. Necessary scoped resource/key provisioning, compatible migrations, broker/worker isolation and validation are authorized; no new purchase/refund or blanket deletion follows.
- Owner reiterates maximum default project authorization. Do not repeat already-covered confirmations; only actual provider-required personal interaction or higher-priority tool rules can require handoff.
- Reuse74a9c66ac/CI125 and prior reading/evidence. Exact deployed state, new compatibility fixes and actual data/permission results must be recorded separately in the rollout contract.

## 2026-10-12 — Restore the existing review window for actual native acceptance

- Owner reported that the newly installed14could not enter the home screen, then clarified that the App showed service-not-open/login failure. The exact original review expiry, not installation or data loss, caused the server403.
- Within the already authorized release acceptance, Agent renewed only the same3identity digests for48hours, to2026-10-14T12:01Z (Hong Kong20:01). API and Auth0 were read back separately; all other API environment fields, secrets, image, binding order and sales switches were preserved. No new identities or ordinary customer access were added.
- Owner then confirmed entering the home screen and seeing original matters; the matching native client has fresh provider login/code-exchange records. HTTPS-only callback retirement followed delivery of signed14and association verification.
- Owner completed the actual macOS nonsecret user-presence probe; all9supported local credential files were then encrypted and individually readback-verified. Provider keys, permissions, archive identity and FanPass were not changed. This is an operational follow-through under existing authorization, not a new pricing, purchase, market-opening or TestFlight decision.
- GitHub current private-repository rules are not enforced on the present plan. No paid plan or organization transfer was authorized or performed; manual/source CI evidence does not substitute for that platform control.

## 2026-10-12 — Owner resumes remaining native and cross-platform acceptance

- Owner explicitly requests only remaining acceptance, reusing completed evidence, continuing independent work and keeping TestFlight paused.
- After actual Mac authentication was required for iPhone Mirroring, Owner defers the phone step for this turn and asks to complete other checks. Owner separately restores the real production Web login. Neither action authorizes a new purchase, account deletion, hidden consent or claims of current physical-device verification.
- The scoped correction removes a duplicated Web availability sentence; it preserves existing prices, data, sales controls and every server permission. This is an Agent implementation choice within the ongoing acceptance scope, not a new commercial or security-policy decision.

## 2026-10-13 — Owner reiterates benefits, annual price and one subscription button

- Owner explicitly rejects the incomplete Plan & access correction and asks for the paid plan, its price and a subscribe button. This supersedes Web's Free badge, included/expiry accordions, persistent refresh action and separate subscription-checkbox review step. Permanent Free capabilities themselves are unchanged.
- Agent implements one paid-plan card and explicit-click acceptance beside renewal/cancellation/legal disclosures. The freshly checked immutable quote, idempotency, server-authoritative access and original renewal-provider management remain mandatory. No acceptance occurs on render or load.
- This does not authorize ordinary sales activation, a price change, invented tax facts, new provider transactions, subscription resets, native reinstall or TestFlight. Current native Release already has the approved consumer presentation; Owner's deferred phone verification remains separate.
- [Implementation and exact scoped evidence](plan-purchase-page-20261013.md).

## 2026-10-13 — Owner removes tax strategy as the Web subscription prerequisite

- Owner explicitly says “忽略掉计税策略” after the application-side sales blockers are explained. Stripe Tax remains disabled; do not require tax-policy setup or registrations before continuing this Web subscription work.
- Agent implementation choice: explicit disabled mode, automatic_tax false, current annual8899USD unchanged. This is not a fabricated reviewed_no_collection assessment or a declaration of tax exemption. Existing merchant/environment/price/idempotency/consent/signature and single-renewal-provider checks stay in force.
- Continue the concrete live runtime and catalog/sales/entitlement delivery work. Source readiness, actual provider settings, customer entry, financial behavior and TestFlight remain distinct; no TestFlight or artificial Live transaction follows. [Current implementation](web-billing-activation-20261013.md).

## 2026-10-13 — Correct the identity cutover sequence before ordinary sales

- Agent found the old Preview tenant-wide service issuers still active after enabling the production billing engine. The original identity retirement contract remains applicable; Owner's tax instruction does not waive it. Restored the exact original production review Action and closed only new-sales route/market, preserving existing entitlements, prices and records.
- Disabled all grant types for the exact four old Preview clients; both old M2M credential exchanges now return403. Production client permissions/connections remain unchanged. Inert historical grant metadata is retained; no broader CLI scopes or account deletion were introduced.
- The actual Management token lifetime remains86400seconds. Earliest ordinary activation is2026-10-13T20:20:46Z plus rounding to Hong KongOctober14 04:21, after a300second tolerance and a fresh negative check. No new Owner approval, Stripe Tax setup, real self-payment or TestFlight is required. This is an implementation correction under the existing security contract, not a new product/tax decision.

## 2026-10-13 — Owner starts consolidated final readiness

- Owner asks to move all remaining work to formal launch readiness, superseding the narrow wait-only next step. Continue independent Apple/native/store preparation while preserving the already measured identity-token deadline.
- Existing no-per-fix TestFlight distribution, prices, real data, retained deletion account and FanPass constraints remain; no new self-payment or mass deletion is inferred. Reuse unchanged native14instead of rebuilding merely for a new turn.
- Actual source currently omits Apple production runtime wiring and rejects the separately configured Apple review context in live mode. Reconcile this with the existing independent-context contract and Apple's Sandbox review requirement using explicit expiring review-account access; do not enable general development or old diagnostic test features. This is an implementation choice to satisfy the release goal; scope, negative checks and actual deployment must be recorded independently.

- During this continuation, iPhone Mirroring actually required Mac user presence. Owner replied “现在不方便，先做其他工作”; defer that physical step for this turn and continue independent release work without another identical request. Existing14evidence remains valid at its original scope.

- Owner subsequently confirms iPhone Mirroring is unlocked and available, superseding that temporary deferral. The original Google identity is reused; actual legal acceptance remains subject to the tool's action-time confirmation. Apple preparation covers the existing verified USA/HKG annual prices; the old nine-territory draft is not automatic sales approval and AUS retains its test evidence.


## 2026-10-13 — Owner confirms current consent and formal store disclosures

- Owner confirms the current native account Terms/Privacy/electronic-record action and later restores the actual Mac mirroring lock. The original Google account returns to its existing map; no new purchase or restoration is inferred.
- Owner supplies the exact App Review contact phone for Apple; it is saved for that purpose and excluded from readable Git. Owner separately confirms publishing the concrete13-type privacy answers, and explicitly authorizes sending only the existing dedicated synthetic reviewer username/password to the App Store review form. Those actions are saved and independently re-opened; no personal account password is disclosed.
- Agent implementation choice: Production Apple USA/HKGnew-sale routes are independently held while Production authorization returns401, preserving all Web prices/routes, markets, review enrollments and historical financial data. SuccessfulSandboxTESTdoes not waive the Production gate. Four production worker alarms and strict401health checks are deployed under existing scope.
- English(U.S.) stays the primary store localization; separate Chinese copy/designs are added and current English Matters/home captures replace outdated imagery. App download price isfree, preparedApp/annualavailability isUSA/HKGonly, automatic territory expansion and unverifiedMac/Visionopt-ins are off. Existing18+service terms determine the age override. No TestFlight distribution or automatic release is authorized by these configuration changes.

## 2026-10-13 — Owner authorizes the two provider follow-ups

- Owner explicitly approves sending both reviewed drafts: a public Auth0 Community Free-template reset question and a private Apple Developer Support Production401 inquiry. Owner separately confirms the actual first-time community account Terms/Privacy/guidelines. Apple case102995248851 is received; Auth0 confirms one pending moderator-approved post. No paid plan, credential disclosure, Classic switch or duplicate question follows.
- During store completeness preflight, the App14/annual/group packet entered actual waiting-for-review before intended final acceptance. Agent disclosed the premature state and withdrew it, preserving materials. Reload confirmsRemoved/DeveloperRejected, not an Apple review rejection. This is a corrective implementation action under the existing readiness scope; remaining dedicated-reviewer/device evidence is not waived and manual release/noTestFlightremain.
- The mirroring process was later reopened and actually required Mac user presence. Owner replies “现在先完成其他收尾”; defer the remaining phone interactions for this turn, continue independent preservation/platform work, and do not ask again for the same system unlock.
- Owner subsequently says the mirror is unlocked, superseding that temporary deferral. Continue remaining physical acceptance; actual mirroring input did not affect the phone UI despite successful connection/native launch. Record the tool limitation and request the specific manual legal-return operation, not another login or blanket approval.

## 2026-10-13 — Remove duplicated legal-page settings notices

- Owner reports that both native Terms and Privacy links open, and objects to the two boxes above Privacy. This confirms opening; the free-text reply does not explicitly attest returning to the same account.
- Owner then asks to delete the two notices if separate display is unnecessary. This supersedes the Agent's unshipped footer-foldout proposal. Remove the duplicated appearance/language block from the legal publication shell without adding a replacement control.
- Existing actual preference/storage facts remain on the live website legal-information page and the policy surfaces. Accepted bodies, versions, consent digest and processing behavior are unchanged. Publish only the existing legal Pages project after validation; do not rebuild/install iOS, change financial configuration or distribute TestFlight.

## 2026-10-13 — Provider evidence corrects release order and Free login maintenance

- Owner asks for the exact Auth0 page defect and durable maintenance, and permits closing the Apple inquiry if an explanation is found. The live Chinese login preview confirms three English shell phrases plus its English region label; no new credential or callback was submitted.
- An Apple Commerce Engineer states Production API access requires a production release. This explains the current comparison sufficiently to remove Production200as a pre-submission gate, while retaining actual post-release validation before ordinary Apple sales. The exact approval/public-release boundary and account-specific post-release result remain unproven; no generic401Sandbox fallback is adopted.
- Retain standard New Universal Login plus Free-supported branding and localized prompts as the maintainable target. The old locked shell is still live, and the public question is still pending. The documented official support escalation exists, but the current account exposes no Message control; no new private support message is claimed.
- Fix the legacy full-template script to stop before remote writes when the existing template cannot be read, including a404after removal. Seven intercepted-provider checks pass. No live tenant/runtime/price change occurs.
- After Owner restores the actually expired Apple Developer session, send a closure request in existing case102995248851. Apple acknowledges receipt in that case, but does not display Closed. No duplicate case or new TestFlight distribution follows. [Current evidence](provider-diagnostics-20261013.md).

## 2026-10-14 — Owner defers Auth0 shell and prioritizes complete App Review preflight

- Owner explicitly defers the current Auth0 outer-shell language/cosmetic issue and asks for a thorough second review of Apple submission material plus remaining independent launch work. This is a deferral, not a passed localization result or permission to alter authentication safeguards.
- Reuse completed native14, financial, security and cloud evidence. Inspect actual Apple metadata and a usable dedicated reviewer path, correct real discrepancies, and keep manual release/no TestFlight. Do not guarantee Apple's review outcome or create redundant tests/support cases.
- The previously measured Web identity-token deadline remains binding; complete independent preparation while it has not elapsed. [Current scope](app-review-preflight-20261014.md).

## 2026-10-15 — Owner ends physical-device checks; complete independent launch work

- Owner explicitly says “真机不用验证了”. Stop further physical-device verification. The prior explicit confirmation that legal navigation returns to the original account and matter is retained. Remaining unsubscribed-device and VoiceOver results are not fabricated or kept as a fresh participation requirement.
- The dedicated synthetic reviewer has separately completed Web and native authentication under the current terms confirmation, then a Web-create / iOS-edit / fresh-Web-read round trip. One clearly labelled nonpersonal example remains for App Review. Passwords are unchanged; input-tool failures and simulator/store-binary evidence remain distinct.
- Under the existing launch authorization, the expired identity window is closed by fresh four-client readback and two403denials. The prepared production consent Action is restored; only the original Web route and market sales flags are opened. Current USD88.99, disabled automatic tax and the separately closed Apple Production routes remain. No real payment or new TestFlight occurs.
- Review notes now explain the optional passkey prompt and the synthetic example. Continue the three-item Apple submission after these checks, retain manual release and the post-release Production gate. This is not a guarantee of Apple approval.

- After the final3-item validation, the preparedApp14/annual/group packet is intentionally submitted under the continuing release authorization. Apple receipt6537a10c-38f2-425e-8b8e-c76e5fa730b1shows all threeWaiting for Review atHong KongOctober15 09:49. This supersedes the earlier withdrawn packet as current review state; manual release remains and no monthly product is submitted.

## 2026-10-15 — Owner starts cross-platform AI work for the next version

- Owner asks to continue development while Apple review runs, put new capabilities in a subsequent version, and improve Rillora discovery/recommendation/use across AI products. The follow-up explicitly extends scope beyond two providers.
- Preserve the submitted App14, existing production dependencies/data/prices/sales flags, manual release and no TestFlight. New work is isolated on codex/ai-discovery-vnext-20261015 from fec1ad3bc; the release worktree remains available.
- [Current plan](architecture/ai-discovery-vnext-20261015.md) distinguishes public discovery, platform-directory distribution and authenticated tools. The earlier MCP proposal supplies permission boundaries; it is not an implemented service.
- Agent recommendation: public-site discovery foundation first, a shared narrowly scoped read-only MCP next, then independently verified platform adapters/listings. This sequence and tool design are recommendations, not an assertion that Owner individually approved every future feature or provider grant.
- Official research and four anonymous website reads are complete. New implementation, real AI connections, directory submissions and recommendation/conversion measurements remain unperformed. No guaranteed automatic recommendation or global compatibility claim.


## 2026-10-16 — Owner authorizes next-version discovery and scoped MCP implementation

- Owner explicitly directs implementation of the plan: public GEO/SEO first, MCP and multiple AI clients next, next-version delivery without disrupting current review, then GitHub publication. This supersedes the earlier documentation-only stage; it does not make undeployed work a customer feature.
- Agent implements20 prerendered language pages and two original bilingual articles, retaining public/private boundaries and existing UI. Search indexing and AI recommendation measurements remain unperformed.
- Agent chooses a narrow first integration: two read-only tools, up to20 selected matters,7-day scoped grants, ordinary selected-field updates readable, and permanent removal when made private/archived. Replacement needs fresh explicit consent and version checks. No generic REST bridge, model call, write/payment/export/release tools or first-party credential reuse.
- Both runtime and UI flags default off. Isolated protocol/consent/recovery tests and five generated platform configurations are source evidence; independent provider OAuth/client acceptance, directory review and deployment remain required. CurrentApp14, production data, prices, sales controls and FanPass stay unchanged; noTestFlight.
- Full regression identified the deletion worker's omitted journal permission after the new formatter. Append-only0105preserves the prior exact permission and closes the old formatter entry; no broad grant, checksum bypass or real database mutation. [Implementation and evidence](architecture/ai-discovery-implementation-20261015.md).


## 2026-10-16 — Isolate current Codex packaging from the newer portable OAuth format

- Continuing Owner-authorized cross-platform acceptance, the actual current Codex parser rejects portable server.extensions and silently omits the server after parsing the manifest. The official OpenAI guide still documents that OAuth extension location.
- Preserve the documented portable package for compatible directory hosts and generate a separate current-Codex compatibility package; do not delete authentication, invent a successful universal-schema result, upgrade the user's desktop app or change global plugin configuration. Both outputs share the existing service and metadata.
- Real local Codex/Gemini client discovery uses only signed synthetic identities. It does not close provider OAuth, model tool-selection, marketplace review or public deployment. Current review/runtime/data/prices remain unchanged; no new product or pricing decision is introduced.


## 2026-10-16 — Keep real OAuth acceptance separate from production login connections

- Auth0 administrative login is actually restored. Resource compatibility was already enabled; no tenant-wide toggle is changed. Prepare a purpose-tagged temporary public third-party client and dedicated900-second API within the existing free application limit.
- The real provider rejects per-client binding for a third-party application. Keep its third-party classification and all existing production connections unchanged; choose an isolated synthetic domain-level database connection and explicit user-delegated API grant for acceptance. This is an Agent implementation choice within the authorized next-version test scope, not permission to expose production identities or upgrade a plan.
- Creation is blocked before mutation because the current CLI lackscreate:connections. Request onlycreate:connections anddelete:connections for that isolated lifecycle; browser action-time confirmation remains pending. Do not describe this as expired login or approved new scope.
- The actual Codex authorization request proves matchingresource, exact callback andS256, not successful OAuth or tool execution. Stop and clean the local fixture while waiting; retain the inactive tagged registrations for continuation and eventual scoped cleanup. [Evidence](architecture/ai-integration-acceptance-20261016.md).


## 2026-10-16 — Correct duplicate OAuth resource and complete two-client provider acceptance

- Owner completes the specifically requested connection-management authorization. Use a separate signup-disabled synthetic connection and account, sequential temporary third-party public clients, and explicit user grants; retain all existing production connections and the free plan.
- Actual Codex sendsresource twice when the generated override duplicates discovered metadata. Remove only that override; keep exact resource, issuer, client, PKCE and server audience validation. The corrected real provider flow succeeds.
- Gemini uses its unchanged exported OAuth implementation followed by actual CLI discovery. Both client-presented credentials pass scoped protocol reads and same-token revocation checks. No model or consumer-chat equivalence is claimed.
- Delete only this workflow's temporary provider resources, then confirm original client/resource/binding hashes and full tenant settings are unchanged. No new product, pricing, legal or deployment permission is inferred. [Current evidence](architecture/ai-oauth-validation-20261016.md).

## 2026-10-16 — Public GEO delivery and minimal search-provider access

- Agent continues the existing public-discovery goal with two-phase deployment of the independently hosted www site: stage assets/pages and DEVELOPMENT first, then publish the complete source template only after actual byte checks. No new App/API/data/billing or TestFlight change is inferred.
- Choose manual DNS ownership verification through the already authorized Rillora-only GoDaddy wrapper. Add exactly one Google TXT and one isolated Bing CNAME; preserve every pre-existing record and keep these ongoing ownership proofs.
- Owner explicitly confirms sharing the original Google account's name, photo and email with bing.com for webmaster login. This applies to that exact recipient/scope, not GSC-data import, DNS-account delegation, advertising, analytics or a new paid service. No duplicate confirmation after a failed old callback is required when the same approved flow is renewed.
- Record website publication, ownership, submission, actual live fetch, indexing and model recommendation separately. Google live fetch succeeds but its regular report remains unable to read; Bing is processing. No new product/pricing/legal decision or automatic-recommendation promise is introduced.

## 2026-10-16 — Isolated HTTPS acceptance within the existing free plan

- Owner completes the reopened browser login; both Dashboard and Teams are verified. Teams confirms Free/$0 and its one-tenant limit. No paid upgrade or new tenant is selected.
- Agent chooses temporary HTTPS acceptance using a synthetic local environment and plans reversible use of the inactive Default App as the first-party Web client. It is not an AI client; AI still gets an independent third-party registration. Existing production and retired clients stay unchanged. Mutation and restoration must be independently verified; an audit alone does not prove completion or historical non-use.
- Secure-cookie behavior now also follows a configured HTTPS preview origin, keeping production protections and HTTP local behavior. This is a next-version source change, not a production deployment. The temporary tunnel is development evidence, not a hosted-product or production-security equivalence claim.

## 2026-10-16 — Record legacy default-client normalization during safe cleanup

- The first temporary HTTPS startup exposes an actual MCP readiness query using the base NOINHERIT connection. Fix it through the existing scoped auth transaction; retain base permissions and add a real database regression.
- Auth0 rejects restoring the Default App's previously unspecified authentication-method field as null; the paired modern-field request requires additional credential-management scope. Agent does not broaden management access. Restore name, empty callbacks, grant list, JWT lifetime and old binding, while retaining explicit client_secret_post. This is a declared configuration normalization for the unused default app, not exact prior-metadata restoration; production applications and the secret remain unchanged.
- All newly created provider resources and local synthetic records from that attempt are removed; retry from the explicit normalized baseline. Preserve failure evidence and correct the driver's masked exit status instead of recording the failed startup as passed.

## 2026-10-16 — Owner confirms synthetic legal consent; complete public HTTPS scope acceptance

- Owner explicitly confirms the current synthetic account's Terms, Privacy and electronic-record acceptance and continued selection/revocation test. The same approved purpose and unchanged legal text carry through the corrected fixture; do not re-request this consent or administrative login. No personal Gmail/QQ data is used.
- Real HTTPS saving reveals that Secure alone is insufficient: non-production cookies used plain names while remote Web requires __Host. Align name and Secure behavior for configured HTTPS and keep unprefixed CSRF limited to HTTP loopback; retain the original production boundary and reject duplicate/legacy cookies. This is an implementation correction, not relaxed CSRF policy.
- Browser selection, independent Codex OAuth, two selected-only reads and same-token revocation pass. The token remains valid819seconds at rejection. Log out the synthetic sessions and remove the scoped provider/local resources. The earlier Default App authentication normalization remains explicitly declared; no key rotation, production deployment or paid upgrade is performed.
- Temporary HTTPS is development acceptance, not long-term hosting or model-selected tool/consumer-directory completion. Continue sustainable isolated identity/hosting design before public multi-platform distribution. [Evidence and limitations](architecture/ai-https-acceptance-20261016.md).

## 2026-10-17 — Continue long-term hosting and additional AI clients on free resources

- Owner explicitly requests long-term hosting and additional AI-platform work, preferring Free, preserving current review and existing successful evidence, and publishing to GitHub.
- Agent creates a separate empty Neon Free project in Frankfurt with low quotas. This does not migrate production records or activate a new customer database. Actual idle suspension is confirmed. Functions reports deployment completion but public ingress returns an upstream403; do not label it usable.
- Agent selects the official Cloudflare OAuth Provider for isolated candidate authorization, with one Auth0 upstream sign-in app and separate downstream client grants. This preserves client separation while avoiding destructive retirement or paid Auth0 expansion solely for capacity. Implementation and real acceptance remain required; existing production authentication is untouched.

## 2026-10-17 — Keep consumer accounts optional and preserve independent downstream grants

- Owner states they have no Claude account. Do not create an account, require a paid plan or claim Claude consumer acceptance. Actual Claude Code and Cursor CLI OAuth can be validated independently without an Anthropic or Cursor model session.
- Retain one Auth0 upstream application and independent Cloudflare client registrations. Candidate-only wrapping keys, synthetic legal fixtures and disabled recovery publication are explicitly not production KMS/recovery or customer-readiness equivalence. Production and App14 remain untouched.
- Real browser evidence identifies no-referrer → Origin:null on native forms. Use same-origin for HTML and redirects, keep null origins rejected, and allow only verified form redirect origins. Both clients pass selected-only reads and same-token/refresh rejection after browser revocation. No model request, paid upgrade, directory submission or recommendation promise follows.

## 2026-10-18 — Complete remaining client evidence and deepen public SEO/GEO

- Status: LOCKED
- Scope: next-version AI candidate and existing independent public website.
- Decision: Owner asks to complete the remaining work first and explicitly emphasizes meaningful SEO/GEO work. Reuse the unmodified Qwen OAuth component and actual CLI without inventing a model credential or purchasing a model plan. Add four distinct original bilingual educational articles, navigation and accurate discovery metadata.
- Evidence: Owner instruction; actual Qwen OAuth/CLI/read/refresh/revoke receipts, 822 seconds remaining at rejection; public build, 26 public checks, 10 infrastructure tests and scoped browser results.
- Supersedes: treating a Qwen model-provider configuration as mandatory for protocol/CLI acceptance. It remains necessary for the separate interactive model experience where applicable.
- Does not imply: a live website update while AWS MFA is pending, a consumer-platform connection, model-selected tool usage, indexing, AI citations, customer MCP enablement or any change to App14 review.
- Implementation impact: preserve current production data, prices, billing, FanPass and TestFlight. The staged website upload must include only assets and eight new page objects; existing pages remain unchanged until the complete routing/content switch. [Current evidence](architecture/ai-seo-20261018.md).

## 2026-10-18 — Keep educational resources out of primary navigation

- Status: LOCKED
- Scope: public website navigation on desktop and mobile.
- Decision: Owner says placing 整理方法 in the main navigation is too prominent and not useful. Remove that destination; retain the footer entry and relevant article links so the published resources remain discoverable.
- Evidence: Owner feedback during the public-site rollout, before the final switch.
- Supersedes: this workflow's earlier decision to promote Resources into the primary navigation. It does not cancel the original bilingual articles or SEO/GEO work.
- Implementation impact: update the candidate header and rebuild its public artifact before publishing. Retain the original live pages while the corrected assets are staged; do not publish the rejected header variant.


## 2026-10-18 — Prioritize marketing readiness and acquisition over additional feature work

- Status: LOCKED for current work priority; channel outcomes remain provisional.
- Decision: Owner asks for a full review of existing SEO/GEO, runnable MCP/plugins, other AI coverage, low-cost acquisition and App Store keyword strategy after the current task. Marketing is now more important than more development.
- Implementation: preserve the completed public rollout, audit actual evidence by surface, correct actionable package/document drift, and prepare bilingual campaign and next-version ASO materials. Reuse prior validation rather than repeating deployment, OAuth, payment or device work.
- Boundaries: a synthetic MCP endpoint is not a customer integration; installed, authenticated, model-used, directory-approved, indexed and acquired are separate outcomes. Keep current App Review, real data, prices, billing and FanPass unchanged. This instruction does not invent an advertising budget or authorize unsolicited messages.
- Evidence: Owner request; [readiness audit](marketing/readiness-audit-20261018.md) and [execution plan](marketing/acquisition-plan-20261018.md). No marketing outcome or keyword-volume claim is inferred.


## 2026-10-18 — Deliver ordinary-user MCP rather than stopping at synthetic hosting

- Status: LOCKED scope; execution outcomes remain unproven until read back.
- Decision: Owner requests Google sitemap repair and remaining MCP/plugin integration through genuine ordinary-user availability, preserving current App Review and publishing completed work to GitHub.
- Supersedes: the previous marketing-materials-only next step and treating the synthetic candidate as the final hosting destination.
- Implementation: reuse the production data/security boundaries and existing Rillora sign-in, add a separately authorized read-only integration, keep existing prices and billing, and leave the in-review native artifact unchanged. Provider directory approval is independent of a working customer endpoint.
- Evidence: Owner instruction; [customer integration contract](architecture/customer-mcp-20261018.md).

## 2026-10-18 — Accept only the selected synthetic production Codex test, then revoke

- Owner confirms current Web legal acceptance and original Google login, then explicitly approves access by the real Codex client to Release acceptance 2026-10-01 only: titles/categories/statuses and generic missing-field checks, no email, notes or other matters, maximum seven days, immediately revoked after acceptance. A timed-out local callback can be restarted with the same scope without repeating this confirmation.
- Actual production OAuth, model calls and immediate revocation pass. Remove the test alias credential only; retain the account, synthetic matter, existing client configuration and other projects. This does not authorize separate ChatGPT email disclosure or reuse of Apple review credentials for another provider.
- Agent publishes public service metadata to the official MCP Registry within the already authorized distribution scope, using a single additive DNS proof and an encrypted registry-only signing key. No paid service, DNS delegation, broad runtime grant, arbitrary dynamic client registration or marketplace-approval claim is introduced.
- The residual bilingual language label is corrected under the existing selected-language decision; it is not a new design or legal-contract decision. See [actual delivery and boundaries](architecture/customer-mcp-20261018.md).

## 2026-10-18 — Add marketing aliases without purchasing another mailbox

- Owner explicitly requests social@rillora.xyz and hello@rillora.xyz as aliases of the existing Zoho mailbox, with actual send/receive verification and no additional mailbox purchase.
- Reuse the current support mailbox and preserve its primary address, privacy/security aliases, user count, subscription and existing authentication. Do not create extra users, groups, forwarding, DNS changes or a new mail provider.
- A bounded external rehearsal uses the already connected Owner Gmail: one test to each alias and a matching-alias reply, containing only test IDs and receipt text. This authorization does not extend to marketing campaigns or contacting prospective customers.
- The current Zoho browser session is actually unauthenticated; request only the required original-account sign-in, not another approval for the already specified alias configuration. OpenAI publisher identity remains deferred at the Owner's request. [Scope and evidence](marketing/mail-aliases-20261018.md).

## 2026-10-19 — Preserve the initial temporary SMTP failure and verify alias capability separately

- Original Zoho login restored; both aliases are saved under the same licensed mailbox, with the primary and old aliases preserved. No paid user or forwarding/DNS change is introduced.
- Both inbound tests pass. The hello reply reaches Gmail Inbox with SPF/DKIM/DMARC pass; the initial social reply receives Google's temporary4.3.0 and remains in Zoho's automatic retry queue.
- Agent performs one additional, independently identified social outbound probe to the same Owner Gmail under the existing send/receive verification request. It reaches Inbox with correct sender/content and all three authentication passes. No third probe, manual duplicate of the original, queue cancellation or unsolicited outreach is performed.
- Record the two aliases as send/receive verified while keeping the original delayed message explicitly unresolved; do not rewrite the initial failure as a clean first-attempt pass or promise universal future deliverability.

## 2026-10-19 — Social banner brief and concrete folio correction

- Status: LOCKED task scope; artwork is an Agent-delivered design, not a new Owner-selected brand identity.
- Owner requests a social banner if none exists, then rejects the abstract paper-ribbon treatment as not resembling a book, notebook or map and asks about URLs/platform rules.
- Replace the current banner visual with a recognizable open folio and simple matters diagram. Preserve the exact Legacy Imprint03 master, palette and separate English/Chinese presentation. Retain the first study as HISTORICAL.
- Agent chooses URL-free main exports and platform-native website fields where supported. This is not a blanket platform-policy guarantee or an Owner ban on all future URLs. No handle is locked or registered.
- Deliver images/source through Git under the standing all-work preservation instruction. No profile upload, marketing message, app/review change or new deployment is inferred. [Scope and evidence](marketing/social-banner-20261019.md).

## 2026-10-19 — Contact Apple about the current review delay

- Status: LOCKED one-off communication scope; review outcome remains Apple's decision.
- Owner explicitly requests an email or support case about Rillora's review exceeding48hours. This authorizes a factual status inquiry to Apple Developer/App Review support for the existing submission.
- Agent uses the App Review Status email category after confirming the real waiting submission and the absence of a duplicate recent status case. Do not withdraw/resubmit, fabricate urgency, reopen the unrelatedAPI401case or disclose review passwords.
- Apple accepts case103001356140. Existing build14, manual release, data, prices, sales and TestFlight remain unchanged. No recurring monitor is created. [Sent message and receipt](app-review-followup-20261019.md).

## 2026-10-19 — Research platform-specific marketing and a bounded acquisition budget

- Status: LOCKED research/save scope; platform priorities, budget allocations andCACthresholds arePROVISIONAL Agent recommendations.
- Owner asks which platforms to register, how their rules/playbooks differ, and how200–500USD could acquire users with minimal waste. This asks for research and a durable plan, not an instruction to create accounts, disclose identities, buy ads or spend the full amount.
- Record primary rules and uncertainties separately. Start with a50USDconditional experiment; keep remaining funds gated, count real net paid households and time, and do not import anecdotalCPC/CACor fictional conversions.
- Existing publishing/ad controls stayfalse/0; current pricing, data, AppReview andFanPassstay unchanged. New platform-specific research supersedes the earlier generic channel suggestions where they conflict, but not the originalMVPmarket-validation targets. [Platform rules](marketing/platform-playbook-20261019.md), [budget](marketing/acquisition-budget-20261019.md).

## 2026-10-19 — Multi-signal confirmation and sealed future-recipient arrangements

- Status: OWNER REQUIREMENTS RECORDED; exact thresholds and proposed mode separation remain provisional design details, with no runtime implementation in this research/design response.
- Owner clarifies that Rillora should combine available signals, personal routines and responses rather than rely on a missing heart-rate sample or expect Apple to determine death. Owner proposes reminders followed by preconfigured disclosure after nonresponse conditions or real death evidence, and expressly requires designated family/friends to know an arrangement exists while receiving no contents during the planner's life.
- The [candidate design](conditional-disclosure-vnext-20261019.md) distinguishes owner-authorized absence-condition delivery from death-only delivery; the latter cannot truthfully promise lifetime secrecy while substituting a timeout for verified death. This separation and the recommended build sequence are Agent proposals, not an invented Owner approval of exact rules, hours, health-data usage or a release corridor.
- A future-recipient acceptance must not imply present Name/Directions/Details grants. Pre-notice is minimal and owner-selected; no titles, counts, other recipients or health information. Existing live shares and downloaded copies cannot become retroactively secret.
- Record the automatic-execution goal while retaining independent evidence, identity, effective authority, scope, revocation and cryptographic availability questions. Do not infer Apple permission from local processing or relabel health-derived nonresponse to evade purpose restrictions.
- This records next-version requirements only. No current review/build, HealthKit capability, health data, family notice, timer, billing or production disclosure change. It supersedes any reading of the prior feasibility answer as dismissing multi-signal confirmation or future conditional delivery altogether, not the established distinction between missing information and a proven death.

## 2026-10-20 — Repair the reported publication failure and consolidate GitHub work

- Status: OWNER-DIRECTED review, repair and merge; actual CI and merge outcomes remain evidence-dependent.
- Owner asks to inspect Dot's26-file manifest warning and check/merge any outstanding GitHub work. This explicitly authorizes bringing the default main branch up to the reviewed integrated history; it supersedes historical instructions that merely preserved main as an older checkpoint.
- Independent inspection finds all23 remote branch tips already contained in the current head, no initial open PR, and main200commits behind. The reported run passes application jobs but fails complete readable coverage after source tests/scanning.
- Repair the generated manifest and retain full scanners. Add the final-receipt regeneration/check step to the repository closeout protocol. Preserve history through[PR3](https://github.com/tantalum666/rillora/pull/3), check its actual CI, and verify merge ancestry/tree without deployments, TestFlight, changed prices, real-data operations or FanPass work.

- Result: PR4merges88ea0be25after all3checks; PR3merges6b757b885after Verify source203and browser14pass (API580/browser66). Fresh main tree equals validated ecd13a75a and contains all24remote tips, openPRcount0. The initial no-runtime-change scope is preserved; only two browser-harness files required correction.

## 2026-10-20 — Begin next-version HealthKit preparation without changing the current submission

- Status: OWNER-DIRECTED preparation and private Apple purpose consultation; no health collection or platform approval implied.
- Owner says“开始吧，但是不要影响当前审核”after the proposed minimum-data, permission-copy and Apple purpose inquiry plan. This authorizes completing that concrete preparation and submitting the described separate technical question; it is not a new health-data authorization from an end user or a request to change the submitted app.
- Work starts oncodex/healthkit-preparation-20261020frommain5e4d6d692. The plan uses heart-rate-only, read-only, local/manual first-slice verification;24hours/200samples is an Agent-selected technical test bound, not a medical or disclosure threshold.
- The inquiry truthfully presents A optional safety prompts, B possible health-derived nonresponse/conditional access, and C independent death-evidence access. Apple accepts separate case103002496561. Existing review case103001356140is not amended; no Fall/SafetyKit entitlement or App ID capability is requested.
- Current native source/entitlements/plists/project and release configurations remain byte-identical. No real health samples, contacts, model calls, deployment, TestFlight or new native verification. [Preparation and receipt](healthkit-preparation-20261020.md).

## 2026-10-20 — Implement independent future-recipient notices for the next version

- Status: OWNER-DIRECTED implementation and GitHub delivery; no current-release deployment.
- Owner explicitly requests the work that does not depend on Apple's reply: designated family/friends know a digital-legacy arrangement exists while obtaining no contents during the planner's life. New work belongs to the next version and must not affect the current review.
- Agent implements a separate notice/acknowledgement relationship, metadata-only public/private projections, verified-email and account binding, revoke/decline/leave/restore invalidation. It does not reuse Name-level grants or infer future disclosure authority from acknowledgement.
- Manual link/QR/system sharing is the first delivery surface; no real family email is sent. Seven-day links, one-hour browser handoffs and100active notices are technical bounds selected for this reversible implementation, not approved death/nonresponse thresholds or commercial tier changes.
- Existing explicit shares/downloaded copies remain separate; no retroactive secrecy claim, HealthKit use, automatic death inference, conditional release, new TestFlight or current AppStore edit. [Implementation and evidence](future-recipient-notices-20261020.md).

- Implementation result: code6491fe5c6pushed oncodex/future-recipient-notices-20261020; Verify source207all3jobs passed,API590. Web202/browser74, native55unit/2UI/11source,infra68/broker6passed in isolated synthetic environments. Existing main/review/runtime remain unchanged. Four previously approved public Auth0ID spans moved line numbers only, with byte hashes unchanged; no new secret/rule exemption. Exact results are linked from the implementation contract.

## 2026-10-20 — Discuss stronger Family value without silently changing entitlements

- Status: OWNER QUESTION / AGENT RECOMMENDATIONS ONLY.
- Owner asks what additions could improve willingness to buy and whether the new future notice should be part of paid Family. This does not select a new quota, second-planner entitlement, price or runtime switch.
- The [proposal](family-value-proposal-20261020.md) suggests Free1 complete notice / Family5, a second independent planner, an actionable handoff workflow and reliable optional notifications. It preserves baseline security/export/revocation and receiver access, and separates actual notice code from unimplemented conditional delivery.
- Current Web88.99/Apple119.99US, purchased terms, existing Free1/Family5 live sharing, current review and FanPass remain unchanged. No willingness-to-pay or competitor-runtime testing is claimed. Only public official pages and current project contracts were checked.

## 2026-10-20 — Deepen paid-feature research and propose a specific differentiation mechanism

- Status: OWNER-REQUESTED RESEARCH / AGENT PROPOSAL; no implementation, quota, price or runtime approval inferred.
- Owner asks to research competitors' actual paid capabilities more carefully, identify adaptations and propose a paid feature not already offered by the market/competitors.
- Public official material and rendered pricing are used; source/plan/currency/version ambiguities are recorded. No paid trial, purchase, private upload or outreach is undertaken. Family plans, future access, media messages, reminders, scores and unlock simulations have precedents and are not claimed unique.
- Agent prioritizes [handoff-path checking](handoff-path-check-proposal-20261020.md): explicit cross-service dependencies, selected scenario/person, missing or circular paths, provenance/unknown states, changes invalidating earlier conclusions and concrete preparation steps. Professional dependency reviews already exist; a complete consumer self-service implementation was not documented in the reviewed set. This is bounded gap evidence, not proof of global originality.
- This revises the preceding Agent recommendation to prioritize two-planner packaging; it does not supersede any locked commercial decision. No old internal disclosure rehearsal is relabeled as a new paid feature. Candidate analysis cannot trigger release, obtain third-party access, or expose sealed information to future recipients.
- Current review, source implementation, Free1/Family5 live-sharing terms, prices, data, billing and FanPass remain untouched. [Research and source ledger](competitor-paid-research-20261020.md).

## 2026-10-20 — Clarify official deceased-user requests and narrow the path-check recommendation

- Status: OWNER CLARIFICATION QUESTION / AGENT RECOMMENDATION REVISION; no feature approval or rejection inferred.
- Owner asks why a phone dependency matters if family can submit a death certificate to an official manual channel. Fresh Apple, Google and Microsoft guidance confirms such routes, with distinct evidence, regional rules, data scopes and review outcomes. Data disclosure is not automatically a right to continue using the original account.
- The [candidate](handoff-path-check-proposal-20261020.md) must count applicable official routes; unavailable normal login is not a sufficient failure signal. Missing recorded conditions can be flagged for preparation, without guaranteeing approval or applying deceased-user procedures to incapacity/nonresponse.
- Agent narrows the prior priority to a supporting planning candidate with unproven standalone paid value. Next comparison must show incremental outcomes over existing official guides/checklists before implementation. No code, entitlement, pricing, deployment or review change.

## 2026-10-20 — Explain practical paid outcomes before developing new features

- Status: LOCKED research-only scope; specific feature recommendation remains PROVISIONAL.
- Owner explicitly asks for valuable paid functions addressing real problems and competitive differences, with a clear willingness-to-pay rationale before development. This supersedes any interpretation of earlier prototype suggestions as current implementation authorization.
- [Current options](paid-value-options-20261020.md) prioritize comparing owner-intent-based recipient action materials and coordination, with bounded source-to-draft import as a supporting candidate; scoped family assistance remains segment-specific. Existing basic exports, guides, review tasks and safety cannot be resold under new names.
- Public primary research supports problem hypotheses, while official free and paid competitors provide counterexamples. No global uniqueness, actual savings, conversion, annual demand or sustainable human-verification cost is claimed.
- No new software, actual disclosure, real customer data processing, outreach, charging, entitlement, price, deployment, TestFlight or current-review change. Continue only to a reviewable plan; later delivery and genuine voluntary payment remain separate evidence.

## 2026-10-20 — Walk through one fictional household and separate existing value from new service

- Status: OWNER-REQUESTED EXPLANATION / NO DEVELOPMENT; commercial details remain provisional.
- Owner asks for the complete preparation-to-provider-action flow and incremental value over current Rillora and free official routes, especially the annual fee.
- [The case](family-action-pack-example-20261020.md) distinguishes current planning/exports/guides, default-off existence notices, proposed materials/case coordination, and unimplemented fact verification/content delivery. Each provider still performs its own review; Rillora cannot guarantee external scope, approval, cancellation or refunds.
- Agent narrows the commercial inference: a simple three-matter household does not establish a strong annual purchase reason. Existing recipient export and content-before-closure guidance must not be sold again as new features. A finite event-service period is discussed only as a hypothetical costing requirement, not an approved entitlement.
- Preserve all prices, purchased terms, ordinary runtime, App Review, real data and FanPass. No real application, user test, disclosure, software implementation or provider change occurred.

## 2026-10-21 — Retain the action-pack direction and consider further useful paid outcomes

- Status: OWNER ACCEPTS RETAINING THE ACTION-PACK DIRECTION; research continues, no development.
- Owner says “这个可以，先记下，然后再仔细想想还有什么” after the concrete family walkthrough. Record the direction as accepted for retention. The preceding no-development instruction remains; no quota, annual-value proof, twelve-month service term, pricing or operational release is inferred.
- Agent compares [selected-file custody/delivery and original spoken instructions](paid-content-options-20261021.md). Both are new research candidates only; previous deferred attachments and media ideas are not represented as novel technology.
- Public competitors already offer uploads, exports, video notes and voice/transcription. Potential Rillora value must be demonstrated in exact content selection, actual retrieval, user-confirmed instructions and scoped delivery, not a claim of global uniqueness.
- No user files/recordings, model calls, new product tests, provider mutations, billing, deployment, App Review or FanPass work. Existing baseline security, exit rights and the map-not-password boundary remain intact.

## 2026-10-22 — Node安全补丁与受限部署路径

Owner明确要求“你帮我直接升级并部署吧，留下交接文档在github就行”，随后要求“优先在你云端操作，尽量不要花额度，要花再跟我说”。在明确说明仅本机部署／线上核验可能使用Codex额度后，Owner答复“可以”。因此先在云端准备Node22.23.4同主版本补丁及检查，再复用既有部署路径；这不授权新增付费资源、改身份／网络权限或发布未来功能。解释GitHub Actions分钟数且说明无法保证零额外费用后，Owner另明确“你跑吧，应该不用额外收费”，批准照常运行现有CI；不新增收费runner或构建服务。

[安全升级规范](node-security-upgrade-20261022.md)保留解析行为、锁文件、schema106和已上线customer MCP；七个镜像使用方与独立Lambda运行时须分别记录状态。源码和测试不是线上修复证明；交接在实际镜像与Node版本核验前保持待部署。

## 2026-10-22 — Start content and action-pack development with Web-first delivery

- Status: OWNER AUTHORIZED implementation and Web deployment; iOS release deferred until the current review is complete.
- Owner explicitly asks to develop the discussed features now: recipient action packs, selected important-file copies and original spoken instructions. This supersedes the prior research-only scope, without changing prices, existing purchased terms or real data.
- Keep current native build/review materials and published contracts compatible. Integrate the already deployed Node22.23.4 source patch before building the new API; do not repeat that separate rollout.
- [Implementation](web-content-development-20261022.md) will separate private preparation and explicit current sharing from unverified post-death release. No scan/image, inactivity, payment failure or health signal becomes automatic release evidence. Unconfigured operational corridors remain closed and accurately described.

## 2026-10-22 — Proceed with next-version heart-rate reading after Apple's non-preapproval reply

- Status: OWNER AUTHORIZED next-version source development; current App Review remains isolated.
- Apple case103002496561 actually replied that concepts are not pre-approved and implementation feedback comes during review. This neither approves nor denies the three proposed use cases.
- Owner explicitly directs continuing the agreed Apple Watch health-data reading direction. The earlier wait-for-concept-answer development gate is superseded. Start with the bounded, optional, foreground heart-rate reader in [the contract](healthkit-preparation-20261020.md), without health-derived access grants or unapproved reminder thresholds.
- Separate next-version configuration and local package keep current entitlements, main project, binary, submission and provider capabilities unchanged. Individual system permission, device reading and future App Review remain independent evidence.
- The Google redirect notification is separately investigated: its three examples are intentional aliases; the final homepage is indexed and all28 sitemap URLs return200 with matching canonical. No unnecessary redirect removal, re-submission or public deployment follows from this notification.

## 2026-10-22 — Prepare an independent account for production content acceptance

- Status: OWNER REQUESTED synthetic test account after confirming no other active Family test identity is available.
- The existing personal Google identity correctly has no active Family creation entitlement. Owner says “暂无，你看看能不能弄个测试账号”; prepare a separate synthetic identity and narrowly scoped, expiring test grants, without charging, changing ordinary sale controls or repurposing the Apple App Review identity.
- Use the existing Auth0 connection and signed credential store. Do not claim an example.test address is verified, fabricate an order/subscription, widen user access or bypass the fixed maintenance broker. Any required operator command must validate exact identity, test label, deadline and unchanged commercial configuration before use.
- Production positive upload/download and pack-save acceptance remains pending until actual evidence; current source/build/static/API-health checks are retained.

## 2026-10-23 — Complete the authorized Web release and retire temporary QA access

- Status: IMPLEMENTATION OUTCOME / NO NEW COMMERCIAL OR REVIEW APPROVAL. Owner’s Web-first and independent-test-account instructions remain the authority.
- Keep the three Web content capabilities at the existing Family price. The bounded file/recording limits and local-only transcription are implementation choices with explicit copy; no E2EE, unlimited storage, automatic death decision or verified post-death delivery claim is introduced.
- Production-cookie and enforced-journal gaps were reproduced and repaired; neither CSRF protection for mutations nor recovery enforcement was disabled. The independent QA account used two expiring manual test grants, no fabricated payments or consent. Normal login followed Owner’s actual confirmation.
- Actual synthetic file/private-pack acceptance passed. Test grants and sessions were revoked, the exact original maintenance/broker configuration was restored and the QA command was denied again. Synthetic samples are retained, not claimed deleted. Current native build/review, personal data, prices, sale controls and FanPass remain unchanged.
