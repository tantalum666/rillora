import { useI18n } from "./i18n/I18nProvider.jsx";
import { useLayoutEffect, useRef, useState } from "react";
import { Check, Info, UserCircle } from "@phosphor-icons/react";
import { InvitationSteps } from "./SharingMotion.jsx";
import { getTrustedContactEvidence } from "./contactEvidence.js";

export function ContactEditorPanel({ contact, apiClient, onSaved, onDirtyChange, onBusyChange }) {
  const { t, errorMessage } = useI18n();
  const original = useRef(contact);
  const [name, setName] = useState(contact?.displayName ?? "");
  const [relationship, setRelationship] = useState(contact?.relationshipLabel ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dirty = name !== (original.current?.displayName ?? "") || relationship !== (original.current?.relationshipLabel ?? "");
  const evidence = getTrustedContactEvidence(original.current, t);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  useLayoutEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useLayoutEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true); setError(null);
    const values = { displayName: name.trim(), relationshipLabel: relationship.trim() || null };
    try {
      const response = original.current
        ? await apiClient.updateTrustedContact(original.current.publicId, { ...values, expectedVersion: original.current.version })
        : await apiClient.createTrustedContact(values);
      if (!response?.trustedContact?.publicId) throw Object.assign(new Error("The saved contact could not be read back."), { messageKey: "forms.contact.error.readback" });
      onSaved(response.trustedContact);
    } catch (failure) {
      setError(failure);
    } finally { setBusy(false); }
  }

  return (
    <div className="contact-editor-panel">
      {!contact && <InvitationSteps current={0} />}
      <div className="contact-editor-avatar" aria-hidden="true">{initials || <UserCircle size={42} />}</div>
      <label className="field-label">{t("forms.contact.name")}<input autoFocus value={name} maxLength={120} autoComplete="off" disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field-label">{t("forms.contact.relationship")}<input value={relationship} maxLength={80} autoComplete="off" disabled={busy} onChange={(event) => setRelationship(event.target.value)} /></label>
      {contact && <p className="contact-evidence">{evidence.label}</p>}
      {contact ? <details className="task-details"><summary><Info size={18} aria-hidden="true" /> {t("forms.contact.recordOnly")}</summary><p>{t("forms.contact.boundary")}</p></details> : <p className="sharing-expiry">{t("forms.contact.next")}</p>}
      {error && <p className="drawer-alert" role="alert">{error.messageKey ? t(error.messageKey) : errorMessage(error, "forms.contact.error.save")}</p>}
      <button className="primary-button drawer-primary" type="button" disabled={busy || !name.trim() || (!dirty && Boolean(contact))} onClick={() => void save()}>{t(busy ? "forms.saving" : contact ? "forms.contact.save" : "forms.contact.continue")}<Check size={20} aria-hidden="true" /></button>
    </div>
  );
}
