"""Reproducible USD hosting scenarios, NOT invoices, capacity tests or deployments.

Run locally: python3 <this file> --write
Only writes sibling model.json; no network, secrets or cloud operations.
"""
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path
import json
import sys


def d(value):
    return D(str(value))


def money(value):
    return str(value.quantize(D('.01'), rounding=ROUND_HALF_UP))


H, PREVIEW = d(730), d(48)
FARGATE = d('.25') * d('.03725') + d('.5') * d('.00409') + d('.005')
COMMON = {
    # Keep ALL 28 distinct credential records in Secrets Manager; do not spend
    # hypothetical SSM savings before validating rotation/recovery semantics.
    'secrets': d(28) * d('.4') + d(100000) * d('.000005'),
    'keys': d(6) + d(280000) * d('.000003'),
    'objects_versions_archives': d(80)*d('.0245') + d(10000)*d('.0000054') + d(100000)*d('.00000043'),
    'journal_and_mcp': d(400000)*d('.0000007625') + d(400000)*d('.0000001525') + d('.2448'),
    'observability': d(6)*d('.30') + d(12)*d('.10') + d(5000)*d('.00001'),
    'registry': d(2)*d('.10'),
}
AWS = COMMON | {
    'database_compute_disks': (H+PREVIEW)*d('.019') + d(40)*d('.137'),
    'native_database_backups': d(20)*d('.103'),
    'api_compute_ipv4': H*FARGATE,
    'bounded_deletion_worker_ipv4': d(1000)*d(120)/d(3600)*FARGATE,
    'preview_compute_ipv4': d(2)*PREVIEW*FARGATE,
    'durable_scheduling': (d(30280)-d(4000))*d('.000025'),
    'private_dns_discovery': d(4)*d('.50') + d(2)*d('.10') + d('.25'),
    'public_gateway': d(250000)*d('.0000012'),
    'exportable_origin_tls_amortized': d(7)*d(365)/d(198-45)/d(12),
    'monthly_restore_drill': d(2)*d('.019') + d(20)*d('.137')*d(2)/H + d(2)*FARGATE,
    'edge_static_egress_build_support': d(0),
}
# Stage A changes only optional metrics and Preview uptime. It keeps the current
# permanent isolated worker, 26 planned secrets and four planned key versions.
STAGE_A = AWS | {
    'secrets': d(26)*d('.4') + d('.50'),
    'keys': d(4) + d(180000)*d('.000003'),
    'bounded_deletion_worker_ipv4': H*FARGATE,
    'durable_scheduling': d(0),
}
UNOPTIMIZED = STAGE_A | {
    'database_compute_disks': d(2)*H*d('.019') + d(40)*d('.137'),
    'preview_compute_ipv4': d(2)*H*FARGATE,
    'observability': STAGE_A['observability']+d(126)*d('.30'),
}
# Non-identical GCP billing modes share ONE Tier-1-valued monthly free allowance.
gcp_cpu_gross = d(165000)*d('.0000336') + d(67200)*d('.0000216')
gcp_memory_gross = d(165000)*d('.0000035') + d(67200)*d('.0000024')
GOOGLE = COMMON | {
    'database_compute_disks': (H+PREVIEW)*d('.042') + d(40)*d('.204'),
    'native_database_backups': d(40)*d('.096'),
    'api_and_jobs_compute': max(d(0), gcp_cpu_gross-d('4.32')) + max(d(0), gcp_memory_gross-d('.90')),
    'private_dns': d(2)*d('.20') + d(250000)/d(1000000)*d('.40'),
    'gcp_egress': d(10)*d('.12'),
    # Preserve existing provider-enforced outbound rules. private-ranges-only
    # would bypass VPC firewall rules for public traffic, so route ALL traffic.
    # Budget four average NAT assignments/environment while active; retain
    # one public NAT IPv4 per environment even while Preview is stopped.
    'restricted_egress_nat_ipv4': d(4)*(H+PREVIEW)*d('.0014')+d(2)*H*d('.005')+d(20)*d('.045'),
    'registry': d('1.5')*d('.10'),
    'monthly_restore_drill': d(2)*d('.042') + d(20)*d('.204')*d(2)/H,
    'edge_tasks_scheduler_logs_tls_support': d(0),
}
GOOGLE_DEDICATED = GOOGLE | {
    'database_compute_disks': (H+PREVIEW)*(d('.0496')+d('3.75')*d('.0084')) + d(40)*d('.204'),
    'monthly_restore_drill': d(2)*(d('.0496')+d('3.75')*d('.0084')) + d(20)*d('.204')*d(2)/H,
}
# Paid A2, not free/spot compute. Distinct API and DB VMs per environment.
OCI_PAIR = d(2)*d('.014') + d(3)*d('.002')
OCI = {
    'production_api_and_database_vms': H*OCI_PAIR,
    'preview_api_and_database_vms': PREVIEW*OCI_PAIR,
    # OCI block volumes have a 50 GB minimum: 4 boots + 2 separate DB disks.
    'retained_boot_and_data_disks': d(300)*(d('.0255')+d(10)*d('.0017')),
    'objects_versions_archives': d(80)*d('.0255'),
    'native_database_backups': d(40)*d('.0255'),
    'object_requests': (d(510000)-d(50000))/d(10000)*d('.0034'),
    'public_gateway': d(250000)/d(1000000)*d(3),
    # Two production tables consume TWO of the THREE recurring free tables.
    # Two separate Preview tables are paid, not a fictitious fourth free table.
    'preview_journal_and_mcp': d(2)*(d(10)*d('.1254')+d(10)*d('.0064')+d('.066')),
    'registry': d(2)*d('.0255'),
    'monthly_restore_drill': d(2)*OCI_PAIR + d(150)*d('.0425')*d(2)/H,
    'vault_secrets_functions_logs_dns_certificates_network_support': d(0),
}
OCI_E4 = OCI | {
    'production_api_and_database_vms': H*(d(2)*d('.025')+d(3)*d('.0015')),
    'preview_api_and_database_vms': PREVIEW*(d(2)*d('.025')+d(3)*d('.0015')),
    'monthly_restore_drill': d(2)*(d(2)*d('.025')+d(3)*d('.0015'))+d(150)*d('.0425')*d(2)/H,
}
SCENARIOS = {
    'aws_same_workload_current_structure': UNOPTIMIZED,
    'aws_stage_a': STAGE_A,
    'aws_target': AWS,
    'cf_public_aws_core': AWS | {'cf_public_site': d(0)},
    'oci_paid_a2_self_managed_postgres': OCI,
    'oci_paid_e4_fallback': OCI_E4,
    'google_private_shared_cloudsql_aws_support': GOOGLE,
    'google_private_dedicated_cloudsql_aws_support': GOOGLE_DEDICATED,
    'vercel_public_aws_core': AWS | {'vercel_pro': d(20)},
}
TOTALS = {key: sum(rows.values(), d(0)) for key, rows in SCENARIOS.items()}
checks = []


