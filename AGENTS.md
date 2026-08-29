# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Durable public-entry rule: signed-out Home, Account and any mobile-equivalent top-level surface use product, task and account language. Do not promote `Free`, `no card`, plan names or pricing in those entry controls; commercial explanation belongs only after explicit plan-review or named paid-capability intent.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

Zero-revenue legal publication uses the separate `build:legal` contract. Run the repository wrapper `tools/legal/run-legal-sites-build.sh`, then the complete Web tests and `test:legal-sites`. The final artifact must use `worker/legal-index.js`, contain only the seven legal routes, make no API／auth／analytics／optional-storage request, and reject Account／API／unknown／write routes. Never deploy the saved Sites version 1 because it predates this split; after Sites project visibility recovers, push current HEAD and save version 2 or later before publication.
