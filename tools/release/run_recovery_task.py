#!/usr/bin/env python3
"""Run/check a scoped production maintenance task without retrieving credentials."""
import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
import re
import uuid
from recovery_drill import Aws,ACCOUNT,validate_state,validate_target,validate_snapshot,require,save

MIGRATION_COMMAND = json.loads((Path(__file__).resolve().parents[1] / 'maintenance-broker/production-migration.json').read_text())

def recorded_time(value, label):
    require(isinstance(value, str), label + ' is missing or invalid')
    try:
        result = datetime.fromisoformat(value)
    except ValueError:
        raise ValueError(label + ' is missing or invalid') from None
    require(result.tzinfo is not None, label + ' must include a timezone')
    return result


def ambiguous_request(prior):
    request = prior.get('request')
    require(isinstance(request, dict), 'Missing saved request; investigate the original invocation')
    at = recorded_time(prior.get('requestedAt'), 'Recorded invocation time')
    # ECS expires RunTask tokens at the earlier of 24h or task lifetime + 1h.
    # With no task ARN, use a conservative window from the original request.
    # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_Idempotency.html
    require(0 <= (datetime.now(timezone.utc) - at).total_seconds() < 55 * 60,
            'Uncertain invocation is outside the safe idempotency window; investigate it before another run')
    token = prior.get('clientToken')
    require(isinstance(token, str) and re.fullmatch(r'[a-f0-9]{32}', token) is not None
            and request.get('clientToken') == token, 'The saved request lost its exact client token')
    return request


