const legalShell = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <meta name=\"theme-color\" content=\"#f5f1e9\" />\n    <meta name=\"description\" content=\"Official Rillora terms, privacy, subscription, refund, acceptable-use, cookie and legal notices.\" />\n    <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; base-uri 'self'; connect-src 'none'; font-src 'self'; form-action 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; upgrade-insecure-requests\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/assets/favicon-n-8qLNzh.svg\" />\n    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/assets/favicon-32-BmTNsIid.png\" />\n    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/assets/apple-touch-icon-BnycESAq.png\" />\n    <title>Rillora Legal</title>\n    <script type=\"module\" crossorigin src=\"/assets/legal-BCnmbWn2.js\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/legal-Clvlb2Sa.css\">\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n";

const legalRoutes = new Set([
  "/privacy",
  "/terms",
  "/subscription-terms",
  "/refund-policy",
  "/acceptable-use",
  "/cookies",
  "/legal",
]);

const securityHeaders = Object.freeze({
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; connect-src 'none'; font-src 'self'; form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; upgrade-insecure-requests",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
});

function secured(response, pathname) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  headers.set(
    "Cache-Control",
    pathname === "/missing"
      ? "no-store"
      : pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300, must-revalidate",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function notFound() {
  return secured(new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  }), "/missing");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!["GET", "HEAD"].includes(request.method)) return notFound();
    if (url.pathname === "/") {
      const location = new URL("/terms", url);
      return secured(Response.redirect(location, 308), "/");
    }

    if (url.pathname.startsWith("/assets/")) {
      return secured(await env.ASSETS.fetch(request), url.pathname);
    }

    if (!legalRoutes.has(url.pathname)) return notFound();

    return secured(new Response(request.method === "HEAD" ? null : legalShell, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }), url.pathname);
  },
};
