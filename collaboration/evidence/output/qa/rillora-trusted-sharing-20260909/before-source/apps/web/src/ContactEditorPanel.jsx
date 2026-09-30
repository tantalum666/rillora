import { useEffect, useRef, useState } from "react";
import { Check, Info, UserCircle } from "@phosphor-icons/react";
import { getTrustedContactEvidence } from "./contactEvidence.js";

export function ContactEditorPanel({ contact, apiClient, onSaved, onDirtyChange, onBusyChange }) {
  const original = useRef(contact);
  const [name, setName] = useState(contact?.displayName ?? "");
  const [relationship, setRelationship] = useState(contact?.relationshipLabel ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dirty = name !== (original.current?.displayName ?? "") || relationship !== (original.current?.relationshipLabel ?? "");
  const evidence = getTrustedContactEvidence(original.current);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true); setError(null);
    const values = { displayName: name.trim(), relationshipLabel: relationship.trim() || null };
    try {
      const response = original.current
        ? await apiClient.updateTrustedContact(original.current.publicId, { ...values, expectedVersion: original.current.version })
        : await apiClient.createTrustedContact(values);
      if (!response?.trustedContact?.publicId) throw new Error("The saved contact could not be read back.");
      onSaved(response.trustedContact);
    } catch (failure) {
      setError(failure?.message || "Contact not saved. Your draft is still here.");
    } finally { setBusy(false); }
  }

  return (
    <div className="contact-editor-panel">
      <div className="contact-editor-avatar" aria-hidden="true">{initials || <UserCircle size={42} />}</div>
      <label className="field-label">Name<input autoFocus value={name} maxLength={120} autoComplete="off" disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field-label">Relationship<input value={relationship} maxLength={80} autoComplete="off" disabled={busy} onChange={(event) => setRelationship(event.target.value)} /></label>
      {contact && <p className="contact-evidence">{evidence.label}</p>}
      <details className="task-details"><summary><Info size={18} aria-hidden="true" /> Record only</summary><p>No invitation or message is sent. This record grants no account access or legal authority.</p></details>
      {error && <p className="drawer-alert" role="alert">{error}</p>}
      <button className="primary-button drawer-primary" type="button" disabled={busy || !name.trim() || (!dirty && Boolean(contact))} onClick={() => void save()}>{busy ? "Saving…" : "Save contact"}<Check size={20} aria-hidden="true" /></button>
    </div>
  );
}
