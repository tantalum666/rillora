// Neutral identifiers, not reconstructed trademarks. The shared guide catalog
// keeps its six approved original graphic marks; every failure stays identifiable.
export const providerFallbacks = Object.freeze({
  apple: { symbol: "device", initials: "AP" },
  google: { symbol: "clock", initials: "G" },
  microsoft: { symbol: "folder", initials: "MS" },
  dropbox: { symbol: "cloud", initials: "DB" },
  yahoo: { symbol: "mail", initials: "Y" },
  meta: { symbol: "people", initials: "FB" },
  instagram: { symbol: "photo", initials: "IG" },
  linkedin: { symbol: "profile", initials: "IN" },
  x: { symbol: "chat", initials: "X" },
  paypal: { symbol: "card", initials: "PP" },
  coinbase: { symbol: "coin", initials: "CB" },
  binance: { symbol: "bank", initials: "BN" },
  binance_us: { symbol: "coin", initials: "BU" },
  github: { symbol: "code", initials: "GH" },
  password_manager: { symbol: "key", initials: "PW" },
  adobe: { symbol: "paint", initials: "AD" },
  netflix: { symbol: "play", initials: "NF" },
  steam: { symbol: "game", initials: "ST" },
});
export function providerFallback(providerKey) {
  return Object.hasOwn(providerFallbacks, providerKey) ? providerFallbacks[providerKey] : { symbol: "book", initials: "?" };
}
