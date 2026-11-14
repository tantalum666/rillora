#!/usr/bin/env python3
"""Full AWS hosting scenarios, not measured user capacity or a spending commitment."""
from decimal import Decimal as D, ROUND_HALF_UP
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT/'collaboration/verification/five-provider-decision-20261103/model.json'
raw = json.loads(BASE.read_text())
base = {k:D(v) for k,v in raw['scenarios']['aws_target']['rows'].items()}
hours = D(730)
small_task_hour = D('.25')*D('.03725')+D('.5')*D('.00409')+D('.005')


def scenario(*, api_tasks, task_cpu, task_memory, db_hour, db_gb, db_storage,
             backup_paid_gb, requests, gateway_units, discovery_calls, objects_gb,
             puts, gets, crypto, secret_reads, journal_writes, journal_reads,
             journal_history_gb, logs_gb, custom_metrics, alarms, metric_reads,
             worker_runs, registry_gb, network_allowance, edge_allowance, viewer_egress_gb):
    rows = dict(base)
    rows.update({
        'api_compute_ipv4': D(api_tasks)*hours*(D(task_cpu)*D('.03725')+D(task_memory)*D('.00409')+D('.005')),
        'database_compute_disks': hours*D(db_hour)+D(48)*D('.019')+D(db_gb)*D(db_storage)+D(20)*D('.137'),
        'native_database_backups': D(backup_paid_gb)*D('.103'),
        'secrets': D(28)*D('.4')+D(secret_reads)*D('.000005'),
        'keys': D(6)+max(D(0),D(crypto)-D(20000))*D('.000003'),
        'objects_versions_archives': D(objects_gb)*D('.0245')+D(puts)*D('.0000054')+D(gets)*D('.00000043'),
        'journal_and_mcp': D(journal_writes)*D('.0000007625')+D(journal_reads)*D('.0000001525')+D(journal_history_gb)*D('.2448'),
        'observability': max(D(0),D(custom_metrics)-D(10))*D('.3')+max(D(0),D(alarms)-D(10))*D('.1')+D(metric_reads)*D('.00001')+max(D(0),D(logs_gb)-D(5))*(D('.63')+D('.0324')),
        'bounded_deletion_worker_ipv4': D(worker_runs)*D(120)/D(3600)*small_task_hour,
        'durable_scheduling': (D(8760)*D(3)+D(worker_runs)*D(4)-D(4000))*D('.000025'),
        'public_gateway': D(gateway_units)*D('.0000012'),
        'private_dns_discovery': D(4)*D('.5')+D(api_tasks+1)*D('.1')+D(discovery_calls)*D('.000001'),
        'registry': D(registry_gb)*D('.1'),
        'monthly_restore_drill': D(2)*D(db_hour)+D(db_gb)*D(db_storage)*D(2)/hours+D(2)*small_task_hour,
        'cross_az_transfer_allowance': D(network_allowance),
        'edge_static_egress_build_support': D(edge_allowance),
    })
    return {'inputs': {'requests':requests,'apiTasks':api_tasks,'apiCpu':task_cpu,'apiMemoryGiB':task_memory,
                      'databaseHourlyUSD':db_hour,'databaseAllocatedGiB':db_gb,'storageRate':db_storage,
                      'nativeBackupBilledGiB':backup_paid_gb,'gatewayBilledUnits':gateway_units,
                      'cloudMapCalls':discovery_calls,'objectAndArchiveGB':objects_gb,'cryptoCalls':crypto,
                      'objectPutRequests':puts,'objectGetRequests':gets,'metricReadRequests':metric_reads,
                      'secretReads':secret_reads,'journalWriteUnits':journal_writes,'journalReadUnits':journal_reads,
                      'journalPitrGB':journal_history_gb,'logIngestAndStoredGB':logs_gb,'customMetrics':custom_metrics,
                      'alarms':alarms,'boundedWorkerRuns':worker_runs,'registryGB':registry_gb,
                      'workerSecondsPerRun':120,'productionHours':730,'previewHours':48,
                      'cloudfrontViewerEgressGB':viewer_egress_gb,'otherInternetEgressGB':10,
                      'crossAZAllowanceUSD':network_allowance,'extraEdgeAllowanceUSD':edge_allowance},
            'rows':rows,'total':sum(rows.values())}


moderate = scenario(api_tasks=2,task_cpu='.25',task_memory='.5',db_hour='.037',db_gb=40,db_storage='.137',
    backup_paid_gb=40,requests=1000000,gateway_units=2500000,discovery_calls=1250000,objects_gb=500,
    puts=100000,gets=1000000,crypto=3000000,secret_reads=200000,journal_writes=4000000,journal_reads=4000000,
    journal_history_gb=5,logs_gb=10,custom_metrics=16,alarms=26,metric_reads=5000,worker_runs=3000,registry_gb=5,
    network_allowance=2,edge_allowance=0,viewer_egress_gb=100)
resilient = scenario(api_tasks=3,task_cpu='.5',task_memory='1',db_hour='.149',db_gb=100,db_storage='.274',
    backup_paid_gb=60,requests=10000000,gateway_units=25000000,discovery_calls=11000000,objects_gb=2048,
    puts=500000,gets=5000000,crypto=15000000,secret_reads=300000,journal_writes=10000000,journal_reads=20000000,
    journal_history_gb=10,logs_gb=50,custom_metrics=24,alarms=30,metric_reads=20000,worker_runs=10000,registry_gb=10,
    network_allowance=10,edge_allowance=3,viewer_egress_gb=500)

assert moderate['rows']['secrets']>=base['secrets']
assert moderate['rows']['keys']==D('14.940000')
assert resilient['rows']['database_compute_disks']==D('139.822')
assert moderate['total']>sum(base.values()) and resilient['total']>moderate['total']
assert moderate['rows']['preview_compute_ipv4']==base['preview_compute_ipv4']
assert all(value>=0 for item in [moderate,resilient] for value in item['rows'].values())

result = {
    'priceDate':'2026-11-04','currency':'USD before tax','scope':'complete AWS hosting only; no new subscription or growth deployment',
    'baselineTargetUSD':str(sum(base.values())),
    'conditions':['Preview48h and bounded workers are target adaptations, not currently deployed',
                  'RDS prices verified from Frankfurt offer; micro.019,smallSingle.037,mediumMulti.149',
                  'shared rate limits and repeated-job coordination must pass before multiple API replicas',
                  'Dynamo read/write budgets include future separate shared-limit counters; no Redis purchase is assumed',
                  'Viewer egress100/500GB stays within the account CloudFront1TB allowance; other Internet egress10GB stays within applicable100GB allowance',
                  'seven-day DB and35-day journal recovery retained; no master key or credential consolidation',
                  'two-hour monthly restore drill; preview disk/storage retained while stopped',
                  'request scenarios do not establish monthly active user capacity',
                  'third-party identity/email subscriptions, domain, Apple membership, transaction fees and labor are outside AWS',
                  'traffic/cross-AZ allowances are explicit planning reserves, not observed bills'],
    'checks':6,
    'scenarios':{'moderate_1m_requests':moderate,'resilient_10m_requests':resilient},
}
for name,item in result['scenarios'].items():
    item['totalRounded']=str(item['total'].quantize(D('.01'),rounding=ROUND_HALF_UP))
    item['total']=str(item['total']);item['rows']={k:str(v) for k,v in item['rows'].items()}
print(json.dumps(result,indent=2))
