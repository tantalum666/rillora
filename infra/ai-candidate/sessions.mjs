import { EncryptJWT, jwtDecrypt } from 'jose';
import { ORIGIN } from './config.mjs';

const NAME = '__Host-rillora-ai-candidate';
export async function sealSession(env, identity, planner) {
  const csrf = crypto.randomUUID();
  const token = await new EncryptJWT({ subject: identity.subject, plannerId: planner.id, publicId: planner.public_id, csrf,
    authenticatedAt: identity.authenticatedAt.getTime() })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setIssuer(ORIGIN).setAudience('candidate-browser')
    .setIssuedAt().setExpirationTime('30m').encrypt(Buffer.from(env.SESSION_KEY, 'hex'));
  return { csrf, cookie: `${NAME}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800` };
}
export async function readSession(request, env) {
  const matches = (request.headers.get('cookie') ?? '').split(';').map(s => s.trim()).filter(s => s.startsWith(NAME + '='));
  if (matches.length !== 1) throw new Error('Sign in required');
  const { payload } = await jwtDecrypt(matches[0].slice(NAME.length + 1), Buffer.from(env.SESSION_KEY, 'hex'),
    { issuer: ORIGIN, audience: 'candidate-browser', keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] });
  if (payload.subject !== env.SYNTHETIC_SUBJECT || !/^[1-9][0-9]*$/.test(payload.plannerId ?? '')
    || typeof payload.csrf !== 'string' || typeof payload.authenticatedAt !== 'number') throw new Error('Sign in required');
  return { subject: String(payload.subject), plannerId: String(payload.plannerId), publicId: String(payload.publicId),
    csrf: String(payload.csrf), authenticatedAt: Number(payload.authenticatedAt) };
}
export function requireFormCsrf(request, session, form) {
  if (request.headers.get('origin') !== ORIGIN || form.get('csrf') !== session.csrf) throw new Error('Invalid browser request');
}
export const clearCookie = `${NAME}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
