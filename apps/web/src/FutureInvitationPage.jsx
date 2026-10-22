import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKey } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { withLocalePath, preserveTransientLocale } from "./i18n/localeStore.js";
import { AppAppearanceControl } from "./AppearanceControl.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { RegistrationConsentText } from "./LegalConsentText.jsx";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { futureNoticeTokenFromUrl } from "./futureNotices.js";
import { futureNoticeError } from "./FutureNoticePanels.jsx";
import { ReauthenticationPrompt } from "./ReauthenticationPrompt.jsx";
import "./sharing.css";
import "./future-notices.css";

export default function FutureInvitationPage({ apiClient }) {
  const { t, locale, localePreference } = useI18n();
  const initialToken = useRef(futureNoticeTokenFromUrl(window.location.href));
  const [publicNotice, setPublicNotice] = useState(null), [notice, setNotice] = useState(null);
  const [authenticated, setAuthenticated] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState(false), [selectAccount, setSelectAccount] = useState(false);
  const [error, setError] = useState(null), [link, setLink] = useState(""), [done, setDone] = useState(false);
  const generation = useRef(0);
  const path = id => `/future-invite/${id}`;
  const load = useCallback(async (token = initialToken.current) => {
    const request = ++generation.current;
    setLoading(true); setError(null); setNotice(null); setPublicNotice(null); setDone(false);
    const id = window.location.pathname.split("/")[2];
    if (window.location.hash) window.history.replaceState({}, "", preserveTransientLocale(window.location.pathname));
    try {
      const session = await apiClient.getSessionStatus();
      if (request !== generation.current) return;
      setAuthenticated(session.authenticated);
      let resolved;
      try { resolved = token ? await apiClient.resolveFutureNotice(token) : id ? await apiClient.getFutureInvitation(id) : null; }
      catch (failure) {
        if (failure.status !== 404 || !session.authenticated) throw failure;
        const current = token ? (await apiClient.reviewFutureNotice({ invitationToken: token })).notice
          : (await apiClient.getFutureNoticesReceived()).notices.find(item => item.publicId === id);
        if (request !== generation.current) return;
        if (!current || current.status !== "acknowledged") throw failure;
        setNotice(current); setDone(true); initialToken.current = null; return;
      }
      if (request !== generation.current || !resolved) return;
      setPublicNotice(resolved.notice);
      window.history.replaceState({}, "", preserveTransientLocale(path(resolved.notice.publicId)));
      if (session.authenticated) {
        const reviewed = await apiClient.reviewFutureNotice({ invitationPublicId: resolved.notice.publicId });
        if (request === generation.current) setNotice(reviewed.notice);
      }
    } catch (failure) { if (request === generation.current) { setError(failure); if (failure.status === 401) setAuthenticated(false); } }
    finally { if (request === generation.current) setLoading(false); }
  }, [apiClient]);
  useEffect(() => { void load(); return () => { generation.current += 1; }; }, [load]);
  useEffect(() => {
    const invalidate = () => {
      generation.current += 1; setNotice(null); setDone(false); setAuthenticated(false);
      setLoading(false); setBusy(false); setError({ code: "authentication_required" });
    };
    window.addEventListener("rillora:account-changed", invalidate);
    window.addEventListener("rillora:session-expired", invalidate);
    return () => {
      window.removeEventListener("rillora:account-changed", invalidate);
      window.removeEventListener("rillora:session-expired", invalidate);
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) { if (!busy) { generation.current += 1; setNotice(null); } }
      else if (!busy && !done) void load();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [load, busy, done]);
  async function signIn(intent) {
    if (!legal || busy || !publicNotice) return;
    setBusy(true); setError(null);
    try {
      const result = await apiClient.startAuthentication({ intent, selectAccount,
        returnTo: withLocalePath(path(publicNotice.publicId), locale, localePreference),
        legalAcceptance: { ...LEGAL_CONTRACT, acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true } });
      window.location.assign(result.authorizationUrl);
    } catch (failure) { setError(failure); setBusy(false); }
  }
  async function respond(action) {
    if (!notice || busy || done) return;
    const request = ++generation.current;
    setBusy(true); setError(null);
    try {
      await apiClient.respondFutureNotice({ invitationPublicId: notice.publicId, action, expectedVersion: notice.version });
      if (request !== generation.current) return;
      setDone(true); setNotice(null); setPublicNotice(null); initialToken.current = null;
    } catch (failure) {
      if (action === "acknowledge") {
        try {
          const current = await apiClient.getFutureNoticesReceived();
          if (request === generation.current && current.notices.some(item => item.publicId === notice.publicId)) { setDone(true); setNotice(null); initialToken.current = null; return; }
        } catch { /* Preserve the original error and require a fresh read. */ }
      }
      if (request === generation.current) { setError(failure); setNotice(null); }
    } finally { if (request === generation.current) setBusy(false); }
  }
  async function switchAccount() {
    setBusy(true); setNotice(null);
    try { await apiClient.logout(); setAuthenticated(false); setLegal(false); setSelectAccount(true); setError(null); }
    catch (failure) { setError(failure); } finally { setBusy(false); }
  }
  return <div className="invitation-page"><header><a href="/" aria-label={t("forms.invitation.home")}><RilloraBrand decorative/></a>
    <a className="invitation-back" href={preserveTransientLocale("/?view=shared")}><ArrowLeft size={18}/>{t("forms.invitation.backShared")}</a>
    <LanguageControl/><AppAppearanceControl/></header><main className="future-invitation">
      <LockKey size={42} aria-hidden="true"/><h1>{t("future.invitation")}</h1>
      {loading && <p role="status">{t("future.loading")}</p>}
      {error && <div role="alert" className="drawer-alert"><p>{futureNoticeError(error, t)}</p>
        <button className="text-button" disabled={busy} onClick={() => void load()}>{t("future.retry")}</button></div>}
      {done ? <><p role="status">{t("future.done")}</p><a className="primary-button" href={preserveTransientLocale("/?view=shared")}>{t("future.inbox")}</a></>
        : !loading && publicNotice ? <>
          <p>{notice ? t("future.from", { name: notice.ownerName }) : t("future.signInHint")}</p>
          <p>{t("future.receivedScope")}</p>
          {authenticated ? <>
            {notice && <div className="future-notice-actions"><button className="primary-button" disabled={busy} onClick={() => void respond("acknowledge")}>{t("future.acknowledge")}</button>
              <button className="secondary-button" disabled={busy} onClick={() => void respond("decline")}>{t("future.decline")}</button></div>}
            <button className="text-button" disabled={busy} onClick={() => void switchAccount()}>{t("forms.invitation.switchAccount")}</button>
          </> : <>
            <button className="primary-button" disabled={!legal || busy} onClick={() => void signIn("signin")}>{t("forms.invitation.signIn")}</button>
            <button className="secondary-button" disabled={!legal || busy} onClick={() => void signIn("signup")}>{t("forms.invitation.create")}</button>
            <div className="account-consent"><label><input type="checkbox" checked={legal} onChange={event => setLegal(event.target.checked)}/><RegistrationConsentText external/></label></div>
          </>}
        </> : !loading && <form onSubmit={event => { event.preventDefault(); const token = futureNoticeTokenFromUrl(link);
          if (token) { initialToken.current = token; void load(token); } else setError({ code: "invalid_future_link" }); }}>
          <label className="field-label">{t("forms.invitation.link")}<input type="text" autoComplete="off" value={link} onChange={event => setLink(event.target.value)}/></label>
          <button className="primary-button" disabled={!link.trim()}>{t("forms.invitation.continue")}</button>
        </form>}
    </main><ReauthenticationPrompt apiClient={apiClient}/></div>;
}
