import { vi } from 'vitest';
import { DynamoDBClient,GetItemCommand,DeleteItemCommand,UpdateItemCommand,TransactWriteItemsCommand,type AttributeValue } from '@aws-sdk/client-dynamodb';
import { randomBytes } from 'node:crypto';
import { OAuthStore } from '../src/mcp/oauth-store.js';

export function oauthStoreFixture() {
  const rows=new Map<string,Record<string,AttributeValue>>();
  const client=new DynamoDBClient({region:'eu-central-1'});
  vi.spyOn(client,'send').mockImplementation(async command=>{
    if (command instanceof GetItemCommand) {
      if (command.input.ConsistentRead!==true) throw new Error('Test requires strong reads');
      return {Item:structuredClone(rows.get(command.input.Key!.pk!.S!)),$metadata:{}};
    }
    if (command instanceof DeleteItemCommand) {rows.delete(command.input.Key!.pk!.S!);return {$metadata:{}};}
    if (command instanceof UpdateItemCommand) {
      const input=command.input,key=input.Key!.pk!.S!,old=rows.get(key);
      const values=input.ExpressionAttributeValues!;
      if (input.ConditionExpression) {
        if (input.ConditionExpression!=='attribute_exists(pk) AND expiresAt > :now AND attribute_not_exists(consumedAt)') throw new Error('Unexpected consume condition');
        if (!old || Number(old.expiresAt!.N)<=Number(values[':now']!.N) || old.consumedAt) {
          const error=new Error('Conditional write rejected');error.name='ConditionalCheckFailedException';throw error;
        }
        rows.set(key,{...old,consumedAt:values[':now']!});
      } else rows.set(key,{pk:{S:key},expiresAt:values[':expiry']!});
      return {$metadata:{}};
    }
    if (command instanceof TransactWriteItemsCommand) {
      const writes=command.input.TransactItems!;
      for (const write of writes) if (write.ConditionCheck) {
        const check=write.ConditionCheck;
        if (check.ConditionExpression!=='attribute_not_exists(pk) OR expiresAt <= :now') throw new Error('Unexpected revoke condition');
        const marker=rows.get(check.Key!.pk!.S!);
        if (marker && Number(marker.expiresAt!.N)>Number(check.ExpressionAttributeValues![':now']!.N)) throw new Error('TransactionCanceledException');
      }
      for (const write of writes) if (write.Update) {
        const update=write.Update,key=update.Key!.pk!.S!,values=update.ExpressionAttributeValues!;
        rows.set(key,{...rows.get(key),pk:{S:key},ciphertext:values[':body']!,expiresAt:values[':expiry']!});
      }
      return {$metadata:{}};
    }
    throw new Error('Unexpected DynamoDB command');
  });
  return {store:new OAuthStore('synthetic-oauth',randomBytes(32),client),rows,client};
}
