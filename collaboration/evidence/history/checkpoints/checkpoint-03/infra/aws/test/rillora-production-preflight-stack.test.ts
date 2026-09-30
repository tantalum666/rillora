import {App} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {describe,it,expect} from 'vitest';
import {RilloraProductionPreflightStack} from '../lib/rillora-production-preflight-stack.js';
describe('Production prerequisite observation',()=>{
 it('grants only account/cost/inventory reads and MFA-gated role assumption',()=>{
  const template=Template.fromStack(new RilloraProductionPreflightStack(new App(),'Readiness',{env:{account:'111111111111',region:'eu-central-1'}}));
  const resources=template.toJSON().Resources;
  expect(Object.values(resources).every((v:any)=>['AWS::IAM::Role','AWS::IAM::Policy'].includes(v.Type))).toBe(true);
  const policies=Object.values(template.findResources('AWS::IAM::Policy')).flatMap((v:any)=>v.Properties.PolicyDocument.Statement);
  const actions=policies.flatMap(v=>Array.isArray(v.Action)?v.Action:[v.Action]).sort();
  expect(actions).toEqual(['ce:GetCostAndUsage','freetier:GetAccountPlanState','rds:DescribeDBInstances','rds:DescribeDBSnapshots','sts:AssumeRole'].sort());
  const role=Object.values(template.findResources('AWS::IAM::Role'))[0]!;
  expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Condition).toEqual({Bool:{'aws:MultiFactorAuthPresent':'true'}});
 });
});
