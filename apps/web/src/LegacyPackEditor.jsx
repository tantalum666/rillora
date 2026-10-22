import { cloneElement, useEffect, useId, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { contentActions } from './legacyContent.js';
import { officialProviderGuides, getOfficialProviderGuide } from './officialProviderGuides.js';

export function ContentField({ label, children }) {
  const id = useId();
  return <div className="legacy-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id })}</div>;
}
export function LegacyPackEditor({ pack, assets, contacts, matters, busy, canEdit = true, onSave, onCancel, onDirtyChange, onOpenGuide }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => pack ? { personPublicId: pack.personPublicId, intent: pack.intent, body: structuredClone(pack.body) }
    : { personPublicId: null, intent: 'after_death', body: { title: '', note: '', tasks: [], assetPublicIds: [], assetVersions: {} } });
  const [dirty, setDirty] = useState(() => Boolean(pack && pack.body.assetPublicIds.some(id => pack.body.assetVersions[id] !== assets.find(asset => asset.publicId === id)?.version)));
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  const update = next => { setDraft(next); setDirty(true); };
  const body = patch => update({ ...draft, body: { ...draft.body, ...patch } });
  const step = (id, patch) => body({ tasks: draft.body.tasks.map(task => task.id === id ? { ...task, ...patch } : task) });
  const selectedAssets = new Set(draft.body.assetPublicIds);
  return <form className="legacy-editor" onSubmit={event => { event.preventDefault(); void onSave({ ...draft, body: { ...draft.body,
    assetVersions: Object.fromEntries(draft.body.assetPublicIds.map(id => [id, assets.find(asset => asset.publicId === id)?.version])) } }); }}>
    <fieldset disabled={busy || !canEdit}>
      <div className="legacy-field-pair">
        <ContentField label={t('content.packTitle')}><input required maxLength={180} value={draft.body.title} onChange={event => body({ title: event.target.value })}/></ContentField>
        <ContentField label={t('content.person')}><select value={draft.personPublicId ?? ''} onChange={event => update({ ...draft, personPublicId: event.target.value || null })}>
          <option value="">{t('content.noPerson')}</option>{contacts.filter(person => !['archived', 'revoked'].includes(person.status)).map(person => <option key={person.publicId} value={person.publicId}>{person.displayName}</option>)}
        </select></ContentField>
      </div>
      <ContentField label={t('content.intent')}><select value={draft.intent} onChange={event => update({ ...draft, intent: event.target.value })}>
        <option value="after_death">{t('content.future')}</option><option value="current">{t('content.current')}</option>
      </select></ContentField>
      <p className="legacy-muted">{t(draft.intent === 'after_death' ? 'content.futureBoundary' : 'content.currentBoundary')}</p>
      <ContentField label={t('content.note')}><textarea maxLength={3000} rows={3} value={draft.body.note} onChange={event => body({ note: event.target.value })}/></ContentField>
      <div className="legacy-subheading"><h2>{t('content.steps')}</h2><button type="button" className="text-button" disabled={draft.body.tasks.length >= 30}
        onClick={() => body({ tasks: [...draft.body.tasks, { id: crypto.randomUUID(), title: '', action: 'preserve', instructions: '', matterPublicId: null, providerId: null, dependsOn: [] }] })}><Plus size={18}/>{t('content.addStep')}</button></div>
      <ol className="legacy-step-editor">{draft.body.tasks.map((task, index) => <li key={task.id}>
        <div className="legacy-subheading"><strong>{t('content.step', { number: index + 1 })}</strong><button type="button" className="icon-button" aria-label={`${t('content.delete')} ${t('content.step', { number: index + 1 })}`}
          onClick={() => body({ tasks: draft.body.tasks.filter(item => item.id !== task.id).map(item => ({ ...item, dependsOn: item.dependsOn.filter(id => id !== task.id) })) })}><Trash size={18}/></button></div>
        <ContentField label={t('content.stepTitle')}><input required maxLength={180} value={task.title} onChange={event => step(task.id, { title: event.target.value })}/></ContentField>
        <div className="legacy-field-pair"><ContentField label={t('content.action')}><select value={task.action} onChange={event => step(task.id, { action: event.target.value })}>{contentActions.map(action => <option key={action} value={action}>{t(`content.action.${action}`)}</option>)}</select></ContentField>
          <ContentField label={t('content.matter')}><select value={task.matterPublicId ?? ''} onChange={event => step(task.id, { matterPublicId: event.target.value || null })}><option value="">{t('content.noMatter')}</option>{matters.map(matter => <option key={matter.publicId ?? matter.id} value={matter.publicId ?? matter.id}>{matter.title ?? matter.label}</option>)}</select></ContentField></div>
        <ContentField label={t('content.instructions')}><textarea maxLength={2500} rows={3} value={task.instructions} onChange={event => step(task.id, { instructions: event.target.value })}/></ContentField>
        <ContentField label={t('content.provider')}><select value={task.providerId ?? ''} onChange={event => step(task.id, { providerId: event.target.value || null })}><option value="">{t('content.noProvider')}</option>{officialProviderGuides.map(guide => <option key={guide.key} value={guide.key}>{guide.label}</option>)}</select></ContentField>
        {getOfficialProviderGuide(task.providerId) && <button className="text-button" type="button" onClick={() => onOpenGuide(task.providerId)}>{t('content.openGuide')}</button>}
        <details className="task-details"><summary>{t('content.prerequisites')}</summary>
          {draft.body.tasks.length === 1 && <p>{t('content.noPrerequisites')}</p>}
          {draft.body.tasks.filter(item => item.id !== task.id).map(other => <label className="legacy-check" key={other.id}><input type="checkbox" checked={task.dependsOn.includes(other.id)}
            onChange={event => step(task.id, { dependsOn: event.target.checked ? [...task.dependsOn, other.id] : task.dependsOn.filter(id => id !== other.id) })}/><span>{other.title || t('content.step', { number: draft.body.tasks.indexOf(other) + 1 })}</span></label>)}
        </details>
      </li>)}</ol>
      <h2>{t('content.selectedFiles')}</h2>
      {assets.length === 0 && <p className="legacy-muted">{t('content.noFiles')}</p>}
      <div className="legacy-file-choices">{assets.filter(asset => asset.state === 'ready').map(asset => <label className="legacy-check" key={asset.publicId}><input type="checkbox" checked={selectedAssets.has(asset.publicId)}
        disabled={!selectedAssets.has(asset.publicId) && selectedAssets.size >= 20} onChange={event => body({ assetPublicIds: event.target.checked ? [...selectedAssets, asset.publicId] : [...selectedAssets].filter(id => id !== asset.publicId) })}/><span>{asset.name}</span></label>)}</div>
      <div className="legacy-actions"><button className="primary-button" disabled={!dirty || !draft.body.title.trim()}>{t('content.save')}</button></div>
    </fieldset>
    <button type="button" className="text-button" disabled={busy} onClick={onCancel}>{t(dirty ? 'content.cancel' : 'content.back')}</button>
  </form>;
}
