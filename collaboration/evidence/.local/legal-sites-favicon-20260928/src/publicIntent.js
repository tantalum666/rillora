const categories = new Set(["financial_asset", "debt", "account", "device", "document", "subscription", "crypto_asset"]);

export function accountPathForMatter(category = "account") {
  const safeCategory = categories.has(category) ? category : "account";
  return `/account?next=add-matter&category=${safeCategory}`;
}

export function authenticationReturnPath(search, pathname = "") {
  const query = new URLSearchParams(search);
  if (["/account/billing", "/account/billing/complete"].includes(pathname) || query.get("next") === "billing") return "/?view=access";
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
