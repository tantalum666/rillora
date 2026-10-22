import { withDeletionWorkerDatabase, type DatabasePool } from '../db.js';
import { contentObjectKey, type ContentObjectStore } from './object-store.js';

type CleanupJob = { publicId: string; leaseToken: string; owner: string; asset: string };
export class ContentCleanup {
  constructor(private readonly pool: DatabasePool, private readonly objects: ContentObjectStore) {}
  async sweep(owner?: string, maximum = 20): Promise<void> {
    await withDeletionWorkerDatabase(this.pool, client => client.query('select app.legacy_sweep_uploads()'));
    for (let i = 0; i < maximum; i++) {
      const job: CleanupJob | null = await withDeletionWorkerDatabase(this.pool, async client =>
        (await client.query('select app.legacy_claim_cleanup($1) as job', [owner ?? null])).rows[0]?.job ?? null);
      if (!job) return;
      let success = false;
      try {
        await this.objects.remove(contentObjectKey(job.owner, job.asset)); success = true;
      } catch { /* Keep the durable opaque job; never report deletion early. */ }
      await withDeletionWorkerDatabase(this.pool, client => client.query('select app.legacy_finish_cleanup($1,$2,$3)', [job.publicId, job.leaseToken, success]));
    }
  }
  async prepareAccount(job: { publicId: string; leaseToken: string }): Promise<void> {
    const owner: string = await withDeletionWorkerDatabase(this.pool, async client =>
      (await client.query('select app.legacy_prepare_account_cleanup($1,$2) as owner', [job.publicId, job.leaseToken])).rows[0].owner);
    await this.sweep(owner, 100);
    if (await withDeletionWorkerDatabase(this.pool, async client =>
      (await client.query('select app.legacy_account_cleanup_pending($1) as pending', [owner])).rows[0].pending))
      throw new Error('Content cleanup will retry');
  }
}