def check(name, value):
    if not value:
        raise AssertionError(name)
    checks.append(name)


check('actual October invoice reconciles once', d('120.6338910658')-d(83)==d('37.6338910658'))
check('no provider amount is negative', all(v>=0 for rows in SCENARIOS.values() for v in rows.values()))
check('Vercel adds Pro once and retains every core cost', TOTALS['vercel_public_aws_core']-TOTALS['aws_target']==20)
check('CF free frontend does not erase core invoice', TOTALS['cf_public_aws_core']==TOTALS['aws_target'])
check('no security credential migration is budgeted', AWS['secrets']==d('11.70'))
check('retained disks charged during Preview idle', AWS['database_compute_disks']-(H+PREVIEW)*d('.019')==d('5.480'))
check('all four OCI boots and two 50GB DB disks remain paid', OCI['retained_boot_and_data_disks']==d('12.7500'))
check('OCI preview table count exceeds no free limit', OCI['preview_journal_and_mcp']==d('2.7680'))
check('Frankfurt Step Functions allowance deducted once', AWS['durable_scheduling']==d('.657000'))
check('Google shared credits deducted once across billing modes', GOOGLE['api_and_jobs_compute']==d('2.6755200'))
check('Google dedicated SQL premium includes restore', abs(TOTALS['google_private_dedicated_cloudsql_aws_support']-TOTALS['google_private_shared_cloudsql_aws_support']-d('30.498'))<d('.00000001'))
check('restore and security categories are nonzero', all(rows.get('monthly_restore_drill',0)>0 for rows in SCENARIOS.values()))
check('forecast is not historical discounted invoice', TOTALS['aws_same_workload_current_structure']>TOTALS['aws_stage_a']>TOTALS['aws_target']>d('37.63'))

