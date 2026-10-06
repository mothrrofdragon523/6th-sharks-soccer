// Touch controls (floating joystick + buttons) and keyboard controls.
// Screen up = away from the camera, so joystick directions map straight onto the pitch.

const KEY_BUTTONS = { KeyJ: 'a', KeyK: 'b', Space: 'b', ShiftLeft: 's', ShiftRight: 's', KeyL: 't' };

export class Input {
  constructor(match) {
    this.match = match;
    this.joy = { id: null, bx: 0, by: 0, x: 0, y: 0 };
    this.btnPointers = new Map();
    this.keys = new Set();
    this.base = document.getElementById('joy-base');
    this.knob = document.getElementById('joy-knob');
    this.buttons = {
      a: document.getElementById('btn-a'),
      b: document.getElementById('btn-b'),
      s: document.getElementById('btn-s'),
      t: document.getElementById('btn-t'),
    };
    this.setTouch(window.matchMedia('(pointer: coarse)').matches);

    window.addEventListener('pointerdown', e => this.onDown(e), { passive: false });
    window.addEventListener('pointermove', e => this.onMove(e));
    window.addEventListener('pointerup', e => this.onUp(e));
    window.addEventListener('pointercancel', e => this.onUp(e));
    window.addEventListener('keydown', e => this.onKeyDown(e));
    window.addEventListener('keyup', e => this.onKeyUp(e));
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });

    // iPad Safari ignores the page's "no zoom" setting, so a quick double tap on a button
    // (like TACKLE) zooms the page in. Block the browser's own touch handling over the game;
    // the menu, questions, homework answers and Full screen button keep theirs so their taps
    // (and the answers' scrolling) still register.
    const blockZoom = e => { if (!e.target.closest('#menu, #quiz, #result, #review, #fullscreen')) e.preventDefault(); };
    for (const type of ['touchstart', 'touchmove', 'touchend', 'dblclick']) {
      document.addEventListener(type, blockZoom, { passive: false });
    }
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) { // iPad pinch zoom
      document.addEventListener(type, e => e.preventDefault(), { passive: false });
    }
  }

  setTouch(on) {
    this.touch = on;
    document.body.classList.toggle('touch', on);
  }

  joyRadius() {
    return Math.min(70, window.innerHeight * 0.14);
  }

  onDown(e) {
    if (e.pointerType === 'touch' && !this.touch) this.setTouch(true);
    if (e.target.closest('#fullscreen, #menu, #quiz, #result')) return; // those handle their own taps
    e.preventDefault();
    if (this.match.state === 'menu' || this.match.state === 'question') return;

    const btn = e.target.closest('.btn');
    if (btn && this.touch) {
      const key = btn.dataset.key;
      this.btnPointers.set(e.pointerId, key);
      btn.classList.add('held');
      this.match.press(key);
      return;
    }
    if (e.clientX < window.innerWidth * 0.55 && this.joy.id === null) {
      Object.assign(this.joy, { id: e.pointerId, bx: e.clientX, by: e.clientY, x: e.clientX, y: e.clientY });
      const r = this.joyRadius();
      Object.assign(this.base.style, {
        display: 'block', left: `${e.clientX - r}px`, top: `${e.clientY - r}px`, width: `${r * 2}px`, height: `${r * 2}px`,
      });
      this.knob.style.transform = 'translate(-50%, -50%)';
    }
  }

  onMove(e) {
    if (e.pointerId !== this.joy.id) return;
    this.joy.x = e.clientX;
    this.joy.y = e.clientY;
    const r = this.joyRadius();
    let dx = this.joy.x - this.joy.bx, dy = this.joy.y - this.joy.by;
    const l = Math.hypot(dx, dy);
    if (l > r) { dx = dx / l * r; dy = dy / l * r; }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  onUp(e) {
    if (e.pointerId === this.joy.id) {
      this.joy.id = null;
      this.base.style.display = 'none';
    }
    const key = this.btnPointers.get(e.pointerId);
    if (key) {
      this.btnPointers.delete(e.pointerId);
      this.buttons[key].classList.remove('held');
      this.match.release(key);
    }
  }

  onKeyDown(e) {
    if (this.match.state === 'question') return; // the question screen has its own keys
    this.keys.add(e.code);
    const key = KEY_BUTTONS[e.code];
    if (key) { e.preventDefault(); this.match.press(key); }
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
    const key = KEY_BUTTONS[e.code];
    if (key) this.match.release(key);
  }

  releaseAll() {
    this.keys.clear();
    for (const key of ['a', 'b', 's', 't']) {
      this.buttons[key].classList.remove('held');
      this.match.release(key);
    }
    this.btnPointers.clear();
    this.joy.id = null;
    this.base.style.display = 'none';
  }

  readMove() {
    if (this.joy.id !== null) {
      const dx = this.joy.x - this.joy.bx, dy = this.joy.y - this.joy.by;
      const l = Math.hypot(dx, dy);
      if (l < 8) return { x: 0, y: 0, mag: 0 };
      return { x: dx / l, y: dy / l, mag: Math.min(1, l / this.joyRadius()) };
    }
    const k = this.keys;
    const x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const y = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    if (!x && !y) return { x: 0, y: 0, mag: 0 };
    const l = Math.hypot(x, y);
    return { x: x / l, y: y / l, mag: 1 };
  }
}
