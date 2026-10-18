import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { DynamoDBClient, GetItemCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand,
  type TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { errors, type Adapter, type AdapterPayload } from 'oidc-provider';

export const OAUTH_MAX_TTL = 7 * 24 * 60 * 60;
const models = new Set(['Session', 'Interaction', 'Grant', 'AuthorizationCode', 'AccessToken', 'RefreshToken']);
const now = () => Math.floor(Date.now() / 1000);

/** Protocol artifacts only. No map contents, first-party session or provider token is stored here. */
export class OAuthStore {
  constructor(readonly table: string, private key: Buffer, private client = new DynamoDBClient({region:'eu-central-1'})) {
    if (key.length !== 32 || !table) throw new Error('OAuth storage configuration is invalid');
  }

  private name(kind: string, id: string): string {
    if (!id || id.length > 1024) throw new Error('Invalid OAuth artifact identifier');
    return kind + ':' + createHmac('sha256', this.key).update(kind + '\0' + id).digest('hex');
  }

  private seal(key: string, value: object): Buffer {
    const plain = Buffer.from(JSON.stringify(value));
    if (plain.length > 65536) throw new Error('OAuth artifact exceeds its bound');
    const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(key));
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    plain.fill(0);
    return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]);
  }

  private unseal(key: string, encrypted: Uint8Array): AdapterPayload {
    const bytes = Buffer.from(encrypted);
    if (bytes.length < 28 || bytes.length > 65564) throw new Error('OAuth storage is unavailable');
    const decipher = createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0,12));
    decipher.setAAD(Buffer.from(key)); decipher.setAuthTag(bytes.subarray(12,28));
    let plain: Buffer | undefined;
    try { plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]); return JSON.parse(plain.toString()); }
    catch { throw new Error('OAuth storage is unavailable'); }
    finally { plain?.fill(0); }
  }

  private async row(key: string) {
    const result = await this.client.send(new GetItemCommand({ TableName:this.table, Key:{pk:{S:key}}, ConsistentRead:true }));
    return result.Item && Number(result.Item.expiresAt?.N) > now() ? result.Item : undefined;
  }

  async find(model: string, id: string): Promise<AdapterPayload | undefined> {
    const key = this.name(model,id), row = await this.row(key);
    if (!row?.ciphertext?.B) return undefined;
    const payload = this.unseal(key,row.ciphertext.B);
    const grantId = model === 'Grant' || model === 'ConnectionBinding' ? id : payload.grantId;
    if (grantId && await this.row(this.name('RevokedGrant',grantId))) return undefined;
    if (row.consumedAt?.N) payload.consumed = Number(row.consumedAt.N);
    return payload;
  }

  async save(model: string, id: string, payload: AdapterPayload, ttl: number) {
    if (!Number.isFinite(ttl) || ttl <= 0) throw new Error('Invalid OAuth expiry');
    const expiresAt = now() + Math.min(OAUTH_MAX_TTL, Math.ceil(ttl));
    const key = this.name(model,id);
    const grantId = model === 'Grant' || model === 'ConnectionBinding' ? id : payload.grantId;
    const update = (pk: string, value: object): TransactWriteItem => ({ Update:{ TableName:this.table, Key:{pk:{S:pk}},
      // Never reset consumedAt when the provider subsequently saves the same artifact.
      UpdateExpression:'SET ciphertext=:body, expiresAt=:expiry',
      ExpressionAttributeValues:{':body':{B:this.seal(pk,value)}, ':expiry':{N:String(expiresAt)}} } });
    const writes: TransactWriteItem[] = [update(key,payload)];
    if (grantId) writes.unshift({ConditionCheck:{TableName:this.table,Key:{pk:{S:this.name('RevokedGrant',grantId)}},
      ConditionExpression:'attribute_not_exists(pk) OR expiresAt <= :now',ExpressionAttributeValues:{':now':{N:String(now())}}}});
    if (payload.uid && model === 'Session') writes.push(update(this.name('SessionUid',payload.uid),{target:id}));
    await this.client.send(new TransactWriteItemsCommand({TransactItems:writes}));
  }

  async consume(model: string, id: string) {
    const time = now();
    try {
      await this.client.send(new UpdateItemCommand({TableName:this.table,Key:{pk:{S:this.name(model,id)}},
        UpdateExpression:'SET consumedAt=:now',ConditionExpression:'attribute_exists(pk) AND expiresAt > :now AND attribute_not_exists(consumedAt)',
        ExpressionAttributeValues:{':now':{N:String(time)}}}));
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') throw new errors.InvalidGrant('Authorization is no longer available');
      throw error;
    }
  }

  async destroy(model: string, id: string) {
    await this.client.send(new DeleteItemCommand({TableName:this.table,Key:{pk:{S:this.name(model,id)}}}));
  }

  async revoke(grantId: string) {
    // A strong marker invalidates all associated artifacts, including a concurrent write.
    await this.client.send(new UpdateItemCommand({TableName:this.table,Key:{pk:{S:this.name('RevokedGrant',grantId)}},
      UpdateExpression:'SET expiresAt=:expiry',ExpressionAttributeValues:{':expiry':{N:String(now()+OAUTH_MAX_TTL)}}}));
  }

  adapter = (model: string): Adapter => {
    if (!models.has(model) && model !== 'Client') throw new Error('Unsupported OAuth model');
    return {
      upsert:async (id,payload,ttl) => {
        if (model === 'Client' || payload.userCode) throw new Error('Dynamic OAuth registration and device flow are disabled');
        await this.save(model,id,payload,ttl ?? 1800);
      },
      find:id => model==='Client'?Promise.resolve(undefined):this.find(model,id),
      findByUid:async uid => {
        if (model !== 'Session') return undefined;
        const alias = await this.find('SessionUid',uid);
        return typeof alias?.target === 'string' ? this.find(model,alias.target) : undefined;
      },
      findByUserCode:async () => undefined,
      consume:id => this.consume(model,id),
      destroy:id => this.destroy(model,id),
      revokeByGrantId:id => this.revoke(id),
    };
  };
}
