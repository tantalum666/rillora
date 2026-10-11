import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ArnFormat,Aws,CfnOutput,Duration,RemovalPolicy,Stack,Tags,type StackProps,
 aws_ec2 as ec2,aws_ecs as ecs,aws_ecr_assets as ecr,aws_iam as iam,
 aws_kms as kms,aws_logs as logs,aws_rds as rds,aws_secretsmanager as secrets,
 aws_dynamodb as dynamodb, aws_ecr as ecrRepository} from 'aws-cdk-lib';
import type {Construct} from 'constructs';
import {RilloraProductionRuntime} from './rillora-production-runtime.js';
import {allowAppleCertificateStatusChecks} from './apple-certificate-egress.js';
import {RilloraMaintenanceBroker} from './rillora-maintenance-broker.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RilloraRuntimeBoundaryKeys,RilloraRecoveryAttestationBroker} from './rillora-runtime-boundaries.js';

export interface ProductionStackProps extends StackProps {
 runtimeEnabled?:boolean; runtimeDesiredCount?:0|1;
 reviewPrepared?:boolean; reviewEnabled?:boolean; runtimeImageTag?:string;
 retentionEnabled?:boolean;
 identityServicesEnabled?:boolean;
 stripeNotificationsSecretArn?:string;
}

/** An isolated production data foundation. It exposes no customer HTTP service. */
export class RilloraProductionStack extends Stack {
 constructor(scope:Construct,id:string,props:ProductionStackProps){
  super(scope,id,props);
  if(props.env?.region!=='eu-central-1')throw new Error('Production data stays in the reviewed Frankfurt region');
  if((props.reviewPrepared||props.reviewEnabled||props.runtimeImageTag)&&!props.runtimeEnabled)throw new Error('Review preparation requires the existing production runtime');
  if(props.reviewEnabled&&!props.reviewPrepared)throw new Error('Prepare review secrets before enabling review');
  if(props.identityServicesEnabled&&!props.reviewEnabled)throw new Error('Identity services require the prepared restricted production runtime');
  if(props.retentionEnabled&&!props.reviewEnabled)throw new Error('Retention requires an operational restricted production runtime');
  if(props.stripeNotificationsSecretArn&&(!props.reviewEnabled
   || !/^arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora\/production\/stripe-billing-[A-Za-z0-9]{6}$/.test(props.stripeNotificationsSecretArn)))throw new Error('Stripe notification preparation requires restricted review and the exact production billing secret');
  if(props.runtimeImageTag&&!/^[a-f0-9]{64}$/.test(props.runtimeImageTag))throw new Error('Only an immutable production asset image tag may be retained');
  if(props.reviewEnabled&&props.runtimeImageTag)throw new Error('Review activation must use the newly verified API image');
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
  if(props.reviewEnabled)allowAppleCertificateStatusChecks(recoveryJobs);
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
   pointInTimeRecoverySpecification:{pointInTimeRecoveryEnabled:true,recoveryPeriodInDays:35},timeToLiveAttribute:'expiresAt',
   deletionProtection:true,removalPolicy:RemovalPolicy.RETAIN,
  });
  journal.node.addDependency(database);
  const boundaryKeys=new RilloraRuntimeBoundaryKeys(this,'RuntimeBoundaries','production');
  const journalBroker=new RilloraRecoveryAttestationBroker(this,'RecoveryAttestation',journal);
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
   RECOVERY_JOURNAL_TABLE:journal.tableName,RECOVERY_ENVIRONMENT:'production',
   RECOVERY_JOURNAL_BROKER_ARN:journalBroker.function.functionArn};
  const task=(label:string,recovery:boolean)=>{
   const definition=new ecs.FargateTaskDefinition(this,label,{cpu:256,memoryLimitMiB:512,
    runtimePlatform:{cpuArchitecture:ecs.CpuArchitecture.ARM64,operatingSystemFamily:ecs.OperatingSystemFamily.LINUX}});
   definition.addContainer('Maintenance',{image,
    command:recovery?['node','-e',"process.stderr.write('Explicit isolated recovery operation is required\\n');process.exit(1)"]:
     JSON.parse(readFileSync(resolve(directory,'../../../tools/maintenance-broker/production-migration.json'),'utf8')) as string[],
    environment:{...environment,...(recovery?{}:{DATABASE_HOST:database.instanceEndpoint.hostname})},
    secrets:{DATABASE_USER:ecs.Secret.fromSecretsManager(database.secret!,'username'),DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(database.secret!,'password'),
     ...(!recovery?{RUNTIME_DATABASE_USER:ecs.Secret.fromSecretsManager(runtimeCredential,'username'),RUNTIME_DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(runtimeCredential,'password'),
      ...boundaryKeys.migrationSecrets(),RECOVERY_ATTESTATION_KEY:ecs.Secret.fromSecretsManager(journalBroker.authority)}:{})},
    logging:ecs.LogDrivers.awsLogs({logGroup,streamPrefix:recovery?'recovery':'migration'}),
   });
   definition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:recovery?['kms:Decrypt']:['kms:GenerateDataKey','kms:Decrypt'],resources:[contentKey.keyArn],
    conditions:{StringEquals:{'kms:EncryptionContext:rillora_application':'content-v1','kms:EncryptionContext:rillora_environment':'rillora-production'},
     Null:{'kms:EncryptionContext:owner_id':'false','kms:EncryptionContext:key_id':'false'}}}));
   definition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:recovery?['dynamodb:GetItem','dynamodb:Query','dynamodb:Scan']:['dynamodb:GetItem','dynamodb:PutItem','dynamodb:Query','dynamodb:Scan'],resources:[journal.tableArn]}));
   if(!recovery)journalBroker.function.grantInvoke(definition.taskRole);
   return definition;
  };
  const migration=task('MigrationTask',false),recovery=task('RecoveryTask',true);
  const user=iam.User.fromUserArn(this,'ExistingOperator',`arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:user/rillora/rillora-operator`);
  const operator=new iam.Role(this,'Operator',{roleName:'rillora-production-operator',path:'/rillora/',
   assumedBy:new iam.ArnPrincipal(user.userArn).withConditions({Bool:{'aws:MultiFactorAuthPresent':'true'}}),maxSessionDuration:Duration.hours(1)});
  // A separate managed policy avoids the IAM user's aggregate2KiB inline limit.
  // Its scope stays one MFA-gated role; no other project role is added.
  new iam.ManagedPolicy(this,'AssumeProductionOperator',{users:[user],statements:[new iam.PolicyStatement({actions:['sts:AssumeRole'],resources:[operator.roleArn],conditions:{Bool:{'aws:MultiFactorAuthPresent':'true'}}})]});
  const maintenancePolicies:iam.PolicyStatement[]=[];
  maintenancePolicies.push(new iam.PolicyStatement({actions:['ecs:RunTask'],resources:[migration.taskDefinitionArn,recovery.taskDefinitionArn],conditions:{ArnEquals:{'ecs:cluster':cluster.clusterArn}}}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['iam:PassRole'],resources:[migration.taskRole.roleArn,migration.executionRole!.roleArn,recovery.taskRole.roleArn,recovery.executionRole!.roleArn],conditions:{StringEquals:{'iam:PassedToService':'ecs-tasks.amazonaws.com'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeTasks','ecs:StopTask'],resources:['*'],conditions:{ArnEquals:{'ecs:cluster':cluster.clusterArn}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeTaskDefinition','rds:DescribeDBInstances','rds:DescribeDBSnapshots'],resources:['*'],conditions:{StringEquals:{'aws:RequestedRegion':'eu-central-1'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['logs:GetLogEvents','logs:DescribeLogStreams'],resources:[logGroup.logGroupArn,`${logGroup.logGroupArn}:*`]}));
  const snapshotArn=this.formatArn({service:'rds',resource:'snapshot',resourceName:'rillora-production-recovery-*',arnFormat:ArnFormat.COLON_RESOURCE_NAME});
  const restoredArn=this.formatArn({service:'rds',resource:'db',resourceName:'rillora-recovery-*',arnFormat:ArnFormat.COLON_RESOURCE_NAME});
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:CreateDBSnapshot'],resources:[database.instanceArn,snapshotArn]}));
  const rdsArn=(kind:string,name:string)=>this.formatArn({service:'rds',resource:kind,resourceName:name,arnFormat:ArnFormat.COLON_RESOURCE_NAME});
  // RDS authorizes the parameter/option/subnet groups as well as the snapshot.
  // Do not compensate for a missing dependency with a resource:* restore grant.
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:RestoreDBInstanceFromDBSnapshot'],resources:[snapshotArn,
   rdsArn('pg',parameters.bindToInstance({}).parameterGroupName),rdsArn('subgrp',databaseSubnets.subnetGroupName),rdsArn('og','default:postgres-16')]}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:RestoreDBInstanceFromDBSnapshot'],resources:[restoredArn],
   conditions:{StringEquals:{'aws:RequestTag/Project':'Rillora','aws:RequestTag/Environment':'RecoveryDrill','rds:DatabaseClass':'db.t4g.micro'},
    Bool:{'rds:PubliclyAccessible':'false'}}}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:AddTagsToResource','rds:ListTagsForResource'],resources:[snapshotArn,restoredArn]}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:DescribeDBInstances','rds:DescribeDBSnapshots'],resources:['*'],conditions:{StringEquals:{'aws:RequestedRegion':'eu-central-1'}}}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:DeleteDBInstance'],resources:[restoredArn],conditions:{StringEquals:{'aws:ResourceTag/Environment':'RecoveryDrill','aws:ResourceTag/Project':'Rillora'}}}));
  maintenancePolicies.push(new iam.PolicyStatement({actions:['rds:DeleteDBSnapshot'],resources:[snapshotArn],conditions:{StringEquals:{'aws:ResourceTag/Environment':'RecoveryDrill','aws:ResourceTag/Project':'Rillora'}}}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['cloudformation:DescribeStacks'],resources:[this.stackId]}));
  operator.addToPolicy(new iam.PolicyStatement({actions:['kms:DescribeKey','kms:GetKeyRotationStatus'],resources:[contentKey.keyArn]}));
  const runtime=props.runtimeEnabled?new RilloraProductionRuntime(this,'Runtime',{
   vpc,cluster,database,databaseNetwork,credential:runtimeCredential,key:contentKey,journal,boundaryKeys,journalBroker:journalBroker.function,
   image:props.runtimeImageTag?ecs.ContainerImage.fromEcrRepository(ecrRepository.Repository.fromRepositoryAttributes(this,'ExistingAssetRepository',{
    repositoryArn:`arn:${Aws.PARTITION}:ecr:eu-central-1:${Aws.ACCOUNT_ID}:repository/cdk-hnb659fds-container-assets-${Aws.ACCOUNT_ID}-eu-central-1`,
    repositoryName:`cdk-hnb659fds-container-assets-${Aws.ACCOUNT_ID}-eu-central-1`}),props.runtimeImageTag):image,
   operator,environment,reviewPrepared:props.reviewPrepared,reviewEnabled:props.reviewEnabled,retentionEnabled:props.retentionEnabled,identityServicesEnabled:props.identityServicesEnabled,recoveryTask:recovery,
   stripeNotificationsSecretArn:props.stripeNotificationsSecretArn,
   desiredCount:props.runtimeDesiredCount??0,
  }):null;
  if(runtime)maintenancePolicies.push(new iam.PolicyStatement({actions:['ecs:DescribeServices'],resources:runtime.sourceWriterServices.map(s=>s.serviceArn)}));
  const broker=new RilloraMaintenanceBroker(this,'MaintenanceBroker',{operator,policies:maintenancePolicies,settings:{
    environment:'production',source:'rillora-production',sourceHost:database.instanceEndpoint.hostname,cluster:cluster.clusterName,
    migrationTask:migration.taskDefinitionArn,recoveryTask:recovery.taskDefinitionArn,
    subnets:vpc.publicSubnets.map(s=>s.subnetId),migrationSecurityGroup:sourceJobs.securityGroupId,
    recoveryTaskSecurityGroup:recoveryJobs.securityGroupId,recoveryDatabaseSecurityGroup:recoveryDatabaseNetwork.securityGroupId,
    sourceDatabaseSecurityGroup:databaseNetwork.securityGroupId,vpc:vpc.vpcId,subnetGroup:databaseSubnets.subnetGroupName,
    parameterGroup:parameters.bindToInstance({}).parameterGroupName,sourceServices:runtime?.sourceWriterServices.map(s=>s.serviceName)??[],
    isolationScriptSha256:createHash('sha256').update(readFileSync(resolve(directory,'../../../tools/release/probe_recovery_isolation.mjs'))).digest('hex'),
  }});
  new CfnOutput(this,'MaintenanceBrokerFunctionName',{value:broker.function.functionName});
  new CfnOutput(this,'RecoverySourceServiceNames',{value:JSON.stringify(runtime?.sourceWriterServices.map(s=>s.serviceName)??[])});
  const outputs={ProductionVpcId:vpc.vpcId,DatabaseSecurityGroupId:databaseNetwork.securityGroupId,
   DatabaseIdentifier:database.instanceIdentifier,DatabaseHost:database.instanceEndpoint.hostname,
   DatabaseSubnetGroup:databaseSubnets.subnetGroupName,DatabaseParameterGroup:parameters.bindToInstance({}).parameterGroupName,ClusterName:cluster.clusterName,
   MaintenanceSubnetIds:vpc.publicSubnets.map(s=>s.subnetId).join(','),MigrationSecurityGroupId:sourceJobs.securityGroupId,
   RecoverySecurityGroupId:recoveryJobs.securityGroupId,RecoveryDatabaseSecurityGroupId:recoveryDatabaseNetwork.securityGroupId,
   MigrationTaskDefinitionArn:migration.taskDefinitionArn,RecoveryTaskDefinitionArn:recovery.taskDefinitionArn,
   MaintenanceLogGroup:logGroup.logGroupName,ContentKeyArn:contentKey.keyArn,RecoveryJournalTable:journal.tableName,
   OperatorRoleArn:operator.roleArn,ProductionTrafficReady:'false',BackupRetentionDays:'7'};
  for(const [name,value] of Object.entries(outputs))new CfnOutput(this,name,{value});
 }
}
