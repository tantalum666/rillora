# Oracle / Google plus Neon cost recheck

Status: PRIMARY SOURCES AND ARITHMETIC VERIFIED / NO COMPLETE QUOTE OR DEPLOYMENT
Date: 2026-11-03 (Asia/Hong_Kong)

[Report](../../../docs/architecture/oci-google-neon-cost-review-20261103.md)
supersedes the older low-cost component-based priority, without choosing a new
provider, buying resources or weakening existing protections.

- `prices.json`: selected public AWS Frankfurt SKUs and Google/Oracle rendered
  region/currency readbacks. No account identifiers or private source data.
- `google-vpn-frankfurt.png`: explicit Frankfurt selection and USD0.06 per tunnel
  hour; the default US value is not substituted.
- `sources.json`: current official sources and exact evidence scopes.
- `model.py` / `calculations.json`: reproducible Decimal arithmetic with 12 checks.
  Managed VPN examples are partial fixed charges, not the cheapest architecture,
  equivalent performance, a full monthly price or a new private-network test.
  `completeMonthlyTotalUsd` stays null. HA and single-path examples are distinct.

The runtime, database and phone/payment evidence from earlier work is inherited,
not rerun. No real-data reads/migration, provider mutation, account creation,
outbound supplier message, paid plan, cloud CI or subagent was used. No new sealed
archive is needed; existing archives remain immutable. Full readable coverage and
exact-base local publication run after these files, with remote readback recorded
in the ignored task QA directory.
