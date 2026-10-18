function handler(event) {
  var request = event.request;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return {
      statusCode: 405,
      headers: {
        "cache-control": { value: "no-store" },
        allow: { value: "GET, HEAD" },
      },
    };
  }
  var localeMatch = /^\/(en|zh-CN)(\/|$)/.exec(request.uri);
  var locale = localeMatch ? localeMatch[1] : "en";
  var uri = localeMatch ? request.uri.slice(locale.length + 1) || "/" : request.uri;
  var path = uri.replace(/\/+$/, "") || "/";
  if (path === "/guides") {
    var providers = [
      "apple",
      "google",
      "microsoft",
      "dropbox",
      "yahoo",
      "meta",
      "instagram",
      "linkedin",
      "x",
      "paypal",
      "coinbase",
      "binance",
      "binance_us",
      "github",
      "password_manager",
      "adobe",
      "netflix",
      "steam",
    ];
    var service =
      request.querystring &&
      request.querystring.service &&
      request.querystring.service.value;
    var target = "https://app.rillora.xyz/account?next=guides";
    if (providers.indexOf(service) !== -1) target += "&service=" + service;
    // Display language only; all other untrusted query values remain discarded.
    var language = request.querystring && request.querystring.lang && request.querystring.lang.value;
    if (language === "en" || language === "zh-CN") target += "&lang=" + language;
    else {
      var languageHint = request.querystring && request.querystring.langHint && request.querystring.langHint.value;
      if (languageHint === "en" || languageHint === "zh-CN") target += "&langHint=" + languageHint;
    }
    if (!language && !languageHint && localeMatch) target += "&langHint=" + locale;
    return {
      statusCode: 302,
      headers: {
        location: { value: target },
        "cache-control": { value: "no-store" },
      },
    };
  }
  var pages = ["/", "/product", "/security", "/pricing", "/support", "/legal", "/legal/licenses",
    "/learn", "/learn/digital-legacy-checklist", "/learn/password-manager-and-digital-legacy",
    "/learn/what-is-digital-legacy", "/learn/share-digital-legacy-safely",
    "/learn/apple-google-legacy-settings", "/learn/choose-a-digital-legacy-tool"];
  if (pages.indexOf(path) !== -1) {
    var requestedLanguage = request.querystring && request.querystring.lang && request.querystring.lang.value;
    if (requestedLanguage === "en" || requestedLanguage === "zh-CN") {
      var destination = "/" + requestedLanguage + (path === "/" ? "/" : path);
      var appearance = request.querystring && request.querystring.appearance && request.querystring.appearance.value;
      if (["system", "light", "dark"].indexOf(appearance) !== -1) destination += "?appearance=" + appearance;
      return { statusCode: 302, headers: { location: { value: destination }, "cache-control": { value: "no-store" } } };
    }
    request.uri = "/pages/" + locale + (path === "/" ? "/index" : path) + ".html";
    return request;
  }
  if (request.uri === '/favicon.ico') return { statusCode: 302, headers: {
    location: { value: '/favicon.png' }, 'cache-control': { value: 'public, max-age=3600' }
  } };
  if (["/robots.txt", "/sitemap.xml", "/sitemap-index.xml", "/sitemap-en.xml", "/sitemap-zh-CN.xml", "/favicon.png"].indexOf(request.uri) !== -1) return request;
  if (
    /^\/assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(
      request.uri,
    )
  )
    return request;
  return {
    statusCode: 404,
    headers: { "cache-control": { value: "no-store" } },
  };
}