def original_freeze(request):
    try:
        containers = request['overrides']['containerOverrides']
        require(isinstance(containers, list) and len(containers) == 1, 'Invalid saved request containers')
        environment = containers[0]['environment']
        require(isinstance(environment, list), 'Invalid saved request environment')
        values = [item.get('value') for item in environment if isinstance(item, dict)
                  and item.get('name') == 'RECOVERY_SOURCE_FROZEN_AT']
        require(len(values) == 1, 'The saved request lacks exact source-freeze evidence')
    except (KeyError, TypeError):
        raise ValueError('Invalid saved request source-freeze evidence') from None
    frozen = recorded_time(values[0], 'Recorded source-freeze time')
    require(0 <= (datetime.now(timezone.utc) - frozen).total_seconds() < 8 * 60,
            'The saved request source-freeze evidence expired; investigate before another run')
    return values[0]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation',choices=['migrate','initialize','seed','after-snapshot','restore','reconcile-commerce','isolation','cleanup-fixtures','check'])
    parser.add_argument('--state',type=Path,required=True)
    parser.add_argument('--profile',default='rillora-production-operator')
    parser.add_argument('--phase',help='Existing phase to inspect with check')
    parser.add_argument('--report',type=Path)
    parser.add_argument('--retry-failed',action='store_true',help='Retry only after AWS confirms the prior task stopped unsuccessfully')
    args=parser.parse_args()
    state=json.loads(args.state.read_text());validate_state(state)
    aws=Aws(args.profile)
    identity=aws.call('sts','get-caller-identity')
    require(identity['Account']==ACCOUNT and ':assumed-role/rillora-production-operator/' in identity['Arn'],'Use the scoped production operator')
    stack=aws.call('cloudformation','describe-stacks',{'StackName':'RilloraProduction'})['Stacks'][0]
    require(stack['StackStatus'] in ['CREATE_COMPLETE','UPDATE_COMPLETE'],'Foundation update is incomplete')
    out={v['OutputKey']:v['OutputValue'] for v in stack['Outputs']}
    require(out['ProductionTrafficReady']=='false','This fixture task is only for the closed foundation')
    tasks=state.setdefault('maintenanceTasks',{})
    if args.operation=='check':
        require(args.phase in tasks,'No recorded task for this phase')
        prior=tasks[args.phase]
        require('arn' in prior,'Uncertain invocation: re-run the same phase to reconcile its saved idempotent request')
        response=aws.call('ecs','describe-tasks',{'cluster':out['ClusterName'],'tasks':[prior['arn']]})
        require(not response.get('failures') and len(response.get('tasks',[]))==1,'Recorded task is unavailable')
        task=response['tasks'][0];container=task['containers'][0]
        report={'taskArn':task['taskArn'],'phase':args.phase,'status':task['lastStatus'],
                'exitCode':container.get('exitCode'),'imageDigest':container.get('imageDigest'),
                'stoppedReason':task.get('stoppedReason'),'checkedAt':datetime.now(timezone.utc).isoformat()}
        if task['lastStatus']=='STOPPED':
            prefix='recovery' if args.phase in ['restore','reconcile-commerce','isolation'] else 'migration'
            stream=prefix+'/Maintenance/'+task['taskArn'].rsplit('/',1)[1]
            logs=aws.call('logs','get-log-events',{'logGroupName':out['MaintenanceLogGroup'],'logStreamName':stream,'startFromHead':True})
            report['messages']=[e['message'] for e in logs['events']]
            report['taskSucceeded']=container.get('exitCode')==0
        if args.report:
            save(args.report,report)
        prior['lastCheck']=report
        save(args.state,state)
        print(json.dumps(report))
        return
    pending_request = None
    require('.local-secrets' in args.state.resolve().parts and re.fullmatch(r'[A-Za-z0-9_-]{43}',state.get('runToken','')) is not None,
            'Maintenance writes require the protected per-run capability')
    def run_task(payload):
        return aws.invoke_broker(out['MaintenanceBrokerFunctionName'],{'operation':'task','run':state['run'],
                                 'runToken':state['runToken'],'request':payload})
    if args.operation in tasks:
        prior=tasks[args.operation]
        if 'arn' not in prior:
            pending_request = ambiguous_request(prior)
        else:
            require(args.retry_failed,'A task is already recorded; check it before retrying')
            prior_task=aws.call('ecs','describe-tasks',{'cluster':out['ClusterName'],'tasks':[prior['arn']]})['tasks'][0]
            require(prior_task['lastStatus']=='STOPPED' and prior_task['containers'][0].get('exitCode')!=0,'Prior task is running or succeeded; duplicate refused')
            state.setdefault('previousMaintenanceAttempts',[]).append({'phase':args.operation,**prior})
    environment=[{'name':'RECOVERY_RUN','value':state['run']}]
    recovery=args.operation in ['restore','reconcile-commerce','isolation']
    if args.operation in ['restore','reconcile-commerce']:
        target=aws.database(state['target']);require(target is not None,'Recovery target is missing');validate_target(target,state)
        require(target['DBInstanceStatus']=='available','Recovery target is not available')
        snapshot=aws.snapshot(state['snapshot']);require(snapshot is not None and snapshot['Status']=='available','Snapshot is unavailable')
        validate_snapshot(snapshot, state)
        environment += [{'name':'DATABASE_HOST','value':target['Endpoint']['Address']},
                        {'name':'RECOVERY_SNAPSHOT_TIME','value':snapshot['SnapshotCreateTime']}]
    if args.operation=='reconcile-commerce':
        services=json.loads(out.get('RecoverySourceServiceNames','[]'))
        require(isinstance(services,list) and 0<len(services)<=10
                and all(isinstance(name,str) and name for name in services)
                and len(set(services))==len(services),'Expected exact production source services')
        source=aws.call('ecs','describe-services',{'cluster':out['ClusterName'],'services':services})
        rows=source.get('services',[])
        require(not source.get('failures') and len(rows)==len(services)
                and {row.get('serviceName') for row in rows}==set(services),'Source service state unavailable')
        require(all(row.get('desiredCount')==0 and row.get('runningCount')==0 and row.get('pendingCount')==0 for row in rows),
                'Stop and verify source writers before provider recovery; this tool never stops them automatically')
        environment.append({'name':'RECOVERY_SOURCE_FROZEN_AT','value':original_freeze(pending_request) if pending_request is not None else datetime.now(timezone.utc).isoformat()})
    if args.operation=='after-snapshot':
        snapshot=aws.snapshot(state['snapshot'])
        require(snapshot is not None and snapshot['Status']=='available','Do not apply later changes before the baseline snapshot is available')
        validate_snapshot(snapshot, state)
    command=['node','dist/recovery-admin.js',args.operation]
    if args.operation=='reconcile-commerce':command=['node','dist/recovery-commerce-admin.js']
    if args.operation=='isolation':
        environment.append({'name':'RECOVERY_SOURCE_HOST','value':out['DatabaseHost']})
        command=['node','--input-type=module','-e',Path(__file__).with_name('probe_recovery_isolation.mjs').read_text()]
    if args.operation=='migrate':
        command=MIGRATION_COMMAND
    token=pending_request['clientToken'] if pending_request is not None else uuid.uuid4().hex
    # Save the idempotency token before the request; an uncertain invocation is
    # investigated by this token, never retried as a second unrecorded mutation.
    payload={'cluster':out['ClusterName'],
        'taskDefinition':out['RecoveryTaskDefinitionArn' if recovery else 'MigrationTaskDefinitionArn'],
        'launchType':'FARGATE','clientToken':token,
        'networkConfiguration':{'awsvpcConfiguration':{'subnets':out['MaintenanceSubnetIds'].split(','),
            'securityGroups':[out['RecoverySecurityGroupId' if recovery else 'MigrationSecurityGroupId']], 'assignPublicIp':'ENABLED'}},
        'overrides':{'containerOverrides':[{'name':'Maintenance','command':command,'environment':environment}]}}
    if pending_request is not None:
        require(pending_request == payload, 'The saved request no longer matches the current scoped operation; investigate it')
        response=run_task(pending_request)
        require(not response.get('failures') and len(response.get('tasks',[]))==1,'Saved request did not resolve to one task')
        prior['arn']=response['tasks'][0]['taskArn'];save(args.state,state)
        print(json.dumps({'phase':args.operation,'taskArn':prior['arn'],'reconciledSameRequest':True}))
        return
    tasks[args.operation]={'clientToken':token,'requestedAt':datetime.now(timezone.utc).isoformat(),'request':payload}
    save(args.state,state)
    response=run_task(payload)
    require(not response.get('failures') and len(response.get('tasks',[]))==1,'Maintenance task was not started')
    task=response['tasks'][0];tasks[args.operation]['arn']=task['taskArn'];save(args.state,state)
    print(json.dumps({'phase':args.operation,'taskArn':task['taskArn'],'status':task['lastStatus']}))


if __name__=='__main__':
    main()
