import type { ClientMetadata } from 'oidc-provider';
import registry from './customer-clients.json' with {type:'json'};

/** Public identifiers are not credentials. Each client retains its own consent and tokens. */
export const customerClients = registry;

export function customerClientMetadata(): ClientMetadata[] {
  return customerClients.map(client => ({client_id:client.clientId,client_name:client.name,
    application_type:client.native?'native':'web',redirect_uris:[...client.redirectUris],
    token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],
    id_token_signed_response_alg:'RS256',require_auth_time:client.identityScopes}));
}
