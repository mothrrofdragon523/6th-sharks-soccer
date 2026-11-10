// The Dragons' look: a cartoon dragon head that fits over a player's head, and a flat dragon-head
// logo for the shirt badge and ad boards. Both are drawn in code, so there are no extra files to load.
import * as THREE from 'three';

const GREEN = 0x5fae1f, LIME = 0xb5d62a, DARK_GREEN = 0x3f7d17, RED = 0xd32f2f, HORN = 0xf3ecc0, EYE = 0xff9800;

// Shared by every dragon head (geometry and materials are made once)
let shared = null;
function parts() {
  if (shared) return shared;
  const mat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
  shared = {
    green: mat(GREEN), lime: mat(LIME), dark: mat(DARK_GREEN), red: mat(RED), horn: mat(HORN),
    eye: mat(EYE), black: mat(0x111111),
    sphere: new THREE.SphereGeometry(1, 12, 9),
    cone: new THREE.ConeGeometry(1, 1, 6),
    box: new THREE.BoxGeometry(1, 1, 1),
  };
  return shared;
}

// A dragon head about one head wide, facing +z with +y up (the same way the player's face points).
// Everything is sized as a fraction of that, so the caller just scales it to fit the character's head.
export function dragonHead() {
  const p = parts();
  const head = new THREE.Group();
  const add = (geo, mat, pos, scale, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    if (rot) m.rotation.set(...rot);
    head.add(m);
    return m;
  };
  const both = (fn) => { fn(1); fn(-1); };

  // Skull and a long snout out in front, with a lighter jaw underneath
  add(p.sphere, p.green, [0, 0.04, -0.02], [0.56, 0.52, 0.6]);
  add(p.sphere, p.green, [0, -0.02, 0.5], [0.34, 0.27, 0.5]);
  add(p.sphere, p.lime, [0, -0.17, 0.46], [0.3, 0.14, 0.5]);
  // The red lip line along the jaw and the red ridge over the nose
  add(p.box, p.red, [0, -0.06, 0.52], [0.62, 0.05, 0.62]);
  add(p.box, p.red, [0, 0.19, 0.38], [0.2, 0.05, 0.55], [-0.2, 0, 0]);
  // Nostrils, and a couple of teeth
  both(s => add(p.sphere, p.black, [0.09 * s, 0.07, 0.95], [0.045, 0.045, 0.045]));
  both(s => add(p.cone, p.horn, [0.14 * s, -0.12, 0.83], [0.04, 0.1, 0.04], [Math.PI, 0, 0]));

  // Angry orange eyes under a red brow
  both(s => {
    add(p.sphere, p.eye, [0.3 * s, 0.17, 0.3], [0.1, 0.1, 0.1]);
    add(p.sphere, p.black, [0.37 * s, 0.17, 0.33], [0.04, 0.08, 0.04]);
    add(p.box, p.red, [0.29 * s, 0.3, 0.3], [0.2, 0.06, 0.24], [0, 0, -0.45 * s]);
  });

  // Two long cream horns sweeping back, a spiky crest down the back and cheek spikes
  both(s => {
    add(p.cone, p.horn, [0.24 * s, 0.6, -0.12], [0.15, 1.05, 0.15], [-0.95, 0, -0.22 * s]);
    add(p.cone, p.green, [0.55 * s, -0.06, -0.12], [0.12, 0.38, 0.1], [0, 0, -1.9 * s]);
  });
  for (let i = 0; i < 3; i++) {
    add(p.cone, p.dark, [0, 0.45 - i * 0.12, -0.5 - i * 0.12], [0.1, 0.34, 0.1], [-2.2 + i * 0.25, 0, 0]);
  }
  return head;
}

// Fit a dragon head over the character's head bone. The player's own hair and face are hidden, so
// the dragon is the head. `size` is the head's width in the model's own units.
export function putDragonOnPlayer(model, size) {
  const bone = model.getObjectByName('mixamorigHead');
  if (!bone) return;
  model.traverse(o => {
    if (o.isMesh && (o.name === 'Hair' || o.name === 'Eyes' || o.name === 'Eyelashes' || o.name === 'Head')) o.visible = false;
  });
  const dragon = dragonHead();
  dragon.name = 'dragonHead';
  dragon.scale.setScalar(size * 1.3);
  dragon.position.set(0, size * 0.58, size * 0.1);
  bone.add(dragon);
}

