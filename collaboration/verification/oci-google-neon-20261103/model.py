"""Verified-unit-price arithmetic, not a complete hosting quote or live benchmark."""
import json
from decimal import Decimal as D, ROUND_HALF_UP

HOURS = D('730')
RATES = {
    'neon_scale_cu_hour': D('.222'),
    'neon_launch_cu_hour': D('.106'),
    'neon_data_gb_month': D('.35'),
    'neon_history_gb_month': D('.20'),
    'aws_frankfurt_interface_endpoint_hour': D('.012'),
    'aws_frankfurt_vpn_connection_hour': D('.05'),
    'aws_public_ipv4_hour': D('.005'),
    'google_frankfurt_vpn_tunnel_hour': D('.06'),
    'oci_a1_ocpu_hour': D('.01'),
    'oci_a1_memory_gb_hour': D('.0015'),
    'oci_block_gb_month': D('.0255'),
    'oci_block_vpu_gb_month': D('.0017'),
    'google_frankfurt_instance_cpu_second': D('.0000216'),
    'google_frankfurt_instance_memory_gib_second': D('.0000024'),
    'google_frankfurt_request_cpu_second': D('.0000336'),
    'google_frankfurt_request_memory_gib_second': D('.0000035'),
}


def cents(n):
    return str(n.quantize(D('.01'), rounding=ROUND_HALF_UP))


def database(cu_hours, data_gb_month, history_gb_month):
    return (D(cu_hours) * RATES['neon_scale_cu_hour']
            + D(data_gb_month) * RATES['neon_data_gb_month']
            + D(history_gb_month) * RATES['neon_history_gb_month'])


db = database('182.5', '5', '5')
aws_vpn = HOURS * (RATES['aws_frankfurt_vpn_connection_hour']
                   + 2 * RATES['aws_public_ipv4_hour'])
google_tunnel = HOURS * RATES['google_frankfurt_vpn_tunnel_hour']
endpoint_one_az = HOURS * RATES['aws_frankfurt_interface_endpoint_hour']


def partial(name, endpoints, aws_connections, google_tunnels):
    components = {
        'database_compute_storage_history': db,
        'neon_interface_endpoints_one_az': endpoints * endpoint_one_az,
        'aws_vpn_connections_including_two_ipv4_each': aws_connections * aws_vpn,
        'google_vpn_tunnels_in_use_no_extra_google_ip_fee': google_tunnels * google_tunnel,
        'oci_vpn_hourly_service_charge': D(0),
    }
    total = sum(components.values())
    return {
        'name': name,
        'scope': 'Database plus chosen managed network fixed charges ONLY; not a minimum possible architecture',
        'endpointCount': endpoints, 'endpointAzCount': 1,
        'awsVpnConnections': aws_connections, 'googleTunnels': google_tunnels,
        'componentsExactUsd': {k: str(v) for k, v in components.items()},
        'pricedPartialExactUsd': str(total), 'pricedPartialDisplayUsd': cents(total),
        'completeMonthlyTotalUsd': None,
        'endToEndSupportedAndValidated': False,
    }


oci_vm = HOURS * (RATES['oci_a1_ocpu_hour'] + 4 * RATES['oci_a1_memory_gb_hour'])
oci_disk = 50 * (RATES['oci_block_gb_month'] + 10 * RATES['oci_block_vpu_gb_month'])
run_one_gross = HOURS * 3600 * (RATES['google_frankfurt_instance_cpu_second']
                               + D('.5') * RATES['google_frankfurt_instance_memory_gib_second'])
