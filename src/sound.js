// Sound. Everything you hear is made by code at the moment it's needed: there are no sound files,
// so there's nothing extra to download or for the iPad to hold in memory.
//
// This file, from the top: the numbers to play with; how each sound is made; turning sound on
// (and the mute button's memory); and SoundCues, which spots what just happened in the match.
// To hear any sound on its own, open the game with ?sounds on the end of the address.
import { isSpeaking } from './speech.js';
import { F, HOME } from './sim.js';

// ---------- Numbers to play with ----------
const OVERALL = 0.9; // everything together, from 0 (silent) to 1

// How loud each sound is, from 0 (silent) to 1 (as loud as it goes).
const VOLUME = {
  // The ball
  kick: 0.85,    // a shot or a big clearance
  pass: 0.5,
  touch: 0.4,    // trapping it, or a drag or a spin
  header: 0.55,
  bounce: 0.28,  // landing on the grass
  boards: 0.35,  // hitting the advertising boards
  throw: 0.5,    // the keeper's throw leaving his hands
  // Tackles
  scuff: 0.35,   // stepping in with a foot out
  tackle: 0.6,   // the foot reaching the ball
  slide: 0.5,    // going to ground
  trip: 0.6,     // a player going over
  // The keeper and the goal
  catch: 0.45,   // an easy take
  save: 0.8,     // stopping a shot
  clang: 0.38,   // off the post or the bar
  net: 0.55,     // into the net
  // The referee
  whistle: 0.2,  // kick-off. (Whistles cut through everything, so these stay low.)
  fullTime: 0.2,
  // Crowd reactions
  roar: 0.95,    // your team scores
  ooh: 0.55,     // so close!
  groan: 0.5,    // the other team scores
  // Buttons, question cards and the end of a game
  tap: 0.22,
  question: 0.25, // a question pops up
  right: 0.4,
  wrong: 0.3,    // kept gentle: a wrong answer is no big deal
  fanfare: 0.45,
  pop: 0.2,      // fireworks
};

// The crowd in the background
const CROWD_VOLUME = 0.3;  // how loud it is during play
const HYPE_VOLUME = 0.35;  // how much louder and brighter it gets with the ball right by a goal
// ...and how much of that you hear at each stage of a game (the rest of the time it's silent)
const CROWD_LEVEL = { kickoff: 0.8, play: 1, goal: 1, question: 0.3, over: 0.5 };
const CROWD_FADE = 0.5;    // how slowly the crowd changes, in seconds (bigger = slower)
VOLUME.crowd = CROWD_VOLUME; // (for hearing it on its own with ?sounds)

// While the device is reading aloud, all the game's sounds drop to this share of their volume.
// (Reading aloud isn't part of the mute button: he can always have a question read to him.)
const SPEECH_DUCK = 0.06;
// How long the voice waits after an answer, so the chime can finish first (ms)
export const CHIME_TIME = 450;

const PITCH_WOBBLE = 0.07; // kicks vary by up to this much (7%), so they don't sound like a machine
const WOBBLY = new Set(['kick', 'pass', 'touch', 'header', 'bounce', 'boards', 'tackle', 'scuff', 'catch', 'save', 'pop']);
const SHORTEST_GAP = 0.05; // the same sound can't play twice closer together than this (seconds)...
const GAPS = { ooh: 1.5, groan: 1.5, roar: 3, tackle: 0.12, scuff: 0.15, touch: 0.1, bounce: 0.08, boards: 0.1, slide: 0.2 }; // ...or these

