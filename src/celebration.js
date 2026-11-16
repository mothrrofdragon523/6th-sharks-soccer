// The goal celebration: a cartoon dragon sweeps across the screen from left to right, roaring and
// breathing fire, while soccer balls burst out from behind his head as he passes the middle.
// Drawn on its own canvas, in the same style as the dragon on the shirts (see dragon.js).
// When the Eagles score it's an eagle instead (see eagle.js): it swoops across from right to left,
// screeching and shedding feathers, with the same burst of balls. (It's drawn mirrored, so everything
// below works as if it were flying left to right.)
import { paintDragon, mouthPoint } from './dragon.js';
import { paintEagle } from './eagle.js';
import { playSound, loudness, eagleLoudness } from './sound.js';

const SWEEP = 2.7;             // seconds for the head to cross the screen (about as long as the roar)
const BURSTS = [-0.18, 0, 0.18]; // when the balls burst, in seconds from the head reaching the middle
const BALLS_PER_BURST = 6;
const FLAMES_PER_SECOND = 110; // at the loudest part of the roar
const MAX_FLAMES = 260;
const FEATHERS_PER_SECOND = 28; // the eagle's, while it screeches
const MAX_FEATHERS = 90;

let canvas = null, running = false;

export function celebrate(team = 'dragon') {
  if (running) return;
  running = true;
  if (!canvas) {
    canvas = document.createElement('canvas');
    // Just before the banner in the page, so "GOAL!" stays on top of the dragon
    Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' });
    const banner = document.getElementById('banner');
    document.body.insertBefore(canvas, banner || null);
  }
  canvas.hidden = false;
  const eagle = team === 'eagle';
  playSound(eagle ? 'eagle' : 'dragon');

  const g = canvas.getContext('2d');
  const flames = [], balls = [], feathers = [];
  let start = 0, last = 0, jaw = 0, flameDebt = 0, featherDebt = 0, nextBurst = 0;

  function frame(now) {
    if (!start) start = last = now;
    const t = (now - start) / 1000, dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth * dpr, H = canvas.clientHeight * dpr;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    if (eagle) g.setTransform(-1, 0, 0, 1, W, 0); // (the eagle flies the other way)

    const S = Math.min(W * 0.42, H * 0.72), sc = S / 256;      // the head's size on screen
    const travel = W + S * 1.1, speed = travel / SWEEP;         // pixels a second
    const p = Math.min(1, t / SWEEP);
    // (he slows down as he passes the middle, so the balls clearly burst out from behind his head)
    const along = p + 0.11 * Math.sin(p * Math.PI * 2);
    const hx = -S * 0.55 + travel * along, hy = H * 0.47 + Math.sin(t * 9) * S * 0.02;

    // The jaw and the fire follow how loud the roar is right now (a made-up pattern if it hasn't loaded)
    const loud = eagle ? eagleLoudness(t) : loudness('dragon', t) ?? (t > 0.1 && t < SWEEP - 0.2 ? 0.5 + 0.4 * Math.sin(t * 13) : 0);
    jaw += ((0.06 + 0.5 * loud) - jaw) * Math.min(1, dt * 16);
    const tilt = 0.14 * loud;                                    // throws his head back as he roars
    const [mx, my] = mouthPoint(jaw);
    // Where the mouth is on screen: the head is drawn turned around (facing right) and tilted
    const lx = -(mx - 128) * sc, ly = (my - 128) * sc, ca = Math.cos(-tilt), sa = Math.sin(-tilt);
    const mouthX = hx + lx * ca - ly * sa, mouthY = hy + lx * sa + ly * ca;

    // The eagle sheds feathers that trail away behind it as it screeches
    if (eagle && t < SWEEP) featherDebt += FEATHERS_PER_SECOND * (0.25 + loud) * dt;
    while (featherDebt >= 1 && feathers.length < MAX_FEATHERS) {
      featherDebt--;
      feathers.push({
        x: hx + (Math.random() - 0.3) * S * 0.3, y: hy + (Math.random() - 0.3) * S * 0.45,
        vx: speed * 0.35 - S * (0.1 + Math.random() * 0.6), vy: S * (Math.random() - 0.8) * 0.5,
        size: S * (0.07 + Math.random() * 0.06), age: 0, life: 1.4 + Math.random() * 1.2,
        spin: Math.random() * 6, turn: (Math.random() - 0.5) * 6, phase: Math.random() * 6,
        gold: Math.random() < 0.25,
      });
    }
    featherDebt = Math.min(featherDebt, 3);

    // Fire out of the mouth, louder roar, more fire
    if (!eagle && t < SWEEP) flameDebt += FLAMES_PER_SECOND * loud * loud * dt;
    while (flameDebt >= 1 && flames.length < MAX_FLAMES) {
      flameDebt--;
      const life = 0.55 + Math.random() * 0.5;
      flames.push({
        x: mouthX, y: mouthY + (Math.random() - 0.5) * S * 0.05,
        vx: speed * 0.9 + S * (1.2 + Math.random() * 1.2), vy: S * (Math.random() - 0.7) * 0.35,
        r: S * (0.05 + Math.random() * 0.05), age: 0, life,
      });
    }
    flameDebt = Math.min(flameDebt, 3);

    // Balls burst from behind the head as it passes the middle
    const middle = SWEEP / 2;
    while (nextBurst < BURSTS.length && t >= middle + BURSTS[nextBurst]) {
      for (let i = 0; i < BALLS_PER_BURST; i++) {
        const angle = -Math.PI * (0.08 + Math.random() * 0.84); // a fan upward and out
        const v = S * (1.1 + Math.random() * 1.3);
        balls.push({
          x: hx - S * 0.05, y: hy - S * 0.05, vx: Math.cos(angle) * v + speed * 0.25, vy: Math.sin(angle) * v,
          age: 0, spin: 0, turn: (Math.random() - 0.5) * 16,
        });
      }
      nextBurst++;
    }

    // Move everything along
    for (const f of flames) {
      f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt;
      f.vy -= S * 1.1 * dt;          // flames rise
      f.vx *= 1 - 0.9 * dt;
    }
    for (let i = flames.length - 1; i >= 0; i--) if (flames[i].age > flames[i].life) flames.splice(i, 1);
    for (const f of feathers) { // they flutter down, swaying side to side
      f.age += dt; f.x += (f.vx + Math.sin(f.age * 6 + f.phase) * S * 0.3) * dt; f.y += f.vy * dt;
      f.vy += S * 0.9 * dt; f.vy *= 1 - 1.4 * dt; f.vx *= 1 - 0.8 * dt; f.spin += f.turn * dt;
    }
    for (let i = feathers.length - 1; i >= 0; i--) if (feathers[i].age > feathers[i].life) feathers.splice(i, 1);
    for (const b of balls) {
      b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += S * 2.8 * dt; b.spin += b.turn * dt;
    }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.y > H + S * 0.3 || b.x < -S * 0.3 || b.x > W + S * 0.3) balls.splice(i, 1);
    }

    // Draw: balls (behind), fire, then the head on top, so the flames seem to leave his mouth
    for (const b of balls) drawBall(g, b.x, b.y, S * (0.05 + 0.1 * (1 - Math.exp(-b.age * 5))), b.spin);
    for (const f of flames) drawFlame(g, f, S);
    for (const f of feathers) drawFeather(g, f);
    g.save();
    g.translate(hx, hy);
    g.rotate(-tilt);
    g.scale(-sc, sc);
    g.translate(-128, -128);
    if (eagle) paintEagle(g, jaw); else paintDragon(g, jaw);
    g.restore();

    if (t < SWEEP + 0.3 || flames.length || balls.length || feathers.length) {
      if (t < SWEEP + 4) { requestAnimationFrame(frame); return; }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    canvas.hidden = true;
    running = false;
  }
  requestAnimationFrame(frame);
}

