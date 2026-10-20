import { Construct } from 'constructs';
import { Duration, RemovalPolicy, aws_secretsmanager as secrets, aws_kms as kms, aws_iam as iam,
  aws_ecs as ecs, aws_ec2 as ec2, aws_logs as logs, aws_lambda as lambda, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export class RilloraRuntimeBoundaryKeys extends Construct {
  readonly database:secrets.Secret;
  readonly email:secrets.Secret;
  readonly proof:kms.Key;
  readonly worker:secrets.Secret;
  constructor(scope:Construct,id:string,environment:'production'|'staging'){
    super(scope,id);
    const secret=(label:string,name:string)=>new secrets.Secret(this,label,{
      secretName:`rillora/${environment}/${name}`,
      generateSecretString:{passwordLength:64,excludePunctuation:true},removalPolicy:RemovalPolicy.RETAIN});
    this.database=secret('DatabaseAuthority','database-authority');
    this.email=secret('EmailMatching','email-matching');
    this.proof=new kms.Key(this,'IdentityProof',{enableKeyRotation:true,removalPolicy:RemovalPolicy.RETAIN,
      description:'Sealed provider identity proof; API encrypts, isolated identity worker decrypts'});
    this.worker=new secrets.Secret(this,'DeletionDatabase',{
      secretName:`rillora/${environment}/deletion-database`,removalPolicy:RemovalPolicy.RETAIN,
      generateSecretString:{secretStringTemplate:JSON.stringify({username:`continuity_deletion_${environment}`}),
        generateStringKey:'password',passwordLength:48,excludePunctuation:true}});
  }
  apiSecrets():Record<string,ecs.Secret>{
    return {DATABASE_AUTHORITY_KEY:ecs.Secret.fromSecretsManager(this.database),EMAIL_MATCH_KEY:ecs.Secret.fromSecretsManager(this.email)};
  }
  migrationSecrets():Record<string,ecs.Secret>{
    return {...this.apiSecrets(),DELETION_DATABASE_USER:ecs.Secret.fromSecretsManager(this.worker,'username'),
      DELETION_DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(this.worker,'password')};
  }
  allowProof(role:iam.IRole,environment:'production'|'staging',operation:'kms:GenerateDataKey'|'kms:Decrypt'){
    role.addToPrincipalPolicy(new iam.PolicyStatement({actions:[operation],resources:[this.proof.keyArn],
      conditions:{StringEquals:{'kms:EncryptionContext:rillora_application':'identity-deletion-proof-v1',
        'kms:EncryptionContext:rillora_environment':`rillora-${environment}`},Null:{'kms:EncryptionContext:session_id':'false'}}}));
  }
}

export class RilloraRecoveryAttestationBroker extends Construct {
  readonly authority:secrets.Secret;
  readonly function:lambda.Function;
  constructor(scope:Construct,id:string,table:dynamodb.Table){
    super(scope,id);
    this.authority=new secrets.Secret(this,'Authority',{secretName:'rillora/production/recovery-attestation',
      generateSecretString:{passwordLength:64,excludePunctuation:true},removalPolicy:RemovalPolicy.RETAIN});
    this.function=new lambda.Function(this,'Writer',{runtime:lambda.Runtime.PYTHON_3_13,architecture:lambda.Architecture.ARM_64,
      handler:'handler.handler',timeout:Duration.seconds(10),memorySize:128,
      code:lambda.Code.fromAsset(resolve(dirname(fileURLToPath(import.meta.url)),'../recovery-journal-broker')),
      environment:{JOURNAL_TABLE:table.tableName,ATTESTATION_SECRET_ARN:this.authority.secretArn}});
    this.authority.grantRead(this.function);
    this.function.addToRolePolicy(new iam.PolicyStatement({actions:['dynamodb:GetItem','dynamodb:PutItem'],resources:[table.tableArn],
      conditions:{'ForAllValues:StringEquals':{'dynamodb:LeadingKeys':['rillora-production']}}}));
  }
}

export class RilloraIdentityDeletionWorker extends Construct {
  readonly service:ecs.FargateService;
  readonly logGroup:logs.LogGroup;
  constructor(scope:Construct,id:string,p:{environment:'production'|'staging';vpc:ec2.IVpc;cluster:ecs.ICluster;
    databaseNetwork:ec2.ISecurityGroup;databaseEnvironment:Record<string,string>;keys:RilloraRuntimeBoundaryKeys;
    image:ecs.ContainerImage;providerEnvironment:Record<string,string>;providerSecrets:Record<string,ecs.Secret>;
    issuers:readonly string[];clients:readonly string[];desiredCount:0|1;broker?:lambda.IFunction}){
    super(scope,id);
    const network=new ec2.SecurityGroup(this,'Network',{vpc:p.vpc,allowAllOutbound:false,description:'No inbound listener; isolated identity deletion only'});
    network.addEgressRule(ec2.Peer.ipv4('0.0.0.0/0'),ec2.Port.tcp(443),'Identity and AWS HTTPS');
    network.addEgressRule(p.databaseNetwork,ec2.Port.tcp(5432),'Dedicated deletion database login');
    p.databaseNetwork.addIngressRule(network,ec2.Port.tcp(5432),'Dedicated identity deletion worker');
    const task=new ecs.FargateTaskDefinition(this,'Task',{cpu:256,memoryLimitMiB:512,
      runtimePlatform:{cpuArchitecture:ecs.CpuArchitecture.ARM64,operatingSystemFamily:ecs.OperatingSystemFamily.LINUX}});
    const linux=new ecs.LinuxParameters(this,'Linux');linux.dropCapabilities(ecs.Capability.ALL);
    this.logGroup=new logs.LogGroup(this,'Logs',{retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});
    task.addContainer('IdentityDeletion',{image:p.image,command:['node','dist/account-deletion-worker.js'],
      readonlyRootFilesystem:true,linuxParameters:linux,
      environment:{...p.databaseEnvironment,...p.providerEnvironment,NODE_ENV:'production',
        CONTENT_KEY_NAMESPACE:`rillora-${p.environment}`,DELETION_PROOF_KMS_KEY_ARN:p.keys.proof.keyArn,
        DELETION_ALLOWED_ISSUERS:JSON.stringify(p.issuers),DELETION_ALLOWED_CLIENT_IDS:JSON.stringify(p.clients),
        ...(p.broker?{RECOVERY_JOURNAL_BROKER_ARN:p.broker.functionArn}:{})},
      secrets:{DATABASE_USER:ecs.Secret.fromSecretsManager(p.keys.worker,'username'),
        DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(p.keys.worker,'password'),...p.providerSecrets},
      logging:ecs.LogDrivers.awsLogs({logGroup:this.logGroup,streamPrefix:'identity-deletion'})});
    p.keys.allowProof(task.taskRole,p.environment,'kms:Decrypt');
    p.broker?.grantInvoke(task.taskRole);
    this.service=new ecs.FargateService(this,'Service',{cluster:p.cluster,taskDefinition:task,desiredCount:p.desiredCount,
      assignPublicIp:true,vpcSubnets:{subnetType:ec2.SubnetType.PUBLIC},securityGroups:[network],
      capacityProviderStrategies:[{capacityProvider:'FARGATE',weight:1}],circuitBreaker:{rollback:true}});
  }
}
