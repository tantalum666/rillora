import { z } from 'zod';
import { ApiError } from '../errors.js';

export const contentLimits = Object.freeze({
  fileBytes: 8 * 1024 * 1024,
  ownerBytes: 128 * 1024 * 1024,
  assets: 100,
  packs: 30,
  tasks: 30,
  packAssets: 20,
  voiceSeconds: 180,
  // The encrypted metadata body allows 48 KiB; its upload envelope needs room too.
  uploadMetadataBytes: 64 * 1024,
});
export const publicId = z.uuid().transform(value => value.toLowerCase());
export const revision = z.number().int().positive();
export const assetKinds = ['file', 'voice'] as const;
export const assetMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'audio/wav'] as const;
export const assetMetadataSchema = z.object({
  name: z.string().trim().min(1).max(160).refine(value => !/[\u0000-\u001f\u007f/\\]/u.test(value)),
  description: z.string().trim().max(2000).default(''),
  transcript: z.string().max(12000).default(''),
  transcriptConfirmed: z.boolean().default(false),
  language: z.enum(['en-US', 'zh-CN']).default('en-US'),
}).strict();
export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export const taskStatus = z.enum(['not_started', 'ready', 'submitted', 'needs_information', 'completed', 'stopped']);
export const packTaskSchema = z.object({
  id: publicId,
  matterPublicId: publicId.nullable(),
  title: z.string().trim().min(1).max(180),
  action: z.enum(['preserve', 'request_data', 'cancel_subscription', 'close_account', 'memorialize', 'other']),
  instructions: z.string().max(2500),
  providerId: z.string().regex(/^[a-z0-9-]{1,50}$/).nullable(),
  dependsOn: z.array(publicId).max(10).default([]),
}).strict();
export const packBodySchema = z.object({
  title: z.string().trim().min(1).max(180),
  note: z.string().max(3000).default(''),
  tasks: z.array(packTaskSchema).max(contentLimits.tasks),
  assetPublicIds: z.array(publicId).max(contentLimits.packAssets),
  assetVersions: z.record(publicId, revision),
}).strict().superRefine((body, context) => {
  const ids = new Set(body.tasks.map(task => task.id));
  if (ids.size !== body.tasks.length || new Set(body.assetPublicIds).size !== body.assetPublicIds.length)
    context.addIssue({ code: 'custom', message: 'Duplicate task or file.' });
  if (Object.keys(body.assetVersions).length !== body.assetPublicIds.length || body.assetPublicIds.some(id => !body.assetVersions[id]))
    context.addIssue({ code: 'custom', message: 'File versions must match the selected files.' });
  for (const task of body.tasks) if (task.dependsOn.some(id => !ids.has(id) || id === task.id))
    context.addIssue({ code: 'custom', message: 'Invalid prerequisite.' });
  const visited = new Set<string>(), active = new Set<string>();
  const tasks = new Map(body.tasks.map(task => [task.id, task]));
  function cycle(id: string): boolean {
    if (active.has(id)) return true;
    if (visited.has(id)) return false;
    active.add(id);
    for (const previous of tasks.get(id)?.dependsOn ?? []) if (cycle(previous)) return true;
    active.delete(id); visited.add(id); return false;
  }
  if (body.tasks.some(task => cycle(task.id))) context.addIssue({ code: 'custom', message: 'Circular prerequisites.' });
});
export type PackBody = z.infer<typeof packBodySchema>;
export const progressSchema = z.object({
  taskId: publicId, status: taskStatus,
  reference: z.string().trim().max(240).default(''),
  note: z.string().max(2000).default(''),
}).strict();
export type TaskProgress = z.infer<typeof progressSchema>;

/** Whitelisted downloads only. No HTML/SVG/archives or executable previews. */
export function validateAssetBytes(bytes: Buffer, mime: typeof assetMimeTypes[number], kind: typeof assetKinds[number]): void {
  if (!bytes.length || bytes.length > contentLimits.fileBytes) throw new ApiError(413, 'legacy_file_size', 'Choose a file within the size limit.');
  if (mime.startsWith('audio/') !== (kind === 'voice')) throw new ApiError(400, 'legacy_file_type', 'This file type is not supported.');
  const starts = (text: string) => bytes.subarray(0, text.length).equals(Buffer.from(text, 'binary'));
  const match = mime === 'application/pdf' ? starts('%PDF-')
    : mime === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mime === 'image/webp' ? starts('RIFF') && bytes.subarray(8, 12).toString() === 'WEBP'
    : mime === 'audio/wav' ? starts('RIFF') && bytes.subarray(8, 12).toString() === 'WAVE'
    : false;
  if (!match) throw new ApiError(400, 'legacy_file_type', 'The file does not match its declared type.');
  if (kind === 'voice') voiceDuration(bytes);
}

/** The recorder exports a bounded PCM WAV, avoiding trust in browser duration claims. */
export function voiceDuration(bytes: Buffer): number {
  if (bytes.length < 46 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE'
    || bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.toString('ascii', 12, 16) !== 'fmt '
    || bytes.readUInt32LE(16) !== 16 || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1
    || bytes.readUInt32LE(24) !== 16000 || bytes.readUInt32LE(28) !== 32000
    || bytes.readUInt16LE(32) !== 2 || bytes.readUInt16LE(34) !== 16
    || bytes.toString('ascii', 36, 40) !== 'data' || bytes.readUInt32LE(40) !== bytes.length - 44
    || (bytes.length - 44) % 2 !== 0 || bytes.length - 44 > contentLimits.voiceSeconds * 32000)
    throw new ApiError(400, 'legacy_voice_format', 'Record up to three minutes using the Rillora recorder.');
  return (bytes.length - 44) / 32000;
}
