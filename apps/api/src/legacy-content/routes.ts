import express, { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { requireCsrf } from '../auth.js';
import { ApiError, asyncHandler } from '../errors.js';
import { assetKinds, assetMetadataSchema, assetMimeTypes, contentLimits, packBodySchema, progressSchema, publicId, revision } from './contracts.js';
import { ContentContext } from './context.js';
import { ContentAssets } from './assets.js';
import { ContentPacks } from './packs.js';
import { contentNotice, contentNoticeVersion } from './notice.js';

const packInput = z.object({ personPublicId: publicId.nullable(), intent: z.enum(['current', 'after_death']), body: packBodySchema }).strict();
const uploadInput = z.object({ requestKey: publicId, kind: z.enum(assetKinds), mediaType: z.enum(assetMimeTypes), metadata: assetMetadataSchema }).strict();
export function contentUploadHandlers(context: ContentContext): RequestHandler[] {
  const assets = new ContentAssets(context);
  let receiving = 0;
  const capacity: RequestHandler = (_request, response, next) => {
    if (receiving >= 2) { next(new ApiError(429, 'legacy_upload_busy', 'Uploads are busy. Try again shortly.')); return; }
    receiving++; let released = false;
    const release = () => { if (!released) { released = true; receiving--; } };
    response.once('finish', release); response.once('close', release); next();
  };
  const rate = rateLimit({ windowMs: 60000, limit: 10, keyGenerator: request => request.auth.plannerId,
    standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'legacy_upload_busy', message: 'Try uploading again in a minute.' } } });
  return [requireCsrf, rate, capacity, express.raw({ type: 'application/octet-stream', limit: contentLimits.fileBytes + 4100 }), asyncHandler(async (request, response) => {
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length < 5) throw new ApiError(400, 'legacy_upload_invalid', 'Choose a supported file.');
    try {
      const metadataBytes = body.readUInt32BE(0);
      if (metadataBytes < 2 || metadataBytes > 4096 || body.length <= metadataBytes + 4) throw new ApiError(400, 'legacy_upload_invalid', 'Choose a supported file.');
      let raw: unknown;
      try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body.subarray(4, 4 + metadataBytes))); }
      catch { throw new ApiError(400, 'legacy_upload_invalid', 'The upload description is invalid.'); }
      const input = uploadInput.parse(raw);
      const asset = await assets.upload(request.auth.plannerId, input, body.subarray(4 + metadataBytes));
      response.status(asset.state === 'ready' ? 201 : 202).json({ asset });
    } finally { body.fill(0); }
  })];
}
export function contentNoticeHandler(): RequestHandler { return (_request, response) => { response.json({ notice: contentNotice }); }; }
export function createContentRouter(context: ContentContext) {
  const router = Router(), assets = new ContentAssets(context), packs = new ContentPacks(context);
  router.use((request, response, next) => {
    // Cookie-authenticated reads do not send a CSRF token in either client.
    // Every mutation still needs the existing token check; upload has its own
    // authenticated handler above and retains the same protection.
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) next();
    else requireCsrf(request, response, next);
  });
  router.get('/', asyncHandler(async (request, response) => {
    response.json(await context.transaction(request.auth.plannerId, async ({ client, owner }) => {
      const inbox = await packs.received(client);
      return {
      canCreate: await context.canCreate(client), writesEnabled: context.writesEnabled, limits: contentLimits, notice: contentNotice,
      acceptedNotice: Boolean((await client.query('select 1 from app.legacy_content_consents where version=$1', [contentNoticeVersion])).rowCount),
      assets: await assets.list(client, owner), packs: await packs.list(client, owner), received: inbox.items, receivedNextCursor: inbox.nextCursor,
      cleanupPending: Number((await client.query('select count(*)::int as count from app.legacy_content_cleanup where completed_at is null')).rows[0]?.count ?? 0),
    }; }));
  }));
  router.get('/received', asyncHandler(async (request, response) => {
    const cursor = publicId.optional().parse(request.query.cursor);
    response.json(await context.transaction(request.auth.plannerId, ({ client }) => packs.received(client, cursor)));
  }));
  router.post('/consent', asyncHandler(async (request, response) => {
    z.object({ version: z.literal(contentNoticeVersion), accepted: z.literal(true) }).strict().parse(request.body);
    await context.transaction(request.auth.plannerId, ({ client }) => client.query('insert into app.legacy_content_consents(planner_id,version) values(app.current_planner_id(),$1) on conflict do nothing', [contentNoticeVersion]));
    response.json({ accepted: true, version: contentNoticeVersion });
  }));
  router.patch('/assets/:id', asyncHandler(async (request, response) => {
    const input = z.object({ expectedVersion: revision, metadata: assetMetadataSchema }).strict().parse(request.body);
    response.json({ asset: await assets.update(request.auth.plannerId, publicId.parse(request.params.id), input.expectedVersion, input.metadata) });
  }));
  router.delete('/assets/:id', asyncHandler(async (request, response) => { response.json(await assets.remove(request.auth.plannerId, publicId.parse(request.params.id))); }));
  const download: RequestHandler = asyncHandler(async (request, response) => {
    const result = await assets.download(request.auth.plannerId, publicId.parse(request.params.id),
      request.params.publication ? publicId.parse(request.params.publication) : undefined);
    response.setHeader('Content-Type', result.metadata.mediaType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Disposition', `attachment; filename="rillora-file"; filename*=UTF-8''${encodeURIComponent(result.metadata.name).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`);
    response.setHeader('Content-Length', result.bytes.length);
    response.setHeader('X-Rillora-File-Bytes', result.bytes.length);
    response.end(result.bytes, () => result.bytes.fill(0));
  });
  router.get('/assets/:id/download', download);
  router.get('/received/:publication/assets/:id/download', download);
  router.post('/packs', asyncHandler(async (request, response) => { response.status(201).json({ pack: await packs.save(request.auth.plannerId, packInput.parse(request.body)) }); }));
  router.patch('/packs/:id', asyncHandler(async (request, response) => {
    const { expectedVersion, ...input } = packInput.extend({ expectedVersion: revision }).parse(request.body);
    response.json({ pack: await packs.save(request.auth.plannerId, input, publicId.parse(request.params.id), expectedVersion) });
  }));
  router.delete('/packs/:id', asyncHandler(async (request, response) => { response.json(await packs.remove(request.auth.plannerId, publicId.parse(request.params.id))); }));
  router.post('/packs/:id/publish', asyncHandler(async (request, response) => {
    const input = z.object({ expectedVersion: revision, shareNow: z.literal(true) }).strict().parse(request.body);
    response.json({ publication: await packs.publish(request.auth.plannerId, publicId.parse(request.params.id), input.expectedVersion) });
  }));
  router.post('/packs/:id/revoke', asyncHandler(async (request, response) => {
    z.object({}).strict().parse(request.body);
    response.json(await packs.revoke(request.auth.plannerId, publicId.parse(request.params.id)));
  }));
  router.get('/publications/:id', asyncHandler(async (request, response) => { response.json({ publication: await packs.detail(request.auth.plannerId, publicId.parse(request.params.id)) }); }));
  router.get('/publications/:id/state', asyncHandler(async (request, response) => { response.json(await packs.state(request.auth.plannerId, publicId.parse(request.params.id))); }));
  router.post('/publications/:id/progress', asyncHandler(async (request, response) => {
    const input = z.object({ expectedVersion: z.number().int().min(0), progress: progressSchema }).strict().parse(request.body);
    response.json({ progress: await packs.report(request.auth.plannerId, publicId.parse(request.params.id), input.progress, input.expectedVersion) });
  }));
  return router;
}
