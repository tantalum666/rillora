// Also emitted as a small hashed, same-origin script before the public styles.
// Keep this standalone so the pre-paint and React paths share one implementation.
(() => {
  if (typeof window === "undefined" || window.rilloraWebsiteAppearance) return;
  const key = "rillora.website.appearance.v1";
  const allowed = new Set(["light", "dark"]);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set();
  let preference = "system";
  let persistenceAvailable = true;
  try {
    const saved = window.localStorage.getItem(key);
    if (allowed.has(saved)) preference = saved;
  } catch {
    persistenceAvailable = false;
  }
  // A display preference can travel between our public site and workspace.
  // Consume only this narrow enum; preserve invitation fragments/auth query data.
  try {
    const url = new URL(window.location.href);
    const hint = url.searchParams.get("appearance");
    if (hint === "system" || allowed.has(hint)) {
      preference = hint;
      try {
        if (hint === "system") window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, hint);
      } catch { persistenceAvailable = false; }
      url.searchParams.delete("appearance");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  } catch { /* No usable URL/history (embedded or privacy-restricted contexts). */ }
  let snapshot;
  function apply() {
    const resolved =
      preference === "system" ? (media.matches ? "dark" : "light") : preference;
    document.documentElement.dataset.appearance = resolved;
    document.documentElement.dataset.appearancePreference = preference;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta, index) => {
        meta.setAttribute(
          "content",
          resolved === "dark" ? "#171f1b" : "#f5f1e8",
        );
        if (index === 0) meta.removeAttribute("media");
        else meta.setAttribute("media", "not all");
      });
    if (
      snapshot?.preference === preference &&
      snapshot.resolved === resolved &&
      snapshot.persistenceAvailable === persistenceAvailable
    )
      return;
    snapshot = Object.freeze({ preference, resolved, persistenceAvailable });
    listeners.forEach((listener) => listener());
  }
  window.rilloraWebsiteAppearance = Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setPreference: (value) => {
      if (value !== "system" && !allowed.has(value)) return;
      preference = value;
      try {
        if (value === "system") window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
        persistenceAvailable = true;
      } catch {
        persistenceAvailable = false;
      }
      apply();
    },
  });
  media.addEventListener("change", () => {
    if (preference === "system") apply();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== key) return;
    preference = allowed.has(event.newValue) ? event.newValue : "system";
    apply();
  });
  apply();
})();
