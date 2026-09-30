import { useEffect, useRef, useState } from 'react';

export function ReauthenticationPrompt({ apiClient }) {
  const [phase, setPhase] = useState(null);
  const [message, setMessage] = useState('');
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
  function close() { run.current?.abort(); run.current = null; setPhase(null); setMessage(''); }
  async function signIn() {
    // Open during the click, before any network await; the work page stays mounted.
    const popup = window.open('about:blank', '_blank', 'popup,width=520,height=760');
    if (!popup) { setMessage('Allow the sign-in window, then try again. Your editing window stays open.'); return; }
    popup.opener = null;
    const controller = new AbortController();
    run.current = controller;
    setPhase('working'); setMessage('Complete sign in in the other window, then return here.');
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
          setPhase('complete'); setMessage('Sign-in complete. Return to your editing window and try the action again.');
          return;
        }
        if (result.failed) { setPhase('ready'); setMessage('Sign in was not completed with the same account. Your changes are still here.'); return; }
        await new Promise(resolve => {
          const finish = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); };
          const timer = setTimeout(finish, 2000);
          controller.signal.addEventListener('abort', finish, { once: true });
        });
      }
      if (!controller.signal.aborted) { setPhase('ready'); setMessage('Sign in was not completed in time. Your changes are still here.'); }
    } catch {
      if (!controller.signal.aborted) { setPhase('ready'); setMessage('Sign in could not be verified. Use the same account and try again.'); }
    } finally { if (run.current === controller) run.current = null; }
  }
  if (!phase) return null;
  return <dialog ref={dialog} className="task-confirmation" aria-labelledby="reauth-title" aria-describedby="reauth-message"
    onCancel={event => { event.preventDefault(); close(); }}>
    <h2 id="reauth-title">{phase === 'complete' ? 'Sign-in complete' : 'Sign in again'}</h2>
    <p id="reauth-message" role="status">{message || 'Confirm it is still you before continuing. Your changes stay here and nothing is submitted automatically.'}</p>
    <div className="task-confirmation-actions">
      <button data-keep className="primary-button" onClick={close}>{phase === 'complete' ? 'Return to editing' : 'Keep editing'}</button>
      {phase === 'ready' && <button className="secondary-button" onClick={() => void signIn()}>Sign in again</button>}
    </div>
  </dialog>;
}