// What counts as what in the match (speeds in units a second; 20 units = 1 metre)
const SAVE_PACE = 250;      // a keeper taking a ball faster than this has made a save
const DEFLECT_PACE = 200;   // a ball this fast...
const DEFLECT_DROP = 0.6;   // ...suddenly down to this share of its speed has been blocked
const PARRY_NEAR = 45;      // a keeper this close to that ball is the one who stopped it
const BOARDS_PACE = 60;     // a slower ball meets the boards without a sound
const BOARDS_NEAR = 25;     // how near the edge of the pitch counts as at the boards
const BOUNCE_LOW = 4;       // a ball that dropped less than this far lands without a sound
const BOUNCE_HIGH = 80;     // ...and one that dropped this far lands at full volume
const BOUNCE_GROUND = 6;    // it has to be this near the grass to count as landing
const POKE_WINDOW = 0.4;    // a second poke this soon after stepping in is his foot arriving (seconds)
const FULL_TIME_AFTER = 0.7; // the final whistle comes this long after the last goal (seconds)
const FANFARE_AFTER = 2.1;   // ...and the winner's fanfare this long after it
const HYPE_CURVE = 3;       // bigger: the crowd only gets excited closer to the goal

// ---------- Building blocks ----------
// a = { ctx, out, t, pitch }: where a sound is being made, where it goes, when it starts, how high.
const QUIET = 0.0001; // volumes can only fade toward a tiny number, not all the way to zero

// A note that fades away, sliding from one pitch to another
function tone(a, { type = 'sine', from, to = from, at = 0, attack = 0.002, len, level = 1, muffle = 0 }) {
  const { ctx } = a, t = a.t + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from * a.pitch, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to * a.pitch, t + attack + len);
  g.gain.setValueAtTime(QUIET, t);
  g.gain.exponentialRampToValueAtTime(level, t + attack);
  g.gain.exponentialRampToValueAtTime(QUIET, t + attack + len);
  let end = g;
  if (muffle) { // takes the buzz off: only pitches below this get through
    end = ctx.createBiquadFilter();
    end.type = 'lowpass';
    end.frequency.value = muffle;
    g.connect(end);
  }
  o.connect(g);
  end.connect(a.out);
  o.start(t);
  o.stop(t + attack + len + 0.02);
}

// A burst of hiss with only some of its pitches let through, which can slide from one to another
function hiss(a, { band = 'bandpass', from, to = from, q = 1, at = 0, attack = 0.002, len, level = 1 }) {
  const { ctx } = a, t = a.t + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuffer(ctx);
  s.loop = true;
  f.type = band;
  f.Q.value = q;
  f.frequency.setValueAtTime(from * a.pitch, t);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to * a.pitch, t + attack + len);
  g.gain.setValueAtTime(QUIET, t);
  g.gain.exponentialRampToValueAtTime(level, t + attack);
  g.gain.exponentialRampToValueAtTime(QUIET, t + attack + len);
  s.connect(f);
  f.connect(g);
  g.connect(a.out);
  s.start(t, Math.random() * s.buffer.duration);
  s.stop(t + attack + len + 0.02);
}

// One blast on the referee's whistle: two close notes, fluttering as the pea rattles inside it
const RATTLE = 36; // flutters a second
function blast(a, at, len) {
  const { ctx } = a, t = a.t + at, stop = t + len + 0.05;
  const rattle = ctx.createOscillator(), wobble = ctx.createGain(), flutter = ctx.createGain(), g = ctx.createGain();
  rattle.frequency.value = RATTLE;
  wobble.gain.value = 70;  // how far the pitch shakes
  flutter.gain.value = 0.7;
  const flutterDepth = ctx.createGain();
  flutterDepth.gain.value = 0.3; // how much the volume shakes
  rattle.connect(wobble);
  rattle.connect(flutterDepth);
  flutterDepth.connect(flutter.gain);
  for (const [hz, level] of [[2870, 0.6], [3040, 0.4]]) {
    const o = ctx.createOscillator(), l = ctx.createGain();
    o.frequency.setValueAtTime(hz * 0.97, t);
    o.frequency.linearRampToValueAtTime(hz, t + 0.03);
    wobble.connect(o.frequency);
    l.gain.value = level;
    o.connect(l);
    l.connect(flutter);
    o.start(t);
    o.stop(stop);
  }
  flutter.connect(g);
  g.connect(a.out);
  g.gain.setValueAtTime(QUIET, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.012);
  g.gain.setValueAtTime(1, t + len - 0.04);
  g.gain.exponentialRampToValueAtTime(QUIET, t + len);
  rattle.start(t);
  rattle.stop(stop);
  hiss(a, { band: 'highpass', from: 5000, at, attack: 0.01, len, level: 0.05 }); // his breath
}

