import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  Duration, RemovalPolicy, Stack, CfnOutput, type StackProps,
  aws_lambda as lambda, aws_logs as logs, aws_events as events,
  aws_events_targets as targets, aws_sqs as sqs, aws_sns as sns,
  aws_cloudwatch as cloudwatch, aws_cloudwatch_actions as actions,
  aws_iam as iam,
} from "aws-cdk-lib";
import type { Construct } from "constructs";
import { TRANSACTIONAL_MAIL } from './rillora-mail-stack.js';
import {RilloraSnapshotRetirement} from './rillora-snapshot-retirement.js';

/** A separate, opt-in stack; deploying it never updates the API or database. */
export class RilloraOperationsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & {
    scheduleEnabled?: boolean; appleProductionMonitoringEnabled?: boolean; appleReviewMonitoringEnabled?: boolean; retentionMonitoringEnabled?:boolean; snapshotRetirementEnabled?:boolean;
  } = {}) {
    super(scope, id, props);
    const configuration = readFileSync(new URL("../../../config/operations-targets.json", import.meta.url), "utf8");
    const parsed = JSON.parse(configuration) as { environment: string };
    const queue = new sqs.Queue(this, "FailedDeliveries", {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: Duration.days(14),
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const logGroup = new logs.LogGroup(this, "HealthLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const checker = new lambda.Function(this, "HealthCheck", {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset(fileURLToPath(new URL("../../../tools/ops", import.meta.url)), {
        exclude: ["*.test.mjs", "run-checks.mjs"],
      }),
      handler: "handler.handler",
      memorySize: 128,
      timeout: Duration.seconds(15),
      // Small AWS accounts may have no reservable concurrency above the minimum
      // unreserved pool. The one schedule, 15-second timeout and bounded retries
      // bound this read-only workload without reserving account capacity.
      environment: { OPERATIONS_TARGETS_JSON: configuration },
      logGroup,
      deadLetterQueue: queue,
      retryAttempts: 1,
      maxEventAge: Duration.minutes(15),
      description: "Checks approved public metadata and configured deadlines; no private data or repair credentials",
    });
    new events.Rule(this, "QuarterHourly", {
      enabled: props.scheduleEnabled ?? false,
      schedule: events.Schedule.rate(Duration.minutes(15)),
      targets: [new targets.LambdaFunction(checker, {
        retryAttempts: 2, maxEventAge: Duration.minutes(15), deadLetterQueue: queue,
        event: events.RuleTargetInput.fromObject({ job: "public-health-v1" }),
      })],
    });
    // The deployment runbook must bind and verify a real subscriber before monitoring is called active.
    const alerts = new sns.Topic(this, "Alerts", { enforceSSL: true });
    const metric = (name: string, statistic: string) => new cloudwatch.Metric({
      namespace: "Rillora/Operations", metricName: name,
      dimensionsMap: { Environment: parsed.environment },
      period: Duration.minutes(15), statistic,
    });
    const alarmDefinitions = [
      new cloudwatch.Alarm(this, "Unhealthy", {
        metric: metric("FailedChecks", "Maximum"), threshold: 1, evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
      new cloudwatch.Alarm(this, "MissingHeartbeat", {
        metric: metric("Heartbeat", "Sum"), threshold: 1, evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }),
      new cloudwatch.Alarm(this, "InvocationErrors", {
        metric: checker.metricErrors({ period: Duration.minutes(15) }),
        threshold: 1, evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
      new cloudwatch.Alarm(this, "DeadLetters", {
        metric: queue.metricApproximateNumberOfMessagesVisible({ period: Duration.minutes(15) }),
        threshold: 1, evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    ];
    // Configuration-set aggregate counts carry no recipient, subject or message body.
    // Low-volume authentication mail warrants intervention after any hard bounce/complaint.
    for (const [id, metricName] of [
      ['MailBounce', 'Bounce'], ['MailComplaint', 'Complaint'],
      ['MailRejected', 'Reject'], ['MailDelayed', 'DeliveryDelay'],
    ]) {
      alarmDefinitions.push(new cloudwatch.Alarm(this, id!, {
        metric: new cloudwatch.Metric({ namespace: 'AWS/SES', metricName: metricName!,
          dimensionsMap: { 'ses:configuration-set': TRANSACTIONAL_MAIL.configurationSet },
          statistic: 'Sum', period: Duration.minutes(15) }),
        threshold: 1, evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }));
    }
    // Opt in only with the actual production worker deployment; do not create a
    // permanent missing-heartbeat alarm for the still-closed customer runtime.
    for (const environment of [
      ...(props.appleProductionMonitoringEnabled ? ['production'] : []),
      ...(props.appleReviewMonitoringEnabled ? ['sandbox'] : []),
    ]) {
      for (const [name, threshold, periods, silence] of [
        ['Failed', 1, 1, false], ['WorkerErrors', 1, 2, false],
        ['OldestPendingSeconds', 300, 2, false], ['Heartbeat', 1, 3, true],
      ] as const) {
        alarmDefinitions.push(new cloudwatch.Alarm(this, `${environment === 'production' ? 'AppleDelivery' : 'AppleReviewDelivery'}${name}`, {
          metric: new cloudwatch.Metric({ namespace: 'Rillora/Commerce', metricName: name,
            dimensionsMap: { Environment: environment, Provider: 'storekit' },
            statistic: silence ? 'Sum' : 'Maximum', period: Duration.minutes(5) }),
          threshold, evaluationPeriods: periods,
          comparisonOperator: silence ? cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD
            : cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: silence ? cloudwatch.TreatMissingData.BREACHING : cloudwatch.TreatMissingData.NOT_BREACHING,
        }));
      }
    }
    if(props.retentionMonitoringEnabled){
      for(const [name,periods,silence] of [['Failures',1,false],['BatchFull',2,false],['Heartbeat',3,true]] as const){
        alarmDefinitions.push(new cloudwatch.Alarm(this,`Retention${name}`,{
          metric:new cloudwatch.Metric({namespace:'Rillora/Retention',metricName:name,dimensionsMap:{Environment:'production'},
            statistic:silence?'Sum':'Maximum',period:Duration.minutes(15)}),
          threshold:1,evaluationPeriods:periods,
          comparisonOperator:silence?cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD:cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData:silence?cloudwatch.TreatMissingData.BREACHING:cloudwatch.TreatMissingData.NOT_BREACHING,
        }));
      }
    }
    if(props.snapshotRetirementEnabled)alarmDefinitions.push(...new RilloraSnapshotRetirement(this,'SnapshotRetirement').alarms);
    for (const alarm of alarmDefinitions) {
      alarm.addAlarmAction(new actions.SnsAction(alerts));
      alarm.addOkAction(new actions.SnsAction(alerts));
    }
    // An alarm action only records the destination ARN. This topic has an
    // explicit TLS policy, so authorize the service publisher as well. Bind
    // both source account and exact alarms to prevent confused-deputy use.
    alerts.addToResourcePolicy(new iam.PolicyStatement({
      sid: "AllowOnlyRilloraAlarmDelivery",
      principals: [new iam.ServicePrincipal("cloudwatch.amazonaws.com")],
      actions: ["sns:Publish"],
      resources: [alerts.topicArn],
      conditions: {
        StringEquals: { "aws:SourceAccount": this.account },
        ArnEquals: { "aws:SourceArn": alarmDefinitions.map(alarm => alarm.alarmArn) },
      },
    }));
    // The existing operator can verify this public-only job without obtaining
    // application database, user-content or payment-key permissions.
    const operator = iam.Role.fromRoleArn(this, "ExistingOperator",
      `arn:${this.partition}:iam::${this.account}:role/rillora/rillora-staging-operator`);
    new iam.Policy(this, "OperationsRunbook", { roles: [operator], statements: [
      new iam.PolicyStatement({ actions: ["lambda:InvokeFunction", "lambda:GetFunctionConfiguration"], resources: [checker.functionArn] }),
      new iam.PolicyStatement({ actions: ["logs:DescribeLogStreams", "logs:GetLogEvents", "logs:FilterLogEvents"], resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`] }),
      new iam.PolicyStatement({ actions: ["sqs:GetQueueAttributes"], resources: [queue.queueArn] }),
      new iam.PolicyStatement({ actions: ["cloudwatch:DescribeAlarms", "cloudwatch:DescribeAlarmHistory"], resources: alarmDefinitions.map(alarm => alarm.alarmArn) }),
      new iam.PolicyStatement({ actions: ["sns:ListSubscriptionsByTopic", "sns:GetTopicAttributes"], resources: [alerts.topicArn] }),
    ] });
    new CfnOutput(this, "AlertTopicArn", { value: alerts.topicArn });
    new CfnOutput(this, "CheckerFunctionName", { value: checker.functionName });
    new CfnOutput(this, "ActivationBoundary", {
      value: "Requires deploy, real cloud invocation, verified subscriber delivery and missing-heartbeat drill",
    });
  }
}
