import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, DownloadSimple, Eye, FileText, Users, Info, Key, LockKey, Printer, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { ApiClientError } from "./api.js";
import { PanelTabs } from "./TaskPanels.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import guideArtwork from "./assets/continuity-guide.png";
import {
  createEncryptedStartHere,
  createRecipientDeviceKey,
  decryptEncryptedStartHereForRecipient,
} from "./startHereCrypto.js";

export function StartHerePanel({ apiClient, onGenerated, onBusyChange, onExitWarning }) {
  const [preview, setPreview] = useState(null);
  const [audience, setAudience] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [recipientError, setRecipientError] = useState("");
  const [step, setStep] = useState("review");
  const [format, setFormat] = useState("printable");
  const [recoverySaved, setRecoverySaved] = useState(false);
  const { confirm, confirmation } = useConfirmation();
  const showDiagnostics = import.meta.env.DEV && import.meta.env.VITE_RILLORA_RECIPIENT_REHEARSAL_TESTING === "1";
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

  useEffect(() => {
    let active = true;
    apiClient.getSharingConnections().then(({ connections }) => {
      if (active) setRecipients(connections.filter(item => item.status === "accepted"));
    }).catch(() => { if (active) setRecipientError("Connected people could not be loaded. Close this panel and try again."); });
    return () => { active = false; };
  }, [apiClient]);

  useEffect(() => onBusyChange?.(busyAction !== null), [busyAction, onBusyChange]);
  useEffect(() => onExitWarning?.(encryptedResult && !recoverySaved
    ? "Your recovery key is only here until you save it. Leave without keeping the key?" : ""),
  [encryptedResult, recoverySaved, onExitWarning]);
  useEffect(() => {
    if ((!encryptedResult || recoverySaved) && busyAction !== "encrypted") return undefined;
    const protectKey = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protectKey);
    return () => window.removeEventListener("beforeunload", protectKey);
  }, [encryptedResult, recoverySaved, busyAction]);

  function chooseFormat(value) {
    setFormat(value);
    setAcknowledgesPlaintext(false); setAcknowledgesNoRevocation(false);
    setAcknowledgesRecoveryRisk(false); setAcknowledgesEncryptedCopies(false);
  }

  async function createPreview() {
    if (!audience || (audience === "recipient" && !recipientId)) return;
    if (encryptedResult && !recoverySaved && !await confirm({ title: "Replace this recovery key?", message: "Keep the current key before refreshing. Rillora cannot recover it.", confirmLabel: "Replace preview", cancelLabel: "Keep current guide" })) return;
    setBusyAction("preview");
    setError("");
    try {
      const result = await apiClient.previewStartHere(audience === "recipient" ? recipientId : null);
      if (audience === "recipient" && (result.package.audience?.connectionPublicId !== recipientId || result.package.audience?.kind !== "recipient")) throw new Error("The preview did not match the selected person.");
      setPreview(result);
      setStep("review"); setRecoverySaved(false);
      setArtifact(null);
      setEncryptedResult(null);
      setAcknowledgesPlaintext(false);
      setAcknowledgesNoRevocation(false);
      setAcknowledgesRecoveryRisk(false);
      setAcknowledgesEncryptedCopies(false);
      setRehearsalResult(null);
      if (showDiagnostics) {
        const contacts = await apiClient.getTrustedContacts();
        const eligible = (contacts.trustedContacts ?? []).filter((contact) => !["revoked", "archived"].includes(contact.status));
        setRehearsalContacts(eligible); setSelectedRehearsalContact(eligible[0]?.publicId ?? "");
      }
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
      await onGenerated?.("Encrypted copy ready. Keep the recovery key separately.");
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
      await onGenerated?.("Printable guide prepared. Download started.");
    } catch (caught) {
      setError(messageFor(caught, "The printable guide could not be created."));
    } finally {
      setBusyAction(null);
    }
  }

  const errorMessage = error && <div className="start-here-error" role="alert"><p><WarningCircle size={18} /> {error}</p>{preview && <button className="secondary-button" disabled={!!busyAction} onClick={() => void createPreview()}>Refresh and review</button>}</div>;
  const artwork = <img className="guide-illustration" src={guideArtwork} alt="" width="1254" height="1254" />;

  if (!preview) return <div className="start-here-panel">
    <h3>Who is this copy for?</h3>
    <div className="copy-format-choices" role="group" aria-label="Copy audience">
      <button type="button" aria-pressed={audience === "owner"} onClick={() => setAudience("owner")}><FileText size={34} /><span>For me</span></button>
      <button type="button" aria-pressed={audience === "recipient"} onClick={() => setAudience("recipient")}><Users size={34} /><span>For a person</span></button>
    </div>
    {audience === "owner" && <p className="matter-form-hint">A personal directions overview. Choose a person before making a copy to share.</p>}
    {audience === "recipient" && <><label className="field-label">Connected person · Required<select aria-label="Connected person" value={recipientId} onChange={event => setRecipientId(event.target.value)}><option value="">Choose a person</option>{recipients.map(person => <option key={person.publicId} value={person.publicId}>{person.personName}</option>)}</select></label>{recipientError && <p role="alert">{recipientError}</p>}{!recipientError && recipients.length === 0 && <p>No connected people yet. Send an invitation first.</p>}<p className="matter-form-hint">Only their currently shared matters and permitted directions.</p></>}
    {errorMessage}
    <button className="primary-button drawer-primary" disabled={busyAction !== null || !audience || (audience === "recipient" && !recipientId)} onClick={() => void createPreview()}>{busyAction === "preview" ? "Preparing preview…" : "Review this copy"}<Eye size={20} aria-hidden="true" /></button>
    <details className="task-details"><summary><Info size={18} aria-hidden="true" /> Preview only</summary><p>Only you see this preview. No file is created or shared.</p></details>
  </div>;

  return <div className="start-here-panel" data-copy-format={format}>
    {confirmation}
    <PanelTabs items={[["review", "Review"], ["format", "Format"], ["save", "Save"]]} selected={step} onSelect={(value) => { if (!busyAction) setStep(value); }} label="Guide stage" />
    {errorMessage}
    {step === "review" && <>
      <div className="start-here-status"><Eye size={20} aria-hidden="true" />{preview.package.audience?.kind === "recipient" ? `For ${preview.package.audience.name}` : "Personal directions · for me"}</div>
      <p>{preview.package.matters.length} {preview.package.matters.length === 1 ? "matter" : "matters"} in this copy</p>
      {preview.package.matters.map((matter) => <details className="task-details" key={matter.publicId}><summary>{matter.title}</summary><dl className="export-preview-fields"><dt>Type</dt><dd>{formatLabel(matter.category)}</dd>{matter.institutionName && <><dt>Provider</dt><dd>{matter.institutionName}</dd></>}{matter.locationHint && <><dt>Where to find it</dt><dd>{matter.locationHint}</dd></>}{matter.desiredOutcome && <><dt>Wishes</dt><dd>{formatLabel(matter.desiredOutcome)}</dd></>}{!matter.desiredOutcome && <><dt>Access</dt><dd>Name only</dd></>}</dl></details>)}
      {preview.package.trustedContacts.length > 0 && <details className="task-details"><summary>Contact names included · {preview.package.trustedContacts.length}</summary>{preview.package.trustedContacts.map((contact, index) => <div className="start-here-preview-row" key={index}><strong>{contact.displayName}</strong><span>{contact.relationshipLabel}</span></div>)}</details>}
      <button className="primary-button drawer-primary" onClick={() => setStep("format")}>Choose a format <ArrowIcon /></button>
      <button className="text-button" onClick={async () => { if (encryptedResult && !recoverySaved && !await confirm({title:"Keep your recovery key",message:"Changing the audience removes this unsaved recovery key.",confirmLabel:"Change audience",cancelLabel:"Keep current copy"})) return;setPreview(null);setArtifact(null);setEncryptedResult(null);setError(""); }}>Change who this is for</button>
      <details className="task-details"><summary>Preview details</summary><p>Expires {formatExpiry(preview.export.expiresAt)}. Refresh after changing your map.</p><button className="secondary-button" disabled={busyAction !== null} onClick={() => void createPreview()}>Refresh preview</button></details>
    </>}
    {step === "format" && <>
      {artwork}
      <div className="copy-format-choices" role="group" aria-label="Copy format">
        <button type="button" aria-pressed={format === "printable"} disabled={Boolean(busyAction)} onClick={() => chooseFormat("printable")}><Printer size={34} aria-hidden="true" /><span>Printable</span></button>
        <button type="button" aria-pressed={format === "encrypted"} disabled={Boolean(busyAction)} onClick={() => chooseFormat("encrypted")}><LockKey size={34} aria-hidden="true" /><span>Encrypted</span></button>
      </div>
      <button className="primary-button drawer-primary" onClick={() => setStep("save")}>Continue <ArrowIcon /></button>
    </>}
    {step === "save" && format === "printable" && <>
      <h3>Printable guide</h3>
      {!artifact && <div className="start-here-acknowledgements">
        <label><input type="checkbox" checked={acknowledgesPlaintext} onChange={(event) => setAcknowledgesPlaintext(event.target.checked)} /><span>I reviewed the guide and understand this file is plaintext.</span></label>
        <label><input type="checkbox" checked={acknowledgesNoRevocation} onChange={(event) => setAcknowledgesNoRevocation(event.target.checked)} /><span>Saved, shared or printed copies cannot be revoked.</span></label>
      </div>}
      {artifact ? <><p className="start-here-complete" role="status">Guide ready</p><button className="primary-button drawer-primary" onClick={() => downloadArtifact(artifact.blob, artifact.filename)}>Download guide <DownloadSimple size={20} /></button></>
        : <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesPlaintext || !acknowledgesNoRevocation} onClick={() => void createPrintable()}>{busyAction === "printable" ? "Preparing guide…" : "Download printable guide"}<DownloadSimple size={20} /></button>}
      <details className="task-details"><summary>Included information</summary><p>The plaintext guide excludes dedicated account hints, financial values and currencies.</p></details>
    </>}
    {step === "save" && format === "encrypted" && <>
      <h3>Encrypted package</h3>
      {!encryptedResult ? <>
        <div className="start-here-acknowledgements">
          <label><input type="checkbox" checked={acknowledgesRecoveryRisk} onChange={(event) => setAcknowledgesRecoveryRisk(event.target.checked)} /><span>Rillora cannot replace the recovery key. Anyone holding it can decrypt this copy.</span></label>
          <label><input type="checkbox" checked={acknowledgesEncryptedCopies} onChange={(event) => setAcknowledgesEncryptedCopies(event.target.checked)} /><span>Copies outside Rillora cannot be remotely revoked.</span></label>
        </div>
        <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesRecoveryRisk || !acknowledgesEncryptedCopies} onClick={() => void createEncrypted()}>{busyAction === "encrypted" ? "Encrypting…" : "Create encrypted package"}<ShieldCheck size={20} /></button>
      </> : <>
        <p className="start-here-complete" role="status"><CheckCircle size={18} />Encrypted copy ready</p>
        {encryptedResult.finalized.recipientKeyCount === 0 && <p>Only your recovery key can open this copy.</p>}
        <button className="primary-button drawer-primary" onClick={() => downloadJson(encryptedResult.recoveryKit, `rillora-recovery-${encryptedResult.finalized.publicId}.json`)}>Download recovery key <Key size={20} /></button>
        <button className="secondary-button" onClick={() => downloadJson(encryptedResult.artifact, `rillora-encrypted-start-here-${encryptedResult.finalized.publicId}.json`)}>Download package <DownloadSimple size={20} /></button>
        <div className="start-here-acknowledgements"><label><input type="checkbox" checked={recoverySaved} onChange={(event) => setRecoverySaved(event.target.checked)} /><span>I kept the recovery key separately.</span></label></div>
      </>}
      <details className="task-details"><summary>About encryption</summary><p>The recovery file is a decryption secret. Keep it separate from the package.</p><p>Encryption happens in this browser. The API receives ciphertext and wrapped keys, not your recovery private key. Recipient delivery is not active.</p></details>
    </>}
    {showDiagnostics && step === "save" && (<section className="start-here-encrypted" aria-labelledby="recipient-rehearsal-title">
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
      </section>)}
  </div>;
}

function ArrowIcon() { return <ArrowRight size={18} aria-hidden="true" />; }

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
