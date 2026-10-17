import { McpServer, requireScopes, type AuthInfo } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { ApiError } from '../errors.js';
import { MCP_SCOPES } from './config.js';
import type { McpActor } from './identity.js';
import type { SelectedAiService } from './service.js';

const noArgs = z.object({}).strict();
const summaryOutput = z.object({ matters: z.array(z.object({ publicId: z.uuid(), title: z.string(),
  category: z.string(), status: z.string() }).strict()).max(20) }).strict();
const gapsOutput = z.object({ matters: z.array(z.object({ publicId: z.uuid(),
  missingFields: z.array(z.enum(['provider', 'location', 'intended_outcome'])).max(3) }).strict()).max(20),
  assessment: z.literal('selected_common_fields_only'),
  notAssessed: z.array(z.enum(['category_specific_details', 'legal_authority', 'recipient_readiness'])).length(3) }).strict();

export function createSelectedMcpServer(service: SelectedAiService, authInfo?: AuthInfo) {
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
