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
// How players speed up, slow down and turn (units per second, per second)
const ACCEL = 260;         // up to running pace in about half a second
const SPRINT_ACCEL = 55;   // ...then building from a run to full sprint takes most of a second
const PUSH_ACCEL = 170;    // except for a quick push-off as the sprint starts
const PUSH_TIME = 0.12;    // ...worth about 1 m/s
const BRAKE = 400;         // from a sprint to a stop in half a second
const TURN_RATE = 9;       // radians per second he can swing his run round when slow...
const TURN_LOSS = 0.55;    // ...and how much less at full sprint (wider turns)
const FOOT = 11;               // the ball at his feet is drawn 0.55 m out from the middle of him...
const STRIDE_REACH = 0.7;      // ...and up to 70% further out at full sprint
const SWEEP_SPEED = 240;       // fastest he rolls it round his feet (drag-backs, spins), 12 m/s
// Dribbling: the ball runs a little ahead between touches, further the faster he goes
const DRIBBLE_FRICTION = 0.45; // a dribbled ball keeps 45% of its speed each second
const STOP_FRICTION = 0.005;   // ...and next to none once he goes to stop it
const KNOCK = 30;              // extra pace on each touch when jogging...
const KNOCK_SPRINT = 90;       // ...and up to this much more at full sprint
const TIGHT_R = 70;            // an opponent this close in front (3.5 m, plus his speed) and he stops knocking it on
const GATHER_SPEED = 220;     // how fast he can bring a ball beside or behind him back in front
const GATHER_R = 60;           // ...if it's within 3 m of his feet
const LOSE_R = 90;             // knocked more than 4.5 m ahead of his feet, it's anybody's
// Passing and receiving
const ROLL_KEEP = 0.6;                // a rolling ball keeps 60% of its speed each second
const ROLL_LOSS = -Math.log(ROLL_KEEP); // ...the same, as a rate
const PASS_LEAD = 0.45;              // a pass leads a runner by up to this many seconds of his running
const FIRST_TOUCH = 40;               // a first touch knocks it this much faster than he's running...
const HOT_TOUCH = 0.15;               // ...plus this share of any pace over 250 the ball arrived with
const INTERCEPT_R = 22;               // how near an opponent a firm pass (12–24 m/s) must pass to be cut out
const FIRST_TOUCH_TIME = 0.3;        // ...and he lets it run that way this long before gathering it
const NICK_LEAD = 22;         // the computer only nicks a person's ball when it's this far out ahead (a long sprint touch)
const KEEPER_SPEED = 140;
// How long after starting each keeper move the ball leaves him (matches the animations)
const KEEPER_RELEASE = { throw: 0.58, dropKick: 0.92, roll: 0.75 };
const GOAL_KICK_SETUP = 1.4; // time to put the ball down for a goal kick
const TRICK_SPEED = 240;    // a quick burst, faster than sprinting (12 m/s)
const TRICK_TIME = 0.45;    // ...for about 5 metres
const TRICK_COOLDOWN = 1.2;
// Trick with the ball: a Marseille turn. He rolls the ball back with the sole of one boot, spins
// a full circle with his back to the defender, and rolls it on with the other, ending up past him.
const SPIN_TIME = 0.8;
const SPIN_SPEED = 150;     // about 6 m round the defender over the whole spin
// Footplay: a defender who gets close stops charging in and jockeys (stays goal-side, facing the
// ball) and jabs a foot at it now and then. The player on the ball drags it away from the poke.
const JOCKEY_R = 90;               // a defender this close (4.5 m) starts jockeying
const JOCKEY_GAP = 34;             // ...about 1.7 m off, between the ball and his goal
const POKE_R = PLAYER_R * 2 + 18;  // close enough to get a foot to the ball
const DRAG_TIME = 0.7;
// Sliding tackles. The paths are measured from the animations (metres the hips travel every 0.1 s
// of the clip), so a player moves across the grass in step with his legs.
const SLIDE_PATH = [0, 0.58, 1.03, 1.53, 2.07, 2.51, 2.82, 3.09, 3.33, 3.51, 3.64, 3.76, 3.85, 3.97, 4.1, 4.21, 4.26, 4.31];
const SLIDE_PLAY = 1.25;      // played this much faster than it was recorded
const SLIDE_R = 150;          // tackle pressed within 7.5 m of the ball (and too far to poke at it): he slides
const SLIDE_WIN = { person: 0.7, computer: 0.35, even: 0.5 }; // a person sliding at the computer / the computer at a person
const AI_SLIDE_RATE = 0.35;   // chance a second that a computer defender in range goes to ground (half that at a person)
// ...and the player who's slid into falls over (cut short once he's down), then gets up
const TRIP_PATH = [0, 0.46, 0.89, 1.27, 1.62, 1.96, 2.33, 2.56, 2.67, 2.85, 3.07];
const TRIP_PLAY = 1.4;
const GETUP_TIME = 1.67 / 1.8; // the standing-up clip, played 1.8× as fast
// How often a tackle wins the ball. Against the computer it's tilted a little in the person's
// favour, so games are a bit easier than an even match; two people (online) get an even 0.35.
// (Between two computer players it's 0.3.)
const TACKLE_WIN = { person: 0.4, computer: 0.3, even: 0.35 }; // a person tackling the computer / the computer tackling a person
const KEEPER_WAIT = 8; // a person's keeper throws it himself if nothing is chosen in this many seconds
const GRAVITY = 196;
const WIN_GOALS = 5;
const POST_R = 1.4; // the posts and crossbar are 7 cm thick

// Gabe's trick shots, coolest first. Whether it goes in is decided by his scoring chance (see
// scoringChance); when it misses, the closer his answer, the cooler the miss.
//   scores after a right answer, one of GOAL_SHOTS. GOAL! (after a wrong one, a plain strike)
//     header      flick it up and leap for a header
//     volleyGoal  knee it up and volley it in
//     strike      just hit it, low and hard, into the corner
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
  volleyGoal: { setup: 'knee', popAt: 0.25, strike: 'shoot', lead: 0.08, contactAt: 1.0, contactZ: 7, reach: 12, outcome: 'goal' },
  strike: { outcome: 'goal' },
  blast: { outcome: 'over' },
};
// Which scoring shot a right answer gets, and how often
const GOAL_SHOTS = [['header', 0.4], ['volleyGoal', 0.3], ['strike', 0.3]];
export const goalShot = () => pickWeighted(GOAL_SHOTS);
// Pick from [[thing, weight], ...] at random, by weight
function pickWeighted(list) {
  let r = Math.random() * list.reduce((t, [, w]) => t + w, 0);
  for (const [item, w] of list) if ((r -= w) < 0) return item;
  return list[list.length - 1][0];
}
const SLOW_MO = 0.35; // game speed around the moment a header or bicycle kick meets the ball
// The Eagles try the same moves near goal, but theirs aren't decided by a math answer: each is
// struck at goal like any shot, so it can go in, go wide, or be saved. Which move, how often:
const EAGLE_SHOTS = [['header', 0.4], ['volley', 0.4], ['bicycle', 0.2]];
const EAGLE_TRICK_SHOT = 0.3;      // chance a close-range Eagles shot is a trick shot
const EAGLE_TRICK_RANGE = 320;     // ...from within 16 m
const EAGLE_TRICK_REACH = 0.5;     // how much of the way across Gabe's keeper gets to one
const EAGLE_TRICK_CATCH = 0.5;     // ...and how often he holds on to it rather than parrying it

