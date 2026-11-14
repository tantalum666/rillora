#!/usr/bin/env python3
"""Dated price arithmetic, not a benchmark, deployment plan or live invoice.

No network, credentials, project imports or runtime changes. Reproduce with:
python3 collaboration/verification/hosting-six-pair-20261102/model.py
Values are USD; capacity and traffic inputs are deliberately explicit.
"""

import json
from decimal import Decimal as D


def money(value):
    return float(D(value).quantize(D("0.000001")))


HOURS = D(730)
MILLION = D(1_000_000)
SCENARIOS = [
    dict(name="initial", requests=100_000, background_requests=1_000,
         cpu_ms=10, wall_ms=200, effective_concurrency=1, app_gib=3,
         neon_cu_hours=100, neon_storage_gb_month=1, history_gb_month=1,
         database_egress_gb=5, supabase_compute="Small", supabase_disk_gb=8,
         oci_count=1, oci_ocpu_each=1, oci_ram_gb_each=4),
    dict(name="growing", requests=10_000_000, background_requests=10_000,
         cpu_ms=10, wall_ms=200, effective_concurrency=5, app_gib=200,
         neon_cu_hours=730, neon_storage_gb_month=20, history_gb_month=10,
         database_egress_gb=200, supabase_compute="Medium", supabase_disk_gb=20,
         oci_count=1, oci_ocpu_each=2, oci_ram_gb_each=8),
    dict(name="sustained", requests=100_000_000, background_requests=100_000,
         cpu_ms=10, wall_ms=200, effective_concurrency=8, app_gib=2000,
         neon_cu_hours=2920, neon_storage_gb_month=100, history_gb_month=70,
         database_egress_gb=1000, supabase_compute="XL", supabase_disk_gb=100,
         oci_count=2, oci_ocpu_each=2, oci_ram_gb_each=8),
]


def workers(requests, cpu_ms):
    return (D(5) + max(D(0), D(requests) - 10 * MILLION) / MILLION * D("0.30")
            + max(D(0), D(cpu_ms) - 30 * MILLION) / MILLION * D("0.02"))


def neon(s, rate="0.106"):
    components = {
        "compute": D(s["neon_cu_hours"]) * D(rate),
        "data_storage": D(s["neon_storage_gb_month"]) * D("0.35"),
        "seven_day_history": D(s["history_gb_month"]) * D("0.20"),
        "database_egress": max(D(0), D(s["database_egress_gb"]) - 500) * D("0.10"),
    }
    return components


def supabase(s):
    compute = {"Small": "0.0206", "Medium": "0.0822", "XL": "0.2877"}
    return {
        "organization_pro": D(25),
        "compute_after_one_org_credit": max(D(0), HOURS * D(compute[s["supabase_compute"]]) - 10),
        "seven_day_pitr": HOURS * D("0.137"),
        "provisioned_disk": max(D(0), D(s["supabase_disk_gb"]) - 8) * D("0.125"),
        "database_egress": max(D(0), D(s["database_egress_gb"]) - 250) * D("0.09"),
    }


def google_egress(gib):
    # Frankfurt -> EU/US/HK example, no Iowa 1 GiB allowance. Scope <=10 TiB.
    assert 0 <= gib <= 10240
    return D(min(gib, 1024)) * D("0.12") + D(max(0, gib - 1024)) * D("0.11")


def google(s, effective_concurrency=None):
    concurrency = D(effective_concurrency or s["effective_concurrency"])
    # 1 allocated vCPU, .5 GiB. Effective overlap, NOT configured max concurrency.
    # 20% billed-occupancy allowance is an assumption, not measured startup data.
    foreground = max(D(s["requests"]) * D(s["wall_ms"]) / 1000 / concurrency,
                     D(s["requests"]) * D(s["cpu_ms"]) / 1000)
    seconds = (foreground + D(s["background_requests"]) * D("0.5")) * D("1.2")
    total_requests = s["requests"] + s["background_requests"]
    # Frankfurt lacks native Cloud Run domain mapping. Illustrate a separate
    # Pages Functions same-origin proxy; do not omit it or assume a free Google LB.
    # Initial daily demand is assumed <=100k with <=10ms proxy CPU; growth Paid.
    proxy = D(0) if s["name"] == "initial" else workers(s["requests"], s["requests"])
    return {
        "allocated_cpu_after_shared_free_credit": max(D(0), seconds * D("0.0000336") - D("4.32")),
        "allocated_memory_after_shared_free_credit": max(D(0), seconds * D("0.5") * D("0.0000035") - D("0.90")),
        "request_fee": max(D(0), D(total_requests) - 2 * MILLION) / MILLION * D("0.40"),
        "internet_egress": google_egress(s["app_gib"]),
        "modeled_same_origin_proxy": proxy,
    }


