import {App} from 'aws-cdk-lib';
import {Template,Match} from 'aws-cdk-lib/assertions';
import {describe,it,expect} from 'vitest';
import {RilloraProductionStack} from '../lib/rillora-production-stack.js';
function template(){return Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'111111111111',region:'eu-central-1'}}));}
describe('Closed production data and recovery foundation',()=>{
 it('keeps privileged task execution and recovery writes behind the fixed broker rather than the human operator',()=>{
  const t=template(),roles=t.findResources('AWS::IAM::Role');
  const operator=Object.entries(roles).find(([,r]:any)=>r.Properties.RoleName==='rillora-production-operator')![0];
  const human=(Object.values(t.findResources('AWS::IAM::Policy')) as any[])
    .filter(p=>p.Properties.Roles?.some((r:any)=>r.Ref===operator)).flatMap(p=>p.Properties.PolicyDocument.Statement);
  const actions=human.flatMap(s=>typeof s.Action==='string'?[s.Action]:s.Action);
  for(const action of ['ecs:RunTask','iam:PassRole','rds:CreateDBSnapshot','rds:RestoreDBInstanceFromDBSnapshot',
    'rds:DeleteDBInstance','rds:DeleteDBSnapshot','rds:AddTagsToResource'])expect(actions).not.toContain(action);
  expect(actions).toContain('lambda:InvokeFunction');
  const broker=(Object.values(t.findResources('AWS::Lambda::Function')) as any[]).find(f=>f.Properties.Environment?.Variables?.BROKER_SETTINGS)!;
  const brokerRole=broker.Properties.Role['Fn::GetAtt'][0];
  const brokerActions=(Object.values(t.findResources('AWS::IAM::Policy')) as any[])
    .filter(p=>p.Properties.Roles?.some((r:any)=>r.Ref===brokerRole)).flatMap(p=>p.Properties.PolicyDocument.Statement)
    .flatMap(s=>typeof s.Action==='string'?[s.Action]:s.Action);
  expect(brokerActions).toContain('ecs:RunTask');expect(brokerActions).toContain('iam:PassRole');
 });
 it('requires seven-day encrypted private storage and keeps customer traffic closed',()=>{
  const t=template();
  t.hasResourceProperties('AWS::RDS::DBInstance',{DBInstanceIdentifier:'rillora-production',DBInstanceClass:'db.t4g.micro',
   BackupRetentionPeriod:7,StorageEncrypted:true,PubliclyAccessible:false,DeletionProtection:true,DeleteAutomatedBackups:false});
  t.hasResourceProperties('AWS::RDS::DBParameterGroup',{Parameters:{'rds.force_ssl':'1',password_encryption:'scram-sha-256',log_statement:'none'}});
  for(const type of ['AWS::ECS::Service','AWS::CloudFront::Distribution','AWS::EC2::NatGateway'])t.resourceCountIs(type,0);
  t.hasOutput('ProductionTrafficReady',{Value:'false'});
 });
 it('separates original/recovery networks and uses only the production key context',()=>{
  const t=template(),tasks=Object.values(t.findResources('AWS::ECS::TaskDefinition'));
  expect(tasks).toHaveLength(2);
  const env=tasks.map((v:any)=>Object.fromEntries(v.Properties.ContainerDefinitions[0].Environment.map((e:any)=>[e.Name,e.Value])));
  expect(env.every(e=>e.CONTENT_KEY_NAMESPACE==='rillora-production'&&e.CONTENT_PROTECTION_MODE==='encrypted')).toBe(true);
  expect(env.filter(e=>e.DATABASE_HOST)).toHaveLength(1);
  t.hasResource('AWS::KMS::Key',{DeletionPolicy:'Retain',UpdateReplacePolicy:'Retain',Properties:{EnableKeyRotation:true}});
  const sg=Object.values(t.findResources('AWS::EC2::SecurityGroup')) as any[];
  expect(sg).toHaveLength(4);
  expect(JSON.stringify(t.findResources('AWS::EC2::SecurityGroupIngress'))).not.toContain('0.0.0.0/0');
  const use=Object.values(t.findResources('AWS::IAM::Policy')).flatMap((p:any)=>p.Properties.PolicyDocument.Statement)
   .filter(s=>JSON.stringify(s.Action).includes('kms:Decrypt'));
  expect(use).toHaveLength(2);
  expect(use.every(s=>s.Condition.StringEquals['kms:EncryptionContext:rillora_environment']==='rillora-production')).toBe(true);
  expect(use.filter(s=>s.Action==='kms:Decrypt')).toHaveLength(1);
 });
 it('retains an independent recovery journal and limits deletion to tagged drill instances',()=>{
  const t=template();
  t.hasResourceProperties('AWS::DynamoDB::Table',{BillingMode:'PAY_PER_REQUEST',DeletionProtectionEnabled:true,
   PointInTimeRecoverySpecification:{PointInTimeRecoveryEnabled:true,RecoveryPeriodInDays:35}});
  const deletion=Object.values(t.findResources('AWS::IAM::Policy')).flatMap((p:any)=>p.Properties.PolicyDocument.Statement)
   .filter(s=>JSON.stringify(s.Action).includes('rds:DeleteDBInstance'));
  expect(deletion).toHaveLength(1);
  expect(JSON.stringify(deletion[0].Resource)).toContain(':db:rillora-recovery-*');
  expect(deletion[0].Condition.StringEquals['aws:ResourceTag/Environment']).toBe('RecoveryDrill');
  const assume=Object.values(t.findResources('AWS::IAM::ManagedPolicy')) as any[];
  expect(assume).toHaveLength(1);
  expect(assume[0].Properties.PolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
  expect(assume[0].Properties.PolicyDocument.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
 });
 it('authorizes the required restore groups without permitting a public or live target',()=>{
  const statements=Object.values(template().findResources('AWS::IAM::Policy')).flatMap((p:any)=>p.Properties.PolicyDocument.Statement);
  const restore=statements.filter(s=>s.Action==='rds:RestoreDBInstanceFromDBSnapshot');
  expect(restore).toHaveLength(2);
  const target=restore.find(s=>s.Condition);
  expect(target.Condition.Bool['rds:PubliclyAccessible']).toBe('false');
  expect(target.Condition.StringEquals['aws:RequestTag/Environment']).toBe('RecoveryDrill');
  expect(target.Condition.StringEquals['rds:DatabaseClass']).toBe('db.t4g.micro');
  const groups=JSON.stringify(restore.find(s=>!s.Condition).Resource);
  for(const kind of [':pg:',':subgrp:',':og:default:postgres-16'])expect(groups).toContain(kind);
  expect(restore.some(s=>s.Resource==='*')).toBe(false);
  const cleanup=statements.find(s=>s.Action==='rds:DeleteDBSnapshot');
  expect(JSON.stringify(cleanup.Resource)).toContain(':snapshot:rillora-production-recovery-*');
  expect(cleanup.Condition.StringEquals['aws:ResourceTag/Environment']).toBe('RecoveryDrill');
 });
});

describe('Optional closed production HTTPS runtime',()=>{
 it('shares only the exact existing billing configuration with the isolated recovery reader and leaves purchases closed',()=>{
  const arn='arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123';
  const props={env:{account:'133857166372',region:'eu-central-1'},runtimeEnabled:true,runtimeDesiredCount:1 as const,reviewPrepared:true,reviewEnabled:true,stripeNotificationsSecretArn:arn};
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',props));
  const task=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[]).find(t=>t.Properties.ContainerDefinitions.some((c:any)=>c.Name==='Api'))!;
  const api=task.Properties.ContainerDefinitions.find((c:any)=>c.Name==='Api');
  const env=Object.fromEntries(api.Environment.map((e:any)=>[e.Name,e.Value]));
  expect(env).toMatchObject({PRODUCTION_RUNTIME_MODE:'review',ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS:'true',STRIPE_PRODUCTION_SECRET_ARN:arn,
    ALLOW_STRIPE_PRODUCTION_INTEGRATION:'false',ALLOW_STRIPE_TEST_INTEGRATION:'false',ALLOW_APPLE_REVIEW_INTEGRATION:'true'});
  expect(env.PRODUCTION_REVIEW_IDENTITY_SHA256.Ref).toBeDefined();expect(env.PRODUCTION_REVIEW_EXPIRES_AT.Ref).toBeDefined();
  const policies=Object.values(t.findResources('AWS::IAM::Policy')) as any[];
  const grants=policies.filter(p=>p.Properties.PolicyDocument.Statement.some((s:any)=>JSON.stringify(s.Resource).includes(arn)));
  const recovery=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[])
   .find(t=>!t.Properties.ContainerDefinitions[0].Environment.some((e:any)=>e.Name==='DATABASE_HOST'))!;
  expect(grants).toHaveLength(2);
  expect(grants.flatMap(p=>p.Properties.Roles.map((r:any)=>r.Ref)).sort())
   .toEqual([task,recovery].map(t=>t.Properties.TaskRoleArn['Fn::GetAtt'][0]).sort());
  for(const grant of grants){
   const statement=grant.Properties.PolicyDocument.Statement.find((s:any)=>JSON.stringify(s.Resource).includes(arn));
   expect(statement.Action).toEqual(['secretsmanager:GetSecretValue','secretsmanager:DescribeSecret']);
   expect(statement.Resource).toBe(arn);
  }
  const recoveryEnv=Object.fromEntries(recovery.Properties.ContainerDefinitions[0].Environment.map((e:any)=>[e.Name,e.Value]));
  expect(recoveryEnv.STRIPE_PRODUCTION_SECRET_ARN).toBe(arn);
  expect(recoveryEnv.DATABASE_HOST).toBeUndefined();
  expect(recoveryEnv.ALLOW_STRIPE_PRODUCTION_INTEGRATION).toBeUndefined();
  expect(recoveryEnv.ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS).toBeUndefined();
  expect(JSON.stringify(t.findResources('AWS::SecretsManager::Secret'))).not.toContain('stripe-billing');
  expect(()=>new RilloraProductionStack(new App(),'Wrong',{...props,stripeNotificationsSecretArn:arn.replace('rillora/production','fanpass')})).toThrow();
  expect(()=>new RilloraProductionStack(new App(),'Closed',{...props,reviewEnabled:false})).toThrow();
 });
 it('prepares isolated vault resources while retaining closed runtime and the old immutable API image',()=>{
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'133857166372',region:'eu-central-1'},
   runtimeEnabled:true,runtimeDesiredCount:1,reviewPrepared:true,runtimeImageTag:'a'.repeat(64)}));
  t.hasResourceProperties('AWS::SecretsManager::Secret',{Name:'rillora/production/apple-review'});
  t.hasResourceProperties('AWS::SecretsManager::Secret',{Name:'rillora/production/web-oidc'});
  const api=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[]).flatMap(t=>t.Properties.ContainerDefinitions).find(c=>c.Name==='Api');
  expect(api.Secrets.map((s:any)=>s.Name).sort()).toEqual(['DATABASE_AUTHORITY_KEY','DATABASE_PASSWORD','DATABASE_USER','EMAIL_MATCH_KEY']);
  expect(api.Environment).toContainEqual({Name:'PRODUCTION_RUNTIME_MODE',Value:'closed'});
  expect(api.Environment.some((e:any)=>e.Name==='APPLE_REVIEW_SECRET_ARN')).toBe(false);
 });
 it('activates only restricted review, leaving ordinary sales and customer access closed',()=>{
  const props={env:{account:'133857166372',region:'eu-central-1'},runtimeEnabled:true,runtimeDesiredCount:1 as const,reviewPrepared:true,reviewEnabled:true,retentionEnabled:true};
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',props));
  const api=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[]).flatMap(t=>t.Properties.ContainerDefinitions).find(c=>c.Name==='Api');
  const env=Object.fromEntries(api.Environment.map((e:any)=>[e.Name,e.Value]));
  expect(env.PRODUCTION_RUNTIME_MODE).toBe('review');expect(env.ALLOW_APPLE_REVIEW_INTEGRATION).toBe('true');
  expect(env.ALLOW_RETENTION_WORKER).toBe('true');
  expect(env.PRODUCTION_REVIEW_IDENTITY_SHA256.Ref).toBeDefined();expect(env.PRODUCTION_REVIEW_EXPIRES_AT.Ref).toBeDefined();
  for(const name of ['ALLOW_DEV_AUTH','ALLOW_APPLE_PRODUCTION_INTEGRATION','ALLOW_STRIPE_PRODUCTION_INTEGRATION','ALLOW_APPLE_SANDBOX_INTEGRATION'])expect(env[name]).toBe('false');
  expect(api.Secrets.map((s:any)=>s.Name).sort()).toEqual(['DATABASE_AUTHORITY_KEY','DATABASE_PASSWORD','DATABASE_USER','EMAIL_MATCH_KEY','OIDC_CLIENT_SECRET']);t.hasOutput('ProductionTrafficReady',{Value:'false'});
  const ocspRules=Object.values(t.findResources('AWS::EC2::SecurityGroup')).flatMap((g:any)=>g.Properties.SecurityGroupEgress??[]).filter((r:any)=>r.FromPort===80);
  expect(ocspRules).toHaveLength(2);
  expect(ocspRules.every((r:any)=>r.ToPort===80&&r.IpProtocol==='tcp'&&r.CidrIp==='17.0.0.0/8')).toBe(true);
  expect(()=>new RilloraProductionStack(new App(),'Bad',{...props,reviewPrepared:false})).toThrow();
  expect(()=>new RilloraProductionStack(new App(),'Bad',{...props,runtimeImageTag:'a'.repeat(64)})).toThrow();
 });
 it('keeps production identity service credentials separate and injects only after activation',()=>{
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'133857166372',region:'eu-central-1'},
    runtimeEnabled:true,runtimeDesiredCount:1,reviewPrepared:true,reviewEnabled:true,identityServicesEnabled:true}));
  t.hasResourceProperties('AWS::SecretsManager::Secret',{Name:'rillora/production/account-deletion'});
  t.hasResourceProperties('AWS::SecretsManager::Secret',{Name:'rillora/production/email-verification'});
  const api=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[]).flatMap(t=>t.Properties.ContainerDefinitions).find(c=>c.Name==='Api');
  expect(api.Secrets).toHaveLength(8);
  const worker=(Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[]).flatMap(t=>t.Properties.ContainerDefinitions).find(c=>c.Name==='IdentityDeletion');
  for(const field of ['DOMAIN','CLIENT_ID','CLIENT_SECRET']){
    expect(api.Secrets.find((s:any)=>s.Name===`AUTH0_EMAIL_VERIFICATION_${field}`)).toBeDefined();
    expect(api.Secrets.find((s:any)=>s.Name===`AUTH0_DELETION_${field}`)).toBeUndefined();
    expect(worker.Secrets.find((s:any)=>s.Name===`AUTH0_DELETION_${field}`)).toBeDefined();
  }
  expect(JSON.stringify(api.Secrets)).not.toContain('staging');
 });
 it('keeps the existing data resources and uses a verified private TLS integration',()=>{
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'111111111111',region:'eu-central-1'},runtimeEnabled:true,runtimeDesiredCount:1}));
  t.resourceCountIs('AWS::RDS::DBInstance',1);t.resourceCountIs('AWS::EC2::NatGateway',0);
  t.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer',0);t.resourceCountIs('AWS::ECS::Service',1);
  t.hasResourceProperties('AWS::CertificateManager::Certificate',{DomainName:'origin.production.rillora.xyz',ValidationMethod:'DNS',CertificateExport:'ENABLED'});
  t.hasResourceProperties('AWS::ApiGatewayV2::Integration',{ConnectionType:'VPC_LINK',TlsConfig:{ServerNameToVerify:'origin.production.rillora.xyz'}});
  t.hasResourceProperties('AWS::ECS::Service',{DesiredCount:1,CapacityProviderStrategy:[{CapacityProvider:'FARGATE',Weight:1}]});
  const tasks=Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[];
  const api=tasks.flatMap(t=>t.Properties.ContainerDefinitions).find(c=>c.Name==='Api');
  const env=Object.fromEntries(api.Environment.map((e:any)=>[e.Name,e.Value]));
  expect(env.PRODUCTION_RUNTIME_MODE).toBe('closed');expect(env.PORT).toBe('8443');
  const httpRules=Object.values(t.findResources('AWS::EC2::SecurityGroup')).flatMap((g:any)=>g.Properties.SecurityGroupEgress??[]).filter((r:any)=>r.FromPort===80);
  expect(httpRules).toHaveLength(0);
  expect(env.ALLOW_DEV_AUTH).toBe('false');expect(env.ALLOW_STRIPE_TEST_INTEGRATION).toBe('false');
  expect(api.ReadonlyRootFilesystem).toBe(true);expect(api.LinuxParameters.Capabilities.Drop).toContain('ALL');
  expect(api.Secrets.map((s:any)=>s.Name).sort()).toEqual(['DATABASE_AUTHORITY_KEY','DATABASE_PASSWORD','DATABASE_USER','EMAIL_MATCH_KEY']);expect(JSON.stringify(api.Secrets)).not.toContain('DatabaseSecret');
  const incoming=Object.values(t.findResources('AWS::EC2::SecurityGroupIngress')) as any[];
  expect(incoming.every(x=>!x.Properties.CidrIp)).toBe(true);
  const tlsRules=incoming.filter(x=>x.Properties.FromPort===8443);expect(tlsRules).toHaveLength(1);
  expect(tlsRules[0].Properties.SourceSecurityGroupId).toBeDefined();
  const exports=Object.values(t.findResources('AWS::IAM::Policy')).flatMap((p:any)=>p.Properties.PolicyDocument.Statement).filter(s=>JSON.stringify(s.Action).includes('acm:ExportCertificate'));
  expect(exports).toHaveLength(1);expect(exports[0].Resource).not.toBe('*');
  t.hasOutput('ProductionTrafficReady',{Value:'false'});
 });
});
