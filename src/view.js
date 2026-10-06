// Draws the match in 3D with a TV-style camera up in the stands along the near touchline.
import * as THREE from 'three';
import { F, GOAL_HALF, GOAL_DEPTH, CROSSBAR, HOME, AWAY } from './sim.js';
import { loadCharacters, kitTextures, makeModel, renderFanAtlas, FAN_SIZE, START, PLAY_SPEED, ANIM_SPEED } from './characters.js';

const S = 0.05;                       // simulation units → metres
const M = 60;                         // grass run-off around the pitch, in units
const FIELD_W = (F.right - F.left) * S;
const FIELD_H = (F.bottom - F.top) * S;
const BALL_SIZE = 0.14;

// A mix of skin tones and hairstyles so the players don't all look the same
// skin/hair/style are for the simple fallback figures; skinTint/hairTint recolour the Mixamo model.
const LOOKS = [
  { skin: 0x8d5524, hair: 0x1a1a1a, style: 'short', skinTint: 0x9a6a48, hairTint: 0x2a2020 },
  { skin: 0xe0ac69, hair: 0x3b2314, style: 'curly', skinTint: 0xf0d8c0, hairTint: 0x6b4a2a },
  { skin: 0x5c3a1e, hair: 0x111111, style: 'buzz', skinTint: 0x70482e, hairTint: 0x1a1414 },
  { skin: 0xf1c27d, hair: 0xc9a14a, style: 'short', skinTint: 0xffffff, hairTint: 0xffffff },
  { skin: 0xc68642, hair: 0x2b1d14, style: 'curly', skinTint: 0xc89a78, hairTint: 0x3a2a1a },
  { skin: 0x3d2616, hair: 0x0d0d0d, style: 'bald', skinTint: 0x5a3822, hairTint: 0x151010 },
  { skin: 0xd9a066, hair: 0x4a2c17, style: 'short', skinTint: 0xdcb898, hairTint: 0x5a3a20 },
  { skin: 0x7a4a2a, hair: 0x141414, style: 'curly', skinTint: 0x86583a, hairTint: 0x201818 },
];
const SKINS = LOOKS.map(l => l.skin);
// Each team gets every look once, shifted so the two teams' same numbers don't look alike.
const lookFor = i => LOOKS[(i + 3 * Math.floor(i / LOOKS.length)) % LOOKS.length];
const pick = list => list[(Math.random() * list.length) | 0];

function canvasTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