// A flame: a teardrop with a black outline that goes yellow, orange, red as it ages, tail trailing back
function drawFlame(g, f, S) {
  const u = Math.min(1, f.age / f.life);
  const r = f.r * (1 + 1.8 * u) * (1 - u * u * 0.85);
  if (r < 1) return;
  const colour = u < 0.22 ? '#ffe94a' : u < 0.5 ? '#ff9a1f' : u < 0.78 ? '#e8372c' : '#8d1b1b';
  const dx = -f.vx * 0.5, dy = -f.vy * 0.5 - S * 0.9; // the tip trails behind and up
  g.save();
  g.translate(f.x, f.y);
  g.rotate(Math.atan2(dx, -dy));
  g.globalAlpha = u > 0.85 ? (1 - u) / 0.15 : 1;
  const teardrop = k => {
    g.beginPath();
    g.moveTo(0, -r * 1.7 * k);
    g.bezierCurveTo(r * 1.1 * k, -r * 0.4 * k, r * k, r * k, 0, r * k);
    g.bezierCurveTo(-r * k, r * k, -r * 1.1 * k, -r * 0.4 * k, 0, -r * 1.7 * k);
  };
  teardrop(1);
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2, S * 0.014);
  g.strokeStyle = '#111';
  g.stroke();
  g.fillStyle = colour;
  g.fill();
  if (u < 0.7) { // a hotter middle
    teardrop(0.55);
    g.fillStyle = u < 0.3 ? '#fffbe0' : '#ffd23a';
    g.fill();
  }
  g.restore();
}

// A feather: a pointed leaf shape with a black outline and a quill down the middle, in the Eagles' teal
// (some gold), fading out as it falls
function drawFeather(g, f) {
  const u = f.age / f.life, r = f.size;
  g.save();
  g.translate(f.x, f.y);
  g.rotate(f.spin);
  g.globalAlpha = u > 0.7 ? Math.max(0, (1 - u) / 0.3) : 1;
  g.beginPath();
  g.moveTo(0, -r * 1.6);
  g.quadraticCurveTo(r * 0.9, -r * 0.4, 0, r * 1.3);
  g.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r * 1.6);
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2, r * 0.22);
  g.strokeStyle = '#111';
  g.stroke();
  g.fillStyle = f.gold ? '#f6c61c' : '#1f8a80';
  g.fill();
  g.beginPath();
  g.moveTo(0, -r * 1.4);
  g.lineTo(0, r * 1.6);
  g.lineWidth = Math.max(1.5, r * 0.12);
  g.stroke();
  g.restore();
}

// A cartoon soccer ball: white, black patches, thick black outline
function drawBall(g, x, y, r, spin) {
  g.save();
  g.translate(x, y);
  g.rotate(spin);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();
  g.save();
  g.clip();
  const pentagon = (cx, cy, size, point) => {
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = point + i * Math.PI * 0.4;
      g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * size, cy + Math.sin(a) * size);
    }
    g.closePath();
    g.fill();
  };
  g.fillStyle = '#111';
  g.strokeStyle = '#111';
  g.lineWidth = Math.max(1, r * 0.07);
  pentagon(0, 0, r * 0.4, -Math.PI / 2);
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + k * Math.PI * 0.4;
    g.beginPath();
    g.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
    g.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
    g.stroke();
    const b = a + Math.PI * 0.2; // patches between them, on the edge
    pentagon(Math.cos(b) * r * 1.0, Math.sin(b) * r * 1.0, r * 0.38, b + Math.PI);
  }
  g.restore();
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.lineWidth = Math.max(2, r * 0.09);
  g.strokeStyle = '#111';
  g.stroke();
  g.restore();
}
