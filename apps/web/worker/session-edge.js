function handler(event) {
  var request = event.request;
  // Only CloudFront-generated metadata and its private origin header may reach
  // the API as trusted context. Never log these headers or change the API URI.
  var headers = request.headers || {};
  delete headers['x-rillora-session-edge-proof'];
  delete headers['cloudfront-viewer-country'];
  delete headers['cloudfront-viewer-asn'];
  delete headers['cloudfront-viewer-address'];
  return request;
}
