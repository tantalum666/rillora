export const LEGACY_CONTENT_ENABLED = typeof import.meta.env !== 'undefined'
  && import.meta.env.VITE_RILLORA_LEGACY_CONTENT === 'true'
  && !['closed', 'restricted-review'].includes(import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS);
export const LOCAL_TRANSCRIPTION_ENABLED = LEGACY_CONTENT_ENABLED && import.meta.env.VITE_RILLORA_LOCAL_TRANSCRIPTION === 'true';
