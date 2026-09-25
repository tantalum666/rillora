function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('/api/') === 0) {
    // The API supports unprefixed routes; keep API errors out of the SPA cache.
    request.uri = request.uri.slice(4);
    return request;
  }
  if (request.uri === '/api') return { statusCode: 404, headers: { 'cache-control': { value: 'no-store' } } };
  if (request.method !== 'GET' && request.method !== 'HEAD') return { statusCode: 405, headers: { 'cache-control': { value: 'no-store' }, allow: { value: 'GET, HEAD' } } };
  var path = request.uri.length > 1 ? request.uri.replace(/\/+$/, '') : '/';
  var pages = ['/', '/account', '/account/billing', '/account/billing/complete', '/guides', '/open-copy', '/privacy', '/terms', '/subscription-terms', '/refund-policy', '/acceptable-use', '/cookies', '/legal', '/accept', '/account-deletion'];
  if (pages.indexOf(path) !== -1) { request.uri = '/index.html'; return request; }
  if (/^\/assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(request.uri)) return request;
  return { statusCode: 404, headers: { 'cache-control': { value: 'no-store' } } };
}
