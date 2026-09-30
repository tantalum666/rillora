import { CfnOutput, Duration, Stack, type StackProps, aws_iam as iam } from "aws-cdk-lib";
import type { Construct } from "constructs";

/** Read account constraints and cost before provisioning production resources. */
export class RilloraProductionPreflightStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope,id,props);
    const operator=iam.User.fromUserArn(this,"ExistingOperator",
      `arn:${this.partition}:iam::${this.account}:user/rillora/rillora-operator`);
    const role=new iam.Role(this,"ReadinessReader",{
      roleName:"rillora-production-preflight",path:"/rillora/",
      description:"Read-only account plan, costs and regional database inventory for production preparation",
      assumedBy:new iam.ArnPrincipal(operator.userArn).withConditions({Bool:{"aws:MultiFactorAuthPresent":"true"}}),
      maxSessionDuration:Duration.hours(1),
    });
    role.addToPolicy(new iam.PolicyStatement({
      actions:["freetier:GetAccountPlanState"],
      resources:[`arn:${this.partition}:freetier:us-east-1:${this.account}:/GetAccountPlanState`],
    }));
    // These read-only cost/inventory APIs do not support resource-level scopes.
    role.addToPolicy(new iam.PolicyStatement({actions:["ce:GetCostAndUsage"],resources:["*"]}));
    role.addToPolicy(new iam.PolicyStatement({actions:["rds:DescribeDBInstances","rds:DescribeDBSnapshots"],resources:["*"],
      conditions:{StringEquals:{"aws:RequestedRegion":"eu-central-1"}}}));
    new iam.Policy(this,"AssumeOnlyReadinessReader",{users:[operator],statements:[new iam.PolicyStatement({
      actions:["sts:AssumeRole"],resources:[role.roleArn],conditions:{Bool:{"aws:MultiFactorAuthPresent":"true"}},
    })]});
    new CfnOutput(this,"ReadinessRoleArn",{value:role.roleArn});
  }
}
