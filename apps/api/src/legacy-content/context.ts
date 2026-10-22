import type { PoolClient } from 'pg';
import { withPlannerDatabase, type DatabasePool } from '../db.js';
import { ApiError } from '../errors.js';
import { contentNoticeVersion } from './notice.js';
import { LegacyContentCipher } from './crypto.js';
import type { ContentObjectStore } from './object-store.js';

export const missing = () => new ApiError(404, 'legacy_unavailable', 'This content is unavailable.');
export const changed = () => new ApiError(409, 'legacy_changed', 'Content changed. Reload before saving.');
export type ContentTransaction = { client: PoolClient; owner: string; plannerId: string };
export class ContentContext {
  constructor(readonly pool: DatabasePool, readonly cipher: LegacyContentCipher, readonly objects: ContentObjectStore, readonly writesEnabled = true) {}
  transaction<T>(plannerId: string, action: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    return withPlannerDatabase(this.pool, plannerId, async client => {
      const row = (await client.query("select public_id from app.planners where id=app.current_planner_id() and status='active'")).rows[0];
      if (!row) throw missing();
      return action({ client, owner: row.public_id, plannerId });
    });
  }
  async canCreate(client: PoolClient): Promise<boolean> {
    if (!this.writesEnabled) return false;
    return (await client.query('select app.family_maintenance_enabled(app.current_planner_id(),false) as allowed')).rows[0]?.allowed === true;
  }
  async requireCreate(client: PoolClient): Promise<void> {
    if (!this.writesEnabled) throw new ApiError(503, 'legacy_read_only', 'New content is temporarily paused. Your saved content remains available.');
    if (!await this.canCreate(client)) throw new ApiError(403, 'legacy_family_required', 'New content needs active Family access. Existing content remains available to download or delete.');
    if (!(await client.query('select 1 from app.legacy_content_consents where version=$1', [contentNoticeVersion])).rowCount)
      throw new ApiError(409, 'legacy_notice_required', 'Review the file and voice notice before adding content.');
  }
  async lock(client: PoolClient): Promise<void> {
    // Match sharing/deletion order, then serialize quotas and versions per owner.
    await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
    await client.query("select pg_advisory_xact_lock(hashtextextended('legacy:'||app.current_planner_id()::text,0))");
  }
}

export async function boundedMap<T, U>(items: T[], action: (item: T) => Promise<U>): Promise<U[]> {
  const result: U[] = [];
  for (let i = 0; i < items.length; i += 5) result.push(...await Promise.all(items.slice(i, i + 5).map(action)));
  return result;
}
