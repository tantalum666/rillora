import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ArnFormat,Aws,CfnOutput,Duration,RemovalPolicy,Stack,Tags,type StackProps,
 aws_ec2 as ec2,aws_ecs as ecs,aws_ecr_assets as ecr,aws_iam as iam,
 aws_kms as kms,aws_logs as logs,aws_rds as rds,aws_secretsmanager as secrets,
 aws_dynamodb as dynamodb} from 'aws-cdk-lib';
import type {Construct} from 'constructs';

/** An isolated production data foundation. It exposes no customer HTTP service. */
export class RilloraProductionStack extends Stack {
 constructor(scope:Construct,id:string,props:StackProps){
  super(scope,id,props);
  if(props.env?.region!=='eu-central-1')throw new Error('Production data stays in the reviewed Frankfurt region');
  Tags.of(this).add('Project','Rillora');Tags.of(this).add('Environment','Production');
  Tags.of(this).add('CostCenter','Rillora');
  const vpc=new ec2.Vpc(this,'Vpc',{ipAddresses:ec2.IpAddresses.cidr('10.43.0.0/16'),maxAzs:2,natGateways:0,
   subnetConfiguration:[{name:'maintenance',subnetType:ec2.SubnetType.PUBLIC,cidrMask:24},
    {name:'data',subnetType:ec2.SubnetType.PRIVATE_ISOLATED,cidrMask:24}]});
  const sourceJobs=new ec2.SecurityGroup(this,'MigrationNetwork',{vpc,allowAllOutbound:false,
   description:'No inbound listener; bounded production migration jobs only'});
  const recoveryJobs=new ec2.SecurityGroup(this,'RecoveryNetwork',{vpc,allowAllOutbound:false,
   description:'No inbound listener; isolated restore probes cannot connect to live data'});
  for(const group of [sourceJobs,recoveryJobs])group.addEgressRule(ec2.Peer.ipv4('0.0.0.0/0'),ec2.Port.tcp(443),'AWS HTTPS APIs and image/log delivery');
  const databaseNetwork=new ec2.SecurityGroup(this,'DatabaseNetwork',{vpc,allowAllOutbound:false});
  databaseNetwork.addIngressRule(sourceJobs,ec2.Port.tcp(5432),'Only production migration jobs at this closed foundation stage');
  sourceJobs.addEgressRule(databaseNetwork,ec2.Port.tcp(5432),'Verified TLS to the production database');
  const recoveryDatabaseNetwork=new ec2.SecurityGroup(this,'RecoveryDatabaseNetwork',{vpc,allowAllOutbound:false});
  recoveryDatabaseNetwork.addIngressRule(recoveryJobs,ec2.Port.tcp(5432),'Only isolated restore probes');
  recoveryJobs.addEgressRule(recoveryDatabaseNetwork,ec2.Port.tcp(5432),'Verified TLS only to the recovery database');

  const parameters=new rds.ParameterGroup(this,'PostgresParameters',{
   engine:rds.DatabaseInstanceEngine.postgres({version:rds.PostgresEngineVersion.VER_16_13}),
   parameters:{'rds.force_ssl':'1','password_encryption':'scram-sha-256','log_statement':'none'},
  });
  const databaseSubnets=new rds.SubnetGroup(this,'DatabaseSubnets',{
   description:'Only isolated subnets for production and quarantined restores',
   vpc,vpcSubnets:{subnetType:ec2.SubnetType.PRIVATE_ISOLATED},
  });
  const database=new rds.DatabaseInstance(this,'Database',{
   instanceIdentifier:'rillora-production',
   engine:rds.DatabaseInstanceEngine.postgres({version:rds.PostgresEngineVersion.VER_16_13}),
   instanceType:ec2.InstanceType.of(ec2.InstanceClass.T4G,ec2.InstanceSize.MICRO),
   vpc,subnetGroup:databaseSubnets,securityGroups:[databaseNetwork],
   credentials:rds.Credentials.fromGeneratedSecret('continuity_admin',{excludeCharacters:' @/\\"\'`'}),
   databaseName:'rillora',storageType:rds.StorageType.GP3,allocatedStorage:20,storageEncrypted:true,
   multiAz:false,publiclyAccessible:false,backupRetention:Duration.days(7),deleteAutomatedBackups:false,
   deletionProtection:true,removalPolicy:RemovalPolicy.RETAIN,copyTagsToSnapshot:true,
   parameterGroup:parameters,cloudwatchLogsExports:['postgresql'],cloudwatchLogsRetention:logs.RetentionDays.ONE_MONTH,
   engineLifecycleSupport:rds.EngineLifecycleSupport.OPEN_SOURCE_RDS_EXTENDED_SUPPORT_DISABLED,
  });
  if(!database.secret)throw new Error('Production database credential was not generated');
  database.secret.applyRemovalPolicy(RemovalPolicy.RETAIN);
  const runtimeCredential=new secrets.Secret(this,'RuntimeCredential',{
   description:'Production runtime credential; independent of staging and migration identity',
   generateSecretString:{secretStringTemplate:JSON.stringify({username:'continuity_runtime_production'}),generateStringKey:'password',passwordLength:48,excludeCharacters:' @/\\"\'`'},
  });
  runtimeCredential.applyRemovalPolicy(RemovalPolicy.RETAIN);
  const contentKey=new kms.Key(this,'ContentKey',{description:'Rillora production private-content wrapping key',
   enableKeyRotation:true,pendingWindow:Duration.days(30),removalPolicy:RemovalPolicy.RETAIN});
  contentKey.node.addDependency(database);
  const journal=new dynamodb.Table(this,'RecoveryJournal',{
   partitionKey:{name:'pk',type:dynamodb.AttributeType.STRING},sortKey:{name:'sk',type:dynamodb.AttributeType.STRING},
   billingMode:dynamodb.BillingMode.PAY_PER_REQUEST,encryption:dynamodb.TableEncryption.AWS_MANAGED,
   pointInTimeRecoverySpecification:{pointInTimeRecoveryEnabled:true,recoveryPeriodInDays:35},
   deletionProtection:true,removalPolicy:RemovalPolicy.RETAIN,
  });
  journal.node.addDependency(database);
  const cluster=new ecs.Cluster(this,'Cluster',{vpc,containerInsightsV2:ecs.ContainerInsights.ENABLED});
  const directory=dirname(fileURLToPath(import.meta.url));
  const image=ecs.ContainerImage.fromAsset(resolve(directory,'../../../apps/api'),{
   platform:ecr.Platform.LINUX_ARM64,
   buildArgs:{RDS_CA_BUNDLE_SHA256:'e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3'},
  });
  const logGroup=new logs.LogGroup(this,'MaintenanceLogs',{retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});
  const environment={NODE_ENV:'production',DATA_REGION:'eu-central-1',DATABASE_PORT:'5432',DATABASE_NAME:'rillora',
   DATABASE_SSL_MODE:'verify-full',DATABASE_SSL_CA_PATH:'/app/certs/rds-global-bundle.pem',
   CONTENT_PROTECTION_MODE:'encrypted',CONTENT_KMS_KEY_ARN:contentKey.keyArn,CONTENT_KEY_NAMESPACE:'rillora-production',
   RECOVERY_JOURNAL_TABLE:journal.tableName,RECOVERY_ENVIRONMENT:'production'};
  const task=(label:string,recovery:boolean)=>{
   const definition=new ecs.FargateTaskDefinition(this,label,{cpu:256,memoryLimitMiB:512,
    runtimePlatform:{cpuArchitecture:ecs.CpuArchitecture.ARM64,operatingSystemFamily:ecs.OperatingSystemFamily.LINUX}});
   definition.addContainer('Maintenance',{image,
    command:recovery?['node','-e',"process.stderr.write('Explicit isolated recovery operation is required\\n');process.exit(1)"]:
     ['/bin/sh','-c','node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce'],
    environment:{...environment,...(recovery?{}:{DATABASE_HOST:database.instanceEndpoint.hostname})},
    secrets:{DATABASE_USER:ecs.Secret.fromSecretsManager(database.secret!,'username'),DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(database.secret!,'password'),
     ...(!recovery?{RUNTIME_DATABASE_USER:ecs.Secret.fromSecretsManager(runtimeCredential,'username'),RUNTIME_DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(runtimeCredential,'password')}:{})},
    logging:ecs.LogDrivers.awsLogs({logGroup,streamPrefix:recovery?'recovery':'migration'}),
   });
   definition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:recovery?['kms:Decrypt']:['kms:GenerateDataKey','kms:Decrypt'],resources:[contentKey.keyArn],
    conditions:{StringEquals:{'kms:EncryptionContext:rillora_application':'content-v1','kms:EncryptionContext:rillora_environment':'rillora-production'},
     Null:{'kms:EncryptionContext:owner_id':'false','kms:EncryptionContext:key_id':'false'}}}));
   definition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:recovery?['dynamodb:GetItem','dynamodb:Query','dynamodb:Scan']:['dynamodb:GetItem','dynamodb:PutItem','dynamodb:Query','dynamodb:Scan'],resources:[journal.tableArn]}));
   return definition;
  };
  const migration=task('MigrationTask',false),recovery=task('RecoveryTask',true);
  const user=iam.User.fromUserArn(this,'ExistingOperator',`arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:user/rillora/rillora-operator`);
  const operator=new iam.Role(this,'Operator',{roleName:'rillora-production-operator',path:'/rillora/',
   assumedBy:new iam.ArnPrincipal(user.userArn).withConditions({Bool:{'aws:MultiFactorAuthPresent':'true'}}),maxSessionDuration:Duration.hours(1)});
  // A separate managed policy avoids the IAM user's aggregate2KiB inline limit.
  // Its scope stays one MFA-gated role; no other project role is added.
  new iam.ManagedPolicy(this,'AssumeProductionOperator',{users:[user],statements:[new iam.PolicyStatement({actions:['sts:AssumeRole'],resources:[operator.roleArn],conditions:{Bool:{'aws:MultiFactorAuthPresent':'true'}}})]});
  operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:RunTask'],resources:[migration.taskDefinitionArn,recovery.taskDefinitionArn],conditions:{ArnEquals:{'ecs:cluster':cluster.clusterArn}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['iam:PassRole'],resources:[migration.taskRole.roleArn,migration.executionRole!.roleArn,recovery.taskRole.roleArn,recovery.executionRole!.roleArn],conditions:{StringEquals:{'iam:PassedToService':'ecs-tasks.amazonaws.com'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeTasks','ecs:StopTask'],resources:['*'],conditions:{ArnEquals:{'ecs:cluster':cluster.clusterArn}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeTaskDefinition','rds:DescribeDBInstances','rds:DescribeDBSnapshots'],resources:['*'],conditions:{StringEquals:{'aws:RequestedRegion':'eu-central-1'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['logs:GetLogEvents','logs:DescribeLogStreams'],resources:[logGroup.logGroupArn,`${logGroup.logGroupArn}:*`]}));
  const snapshotArn=this.formatArn({service:'rds',resource:'snapshot',resourceName:'rillora-production-recovery-*',arnFormat:ArnFormat.COLON_RESOURCE_NAME});
  const restoredArn=this.formatArn({service:'rds',resource:'db',resourceName:'rillora-recovery-*',arnFormat:ArnFormat.COLON_RESOURCE_NAME});
  operator.addToPolicy(new iam.PolicyStatement({actions:['rds:CreateDBSnapshot'],resources:[database.instanceArn,snapshotArn]}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['rds:RestoreDBInstanceFromDBSnapshot'],resources:[snapshotArn,restoredArn]}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['rds:AddTagsToResource'],resources:[snapshotArn,restoredArn]}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['rds:DeleteDBInstance'],resources:[restoredArn],conditions:{StringEquals:{'aws:ResourceTag/Environment':'RecoveryDrill'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['kms:DescribeKey','kms:GetKeyRotationStatus'],resources:[contentKey.keyArn]}));
  const outputs={DatabaseIdentifier:database.instanceIdentifier,DatabaseHost:database.instanceEndpoint.hostname,
   DatabaseSubnetGroup:databaseSubnets.subnetGroupName,DatabaseParameterGroup:parameters.bindToInstance({}).parameterGroupName,ClusterName:cluster.clusterName,
   MaintenanceSubnetIds:vpc.publicSubnets.map(s=>s.subnetId).join(','),MigrationSecurityGroupId:sourceJobs.securityGroupId,
   RecoverySecurityGroupId:recoveryJobs.securityGroupId,RecoveryDatabaseSecurityGroupId:recoveryDatabaseNetwork.securityGroupId,
   MigrationTaskDefinitionArn:migration.taskDefinitionArn,RecoveryTaskDefinitionArn:recovery.taskDefinitionArn,
   MaintenanceLogGroup:logGroup.logGroupName,ContentKeyArn:contentKey.keyArn,RecoveryJournalTable:journal.tableName,
   OperatorRoleArn:operator.roleArn,ProductionTrafficReady:'false',BackupRetentionDays:'7'};
  for(const [name,value] of Object.entries(outputs))new CfnOutput(this,name,{value});
 }
}
