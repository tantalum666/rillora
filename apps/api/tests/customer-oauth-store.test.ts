import { afterEach,describe,it,expect,vi } from 'vitest';
import { oauthStoreFixture } from './oauth-store-fixture.js';
import { OAUTH_MAX_TTL } from '../src/mcp/oauth-store.js';

afterEach(()=>vi.useRealTimers());
describe('encrypted OAuth protocol storage',()=>{
  it('encrypts every payload and binds it to its artifact key',async()=>{
    const {store,rows}=oauthStoreFixture();
    await store.save('Interaction','first',{accountId:'synthetic-private-account'},60);
    await store.save('Interaction','second',{accountId:'other'},60);
    expect(JSON.stringify([...rows.values()])).not.toContain('synthetic-private-account');
    const [first,second]=[...rows.values()];second!.ciphertext=first!.ciphertext!;
    await expect(store.find('Interaction','second')).rejects.toThrow('unavailable');
    expect(await store.find('Interaction','first')).toEqual({accountId:'synthetic-private-account'});
  });
  it('enforces logical expiry without waiting for DynamoDB TTL deletion',async()=>{
    vi.useFakeTimers();const {store,rows}=oauthStoreFixture();
    await store.save('AccessToken','expiry',{grantId:'grant'},1);
    vi.advanceTimersByTime(2000);
    expect(rows.size).toBe(1);expect(await store.find('AccessToken','expiry')).toBeUndefined();
  });
  it('allows only one simultaneous code consumption and never clears consumption on save',async()=>{
    const {store}=oauthStoreFixture();
    await store.save('AuthorizationCode','single',{grantId:'grant'},60);
    const results=await Promise.allSettled([store.consume('AuthorizationCode','single'),store.consume('AuthorizationCode','single')]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    await store.save('AuthorizationCode','single',{grantId:'grant'},60);
    expect((await store.find('AuthorizationCode','single'))?.consumed).toBeTypeOf('number');
    await expect(store.consume('AuthorizationCode','single')).rejects.toThrow();
  });
  it('revokes existing and concurrently minted grant artifacts with a strong marker',async()=>{
    const {store}=oauthStoreFixture();
    await store.save('Grant','grant',{accountId:'owner'},60);
    await store.save('AccessToken','access',{grantId:'grant'},60);
    await store.save('ConnectionBinding','grant',{accountId:'owner'},60);
    await store.revoke('grant');
    for (const [model,id] of [['Grant','grant'],['AccessToken','access'],['ConnectionBinding','grant']]) expect(await store.find(model!,id!)).toBeUndefined();
    await expect(store.save('RefreshToken','new-refresh',{grantId:'grant'},60)).rejects.toThrow();
  });
  it('bounds lifetime and rejects unexpected persistent protocol purposes',async()=>{
    const {store,rows}=oauthStoreFixture();
    await store.save('Grant','grant',{},OAUTH_MAX_TTL*2);
    expect(Number([...rows.values()][0]!.expiresAt!.N)-Math.floor(Date.now()/1000)).toBeLessThanOrEqual(OAUTH_MAX_TTL);
    await expect(store.save('Grant','invalid',{},Infinity)).rejects.toThrow();
    expect(()=>store.adapter('DeviceCode')).toThrow();
    await expect(store.adapter('Client').upsert('dynamic',{},60)).rejects.toThrow();
  });
  it('keeps session aliases encrypted and invalid after their target is destroyed',async()=>{
    const {store,rows}=oauthStoreFixture(),adapter=store.adapter('Session');
    await adapter.upsert('session-secret',{uid:'session-uid',accountId:'owner'},60);
    expect(rows.size).toBe(2);expect(JSON.stringify([...rows])).not.toContain('session-secret');
    expect((await adapter.findByUid('session-uid'))?.accountId).toBe('owner');
    await adapter.destroy('session-secret');expect(await adapter.findByUid('session-uid')).toBeUndefined();
  });
});
