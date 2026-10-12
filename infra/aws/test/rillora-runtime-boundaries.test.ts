import {App} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {describe,it,expect} from 'vitest';
import {RilloraProductionStack} from '../lib/rillora-production-stack.js';
import {RilloraStagingStack} from '../lib/rillora-staging-stack.js';

describe('independent security service permissions',()=>{
 it('lets each existing operator observe its new worker without gaining secrets or raw task execution',()=>{
  const env={account:'133857166372',region:'eu-central-1'};
  const cases=[['production',new RilloraProductionStack(new App(),'Production',{env,runtimeEnabled:true,runtimeDesiredCount:1,reviewPrepared:true,reviewEnabled:true,identityServicesEnabled:true})],
    ['staging',new RilloraStagingStack(new App(),'Staging',{env,desiredCount:1,accountDeletionEnabled:true})]] as const;
  for(const [name,stack] of cases){
    const t=Template.fromStack(stack);
    const operator=Object.entries(t.findResources('AWS::IAM::Role')).find(([,r]:any)=>r.Properties.RoleName===`rillora-${name}-operator`)![0];
    const statements=(Object.values(t.findResources('AWS::IAM::Policy')) as any[]).filter(p=>p.Properties.Roles?.some((r:any)=>r.Ref===operator)).flatMap(p=>p.Properties.PolicyDocument.Statement);
    const includes=(s:any,action:string)=>[s.Action].flat().includes(action);
    const services=statements.filter(s=>includes(s,'ecs:DescribeServices')).flatMap(s=>[s.Resource].flat());
    for(const id of Object.keys(t.findResources('AWS::ECS::Service')))expect(services).toContainEqual({Ref:id});
    const workerLog=Object.keys(t.findResources('AWS::Logs::LogGroup')).find(id=>id.includes('IdentityWorkerLogs'))!;
    expect(workerLog).toBeDefined();
    expect(JSON.stringify(statements.filter(s=>includes(s,'logs:GetLogEvents')))).toContain(workerLog);
    for(const action of ['secretsmanager:GetSecretValue','ecs:RunTask','iam:PassRole'])expect(statements.some(s=>includes(s,action))).toBe(false);
  }
 });
 it('includes every writer in the recovery freeze inventory and exact describe grants',()=>{
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'133857166372',region:'eu-central-1'},
    runtimeEnabled:true,runtimeDesiredCount:1,reviewPrepared:true,reviewEnabled:true,identityServicesEnabled:true}));
  const serviceIds=Object.keys(t.findResources('AWS::ECS::Service'));
  expect(serviceIds).toHaveLength(2);
  const broker=(Object.values(t.findResources('AWS::Lambda::Function')) as any[]).find(f=>f.Properties.Environment?.Variables?.BROKER_SETTINGS);
  const settings=JSON.stringify(broker.Properties.Environment.Variables.BROKER_SETTINGS);
  const inventory=JSON.stringify(t.findOutputs('RecoverySourceServiceNames'));
  expect(settings).toContain('sourceServices');
  const role=broker.Properties.Role['Fn::GetAtt'][0];
  const grants=(Object.values(t.findResources('AWS::IAM::Policy')) as any[])
    .filter(p=>p.Properties.Roles?.some((r:any)=>r.Ref===role)).flatMap(p=>p.Properties.PolicyDocument.Statement)
    .filter(s=>s.Action==='ecs:DescribeServices');
  expect(grants).toHaveLength(1);
  expect(grants[0].Resource).toHaveLength(2);
  for(const id of serviceIds){
    expect(settings).toContain(id);expect(inventory).toContain(id);
    expect(grants[0].Resource).toContainEqual({Ref:id});
  }
 });
 it('denies HTTP journal writes, deletion credentials and identity-proof decryption while giving each worker only its purpose',()=>{
  const t=Template.fromStack(new RilloraProductionStack(new App(),'Production',{env:{account:'133857166372',region:'eu-central-1'},
    runtimeEnabled:true,runtimeDesiredCount:1,reviewPrepared:true,reviewEnabled:true,identityServicesEnabled:true}));
  const tasks=Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[];
  const api=tasks.find(t=>t.Properties.ContainerDefinitions.some((c:any)=>c.Name==='Api'))!.Properties;
  const deletion=tasks.find(t=>t.Properties.ContainerDefinitions.some((c:any)=>c.Name==='IdentityDeletion'))!.Properties;
  const policies=Object.values(t.findResources('AWS::IAM::Policy')) as any[];
  const statements=(ref:string)=>policies.filter(p=>p.Properties.Roles?.some((r:any)=>r.Ref===ref)).flatMap(p=>p.Properties.PolicyDocument.Statement);
  const actions=(rows:any[])=>rows.flatMap(s=>Array.isArray(s.Action)?s.Action:[s.Action]);
  const runtime=statements(api.TaskRoleArn['Fn::GetAtt'][0]);
  expect(actions(runtime)).toContain('lambda:InvokeFunction');
  expect(actions(runtime).some(a=>a.startsWith('dynamodb:'))).toBe(false);
  const execution=statements(api.ExecutionRoleArn['Fn::GetAtt'][0]);
  expect(JSON.stringify(execution)).not.toContain('AccountDeletionServiceSecret');
  expect(JSON.stringify(execution)).not.toContain('RecoveryAttestationAuthority');
  expect(JSON.stringify(execution)).not.toContain('DeletionDatabase');
  const proofUse=runtime.filter(s=>JSON.stringify(s.Resource).includes('IdentityProof'));
  expect(actions(proofUse)).toEqual(['kms:GenerateDataKey']);
  const worker=statements(deletion.TaskRoleArn['Fn::GetAtt'][0]);
  expect(actions(worker).filter(a=>a.startsWith('kms:'))).toEqual(['kms:Decrypt']);
  expect(JSON.stringify(worker)).not.toContain('ContentKey');
  const container=deletion.ContainerDefinitions[0];
  expect(container.PortMappings).toBeUndefined();
  expect(container.Secrets.map((s:any)=>s.Name).some((n:string)=>n==='DATABASE_AUTHORITY_KEY'||n==='EMAIL_MATCH_KEY')).toBe(false);
  expect(api.TaskRoleArn).not.toEqual(deletion.TaskRoleArn);
  expect(api.ExecutionRoleArn).not.toEqual(deletion.ExecutionRoleArn);
  const broker=(Object.values(t.findResources('AWS::Lambda::Function')) as any[]).find(f=>f.Properties.Environment?.Variables?.ATTESTATION_SECRET_ARN);
  const writer=statements(broker.Properties.Role['Fn::GetAtt'][0]);
  expect(actions(writer)).toContain('dynamodb:PutItem');
  expect(actions(writer)).not.toContain('ecs:RunTask');
  expect(actions(writer)).not.toContain('iam:PassRole');
 });
});
