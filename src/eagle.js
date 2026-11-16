// The Eagles' look for the goal celebration: a flat cartoon eagle head (side-on), drawn in code in the same
// style as the dragon (see dragon.js). 256 × 256 grid, looking left, thick black outlines. The lower beak
// hangs on a hinge so it can open (beak is the angle in radians).

const HINGE = [112, 150];
const BEAK_FRONT = [50, 160]; // the tip of the lower beak when it's shut

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

export function paintEagle(g, beak = 0) {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // Ruffled teal neck feathers behind the head (the Eagles' colour)
  shape(g, [[150, 120], [214, 84], [200, 126], [250, 130], [206, 160], [244, 190], [176, 204], [150, 196]], '#1f8a80');
  shape(g, [[170, 140], [214, 126], [200, 150], [226, 166], [180, 176]], '#4cbb17', 5, '#111', true);
  // Inside the beak, if it's open
  if (beak > 0.02) {
    const c = Math.cos(-beak), n = Math.sin(-beak);
    const dx = BEAK_FRONT[0] - HINGE[0], dy = BEAK_FRONT[1] - HINGE[1];
    const front = [HINGE[0] + dx * c - dy * n, HINGE[1] + dx * n + dy * c];
    shape(g, [[52, 156], [HINGE[0] + 4, HINGE[1] - 6], [HINGE[0] + 4, HINGE[1] + 12], front], '#8a1c2b', 6);
    g.fillStyle = '#e8607a'; // tongue
    g.beginPath();
    g.ellipse(86, 160, 18, 5, -beak * 0.5, 0, Math.PI * 2);
    g.fill();
  }
  // Lower beak: swings down on its hinge
  g.save();
  g.translate(HINGE[0], HINGE[1]);
  g.rotate(-beak);
  g.translate(-HINGE[0], -HINGE[1]);
  shape(g, [[50, 160], [110, 154], [124, 176], [100, 190], [60, 178]], '#f6c61c', 7, '#111', true);
  g.restore();
  // White head
  shape(g, [[84, 74], [140, 52], [190, 84], [198, 140], [172, 188], [120, 196], [84, 170], [92, 120]], '#ffffff', 8, '#111', true);
  // A few feather points hanging off the back of the head
  shape(g, [[170, 176], [196, 214], [150, 198]], '#ffffff', 5);
  shape(g, [[196, 150], [234, 176], [190, 176]], '#ffffff', 5);
  // Big hooked upper beak
  shape(g, [[104, 100], [56, 104], [26, 140], [34, 190], [52, 166], [60, 158], [118, 154], [122, 124]], '#f6c61c', 8, '#111', true);
  g.fillStyle = '#111'; // nostril
  g.beginPath();
  g.ellipse(84, 118, 5, 3.5, 0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#111'; // the line of the mouth
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(58, 156);
  g.lineTo(118, 154);
  g.stroke();
  // The fierce eye under a heavy brow
  shape(g, [[112, 82], [168, 76], [172, 108], [122, 112]], '#fff3b0', 6, '#111', true);
  g.fillStyle = '#111';
  g.beginPath();
  g.arc(138, 96, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(135, 92, 3.5, 0, Math.PI * 2);
  g.fill();
  shape(g, [[100, 76], [176, 62], [180, 82], [124, 94]], '#1f8a80', 6); // brow
  g.restore();
}

// Where the front of the beak is on the grid for a given beak angle (the middle of the opening)
export function beakPoint(beak) {
  const c = Math.cos(-beak), n = Math.sin(-beak);
  const dx = BEAK_FRONT[0] - HINGE[0], dy = BEAK_FRONT[1] - HINGE[1];
  const lower = [HINGE[0] + dx * c - dy * n, HINGE[1] + dx * n + dy * c];
  return [(BEAK_FRONT[0] + lower[0]) / 2, (158 + lower[1]) / 2];
}
