import { AppAppearanceControl } from "./AppearanceControl.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Envelope, LinkSimple } from "@phosphor-icons/react";
import { ConnectionVisual } from "./SharingMotion.jsx";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { invitationTokenFromUrl } from "./sharing.js";
import "./sharing.css";

export function InvitationPage({ apiClient }) {
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
        if (!shared.connections.some(connection => connection.publicId === invitation.publicId)) throw new Error("Use the invited account to open these shared items.");
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
  return <div className="invitation-page"><header><a href="/" aria-label="Rillora home"><RilloraBrand decorative /></a><a className="invitation-back" href={returnPath}><ArrowLeft size={18} aria-hidden="true" />{fromShared ? "Back to shared items" : "Back to Rillora"}</a><AppAppearanceControl /></header><main>
    {import.meta.env.DEV && import.meta.env.VITE_DEV_PLANNER_ID && <p className="development-notice">Local QA · test data</p>}
    <div className="invitation-people"><ConnectionVisual status={invitation?.status ?? "pending"} /></div>
    <h1>{loading ? "Opening invitation…" : invitation ? `${invitation.ownerName} invited you` : "Accept a received invitation"}</h1>
    {error && <p className="drawer-alert" role="alert">{error.message || "The invitation could not be opened."}</p>}
    {!loading && invitation && <><p className="sharing-email-hint"><Envelope size={18} />For {invitation.emailHint}</p>
      {unavailable ? <p>This invitation {invitation.status === "expired" ? "expired" : "was revoked"}. Ask for a new link.</p>
        : <><p className="invitation-scope-note">Only the items they choose. Read only.</p>
          {session?.authenticated ? <><button className="primary-button" disabled={busy} onClick={() => void accept()}>{busy ? "Checking…" : invitation.status === "accepted" ? "Open shared items" : verificationRequired ? "I've verified my email" : "Accept invitation"}<ArrowRight size={20} /></button><button className="text-button" disabled={busy} onClick={() => void switchAccount()}>Use another account</button></>
            : session ? <>
              <button className="primary-button" disabled={!acceptedLegal || busy} onClick={() => void signIn("signup")}>Create account to accept<ArrowRight size={20} /></button>
              <button className="secondary-button" disabled={!acceptedLegal || busy} onClick={() => void signIn("signin")}>Already have an account? Sign in</button>
              <div className="account-consent"><label><input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} /><span>I agree to the <a href="https://legal.rillora.xyz/terms" target="_blank" rel="noreferrer">Terms</a>, acknowledge the <a href="https://legal.rillora.xyz/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, and consent to electronic records.</span></label></div>
            </>
              : <button className="secondary-button" onClick={() => void load()}>Retry account connection</button>}
          {initialToken.current && <a className="invitation-open-app" href={`rillora://invite#invitation=${initialToken.current}`}>Open in Rillora</a>}
        </>}
    </>}
    {!loading && !invitation && <form onSubmit={(event) => { event.preventDefault(); const token = invitationTokenFromUrl(link); if (token) { initialToken.current = token; void load(token); } else setError(new Error("Paste the complete invitation link.")); }}><p className="invitation-scope-note">Paste a link someone sent you.</p><label className="field-label">Invitation link · Required<input type="text" autoComplete="off" value={link} onChange={(event) => setLink(event.target.value)} /></label><button className="primary-button" disabled={!link.trim()}><LinkSimple size={20} />Continue with this link</button></form>}
  </main></div>;
}
