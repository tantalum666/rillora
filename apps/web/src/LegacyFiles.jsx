import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Microphone, Stop, DownloadSimple } from '@phosphor-icons/react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { recordVoice } from './legacyVoice.js';
import { ContentField } from './LegacyPackEditor.jsx';
import { LOCAL_TRANSCRIPTION_ENABLED } from './legacyContentFeature.js';
import { contentDownloadName } from './legacyContent.js';
const LocalTranscriptionControl = LOCAL_TRANSCRIPTION_ENABLED ? lazy(() => import('./LocalTranscriptionControl.jsx')) : null;

export function saveContentDownload(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = blob.type === 'application/json' ? name : contentDownloadName({ name, mediaType: blob.type });
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function VoicePlayer({ asset, download, onError }) {
  const { t } = useI18n(); const [url, setURL] = useState(null), [busy, setBusy] = useState(false); const sequence = useRef(0);
  const audio = useRef(null);
  useEffect(() => () => { sequence.current++; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { sequence.current++; audio.current?.pause(); setURL(null); setBusy(false); } };
    document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  return url ? <audio ref={audio} controls src={url} preload="none" aria-label={asset.name}/> : <button className="text-button" disabled={busy} onClick={async () => {
    const call = ++sequence.current; setBusy(true);
    try { const { blob } = await download(asset); if (call === sequence.current) setURL(URL.createObjectURL(blob)); }
    catch (error) { if (call === sequence.current) onError(error); } finally { if (call === sequence.current) setBusy(false); }
  }}>{t(busy ? 'content.loading' : 'content.play')}</button>;
}
export function VoiceRecorder({ busy, onSave, onError, onDirtyChange }) {
  const { t } = useI18n(); const [status, setStatus] = useState('idle'), [blob, setBlob] = useState(null), [seconds, setSeconds] = useState(0);
  const [name, setName] = useState(''); const current = useRef(null), generation = useRef(0), abort = useRef(null);
  useEffect(() => { onDirtyChange(status !== 'idle'); return () => onDirtyChange(false); }, [status, onDirtyChange]);
  useEffect(() => () => { generation.current++; abort.current?.abort(); current.current?.cancel(); }, []);
  useEffect(() => { if (status !== 'recording') return; const timer = setInterval(() => setSeconds(value => Math.min(180, value + 1)), 1000); return () => clearInterval(timer); }, [status]);
  async function start() {
    if (status !== 'idle' || busy) return;
    const call = ++generation.current; setStatus('starting'); setSeconds(0); abort.current = new AbortController();
    try {
      current.current = await recordVoice({ signal: abort.current.signal,
        onFinished: value => { if (call === generation.current) { setBlob(value); setName(t('content.voiceDefault')); setStatus('ready'); } },
        onError: error => { if (call === generation.current) { setStatus('idle'); onError(error); } } });
      if (call === generation.current) setStatus('recording');
    } catch (error) { if (call === generation.current) { setStatus('idle'); onError(error); } }
  }
  function discard() { generation.current++; abort.current?.abort(); current.current?.cancel(); setBlob(null); setStatus('idle'); }
  return <section className="legacy-recorder">
    {status === 'idle' && <button className="secondary-button" disabled={busy} onClick={() => void start()}><Microphone size={20}/>{t('content.record')}</button>}
    {status === 'starting' && <><p role="status">{t('content.loading')}</p><button className="text-button" onClick={discard}>{t('content.discardVoice')}</button></>}
    {status === 'recording' && <><p role="status">{t('content.recording', { seconds })}</p><button className="secondary-button" onClick={() => current.current?.stop()}><Stop size={18}/>{t('content.stop')}</button></>}
    {status === 'ready' && <><ContentField label={t('content.voiceName')}><input maxLength={160} value={name} disabled={busy} onChange={event => setName(event.target.value)}/></ContentField>
      <div className="legacy-actions"><button className="primary-button" disabled={busy || !name.trim()} onClick={async () => { if (await onSave(blob, name.trim())) discard(); }}>{t('content.saveVoice')}</button>
        <button className="text-button" disabled={busy} onClick={discard}>{t('content.discardVoice')}</button></div></>}
    {status !== 'idle' && <p className="legacy-muted">{t('content.voiceLocal')}</p>}
  </section>;
}
export function LegacyAssetEditor({ asset, canCreate, busy, onSave, onDelete, download, onBack, onError, onDirtyChange, onProcessingChange }) {
  const { t } = useI18n(); const [metadata, setMetadata] = useState(() => ({ name: asset.name, description: asset.description,
    transcript: asset.transcript, transcriptConfirmed: asset.transcriptConfirmed, language: asset.language }));
  const [dirty, setDirty] = useState(false), [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);
  useEffect(() => { onProcessingChange(processing); return () => onProcessingChange(false); }, [processing, onProcessingChange]);
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  const update = patch => { setMetadata(value => ({ ...value, ...patch })); setDirty(true); };
  return <section className="legacy-editor">
    <button className="text-button" disabled={busy || processing} onClick={onBack}>{t(dirty ? 'content.cancel' : 'content.back')}</button>
    <form onSubmit={event => { event.preventDefault(); void onSave(metadata); }}><fieldset disabled={busy || !canCreate}>
      <ContentField label={t('content.name')}><input required maxLength={160} value={metadata.name} onChange={event => update({ name: event.target.value })}/></ContentField>
      <ContentField label={t('content.description')}><textarea rows={3} maxLength={2000} value={metadata.description} onChange={event => update({ description: event.target.value })}/></ContentField>
      {asset.kind === 'voice' && <><ContentField label={t('content.recordingLanguage')}><select disabled={processing} value={metadata.language} onChange={event => update({ language: event.target.value })}><option value="zh-CN">{t('content.mandarin')}</option><option value="en-US">{t('content.english')}</option></select></ContentField>
        {LocalTranscriptionControl && canCreate && <Suspense fallback={<p>{t('content.loading')}</p>}><LocalTranscriptionControl asset={asset} language={metadata.language} download={download} onBusyChange={setProcessing}
          onDraft={transcript => update({ transcript, transcriptConfirmed: false })}/></Suspense>}
        <ContentField label={t('content.transcript')}><textarea rows={7} maxLength={12000} value={metadata.transcript} disabled={processing}
        onChange={event => update({ transcript: event.target.value, transcriptConfirmed: false })}/></ContentField>
        <p className="legacy-muted">{t('content.transcriptHint')}</p><label className="legacy-check"><input type="checkbox" checked={metadata.transcriptConfirmed}
          onChange={event => update({ transcriptConfirmed: event.target.checked })}/><span>{t('content.transcriptConfirmed')}</span></label><p className="legacy-muted">{t('content.unchecked')}</p></>}
      {canCreate && <button className="primary-button" disabled={!dirty || !metadata.name.trim() || processing}>{t('content.save')}</button>}
    </fieldset></form>
    {asset.kind === 'voice' && <VoicePlayer asset={asset} download={download} onError={onError}/>}
    <div className="legacy-actions"><button className="secondary-button" disabled={busy} onClick={async () => { try { const { blob } = await download(asset); saveContentDownload(blob, asset.name); } catch (error) { onError(error); } }}><DownloadSimple size={18}/>{t('content.download')}</button>
      <button className="text-button" disabled={busy || processing} onClick={() => setDeleting(true)}>{t('content.delete')}</button></div>
    {deleting && <div className="legacy-delete"><p>{t('content.deleteWarning')}</p><button className="secondary-button" disabled={busy} onClick={onDelete}>{t('content.deleteConfirm')}</button><button className="text-button" disabled={busy} onClick={() => setDeleting(false)}>{t('content.keep')}</button></div>}
  </section>;
}
