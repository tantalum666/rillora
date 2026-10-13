import { Construct } from 'constructs';
import { allowAppleCertificateStatusChecks } from './apple-certificate-egress.js';
import {RilloraRuntimeBoundaryKeys,RilloraIdentityDeletionWorker} from './rillora-runtime-boundaries.js';
import { CfnOutput, CfnParameter, Duration, RemovalPolicy, aws_ec2 as ec2, aws_ecs as ecs,
 aws_iam as iam, aws_logs as logs, aws_kms as kms, aws_dynamodb as dynamodb,
 aws_rds as rds, aws_secretsmanager as secrets, aws_certificatemanager as acm,
 aws_servicediscovery as discovery, aws_apigatewayv2 as gateway,
 aws_apigatewayv2_integrations as integrations,aws_lambda as lambda } from 'aws-cdk-lib';

interface Props {
 vpc:ec2.Vpc; cluster:ecs.Cluster; database:rds.DatabaseInstance; databaseNetwork:ec2.SecurityGroup;
 credential:secrets.Secret; key:kms.Key; journal:dynamodb.Table; image:ecs.ContainerImage;
 operator:iam.Role; environment:Record<string,string>; desiredCount:0|1;
 reviewPrepared?:boolean; reviewEnabled?:boolean;
 liveEnabled?:boolean; stripeCheckoutEnabled?:boolean;
 appleProductionPrepared?:boolean; appleProductionEnabled?:boolean; appleReviewEnabled?:boolean;
 retentionEnabled?:boolean;
 identityServicesEnabled?:boolean;
 stripeNotificationsSecretArn?:string;
 recoveryTask?:ecs.FargateTaskDefinition;
 boundaryKeys:RilloraRuntimeBoundaryKeys;
 journalBroker:lambda.IFunction;
}

