import { sharingMessage, sharedFieldLabels } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ArrowRight,
  Broadcast,
  FirstAidKit,
  HeartBreak,
  Eye,
  Check,
  CheckCircle,
  Circle,
  Info,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";

const lifeEvents = [
  { value: "death", label: "sharing.rehearsal.death", icon: HeartBreak, detail: "sharing.rehearsal.deathDetail" },
  { value: "incapacity", label: "sharing.rehearsal.incapacity", icon: FirstAidKit, detail: "sharing.rehearsal.incapacityDetail" },
  { value: "missing", label: "sharing.rehearsal.missing", icon: Broadcast, detail: "sharing.rehearsal.missingDetail" },
];

const roleLabels = {
  trusted_contact: "sharing.role.trustedContact",
  executor: "sharing.role.executor",
  recipient: "sharing.role.recipient",
};

const actionLabels = {
  advance: "sharing.rehearsal.advance",
  simulate_cooling_off_elapsed: "sharing.rehearsal.elapsed",
  appeal: "sharing.rehearsal.appeal",
  restart_review: "sharing.rehearsal.restart",
  cancel: "sharing.rehearsal.cancel",
};

export function DisclosureRehearsalPanel({ apiClient, onChanged, onBusyChange }) {
  const { t, formatDate, errorMessage } = useI18n();
  const [lifeEvent, setLifeEvent] = useState("death");
  const [rehearsal, setRehearsal] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");

  useLayoutEffect(() => onBusyChange?.(busyAction !== null), [busyAction, onBusyChange]);

  useEffect(() => {
    let active = true;
    void apiClient.getDisclosureRehearsals()
      .then((response) => {
        if (!active) return;
        const latest = response.disclosureRehearsals?.[0] ?? null;
        setRehearsal(latest);
        if (latest) setLifeEvent(latest.lifeEvent);
      })
      .catch((caught) => {
        if (active) setError(messageFor(caught, "sharing.rehearsal.loadError"));
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => { active = false; };
  }, [apiClient]);

  async function createRehearsal() {
    setBusyAction("create");
    setError("");
    try {
      const response = await apiClient.createDisclosureRehearsal(lifeEvent);
      setRehearsal(response.disclosureRehearsal);
      await onChanged?.({ key: "sharing.rehearsal.created" });
    } catch (caught) {
      setError(messageFor(caught, "sharing.rehearsal.createError"));
    } finally {
      setBusyAction(null);
    }
  }

  async function performAction(action) {
    if (!rehearsal) return;
    setBusyAction(action);
    setError("");
    try {
      const response = await apiClient.updateDisclosureRehearsal(
        rehearsal.publicId,
        rehearsal.version,
        action,
      );
      setRehearsal(response.disclosureRehearsal);
      await onChanged?.({ key: "sharing.rehearsal.updated" });
    } catch (caught) {
      setError(messageFor(caught, "sharing.rehearsal.updateError"));
    } finally {
      setBusyAction(null);
    }
  }

  if (loadingHistory) {
    return <p className="drawer-intro" role="status">{t("sharing.rehearsal.loading")}</p>;
  }

  if (!rehearsal) {
    return (
      <div className="disclosure-rehearsal">
        <div className="life-event-choices" role="group" aria-label={t("sharing.rehearsal.lifeEvent")}>
          {lifeEvents.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={lifeEvent === value} disabled={busyAction !== null} onClick={() => setLifeEvent(value)}><Icon size={34} aria-hidden="true" /><span>{t(label)}</span></button>)}
        </div>
        {error && <ErrorMessage>{sharingMessage(error, t, errorMessage)}</ErrorMessage>}
        <button className="primary-button drawer-primary" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
          {busyAction === "create" ? t("sharing.rehearsal.creating") : t("sharing.rehearsal.previewAccess")}
          {busyAction !== "create" && <ArrowRight size={20} />}
        </button>
        <details className="task-details"><summary><Info size={18} aria-hidden="true" /> {t("sharing.rehearsal.simulationOnly")}</summary><p>{t(lifeEvents.find((event) => event.value === lifeEvent)?.detail)}</p><p>{t("sharing.rehearsal.boundary")}</p></details>
      </div>
    );
  }

  const completedCodes = new Set(rehearsal.completedCheckpoints.map((checkpoint) => checkpoint.code));
  const eventLabel = t(lifeEvents.find((event) => event.value === rehearsal.lifeEvent)?.label ?? rehearsal.lifeEvent);

  return (
    <div className="disclosure-rehearsal">
      <div className="rehearsal-current-state"><Eye size={46} aria-hidden="true" /><h3 lang="en">{rehearsal.stateLabel}</h3><span>{t("sharing.rehearsal.eventSimulation", { event: eventLabel })}</span><p className="rehearsal-caption">{t("sharing.rehearsal.sourceLanguage")}</p></div>
      {!rehearsal.snapshotFresh && (
        <div className="rehearsal-stale" role="alert">
          <WarningCircle size={20} weight="fill" />
          <span><strong>{t("sharing.rehearsal.stale")}</strong> {t("sharing.rehearsal.freshHint")}</span>
          <button className="primary-button" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
            {busyAction === "create" ? t("sharing.rehearsal.creatingFresh") : t("sharing.rehearsal.createFresh")}
          </button>
        </div>
      )}

      <div className="rehearsal-actions">
        {rehearsal.availableActions.map((action) => (
          <button
            key={action}
            className={action === "advance" || action === "simulate_cooling_off_elapsed" || action === "restart_review" ? "primary-button" : "secondary-button"}
            disabled={busyAction !== null}
            onClick={() => void performAction(action)}
          >
            {busyAction === action ? t("sharing.rehearsal.updating") : t(actionLabels[action])}
            {busyAction !== action && action !== "cancel" && <ArrowRight size={18} />}
          </button>
        ))}
        <button className="text-button" disabled={busyAction !== null} onClick={() => { setRehearsal(null); setError(""); }}> {t("sharing.rehearsal.separate")} </button>
      </div>

      <details className="task-details">
        <summary>{t("sharing.rehearsal.path")}</summary>
        <ol className="rehearsal-timeline">
          {rehearsal.stateSequence.map((state) => {
            const complete = completedCodes.has(state.key);
            const current = rehearsal.state === state.key;
            return (
              <li key={state.key} className={current ? "is-current" : complete ? "is-complete" : ""} aria-current={current ? "step" : undefined}>
                {complete ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                <span lang="en">{state.label}</span>
              </li>
            );
          })}
        </ol>
        {!rehearsal.stateSequence.some((state) => state.key === rehearsal.state) && (
          <p className="rehearsal-exception"><WarningCircle size={18} /> {t("sharing.rehearsal.currentState")} <span lang="en">{rehearsal.stateLabel}</span></p>
        )}
        {rehearsal.coolingOffEndsAt && !rehearsal.coolingOffSimulatedAt && (
          <p className="rehearsal-caption">{t("sharing.rehearsal.holdEnd", { date: formatDate(rehearsal.coolingOffEndsAt, { dateStyle: "medium", timeStyle: "short" }) })}</p>
        )}
      </details>

      <section className="rehearsal-section" aria-labelledby="role-preview-title">
        <h3 id="role-preview-title">{t("sharing.rehearsal.views")}</h3>
        <div className="role-preview-list">
          {rehearsal.projectedRoleViews.map((view) => (
            <RolePreview key={view.role} view={view} />
          ))}
        </div>
      </section>

      {error && <ErrorMessage>{sharingMessage(error, t, errorMessage)}</ErrorMessage>}

    </div>
  );
}

function RolePreview({ view }) {
  const { t } = useI18n();
  return (
    <details className={`role-preview ${view.eligibleForProjectedPreview ? "is-eligible" : ""}`}>
      <summary><strong>{roleLabels[view.role] ? t(roleLabels[view.role]) : view.role}</strong><span lang="en">{view.previewStage}</span></summary>
      <p lang="en">{view.reason}</p>
      {view.assignedPeople.length > 0 && (
        <p className="role-people">{view.assignedPeople.map((person) => `${person.displayName} · ${evidenceLabel(person.invitationEvidence, t)}`).join(", ")}</p>
      )}
      {view.fieldPolicy.length > 0 && (
        <div className="role-fields" aria-label={t("sharing.rehearsal.allowedFields")}>
          {view.fieldPolicy.map((field) => <span key={field}>{fieldLabel(field, t)}</span>)}
        </div>
      )}
      {view.matters.map((matter, index) => (
        <dl className="role-matter" key={`${view.role}-${index}`}>
          {Object.entries(matter).map(([key, value]) => value ? (
            <div key={key}><dt>{fieldLabel(key, t)}</dt><dd>{value}</dd></div>
          ) : null)}
        </dl>
      ))}
      {view.summary.matterCount > 0 && view.matters.length === 0 && view.eligibleForProjectedPreview && (
        <p className="role-summary">{t("sharing.rehearsal.countOnly", { count: view.summary.matterCount })}</p>
      )}
    </details>
  );
}

function ErrorMessage({ children }) {
  return <p className="start-here-error" role="alert"><WarningCircle size={18} /> {children}</p>;
}

function messageFor(error, key) {
  return { cause: error, key };
}

function evidenceLabel(value, t) {
  return t({
    simulation: "sharing.role.simulated",
    real: "sharing.rehearsal.recordedEvidence",
    record_only: "sharing.role.recordOnly",
  }[value] ?? "sharing.role.recordOnly");
}

function fieldLabel(value, t) {
  const leaf = value.split(".").at(-1) ?? value;
  if (Object.hasOwn(sharedFieldLabels, leaf)) return t(`sharing.field.${leaf}`);
  if (leaf === "title") return t("sharing.rehearsal.titleField");
  if (leaf === "category") return t("forms.category");
  return leaf.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());
}
