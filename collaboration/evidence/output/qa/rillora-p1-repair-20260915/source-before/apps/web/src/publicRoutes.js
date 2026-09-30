export const publicRoutes = Object.freeze({
  home: "/",
  account: "/account",
  privacy: "/privacy",
  terms: "/terms",
  subscriptions: "/subscription-terms",
  refunds: "/refund-policy",
  acceptableUse: "/acceptable-use",
  cookies: "/cookies",
  legalNotice: "/legal",
});

export function resolvePublicView(pathname) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (normalizedPath === publicRoutes.account) return "account";
  if (normalizedPath === publicRoutes.privacy) return "privacy";
  if (normalizedPath === publicRoutes.terms) return "terms";
  if (normalizedPath === publicRoutes.subscriptions) return "subscriptions";
  if (normalizedPath === publicRoutes.refunds) return "refunds";
  if (normalizedPath === publicRoutes.acceptableUse) return "acceptableUse";
  if (normalizedPath === publicRoutes.cookies) return "cookies";
  if (normalizedPath === publicRoutes.legalNotice) return "legalNotice";
  return "home";
}
