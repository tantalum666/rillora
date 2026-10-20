import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowClockwise, Copy, Envelope, LockKey, ShareNetwork } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { InvitationQr } from "./InvitationQr.jsx";
import "./future-notices.css";

export function futureNoticeError(error, t) {
  const key = {
    verified_email_required: "future.verifyEmail", invitation_account_mismatch: "future.wrongAccount",
    future_notice_changed: "future.changed", future_notice_exists: "future.alreadyExists",
    invitation_expired: "future.noInvitation", invitation_unavailable: "future.noInvitation",
    future_notice_unavailable: "future.noInvitation", invalid_future_notice: "future.invalidResponse",
    not_found: "future.unavailable", invalid_future_link: "future.invalidLink",
    authentication_required: "future.signInAgain", reauthentication_required: "future.signInAgain",
    account_changed: "future.signInAgain",
  }[error?.code];
  return key ? t(key) : t("future.saveError");
}

export function FutureNoticePanel({ contact, apiClient, onDirtyChange, onBusyChange }) {
  const { t, formatDate } = useI18n();
  const [record, setRecord] = useState(null), [email, setEmail] = useState("");
  const [link, setLink] = useState(""), [error, setError] = useState(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false);
  const generation = useRef(0), latestVersion = useRef(null), inFlight = useRef(false);
  const notice = record?.client === apiClient && record?.person === contact.publicId ? record.notice : null;
  const active = notice && ["pending", "expired", "acknowledged"].includes(notice.status);
  const dirty = !active && Boolean(email.trim());
  const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  useLayoutEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useLayoutEffect(() => onBusyChange?.(loading || busy), [loading, busy, onBusyChange]);
  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const request = ++generation.current;
    setLoading(true); setError(null);
    try {
      const { notice: next } = await apiClient.getFutureNotice(contact.publicId);
      if (request !== generation.current) return;
      if (next?.status !== "pending" || latestVersion.current !== next?.version) setLink("");
      latestVersion.current = next?.version;
      setRecord({ client: apiClient, person: contact.publicId, notice: next });
    } catch (failure) {
      if (request === generation.current) { setRecord(null); setLink(""); setError(failure); }
    } finally { if (request === generation.current) { inFlight.current = false; setLoading(false); } }
  }, [apiClient, contact.publicId]);
  useEffect(() => { inFlight.current = false; setBusy(false); setRecord(null); setLink(""); setEmail(""); void load();
    return () => { generation.current += 1; inFlight.current = false; }; }, [load]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden && !busy && !dirty) void load(); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 15_000);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load, busy, dirty]);
  async function change(action) {
    if (inFlight.current || busy || loading) return;
    inFlight.current = true;
    const request = ++generation.current; setBusy(true); setError(null);
    try {
      const result = action === "create"
        ? await apiClient.createFutureNotice({ personPublicId: contact.publicId, email: email.trim(), acknowledgedNoAccess: true })
        : action === "link" ? await apiClient.regenerateFutureNotice(notice.publicId, notice.version)
          : await apiClient.revokeFutureNotice(notice.publicId, notice.version);
      if (request !== generation.current) return;
      latestVersion.current = result.notice.version;
      setRecord({ client: apiClient, person: contact.publicId, notice: result.notice });
      setLink(result.invitationUrl ?? ""); setCopied(false); setEmail("");
    } catch (failure) { if (request === generation.current) { setError(failure); setLink(""); } }
    finally { if (request === generation.current) { inFlight.current = false; setBusy(false); } }
  }
  return <section className="future-notice-panel" aria-label={t("future.title")} aria-busy={loading || busy}>
    <div className="future-notice-heading"><LockKey size={28} aria-hidden="true"/><h2>{contact.displayName}</h2>
      <button className="icon-button" disabled={busy || dirty} aria-label={t("sharing.people.refresh")} onClick={() => void load()}><ArrowClockwise size={20}/></button></div>
    <p>{t("future.intro")}</p>
    {loading && <p role="status">{t("future.loading")}</p>}
    {error && <div role="alert" className="drawer-alert"><p>{futureNoticeError(error, t)}</p><button className="text-button" onClick={() => void load()} disabled={busy}>{t("future.retry")}</button></div>}
    {notice && <p className="future-notice-status" role="status"><LockKey size={18} aria-hidden="true"/>{t(`future.${notice.status}`)}</p>}
    {!loading && !error && !active && <form noValidate onSubmit={event => { event.preventDefault(); if (validEmail) void change("create"); }}>
      <label className="field-label">{t("future.email")}<input type="email" autoComplete="off" maxLength={254} value={email}
        onChange={event => setEmail(event.target.value)} disabled={busy} /></label>
      <button className="primary-button" disabled={!validEmail || busy}>{t("future.create")}</button>
    </form>}
    {active && <p className="sharing-expiry"><Envelope size={18} aria-hidden="true"/> {notice.emailHint}</p>}
    {link && <div className="future-notice-link"><p>{t("future.linkReady")}</p><InvitationQr value={link}/>
      <div className="future-notice-actions"><button className="secondary-button" onClick={async () => {
        try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setCopied(false); }
      }}><Copy size={18}/>{t(copied ? "sharing.common.copied" : "future.copy")}</button>
        {navigator.share && <button className="secondary-button" onClick={() => void navigator.share({ title: t("future.title"), text: t("future.shareText"), url: link }).catch(() => {})}>
          <ShareNetwork size={18}/>{t("future.share")}</button>}</div>
      <input className="future-notice-address" readOnly value={link} aria-label={t("forms.invitation.link")} onFocus={event => event.target.select()}/></div>}
    {active && <div className="future-notice-actions">
      {notice.status !== "acknowledged" && <button className="secondary-button" disabled={busy || loading} onClick={() => void change("link")}>{t("future.regenerate")}</button>}
      <button className="text-button" disabled={busy || loading} onClick={() => void change("revoke")}>{t("future.revoke")}</button>
    </div>}
    {active && notice.status !== "acknowledged" && <p className="sharing-expiry">{t("future.linkExpiry", { date: formatDate(notice.expiresAt) })}</p>}
    <p className="sharing-expiry">{t("future.scope")}</p>
    <details className="task-details"><summary>{t("sharing.contact.visibleDetails")}</summary><p>{t("future.receivedScope")}</p><p>{t("future.notReleased")}</p></details>
  </section>;
}

