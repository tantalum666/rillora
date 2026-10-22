import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { ApiError } from '../errors.js';
import { assetMetadataSchema, contentLimits, validateAssetBytes, type AssetMetadata, type assetKinds, type assetMimeTypes } from './contracts.js';
import { ContentContext, boundedMap, changed, missing } from './context.js';
import { contentObjectKey } from './object-store.js';

export class ContentAssets {
  constructor(readonly context: ContentContext) {}
  async project(row: Record<string, any>, owner: string) {
    const metadata = await this.context.cipher.openJson(row.metadata_envelope ?? row.metadata,
      { owner, resource: row.public_id ?? row.publicId, purpose: 'asset-metadata', version: row.version }, assetMetadataSchema);
    return { publicId: row.public_id ?? row.publicId, kind: row.kind, mediaType: row.media_type ?? row.mediaType,
      byteCount: row.byte_count ?? row.byteCount, version: row.version, ...metadata,
      state: row.storage_state ?? 'ready' };
  }
  async list(client: PoolClient, owner: string) {
    const rows = (await client.query('select * from app.legacy_content_assets order by created_at desc limit 100')).rows;
    return boundedMap(rows, row => this.project(row, owner));
  }
  async upload(plannerId: string, input: { requestKey: string; kind: typeof assetKinds[number]; mediaType: typeof assetMimeTypes[number]; metadata: AssetMetadata }, bytes: Buffer) {
    validateAssetBytes(bytes, input.mediaType, input.kind);
    const reservation = await this.context.transaction(plannerId, async ({ client, owner }) => {
      await this.context.lock(client); await this.context.requireCreate(client);
      const existing = (await client.query('select * from app.legacy_content_assets where request_key=$1', [input.requestKey])).rows[0];
      if (existing) return { duplicate: true as const, asset: await this.project(existing, owner) };
      const usage = (await client.query('select count(*)::int as count,coalesce(sum(byte_count),0)::int as bytes from app.legacy_content_assets')).rows[0];
      if (usage.count >= contentLimits.assets || usage.bytes + bytes.length > contentLimits.ownerBytes)
        throw new ApiError(409, 'legacy_storage_limit', 'Your file allowance is full. Download or remove a file before adding another.');
      const id = randomUUID();
      const sealed = await this.context.cipher.seal(bytes, { owner, resource: id, purpose: 'asset', version: 1 });
      const metadata = await this.context.cipher.sealJson(input.metadata, { owner, resource: id, purpose: 'asset-metadata', version: 1 });
      await client.query(`insert into app.legacy_content_assets(public_id,planner_id,request_key,kind,media_type,byte_count,data_header,metadata_envelope)
        values($1,app.current_planner_id(),$2,$3,$4,$5,$6,$7)`, [id, input.requestKey, input.kind, input.mediaType, bytes.length, sealed.header, metadata]);
      return { duplicate: false as const, id, owner, sealed };
    });
    if (reservation.duplicate) return reservation.asset;
    const { id, owner, sealed } = reservation;
    try {
      // A committed reservation precedes S3. Crashes leave a bounded, sweepable
      // uploading row, never an untracked object or an uncharged quota slot.
      await this.context.objects.put(contentObjectKey(owner, id), sealed.ciphertext);
      return await this.context.transaction(plannerId, async ({ client }) => {
        const row = (await client.query("update app.legacy_content_assets set storage_state='ready',updated_at=now() where public_id=$1 and storage_state='uploading' returning *", [id])).rows[0];
        if (!row) throw missing();
        return this.project(row, owner);
      });
    } catch (error) {
      // If the account disappeared, its cascading trigger already queued this.
      try { await this.context.transaction(plannerId, ({ client }) => client.query('delete from app.legacy_content_assets where public_id=$1', [id])); } catch { /* Worker sweeps any surviving reservation. */ }
      throw error;
    } finally { sealed.ciphertext.fill(0); }
  }
  async update(plannerId: string, id: string, expectedVersion: number, metadata: AssetMetadata) {
    return this.context.transaction(plannerId, async ({ client, owner }) => {
      await this.context.lock(client); await this.context.requireCreate(client);
      const row = (await client.query("select * from app.legacy_content_assets where public_id=$1 and storage_state='ready' for update", [id])).rows[0];
      if (!row) throw missing(); if (row.version !== expectedVersion) throw changed();
      const next = expectedVersion + 1;
      const envelope = await this.context.cipher.sealJson(metadata, { owner, resource: id, purpose: 'asset-metadata', version: next });
      const updated = (await client.query('update app.legacy_content_assets set metadata_envelope=$2,version=$3,updated_at=now() where public_id=$1 returning *', [id, envelope, next])).rows[0]!;
      return this.project(updated, owner);
    });
  }
  async remove(plannerId: string, id: string) {
    return this.context.transaction(plannerId, async ({ client }) => {
      await this.context.lock(client);
      await client.query('delete from app.legacy_content_assets where public_id=$1', [id]);
      return { removed: true, savedCopiesMayRemain: true };
    });
  }
  async download(plannerId: string, id: string, publication?: string) {
    return this.context.transaction(plannerId, async ({ client, owner: ownOwner }) => {
      const row = publication
        ? (await client.query('select app.legacy_received_assets($1,$2) as assets', [publication, id])).rows[0]?.assets?.[0]
        : (await client.query("select * from app.legacy_content_assets where public_id=$1 and storage_state='ready'", [id])).rows[0];
      if (!row) throw missing();
      const owner = publication ? row.owner : ownOwner;
      const metadata = await this.project(row, owner);
      const ciphertext = await this.context.objects.get(contentObjectKey(owner, id));
      try {
        const bytes = await this.context.cipher.open(ciphertext, row.data_header ?? row.dataHeader,
          { owner, resource: id, purpose: 'asset', version: 1 }, contentLimits.fileBytes);
        // Re-check authorization after slow storage I/O. A revoked publication
        // cannot be made usable merely by starting a download beforehand.
        const available = publication
          ? (await client.query('select app.legacy_received_assets($1,$2) as assets', [publication, id])).rows[0]?.assets?.length
          : (await client.query("select 1 from app.legacy_content_assets where public_id=$1 and storage_state='ready'", [id])).rowCount;
        if (!available) { bytes.fill(0); throw missing(); }
        return { bytes, metadata };
      } finally { ciphertext.fill(0); }
    });
  }
}
