# Rillora Native Profile Navigation Evidence

Date: 2026-08-16  
Scope: local iOS Simulator evidence for the native `More -> Profile` information-architecture change  
Not evidence of: physical-device behavior, staging deployment, production authentication, external comprehension or release readiness

## Candidate

- shipping native source under `apps/ios/Rillora`;
- `Overview / Matters / Profile` system `TabView`;
- signed-out Overview has no top-right Account button;
- signed-out Profile owns Account, safe example, How Rillora works, Safety & privacy, App settings and About Rillora;
- authenticated Profile retains existing plan/contact/preparation/session routes and adds the same settings/support family.

## Results

| Evidence | Result | File |
| --- | --- | --- |
| Current-source unit suite | `75 / 75` passed | `unit-75-of-75.xcresult` |
| iPhone 17 Pro Max signed-out regressions | `2 / 2` passed | `signed-out-17-pro-max-2-of-2.xcresult` |
| iPhone SE 3 complete signed-out traversal | `1 / 1` passed | `signed-out-se-1-of-1.xcresult` |
| Authenticated iPhone 17 Pro Max portrait/orientation/deep routes with isolated synthetic QA API | `3 / 3` passed | `authenticated-17-pro-max-3-of-3.xcresult` |
| Initial authenticated attempt before the isolated QA API was started | `0 / 3`; all stopped at the same unavailable API precondition before a product assertion | `authenticated-api-precondition-failure.xcresult` |
| Direct Profile-root runtime inspection | Account and all four child-page routes visible in the selected native Profile tab | `profile-root-17-pro-max.jpg` |

The passing signed-out traversal asserts that the Overview Account control is absent, enters and dismisses the Profile Account choice, and pushes/returns from How Rillora works, Safety & privacy, App settings and About Rillora. It also preserves the existing safe example, Add a matter full-page Account route and no-commercial-copy-before-intent checks.

The initial authenticated failures are retained rather than deleted: `launchApp()` did not observe the synthetic Overview because the QA API prerequisite was not running. The isolated API was then started on `127.0.0.1:4181` with the existing synthetic planner contract, and the exact portrait, orientation and deep-route set passed `3 / 3`. That local listener was stopped immediately after the run. This closes the focused authenticated iPhone 17 Pro Max gap but is not a fresh full five-device／Dynamic Type matrix or a cloud-authentication result.