export function FutureNoticesInbox({ apiClient }) {
  const { t } = useI18n();
  const [record, setRecord] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(null);
  const sequence = useRef(0), inFlight = useRef(false), mutating = useRef(false);
  const notices = record?.client === apiClient ? record.notices : null;
  const load = useCallback(async (clear = false) => {
    if (mutating.current || inFlight.current) return;
    const request = ++sequence.current; inFlight.current = true;
    if (clear) setRecord(null);
    try {
      const data = await apiClient.getFutureNoticesReceived();
      if (request === sequence.current) { setRecord({ client: apiClient, notices: data.notices }); setError(null); }
    } catch (failure) { if (request === sequence.current) { setRecord(null); setError(failure); } }
    finally { if (request === sequence.current) inFlight.current = false; }
  }, [apiClient]);
  useEffect(() => {
    inFlight.current = false; mutating.current = false; setBusy(null); void load(true);
    const refresh = () => { if (!document.hidden) void load(true); else { sequence.current += 1; inFlight.current = false; setRecord(null); } };
    const timer = window.setInterval(() => { if (!document.hidden && !inFlight.current) void load(); }, 15_000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { sequence.current += 1; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  return <section className="future-notices-inbox" aria-label={t("future.inbox")}><h2><LockKey size={23}/>{t("future.inbox")}</h2>
    <a className="text-button" href="/future-invite">{t("future.open")}</a>
    {error ? <div role="alert"><p>{futureNoticeError(error, t)}</p><button className="text-button" onClick={() => void load(true)}>{t("future.retry")}</button></div>
      : notices === null ? <p role="status">{t("future.loading")}</p>
        : notices.length === 0 ? <p className="sharing-expiry">{t("future.empty")}</p>
          : notices.map(notice => <article className="future-notice-card" key={notice.publicId}>
            <h3>{t("future.owner", { name: notice.ownerName })}</h3><p><LockKey size={18}/>{t("future.receivedScope")}</p>
            <button className="text-button" disabled={busy !== null} onClick={async () => {
              if (mutating.current) return;
              mutating.current = true; inFlight.current = false;
              const request = ++sequence.current;
              setBusy(notice.publicId); setError(null); setRecord(null);
              try {
                await apiClient.leaveFutureNotice(notice.publicId, notice.version);
                if (request === sequence.current) { mutating.current = false; await load(true); }
              } catch (failure) { if (request === sequence.current) { setRecord(null); setError(failure); } }
              finally { mutating.current = false; setBusy(null); }
            }}>{t("future.leave")}</button>
          </article>)}
  </section>;
}
