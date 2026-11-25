// Copper Ladle Kitchen 3D — tiny WebAudio sounds, no audio files.
// One AudioContext, created/resumed on the first user gesture. Mute silences
// everything. All sounds are oscillator / noise bursts.
export function createSoundManager() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type = 'sine', when = 0, slideTo = null) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  return {
    get muted() {
      return muted;
    },
    ensure,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    chop() {
      noise(0.09);
    },
    ding() {
      tone(880, 0.18, 'sine');
      tone(1318, 0.25, 'sine', 0.12);
    },
    buzz() {
      tone(140, 0.3, 'sawtooth');
    },
    serve() {
      tone(523, 0.14, 'sine');
      tone(659, 0.14, 'sine', 0.1);
      tone(784, 0.22, 'sine', 0.2);
    },
    tick() {
      tone(1200, 0.05, 'square');
    },
    pop() {
      tone(660, 0.12, 'sine', 0, 990);
    },
  };
}
