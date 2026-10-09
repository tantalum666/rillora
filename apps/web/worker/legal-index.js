const legalShell = /* __RILLORA_LEGAL_SHELL__ */ "";

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
      const language = url.searchParams.get("lang");
      if (language === "en" || language === "zh-CN") location.searchParams.set("lang", language);
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