/** Closed production transport. Adding it never opens identity or customer data. */
export class RilloraProductionRuntime extends Construct {
 readonly apiService:ecs.FargateService;
 readonly sourceWriterServices:ecs.FargateService[];
 readonly appleReviewScope?:{identityDigests:string;expiresAt:string};
 constructor(scope:Construct,id:string,p:Props){
  super(scope,id);
  const hostname='origin.production.rillora.xyz';
  const certificate=new acm.Certificate(this,'Certificate',{
   domainName:hostname,validation:acm.CertificateValidation.fromDns(),allowExport:true,
  });
  certificate.applyRemovalPolicy(RemovalPolicy.RETAIN);
  const network=new ec2.SecurityGroup(this,'ApiNetwork',{vpc:p.vpc,allowAllOutbound:false,
   description:'Production HTTPS container; ingress only from its VPC Link'});
  const ingress=new ec2.SecurityGroup(this,'IngressNetwork',{vpc:p.vpc,allowAllOutbound:false,
   description:'Private API Gateway VPC Link; only the production HTTPS target'});
  network.addIngressRule(ingress,ec2.Port.tcp(8443),'Verified TLS from the exact private VPC Link');
  ingress.addEgressRule(network,ec2.Port.tcp(8443),'Production HTTPS only');
  network.addEgressRule(ec2.Peer.ipv4('0.0.0.0/0'),ec2.Port.tcp(443),'Outbound AWS and identity HTTPS');
  if(p.reviewEnabled||p.appleReviewEnabled||p.appleProductionEnabled)allowAppleCertificateStatusChecks(network);
  network.addEgressRule(p.databaseNetwork,ec2.Port.tcp(5432),'Verified TLS to private production PostgreSQL');
  p.databaseNetwork.addIngressRule(network,ec2.Port.tcp(5432),'Only the production runtime login');
  const namespace=new discovery.PrivateDnsNamespace(this,'Namespace',{vpc:p.vpc,name:'production.rillora.internal'});
  const serviceDiscovery=namespace.createService('ApiDiscovery',{name:'api',dnsRecordType:discovery.DnsRecordType.SRV,dnsTtl:Duration.seconds(10)});
  const apiLogs=new logs.LogGroup(this,'ApiLogs',{retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});
  const task=new ecs.FargateTaskDefinition(this,'ApiTask',{cpu:256,memoryLimitMiB:512,
   runtimePlatform:{cpuArchitecture:ecs.CpuArchitecture.ARM64,operatingSystemFamily:ecs.OperatingSystemFamily.LINUX}});
  const reviewEnvironment:Record<string,string>={};
  const reviewSecrets:Record<string,ecs.Secret>={};
  const deletionSecrets:Record<string,ecs.Secret>={};
  if(p.reviewPrepared){
   const apple=new secrets.Secret(this,'AppleReviewSecret',{secretName:'rillora/production/apple-review',
    description:'Sandbox IAP configuration for explicitly enrolled release-review identities only'});
   const web=new secrets.Secret(this,'WebOidcSecret',{secretName:'rillora/production/web-oidc',
    description:'Existing production Web code-flow credential; independent of staging'});
   for(const secret of [apple,web]){
    secret.applyRemovalPolicy(RemovalPolicy.RETAIN);
    p.operator.addToPolicy(new iam.PolicyStatement({actions:['secretsmanager:DescribeSecret','secretsmanager:PutSecretValue'],resources:[secret.secretArn]}));
   }
   new CfnOutput(this,'AppleReviewSecretArn',{value:apple.secretArn});
   new CfnOutput(this,'WebOidcSecretArn',{value:web.secretArn});
   for(const [id,name,prefix] of [
    ['AccountDeletion','account-deletion','AUTH0_DELETION'],
    ['EmailVerification','email-verification','AUTH0_EMAIL_VERIFICATION'],
   ]){
    const secret=new secrets.Secret(this,`${id}ServiceSecret`,{secretName:`rillora/production/${name}`,
     description:`Dedicated production ${name} Auth0 service. Never reuse Preview credentials.`});
    secret.applyRemovalPolicy(RemovalPolicy.RETAIN);
    p.operator.addToPolicy(new iam.PolicyStatement({actions:['secretsmanager:DescribeSecret','secretsmanager:PutSecretValue'],resources:[secret.secretArn]}));
    new CfnOutput(this,`${id}ServiceSecretArn`,{value:secret.secretArn});
    if(p.identityServicesEnabled){
     for(const [key,field] of [['DOMAIN','domain'],['CLIENT_ID','client_id'],['CLIENT_SECRET','client_secret']]){
      (prefix==='AUTH0_DELETION'?deletionSecrets:reviewSecrets)[`${prefix}_${key}`]=ecs.Secret.fromSecretsManager(secret,field);
     }
    }
   }

   if(p.recoveryTask){
    apple.grantRead(p.recoveryTask.taskRole);
    p.recoveryTask.defaultContainer!.addEnvironment('APPLE_REVIEW_SECRET_ARN',apple.secretArn);
    p.recoveryTask.defaultContainer!.addEnvironment('APPLE_ROOT_CERTIFICATE_DIRECTORY','/app/certificates/apple');
   }
   if(p.reviewEnabled||p.liveEnabled){
    Object.assign(reviewEnvironment,{PRODUCTION_RUNTIME_MODE:p.liveEnabled?'live':'review',
     WEB_APP_ORIGIN:'https://app.rillora.xyz',OIDC_ISSUER_URL:'https://login.rillora.xyz',
     OIDC_CLIENT_ID:'EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz',OIDC_REDIRECT_URI:'https://app.rillora.xyz/api/auth/callback',
     NATIVE_OIDC_CLIENT_ID:'POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4',OIDC_API_AUDIENCE:'urn:rillora:production:api'});
    reviewSecrets.OIDC_CLIENT_SECRET=ecs.Secret.fromSecretsManager(web,'client_secret');
   }
   if(p.reviewEnabled){
    const identities=new CfnParameter(this,'ReviewIdentityDigests',{type:'String',noEcho:true,
     allowedPattern:'[a-f0-9]{64}(,[a-f0-9]{64}){0,7}',description:'Exact issuer/subject SHA256 values of prepared synthetic review identities'});
    const expiry=new CfnParameter(this,'ReviewExpiresAt',{type:'String',
     allowedPattern:'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z',description:'Explicit UTC review access expiry; enforced on every authenticated request'});
    Object.assign(reviewEnvironment,{PRODUCTION_RUNTIME_MODE:'review',ALLOW_APPLE_REVIEW_INTEGRATION:'true',
     APPLE_REVIEW_SECRET_ARN:apple.secretArn,APPLE_ROOT_CERTIFICATE_DIRECTORY:'/app/certificates/apple',
     PRODUCTION_REVIEW_IDENTITY_SHA256:identities.valueAsString,PRODUCTION_REVIEW_EXPIRES_AT:expiry.valueAsString});
    apple.grantRead(task.taskRole);
   }
   if(p.appleReviewEnabled){
    const identities=new CfnParameter(this,'AppleReviewIdentityDigests',{type:'String',noEcho:true,
     allowedPattern:'[a-f0-9]{64}(,[a-f0-9]{64}){0,7}',description:'Exact existing identities permitted to use Sandbox purchase routes; no ordinary customer restriction'});
    const expiry=new CfnParameter(this,'AppleReviewExpiresAt',{type:'String',
     allowedPattern:'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z',description:'UTC Sandbox access expiry; API enforces a maximum 31-day window'});
    this.appleReviewScope={identityDigests:identities.valueAsString,expiresAt:expiry.valueAsString};
    Object.assign(reviewEnvironment,{ALLOW_APPLE_REVIEW_INTEGRATION:'true',APPLE_REVIEW_SECRET_ARN:apple.secretArn,
     APPLE_ROOT_CERTIFICATE_DIRECTORY:'/app/certificates/apple',APPLE_REVIEW_IDENTITY_SHA256:identities.valueAsString,
     APPLE_REVIEW_EXPIRES_AT:expiry.valueAsString});
    apple.grantRead(task.taskRole);
   }
  }
  if(p.appleProductionPrepared){
   const apple=new secrets.Secret(this,'AppleProductionSecret',{secretName:'rillora/production/apple-iap',
    description:'Rillora App Store Production verification context; independently configured from Sandbox review'});
   apple.applyRemovalPolicy(RemovalPolicy.RETAIN);
   p.operator.addToPolicy(new iam.PolicyStatement({actions:['secretsmanager:DescribeSecret','secretsmanager:PutSecretValue'],resources:[apple.secretArn]}));
   new CfnOutput(this,'AppleProductionSecretArn',{value:apple.secretArn});
   // Preparation creates only the vault. Do not load its generated placeholder.
   if(p.appleProductionEnabled){
    apple.grantRead(task.taskRole);
    Object.assign(reviewEnvironment,{ALLOW_APPLE_PRODUCTION_INTEGRATION:'true',APPLE_PRODUCTION_SECRET_ARN:apple.secretArn,
     APPLE_ROOT_CERTIFICATE_DIRECTORY:'/app/certificates/apple'});
    if(p.recoveryTask){
     apple.grantRead(p.recoveryTask.taskRole);
     p.recoveryTask.defaultContainer!.addEnvironment('APPLE_PRODUCTION_SECRET_ARN',apple.secretArn);
     p.recoveryTask.defaultContainer!.addEnvironment('APPLE_ROOT_CERTIFICATE_DIRECTORY','/app/certificates/apple');
    }
   }
  }
  if(p.stripeNotificationsSecretArn){
   const stripe=secrets.Secret.fromSecretCompleteArn(this,'StripeNotificationsSecret',p.stripeNotificationsSecretArn);
   stripe.grantRead(task.taskRole);
   if(p.recoveryTask){
    stripe.grantRead(p.recoveryTask.taskRole);
    p.recoveryTask.defaultContainer!.addEnvironment('STRIPE_PRODUCTION_SECRET_ARN',p.stripeNotificationsSecretArn);
   }
   Object.assign(reviewEnvironment,{ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS:'true',STRIPE_PRODUCTION_SECRET_ARN:p.stripeNotificationsSecretArn});
   new CfnOutput(this,'StripeNotificationsSecretArn',{value:p.stripeNotificationsSecretArn});
  }
  const linux=new ecs.LinuxParameters(this,'Linux');linux.dropCapabilities(ecs.Capability.ALL);
  const container=task.addContainer('Api',{
   image:p.image,readonlyRootFilesystem:true,linuxParameters:linux,
   environment:{...p.environment,PRODUCTION_RUNTIME_MODE:'closed',HOST:'0.0.0.0',PORT:'8443',
    DATABASE_HOST:p.database.instanceEndpoint.hostname,DATABASE_POOL_MAX:'5',DATABASE_CONNECTION_TIMEOUT_MS:'10000',
    API_TLS_CERTIFICATE_ARN:certificate.certificateArn,API_TLS_SERVER_NAME:hostname,
    TRUST_PROXY_HOPS:'1',CORS_ORIGINS:'https://app.rillora.xyz',
    ALLOW_DEV_AUTH:'false',ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL:'false',ALLOW_STRIPE_TEST_INTEGRATION:'false',
    ALLOW_APPLE_SANDBOX_INTEGRATION:'false',ALLOW_FAMILY_MAINTENANCE_PREVIEW:'false',
    ALLOW_APPLE_PRODUCTION_INTEGRATION:'false',ALLOW_STRIPE_PRODUCTION_INTEGRATION:p.liveEnabled&&p.stripeCheckoutEnabled?'true':'false',
    ALLOW_RETENTION_WORKER:p.retentionEnabled?'true':'false',
    ...(p.identityServicesEnabled?{DELETION_WORKER_ENABLED:'true',DELETION_PROOF_KMS_KEY_ARN:p.boundaryKeys.proof.keyArn}:{}),...reviewEnvironment},
   secrets:{DATABASE_USER:ecs.Secret.fromSecretsManager(p.credential,'username'),DATABASE_PASSWORD:ecs.Secret.fromSecretsManager(p.credential,'password'),
    ...p.boundaryKeys.apiSecrets(),...reviewSecrets},
   logging:ecs.LogDrivers.awsLogs({logGroup:apiLogs,streamPrefix:'api'}),
   healthCheck:{command:['CMD','node','dist/healthcheck.js'],interval:Duration.seconds(30),timeout:Duration.seconds(5),retries:3,startPeriod:Duration.seconds(45)},
  });
  container.addPortMappings({name:'https',containerPort:8443,protocol:ecs.Protocol.TCP});
  task.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:['acm:DescribeCertificate','acm:ExportCertificate'],resources:[certificate.certificateArn]}));
  task.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({actions:['kms:GenerateDataKey','kms:Decrypt'],resources:[p.key.keyArn],
   conditions:{StringEquals:{'kms:EncryptionContext:rillora_application':'content-v1','kms:EncryptionContext:rillora_environment':'rillora-production'},
    Null:{'kms:EncryptionContext:owner_id':'false','kms:EncryptionContext:key_id':'false'}}}));
  p.journalBroker.grantInvoke(task.taskRole);
  let deletionWorker:RilloraIdentityDeletionWorker|undefined;
  if(p.identityServicesEnabled){
   p.boundaryKeys.allowProof(task.taskRole,'production','kms:GenerateDataKey');
   deletionWorker=new RilloraIdentityDeletionWorker(this,'IdentityWorker',{environment:'production',vpc:p.vpc,cluster:p.cluster,
    databaseNetwork:p.databaseNetwork,keys:p.boundaryKeys,image:p.image,desiredCount:p.desiredCount,
    databaseEnvironment:{...p.environment,DATABASE_HOST:p.database.instanceEndpoint.hostname},
    providerEnvironment:{},providerSecrets:deletionSecrets,
    issuers:[reviewEnvironment.OIDC_ISSUER_URL!],clients:[reviewEnvironment.OIDC_CLIENT_ID!,reviewEnvironment.NATIVE_OIDC_CLIENT_ID!],
    broker:p.journalBroker});
  }
  const link=new gateway.VpcLink(this,'VpcLink',{vpc:p.vpc,subnets:{subnetType:ec2.SubnetType.PRIVATE_ISOLATED},securityGroups:[ingress]});
  const api=new gateway.HttpApi(this,'HttpApi',{apiName:'rillora-production-closed',
   description:'Production transport acceptance only; customer routes remain closed',
   defaultIntegration:new integrations.HttpServiceDiscoveryIntegration('ProductionHttps',serviceDiscovery,{vpcLink:link,secureServerName:hostname}),
  });
  const gatewayLogs=new logs.LogGroup(this,'GatewayLogs',{retention:logs.RetentionDays.ONE_MONTH,removalPolicy:RemovalPolicy.RETAIN});
  const stage=api.defaultStage!.node.defaultChild as gateway.CfnStage;
  stage.defaultRouteSettings={throttlingBurstLimit:20,throttlingRateLimit:10};
  // No request paths, query strings, addresses, headers or response bodies.
  stage.accessLogSettings={destinationArn:gatewayLogs.logGroupArn,format:JSON.stringify({requestId:'$context.requestId',status:'$context.status',latency:'$context.responseLatency'})};
  const service=new ecs.FargateService(this,'Service',{cluster:p.cluster,taskDefinition:task,desiredCount:p.desiredCount,
   capacityProviderStrategies:[{capacityProvider:'FARGATE',weight:1}],assignPublicIp:true,
   vpcSubnets:{subnetType:ec2.SubnetType.PUBLIC},securityGroups:[network],circuitBreaker:{rollback:true},
   minHealthyPercent:100,maxHealthyPercent:200,enableECSManagedTags:true,propagateTags:ecs.PropagatedTagSource.SERVICE,
  });
  service.associateCloudMapService({service:serviceDiscovery,container,containerPort:8443});
  service.node.addDependency(link);
  this.apiService=service;
  this.sourceWriterServices=[service,...(deletionWorker?[deletionWorker.service]:[])];
  p.operator.addToPolicy(new iam.PolicyStatement({actions:['acm:DescribeCertificate'],resources:[certificate.certificateArn]}));
  p.operator.addToPolicy(new iam.PolicyStatement({actions:['ecs:DescribeServices'],resources:this.sourceWriterServices.map(s=>s.serviceArn)}));
  p.operator.addToPolicy(new iam.PolicyStatement({actions:['ec2:DescribeNetworkInterfaces'],resources:['*'],conditions:{StringEquals:{'aws:RequestedRegion':'eu-central-1'}}}));
  p.operator.addToPolicy(new iam.PolicyStatement({actions:['logs:DescribeLogStreams','logs:GetLogEvents','logs:FilterLogEvents'],resources:[apiLogs.logGroupArn,`${apiLogs.logGroupArn}:*`,gatewayLogs.logGroupArn,`${gatewayLogs.logGroupArn}:*`,
   ...(deletionWorker?[deletionWorker.logGroup.logGroupArn,`${deletionWorker.logGroup.logGroupArn}:*`]:[])]}));
  for(const [name,value] of Object.entries({ApiUrl:api.apiEndpoint,CertificateArn:certificate.certificateArn,TlsServerName:hostname,
   ApiTaskDefinitionArn:task.taskDefinitionArn,ApiServiceName:service.serviceName,ApiSecurityGroupId:network.securityGroupId,
   ApiLogGroup:apiLogs.logGroupName,GatewayLogGroup:gatewayLogs.logGroupName,CustomerAccess:p.liveEnabled?'live':'closed',ReviewAccess:p.reviewEnabled?'identity-allowlist':'disabled'}))new CfnOutput(this,name,{value});
 }
}
