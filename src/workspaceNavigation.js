import { useEffect, useRef } from "react";

const pages = new Set(["overview", "plan", "matters", "contacts", "shared", "maintenance", "guides", "access", "activity", "settings", "more"]);
const categories = new Set(["account", "document", "device", "financial_asset", "debt", "subscription", "crypto_asset"]);
const tasks = new Set(["matter", "matter-create", "contact", "contact-sharing", "start-here", "provider-guide", "settings", "safety", "first-use-guide", "role-policy"]);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// URLs and browser history contain only navigation, never field drafts or invitation tokens.
export function readWorkspaceRoute(value) {
  const url = new URL(value, "https://rillora.invalid");
  const p = url.searchParams;
  const requested = p.get("view") ?? (p.get("next") === "reviews" ? "maintenance" : p.get("next") === "shared" ? "shared" : url.pathname === "/account" ? "settings" : "overview");
  const task = tasks.has(p.get("task")) ? p.get("task") : null;
  return { view: pages.has(requested) ? requested : "overview", q: (p.get("q") ?? "").slice(0, 200), filter: ["review", "added"].includes(p.get("filter")) ? p.get("filter") : "all",
    sharingMatterId: uuid.test(p.get("sharingMatter") ?? "") ? p.get("sharingMatter") : null,
    task, category: task === "matter-create" && categories.has(p.get("category")) ? p.get("category") : null, id: uuid.test(p.get("matter") ?? "") ? p.get("matter") : null,
    contactId: uuid.test(p.get("person") ?? "") ? p.get("person") : null,
    providerKey: /^[a-z0-9-]{1,40}$/.test(p.get("provider") ?? "") ? p.get("provider") : null };
}

export function workspaceURL(route) {
  const p = new URLSearchParams();
  if (route.view !== "overview") p.set("view", route.view);
  if (route.q) p.set("q", route.q);
  if (route.filter !== "all") p.set("filter", route.filter);
  if (route.sharingMatterId && route.view === "contacts") p.set("sharingMatter", route.sharingMatterId);
  if (route.task) p.set("task", route.task);
  if (route.task === "matter-create" && route.category) p.set("category", route.category);
  if (route.id) p.set("matter", route.id);
  if (route.contactId) p.set("person", route.contactId);
  if (route.providerKey) p.set("provider", route.providerKey);
  return `/${p.size ? `?${p}` : ""}`;
}

export function drawerRoute(drawer) {
  return { task: tasks.has(drawer?.type) ? drawer.type : null, category: drawer?.type === "matter-create" ? drawer.category ?? null : null, id: drawer?.id ?? drawer?.matterId ?? null,
    contactId: drawer?.contactId ?? null, providerKey: drawer?.providerKey ?? null };
}

export function useWorkspaceHistory({ state, enabled, restore, canLeave }) {
  const callbacks = useRef({ restore, canLeave }); callbacks.current = { restore, canLeave };
  const current = useRef(null);
  const skipping = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    if (!enabled) { current.current = null; return; }
    const route = readWorkspaceRoute(window.location.href);
    const entry = window.history.state?.rillora ?? { index: 0, scroll: 0, panelScroll: 0 };
    current.current = { ...entry, route };
    window.history.replaceState({ rillora: entry }, "", workspaceURL(route));
    callbacks.current.restore(route);
    const oldRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onScroll = () => {
      if (!current.current || pending.current) return;
      current.current.scroll = window.scrollY;
      window.history.replaceState({ rillora: { index: current.current.index, scroll: window.scrollY, panelScroll: current.current.panelScroll ?? 0 } }, "");
    };
    const onPanelScroll = event => {
      if (!current.current || pending.current || !event.target.matches?.("dialog.drawer")) return;
      current.current.panelScroll = event.target.scrollTop;
      window.history.replaceState({ rillora: { index: current.current.index, scroll: current.current.scroll, panelScroll: current.current.panelScroll } }, "");
    };
    const onPop = async (event) => {
      if (skipping.current) { skipping.current = false; return; }
      const previous = current.current;
      const next = event.state?.rillora;
      if (!next || !previous || pending.current) return;
      pending.current = true;
      const route = readWorkspaceRoute(window.location.href);
      const allowed = await callbacks.current.canLeave(route);
      pending.current = false;
      if (!allowed) {
        skipping.current = true;
        window.history.go(previous.index - next.index);
        return;
      }
      current.current = { ...next, route };
      callbacks.current.restore(route);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo(0, next.scroll ?? 0);
        const panel = document.querySelector("dialog.drawer");
        if (panel) panel.scrollTop = next.panelScroll ?? 0;
      }));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPop);
    document.addEventListener("scroll", onPanelScroll, true);
    return () => { window.history.scrollRestoration = oldRestoration; window.removeEventListener("scroll", onScroll); window.removeEventListener("popstate", onPop); document.removeEventListener("scroll", onPanelScroll, true); };
  }, [enabled]);
  const url = workspaceURL(state);
  useEffect(() => {
    if (!enabled || !current.current || pending.current || skipping.current) return;
    if (workspaceURL(current.current.route) === url) return;
    // Initial hydration is complete only once the URL's requested task has been restored.
    if (!current.current.hydrated) { current.current.hydrated = true; return; }
    const before = current.current.route;
    const onlyFilter = before.view === state.view && JSON.stringify(drawerRoute({ type: before.task, ...before })) === JSON.stringify(drawerRoute({ type: state.task, ...state }));
    const finishedForm = before.view === state.view && before.task && !state.task;
    const savedContact = before.task === "contact" && !before.contactId && state.task === "contact-sharing";
    const replace = onlyFilter || finishedForm || savedContact;
    const index = current.current.index + (replace ? 0 : 1);
    const scroll = onlyFilter ? current.current.scroll : 0;
    window.history[replace ? "replaceState" : "pushState"]({ rillora: { index, scroll, panelScroll: 0 } }, "", url);
    current.current = { index, scroll, panelScroll: 0, route: state, hydrated: true };
    if (!onlyFilter) window.scrollTo(0, 0);
  }, [url, enabled]);
  // Mark the initial matching render without changing browser history.
  useEffect(() => { if (current.current && workspaceURL(current.current.route) === url) current.current.hydrated = true; });
}
