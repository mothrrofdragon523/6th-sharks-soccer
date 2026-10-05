// The match itself: rules, physics and computer players. Nothing here draws anything.
// Positions are on the ground plane in "units" (20 units = 1 metre). x runs goal to goal,
// y runs from the far touchline (negative) to the near touchline (positive), z is height.

export const F = { left: -900, right: 900, top: -500, bottom: 500 }; // the pitch: 90 m × 50 m
export const GOAL_HALF = 85;   // half the width of the goal mouth
export const GOAL_DEPTH = 36;
export const CROSSBAR = 48;
export const PLAYER_R = 18;
export const BALL_R = 9;
const TOUCH_R = PLAYER_R + BALL_R + 4; // how close a player must be to control the ball
// Player speeds in units per second (20 units = 1 m): run 7.5 m/s, sprint 10 m/s
const RUN_SPEED = 150;
const SPRINT_SPEED = 200;
const AI_SPEED = 140;
const KEEPER_SPEED = 140;
const GRAVITY = 196;
const WIN_GOALS = 5;
// Stamina runs from 1 (fresh) to 0 (exhausted).
const SPRINT_DRAIN = 1 / 4;   // a full bar lasts 4 seconds of sprinting
const STAMINA_REGEN = 1 / 9;  // and takes 9 seconds to refill when not sprinting
const RECOVERED_AT = 0.35;    // after running dry, you can sprint again once back to this level

// Kits. HOME is the team the player controls: Gabe's Sharks (light blue). AWAY is the Eagles
// (Eagles green), played by the computer for now and by Mom once online play is added.
// To show a team logo on the ad boards and shirts, add e.g. logo: 'assets/sharks-logo.png'.
export const HOME = {
  name: 'SHARKS', dir: 1,
  kit: { shirt: 0x6cc4ee, trim: 0x0b2a4a, number: '#0b2a4a', outline: null, shorts: 0xf2f2f2, socks: 0x6cc4ee, boots: 0x111111 },
  gkKit: { shirt: 0xff8f00, trim: 0x0b2a4a, number: '#0b2a4a', outline: null, shorts: 0x0b2a4a, socks: 0xff8f00, boots: 0x111111, gloves: 0x0b2a4a },
  fans: [0x6cc4ee, 0x6cc4ee, 0x0b2a4a, 0xffffff, 0x6cc4ee, 0x9e9e9e],
};
export const AWAY = {
  name: 'EAGLES', dir: -1,
  kit: { shirt: 0x1f8a80, trim: 0x111111, number: '#ffffff', outline: '#000000', shorts: 0xc4c8cc, socks: 0x1f8a80, boots: 0x111111 },
  gkKit: { shirt: 0x1a1a1a, trim: 0x4cbb17, number: '#4cbb17', outline: '#000000', shorts: 0x1a1a1a, socks: 0x1a1a1a, boots: 0x111111, gloves: 0x4cbb17 },
  fans: [0x1f8a80, 0x1f8a80, 0xf2f2f2, 0x111111, 0xa5acaf, 0x4cbb17],
};

