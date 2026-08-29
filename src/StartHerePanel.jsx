import { useState } from "react";
import { CheckCircle, DownloadSimple, Eye, Info, Key, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { ApiClientError } from "./api.js";
import {
  createEncryptedStartHere,
  createRecipientDeviceKey,
  decryptEncryptedStartHereForRecipient,
} from "./startHereCrypto.js";

export function StartHerePanel({ apiClient, onGenerated }) {
  const [preview, setPreview] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [encryptedResult, setEncryptedResult] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [acknowledgesPlaintext, setAcknowledgesPlaintext] = useState(false);
  const [acknowledgesNoRevocation, setAcknowledgesNoRevocation] = useState(false);
  const [acknowledgesRecoveryRisk, setAcknowledgesRecoveryRisk] = useState(false);
  const [acknowledgesEncryptedCopies, setAcknowledgesEncryptedCopies] = useState(false);
  const [error, setError] = useState("");
  const [rehearsalContacts, setRehearsalContacts] = useState([]);
  const [selectedRehearsalContact, setSelectedRehearsalContact] = useState("");
  const [rehearsalResult, setRehearsalResult] = useState(null);

  async function createPreview() {
    setBusyAction("preview");
    setError("");
    try {
      const result = await apiClient.previewStartHere();
      setPreview(result);
      setArtifact(null);
      setEncryptedResult(null);
      setAcknowledgesPlaintext(false);
      setAcknowledgesNoRevocation(false);
      setAcknowledgesRecoveryRisk(false);
      setAcknowledgesEncryptedCopies(false);
      setRehearsalResult(null);
      const contacts = await apiClient.getTrustedContacts();
      const eligible = (contacts.trustedContacts ?? []).filter(
        (contact) => !["revoked", "archived"].includes(contact.status),
      );
      setRehearsalContacts(eligible);
      setSelectedRehearsalContact(eligible[0]?.publicId ?? "");
    } catch (caught) {
      setError(messageFor(caught, "The Start Here preview could not be created."));
    } finally {
      setBusyAction(null);
    }
  }

  async function runRecipientRehearsal() {
    if (!preview || !selectedRehearsalContact) return;
    setBusyAction("rehearsal");
    setError("");
    let rehearsalPublicId = null;
    try {
      const created = await apiClient.createRecipientRehearsal(selectedRehearsalContact);
      rehearsalPublicId = created.recipientRehearsal.publicId;
      const accepted = await apiClient.acceptRecipientRehearsal(created.acceptanceToken);
      const deviceKey = await createRecipientDeviceKey();
      const enrolled = await apiClient.enrollRecipientDeviceKey(accepted.sessionToken, {
        deviceLabel: "Synthetic Web session",
        publicKey: deviceKey.publicKey,
      });
      const preparation = await apiClient.prepareRecipientRehearsalPackage(
        rehearsalPublicId,
        preview.export.publicId,
      );
      const encrypted = await createEncryptedStartHere({ preview, preparation });
      await apiClient.finalizeRecipientRehearsalPackage(
        rehearsalPublicId,
        preparation.package.publicId,
        encrypted.submission,
      );
      const recipientArtifact = await apiClient.getRecipientRehearsalPackage(
        accepted.sessionToken,
        preparation.package.publicId,
      );
      const decrypted = await decryptEncryptedStartHereForRecipient(recipientArtifact, {
        ...deviceKey,
        publicId: enrolled.deviceKey.publicId,
      });
      setRehearsalResult({
        rehearsalPublicId,
        sessionToken: accepted.sessionToken,
        keyPublicId: enrolled.deviceKey.publicId,
        packagePublicId: preparation.package.publicId,
        decryptedMatterCount: decrypted.package.matters.length,
        revoked: false,
      });
      await onGenerated?.("Synthetic recipient acceptance and local decryption rehearsal passed. No delivery or release occurred.");
    } catch (caught) {
      if (rehearsalPublicId) {
        try { await apiClient.revokeRecipientRehearsal(rehearsalPublicId); } catch { /* best-effort cleanup */ }
      }
      setError(messageFor(caught, "The synthetic recipient rehearsal could not be completed."));
    } finally {
      setBusyAction(null);
    }
  }

  async function revokeRehearsalKey() {
    if (!rehearsalResult || rehearsalResult.revoked) return;
    setBusyAction("revoke-rehearsal-key");
    setError("");
    try {
      await apiClient.revokeRecipientDeviceKey(
        rehearsalResult.sessionToken,
        rehearsalResult.keyPublicId,
      );
      setRehearsalResult({ ...rehearsalResult, sessionToken: null, revoked: true });
    } catch (caught) {
      setError(messageFor(caught, "The synthetic recipient key could not be revoked."));
    } finally {
      setBusyAction(null);
    }
  }

  async function createEncrypted() {
    if (!preview || !acknowledgesRecoveryRisk || !acknowledgesEncryptedCopies) return;
    setBusyAction("encrypted");
    setError("");
    try {
      const preparation = await apiClient.prepareEncryptedStartHere(preview.export.publicId);
      const encrypted = await createEncryptedStartHere({ preview, preparation });
      const finalized = await apiClient.finalizeEncryptedStartHere(
        preparation.package.publicId,
        encrypted.submission,
      );
      setEncryptedResult({ ...encrypted, finalized: finalized.encryptedPackage });
      await onGenerated?.("Client-encrypted Start Here package created. Download its offline recovery key now.");
    } catch (caught) {
      setError(messageFor(caught, "The encrypted package could not be created."));
    } finally {
      setBusyAction(null);
    }
  }

  async function createPrintable() {
    if (!preview || !acknowledgesPlaintext || !acknowledgesNoRevocation) return;
    setBusyAction("printable");
    setError("");
    try {
      const result = await apiClient.createPrintableStartHere(preview.export.publicId);
      downloadArtifact(result.blob, result.filename);
      setArtifact(result);
      await onGenerated?.("Printable Start Here guide downloaded. Rillora retained no server copy.");
    } catch (caught) {
      setError(messageFor(caught, "The printable guide could not be created."));
    } finally {
      setBusyAction(null);
    }
  }

  if (!preview) {
    return (
      <div className="start-here-panel">
        <p className="drawer-intro">Review the exact directions and contact records before creating any file. The review creates metadata and an audit event, not a download.</p>
        <div className="drawer-safety"><Info size={19} /> Directions only—dedicated account hints, financial values, passwords and recovery secrets are excluded from the printable guide.</div>
        {error && <p className="start-here-error" role="alert"><WarningCircle size={18} /> {error}</p>}
        <button className="primary-button drawer-primary" disabled={busyAction !== null} onClick={() => void createPreview()}>
          {busyAction === "preview" ? "Creating preview…" : "Create no-file preview"} {busyAction !== "preview" && <Eye size={20} />}
        </button>
      </div>
    );
  }

  return (
    <div className="start-here-panel">
      <div className="start-here-status"><CheckCircle size={20} weight="fill" /> Preview ready — no file created</div>
      <p className="drawer-intro">Preview expires {formatExpiry(preview.export.expiresAt)}. Create a new preview if the plan changes or this review expires.</p>

      <section className="start-here-preview" aria-labelledby="start-here-matters">
        <h3 id="start-here-matters">Matter directions</h3>
        {preview.package.matters.length ? preview.package.matters.map((matter) => (
          <div className="start-here-preview-row" key={matter.publicId}>
            <strong>{matter.title}</strong>
            <span>{matter.institutionName || "Institution not added"}</span>
            <small>{formatLabel(matter.desiredOutcome)}</small>
          </div>
        )) : <p className="drawer-intro">No active matters are recorded.</p>}
      </section>

      <section className="start-here-preview" aria-labelledby="start-here-contacts">
        <h3 id="start-here-contacts">Trusted-contact records</h3>
        {preview.package.trustedContacts.length ? preview.package.trustedContacts.map((contact, index) => (
          <div className="start-here-preview-row" key={`${contact.displayName}-${index}`}>
            <strong>{contact.displayName}</strong>
            <span>{contact.relationshipLabel || "Relationship not added"}</span>
          </div>
        )) : <p className="drawer-intro">No active trusted-contact records are included.</p>}
      </section>

      <div className="start-here-warning">
        <WarningCircle size={21} />
        <div><strong>Plaintext, minimum disclosure</strong><p>The `.txt` guide is readable without a password. Once saved, shared or printed, Rillora cannot revoke that copy.</p></div>
      </div>

      <div className="start-here-acknowledgements">
        <label><input type="checkbox" checked={acknowledgesPlaintext} onChange={(event) => setAcknowledgesPlaintext(event.target.checked)} /><span>I reviewed the included directions and understand this file is plaintext.</span></label>
        <label><input type="checkbox" checked={acknowledgesNoRevocation} onChange={(event) => setAcknowledgesNoRevocation(event.target.checked)} /><span>I understand a downloaded or printed copy cannot be revoked by Rillora.</span></label>
      </div>

      {error && <p className="start-here-error" role="alert"><WarningCircle size={18} /> {error}</p>}
      {artifact && <p className="start-here-complete" role="status"><CheckCircle size={18} weight="fill" /> Download created. Server copy retained: no. Audit record {artifact.exportPublicId}.</p>}

      <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesPlaintext || !acknowledgesNoRevocation} onClick={() => void createPrintable()}>
        {busyAction === "printable" ? "Preparing guide…" : "Download printable guide (.txt)"} {busyAction !== "printable" && <DownloadSimple size={20} />}
      </button>
      <button className="secondary-button" disabled={busyAction !== null} onClick={() => void createPreview()}>Refresh preview</button>

      <section className="start-here-encrypted" aria-labelledby="start-here-encrypted-title">
        <div className="start-here-status"><ShieldCheck size={20} weight="fill" /> <span id="start-here-encrypted-title">Client-encrypted package</span></div>
        <p className="drawer-intro">A fresh AES-256 content key is created in this browser and wrapped with RFC 9180 HPKE for each eligible accepted recipient device plus a one-time Owner recovery key. The API receives ciphertext and wrapped keys, not the recovery private key or unwrapped content key.</p>
        <div className="start-here-warning">
          <Key size={21} />
          <div><strong>The recovery file is the secret</strong><p>Anyone holding it together with the encrypted package can open the package. Rillora cannot recover or regenerate it. Real recipient enrollment and post-death delivery are not active yet.</p></div>
        </div>
        <div className="start-here-acknowledgements">
          <label><input type="checkbox" checked={acknowledgesRecoveryRisk} onChange={(event) => setAcknowledgesRecoveryRisk(event.target.checked)} /><span>I understand Rillora cannot recover the offline recovery key and anyone holding it can decrypt this package.</span></label>
          <label><input type="checkbox" checked={acknowledgesEncryptedCopies} onChange={(event) => setAcknowledgesEncryptedCopies(event.target.checked)} /><span>I understand copies saved outside Rillora cannot be remotely revoked.</span></label>
        </div>
        {!encryptedResult ? (
          <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesRecoveryRisk || !acknowledgesEncryptedCopies} onClick={() => void createEncrypted()}>
            {busyAction === "encrypted" ? "Encrypting and verifying…" : "Create encrypted package"} {busyAction !== "encrypted" && <ShieldCheck size={20} />}
          </button>
        ) : (
          <div className="start-here-encrypted-result">
            <p className="start-here-complete" role="status"><CheckCircle size={18} weight="fill" /> Package encrypted and locally recovery-tested. Accepted recipient device keys: {encryptedResult.finalized.recipientKeyCount}. Recipient delivery performed: no.</p>
            {encryptedResult.finalized.recipientKeyCount === 0 && <p className="drawer-intro">No eligible accepted recipient device key exists yet. Only the offline Owner recovery key can currently open this package.</p>}
            <button className="primary-button drawer-primary" onClick={() => downloadJson(encryptedResult.recoveryKit, `rillora-recovery-${encryptedResult.finalized.publicId}.json`)}>
              Download offline recovery key <Key size={20} />
            </button>
            <button className="secondary-button" onClick={() => downloadJson(encryptedResult.artifact, `rillora-encrypted-start-here-${encryptedResult.finalized.publicId}.json`)}>
              Download encrypted package <DownloadSimple size={20} />
            </button>
          </div>
        )}
      </section>

      <section className="start-here-encrypted" aria-labelledby="recipient-rehearsal-title">
        <div className="start-here-status"><ShieldCheck size={20} weight="fill" /> <span id="recipient-rehearsal-title">Synthetic recipient rehearsal</span></div>
        <p className="drawer-intro">Locally exercise acceptance, a memory-only device key, recipient-only package access and decryption. This sends no invitation, verifies no identity, detects no death and releases nothing.</p>
        {!rehearsalResult ? (
          <>
            <label className="field-label" htmlFor="recipient-rehearsal-contact">Test contact record</label>
            <select
              id="recipient-rehearsal-contact"
              value={selectedRehearsalContact}
              onChange={(event) => setSelectedRehearsalContact(event.target.value)}
              disabled={busyAction !== null}
            >
              {rehearsalContacts.length === 0 && <option value="">Add a synthetic trusted-contact record first</option>}
              {rehearsalContacts.map((contact) => (
                <option value={contact.publicId} key={contact.publicId}>{contact.displayName}</option>
              ))}
            </select>
            <button className="primary-button drawer-primary" disabled={busyAction !== null || !selectedRehearsalContact} onClick={() => void runRecipientRehearsal()}>
              {busyAction === "rehearsal" ? "Running isolated rehearsal…" : "Run recipient decryption rehearsal"} {busyAction !== "rehearsal" && <ShieldCheck size={20} />}
            </button>
          </>
        ) : (
          <div className="start-here-encrypted-result">
            <p className="start-here-complete" role="status"><CheckCircle size={18} weight="fill" /> Recipient-side decryption passed for {rehearsalResult.decryptedMatterCount} matter directions. Delivery: no. Release: no.</p>
            <p className="drawer-intro">Revocation prevents this simulated active device from fetching the package again. It cannot erase plaintext or copies already obtained outside Rillora.</p>
            <button className="secondary-button" disabled={busyAction !== null || rehearsalResult.revoked} onClick={() => void revokeRehearsalKey()}>
              {rehearsalResult.revoked ? "Synthetic device key revoked" : busyAction === "revoke-rehearsal-key" ? "Revoking…" : "Revoke synthetic device key"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function downloadArtifact(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function downloadJson(value, filename) {
  downloadArtifact(
    new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json;charset=utf-8" }),
    filename,
  );
}

function messageFor(error, fallback) {
  return error instanceof ApiClientError ? error.message : fallback;
}

function formatLabel(value) {
  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function formatExpiry(value) {
  if (!value) return "soon";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
