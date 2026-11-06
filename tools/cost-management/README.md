# Rillora cost controls

These tools retain account/resource scope and security. They never stop production,
delete data, buy commitments, enable paid enhanced metrics or select a new recipient.

`controls.py --report-dir output/qa/<run>/cost-controls` reads a plan.
Add `--apply` to update the existing Rillora budget's credit/refund accounting,
add four absolute-cost notifications, lower the existing daily anomaly threshold,
and opt into standard free Compute Optimizer recommendations. The budget amount,
filters, original confirmed recipient and daily delivery frequency are retained.
The tool requires the existing `rillora-operator` session in the exact project
account. Full provider/rollback records remain local under `output/qa`, never Git.

Read back each budget notification and its subscribers after application. Verify
Optimizer status and that enhanced infrastructure metrics remain inactive. A saved
notification does not prove a new email has been delivered; billing updates and
anomaly detection are delayed. There is no automatic shutdown on a spending alert.

Run the pure boundary checks locally:

```sh
python3 -m unittest discover -s tools/cost-management -p 'test_*.py'
```

`growth_model.py` prints two complete hypothetical AWS hosting budgets using the
previous full model and current Frankfurt upgrade prices. It performs no cloud
calls. These are not capacity benchmarks, current invoices, subscription changes
or a rule that a certain user count requires a particular instance size. Follow
the current optimization report for actual measurements, deployment and open work.
