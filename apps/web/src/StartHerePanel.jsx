import { sharingMessage, sharedCategoryLabel, sharedFieldValue } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowRight, CheckCircle, DownloadSimple, Eye, FileText, Users, Info, Key, LockKey, Printer, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { PanelTabs } from "./TaskPanels.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import guideArtwork from "./assets/continuity-guide.png";
import {
  createEncryptedStartHere,
  createRecipientDeviceKey,
  decryptEncryptedStartHereForRecipient,
} from "./startHereCrypto.js";

export function StartHerePanel({ apiClient, onGenerated, onBusyChange, onExitWarning }) {
  const { t, locale, formatDate, errorMessage: translateError } = useI18n();
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
    }).catch(() => { if (active) setRecipientError("sharing.copy.peopleError"); });
    return () => { active = false; };
  }, [apiClient]);

  useLayoutEffect(() => onBusyChange?.(busyAction !== null), [busyAction, onBusyChange]);
  useLayoutEffect(() => onExitWarning?.(encryptedResult && !recoverySaved
    ? { key: "sharing.copy.exitWarning" } : ""),
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
    if (encryptedResult && !recoverySaved && !await confirm({ titleKey: "sharing.copy.replaceKeyTitle", messageKey: "sharing.copy.replaceKeyBody", confirmLabelKey: "sharing.copy.replacePreview", cancelLabelKey: "sharing.copy.keepGuide" })) return;
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
      setError(messageFor(caught, "sharing.copy.previewError"));
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
      await onGenerated?.({key:"sharing.diagnostics.passedNotice"});
    } catch (caught) {
      if (rehearsalPublicId) {
        try { await apiClient.revokeRecipientRehearsal(rehearsalPublicId); } catch { /* best-effort cleanup */ }
      }
      setError(messageFor(caught, "sharing.diagnostics.runError"));
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
      setError(messageFor(caught, "sharing.diagnostics.revokeError"));
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
      await onGenerated?.({ key: "sharing.copy.encryptedNotice" });
    } catch (caught) {
      setError(messageFor(caught, "sharing.copy.encryptError"));
    } finally {
      setBusyAction(null);
    }
  }

  async function createPrintable() {
    if (!preview || !acknowledgesPlaintext || !acknowledgesNoRevocation) return;
    setBusyAction("printable");
    setError("");
    try {
      const result = await apiClient.createPrintableStartHere(preview.export.publicId, locale);
      downloadArtifact(result.blob, result.filename);
      setArtifact(result);
      await onGenerated?.({ key: "sharing.copy.printNotice" });
    } catch (caught) {
      setError(messageFor(caught, "sharing.copy.printError"));
    } finally {
      setBusyAction(null);
    }
  }

  const errorMessage = error && <div className="start-here-error" role="alert"><p><WarningCircle size={18} /> {sharingMessage(error, t, translateError)}</p>{preview && <button className="secondary-button" disabled={!!busyAction} onClick={() => void createPreview()}>{t("sharing.copy.refreshReview")}</button>}</div>;
  const artwork = <img className="guide-illustration" src={guideArtwork} alt="" width="1254" height="1254" />;

  if (!preview) return <div className="start-here-panel">
    <h3>{t("sharing.copy.audienceQuestion")}</h3>
    <div className="copy-format-choices" role="group" aria-label={t("sharing.copy.audience")}>
      <button type="button" aria-pressed={audience === "owner"} onClick={() => setAudience("owner")}><FileText size={34} /><span>{t("sharing.copy.forMe")}</span></button>
      <button type="button" aria-pressed={audience === "recipient"} onClick={() => setAudience("recipient")}><Users size={34} /><span>{t("sharing.copy.forPerson")}</span></button>
    </div>
    {audience === "owner" && <p className="matter-form-hint">{t("sharing.copy.ownerHint")}</p>}
    {audience === "recipient" && <><label className="field-label">{t("sharing.copy.connectedRequired")}<select aria-label={t("sharing.copy.connectedPerson")} value={recipientId} onChange={event => setRecipientId(event.target.value)}><option value="">{t("sharing.copy.choosePerson")}</option>{recipients.map(person => <option key={person.publicId} value={person.publicId}>{person.personName}</option>)}</select></label>{recipientError && <p role="alert">{sharingMessage(recipientError, t, translateError)}</p>}{!recipientError && recipients.length === 0 && <p>{t("sharing.copy.noPeople")}</p>}<p className="matter-form-hint">{t("sharing.copy.recipientBoundary")}</p></>}
    {errorMessage}
    <button className="primary-button drawer-primary" disabled={busyAction !== null || !audience || (audience === "recipient" && !recipientId)} onClick={() => void createPreview()}>{busyAction === "preview" ? t("sharing.copy.preparingPreview") : t("sharing.copy.reviewCopy")}<Eye size={20} aria-hidden="true" /></button>
    <details className="task-details"><summary><Info size={18} aria-hidden="true" /> {t("sharing.copy.previewOnly")}</summary><p>{t("sharing.copy.previewBoundary")}</p></details>
  </div>;

  return <div className="start-here-panel" data-copy-format={format}>
    {confirmation}
    <PanelTabs items={[["review", t("sharing.copy.review")], ["format", t("sharing.copy.format")], ["save", t("sharing.copy.save")]]} selected={step} onSelect={(value) => { if (!busyAction) setStep(value); }} label={t("sharing.copy.stage")} />
    {errorMessage}
    {step === "review" && <>
      <div className="start-here-status"><Eye size={20} aria-hidden="true" />{preview.package.audience?.kind === "recipient" ? t("sharing.copy.forName", { name: preview.package.audience.name }) : t("sharing.copy.personalDirections")}</div>
      <p>{t("sharing.copy.matterCount", { count: preview.package.matters.length })}</p>
      {preview.package.matters.map((matter) => <details className="task-details" key={matter.publicId}><summary>{matter.title}</summary><dl className="export-preview-fields"><dt>{t("sharing.common.type")}</dt><dd>{sharedCategoryLabel(matter.category, t)}</dd>{matter.institutionName && <><dt>{t("sharing.common.provider")}</dt><dd>{matter.institutionName}</dd></>}{matter.locationHint && <><dt>{t("sharing.common.location")}</dt><dd>{matter.locationHint}</dd></>}{matter.desiredOutcome && <><dt>{t("sharing.common.wishes")}</dt><dd>{sharedFieldValue("desiredOutcome", matter.desiredOutcome, t)}</dd></>}{!matter.desiredOutcome && <><dt>{t("sharing.common.access")}</dt><dd>{t("sharing.common.nameOnly")}</dd></>}</dl></details>)}
      {preview.package.trustedContacts.length > 0 && <details className="task-details"><summary>{t("sharing.copy.peopleCount", { count: preview.package.trustedContacts.length })}</summary>{preview.package.trustedContacts.map((contact, index) => <div className="start-here-preview-row" key={index}><strong>{contact.displayName}</strong><span>{contact.relationshipLabel}</span></div>)}</details>}
      <button className="primary-button drawer-primary" onClick={() => setStep("format")}>{t("sharing.copy.chooseFormat")} <ArrowIcon /></button>
      <button className="text-button" onClick={async () => { if (encryptedResult && !recoverySaved && !await confirm({titleKey:"sharing.copy.keepKeyTitle",messageKey:"sharing.copy.changeAudienceBody",confirmLabelKey:"sharing.copy.changeAudience",cancelLabelKey:"sharing.copy.keepCopy"})) return;setPreview(null);setArtifact(null);setEncryptedResult(null);setError(""); }}>{t("sharing.copy.changeWho")}</button>
      <details className="task-details"><summary>{t("sharing.copy.previewDetails")}</summary><p>{t("sharing.copy.expiry", { date: preview.export.expiresAt ? formatDate(preview.export.expiresAt, { hour: "numeric", minute: "2-digit" }) : t("sharing.copy.soon") })}</p><button className="secondary-button" disabled={busyAction !== null} onClick={() => void createPreview()}>{t("sharing.copy.refreshPreview")}</button></details>
    </>}
    {step === "format" && <>
      {artwork}
      <div className="copy-format-choices" role="group" aria-label={t("sharing.copy.formatLabel")}>
        <button type="button" aria-pressed={format === "printable"} disabled={Boolean(busyAction)} onClick={() => chooseFormat("printable")}><Printer size={34} aria-hidden="true" /><span>{t("sharing.copy.printable")}</span></button>
        <button type="button" aria-pressed={format === "encrypted"} disabled={Boolean(busyAction)} onClick={() => chooseFormat("encrypted")}><LockKey size={34} aria-hidden="true" /><span>{t("sharing.copy.encrypted")}</span></button>
      </div>
      <button className="primary-button drawer-primary" onClick={() => setStep("save")}>{t("sharing.copy.continue")} <ArrowIcon /></button>
    </>}
    {step === "save" && format === "printable" && <>
      <h3>{t("sharing.copy.printableGuide")}</h3>
      {!artifact && <div className="start-here-acknowledgements">
        <label><input type="checkbox" checked={acknowledgesPlaintext} onChange={(event) => setAcknowledgesPlaintext(event.target.checked)} /><span>{t("sharing.copy.plaintextAck")}</span></label>
        <label><input type="checkbox" checked={acknowledgesNoRevocation} onChange={(event) => setAcknowledgesNoRevocation(event.target.checked)} /><span>{t("sharing.copy.irrevocableAck")}</span></label>
      </div>}
      {artifact ? <><p className="start-here-complete" role="status">{t("sharing.copy.guideReady")}</p><button className="primary-button drawer-primary" onClick={() => downloadArtifact(artifact.blob, artifact.filename)}>{t("sharing.copy.downloadGuide")} <DownloadSimple size={20} /></button></>
        : <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesPlaintext || !acknowledgesNoRevocation} onClick={() => void createPrintable()}>{busyAction === "printable" ? t("sharing.copy.preparingGuide") : t("sharing.copy.downloadPrintable")}<DownloadSimple size={20} /></button>}
      <details className="task-details"><summary>{t("sharing.copy.included")}</summary><p>{t("sharing.copy.plaintextBoundary")}</p></details>
    </>}
    {step === "save" && format === "encrypted" && <>
      <h3>{t("sharing.copy.encryptedPackage")}</h3>
      {!encryptedResult ? <>
        <div className="start-here-acknowledgements">
          <label><input type="checkbox" checked={acknowledgesRecoveryRisk} onChange={(event) => setAcknowledgesRecoveryRisk(event.target.checked)} /><span>{t("sharing.copy.recoveryAck")}</span></label>
          <label><input type="checkbox" checked={acknowledgesEncryptedCopies} onChange={(event) => setAcknowledgesEncryptedCopies(event.target.checked)} /><span>{t("sharing.copy.externalCopyAck")}</span></label>
        </div>
        <button className="primary-button drawer-primary" disabled={busyAction !== null || !acknowledgesRecoveryRisk || !acknowledgesEncryptedCopies} onClick={() => void createEncrypted()}>{busyAction === "encrypted" ? t("sharing.copy.encrypting") : t("sharing.copy.createEncrypted")}<ShieldCheck size={20} /></button>
      </> : <>
        <p className="start-here-complete" role="status"><CheckCircle size={18} />{t("sharing.copy.encryptedReady")}</p>
        {encryptedResult.finalized.recipientKeyCount === 0 && <p>{t("sharing.copy.keyOnly")}</p>}
        <button className="primary-button drawer-primary" onClick={() => downloadJson(encryptedResult.recoveryKit, `rillora-recovery-${encryptedResult.finalized.publicId}.json`)}>{t("sharing.copy.downloadKey")} <Key size={20} /></button>
        <button className="secondary-button" onClick={() => downloadJson(encryptedResult.artifact, `rillora-encrypted-start-here-${encryptedResult.finalized.publicId}.json`)}>{t("sharing.copy.downloadPackage")} <DownloadSimple size={20} /></button>
        <div className="start-here-acknowledgements"><label><input type="checkbox" checked={recoverySaved} onChange={(event) => setRecoverySaved(event.target.checked)} /><span>{t("sharing.copy.keySavedAck")}</span></label></div>
      </>}
      <details className="task-details"><summary>{t("sharing.copy.aboutEncryption")}</summary><p>{t("sharing.copy.keyBoundary")}</p><p>{t("sharing.copy.encryptionBoundary")}</p></details>
    </>}
    {showDiagnostics && step === "save" && (<section className="start-here-encrypted" aria-labelledby="recipient-rehearsal-title">
        <div className="start-here-status"><ShieldCheck size={20} weight="fill" /> <span id="recipient-rehearsal-title">{t("sharing.diagnostics.title")}</span></div>
        <p className="drawer-intro">{t("sharing.diagnostics.body")}</p>
        {!rehearsalResult ? (
          <>
            <label className="field-label" htmlFor="recipient-rehearsal-contact">{t("sharing.diagnostics.contact")}</label>
            <select
              id="recipient-rehearsal-contact"
              value={selectedRehearsalContact}
              onChange={(event) => setSelectedRehearsalContact(event.target.value)}
              disabled={busyAction !== null}
            >
              {rehearsalContacts.length === 0 && <option value="">{t("sharing.diagnostics.addContact")}</option>}
              {rehearsalContacts.map((contact) => (
                <option value={contact.publicId} key={contact.publicId}>{contact.displayName}</option>
              ))}
            </select>
            <button className="primary-button drawer-primary" disabled={busyAction !== null || !selectedRehearsalContact} onClick={() => void runRecipientRehearsal()}>
              {busyAction === "rehearsal" ? t("sharing.diagnostics.running") : t("sharing.diagnostics.run")} {busyAction !== "rehearsal" && <ShieldCheck size={20} />}
            </button>
          </>
        ) : (
          <div className="start-here-encrypted-result">
            <p className="start-here-complete" role="status"><CheckCircle size={18} weight="fill" /> {t("sharing.diagnostics.passed", { count: rehearsalResult.decryptedMatterCount })}</p>
            <p className="drawer-intro">{t("sharing.diagnostics.revocationBody")}</p>
            <button className="secondary-button" disabled={busyAction !== null || rehearsalResult.revoked} onClick={() => void revokeRehearsalKey()}>
              {rehearsalResult.revoked ? t("sharing.diagnostics.revoked") : busyAction === "revoke-rehearsal-key" ? t("sharing.diagnostics.revoking") : t("sharing.diagnostics.revoke")}
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

function messageFor(error, key) {
  return { cause: error, key };
}
