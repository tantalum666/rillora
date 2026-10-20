# Direct wireless installation - October8

Owner pauses incremental TestFlight releases and chooses direct phone iteration.
The paired iPhone16ProMax already had Developer Mode. Exporting retained Release11
with development signing passed12checks, including exact device inclusion. Source
c0cec8680and compiled binary UUID, bundle/version, production and Keychain configuration
are preserved. No implementation rebuild or product-test rerun.

The first app-info request disconnected; the subsequent wireless in-place install
succeeded. Device readback returned1.0(11), and foreground launch succeeded. No
uninstall, reset, cable, account change, new provider upload or purchase occurred.
Owner UI confirmation and remaining issues are pending. Exact device information
and device service logs remain protected and excluded from Git.

Focused docs, product, decision-log, handoff/history and journey are updated for the
new delivery preference. Existing archive1-22remain immutable. October7failure/fix
evidence and this direct installation are appended together, with separate remote
verification and final post-capture receipts.
