import { lazy, Suspense, useEffect, useState } from "react";
import { UserCircle } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { LanguageControl } from "./i18n/LanguageControl.jsx";
import "./account-identity.css";
const AiConnectionsPanel = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_RILLORA_AI_CONNECTIONS === 'true'
  ? lazy(() => import('./AiConnectionsPanel.jsx')) : null;

function sameAccount(actual, expected) {
  return typeof actual === "string" && typeof expected === "string"
    && actual.toLowerCase() === expected.toLowerCase();
}

function displayedAccount(identity, plannerPublicId) {
  const account = identity.value?.account;
  return !identity.loading && !identity.failed && sameAccount(account?.publicId, plannerPublicId) ? account : null;
}

function displayedEmail(identity, account) {
  return identity.value?.emailStatus === "available" && typeof account?.verifiedEmail === "string"
    ? account.verifiedEmail.trim() : null;
}

export function useAccountIdentity(apiClient, plannerPublicId) {
  const [result, setResult] = useState(null), [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null);
    if (!plannerPublicId) return () => { active = false; };
    apiClient.getAccountIdentity().then(value => {
      if (!active) return;
      setResult(sameAccount(value?.account?.publicId, plannerPublicId)
        ? { owner: plannerPublicId, client: apiClient, revision, value }
        : { owner: plannerPublicId, client: apiClient, revision, error: true });
    }).catch(() => {
      if (active) setResult({ owner: plannerPublicId, client: apiClient, revision, error: true });
    });
    return () => { active = false; };
  }, [apiClient, plannerPublicId, revision]);
  // Even the render before effect cleanup cannot show the previous account.
  const current = result?.owner === plannerPublicId && result?.client === apiClient && result?.revision === revision ? result : null;
  return { value: current?.value ?? null, failed: current?.error === true, loading: Boolean(plannerPublicId && !current), retry: () => setRevision(value => value + 1) };
}

export function AccountSummary({ identity, plannerPublicId, onOpen }) {
  const { t } = useI18n();
  const account = displayedAccount(identity, plannerPublicId);
  const email = displayedEmail(identity, account);
  return <button type="button" className="account-summary" onClick={onOpen} aria-label={t("workspace.identity.open")}>
    <UserCircle size={26} aria-hidden="true"/>
    <span><small>{t("workspace.identity.signedInAs")}</small><strong>{email || account?.displayName || t("workspace.identity.shortId", { id: plannerPublicId.slice(0, 8) })}</strong></span>
  </button>;
}

export function AccountIdentityPanel({ identity, plannerPublicId }) {
  const { t } = useI18n();
  const account = displayedAccount(identity, plannerPublicId);
  const email = displayedEmail(identity, account);
  return <><section className="account-identity-panel" aria-labelledby="current-account-title" aria-busy={identity.loading}>
    <h3 id="current-account-title">{t("workspace.identity.current")}</h3>
    <dl>
      {account?.displayName && <><dt>{t("workspace.identity.name")}</dt><dd>{account.displayName}</dd></>}
      <dt>{t("workspace.identity.email")}</dt><dd role={identity.loading ? "status" : undefined}>{identity.loading ? t("workspace.identity.loading") : email || t(account && identity.value?.emailStatus === "not_provided" ? "workspace.identity.noEmail" : "workspace.identity.unavailable")}</dd>
      <dt>{t("workspace.identity.id")}</dt><dd className="account-id">{plannerPublicId}</dd>
    </dl>
    {!identity.loading && (identity.failed || identity.value?.emailStatus === "unavailable") && <button type="button" className="text-button" onClick={identity.retry}>{t("workspace.identity.retry")}</button>}
    <div className="account-language"><span>{t("workspace.identity.language")}</span><LanguageControl /></div>
  </section>{AiConnectionsPanel && account && <Suspense fallback={null}><AiConnectionsPanel key={plannerPublicId} plannerPublicId={plannerPublicId} /></Suspense>}</>;
}
