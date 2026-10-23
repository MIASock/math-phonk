'use strict';

// ---------------------------------------------------------------------------
// Math: expression compiler for f(x, t). Written as a factory so the exact same
// code can be injected into the AudioWorklet that evaluates curves per sample.
// ---------------------------------------------------------------------------
function makeMathFn() {
  const TAU = Math.PI * 2;
  const wrap = x => x / TAU - Math.floor(x / TAU + 0.5);
  const helpers = {
    pi: Math.PI, e: Math.E, tau: TAU,
    ln: Math.log,
    sgn: Math.sign,
    frac: x => x - Math.floor(x),
    mod: (a, b) => ((a % b) + b) % b,
    clamp: (x, a, b) => Math.min(Math.max(x, a), b),
    saw: x => 2 * wrap(x),
    tri: x => 2 * Math.abs(2 * wrap(x)) - 1,
    sq: x => (Math.sin(x) >= 0 ? 1 : -1),
    sinc: x => (x === 0 ? 1 : Math.sin(x) / x),
    gauss: x => Math.exp(-x * x),
    noise: () => Math.random() * 2 - 1,
    primes: x => {
      const n = Math.floor(x);
      if (n < 2) return 0;
      if (n > PRIME_N) return NaN;
      if (!primeCount) primeCount = sievePrimes();
      return primeCount[n];
    },
  };

  // primeCount[n] = number of primes ≤ n (built once, on first use)
  const PRIME_N = 100000;
  let primeCount = null;
  function sievePrimes() {
    const composite = new Uint8Array(PRIME_N + 1), count = new Uint32Array(PRIME_N + 1);
    let c = 0;
    for (let i = 2; i <= PRIME_N; i++) {
      if (!composite[i]) { c++; for (let j = i * i; j <= PRIME_N; j += i) composite[j] = 1; }
      count[i] = c;
    }
    return count;
  }
  const scope = {};
  for (const k of Object.getOwnPropertyNames(Math)) scope[k] = Math[k];
  Object.assign(scope, helpers);

  // "φ(x) = …", "g(x, t) = …" or "y = …"
  const PREFIX = /^([^\s=()]+\s*\(\s*x\s*(?:,\s*t\s*)?\)|y)\s*=(?!=)\s*/;

  function split(src) {
    const s = String(src).trim(), m = s.match(PREFIX);
    return m ? { label: m[1].replace(/\s+/g, ''), body: s.slice(m[0].length) } : { label: null, body: s };
  }

  function compile(src) {
    let s = split(src).body.replace(/[·×]/g, '*').replace(/[−–]/g, '-').replace(/π/g, 'pi').trim();
    if (!s) throw new Error('Type a function of x (and optionally t)');
    if (/[^\w\s.+\-*/^%(),<>=!?:&|]/.test(s)) throw new Error('Unsupported character');
    const ids = [...new Set(s.match(/[A-Za-z_]\w*/g) || [])].filter(id => id !== 'x' && id !== 't');
    for (const id of ids) if (!(id in scope)) throw new Error(`Unknown name "${id}"`);
    s = s.replace(/\^/g, '**')
      .replace(/\b(\d+(?:\.\d*)?)\s*(?=(?!e\d)[A-Za-z_(])/g, '$1*') // 2x -> 2*x
      .replace(/\)\s*(?=[\w(])/g, ')*')                               // )( -> )*(
      .replace(/\b([A-Za-z_]\w*)(\s+(?=[\w(])|(?=\())/g, (m, id) =>    // pi x -> pi*x, x(…) -> x*(…)
        (typeof scope[id] === 'function' ? m : id + '*'));
    let fn;
    try {
      const decl = ids.length ? `const {${ids.join(',')}} = S;` : '';
      fn = new Function('S', `${decl} return function(x, t) { return +(${s}); }`)(scope);
      fn(0.5, 0);
    } catch (err) {
      throw new Error('Syntax error');
    }
    return fn;
  }

  function evalConst(src) {
    const v = compile(src)(0, 0);
    if (!isFinite(v)) throw new Error('Not a number');
    return v;
  }

  // Robust value range (1st..99th percentile) so asymptotes don't flatten everything.
  const buf = new Float64Array(400);
  function range(fn, a, b, t, n = buf.length) {
    let k = 0;
    for (let i = 0; i < n; i++) {
      const y = fn(a + (b - a) * i / (n - 1), t);
      if (isFinite(y)) buf[k++] = y;
    }
    if (!k) return [-1, 1];
    const v = buf.subarray(0, k).sort();
    let lo = v[Math.floor(k * 0.01)], hi = v[Math.max(0, Math.ceil(k * 0.99) - 1)];
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    return [lo, hi];
  }

  return { compile, evalConst, range, split };
}
const MathFn = makeMathFn();

// ---------------------------------------------------------------------------
// AudioWorklet: one oscillator per curve. The waveform IS the curve: each cycle
// sweeps x across the curve's current window and outputs f(x, t), normalized.
// ---------------------------------------------------------------------------
function curveProcessorModule() {
  class CurveVoice extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        { name: 'frequency', defaultValue: 110, minValue: 1, maxValue: 20000, automationRate: 'a-rate' },
        { name: 'gain', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'a-rate' },
        { name: 'windowStart', defaultValue: 0, automationRate: 'k-rate' },
        { name: 'windowWidth', defaultValue: 1, automationRate: 'k-rate' },
      ];
    }

    constructor() {
      super();
      this.fn = null; this.t0 = 0; this.phase = 0;
      this.lo = -1; this.hi = 1; this.fresh = true;
      this.px = 0; this.py = 0;
      this.sorted = new Float64Array(48);
      this.port.onmessage = e => {
        const d = e.data;
        if ('src' in d) { try { this.fn = MathFn.compile(d.src); this.fresh = true; } catch { this.fn = null; } }
        if ('t0' in d) this.t0 = d.t0;
      };
    }

    process(inputs, outputs, params) {
      const out = outputs[0][0];
      if (!out) return true;
      const g = params.gain, fq = params.frequency, fn = this.fn;
      let gmax = 0;
      for (let i = 0; i < g.length; i++) if (g[i] > gmax) gmax = g[i];
      if (!fn || gmax < 1e-5) { out.fill(0); this.px = this.py = 0; return true; }

      const ws = params.windowStart[0], ww = params.windowWidth[0], t = currentTime - this.t0;

      // normalize the window's values to [-1, 1] (robust against asymptotes)
      const sb = this.sorted;
      let n = 0;
      for (let k = 0; k < sb.length; k++) {
        const y = fn(ws + ww * k / (sb.length - 1), t);
        if (isFinite(y)) sb[n++] = y;
      }
      let lo = -1, hi = 1;
      if (n) { const v = sb.subarray(0, n).sort(); lo = v[Math.floor(n * 0.03)]; hi = v[Math.max(0, Math.ceil(n * 0.97) - 1)]; }
      if (this.fresh) { this.lo = lo; this.hi = hi; this.fresh = false; }
      this.lo += (lo - this.lo) * 0.3; this.hi += (hi - this.hi) * 0.3;
      const mid = (this.lo + this.hi) / 2, half = (this.hi - this.lo) / 2, inv = half > 1e-9 ? 1 / half : 0;

      const dt = 1 / sampleRate, fa = fq.length > 1, ga = g.length > 1;
      let phase = this.phase, px = this.px, py = this.py;
      for (let i = 0; i < out.length; i++) {
        phase += (fa ? fq[i] : fq[0]) * dt;
        if (phase >= 1) phase -= Math.floor(phase);
        const y = fn(ws + ww * phase, t + i * dt);
        let v = y === y && y !== Infinity && y !== -Infinity ? (y - mid) * inv : 0;
        v = v > 1 ? 1 : v < -1 ? -1 : v;
        const o = v - px + 0.995 * py; // DC blocker
        px = v; py = o;
        out[i] = o * (ga ? g[i] : g[0]);
      }
      this.phase = phase; this.px = px; this.py = py;
      return true;
    }
  }
  registerProcessor('curve-voice', CurveVoice);
}

