import {App} from 'aws-cdk-lib';
import {Template,Match} from 'aws-cdk-lib/assertions';
import {describe,it,expect} from 'vitest';
import {RilloraProductionStack} from '../lib/rillora-production-stack.js';
function template(){return Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'111111111111',region:'eu-central-1'}}));}
describe('Closed production data and recovery foundation',()=>{
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
});
