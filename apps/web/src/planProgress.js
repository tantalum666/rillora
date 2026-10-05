const ready = (matter) => matter.recordStatus !== undefined
  ? matter.recordStatus === "ready"
  : matter.status === "ready" || matter.status === "added";

/** Organizing progress only: never treat these labels as verification or permissions. */
export function planProgress(matters) {
  const completed = matters.filter(ready).length;
  const total = Math.max(5, matters.length);
  const next = matters.find(matter => !ready(matter));
  const action = next ? { kind: "review", matter: next }
    : matters.length < total ? { kind: "add" } : { kind: "view" };
  return { completed, total, remaining: total - completed, action };
}
