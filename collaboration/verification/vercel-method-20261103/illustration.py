"""Illustrate a pricing distinction; this is NOT a complete Rillora migration quote."""
import json
from decimal import Decimal as D, ROUND_HALF_UP

requests = D(100000)
cpu_seconds = requests * D('.01')
memory_gb_seconds = requests * D('.2') * D(2)
cpu = cpu_seconds / 3600 * D('.184')
memory = memory_gb_seconds / 3600 * D('.0152')
invocations = requests / 1000000 * D('.60')
metered_functions = cpu + memory + invocations
pro_fee = D(20)
usage_credit = D(20)
platform = pro_fee + max(D(0), metered_functions - usage_credit)
data_history = 5 * D('.35') + 5 * D('.20')
launch_100 = 100 * D('.106') + data_history
launch_always = D('.25') * 730 * D('.106') + data_history
scale_100 = 100 * D('.222') + data_history

checks = {
    'cpu_and_memory_are_distinct': cpu_seconds == D(1000) and memory_gb_seconds == D(40000),
    'pro_invocations_have_no_assumed_free_million': invocations == D('.06'),
    'metered_function_example': metered_functions == D('.28'),
    'credit_not_double_charged': platform == D(20),
    'credit_not_cash_or_database_credit': platform + launch_100 == D('33.35'),
    'current_loop_sensitivity': platform + launch_always == D('42.095'),
    'scale_storage_history_case': scale_100 == D('24.95'),
}
assert all(checks.values()), checks

def display(n):
    return str(n.quantize(D('.01'), rounding=ROUND_HALF_UP))

print(json.dumps({
    'date': '2026-11-03', 'currency': 'USD',
    'scope': 'Counterexample to treating a costly VPN topology as the cost of every provider. Core illustration only, not approved deployment or security equivalence.',
    'assumptions': {
        'oneNewIndependentProTeamDeployingSeat': True,
        'functionRegion': 'fra1', 'requestsPerMonth': 100000,
        'activeCpuSecondsPerRequest': '.01', 'lifetimeSecondsPerRequest': '.2',
        'allocatedMemoryGB': 2, 'overlappingRequestsAssumed': 1,
        'additionalBuildLoggingQueueTrafficUsage': 'not measured, excluded, not assumed free',
        'databaseDataGbMonth': 5, 'databaseHistoryGbMonth': 5,
        'databaseActiveCuHours': 100,
        'databaseNetwork': 'Public endpoint with verified TLS and authenticated roles; no IP allowlist on Launch; differs from current private database control',
        'onDemandBackgroundRefactor': 'required, not implemented',
    },
    'functionMeteredBeforeCredit': {'cpu': str(cpu), 'memory': str(memory), 'invocations': str(invocations), 'sum': str(metered_functions)},
    'coreDisplayUsd': {'vercelPlatform': display(platform), 'neonLaunch100CuHours': display(launch_100), 'combinedCoreOnly': display(platform+launch_100), 'combinedCoreIfNeonAlways025Cu': display(platform+launch_always)},
    'completeRilloraMonthlyTotalUsd': None,
    'nativePrivateLink': {
        'availableOn': ['Pro', 'Enterprise'],
        'advancedNetworkingBaseFeeUsd': None,
        'firstConnection': 'included with Advanced Networking, not proven free with base Pro',
        'additionalConnectionMonthlyUsd': '30', 'transferUsdPerGB': '.04',
        'connectionCountAndBillingScope': 'unconfirmed for exact Neon project and separated app/deletion identities',
        'formula': 'Pro + AdvancedNetworkingBase + 30*max(connections-1,0) + 0.04*transferGB + Neon + other actual usage',
        'doNotAutomaticallyAdd': ['Static IPs add-on', 'AWS raw endpoint charges', 'site-to-site VPN', 'three always-on helper servers'],
    },
    'limits': {'vercelFunctionPayloadMB': '4.5', 'currentRilloraFileMiB': 8, 'proCronMinimumSeconds': 60, 'currentAppleRetrySeconds': 30},
    'checks': checks, 'actualDeployment': False, 'actualCharge': False,
}, ensure_ascii=False, indent=2))
