'use strict';

// ---------------------------------------------------------------------------
// Kits (whole setups) and single-function presets
// ---------------------------------------------------------------------------
const KITS = [
  {
    name: 'Phonk basics', group: 'Start here', a: '-pi', b: 'pi', prog: 'drift', layers: [
      { src: 'tanh(4sin(x))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
      { src: 'sq(x) + 0.7sq(1.48x)', oct: 4, pitch: 'fixed', rhythm: 'phonk', window: 1, vol: 0.4 },
      { src: 'sin(2x) + 0.5sq(7x)', oct: 4, pitch: 'follow', rhythm: '8', window: 0.25, vol: 0.3 },
      { src: 'sin(x) + 0.4sin(3x + t)', oct: 3, pitch: 'fixed', rhythm: 'hold', window: 1, vol: 0.3 },
    ],
  },
  // ---- real-world stories: curves that cause each other ----
  {
    // Newton's law of cooling; caffeine follows the one-compartment Bateman function
    // (absorbed in ~15 min, half-life ~5 h); heart rate rises with caffeine level.
    name: '☕ Your morning coffee', group: 'Everyday life', a: '0', b: '240', prog: 'pedal', bpm: 120, bars: 16, scale: 'minor', root: 9,
    caption: 'x = minutes since your first sip · °C, mg, bpm',
    layers: [
      { src: 'coffee(x) = 22 + 63e^(-x/40)', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.4 },
      { src: 'caffeine(x) = 98(e^(-x/433) - e^(-x/15))', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.35 },
      { src: 'heart(x) = 62 + 18(e^(-x/433) - e^(-x/15))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
    ],
  },
  {
    // phone charges overnight and drains all day; alertness follows the circadian rhythm
    // with the post-lunch dip; traffic noise peaks at both rush hours.
    name: '🌍 24 hours of your day', group: 'Everyday life', a: '0', b: '24', prog: 'drift', bpm: 130, bars: 16, scale: 'phrygian', root: 1,
    caption: 'x = hour of the day · everything in %',
    layers: [
      { src: 'sun(x) = 100max(0, sin(pi(x - 6)/12))', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.35 },
      { src: 'battery(x) = x < 7 ? 20 + 80x/7 : 100 - 80(x - 7)/17', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
      { src: 'alertness(x) = 50 + 30sin(2pi(x - 9)/24) - 15gauss((x - 14)/1.5)', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.4 },
      { src: 'traffic(x) = (15 + 60gauss((x - 8)/1.2) + 60gauss((x - 17.5)/1.5))(0.85 + 0.15noise())', oct: 5, pitch: 'fixed', rhythm: '16', window: 0.0625, vol: 0.15 },
    ],
  },
  {
    // The 1986 safety test: turbine rundown -> less coolant flow -> steam voids ->
    // positive void coefficient -> power excursion; AZ-5 at ~36 s, rods jam at 1/3.
    name: '☢ Reactor meltdown · Chernobyl 1986', group: 'Spectacles', a: '0', b: '45', prog: 'dark', bpm: 140, bars: 16, scale: 'harmonic', root: 4,
    caption: 'x = seconds since the turbine test began · 26 Apr 1986, 01:23:04',
    layers: [
      { src: 'turbine(x) = sin(60(1 - exp(-x/25)))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.125, vol: 0.9 },
      { src: 'steam(x) = noise()*clamp((x - 10)/30, 0, 1)^2', oct: 5, pitch: 'fixed', rhythm: '16', window: 0.0625, vol: 0.18 },
      { src: 'power(x) = tanh(exp((x - 40)/1.5))*(x < 43.5)', oct: 3, pitch: 'follow', rhythm: '16', window: 0.0625, vol: 0.45 },
      { src: 'rods(x) = clamp((x - 36)/18, 0, 1/3)*(x < 43.5)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.0625, vol: 0.35 },
    ],
  },
  {
    // Countdown riser (oscillation speeds up as 1/|x|), the double flash of the thermal pulse,
    // Taylor–Sedov fireball radius R ∝ t^(2/5), Friedlander blast wave arriving ~3 km away.
    name: '💥 Atom bomb · the last 2 minutes', group: 'Spectacles', a: '-90', b: '30', prog: 'pedal', bpm: 130, bars: 16, scale: 'phrygian', root: 1,
    caption: 'x = seconds from detonation · observer 3 km away',
    layers: [
      { src: 'tension(x) = sin(20ln(abs(x) + 0.5))*(x < 0)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.0625, vol: 0.4 },
      { src: 'flash(x) = x > 0 ? exp(-8x) + 0.9(x/2)^2 exp(2 - x) : 0', oct: 5, pitch: 'fixed', rhythm: '16', window: 0.0625, vol: 0.3 },
      { src: 'fireball(x) = (max(x, 0)/30)^0.4', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.4 },
      { src: 'blast(x) = x > 8 ? (1 - (x - 8)/3) exp(-(x - 8)/3) : 0', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.95 },
    ],
  },
  {
    // Post-Newtonian inspiral: GW frequency ∝ τ^(-3/8), amplitude ∝ τ^(-1/4), phase ∝ τ^(5/8)
    // (τ = time to merger), then an exponentially damped ringdown. The orbit runs at half
    // the GW frequency, so the two curves sit exactly an octave apart.
    name: '🕳 Black hole merger · GW150914', group: 'Spectacles', a: '-8', b: '1', prog: 'pedal', bpm: 140, bars: 16, scale: 'phrygian', root: 1,
    caption: 'x = seconds to merger (time-stretched) · two black holes, 1.3 billion light-years away',
    layers: [
      { src: 'strain(x) = x < 0 ? (0.05 - x)^(-1/4)cos(40(-x)^(5/8)) : 2.1exp(-8x)cos(60x)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.0625, vol: 0.4 },
      { src: 'orbit(x) = x < 0 ? (-x/8)^(1/4)cos(20(-x)^(5/8)) : 0', oct: 2, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
      { src: 'distance(x) = x < 0 ? (-x/8)^(1/4) : 0', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.35 },
    ],
  },
  {
    // Type Ia supernova light curve powered by the decay chain Ni-56 (τ 8.8 d) → Co-56 (τ 111.3 d) → Fe-56.
    // The three populations always sum to 1 (Bateman equations).
    name: '🌟 Supernova · where your iron comes from', group: 'Spectacles', a: '0', b: '400', prog: 'drift', bpm: 120, bars: 16, scale: 'minor', root: 2,
    caption: 'x = days after the explosion · Ni-56 → Co-56 → Fe-56, the iron in your blood',
    layers: [
      { src: 'light(x) = (6.45e^(-x/8.8) + 1.45e^(-x/111.3))/7.9', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.3 },
      { src: 'nickel(x) = e^(-x/8.8)', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
      { src: 'cobalt(x) = 1.086(e^(-x/111.3) - e^(-x/8.8))', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.35 },
      { src: 'iron(x) = 1 + 0.086e^(-x/8.8) - 1.086e^(-x/111.3)', oct: 3, pitch: 'follow', rhythm: '8', window: 0.0625, vol: 0.3 },
    ],
  },
  {
    // Shallow-water waves: speed c = √(g·depth), height grows as depth^(-1/4) (Green's law),
    // the period stays the same, so the wavelength shrinks as the sea floor rises.
    name: '🌊 Tsunami · the last 100 km', group: 'Spectacles', a: '-100', b: '0', prog: 'dark', bpm: 130, bars: 16, scale: 'harmonic', root: 4,
    caption: 'x = km from the shore · speed in 100 km/h, height in m, depth in km (wavelength not to scale)',
    layers: [
      { src: 'sea(x) = (0.0025 + (x/100)^2)^(-1/4)sin(20ln(0.01 - x/100))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
      { src: 'speed(x) = 7.13sqrt(0.0025 + (x/100)^2)', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.35 },
      { src: 'seafloor(x) = -4(0.0025 + (x/100)^2)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 1, vol: 0.3 },
    ],
  },
  {
    // Simplified ascent: altitude ≈ 0.0023·t² km, air density falls off with an 8.5 km scale height,
    // dynamic pressure q = ½ρv² peaks (Max Q); acceleration climbs as fuel burns off until engine cutoff.
    name: '🚀 Rocket launch · Max Q', group: 'Spectacles', a: '-10', b: '170', prog: 'drift', bpm: 150, bars: 16, scale: 'minor', root: 6,
    caption: 'x = seconds after liftoff · km, kPa, m/s² · Max Q at T+61 s, engine cutoff at T+155 s',
    layers: [
      { src: 'engine(x) = x > 0 && x < 155 ? noise() : 0', oct: 3, pitch: 'fixed', rhythm: 'hold', window: 0.0625, vol: 0.12 },
      { src: 'altitude(x) = x > 0 ? 0.0023x^2 : 0', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.0625, vol: 0.35 },
      { src: 'maxq(x) = x > 0 ? 0.6125e^(-0.0023x^2/8.5)(4.6x)^2/1000 : 0', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
      { src: 'accel(x) = x > 0 && x < 155 ? 12.75/(1 - 0.0045x) - 9.81 : 0', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.0625, vol: 0.3 },
    ],
  },
  // ---- famous math, for the classroom ----
  {
    name: '∿ Fourier · sine becomes square', group: 'Famous math', a: '-pi', b: 'pi', prog: 'drift', bpm: 130, bars: 8, scale: 'minor', root: 9,
    caption: 'Fourier series: add sin(3x)/3, sin(5x)/5, … and a sine turns into a square · each term = brighter sound',
    layers: [
      { src: 's1(x) = sin(x)', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
      { src: 's2(x) = sin(x) + sin(3x)/3', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 1, vol: 0.3 },
      { src: 's4(x) = sin(x) + sin(3x)/3 + sin(5x)/5 + sin(7x)/7', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 1, vol: 0.35 },
      { src: 'square(x) = pi/4·sq(x)', oct: 3, pitch: 'fixed', rhythm: 'off', window: 1, vol: 0.25 },
    ],
  },
  {
    name: '∑ Taylor series of sin(x)', group: 'Famous math', a: '-4', b: '4', prog: 'pedal', bpm: 125, bars: 8, scale: 'phrygian', root: 1,
    caption: 'sin(x) = x − x³/3! + x⁵/5! − … · near 0 every approximation sounds the same, at the edges they fall apart',
    layers: [
      { src: 'wave(x) = sin(x)', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.25, vol: 0.9 },
      { src: 'p1(x) = x', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.25, vol: 0.25 },
      { src: 'p3(x) = x - x^3/6', oct: 4, pitch: 'fixed', rhythm: 'phonk', window: 0.25, vol: 0.3 },
      { src: 'p5(x) = x - x^3/6 + x^5/120', oct: 3, pitch: 'fixed', rhythm: '8', window: 0.25, vol: 0.3 },
    ],
  },
  {
    // Binet: F(x) = (φ^x − cos(πx)·φ^(−x)) / √5 is Fibonacci at every integer and smooth in between.
    name: '🌀 Fibonacci · Binet\'s formula', group: 'Famous math', a: '-5', b: '9', prog: 'drift', bpm: 130, bars: 16, scale: 'minor', root: 2,
    caption: 'One formula hits 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 at every whole x · golden ratio φ ≈ 1.618',
    layers: [
      { src: 'fib(x) = (1.618034^x - cos(pi x)0.618034^x)/sqrt(5)', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 0.125, vol: 0.35 },
      { src: 'golden(x) = 1.618034^x/sqrt(5)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.3 },
      { src: 'wiggle(x) = -cos(pi x)0.618034^x/sqrt(5)', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.125, vol: 0.9 },
    ],
  },
  {
    name: '🔢 Prime number theorem', group: 'Famous math', a: '2', b: '100', prog: 'dark', bpm: 135, bars: 16, scale: 'harmonic', root: 4,
    caption: 'primes(x) counts the primes up to x · Gauss guessed x / ln(x) at age 15 · every step = a new prime',
    layers: [
      { src: 'count(x) = primes(x)', oct: 3, pitch: 'follow', rhythm: '16', window: 0.0625, vol: 0.35 },
      { src: 'estimate(x) = x/ln(x)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.3 },
      { src: 'error(x) = primes(x) - x/ln(x)', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 0.0625, vol: 0.9 },
    ],
  },
  // ---- pure math ----
  {
    name: 'Decay pulses · φ(x)', a: '0', b: '4', prog: 'pedal', layers: [
      { src: 'φ(x) = 12 e^(-8 mod(x, 1/2)) - 12', oct: 4, pitch: 'follow', rhythm: '8', window: 0.125, vol: 0.5 },
      { src: 'tanh(3sin(pi x/2))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
    ],
  },
  {
    name: 'Wobble · x·sin(x)', a: '-12', b: '12', prog: 'dark', layers: [
      { src: 'x*sin(x)', oct: 3, pitch: 'follow', rhythm: '16', window: 0.25, vol: 0.45 },
      { src: 'tanh(2sin(pi x/12))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
    ],
  },
  {
    name: 'Chirp drone · sin(x²)', a: '-4', b: '4', prog: 'root', layers: [
      { src: 'sin(x^2)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 0.125, vol: 0.5 },
      { src: 'tanh(4sin(pi x/4))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
      { src: 'noise()*gauss(x)', oct: 5, pitch: 'fixed', rhythm: '16', window: 1, vol: 0.2 },
    ],
  },
  {
    name: 'Tangent grit', a: '-2pi', b: '2pi', prog: 'drift', layers: [
      { src: 'tan(x)', oct: 3, pitch: 'follow', rhythm: 'phonk', window: 0.25, vol: 0.4 },
      { src: 'tanh(5sin(x/2))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
    ],
  },
  {
    name: 'Morphing (uses t)', a: '-pi', b: 'pi', prog: 'pedal', layers: [
      { src: 'sin(x) + sin(3x)*sin(t)', oct: 2, pitch: 'fixed', rhythm: 'hold', window: 1, vol: 0.4 },
      { src: 'tri(x + 2sin(t)*x)', oct: 4, pitch: 'follow', rhythm: 'phonk', window: 1, vol: 0.4 },
      { src: 'tanh(4sin(x))', oct: 1, pitch: 'fixed', rhythm: 'kick', window: 1, vol: 0.9 },
    ],
  },
];

const FUNCS = [
  ['808 · tanh(4 sin x)', 'tanh(4sin(x))'],
  ['Cowbell · two squares', 'sq(x) + 0.7sq(1.48x)'],
  ['Fourier square', 'sin(x) + sin(3x)/3 + sin(5x)/5 + sin(7x)/7'],
  ['Saw', 'saw(x)'],
  ['Wobble · x·sin(x)', 'x*sin(x)'],
  ['Wave packet', 'sin(4x)*exp(-x^2/10)'],
  ['Chirp · sin(x²)', 'sin(x^2)'],
  ['Cubic · x³ − 6x', 'x^3 - 6x'],
  ['Tangent', 'tan(x)'],
  ['Weierstrass-ish', 'cos(x) + cos(3x)/2 + cos(9x)/4 + cos(27x)/8'],
  ['Staircase', 'floor(2x) + sin(3x)/2'],
  ['Decay pulses · φ(x)', 'φ(x) = 12 e^(-8 mod(x, 1/2)) - 12'],
  ['Sinc', 'sin(4x)/x'],
  ['Noise burst', 'noise()*gauss(x)'],
  ['Morphing (t)', 'sin(x) + sin(3x)*sin(t)'],
];

const COLORS = ['#ff2a6d', '#9b5cff', '#2ee6d6', '#ffb13d'];
const NAMES = ['f', 'g', 'h', 'k'];
const MAX_LAYERS = 4;
const RHYTHMS = [['kick', '808 (kick)'], ['phonk', 'Phonk 3-3-2'], ['8', '8ths'], ['16', '16ths'], ['off', 'Offbeat'], ['hold', 'Hold / drone']];
const WINDOWS = [[1, 'Whole graph'], [0.5, '1/2'], [0.25, '1/4'], [0.125, '1/8'], [0.0625, '1/16']];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);
const P = {
  layers: [], xminSrc: '-pi', xmaxSrc: 'pi', xmin: -Math.PI, xmax: Math.PI,
  bpm: 130, bars: 8, root: 1, scale: 'phrygian', prog: 'drift', octaves: 2,
  drums: true, drive: 0.35, reverb: 0.3, volume: 0.8, aspect: '16:9', caption: '',
};
Engine.setParamSource(() => P);
let nextId = 1;

function makeLayer(o) {
  const used = new Set(P.layers.map(L => L.color));
  const L = {
    id: nextId++, src: o.src, oct: o.oct ?? 3, pitch: o.pitch ?? 'fixed', rhythm: o.rhythm ?? 'phonk',
    window: o.window ?? 1, vol: o.vol ?? 0.6, muted: !!o.muted,
    color: o.color && !used.has(o.color) ? o.color : COLORS.find(c => !used.has(c)) || COLORS[0],
    fn: null, goodSrc: null, err: '', label: null, usesT: false, flash: 0,
  };
  compileLayer(L);
  return L;
}

function compileLayer(L) {
  try {
    L.fn = MathFn.compile(L.src);
    L.goodSrc = L.src;
    L.label = MathFn.split(L.src).label;
    L.usesT = /\bt\b/.test(L.src);
    L.err = '';
  } catch (err) {
    L.err = err.message;
  }
}

const labelOf = (L, i) => L.label || `${NAMES[i] || 'f'}(x)`;

const SAVED = ['xminSrc', 'xmaxSrc', 'bpm', 'bars', 'root', 'scale', 'prog', 'octaves', 'drums', 'drive', 'reverb', 'volume', 'aspect', 'caption'];
const LAYER_SAVED = ['src', 'oct', 'pitch', 'rhythm', 'window', 'vol', 'muted', 'color'];
function snapshot() {
  const o = Object.fromEntries(SAVED.map(k => [k, P[k]]));
  o.layers = P.layers.map(L => Object.fromEntries(LAYER_SAVED.map(k => [k, L[k]])));
  return o;
}

function save() {
  // once a shared setup is edited it's the user's own, so drop the link from the address bar
  if (location.hash.startsWith('#s=')) history.replaceState(null, '', location.pathname + location.search);
  try { localStorage.setItem('fnphonk2', JSON.stringify(snapshot())); } catch { }
}

// Setups come from localStorage or from share links anyone can craft: validate every field.
function applySnapshot(o) {
  if (!o || typeof o !== 'object' || !Array.isArray(o.layers)) return false;
  const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.min(Math.max(v, lo), hi) : d);
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  const str = (v, d, max) => (typeof v === 'string' ? v.slice(0, max) : d);
  const layers = [];
  for (const l of o.layers.slice(0, MAX_LAYERS)) {
    if (!l || typeof l.src !== 'string') continue;
    layers.push({
      src: l.src.slice(0, 300), oct: Math.round(num(l.oct, 1, 5, 3)), pitch: pick(l.pitch, ['fixed', 'follow'], 'fixed'),
      rhythm: pick(l.rhythm, RHYTHMS.map(r => r[0]), 'phonk'), window: pick(l.window, WINDOWS.map(w => w[0]), 1),
      vol: num(l.vol, 0, 1, 0.6), muted: l.muted === true, color: pick(l.color, COLORS, undefined),
    });
  }
  if (!layers.length) return false;
  Object.assign(P, {
    xminSrc: str(o.xminSrc, '-pi', 40), xmaxSrc: str(o.xmaxSrc, 'pi', 40),
    bpm: num(o.bpm, 40, 240, 130), bars: pick(o.bars, [2, 4, 8, 16], 8), root: Math.round(num(o.root, 0, 11, 1)),
    scale: pick(o.scale, Object.keys(Music.SCALES), 'phrygian'), prog: pick(o.prog, Object.keys(Music.PROGRESSIONS), 'drift'),
    octaves: pick(o.octaves, [1, 2, 3], 2), drums: o.drums !== false,
    drive: num(o.drive, 0, 1, 0.35), reverb: num(o.reverb, 0, 1, 0.3), volume: num(o.volume, 0, 1, 0.8),
    aspect: pick(o.aspect, ['16:9', '9:16'], '16:9'), caption: str(o.caption, '', 200),
  });
  P.layers = [];
  for (const l of layers) P.layers.push(makeLayer(l));
  applyRange();
  return true;
}

// ---- share links: the whole setup as base64url JSON in the URL hash (#s=…)
function encodeShare(o) {
  let bin = '';
  for (const b of new TextEncoder().encode(JSON.stringify(o))) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readShareHash() {
  const m = location.hash.match(/^#s=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try {
    const bin = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

// A shared link wins over the local setup, but local storage is only overwritten once the user edits.
function load() {
  if (applySnapshot(readShareHash())) return;
  let o = null;
  try { o = JSON.parse(localStorage.getItem('fnphonk2') || 'null'); } catch { }
  if (!applySnapshot(o)) loadKit(0, false);
}

async function share() {
  const url = `${location.origin}${location.pathname}#s=${encodeShare(snapshot())}`;
  let copied = false;
  try { await navigator.clipboard.writeText(url); copied = true; } catch { }
  const box = $('shareLink');
  box.value = url; box.hidden = false;
  $('shareStatus').textContent = copied ? 'Link copied. Anyone who opens it gets this exact setup.' : 'Copy this link:';
  if (!copied) box.select();
}

function loadKit(i, persist = true) {
  const kit = KITS[i];
  Object.assign(P, { xminSrc: kit.a, xmaxSrc: kit.b, prog: kit.prog, caption: kit.caption || '' });
  for (const k of ['bpm', 'bars', 'scale', 'root']) if (k in kit) P[k] = kit[k];
  P.layers = [];
  for (const l of kit.layers) P.layers.push(makeLayer(l));
  applyRange();
  if (persist) { syncControls(); renderLayers(); Engine.syncVoices(); save(); }
}

function applyRange() {
  try {
    const a = MathFn.evalConst(P.xminSrc), b = MathFn.evalConst(P.xmaxSrc);
    if (!(b > a)) throw new Error('"to" must be greater than "from"');
    P.xmin = a; P.xmax = b;
    $('rangeErr').textContent = '';
  } catch (err) {
    $('rangeErr').textContent = 'x range: ' + err.message;
  }
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const opts = (list, sel) => list.map(([v, n]) => `<option value="${v}"${v == sel ? ' selected' : ''}>${n}</option>`).join('');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function renderLayers() {
  $('layers').innerHTML = P.layers.map((L, i) => `
    <div class="layer${L.muted ? ' muted' : ''}" data-id="${L.id}" style="--c:${L.color}">
      <div class="lrow">
        <button class="dot" data-act="mute" title="Mute / unmute"></button>
        <input class="expr${L.err ? ' bad' : ''}" data-k="src" spellcheck="false" autocomplete="off" placeholder="name(x) = formula" value="${esc(L.src)}" aria-label="${esc(labelOf(L, i))}">
        <button class="del" data-act="del" title="Remove curve">✕</button>
      </div>
      <div class="err">${esc(L.err)}</div>
      <div class="lgrid">
        <label>Octave <select data-k="oct">${opts([[1, '1 sub'], [2, '2 bass'], [3, '3'], [4, '4'], [5, '5']], L.oct)}</select></label>
        <label>Pitch <select data-k="pitch">${opts([['fixed', 'Key note'], ['follow', 'Follow curve']], L.pitch)}</select></label>
        <label>Rhythm <select data-k="rhythm">${opts(RHYTHMS, L.rhythm)}</select></label>
        <label>Wave window <select data-k="window">${opts(WINDOWS, L.window)}</select></label>
        <label class="vol">Volume <input type="range" data-k="vol" min="0" max="1" step="0.01" value="${L.vol}"></label>
        <label>Insert <select data-k="insert"><option value="">ƒ…</option>${FUNCS.map(([n], j) => `<option value="${j}">${n}</option>`).join('')}</select></label>
      </div>
    </div>`).join('');
  $('addLayer').disabled = P.layers.length >= MAX_LAYERS;
}

function layerFromEvent(e) {
  const card = e.target.closest('.layer');
  return card && P.layers.find(L => L.id === +card.dataset.id);
}

function bindLayerEvents() {
  const box = $('layers');
  let debounce;
  box.addEventListener('input', e => {
    const L = layerFromEvent(e), k = e.target.dataset.k;
    if (!L || !k) return;
    if (k === 'src') {
      L.src = e.target.value;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        compileLayer(L);
        const card = e.target.closest('.layer');
        card.querySelector('.err').textContent = L.err;
        e.target.classList.toggle('bad', !!L.err);
        Engine.syncVoices(); save();
      }, 120);
      return;
    }
    if (k === 'insert') {
      const f = FUNCS[e.target.value];
      if (!f) return;
      L.src = f[1]; compileLayer(L); renderLayers(); Engine.syncVoices(); save();
      return;
    }
    L[k] = k === 'pitch' || k === 'rhythm' ? e.target.value : parseFloat(e.target.value);
    save();
  });
  box.addEventListener('click', e => {
    const act = e.target.dataset.act, L = layerFromEvent(e);
    if (!act || !L) return;
    if (act === 'mute') { L.muted = !L.muted; e.target.closest('.layer').classList.toggle('muted', L.muted); }
    if (act === 'del') { P.layers = P.layers.filter(x => x !== L); renderLayers(); Engine.syncVoices(); }
    save();
  });
  $('addLayer').addEventListener('click', () => {
    if (P.layers.length >= MAX_LAYERS) return;
    P.layers.push(makeLayer({ src: 'wave(x) = sin(x) + sin(2x)/2', oct: 4, pitch: 'follow', rhythm: '8', window: 1, vol: 0.4 }));
    renderLayers(); Engine.syncVoices(); save();
    const inputs = $('layers').querySelectorAll('.expr');
    inputs[inputs.length - 1].select();
  });
}

function fillSelects() {
  $('root').innerHTML = Music.NOTES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  $('scale').innerHTML = Object.entries(Music.SCALES).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('');
  $('prog').innerHTML = Object.entries(Music.PROGRESSIONS).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('');
  const groups = new Map();
  KITS.forEach((k, i) => {
    const grp = k.group || 'Sound design';
    if (!groups.has(grp)) groups.set(grp, []);
    groups.get(grp).push(`<option value="${i}">${k.name}</option>`);
  });
  $('kit').innerHTML = '<option value="">— Load a kit —</option>' +
    [...groups].map(([grp, items]) => `<optgroup label="${grp}">${items.join('')}</optgroup>`).join('');
}

const GLOBALS = ['bpm', 'bars', 'root', 'scale', 'prog', 'octaves', 'drive', 'reverb', 'volume'];
function syncControls() {
  $('xmin').value = P.xminSrc; $('xmax').value = P.xmaxSrc; $('caption').value = P.caption;
  for (const k of GLOBALS) $(k).value = P[k];
  $('drums').checked = P.drums;
  for (const b of $('aspect').children) b.classList.toggle('on', b.dataset.v === P.aspect);
}

function bindControls() {
  $('kit').addEventListener('change', e => { if (e.target.value !== '') loadKit(+e.target.value); e.target.value = ''; });
  for (const k of ['xmin', 'xmax']) {
    $(k).addEventListener('input', e => { P[k + 'Src'] = e.target.value; applyRange(); save(); });
  }
  $('caption').addEventListener('input', e => { P.caption = e.target.value; save(); });
  $('share').addEventListener('click', share);
  $('shareLink').addEventListener('focus', e => e.target.select());
  // pasting a share link into an already-open tab only changes the hash
  window.addEventListener('hashchange', () => {
    if (!applySnapshot(readShareHash())) return;
    syncControls(); renderLayers(); resize(); Engine.applyMix(P); Engine.syncVoices();
  });
  const num = new Set(['bpm', 'bars', 'root', 'octaves', 'drive', 'reverb', 'volume']);
  for (const k of GLOBALS) {
    $(k).addEventListener('input', e => {
      let v = num.has(k) ? parseFloat(e.target.value) : e.target.value;
      if (k === 'bpm') { if (!(v >= 40)) return; v = Math.min(v, 240); }
      P[k] = v;
      Engine.applyMix(P); save();
    });
  }
  $('drums').addEventListener('change', e => { P.drums = e.target.checked; save(); });
  for (const b of $('aspect').children) b.addEventListener('click', () => { P.aspect = b.dataset.v; syncControls(); resize(); save(); });

  $('play').addEventListener('click', togglePlay);
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    e.preventDefault(); togglePlay();
  });
  $('recSweep').addEventListener('click', () => (rec ? stopRecording() : startRecording(true)));
  $('recFree').addEventListener('click', () => (rec ? stopRecording() : startRecording(false)));
  bindLayerEvents();
}

let starting = false;
async function play() {
  if (starting) return;
  starting = true;
  try {
    const loading = Engine.init();
    Engine.applyMix(P);
    await loading;
    await Engine.start();
  } finally { starting = false; }
  cur = null;
  $('play').textContent = '■ STOP'; $('play').classList.add('on');
}
function stop() {
  Engine.stop();
  cur = null;
  $('play').textContent = '▶ PLAY'; $('play').classList.remove('on');
}
function togglePlay() {
  if (rec) return stopRecording();
  Engine.state.playing ? stop() : play();
}

// ---------------------------------------------------------------------------
// Recording (canvas video + engine audio)
// ---------------------------------------------------------------------------
let rec = null, recTimer = null;

async function startRecording(oneSweep) {
  if (!window.MediaRecorder || !cv.captureStream) { $('recStatus').textContent = 'Recording is not supported in this browser.'; return; }
  await play();
  const stream = cv.captureStream(60);
  for (const tr of Engine.recStream.getAudioTracks()) stream.addTrack(tr);
  const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
  const chunks = [];
  rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 14e6, audioBitsPerSecond: 256e3 });
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const type = rec.mimeType || mimeType || 'video/webm';
    const blob = new Blob(chunks, { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `math-phonk-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('recStatus').textContent = `Saved ${a.download}`;
    rec = null;
    for (const b of [$('recSweep'), $('recFree')]) b.classList.remove('live');
  };
  rec.start(250);
  for (const b of [$('recSweep'), $('recFree')]) b.classList.add('live');
  $('recStatus').textContent = 'Recording… click a record button again to stop.';
  if (oneSweep) {
    const dur = P.bars * 16 * 60 / P.bpm / 4 + 1.5;
    recTimer = setTimeout(stopRecording, dur * 1000 + 100);
  }
}

function stopRecording() {
  clearTimeout(recTimer);
  if (rec && rec.state !== 'inactive') rec.stop();
  stop();
}

// ---------------------------------------------------------------------------
// Visuals
// ---------------------------------------------------------------------------
const cv = $('stage'), g = cv.getContext('2d');
let W, H, sc, plot, scopeBox, titleBox;
let cur = null, kickAmt = 0, flashAmt = 0, visLo = -1, visHi = 1, visInit = false;
const ripples = [];
const t0 = performance.now();
let scopeBuf = null;

const grain = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), img = x.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return g.createPattern(c, 'repeat');
})();
const scan = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 4;
  const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, 0, 4, 1);
  return g.createPattern(c, 'repeat');
})();

function resize() {
  if (P.aspect === '9:16') { cv.width = 1080; cv.height = 1920; } else { cv.width = 1920; cv.height = 1080; }
  W = cv.width; H = cv.height; sc = Math.min(W, H) / 1080;
  if (W > H) {
    titleBox = { x: 130, y: 70, align: 'left', maxW: W * 0.6 };
    plot = { x: 130, y: 290, w: W - 230, h: 560 };
    scopeBox = { x: 130, y: 890, w: W - 230, h: 130 };
  } else {
    titleBox = { x: W / 2, y: 150, align: 'center', maxW: W - 120 };
    plot = { x: 100, y: 520, w: W - 160, h: 960 };
    scopeBox = { x: 100, y: 1560, w: W - 160, h: 220 };
  }
}

function niceStep(span, n) {
  const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / p;
  return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p;
}
const fmt = v => (Math.abs(v) < 1e-9 ? '0' : Math.abs(v) >= 1000 || Math.abs(v) < 0.01 ? v.toExponential(1) : +v.toFixed(2) + '');
const toX = x => plot.x + (x - P.xmin) / (P.xmax - P.xmin) * plot.w;
const toY = y => plot.y + plot.h - (y - visLo) / (visHi - visLo) * plot.h;
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

function prettyFormula(s) {
  return MathFn.split(s).body.trim().replace(/\*\*/g, '^').replace(/\s*\*\s*/g, '·').replace(/\bpi\b/g, 'π')
    .replace(/\btau\b/g, 'τ').replace(/\bsqrt\b/g, '√');
}

function sampleCurve(fn, t) {
  const n = Math.round(plot.w / 2), pts = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const x = P.xmin + (P.xmax - P.xmin) * i / n, y = fn(x, t);
    pts[i] = isFinite(y) ? [toX(x), toY(y)] : null;
  }
  return pts;
}

function strokeCurve(pts, from, upto, width, style, alpha) {
  g.lineWidth = width; g.strokeStyle = style; g.globalAlpha = alpha;
  g.beginPath();
  let pen = false;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!p || p[0] < from) { pen = false; continue; }
    if (p[0] > upto) break;
    // break at asymptotes (huge jumps between neighbouring samples)
    if (pen && Math.abs(p[1] - pts[i - 1][1]) > plot.h * 1.5) pen = false;
    pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
    pen = true;
  }
  g.stroke();
  g.globalAlpha = 1;
}

function drawGrid() {
  g.lineWidth = 1 * sc;
  g.font = `${18 * sc}px "JetBrains Mono", monospace`;
  g.fillStyle = 'rgba(200,180,230,0.35)';
  const xs = niceStep(P.xmax - P.xmin, W > H ? 12 : 7), ys = niceStep(visHi - visLo, 6);
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let v = Math.ceil(P.xmin / xs) * xs; v <= P.xmax + 1e-9; v += xs) {
    const px = toX(v);
    g.strokeStyle = 'rgba(155,92,255,0.09)';
    g.beginPath(); g.moveTo(px, plot.y); g.lineTo(px, plot.y + plot.h); g.stroke();
    g.fillText(fmt(v), px, plot.y + plot.h + 12 * sc);
  }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = Math.ceil(visLo / ys) * ys; v <= visHi + 1e-9; v += ys) {
    const py = toY(v);
    g.strokeStyle = 'rgba(155,92,255,0.09)';
    g.beginPath(); g.moveTo(plot.x, py); g.lineTo(plot.x + plot.w, py); g.stroke();
    g.fillText(fmt(v), plot.x - 14 * sc, py);
  }
  g.strokeStyle = 'rgba(230,210,255,0.35)'; g.lineWidth = 2 * sc;
  if (P.xmin < 0 && P.xmax > 0) { g.beginPath(); g.moveTo(toX(0), plot.y); g.lineTo(toX(0), plot.y + plot.h); g.stroke(); }
  if (visLo < 0 && visHi > 0) { g.beginPath(); g.moveTo(plot.x, toY(0)); g.lineTo(plot.x + plot.w, toY(0)); g.stroke(); }
}

function drawTitles() {
  const n = P.layers.length || 1;
  let size = [60, 44, 34, 26][n - 1] * sc;
  const lines = P.layers.map((L, i) => [`${labelOf(L, i)} = ${prettyFormula(L.goodSrc || L.src)}`, L]);
  g.font = `800 ${size}px "JetBrains Mono", monospace`;
  const widest = () => Math.max(0, ...lines.map(([s]) => g.measureText(s).width));
  while (widest() > titleBox.maxW && size > 20 * sc) { size -= 2 * sc; g.font = `800 ${size}px "JetBrains Mono", monospace`; }
  g.textAlign = titleBox.align; g.textBaseline = 'alphabetic';
  let y = titleBox.y * sc + size;
  for (const [s, L] of lines) {
    g.fillStyle = L.muted ? 'rgba(255,255,255,0.35)' : '#fff';
    g.shadowColor = rgba(L.color, 0.9); g.shadowBlur = 22 * sc;
    g.fillText(s, titleBox.x, y);
    y += size * 1.28;
  }
  g.shadowBlur = 0;
  g.font = `700 ${20 * sc}px "JetBrains Mono", monospace`;
  let sy = y - size * 0.28 + 24 * sc;
  if (P.caption) {
    g.fillStyle = '#ff2a6d';
    g.fillText(P.caption, titleBox.x, sy, titleBox.maxW);
    sy += 28 * sc;
  }
  g.fillStyle = 'rgba(233,227,242,0.55)';
  g.fillText(`${P.bpm} BPM · ${Music.NOTES[P.root]} ${Music.SCALES[P.scale].name.toUpperCase()} · ${Music.PROGRESSIONS[P.prog].name}`,
    titleBox.x, sy);
}

function drawReadout(head, t) {
  const rows = [[`x = ${head.toFixed(3)}`, 'rgba(233,227,242,0.8)']];
  P.layers.forEach((L, i) => {
    if (!L.fn) return;
    const y = L.fn(head, t), note = cur && cur.notes[i] != null ? Music.name(cur.notes[i]) : '';
    rows.push([`${labelOf(L, i)} = ${isFinite(y) ? y.toFixed(2) : '∞'}  ${note}`, L.muted ? 'rgba(255,255,255,0.3)' : L.color]);
  });
  g.font = `700 ${20 * sc}px "JetBrains Mono", monospace`;
  g.textBaseline = 'alphabetic';
  if (W > H) {
    g.textAlign = 'right';
    rows.forEach(([s, c], i) => { g.fillStyle = c; g.fillText(s, W - 100, 88 + i * 32); });
  } else {
    g.textAlign = 'center';
    g.fillStyle = rows[0][1];
    g.fillText(rows.map(r => r[0]).join('   '), W / 2, plot.y - 30, W - 80);
  }
}

function drawScope() {
  const an = Engine.analyser;
  const { x, y, w, h } = scopeBox;
  g.strokeStyle = 'rgba(155,92,255,0.15)'; g.lineWidth = 1 * sc;
  g.beginPath(); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
  if (!an) return;
  if (!scopeBuf) scopeBuf = new Float32Array(an.fftSize);
  an.getFloatTimeDomainData(scopeBuf);
  // trigger on a rising zero crossing so the waveform holds still
  let start = 0;
  for (let i = 1; i < scopeBuf.length / 2; i++) if (scopeBuf[i - 1] < 0 && scopeBuf[i] >= 0) { start = i; break; }
  const n = scopeBuf.length / 2;
  for (const [lw, a] of [[8 * sc, 0.15], [2.5 * sc, 0.9]]) {
    g.lineWidth = lw; g.strokeStyle = `rgba(233,227,242,${a * 0.8})`;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const v = Math.max(-1, Math.min(1, scopeBuf[start + i] * 1.4));
      const px = x + i / (n - 1) * w, py = y + h / 2 - v * h / 2;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  }
}

function frame() {
  requestAnimationFrame(frame);
  const ctx = Engine.ctx, playing = Engine.state.playing && !!cur;
  const now = ctx ? ctx.currentTime : 0;

  // consume audio events that have become audible
  const ev = Engine.events;
  while (ev.length && ev[0].time <= now) {
    cur = ev.shift();
    if (cur.kick) kickAmt = 1;
    if (cur.snare) flashAmt = 1;
    cur.hits.forEach((h, i) => { if (h && P.layers[i]) P.layers[i].flash = 1; });
  }
  const t = Engine.state.playing ? Math.max(0, now - Engine.state.startTime) : (performance.now() - t0) / 1000;
  const span = P.xmax - P.xmin;

  let progress = 1;
  if (playing) {
    const frac = cur.s === cur.total - 1 ? 0 : Math.min(1, (now - cur.time) / cur.sd);
    progress = cur.total > 1 ? Math.min(1, (cur.s + frac) / (cur.total - 1)) : 0;
  }
  const head = P.xmin + span * progress;

  // shared y-axis: union of every curve's robust range, smoothed
  let lo = Infinity, hi = -Infinity;
  for (const L of P.layers) {
    if (!L.fn) continue;
    const r = MathFn.range(L.fn, P.xmin, P.xmax, L.usesT ? t : 0, 200);
    lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]);
  }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  const pad = (hi - lo) * 0.12;
  if (!visInit) { visLo = lo - pad; visHi = hi + pad; visInit = true; }
  visLo += (lo - pad - visLo) * 0.15; visHi += (hi + pad - visHi) * 0.15;

  // ---- background
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#07050b'; g.fillRect(0, 0, W, H);
  const bg = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75);
  bg.addColorStop(0, `rgba(90,14,70,${0.35 + kickAmt * 0.25})`); bg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // kick = zoom punch + slight shake
  const z = 1 + kickAmt * 0.022, shake = kickAmt * 6 * sc;
  g.translate(W / 2 + (Math.random() - 0.5) * shake, H / 2 + (Math.random() - 0.5) * shake);
  g.scale(z, z); g.translate(-W / 2, -H / 2);

  drawGrid();

  g.save();
  g.beginPath(); g.rect(plot.x, plot.y, plot.w, plot.h); g.clip();

  const layerPts = P.layers.map(L => (L.fn ? sampleCurve(L.fn, t) : null));

  // wave-window bands: the slice of each curve that is currently the waveform
  if (playing) {
    P.layers.forEach(L => {
      if (!L.fn || L.muted) return;
      const [ws, ww] = Engine.windowAt(P, L, progress), x0 = toX(ws), x1 = toX(ws + ww);
      g.fillStyle = rgba(L.color, 0.035 + L.flash * 0.05);
      g.fillRect(x0, plot.y, x1 - x0, plot.h);
      g.fillStyle = rgba(L.color, 0.8);
      g.fillRect(x0, plot.y + plot.h - 5 * sc, x1 - x0, 5 * sc);
    });
  }

  P.layers.forEach((L, i) => {
    const pts = layerPts[i];
    if (!pts) return;
    const energy = L.muted ? 0 : L.rhythm === 'hold' ? 0.7 : L.flash;
    let x0 = -Infinity, x1 = Infinity;
    if (playing) {
      const [ws, ww] = Engine.windowAt(P, L, progress);
      x0 = toX(ws); x1 = toX(ws + ww);
      strokeCurve(pts, -Infinity, Infinity, 3 * sc, L.color, L.muted ? 0.12 : 0.3);
    }
    if (L.muted && playing) return;
    g.globalCompositeOperation = 'lighter';
    if (kickAmt > 0.15 && !L.muted) { // chromatic split on kicks
      const o = kickAmt * 7 * sc;
      g.translate(o, 0); strokeCurve(pts, x0, x1, 3 * sc, '#ff0040', 0.4 * kickAmt);
      g.translate(-2 * o, 0); strokeCurve(pts, x0, x1, 3 * sc, '#00e5ff', 0.4 * kickAmt);
      g.translate(o, 0);
    }
    strokeCurve(pts, x0, x1, (22 + energy * 16) * sc, L.color, 0.05 + energy * 0.08);
    strokeCurve(pts, x0, x1, 10 * sc, L.color, 0.14 + energy * 0.12);
    g.globalCompositeOperation = 'source-over';
    strokeCurve(pts, x0, x1, (3.5 + energy * 1.5) * sc, L.color, L.muted ? 0.35 : 1);
  });

  // playhead + one dot per curve
  if (playing) {
    const hx = toX(head);
    g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 2 * sc;
    g.beginPath(); g.moveTo(hx, plot.y); g.lineTo(hx, plot.y + plot.h); g.stroke();
    P.layers.forEach((L, i) => {
      if (!L.fn || L.muted) return;
      const y = L.fn(head, t);
      if (!isFinite(y)) return;
      const hy = toY(y), r = (8 + L.flash * 5) * sc;
      if (L.flash > 0.95) ripples.push({ x: hx, y: hy, age: 0, color: L.color });
      const glow = g.createRadialGradient(hx, hy, 0, hx, hy, 50 * sc);
      glow.addColorStop(0, rgba(L.color, 0.6)); glow.addColorStop(1, rgba(L.color, 0));
      g.fillStyle = glow; g.beginPath(); g.arc(hx, hy, 50 * sc, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(hx, hy, r, 0, Math.PI * 2); g.fill();
      const note = cur.notes[i] != null ? Music.name(cur.notes[i]) : '';
      g.font = `800 ${24 * sc}px "JetBrains Mono", monospace`;
      g.textAlign = hx > plot.x + plot.w * 0.85 ? 'right' : 'left'; g.textBaseline = 'bottom';
      g.fillStyle = L.color;
      g.fillText(note, hx + (g.textAlign === 'left' ? 18 : -18) * sc, hy - 12 * sc);
    });
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.age += 1 / 60;
    if (r.age > 0.6) { ripples.splice(i, 1); continue; }
    g.strokeStyle = rgba(r.color, (1 - r.age / 0.6) * 0.8);
    g.lineWidth = 3 * sc;
    g.beginPath(); g.arc(r.x, r.y, (14 + r.age * 120) * sc, 0, Math.PI * 2); g.stroke();
  }
  g.restore();

  // ---- HUD (not zoomed)
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawTitles();
  if (playing) drawReadout(head, t);
  else {
    g.font = `700 ${22 * sc}px "JetBrains Mono", monospace`; g.fillStyle = 'rgba(233,227,242,0.45)';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('press PLAY or Space', plot.x + plot.w / 2, plot.y + plot.h + 70 * sc);
  }
  drawScope();

  if (playing) {
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, H - 8 * sc, W, 8 * sc);
    g.fillStyle = '#ff2a6d'; g.fillRect(0, H - 8 * sc, W * progress, 8 * sc);
  }

  // ---- post: snare flash, grain, scanlines, vignette
  if (flashAmt > 0.01) { g.fillStyle = `rgba(255,40,100,${flashAmt * 0.1})`; g.fillRect(0, 0, W, H); }
  g.globalAlpha = 0.06;
  g.save(); g.translate(Math.random() * 256, Math.random() * 256);
  g.fillStyle = grain; g.fillRect(-256, -256, W + 512, H + 512); g.restore();
  g.globalAlpha = 0.35; g.fillStyle = scan; g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  kickAmt *= 0.86; flashAmt *= 0.8;
  for (const L of P.layers) L.flash *= 0.88;
}

// ---------------------------------------------------------------------------
load();
fillSelects();
syncControls();
renderLayers();
bindControls();
resize();
requestAnimationFrame(frame);
