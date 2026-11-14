# Five-provider full hosting decision — 2026-11-03

Status: RESEARCH AND ARITHMETIC COMPLETE; NO DEPLOYMENT OR MIGRATION

[Full report](../../../docs/architecture/five-provider-hosting-decision-20261103.md), [model](model.py), [inputs and exact outputs](model.json).

The model gives complete bounded hosting scenarios, not invoices or proof of capacity/security equivalence. It includes both environments, persistent idle storage, background jobs, credentials and key versions, external journal/MCP state, backup windows, restricted egress, monitoring, registry, certificate renewal and an isolated restore drill. Public-only CF/Vercel hybrids retain the AWS bill; full-core alternatives with unknown quote/control remain explicitly unqualified.

## Evidence

- The five `Amazon*-prices.json` files contain selected public Frankfurt SKU rows and price-list versions. Prior Fargate, IPv4, Secrets Manager, KMS and S3 rows are inherited unchanged from [November2 public extraction](../cf-neon-validation-20261102/aws-frankfurt-price-evidence.json).
- [Cloud SQL selected public rows](cloudsql-selected-public-rows.txt) were read after choosing Frankfurt in the official public price page. [Oracle selected public rows](oracle-selected-public-rows.txt) were read in USD. These contain no provider account/session/private database data. Full transient public DOM is local QA only.
- [Source and coverage register](sources-and-coverage.json) records primary documentation, price boundaries and corrections found during cross-checking.
- Actual historical cost and live resource inventory are inherited from [November2](../cost-review-20261102/README.md). AWS STS actually expired on November3; this research does not claim a fresh cloud inventory or request redundant MFA.

## Verification scope

`python3 collaboration/verification/five-provider-decision-20261103/model.py --write` passes 13 Decimal and scope checks. They check invoice reconciliation, full core retention in hybrid totals, stopped disks, independent credential counts, one-time free-credit deductions and dedicated-SQL sensitivity. They are not application tests or security acceptance.

Manual control review additionally caught and corrected: OCI minimum50GB separate data disks; three free NoSQL tables cannot cover four isolated tables;40GB native database backups are additional to80GB files/archives; Google public egress must also traverse VPC firewall/NAT; 35-day recovery journal cannot be shortened to seven; retained credentials cannot be assumed safe to move to SSM. Those corrections were made before final publication.

All current work is documentation and a local arithmetic artifact. No application, provider configuration, billing switch, price, real data, current review, TestFlight, FanPass or supplier message changed. No subagent or cloud CI ran. No previous application/payment suite or encrypted archive was recreated. The transient failed public URL/offer lookups, oversized recovery reads and a failed UTF-8 stdin helper are retained as tool history; missing focused reading was completed and no failed helper mutation was claimed successful.

After the last readable receipt, rebuild the complete manifest and run the local publication gate against trusted base `f017648cada6d39144a88aa12b5a42d470c40e5d`. Private local gate logs and final remote head/Actions readback belong under `output/qa/rillora-five-provider-decision-20261103/`; a Git push does not constitute runtime verification.
