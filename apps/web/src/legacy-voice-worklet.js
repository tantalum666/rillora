/* global AudioWorkletProcessor, registerProcessor */
class RilloraVoiceCapture extends AudioWorkletProcessor {
  constructor() {
    super(); this.buffer = new Float32Array(4096); this.used = 0; this.total = 0; this.done = false;
    this.port.onmessage = ({ data }) => { if (data === 'stop') this.finish(); };
  }
  flush() { if (this.used) { const samples = this.buffer.slice(0, this.used); this.port.postMessage({ samples }, [samples.buffer]); this.buffer.fill(0); this.used = 0; } }
  finish() { if (!this.done) { this.done = true; this.flush(); this.port.postMessage({ done: true }); } }
  process(inputs) {
    if (this.done) return false;
    const channel = inputs[0]?.[0]; if (!channel) return true;
    for (const sample of channel) {
      this.buffer[this.used++] = sample; this.total++;
      if (this.used === this.buffer.length) this.flush();
      if (this.total >= 16000 * 180) { this.finish(); return false; }
    }
    return true;
  }
}
registerProcessor('rillora-voice-capture', RilloraVoiceCapture);
