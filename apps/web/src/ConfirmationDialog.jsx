import { useI18n } from "./i18n/I18nProvider.jsx";
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
  return { confirm, cancel: () => settle(false), confirmation: request && <ConfirmationDialog {...request} onAnswer={settle} /> };
}

function ConfirmationDialog({ title, message, confirmLabel, cancelLabel, titleKey, messageKey, confirmLabelKey, cancelLabelKey, params, onAnswer }) {
  const { t } = useI18n();
  const displayedTitle = titleKey ? t(titleKey, params) : title;
  const displayedMessage = messageKey ? t(messageKey, params) : message;
  const displayedConfirm = confirmLabelKey ? t(confirmLabelKey, params) : confirmLabel ?? t("forms.discardChanges");
  const displayedCancel = cancelLabelKey ? t(cancelLabelKey, params) : cancelLabel ?? t("forms.keepEditing");
  const ref = useRef(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    dialog.querySelector("[data-keep]")?.focus();
    return () => {
      dialog.close();
      queueMicrotask(() => { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); });
    };
  }, []);
  return <dialog ref={ref} className="task-confirmation" aria-labelledby={titleId}
    aria-describedby={displayedMessage ? messageId : undefined}
    onCancel={(event) => { event.preventDefault(); onAnswer(false); }}>
    <h2 id={titleId}>{displayedTitle}</h2>
    {displayedMessage && <p id={messageId}>{displayedMessage}</p>}
    <div className="task-confirmation-actions">
      <button data-keep className="primary-button" onClick={() => onAnswer(false)}>{displayedCancel}</button>
      <button className="secondary-button" onClick={() => onAnswer(true)}>{displayedConfirm}</button>
    </div>
  </dialog>;
}
