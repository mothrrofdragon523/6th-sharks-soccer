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
// How long after starting each keeper move the ball leaves him (matches the animations)
const KEEPER_RELEASE = { throw: 0.58, dropKick: 0.92, roll: 0.75 };
const GOAL_KICK_SETUP = 1.4; // time to put the ball down for a goal kick
const TRICK_SPEED = 240;    // a quick burst, faster than sprinting (12 m/s)
const TRICK_TIME = 0.45;    // ...for about 5 metres
const TRICK_COOLDOWN = 1.2;
// Footplay: a defender who gets close stops charging in and jockeys (stays goal-side, facing the
// ball) and jabs a foot at it now and then. The player on the ball drags it away from the poke.
const JOCKEY_R = 90;               // a defender this close (4.5 m) starts jockeying
const JOCKEY_GAP = 34;             // ...about 1.7 m off, between the ball and his goal
const POKE_R = PLAYER_R * 2 + 18;  // close enough to get a foot to the ball
const DRAG_TIME = 0.7;
const KEEPER_WAIT = 8; // Gabe's keeper throws it himself if nothing is chosen in this many seconds
const GRAVITY = 196;
const WIN_GOALS = 5;
const POST_R = 1.4; // the posts and crossbar are 7 cm thick

// Gabe's trick shots, coolest first: the closer his answer, the cooler the shot.
//   header   right answer: flick it up and leap for a header. GOAL!
//   bicycle  so close: flick it up, turn his back to goal and bicycle-kick it off the crossbar
//   volley   close: knee it up and volley it off the post
//   blast    a long way off: an ordinary strike that sails over the bar
// Each move (times in seconds after the shot starts): `setup` plays at 0 and pops the ball up at
// `popAt`; `strike` plays so that it meets the ball at `contactAt`, `contactZ` units off the ground
// and `reach` units in front of him (the animations were measured to line these up).
export const SHOTS = {
  header: { setup: 'flick', popAt: 0.24, strike: 'header', lead: 0.6, contactAt: 1.14, contactZ: 38, reach: 5, outcome: 'goal', slowMo: true },
  bicycle: { setup: 'flick', popAt: 0.24, strike: 'bicycle', lead: 0.55, contactAt: 1.1, contactZ: 34, reach: -4, outcome: 'bar', backToGoal: true, slowMo: true, downFor: 2.0 },
  volley: { setup: 'knee', popAt: 0.25, strike: 'shoot', lead: 0.08, contactAt: 1.0, contactZ: 7, reach: 12, outcome: 'post' },
  blast: { outcome: 'over' },
};
const SLOW_MO = 0.35; // game speed around the moment a header or bicycle kick meets the ball

