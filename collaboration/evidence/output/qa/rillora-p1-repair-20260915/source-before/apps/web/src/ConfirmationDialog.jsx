import { useCallback, useEffect, useId, useRef, useState } from "react";

// Keep the decision inside the product, with the non-destructive action focused.
export function useConfirmation() {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback((options) => {
    if (resolver.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      resolver.current = resolve;
      setRequest(options);
    });
  }, []);
  const settle = useCallback((answer) => {
    const resolve = resolver.current;
    resolver.current = null;
    setRequest(null);
    resolve?.(answer);
  }, []);
  useEffect(() => () => {
    resolver.current?.(false);
    resolver.current = null;
  }, []);
  return { confirm, confirmation: request && <ConfirmationDialog {...request} onAnswer={settle} /> };
}

function ConfirmationDialog({ title, message, confirmLabel = "Discard changes", cancelLabel = "Keep editing", onAnswer }) {
  const ref = useRef(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog.querySelector("[data-keep]")?.focus();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="task-confirmation" aria-labelledby={titleId}
    aria-describedby={message ? messageId : undefined}
    onCancel={(event) => { event.preventDefault(); onAnswer(false); }}>
    <h2 id={titleId}>{title}</h2>
    {message && <p id={messageId}>{message}</p>}
    <div className="task-confirmation-actions">
      <button data-keep className="primary-button" onClick={() => onAnswer(false)}>{cancelLabel}</button>
      <button className="secondary-button" onClick={() => onAnswer(true)}>{confirmLabel}</button>
    </div>
  </dialog>;
}
