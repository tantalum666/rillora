import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useRef, useState } from 'react';

export function ReauthenticationPrompt({ apiClient }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState(null);
  const [messageKey, setMessageKey] = useState('');
  const dialog = useRef(null);
  const run = useRef(null);
  useEffect(() => {
    const request = () => setPhase(current => current ?? 'ready');
    window.addEventListener('rillora:reauthentication-required', request);
    return () => {
      window.removeEventListener('rillora:reauthentication-required', request);
      run.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!phase) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    element.querySelector('[data-keep]')?.focus();
    return () => {
      element.close();
      queueMicrotask(() => { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); });
    };
  }, [Boolean(phase)]);
  function close() {
    run.current?.abort(); run.current = null; setPhase(null); setMessageKey('');
    // Refresh reads only. Never replay the payment/export/edit that was held.
    if (phase === 'complete') window.dispatchEvent(new Event('rillora:identity-confirmed'));
  }
  async function signIn() {
    // Open during the click, before any network await; the work page stays mounted.
    const popup = window.open('about:blank', '_blank', 'popup,width=520,height=760');
    if (!popup) { setMessageKey('forms.reauth.allowPopup'); return; }
    popup.opener = null;
    const controller = new AbortController();
    run.current = controller;
    setPhase('working'); setMessageKey('forms.reauth.completeElsewhere');
    try {
      const transaction = await apiClient.startReauthentication();
      if (controller.signal.aborted) { popup.close(); return; }
      const url = new URL(transaction.authorizationUrl);
      if (url.protocol !== 'https:' || !transaction.pollToken || transaction.expiresIn > 900) throw new Error('Invalid sign-in response');
      popup.location.href = url.href;
      const deadline = Date.now() + transaction.expiresIn * 1000;
      while (!controller.signal.aborted && Date.now() < deadline) {
        const result = await apiClient.getReauthenticationStatus(transaction.pollToken);
        if (controller.signal.aborted) return;
        if (result.completed) {
          setPhase('complete'); setMessageKey('forms.reauth.completeMessage');
          return;
        }
        if (result.failed) { setPhase('ready'); setMessageKey('forms.reauth.wrongAccount'); return; }
        await new Promise(resolve => {
          const finish = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); };
          const timer = setTimeout(finish, 2000);
          controller.signal.addEventListener('abort', finish, { once: true });
        });
      }
      if (!controller.signal.aborted) { setPhase('ready'); setMessageKey('forms.reauth.expired'); }
    } catch {
      if (!controller.signal.aborted) { setPhase('ready'); setMessageKey('forms.reauth.error'); }
    } finally { if (run.current === controller) run.current = null; }
  }
  if (!phase) return null;
  return <dialog ref={dialog} className="task-confirmation" aria-labelledby="reauth-title" aria-describedby="reauth-message"
    onCancel={event => { event.preventDefault(); close(); }}>
    <h2 id="reauth-title">{t(phase === 'complete' ? 'forms.reauth.complete' : 'forms.reauth.signIn')}</h2>
    <p id="reauth-message" role="status">{t(messageKey || 'forms.reauth.explanation')}</p>
    <div className="task-confirmation-actions">
      <button data-keep className="primary-button" onClick={close}>{t(phase === 'complete' ? 'forms.reauth.return' : 'forms.keepEditing')}</button>
      {phase === 'ready' && <button className="secondary-button" onClick={() => void signIn()}>{t("forms.reauth.signIn")}</button>}
    </div>
  </dialog>;
}
