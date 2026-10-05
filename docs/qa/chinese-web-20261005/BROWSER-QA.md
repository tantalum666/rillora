# Chinese Web browser QA, 2026-10-05

## Result: blocked before navigation

No rendered UI checks passed or failed. The executor could not launch an isolated browser, and its official cloud browser could not open the local preview. This is an environment limitation, not evidence that the application passed or failed.

- App source server: Vite, `http://127.0.0.1:4174/`, launched with `npm run dev -- --host 127.0.0.1 --port 4174`
- Packaged public preview target: `http://127.0.0.1:4197/`, official `scripts/preview-public.mjs`; public build completed locally
- Normal Python Playwright + existing `/usr/bin/chromium`: aborted before navigation with `FATAL:chrome/browser/process_singleton_posix.cc:297 Check failed: . socket() failed: Operation not permitted (1)`
- An isolated retry was permitted, but Chromium still aborted with the same socket EPERM plus ptrace EPERM
- Official cloud browser route, new isolated tab: `http://terminal.local:4174/` returned `net::ERR_BLOCKED_BY_CLIENT`
- No browser flags, browser security settings, persistent permissions, external account state, existing tabs or product source were changed

## Artifacts

- [Machine-readable blocked result](browser-results.json), with zero executed checks and exact launch error
- [Synthetic fixture test script](browser-qa.py)

The script is syntax-checked but has **not executed past browser launch**. Its selectors and fixture interactions require validation on an executor with working browser sockets. It is a continuation aid, not passing evidence.

## Planned checks retained in script

- Packaged public Home, Product, Security, Pricing, Support, Legal and Notices in English/Chinese; 1440/390/320 widths, light/dark, reduced motion
- Meaningful rendering, document language, framework overlays, raw message-key leakage, page-level horizontal overflow and synthetic screenshots
- Explicit language storage/reload; public App-link language and appearance propagation
- Signed-out Account consent unchecked by default, actions disabled, checked state preserved through language switches, withdrawal disabling actions
- Incoming invitation safe Back destination, invalid-link error, consent preservation
- Loaded synthetic workspace, saved user text, search/filter retention
- Unsaved matter name/notes and invalid-save eligibility across a genuine second-tab storage event; relocalized validation; close/Back cancellation and discard
- Core navigation, shared-item labels and raw content, Name/Directions/Details, settings saved-copy reader
- Network guard forbids remote hosts and records/blocks all API writes

No real authentication, data edits, purchases, access changes or export mutation occurs. Node/SSR test and build evidence must not be described as browser validation.

## Remaining acceptance work

Run the script in an authorized executor with working Chromium, review failures rather than assuming authored assertions are correct, inspect screenshots, and add full Back/Forward, normal-motion, saved-file import/read, hidden panels and any unvisited error states. Page-level width assertions alone do not prove all individual labels are unclipped. Official legal and provider English text should remain as intended.
