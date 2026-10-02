import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ArrowRight, Check, FileText, Info, Shield, ShieldCheck, Trash, UserCircle, WarningCircle } from "@phosphor-icons/react";
import { ApiClientError } from "./api.js";
import { useConfirmation } from "./ConfirmationDialog.jsx";

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
  onDirtyChange,
  onBusyChange,
}) {
  const [assignments, setAssignments] = useState([]);
  const [selectedMatterId, setSelectedMatterId] = useState(initialMatterId ?? matters[0]?.id ?? "");
  const [personPublicId, setPersonPublicId] = useState(contacts[0]?.publicId ?? "");
  const [role, setRole] = useState("executor");
  const [scope, setScope] = useState(initialMatterId ? "matter_specific" : "plan_wide");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [dirtyRows, setDirtyRows] = useState(() => new Set());
  const { confirm, confirmation } = useConfirmation();
  const markDirty = useCallback((id, dirty) => setDirtyRows((current) => {
    if (current.has(id) === dirty) return current;
    const next = new Set(current); if (dirty) next.add(id); else next.delete(id); return next;
  }), []);
  useLayoutEffect(() => onDirtyChange?.(dirtyRows.size > 0), [dirtyRows, onDirtyChange]);
  useLayoutEffect(() => onBusyChange?.(busy !== ""), [busy, onBusyChange]);

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
    const confirmed = await confirm({ title: "Revoke this role?", message: assignment.evidence === "record_only"
      ? "Only this Rillora record changes. External accounts and legal status stay separate."
      : "This removes the Rillora role and invitation evidence. External authority and accounts stay separate.", confirmLabel: "Revoke role", cancelLabel: "Keep role" });
    if (!confirmed) return;
    setBusy(assignment.publicId);
    setError("");
    try {
      const response = await apiClient.revokeRoleAssignment(assignment.publicId, assignment.version);
      markDirty(assignment.publicId, false);
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
      {confirmation}
      <div className="relationship-preview" aria-hidden="true"><span><UserCircle size={36} />{contacts.find((person) => person.publicId === personPublicId)?.displayName ?? "Person"}</span><ArrowRight size={18} /><span key={role}><Shield size={36} />{roleLabels[role]}</span><ArrowRight size={18} /><span key={`${scope}:${selectedMatterId}`}><FileText size={36} />{scope === "plan_wide" ? "Whole plan" : matters.find((matter) => matter.id === selectedMatterId)?.label ?? "Scope"}</span></div>
      <label className="field-label">Matter<select value={selectedMatterId} disabled={busy !== ""} onChange={async (event) => {
        const nextMatter = event.target.value;
        if (dirtyRows.size > 0 && !await confirm({ title: "Discard role changes?" })) return;
        setDirtyRows(new Set()); setSelectedMatterId(nextMatter);
      }}>{matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.label}</option>)}</select></label>
      <section className="role-policy-section" aria-labelledby="role-policy-add-title">
        <h3 id="role-policy-add-title" className="sr-only">Add role</h3>
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
        <h3 id="role-policy-active-title">Existing roles</h3>
        {loading ? <p className="rehearsal-caption">Loading role policy…</p> : visibleAssignments.length ? (
          <div className="role-assignment-list">
            {visibleAssignments.map((assignment) => (
              <AssignmentRow
                key={`${selectedMatterId}:${assignment.publicId}:${assignment.version}`}
                assignment={assignment}
                matters={matters}
                disabled={busy !== ""}
                onSave={updateAssignment}
                onRevoke={revokeAssignment}
                onDirtyChange={markDirty}
              />
            ))}
          </div>
        ) : <p className="rehearsal-caption">No active role applies to this matter yet.</p>}
      </section>

      <details className="task-details"><summary><Info size={18} aria-hidden="true" /> Record only</summary><p>No invitation or account access is created. Event, identity, authority and field checks remain separate.</p></details>
      {error && <p className="start-here-error" role="alert"><WarningCircle size={18} /> {error}</p>}
    </div>
  );
}

function AssignmentRow({ assignment, matters, disabled, onSave, onRevoke, onDirtyChange }) {
  const [draft, setDraft] = useState({
    role: assignment.role,
    scope: assignment.scope,
    matterPublicId: assignment.matter?.publicId ?? matters[0]?.id ?? "",
  });
  const changed = draft.role !== assignment.role
    || draft.scope !== assignment.scope
    || (draft.scope === "matter_specific" && draft.matterPublicId !== assignment.matter?.publicId);

  useLayoutEffect(() => onDirtyChange(assignment.publicId, assignment.editable && changed), [assignment.publicId, assignment.editable, changed, onDirtyChange]);

  function setRole(value) {
    setDraft((current) => ({
      ...current,
      role: value,
      scope: value === "recipient" ? "matter_specific" : current.scope,
    }));
  }

  if (!assignment.editable) {
    return (
      <details className="role-assignment-row is-locked">
        <summary><strong>{assignment.person.displayName}</strong><span>{evidenceLabels[assignment.evidence]}</span></summary>
        <p>{roleLabels[assignment.role]} · {scopeLabel(assignment)}</p>
        <p className="rehearsal-caption">Invitation evidence is read-only.</p>
        <button className="text-button danger-text" disabled={disabled} onClick={() => void onRevoke(assignment)}><Trash size={17} /> Revoke role</button>
      </details>
    );
  }

  return (
    <details className="role-assignment-row">
      <summary><strong>{assignment.person.displayName}</strong><span>{roleLabels[assignment.role]} · {scopeLabel(assignment)}</span></summary>
      <div className="role-assignment-fields">
        <label>Role<select value={draft.role} disabled={disabled} onChange={(event) => setRole(event.target.value)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Scope<select value={draft.scope} disabled={disabled || draft.role === "recipient"} onChange={(event) => setDraft((current) => ({ ...current, scope: event.target.value }))}><option value="plan_wide">Whole plan</option><option value="matter_specific">One matter</option></select></label>
        {draft.scope === "matter_specific" && <label>Matter<select value={draft.matterPublicId} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, matterPublicId: event.target.value }))}>{matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.label}</option>)}</select></label>}
      </div>
      <div className="role-assignment-actions">
        <button className="secondary-button" disabled={disabled || !changed || (draft.scope === "matter_specific" && !draft.matterPublicId)} onClick={() => void onSave(assignment, draft)}>Save role</button>
        <button className="text-button danger-text" disabled={disabled} onClick={() => void onRevoke(assignment)}><Trash size={17} /> Revoke</button>
      </div>
    </details>
  );
}

function scopeLabel(assignment) {
  return assignment.scope === "plan_wide" ? "whole plan" : assignment.matter?.title ?? "one matter";
}

function changeMessage(invalidatedCount) {
  return invalidatedCount > 0
    ? "Role saved · earlier rehearsals are stale"
    : "Role saved";
}

function messageFor(error, fallback) {
  return error instanceof ApiClientError ? error.message : fallback;
}