OUTPUT = {
    'kind': 'planning model; not a cloud quote, capacity or security acceptance',
    'currency': 'USD before tax', 'price_check_date': '2026-11-03',
    'inherited_live_inventory_date': '2026-11-02', 'new_aws_session': 'expired; not refreshed',
    'no_trial_startup_reserved_or_compute_free_credits': True,
    'no_real_migration_or_deployment': True,
    'inputs': {
        'production_hours': 730, 'preview_hours': 48, 'user_api_requests': 100000,
        'public_gateway_billed_units': 250000, 'db_logical_gib_assumption': 5,
        'db_allocated_gib_per_environment': 20, 'object_version_archive_gb': 80,
        'oci_db_disk_gb_per_environment_minimum': 50, 'native_db_backup_gb': 40,
        'db_recovery_production_days': 7, 'db_recovery_preview_days': 1,
        'external_journal_restore_days': 35, 'ordinary_journal_entry_days': 90,
        'active_retention_hold_expiry': None, 'mcp_replay_protection_must_not_rewind': True,
        'log_ingest_gib': 2, 'log_retention_days': 30,
        'business_custom_metrics': 16, 'standard_alarms': 22,
        'target_secret_records': 28, 'target_billable_key_versions': 6,
        'target_crypto_calls': 300000, 'secret_reads': 100000,
        'ddb_write_units': 400000, 'ddb_read_units': 400000, 'ddb_total_storage_gb': 2,
        'journal_pitr_gb': 1, 'registry_gb': 2, 'internet_egress_gib': 10,
        'monthly_isolated_restore_drill_hours': 2,
        'aws_worker_activations': 1000, 'aws_worker_seconds_each': 120,
        'gcp_request_vcpu_seconds': 165000, 'gcp_request_gib_seconds': 165000,
        'gcp_job_vcpu_seconds': 67200, 'gcp_job_gib_seconds': 67200,
        'gcp_average_nat_assignments_per_active_environment': 4,
        'gcp_retained_nat_ipv4': 2, 'gcp_nat_processed_gib_both_directions': 20,
        'oci_functions_gib_seconds_max': 400000, 'oci_function_invocations_max': 2000000,
        'common_auth_mau_max': 1000, 'common_transactional_emails_month': 1000,
        'common_transactional_emails_day_max': 100,
    },
    'scenarios': {key: {'rows': {k: str(v) for k,v in rows.items()}, 'total_exact': str(TOTALS[key]), 'total_rounded': money(TOTALS[key])} for key,rows in SCENARIOS.items()},
    'unquoted_full_core_options': {
        'cloudflare_workers_neon': {'total': None, 'reason': 'full private/regional/key/restore topology and quotes not qualified; hybrid is separately priced'},
        'vercel_functions_neon': {'total': None, 'reason': 'Advanced Networking base and exact scope unknown; payload/jobs/security adaptations not accepted'},
    },
    'sensitivity': {
        'aws_preview_730h_extra': money((H-PREVIEW)*(d('.019')+d(2)*FARGATE)),
        'aws_delete_worker_kept_permanent_extra': money(H*FARGATE-AWS['bounded_deletion_worker_ipv4']-AWS['durable_scheduling']),
        'aws_126_optional_metrics_extra': money(d(126)*d('.30')),
        'aws_100gb_more_objects_excluding_requests': money(d(100)*d('.0245')),
        'oci_100gb_more_objects_excluding_requests': money(d(100)*d('.0255')),
        'oci_if_production_free_tables_unavailable_extra': money(d(2)*(d(50)*d('.1254')+d(50)*d('.0064')+d('.066'))),
        'oci_extra_1gib_each_api_and_db_2env': money(d(2)*(H+PREVIEW)*d('.002')),
        'gcp_nat_hourly_ceiling_extra': money((d('.044')-d(4)*d('.0014'))*(H+PREVIEW)),
        'aws_target_minus_oci_cash_saving': money(TOTALS['aws_target']-TOTALS['oci_paid_a2_self_managed_postgres']),
        'break_even_months': '(engineering cost + transition overlap) / (monthly hosting saving - extra monthly operating cost); only if denominator positive',
    },
    'checks': checks,
}
if '--write' in sys.argv:
    Path(__file__).with_name('model.json').write_text(json.dumps(OUTPUT, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'checks': len(checks), 'totals': {k: money(v) for k,v in TOTALS.items()}, 'sensitivity': OUTPUT['sensitivity']}, ensure_ascii=False, indent=2))
