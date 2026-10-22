import { env, WhisperTokenizer, WhisperFeatureExtractor, WhisperProcessor, WhisperForConditionalGeneration, AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import model from '../../../config/local-transcription.json' with { type: 'json' };

const root = new URL(model.publicPath, self.location.origin).href;
const assetFiles = new Map(model.files.map(file => [root + file.path, file]));
const fetchAsset = self.fetch.bind(self);
// The library runs in a dedicated worker. Limit all of its fetches to the pinned
// local assets and verify decoded bytes before parsing a model or WASM binary.
self.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : String(input), root).href;
  const asset = assetFiles.get(url);
  if (!asset) return new Response(null, { status: 404 });
  const method = (options?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-length': String(asset.bytes) } });
  if (method !== 'GET') throw new Error('Speech assets are read-only');
  const response = await fetchAsset(url, { ...options, credentials: 'omit', redirect: 'error' });
  if (!response.ok || !response.body) throw new Error('Speech asset unavailable');
  const bytes = new Uint8Array(asset.bytes), reader = response.body.getReader(); let offset = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      if (offset + value.length > bytes.length) throw new Error('Speech asset exceeds its manifest');
      bytes.set(value, offset); offset += value.length;
    }
  } finally { await reader.cancel(); }
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
  if (offset !== bytes.length || digest !== asset.sha256) throw new Error('Speech asset integrity failed');
  const headers = new Headers(response.headers); headers.delete('content-encoding'); headers.set('content-length', String(bytes.length));
  return new Response(bytes, { status: 200, headers });
};
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = root;
env.useBrowserCache = false;
env.useWasmCache = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.wasmPaths = {
  mjs: root + 'runtime/ort-wasm-simd-threaded.mjs',
  wasm: root + 'runtime/ort-wasm-simd-threaded.wasm',
};
let running = false;
self.onmessage = async ({ data }) => {
  if (running || !(data?.audio instanceof Float32Array) || data.audio.length < 1600 || data.audio.length > 16000 * 180 || !['en-US', 'zh-CN'].includes(data.language)) {
    self.postMessage({ status: 'error' }); return;
  }
  running = true; let transcriber;
  try {
    self.postMessage({ status: 'loading' });
    // A static origin has no Hub directory API. Construct the three explicit
    // components instead of guessing optional files from a remote repo listing.
    const options = { dtype: 'q8', device: 'wasm', local_files_only: true };
    const json = path => self.fetch(root + 'model/' + path).then(response => { if (!response.ok) throw new Error('Speech configuration unavailable'); return response.json(); });
    const [tokenizerJSON, tokenizerConfig, processorConfig, speechModel] = await Promise.all([
      json('tokenizer.json'), json('tokenizer_config.json'), json('preprocessor_config.json'),
      WhisperForConditionalGeneration.from_pretrained('model', options),
    ]);
    const tokenizer = new WhisperTokenizer(tokenizerJSON, tokenizerConfig);
    const processor = new WhisperProcessor({}, { tokenizer, feature_extractor: new WhisperFeatureExtractor(processorConfig) }, null);
    transcriber = new AutomaticSpeechRecognitionPipeline({ task: 'automatic-speech-recognition', model: speechModel, tokenizer, processor });
    self.postMessage({ status: 'transcribing' });
    const result = await transcriber(data.audio, { language: data.language === 'zh-CN' ? 'chinese' : 'english', task: 'transcribe',
      max_new_tokens: 180, chunk_length_s: 30, stride_length_s: 3 });
    if (typeof result?.text !== 'string' || result.text.length > 12000) throw new Error('Invalid draft');
    self.postMessage({ status: 'done', text: result.text.trim() });
  } catch (error) { if (!transcriber) console.error('Speech model initialization failed', error); self.postMessage({ status: 'error' }); }
  finally { data.audio.fill(0); await transcriber?.dispose(); self.close(); }
};
