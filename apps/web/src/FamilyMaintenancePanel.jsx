import { sharingMessage } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowClockwise, ArrowLeft, ArrowRight, CalendarCheck, Check, CheckCircle, Clock, FileText, PencilSimple, Users, X, ShareNetwork, Tray } from "@phosphor-icons/react";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import { isReviewResolved, reviewReasons, reviewTaskLabel, reviewShareUrl } from "./familyMaintenance.js";
import "./family-maintenance.css";
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
  const { t, formatDate, formatNumber, errorMessage } = useI18n();
  const dateLabel = value => value ? formatDate(value) : t("sharing.review.notScheduled");
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
        setError({ cause: failure, key: failure.name === "TypeError" ? "sharing.review.networkLoadError" : "sharing.review.loadError" });
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
  if (!data) return <div className="review-empty" role={error ? 'alert' : 'status'}><CalendarCheck size={54} /><p>{error ? sharingMessage(error, t, errorMessage) : t("sharing.review.loading")}</p>{error && <button className="secondary-button" onClick={() => void load()}>{t("sharing.common.retry")}</button>}</div>;
  const round = data.rounds.find(r => r.state === 'open');
  const tasks = round?.tasks ?? [];
  const resolved = tasks.filter(isReviewResolved).length;
  const incoming = data.incoming.filter(task => task.roundState === 'open');
  const due = data.settings.nextReviewAt && new Date(data.settings.nextReviewAt) <= new Date(data.serverTime);
  const shareUrl = reviewShareUrl(data.shareUrl);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({
        title: t("sharing.review.shareTitle"),
        text: t("sharing.review.shareBody"),
        url: shareUrl
      });else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
      }
    } catch (failure) {
      if (failure.name !== 'AbortError') setError("sharing.review.shareError");
    }
  };
  return <div className="family-review-panel">
    <div className="review-toolbar"><div className="panel-tabs" role="group" aria-label={t("sharing.review.inbox")}><button aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>{t("sharing.review.myPlan")}</button><button aria-pressed={tab === 'incoming'} onClick={() => setTab('incoming')}>{t("sharing.copy.forMe")} {incoming.length > 0 && <span className="review-counter">{formatNumber(incoming.length)}</span>}</button></div><button className="icon-button" disabled={loading} aria-label={t("sharing.review.refresh")} onClick={() => void load()}><ArrowClockwise size={22} /></button></div>
    {error && <p className="drawer-alert" role="alert">{sharingMessage(error, t, errorMessage)}</p>}
    {tab === 'mine' ? <>
      <div className="review-hero"><div className="review-ring" role="img" aria-label={round ? t("sharing.review.progress", { resolved, count: tasks.length }) : t("sharing.review.shared")}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle cx="60" cy="60" r="52" pathLength="100" style={{
              opacity: resolved ? 1 : 0
            }} strokeDasharray={`${tasks.length ? resolved / tasks.length * 100 : 0} 100`} /></svg><strong>{round ? `${formatNumber(resolved)}/${formatNumber(tasks.length)}` : <Users size={35} />}</strong></div><div><span className="review-kicker">{data.access.mode === 'preview' ? t("sharing.review.familyPreview") : t("sharing.review.sharedPlural")}</span><h2>{round ? t("sharing.review.together") : t("sharing.review.keepCurrent")}</h2><p>{round ? t("sharing.review.dueDate", { date: dateLabel(round.dueAt) }) : due ? t("sharing.review.due") : t("sharing.review.nextDate", { date: dateLabel(data.settings.nextReviewAt) })}</p></div></div>
      {round ? <><TaskList tasks={tasks} onOpen={task => open({
          type: 'task',
          task,
          owner: true
        })} />{shareUrl && data.access.canCreate && resolved < tasks.length && <button className="secondary-button review-share" onClick={() => void share()}><ShareNetwork size={21} />{copiedLink ? t("sharing.review.copied") : t("sharing.review.shareRequest")}</button>}<div className="review-round-actions"><button className="primary-button" disabled={!tasks.length || resolved !== tasks.length || !data.access.canCreate} onClick={() => open({
            type: 'close',
            round,
            action: 'complete'
          })}>{t("sharing.review.finish")}<Check size={21} /></button><button className="text-button" onClick={() => open({
            type: 'close',
            round,
            action: 'cancel'
          })}>{t("sharing.review.cancelThis")}</button></div></> : data.access.canCreate && data.eligible.length > 0 ? <button className="primary-button review-start" onClick={() => open({
        type: 'start'
      })}>{t("sharing.review.start")}<ArrowRight size={22} /></button> : !data.access.canCreate ? <p className="review-paused">{t("sharing.review.unavailable")}</p> : null}
      {data.eligible.length === 0 && !round && <button className="shared-inbox-entry" onClick={onManageSharing}><Users size={25} /><span>{t("sharing.review.connect")}</span><ArrowRight size={20} /></button>}
      <button className="review-setting-entry" onClick={() => open({
        type: 'settings'
      })}><CalendarCheck size={25} /><span><strong>{t("sharing.review.settingsEntry")}</strong><small>{t("sharing.review.inApp", { cadence: data.settings.cadenceDays ? data.settings.nextReviewAt ? t("sharing.review.everyDays", { count: data.settings.cadenceDays }) : t("sharing.review.notScheduled") : t("sharing.review.remindersPaused") })}</small></span><ArrowRight size={20} /></button>
      {data.history.length > 0 && <section className="review-history"><h3>{t("sharing.review.history")}</h3>{data.history.map(entry => <details key={entry.publicId} className="task-details"><summary><span>{entry.title}<small>{t("sharing.review.suggestedBy", { date: dateLabel(entry.createdAt), name: entry.suggestedBy })}</small></span></summary><FieldChanges before={entry.beforeFields} after={entry.afterFields} /></details>)}</section>}
      {data.rounds.some(r => r.state !== 'open') && <details className="task-details review-past"><summary>{t("sharing.review.past")}</summary>{data.rounds.filter(r => r.state !== 'open').map(r => <section key={r.publicId}><h3>{r.state === 'completed' ? t("sharing.review.completed") : t("sharing.review.cancelled")} · {dateLabel(r.completedAt)}</h3><TaskList tasks={r.tasks} onOpen={task => open({
            type: 'task',
            task,
            owner: true
          })} /></section>)}</details>}
    </> : <>{incoming.length ? <><p className="review-inbox-caption">{t("sharing.review.inboxCaption")}</p><TaskList tasks={incoming} receiver onOpen={task => open({
          type: 'task',
          task,
          owner: false
        })} /></> : <div className="review-empty"><SurfaceIcon icon={Tray} emblem/><h2>{t("sharing.review.nothingWaiting")}</h2><p>{t("sharing.review.empty")}</p></div>}{data.incoming.some(t => t.roundState !== 'open') && <details className="task-details"><summary>{t("sharing.review.previous")}</summary><TaskList tasks={data.incoming.filter(t => t.roundState !== 'open')} receiver onOpen={task => open({
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
  const { t } = useI18n();
  return <div className="review-task-list">{tasks.map(task => {
      const Icon = taskIcon(task);
      return <button className="review-task-row" data-ready={isReviewResolved(task)} key={task.publicId} onClick={() => onOpen(task)}><Icon size={25} aria-hidden="true" /><span><strong>{task.title}</strong><small>{receiver ? task.ownerName : task.personName}</small></span><span className="review-state" data-ready={isReviewResolved(task)}>{reviewTaskLabel(task, t)}</span><ArrowRight size={18} aria-hidden="true" /></button>;
    })}</div>;
}
function FieldChanges({
  before,
  after
}) {
  const { t } = useI18n();
  return <dl className="review-diff">{Object.keys(after).filter(key => after[key] !== before[key]).map(key => <div key={key}><dt>{key === 'locationHint' ? t("sharing.common.location") : t("sharing.common.provider")}</dt><dd><span className="review-old">{before[key] || t("sharing.common.notAdded")}</span><ArrowRight size={17} aria-label={t("sharing.review.changesTo")} /><strong>{after[key]}</strong></dd></div>)}</dl>;
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
  const { t, errorMessage } = useI18n();
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
      setError({ cause: failure, key: failure.name === "TypeError" ? "sharing.review.saveNetworkError" : "sharing.review.saveError" });
    } finally {
      setBusy(false);
    }
  }
  const title = model.type === 'start' ? t("sharing.review.chooseChecks") : model.type === 'settings' ? t("sharing.review.settings") : model.type === 'close' ? model.action === 'complete' ? t("sharing.review.finishTitle") : t("sharing.review.cancelTitle") : model.task.title;
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
    <header><h2 id="review-dialog-title">{title}</h2><button className="icon-button" disabled={busy} aria-label={t("sharing.review.closePanel")} onClick={close}><X size={22} /></button></header>
    {leaving ? <div className="review-dialog-body"><h3>{t("sharing.review.keepDraft")}</h3><button className="primary-button" onClick={() => setLeaving(false)}>{t("sharing.common.keepEditing")}</button><button className="text-button danger-text" onClick={() => leaveTarget === 'choices' ? returnToChoices() : onClose()}>{t("sharing.review.discard")}</button></div> : <div className="review-dialog-body">
      {error && <p className="drawer-alert" role="alert">{sharingMessage(error, t, errorMessage)}</p>}
      {model.type === 'start' && <><label className="field-label">{t("sharing.review.by")}<input type="date" min={inputDate(Date.now())} max={inputDate(Date.now() + 365 * 86400000)} value={dueDate} onChange={e => {
            setDueDate(e.target.value);
            setDirty(true);
          }} disabled={busy} /></label>
        <div className="review-selection">{data.eligible.map(item => <label key={pairKey(item)}><FileText size={22} aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.personName}{item.missingLocation ? t("sharing.review.locationMissing") : ''}</small></span><input type="checkbox" disabled={busy} checked={selected.includes(pairKey(item))} onChange={() => {
              setSelected(old => old.includes(pairKey(item)) ? old.filter(id => id !== pairKey(item)) : [...old, pairKey(item)]);
              setDirty(true);
            }} /></label>)}</div>
        {!data.eligible.length && <p>{t("sharing.review.connectFirst")}</p>}
        <button className="primary-button" disabled={busy || !selected.length || !dueDate} onClick={() => void startReview()}>{busy ? t("sharing.review.creating") : t("sharing.review.requestCount", { count: selected.length })}<ArrowRight size={21} /></button><p className="review-inline-note">{t("sharing.review.requestHint")}</p></>}
      {model.type === 'settings' && <><label className="field-label">{t("sharing.review.cadence")}<select disabled={busy || !data.access.canCreate} value={cadence} onChange={e => {
            setCadence(Number(e.target.value));
            setDirty(true);
          }}>{[[0, t("sharing.review.off")], [30, t("sharing.review.month")], [90, t("sharing.review.threeMonths")], [180, t("sharing.review.sixMonths")], [365, t("sharing.review.year")]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field-label">{t("sharing.review.collaborator")}<select disabled={busy || !data.access.canCreate} value={collaborator} onChange={e => {
            setCollaborator(e.target.value);
            setDirty(true);
          }}><option value="">{t("sharing.review.noCollaborator")}</option>{connected.map(c => <option key={c.connectionPublicId} value={c.connectionPublicId}>{c.personName}</option>)}</select></label><p className="review-inline-note">{t("sharing.review.approvalHint")}</p><button className="primary-button" disabled={busy || !dirty || !data.access.canCreate} onClick={() => void run(() => apiClient.saveFamilyReviewSettings({
          expectedVersion: data.settings.version,
          cadenceDays: cadence,
          collaboratorConnectionPublicId: collaborator || null,
          nextReviewAt: cadence === data.settings.cadenceDays ? data.settings.nextReviewAt : null
        }))}>{t("sharing.review.saveSettings")}<Check size={21} /></button>{!data.access.canCreate && <button className="secondary-button" disabled={busy} onClick={() => void run(() => apiClient.saveFamilyReviewSettings({
          expectedVersion: data.settings.version,
          cadenceDays: 0,
          collaboratorConnectionPublicId: null,
          nextReviewAt: null
        }))}>{t("sharing.review.pause")}</button>}</>}
      {model.type === 'close' && <><div className="review-complete-symbol"><CheckCircle size={60} /></div><p>{model.action === 'complete' ? t("sharing.review.finishBody") : t("sharing.review.cancelBody")}</p><button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.closeFamilyReview(model.round.publicId, {
          expectedVersion: model.round.version,
          action: model.action
        }))}>{model.action === 'complete' ? t("sharing.review.finish") : t("sharing.review.cancel")}<Check size={21} /></button></>}
      {task && <><p className="review-task-person">{model.owner ? task.personName : task.ownerName} · {reviewTaskLabel(task, t)}</p>
        <dl className="review-directions"><div><dt>{t("sharing.common.provider")}</dt><dd>{task.fields.institutionName || t("sharing.common.notAdded")}</dd></div><div><dt>{t("sharing.common.location")}</dt><dd>{task.fields.locationHint || t("sharing.common.notAdded")}</dd></div></dl>
        {task.reason && <p className="review-issue">{t(`sharing.review.reason.${task.reason}`)}</p>}
        {task.proposal && <><h3>{t("sharing.review.suggestion")}</h3><FieldChanges before={task.fields} after={{
            ...task.fields,
            ...task.proposal
          }} /></>}
        {(!task.scopeAvailable || task.isStale) && <p className="review-issue">{task.isStale ? t("sharing.review.stale") : t("sharing.review.scopeChanged")}</p>}
        {model.owner && task.canManage && <div className="review-decision-actions">{task.state === 'suggested' && !task.isStale && task.scopeAvailable && task.canSuggest && <button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'apply'
          }), true)}>{t("sharing.review.apply")}<Check size={21} /></button>}{['suggested', 'needs_update'].includes(task.state) && <button className="secondary-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'dismiss'
          }))}>{t("sharing.review.keepDirections")}</button>}<button className="text-button" disabled={busy} onClick={() => void run(() => apiClient.decideFamilyReview(task.publicId, {
            expectedVersion: task.version,
            action: 'reopen'
          }))}>{t("sharing.review.recheck")}</button></div>}
        {!model.owner && task.canRespond && !suggesting && <><button className="primary-button" disabled={busy} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
            expectedVersion: task.version,
            response: 'confirmed'
          }))}>{t("sharing.review.canFind")}<CheckCircle size={22} /></button><div className="review-reasons">{Object.entries(reviewReasons).map(([reason, label]) => <button className="secondary-button" key={reason} disabled={busy} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
              expectedVersion: task.version,
              response: 'needs_update',
              reason
            }))}>{t(`sharing.review.reason.${reason}`)}</button>)}</div>{task.canSuggest && <button className="text-button" onClick={() => setSuggesting(true)}><PencilSimple size={21} />{t("sharing.review.suggest")}</button>}</>}
        {!model.owner && task.canRespond && suggesting && <><button className="text-button" disabled={busy} onClick={() => {
            if (dirty) {
              setLeaveTarget('choices');
              setLeaving(true);
            } else returnToChoices();
          }}><ArrowLeft size={18} />{t("sharing.review.choices")}</button><label className="field-label">{t("sharing.common.provider")}<input value={provider} maxLength={160} disabled={busy} onChange={e => {
              setProvider(e.target.value);
              setDirty(true);
            }} /></label><label className="field-label">{t("sharing.common.location")}<textarea value={location} maxLength={500} rows={3} disabled={busy} onChange={e => {
              setLocation(e.target.value);
              setDirty(true);
            }} /></label><button className="primary-button" disabled={busy || !Object.keys(proposal).length || Object.values(proposal).some(v => !v)} onClick={() => void run(() => apiClient.respondToFamilyReview(task.publicId, {
            expectedVersion: task.version,
            response: 'suggested',
            proposal
          }))}>{t("sharing.review.submit")}<ArrowRight size={21} /></button></>}
      </>}
    </div>}
  </dialog>;
}
