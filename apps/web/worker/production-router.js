function handler(event) {
  var request = event.request;
  // Viewer values cannot supply trusted context. CloudFront adds its own
  // network metadata and the private origin proof after this viewer function.
  var headers = request.headers || {};
  delete headers['x-rillora-session-edge-proof'];
  delete headers['cloudfront-viewer-country'];
  delete headers['cloudfront-viewer-asn'];
  delete headers['cloudfront-viewer-address'];
  if (request.uri === '/.well-known/apple-app-site-association' && (request.method === 'GET' || request.method === 'HEAD')) {
    return { statusCode: 200, headers: { 'content-type': { value: 'application/json' }, 'cache-control': { value: 'public, max-age=3600' } },
      // Preserve the current App's universal-link contract. Future notices use
      // their Web route until a supporting native version has been distributed.
      body: request.method === 'HEAD' ? '' : '{"applinks":{"apps":[],"details":[{"appID":"8L99CFNK24.com.rillora.ios","paths":["/invite","/invite/*"]}]}}' };
  }
  var discovery = {
    '/.well-known/oauth-authorization-server/api/ai/oauth': '/ai/oauth/.well-known/openid-configuration',
    '/.well-known/openid-configuration/api/ai/oauth': '/ai/oauth/.well-known/openid-configuration',
    '/.well-known/oauth-protected-resource/api/mcp': '/mcp/resource-metadata'
  };
  if (Object.prototype.hasOwnProperty.call(discovery, request.uri)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return { statusCode: 405, headers: { 'cache-control': { value: 'no-store' }, allow: { value: 'GET, HEAD' } } };
    request.uri = discovery[request.uri]; return request;
  }
  if (request.uri.indexOf('/api/') === 0) {
    // The API supports unprefixed routes; keep API errors out of the SPA cache.
    request.uri = request.uri.slice(4);
    return request;
  }
  if (request.uri === '/api') return { statusCode: 404, headers: { 'cache-control': { value: 'no-store' } } };
  if (request.method !== 'GET' && request.method !== 'HEAD') return { statusCode: 405, headers: { 'cache-control': { value: 'no-store' }, allow: { value: 'GET, HEAD' } } };
  if (request.uri === '/integrations/rillora-ai-v1.zip') return request;
  // Immutable public speech-model/runtime files. User content uses the private
  // API and a different S3 bucket; it is never served from this static prefix.
  if (/^\/speech\/whisper-tiny-[a-f0-9]{12}\/(?:model\/|model\/onnx\/|runtime\/)?[A-Za-z0-9_-]+\.(json|txt|onnx|mjs|wasm)$/.test(request.uri)) return request;
  var path = request.uri.length > 1 ? request.uri.replace(/\/+$/, '') : '/';
  var pages = ['/', '/account', '/account/billing', '/account/billing/complete', '/guides', '/open-copy', '/privacy', '/terms', '/subscription-terms', '/refund-policy', '/acceptable-use', '/cookies', '/legal', '/accept', '/account-deletion'];
  if (pages.indexOf(path) !== -1 || path === '/invite' || path === '/future-invite' || /^\/(?:invite|future-invite)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(path)) { request.uri = '/index.html'; return request; }
  if (/^\/assets\/[A-Za-z0-9_.-]+\.(js|mjs|wasm|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(request.uri)) return request;
  return { statusCode: 404, headers: { 'cache-control': { value: 'no-store' } } };
}
