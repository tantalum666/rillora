// Public editorial records. Dates describe content publication, not build time.
export const publicArticles = Object.freeze({
  "/learn/what-is-digital-legacy": { key: "overview", published: "2026-10-18", modified: "2026-10-18",
    sections: ["meaning", "scope", "roles", "example", "start"], questions: ["will", "passwords"],
    related: ["/learn/digital-legacy-checklist", "/learn/choose-a-digital-legacy-tool"] },
  "/learn/digital-legacy-checklist": { key: "checklist", published: "2026-10-16", modified: "2026-10-16",
    sections: ["step1", "step2", "step3", "step4", "example"],
    related: ["/learn/share-digital-legacy-safely", "/learn/apple-google-legacy-settings"] },
  "/learn/share-digital-legacy-safely": { key: "sharing", published: "2026-10-18", modified: "2026-10-18",
    sections: ["purpose", "scope", "example", "review", "change"], questions: ["app", "copies"],
    related: ["/learn/digital-legacy-checklist", "/learn/password-manager-and-digital-legacy"] },
  "/learn/apple-google-legacy-settings": { key: "providers", published: "2026-10-18", modified: "2026-10-18",
    sections: ["separate", "apple", "google", "record", "review"],
    sources: [
      { key: "apple", urls: { en: "https://support.apple.com/en-us/102631", "zh-CN": "https://support.apple.com/zh-cn/102631" } },
      { key: "google", urls: { en: "https://support.google.com/accounts/answer/3036546?hl=en", "zh-CN": "https://support.google.com/accounts/answer/3036546?hl=zh-Hans" } },
    ], related: ["/learn/what-is-digital-legacy", "/learn/share-digital-legacy-safely"] },
  "/learn/password-manager-and-digital-legacy": { key: "passwords", published: "2026-10-16", modified: "2026-10-16",
    sections: ["step1", "step2", "step3"],
    related: ["/learn/choose-a-digital-legacy-tool", "/learn/share-digital-legacy-safely"] },
  "/learn/choose-a-digital-legacy-tool": { key: "choosing", published: "2026-10-18", modified: "2026-10-18",
    sections: ["job", "list", "vault", "provider", "map", "check"],
    related: ["/learn/password-manager-and-digital-legacy", "/learn/apple-google-legacy-settings"] },
});

export function articleDate(value, locale) {
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-GB", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}