# The monetary credit is based on Tier 1 rates, not Frankfurt rates.
# Across two identical instance-billed services, use this allowance once.
run_credit = 240000 * D('.000018') + 450000 * D('.000002')
checks = {
    'neon_always_active_starting_case': db == D('43.265'),
    'one_aws_vpn_includes_both_allocated_public_ips': aws_vpn == D('43.8'),
    'frankfurt_google_not_default_iowa': google_tunnel == D('43.8'),
    'eight_endpoints_one_az': 8 * endpoint_one_az == D('70.08'),
    'oci_single_path_partial': D(partial('', 8, 1, 0)['pricedPartialExactUsd']) == D('157.145'),
    'google_single_path_partial': D(partial('', 8, 1, 1)['pricedPartialExactUsd']) == D('200.945'),
    'google_documented_ha_path_partial': D(partial('', 8, 2, 4)['pricedPartialExactUsd']) == D('376.145'),
    'one_endpoint_sensitivity_is_not_base': 7 * endpoint_one_az == D('61.32'),
    'oci_compute_and_boot_disk': oci_vm + oci_disk == D('13.805'),
    'one_run_service_uses_tier_one_credit': run_one_gross - run_credit == D('54.6984'),
    'two_run_services_share_credit': 2 * run_one_gross - run_credit == D('114.6168'),
    'partial_totals_remain_unknown': all(partial('', 8, a, g)['completeMonthlyTotalUsd'] is None for a, g in [(1, 0), (1, 1), (2, 4)]),
}
assert all(checks.values()), checks

print(json.dumps({
    'asOf': '2026-11-03', 'currency': 'USD', 'planningHours': 730,
    'workload': {'productionEnvironments': 1, 'previewEnvironmentsIncluded': 0,
                 'monthlyApiRequestsForFutureSizingOnly': 100000,
                 'databaseCU': '.25', 'databaseActiveHours': 730,
                 'dataGbMonth': 5, 'retainedWalGbMonth': 5, 'requiredRestoreDays': 7,
                 'capacityMeasured': False},
    'rates': {k: str(v) for k, v in RATES.items()},
    'managedNetworkReferenceCases': [
        partial('OCI single active VPN path reference, no end-to-end HA claim', 8, 1, 0),
        partial('Google Classic single static-route tunnel reference, one used IP, no HA SLA claim', 8, 1, 1),
        partial('Google documented AWS 4-tunnel HA connection; not whole-app SLA', 8, 2, 4),
    ],
    'oneEndpointSensitivityNotProviderConfirmed': [
        partial('OCI if a one-endpoint subset is explicitly supported', 1, 1, 0),
        partial('Google if a one-endpoint subset is explicitly supported', 1, 1, 1),
    ],
    'computeExamplesOnly': {
        'oci_1_ocpu_4_gb_50_gb_balanced_disk_no_allowances': cents(oci_vm + oci_disk),
        'oci_two_such_independent_vms_no_allowances': cents(2 * (oci_vm + oci_disk)),
        'oci_if_all_eligible_allowances_available': '0.00; eligibility/capacity not verified',
        'google_one_continuous_service_1_vcpu_half_gib_with_unused_allowance': cents(run_one_gross-run_credit),
        'google_two_continuous_services_same_spec_shared_allowance': cents(2*run_one_gross-run_credit),
        'google_one_continuous_service_without_allowance': cents(run_one_gross),
        'google_two_continuous_services_without_allowance': cents(2*run_one_gross),
        'google_compute_boundary': 'Ordinary instance-billed services only. Worker pools, Cloud Run instances, bounded requests/jobs and smaller VM choices require separate sizing; this is not the cheapest Google implementation.',
    },
    'databaseGrowthOnly': {
        '100_cu_hours_5_data_5_history': str(database('100','5','5')),
        '1_cu_always_20_data_10_history': str(database('730','20','10')),
        '4_cu_always_100_data_70_history': str(database('2920','100','70')),
        'traffic_included': False,
    },
    'missingFromPartialNotZero': [
        'Application and isolated workers; no automatically added three-unit topology',
        'DNS/SNI and end-to-end vendor support, maintenance and failover validation',
        'Neon/AWS data processing, cross-AZ charges and both sides internet/VPN egress',
        'Custom-domain HTTPS ingress and existing client same-origin requirements',
        'KMS, short-lived workload identity, independent journal/delete authority',
        'Secrets, versioned objects, backups, log retention, alarms, restore drills',
        'Transition overlap, non-hosting services, taxes, support and self-managed operations',
    ],
    'alternativesNotPricedAsValidated': ['Self-managed encrypted tunnel/proxy in AWS', 'Native-provider database instead of Neon', 'Public TLS plus IP allow list is a different security boundary'],
    'providerFreeCreditsApplied': False, 'paidResourcesCreated': False,
    'tests': checks,
}, ensure_ascii=False, indent=2))