// He can shoot from anywhere. Where he shoots from is measured like a football yard line: the
// fraction of the pitch between him and the goal he's attacking (0 = on the goal line, 1 = on his
// own goal line). The pitch splits into thirds: easy questions in the third nearest goal, medium
// in the middle, hard in the third nearest his own goal.
export const shotLevel = fraction => (fraction < 1 / 3 ? 'easy' : fraction < 2 / 3 ? 'medium' : 'hard');
// His chance of scoring: 90% from the "10-yard line", 80% from the 20, down to 10% from his own 10.
// A right answer (first try) adds a boost for the question's level; a wrong one halves the chance.
const ANSWER_BOOST = { easy: 0.05, medium: 0.1, hard: 0.15 };
export function scoringChance(fraction, level, right) {
  const base = 1 - fraction;
  const chance = right ? base + (ANSWER_BOOST[level] || 0) : base / 2;
  return Math.min(0.99, Math.max(0.01, chance));
}
// Stamina runs from 1 (fresh) to 0 (exhausted).
const SPRINT_DRAIN = 1 / 4;   // a full bar lasts 4 seconds of sprinting
const STAMINA_REGEN = 1 / 9;  // and takes 9 seconds to refill when not sprinting
const RECOVERED_AT = 0.35;    // after running dry, you can sprint again once back to this level