def oracle(s):
    # Normal A1 prices: no unverified Free Tier/capacity assumption.
    return {
        "a1_compute": HOURS * s["oci_count"] * (D(s["oci_ocpu_each"]) * D("0.01")
                         + D(s["oci_ram_gb_each"]) * D("0.0015")),
        "balanced_boot_disks": D(s["oci_count"]) * 50 * (D("0.0255") + 10 * D("0.0017")),
        "internet_egress_below_ten_tb": D(0),
    }


def serial_parts(parts):
    return {**{key: money(value) for key, value in parts.items()}, "subtotal": money(sum(parts.values()))}


results = []
for scenario in SCENARIOS:
    requests = scenario["requests"] + scenario["background_requests"]
    cpu = scenario["requests"] * scenario["cpu_ms"] + scenario["background_requests"] * 20
    app = {"Cloudflare": {"worker_requests_and_cpu": workers(requests, cpu)},
           "Google": google(scenario), "Oracle": oracle(scenario)}
    db = {"Neon Launch": neon(scenario), "Neon Scale": neon(scenario, "0.222"),
          "Supabase": supabase(scenario)}
    results.append({
        "assumptions": scenario,
        "applications": {key: serial_parts(parts) for key, parts in app.items()},
        "databases": {key: serial_parts(parts) for key, parts in db.items()},
        "six_combinations": {f"{a} + {d}": money(sum(ap.values()) + sum(dp.values()))
                             for a, ap in app.items() for d, dp in db.items() if d != "Neon Scale"},
        "neon_scale_combinations_before_fixed_egress_or_private_network": {
            f"{a} + Neon Scale": money(sum(ap.values()) + sum(db["Neon Scale"].values()))
            for a, ap in app.items()},
        "google_application_concurrency_sensitivity": {
            str(c): money(sum(google(scenario, c).values())) for c in (1, 5, 10)},
    })

# Independent published examples/edge cases, not implementation-mirroring app tests.
assert workers(15_000_000, 15_000_000 * 7) == D("8.00")
assert sum(supabase(SCENARIOS[0]).values()) == D("130.0480")
assert google_egress(1024) == D("122.88")
assert google_egress(2000) == D("230.24")
assert sum(neon(SCENARIOS[0]).values()) == D("11.150")

document = {
    "as_of": "2026-11-02", "currency": "USD", "hours_per_month": 730,
    "evidence_kind": "published-price arithmetic with hypothetical usage; NOT measured capacity or full invoice",
    "matched_scope": "one production API + one PostgreSQL project + 7-day PITR + modeled API/DB egress",
    "exclusions": [
        "S3 file storage, versions, source-side egress, operations and separate backups",
        "KMS/key vault, protected workload identity, independent recovery journal, mandatory audit logs",
        "diagnostic logs, alerts, scheduler, durable queue, separate privileged worker execution",
        "private endpoints, fixed egress/NAT/IP routing, regional execution guarantees, paid SLA",
        "Auth0, Resend, payment fees, taxes, labor and temporary parallel migration resources",
        "OCI throughput/HA/availability proof; container registry; capacity outside modeled allocations",
    ],
    "common_controls": "Retain existing Auth0, roles/RLS, KMS, S3 versions, deletion isolation and journal. No downgrade approved.",
    "scenarios": results,
    "sensitivities": {
        "initial_neon_025_cu_always_on_730h_launch": money(D("0.25") * HOURS * D("0.106") + D("0.55")),
        "initial_neon_025_cu_always_on_730h_scale": money(D("0.25") * HOURS * D("0.222") + D("0.55")),
        "google_one_always_on_vcpu_half_gib_instance_billing": money(HOURS * 3600 * (D("0.0000216") + D("0.5") * D("0.0000024")) - D("5.22")),
        "verified_oci_free_compute_and_boot_discount_if_all_modeled_resources_qualify": {
            s["name"]: money(sum(oracle(s).values())) for s in SCENARIOS},
        "worker_100m_100ms_cpu_excluding_background": money(workers(100_000_000, 100_000_000 * 100)),
        "supabase_sustained_vs_neon_launch_db_difference": money(sum(neon(SCENARIOS[2]).values()) - sum(supabase(SCENARIOS[2]).values())),
        "supabase_sustained_vs_neon_scale_db_difference": money(sum(neon(SCENARIOS[2], "0.222").values()) - sum(supabase(SCENARIOS[2]).values())),
        "neon_write_history_500_gb_month_growth_db": money(sum(neon({**SCENARIOS[1], "history_gb_month": 500}).values())),
    },
}
print(json.dumps(document, ensure_ascii=False, indent=2))
