// Online games: the host's match is the real one. Many times a second it sends a snapshot of
// everything the other device needs to draw the game; that device plays the snapshots back a
// tenth of a second behind, blending between them so the players glide instead of jumping.
import { HOME, AWAY } from './sim.js';

export const SNAPSHOT_EVERY = 50; // ms (20 a second)
const DELAY = 110;                // ms the joining device plays behind the host

// Player fields copied as they are (positions and facing are blended separately)
const FIELDS = ['kickAt', 'kickType', 'gkAct', 'trickUntil', 'trickSide', 'faceBall', 'sprinting', 'leapAt',
  'goalKick', 'stamina', 'exhausted', 'trickReadyAt', 'ballReach', 'diveUntil'];

const side = team => (team === AWAY ? 'away' : 'home');
const teamOf = s => (s === 'away' ? AWAY : s === 'home' ? HOME : null);
const r1 = v => Math.round(v * 10) / 10;
const r3 = v => Math.round(v * 1000) / 1000;
const clamp01 = v => Math.max(0, Math.min(1, v));

// Everything the other device needs from the host's match right now. at: the host's clock (ms).
export function snapshot(m, at) {
  const idx = p => (p ? m.players.indexOf(p) : -1);
  const b = m.ball, shot = m.pendingShot;
  return {
    type: 'snap', at, t: r3(m.t), state: m.state, score: m.score, banner: m.banner,
    toast: m.toast && { text: m.toast.text, until: m.toast.until, team: m.toast.team && side(m.toast.team) },
    timeScale: m.timeScale, trick: !!m.trickShot,
    shot: shot && { team: side(shot.team), distance: shot.distance, fraction: shot.fraction },
    pilots: [...m.pilots.values()].map(c => [side(c.team), idx(c.controlled), idx(c.keeperAim), c.charging, r3(c.chargeStart)]),
    ball: [r1(b.x), r1(b.y), r1(b.z), r1(b.vx), r1(b.vy), idx(b.owner), b.style || null, !!b.scripted, b.hitWood || 0],
    players: m.players.map(p => [r1(p.x), r1(p.y), r1(p.vx), r1(p.vy), r3(p.angle), r3(p.ballAngle), !!p.release,
      ...FIELDS.map(f => (typeof p[f] === 'number' ? r3(p[f]) : p[f] ?? null))]),
  };
}

// Plays the host's snapshots back into the joining device's copy of the match
export class Mirror {
  constructor(match) {
    this.m = match;
    this.reset();
  }

  reset() {
    this.buf = [];
    this.lags = [];
  }

  push(snap, now) {
    // How far the host's clock is behind ours, plus the trip: the smallest recent value is the
    // steadiest guide (a late snapshot only ever makes it bigger)
    this.lags.push(now - snap.at);
    if (this.lags.length > 60) this.lags.shift();
    this.buf.push(snap);
    if (this.buf.length > 40) this.buf.shift();
  }

  // Set the match to how it was on the host DELAY ms ago. False until a snapshot has arrived.
  apply(now) {
    const { buf, m } = this;
    if (!buf.length) return false;
    const at = now - Math.min(...this.lags) - DELAY;
    let i = buf.findIndex(s => s.at > at);
    if (i === -1) i = buf.length; // running behind: hold the newest
    const a = buf[Math.max(0, i - 1)], b = buf[Math.min(i, buf.length - 1)];
    const k = b.at > a.at ? clamp01((at - a.at) / (b.at - a.at)) : 0;
    if (i > 1) buf.splice(0, i - 1); // older ones aren't needed again
    const mix = (x, y) => x + (y - x) * k;
    const mixAngle = (x, y) => x + Math.atan2(Math.sin(y - x), Math.cos(y - x)) * k;

    m.t = mix(a.t, b.t);
    m.state = a.state;
    m.score = a.score;
    m.banner = a.banner;
    m.toast = a.toast && { ...a.toast, team: teamOf(a.toast.team) };
    m.timeScale = a.timeScale;
    m.trickShot = a.trick ? {} : null;
    m.pendingShot = a.shot && { ...a.shot, team: teamOf(a.shot.team) };
    for (const [s, ci, ai, charging, chargeStart] of a.pilots) {
      const c = m.pilot(teamOf(s));
      if (!c) continue;
      c.controlled = m.players[ci] || c.controlled;
      c.keeperAim = m.players[ai] || null;
      c.charging = charging;
      c.chargeStart = chargeStart;
    }
    m.players.forEach((p, n) => {
      const pa = a.players[n], pb = b.players[n];
      p.x = mix(pa[0], pb[0]);
      p.y = mix(pa[1], pb[1]);
      p.vx = pa[2];
      p.vy = pa[3];
      p.angle = mixAngle(pa[4], pb[4]);
      p.fx = Math.cos(p.angle);
      p.fy = Math.sin(p.angle);
      p.ballAngle = mixAngle(pa[5], pb[5]);
      p.release = pa[6] || null;
      FIELDS.forEach((f, j) => { p[f] = pa[7 + j]; });
    });
    const ba = a.ball, bb = b.ball, ball = m.ball;
    ball.x = mix(ba[0], bb[0]);
    ball.y = mix(ba[1], bb[1]);
    ball.z = mix(ba[2], bb[2]);
    ball.vx = ba[3];
    ball.vy = ba[4];
    ball.owner = m.players[ba[5]] || null;
    ball.style = ba[6];
    ball.scripted = ba[7];
    ball.hitWood = ba[8] || false;
    return true;
  }
}
