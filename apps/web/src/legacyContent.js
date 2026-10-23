const ids = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const uploadMetadataBytes = 64 * 1024, savedTextBytes = 48 * 1024;
function textSize(value) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > savedTextBytes)
    throw Object.assign(new Error('Content text too large'), { code: 'legacy_content_too_large' });
}
export function contentAccessInvalid(error) {
  return error?.status === 401 || ['authentication_required', 'account_changed', 'legacy_unavailable', 'legacy_invalid_response'].includes(error?.code);
}
export const contentMediaTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'audio/wav'];
export const contentActions = ['preserve', 'request_data', 'cancel_subscription', 'close_account', 'memorialize', 'other'];
export const contentStatuses = ['not_started', 'ready', 'submitted', 'needs_information', 'completed', 'stopped'];
function invalid() { const error = new Error('Invalid content response'); error.code = 'legacy_invalid_response'; throw error; }
function text(value, max) { if (typeof value !== 'string' || value.length > max) invalid(); }
function id(value) { if (!ids.test(value)) invalid(); return value; }
function integer(value, max) { if (!Number.isSafeInteger(value) || value < 1 || value > max) invalid(); }
export function validateContentAsset(value) {
  if (!value || !['file', 'voice'].includes(value.kind) || !['uploading', 'ready'].includes(value.state)
    || !contentMediaTypes.includes(value.mediaType) || value.mediaType.startsWith('audio/') !== (value.kind === 'voice')) invalid();
  id(value.publicId); integer(value.version, 2147483647); integer(value.byteCount, 8388608);
  text(value.name, 160); text(value.description, 2000); text(value.transcript, 12000);
  if (typeof value.transcriptConfirmed !== 'boolean') invalid();
  return value;
}
export function validatePackBody(body) {
  if (!body || !Array.isArray(body.tasks) || body.tasks.length > 30 || !Array.isArray(body.assetPublicIds) || body.assetPublicIds.length > 20) invalid();
  text(body.title, 180); text(body.note, 3000); body.assetPublicIds.forEach(id);
  if (!body.assetVersions || typeof body.assetVersions !== 'object' || Object.keys(body.assetVersions).length !== body.assetPublicIds.length) invalid();
  body.assetPublicIds.forEach(id => integer(body.assetVersions[id], 2147483647));
  const tasks = new Set(body.tasks.map(task => id(task.id)));
  if (tasks.size !== body.tasks.length) invalid();
  for (const task of body.tasks) {
    text(task.title, 180); text(task.instructions, 2500);
    if (task.matterPublicId !== null) id(task.matterPublicId);
    if (!contentActions.includes(task.action) || !Array.isArray(task.dependsOn) || task.dependsOn.length > 10
      || task.dependsOn.some(previous => previous === task.id || !tasks.has(previous))) invalid();
  }
  return body;
}
function validatePack(value) {
  id(value?.publicId); integer(value.version, 2147483647); validatePackBody(value.body);
  if (!['current', 'after_death'].includes(value.intent)) invalid();
  if (value.personPublicId !== null) id(value.personPublicId);
  return value;
}
export function validateContentWorkspace(value) {
  if (!value || typeof value.canCreate !== 'boolean' || typeof value.acceptedNotice !== 'boolean'
    || !Array.isArray(value.assets) || value.assets.length > 100 || !Array.isArray(value.packs) || value.packs.length > 30
    || !Array.isArray(value.received) || value.received.length > 50 || !value.notice?.en || !value.notice?.['zh-CN']) invalid();
  if (value.receivedNextCursor != null) id(value.receivedNextCursor);
  value.assets.forEach(validateContentAsset); value.packs.forEach(validatePack);
  value.received.forEach(item => { id(item.publicId); validatePackBody(item.body); });
  return value;
}
function publication(result) {
  const value = result?.publication; id(value?.publicId); validatePackBody(value.body);
  if (!Array.isArray(value.assets) || value.assets.length > 20 || !Array.isArray(value.progress) || value.progress.length > 30) invalid();
  value.assets.forEach(validateContentAsset);
  value.progress.forEach(item => { id(item.publicId); id(item.taskId); integer(item.version, 2147483647);
    if (!contentStatuses.includes(item.status)) invalid(); text(item.reference, 240); text(item.note, 2000); });
  return result;
}
export function fileUploadBody(file, input) {
  if (!(file instanceof Blob) || file.size < 1 || file.size > 8388608) throw Object.assign(new Error('File too large'), { code: 'legacy_file_size' });
  const metadata = new TextEncoder().encode(JSON.stringify(input));
  if (input.metadata) textSize(input.metadata);
  if (metadata.length > uploadMetadataBytes) throw Object.assign(new Error('Description too long'), { code: 'legacy_content_too_large' });
  const size = new ArrayBuffer(4); new DataView(size).setUint32(0, metadata.length);
  return new Blob([size, metadata, file], { type: 'application/octet-stream' });
}
export function contentDownloadName(asset) {
  const extensions = { 'application/pdf': ['pdf'], 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'audio/wav': ['wav'] };
  const allowed = extensions[asset.mediaType];
  if (!allowed) invalid();
  return allowed.some(ext => asset.name.toLowerCase().endsWith(`.${ext}`)) ? asset.name : `${asset.name}.${allowed[0]}`;
}
export function createLegacyClient(request) {
  const path = value => encodeURIComponent(id(value));
  return {
    overview: () => request('/legacy-content').then(validateContentWorkspace),
    consent: version => request('/legacy-content/consent', { method: 'POST', body: { version, accepted: true } }),
    upload: (file, input) => request('/legacy-content/assets', { method: 'POST', binary: true,
      headers: { 'Content-Type': 'application/octet-stream' }, body: fileUploadBody(file, input) }).then(value => ({ asset: validateContentAsset(value?.asset) })),
    updateAsset: (value, metadata) => { textSize(metadata); return request(`/legacy-content/assets/${path(value.publicId)}`, { method: 'PATCH', body: { expectedVersion: value.version, metadata } }).then(result => ({ asset: validateContentAsset(result?.asset) })); },
    deleteAsset: asset => request(`/legacy-content/assets/${path(asset.publicId)}`, { method: 'DELETE' }),
    download: (asset, publicationId) => request(publicationId ? `/legacy-content/received/${path(publicationId)}/assets/${path(asset.publicId)}/download`
      : `/legacy-content/assets/${path(asset.publicId)}/download`, { responseKind: 'legacy-file', expectedFile: { bytes: asset.byteCount, mediaType: asset.mediaType } }),
    savePack: (value, input) => { textSize(input.body); return request(value?.publicId ? `/legacy-content/packs/${path(value.publicId)}` : '/legacy-content/packs',
      { method: value?.publicId ? 'PATCH' : 'POST', body: { ...input, ...(value?.publicId ? { expectedVersion: value.version } : {}) } }).then(result => ({ pack: validatePack(result?.pack) })); },
    publish: value => request(`/legacy-content/packs/${path(value.publicId)}/publish`, { method: 'POST', body: { expectedVersion: value.version, shareNow: true } }),
    revoke: value => request(`/legacy-content/packs/${path(value.publicId)}/revoke`, { method: 'POST', body: {} }),
    deletePack: value => request(`/legacy-content/packs/${path(value.publicId)}`, { method: 'DELETE' }),
    publication: value => request(`/legacy-content/publications/${path(value)}`).then(publication),
    publicationState: value => request(`/legacy-content/publications/${path(value)}/state`).then(state => {
      if (!/^[0-9]{1,12}$/.test(state?.revision)) invalid(); return state;
    }),
    receivedPage: cursor => request(`/legacy-content/received?cursor=${path(cursor)}`).then(page => {
      if (!Array.isArray(page?.items) || page.items.length > 50) invalid();
      page.items.forEach(item => { id(item.publicId); validatePackBody(item.body); });
      if (page.nextCursor !== null) id(page.nextCursor); return page;
    }),
    report: (publicationId, progress, expectedVersion) => request(`/legacy-content/publications/${path(publicationId)}/progress`, { method: 'POST', body: { progress, expectedVersion } }),
  };
}
