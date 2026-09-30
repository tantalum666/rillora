import { afterEach, describe, expect, it, vi } from 'vitest';
import pg from 'pg';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('test database safety before any migrations or teardown', () => {
  it('rejects wrong databases, remote hosts and connection-string overrides before connecting', async () => {
    const connect = vi.spyOn(pg.Client.prototype, 'connect');
    for (const input of ['postgresql:///customer_map', 'postgresql://db.example/continuity_test',
      'postgresql://localhost/continuity_test?host=db.example', 'postgresql://runtime@localhost/continuity_test']) {
      await expect(assertDedicatedTestDatabase(input, 'continuity_test')).rejects.toThrow();
    }
    expect(connect).not.toHaveBeenCalled();
    vi.stubEnv('PGHOST', 'db.example');
    expect(() => dedicatedTestDatabaseUrl('postgresql:///continuity_test', 'continuity_test')).toThrow();
  });
  it('rejects an unexpected connected identity using only a read and closes the connection', async () => {
    vi.spyOn(pg.Client.prototype, 'connect').mockResolvedValue(undefined as never);
    const query = vi.spyOn(pg.Client.prototype, 'query').mockResolvedValue({ rows: [{ name: 'customer_map', user: 'postgres', local: true }] } as never);
    const end = vi.spyOn(pg.Client.prototype, 'end').mockResolvedValue(undefined as never);
    await expect(assertDedicatedTestDatabase('postgresql://postgres@127.0.0.1/continuity_test', 'continuity_test')).rejects.toThrow('unverified');
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toMatch(/^select current_database/);
    expect(end).toHaveBeenCalledOnce();
  });
});
