#!/usr/bin/env python3
"""Run/check a scoped production maintenance task without retrieving credentials."""
import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
import uuid
from recovery_drill import Aws,ACCOUNT,validate_state,validate_target,require,save


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation',choices=['migrate','initialize','seed','after-snapshot','restore','isolation','cleanup-fixtures','check'])
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
            prefix='recovery' if args.phase in ['restore','isolation'] else 'migration'
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
    if args.operation in tasks:
        prior=tasks[args.operation]
        if 'arn' not in prior:
            require('request' in prior,'Missing exact request; manual investigation is required')
            response=aws.call('ecs','run-task',prior['request'])
            require(not response.get('failures') and len(response.get('tasks',[]))==1,'Saved request did not resolve to one task')
            prior['arn']=response['tasks'][0]['taskArn'];save(args.state,state)
            print(json.dumps({'phase':args.operation,'taskArn':prior['arn'],'reconciledSameRequest':True}))
            return
        require(args.retry_failed,'A task is already recorded; check it before retrying')
        prior_task=aws.call('ecs','describe-tasks',{'cluster':out['ClusterName'],'tasks':[prior['arn']]})['tasks'][0]
        require(prior_task['lastStatus']=='STOPPED' and prior_task['containers'][0].get('exitCode')!=0,'Prior task is running or succeeded; duplicate refused')
        state.setdefault('previousMaintenanceAttempts',[]).append({'phase':args.operation,**prior})
    environment=[{'name':'RECOVERY_RUN','value':state['run']}]
    recovery=args.operation in ['restore','isolation']
    if args.operation=='restore':
        target=aws.database(state['target']);require(target is not None,'Recovery target is missing');validate_target(target,state)
        require(target['DBInstanceStatus']=='available','Recovery target is not available')
        snapshot=aws.snapshot(state['snapshot']);require(snapshot is not None and snapshot['Status']=='available','Snapshot is unavailable')
        environment += [{'name':'DATABASE_HOST','value':target['Endpoint']['Address']},
                        {'name':'RECOVERY_SNAPSHOT_TIME','value':snapshot['SnapshotCreateTime']}]
    if args.operation=='after-snapshot':
        snapshot=aws.snapshot(state['snapshot'])
        require(snapshot is not None and snapshot['Status']=='available','Do not apply later changes before the baseline snapshot is available')
    command=['node','dist/recovery-admin.js',args.operation]
    if args.operation=='isolation':
        environment.append({'name':'RECOVERY_SOURCE_HOST','value':out['DatabaseHost']})
        command=['node','--input-type=module','-e',Path(__file__).with_name('probe_recovery_isolation.mjs').read_text()]
    if args.operation=='migrate':
        command=['/bin/sh','-c','node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce']
    token=uuid.uuid4().hex
    # Save the idempotency token before the request; an uncertain invocation is
    # investigated by this token, never retried as a second unrecorded mutation.
    payload={'cluster':out['ClusterName'],
        'taskDefinition':out['RecoveryTaskDefinitionArn' if recovery else 'MigrationTaskDefinitionArn'],
        'launchType':'FARGATE','clientToken':token,
        'networkConfiguration':{'awsvpcConfiguration':{'subnets':out['MaintenanceSubnetIds'].split(','),
            'securityGroups':[out['RecoverySecurityGroupId' if recovery else 'MigrationSecurityGroupId']], 'assignPublicIp':'ENABLED'}},
        'overrides':{'containerOverrides':[{'name':'Maintenance','command':command,'environment':environment}]}}
    tasks[args.operation]={'clientToken':token,'requestedAt':datetime.now(timezone.utc).isoformat(),'request':payload}
    save(args.state,state)
    response=aws.call('ecs','run-task',payload)
    require(not response.get('failures') and len(response.get('tasks',[]))==1,'Maintenance task was not started')
    task=response['tasks'][0];tasks[args.operation]['arn']=task['taskArn'];save(args.state,state)
    print(json.dumps({'phase':args.operation,'taskArn':task['taskArn'],'status':task['lastStatus']}))


if __name__=='__main__':
    main()