// No shooting from your own half. Past halfway, the further out the shot, the harder the question.
export const SHOT_RANGE = { easy: 15, medium: 30 }; // metres from goal: up to 15 easy, up to 30 medium, beyond that hard
export const shotLevel = metres => (metres <= SHOT_RANGE.easy ? 'easy' : metres <= SHOT_RANGE.medium ? 'medium' : 'hard');
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
          trickUntil: 0, trickReadyAt: 0, trickSide: 'L', tvx: 0, tvy: 0, tface: 0,
          diveUntil: 0, diveMoveUntil: 0, diveSpeed: 0, gkAct: null, release: null, faceBall: false,
          lockUntil: 0, leapAt: -10, dragUntil: 0, dragSide: 1, ballTurn: 0,
        };
        this.players.push(p);
        this.teams.get(team).push(p);
      }
    }
    this.ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, owner: null, lastTouch: null, passTarget: null, passUntil: 0 };

    // Set every frame by the input code.
    this.move = { x: 0, y: 0, mag: 0 };
    this.held = { a: false, b: false, s: false, t: false };

    this.charging = false;
    this.trickShot = null; // Gabe's trick shot while it's being played out
    this.timeScale = 1;    // below 1 for slow motion
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
      p.diveUntil = 0; p.release = null; p.gkAct = null; p.trickUntil = 0; p.lockUntil = 0;
      p.dragUntil = 0; p.ballTurn = 0;
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
    this.trickShot = null;
    this.timeScale = 1;
    this.state = 'kickoff';
    this.stateUntil = this.t + 1.2;
    this.setBanner('KICK OFF', '');
  }

  goalScored(team) {
    if (this.state !== 'play') return;
    if (team === HOME) this.score.home++; else this.score.away++;
    this.charging = false;
    const keeper = this.teams.get(team === HOME ? AWAY : HOME).find(p => p.role === 'gk');
    if (this.t >= keeper.diveUntil) keeper.gkAct = { type: 'miss', at: this.t };
    for (const p of this.players) { p.vx = 0; p.vy = 0; }
    const { home, away } = this.score;
    if (home >= WIN_GOALS || away >= WIN_GOALS) {
      this.state = 'over'; // the menu code shows the result screen
      this.banner = null;
    } else {
      this.state = 'goal';
      this.stateUntil = this.t + 2.2;
      this.concededBy = team === HOME ? AWAY : HOME;
      this.setBanner('GOAL!', this.ball.style === 'header' ? 'WHAT A HEADER!' : `${team.name} score`);
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
    k.goalKick = true;
    k.gkAct = { type: 'place', at: this.t }; // he puts the ball down first
    k.holdUntil = this.t + GOAL_KICK_SETUP;
    if (!this.toast) this.showToast('GOAL KICK'); // don't cover up "OFF THE BAR!"
  }

  setBanner(title, sub) { this.banner = { title, sub }; }
  showToast(text, time = 1.3) { this.toast = { text, until: this.t + time }; }

  // ---------- Buttons ----------
  // a = Pass / Switch, b = Shoot / Tackle, s = Sprint, t = Trick
  press(key) {
    if (this.held[key]) return;
    this.held[key] = true;
    if (this.state !== 'play' || this.trickShot) return; // nothing interrupts a trick shot
    const gk = this.gabesKeeper();
    if (gk) { this.humanKeeper(gk, key); return; }
    const hasBall = this.attacking();
    if (key === 't') {
      this.humanTrick();
    } else if (key === 'a') {
      if (hasBall) this.humanPass(); else this.switchPlayer();
    } else if (key === 'b') {
      if (!hasBall) this.humanTackle();
      else if (!this.canShoot(this.controlled)) this.showToast('CROSS HALFWAY TO SHOOT');
      else { this.charging = true; this.chargeStart = this.t; }
    }
  }

  // Shots are only allowed once you've reached the halfway line
  canShoot(p) {
    return p.x * p.team.dir >= 0;
  }

  // Metres from p to the middle of the goal he's attacking
  shotDistance(p) {
    return Math.hypot(oppGoalX(p.team) - p.x, p.y) * 0.05;
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

  // Gabe's keeper holding the ball and waiting to be told how to put it back in play
  gabesKeeper() {
    const o = this.ball.owner;
    return this.state === 'play' && o && o.role === 'gk' && o.team === HOME && !o.release ? o : null;
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
    if (!this.canShoot(me)) return;
    if (!this.askQuestions) { this.shoot(me, this.power(), aimY); return; }
    // The question's difficulty depends on how far out he's shooting from
    this.pendingShot = { shooter: me, aimY, distance: this.shotDistance(me) };
    this.state = 'question';
  }

  // style is one of SHOTS: 'header' scores; the others miss, less spectacularly the further off he was.
  answerShot(style) {
    const { shooter, aimY } = this.pendingShot || {}; // no shot waiting: just carry on playing
    this.pendingShot = null;
    this.state = 'play';
    if (this.ball.owner !== shooter) return;
    if (style === 'blast' || !SHOTS[style]) this.scriptedShot(shooter, 'over', aimY);
    else this.startTrickShot(shooter, style, aimY);
  }

  // Play out a header, bicycle kick or volley. He stands his ground while the move plays,
  // and nobody can get to the ball until it's on its way.
  startTrickShot(p, style, aimY) {
    const move = SHOTS[style];
    const gx = oppGoalX(p.team);
    const toGoal = Math.atan2(-p.y, gx - p.x);
    this.trickShot = { p, style, move, aimY, t0: this.t, face: move.backToGoal ? toGoal + Math.PI : toGoal, struck: false, striking: false };
    p.lockUntil = this.t + move.contactAt + (move.downFor || 0.35);
    if (style === 'header') p.leapAt = this.t + move.contactAt; // the view lifts him off the ground
    p.kickAt = this.t;
    p.kickType = move.setup;
    this.charging = false;
    const b = this.ball;
    b.owner = null;
    b.scripted = true;
    b.style = style;
    b.hitWood = false;
    b.lastTouch = p;
  }

  // Each frame of a trick shot: the ball sits at his feet, pops up, and falls onto his head or
  // foot just as the strike reaches it. Then it's away toward the goal.
  updateTrickShot() {
    const s = this.trickShot;
    if (!s) return;
    const { p, move } = s, b = this.ball, k = this.t - s.t0;
    this.timeScale = move.slowMo && Math.abs(k - move.contactAt) < 0.3 ? SLOW_MO : 1;
    if (!s.striking && k >= move.contactAt - move.lead) {
      s.striking = true;
      p.kickAt = this.t;
      p.kickType = move.strike;
    }
    const fx = Math.cos(p.angle), fy = Math.sin(p.angle);
    if (k < move.contactAt) {
      // Before the pop the ball is at his feet; then it follows an arc from there to the contact point.
      const z0 = 4, reach0 = 11;
      let z = 0, reach = reach0;
      if (k >= move.popAt) {
        const T = move.contactAt - move.popAt, u = k - move.popAt;
        const vz = (move.contactZ - z0 + 0.5 * GRAVITY * T * T) / T;
        z = z0 + vz * u - 0.5 * GRAVITY * u * u;
        reach = reach0 + (move.reach - reach0) * (u / T);
      }
      b.x = p.x + fx * reach; b.y = p.y + fy * reach; b.z = z;
      b.vx = b.vy = b.vz = 0;
      return;
    }
    // Contact! The ball flies at the goal from where it was struck.
    this.trickShot = null;
    this.timeScale = 1;
    b.lastTouch = p;
    p.noTouchUntil = this.t + 0.35;
    this.aimBall(p.team, move.outcome, s.aimY);
  }

  // If the question can't be shown, don't leave the game paused: take an ordinary shot instead.
  skipQuestion() {
    if (!this.pendingShot) return;
    const { shooter, aimY } = this.pendingShot;
    this.pendingShot = null;
    this.state = 'play';
    if (this.ball.owner === shooter) this.shoot(shooter, 0.7, aimY);
  }

  // An ordinary strike whose result is already decided (outcome as in aimBall)
  scriptedShot(p, outcome, aimY) {
    this.kick(p, oppGoalX(p.team) - p.x, -p.y, 500, 0);
    this.ball.style = 'blast';
    this.aimBall(p.team, outcome, aimY);
    p.kickType = 'shoot';
  }

  // Send the ball from where it is to the goal, so that it crosses the line exactly where we want:
  // 'goal' under the bar, 'bar' onto the crossbar, 'post' onto the outside of a post,
  // 'over' well over the bar. Nobody can block or save it.
  aimBall(team, outcome, aimY) {
    const b = this.ball, gx = oppGoalX(team);
    const side = aimY < 0 ? -1 : 1;
    const ty = outcome === 'post' ? side * (GOAL_HALF + 4)
      : clamp(aimY, -1, 1) * GOAL_HALF * (outcome === 'goal' ? 0.7 : 0.5);
    const heightAtLine = {
      goal: (b.style === 'header' ? 6 : 8) + Math.random() * 22,
      bar: CROSSBAR + 3,
      post: 10 + Math.random() * 20,
      over: 75 + Math.random() * 30,
    }[outcome];
    const dx = gx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
    const speed = clamp(d * 0.5 + 380, 480, 700); // about 24–35 m/s
    const T = d / speed;
    b.owner = null;
    b.vx = dx / d * speed;
    b.vy = dy / d * speed;
    b.vz = (heightAtLine - b.z + 0.5 * GRAVITY * T * T) / T; // the lift that gets it there at that height
    b.scripted = true;
    b.outcome = outcome;
    b.hitWood = false;
  }

  // A scripted shot crossing the goal line: does it hit the post or the bar?
  woodwork(prevX) {
    const b = this.ball;
    if (b.hitWood || (b.outcome !== 'bar' && b.outcome !== 'post')) return;
    const gx = b.vx > 0 ? F.right : F.left;
    if ((prevX - gx) * (b.x - gx) > 0) return; // hasn't reached the line yet
    const R = BALL_R + POST_R;
    if (b.outcome === 'bar' && Math.abs(b.y) < GOAL_HALF && Math.abs(b.z - CROSSBAR) < R) {
      // Clips the top of the bar and loops up over it
      b.vz = Math.abs(b.vz) * 0.4 + 150;
      b.vx *= 0.45; b.vy *= 0.6;
      this.showToast('OFF THE BAR!', 2);
    } else if (b.outcome === 'post' && Math.abs(Math.abs(b.y) - GOAL_HALF) < R && b.z < CROSSBAR) {
      // Glances off the outside of the post and goes wide
      b.vy = Math.sign(b.y) * (Math.abs(b.vx) * 0.45 + 60);
      b.vx *= 0.5;
      this.showToast('OFF THE POST!', 2);
    } else return;
    b.hitWood = this.t; // the view shakes the camera
  }

  // Pass = throw, Shoot = drop kick, Sprint = roll it out. On a goal kick: Pass = short, Shoot = long.
  humanKeeper(gk, key) {
    if (this.t < gk.holdUntil || !this.keeperAim) return; // still gathering the ball
    const type = gk.goalKick ? { a: 'goalPass', b: 'goalKick' }[key] : { a: 'throw', b: 'dropKick', s: 'roll' }[key];
    if (type) this.keeperDistribute(gk, this.keeperAim, type);
  }

  // With the ball: flick it over a player right in front of you, or cut past him.
  // Without it: dart round whoever is in the way.
  humanTrick() {
    const me = this.controlled, m = this.move;
    if (this.t < me.trickReadyAt) return;
    let dir = m.mag > 0.2 ? { x: m.x, y: m.y } : { x: me.fx, y: me.fy };
    if (this.ball.owner === me) {
      const o = this.blocker(me, dir, 75);
      if (o && this.ahead(me, dir, o) > 0.9) { this.flick(me, dir, o); return; }
    } else if (m.mag <= 0.2) {
      dir = norm(this.ball.x - me.x, this.ball.y - me.y); // no direction given: head for the ball
    }
    this.cut(me, dir);
  }

  // The nearest opponent in front of p (within range), going in direction dir
  blocker(p, dir, range) {
    let best = null, bd = range;
    for (const o of this.teams.get(p.team === HOME ? AWAY : HOME)) {
      const d = dist(p, o);
      if (d < bd && this.ahead(p, dir, o) > 0.3) { bd = d; best = o; }
    }
    return best;
  }

  // How straight ahead of p the player o is: 1 = dead ahead, 0 = level, negative = behind
  ahead(p, dir, o) {
    const n = norm(o.x - p.x, o.y - p.y);
    return n.x * dir.x + n.y * dir.y;
  }

  // A burst diagonally past the nearest opponent, away from the side he's on. The defender
  // is wrong-footed for a moment (Gabe's own player never is: he has to react himself).
  cut(p, dir) {
    const o = this.blocker(p, dir, 160);
    const left = { x: dir.y, y: -dir.x }; // the player's own left
    const goLeft = o ? (o.x - p.x) * left.x + (o.y - p.y) * left.y < 0 : Math.random() < 0.5;
    const side = goLeft ? left : { x: -left.x, y: -left.y };
    const v = norm(dir.x + side.x, dir.y + side.y);
    p.tvx = v.x * TRICK_SPEED;
    p.tvy = v.y * TRICK_SPEED;
    p.tface = Math.atan2(dir.y, dir.x); // body stays facing forward while the feet go diagonally
    p.trickSide = goLeft ? 'L' : 'R';
    p.trickUntil = this.t + TRICK_TIME;
    p.trickReadyAt = this.t + TRICK_COOLDOWN;
    if (o && dist(p, o) < 110 && o !== this.controlled && o.role !== 'gk') o.stunUntil = this.t + 0.45;
  }

  // Pop the ball up over a player standing right in front, and run on to it
  flick(p, dir, o) {
    this.kick(p, dir.x, dir.y, 150, 140);
    p.kickType = 'flick';
    p.trickReadyAt = this.t + TRICK_COOLDOWN;
    o.noTouchUntil = this.t + 0.8;
    if (o !== this.controlled) o.stunUntil = this.t + 0.4;
    this.ball.passTarget = p; // the computer's players chase their own flick
    this.ball.passUntil = this.t + 2;
  }

  humanTackle() {
    const me = this.controlled;
    if (this.t < me.tackleReadyAt) return;
    me.tackleReadyAt = this.t + 0.55;
    const o = this.ball.owner;
    if (o && o.team !== me.team && o.role !== 'gk' && dist(me, o) < POKE_R + 6) {
      this.poke(me, o);
      return;
    }
    // Too far away: a quick step toward the ball with a foot out.
    me.kickAt = this.t;
    me.kickType = 'poke';
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
    if (p.role === 'gk') {
      p.holdUntil = Math.max(this.t + 0.9, p.diveUntil); // a diving keeper gets up first
      p.goalKick = false;
      p.release = null;
      if (this.t >= p.diveUntil) p.gkAct = { type: this.catchType(p), at: this.t };
      this.assignMarks(p);
      if (p.team === HOME) this.showToast('THROW, KICK or ROLL?');
    }
    p.nextDecision = this.t + 0.35;
  }

  catchType(p) {
    const b = this.ball;
    if (b.z < 5) return 'scoop';
    if (b.z < 18) return 'catch';
    if (b.z < 32) return 'catchChest';
    return Math.hypot(p.vx, p.vy) > 80 ? 'catchLeap' : 'catchHigh';
  }

  // While a keeper has the ball, each player on the other team picks someone to mark, closest pairs first.
  assignMarks(gk) {
    this.marks = new Map();
    const markers = this.teams.get(gk.team === HOME ? AWAY : HOME).filter(p => p.role !== 'gk');
    const men = this.teams.get(gk.team).filter(p => p.role !== 'gk');
    const pairs = [];
    for (const m of markers) for (const man of men) pairs.push([dist(m, man), m, man]);
    pairs.sort((a, c) => a[0] - c[0]);
    const taken = new Set();
    for (const [, m, man] of pairs) {
      if (!this.marks.has(m) && !taken.has(man)) { this.marks.set(m, man); taken.add(man); }
    }
  }

  // Start the keeper's throw, kick or roll; the ball leaves his hands partway through the move.
  keeperDistribute(p, mate, type) {
    p.release = { type, mate };
    p.releaseAt = this.t + (KEEPER_RELEASE[type] ?? 0);
    if (!p.goalKick) p.gkAct = { type, at: this.t }; // goal kicks use an ordinary kick
  }

  releaseBall(p) {
    const { type, mate } = p.release;
    p.release = null;
    p.goalKick = false;
    const b = this.ball;
    const tx = mate.x + mate.vx * 0.6, ty = mate.y + mate.vy * 0.6;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (type === 'roll' || type === 'goalPass') {
      this.kick(p, dx, dy, clamp(d * 0.55 + 110, 200, 480));
    } else if (type === 'throw') {
      // From head height, landing at the teammate's feet
      const speed = clamp(d * 0.6 + 200, 260, 480), T = d / speed;
      this.kick(p, dx, dy, speed, (0.5 * GRAVITY * T * T - 40) / T);
      b.z = 40;
    } else {
      // Drop kick or long goal kick: high and far, and not quite as accurate
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.12;
      const speed = clamp(d * 0.45 + 300, 380, 600), T = d * 0.8 / speed;
      this.kick(p, Math.cos(a), Math.sin(a), speed, 0.5 * GRAVITY * T);
      if (type === 'dropKick') b.z = 14;
    }
    if (!type.startsWith('goal')) p.kickType = 'release'; // his own move is already playing
    b.passTarget = mate;
    b.passUntil = this.t + 2.5;
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
    b.style = null;
    b.outcome = null;
    b.hitWood = false;
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
    o.stunUntil = this.t + 0.3;
    this.setOwner(p);
  }

  // A defender jabs a foot at the ball: he wins it cleanly, knocks it loose for a scramble,
  // or the player on the ball drags it away from him.
  poke(p, o) {
    p.kickAt = this.t;
    p.kickType = 'poke';
    let win = p === this.controlled ? 0.45 : o === this.controlled ? 0.2 : 0.3;
    let loose = 0.2;
    if (this.t < o.trickUntil || this.t < o.dragUntil) { win *= 0.4; loose *= 0.5; } // harder mid-move
    const r = Math.random();
    if (r < win) this.steal(p);
    else if (r < win + loose) this.knockLoose(p, o);
    else this.dragAway(o, p);
  }

  // The ball squirts a few metres away from the poke, and either of them can chase it
  knockLoose(p, o) {
    const b = this.ball, away = norm(b.x - p.x, b.y - p.y);
    const a = Math.atan2(away.y, away.x) + (Math.random() - 0.5) * 1.2;
    const speed = 40 + Math.random() * 30; // rolls about 4–7 m
    b.owner = null;
    b.vx = Math.cos(a) * speed;
    b.vy = Math.sin(a) * speed;
    b.vz = 0;
    b.lastTouch = p;
    b.passTarget = null;
    o.noTouchUntil = this.t + 0.3;
    p.noTouchUntil = this.t + 0.2;
  }

  // The player on the ball rolls it away from the defender's foot with the sole of his boot
  dragAway(o, from) {
    const lx = o.fy, ly = -o.fx; // his left
    const fromLeft = (from.x - o.x) * lx + (from.y - o.y) * ly > 0;
    o.dragSide = fromLeft ? -1 : 1; // +1 = pull it to his left
    o.dragUntil = this.t + DRAG_TIME;
    // Gabe keeps running if he's on the move; standing still, he plays the drag
    if (o !== this.controlled || Math.hypot(o.vx, o.vy) < 60) {
      o.kickAt = this.t;
      o.kickType = fromLeft ? 'dragR' : 'dragL';
    }
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
      if (p.release) {
        if (this.t >= p.releaseAt) this.releaseBall(p);
      } else if (this.t >= p.holdUntil + (p.team === HOME ? KEEPER_WAIT : 0.8)) {
        // The computer's keeper (or Gabe's, if nothing gets chosen) picks what suits the distance
        const m = this.pickPassTarget(p, { x: dir, y: 0 });
        if (m) {
          const d = dist(p, m);
          this.keeperDistribute(p, m, p.goalKick ? (d < 300 ? 'goalPass' : 'goalKick')
            : d < 260 ? 'roll' : d < 560 ? 'throw' : 'dropKick');
        }
      }
      return { vx: 0, vy: 0 };
    }
    this.maybeDive(p);
    if (this.t < p.diveUntil) {
      // Flying sideways, then lying there and getting back up
      return this.t < p.diveMoveUntil ? { vx: 0, vy: p.diveDir * p.diveSpeed } : { vx: 0, vy: 0 };
    }
    // Come out for a slow loose ball in the box.
    if (!b.owner && Math.abs(b.x - gx) < 130 && Math.abs(b.y) < 160 && Math.hypot(b.vx, b.vy) < 380) {
      return this.seek(p, b.x, b.y, KEEPER_SPEED);
    }
    const out = Math.hypot(b.x - gx, b.y) < 350 ? 40 : 16;
    const ty = clamp(b.y * 0.5, -GOAL_HALF + 14, GOAL_HALF - 14);
    return this.seek(p, gx + dir * (PLAYER_R + out), ty, KEEPER_SPEED);
  }

  // A shot coming at goal: dive (or go down sideways) to where it's heading,
  // or jump for one that's going over him.
  maybeDive(p) {
    const b = this.ball;
    if (b.owner || this.t < p.diveUntil) return;
    if (b.lastTouch && b.lastTouch.team === p.team) return;
    const toward = -p.team.dir; // the way the ball travels into this keeper's goal
    if (b.vx * toward < 250) return;
    const T = (p.x - b.x) / b.vx;
    if (T < 0 || T > 0.45) return;
    const y = b.y + b.vy * T;
    if (Math.abs(y) > GOAL_HALF + 25) return; // going wide: let it go
    const z = b.z > 0 || b.vz > 0 ? Math.max(0, b.z + b.vz * T - 0.5 * GRAVITY * T * T) : 0;
    const off = y - p.y;
    if (z > 45) {
      p.gkAct = { type: 'miss', at: this.t }; // up he goes, but it's too high
      p.diveUntil = this.t + 1.1;
      p.diveMoveUntil = this.t;
      return;
    }
    if (Math.abs(off) < 18) return; // straight at him: an ordinary catch
    const block = Math.abs(off) < 40 && z < 20;
    let move = clamp(off, -(block ? 26 : 45), block ? 26 : 45);
    if (b.scripted) move *= 0.35; // a right answer always beats him
    p.gkAct = { type: block ? 'block' : 'dive', at: this.t, side: Math.sign(off) };
    p.diveDir = Math.sign(move);
    p.diveSpeed = Math.abs(move) / 0.5;
    p.diveMoveUntil = this.t + 0.5;
    p.diveUntil = this.t + (block ? 1.7 : 2.0);
  }

  fieldAI(p) {
    const b = this.ball, team = p.team;
    if (b.owner === p) return this.aiWithBall(p);
    if (!b.owner && b.passTarget === p && this.t < b.passUntil) {
      return this.seek(p, b.x + b.vx * 0.15, b.y + b.vy * 0.15, AI_SPEED * 1.1);
    }
    const keeper = b.owner && b.owner.role === 'gk' ? b.owner : null;
    if (keeper && keeper.team !== team && this.marks && this.marks.has(p)) {
      // Stand in front of your man, between him and the keeper, to cut out a pass along the ground
      const man = this.marks.get(p);
      const toBall = norm(b.x - man.x, b.y - man.y);
      p.faceBall = true;
      const far = dist(p, man) > 150; // hurry back from upfield, then shuffle
      return this.seek(p, man.x + toBall.x * 40, man.y + toBall.y * 40, AI_SPEED * (far ? 1.25 : 0.85));
    }
    if (keeper && keeper.team === team) {
      // Spread out and keep moving to lose the markers
      const wiggle = Math.sin(this.t * 0.8 + p.num * 1.7);
      const x = p.homeX + team.dir * (p.role === 'def' ? 60 : 90);
      const y = clamp(p.homeY * 1.2 + wiggle * 70, F.top + 40, F.bottom - 40);
      return this.seek(p, x, y, AI_SPEED * 0.7);
    }
    if (b.owner && b.owner.team === team) {
      const [x, y] = this.supportSpot(p);
      return this.seek(p, x, y, AI_SPEED * 0.9);
    }
    // Close to whoever has the ball: don't charge in, jockey him and wait to get a foot in
    const o = b.owner;
    if (o && o.team !== team && o.role !== 'gk' && dist(p, o) < JOCKEY_R && this.nearestOutfield(team, o) === p) {
      const g = norm(ownGoalX(team) - o.x, -o.y);
      p.faceBall = true;
      return this.seek(p, o.x + g.x * JOCKEY_GAP, o.y + g.y * JOCKEY_GAP, AI_SPEED);
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
      if (this.canShoot(p) && (dGoal < 320 || (dGoal < 480 && Math.random() < 0.2))) {
        this.shoot(p, 0.55 + Math.random() * 0.35, (Math.random() * 2 - 1) * 0.9);
        return { vx: 0, vy: 0 };
      }
      // Someone in the way: sometimes try to get round him with a trick
      const toGoal = norm(gx - p.x, -p.y);
      if (this.t >= p.trickReadyAt && this.blocker(p, toGoal, 90) && Math.random() < 0.35) {
        this.cut(p, toGoal);
        return { vx: p.tvx, vy: p.tvy };
      }
      let pressure = Infinity, presser = null;
      for (const o of opponents) if (dist(p, o) < pressure) { pressure = dist(p, o); presser = o; }
      if (pressure < 80 && Math.random() < 0.6) {
        const m = this.openMate(p);
        if (m) { this.passTo(p, m); return { vx: 0, vy: 0 }; }
      }
      // Tight marking and no pass on: roll it away from him
      if (pressure < 60 && this.t >= p.dragUntil + 0.5 && Math.random() < 0.3) this.dragAway(p, presser);
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
    if (!o || o.role === 'gk' || this.t < o.trickUntil) return; // can't get a foot in mid-trick
    for (const p of this.players) {
      if (p === this.controlled || p.team === o.team || p.role === 'gk') continue;
      if (dist(p, o) < POKE_R && this.t >= p.tackleReadyAt) {
        p.tackleReadyAt = this.t + 0.9 + Math.random() * 0.8;
        this.poke(p, o);
        return;
      }
    }
  }

  // ---------- Physics ----------
  updatePlayers(dt) {
    const move = this.move;
    const gk = this.gabesKeeper();
    // While Gabe's keeper has the ball, the joystick picks who it goes to.
    this.keeperAim = gk ? this.pickPassTarget(gk, move.mag > 0.2 ? move : { x: 1, y: 0 }) : null;
    for (const p of this.players) {
      let d;
      p.faceBall = false;
      const steering = p === this.controlled && !gk;
      p.sprinting = steering && this.held.s && move.mag > 0.1 && !p.exhausted;
      if (p.sprinting) {
        p.stamina -= SPRINT_DRAIN * dt;
        if (p.stamina <= 0) { p.stamina = 0; p.exhausted = true; p.sprinting = false; }
      } else {
        p.stamina = Math.min(1, p.stamina + STAMINA_REGEN * dt);
        if (p.exhausted && p.stamina >= RECOVERED_AT) p.exhausted = false;
      }

      if (steering) {
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
      if (this.t < p.lockUntil) d = { vx: 0, vy: 0 }; // mid trick shot (or picking himself up after one)
      else if (this.t < p.trickUntil) d = { vx: p.tvx, vy: p.tvy };
      else if (this.t < p.lungeUntil) d = { vx: p.lx * 300, vy: p.ly * 300 };
      else if (this.t < p.dragUntil && !steering && this.ball.owner === p) {
        // Stepping back and across with the ball, away from the defender
        const v = norm(p.fy * p.dragSide - p.fx * 0.6, -p.fx * p.dragSide - p.fy * 0.6);
        d = { vx: v.x * 45, vy: v.y * 45 };
      }
      else if (this.t < p.stunUntil) { d.vx *= 0.25; d.vy *= 0.25; }

      const k = Math.min(1, dt * 10);
      // The ball sits off to one side while he drags it away from a defender
      p.ballTurn += ((this.t < p.dragUntil ? p.dragSide * 0.8 : 0) - p.ballTurn) * k;
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
      const facePoint = q => Math.atan2(q.y - p.y, q.x - p.x);
      if (this.trickShot && this.trickShot.p === p) target = this.trickShot.face;
      else if (this.t < p.lockUntil) target = null;
      else if (this.t < p.trickUntil) target = p.tface;
      else if (steering && move.mag > 0.15) target = Math.atan2(move.y, move.x);
      else if (p.role === 'gk' && this.ball.owner === p) {
        // Turn to whoever it's going to
        const to = p.release ? p.release.mate : p === gk ? this.keeperAim : null;
        target = to ? facePoint(to) : p.team.dir === 1 ? 0 : Math.PI;
      } else if (p.role === 'gk' && this.t < p.diveUntil) target = null; // no turning mid-dive
      else if (p.role === 'gk' || p.faceBall) target = facePoint(this.ball); // shuffle, watching the ball
      else if (Math.hypot(p.vx, p.vy) > 30) target = Math.atan2(p.vy, p.vx);
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
        if (a.team !== c.team && (this.t < a.trickUntil || this.t < c.trickUntil)) continue; // slipping past
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
    const b = this.ball, prevX = b.x;
    if (b.owner) {
      const o = b.owner, off = PLAYER_R + BALL_R + 1, a = o.angle + o.ballTurn;
      b.x = o.x + Math.cos(a) * off;
      b.y = o.y + Math.sin(a) * off;
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
    if (b.scripted) this.woodwork(prevX);
    else if (!inMouth) { // (a scripted shot that misses goes on out for a goal kick)
      if (b.x < F.left + BALL_R) { b.x = F.left + BALL_R; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > F.right - BALL_R) { b.x = F.right - BALL_R; b.vx = -Math.abs(b.vx) * 0.7; }
    }

    const under = b.z < CROSSBAR && Math.abs(b.y) < GOAL_HALF;
    if (b.x < F.left - BALL_R) {
      if (under) { b.owner = null; this.goalScored(AWAY); } else this.goalKick(HOME);
    } else if (b.x > F.right + BALL_R) {
      if (under) { b.owner = null; this.goalScored(HOME); } else this.goalKick(AWAY);
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
      const reach = !isGk ? TOUCH_R : this.t < p.diveMoveUntil + 0.3 ? TOUCH_R + 22 : TOUCH_R + 8; // arms out in a dive
      if (d < reach && d < bd) { bd = d; best = p; }
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
      if (!this.trickShot) this.autoSwitch();
      this.updatePlayers(dt);
      this.updateBall(dt);
      this.updateTrickShot();
      if (this.state === 'play') {
        this.checkPossession();
        this.aiTackles();
      }
    } else if (this.state === 'goal' || this.state === 'over') {
      this.updateBallInNet(dt);
    }
  }
}