// The crowd reacting: its noise (see crowdLoop), shaped by sliding a filter across it.
// path: [[pitch, seconds in], ...] for the filter. Shaping it like this is what makes it say "ooh".
function swell(a, { sound = 'roar', band = 'bandpass', q = 1, path, attack, hold, release, level = 1 }) {
  const { ctx } = a, t = a.t, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = crowdBuffers(ctx)[sound];
  s.loop = true;
  f.type = band;
  f.Q.value = q;
  f.frequency.setValueAtTime(path[0][0], t);
  for (const [hz, at] of path.slice(1)) f.frequency.exponentialRampToValueAtTime(hz, t + at);
  const end = attack + hold + release;
  g.gain.setValueAtTime(QUIET, t);
  g.gain.linearRampToValueAtTime(level, t + attack);
  g.gain.setValueAtTime(level, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(QUIET, t + end);
  s.connect(f);
  f.connect(g);
  g.connect(a.out);
  s.start(t, Math.random() * s.buffer.duration);
  s.stop(t + end + 0.02);
  return end;
}

// A brass-band note
function brass(a, at, hz, len) {
  for (const detune of [0.997, 1.003]) {
    tone(a, { type: 'sawtooth', from: hz * detune, at, attack: 0.025, len, level: 0.5, muffle: 2400 });
  }
}

// ---------- How each sound is made ----------
// Each one returns how many seconds it lasts.
const SOUNDS = {
  kick(a) {
    tone(a, { type: 'triangle', from: 200, to: 62, len: 0.13 });
    tone(a, { from: 420, to: 180, len: 0.035, level: 0.5 });
    hiss(a, { band: 'lowpass', from: 3200, to: 1000, len: 0.04, level: 0.7 });
    return 0.2;
  },
  pass(a) {
    tone(a, { type: 'triangle', from: 240, to: 95, len: 0.085 });
    hiss(a, { band: 'lowpass', from: 2000, to: 800, len: 0.028, level: 0.45 });
    return 0.12;
  },
  touch(a) {
    tone(a, { type: 'triangle', from: 260, to: 140, len: 0.05 });
    hiss(a, { band: 'lowpass', from: 1400, len: 0.018, level: 0.3 });
    return 0.08;
  },
  header(a) {
    tone(a, { type: 'triangle', from: 330, to: 170, len: 0.075 });
    hiss(a, { from: 1300, len: 0.03, level: 0.5 });
    return 0.12;
  },
  bounce(a) {
    tone(a, { type: 'triangle', from: 230, to: 105, len: 0.07 });
    return 0.1;
  },
  boards(a) {
    tone(a, { type: 'triangle', from: 150, to: 85, len: 0.13 });
    tone(a, { from: 310, to: 210, len: 0.05, level: 0.5 });
    hiss(a, { band: 'lowpass', from: 900, len: 0.03, level: 0.4 });
    return 0.2;
  },
  throw(a) {
    hiss(a, { from: 1000, to: 1700, attack: 0.05, len: 0.18 });
    return 0.25;
  },
  scuff(a) {
    hiss(a, { from: 2600, to: 1500, attack: 0.01, len: 0.09 });
    return 0.12;
  },
  tackle(a) {
    tone(a, { type: 'triangle', from: 170, to: 75, len: 0.1 });
    tone(a, { from: 380, to: 210, len: 0.03, level: 0.5 });
    hiss(a, { from: 1500, q: 0.8, len: 0.05, level: 0.8 });
    return 0.16;
  },
  slide(a) {
    hiss(a, { from: 1700, to: 650, q: 0.7, attack: 0.05, len: 0.55 });
    return 0.62;
  },
  trip(a) {
    tone(a, { type: 'triangle', from: 125, to: 48, len: 0.2 });
    hiss(a, { band: 'lowpass', from: 900, to: 300, len: 0.12, level: 0.5 });
    return 0.25;
  },
  catch(a) {
    hiss(a, { from: 1500, len: 0.06 });
    tone(a, { type: 'triangle', from: 190, to: 95, len: 0.07, level: 0.6 });
    return 0.1;
  },
  save(a) {
    hiss(a, { from: 1200, q: 0.8, len: 0.09 });
    tone(a, { type: 'triangle', from: 170, to: 70, len: 0.12 });
    return 0.16;
  },
  // Steel ringing: pitches that don't belong to one note, the high ones dying away first
  clang(a) {
    for (const [hz, level, len] of [[523, 1, 0.75], [1247, 0.55, 0.5], [1871, 0.38, 0.35], [2690, 0.22, 0.22], [3950, 0.1, 0.12]]) {
      tone(a, { from: hz, attack: 0.001, len, level });
    }
    tone(a, { type: 'triangle', from: 170, to: 90, len: 0.09, level: 0.7 });
    hiss(a, { band: 'highpass', from: 2500, len: 0.015, level: 0.5 });
    return 0.8;
  },
  net(a) {
    hiss(a, { from: 2600, to: 1100, q: 0.6, attack: 0.02, len: 0.42 });
    tone(a, { type: 'triangle', from: 130, to: 70, len: 0.12, level: 0.5 });
    return 0.5;
  },
  whistle(a) {
    blast(a, 0, 0.55);
    return 0.6;
  },
  fullTime(a) { // peep, peep, peeeep
    blast(a, 0, 0.28);
    blast(a, 0.42, 0.28);
    blast(a, 0.84, 0.95);
    return 1.85;
  },
  roar: a => swell(a, { band: 'lowpass', q: 0.5, path: [[900, 0], [3400, 0.6], [2400, 3.2], [1200, 5.4]], attack: 0.3, hold: 2.6, release: 2.6 }),
  ooh: a => swell(a, { q: 1.6, path: [[350, 0], [700, 0.35], [420, 1.3]], attack: 0.2, hold: 0.35, release: 0.85, level: 2.5 }), // (a narrow filter lets little through)
  groan: a => swell(a, { q: 1.4, path: [[650, 0], [280, 1.4]], attack: 0.15, hold: 0.3, release: 1.1, level: 2.5 }),
  crowd: a => swell(a, { sound: 'bed', band: 'lowpass', q: 0.5, path: [[6000, 0]], attack: 0.3, hold: 4, release: 0.5 }),
  tap(a) {
    tone(a, { from: 1150, to: 800, len: 0.03 });
    return 0.05;
  },
  question(a) {
    tone(a, { from: 880, len: 0.14 });
    tone(a, { from: 1175, at: 0.11, len: 0.2 });
    return 0.35;
  },
  right(a) {
    for (const [hz, at, len] of [[659, 0, 0.16], [988, 0.12, 0.3]]) {
      tone(a, { from: hz, at, len });
      tone(a, { from: hz * 2, at, len: len * 0.6, level: 0.25 });
    }
    return 0.45;
  },
  wrong(a) {
    tone(a, { type: 'triangle', from: 392, at: 0, len: 0.16, level: 0.8 });
    tone(a, { type: 'triangle', from: 330, at: 0.14, len: 0.24, level: 0.8 });
    return 0.42;
  },
  fanfare(a) {
    brass(a, 0, 523, 0.14);
    brass(a, 0.15, 659, 0.14);
    brass(a, 0.3, 784, 0.14);
    brass(a, 0.45, 1047, 0.65);
    brass(a, 0.45, 784, 0.65);
    return 1.2;
  },
  pop(a) {
    hiss(a, { band: 'lowpass', from: 1500, to: 400, len: 0.25 });
    tone(a, { type: 'triangle', from: 90, to: 50, len: 0.14, level: 0.8 });
    return 0.3;
  },
};
export const SOUND_NAMES = Object.keys(SOUNDS);

// Make one sound into any output, starting at time t. loud: this time's share of its usual volume.
export function makeSound(name, ctx, out, t, loud = 1) {
  const g = ctx.createGain();
  g.gain.value = (VOLUME[name] ?? 0.5) * loud;
  g.connect(out);
  const pitch = WOBBLY.has(name) ? 1 + (Math.random() * 2 - 1) * PITCH_WOBBLE : 1;
  return { lasts: SOUNDS[name]({ ctx, out: g, t, pitch }), output: g };
}

// ---------- Hiss and crowd noise, worked out once and kept ----------
const STORE_RATE = 22050; // samples a second (half the usual: the crowd has no very high pitches, and it saves memory)
let noise = null, crowdNoise = null;

function noiseBuffer(ctx) {
  if (noise) return noise;
  noise = ctx.createBuffer(1, STORE_RATE, STORE_RATE);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

// Lots of people at once: hiss in several pitch bands, each swelling and fading on its own, with
// single voices calling out over the top. It loops without a join you can hear.
function crowdLoop(ctx, seconds, bands, voices) {
  const n = seconds * STORE_RATE, fade = STORE_RATE >> 1, raw = new Float32Array(n + fade);
  for (const { hz, q, level, flutter } of bands) {
    const w = 2 * Math.PI * hz / STORE_RATE, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
    const b0 = alpha / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - alpha) / a0, ease = 6 * flutter / STORE_RATE;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, swellNow = 0.6, swellTo = 0.6, next = 0;
    for (let i = 0; i < raw.length; i++) {
      if (next-- <= 0) { swellTo = 0.35 + Math.random() * 0.65; next = STORE_RATE / flutter * (0.5 + Math.random()); }
      swellNow += (swellTo - swellNow) * ease;
      const x = Math.random() * 2 - 1, y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      raw[i] += y * swellNow * level;
    }
  }
  for (let v = 0; v < voices.count; v++) {
    const len = (0.18 + Math.random() * 0.5) * STORE_RATE | 0, start = Math.random() * (raw.length - len) | 0;
    const hz = voices.low + Math.random() * (voices.high - voices.low), slide = (Math.random() - 0.4) * 0.35;
    const shake = (4 + Math.random() * 3) * 2 * Math.PI / STORE_RATE, level = voices.level * (0.4 + Math.random() * 0.6);
    let phase = Math.random() * 6.28;
    for (let i = 0; i < len; i++) {
      const u = i / len, f = hz * (1 + slide * u) * (1 + 0.015 * Math.sin(shake * i)), e = Math.sin(Math.PI * u);
      phase += 2 * Math.PI * f / STORE_RATE;
      raw[start + i] += level * e * e * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
    }
  }
  // Fade the extra bit on the end into the start, so the loop has no join
  let peak = 0;
  for (let i = 0; i < n; i++) {
    if (i < fade) { const k = i / fade; raw[i] = raw[i] * Math.sqrt(k) + raw[n + i] * Math.sqrt(1 - k); }
    peak = Math.max(peak, Math.abs(raw[i]));
  }
  const buffer = ctx.createBuffer(1, n, STORE_RATE), d = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = raw[i] / peak * 0.9;
  return buffer;
}

function crowdBuffers(ctx) {
  return crowdNoise ||= {
    bed: crowdLoop(ctx, 6, [
      { hz: 180, q: 0.8, level: 0.9, flutter: 1.5 },
      { hz: 420, q: 0.9, level: 1, flutter: 2.5 },
      { hz: 850, q: 1, level: 0.7, flutter: 4 },
      { hz: 1700, q: 1.2, level: 0.3, flutter: 5 },
    ], { count: 26, low: 180, high: 420, level: 0.035 }),
    roar: crowdLoop(ctx, 5, [
      { hz: 260, q: 0.7, level: 0.7, flutter: 3 },
      { hz: 560, q: 0.7, level: 1, flutter: 4 },
      { hz: 1100, q: 0.8, level: 0.9, flutter: 5 },
      { hz: 2200, q: 1, level: 0.5, flutter: 6 },
      { hz: 3600, q: 1.2, level: 0.2, flutter: 7 },
    ], { count: 40, low: 300, high: 900, level: 0.05 }),
  };
}

// ---------- Turning sound on, and the mute button's memory ----------
// iPads only let a page make sound once a tap has started it, and can pause it again later (a phone
// call, leaving the page, a voice reading aloud). So every tap tries to wake it, not just the first.
const KEY = 'sss-sound';
let ctx = null, master = null, masterGoal = -1, ducked = false, crowd = null, nextWake = 0;
const nextAllowed = {};
const recent = []; // the last few sounds played, for the ?debug box and for testing

export function soundOn() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

let on = soundOn();
export function setSoundOn(value) {
  on = value;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
  setLevels();
}

function setLevels() {
  if (!ctx) return;
  const goal = !on || document.hidden ? 0 : ducked ? OVERALL * SPEECH_DUCK : OVERALL;
  if (goal === masterGoal) return;
  masterGoal = goal;
  master.gain.setTargetAtTime(goal, ctx.currentTime, 0.06);
}

function startAudio() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return false;
  ctx = new Context();
  master = ctx.createGain();
  master.gain.value = 0;
  // Stops it distorting when a lot happens at once (a goal: the net, the roar and a whistle)
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 10;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter);
  limiter.connect(ctx.destination);
  setLevels();
  setTimeout(() => crowdBuffers(ctx), 200); // work out the crowd now, not when the game kicks off
  return true;
}

