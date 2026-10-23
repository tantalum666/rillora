import { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { contentAccessInvalid, contentStatuses } from './legacyContent.js';
import { getOfficialProviderGuide } from './officialProviderGuides.js';
import { ContentField } from './LegacyPackEditor.jsx';
import { VoicePlayer, saveContentDownload } from './LegacyFiles.jsx';

function ProgressEditor({ task, progress, ready, busy, onSave, onDirty }) {
  const { t } = useI18n(); const [value, setValue] = useState({ status: progress?.status ?? 'not_started', reference: progress?.reference ?? '', note: progress?.note ?? '' });
  const [dirty, setDirty] = useState(false), [version, setVersion] = useState(progress?.version ?? 0);
  useEffect(() => { onDirty(task.id, dirty); return () => onDirty(task.id, false); }, [dirty, onDirty, task.id]);
  useEffect(() => { if (!dirty) { setValue({ status: progress?.status ?? 'not_started', reference: progress?.reference ?? '', note: progress?.note ?? '' }); setVersion(progress?.version ?? 0); } }, [progress?.version, dirty]);
  const update = patch => { setValue(current => ({ ...current, ...patch })); setDirty(true); };
  return <form onSubmit={async event => { event.preventDefault(); const saved = await onSave({ taskId: task.id, ...value }, version); if (saved) { setVersion(saved.version); setDirty(false); } }}><fieldset disabled={busy}>
    <ContentField label={t('content.progress')}><select value={value.status} onChange={event => update({ status: event.target.value })}>{contentStatuses.map(status => <option key={status} value={status} disabled={!ready && ['submitted', 'completed'].includes(status)}>{t(`content.status.${status}`)}</option>)}</select></ContentField>
    <ContentField label={t('content.reference')}><input maxLength={240} value={value.reference} onChange={event => update({ reference: event.target.value })}/></ContentField>
    <ContentField label={t('content.progressNote')}><textarea maxLength={2000} rows={2} value={value.note} onChange={event => update({ note: event.target.value })}/></ContentField>
    <button className="secondary-button" disabled={!dirty}>{t('content.saveProgress')}</button>
  </fieldset></form>;
}
export function LegacyPublication({ id, client, onError, onBack, onOpenGuide, onDirtyChange, onBusyChange }) {
  const { t, formatDate } = useI18n(); const [data, setData] = useState(null), [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const generation = useRef(0), inFlight = useRef(false), dirty = useRef(new Set());
  const revision = useRef(null), refresh = useRef(null);
  const dirtyChanged = useRef((taskId, changed) => { changed ? dirty.current.add(taskId) : dirty.current.delete(taskId); onDirtyChange(dirty.current.size > 0); }).current;
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  useEffect(() => {
    const call = ++generation.current; let stopped = false, visibleRequest = 0; revision.current = null;
    async function load() {
      if (stopped || document.hidden || inFlight.current) return;
      inFlight.current = true; const visible = ++visibleRequest;
      try {
        const state = await client.publicationState(id);
        if (revision.current === state.revision) {
          if (call === generation.current && visible === visibleRequest && !document.hidden) { setVerified(true); onError(null); }
          return;
        }
        const result = await client.publication(id);
        if (call === generation.current && visible === visibleRequest && !document.hidden) { revision.current = state.revision; setData(result.publication); setVerified(true); onError(null); }
      }
      catch (error) { if (call === generation.current && visible === visibleRequest) {
        if (contentAccessInvalid(error)) { setData(null); revision.current = null; }
        setVerified(false); onError(error);
      } }
      finally { inFlight.current = false; }
    }
    refresh.current = load;
    void load(); const timer = setInterval(() => void load(), 15000);
    // Hide cached content until access is rechecked, while retaining unsaved
    // progress in memory. Account invalidation still unmounts the entire panel.
    const visibility = () => { if (document.hidden) { visibleRequest++; setVerified(false); } else void load(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { stopped = true; generation.current++; refresh.current = null; clearInterval(timer); document.removeEventListener('visibilitychange', visibility); onDirtyChange(false); };
  }, [client, id, onError, onDirtyChange]);
  const download = asset => client.download(asset, data?.isOwner ? undefined : id);
  return <article className="legacy-publication"><button className="text-button legacy-no-print" disabled={busy} onClick={onBack}>{t('content.back')}</button>
    {!data || !verified ? <div><p role="status">{t('content.loading')}</p>
      <button className="text-button" disabled={busy} onClick={() => void refresh.current?.()}>{t('content.retry')}</button></div> : null}
    {data && <div hidden={!verified}>
      <header><h2>{data.body.title}</h2>{data.ownerName && <p>{t('content.from', { name: data.ownerName })}</p>}<p className="legacy-muted">{formatDate(data.publishedAt)}</p></header>
      <p className="legacy-preserve-lines">{data.body.note}</p><p className="legacy-muted">{t('content.reported')}</p>
      <div className="legacy-actions legacy-no-print"><button className="secondary-button" onClick={() => window.print()}>{t('content.print')}</button>
        <button className="text-button" onClick={() => saveContentDownload(new Blob([JSON.stringify({ format: 'rillora-action-pack-v1', body: data.body, assets: data.assets, progress: data.progress }, null, 2)], { type: 'application/json' }), 'rillora-action-pack.json')}>{t('content.export')}</button></div>
      <ol className="legacy-step-reader">{data.body.tasks.map((task, index) => {
        const progress = data.progress.find(item => item.taskId === task.id), ready = task.dependsOn.every(previous => data.progress.some(item => item.taskId === previous && item.status === 'completed'));
        return <li key={task.id}><div className="legacy-subheading"><h3>{index + 1}. {task.title}</h3><span className="legacy-status">{t(`content.status.${progress?.status ?? 'not_started'}`)}</span></div>
          <p>{t(`content.action.${task.action}`)}</p><p className="legacy-preserve-lines">{task.instructions}</p>
          {task.dependsOn.length > 0 && <p className="legacy-muted">{t('content.prerequisites')}: {task.dependsOn.map(previous => data.body.tasks.find(item => item.id === previous)?.title).join(' · ')}</p>}
          {getOfficialProviderGuide(task.providerId) && <button className="text-button legacy-no-print" onClick={() => onOpenGuide(task.providerId)}>{t('content.openGuide')}</button>}
          <details className="task-details legacy-no-print"><summary>{t('content.progress')}</summary><ProgressEditor task={task} progress={progress} ready={ready} busy={busy} onDirty={dirtyChanged}
            onSave={async (input, version) => {
              if (inFlight.current) return null; inFlight.current = true; setBusy(true); const call = generation.current;
              try {
                const result = await client.report(id, input, version);
                if (call !== generation.current) return null;
                setData(current => current ? { ...current, progress: [...current.progress.filter(item => item.taskId !== input.taskId), result.progress] } : current);
                revision.current = null;
                try {
                  const refreshed = await client.publication(id);
                  if (call === generation.current) setData(refreshed.publication);
                } catch (error) {
                  if (call !== generation.current) return null;
                  if (contentAccessInvalid(error)) setData(null);
                  setVerified(false); onError(error);
                }
                return call === generation.current ? result.progress : null;
              } catch (error) { if (call === generation.current) onError(error); return null; }
              finally { inFlight.current = false; if (call === generation.current) setBusy(false); }
            }}/></details>
          {progress?.reference && <p>{t('content.reference')}: {progress.reference}</p>}{progress?.note && <p className="legacy-preserve-lines">{progress.note}</p>}
        </li>;
      })}</ol>
      {data.assets.length > 0 && <section><h2>{t('content.selectedFiles')}</h2>{data.assets.map(asset => <article className="legacy-file-reader" key={asset.publicId}>
        <h3>{asset.name}</h3><p className="legacy-preserve-lines">{asset.description}</p>
        {asset.transcriptConfirmed && asset.transcript && <p className="legacy-preserve-lines">{asset.transcript}</p>}
        <div className="legacy-no-print">{asset.kind === 'voice' && <VoicePlayer asset={asset} download={download} onError={onError}/>}
          <button className="text-button" onClick={async () => { try { const { blob } = await download(asset); saveContentDownload(blob, asset.name); } catch (error) { onError(error); } }}>{t('content.download')}</button></div>
      </article>)}</section>}
    </div>}
  </article>;
}
