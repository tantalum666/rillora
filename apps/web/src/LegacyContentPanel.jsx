import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Folder, Microphone, Plus, ArrowClockwise, LockKey } from '@phosphor-icons/react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { LegacyPackEditor } from './LegacyPackEditor.jsx';
import { LegacyAssetEditor, VoiceRecorder, saveContentDownload } from './LegacyFiles.jsx';
import { LegacyPublication } from './LegacyPublication.jsx';
import './legacy-content.css';

export function contentError(error, t) {
  const keys = {
    legacy_changed: 'changed', legacy_unavailable: 'unavailable', legacy_file_size: 'file', legacy_file_type: 'file', legacy_voice_format: 'file',
    legacy_storage_limit: 'quota', legacy_pack_limit: 'quota', legacy_contact_unavailable: 'contact', legacy_private_matter: 'private',
    legacy_prerequisites: 'prerequisites', legacy_microphone_unavailable: 'microphone', account_changed: 'session', authentication_required: 'session',
  };
  if (error?.code === 'legacy_family_required') return t('content.family');
  if (error?.code === 'legacy_future_private') return t('content.futureBoundary');
  if (error?.code === 'legacy_read_only') return t('content.readOnly');
  return t(keys[error?.code] ? `content.error.${keys[error.code]}` : 'content.error');
}
export default function LegacyContentPanel({ apiClient, contacts, matters, onDirtyChange, onBusyChange, onReviewPlan, onOpenGuide }) {
  const { t, locale } = useI18n(); const client = apiClient.legacy;
  const [data, setData] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState('packs'), [selected, setSelected] = useState(null), [accepted, setAccepted] = useState(false), [message, setMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null), uploadKeys = useRef(new WeakMap());
  const [processing, setProcessing] = useState(false);
  const generation = useRef(0), working = useRef(false), input = useRef(null), accountValid = useRef(true);
  const dirtyChanged = useCallback(value => { setDirty(value); onDirtyChange(value); }, [onDirtyChange]);
  const showError = useCallback(value => setError(value), []);
  useEffect(() => { onBusyChange(busy || processing); return () => onBusyChange(false); }, [busy, processing, onBusyChange]);
  const load = useCallback(async () => {
    const call = ++generation.current;
    try { const value = await client.overview(); if (call === generation.current && accountValid.current) { setData(value); setError(null); } }
    catch (failure) { if (call === generation.current) { setData(null); setError(failure); } }
  }, [client]);
  useEffect(() => {
    accountValid.current = true; void load();
    const invalidate = () => { generation.current++; accountValid.current = false; setSelected(null); setData(null); setPendingFile(null); setError({ code: 'account_changed' }); };
    window.addEventListener('rillora:account-changed', invalidate); window.addEventListener('rillora:session-expired', invalidate);
    return () => { generation.current++; accountValid.current = false; window.removeEventListener('rillora:account-changed', invalidate); window.removeEventListener('rillora:session-expired', invalidate); onDirtyChange(false); };
  }, [load, onDirtyChange]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden && !dirty && !working.current && !selected && accountValid.current) void load(); };
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('focus', refresh); };
  }, [load, selected, dirty]);
  async function perform(action, { close = true, success = 'content.saved' } = {}) {
    if (working.current || !accountValid.current) return false;
    working.current = true; setBusy(true); setError(null); setMessage(''); const call = ++generation.current;
    try {
      const result = await action(); if (call !== generation.current || !accountValid.current) return false;
      const next = await client.overview(); if (call !== generation.current || !accountValid.current) return false;
      setData(next); if (close) { setSelected(null); dirtyChanged(false); } setMessage(success); return result ?? true;
    } catch (failure) { if (call === generation.current) setError(failure); return false; }
    finally { working.current = false; if (call === generation.current) setBusy(false); }
  }
  const upload = (file, name, kind = 'file') => {
    if (!uploadKeys.current.has(file)) uploadKeys.current.set(file, crypto.randomUUID());
    return perform(() => client.upload(file, { requestKey: uploadKeys.current.get(file), kind,
      mediaType: kind === 'voice' ? 'audio/wav' : file.type, metadata: { name, description: '', transcript: '', transcriptConfirmed: false, language: locale === 'zh-CN' ? 'zh-CN' : 'en-US' } }), { close: false });
  };
  async function uploadFile(file) { setPendingFile(file); dirtyChanged(true); if (await upload(file, file.name)) { setPendingFile(null); dirtyChanged(false); } }
  const writable = data?.canCreate && data.acceptedNotice;
  const back = () => { setSelected(null); dirtyChanged(false); setMessage(''); setError(null); };
  return <section className="legacy-content" aria-busy={busy}>
    {error && <div className="drawer-alert" role="alert"><p>{contentError(error, t)}</p>{!dirty && <button className="text-button" disabled={busy || !accountValid.current} onClick={() => void load()}>{t('content.retry')}</button>}</div>}
    {message && <p className="legacy-status" role="status">{t(message)}</p>}
    {!data && !error && <p role="status">{t('content.loading')}</p>}
    {data && <>
      {!selected && <nav className="legacy-tabs" aria-label={t('workspace.nav.legacy')}>{['packs', 'files', 'received'].map(value => <button key={value} type="button" className={value === tab ? 'active' : ''} aria-current={value === tab ? 'page' : undefined} disabled={busy || dirty} onClick={() => { setTab(value); setMessage(''); }}>{t(`content.${value}`)}</button>)}
        <button className="icon-button" aria-label={t('content.retry')} disabled={busy || dirty} onClick={() => void load()}><ArrowClockwise size={20}/></button></nav>}
      {!data.canCreate && tab !== 'received' && !selected?.publication && <div className="legacy-upgrade"><p>{t(data.writesEnabled === false ? 'content.readOnly' : 'content.family')}</p>{data.writesEnabled !== false && <button className="text-button" onClick={onReviewPlan}>{t('content.reviewPlan')}</button>}</div>}
      {data.canCreate && !data.acceptedNotice && <section className="legacy-notice"><details><summary>{t('content.notice')}</summary>{Object.entries(data.notice[locale === 'zh-CN' ? 'zh-CN' : 'en']).filter(([key]) => key !== 'title').map(([key, value]) => <p key={key}>{value}</p>)}</details>
        <label className="legacy-check"><input type="checkbox" checked={accepted} disabled={busy} onChange={event => setAccepted(event.target.checked)}/><span>{t('content.noticeAccept')}</span></label>
        <button className="secondary-button" disabled={!accepted || busy} onClick={() => void perform(() => client.consent(data.notice.version), { close: false })}>{t('content.noticeContinue')}</button></section>}
      {selected?.publication ? <LegacyPublication id={selected.publication} client={client} onBack={back} onError={showError} onOpenGuide={onOpenGuide} onDirtyChange={dirtyChanged} onBusyChange={onBusyChange}/>
        : selected?.pack ? <LegacyPackEditor key={selected.pack.publicId ?? 'new'} pack={selected.pack.publicId ? selected.pack : null} assets={data.assets} contacts={contacts} matters={matters}
          busy={busy} canEdit={writable} onSave={draft => perform(() => client.savePack(selected.pack, draft))} onCancel={back} onDirtyChange={dirtyChanged} onOpenGuide={onOpenGuide}/>
          : selected?.asset ? <LegacyAssetEditor key={`${selected.asset.publicId}:${selected.asset.version}`} asset={selected.asset} canCreate={writable} busy={busy} onBack={back}
            onSave={metadata => perform(() => client.updateAsset(selected.asset, metadata))} onDelete={() => void perform(() => client.deleteAsset(selected.asset))} download={asset => client.download(asset)} onError={showError} onDirtyChange={dirtyChanged} onProcessingChange={setProcessing}/>
            : tab === 'packs' ? <>
              <div className="legacy-toolbar"><button className="primary-button" disabled={!writable || busy} onClick={() => { setSelected({ pack: {} }); setMessage(''); }}><Plus size={20}/>{t('content.newPack')}</button></div>
              {data.packs.length === 0 && <div className="legacy-empty"><Folder size={44}/><p>{t('content.emptyPacks')}</p></div>}
              <div className="legacy-pack-list">{data.packs.map(pack => {
                const person = contacts.find(contact => contact.publicId === pack.personPublicId);
                return <article className="legacy-pack" key={pack.publicId}><div className="legacy-subheading"><h2>{pack.body.title}</h2><span className="legacy-status">{t(pack.publicationId ? 'content.published' : 'content.privateDraft', { version: pack.publishedVersion })}</span></div>
                  {person && <p>{person.displayName}</p>}{pack.intent === 'after_death' && <p className="legacy-muted"><LockKey size={16}/>{t('content.futureBoundary')}</p>}
                  {pack.publicationId && pack.publishedVersion !== pack.version && <p className="legacy-muted">{t('content.newerDraft', { version: pack.publishedVersion })}</p>}
                  {pack.body.assetPublicIds.length > 0 && <ul className="legacy-muted">{pack.body.assetPublicIds.map(id => <li key={id}>{data.assets.find(asset => asset.publicId === id)?.name ?? t('content.error.unavailable')}</li>)}</ul>}
                  <div className="legacy-actions"><button className="secondary-button" disabled={busy} onClick={() => { setSelected({ pack }); setMessage(''); }}>{t('content.edit')}</button>
                    {pack.publicationId && <><button className="text-button" disabled={busy} onClick={() => setSelected({ publication: pack.publicationId })}>{t('content.viewPublished')}</button><button className="text-button" disabled={busy} onClick={() => void perform(() => client.revoke(pack), { success: 'content.revoked' })}>{t('content.revoke')}</button></>}
                  </div>
                  <button className="text-button" onClick={() => saveContentDownload(new Blob([JSON.stringify({ format: 'rillora-action-pack-v1', body: pack.body }, null, 2)], { type: 'application/json' }), 'rillora-action-pack.json')}>{t('content.export')}</button>
                  <details className="task-details"><summary>{t('content.delete')}</summary><p>{t('content.packDeleteWarning')}</p><button className="text-button" disabled={busy} onClick={() => void perform(() => client.deletePack(pack))}>{t('content.deleteConfirm')}</button></details>
                  {pack.intent === 'current' && person && (!pack.publicationId || pack.publishedVersion !== pack.version) && <div className="legacy-share"><p>{t('content.shareWarning')}</p>
                    <button className="primary-button" disabled={!writable || busy} onClick={() => void perform(() => client.publish(pack))}>{t('content.share', { name: person.displayName })}</button></div>}
                </article>;
              })}</div>
            </> : tab === 'files' ? <>
              <div className="legacy-toolbar"><button className="primary-button" disabled={!writable || busy || dirty} onClick={() => input.current?.click()}><Plus size={20}/>{t('content.upload')}</button>
                <input ref={input} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadFile(file); }}/>
                {writable && !pendingFile && <VoiceRecorder busy={busy} onSave={(blob, name) => upload(blob, name, 'voice')} onError={showError} onDirtyChange={dirtyChanged}/>}</div>
              {pendingFile && <div className="legacy-actions"><span>{pendingFile.name}</span><button className="secondary-button" disabled={busy} onClick={() => void uploadFile(pendingFile)}>{t('content.retry')}</button><button className="text-button" disabled={busy} onClick={() => { setPendingFile(null); dirtyChanged(false); }}>{t('content.cancel')}</button></div>}
              <p className="legacy-muted">{t('content.limits', { used: (data.assets.reduce((sum, asset) => sum + asset.byteCount, 0) / 1048576).toFixed(1) })}</p>
              {data.cleanupPending > 0 && <p role="status">{t('content.cleanup')}</p>}
              {data.assets.length === 0 && <div className="legacy-empty"><FileText size={44}/><p>{t('content.emptyFiles')}</p></div>}
              <div className="legacy-file-list">{data.assets.map(asset => <button className="legacy-file-row" key={asset.publicId} disabled={busy || dirty || asset.state !== 'ready'} onClick={() => { setSelected({ asset }); setMessage(''); }}>
                {asset.kind === 'voice' ? <Microphone size={24}/> : <FileText size={24}/>}<span><strong>{asset.name}</strong><small>{t(asset.state === 'ready' ? 'content.private' : 'content.pendingUpload')}</small></span><span>{(asset.byteCount / 1048576).toFixed(1)} MiB</span></button>)}</div>
            </> : <>{data.received.length === 0 && <div className="legacy-empty"><Folder size={44}/><p>{t('content.emptyReceived')}</p></div>}
              <div className="legacy-pack-list">{data.received.map(pack => <button className="legacy-file-row" key={pack.publicId} onClick={() => setSelected({ publication: pack.publicId })}><Folder size={26}/><span><strong>{pack.body.title}</strong><small>{t('content.from', { name: pack.ownerName })}</small></span></button>)}</div>
              {data.receivedNextCursor && <button className="secondary-button" disabled={busy} onClick={async () => {
                if (working.current) return; working.current = true; setBusy(true); const call = ++generation.current;
                try { const page = await client.receivedPage(data.receivedNextCursor); if (call === generation.current) setData(value => ({ ...value,
                  received: [...new Map([...value.received, ...page.items].map(item => [item.publicId, item])).values()], receivedNextCursor: page.nextCursor })); }
                catch (failure) { if (call === generation.current) setError(failure); }
                finally { working.current = false; if (call === generation.current) setBusy(false); }
              }}>{t('content.more')}</button>}</>}
      {(data.acceptedNotice || !data.canCreate) && !selected && <details className="task-details legacy-policy"><summary>{t('content.notice')}</summary>{Object.entries(data.notice[locale === 'zh-CN' ? 'zh-CN' : 'en']).filter(([key]) => key !== 'title').map(([key, value]) => <p key={key}>{value}</p>)}</details>}
    </>}
  </section>;
}
