import {Construct} from 'constructs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Duration,RemovalPolicy,aws_iam as iam,aws_lambda as lambda,aws_logs as logs} from 'aws-cdk-lib';

/** Human operators invoke reviewed operations; they cannot override privileged containers. */
export class RilloraMaintenanceBroker extends Construct {
  readonly function:lambda.Function;
  constructor(scope:Construct,id:string,props:{operator:iam.IRole;settings:Record<string,unknown>;policies:iam.PolicyStatement[]}) {
    super(scope,id);
    const logGroup=new logs.LogGroup(this,'Logs',{retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});
    this.function=new lambda.Function(this,'Function',{
      runtime:lambda.Runtime.NODEJS_22_X,architecture:lambda.Architecture.ARM_64,memorySize:256,timeout:Duration.seconds(60),
      code:lambda.Code.fromAsset(resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/maintenance-broker'),{exclude:['*.test.mjs']}),
      handler:'handler.handler',logGroup,environment:{BROKER_SETTINGS:JSON.stringify(props.settings)},
      description:'Fixed Rillora maintenance commands and capability-bound recovery resources; no caller-supplied credentials',
    });
    for(const policy of props.policies)this.function.addToRolePolicy(policy);
    this.function.grantInvoke(props.operator);
    logGroup.grantRead(props.operator);
  }
}
