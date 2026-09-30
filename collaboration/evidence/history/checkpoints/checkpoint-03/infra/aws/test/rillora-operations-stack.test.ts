import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { RilloraOperationsStack } from "../lib/rillora-operations-stack.js";

const template = () => Template.fromStack(new RilloraOperationsStack(new App(), "OperationsTest", {
  env: { account: "111111111111", region: "eu-central-1" },
}));
describe("Standalone public operations", () => {
  it('optionally monitors bounded Apple delivery failures, age and worker silence without private metric dimensions', () => {
    const t = Template.fromStack(new RilloraOperationsStack(new App(), 'AppleOperationsTest', {
      env: { account: '111111111111', region: 'eu-central-1' }, appleProductionMonitoringEnabled: true,
    }));
    const alarms = Object.values(t.findResources('AWS::CloudWatch::Alarm'))
      .map(a => a.Properties).filter(a => a.Namespace === 'Rillora/Commerce');
    expect(alarms.map(a => a.MetricName).sort()).toEqual(['Failed', 'Heartbeat', 'OldestPendingSeconds', 'WorkerErrors']);
    for (const alarm of alarms) {
      expect(alarm.Dimensions).toEqual([{ Name: 'Environment', Value: 'production' }, { Name: 'Provider', Value: 'storekit' }]);
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.TreatMissingData).toBe(alarm.MetricName === 'Heartbeat' ? 'breaching' : 'notBreaching');
    }
    t.resourceCountIs('AWS::CloudWatch::Alarm', 12);
    t.resourceCountIs('AWS::SNS::Subscription', 0);
  });
  it("keeps the recurring schedule off until activation evidence is ready", () => {
    template().hasResourceProperties("AWS::Events::Rule", { State: "DISABLED" });
    Template.fromStack(new RilloraOperationsStack(new App(), "EnabledTest", {
      env: { account: "111111111111", region: "eu-central-1" }, scheduleEnabled: true,
    })).hasResourceProperties("AWS::Events::Rule", { State: "ENABLED" });
  });
  it("does not add a VPC, database, secret, billing or app task", () => {
    const t = template();
    for (const type of ["AWS::EC2::VPC", "AWS::RDS::DBInstance", "AWS::SecretsManager::Secret", "AWS::ECS::Service"]) t.resourceCountIs(type, 0);
    t.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs22.x", Architectures: ["arm64"], MemorySize: 128,
      Timeout: 15, ReservedConcurrentExecutions: Match.absent(), VpcConfig: Match.absent(),
    });
  });
  it("uses bounded delivery retries and an encrypted retained dead letter queue", () => {
    const t = template();
    t.hasResourceProperties("AWS::Events::Rule", {
      ScheduleExpression: "rate(15 minutes)", Targets: Match.arrayWith([Match.objectLike({
        RetryPolicy: { MaximumEventAgeInSeconds: 900, MaximumRetryAttempts: 2 },
        DeadLetterConfig: { Arn: Match.anyValue() },
      })]),
    });
    t.hasResourceProperties("AWS::SQS::Queue", { SqsManagedSseEnabled: true, MessageRetentionPeriod: 1209600 });
    t.hasResourceProperties("AWS::Lambda::EventInvokeConfig", { MaximumRetryAttempts: 1, MaximumEventAgeInSeconds: 900 });
  });
  it("alerts on failure and silence, without inventing a subscribed recipient", () => {
    const t = template();
    t.resourceCountIs("AWS::CloudWatch::Alarm", 8);
    t.hasResourceProperties("AWS::CloudWatch::Alarm", {
      MetricName: "Heartbeat", TreatMissingData: "breaching", EvaluationPeriods: 3,
      AlarmActions: Match.anyValue(), OKActions: Match.anyValue(),
    });
    t.resourceCountIs("AWS::SNS::Subscription", 0);
  });
  it('monitors only aggregate transactional email outcomes, without alarming on idle mail', () => {
    const alarms = Object.values(template().findResources('AWS::CloudWatch::Alarm'))
      .map(a => a.Properties).filter(a => a.Namespace === 'AWS/SES');
    expect(alarms.map(a => a.MetricName).sort()).toEqual(['Bounce', 'Complaint', 'DeliveryDelay', 'Reject']);
    for (const alarm of alarms) {
      expect(alarm.Dimensions).toEqual([{ Name: 'ses:configuration-set', Value: 'rillora-transactional' }]);
      expect(alarm.TreatMissingData).toBe('notBreaching');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.AlarmActions).toBeDefined();
    }
  });
  it("gives the checker only logging and failed-delivery permissions", () => {
    const t = template();
    const policies = Object.entries(t.findResources("AWS::IAM::Policy")).filter(([name]) => name.startsWith("HealthCheck")).map(([,policy]) => policy);
    const statements = policies.flatMap(p => p.Properties.PolicyDocument.Statement);
    const actions = statements.flatMap(s => Array.isArray(s.Action) ? s.Action : [s.Action]);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) expect(["logs:CreateLogStream", "logs:PutLogEvents", "sqs:SendMessage"]).toContain(action);
  });
  it("authorizes alarm delivery without accepting another account or unrelated alarm", () => {
    const t = template();
    const policy = Object.values(t.findResources("AWS::SNS::TopicPolicy"))[0]!.Properties.PolicyDocument.Statement;
    const grants = policy.filter((s: { Effect: string }) => s.Effect === "Allow");
    expect(grants).toHaveLength(1);
    const grant = grants[0];
    expect(grant.Principal).toEqual({ Service: "cloudwatch.amazonaws.com" });
    expect(grant.Action).toBe("sns:Publish");
    expect(grant.Resource).not.toEqual("*");
    expect(grant.Condition.StringEquals).toEqual({ "aws:SourceAccount": "111111111111" });
    const sources = grant.Condition.ArnEquals["aws:SourceArn"];
    const alarms = Object.keys(t.findResources("AWS::CloudWatch::Alarm"));
    expect(sources).toHaveLength(alarms.length);
    for (const alarm of alarms) expect(JSON.stringify(sources)).toContain(alarm);
    expect(JSON.stringify(sources)).not.toContain("alarm:*");
    expect(policy.some((s: { Effect: string; Condition?: object }) =>
      s.Effect === "Deny" && JSON.stringify(s.Condition).includes("aws:SecureTransport"))).toBe(true);
  });
  it("limits operator verification to this public job and never grants access to private secrets or application tasks", () => {
    const policies=Object.entries(template().findResources("AWS::IAM::Policy")).filter(([name])=>name.startsWith("OperationsRunbook"));
    expect(policies).toHaveLength(1);
    const statements=policies[0]![1].Properties.PolicyDocument.Statement;
    const actions=statements.flatMap((s: {Action:string|string[]})=>s.Action);
    expect(actions).toContain("lambda:InvokeFunction");
    expect(actions.some((action:string)=>/^(secretsmanager|rds|ecs|iam):/.test(action))).toBe(false);
    for(const s of statements)expect(s.Resource).not.toEqual("*");
  });
});
