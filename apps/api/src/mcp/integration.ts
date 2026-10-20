import express, { Router, type Express } from 'express';
import { createMcpHandler, requireBearerAuth, type McpHandlerRequestOptions } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { AppConfig } from '../config.js';
import { withAuthDatabase, type DatabasePool } from '../db.js';
import { requireCsrf } from '../auth.js';
import { recentAuthenticationRequired } from '../recent-authentication.js';
import { preventCaching } from '../security.js';
import { asyncHandler } from '../errors.js';
import { MCP_SCOPES, loadMcpConfig, type McpConfig } from './config.js';
import { createMcpTokenVerifier } from './identity.js';
import { SelectedAiService, connectionInput, revokeInput } from './service.js';

export { createSelectedMcpServer } from './server.js';
import { createSelectedMcpServer } from './server.js';
import { loadCustomerOAuth, type CustomerOAuth } from './customer-oauth.js';

export class McpIntegration {
  readonly connections: Router;
  readonly fetch: (request: Request, options?: McpHandlerRequestOptions) => Promise<Response>;
  constructor(private pool: DatabasePool, app: AppConfig, readonly config: McpConfig,
    verifier = createMcpTokenVerifier(config), private oauth?: CustomerOAuth) {
    if (app.productionRuntimeClosed || app.productionReviewAccess) throw new Error('MCP cannot mount in a closed or review-only runtime');
    const service = new SelectedAiService(pool, app, config);
    const resource = new URL(config.resourceUrl);
    const hosts = new Set([resource.hostname, ...(app.apiTls ? [app.apiTls.serverName] : []),
      ...(app.nodeEnv !== 'production' ? ['127.0.0.1', 'localhost', '[::1]'] : [])]);
    const origins = new Set([resource.origin, ...app.corsOrigins]);
    const metadataURL = config.resourceUrl + '/resource-metadata';
    const gate = requireBearerAuth({ verifier, requiredScopes: [MCP_SCOPES[0]],
      expectedResource: resource, resourceMetadataUrl: metadataURL });
    const handler = createMcpHandler(ctx => createSelectedMcpServer(service, ctx.authInfo), {
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
    if (oauth) router.use('/oauth', oauth.interactions);
    router.get('/selectable', asyncHandler(async (request, response) => {
      response.json(await service.selectable(request.auth.plannerId, request.query.cursor === undefined ? null : String(request.query.cursor)));
    }));
    router.get('/', asyncHandler(async (request, response) => { response.json({...await service.list(request.auth.plannerId),customerOAuth:Boolean(oauth)}); }));
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
    const result = await withAuthDatabase(this.pool, client => client.query(`select to_regclass('app.ai_connection_matters') is not null and to_regclass('app.ai_identity_disclosures') is not null
      and has_function_privilege('continuity_deletion_worker','app.recovery_pending()','EXECUTE') as ready`));
    if (!result.rows[0]?.ready) {
      throw new Error('MCP requires the selected-connection migration');
    }
  }

  mountPublic(app: Express) {
    this.oauth?.mountPublic(app);
    app.get(['/mcp/resource-metadata', '/api/mcp/resource-metadata'], preventCaching, (_request, response) => response.json({
      resource: this.config.resourceUrl, authorization_servers: [this.oauth?.issuer ?? this.config.issuer],
      scopes_supported: MCP_SCOPES, bearer_methods_supported: ['header'], resource_name: 'Rillora selected matters',
    }));
    const node = toNodeHandler({ fetch: this.fetch }, { maxRequestBodySize: 32768 });
    app.all(['/mcp', '/api/mcp'], preventCaching, express.json({ limit: '32kb', strict: true }), (request, response, next) => {
      // The adapter's optional req.auth is deliberately ignored: fetch always verifies a delegated bearer token itself.
      void node(request as unknown as Parameters<typeof node>[0], response, request.body).catch(next);
    });
  }
}

export async function mcpFromEnvironment(pool: DatabasePool, app: AppConfig, env = process.env): Promise<McpIntegration | undefined> {
  const config = loadMcpConfig(env, app);
  if (!config) return undefined;
  const oauth = env.MCP_OAUTH_SECRET_ARN ? await loadCustomerOAuth(pool, app, config, env) : undefined;
  return new McpIntegration(pool, app, config, oauth?.verifier, oauth);
}
