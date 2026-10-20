# Rillora security rollout — October12

The cloud/native source is bfe9baaf5 /CI126; the local credential compatibility repair is042f4e100 /CI127. These are scoped deployment and runtime checks, not a new full security scan.

- Both databases reached103 exactly once with matching checksums and68 original business-table fingerprints each. Verified encrypted backups remain retained.
- All five AWS stacks completed; PreviewAPI44, productionAPI22 and isolated workers stabilized. A later expiry-only update toAPI23 restored the same3review identities until Hong KongOctober14 20:01; sales, images, secrets and other runtime configuration were preserved.
-203 Web files and HTTPS association documents match. Actual IAM/broker and database/journal refusal controls pass. Worker health isUNKNOWN because no container health check exists; observedRUNNING is recorded separately.
- Phone14 installed in place, independent version/signing readback passed. Initial device lock and expired review access were distinguished. Owner confirmed home/original matters after renewal; the native client has fresh success/code-exchange logs. Both clients now allow onlyHTTPS callbacks; redirect URI itself is not present in provider logs.
- Nine supported local Auth0/Apple files were encrypted and user-presence readback-verified. Both checkout helpers have the correct team signature. Actual AWS CLI loopback,9Python tests,8Auth0 tests and32reviewed/0unknown source scan pass. The first CLI regression revealed CRLF normalization; its long unittest diff exceeded recursion depth in console output, so the final test uses exact equality without printing payload differences. No real upload or credential was used in that test.
- GitHub's current private plan explicitly does not enforce branch rules. No plan/organization change, fake active rule, new authorization scope, TestFlight, real charge/refund, retained-account deletion or FanPass change occurred.

Raw provider/authentication/device/database reports and real or encrypted credential references remain excluded in protected local storage. Current source/specifications are ordinary Git; available QA/build artifacts enter newarchive33 with explicit exclusions. Prior1–32archives are not re-created or re-downloaded. Source042f4e100 andCI127 are already remote; the current evidence/docs closure is still in progress.

Changed specifications: security rollout, source repair follow-up pointers, product/release inventory, credential-tool README, handoff and journey. Decision log records the bounded expiry renewal within existing authorization and actual platform limits. Keep the source-only older checkpoints dated. The current single next step is in docs/handoff.md.