// ---------------------------------------------------------------------------
// Music helpers
// ---------------------------------------------------------------------------
const Music = {
  NOTES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  SCALES: {
    phrygian: { name: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
    minor: { name: 'Minor', steps: [0, 2, 3, 5, 7, 8, 10] },
    harmonic: { name: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
    phrydom: { name: 'Phrygian dominant', steps: [0, 1, 4, 5, 7, 8, 10] },
    pentatonic: { name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10] },
    blues: { name: 'Blues', steps: [0, 3, 5, 6, 7, 10] },
    chromatic: { name: 'Chromatic', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  },
  PROGRESSIONS: {
    root: { name: 'Stay on root', steps: [0] },
    drift: { name: 'i – VI – VII – i', steps: [0, 8, 10, 0] },
    dark: { name: 'i – iv – VI – V', steps: [0, 5, 8, 7] },
    pedal: { name: 'i – i – VI – VII', steps: [0, 0, 8, 10] },
  },
  mtof: m => 440 * Math.pow(2, (m - 69) / 12),
  name(m) { return this.NOTES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); },
  base: (root, oct) => 12 * (oct + 1) + root,
  // Map a normalized value 0..1 onto the scale, spanning `octaves` octaves above `base`.
  quantize(norm, scale, octaves, base) {
    const steps = this.SCALES[scale].steps, len = steps.length;
    const idx = Math.round(norm * len * octaves);
    return base + 12 * Math.floor(idx / len) + steps[idx % len];
  },
};

// ---------------------------------------------------------------------------
// Audio engine: phonk drums + one curve oscillator per layer
// ---------------------------------------------------------------------------
const Engine = (() => {
  let ctx, ready = null, mix, masterShaper, masterGain, analyser, recDest;
  let drumBus, voiceBus, revSend, noiseBuf;
  let getParams = () => null;
  const voices = new Map(); // layer id -> { node, src, holding }

  const S = { playing: false, step: 0, nextTime: 0, startTime: 0, timer: null };
  const events = [];

  // 16-step patterns, two alternating bars (half-time phonk groove)
  const KICK = [[0, 10], [0, 6, 10, 13]];
  const SNARE = [[8], [8, 15]];
  const PHONK = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const DECAY = { phonk: 0.32, '8': 0.28, '16': 0.14, off: 0.24 };

  function softClipCurve(drive) {
    const n = 2048, c = new Float32Array(n), d = 1 + drive;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(d * x) / Math.tanh(d);
    }
    return c;
  }

  function makeImpulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  const gainNode = (v, dest) => { const g = ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; };

  // Creates the context synchronously (so it can be resumed inside a click), loads the worklet async.
  function init() {
    if (ready) return ready;
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });

    mix = gainNode(0.8);
    masterShaper = ctx.createWaveShaper();
    masterShaper.oversample = '4x';
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4; comp.knee.value = 6;
    comp.attack.value = 0.004; comp.release.value = 0.15;
    masterGain = gainNode(0.8);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    recDest = ctx.createMediaStreamDestination();
    mix.connect(masterShaper); masterShaper.connect(comp); comp.connect(masterGain);
    masterGain.connect(ctx.destination); masterGain.connect(analyser); masterGain.connect(recDest);

    drumBus = gainNode(0.9, mix);
    voiceBus = gainNode(1, mix);
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(2.4, 3);
    revSend = gainNode(0.35);
    voiceBus.connect(revSend); revSend.connect(reverb); reverb.connect(mix);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    applyMix(getParams());

    const code = `${makeMathFn}\nconst MathFn = makeMathFn();\n(${curveProcessorModule})();`;
    const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
    ready = ctx.audioWorklet.addModule(url).then(() => { URL.revokeObjectURL(url); syncVoices(); });
    return ready;
  }

  function applyMix(p) {
    if (!ctx || !p) return;
    masterShaper.curve = softClipCurve(p.drive * 6);
    masterGain.gain.setTargetAtTime(p.volume * 0.9, ctx.currentTime, 0.03);
    revSend.gain.setTargetAtTime(p.reverb * 0.8, ctx.currentTime, 0.03);
  }

  // Keep one worklet node per layer, and push expression changes to it.
  function syncVoices() {
    const p = getParams();
    if (!ctx || !p || !ctx.audioWorklet || voices.size === 0 && !ready) return;
    const ids = new Set(p.layers.map(L => L.id));
    for (const [id, v] of voices) {
      if (ids.has(id)) continue;
      v.node.parameters.get('gain').setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(() => v.node.disconnect(), 200);
      voices.delete(id);
    }
    for (const L of p.layers) {
      let v = voices.get(L.id);
      if (!v) {
        try {
          v = { node: new AudioWorkletNode(ctx, 'curve-voice', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] }), src: null, holding: false };
        } catch { return; } // worklet not loaded yet; init() will call us again
        v.node.connect(voiceBus);
        v.node.port.postMessage({ t0: S.startTime });
        voices.set(L.id, v);
      }
      if (v.src !== L.goodSrc) { v.src = L.goodSrc; v.node.port.postMessage({ src: L.goodSrc }); }
    }
  }

  // ---- drums --------------------------------------------------------------
  function env(g, time, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  }

  function noise(time, dur) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.start(time, Math.random() * 0.5, dur + 0.05);
    return src;
  }

  function kick(time) {
    const o = ctx.createOscillator(), g = gainNode(0);
    o.frequency.setValueAtTime(180, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.09);
    env(g, time, 1, 0.002, 0.28);
    o.connect(g); g.connect(drumBus);
    o.start(time); o.stop(time + 0.35);
    const n = noise(time, 0.01), hp = ctx.createBiquadFilter(), ng = gainNode(0);
    hp.type = 'highpass'; hp.frequency.value = 2500;
    env(ng, time, 0.5, 0.001, 0.012);
    n.connect(hp); hp.connect(ng); ng.connect(drumBus);
  }

  function clap(time, vel) {
    const bp = ctx.createBiquadFilter(), g = gainNode(0);
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
    // three quick bursts then a tail = classic clap smear
    g.gain.setValueAtTime(0, time);
    for (let i = 0; i < 3; i++) {
      const t0 = time + i * 0.011;
      g.gain.setValueAtTime(vel, t0);
      g.gain.exponentialRampToValueAtTime(vel * 0.15, t0 + 0.009);
    }
    g.gain.setValueAtTime(vel * 0.9, time + 0.034);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
    const n = noise(time, 0.3);
    n.connect(bp); bp.connect(g); g.connect(drumBus);
    const o = ctx.createOscillator(), og = gainNode(0);
    o.type = 'triangle'; o.frequency.setValueAtTime(220, time);
    o.frequency.exponentialRampToValueAtTime(140, time + 0.06);
    env(og, time, vel * 0.45, 0.001, 0.08);
    o.connect(og); og.connect(drumBus); o.start(time); o.stop(time + 0.12);
  }

  function hat(time, vel) {
    const hp = ctx.createBiquadFilter(), g = gainNode(0);
    hp.type = 'highpass'; hp.frequency.value = 7500;
    env(g, time, vel, 0.001, 0.035);
    const n = noise(time, 0.05);
    n.connect(hp); hp.connect(g); g.connect(drumBus);
  }

  // ---- curve voice envelopes ---------------------------------------------
  function hold(param, time) {
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(time); else param.cancelScheduledValues(time);
  }

  function gate(v, time, peak, f, kind, sd, untilNext) {
    const g = v.node.parameters.get('gain'), fr = v.node.parameters.get('frequency');
    hold(g, time); hold(fr, time);
    g.linearRampToValueAtTime(0, time + 0.002);
    fr.setValueAtTime(kind === 'kick' ? f * 2 : f, time + 0.002);
    if (kind === 'kick') fr.exponentialRampToValueAtTime(f, time + 0.045);
    g.linearRampToValueAtTime(peak, time + 0.006);
    if (kind === 'kick') {
      const len = Math.min(1.4, untilNext);
      g.setValueAtTime(peak, time + len * 0.6);
      g.setTargetAtTime(0, time + len * 0.6, len * 0.12);
    } else {
      g.setTargetAtTime(0, time + 0.006, DECAY[kind] / 3);
    }
    v.holding = false;
  }

  function sustain(v, time, peak, f) {
    const g = v.node.parameters.get('gain'), fr = v.node.parameters.get('frequency');
    if (!v.holding) { hold(g, time); g.setTargetAtTime(peak, time, 0.04); fr.setValueAtTime(f, time); v.holding = true; }
    else { hold(fr, time); fr.setTargetAtTime(f, time, 0.015); g.setTargetAtTime(peak, time, 0.04); }
  }

  function silence(v, time) {
    const g = v.node.parameters.get('gain');
    hold(g, time); g.setTargetAtTime(0, time, 0.02);
    v.holding = false;
  }

  // ---- sequencer ----------------------------------------------------------
  // Window [start, start+width] slides from the left edge to the right edge over one sweep.
  function windowAt(p, L, progress) {
    const span = p.xmax - p.xmin, w = span * L.window;
    return [p.xmin + (span - w) * progress, w];
  }

  function scheduleStep(gs, time) {
    const p = getParams();
    const total = p.bars * 16, s = gs % total, inBar = gs % 16, bar = Math.floor(gs / 16), B = bar % 2;
    const sd = 60 / p.bpm / 4, t = time - S.startTime;
    const progress = total > 1 ? s / (total - 1) : 0;
    const head = p.xmin + (p.xmax - p.xmin) * progress;
    const prog = Music.PROGRESSIONS[p.prog].steps, chord = prog[Math.floor(gs / 16) % prog.length];
    const kicks = KICK[B], isKick = kicks.includes(inBar), isSnare = SNARE[B].includes(inBar);
    const nextKick = kicks.find(k => k > inBar) ?? 16 + KICK[1 - B][0];

    const hits = [], notes = [];
    for (const L of p.layers) {
      const v = voices.get(L.id);
      let hit = false, midi = null;
      if (v && L.fn) {
        const [ws, ww] = windowAt(p, L, progress);
        const wsp = v.node.parameters.get('windowStart');
        v.node.parameters.get('windowWidth').setValueAtTime(ww, time);
        wsp.setValueAtTime(ws, time);
        if (s < total - 1) wsp.linearRampToValueAtTime(windowAt(p, L, (s + 1) / (total - 1))[0], time + sd);

        const base = Music.base(p.root, L.oct);
        if (L.pitch === 'follow') {
          const y = L.fn(head, t), [lo, hi] = MathFn.range(L.fn, p.xmin, p.xmax, t, 200);
          if (isFinite(y)) midi = Music.quantize(Math.min(Math.max((y - lo) / (hi - lo), 0), 1), p.scale, p.octaves, base);
        } else {
          midi = base + chord;
        }

        const peak = L.vol * 0.55, r = L.rhythm;
        if (L.muted || midi == null) silence(v, time);
        else if (r === 'hold') { sustain(v, time, peak * 0.7, Music.mtof(midi)); hit = inBar === 0; }
        else {
          hit = (r === 'kick' && isKick) || (r === 'phonk' && PHONK[inBar]) || (r === '8' && inBar % 2 === 0) ||
            r === '16' || (r === 'off' && inBar % 4 === 2);
          if (hit) gate(v, time, peak, Music.mtof(midi), r, sd, (nextKick - inBar) * sd);
        }
      }
      hits.push(hit); notes.push(midi);
    }

    if (p.drums) {
      if (isKick) kick(time);
      if (isSnare) clap(time, inBar === 15 ? 0.35 : 0.9);
      if (inBar % 2 === 0) hat(time, inBar % 4 === 0 ? 0.35 : 0.22);
      if (B === 1 && inBar >= 12) { hat(time, 0.25); if (inBar === 14) hat(time + sd / 2, 0.2); }
    }

    events.push({ time, s, total, sd, hits, notes, kick: isKick && p.drums, snare: isSnare && p.drums });
  }

  function tick() {
    const p = getParams();
    while (S.nextTime < ctx.currentTime + 0.12) {
      scheduleStep(S.step, S.nextTime);
      S.nextTime += 60 / p.bpm / 4;
      S.step++;
    }
  }

  async function start() {
    const loading = init();
    ctx.resume();
    await loading;
    if (S.playing) stop();
    S.playing = true;
    S.step = 0;
    S.startTime = ctx.currentTime + 0.08;
    S.nextTime = S.startTime;
    events.length = 0;
    syncVoices();
    for (const v of voices.values()) { v.node.port.postMessage({ t0: S.startTime }); v.holding = false; }
    tick();
    S.timer = setInterval(tick, 20);
  }

  function stop() {
    if (!S.playing) return;
    clearInterval(S.timer);
    S.playing = false;
    for (const v of voices.values()) silence(v, ctx.currentTime);
    events.length = 0;
  }

  return {
    init, start, stop, syncVoices, applyMix, windowAt, events, state: S,
    setParamSource(f) { getParams = f; },
    get ctx() { return ctx; },
    get analyser() { return analyser; },
    get recStream() { return recDest && recDest.stream; },
  };
})();
