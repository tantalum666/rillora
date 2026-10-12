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
  if (request.uri === "/guides" || request.uri === "/guides/") {
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
    return {
      statusCode: 302,
      headers: {
        location: { value: target },
        "cache-control": { value: "no-store" },
      },
    };
  }
  if (
    [
      "/",
      "/product",
      "/product/",
      "/security",
      "/security/",
      "/pricing",
      "/pricing/",
      "/support",
      "/support/",
      "/legal",
      "/legal/",
      "/legal/licenses",
      "/legal/licenses/",
    ].indexOf(request.uri) !== -1
  ) {
    request.uri = "/index.html";
    return request;
  }
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
