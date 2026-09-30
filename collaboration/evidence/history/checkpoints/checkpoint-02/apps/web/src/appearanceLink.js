const appOrigins = new Set(["https://app.staging.rillora.xyz", "https://app.rillora.xyz"]);

export function withAppearance(href, preference) {
  if (!["system", "light", "dark"].includes(preference)) return href;
  try {
    const url = new URL(href);
    if (!appOrigins.has(url.origin)) return href;
    url.searchParams.set("appearance", preference);
    return url.href;
  } catch { return href; }
}
