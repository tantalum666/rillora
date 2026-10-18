import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { useI18n } from './i18n/I18nProvider.jsx';
import './ai-connections.css';

export default function AiConnectionsPanel({ plannerPublicId, apiClient = api }) {
  const { t, errorMessage, formatDate } = useI18n();
  const [data, setData] = useState(null), [items, setItems] = useState([]), [cursor, setCursor] = useState(null);
  const [clientKey, setClientKey] = useState(''), [selected, setSelected] = useState([]);
  const [gaps, setGaps] = useState(false), [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(null);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setData(null); setItems([]); setSelected([]); setClientKey(''); setAcknowledged(false); setError(null); setPending(null);
    Promise.all([apiClient.getAiConnections(), apiClient.getAiSelectableMatters(null)]).then(async ([connections, page]) => {
      const interaction = connections.customerOAuth ? (await apiClient.getAiOAuthInteraction()).pending : null;
      if (current !== generation.current) return;
      setData({ ...connections, owner: plannerPublicId }); setItems(page.matters); setCursor(page.nextCursor);
      setClientKey(interaction?.clientKey ?? connections.clients[0]?.key ?? '');
      setPending(interaction); setGaps(Boolean(interaction?.scopes.includes('readiness:read:scoped')));
    }).catch(error => { if (current === generation.current) setError(error); });
    return () => { generation.current++; };
  }, [apiClient, plannerPublicId, revision]);
  const current = data?.owner === plannerPublicId ? data : null;
  const active = current?.connections.find(connection => connection.clientKey === clientKey);
  const clientName = current?.clients.find(client => client.key === clientKey)?.name ?? '';
  const privacyUrl = current?.clients.find(client => client.key === clientKey)?.privacyUrl;
  const canSelect = !current?.customerOAuth || Boolean(pending);
  const run = async operation => {
    const requestGeneration = generation.current;
    setBusy(true); setError(null); setMessage('');
    try {
      const result = await operation();
      if (requestGeneration !== generation.current) return;
      if (result.redirectTo) {
        const target = new URL(result.redirectTo);
        if (target.origin !== window.location.origin || !target.pathname.startsWith('/api/ai/oauth/')) throw new Error('Invalid connection return');
        window.location.assign(target.href); return;
      }
      const refreshed = await apiClient.getAiConnections();
      if (requestGeneration !== generation.current) return;
      setData({ ...refreshed, owner: plannerPublicId }); setAcknowledged(false);
      setMessage(result.revoked ? 'workspace.ai.revoked' : 'workspace.ai.saved');
    } catch (error) { if (requestGeneration === generation.current) setError(error); }
    finally { if (requestGeneration === generation.current) setBusy(false); }
  };
  const choose = id => {
    setSelected(values => values.includes(id) ? values.filter(value => value !== id) : [...values, id]);
    setAcknowledged(false); setMessage('');
  };
  const loadMore = async () => {
    const requestGeneration = generation.current;
    setBusy(true); setError(null);
    try {
      const page = await apiClient.getAiSelectableMatters(cursor);
      if (requestGeneration !== generation.current) return;
      setItems(values => [...new Map([...values, ...page.matters].map(item => [item.publicId, item])).values()]);
      setCursor(page.nextCursor);
    } catch (error) { if (requestGeneration === generation.current) setError(error); }
    finally { if (requestGeneration === generation.current) setBusy(false); }
  };
  const save = () => run(() => {
    const selection = { clientKey,
    matters: items.filter(item => selected.includes(item.publicId)).map(item => ({ publicId: item.publicId, expectedVersion: item.version })),
    scopes: ['matters:read:summary', ...(gaps ? ['readiness:read:scoped'] : [])],
    consentVersion: current.consentVersion, acknowledgedDisclosure: acknowledged,
    ...(pending?.shareVerifiedEmail ? {identityDisclosure:{version:current.identityDisclosureVersion,acknowledged:true}} : {}),
    ...(active ? { replace: { publicId: active.publicId, expectedVersion: active.version } } : {}),
    };
    return pending ? apiClient.completeAiOAuth({selection,interactionUid:pending.uid}) : apiClient.authorizeAiConnection(selection);
  });
  return <section className="account-identity-panel ai-connections" aria-labelledby="ai-connections-title" aria-busy={busy}>
    <h3 id="ai-connections-title">{t('workspace.ai.title')}</h3>
    {error && <><p role="alert">{error.code === 'ai_verified_email_required' ? t('workspace.ai.verifyEmail') : errorMessage(error, 'workspace.ai.failed')}</p><button type="button" className="text-button" disabled={busy} onClick={() => setRevision(value => value + 1)}>{t('workspace.ai.reload')}</button></>}
    {!current ? <p role="status">{t(error ? 'workspace.ai.unavailable' : 'workspace.ai.loading')}</p> : <>
      <p>{t(pending ? 'workspace.ai.pending' : current.customerOAuth ? 'workspace.ai.startAtClient' : 'workspace.ai.intro', {name:clientName})}</p>
      <label className="field-label">{t('workspace.ai.application')}<select value={clientKey} disabled={busy || Boolean(pending)} onChange={event => {
        setClientKey(event.target.value); setSelected([]); setAcknowledged(false); setMessage('');
      }}>{current.clients.map(client => <option key={client.key} value={client.key}>{client.name}</option>)}</select></label>
      {active && <div className="ai-current-grant">
        <p>{t(active.status === 'expired' ? 'workspace.ai.expired' : active.status === 'needs_review' ? 'workspace.ai.needsReview' : active.status === 'scope_reduced' ? 'workspace.ai.scopeReduced' : 'workspace.ai.active', { count: active.selectedCount, date: formatDate(active.expiresAt, { dateStyle: 'medium', timeStyle: 'short' }) })}</p>
        <button className="text-button" type="button" disabled={busy} onClick={() => void run(() => apiClient.revokeAiConnection(active.publicId, active.version))}>{t('workspace.ai.revoke')}</button>
      </div>}
      {canSelect && <><fieldset disabled={busy} className="ai-matter-selection"><legend>{t('workspace.ai.select', { count: selected.length })}</legend>
        {items.length === 0 && <p>{t('workspace.ai.empty')}</p>}
        {items.map(item => <label key={item.publicId}><input type="checkbox" checked={selected.includes(item.publicId)}
          disabled={!selected.includes(item.publicId) && selected.length >= 20} onChange={() => choose(item.publicId)} /><span>{item.title}</span></label>)}
      </fieldset>
      {cursor && <button type="button" className="text-button" disabled={busy} onClick={() => void loadMore()}>{t('workspace.ai.more')}</button>}
      <label className="ai-check"><input type="checkbox" checked={gaps} disabled={busy || Boolean(pending && !pending.scopes.includes('readiness:read:scoped'))} onChange={event => { setGaps(event.target.checked); setAcknowledged(false); }} /><span>{t('workspace.ai.gaps')}</span></label>
      <p>{t('workspace.ai.boundary')}</p>
      {privacyUrl && <a href={privacyUrl} target="_blank" rel="noreferrer">{t('workspace.ai.privacy', { name: clientName })}</a>}
      <label className="ai-check"><input type="checkbox" checked={acknowledged} disabled={busy || !selected.length} onChange={event => setAcknowledged(event.target.checked)} />
        <span>{t(pending?.shareVerifiedEmail ? 'workspace.ai.disclosureWithEmail' : 'workspace.ai.disclosure', { name: clientName })}</span></label>
      <button className="primary-button" type="button" disabled={busy || !acknowledged || !selected.length || !clientKey} onClick={() => void save()}>{t(busy ? 'workspace.ai.saving' : pending ? 'workspace.ai.authorize' : 'workspace.ai.save')}</button>
      {pending && <button className="text-button" type="button" disabled={busy} onClick={() => void run(() => apiClient.cancelAiOAuth(pending.uid))}>{t('workspace.ai.cancel')}</button>}
      </>}
      {message && <p role="status">{t(message)}</p>}
      <details open={current.customerOAuth && !pending}><summary>{t('workspace.ai.connect')}</summary><p>{t('workspace.ai.connectHelp')}</p><code>{current.serverUrl}</code>
        {current.clients.find(c=>c.key===clientKey)?.clientId && <p>{t('workspace.ai.clientId')} <code>{current.clients.find(c=>c.key===clientKey).clientId}</code></p>}
        {current.customerOAuth && <>
          <p>{t(`workspace.ai.install.${clientKey}`)}</p>
          {clientKey === 'codex' && <code>codex mcp add rillora --url https://app.rillora.xyz/api/mcp --oauth-client-id rillora-codex-v1</code>}
          <a href="/integrations/rillora-ai-v1.zip" download>{t('workspace.ai.download')}</a>
          <p>{t('workspace.ai.afterConnect')}</p>
        </>}
      </details>
      {current.customerOAuth && <details><summary>{t('workspace.ai.storageTitle')}</summary><p>{t('workspace.ai.storage')}</p></details>}
    </>}
  </section>;
}
