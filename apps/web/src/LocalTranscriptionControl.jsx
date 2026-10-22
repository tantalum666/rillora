import { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { transcribeLocally } from './localTranscription.js';
import licenses from './assets/local-speech-licenses.txt?url';

export default function LocalTranscriptionControl({ asset, language, download, onDraft, onBusyChange }) {
  const { t } = useI18n(); const [stage, setStage] = useState(null), [draft, setDraft] = useState(null), [failed, setFailed] = useState(false);
  const abort = useRef(null), generation = useRef(0);
  useEffect(() => () => { generation.current++; abort.current?.abort(); onBusyChange(false); }, [onBusyChange]);
  async function start() {
    if (stage) return; abort.current = new AbortController(); const call = ++generation.current;
    setStage('loading'); setFailed(false); setDraft(null); onBusyChange(true);
    try {
      const { blob } = await download(asset);
      const text = await transcribeLocally(blob, language, value => { if (call === generation.current) setStage(value); }, abort.current.signal);
      if (call === generation.current) setDraft(text);
    } catch { if (call === generation.current) setFailed(true); }
    finally { if (call === generation.current) { setStage(null); onBusyChange(false); } }
  }
  function cancel() { generation.current++; abort.current?.abort(); setStage(null); onBusyChange(false); }
  return <div className="legacy-local-transcription">
    <p className="legacy-muted">{t('content.localSpeechNotice')}</p>
    <a className="legacy-muted" href={licenses} target="_blank" rel="noopener noreferrer">{t('content.speechLicenses')}</a>
    {!stage && <button className="secondary-button" type="button" onClick={() => void start()}>{t('content.transcribe')}</button>}
    {stage && <><p role="status">{t(`content.transcription.${stage}`)}</p><button className="text-button" type="button" onClick={cancel}>{t('content.cancelTranscription')}</button></>}
    {failed && <p role="alert">{t('content.transcriptionError')}</p>}
    {draft !== null && <div className="legacy-draft"><p className="legacy-preserve-lines">{draft}</p><p className="legacy-muted">{t('content.draftCheck')}</p>
      <button className="secondary-button" type="button" onClick={() => { onDraft(draft); setDraft(null); }}>{t('content.useDraft')}</button><button className="text-button" type="button" onClick={() => setDraft(null)}>{t('content.discardDraft')}</button></div>}
  </div>;
}
