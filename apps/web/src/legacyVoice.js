export function pcmWave(samples) {
  if (!(samples instanceof Float32Array) || !samples.length || samples.length > 16000 * 180)
    throw Object.assign(new Error('Invalid recording duration'), { code: 'legacy_voice_format' });
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const text = (at, value) => [...value].forEach((letter, index) => view.setUint8(at + index, letter.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => { const clamped = Math.max(-1, Math.min(1, Number.isFinite(sample) ? sample : 0));
    view.setInt16(44 + index * 2, Math.round(clamped * (clamped < 0 ? 32768 : 32767)), true); });
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Microphone data stays in this bounded, disposable browser session until Save. */
export async function recordVoice({ onFinished, onError, signal }) {
  let stream, context, source, worklet, mute, cancelled = false, finished = false;
  const chunks = []; let size = 0;
  function dispose() {
    stream?.getTracks().forEach(track => track.stop()); source?.disconnect(); worklet?.disconnect(); mute?.disconnect();
    if (context && context.state !== 'closed') void context.close(); chunks.forEach(chunk => chunk.fill(0)); chunks.length = 0;
    signal?.removeEventListener('abort', cancel);
  }
  function cancel() { cancelled = true; dispose(); }
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    if (signal?.aborted || !navigator.mediaDevices?.getUserMedia || !globalThis.AudioContext) throw new Error('Recording unavailable');
    // Start the context during the original button gesture. Creating it only
    // after the permission promise can leave Safari/Chrome suspended forever.
    context = new AudioContext({ sampleRate: 16000 });
    const resumed = context.resume();
    stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { channelCount: 1, sampleRate: 16000, echoCancellation: false, noiseSuppression: false } });
    if (cancelled) { dispose(); return { stop() {}, cancel }; }
    if (context.sampleRate !== 16000 || !context.audioWorklet) throw new Error('Recording format unavailable');
    await context.audioWorklet.addModule(new URL('./legacy-voice-worklet.js?no-inline', import.meta.url));
    if (cancelled) { dispose(); return { stop() {}, cancel }; }
    source = context.createMediaStreamSource(stream); worklet = new AudioWorkletNode(context, 'rillora-voice-capture');
    mute = context.createGain(); mute.gain.value = 0; source.connect(worklet); worklet.connect(mute); mute.connect(context.destination);
    worklet.port.onmessage = ({ data }) => {
      if (cancelled || finished) return;
      if (data.samples instanceof Float32Array) {
        size += data.samples.length;
        if (size > 16000 * 180) { cancel(); onError(Object.assign(new Error('Recording too long'), { code: 'legacy_voice_format' })); return; }
        chunks.push(data.samples);
      }
      if (data.done) {
        finished = true;
        try {
          const samples = new Float32Array(size); let offset = 0;
          for (const chunk of chunks) { samples.set(chunk, offset); offset += chunk.length; }
          const blob = pcmWave(samples); samples.fill(0); dispose(); onFinished(blob);
        } catch (error) { dispose(); onError(error); }
      }
    };
    await resumed;
    return { stop: () => { if (!finished && !cancelled) worklet.port.postMessage('stop'); }, cancel };
  } catch (error) { dispose(); if (!cancelled) throw Object.assign(error, { code: 'legacy_microphone_unavailable' }); return { stop() {}, cancel }; }
}