// Kits. HOME is Gabe's Sharks (light blue), the team a single player controls. AWAY is the Eagles
// (Eagles green), played by the computer, or by the second person in an online game.
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
          stamina: 1, exhausted: false, sprinting: false, pushUntil: 0, firstTouchUntil: 0, kickType: 'pass',
          trickUntil: 0, trickReadyAt: 0, trickSide: 'L', tvx: 0, tvy: 0, tface: 0,
          spinUntil: 0, spin: null, spinBall: 0,
          diveUntil: 0, diveMoveUntil: 0, diveSpeed: 0, gkAct: null, release: null, faceBall: false,
          lockUntil: 0, leapAt: -10, dragUntil: 0, dragAngle: 0, ballPull: 0, ballAngle: 0, ballReach: 1,
          slideAt: 0, slideUntil: 0, slideDir: 0, slideDone: false, tripAt: 0, tripUntil: 0, tripDir: 0, gotUp: true,
        };
        this.players.push(p);
        this.teams.get(team).push(p);
      }
    }
    this.ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, owner: null, lastTouch: null, passTarget: null, passUntil: 0 };

    this.trickShot = null; // Gabe's trick shot while it's being played out
    this.timeScale = 1;    // below 1 for slow motion
    this.toast = null;
    this.score = { home: 0, away: 0 };
    this.setPilots([{ team: HOME }]);
    this.kickoff(HOME);
    this.state = 'menu'; // the start menu is showing; players line up behind it
    this.banner = null;
  }

  // ---------- Match flow ----------
  toMenu() {
    this.state = 'menu';
    this.banner = null;
  }

  // The people playing: a pilot for each team a person controls (just the Sharks against the
  // computer, both teams online). Each has their own joystick and buttons (set by the input code
  // every frame), their own player to steer, and whether their shots ask questions (Gabe's do).
  setPilots(list) {
    this.pilots = new Map(list.map(({ team, questions = false }) => [team, {
      team, questions, move: { x: 0, y: 0, mag: 0 }, held: { a: false, b: false, s: false, t: false },
      controlled: this.nearestOutfield(team, this.ball), keeper: null, keeperAim: null,
      charging: false, chargeStart: 0, nextAutoSwitch: 0,
    }]));
  }

  pilot(team) {
    return this.pilots.get(team);
  }

  // Is p the player a person is steering?
  isControlled(p) {
    const c = this.pilots.get(p.team);
    return !!c && c.controlled === p;
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
      p.diveUntil = 0; p.release = null; p.gkAct = null; p.trickUntil = 0; p.lockUntil = 0; p.spinUntil = 0;
      p.dragUntil = 0; p.ballPull = 0; p.slideUntil = 0; p.tripUntil = 0;
      p.stamina = Math.min(1, p.stamina + 0.3); // a breather after each goal
      p.sprinting = false;
    }
    const kicker = this.teams.get(team).find(p => p.role === 'fw');
    kicker.x = -team.dir * FOOT; // the ball on the spot at his feet
    kicker.y = 0;

    const b = this.ball;
    b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0;
    this.setOwner(kicker);
    this.atFeet(kicker);
    for (const c of this.pilots.values()) {
      if (c.team !== team) c.controlled = this.nearestOutfield(c.team, b);
      c.charging = false;
    }
    this.updateBall(0);

    this.trickShot = null;
    this.timeScale = 1;
    this.state = 'kickoff';
    this.stateUntil = this.t + 1.2;
    this.setBanner('KICK OFF', '');
  }

  goalScored(team) {
    if (this.state !== 'play') return;
    if (team === HOME) this.score.home++; else this.score.away++;
    for (const c of this.pilots.values()) c.charging = false;
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
  // team: only show it to whoever plays that team (null = everyone)
  showToast(text, time = 1.3, team = null) { this.toast = { text, until: this.t + time, team }; }

  // ---------- Buttons ----------
  // a = Pass / Switch, b = Shoot / Tackle, s = Sprint, t = Trick
  press(team, key) {
    const c = this.pilots.get(team);
    if (!c || c.held[key]) return;
    c.held[key] = true;
    if (this.state !== 'play' || this.trickShot) return; // nothing interrupts a trick shot
    const gk = this.pilotsKeeper(team);
    if (gk) { this.humanKeeper(c, gk, key); return; }
    const hasBall = this.attacking(team);
    if (key === 't') {
      this.humanTrick(c);
    } else if (key === 'a') {
      if (hasBall) this.humanPass(c); else this.switchPlayer(c);
    } else if (key === 'b') {
      if (!hasBall) this.humanTackle(c);
      else { c.charging = true; c.chargeStart = this.t; }
    }
  }

  // Shots are only allowed once you've reached the halfway line (the Eagles' rule; Gabe can shoot
  // from anywhere, and the further out he is, the lower his chance of scoring)
  canShoot(p) {
    return p.x * p.team.dir >= 0;
  }

  // How far up the pitch p is from the goal he's attacking: 0 on its goal line, 1 on his own
  shotFraction(p) {
    return Math.min(1, Math.max(0, (oppGoalX(p.team) - p.x) * p.team.dir / (F.right - F.left)));
  }

  // Metres from p to the middle of the goal he's attacking
  shotDistance(p) {
    return Math.hypot(oppGoalX(p.team) - p.x, p.y) * 0.05;
  }

  release(team, key) {
    const c = this.pilots.get(team);
    if (!c) return;
    c.held[key] = false;
    if (key === 'b' && c.charging) {
      c.charging = false;
      if (this.state === 'play' && this.attacking(team)) this.humanShoot(c);
    }
  }

  // Does the player this team's person is steering have the ball?
  attacking(team) {
    const c = this.pilots.get(team);
    return !!c && this.ball.owner === c.controlled;
  }

  // A person's keeper holding the ball and waiting to be told how to put it back in play
  pilotsKeeper(team) {
    const o = this.ball.owner;
    return this.state === 'play' && o && o.role === 'gk' && o.team === team && this.pilots.has(team) && !o.release ? o : null;
  }

  power(team) {
    return Math.min(1, (this.t - this.pilots.get(team).chargeStart) / 0.9);
  }

  // ---------- Human actions (c is the pilot doing them) ----------
  humanPass(c) {
    const me = c.controlled, m = c.move;
    const dir = m.mag > 0.2 ? { x: m.x, y: m.y } : { x: me.fx, y: me.fy };
    const mate = this.pickPassTarget(me, dir);
    if (mate) this.passTo(me, mate);
  }

  // When the pilot gets questions (Gabe is playing), every shot pauses the game for a math question
  // (the menu code shows it). Otherwise it's an ordinary shot the keeper can save.
  humanShoot(c) {
    const me = c.controlled, m = c.move;
    // Aim with the joystick; with no aim, go for the far post.
    const aimY = m.mag > 0.2 ? m.y : (me.y < 0 ? 0.6 : -0.6);
    if (!c.questions) { this.shoot(me, this.power(c.team), aimY); return; }
    // The question's difficulty and his chance of scoring depend on how far out he's shooting from
    this.pendingShot = { team: c.team, shooter: me, aimY, distance: this.shotDistance(me), fraction: this.shotFraction(me) };
    this.state = 'question';
  }

  // style is one of SHOTS: 'header' scores; the others miss, less spectacularly the further off he was.
  answerShot(style) {
    const { shooter, aimY } = this.pendingShot || {}; // no shot waiting: just carry on playing
    this.pendingShot = null;
    this.state = 'play';
    if (this.ball.owner !== shooter) return;
    const move = SHOTS[style];
    if (!move) this.scriptedShot(shooter, 'over', aimY);
    else if (!move.setup) this.scriptedShot(shooter, move.outcome, aimY, style); // a strike or a blast
    else this.startTrickShot(shooter, style, aimY);
  }

  // Play out a header, bicycle kick or volley. He stands his ground while the move plays,
  // and nobody can get to the ball until it's on its way.
  // real: an Eagles trick shot, struck for real at contact rather than following SHOTS' outcome.
  startTrickShot(p, style, aimY, real = false) {
    const move = SHOTS[style];
    const gx = oppGoalX(p.team);
    const toGoal = Math.atan2(-p.y, gx - p.x);
    this.trickShot = { p, style, move, aimY, real, t0: this.t, face: move.backToGoal ? toGoal + Math.PI : toGoal, struck: false, striking: false };
    p.lockUntil = this.t + move.contactAt + (move.downFor || 0.35);
    if (style === 'header') p.leapAt = this.t + move.contactAt; // the view lifts him off the ground
    p.kickAt = this.t;
    p.kickType = move.setup;
    if (this.pilots.has(p.team)) this.pilots.get(p.team).charging = false;
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
    if (s.real) this.trickStrike(p, s.style, s.aimY);
    else this.aimBall(p.team, move.outcome, s.aimY);
  }

  // An Eagles header, volley or bicycle kick leaving his head or foot: a real shot at goal,
  // aimed roughly where he wanted, that the keeper can save and that can miss.
  trickStrike(p, style, aimY) {
    const b = this.ball, gx = oppGoalX(p.team);
    const side = aimY < 0 ? -1 : 1; // he goes for a corner, and now and then misses it
    const ty = side * GOAL_HALF * (0.45 + Math.random() * 0.6);
    const heightAtLine = Math.random() < 0.12 ? CROSSBAR + 20 : 4 + Math.random() * 30; // ...or clears the bar
    const dx = gx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
    const speed = style === 'header' ? 480 : 620;
    const T = d / speed;
    b.owner = null;
    b.vx = dx / d * speed;
    b.vy = dy / d * speed;
    b.vz = (heightAtLine - b.z + 0.5 * GRAVITY * T * T) / T;
    b.scripted = false;
    b.outcome = null;
    b.style = style;
    b.hitWood = false;
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
  scriptedShot(p, outcome, aimY, style = 'blast') {
    this.kick(p, oppGoalX(p.team) - p.x, -p.y, 500, 0);
    this.ball.style = style;
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
  humanKeeper(c, gk, key) {
    if (this.t < gk.holdUntil || !c.keeperAim) return; // still gathering the ball
    const type = gk.goalKick ? { a: 'goalPass', b: 'goalKick' }[key] : { a: 'throw', b: 'dropKick', s: 'roll' }[key];
    if (type) this.keeperDistribute(gk, c.keeperAim, type);
  }

  // With the ball: spin round the nearest defender, keeping the ball.
  // Without it: dart round whoever is in the way.
  humanTrick(c) {
    const me = c.controlled, m = c.move;
    if (this.t < me.trickReadyAt) return;
    let dir = m.mag > 0.2 ? { x: m.x, y: m.y } : { x: me.fx, y: me.fy };
    if (this.ball.owner === me) { this.spin(me, dir); return; }
    if (m.mag <= 0.2) dir = norm(this.ball.x - me.x, this.ball.y - me.y); // no direction given: head for the ball
    this.cut(me, dir);
  }

  // The nearest opponent in front of p (within range), going in direction dir
  blocker(p, dir, range) {
    let best = null, bd = range;
    for (const o of this.teams.get(p.team === HOME ? AWAY : HOME)) {
      const d = dist(p, o);
      if (d < bd && this.ahead(p, dir, o) > 0.3 && !this.down(o)) { bd = d; best = o; }
    }
    return best;
  }

  // How straight ahead of p the player o is: 1 = dead ahead, 0 = level, negative = behind
  ahead(p, dir, o) {
    const n = norm(o.x - p.x, o.y - p.y);
    return n.x * dir.x + n.y * dir.y;
  }

  // A burst diagonally past the nearest opponent, away from the side he's on. The defender
  // is wrong-footed for a moment (a person's player never is: they have to react themselves).
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
    if (o && dist(p, o) < 110 && !this.isControlled(o) && o.role !== 'gk') o.stunUntil = this.t + 0.45;
  }

  // The Marseille turn: step on the ball, spin a full circle with his back to the defender,
  // and come out on the far side of him still on the ball, heading the way he was going.
  // He goes round whichever side the defender isn't on, and the defender is wrong-footed
  // (a person's player never is: they have to react themselves).
  spin(p, dir) {
    const o = this.blocker(p, dir, 160);
    const left = { x: dir.y, y: -dir.x }; // the player's own left
    const goLeft = o ? (o.x - p.x) * left.x + (o.y - p.y) * left.y < 0 : Math.random() < 0.5;
    p.spin = { dir, side: goLeft ? left : { x: -left.x, y: -left.y }, face: Math.atan2(dir.y, dir.x),
      turn: goLeft ? -1 : 1, foot: goLeft ? 'dragR' : 'dragL', switched: false, t0: this.t };
    p.spinUntil = this.t + SPIN_TIME;
    p.trickReadyAt = this.t + SPIN_TIME + TRICK_COOLDOWN;
    p.nextDecision = p.spinUntil + 0.4; // the computer carries on with the ball for a moment after
    p.kickAt = this.t;
    p.kickType = p.spin.foot; // sole roll with the first foot
    if (o && dist(p, o) < 110 && !this.isControlled(o) && o.role !== 'gk') o.stunUntil = this.t + 0.7;
  }

  // Mid-spin: where he's moving and which way he's facing. He goes sideways round the defender
  // at first, then on in his original direction; the ball stays on that path, not where he faces.
  spinStep(p) {
    const s = p.spin, u = clamp((this.t - s.t0) / SPIN_TIME, 0, 1);
    if (!s.switched && u >= 0.5) { // halfway round: roll it on with the other foot
      s.switched = true;
      p.kickAt = this.t;
      p.kickType = s.foot === 'dragR' ? 'dragL' : 'dragR';
    }
    const v = norm(s.side.x * (1 - u) * 1.1 + s.dir.x * (0.35 + u), s.side.y * (1 - u) * 1.1 + s.dir.y * (0.35 + u));
    const ease = u * u * (3 - 2 * u);
    return { vx: v.x * SPIN_SPEED, vy: v.y * SPIN_SPEED, angle: s.face + s.turn * Math.PI * 2 * ease, ball: Math.atan2(v.y, v.x) };
  }

  humanTackle(c) {
    const me = c.controlled;
    if (this.t < me.tackleReadyAt) return;
    me.tackleReadyAt = this.t + 0.55;
    const o = this.ball.owner;
    if (o && o.team !== me.team && o.role !== 'gk' && dist(me, o) < POKE_R + 6) {
      this.poke(me, o);
      return;
    }
    // A few metres off the ball (theirs, or loose): go to ground and slide in for it
    if ((!o || (o.team !== me.team && o.role !== 'gk')) && dist(me, this.ball) < SLIDE_R) {
      this.slide(me);
      return;
    }
    // Too far away: a quick step toward the ball with a foot out.
    me.kickAt = this.t;
    me.kickType = 'poke';
    const n = norm(this.ball.x - me.x, this.ball.y - me.y);
    me.lx = n.x; me.ly = n.y;
    me.lungeUntil = this.t + 0.22;
  }

  switchPlayer(c) {
    let best = null, bd = Infinity;
    for (const p of this.teams.get(c.team)) {
      if (p.role === 'gk' || p === c.controlled || this.down(p)) continue;
      const d = dist(p, this.ball);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) c.controlled = best;
    c.nextAutoSwitch = this.t + 1.5;
  }

  autoSwitch(c) {
    const b = this.ball;
    if ((b.owner && b.owner.team === c.team) || this.t < c.nextAutoSwitch) return;
    const best = this.nearestOutfield(c.team, b);
    if (best !== c.controlled && dist(c.controlled, b) - dist(best, b) > 220) {
      c.controlled = best;
      c.nextAutoSwitch = this.t + 1.2;
    }
  }

  // ---------- Ball actions (shared by human and computer players) ----------
  setOwner(p) {
    const b = this.ball;
    b.owner = p;
    b.scripted = false;
    b.lastTouch = p;
    b.passTarget = null;
    if (p.role !== 'gk') { // he traps it, then dribbles it from there
      b.vx = p.vx; b.vy = p.vy;
      p.ballAngle = Math.atan2(b.y - p.y, b.x - p.x);
      p.ballReach = dist(p, b) / FOOT;
    }
    const c = this.pilots.get(p.team);
    if (c && p.role !== 'gk') c.controlled = p;
    if (p.role === 'gk') {
      p.holdUntil = Math.max(this.t + 0.9, p.diveUntil); // a diving keeper gets up first
      p.goalKick = false;
      p.release = null;
      if (this.t >= p.diveUntil) p.gkAct = { type: this.catchType(p), at: this.t };
      this.assignMarks(p);
      if (c) this.showToast('THROW, KICK or ROLL?', 1.3, p.team);
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
    if (p.role === 'gk') { // out of his hands (anyone else kicks it from where it is, at his feet)
      b.x = p.x + n.x * (PLAYER_R + BALL_R + 2);
      b.y = p.y + n.y * (PLAYER_R + BALL_R + 2);
    }
    b.vx = n.x * speed;
    b.vy = n.y * speed;
    b.vz = lift;
    b.style = null;
    b.outcome = null;
    b.hitWood = false;
    b.passSpot = null;
    p.noTouchUntil = this.t + 0.35;
    p.kickAt = this.t;
    p.kickType = lift > 0 ? 'shoot' : 'pass';
  }

  passTo(p, mate) {
    // Play it into his path: aim where he'll be when the ball gets there, and kick just hard
    // enough to arrive at a trappable pace (rolling friction takes off about 0.5 × the distance
    // in speed along the way).
    // (Aimed from the ball, which sits at his feet rather than in the middle of him.)
    const b = this.ball, ox = p.role === 'gk' ? p.x : b.x, oy = p.role === 'gk' ? p.y : b.y;
    let tx = mate.x, ty = mate.y, speed = 200, T = 0;
    for (let i = 0; i < 3; i++) {
      const d = Math.hypot(tx - ox, ty - oy);
      speed = clamp(d * 0.55 + 110, 200, 520);
      T = -Math.log(Math.max(0.05, 1 - d * ROLL_LOSS / speed)) / ROLL_LOSS; // how long it takes to roll there
      const lead = Math.min(T, PASS_LEAD);
      tx = clamp(mate.x + mate.vx * lead, F.left + 40, F.right - 40);
      ty = clamp(mate.y + mate.vy * lead, F.top + 40, F.bottom - 40);
    }
    this.kick(p, tx - ox, ty - oy, speed);
    b.passTarget = mate;
    b.passSpot = { x: tx, y: ty };
    this.ball.passUntil = this.t + T + 0.6;
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
    o.kickAt = this.t; // he stumbles as it's taken off him
    o.kickType = 'stumble';
    this.setOwner(p); // (he gathers it in from where it was, so it doesn't jump)
  }

  // Put the ball down right in front of p (kick-offs)
  atFeet(p) {
    const b = this.ball;
    b.x = p.x + p.fx * FOOT;
    b.y = p.y + p.fy * FOOT;
    b.vx = p.vx; b.vy = p.vy;
  }

  // A defender jabs a foot at the ball: he wins it cleanly, knocks it loose for a scramble,
  // or the player on the ball drags it away from him.
  poke(p, o) {
    p.kickAt = this.t;
    p.kickType = 'poke';
    const byPerson = this.isControlled(p), onPerson = this.isControlled(o);
    let win = byPerson && onPerson ? TACKLE_WIN.even : byPerson ? TACKLE_WIN.person : onPerson ? TACKLE_WIN.computer : 0.3;
    let loose = 0.08; // only now and then does it squirt loose; usually he pulls it back out of reach
    if (this.t < o.trickUntil || this.t < o.dragUntil || this.t < o.spinUntil) { win *= 0.4; loose *= 0.5; } // harder mid-move
    const r = Math.random();
    if (r < win) this.steal(p);
    else if (r < win + loose) this.knockLoose(p, o);
    else this.dragAway(o, p);
  }

  // Going to ground for the ball, aimed where it's heading (or where whoever has it is running)
  slide(p) {
    const b = this.ball, o = b.owner, lead = clamp(dist(p, b) / 250, 0.1, 0.45); // (about how long till he's there)
    const tx = b.x + (o ? o.vx : b.vx) * lead, ty = b.y + (o ? o.vy : b.vy) * lead;
    const straight = Math.atan2(b.y - p.y, b.x - p.x);
    p.slideDir = rotateTo(straight, Math.atan2(ty - p.y, tx - p.x), 0.6); // never far off the ball itself
    p.angle = p.slideDir; p.fx = Math.cos(p.angle); p.fy = Math.sin(p.angle);
    p.slideAt = this.t;
    p.slideUntil = this.t + (SLIDE_PATH.length - 1) * 0.1 / SLIDE_PLAY;
    p.slideDone = false;
    p.noTouchUntil = p.slideUntil; // only his outstretched leg plays the ball (slideContacts)
    p.tackleReadyAt = p.slideUntil + 0.3;
    p.sprinting = false;
    p.kickAt = this.t;
    p.kickType = 'slide';
  }

  // Sliding along the grass, his leading foot reaches the ball (or he gets to the man on it) before
  // he's stopped: he wins it and knocks it away, and the man goes over; or he's beaten and left on
  // the floor.
  slideContacts() {
    const b = this.ball;
    for (const p of this.players) {
      if (this.t >= p.slideUntil || p.slideDone) continue;
      const k = (this.t - p.slideAt) * SLIDE_PLAY; // seconds into the clip
      if (k > 1) continue;
      const foot = { x: p.x + Math.cos(p.slideDir) * 22, y: p.y + Math.sin(p.slideDir) * 22 };
      const o = b.owner;
      if (o && o.team !== p.team && o.role !== 'gk' && (dist(foot, b) < 24 || dist(foot, o) < 26 || dist(p, o) < 30)) {
        p.slideDone = true;
        const byPerson = this.isControlled(p), onPerson = this.isControlled(o);
        const win = byPerson && onPerson ? SLIDE_WIN.even : byPerson ? SLIDE_WIN.person : onPerson ? SLIDE_WIN.computer : 0.5;
        if (Math.random() < win) { this.clearBall(p); this.trip(o); }
      } else if (!o && !b.scripted && b.z < 15 && dist(foot, b) < 24) {
        p.slideDone = true;
        this.clearBall(p);
      }
    }
  }

  // His slide knocks the ball on a few metres the way he's going
  clearBall(p) {
    const b = this.ball, a = p.slideDir + (Math.random() - 0.5) * 0.8, speed = 130 + Math.random() * 70;
    b.owner = null;
    b.x = p.x + Math.cos(p.slideDir) * 24;
    b.y = p.y + Math.sin(p.slideDir) * 24;
    b.vx = Math.cos(a) * speed;
    b.vy = Math.sin(a) * speed;
    b.vz = 0;
    b.lastTouch = p;
    b.passTarget = null;
  }

  // Slid into, he goes over, and gets up again. A person's player is swapped for a teammate.
  trip(o) {
    o.tripAt = this.t;
    o.tripDir = o.angle;
    o.tripUntil = this.t + (TRIP_PATH.length - 1) * 0.1 / TRIP_PLAY + GETUP_TIME;
    o.gotUp = false;
    o.noTouchUntil = o.tripUntil;
    o.trickUntil = 0; o.dragUntil = 0; o.spinUntil = 0; o.ballPull = 0; o.sprinting = false;
    o.kickAt = this.t;
    o.kickType = 'trip';
    const c = this.pilots.get(o.team);
    if (c && c.controlled === o) this.switchPlayer(c);
  }

  // On the floor after a slide or a trip
  down(p) {
    return this.t < p.slideUntil || this.t < p.tripUntil;
  }

  // His velocity this frame along one of the measured paths (zero once it's run out)
  pathVel(path, startAt, play, dir, dt) {
    if (dt <= 0) return { vx: 0, vy: 0 }; // (a paused frame)
    const at = k => { const i = k / 0.1; if (i >= path.length - 1) return path[path.length - 1];
      const j = Math.floor(i); return path[j] + (path[j + 1] - path[j]) * (i - j); };
    const k1 = (this.t - startAt) * play, k0 = Math.max(0, k1 - dt * play);
    const s = (at(k1) - at(k0)) * 20 / dt; // metres to units a second
    return { vx: Math.cos(dir) * s, vy: Math.sin(dir) * s };
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

  // The player on the ball pulls it back toward himself with the sole of his boot and steps
  // away from the defender, keeping the ball tucked in on the far side from the poke
  dragAway(o, from) {
    const lx = o.fy, ly = -o.fx; // his left
    const fromLeft = (from.x - o.x) * lx + (from.y - o.y) * ly > 0;
    const away = norm(o.x - from.x, o.y - from.y);
    o.dragAngle = Math.atan2(away.y, away.x);
    o.dragUntil = this.t + DRAG_TIME;
    // A person's player keeps running if he's on the move; standing still, he plays the drag
    if (!this.isControlled(o) || Math.hypot(o.vx, o.vy) < 60) {
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
      if (p.role === 'gk' || this.down(p)) continue;
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
      } else if (this.t >= p.holdUntil + (this.pilots.has(p.team) ? KEEPER_WAIT : 0.8)) {
        // The computer's keeper (or a person's, if nothing gets chosen) picks what suits the distance
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
    else if (b.style && b.style !== 'blast') move *= EAGLE_TRICK_REACH; // an Eagles trick shot is hard to read
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
      // Run on to where it's played; once there, open up to face it. Close in, go and meet it.
      const s = b.passSpot;
      if (s && dist(p, b) > 220) {
        if (dist(p, s) < 30) p.faceBall = true;
        return this.seek(p, s.x, s.y, AI_SPEED * 1.1);
      }
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
      // A loose ball with someone in the way: sometimes dart round him, like Gabe can
      if (!b.owner && this.t >= p.trickReadyAt && this.t >= p.nextDecision) {
        p.nextDecision = this.t + 0.3;
        const toBall = norm(b.x - p.x, b.y - p.y);
        if (dist(p, b) < 220 && this.blocker(p, toBall, 90) && Math.random() < 0.3) {
          this.cut(p, toBall);
          return { vx: p.tvx, vy: p.tvy };
        }
      }
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
    if (this.t < p.spinUntil) return { vx: 0, vy: 0 }; // finish the spin first (spinStep moves him)

    if (this.t >= p.nextDecision) {
      p.nextDecision = this.t + 0.3;
      if (this.canShoot(p) && (dGoal < 320 || (dGoal < 480 && Math.random() < 0.2))) {
        const aimY = (Math.random() * 2 - 1) * 0.9;
        if (p.team === AWAY && dGoal < EAGLE_TRICK_RANGE && Math.random() < EAGLE_TRICK_SHOT) {
          this.startTrickShot(p, pickWeighted(EAGLE_SHOTS), aimY, true);
        } else {
          this.shoot(p, 0.55 + Math.random() * 0.35, aimY);
        }
        return { vx: 0, vy: 0 };
      }
      // Someone in the way: sometimes spin round him, the same trick Gabe has
      const toGoal = norm(gx - p.x, -p.y);
      if (this.t >= p.trickReadyAt && this.blocker(p, toGoal, 90) && Math.random() < 0.35) {
        this.spin(p, toGoal);
        return { vx: 0, vy: 0 };
      }
      let pressure = Infinity, presser = null;
      for (const o of opponents) if (dist(p, o) < pressure && !this.down(o)) { pressure = dist(p, o); presser = o; }
      if (pressure < 80 && Math.random() < 0.6) {
        const m = this.openMate(p);
        if (m) { this.passTo(p, m); return { vx: 0, vy: 0 }; }
      }
      // Tight marking and no pass on: roll it away from him
      if (pressure < 60 && this.t >= p.dragUntil + 0.5 && Math.random() < 0.3) this.dragAway(p, presser);
    }

    // Dribble at goal, steering around anyone in the way (and after the ball if it's run on ahead).
    const b = this.ball;
    let d = dist(p, b) > FOOT * this.stride(p) + 12 ? norm(b.x - p.x, b.y - p.y) : norm(gx - p.x, -p.y);
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

  aiTackles(dt) {
    const o = this.ball.owner;
    if (!o || o.role === 'gk' || this.t < o.trickUntil || this.t < o.spinUntil) return; // can't get a foot in mid-trick
    for (const p of this.players) {
      if (this.isControlled(p) || p.team === o.team || p.role === 'gk' || this.down(p)) continue;
      // The one closing him down, a few metres off: now and then he slides in
      const d = dist(p, o);
      if (d >= POKE_R && d < SLIDE_R * 0.8 && this.t >= p.tackleReadyAt && this.nearestOutfield(p.team, o) === p
        && Math.random() < AI_SLIDE_RATE * dt * (this.isControlled(o) ? 0.5 : 1)) {
        this.slide(p);
        return;
      }
      if (dist(p, o) < POKE_R && this.t >= p.tackleReadyAt) {
        p.tackleReadyAt = this.t + 0.9 + Math.random() * 0.8;
        this.poke(p, o);
        return;
      }
    }
  }

  // ---------- Physics ----------
  updatePlayers(dt) {
    // While a person's keeper has the ball, their joystick picks who it goes to.
    for (const c of this.pilots.values()) {
      c.keeper = this.pilotsKeeper(c.team);
      c.keeperAim = c.keeper ? this.pickPassTarget(c.keeper, c.move.mag > 0.2 ? c.move : { x: c.team.dir, y: 0 }) : null;
    }
    for (const p of this.players) {
      let d;
      p.faceBall = false;
      const c = this.pilots.get(p.team);
      // A pass on its way to the player you're steering: he moves on to it himself, and your
      // joystick says where his first touch takes it
      const b = this.ball, receiving = !b.owner && b.passTarget === p && this.t < b.passUntil;
      const steering = !!c && p === c.controlled && !c.keeper && !receiving;
      const move = steering ? c.move : null;
      const wasSprinting = p.sprinting;
      p.sprinting = steering && c.held.s && move.mag > 0.1 && !p.exhausted;
      if (p.sprinting && !wasSprinting) p.pushUntil = this.t + PUSH_TIME;
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
        if (c.charging) sp *= 0.6;
        d = { vx: move.x * move.mag * sp, vy: move.y * move.mag * sp };
      } else if (p.role === 'gk') {
        d = this.keeperAI(p);
      } else {
        d = this.fieldAI(p);
      }
      const spinning = this.t < p.spinUntil && this.ball.owner === p ? this.spinStep(p) : null;
      let running = false, exact = false;
      if (this.t < p.tripUntil) {
        // Going over, then picking himself up
        d = this.pathVel(TRIP_PATH, p.tripAt, TRIP_PLAY, p.tripDir, dt);
        exact = true;
        if (!p.gotUp && (this.t - p.tripAt) * TRIP_PLAY >= (TRIP_PATH.length - 1) * 0.1) {
          p.gotUp = true;
          p.kickAt = this.t;
          p.kickType = 'getUp';
        }
      }
      else if (this.t < p.slideUntil) { d = this.pathVel(SLIDE_PATH, p.slideAt, SLIDE_PLAY, p.slideDir, dt); exact = true; }
      else if (this.t < p.lockUntil) d = { vx: 0, vy: 0 }; // mid trick shot (or picking himself up after one)
      else if (spinning) d = spinning;
      else if (this.t < p.trickUntil) d = { vx: p.tvx, vy: p.tvy };
      else if (this.t < p.lungeUntil) d = { vx: p.lx * 300, vy: p.ly * 300 };
      else if (this.t < p.dragUntil && !steering && this.ball.owner === p) {
        // Stepping back with the ball, away from the defender
        d = { vx: Math.cos(p.dragAngle) * 70, vy: Math.sin(p.dragAngle) * 70 };
      }
      else {
        running = p.role !== 'gk'; // tricks and keepers keep their snappy moves
        if (this.t < p.stunUntil) { d.vx *= 0.25; d.vy *= 0.25; }
      }

      const k = Math.min(1, dt * 10);
      // The ball comes back in under him while he pulls it away from a defender
      p.ballPull += ((this.t < p.dragUntil && this.ball.owner === p ? 1 : 0) - p.ballPull) * k;
      if (running) this.runToward(p, d, dt);
      else if (exact) { p.vx = d.vx; p.vy = d.vy; } // in step with the animation
      else {
        p.vx += (d.vx - p.vx) * k;
        p.vy += (d.vy - p.vy) * k;
      }
      p.x = clamp(p.x + p.vx * dt, F.left + PLAYER_R, F.right - PLAYER_R);
      p.y = clamp(p.y + p.vy * dt, F.top + PLAYER_R, F.bottom - PLAYER_R);
      if (p.role === 'gk') {
        p.x = p.team.dir === 1 ? Math.min(p.x, F.left + 140) : Math.max(p.x, F.right - 140);
        p.y = clamp(p.y, -170, 170);
      }

      // Turn smoothly toward the direction of travel (the ball sits in front).
      let target = null;
      const facePoint = q => Math.atan2(q.y - p.y, q.x - p.x);
      if (this.t < p.tripUntil) target = p.tripDir;
      else if (this.t < p.slideUntil) target = p.slideDir;
      else if (this.trickShot && this.trickShot.p === p) target = this.trickShot.face;
      else if (spinning) { p.angle = spinning.angle; p.spinBall = spinning.ball; target = p.angle; }
      else if (this.t < p.lockUntil) target = null;
      else if (this.t < p.trickUntil) target = p.tface;
      else if (this.t < p.dragUntil && !steering && this.ball.owner === p) target = p.dragAngle + Math.PI; // facing the defender
      else if (steering && move.mag > 0.15) {
        // On the move he faces where he's actually going (planting to turn back, he still faces forward)
        target = Math.hypot(p.vx, p.vy) > 60 ? Math.atan2(p.vy, p.vx) : Math.atan2(move.y, move.x);
      }
      else if (p.role === 'gk' && this.ball.owner === p) {
        // Turn to whoever it's going to
        const to = p.release ? p.release.mate : c && p === c.keeper ? c.keeperAim : null;
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
        const slipping = q => this.t < q.trickUntil || this.t < q.spinUntil || this.down(q);
        if (a.team !== c.team && (slipping(a) || slipping(c))) continue; // slipping past
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = PLAYER_R * 2;
        if (d < min && d > 0.01) {
          const push = (min - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
        }
      }
    }
  }

  // Speed up, slow down and turn like a real runner: quick off the mark, a short push-off into a
  // sprint and then building to top speed, and wider turns the faster he's going.
  runToward(p, d, dt) {
    const want = Math.hypot(d.vx, d.vy);
    let s = Math.hypot(p.vx, p.vy);
    let a = Math.atan2(p.vy, p.vx), target = want;
    if (want > 1) {
      const ta = Math.atan2(d.vy, d.vx);
      const off = Math.abs(Math.atan2(Math.sin(ta - a), Math.cos(ta - a)));
      if (s < 40) a = ta; // nearly stopped: he can set off any way
      else if (off > 2) target = 0; // doubling back: plant and stop first
      else {
        a = rotateTo(a, ta, TURN_RATE * (1 - TURN_LOSS * Math.min(1, s / SPRINT_SPEED)) * dt);
        target *= 1 - 0.3 * Math.min(1, off / (Math.PI / 2)); // easing off into a sharp cut
      }
    }
    if (target < s) s = Math.max(target, s - BRAKE * dt);
    else s = Math.min(target, s + Math.max(s < RUN_SPEED ? ACCEL : SPRINT_ACCEL, this.t < p.pushUntil ? PUSH_ACCEL : 0) * dt);
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s;
  }

  // An outfield player just running with the ball (not mid-trick, spin or drag-back) dribbles it
  dribbling(o) {
    return o.role !== 'gk' && this.t >= o.spinUntil && this.t >= o.trickUntil && this.t >= o.dragUntil
      && this.t >= o.lockUntil && o.ballPull < 0.01 && !(this.trickShot && this.trickShot.p === o);
  }

  // The ball rolls on ahead of him between touches, and when he catches up he plays it on again:
  // tiny touches jogging, longer ones sprinting. Turn away from it and it can get away from him.
  dribble(o, dt) {
    const b = this.ball, B = FOOT * this.stride(o); // B: right at his feet
    b.z = 0; b.vz = 0;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Letting go of the joystick (or pulling it back the other way), a person's player puts his
    // foot on it rather than let it run away
    const c = this.pilots.get(o.team), m = c && c.move;
    const stopping = !!c && c.controlled === o && (m.mag < 0.15 || m.x * o.fx + m.y * o.fy < -0.3);
    const f = Math.pow(stopping ? STOP_FRICTION : DRIBBLE_FRICTION, dt);
    b.vx *= f;
    b.vy *= f;
    const fx = o.x + o.fx * B, fy = o.y + o.fy * B;
    const along = (b.x - o.x) * o.fx + (b.y - o.y) * o.fy;
    let gap = Math.hypot(fx - b.x, fy - b.y);
    if (along < B && this.t >= o.firstTouchUntil) { // (after a first touch, he follows it before gathering)
      if (gap > GATHER_R) { this.loseBall(o); return; } // behind him and out of reach
      // He's caught up with it (or it's beside him): bring it back in front and play it on
      const step = Math.min(gap, GATHER_SPEED * dt);
      if (gap > 0.01) { b.x += (fx - b.x) / gap * step; b.y += (fy - b.y) / gap * step; }
      gap -= step;
      const s = Math.hypot(o.vx, o.vy);
      if (gap < 4 && s > 40) {
        // With an opponent right in front of him he keeps it tight instead of knocking it on
        // (further ahead the faster he's going: a second's running)
        const tight = this.players.some(q => q.team !== o.team && dist(q, o) < TIGHT_R + s
          && (q.x - o.x) * o.fx + (q.y - o.y) * o.fy > 0);
        const u = clamp((s - 80) / (SPRINT_SPEED - 80), 0, 1);
        const pace = tight ? s : s + KNOCK + KNOCK_SPRINT * u * u;
        b.vx = o.fx * pace;
        b.vy = o.fy * pace;
      } else {
        b.vx = o.vx;
        b.vy = o.vy;
      }
    }
    const d = dist(o, b);
    o.ballAngle = Math.atan2(b.y - o.y, b.x - o.x);
    o.ballReach = d / FOOT; // the view draws it right where it is
    if (d > B + LOSE_R) { this.loseBall(o); return; }
    if (d - B < 6) return; // tight at his feet: only a tackle gets it off him
    // Knocked on ahead, an opponent who gets there first takes it
    for (const q of this.players) {
      if (q.team === o.team || this.t < q.noTouchUntil) continue;
      const qd = dist(q, b);
      if (qd > TOUCH_R || qd > d) continue;
      if (this.isControlled(o) && !this.isControlled(q) && d - B < NICK_LEAD) continue; // a person's close dribble is safe from the computer
      o.noTouchUntil = this.t + 0.4;
      this.receive(q);
      return;
    }
  }

  // A player's ball sits FOOT units out at his feet when he's standing, and further out the faster
  // he runs, so it stays ahead of his leading foot as his stride lengthens. (ballReach, which the
  // view draws it by, is its distance out in FOOTs.)
  stride(o) {
    const u = Math.min(1, Math.hypot(o.vx, o.vy) / SPRINT_SPEED);
    return 1 + STRIDE_REACH * u * u;
  }

  loseBall(o) {
    const b = this.ball;
    b.owner = null;
    b.lastTouch = o;
    b.passTarget = null;
  }

  updateBall(dt) {
    const b = this.ball, prevX = b.x;
    if (b.owner && this.dribbling(b.owner)) {
      this.dribble(b.owner, dt);
    } else if (b.owner) {
      // In front of him; mid-spin it stays on his path; pulled back, it's tucked in on the far side from the defender
      const o = b.owner;
      let a = o.angle;
      if (this.t < o.spinUntil) a = o.spinBall;
      else if (o.ballPull > 0.01) a += Math.atan2(Math.sin(o.dragAngle - a), Math.cos(o.dragAngle - a)) * o.ballPull;
      const off = FOOT * (1 - 0.35 * o.ballPull) * this.stride(o);
      // Carried along with him, it slides into that spot over a few frames rather than jumping there
      const k = o.role === 'gk' ? 1 : Math.min(1, dt * 18); // (a keeper's is in his hands, drawn by the view)
      const rx = b.x - o.x, ry = b.y - o.y;
      let sx = (Math.cos(a) * off - rx) * k, sy = (Math.sin(a) * off - ry) * k;
      const sl = Math.hypot(sx, sy), most = o.role === 'gk' ? Infinity : SWEEP_SPEED * dt;
      if (sl > most) { sx *= most / sl; sy *= most / sl; }
      b.x = o.x + rx + sx;
      b.y = o.y + ry + sy;
      o.ballAngle = Math.atan2(b.y - o.y, b.x - o.x); // the view draws the ball here too
      o.ballReach = dist(o, b) / FOOT;
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
        const f = Math.pow(b.z > 0 ? 0.85 : ROLL_KEEP, dt);
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
      let reach = !isGk ? TOUCH_R : this.t < p.diveMoveUntil + 0.3 ? TOUCH_R + 22 : TOUCH_R + 8; // arms out in a dive
      // A firm pass rolling past an opponent's feet is hard to cut out unless it's nearly at him
      const opponent = b.lastTouch && b.lastTouch.team !== p.team;
      if (!isGk && opponent && speed > 250 && speed <= 480) reach = INTERCEPT_R;
      if (d < reach && d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    if (best.role === 'gk') {
      const eagleTrick = b.style && b.style !== 'blast' && b.lastTouch && b.lastTouch.team !== best.team;
      if (Math.random() < (eagleTrick ? EAGLE_TRICK_CATCH : speed > 600 ? 0.6 : 0.95)) this.setOwner(best);
      else this.deflect(best);
    } else if (speed > 480 && b.lastTouch && b.lastTouch.team !== best.team) {
      this.deflect(best); // a hard shot gets blocked, not trapped
    } else {
      this.receive(best);
    }
  }

  // An outfield player taking a loose ball or a pass: his first touch takes the pace off it and
  // sets it off the way he wants to go (where a person points the joystick; for the computer,
  // turning toward goal). With the joystick left alone, a person's player kills it dead.
  receive(p) {
    const b = this.ball, c = this.pilots.get(p.team);
    if (p.role === 'gk') { this.setOwner(p); return; }
    const hot = Math.max(0, Math.hypot(b.vx, b.vy) - 250) * HOT_TOUCH;
    this.setOwner(p);
    const person = !!c && c.controlled === p;
    let dir;
    if (person && c.move.mag > 0.2) dir = norm(c.move.x, c.move.y);
    else if (person) { b.vx = p.vx * 0.5; b.vy = p.vy * 0.5; return; }
    else {
      const face = Math.atan2(p.fy, p.fx), goal = Math.atan2(-p.y, oppGoalX(p.team) - p.x);
      const a = rotateTo(face, goal, 1.3); // a first touch can swing it round about 75 degrees
      dir = { x: Math.cos(a), y: Math.sin(a) };
    }
    // Weighted for the run he's about to make (not just how fast he's going this instant)
    const along = Math.max(0, p.vx * dir.x + p.vy * dir.y);
    const going = person ? (c.held.s ? SPRINT_SPEED : RUN_SPEED) * c.move.mag : AI_SPEED;
    const pace = Math.max(along, going * 0.7) + FIRST_TOUCH + (person ? hot / 2 : hot);
    b.vx = dir.x * pace;
    b.vy = dir.y * pace;
    p.firstTouchUntil = this.t + FIRST_TOUCH_TIME;
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
      for (const c of this.pilots.values()) {
        if (c.charging && !this.attacking(c.team)) c.charging = false;
        if (!this.trickShot) this.autoSwitch(c);
      }
      this.updatePlayers(dt);
      this.updateBall(dt);
      this.updateTrickShot();
      if (this.state === 'play') {
        this.slideContacts();
        this.checkPossession();
        this.aiTackles(dt);
      }
    } else if (this.state === 'goal' || this.state === 'over') {
      this.updateBallInNet(dt);
    }
  }
}
