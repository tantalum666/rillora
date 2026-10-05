import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { AppAppearanceControl } from "./AppearanceControl.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Envelope, LinkSimple } from "@phosphor-icons/react";
import { ConnectionVisual } from "./SharingMotion.jsx";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { invitationTokenFromUrl } from "./sharing.js";
import "./sharing.css";

export function InvitationPage({ apiClient }) {
  const { t, locale, errorMessage } = useI18n();
  const initialToken = useRef(invitationTokenFromUrl(window.location.href));
  const fromShared = useRef(new URLSearchParams(window.location.search).get("from") === "shared").current;
  const returnPath = fromShared ? "/?view=shared" : "/";
  const invitationPath = (id) => `/invite/${id}${fromShared ? "?from=shared" : ""}`;
  const [invitation, setInvitation] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [selectAccount, setSelectAccount] = useState(false);
  const [error, setError] = useState(null);
  const [link, setLink] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function load(token = initialToken.current) {
    setLoading(true); setError(null);
    const id = window.location.pathname.split("/")[2];
    if (window.location.hash) window.history.replaceState({}, "", window.location.pathname + (fromShared ? "?from=shared" : ""));
    try {
      const result = token ? await apiClient.resolveSharingInvitation(token)
        : id ? await apiClient.getSharingInvitation(id) : null;
      if (!result) { setInvitation(null); return; }
      setInvitation(result.invitation);
      window.history.replaceState({}, "", invitationPath(result.invitation.publicId));
      setSession(await apiClient.getSessionStatus()); setLink("");
    } catch (failure) { setError(failure); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!verificationRequired || !session?.authenticated) return;
    let active = true; let checking = false;
    const check = async () => {
      if (!active || checking || document.hidden) return;
      checking = true; setBusy(true);
      try {
        const result = await apiClient.checkEmailVerification();
        if (active && result.verified === true) { setVerificationRequired(false); setError(null); }
      } catch (failure) {
        if (active) {
          if (failure.status === 401) { setSession({ authenticated: false }); setVerificationRequired(false); }
          setError(failure);
        }
      }
      finally { checking = false; if (active) setBusy(false); }
    };
    window.addEventListener("focus", check); document.addEventListener("visibilitychange", check);
    return () => { active = false; window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [apiClient, verificationRequired, session?.authenticated]);
  async function signIn(intent) {
    if (!acceptedLegal || busy || !invitation) return;
    setBusy(true); setError(null);
    try {
      const response = await apiClient.startAuthentication({ intent, selectAccount,
        returnTo: invitationPath(invitation.publicId),
        legalAcceptance: { ...LEGAL_CONTRACT, acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true },
      });
      window.location.assign(response.authorizationUrl);
    } catch (failure) { setError(failure); setBusy(false); }
  }
  async function accept() {
    if (busy || !invitation) return;
    setBusy(true); setError(null);
    try {
      if (invitation.status === "accepted") {
        const shared = await apiClient.getSharedWithMe();
        if (!shared.connections.some(connection => connection.publicId === invitation.publicId)) throw Object.assign(new Error("Use the invited account to open these shared items."), { messageKey: "forms.invitation.error.account" });
      } else await apiClient.acceptSharingInvitation({ invitationPublicId: invitation.publicId, accepted: true });
      window.location.replace("/?view=shared");
    } catch (failure) {
      // An accepted write may outlive a lost response; verify the current account before retrying.
      try {
        const shared = await apiClient.getSharedWithMe();
        if (shared.connections.some(connection => connection.publicId === invitation.publicId)) {
          window.location.replace("/?view=shared"); return;
        }
      } catch { /* Keep the original failure when current access cannot be verified. */ }
      if (failure.status === 401) { setSession({ authenticated: false }); setVerificationRequired(false); }
      if (failure.code === "verified_email_required") setVerificationRequired(true);
      setError(failure); setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true); setError(null);
    try { await apiClient.logout(); setSession({ authenticated: false }); setAcceptedLegal(false); setSelectAccount(true); setVerificationRequired(false); }
    catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  const unavailable = invitation && ["expired", "revoked"].includes(invitation.status);
  return <div className="invitation-page"><header><a href="/" aria-label={t("forms.invitation.home")}><RilloraBrand decorative /></a><a className="invitation-back" href={returnPath}><ArrowLeft size={18} aria-hidden="true" />{t(fromShared ? "forms.invitation.backShared" : "forms.invitation.backHome")}</a><LanguageControl /><AppAppearanceControl /></header><main>
    {import.meta.env.DEV && import.meta.env.VITE_DEV_PLANNER_ID && <p className="development-notice">{t("forms.invitation.localQA")}</p>}
    <div className="invitation-people"><ConnectionVisual status={invitation?.status ?? "pending"} /></div>
    <h1>{loading ? t("forms.invitation.opening") : invitation ? t("forms.invitation.invited", { name: invitation.ownerName }) : t("forms.invitation.received")}</h1>
    {error && <p className="drawer-alert" role="alert">{error.messageKey ? t(error.messageKey) : errorMessage(error, "forms.invitation.error.open")}</p>}
    {!loading && invitation && <><p className="sharing-email-hint"><Envelope size={18} />{t("forms.invitation.for", { email: invitation.emailHint })}</p>
      {unavailable ? <p>{t(invitation.status === "expired" ? "forms.invitation.expired" : "forms.invitation.revoked")}</p>
        : <><p className="invitation-scope-note">{t("forms.invitation.scope")}</p>
          {session?.authenticated ? <><button className="primary-button" disabled={busy} onClick={() => void accept()}>{t(busy ? "forms.invitation.checking" : invitation.status === "accepted" ? "forms.invitation.openShared" : verificationRequired ? "forms.invitation.verified" : "forms.invitation.accept")}<ArrowRight size={20} /></button><button className="text-button" disabled={busy} onClick={() => void switchAccount()}>{t("forms.invitation.switchAccount")}</button></>
            : session ? <>
              <button className="primary-button" disabled={!acceptedLegal || busy} onClick={() => void signIn("signup")}>{t("forms.invitation.create")}<ArrowRight size={20} /></button>
              <button className="secondary-button" disabled={!acceptedLegal || busy} onClick={() => void signIn("signin")}>{t("forms.invitation.signIn")}</button>
              <div className="account-consent"><label><input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} /><span lang="en">I agree to the <a href="https://legal.rillora.xyz/terms" target="_blank" rel="noreferrer">Terms</a>, acknowledge the <a href="https://legal.rillora.xyz/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, and consent to electronic records.</span></label>{locale === "zh-CN" && <p lang="zh-CN">{t("forms.invitation.consentReference")}</p>}</div>
            </>
              : <button className="secondary-button" onClick={() => void load()}>{t("forms.invitation.retryAccount")}</button>}
          {initialToken.current && <a className="invitation-open-app" href={`rillora://invite#invitation=${initialToken.current}`}>{t("forms.invitation.openApp")}</a>}
        </>}
    </>}
    {!loading && !invitation && <form onSubmit={(event) => { event.preventDefault(); const token = invitationTokenFromUrl(link); if (token) { initialToken.current = token; void load(token); } else setError({ messageKey: "forms.invitation.error.completeLink" }); }}><p className="invitation-scope-note">{t("forms.invitation.paste")}</p><label className="field-label">{t("forms.invitation.link")}<input type="text" autoComplete="off" value={link} onChange={(event) => setLink(event.target.value)} /></label><button className="primary-button" disabled={!link.trim()}><LinkSimple size={20} />{t("forms.invitation.continue")}</button></form>}
  </main></div>;
}
