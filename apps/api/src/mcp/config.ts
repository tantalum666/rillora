import { z } from 'zod';
import type { AppConfig } from '../config.js';

export const MCP_SCOPES = ['matters:read:summary', 'readiness:read:scoped'] as const;
export const AI_CONSENT_VERSION = 'ai-selected-read-2026-10-15-1';
export const AI_IDENTITY_DISCLOSURE_VERSION = 'ai-verified-email-2026-10-18-1';
const https = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
});
const clients = z.array(z.object({
  key: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
  name: z.string().min(1).max(80),
  privacyUrl: https,
  clientId: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  verifiedEmailDisclosure: z.boolean().optional(),
}).strict()).min(1).max(16).refine(items => new Set(items.map(item => item.key)).size === items.length
  && new Set(items.map(item => item.clientId)).size === items.length);

export type McpConfig = { resourceUrl: string; issuer: string; clients: z.infer<typeof clients> };

/** Independent opt-in. Existing first-party clients and their audiences never become MCP credentials. */
export function loadMcpConfig(env: NodeJS.ProcessEnv, app: AppConfig): McpConfig | null {
  const enabled = z.enum(['true', 'false']).default('false').parse(env.ALLOW_MCP_INTEGRATION);
  if (enabled === 'false') {
    if (env.MCP_RESOURCE_URL || env.MCP_CLIENTS_JSON || env.MCP_OAUTH_SECRET_ARN || env.MCP_OAUTH_TABLE) throw new Error('MCP configuration requires explicit enablement');
    return null;
  }
  if (app.productionRuntimeClosed || app.productionReviewAccess) throw new Error('MCP is not available in a closed or App Review-only runtime');
  const issuer = app.oidc?.issuerUrl ?? app.nativeOidc?.issuerUrl;
  if (!issuer) throw new Error('MCP requires the existing verified identity issuer');
  const resourceUrl = https.parse(env.MCP_RESOURCE_URL);
  if (app.nodeEnv === 'production' && !['app.staging.rillora.xyz', 'app.rillora.xyz', 'mcp.staging.rillora.xyz', 'mcp.rillora.xyz'].includes(new URL(resourceUrl).hostname)) {
    throw new Error('MCP production resources must use an explicitly owned Rillora host');
  }
  if (!['/mcp', '/api/mcp'].includes(new URL(resourceUrl).pathname)) throw new Error('MCP requires its own exact resource URL');
  const configured = clients.parse(JSON.parse(env.MCP_CLIENTS_JSON ?? 'null'));
  const firstParty = new Set([app.oidc?.clientId, app.nativeOidc?.clientId]);
  if (configured.some(client => firstParty.has(client.clientId)) || resourceUrl === app.nativeOidc?.audience) {
    throw new Error('MCP cannot reuse a first-party client or audience');
  }
  return { resourceUrl, issuer: https.parse(issuer).replace(/\/$/, '') + '/', clients: configured };
}
