import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { ApiError } from '../errors.js';
import { assetMetadataSchema, contentLimits, packBodySchema, progressSchema, type PackBody, type TaskProgress } from './contracts.js';
import { ContentContext, boundedMap, changed, missing } from './context.js';
import { ContentAssets } from './assets.js';

export type PackInput = { personPublicId: string | null; intent: 'current' | 'after_death'; body: PackBody };
type Publication = { publicId: string; packPublicId: string; owner: string; ownerName: string | null;
  packVersion: number; body: unknown; publishedAt: string; isOwner?: boolean };

export class ContentPacks {
  readonly assets: ContentAssets;
  constructor(readonly context: ContentContext) { this.assets = new ContentAssets(context); }
  private async project(row: Record<string, any>, owner: string) {
    return { publicId: row.public_id, personPublicId: row.person_public_id, intent: row.intent, version: row.version,
      publicationId: row.publication_id ?? null, publishedVersion: row.published_version ?? null,
      body: await this.context.cipher.openJson(row.body_envelope,
        { owner, resource: row.public_id, purpose: 'pack', version: row.version }, packBodySchema) };
  }
  async list(client: PoolClient, owner: string) {
    return boundedMap((await client.query(`select p.*,person.public_id as person_public_id,pub.public_id as publication_id,pub.pack_version as published_version
     from app.legacy_action_packs p left join app.people person on person.id=p.person_id
     left join app.legacy_pack_publications pub on pub.pack_id=p.id and pub.revoked_at is null order by p.updated_at desc limit 30`)).rows,
    row => this.project(row, owner));
  }
  async save(plannerId: string, input: PackInput, id: string = randomUUID(), expectedVersion = 0) {
    return this.context.transaction(plannerId, async ({ client, owner }) => {
      await this.context.lock(client); await this.context.requireCreate(client);
      const existing = (await client.query('select * from app.legacy_action_packs where public_id=$1 for update', [id])).rows[0];
      if (expectedVersion > 0 && !existing) throw missing();
      if ((existing?.version ?? 0) !== expectedVersion) throw changed();
      if (!existing && (await client.query('select count(*)::int as count from app.legacy_action_packs')).rows[0].count >= contentLimits.packs)
        throw new ApiError(409, 'legacy_pack_limit', 'Your action-pack allowance is full.');
      const person = input.personPublicId ? (await client.query("select id from app.people where public_id=$1 and status not in('archived','revoked')", [input.personPublicId])).rows[0] : null;
      if (input.personPublicId && !person) throw missing();
      const matters = [...new Set(input.body.tasks.flatMap(task => task.matterPublicId ? [task.matterPublicId] : []))];
      const foundMatters = (await client.query('select id,public_id from app.matter_items where public_id=any($1::uuid[]) and archived_at is null', [matters])).rows;
      const foundAssets = (await client.query("select id,public_id,version from app.legacy_content_assets where public_id=any($1::uuid[]) and storage_state='ready' for share", [input.body.assetPublicIds])).rows;
      if (foundMatters.length !== matters.length || foundAssets.length !== input.body.assetPublicIds.length) throw missing();
      if (foundAssets.some(asset => input.body.assetVersions[asset.public_id] !== asset.version)) throw changed();
      const version = expectedVersion + 1;
      const sealed = await this.context.cipher.sealJson(input.body, { owner, resource: id, purpose: 'pack', version });
      const saved = (await client.query(existing
        ? 'update app.legacy_action_packs set person_id=$2,intent=$3,body_envelope=$4,version=$5,updated_at=now() where public_id=$1 returning *'
        : 'insert into app.legacy_action_packs(public_id,planner_id,person_id,intent,body_envelope,version) values($1,app.current_planner_id(),$2,$3,$4,$5) returning *',
      [id, person?.id ?? null, input.intent, sealed, version])).rows[0]!;
      await client.query('delete from app.legacy_pack_matters where pack_id=$1', [saved.id]);
      await client.query('delete from app.legacy_pack_assets where pack_id=$1', [saved.id]);
      for (const matter of foundMatters) await client.query('insert into app.legacy_pack_matters(pack_id,planner_id,matter_id) values($1,app.current_planner_id(),$2)', [saved.id, matter.id]);
      for (const asset of foundAssets) await client.query('insert into app.legacy_pack_assets(pack_id,planner_id,asset_id) values($1,app.current_planner_id(),$2)', [saved.id, asset.id]);
      // No publication is changed by a content edit. Its selected version stays
      // frozen until the planner explicitly shares a replacement or revokes it.
      return this.project({ ...saved, person_public_id: input.personPublicId }, owner);
    });
  }
  async publish(plannerId: string, id: string, expectedVersion: number) {
    return this.context.transaction(plannerId, async ({ client, owner }) => {
      await this.context.lock(client); await this.context.requireCreate(client);
      const pack = (await client.query('select * from app.legacy_action_packs where public_id=$1 for update', [id])).rows[0];
      if (!pack) throw missing(); if (pack.version !== expectedVersion) throw changed();
      if (pack.intent !== 'current') throw new ApiError(409, 'legacy_future_private', 'Future intentions remain private. Post-death delivery is not available.');
      const connection = (await client.query("select id,public_id from app.sharing_connections where person_id=$1 and status='accepted'", [pack.person_id])).rows[0];
      if (!connection || (await client.query('select app.sharing_connection_access($1) as access', [connection.public_id])).rows[0]?.access?.mode !== 'live')
        throw new ApiError(409, 'legacy_contact_unavailable', 'Choose an accepted contact with a current sharing place.');
      const body = await this.context.cipher.openJson(pack.body_envelope, { owner, resource: id, purpose: 'pack', version: pack.version }, packBodySchema);
      // Check the frozen source references as well as today's draft link table.
      const refs = [...new Set(body.tasks.flatMap(task => task.matterPublicId ? [task.matterPublicId] : []))];
      const permitted = (await client.query("select public_id from app.matter_items where public_id=any($1::uuid[]) and archived_at is null and desired_outcome<>'never_disclose'", [refs])).rows;
      if (permitted.length !== refs.length) throw new ApiError(409, 'legacy_private_matter', 'A linked matter is private or unavailable. Remove it before sharing.');
      const selected = (await client.query("select * from app.legacy_content_assets where public_id=any($1::uuid[]) and storage_state='ready' for share", [body.assetPublicIds])).rows;
      if (selected.length !== body.assetPublicIds.length) throw changed();
      if (selected.some(asset => body.assetVersions[asset.public_id] !== asset.version)) throw changed();
      const old = (await client.query('select public_id from app.legacy_pack_publications where pack_id=$1 and pack_version=$2 and revoked_at is null', [pack.id, pack.version])).rows[0];
      if (old) return { publicId: old.public_id };
      await client.query('update app.legacy_pack_publications set revoked_at=now() where pack_id=$1 and revoked_at is null', [pack.id]);
      const publication = (await client.query(`insert into app.legacy_pack_publications(public_id,planner_id,pack_id,connection_id,pack_version,body_envelope)
       values($1,app.current_planner_id(),$2,$3,$4,$5) returning id,public_id`, [randomUUID(), pack.id, connection.id, pack.version, pack.body_envelope])).rows[0]!;
      await client.query(`insert into app.legacy_publication_matters(publication_id,planner_id,matter_id)
       select $1,app.current_planner_id(),id from app.matter_items where public_id=any($2::uuid[])`, [publication.id, refs]);
      for (const asset of selected) {
        const metadata = await this.context.cipher.openJson(asset.metadata_envelope,
          { owner, resource: asset.public_id, purpose: 'asset-metadata', version: asset.version }, assetMetadataSchema);
        // Unchecked transcription is never presented to a recipient as wishes.
        if (!metadata.transcriptConfirmed) metadata.transcript = '';
        const snapshot = await this.context.cipher.sealJson(metadata,
          { owner, resource: asset.public_id, purpose: 'asset-metadata', version: asset.version });
        await client.query(`insert into app.legacy_publication_assets(publication_id,planner_id,asset_id,metadata_version,metadata_envelope)
         values($1,app.current_planner_id(),$2,$3,$4)`, [publication.id, asset.id, asset.version, snapshot]);
      }
      return { publicId: publication.public_id };
    });
  }
  async revoke(plannerId: string, id: string) {
    return this.context.transaction(plannerId, async ({ client }) => {
      await this.context.lock(client);
      await client.query(`update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where pack_id in
       (select id from app.legacy_action_packs where public_id=$1)`, [id]);
      return { revoked: true, savedCopiesMayRemain: true };
    });
  }
  async remove(plannerId: string, id: string) {
    return this.context.transaction(plannerId, async ({ client }) => {
      await this.context.lock(client); await client.query('delete from app.legacy_action_packs where public_id=$1', [id]);
      return { removed: true };
    });
  }
  async received(client: PoolClient, cursor?: string) {
    const items: Publication[] = (await client.query('select app.legacy_received(null,$1) as items', [cursor ?? null])).rows[0].items;
    if (cursor && !items.length) throw changed();
    return { items: await boundedMap(items.slice(0, 50), async item => ({ publicId: item.publicId, ownerName: item.ownerName, publishedAt: item.publishedAt,
      body: await this.context.cipher.openJson(item.body, { owner: item.owner, resource: item.packPublicId, purpose: 'pack', version: item.packVersion }, packBodySchema) })),
      nextCursor: items.length > 50 ? items[49]!.publicId : null };
  }
  async state(plannerId: string, id: string) {
    return this.context.transaction(plannerId, async ({ client }) => {
      const state = (await client.query('select app.legacy_publication_state($1) as state', [id])).rows[0]?.state;
      if (!state) throw missing(); return state as { revision: string };
    });
  }
  private async publication(client: PoolClient, id: string, owner: string): Promise<Publication> {
    const own = (await client.query(`select pub.public_id as "publicId",p.public_id as "packPublicId",pub.pack_version as "packVersion",
     pub.body_envelope as body,pub.published_at as "publishedAt" from app.legacy_pack_publications pub
     join app.legacy_action_packs p on p.id=pub.pack_id where pub.public_id=$1 and pub.revoked_at is null`, [id])).rows[0];
    if (own) return { ...own, owner, ownerName: null, isOwner: true } as Publication;
    const received = (await client.query('select app.legacy_received($1) as items', [id])).rows[0]?.items?.[0];
    if (!received) throw missing(); return received;
  }
  private async progress(client: PoolClient, pub: Publication) {
    return boundedMap((await client.query('select app.legacy_progress($1) as items', [pub.publicId])).rows[0].items as Record<string, any>[], async row => ({
      publicId: row.publicId, version: row.version, updatedAt: row.updatedAt, reportedByOwner: row.reportedByOwner === true,
      ...await this.context.cipher.openJson(row.body, { owner: pub.owner, resource: row.publicId, purpose: 'progress', version: row.version }, progressSchema),
    }));
  }
  async detail(plannerId: string, id: string) {
    return this.context.transaction(plannerId, async ({ client, owner }) => {
      const pub = await this.publication(client, id, owner);
      const body = await this.context.cipher.openJson(pub.body, { owner: pub.owner, resource: pub.packPublicId, purpose: 'pack', version: pub.packVersion }, packBodySchema);
      const selected = pub.isOwner ? (await client.query(`select a.public_id,a.kind,a.media_type,a.byte_count,pa.metadata_version as version,pa.metadata_envelope
       from app.legacy_publication_assets pa join app.legacy_pack_publications pub on pub.id=pa.publication_id
       join app.legacy_content_assets a on a.id=pa.asset_id where pub.public_id=$1`, [id])).rows
        : (await client.query('select app.legacy_received_assets($1) as items', [id])).rows[0].items;
      return { publicId: id, body, isOwner: pub.isOwner === true, ownerName: pub.ownerName, publishedAt: pub.publishedAt,
        assets: await boundedMap(selected as Record<string, any>[], asset => this.assets.project(asset, pub.owner)),
        progress: await this.progress(client, pub) };
    });
  }
  async report(plannerId: string, id: string, input: TaskProgress, expectedVersion: number) {
    return this.context.transaction(plannerId, async ({ client, owner }) => {
      // The database function serializes publication revocation and optimistic
      // progress writes. There is no recipient subscription requirement.
      if (!(await client.query('select app.legacy_lock_publication($1) as allowed', [id])).rows[0]?.allowed) throw missing();
      const pub = await this.publication(client, id, owner);
      const body = await this.context.cipher.openJson(pub.body, { owner: pub.owner, resource: pub.packPublicId, purpose: 'pack', version: pub.packVersion }, packBodySchema);
      const task = body.tasks.find(task => task.id === input.taskId); if (!task) throw missing();
      const progress = await this.progress(client, pub), previous = progress.find(row => row.taskId === input.taskId);
      if ((previous?.version ?? 0) !== expectedVersion) throw changed();
      if (['submitted', 'completed'].includes(input.status) && task.dependsOn.some(dependency => !progress.some(row => row.taskId === dependency && row.status === 'completed')))
        throw new ApiError(409, 'legacy_prerequisites', 'Complete the prerequisite steps before reporting this step as submitted or complete.');
      const publicId = previous?.publicId ?? randomUUID(), version = expectedVersion + 1;
      const sealed = await this.context.cipher.sealJson(input, { owner: pub.owner, resource: publicId, purpose: 'progress', version });
      if (!(await client.query('select app.legacy_report_progress($1,$2,$3,$4,$5,$6) as saved', [id, input.taskId, publicId, version, input.status, sealed])).rows[0]?.saved) throw changed();
      return { publicId, version, ...input, reportedByOwner: pub.isOwner === true };
    });
  }
}
