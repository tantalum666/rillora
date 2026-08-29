import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Info, ShieldCheck, Trash, WarningCircle } from "@phosphor-icons/react";
import { ApiClientError } from "./api.js";

const roleLabels = {
  trusted_contact: "Trusted contact",
  executor: "Executor record",
  recipient: "Matter recipient",
};

const evidenceLabels = {
  record_only: "Record only",
  simulation: "Simulated acceptance",
  invitation_pending: "Invitation pending",
  invitation_accepted: "Invitation accepted",
};

export function RoleAssignmentPolicyPanel({
  apiClient,
  contacts,
  matters,
  initialMatterId = null,
  onChanged,
}) {
  const [assignments, setAssignments] = useState([]);
  const [selectedMatterId, setSelectedMatterId] = useState(initialMatterId ?? matters[0]?.id ?? "");
  const [personPublicId, setPersonPublicId] = useState(contacts[0]?.publicId ?? "");
  const [role, setRole] = useState("executor");
  const [scope, setScope] = useState(initialMatterId ? "matter_specific" : "plan_wide");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.getRoleAssignments();
      setAssignments(response.roleAssignments);
    } catch (caught) {
      setError(messageFor(caught, "Role policy could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => { void loadAssignments(); }, [loadAssignments]);

  const visibleAssignments = useMemo(() => assignments.filter((assignment) => (
    assignment.scope === "plan_wide" || assignment.matter?.publicId === selectedMatterId
  )), [assignments, selectedMatterId]);

  async function createAssignment() {
    if (!personPublicId || (scope === "matter_specific" && !selectedMatterId)) return;
    setBusy("create");
    setError("");
    try {
      const response = await apiClient.createRoleAssignment({
        personPublicId,
        role,
        scope,
        matterPublicId: scope === "matter_specific" ? selectedMatterId : null,
      });
      await loadAssignments();
      await onChanged?.(changeMessage(response.invalidatedDisclosureRehearsalCount));
    } catch (caught) {
      setError(messageFor(caught, "The role record could not be created."));
    } finally {
      setBusy("");
    }
  }

  async function updateAssignment(assignment, draft) {
    setBusy(assignment.publicId);
    setError("");
    try {
      const response = await apiClient.updateRoleAssignment(assignment.publicId, {
        expectedVersion: assignment.version,
        role: draft.role,
        scope: draft.scope,
        matterPublicId: draft.scope === "matter_specific" ? draft.matterPublicId : null,
      });
      await loadAssignments();
      await onChanged?.(changeMessage(response.invalidatedDisclosureRehearsalCount));
    } catch (caught) {
      setError(messageFor(caught, "The role record could not be updated."));
    } finally {
      setBusy("");
    }
  }

  async function revokeAssignment(assignment) {
    const confirmed = window.confirm(
      assignment.evidence === "record_only"
        ? "Revoke this Rillora role record? No external account or legal status will change."
        : "Revoke this role and its current Rillora invitation evidence? External authority and accounts are not changed.",
    );
    if (!confirmed) return;
    setBusy(assignment.publicId);
    setError("");
    try {
      const response = await apiClient.revokeRoleAssignment(assignment.publicId, assignment.version);
      await loadAssignments();
      await onChanged?.(changeMessage(response.invalidatedDisclosureRehearsalCount));
    } catch (caught) {
      setError(messageFor(caught, "The role record could not be revoked."));
    } finally {
      setBusy("");
    }
  }

  function changeRole(value) {
    setRole(value);
    if (value === "recipient") setScope("matter_specific");
  }

  return (
    <div className="role-policy-editor">
      <p className="drawer-intro">Assign a person to the whole plan or one matter. This saves a Rillora policy record only—it sends no invitation, verifies no identity, and grants no access, ownership, recovery right, or legal authority.</p>
      <div className="drawer-safety"><ShieldCheck size={19} /> Field visibility remains controlled by the locked death, incapacity, and missing-person policy. A role cannot expand its own fields.</div>

      <section className="role-policy-section" aria-labelledby="role-policy-coverage-title">
        <h3 id="role-policy-coverage-title">Matter coverage</h3>
        <div className="role-coverage-grid">
          {matters.map((matter) => {
            const covered = assignments.filter((assignment) => (
              assignment.scope === "plan_wide" || assignment.matter?.publicId === matter.id
            ));
            return (
              <button
                key={matter.id}
                className={selectedMatterId === matter.id ? "is-selected" : ""}
                onClick={() => setSelectedMatterId(matter.id)}
              >
                <strong>{matter.label}</strong>
                <span>{covered.length} active role{covered.length === 1 ? "" : "s"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="role-policy-section" aria-labelledby="role-policy-add-title">
        <h3 id="role-policy-add-title">Add a record-only role</h3>
        {contacts.length === 0 || matters.length === 0 ? (
          <p className="rehearsal-caption">Add an active person record and matter before assigning a role.</p>
        ) : (
          <div className="role-policy-form">
            <label className="field-label">Person<select value={personPublicId} disabled={busy !== ""} onChange={(event) => setPersonPublicId(event.target.value)}>{contacts.map((contact) => <option key={contact.publicId} value={contact.publicId}>{contact.displayName}</option>)}</select></label>
            <label className="field-label">Role<select value={role} disabled={busy !== ""} onChange={(event) => changeRole(event.target.value)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="field-label">Scope<select value={scope} disabled={busy !== "" || role === "recipient"} onChange={(event) => setScope(event.target.value)}><option value="plan_wide">Whole plan</option><option value="matter_specific">Selected matter</option></select></label>
            {scope === "matter_specific" && <p className="role-policy-target"><Info size={16} /> {matters.find((matter) => matter.id === selectedMatterId)?.label ?? "Select a matter above"}</p>}
            <button className="primary-button" disabled={busy !== "" || !personPublicId || (scope === "matter_specific" && !selectedMatterId)} onClick={() => void createAssignment()}>{busy === "create" ? "Saving…" : "Add role record"} {busy !== "create" && <Check size={18} />}</button>
          </div>
        )}
      </section>

      <section className="role-policy-section" aria-labelledby="role-policy-active-title">
        <h3 id="role-policy-active-title">Roles affecting this matter</h3>
        {loading ? <p className="rehearsal-caption">Loading role policy…</p> : visibleAssignments.length ? (
          <div className="role-assignment-list">
            {visibleAssignments.map((assignment) => (
              <AssignmentRow
                key={assignment.publicId}
                assignment={assignment}
                matters={matters}
                disabled={busy !== ""}
                onSave={updateAssignment}
                onRevoke={revokeAssignment}
              />
            ))}
          </div>
        ) : <p className="rehearsal-caption">No active role applies to this matter yet.</p>}
      </section>

      {error && <p className="start-here-error" role="alert"><WarningCircle size={18} /> {error}</p>}
    </div>
  );
}

function AssignmentRow({ assignment, matters, disabled, onSave, onRevoke }) {
  const [draft, setDraft] = useState({
    role: assignment.role,
    scope: assignment.scope,
    matterPublicId: assignment.matter?.publicId ?? matters[0]?.id ?? "",
  });
  const changed = draft.role !== assignment.role
    || draft.scope !== assignment.scope
    || (draft.scope === "matter_specific" && draft.matterPublicId !== assignment.matter?.publicId);

  function setRole(value) {
    setDraft((current) => ({
      ...current,
      role: value,
      scope: value === "recipient" ? "matter_specific" : current.scope,
    }));
  }

  if (!assignment.editable) {
    return (
      <article className="role-assignment-row is-locked">
        <header><strong>{assignment.person.displayName}</strong><span>{evidenceLabels[assignment.evidence]}</span></header>
        <p>{roleLabels[assignment.role]} · {scopeLabel(assignment)}</p>
        <p className="rehearsal-caption">Invitation-backed evidence is displayed separately and cannot be repurposed as another role.</p>
        <button className="text-button danger-text" disabled={disabled} onClick={() => void onRevoke(assignment)}><Trash size={17} /> Revoke role</button>
      </article>
    );
  }

  return (
    <article className="role-assignment-row">
      <header><strong>{assignment.person.displayName}</strong><span>Record only</span></header>
      <div className="role-assignment-fields">
        <label>Role<select value={draft.role} disabled={disabled} onChange={(event) => setRole(event.target.value)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Scope<select value={draft.scope} disabled={disabled || draft.role === "recipient"} onChange={(event) => setDraft((current) => ({ ...current, scope: event.target.value }))}><option value="plan_wide">Whole plan</option><option value="matter_specific">One matter</option></select></label>
        {draft.scope === "matter_specific" && <label>Matter<select value={draft.matterPublicId} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, matterPublicId: event.target.value }))}>{matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.label}</option>)}</select></label>}
      </div>
      <div className="role-assignment-actions">
        <button className="secondary-button" disabled={disabled || !changed || (draft.scope === "matter_specific" && !draft.matterPublicId)} onClick={() => void onSave(assignment, draft)}>Save role</button>
        <button className="text-button danger-text" disabled={disabled} onClick={() => void onRevoke(assignment)}><Trash size={17} /> Revoke</button>
      </div>
    </article>
  );
}

function scopeLabel(assignment) {
  return assignment.scope === "plan_wide" ? "whole plan" : assignment.matter?.title ?? "one matter";
}

function changeMessage(invalidatedCount) {
  return invalidatedCount > 0
    ? "Role policy saved. Earlier disclosure rehearsals are now marked stale; no invitation or release occurred."
    : "Role policy saved. No invitation, authority, or release was created.";
}

function messageFor(error, fallback) {
  return error instanceof ApiClientError ? error.message : fallback;
}