// ---------- The flat, cartoon dragon head (side-on) ----------
// Drawn on a 256 × 256 grid, looking left, with thick black outlines. The lower jaw hangs on a hinge
// so it can open (jaw is the angle in radians). Used for the shirt logo and the goal celebration.
const HINGE = [185, 176];
const MOUTH_FRONT = [28, 176]; // the front of the lower jaw when it's shut

// round: smooth the corners (the curve runs from the middle of one side to the middle of the next)
function shape(g, pts, fill, width = 8, stroke = '#111', round = false) {
  g.beginPath();
  if (round) {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const first = mid(pts[n - 1], pts[0]);
    g.moveTo(first[0], first[1]);
    for (let i = 0; i < n; i++) {
      const next = mid(pts[i], pts[(i + 1) % n]);
      g.quadraticCurveTo(pts[i][0], pts[i][1], next[0], next[1]);
    }
  } else {
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  }
  g.closePath();
  g.lineWidth = width;
  g.strokeStyle = stroke;
  g.stroke();
  g.fillStyle = fill;
  g.fill();
}

export function paintDragon(g, jaw = 0) {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // Horns and the spikes of the mane, behind everything
  shape(g, [[140, 96], [120, 30], [160, 10], [172, 60], [190, 96]], '#f3ecc0');
  shape(g, [[170, 100], [200, 52], [232, 40], [220, 80], [236, 120]], '#f3ecc0');
  shape(g, [[190, 130], [244, 118], [226, 160], [244, 200], [196, 196]], '#3f7d17');
  // Inside the mouth, if it's open
  if (jaw > 0.02) {
    const c = Math.cos(-jaw), n = Math.sin(-jaw);
    const dx = MOUTH_FRONT[0] - HINGE[0], dy = MOUTH_FRONT[1] - HINGE[1];
    const front = [HINGE[0] + dx * c - dy * n, HINGE[1] + dx * n + dy * c];
    shape(g, [[26, 174], [HINGE[0] + 6, HINGE[1] - 8], [HINGE[0] + 6, HINGE[1] + 14], front], '#7a0e0e', 7);
  }
  // Lower jaw: swings down on its hinge
  g.save();
  g.translate(HINGE[0], HINGE[1]);
  g.rotate(-jaw);
  g.translate(-HINGE[0], -HINGE[1]);
  shape(g, [[28, 176], [100, 180], [190, 174], [210, 200], [150, 228], [80, 220], [36, 198]], '#b5d62a', 8, '#111', true);
  shape(g, [[26, 174], [100, 178], [190, 172], [192, 184], [100, 190], [28, 188]], '#d32f2f', 6, '#111', true);
  g.restore();
  // Head, snout and the red ridge
  shape(g, [[70, 112], [150, 88], [215, 108], [230, 172], [190, 184], [100, 170], [38, 166], [24, 148], [40, 126]], '#5fae1f', 8, '#111', true);
  shape(g, [[56, 128], [130, 104], [152, 120], [104, 134], [64, 146]], '#d32f2f', 6, '#111', true);
  // Teeth and a nostril
  for (const x of [52, 74, 96]) shape(g, [[x - 7, 168], [x + 7, 168], [x, 186]], '#fff8e1', 4);
  g.fillStyle = '#111';
  g.beginPath();
  g.ellipse(44, 140, 5, 3.5, -0.4, 0, Math.PI * 2);
  g.fill();
  // The angry eye
  shape(g, [[132, 128], [184, 118], [194, 142], [140, 150]], '#ffffff', 6, '#111', true);
  g.fillStyle = '#ff9800';
  g.beginPath();
  g.arc(164, 136, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111';
  g.fillRect(160, 123, 7, 26);
  shape(g, [[126, 116], [190, 104], [196, 124], [150, 128]], '#d32f2f', 6); // brow
  g.restore();
}

// Where the front of the mouth is on the grid for a given jaw angle (the middle of the opening), for fire to come out of
export function mouthPoint(jaw) {
  const c = Math.cos(-jaw), n = Math.sin(-jaw);
  const dx = MOUTH_FRONT[0] - HINGE[0], dy = MOUTH_FRONT[1] - HINGE[1];
  const lower = [HINGE[0] + dx * c - dy * n, HINGE[1] + dx * n + dy * c];
  return [(MOUTH_FRONT[0] + lower[0]) / 2, (176 + lower[1]) / 2];
}

// The logo, as a data URL for the badge and ad boards
let logoURL = null;
export function dragonLogoURL() {
  if (logoURL) return logoURL;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  paintDragon(c.getContext('2d'), 0);
  logoURL = c.toDataURL('image/png');
  return logoURL;
}
