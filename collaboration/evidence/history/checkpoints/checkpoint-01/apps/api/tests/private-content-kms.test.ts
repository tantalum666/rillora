import {afterEach,describe,expect,it,vi} from 'vitest';
import {DecryptCommand,GenerateDataKeyCommand} from '@aws-sdk/client-kms';
import {KmsContentKeyProvider} from '../src/private-content.js';

const mocks=vi.hoisted(()=>({send:vi.fn()}));
vi.mock('@aws-sdk/client-kms',async original=>{
 const actual=await original<typeof import('@aws-sdk/client-kms')>();
 return {...actual,KMSClient:class {send=mocks.send;}};
});
const config={mode:'encrypted' as const,namespace:'rillora-staging',region:'eu-central-1',
 kmsKeyArn:'arn:aws:kms:eu-central-1:111111111111:key/11111111-1111-4111-8111-111111111111'};
afterEach(()=>{vi.restoreAllMocks();mocks.send.mockReset();});
describe('KMS key-provider boundaries',()=>{
 it('uses a bounded shared real-crypto readiness probe, caches failures and recovers',async()=>{
  let now=1_000_000;vi.spyOn(Date,'now').mockImplementation(()=>now);
  const inputs:any[]=[];const raw:Uint8Array[]=[];
  mocks.send.mockImplementation(async command=>{
   inputs.push(command.input);const Plaintext=new Uint8Array(32).fill(7);raw.push(Plaintext);
   return command instanceof GenerateDataKeyCommand?{KeyId:config.kmsKeyArn,Plaintext,CiphertextBlob:new Uint8Array([1,2,3])}
    :{KeyId:config.kmsKeyArn,Plaintext};
  });
  const provider=new KmsContentKeyProvider(config);
  await Promise.all(Array.from({length:12},()=>provider.check()));
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(mocks.send.mock.calls[1]![0]).toBeInstanceOf(DecryptCommand);
  expect(inputs[0].EncryptionContext).toEqual(inputs[1].EncryptionContext);
  expect(inputs[0].KeyId).toBe(config.kmsKeyArn);
  expect(inputs[0].EncryptionContext).toMatchObject({rillora_application:'content-v1',rillora_environment:'rillora-staging'});
  expect(raw.every(buffer=>buffer.every(value=>value===0))).toBe(true);
  now+=300_001;mocks.send.mockRejectedValue(new Error('Do not expose upstream secrets'));
  await expect(provider.check()).rejects.toMatchObject({status:503,code:'protected_content_unavailable'});
  await expect(provider.check()).rejects.toThrow('could not be opened safely');
  expect(mocks.send).toHaveBeenCalledTimes(3);
  now+=10_001;
  mocks.send.mockImplementation(async command=>({KeyId:config.kmsKeyArn,Plaintext:new Uint8Array(32).fill(9),
   ...(command instanceof GenerateDataKeyCommand?{CiphertextBlob:new Uint8Array([4,5,6])}:{})}));
  await provider.check();expect(mocks.send).toHaveBeenCalledTimes(5);
 });
 it('refuses a substituted wrapping key or namespace before making a decrypt call',async()=>{
  const provider=new KmsContentKeyProvider(config),context={namespace:config.namespace,owner:'11111111-1111-4111-8111-111111111111',id:'22222222-2222-4222-8222-222222222222'};
  await expect(provider.unwrap(Buffer.from('ciphertext'),config.kmsKeyArn+'other',context)).rejects.toThrow();
  await expect(provider.unwrap(Buffer.from('ciphertext'),config.kmsKeyArn,{...context,namespace:'other-environment'})).rejects.toThrow();
  expect(mocks.send).not.toHaveBeenCalled();
 });
});
