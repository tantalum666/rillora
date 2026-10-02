import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowClockwise, ArrowLeft, ArrowRight, CalendarCheck, Check, CheckCircle, Clock, FileText, PencilSimple, Users, X, ShareNetwork, Tray } from "@phosphor-icons/react";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import { isReviewResolved, reviewReasons, reviewTaskLabel, reviewShareUrl } from "./familyMaintenance.js";
import "./family-maintenance.css";
const dateLabel = value => value ? new Date(value).toLocaleDateString("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
}) : "Not scheduled";
const inputDate = value => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const pairKey = item => `${item.connectionPublicId}:${item.matterPublicId}`;
const taskIcon = task => isReviewResolved(task) ? CheckCircle : task.state === 'suggested' ? PencilSimple : Clock;
export function FamilyMaintenancePanel({
  apiClient,
  onChanged,
  onManageSharing,
  onDirtyChange,
  onBusyChange
}) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [dialog, setDialog] = useState(null),
    [tab, setTab] = useState('mine');
  const generation = useRef(0);
  const dialogOpen = useRef(false);
  const choseInbox = useRef(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const load = useCallback(async () => {
    const run = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const next = await apiClient.getFamilyMaintenance();
      if (run === generation.current) {
        if (!choseInbox.current) {
          const query = new URLSearchParams(window.location.search);
          if (query.get('next') === 'reviews' || query.get('inbox') === 'received' || next.incoming.some(t => t.roundState === 'open') && !next.rounds.some(r => r.state === 'open')) setTab('incoming');
          choseInbox.current = true;
        }
        setData(next);
        return next;
      }
    } catch (failure) {
      if (run === generation.current) {
        setError(failure.name === 'TypeError' ? 'Reviews could not be loaded. Check your connection and try again.' : failure.message || 'Reviews could not be loaded.');
        if (failure.status === 401) setData(null);
      }
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, [apiClient]);
  useEffect(() => {
    void load();
    const refresh = () => {
      if (!dialogOpen.current) void load();
    };
    window.addEventListener('focus', refresh);
    return () => {
      generation.current++;
      window.removeEventListener('focus', refresh);
    };
  }, [load]);
  const open = value => {
    dialogOpen.current = true;
    setDialog(value);
  };
  const close = () => {
    dialogOpen.current = false;
    setDialog(null);
  };
  async function saved(changedMap = false) {
    close();
    await load();
    if (changedMap) onChanged?.();
  }
  if (!data) return <div className="review-empty" role={error ? 'alert' : 'status'}><CalendarCheck size={54} /><p>{error || 'Loading reviews…'}</p>{error && <button className="secondary-button" onClick={() => void load()}>Retry</button>}</div>;
  const round = data.rounds.find(r => r.state === 'open');
  const tasks = round?.tasks ?? [];
  const resolved = tasks.filter(isReviewResolved).length;
  const incoming = data.incoming.filter(task => task.roundState === 'open');
  const due = data.settings.nextReviewAt && new Date(data.settings.nextReviewAt) <= new Date(data.serverTime);
  const shareUrl = reviewShareUrl(data.shareUrl);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({
        title: 'Rillora review',
        text: 'Please check the directions I shared with you.',
        url: shareUrl
      });else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
      }
    } catch (failure) {
      if (failure.name !== 'AbortError') setError('The review link could not be shared. Try again.');
    }
  };
  return <div className="family-review-panel">
    <div className="review-toolbar"><div className="panel-tabs" role="group" aria-label="Review inbox"><button aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>My plan</button><button aria-pressed={tab === 'incoming'} onClick={() => setTab('incoming')}>For me {incoming.length > 0 && <span className="review-counter">{incoming.length}</span>}</button></div><button className="icon-button" disabled={loading} aria-label="Refresh reviews" onClick={() => void load()}><ArrowClockwise size={22} /></button></div>
    {error && <p className="drawer-alert" role="alert">{error}</p>}
    {tab === 'mine' ? <>
      <div className="review-hero"><div className="review-ring" role="img" aria-label={round ? `${resolved} of ${tasks.length} checks resolved` : 'Shared review'}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle cx="60" cy="60" r="52" pathLength="100" style={{
              opacity: resolved ? 1 : 0
            }} strokeDasharray={`${tasks.length ? resolved / tasks.length * 100 : 0} 100`} /></svg><strong>{round ? `${resolved}/${tasks.length}` : <Users size={35} />}</strong></div><div><span className="review-kicker">{data.access.mode === 'preview' ? 'Family preview' : 'Shared reviews'}</span><h2>{round ? 'Check together' : 'Keep directions current'}</h2><p>{round ? `Due ${dateLabel(round.dueAt)}` : due ? 'Your next review is due' : `Next review · ${dateLabel(data.settings.nextReviewAt)}`}</p></div></div>
      {round ? <><TaskList tasks={tasks} onOpen={task => open({
          type: 'task',
          task,
          owner: true
        })} />{shareUrl && data.access.canCreate && resolved < tasks.length && <button className="secondary-button review-share" onClick={() => void share()}><ShareNetwork size={21} />{copiedLink ? 'Copied review link' : 'Share review request'}</button>}<div className="review-round-actions"><button className="primary-button" disabled={!tasks.length || resolved !== tasks.length || !data.access.canCreate} onClick={() => open({
            type: 'close',
            round,
            action: 'complete'
          })}>Finish review<Check size={21} /></button><button className="text-button" onClick={() => open({
            type: 'close',
            round,
            action: 'cancel'
          })}>Cancel this review</button></div></> : data.access.canCreate && data.eligible.length > 0 ? <button className="primary-button review-start" onClick={() => open({
        type: 'start'
      })}>Start a shared review<ArrowRight size={22} /></button> : !data.access.canCreate ? <p className="review-paused">New shared reviews are not available for this plan right now.</p> : null}
      {data.eligible.length === 0 && !round && <button className="shared-inbox-entry" onClick={onManageSharing}><Users size={25} /><span>Connect someone and share directions</span><ArrowRight size={20} /></button>}
      <button className="review-setting-entry" onClick={() => open({
        type: 'settings'
      })}><CalendarCheck size={25} /><span><strong>Review schedule & collaborator</strong><small>{data.settings.cadenceDays ? data.settings.nextReviewAt ? `Every ${data.settings.cadenceDays} days` : 'Not scheduled' : 'Reminders paused'} · In app</small></span><ArrowRight size={20} /></button>
      {data.history.length > 0 && <section className="review-history"><h3>Changes you approved</h3>{data.history.map(entry => <details key={entry.publicId} className="task-details"><summary><span>{entry.title}<small>{dateLabel(entry.createdAt)} · Suggested by {entry.suggestedBy}</small></span></summary><FieldChanges before={entry.beforeFields} after={entry.afterFields} /></details>)}</section>}
      {data.rounds.some(r => r.state !== 'open') && <details className="task-details review-past"><summary>Past reviews</summary>{data.rounds.filter(r => r.state !== 'open').map(r => <section key={r.publicId}><h3>{r.state === 'completed' ? 'Completed' : 'Cancelled'} · {dateLabel(r.completedAt)}</h3><TaskList tasks={r.tasks} onOpen={task => open({
            type: 'task',
            task,
            owner: true
          })} /></section>)}</details>}
    </> : <>{incoming.length ? <><p className="review-inbox-caption">People who asked you to check their directions</p><TaskList tasks={incoming} receiver onOpen={task => open({
          type: 'task',
          task,
          owner: false
        })} /></> : <div className="review-empty"><SurfaceIcon icon={Tray} emblem/><h2>Nothing waiting on you</h2><p>Shared review requests will appear here.</p></div>}{data.incoming.some(t => t.roundState !== 'open') && <details className="task-details"><summary>Previous checks</summary><TaskList tasks={data.incoming.filter(t => t.roundState !== 'open')} receiver onOpen={task => open({
          type: 'task',
          task,
          owner: false
        })} /></details>}</>}
    {dialog && <ReviewDialog key={dialog.task?.publicId ?? dialog.type} model={dialog} data={data} apiClient={apiClient} onClose={close} onSaved={saved} onDirtyChange={onDirtyChange} onBusyChange={onBusyChange} />}</div>;
}
function TaskList({
  tasks,
  onOpen,
  receiver = false
}) {
  return <div className="review-task-list">{tasks.map(task => {
      const Icon = taskIcon(task);
      return <button className="review-task-row" data-ready={isReviewResolved(task)} key={task.publicId} onClick={() => onOpen(task)}><Icon size={25} aria-hidden="true" /><span><strong>{task.title}</strong><small>{receiver ? task.ownerName : task.personName}</small></span><span className="review-state" data-ready={isReviewResolved(task)}>{reviewTaskLabel(task)}</span><ArrowRight size={18} aria-hidden="true" /></button>;
    })}</div>;
}
function FieldChanges({
  before,
  after
}) {
  return <dl className="review-diff">{Object.keys(after).filter(key => after[key] !== before[key]).map(key => <div key={key}><dt>{key === 'locationHint' ? 'Where to find it' : 'Provider'}</dt><dd><span className="review-old">{before[key] || 'Not added'}</span><ArrowRight size={17} aria-label="changes to" /><strong>{after[key]}</strong></dd></div>)}</dl>;
}
function ReviewDialog({
  model,
  data,
  apiClient,
  onClose,
  onSaved,
  onDirtyChange,
  onBusyChange
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [leaving, setLeaving] = useState(false),
    [dirty, setDirty] = useState(false);
  // Publish the committed form state before a native browser Back event can
  // reach the parent's guard; a passive effect leaves a short data-loss window.
  useLayoutEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useLayoutEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useLayoutEffect(() => () => {
    onDirtyChange?.(false);
    onBusyChange?.(false);
  }, [onDirtyChange, onBusyChange]);
  const [selected, setSelected] = useState([]),
    [dueDate, setDueDate] = useState(inputDate(Date.now() + 7 * 86400000));
  const [requestKey] = useState(() => crypto.randomUUID());
  const [cadence, setCadence] = useState(data.settings.cadenceDays),
    [collaborator, setCollaborator] = useState(data.settings.collaboratorConnectionPublicId ?? '');
  const [suggesting, setSuggesting] = useState(false),
    [provider, setProvider] = useState(model.task?.fields.institutionName ?? ''),
    [location, setLocation] = useState(model.task?.fields.locationHint ?? '');
  const [leaveTarget, setLeaveTarget] = useState('close');
  const close = () => {
    if (busy) return;
    setLeaveTarget('close');
    if (dirty) setLeaving(true);else onClose();
  };
  const returnToChoices = () => {
    setSuggesting(false);
    setProvider(model.task.fields.institutionName ?? '');
    setLocation(model.task.fields.locationHint ?? '');
    setDirty(false);
    setLeaving(false);
  };
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const protect = event => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  async function run(operation, changesMap = false) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await operation();
      setDirty(false);
      await onSaved(changesMap);
    } catch (failure) {
      setError(failure.name === 'TypeError' ? 'Could not confirm your changes. Check your connection and try again. Your draft is still here.' : failure.message || 'Your changes were not saved. The draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  const title = model.type === 'start' ? 'Choose what to check' : model.type === 'settings' ? 'Review settings' : model.type === 'close' ? model.action === 'complete' ? 'Finish this review?' : 'Cancel this review?' : model.task.title;
  const task = model.task;
  const connected = [...new Map(data.eligible.map(item => [item.connectionPublicId, item])).values()];
  const proposal = {
    ...(provider.trim() !== (task?.fields.institutionName ?? '') ? {
      institutionName: provider.trim()
    } : {}),
    ...(location.trim() !== (task?.fields.locationHint ?? '') ? {
      locationHint: location.trim()
    } : {})
  };
  const startReview = () => run(() => apiClient.startFamilyReview({
    requestKey,
    dueAt: new Date(`${dueDate}T23:59:59`).toISOString(),
    items: data.eligible.filter(item => selected.includes(pairKey(item))).map(({
      connectionPublicId,
      matterPublicId
    }) => ({
      connectionPublicId,
      matterPublicId
    }))
  }));
  return <dialog ref={ref} className="maintenance-dialog" aria-labelledby="review-dialog-title" onCancel={event => {
    event.preventDefault();
    close();
  }}>
    <header><h2 id="review-dialog-title">{title}</h2><button className="icon-button" disabled={busy} aria-label="Close review panel" onClick={close}><X size={22} /></button></header>
    {leaving ? <div className="review-dialog-body"><h3>Keep this draft?</h3><button className="primary-button" onClick={() => setLeaving(false)}>Keep editing</button><button className="text-button danger-text" onClick={() => leaveTarget === 'choices' ? returnToChoices() : onClose()}>Discard draft</button></div> : <div className="review-dialog-body">
      {error && <p className="drawer-alert" role="alert">{error}</p>}
      {model.type === 'start' && <><label className="field-label">Review by<input type="date" min={inputDate(Date.now())} max={inputDate(Date.now() + 365 * 86400000)} value={dueDate} onChange={e => {
            setDueDate(e.target.value);
            setDirty(true);
          }} disabled={busy} /></label>
        <div className="review-selection">{data.eligible.map(item => <label key={pairKey(item)}><FileText size={22} aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.personName}{item.missingLocation ? ' · Location missing' : ''}</small></span><input type="checkbox" disabled={busy} checked={selected.includes(pairKey(item))} onChange={() => {
              setSelected(old => old.includes(pairKey(item)) ? old.filter(id => id !== pairKey(item)) : [...old, pairKey(item)]);
              setDirty(true);
            }} /></label>)}</div>
        {!data.eligible.length && <p>Connect a person and share Directions or Details first.</p>}
        <button className="primary-button" disabled={busy || !selected.length || !dueDate} onClick={() => void startReview()}>{busy ? 'Creating…' : `Request ${selected.length || ''} ${selected.length === 1 ? 'check' : 'checks'}`}<ArrowRight size={21} /></button><p className="review-inline-note">Appears in their Rillora review inbox.</p></>}
      {model.type === 'settings' && <><label className="field-label">Review cadence<select disabled={busy || !data.access.canCreate} value={cadence} onChange={e => {
            setCadence(Number(e.target.value));
            setDirty(true);
          }}>{[[0, 'Off'], [30, 'Every month'], [90, 'Every 3 months'], [180, 'Every 6 months'], [365, 'Every year']].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field-label">Who can suggest corrections?<select disabled={busy || !data.access.canCreate} value={collaborator} onChange={e => {
            setCollaborator(e.target.value);
            setDirty(true);
          }}><option value="">No one · checks only</option>{connected.map(c => <option key={c.connectionPublicId} value={c.connectionPublicId}>{c.personName}</option>)}</select></label><p className="review-inline-note">You approve changes before your map updates.</p><button className="primary-button" disabled={busy || !dirty || !data.access.canCreate} onClick={() => void run(() => apiClient.saveFamilyReviewSettings({
          expectedVersion: data.settings.version,
          cadenceDays: cadence,
          collaboratorConnectionPublicId: collaborator || null,
          nextReviewAt: cadence === data.settings.cadenceDays ? data.settings.nextReviewAt : null
        }))}>Save settings<Check size={21} /></button>{!data.access.canCreate && <button className="secondary-button" disabled={busy} onClick={() => void run(() => apiClient.saveFamilyReviewSettings({
          expectedVersion: data.settings.version,
          cadenceDays: 0,
          collaboratorConnectionPublicId: null,
          nextReviewAt: null
        }))}>Pause reviews and suggestions</button>}</>}
      {model.type === 'close' && <><div className="review-complete-symbol"><CheckCircle size={60} /></div><p>{model.action === 'complete' ? 'These checks and your decisions stay in review history.' : 'Existing directions and sharing stay unchanged.'}</p><button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.closeFamilyReview(model.round.publicId, {
          expectedVersion: model.round.version,
          action: model.action
        }))}>{model.action === 'complete' ? 'Finish review' : 'Cancel review'}<Check size={21} /></button></>}
      {task && <><p className="review-task-person">{model.owner ? task.personName : task.ownerName} · {reviewTaskLabel(task)}</p>
        <dl className="review-directions"><div><dt>Provider</dt><dd>{task.fields.institutionName || 'Not added'}</dd></div><div><dt>Where to find it</dt><dd>{task.fields.locationHint || 'Not added'}</dd></div></dl>
        {task.reason && <p className="review-issue">{reviewReasons[task.reason]}</p>}
        {task.proposal && <><h3>Suggested correction</h3><FieldChanges before={task.fields} after={{
            ...task.fields,
            ...task.proposal
          }} /></>}
        {(!task.scopeAvailable || task.isStale) && <p className="review-issue">{task.isStale ? 'The matter changed. A fresh check is needed.' : 'Sharing changed. This check is no longer current.'}</p>}
        {model.owner && task.canManage && <div className="review-decision-actions">{task.state === 'suggested' && !task.isStale && task.scopeAvailable && task.canSuggest && <button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'apply'
          }), true)}>Apply update<Check size={21} /></button>}{['suggested', 'needs_update'].includes(task.state) && <button className="secondary-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'dismiss'
          }))}>Keep current directions</button>}<button className="text-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'reopen'
          }))}>Request a fresh check</button></div>}
        {!model.owner && task.canRespond && !suggesting && <><button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
            expectedVersion: task.version,
            response: 'confirmed'
          }))}>I can find it<CheckCircle size={22} /></button><div className="review-reasons">{Object.entries(reviewReasons).map(([reason, label]) => <button className="secondary-button" key={reason} disabled={busy} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
              expectedVersion: task.version,
              response: 'needs_update',
              reason
            }))}>{label}</button>)}</div>{task.canSuggest && <button className="text-button" onClick={() => setSuggesting(true)}><PencilSimple size={21} />Suggest a correction</button>}</>}
        {!model.owner && task.canRespond && suggesting && <><button className="text-button" disabled={busy} onClick={() => {
            if (dirty) {
              setLeaveTarget('choices');
              setLeaving(true);
            } else returnToChoices();
          }}><ArrowLeft size={18} />Review choices</button><label className="field-label">Provider<input value={provider} maxLength={160} disabled={busy} onChange={e => {
              setProvider(e.target.value);
              setDirty(true);
            }} /></label><label className="field-label">Where to find it<textarea value={location} maxLength={500} rows={3} disabled={busy} onChange={e => {
              setLocation(e.target.value);
              setDirty(true);
            }} /></label><button className="primary-button" disabled={busy || !Object.keys(proposal).length || Object.values(proposal).some(v => !v)} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
            expectedVersion: task.version,
            response: 'suggested',
            proposal
          }))}>Send for approval<ArrowRight size={21} /></button></>}
      </>}
    </div>}
  </dialog>;
}
