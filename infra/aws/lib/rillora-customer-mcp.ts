import {Construct} from 'constructs';
import {CfnOutput,RemovalPolicy,aws_dynamodb as dynamodb,aws_secretsmanager as secrets,aws_iam as iam} from 'aws-cdk-lib';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Independent protocol state. No private map is copied and no additional running service is required. */
export class RilloraCustomerMcp extends Construct {
  readonly environment: Record<string,string> = {};
  constructor(scope:Construct,id:string,props:{enabled:boolean;runtime:iam.IRole;operator:iam.IRole}) {
    super(scope,id);
    const table=new dynamodb.Table(this,'OAuthState',{
      tableName:'rillora-production-mcp-oauth',partitionKey:{name:'pk',type:dynamodb.AttributeType.STRING},
      billingMode:dynamodb.BillingMode.PAY_PER_REQUEST,encryption:dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute:'expiresAt',deletionProtection:true,removalPolicy:RemovalPolicy.RETAIN,
    });
    const secret=new secrets.Secret(this,'Configuration',{secretName:'rillora/production/ai-oauth',
      description:'Rillora customer OAuth signing, cookie and encrypted temporary-state keys; populate before enablement',
      removalPolicy:RemovalPolicy.RETAIN});
    props.operator.addToPrincipalPolicy(new iam.PolicyStatement({actions:['secretsmanager:DescribeSecret','secretsmanager:PutSecretValue'],resources:[secret.secretArn]}));
    if(props.enabled) {
      secret.grantRead(props.runtime);
      props.runtime.addToPrincipalPolicy(new iam.PolicyStatement({
        actions:['dynamodb:GetItem','dynamodb:UpdateItem','dynamodb:DeleteItem','dynamodb:ConditionCheckItem'],resources:[table.tableArn],
        conditions:{'ForAllValues:StringLike':{'dynamodb:LeadingKeys':
          ['Session','SessionUid','Interaction','Grant','AuthorizationCode','AccessToken','RefreshToken','ConnectionBinding','RevokedGrant'].map(model=>model+':*')}},
      }));
      const clients=JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),
        '../../../apps/api/src/mcp/customer-clients.json'),'utf8')) as Array<{key:string;name:string;privacyUrl:string;clientId:string;identityScopes:boolean}>;
      Object.assign(this.environment,{ALLOW_MCP_INTEGRATION:'true',MCP_RESOURCE_URL:'https://app.rillora.xyz/api/mcp',
        MCP_OAUTH_SECRET_ARN:secret.secretArn,MCP_OAUTH_TABLE:table.tableName,
        MCP_CLIENTS_JSON:JSON.stringify(clients.map(c=>({key:c.key,name:c.name,privacyUrl:c.privacyUrl,clientId:c.clientId,verifiedEmailDisclosure:c.identityScopes})))});
    }
    new CfnOutput(this,'ConfigurationSecretArn',{value:secret.secretArn});
    new CfnOutput(this,'OAuthTable',{value:table.tableName});
    new CfnOutput(this,'CustomerAccess',{value:props.enabled?'enabled':'disabled'});
  }
}
