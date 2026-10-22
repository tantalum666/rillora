export function waveSamples(buffer) {
  const view = new DataView(buffer);
  const magic = (at, text) => [...text].every((letter, i) => view.getUint8(at + i) === letter.charCodeAt(0));
  if (buffer.byteLength < 46 || buffer.byteLength > 44 + 16000 * 180 * 2 || !magic(0, 'RIFF') || !magic(8, 'WAVE')
    || view.getUint32(4, true) !== buffer.byteLength - 8 || view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1
    || view.getUint32(24, true) !== 16000 || view.getUint16(34, true) !== 16 || !magic(36, 'data')
    || view.getUint32(40, true) !== buffer.byteLength - 44 || (buffer.byteLength - 44) % 2) throw new Error('Unsupported recording');
  const result = new Float32Array((buffer.byteLength - 44) / 2);
  let energy = 0;
  result.forEach((_, index) => { result[index] = view.getInt16(44 + index * 2, true) / 32768; energy += result[index] ** 2; });
  if (Math.sqrt(energy / result.length) < 0.001) throw new Error('No clear speech');
  return result;
}
export async function transcribeLocally(blob, language, onProgress, signal) {
  if (signal?.aborted || blob.size > 8388608) throw new Error('Recording unavailable');
  const bytes = await blob.arrayBuffer(); let audio;
  try { audio = waveSamples(bytes); } finally { new Uint8Array(bytes).fill(0); }
  if (signal?.aborted) { audio.fill(0); throw new Error('Cancelled'); }
  let worker;
  try { worker = new Worker(new URL('./legacy-transcribe-worker.js', import.meta.url), { type: 'module' }); }
  catch (error) { audio.fill(0); throw error; }
  let release = () => {};
  try {
    return await new Promise((resolve, reject) => {
      const fail = () => reject(new Error('Local transcription unavailable'));
      const timer = setTimeout(fail, 180000);
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', fail); };
      release = cleanup;
      signal?.addEventListener('abort', fail, { once: true });
      worker.onerror = event => { event.preventDefault(); cleanup(); fail(); };
      worker.onmessage = ({ data }) => {
        if (signal?.aborted) { cleanup(); fail(); return; }
        if (data.status === 'done') { cleanup(); typeof data.text === 'string' && data.text.length <= 12000 ? resolve(data.text) : fail(); }
        else if (data.status === 'error') { cleanup(); fail(); }
        else if (['loading', 'transcribing'].includes(data.status)) onProgress(data.status);
      };
      worker.postMessage({ audio, language }, [audio.buffer]);
    });
  } finally { release(); worker.terminate(); }
}