// Home team layout (attacking right): a keeper, 3 defenders, 3 midfielders and 1 forward.
// The away team is mirrored.
const FORMATION = [
  { role: 'gk', num: 1, x: F.left + 28, y: 0 },
  { role: 'def', num: 2, x: -600, y: -280 },
  { role: 'def', num: 4, x: -640, y: 0 },
  { role: 'def', num: 3, x: -600, y: 280 },
  { role: 'mid', num: 7, x: -330, y: -300 },
  { role: 'mid', num: 10, x: -370, y: 0 },
  { role: 'mid', num: 11, x: -330, y: 300 },
  { role: 'fw', num: 9, x: -150, y: 0 },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function norm(x, y) {
  const l = Math.hypot(x, y);
  return l > 1e-6 ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}
function rotateTo(a, target, step) {
  const d = Math.atan2(Math.sin(target - a), Math.cos(target - a));
  return Math.abs(d) <= step ? target : a + Math.sign(d) * step;
}
const ownGoalX = team => (team.dir === 1 ? F.left : F.right);
const oppGoalX = team => (team.dir === 1 ? F.right : F.left);

export class Match {
  constructor() {
    this.t = 0;
    this.players = [];
    this.teams = new Map([[HOME, []], [AWAY, []]]);
    for (const team of [HOME, AWAY]) {
      for (const spec of FORMATION) {
        const x = team.dir === 1 ? spec.x : -spec.x;
        const angle = team.dir === 1 ? 0 : Math.PI;
        const p = {
          team, role: spec.role, num: spec.num, homeX: x, homeY: spec.y,
          x, y: spec.y, vx: 0, vy: 0, angle, fx: Math.cos(angle), fy: 0,
          noTouchUntil: 0, stunUntil: 0, tackleReadyAt: 0, nextDecision: 0,
          holdUntil: 0, lungeUntil: 0, lx: 0, ly: 0, kickAt: -10,
          stamina: 1, exhausted: false, sprinting: false, kickType: 'pass',
        };
        this.players.push(p);
        this.teams.get(team).push(p);
      }
    }
    this.ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, owner: null, lastTouch: null, passTarget: null, passUntil: 0 };

    // Set every frame by the input code.
    this.move = { x: 0, y: 0, mag: 0 };
    this.held = { a: false, b: false, s: false };

    this.charging = false;
    this.nextAutoSwitch = 0;
    this.toast = null;
    this.score = { home: 0, away: 0 };
    this.kickoff(HOME);
    this.state = 'menu'; // the start menu is showing; players line up behind it
    this.banner = null;
  }

  // ---------- Match flow ----------
  toMenu() {
    this.state = 'menu';
    this.banner = null;
  }

  startMatch(level) {
    this.level = level;
    this.score = { home: 0, away: 0 };
    for (const p of this.players) { p.stamina = 1; p.exhausted = false; }
    this.kickoff(HOME);
  }

  kickoff(team) {
    for (const p of this.players) {
      p.x = p.homeX; p.y = p.homeY; p.vx = 0; p.vy = 0;
      p.angle = p.team.dir === 1 ? 0 : Math.PI;
      p.fx = Math.cos(p.angle); p.fy = 0;
      p.noTouchUntil = 0; p.stunUntil = 0; p.lungeUntil = 0; p.tackleReadyAt = 0;
      p.stamina = Math.min(1, p.stamina + 0.3); // a breather after each goal
      p.sprinting = false;
    }
    const kicker = this.teams.get(team).find(p => p.role === 'fw');
    kicker.x = -team.dir * (PLAYER_R + BALL_R + 2);
    kicker.y = 0;

    const b = this.ball;
    b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0;
    this.setOwner(kicker);
    if (team !== HOME) this.controlled = this.nearestOutfield(HOME, b);
    this.updateBall(0);

    this.charging = false;
    this.state = 'kickoff';
    this.stateUntil = this.t + 1.2;
    this.setBanner('KICK OFF', '');
  }

  goalScored(team) {
    if (this.state !== 'play') return;
    if (team === HOME) this.score.home++; else this.score.away++;
    this.charging = false;
    for (const p of this.players) { p.vx = 0; p.vy = 0; }
    const { home, away } = this.score;
    if (home >= WIN_GOALS || away >= WIN_GOALS) {
      this.state = 'over'; // the menu code shows the result screen
      this.banner = null;
    } else {
      this.state = 'goal';
      this.stateUntil = this.t + 2.2;
      this.concededBy = team === HOME ? AWAY : HOME;
      this.setBanner('GOAL!', `${team.name} score`);
    }
  }

  // A shot over the bar: the defending keeper restarts.
  goalKick(team) {
    const k = this.teams.get(team).find(p => p.role === 'gk');
    k.x = ownGoalX(team) + team.dir * (PLAYER_R + 20);
    k.y = 0;
    const b = this.ball;
    b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0;
    this.setOwner(k);
    this.showToast('GOAL KICK');
  }

  setBanner(title, sub) { this.banner = { title, sub }; }
  showToast(text) { this.toast = { text, until: this.t + 1.3 }; }

  // ---------- Buttons ----------
  // a = Pass / Switch, b = Shoot / Tackle, s = Sprint
  press(key) {
    if (this.held[key]) return;
    this.held[key] = true;
    if (this.state !== 'play') return;
    const hasBall = this.attacking();
    if (key === 'a') {
      if (hasBall) this.humanPass(); else this.switchPlayer();
    } else if (key === 'b') {
      if (hasBall) { this.charging = true; this.chargeStart = this.t; } else this.humanTackle();
    }
  }

  release(key) {
    this.held[key] = false;
    if (key === 'b' && this.charging) {
      this.charging = false;
      if (this.state === 'play' && this.attacking()) this.humanShoot();
    }
  }

  attacking() {
    return this.ball.owner === this.controlled;
  }

  power() {
    return Math.min(1, (this.t - this.chargeStart) / 0.9);
  }

  // ---------- Human actions ----------
  humanPass() {
    const me = this.controlled, m = this.move;
    const dir = m.mag > 0.2 ? { x: m.x, y: m.y } : { x: me.fx, y: me.fy };
    const mate = this.pickPassTarget(me, dir);
    if (mate) this.passTo(me, mate);
  }

  // When askQuestions is on (Gabe is playing), every shot pauses the game for a math question
  // (the menu code shows it). Otherwise it's an ordinary shot the keeper can save.
  humanShoot() {
    const me = this.controlled, m = this.move;
    // Aim with the joystick; with no aim, go for the far post.
    const aimY = m.mag > 0.2 ? m.y : (me.y < 0 ? 0.6 : -0.6);
    if (!this.askQuestions) { this.shoot(me, this.power(), aimY); return; }
    this.pendingShot = { shooter: me, aimY };
    this.state = 'question';
  }

  // Right answer: the shot goes in. Wrong answer: it sails over the bar.
  answerShot(correct) {
    const { shooter, aimY } = this.pendingShot || {}; // no shot waiting: just carry on playing
    this.pendingShot = null;
    this.state = 'play';
    if (this.ball.owner === shooter) this.scriptedShot(shooter, correct, aimY);
  }

  // If the question can't be shown, don't leave the game paused: take an ordinary shot instead.
  skipQuestion() {
    if (!this.pendingShot) return;
    const { shooter, aimY } = this.pendingShot;
    this.pendingShot = null;
    this.state = 'play';
    if (this.ball.owner === shooter) this.shoot(shooter, 0.7, aimY);
  }

  scriptedShot(p, scores, aimY) {
    const gx = oppGoalX(p.team);
    const ty = clamp(aimY, -1, 1) * GOAL_HALF * (scores ? 0.7 : 0.5);
    const dx = gx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    const speed = clamp(d * 0.5 + 380, 480, 700); // about 24–35 m/s
    // Pick the lift so the ball crosses the goal line at the height we want:
    // under the bar for a goal, well over it for a miss.
    const T = d / speed;
    const heightAtLine = scores ? 8 + Math.random() * 25 : 75 + Math.random() * 30;
    this.kick(p, dx, dy, speed, (heightAtLine + 0.5 * GRAVITY * T * T) / T);
    this.ball.scripted = true; // nobody can block or save it
  }

  humanTackle() {
    const me = this.controlled;
    if (this.t < me.tackleReadyAt) return;
    me.tackleReadyAt = this.t + 0.55;
    me.kickAt = this.t;
    me.kickType = 'tackle';
    const o = this.ball.owner;
    if (o && o.team !== me.team && o.role !== 'gk' && dist(me, o) < PLAYER_R * 2 + 22) {
      if (Math.random() < 0.65) this.steal(me);
      else me.stunUntil = this.t + 0.3;
      return;
    }
    // Too far away: lunge toward the ball.
    const n = norm(this.ball.x - me.x, this.ball.y - me.y);
    me.lx = n.x; me.ly = n.y;
    me.lungeUntil = this.t + 0.22;
  }

  switchPlayer() {
    let best = null, bd = Infinity;
    for (const p of this.teams.get(HOME)) {
      if (p.role === 'gk' || p === this.controlled) continue;
      const d = dist(p, this.ball);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) this.controlled = best;
    this.nextAutoSwitch = this.t + 1.5;
  }

  autoSwitch() {
    const b = this.ball;
    if ((b.owner && b.owner.team === HOME) || this.t < this.nextAutoSwitch) return;
    const best = this.nearestOutfield(HOME, b);
    if (best !== this.controlled && dist(this.controlled, b) - dist(best, b) > 220) {
      this.controlled = best;
      this.nextAutoSwitch = this.t + 1.2;
    }
  }

  // ---------- Ball actions (shared by human and computer players) ----------
  setOwner(p) {
    const b = this.ball;
    b.owner = p;
    b.scripted = false;
    b.lastTouch = p;
    b.passTarget = null;
    if (p.team === HOME && p.role !== 'gk') this.controlled = p;
    if (p.role === 'gk') p.holdUntil = this.t + 0.9;
    p.nextDecision = this.t + 0.35;
  }

  kick(p, dx, dy, speed, lift = 0) {
    const b = this.ball, n = norm(dx, dy);
    b.owner = null;
    b.lastTouch = p;
    b.x = p.x + n.x * (PLAYER_R + BALL_R + 2);
    b.y = p.y + n.y * (PLAYER_R + BALL_R + 2);
    b.vx = n.x * speed;
    b.vy = n.y * speed;
    b.vz = lift;
    p.noTouchUntil = this.t + 0.35;
    p.kickAt = this.t;
    p.kickType = lift > 0 ? 'shoot' : 'pass';
  }

  passTo(p, mate) {
    // Lead the receiver a little, and kick just hard enough to arrive at a trappable pace
    // (rolling friction takes off about 0.5 × the distance in speed along the way).
    const tx = mate.x + mate.vx * 0.45, ty = mate.y + mate.vy * 0.45;
    const d = Math.hypot(tx - p.x, ty - p.y);
    this.kick(p, tx - p.x, ty - p.y, clamp(d * 0.55 + 110, 200, 520));
    this.ball.passTarget = mate;
    this.ball.passUntil = this.t + 1.6;
  }

  shoot(p, power, aimY) {
    const gx = oppGoalX(p.team);
    const ty = clamp(aimY, -1, 1) * GOAL_HALF * 0.8;
    let a = Math.atan2(ty - p.y, gx - p.x);
    a += (Math.random() - 0.5) * (0.05 + power * power * 0.12); // full power is a little less accurate
    // More power = more lift, so a full-power blast from close range can sail over the bar.
    this.kick(p, Math.cos(a), Math.sin(a), 360 + power * 360, 30 + power ** 3 * 130); // about 18–36 m/s
  }

  steal(p) {
    const o = this.ball.owner;
    o.noTouchUntil = this.t + 0.6;
    o.stunUntil = this.t + 0.45;
    this.setOwner(p);
  }

  deflect(p) {
    const b = this.ball, n = norm(b.x - p.x, b.y - p.y);
    const dot = b.vx * n.x + b.vy * n.y;
    if (dot < 0) { b.vx -= 2 * dot * n.x; b.vy -= 2 * dot * n.y; }
    b.vx *= 0.45; b.vy *= 0.45; b.vz = Math.abs(b.vz) * 0.5 + 40;
    b.x = p.x + n.x * TOUCH_R; b.y = p.y + n.y * TOUCH_R;
    b.lastTouch = p;
    p.noTouchUntil = this.t + 0.3;
  }

  pickPassTarget(p, dir) {
    let best = null, bs = -Infinity;
    for (const m of this.teams.get(p.team)) {
      if (m === p) continue;
      const to = norm(m.x - p.x, m.y - p.y);
      let s = (to.x * dir.x + to.y * dir.y) * 1.5
        + this.openness(m) / 200
        - dist(p, m) / 1500
        + (m.x - p.x) * p.team.dir / 1000;
      if (m.role === 'gk') s -= 0.8;
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  }

  openness(m) {
    let d = 250;
    for (const o of this.teams.get(m.team === HOME ? AWAY : HOME)) d = Math.min(d, dist(m, o));
    return d;
  }

  openMate(p) {
    let best = null, bs = -Infinity;
    for (const m of this.teams.get(p.team)) {
      if (m === p || m.role === 'gk') continue;
      const open = this.openness(m);
      if (open < 100) continue;
      const s = open + (m.x - p.x) * p.team.dir * 0.5;
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  }

  nearestOutfield(team, pt) {
    let best = null, bd = Infinity;
    for (const p of this.teams.get(team)) {
      if (p.role === 'gk') continue;
      const d = dist(p, pt);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  // ---------- Computer players ----------
  seek(p, tx, ty, speed) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d < 3) return { vx: 0, vy: 0 };
    const s = speed * Math.min(1, d / 45);
    return { vx: dx / d * s, vy: dy / d * s };
  }

  keeperAI(p) {
    const b = this.ball, dir = p.team.dir, gx = ownGoalX(p.team);
    if (b.owner === p) {
      if (this.t >= p.holdUntil) {
        const m = this.pickPassTarget(p, { x: dir, y: 0 });
        if (m) this.passTo(p, m);
      }
      return { vx: 0, vy: 0 };
    }
    // Come out for a slow loose ball in the box.
    if (!b.owner && Math.abs(b.x - gx) < 130 && Math.abs(b.y) < 160 && Math.hypot(b.vx, b.vy) < 380) {
      return this.seek(p, b.x, b.y, KEEPER_SPEED);
    }
    const out = Math.hypot(b.x - gx, b.y) < 350 ? 40 : 16;
    const ty = clamp(b.y * 0.5, -GOAL_HALF + 14, GOAL_HALF - 14);
    return this.seek(p, gx + dir * (PLAYER_R + out), ty, KEEPER_SPEED);
  }

  fieldAI(p) {
    const b = this.ball, team = p.team;
    if (b.owner === p) return this.aiWithBall(p);
    if (!b.owner && b.passTarget === p && this.t < b.passUntil) {
      return this.seek(p, b.x + b.vx * 0.15, b.y + b.vy * 0.15, AI_SPEED * 1.1);
    }
    if (b.owner && b.owner.team === team) {
      const [x, y] = this.supportSpot(p);
      return this.seek(p, x, y, AI_SPEED * 0.9);
    }
    // Defending or loose ball: the closest player goes for it, the rest hold shape.
    if (this.nearestOutfield(team, b) === p) {
      return this.seek(p, b.x + b.vx * 0.2, b.y + b.vy * 0.2, AI_SPEED);
    }
    const [x, y] = this.coverSpot(p);
    return this.seek(p, x, y, AI_SPEED * 0.9);
  }

  supportSpot(p) {
    const b = this.ball, dir = p.team.dir;
    let x, y;
    if (p.role === 'def') {
      // Stay back as a line behind the ball, but no further up than the halfway line.
      x = b.x - dir * 380;
      x = dir === 1 ? Math.min(x, 0) : Math.max(x, 0);
      y = p.homeY * 0.8 + b.y * 0.3;
    } else if (p.role === 'mid') {
      // Keep level with the ball in their lane, the middle one a step behind.
      x = b.x + dir * (p.homeY === 0 ? -60 : 80);
      y = p.homeY + b.y * 0.25;
    } else {
      // The forward runs ahead to give a target up front.
      x = b.x + dir * 320;
      y = b.y * 0.3;
    }
    return [clamp(x, F.left + 80, F.right - 80), clamp(y, F.top + 40, F.bottom - 40)];
  }

  coverSpot(p) {
    const b = this.ball, dir = p.team.dir, gx = ownGoalX(p.team);
    let x, y;
    if (p.role === 'def') {
      x = gx + dir * Math.max(220, Math.abs(b.x - gx) * 0.4);
      y = p.homeY * 0.6 + b.y * 0.4;
    } else if (p.role === 'mid') {
      x = b.x - dir * 180;
      x = dir === 1 ? Math.max(x, F.left + 320) : Math.min(x, F.right - 320);
      y = p.homeY + b.y * 0.4;
    } else {
      // The forward hangs around halfway, ready for a counter-attack.
      x = b.x * 0.4 + dir * 120;
      y = b.y * 0.3;
    }
    return [clamp(x, F.left + 40, F.right - 40), clamp(y, F.top + 40, F.bottom - 40)];
  }

  aiWithBall(p) {
    const gx = oppGoalX(p.team);
    const dGoal = Math.hypot(gx - p.x, p.y);
    const opponents = this.teams.get(p.team === HOME ? AWAY : HOME);

    if (this.t >= p.nextDecision) {
      p.nextDecision = this.t + 0.3;
      if (dGoal < 320 || (dGoal < 480 && Math.random() < 0.2)) {
        this.shoot(p, 0.55 + Math.random() * 0.35, (Math.random() * 2 - 1) * 0.9);
        return { vx: 0, vy: 0 };
      }
      let pressure = Infinity;
      for (const o of opponents) pressure = Math.min(pressure, dist(p, o));
      if (pressure < 80 && Math.random() < 0.6) {
        const m = this.openMate(p);
        if (m) { this.passTo(p, m); return { vx: 0, vy: 0 }; }
      }
    }

    // Dribble at goal, steering around anyone in the way.
    let d = norm(gx - p.x, -p.y);
    for (const o of opponents) {
      if (o.role === 'gk') continue;
      const ox = o.x - p.x, oy = o.y - p.y, od = Math.hypot(ox, oy);
      if (od < 130 && ox * d.x + oy * d.y > 0) {
        const side = ox * -d.y + oy * d.x > 0 ? -1 : 1;
        const w = 1.2 * (1 - od / 130);
        d = norm(d.x - d.y * side * w, d.y + d.x * side * w);
      }
    }
    return { vx: d.x * AI_SPEED * 0.92, vy: d.y * AI_SPEED * 0.92 };
  }

  aiTackles() {
    const o = this.ball.owner;
    if (!o || o.role === 'gk') return;
    for (const p of this.players) {
      if (p === this.controlled || p.team === o.team || p.role === 'gk') continue;
      if (dist(p, o) < PLAYER_R * 2 + 10 && this.t >= p.tackleReadyAt) {
        p.tackleReadyAt = this.t + 1.0 + Math.random() * 0.8;
        p.kickAt = this.t;
        p.kickType = 'tackle';
        const chance = o === this.controlled ? 0.3 : 0.4;
        if (Math.random() < chance) { this.steal(p); return; }
      }
    }
  }

  // ---------- Physics ----------
  updatePlayers(dt) {
    const move = this.move;
    for (const p of this.players) {
      let d;
      p.sprinting = p === this.controlled && this.held.s && move.mag > 0.1 && !p.exhausted;
      if (p.sprinting) {
        p.stamina -= SPRINT_DRAIN * dt;
        if (p.stamina <= 0) { p.stamina = 0; p.exhausted = true; p.sprinting = false; }
      } else {
        p.stamina = Math.min(1, p.stamina + STAMINA_REGEN * dt);
        if (p.exhausted && p.stamina >= RECOVERED_AT) p.exhausted = false;
      }

      if (p === this.controlled) {
        let sp = p.sprinting ? SPRINT_SPEED : RUN_SPEED;
        if (p.exhausted) sp *= 0.9; // tired legs
        if (this.ball.owner === p) sp *= 0.92;
        if (this.charging) sp *= 0.6;
        d = { vx: move.x * move.mag * sp, vy: move.y * move.mag * sp };
      } else if (p.role === 'gk') {
        d = this.keeperAI(p);
      } else {
        d = this.fieldAI(p);
      }
      if (this.t < p.lungeUntil) d = { vx: p.lx * 300, vy: p.ly * 300 };
      else if (this.t < p.stunUntil) { d.vx *= 0.25; d.vy *= 0.25; }

      const k = Math.min(1, dt * 10);
      p.vx += (d.vx - p.vx) * k;
      p.vy += (d.vy - p.vy) * k;
      p.x = clamp(p.x + p.vx * dt, F.left + PLAYER_R, F.right - PLAYER_R);
      p.y = clamp(p.y + p.vy * dt, F.top + PLAYER_R, F.bottom - PLAYER_R);
      if (p.role === 'gk') {
        p.x = p.team.dir === 1 ? Math.min(p.x, F.left + 140) : Math.max(p.x, F.right - 140);
        p.y = clamp(p.y, -170, 170);
      }

      // Turn smoothly toward the direction of travel (the ball sits in front).
      let target = null;
      if (p === this.controlled && move.mag > 0.15) target = Math.atan2(move.y, move.x);
      else if (p.role === 'gk' && this.ball.owner === p) target = p.team.dir === 1 ? 0 : Math.PI;
      else if (Math.hypot(p.vx, p.vy) > 30) target = Math.atan2(p.vy, p.vx);
      else if (p.role === 'gk') target = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
      if (target !== null) {
        p.angle = rotateTo(p.angle, target, 12 * dt);
        p.fx = Math.cos(p.angle);
        p.fy = Math.sin(p.angle);
      }
    }

    // Keep players from overlapping.
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j];
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = PLAYER_R * 2;
        if (d < min && d > 0.01) {
          const push = (min - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
        }
      }
    }
  }

  updateBall(dt) {
    const b = this.ball;
    if (b.owner) {
      const o = b.owner, off = PLAYER_R + BALL_R + 1;
      b.x = o.x + o.fx * off;
      b.y = o.y + o.fy * off;
      b.z = 0; b.vz = 0;
      b.vx = o.vx;
      b.vy = o.vy;
    } else {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.z > 0 || b.vz > 0) {
        b.z += b.vz * dt;
        b.vz -= GRAVITY * dt;
        if (b.z <= 0) {
          b.z = 0;
          b.vz = b.vz < -50 ? -b.vz * 0.45 : 0; // bounce
        }
      }
      if (!b.scripted) { // a scripted shot keeps its pace all the way to the goal
        const f = Math.pow(b.z > 0 ? 0.85 : 0.6, dt); // rolling keeps 60% of its speed each second
        b.vx *= f;
        b.vy *= f;
      }
    }

    // The ball bounces off the boards (no throw-ins yet), except through the goal mouth.
    if (b.y < F.top + BALL_R) { b.y = F.top + BALL_R; b.vy = Math.abs(b.vy) * 0.7; }
    if (b.y > F.bottom - BALL_R) { b.y = F.bottom - BALL_R; b.vy = -Math.abs(b.vy) * 0.7; }
    const inMouth = Math.abs(b.y) < GOAL_HALF - BALL_R;
    if (!inMouth) {
      if (b.x < F.left + BALL_R) { b.x = F.left + BALL_R; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > F.right - BALL_R) { b.x = F.right - BALL_R; b.vx = -Math.abs(b.vx) * 0.7; }
    }

    if (b.x < F.left - BALL_R) {
      if (b.z < CROSSBAR) { b.owner = null; this.goalScored(AWAY); } else this.goalKick(HOME);
    } else if (b.x > F.right + BALL_R) {
      if (b.z < CROSSBAR) { b.owner = null; this.goalScored(HOME); } else this.goalKick(AWAY);
    }
  }

  updateBallInNet(dt) {
    const b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z = Math.max(0, b.z + b.vz * dt);
    b.vz = b.z > 0 ? b.vz - GRAVITY * dt : 0;
    const f = Math.pow(0.2, dt);
    b.vx *= f;
    b.vy *= f;
    b.y = clamp(b.y, -GOAL_HALF + BALL_R, GOAL_HALF - BALL_R);
    b.z = Math.min(b.z, CROSSBAR - BALL_R);
    if (b.x < F.left) b.x = Math.max(b.x, F.left - GOAL_DEPTH + BALL_R);
    if (b.x > F.right) b.x = Math.min(b.x, F.right + GOAL_DEPTH - BALL_R);
  }

  checkPossession() {
    const b = this.ball;
    if (b.owner || b.scripted) return;
    const speed = Math.hypot(b.vx, b.vy);
    let best = null, bd = Infinity;
    for (const p of this.players) {
      if (this.t < p.noTouchUntil) continue;
      const isGk = p.role === 'gk';
      if (b.z > (isGk ? 60 : 22)) continue; // too high to reach
      const d = dist(p, b);
      if (d < (isGk ? TOUCH_R + 8 : TOUCH_R) && d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    if (best.role === 'gk') {
      if (Math.random() < (speed > 600 ? 0.6 : 0.95)) this.setOwner(best);
      else this.deflect(best);
    } else if (speed > 480 && b.lastTouch && b.lastTouch.team !== best.team) {
      this.deflect(best); // a hard shot gets blocked, not trapped
    } else {
      this.setOwner(best);
    }
  }

  // ---------- Main loop ----------
  update(dt) {
    this.t += dt;
    if (this.toast && this.t > this.toast.until) this.toast = null;

    if (this.state === 'kickoff' && this.t >= this.stateUntil) {
      this.state = 'play';
      this.banner = null;
    }
    if (this.state === 'goal' && this.t >= this.stateUntil) this.kickoff(this.concededBy);

    if (this.state === 'play') {
      if (this.charging && !this.attacking()) this.charging = false;
      this.autoSwitch();
      this.updatePlayers(dt);
      this.updateBall(dt);
      if (this.state === 'play') {
        this.checkPossession();
        this.aiTackles();
      }
    } else if (this.state === 'goal' || this.state === 'over') {
      this.updateBallInNet(dt);
    }
  }
}
