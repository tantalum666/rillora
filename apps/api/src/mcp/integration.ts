import express, { Router, type Express } from 'express';
import { createMcpHandler, McpServer, requireBearerAuth, requireScopes, type AuthInfo, type McpHandlerRequestOptions } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { withAuthDatabase, type DatabasePool } from '../db.js';
import { requireCsrf } from '../auth.js';
import { recentAuthenticationRequired } from '../recent-authentication.js';
import { preventCaching } from '../security.js';
import { ApiError, asyncHandler } from '../errors.js';
import { MCP_SCOPES, loadMcpConfig, type McpConfig } from './config.js';
import { createMcpTokenVerifier, type McpActor } from './identity.js';
import { SelectedAiService, connectionInput, revokeInput } from './service.js';

const noArgs = z.object({}).strict();
const summaryOutput = z.object({ matters: z.array(z.object({ publicId: z.uuid(), title: z.string(),
  category: z.string(), status: z.string() }).strict()).max(20) }).strict();
const gapsOutput = z.object({ matters: z.array(z.object({ publicId: z.uuid(),
  missingFields: z.array(z.enum(['provider', 'location', 'intended_outcome'])).max(3) }).strict()).max(20),
  assessment: z.literal('selected_common_fields_only'),
  notAssessed: z.array(z.enum(['category_specific_details', 'legal_authority', 'recipient_readiness'])).length(3) }).strict();

function buildServer(service: SelectedAiService, authInfo?: AuthInfo) {
  const actor = authInfo?.extra?.actor as McpActor | undefined;
  const server = new McpServer({ name: 'rillora', version: '0.1.0', title: 'Rillora' });
  const execute = async (operation: 'summary' | 'gaps') => {
    try {
      if (!actor) throw new ApiError(403, 'ai_connection_unavailable', 'Connect Rillora first.');
      const data = await service.read(actor, operation);
      return { content: [{ type: 'text' as const, text: JSON.stringify(data) }], structuredContent: data };
    } catch (error) {
      const code = error instanceof ApiError && error.code === 'ai_connection_unavailable'
        ? 'ai_connection_unavailable' : 'temporarily_unavailable';
      return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: code,
        nextStep: code === 'ai_connection_unavailable' ? 'Review the selected matters in Rillora and reconnect this AI application.' : 'Try again later.' }) }] };
    }
  };
  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  server.registerTool('list_selected_matters', {
    title: 'Read selected Rillora matters',
    description: 'Use when the connected user asks about matters they explicitly selected in Rillora. Returns titles, categories and statuses only. Do not use for general digital-legacy advice, unselected records, passwords, transfers or release of information.',
    inputSchema: noArgs, outputSchema: summaryOutput, annotations, scopeChallenge: requireScopes(MCP_SCOPES[0]),
  }, async () => execute('summary'));
  server.registerTool('get_preparation_gaps', {
    title: 'Check selected Rillora matters for missing information',
    description: 'Use when the connected user asks about missing common information in their explicitly selected Rillora matters. Checks required provider/location hints and stated wishes only, not category-specific details, legal authority or recipient readiness. Reports field names, not private values. Never release information.',
    inputSchema: noArgs, outputSchema: gapsOutput, annotations, scopeChallenge: requireScopes(MCP_SCOPES[1]),
  }, async () => execute('gaps'));
  return server;
}

export class McpIntegration {
  readonly connections: Router;
  readonly fetch: (request: Request, options?: McpHandlerRequestOptions) => Promise<Response>;
  constructor(private pool: DatabasePool, app: AppConfig, readonly config: McpConfig,
    verifier = createMcpTokenVerifier(config)) {
    if (app.productionRuntimeClosed || app.productionReviewAccess) throw new Error('MCP cannot mount in a closed or review-only runtime');
    const service = new SelectedAiService(pool, app, config);
    const resource = new URL(config.resourceUrl);
    const hosts = new Set([resource.hostname, ...(app.apiTls ? [app.apiTls.serverName] : []),
      ...(app.nodeEnv !== 'production' ? ['127.0.0.1', 'localhost', '[::1]'] : [])]);
    const origins = new Set([resource.origin, ...app.corsOrigins]);
    const metadataURL = config.resourceUrl + '/resource-metadata';
    const gate = requireBearerAuth({ verifier, requiredScopes: [MCP_SCOPES[0]],
      expectedResource: resource, resourceMetadataUrl: metadataURL });
    const handler = createMcpHandler(ctx => buildServer(service, ctx.authInfo), {
      legacy: 'stateless', responseMode: 'json', maxSubscriptions: 0, maxRequestBodySize: 32768,
    });
    this.fetch = async (request, options) => {
      const origin = request.headers.get('origin');
      if (!hosts.has(new URL(request.url).hostname) || (origin !== null && !origins.has(origin))) {
        return Response.json({ error: 'request_origin_not_allowed' }, { status: 403 });
      }
      const auth = await gate(request);
      const response = auth instanceof Response ? auth : await handler.fetch(request, { authInfo: auth,
        ...(options?.parsedBody !== undefined ? { parsedBody: options.parsedBody } : {}) });
      response.headers.set('cache-control', 'no-store');
      return response;
    };
    const router = Router();
    router.get('/selectable', asyncHandler(async (request, response) => {
      response.json(await service.selectable(request.auth.plannerId, request.query.cursor === undefined ? null : String(request.query.cursor)));
    }));
    router.get('/', asyncHandler(async (request, response) => { response.json(await service.list(request.auth.plannerId)); }));
    router.post('/', requireCsrf, recentAuthenticationRequired(app), asyncHandler(async (request, response) => {
      response.status(201).json(await service.authorize(request.auth.plannerId, connectionInput.parse(request.body)));
    }));
    // Reductions do not require another recent-authentication ceremony.
    router.delete('/:publicId', requireCsrf, asyncHandler(async (request, response) => {
      const { expectedVersion } = revokeInput.parse(request.body);
      response.json(await service.revoke(request.auth.plannerId, String(request.params.publicId), expectedVersion));
    }));
    this.connections = router;
  }

  async checkReady() {
    const result = await withAuthDatabase(this.pool, client => client.query(`select to_regclass('app.ai_connection_matters') is not null
      and has_function_privilege('continuity_deletion_worker','app.recovery_pending()','EXECUTE') as ready`));
    if (!result.rows[0]?.ready) {
      throw new Error('MCP requires the selected-connection migration');
    }
  }

  mountPublic(app: Express) {
    app.get(['/mcp/resource-metadata', '/api/mcp/resource-metadata'], preventCaching, (_request, response) => response.json({
      resource: this.config.resourceUrl, authorization_servers: [this.config.issuer],
      scopes_supported: MCP_SCOPES, bearer_methods_supported: ['header'], resource_name: 'Rillora selected matters',
    }));
    const node = toNodeHandler({ fetch: this.fetch }, { maxRequestBodySize: 32768 });
    app.all(['/mcp', '/api/mcp'], preventCaching, express.json({ limit: '32kb', strict: true }), (request, response, next) => {
      // The adapter's optional req.auth is deliberately ignored: fetch always verifies a delegated bearer token itself.
      void node(request as unknown as Parameters<typeof node>[0], response, request.body).catch(next);
    });
  }
}

export function mcpFromEnvironment(pool: DatabasePool, app: AppConfig, env = process.env): McpIntegration | undefined {
  const config = loadMcpConfig(env, app);
  return config ? new McpIntegration(pool, app, config) : undefined;
}