function wake() {
  if (!ctx && !startAudio()) return;
  if (ctx.state === 'running') return;
  try {
    const waking = ctx.resume();
    if (waking) waking.catch(() => { /* the next tap tries again */ });
    // iPads also want a sound started from the tap itself: a silent one will do
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, STORE_RATE);
    s.connect(ctx.destination);
    s.start(0);
  } catch { /* the next tap tries again */ }
}

if (typeof window !== 'undefined') {
  for (const type of ['touchend', 'pointerup', 'mouseup', 'click', 'keydown']) {
    window.addEventListener(type, wake, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', setLevels); // silent while the page isn't showing
}

// Play a sound. loud: this time's share of its usual volume. wait: seconds until it starts.
export function playSound(name, loud = 1, wait = 0) {
  if (recent.push(name) > 12) recent.shift();
  if (!ctx || ctx.state !== 'running' || !on) return;
  const now = ctx.currentTime;
  if (now + wait < (nextAllowed[name] || 0)) return;
  nextAllowed[name] = now + wait + (GAPS[name] ?? SHORTEST_GAP);
  const { lasts, output } = makeSound(name, ctx, master, now + wait, loud);
  setTimeout(() => output.disconnect(), (wait + lasts + 0.2) * 1000);
}

// For the ?debug box: is sound running, and what was played last
export function soundStatus() {
  return `${ctx ? ctx.state : 'waiting for a tap'}, ${on ? 'on' : 'muted'}  last: ${recent.slice(-3).join(' ') || '-'}`;
}

// The crowd in the background: a steady murmur, plus an excited layer that comes up near the goals
function startCrowd(buffers) {
  const loop = (buffer, gain) => {
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.loop = true;
    s.connect(gain);
    s.start();
  };
  const bed = ctx.createGain(), hype = ctx.createGain(), bright = ctx.createBiquadFilter();
  bed.gain.value = 0;
  hype.gain.value = 0;
  bright.type = 'lowpass';
  bright.frequency.value = 2200;
  bed.connect(master);
  hype.connect(bright);
  bright.connect(master);
  loop(buffers.bed, bed);
  loop(buffers.roar, hype);
  crowd = { bed, hype, level: 0, excited: 0 };
}

function setCrowd(level, excited) {
  if (!ctx || ctx.state !== 'running') return;
  if (!crowd) {
    if (!level || !crowdNoise) return;
    startCrowd(crowdNoise);
  }
  const t = ctx.currentTime;
  if (Math.abs(level - crowd.level) > 0.01) {
    crowd.level = level;
    crowd.bed.gain.setTargetAtTime(level * CROWD_VOLUME, t, CROWD_FADE);
  }
  if (Math.abs(excited - crowd.excited) > 0.03) {
    crowd.excited = excited;
    crowd.hype.gain.setTargetAtTime(excited * level * HYPE_VOLUME, t, CROWD_FADE);
  }
}

// Called every frame: wake the sound if it's been paused, and hush the game while a voice is reading.
// (Only during a question, which is the only time it reads: iPads can wrongly report it's still going.)
function keepGoing(state) {
  ducked = state === 'question' && isSpeaking();
  setLevels();
  if (ctx && ctx.state !== 'running' && !document.hidden && performance.now() > nextWake) {
    nextWake = performance.now() + 1000;
    wake();
  }
}

// ---------- Spotting what just happened ----------
// Each frame, this compares the match with how it looked a frame ago and plays whatever has changed.
// It only reads things the game draws from, which the joining device in an online game also gets
// (see sync.js), so both devices hear the same match. The crowd takes each device's own team's side.
export class SoundCues {
  constructor(match, play = playSound) {
    this.m = match;
    this.play = play;
    this.state = match.state;
    this.score = { ...match.score };
    this.trick = false;
    this.owner = null;
    this.wood = false;
    this.z = 0; this.dz = 0; this.high = 0; this.vx = 0; this.vy = 0;
    this.shooter = null; // who last kicked the ball
    this.seen = new Map(match.players.map(p => [p, { kickAt: p.kickAt, pokeAt: -10, goalKick: false }]));
  }

  // myTeam: the team this device plays
  update(myTeam) {
    const m = this.m;
    keepGoing(m.state);
    const excited = m.state !== 'play' ? 0 : m.trickShot ? 1 : Math.min(1, Math.abs(m.ball.x) / F.right) ** HYPE_CURVE;
    setCrowd(CROWD_LEVEL[m.state] ?? 0, excited);

    const kicked = this.watchPlayers();
    if (m.state === 'play' && this.state === 'play') this.watchBall(kicked);
    if (m.ball.hitWood && m.ball.hitWood !== this.wood) {
      this.play('clang');
      this.play('ooh', 1, 0.12);
    }
    this.watchScore(myTeam);
    this.watchState(myTeam);
    this.remember();
  }

  // Kicks, tackles and goal kicks. Returns whether anyone played the ball this frame.
  watchPlayers() {
    let kicked = false;
    for (const p of this.m.players) {
      const s = this.seen.get(p);
      if (p.kickAt !== s.kickAt) {
        s.kickAt = p.kickAt;
        if (this.kickSound(p, s)) kicked = true;
      }
      if (p.goalKick && !s.goalKick) this.play('ooh', 0.8); // it went over the bar
      s.goalKick = !!p.goalKick;
    }
    return kicked;
  }

  kickSound(p, s) {
    const { play } = this;
    switch (p.kickType) {
      case 'pass': play('pass'); break;
      // (In a volley his leg starts swinging a moment before the ball goes: see the trick shot in watchBall.)
      case 'shoot': if (this.m.trickShot) return false; play('kick'); break;
      case 'release': { // out of the keeper's hands
        const how = p.gkAct && p.gkAct.type;
        play(how === 'throw' ? 'throw' : how === 'dropKick' ? 'kick' : 'pass');
        break;
      }
      case 'poke': { // first as he steps in, and again if his foot gets to the ball
        const arrived = p.kickAt - s.pokeAt < POKE_WINDOW;
        play(arrived ? 'tackle' : 'scuff');
        s.pokeAt = arrived ? -10 : p.kickAt;
        if (!arrived) return false;
        break;
      }
      case 'slide': play('slide'); return false; // the ball hasn't been touched yet
      case 'trip': play('trip'); play('ooh', 0.7); return true;
      case 'dragL': case 'dragR': play('touch', 0.7); return false;
      case 'flick': case 'knee': this.shooter = p; return false; // the start of a trick shot
      default: return false;
    }
    this.shooter = p;
    return true;
  }

  // The ball: taken, caught, blocked, landing, off the boards, and trick shots
  watchBall(kicked) {
    const { m, play } = this, b = m.ball;
    const speed = Math.hypot(b.vx, b.vy), before = Math.hypot(this.vx, this.vy);
    if (b.owner !== this.owner) {
      const o = b.owner;
      if (o && o.role === 'gk') {
        if (!o.goalKick) this.keeperTakes(o, before);
      } else if (o && this.owner && o.team !== this.owner.team) {
        if (!kicked) play('tackle'); // nicked it off him
      } else if (o && !this.owner) {
        play('touch', Math.min(1, 0.4 + before / 400)); // trapped it (a hot one is louder)
      } else if (!o && !kicked && !m.trickShot) {
        play('tackle'); // knocked off him, by a slide
      }
    } else if (!b.owner && !b.scripted) {
      if (before > DEFLECT_PACE && speed < before * DEFLECT_DROP) {
        const keeper = m.players.find(p => p.role === 'gk' && Math.hypot(p.x - b.x, p.y - b.y) < PARRY_NEAR);
        if (keeper) this.keeperTakes(keeper, before); // pushed away
        else play('tackle', 0.8);                     // blocked
      } else {
        const hitSide = Math.abs(b.y) > F.bottom - BOARDS_NEAR && b.vy * this.vy < 0 && Math.abs(this.vy) > BOARDS_PACE;
        const hitEnd = Math.abs(b.x) > F.right - BOARDS_NEAR && b.vx * this.vx < 0 && Math.abs(this.vx) > BOARDS_PACE;
        if (hitSide || hitEnd) play('boards', Math.min(1, 0.3 + before / 500));
      }
    }
    // Landing: it was on its way down, and now it isn't
    const dz = b.z - this.z;
    if (!b.owner && !m.trickShot) {
      if (this.dz < 0 && dz >= 0 && b.z < BOUNCE_GROUND && this.high > BOUNCE_LOW) {
        play('bounce', Math.min(1, Math.sqrt(this.high / BOUNCE_HIGH)));
        this.high = 0;
      }
      this.high = Math.max(this.high, b.z);
    } else this.high = 0;
    this.dz = dz;
    // A trick shot: the flick up, then the moment it leaves his head or boot
    if (m.trickShot && this.z < 0.5 && b.z >= 0.5) play('touch');
    if (this.trick && !m.trickShot) play(b.style === 'header' ? 'header' : 'kick');
  }

  keeperTakes(keeper, pace) {
    const shot = pace > SAVE_PACE && this.shooter && this.shooter.team !== keeper.team;
    this.play(shot ? 'save' : 'catch');
    if (shot) this.play('ooh');
  }

  watchScore(myTeam) {
    const { home, away } = this.m.score, was = this.score;
    if (home <= was.home && away <= was.away) return;
    const mineScored = myTeam === HOME ? home > was.home : away > was.away;
    this.play('net');
    this.play(mineScored ? 'roar' : 'groan');
  }

  watchState(myTeam) {
    const { m, play } = this;
    if (m.state === this.state) return;
    if (m.state === 'play' && this.state === 'kickoff') play('whistle');
    if (m.state === 'question') play('question');
    if (m.state === 'over') {
      play('fullTime', 1, FULL_TIME_AFTER);
      const { home, away } = m.score;
      if (myTeam === HOME ? home > away : away > home) play('fanfare', 1, FULL_TIME_AFTER + FANFARE_AFTER);
    }
  }

  remember() {
    const { m } = this, b = m.ball;
    this.state = m.state;
    this.score = { home: m.score.home, away: m.score.away };
    this.trick = !!m.trickShot;
    this.owner = b.owner;
    this.wood = b.hitWood;
    this.z = b.z; this.vx = b.vx; this.vy = b.vy;
  }
}
