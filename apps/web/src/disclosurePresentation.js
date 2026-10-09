import copy from '../../../config/disclosure-copy.json' with { type: 'json' };

function text(group, key, locale) {
  return (copy[group][key] ?? copy[group].unknown)[locale === 'zh-CN' ? 'zh-CN' : 'en'];
}
export function disclosureStateLabel(state, locale) {
  const key = state?.endsWith('_appealed') ? 'appealed' : state?.endsWith('_canceled') ? 'canceled' : state;
  return text('states', key, locale);
}
export const disclosureStageLabel = (stage, locale) => text('stages', stage, locale);
export function disclosureReasonLabel(reason, locale) {
  const key = Object.keys(copy.reasons).find(key => copy.reasons[key].en === reason) ?? 'unknown';
  return text('reasons', key, locale);
}
