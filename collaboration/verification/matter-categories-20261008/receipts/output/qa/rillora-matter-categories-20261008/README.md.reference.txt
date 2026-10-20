# Matter category presentation QA — October8

Source: 35f37e1b20fe4d62039020e80f08779d79c270cf
Workflow: continuation of direct-device iteration; cable or Wi-Fi permitted, no TestFlight distribution.

Owner supplied owner-before.PNG and reported Family after restoring under the original Sandbox account.
The attachment shows the old category layout; it is not a screenshot of the reported purchase result.

New checks: Debug build/run; Chinese light/dark full-page inspection; horizontal last-category/empty/reset;
existing real category+translated-search UI test in Chinese and English; 5 navigation and9localization guards;
Release compile and debugging export;12direct signature/configuration checks; actual same-phone installation.
Fixtures are synthetic and isolated at127.0.0.1:4395, using the existing dedicated simulator.

Changed contracts: docs/matter-category-refinement-20261008.md, product.md, direct-device-iteration-20261008.md,
apple-plan-restore-20261007.md; current handoff and journey are updated. Decision log records Owner's scope
and separates Agent's reversible visual choice from a global design approval.

Device identifiers and raw device service logs remain in the protected local directory. Signed artifacts
are encrypted only. Runtime/account settings, prices, real records and FanPass are outside this patch.
The prior44purchase tests are retained evidence and were not rerun for this presentation-only change.
