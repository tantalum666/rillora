import { Construct } from 'constructs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CfnOutput, Duration, RemovalPolicy, aws_lambda as lambda, aws_logs as logs, aws_iam as iam, aws_events as events, aws_events_targets as targets, aws_cloudwatch as cloudwatch } from 'aws-cdk-lib';
export class RilloraSnapshotRetirement extends Construct {
    alarms = [];
    constructor(scope, id) {
        super(scope, id);
        const policy = JSON.parse(readFileSync(new URL('../../../config/manual-snapshot-retention.json', import.meta.url), 'utf8'));
        if (policy.account !== '133857166372' || policy.region !== 'eu-central-1' || policy.snapshots.length !== 1)
            throw Error('Review an exact new snapshot policy before expanding this worker');
        const snapshot = policy.snapshots[0];
        const logGroup = new logs.LogGroup(this, 'Logs', { retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.RETAIN });
        const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com') });
        logGroup.grantWrite(role);
        const worker = new lambda.Function(this, 'Worker', { runtime: lambda.Runtime.NODEJS_22_X, architecture: lambda.Architecture.ARM_64,
            code: lambda.Code.fromAsset(fileURLToPath(new URL('../../../tools/snapshot-retention', import.meta.url)), { exclude: ['*.test.mjs'] }),
            handler: 'handler.handler', memorySize: 128, timeout: Duration.seconds(45), logGroup, role,
            retryAttempts: 1, maxEventAge: Duration.hours(1), environment: { SNAPSHOT_RETENTION_POLICY: JSON.stringify(policy), ALLOW_SNAPSHOT_RETIREMENT: 'true' },
            description: 'Retires only the named old Rillora snapshot after90days and current-backup/hold checks' });
        worker.addToRolePolicy(new iam.PolicyStatement({ actions: ['rds:DescribeDBSnapshots', 'rds:DescribeDBInstances'], resources: ['*'],
            conditions: { StringEquals: { 'aws:RequestedRegion': 'eu-central-1' } } }));
        worker.addToRolePolicy(new iam.PolicyStatement({ actions: ['rds:ListTagsForResource'], resources: [snapshot.arn] }));
        worker.addToRolePolicy(new iam.PolicyStatement({ actions: ['rds:DeleteDBSnapshot'], resources: [snapshot.arn], conditions: {
                StringEquals: { 'rds:snapshot-tag/RilloraRetirementManaged': 'true', 'rds:snapshot-tag/RilloraRetireAfter': snapshot.retireAfter },
                StringEqualsIfExists: { 'rds:snapshot-tag/RilloraLegalHold': 'false' }, DateGreaterThan: { 'aws:CurrentTime': snapshot.retireAfter }
            } }));
        new events.Rule(this, 'Schedule', { schedule: events.Schedule.rate(Duration.hours(12)), targets: [new targets.LambdaFunction(worker, {
                    retryAttempts: 1, maxEventAge: Duration.hours(1), event: events.RuleTargetInput.fromObject({ job: 'known-snapshot-retirement-v1' })
                })] });
        for (const [name, silence] of [['SnapshotFailures', false], ['SnapshotOverdue', false], ['SnapshotHeartbeat', true]]) {
            this.alarms.push(new cloudwatch.Alarm(this, name, { metric: new cloudwatch.Metric({ namespace: 'Rillora/Retention', metricName: name,
                    dimensionsMap: { Environment: 'production' }, statistic: silence ? 'Sum' : 'Maximum', period: Duration.hours(12) }), threshold: 1,
                evaluationPeriods: silence ? 3 : 1, comparisonOperator: silence ? cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD : cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treatMissingData: silence ? cloudwatch.TreatMissingData.BREACHING : cloudwatch.TreatMissingData.NOT_BREACHING }));
        }
        const operator = iam.Role.fromRoleArn(this, 'ProductionOperator', 'arn:aws:iam::133857166372:role/rillora/rillora-production-operator');
        new iam.Policy(this, 'Runbook', { roles: [operator], statements: [
                new iam.PolicyStatement({ actions: ['lambda:InvokeFunction', 'lambda:GetFunctionConfiguration'], resources: [worker.functionArn] }),
                new iam.PolicyStatement({ actions: ['logs:DescribeLogStreams', 'logs:GetLogEvents', 'logs:FilterLogEvents'], resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`] }),
                new iam.PolicyStatement({ actions: ['rds:ListTagsForResource'], resources: [snapshot.arn] }),
                new iam.PolicyStatement({ actions: ['rds:AddTagsToResource'], resources: [snapshot.arn], conditions: {
                        'ForAllValues:StringEquals': { 'aws:TagKeys': ['RilloraRetirementManaged', 'RilloraRetireAfter', 'RilloraLegalHold'] },
                        StringEqualsIfExists: { 'aws:RequestTag/RilloraRetirementManaged': 'true', 'aws:RequestTag/RilloraRetireAfter': snapshot.retireAfter,
                            'aws:RequestTag/RilloraLegalHold': ['true', 'false'] }
                    } }),
            ] });
        new CfnOutput(this, 'FunctionName', { value: worker.functionName });
        new CfnOutput(this, 'LogGroupName', { value: logGroup.logGroupName });
    }
}
