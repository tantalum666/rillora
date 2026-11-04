# Local purchase interaction checks

These tests use the existing RilloraComponentPreview host with the shipping Form and purchase components. The local fixture can capture policy URLs and reject purchase preparation; it cannot issue an Apple transaction or use a real Rillora account.

Generate the independent test project from the existing Preview target and pinned packages:

```sh
python3 tools/release/prepare_purchase_ui.py
```

Use XcodeBuildMCP with `output/qa/native-purchase-ui/RilloraPurchaseUI.xcodeproj`, scheme `RilloraComponentPreview`, and a chosen iPhone or iPad simulator. Run `RilloraPurchaseInteractionTests/ApplePurchaseInteractionTests`. The helper also accepts `--ios-root` to use an isolated release-source snapshot and `--output` for a fresh QA directory.

Generation checks that the ordinary release project, source Info.plist, entitlements and catalog remain byte-identical. It does not add a UI test target or duplicate Auth0 configuration into the shipping project. The generated project has only the local Preview application and its UI test bundle. Keep it under ignored output; the source helper and tests are versioned.

The checks tap the actual disabled Subscribe coordinates and the price, then verify that only the explicit Terms link opens its own URL. Both languages are covered. A separate ready-state check verifies that one Subscribe tap reaches the local purchase preparation path without opening a policy. These are UI regression results, not Sandbox payment or device-installation evidence.