export class View {
  constructor(canvas, match) {
    this.match = match;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ec5f0);
    this.scene.fog = new THREE.Fog(0x8ec5f0, 90, 190);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 300);
    this.camX = 0;
    this.camZ = 0;
    this.mats = new Map();

    this.buildLights();
    this.buildPitch();
    this.buildGoals();
    this.buildBoards();
    this.buildStands();
    // Simple figures show straight away; the realistic Mixamo players replace them once loaded.
    this.playerViews = match.players.map((p, i) => this.buildPlayer(p, lookFor(i)));
    this.buildBall();
    this.buildMarker();

    this.logoTex = new Map();
    this.loadLogos();
    this.loadCrowd();
    this.ready = this.loadModels();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  // Team logos are optional (a team's logo path in sim.js); without them the kits are plain colours.
  loadLogos() {
    const load = src => !src ? Promise.resolve(null) : new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    Promise.all([load(HOME.logo), load(AWAY.logo)]).then(([home, away]) => {
      this.drawBoards({ home, away });
      for (const [team, img] of [[HOME, home], [AWAY, away]]) {
        if (!img) continue;
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        this.logoTex.set(team, tex);
      }
      this.applyBadges();
    });
  }

  applyBadges() {
    for (const v of this.playerViews) {
      const tex = this.logoTex.get(v.team);
      for (const badge of [v.badge, v.modelBadge]) {
        if (!badge) continue;
        badge.visible = !!tex;
        if (tex && badge.material.map !== tex) {
          badge.material.map = tex;
          badge.material.needsUpdate = true;
        }
      }
    }
  }

  // Swap the simple figures for animated Mixamo players. If the files are missing, keep the simple ones.
  async loadModels() {
    try {
      this.useModels(await loadCharacters());
    } catch (e) {
      console.warn('Could not load the Mixamo players; using simple figures.', e);
    }
  }

  useModels(assets) {
    const kits = new Map();
    const kitFor = kit => {
      if (!kits.has(kit)) kits.set(kit, kitTextures(assets, kit));
      return kits.get(kit);
    };
    this.match.players.forEach((p, i) => {
      const v = this.playerViews[i];
      const kit = p.role === 'gk' ? p.team.gkKit : p.team.kit;
      const model = makeModel(assets, kit, kitFor(kit), lookFor(i));
      const number = model.getObjectByName('number');
      number.material.map = this.numberTexture(p.num, kit);
      v.modelBadge = model.getObjectByName('badge');
      v.modelBadge.visible = false;
      v.body.visible = false;
      v.g.add(model);
      v.model = model;
      v.mixer = new THREE.AnimationMixer(model);
      v.actions = {};
      for (const [key, clip] of Object.entries(assets.clips)) v.actions[key] = v.mixer.clipAction(clip);
      v.busyUntil = 0;
      v.lastKick = p.kickAt;
      v.lastAct = p.gkAct;
      v.hands = ['mixamorigLeftHand', 'mixamorigRightHand'].map(n => model.getObjectByName(n));
      v.foot = model.getObjectByName('mixamorigRightFoot');
      this.fadeTo(v, p.role === 'gk' ? 'gkIdle' : 'idle', 0);
    });
    this.applyBadges();
    this.assets = assets; // kept for bakeFans()
  }

  // Blend smoothly from the current animation into another
  fadeTo(v, key, fade, { once = false, start = 0, speed = 1 } = {}) {
    const next = v.actions[key];
    if (v.current === key && !once) return;
    if (v.currentAction && v.currentAction !== next) v.currentAction.fadeOut(fade);
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.time = start;
    next.timeScale = speed;
    next.setEffectiveWeight(1);
    next.fadeIn(fade).play();
    v.current = key;
    v.currentAction = next;
    v.busyUntil = once ? this.match.t + (next.getClip().duration - start) / speed - fade : 0;
  }

  animateModel(v, p, dt) {
    const m = this.match, t = m.t;
    v.model.rotation.y = Math.PI / 2 - p.angle; // the model faces +z; the game measures angles from +x
    const speed = Math.hypot(p.vx, p.vy) * S;
    const gk = p.role === 'gk';

    if (p.kickAt !== v.lastKick) {
      v.lastKick = p.kickAt;
      if (t - p.kickAt < 0.2 && v.actions[p.kickType]) {
        this.fadeTo(v, p.kickType, 0.08, { once: true, start: START[p.kickType], speed: 1.25 });
      }
    }
    if (gk && p.gkAct !== v.lastAct) {
      v.lastAct = p.gkAct;
      const key = p.gkAct && t - p.gkAct.at < 0.3 && this.keeperClip(p);
      if (key) this.fadeTo(v, key, 0.1, { once: true, start: START[key] || 0, speed: PLAY_SPEED[key] || 1 });
    }

    if (t >= v.busyUntil) {
      if (gk && m.ball.owner === p) {
        this.fadeTo(v, p.goalKick ? 'gkIdle' : 'gkHold', 0.3); // a goal kick's ball is on the grass
      } else if (speed > 0.6) {
        // Split the movement into forwards and sideways (+ = towards his left)
        const fwd = (p.vx * Math.cos(p.angle) + p.vy * Math.sin(p.angle)) * S;
        const side = (p.vx * Math.sin(p.angle) - p.vy * Math.cos(p.angle)) * S;
        const watching = gk || p.faceBall; // facing the ball, not where they're going
        let gait;
        if (t < p.trickUntil) {
          gait = p.trickSide === 'L' ? 'cutL' : 'cutR';
        } else if (watching && Math.abs(side) > Math.abs(fwd)) {
          gait = gk && speed < 4 ? (side > 0 ? 'gkStepL' : 'gkStepR') : (side > 0 ? 'strafeL' : 'strafeR');
        } else if (watching && fwd < 0) {
          gait = 'backpedal';
        } else {
          // Pick the running style closest to the player's speed, then fine-tune the leg speed to match
          gait = p.sprinting ? 'sprint' : speed > 4 ? 'run' : 'jog';
        }
        this.fadeTo(v, gait, 0.2);
        v.actions[gait].timeScale = THREE.MathUtils.clamp(speed / ANIM_SPEED[gait], 0.6, 1.9);
      } else if (gk) {
        // With the ball far up the other end, he waves his defenders into place
        const far = Math.abs(m.ball.x - (p.team.dir === 1 ? F.left : F.right)) > 1000;
        this.fadeTo(v, far && m.state === 'play' ? 'gkDirect' : 'gkIdle', 0.4);
      } else {
        this.fadeTo(v, m.state === 'play' ? 'idle' : 'stand', 0.3);
      }
    }
    if (m.state !== 'question') v.mixer.update(dt); // freeze-frame while a question is up
  }

  // The animation for the keeper's latest move
  keeperClip(p) {
    const a = p.gkAct;
    // Is the ball off to his left? (His left, in pitch terms, is (sin angle, -cos angle).)
    const left = -a.side * Math.cos(p.angle) > 0;
    switch (a.type) {
      case 'dive': return left ? 'gkDiveL' : 'gkDiveR';
      case 'block': return left ? pick(['gkBlockL', 'gkBlockL2']) : 'gkBlockR';
      case 'catch': return 'gkCatch';
      case 'catchChest': return 'gkCatchChest';
      case 'catchLeap': return 'gkCatchLeap';
      case 'catchHigh': return 'gkCatchHigh';
      case 'scoop': return 'gkScoop';
      case 'miss': return 'gkMiss';
      case 'throw': return 'gkThrow';
      case 'dropKick': return 'gkDropKick';
      case 'roll': return 'gkRoll';
      case 'place': return 'gkPlace';
      default: return null;
    }
  }

  // Where the ball sits while a keeper has it: in his hands, dropping onto his foot for a
  // drop kick, or on the grass for a goal kick. Null for the simple figures.
  keeperBall(o) {
    const v = this.playerViews[this.match.players.indexOf(o)];
    if (!v.hands) return null;
    const t = this.match.t, a = o.gkAct;
    const ground = () => new THREE.Vector3(o.x * S + o.fx * 0.55, BALL_SIZE, o.y * S + o.fy * 0.55);
    if (o.goalKick && !(a && a.type === 'place' && t - a.at < 0.65)) return ground();
    v.g.updateMatrixWorld(true);
    const hands = v.hands[0].getWorldPosition(new THREE.Vector3())
      .add(v.hands[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    hands.x += o.fx * 0.06;
    hands.z += o.fy * 0.06;
    if (a && a.type === 'dropKick' && t - a.at > 0.65) {
      const s = Math.min(1, (t - a.at - 0.65) / 0.27); // falls from his hands onto his foot
      const foot = v.foot.getWorldPosition(new THREE.Vector3());
      foot.y += BALL_SIZE;
      return hands.lerp(foot, s * s);
    }
    return hands;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // Keep roughly the same width of pitch in view whatever the screen shape.
    const hfov = THREE.MathUtils.degToRad(58);
    const vfov = 2 * Math.atan(Math.tan(hfov / 2) / this.camera.aspect);
    this.camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vfov), 28, 55);
    this.camera.updateProjectionMatrix();
  }

  // ---------- Scenery ----------
  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x3b6b34, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(-20, 40, 25);
    this.scene.add(sun);
  }

  buildPitch() {
    const K = 1.2; // canvas pixels per unit
    const w = (F.right - F.left + 2 * M) * K, h = (F.bottom - F.top + 2 * M) * K;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const px = x => (x - F.left + M) * K, py = y => (y - F.top + M) * K;

    g.fillStyle = '#35803a';
    g.fillRect(0, 0, w, h);
    const stripes = 18, sw = (F.right - F.left) / stripes;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#3f9443' : '#48a24c';
      g.fillRect(px(F.left + i * sw), py(F.top), sw * K + 1, (F.bottom - F.top) * K);
    }

    g.strokeStyle = 'rgba(255,255,255,0.92)';
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.lineWidth = 4;
    g.strokeRect(px(F.left), py(F.top), (F.right - F.left) * K, (F.bottom - F.top) * K);
    g.beginPath(); g.moveTo(px(0), py(F.top)); g.lineTo(px(0), py(F.bottom)); g.stroke();
    g.beginPath(); g.arc(px(0), py(0), 90 * K, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(px(0), py(0), 5, 0, Math.PI * 2); g.fill();
    for (const side of [-1, 1]) {
      const edge = side < 0 ? F.left : F.right;
      const box = (depth, half) => {
        const x0 = side < 0 ? edge : edge - depth;
        g.strokeRect(px(x0), py(-half), depth * K, half * 2 * K);
      };
      box(150, 170);
      box(55, 100);
      g.beginPath(); g.arc(px(edge - side * 110), py(0), 5, 0, Math.PI * 2); g.fill();
    }

    const tex = canvasTexture(c);
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(w / K * S, h / K * S),
      new THREE.MeshLambertMaterial({ map: tex }),
    );
    pitch.rotation.x = -Math.PI / 2;
    this.scene.add(pitch);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshLambertMaterial({ color: 0x2d6a31 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);
  }

  buildGoals() {
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const r = 0.07, h = CROSSBAR * S, half = GOAL_HALF * S, depth = GOAL_DEPTH * S;

    const nc = document.createElement('canvas');
    nc.width = nc.height = 64;
    const ng = nc.getContext('2d');
    ng.strokeStyle = 'rgba(255,255,255,0.8)';
    ng.lineWidth = 3;
    ng.strokeRect(0, 0, 64, 64);
    const netMat = size => new THREE.MeshBasicMaterial({
      map: canvasTexture(nc, size[0] / 0.25, size[1] / 0.25),
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });

    for (const side of [-1, 1]) {
      const gx = side * FIELD_W / 2;
      const goal = new THREE.Group();
      for (const z of [-half, half]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), white);
        post.position.set(gx, h / 2, z);
        goal.add(post);
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, half * 2, 10), white);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(gx, h, 0);
      goal.add(bar);

      const back = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, h), netMat([half * 2, h]));
      back.rotation.y = Math.PI / 2;
      back.position.set(gx + side * depth, h / 2, 0);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(depth, half * 2), netMat([depth, half * 2]));
      top.rotation.x = -Math.PI / 2;
      top.position.set(gx + side * depth / 2, h, 0);
      goal.add(back, top);
      for (const z of [-half, half]) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(depth, h), netMat([depth, h]));
        s.position.set(gx + side * depth / 2, h / 2, z);
        goal.add(s);
      }
      this.scene.add(goal);
    }
  }

  mat(color) {
    if (!this.mats.has(color)) this.mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
    return this.mats.get(color);
  }

  // Ad board panels; each team's logo goes on its panel once loaded
  drawBoards(logos = {}) {
    const g = this.boardCanvas.getContext('2d');
    const panels = [
      ['#6cc4ee', '#0b2a4a', 'GO SHARKS!', logos.home],
      ['#1f8a80', '#ffffff', 'GO BIRDS!', logos.away],
      ['#111111', '#ffffff', "6TH SHARK'S SOCCER"],
      ['#0b2a4a', '#6cc4ee', 'FIRST TO 5'],
    ];
    panels.forEach(([bg, fg, text, logo], i) => {
      g.fillStyle = bg;
      g.fillRect(i * 256, 0, 256, 64);
      let centre = i * 256 + 128;
      if (logo) {
        const h = 52, w = h * logo.width / logo.height;
        g.drawImage(logo, i * 256 + 8, 6, w, h);
        centre += (w + 8) / 2;
      }
      g.fillStyle = fg;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const room = 240 - (centre - (i * 256 + 128)) * 2;
      let size = 28;
      do { g.font = `bold ${size}px Arial, sans-serif`; size--; } while (g.measureText(text).width > room && size > 12);
      g.fillText(text, centre, 34);
    });
    for (const tex of this.boardTextures) tex.needsUpdate = true;
  }

  buildBoards() {
    this.boardCanvas = document.createElement('canvas');
    this.boardCanvas.width = 1024;
    this.boardCanvas.height = 64;
    this.boardTextures = [];
    this.drawBoards();
    const board = (length, x, z, rotY) => {
      const tex = canvasTexture(this.boardCanvas, length / 24, 1);
      this.boardTextures.push(tex);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.9, 0.12), mat);
      mesh.position.set(x, 0.45, z);
      mesh.rotation.y = rotY;
      this.scene.add(mesh);
    };
    const edgeZ = (F.top - 14) * S;
    const edgeX = (F.right + GOAL_DEPTH + 16) * S;
    board(FIELD_W + 6, 0, edgeZ, 0);
    board(FIELD_H + 3, -edgeX, 0.7, Math.PI / 2);
    board(FIELD_H + 3, edgeX, 0.7, -Math.PI / 2);
  }

  // Concrete terraces packed with fans of both teams, mixed together
  buildStands() {
    const concrete = new THREE.MeshLambertMaterial({ color: 0x80858d });
    const wall = new THREE.MeshLambertMaterial({ color: 0x2a2f38 });
    const steps = 10, rise = 0.8, run = 1.6;
    const seats = []; // { x, y, z, rotY }

    // Far side
    const farZ = (F.top - 14) * S - 2;
    const farLen = FIELD_W + 30;
    for (let i = 0; i < steps; i++) {
      const h = rise * (i + 1);
      const row = new THREE.Mesh(new THREE.BoxGeometry(farLen, h, run), concrete);
      row.position.set(0, h / 2, farZ - i * run);
      this.scene.add(row);
      for (let x = -farLen / 2 + 0.5; x < farLen / 2; x += 0.62) seats.push({ x, y: h, z: farZ - i * run, rotY: 0 });
    }
    const farWall = new THREE.Mesh(new THREE.BoxGeometry(farLen, steps * rise + 4, 1), wall);
    farWall.position.set(0, (steps * rise + 4) / 2, farZ - steps * run);
    this.scene.add(farWall);

    // Behind each goal
    const endX = (F.right + GOAL_DEPTH + 16) * S + 2;
    const endLen = FIELD_H + 20;
    for (const side of [-1, 1]) {
      for (let i = 0; i < steps; i++) {
        const h = rise * (i + 1);
        const x = side * (endX + i * run);
        const row = new THREE.Mesh(new THREE.BoxGeometry(run, h, endLen), concrete);
        row.position.set(x, h / 2, -4);
        this.scene.add(row);
        for (let z = -4 - endLen / 2 + 0.5; z < -4 + endLen / 2; z += 0.62) seats.push({ x, y: h, z, rotY: -side * Math.PI / 2 });
      }
      const endWall = new THREE.Mesh(new THREE.BoxGeometry(1, steps * rise + 4, endLen), wall);
      endWall.position.set(side * (endX + steps * run), (steps * rise + 4) / 2, -4);
      this.scene.add(endWall);
    }

    // Fans: simple block people at first (one instanced mesh for bodies, one for heads);
    // upgradeCrowd() swaps in photos of real people once the player model has loaded.
    const fans = seats.filter(() => Math.random() < 0.9); // a few empty seats
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.55, 0.3), new THREE.MeshLambertMaterial(), fans.length);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshLambertMaterial(), fans.length);
    const colour = new THREE.Color();
    fans.forEach((f, i) => {
      f.team = Math.random() < 0.5 ? HOME : AWAY;
      f.shirt = pick(f.team.fans);
      f.x += (Math.random() - 0.5) * 0.15;
      bodies.setColorAt(i, colour.setHex(f.shirt));
      heads.setColorAt(i, colour.setHex(pick(SKINS)));
    });
    this.crowd = { kind: 'blocks', fans, bodies, heads, dummy: new THREE.Object3D() };
    this.placeFans();
    this.scene.add(bodies, heads);
  }

  // The fans are photos of the real character in fan shirts, saved as one still image
  // (assets/fans.png, with assets/fans.json listing each photo's shirt colour). Taking the photos
  // on the device turned the players black on some phones, so they're taken once on a computer
  // with bakeFans() below and simply loaded here. Until they load, the block fans stay.
  async loadCrowd() {
    try {
      const [info, texture] = await Promise.all([
        fetch('assets/fans.json').then(r => (r.ok ? r.json() : Promise.reject(new Error('no fans.json')))),
        new THREE.TextureLoader().loadAsync('assets/fans.png'),
      ]);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.useCrowdPhotos(texture, info);
    } catch (e) {
      console.warn('No fan photos; keeping the simple fans.', e);
    }
  }

  // Photograph the fan outfits and save them into assets/ (run from the browser console on the Mac
  // running serve.py: game.view.bakeFans()). Only needed again if the fan colours change.
  async bakeFans() {
    const shirts = [...new Set([...HOME.fans, ...AWAY.fans])];
    const poses = [['stand', 0.2], ['stand', 1.3], ['idle', 2.5], ['idle', 7.0]];
    const variants = [];
    shirts.forEach(shirt => {
      for (let k = 0; k < 3; k++) {
        const n = variants.length;
        const [pose, poseTime] = poses[n % poses.length];
        variants.push({ shirt, look: LOOKS[(n * 3) % LOOKS.length], pose, poseTime });
      }
    });
    const atlas = renderFanAtlas(this.renderer, this.assets, variants);
    // The photos come back bottom row first; flip them into a normal top-down image
    const { width: W, height: H, data } = atlas.texture.image;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const img = canvas.getContext('2d').createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(data.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    canvas.getContext('2d').putImageData(img, 0, 0);
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const info = { cols: atlas.cols, rows: atlas.rows, shirts: variants.map(v => v.shirt) };
    await fetch('assets/fans.png', { method: 'PUT', body: png });
    await fetch('assets/fans.json', { method: 'PUT', body: JSON.stringify(info) });
    return { width: W, height: H, photos: variants.length, bytes: png.size };
  }

  // Replace the block fans with the photos
  useCrowdPhotos(texture, { cols, rows, shirts }) {
    texture.magFilter = texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const { fans } = this.crowd;
    for (const f of fans) if (!shirts.includes(f.shirt)) f.shirt = pick(shirts); // colours changed since the photos were taken
    const plane = new THREE.PlaneGeometry(FAN_SIZE.w, FAN_SIZE.h).translate(0, FAN_SIZE.h / 2, 0);
    const byShirt = new Map();
    const meshes = shirts.map((shirt, i) => {
      const tex = texture.clone();
      tex.repeat.set(1 / cols, 1 / rows);
      tex.offset.set((i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows);
      tex.needsUpdate = true;
      const count = fans.filter(f => f.shirt === shirt).length;
      const mesh = new THREE.InstancedMesh(plane, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), count);
      mesh.count = 0;
      mesh.frustumCulled = false;
      if (!byShirt.has(shirt)) byShirt.set(shirt, []);
      byShirt.get(shirt).push(mesh);
      return mesh;
    });
    for (const f of fans) {
      f.mesh = pick(byShirt.get(f.shirt));
      f.index = f.mesh.count++;
    }

    this.scene.remove(this.crowd.bodies, this.crowd.heads);
    this.crowd.bodies.dispose();
    this.crowd.heads.dispose();
    this.crowd = { kind: 'people', fans, meshes, dummy: this.crowd.dummy };
    this.placeFans();
    this.scene.add(...meshes);
  }

  // Put every fan in their seat. The crowd is a still backdrop, like FC Mobile's, so this runs once.
  placeFans() {
    const { kind, fans, dummy } = this.crowd;
    fans.forEach((f, i) => {
      dummy.rotation.set(0, f.rotY, 0);
      if (kind === 'people') {
        dummy.position.set(f.x, f.y + 0.35, f.z); // waist-up photo, sitting on the step
        dummy.updateMatrix();
        f.mesh.setMatrixAt(f.index, dummy.matrix);
        return;
      }
      dummy.position.set(f.x, f.y + 0.4, f.z);
      dummy.updateMatrix();
      this.crowd.bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.y += 0.42;
      dummy.updateMatrix();
      this.crowd.heads.setMatrixAt(i, dummy.matrix);
    });
    if (kind === 'people') {
      for (const mesh of this.crowd.meshes) mesh.instanceMatrix.needsUpdate = true;
    } else {
      this.crowd.bodies.instanceMatrix.needsUpdate = true;
      this.crowd.heads.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------- Players ----------
  // Shirt number printed on the back
  numberTexture(num, kit) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.font = 'bold 96px Arial Black, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (kit.outline) {
      g.lineWidth = 10;
      g.strokeStyle = kit.outline;
      g.strokeText(String(num), 64, 70);
    }
    g.fillStyle = kit.number;
    g.fillText(String(num), 64, 70);
    return canvasTexture(c);
  }

  buildPlayer(p, look) {
    const kit = p.role === 'gk' ? p.team.gkKit : p.team.kit;
    const shirt = this.mat(kit.shirt), trim = this.mat(kit.trim), skin = this.mat(look.skin);
    const shorts = this.mat(kit.shorts), socks = this.mat(kit.socks), boots = this.mat(kit.boots);
    const hands = kit.gloves ? this.mat(kit.gloves) : skin;

    const g = new THREE.Group();
    const body = new THREE.Group(); // everything except the shadow, so it can bob
    g.add(body);

    // Torso, collar, neck, head. The model faces +x; z is across the shoulders.
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.34, 4, 12), shirt);
    torso.position.y = 1.2;
    torso.scale.set(0.85, 1, 1.35);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 6, 16), trim);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.47;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 8), skin);
    neck.position.y = 1.51;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), skin);
    head.position.y = 1.65;
    head.scale.set(1.05, 1.1, 0.95);
    const shortsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.26, 12), shorts);
    shortsMesh.position.y = 0.87;
    shortsMesh.scale.z = 1.3;
    const number = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.28),
      new THREE.MeshStandardMaterial({ map: this.numberTexture(p.num, kit), transparent: true, alphaTest: 0.3, roughness: 0.8 }),
    );
    number.rotation.y = -Math.PI / 2;
    number.position.set(-0.176, 1.24, 0);
    // Team badge on the left chest; shown once the logo file loads
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.12),
      new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.3, roughness: 0.8 }),
    );
    badge.rotation.y = Math.PI / 2;
    badge.position.set(0.176, 1.32, 0.1);
    badge.visible = false;
    body.add(torso, collar, neck, head, shortsMesh, number, badge);

    if (look.style !== 'bald') {
      const hairMat = new THREE.MeshStandardMaterial({ color: look.hair, roughness: 1, flatShading: look.style === 'curly' });
      const r = look.style === 'curly' ? 0.15 : look.style === 'buzz' ? 0.134 : 0.14;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
      hair.position.set(-0.01, 1.67, 0);
      hair.scale.set(1.05, look.style === 'curly' ? 1.15 : 1, 0.98);
      body.add(hair);
    }

    // Legs (thigh, sock, boot) and arms (sleeve, forearm, hand) on pivots so they can swing
    const legs = [], arms = [];
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0, 0.8, side * 0.11);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.24, 4, 8), skin);
      thigh.position.y = -0.2;
      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.062, 0.36, 8), socks);
      sock.position.y = -0.5;
      const sockTop = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.04, 8), trim);
      sockTop.position.y = -0.33;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 0.11), boots);
      boot.position.set(0.05, -0.73, 0);
      hip.add(thigh, sock, sockTop, boot);
      legs.push(hip);

      const shoulder = new THREE.Group();
      shoulder.position.set(0, 1.42, side * 0.28);
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.12, 4, 8), shirt);
      sleeve.position.y = -0.09;
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.035, 8), trim);
      cuff.position.y = -0.19;
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.24, 4, 8), skin);
      forearm.position.y = -0.34;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), hands);
      hand.position.y = -0.52;
      shoulder.add(sleeve, cuff, forearm, hand);
      arms.push(shoulder);
    }
    body.add(...legs, ...arms);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    g.add(shadow);

    this.scene.add(g);
    return { g, body, legs, arms, badge, team: p.team, phase: Math.random() * 6 };
  }

  buildBall() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#1a1a1a';
    for (const [x, y] of [[32, 64], [96, 30], [96, 98], [160, 64], [224, 30], [224, 98], [0, 0], [128, 0], [64, 128], [192, 128]]) {
      g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill();
    }
    this.ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_SIZE, 24, 16),
      new THREE.MeshStandardMaterial({ map: canvasTexture(c), roughness: 0.5 }),
    );
    this.scene.add(this.ballMesh);
    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(BALL_SIZE * 1.1, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }),
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.015;
    this.scene.add(this.ballShadow);
    this.lastBall = { x: 0, y: 0 };
  }

  // Yellow ring + arrow over the player you control
  buildMarker() {
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffeb3b, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 32), yellow);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.03;
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 14), yellow);
    this.arrow.rotation.x = Math.PI;
    this.scene.add(this.ring, this.arrow);
  }

  // ---------- Per frame ----------
  update(dt) {
    const m = this.match, t = m.t;

    m.players.forEach((p, i) => {
      const v = this.playerViews[i];
      v.g.position.set(p.x * S, 0, p.y * S);
      if (v.model) { this.animateModel(v, p, dt); return; }
      v.body.rotation.y = -p.angle;
      const speed = Math.hypot(p.vx, p.vy) * S; // metres per second
      v.phase += dt * (2 + speed * 1.6);
      const stride = Math.min(1, speed / 7);
      const swing = Math.sin(v.phase) * 0.75 * stride;
      v.legs[0].rotation.z = swing;
      v.legs[1].rotation.z = -swing;
      v.arms[0].rotation.z = -swing * 0.8;
      v.arms[1].rotation.z = swing * 0.8;
      v.arms[0].rotation.x = v.arms[1].rotation.x = 0;
      v.body.position.y = Math.abs(Math.sin(v.phase)) * 0.06 * stride;

      const k = t - p.kickAt;
      if (k >= 0 && k < 0.3) v.legs[1].rotation.z = 1.3 * Math.sin(k / 0.3 * Math.PI);

      // Keepers hold the ball up and spread their arms when it's close
      if (p.role === 'gk' && (m.ball.owner === p || Math.hypot(m.ball.x - p.x, m.ball.y - p.y) < 90)) {
        v.arms[0].rotation.x = 0.6;
        v.arms[1].rotation.x = -0.6;
        v.arms[0].rotation.z = v.arms[1].rotation.z = 1.2;
      }
    });

    // Ball
    const b = m.ball;
    let bx = b.x * S, bz = b.y * S, by = BALL_SIZE + b.z * S;
    const held = b.owner && b.owner.role === 'gk' && this.keeperBall(b.owner);
    if (held) {
      bx = held.x; by = held.y; bz = held.z;
    } else if (b.owner && b.owner.role === 'gk') {
      const o = b.owner;
      bx = o.x * S + o.fx * 0.35;
      bz = o.y * S + o.fy * 0.35;
      by = 1.1;
    } else if (b.owner && this.playerViews[0].model) {
      // Realistic players dribble with the ball close to their feet
      const o = b.owner;
      bx = o.x * S + o.fx * 0.55;
      bz = o.y * S + o.fy * 0.55;
    }
    const dx = bx - this.lastBall.x, dz = bz - this.lastBall.y;
    const moved = Math.hypot(dx, dz);
    if (moved > 1e-4 && moved < 3) {
      const axis = new THREE.Vector3(dz, 0, -dx).normalize();
      this.ballMesh.rotateOnWorldAxis(axis, moved / BALL_SIZE);
    }
    this.lastBall.x = bx; this.lastBall.y = bz;
    this.ballMesh.position.set(bx, by, bz);
    this.ballShadow.position.set(bx, 0.015, bz);
    const lift = Math.min(1, (by - BALL_SIZE) / 3);
    this.ballShadow.scale.setScalar(1 + lift);
    this.ballShadow.material.opacity = 0.3 * (1 - lift * 0.6);

    // Control marker
    const c = m.keeperAim || m.controlled; // while Gabe's keeper has the ball: who it's going to
    const show = !!c && m.state !== 'menu';
    this.ring.visible = this.arrow.visible = show;
    if (show) {
      this.ring.position.set(c.x * S, 0.03, c.y * S);
      this.arrow.position.set(c.x * S, 2.25 + Math.sin(t * 5) * 0.08, c.y * S);
    }

    // Camera: high up in the near stand like FC Mobile's broadcast view, following the ball
    const follow = Math.min(1, dt * 2);
    const tx = THREE.MathUtils.clamp(bx, -FIELD_W / 2 + 18, FIELD_W / 2 - 18);
    const tz = THREE.MathUtils.clamp(bz * 0.4, -FIELD_H / 2 + 14, FIELD_H / 2 - 12);
    this.camX += (tx - this.camX) * follow;
    this.camZ += (tz - this.camZ) * follow;
    this.camera.position.set(this.camX, 26, this.camZ + 34);
    this.camera.lookAt(this.camX, 0, this.camZ - 2);

    this.renderer.render(this.scene, this.camera);
  }

  // Screen position (CSS pixels) of a point above a player, for the power bar
  screenPos(p, height) {
    const v = new THREE.Vector3(p.x * S, height, p.y * S).project(this.camera);
    return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight };
  }
}
