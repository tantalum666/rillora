const categories = new Set(["financial_asset", "debt", "account", "device", "document", "subscription", "crypto_asset"]);

export function accountPathForMatter(category = "account") {
  const safeCategory = categories.has(category) ? category : "account";
  return `/account?next=add-matter&category=${safeCategory}`;
}

export function authenticationReturnPath(search) {
  const query = new URLSearchParams(search);
  if (query.get("next") === "shared") return "/?view=shared";
  if (query.get("next") === "reviews") return "/?view=maintenance&inbox=received";
  const category = query.get("category");
  return query.get("next") === "add-matter" && categories.has(category)
    ? `/?compose=${category}`
    : "/";
}

export function requestedMatterCategory(search) {
  const category = new URLSearchParams(search).get("compose");
  return categories.has(category) ? category : null;
}
