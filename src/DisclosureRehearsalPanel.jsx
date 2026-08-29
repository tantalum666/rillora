import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Circle,
  Info,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { ApiClientError } from "./api.js";

const lifeEvents = [
  { value: "death", label: "Death", detail: "Authority and death-document review" },
  { value: "incapacity", label: "Incapacity", detail: "Capacity and acting-authority review" },
  { value: "missing", label: "Missing", detail: "Limited support and contact-attempt review" },
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

export function DisclosureRehearsalPanel({ apiClient, onChanged }) {
  const [lifeEvent, setLifeEvent] = useState("death");
  const [rehearsal, setRehearsal] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");

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
      await onChanged?.("Disclosure-policy rehearsal created. No notification or release occurred.");
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
      await onChanged?.("Rehearsal state updated. No identity, document, or multi-party proof was verified.");
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
        <p className="drawer-intro">Choose one event to preview its own policy path and the exact safe fields each role could eventually see. This planner-only rehearsal cannot establish death, incapacity, identity, authority, or a right to receive data.</p>
        <label className="field-label" htmlFor="rehearsal-life-event">Life event</label>
        <select
          id="rehearsal-life-event"
          value={lifeEvent}
          disabled={busyAction !== null}
          onChange={(event) => setLifeEvent(event.target.value)}
        >
          {lifeEvents.map((event) => (
            <option key={event.value} value={event.value}>{event.label}</option>
          ))}
        </select>
        <p className="field-helper">{lifeEvents.find((event) => event.value === lifeEvent)?.detail}</p>
        <div className="drawer-safety"><ShieldCheck size={19} /> Three separate state machines. All cooling periods are illustrative policy values, not legal advice or elapsed real time.</div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button className="primary-button drawer-primary" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
          {busyAction === "create" ? "Creating rehearsal…" : "Create policy rehearsal"}
          {busyAction !== "create" && <ArrowRight size={20} />}
        </button>
      </div>
    );
  }

  const completedCodes = new Set(rehearsal.completedCheckpoints.map((checkpoint) => checkpoint.code));
  const eventLabel = lifeEvents.find((event) => event.value === rehearsal.lifeEvent)?.label ?? rehearsal.lifeEvent;

  return (
    <div className="disclosure-rehearsal">
      <div className="rehearsal-status"><ShieldCheck size={20} weight="fill" /><span><strong>{eventLabel} · simulation only</strong><small>{rehearsal.stateLabel}</small></span></div>
      <div className="rehearsal-boundaries" aria-label="Safety boundaries">
        <span><Check size={15} /> No notification</span>
        <span><Check size={15} /> No proof verified</span>
        <span><Check size={15} /> No release</span>
        <span><Check size={15} /> No authority granted</span>
      </div>
      {!rehearsal.snapshotFresh && (
        <div className="rehearsal-stale" role="alert">
          <WarningCircle size={20} weight="fill" />
          <span><strong>Policy changed after this snapshot.</strong> This frozen view remains history only and cannot advance. Create a fresh rehearsal to review the current roles and matters.</span>
          <button className="primary-button" disabled={busyAction !== null} onClick={() => void createRehearsal()}>
            {busyAction === "create" ? "Creating fresh rehearsal…" : "Create fresh policy rehearsal"}
          </button>
        </div>
      )}

      <section className="rehearsal-section" aria-labelledby="rehearsal-path-title">
        <h3 id="rehearsal-path-title">Illustrative policy path</h3>
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
      </section>

      <section className="rehearsal-section" aria-labelledby="role-preview-title">
        <h3 id="role-preview-title">Projected role views</h3>
        <p className="rehearsal-caption">Shown only to you. No role received these fields.</p>
        <div className="role-preview-list">
          {rehearsal.projectedRoleViews.map((view) => (
            <RolePreview key={view.role} view={view} />
          ))}
        </div>
      </section>

      {error && <ErrorMessage>{error}</ErrorMessage>}
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
    </div>
  );
}

function RolePreview({ view }) {
  return (
    <article className={`role-preview ${view.eligibleForProjectedPreview ? "is-eligible" : ""}`}>
      <header><strong>{roleLabels[view.role] ?? view.role}</strong><span>{view.previewStage}</span></header>
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
    </article>
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
