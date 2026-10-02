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
import { ApiClientError } from "./api.js";

const lifeEvents = [
  { value: "death", label: "Death", icon: HeartBreak, detail: "Authority and death-document review" },
  { value: "incapacity", label: "Incapacity", icon: FirstAidKit, detail: "Capacity and acting-authority review" },
  { value: "missing", label: "Unreachable", icon: Broadcast, detail: "Limited support and contact-attempt review" },
];

const roleLabels = {
  trusted_contact: "Trusted contact",
  executor: "Executor record",
  recipient: "Matter recipient",
};

const actionLabels = {
  advance: "Advance simulated review",
  simulate_cooling_off_elapsed: "Simulate hold elapsed",
  appeal: "Place on appeal hold",
  restart_review: "Restart simulated review",
  cancel: "Cancel this rehearsal",
};

export function DisclosureRehearsalPanel({ apiClient, onChanged, onBusyChange }) {
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
        if (active) setError(messageFor(caught, "Earlier disclosure rehearsals could not be loaded."));
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
      await onChanged?.("Rehearsal created");
    } catch (caught) {
      setError(messageFor(caught, "The disclosure rehearsal could not be created."));
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
      await onChanged?.("Simulated step updated");
    } catch (caught) {
      setError(messageFor(caught, "The rehearsal state could not be updated."));
    } finally {
      setBusyAction(null);
    }
  }

  if (loadingHistory) {
    return <p className="drawer-intro" role="status">Loading the latest policy rehearsal…</p>;
  }

  if (!rehearsal) {
    return (
      <div className="disclosure-rehearsal">
        <div className="life-event-choices" role="group" aria-label="Life event">
          {lifeEvents.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={lifeEvent === value} disabled={busyAction !== null} onClick={() => setLifeEvent(value)}><Icon size={34} aria-hidden="true" /><span>{label}</span></button>)}
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button className="primary-button drawer-primary" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
          {busyAction === "create" ? "Creating rehearsal…" : "Preview role access"}
          {busyAction !== "create" && <ArrowRight size={20} />}
        </button>
        <details className="task-details"><summary><Info size={18} aria-hidden="true" /> Simulation only</summary><p>{lifeEvents.find((event) => event.value === lifeEvent)?.detail}</p><p>This preview verifies no evidence, contacts nobody and releases nothing. Cooling periods do not elapse automatically.</p></details>
      </div>
    );
  }

  const completedCodes = new Set(rehearsal.completedCheckpoints.map((checkpoint) => checkpoint.code));
  const eventLabel = lifeEvents.find((event) => event.value === rehearsal.lifeEvent)?.label ?? rehearsal.lifeEvent;

  return (
    <div className="disclosure-rehearsal">
      <div className="rehearsal-current-state"><Eye size={46} aria-hidden="true" /><h3>{rehearsal.stateLabel}</h3><span>{eventLabel} · simulation only</span></div>
      {!rehearsal.snapshotFresh && (
        <div className="rehearsal-stale" role="alert">
          <WarningCircle size={20} weight="fill" />
          <span><strong>This snapshot is stale.</strong> Start a fresh rehearsal to continue.</span>
          <button className="primary-button" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
            {busyAction === "create" ? "Creating fresh rehearsal…" : "Create fresh policy rehearsal"}
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
            {busyAction === action ? "Updating…" : actionLabels[action]}
            {busyAction !== action && action !== "cancel" && <ArrowRight size={18} />}
          </button>
        ))}
        <button className="text-button" disabled={busyAction !== null} onClick={() => { setRehearsal(null); setError(""); }}>
          Start a separate event rehearsal
        </button>
      </div>

      <details className="task-details">
        <summary>Policy path</summary>
        <ol className="rehearsal-timeline">
          {rehearsal.stateSequence.map((state) => {
            const complete = completedCodes.has(state.key);
            const current = rehearsal.state === state.key;
            return (
              <li key={state.key} className={current ? "is-current" : complete ? "is-complete" : ""} aria-current={current ? "step" : undefined}>
                {complete ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                <span>{state.label}</span>
              </li>
            );
          })}
        </ol>
        {!rehearsal.stateSequence.some((state) => state.key === rehearsal.state) && (
          <p className="rehearsal-exception"><WarningCircle size={18} /> Current state: {rehearsal.stateLabel}</p>
        )}
        {rehearsal.coolingOffEndsAt && !rehearsal.coolingOffSimulatedAt && (
          <p className="rehearsal-caption">Illustrative hold ends {formatDateTime(rehearsal.coolingOffEndsAt)}. It will not elapse automatically in this rehearsal.</p>
        )}
      </details>

      <section className="rehearsal-section" aria-labelledby="role-preview-title">
        <h3 id="role-preview-title">Projected role views</h3>
        <div className="role-preview-list">
          {rehearsal.projectedRoleViews.map((view) => (
            <RolePreview key={view.role} view={view} />
          ))}
        </div>
      </section>

      {error && <ErrorMessage>{error}</ErrorMessage>}

    </div>
  );
}

function RolePreview({ view }) {
  return (
    <details className={`role-preview ${view.eligibleForProjectedPreview ? "is-eligible" : ""}`}>
      <summary><strong>{roleLabels[view.role] ?? view.role}</strong><span>{view.previewStage}</span></summary>
      <p>{view.reason}</p>
      {view.assignedPeople.length > 0 && (
        <p className="role-people">{view.assignedPeople.map((person) => `${person.displayName} · ${evidenceLabel(person.invitationEvidence)}`).join(", ")}</p>
      )}
      {view.fieldPolicy.length > 0 && (
        <div className="role-fields" aria-label="Allowed fields">
          {view.fieldPolicy.map((field) => <span key={field}>{fieldLabel(field)}</span>)}
        </div>
      )}
      {view.matters.map((matter, index) => (
        <dl className="role-matter" key={`${view.role}-${index}`}>
          {Object.entries(matter).map(([key, value]) => value ? (
            <div key={key}><dt>{fieldLabel(key)}</dt><dd>{value}</dd></div>
          ) : null)}
        </dl>
      ))}
      {view.summary.matterCount > 0 && view.matters.length === 0 && view.eligibleForProjectedPreview && (
        <p className="role-summary">Matter count only: {view.summary.matterCount}</p>
      )}
    </details>
  );
}

function ErrorMessage({ children }) {
  return <p className="start-here-error" role="alert"><WarningCircle size={18} /> {children}</p>;
}

function messageFor(error, fallback) {
  return error instanceof ApiClientError ? error.message : fallback;
}

function evidenceLabel(value) {
  return {
    simulation: "simulated acceptance",
    real: "recorded invitation evidence",
    record_only: "record only",
  }[value] ?? "record only";
}

function fieldLabel(value) {
  const leaf = value.split(".").at(-1) ?? value;
  return leaf.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
