"""Planning arithmetic for preserving existing boundaries; not a live invoice.

Published Frankfurt rate evidence and assumptions are documented separately.
Q_region is deliberately unknown, not zero. No provider is contacted.
"""
import json
from decimal import Decimal as D

hours = D(730)
# Current Neon guide lists eight Frankfurt endpoint services and says to add all.
# A one-service subset is a sensitivity only, pending explicit provider support.
endpoint_services = 8
task = hours * (D('.25') * D('.03725') + D('.5') * D('.00409') + D('.005'))
parts = {
    'workers_paid_budget': D(5),
    'neon_scale_025_cu_always_on': D('.25') * hours * D('.222'),
    'neon_data_5_gb_month': 5 * D('.35'),
    'neon_7_day_history_5_gb_month': 5 * D('.20'),
    'aws_privatelink_eight_services_one_frankfurt_az': endpoint_services * hours * D('.012'),
    'private_transfer_10_gb_each_provider': 10 * (D('.01') + D('.01')),
    'private_connector': task,
    'bounded_key_provider_gateway': task,
    'isolated_identity_deletion_worker': task,
    'two_billable_kms_key_versions': D(2),
    'kms_200k_symmetric_requests_after_20k_allowance': 180000 * D('.000003'),
    'fifteen_separate_secret_records': 15 * D('.40'),
    'ten_thousand_secret_api_calls': 10000 * D('.000005'),
    's3_versions_backups_logs_total_22_gb_month': 22 * D('.0245'),
    's3_ten_thousand_writes_hundred_thousand_reads': 10000 * D('.0000054') + 100000 * D('.00000043'),
    'monitoring_budget_allowance': D(3),
    'journal_queue_lambda_budget_allowance': D(1),
    'isolated_restore_drill_budget_allowance': D(1),
}
assert task == D('11.9409750')
assert parts['aws_privatelink_eight_services_one_frankfurt_az'] == D('70.08')
assert sum(parts.values()) == D('168.59392500')
result = {
    'date': '2026-11-02', 'currency': 'USD', 'monthHours': 730,
    'scope': 'one conservative post-cutover production hosting design; NOT the lowest possible architecture or capacity proof',
    'assumptions': {
        'monthlyApiRequests': 100000, 'workersCpuMsPerRequest': 10,
        'neonCUs': 0.25, 'neonActiveHours': 730,
        'dataGbMonth': 5, 'retainedWalGbMonth': 5, 'restoreDays': 7,
        'privateTransferEachProviderGb': 10,
        'privateEndpointServices': 8,
        'privateEndpointAvailabilityZones': 1,
        'endpointCountBasis': 'Current Neon private-networking guide lists eight eu-central-1 services and instructs adding all. A project-specific subset is not verified.',
        'separateAwsExecutionUnits': ['private connector with no application authority', 'bounded KMS/provider gateway', 'independent identity deletion worker'],
        'executionUnit': 'ARM .25 vCPU / .5 GiB / one public IPv4, no inbound public application listener',
        'secrets': '13 existing functional categories plus 2 new connector/operational records; planning inventory, not a fresh AWS count',
        's3PublicEgress': 'assumed within unused account-wide 100 GB/month allowance; excess adds actual source-side egress',
        'reserveLines': 'monitoring/journal/drill values are budget allowances, not provider flat-price packages',
    },
    'components': {k: float(v) for k, v in parts.items()},
    'pricedSubtotal': float(sum(parts.values())),
    'regionalProcessingAndMetadataControlsQuoteUsd': None,
    'completeTotal': None,
    'totalFormula': '168.593925 + Q_region + usage beyond stated assumptions + tax and any existing non-hosting services',
    'actualNewPaidResourcesThisValidation': False,
    'unimplementedOptimizationSensitivity': {
        'subtotal_if_neon_confirms_one_service_is_sufficient': float(sum(parts.values()) - 7 * hours * D('.012')),
        'neon_100_cu_hours_instead_of_182_5_saving': float((D('182.5') - 100) * D('.222')),
        'one_always_on_unit_removed_with_verified_on_demand_replacement_gross_saving_before_new_usage': float(task),
    },
    'notProven': ['equal protection for this undeployed architecture', 'complete authenticated API acceptance', 'private connectivity', 'paid seven-day restore', 'regional guarantee', 'actual CPU sizing or monthly demand'],
    'transition': 'Existing AWS continues to bill until an authorized, verified cutover and resource retirement; no present savings claimed.',
    'credits': 'No Startup credit is awarded or subtracted. Time-limited credits do not define long-term cost.',
}
print(json.dumps(result, ensure_ascii=False, indent=2))
