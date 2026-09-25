function handler(event) {
  var request = event.request;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return { statusCode: 405, headers: { 'cache-control': { value: 'no-store' }, allow: { value: 'GET, HEAD' } } };
  }
  if (['/', '/guides', '/guides/', '/support', '/support/'].indexOf(request.uri) !== -1) {
    request.uri = '/index.html';
    return request;
  }
  if (/^\/assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(request.uri)) return request;
  return { statusCode: 404, headers: { 'cache-control': { value: 'no-store' } } };
}
