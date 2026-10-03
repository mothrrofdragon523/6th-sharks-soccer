import { Match } from './sim.js';
import { View } from './view.js';
import { Input } from './input.js';
import { LEVELS } from './levels.js';
import { QuestionDeck, drawGraph } from './questions.js';
import { logAnswer, flush as flushLog } from './log.js';
import { PLAYERS, pinMatches, savedPlayer, savePlayer } from './player.js';

const $ = id => document.getElementById(id);
const match = new Match();
const view = new View($('scene'), match);
const input = new Input(match);
window.game = { match, view }; // handy for poking at the game from the browser console

// Kit check: open the game with ?kits in the address to line all 8 players up close to the
// camera (Sharks goalie, Sharks 4, 7, 10, then the same for the Eagles), for checking how
// the kits look on a particular phone or tablet.
if (new URLSearchParams(location.search).has('kits')) {
  view.ready.then(() => {
    match.state = 'kitcheck';
    match.players.forEach((p, i) => {
      Object.assign(p, { x: (i - 3.5) * 22, y: 0, vx: 0, vy: 0, angle: Math.PI / 2 }); // facing the camera
    });
    match.ball.owner = null;
    Object.assign(match.ball, { x: 0, y: 250, vx: 0, vy: 0 });
    const update = view.update.bind(view);
    view.update = dt => {
      update(dt);
      view.camera.position.set(0, 1.5, 8.5);
      view.camera.lookAt(0, 1.0, 0);
      view.renderer.render(view.scene, view.camera);
    };
  });
}

// ---------- Games, questions and the Championship series ----------
let deck = null;                      // this game's questions
let stats = { right: 0, total: 0 };   // this game's answers
let series = null;                    // { level, game, wins: { home, away }, done } during a Championship
let game = null;                      // what the answer log records about this game
let player = savedPlayer();           // who's playing on this device (Gabe or Guest)

let currentLevel = null;

function beginGame(level, questionSet, label) {
  currentLevel = level;
  deck = new QuestionDeck(questionSet);
  stats = { right: 0, total: 0 };
  game = {
    player: player.name,
    mode: series ? `Championship · Game ${series.game}` : level.name,
    set: LEVELS.find(l => l.questions === questionSet).name, // which season's questions
    gameId: new Date().toISOString(),
  };
  flushLog(); // send anything left over from last time
  match.askQuestions = player.questions; // only Gabe gets (and logs) math questions
  match.startMatch(level);
  $('rule').textContent = label;
}

function startLevel(level) {
  if (level.series) {
    series = { level, game: 0, wins: { home: 0, away: 0 }, done: false };
    nextSeriesGame();
  } else {
    series = null;
    beginGame(level, level.questions, `${level.name} · First to 5`);
  }
}

function nextSeriesGame() {
  series.game++;
  beginGame(series.level, series.level.series[series.game - 1], `Championship · Game ${series.game} of 3`);
}

// ---------- End of a game: "You win!" (with fireworks) or "Too bad!" (with Try Again) ----------
// It waits for a button press, so a stray tap at the final whistle can't skip it.
const result = {
  el: $('result'), title: $('result-title'), score: $('result-score'), math: $('result-math'),
  series: $('result-series'), main: $('result-main'), menu: $('result-menu'),
};
let resultAction = null; // what the main button does

function onGameOver() {
  if (game.ended) return; // count each game once
  game.ended = true;
  const { home, away } = match.score;
  const won = home > away;
  let title = won ? 'YOU WIN!' : 'TOO BAD!';
  let seriesText = '';
  let mainLabel = won ? 'Play Again' : 'Try Again';
  resultAction = () => startLevel(series ? series.level : currentLevel);

  if (series) {
    series.wins[won ? 'home' : 'away']++;
    const { home: s, away: e } = series.wins;
    if (Math.max(s, e) >= 2) {
      series.done = true;
      title = won ? 'CHAMPIONS! 🏆' : 'TOO BAD!';
      seriesText = won ? `The Sharks win the Championship ${s}–${e}!` : `The Eagles win the Championship ${e}–${s}.`;
    } else {
      seriesText = s === e ? `The series is tied ${s}–${e}. On to Game ${series.game + 1}!`
        : s > e ? `Sharks lead the series ${s}–${e}` : `Eagles lead the series ${e}–${s}`;
      mainLabel = `Next Game ▶`;
      resultAction = nextSeriesGame;
    }
  }

  match.banner = null;
  result.el.classList.toggle('won', won);
  result.title.textContent = title;
  result.score.textContent = `Sharks ${home} – ${away} Eagles`;
  result.math.textContent = player.questions ? `Math: ${stats.right} of ${stats.total} right${stats.total && stats.right === stats.total ? ' ⭐' : ''}` : '';
  result.math.hidden = !player.questions;
  result.series.textContent = seriesText;
  result.series.hidden = !seriesText;
  result.main.textContent = mainLabel;
  result.el.hidden = false;
  if (won) startFireworks(series && series.done ? 2 : 1);
}

function closeResult(action) {
  result.el.hidden = true;
  stopFireworks();
  action();
}
result.main.addEventListener('click', () => closeResult(resultAction));
result.menu.addEventListener('click', () => closeResult(() => { series = null; match.toMenu(); }));
window.addEventListener('keydown', e => {
  if (result.el.hidden || e.code !== 'Enter') return;
  e.preventDefault();
  closeResult(resultAction);
});

// Fireworks: bursts of sparks in Sharks colours that rise, spread, fall and fade
const fw = { canvas: $('fireworks'), sparks: [], running: false, next: 0, rate: 1 };
const FW_COLOURS = ['#6cc4ee', '#ffffff', '#fdd835', '#0b2a4a', '#9be3ff', '#ffb300'];

function startFireworks(rate) {
  Object.assign(fw, { sparks: [], running: true, next: 0, rate, last: performance.now() });
  fw.canvas.hidden = false;
  requestAnimationFrame(fireworksFrame);
}

function stopFireworks() {
  fw.running = false;
  fw.canvas.hidden = true;
}

function fireworksFrame(now) {
  if (!fw.running) return;
  const c = fw.canvas, g = c.getContext('2d');
  const w = c.width = c.clientWidth * devicePixelRatio, h = c.height = c.clientHeight * devicePixelRatio;
  const dt = Math.min((now - fw.last) / 1000, 0.05);
  fw.last = now;
  fw.next -= dt;
  if (fw.next <= 0) { // a new burst
    fw.next = (0.35 + Math.random() * 0.4) / fw.rate;
    const x = w * (0.15 + Math.random() * 0.7), y = h * (0.12 + Math.random() * 0.35);
    const colour = FW_COLOURS[(Math.random() * FW_COLOURS.length) | 0];
    const n = 50 + ((Math.random() * 30) | 0), speed = h * (0.25 + Math.random() * 0.15);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, s = speed * (0.6 + Math.random() * 0.4);
      fw.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, colour });
    }
  }
  g.clearRect(0, 0, w, h);
  for (const p of fw.sparks) {
    p.vy += h * 0.35 * dt; // gravity
    p.vx *= 0.985; p.vy *= 0.985;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt * 0.7;
    g.globalAlpha = Math.max(0, p.life);
    g.fillStyle = p.colour;
    g.beginPath(); g.arc(p.x, p.y, 2.2 * devicePixelRatio, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  fw.sparks = fw.sparks.filter(p => p.life > 0);
  requestAnimationFrame(fireworksFrame);
}

// ---------- Start menu: pick a season (difficulty) ----------
const menu = $('menu');
const levelList = $('levels');
for (const level of LEVELS) {
  const card = document.createElement('button');
  card.className = `level level-${level.id}`;
  card.style.setProperty('--c', level.color);
  card.disabled = true;
  card.innerHTML = `<span class="icon">${level.icon}</span><h2></h2><p></p>`;
  card.querySelector('h2').textContent = level.name;
  card.querySelector('p').textContent = level.desc;
  card.addEventListener('click', () => { if (match.state === 'menu') startLevel(level); });
  levelList.appendChild(card);
}

// The player models are large, so wait for them before the first kick-off
let loaded = false;
view.ready.finally(() => {
  loaded = true;
  for (const card of levelList.children) card.disabled = false;
  showMenuStep();
});

// ---------- Who's playing? Gabe (with his PIN) or a Guest ----------
// The menu shows either the player picker, the PIN pad, or the seasons.
function showMenuStep(step = player ? 'seasons' : 'who') {
  $('who').hidden = step !== 'who';
  $('pin').hidden = step !== 'pin';
  levelList.hidden = step !== 'seasons';
  $('playing-as').hidden = step !== 'seasons';
  if (step === 'seasons') {
    $('menu-sub').textContent = loaded ? 'Choose your season' : 'Loading players…';
    $('playing-as-name').textContent = player.name;
    $('playing-as-note').textContent = player.questions ? '' : ' (no math questions)';
  } else {
    $('menu-sub').textContent = step === 'who' ? "Who's playing?" : "Enter Gabe's PIN";
  }
  if (step === 'pin') {
    $('pin-input').value = '';
    $('pin-error').hidden = true;
    $('pin-input').focus();
  }
}

function choosePlayer(p) {
  player = p;
  savePlayer(p);
  showMenuStep('seasons');
}

$('who-gabe').addEventListener('click', () => showMenuStep('pin'));
$('who-guest').addEventListener('click', () => choosePlayer(PLAYERS.guest));
$('pin-cancel').addEventListener('click', () => showMenuStep('who'));
$('pin').addEventListener('submit', e => {
  e.preventDefault();
  if (pinMatches($('pin-input').value.trim())) choosePlayer(PLAYERS.gabe);
  else {
    $('pin-error').hidden = false;
    $('pin-input').value = '';
    $('pin-input').focus();
  }
});
$('switch-player').addEventListener('click', () => {
  player = null;
  savePlayer(null);
  showMenuStep('who');
});
showMenuStep();

// ---------- Shot questions: answer right and it's a goal, wrong and it misses ----------
const quiz = {
  el: $('quiz'), q: $('quiz-q'), level: $('quiz-level'), graph: $('quiz-graph'),
  choices: $('quiz-choices'), result: $('quiz-result'), verdict: $('quiz-verdict'),
  why: $('quiz-why'), go: $('quiz-go'),
};
let current = null; // { question, correct: null | boolean, typed: digits entered so far }

function askQuestion() {
  input.releaseAll();
  const question = deck.next(Math.max(match.score.home, match.score.away));
  current = { question, correct: null, typed: '' };
  quiz.el.hidden = false;
  quiz.el.classList.toggle('has-graph', !!question.graph);
  quiz.q.textContent = question.q;
  quiz.level.textContent = question.level.toUpperCase();
  quiz.level.className = `lvl-${question.level}`;
  quiz.graph.hidden = !question.graph;
  if (question.graph) drawGraph(quiz.graph, question.graph);
  quiz.result.hidden = true;
  quiz.el.classList.toggle('typed', question.typed);
  if (question.typed) { showNumberPad(); return; }
  quiz.choices.replaceChildren(...question.choices.map((text, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = '<span class="key"></span><span class="text"></span>';
    b.querySelector('.key').textContent = 'ABCD'[i];
    b.querySelector('.text').textContent = text;
    b.addEventListener('click', () => answer(i));
    return b;
  }));
}

// Typed answers (Times Tables facts): an on-screen number pad, so no choices give the answer away
// and the iPad keyboard doesn't pop up over the game. A keyboard's number keys work too.
function showNumberPad() {
  const entry = document.createElement('div');
  entry.className = 'entry';
  const key = (label, press, cls = '') => {
    const b = document.createElement('button');
    b.className = `pad-key ${cls}`;
    b.textContent = label;
    b.addEventListener('click', press);
    return b;
  };
  const pad = document.createElement('div');
  pad.className = 'pad';
  pad.append(
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => key(n, () => typeDigit(n))),
    key('⌫', eraseDigit, 'erase'), key(0, () => typeDigit(0)), key('✓', submitTyped, 'enter'),
  );
  quiz.choices.replaceChildren(entry, pad);
  showTyped();
}

function showTyped() {
  quiz.choices.querySelector('.entry').textContent = current.typed || '?';
  quiz.choices.querySelector('.enter').disabled = !current.typed;
}

function typeDigit(n) {
  if (!current || current.correct !== null || current.typed.length >= 3) return; // 12 × 12 = 144 is the biggest
  current.typed = current.typed === '0' ? String(n) : current.typed + n;
  showTyped();
}

function eraseDigit() {
  if (!current || current.correct !== null) return;
  current.typed = current.typed.slice(0, -1);
  showTyped();
}

function submitTyped() {
  if (!current || current.correct !== null || !current.typed) return;
  const right = current.typed === current.question.rightAnswer;
  quiz.choices.querySelector('.entry').classList.add(right ? 'right' : 'wrong');
  quiz.choices.querySelectorAll('.pad-key').forEach(b => { b.disabled = true; });
  record(current.typed);
}

function answer(i) {
  if (!current || current.correct !== null) return;
  const { question } = current;
  [...quiz.choices.children].forEach((b, k) => {
    b.disabled = true;
    if (k === question.answer) b.classList.add('right');
    else if (k === i) b.classList.add('wrong');
  });
  record(question.choices[i]);
}

// Score, log and explain an answer, whether it was picked or typed.
function record(given) {
  const { question } = current;
  current.correct = given === question.rightAnswer;
  stats.total++;
  if (current.correct) stats.right++;
  logAnswer({
    ...game,
    level: question.level,
    skill: question.skill,
    question: question.q,
    answer: given,
    correctAnswer: question.rightAnswer,
    right: current.correct,
  });
  quiz.verdict.textContent = current.correct ? 'Correct! ⚽' : `Not quite. It's ${question.rightAnswer}.`;
  quiz.verdict.className = current.correct ? 'yes' : 'no';
  quiz.why.textContent = question.why;
  quiz.go.textContent = current.correct ? 'SHOOT! ⚽' : 'Take the shot';
  quiz.result.hidden = false;
}

function takeShot() {
  if (!current || current.correct === null) return;
  const { correct } = current;
  current = null;
  quiz.el.hidden = true;
  match.answerShot(correct);
}

quiz.go.addEventListener('click', takeShot);
window.addEventListener('keydown', e => {
  if (!current) return;
  if (current.correct !== null) {
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { e.preventDefault(); takeShot(); }
    return;
  }
  if (current.question.typed) {
    if (/^[0-9]$/.test(e.key)) typeDigit(Number(e.key));
    else if (e.code === 'Backspace') eraseDigit();
    else if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) { e.preventDefault(); submitTyped(); }
    return;
  }
  const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyA', 'KeyB', 'KeyC', 'KeyD'].indexOf(e.code) % 4;
  if (i >= 0 && !e.repeat) answer(i);
});
const hud = {
  score: $('score'),
  banner: $('banner'), bannerTitle: $('banner-title'), bannerSub: $('banner-sub'),
  toast: $('toast'),
  power: $('power'), powerFill: $('power-fill'),
  stamina: $('stamina'), staminaFill: $('stamina-fill'),
  a: $('btn-a'), b: $('btn-b'), s: $('btn-s'),
};

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function updateHud() {
  const inMenu = match.state === 'menu';
  menu.hidden = !inMenu;
  document.body.classList.toggle('in-menu', inMenu);
  setText(hud.score, `${match.score.home} – ${match.score.away}`);

  hud.banner.hidden = !match.banner;
  if (match.banner) {
    setText(hud.bannerTitle, match.banner.title);
    setText(hud.bannerSub, match.banner.sub);
  }
  hud.toast.hidden = !match.toast;
  if (match.toast) setText(hud.toast, match.toast.text);

  // Buttons change between attacking and defending, like FC Mobile
  const attack = match.attacking();
  setText(hud.a, attack ? 'PASS' : 'SWITCH');
  setText(hud.b, attack ? 'SHOOT' : 'TACKLE');
  hud.b.classList.toggle('defend', !attack);

  // Stamina bar over your player's head whenever it isn't full
  const me = match.controlled;
  const showStamina = !inMenu && (me.stamina < 0.995 || me.sprinting);
  hud.stamina.hidden = !showStamina;
  if (showStamina) {
    const pos = view.screenPos(me, 2.65);
    hud.stamina.style.left = `${pos.x}px`;
    hud.stamina.style.top = `${pos.y}px`;
    hud.staminaFill.style.width = `${me.stamina * 100}%`;
    hud.staminaFill.classList.toggle('low', me.stamina < 0.3);
    hud.stamina.classList.toggle('exhausted', me.exhausted);
  }
  hud.s.classList.toggle('tired', me.exhausted);

  hud.power.hidden = !match.charging;
  if (match.charging) {
    const pos = view.screenPos(match.controlled, 3.0);
    hud.power.style.left = `${pos.x}px`;
    hud.power.style.top = `${pos.y}px`;
    const pw = match.power();
    hud.powerFill.style.width = `${pw * 100}%`;
    hud.powerFill.classList.toggle('max', pw > 0.85);
  }
}

// ---------- Problems on a device: show them instead of freezing ----------
// Any error shows in a red box at the bottom of the screen, so a screenshot tells us what broke.
// Adding ?debug to the address also shows what the game is doing in the top corner.
const errorBox = $('error-box');
function showError(e) {
  const msg = e && (e.message || e.reason?.message || String(e.reason || e));
  const where = e && (e.filename || (e.error && e.error.stack) || (e.stack) || '').toString().split('\n').slice(0, 2).join(' ');
  errorBox.textContent = `Something went wrong: ${msg}  ${where}`.slice(0, 300);
  errorBox.hidden = false;
}
window.addEventListener('error', showError);
window.addEventListener('unhandledrejection', showError);

const debugBox = new URLSearchParams(location.search).has('debug') ? $('debug-box') : null;
if (debugBox) debugBox.hidden = false;
let fpsFrames = 0, fpsSince = performance.now(), fps = 0;
function updateDebug(now) {
  fpsFrames++;
  if (now - fpsSince > 1000) { fps = Math.round(fpsFrames * 1000 / (now - fpsSince)); fpsFrames = 0; fpsSince = now; }
  const b = match.ball;
  debugBox.textContent = [
    `state: ${match.state}  t: ${match.t.toFixed(1)}  fps: ${fps}`,
    `player: ${player ? player.name : '-'}  questions: ${match.askQuestions}`,
    `ball: ${b.owner ? `${b.owner.team.name} ${b.owner.num}` : 'loose'}  you: ${match.controlled.num}`,
    `question card: ${quiz.el.hidden ? 'hidden' : 'showing'}  zoom: ${window.visualViewport ? window.visualViewport.scale.toFixed(2) : '?'}`,
  ].join('\n');
}

let last = performance.now();
let lastState = match.state;
function frame(now) {
  requestAnimationFrame(frame); // first, so one bad frame can't stop the game
  try {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    match.move = input.readMove();
    match.update(dt);
    if (match.state !== lastState) {
      lastState = match.state;
      if (match.state === 'question') {
        try { askQuestion(); } catch (e) { showError(e); quiz.el.hidden = true; current = null; match.skipQuestion(); }
      }
      if (match.state === 'over') onGameOver();
    }
    view.update(dt);
    updateHud();
    if (debugBox) updateDebug(now);
  } catch (e) {
    showError(e);
  }
}
requestAnimationFrame(frame);

// More handles for testing from the browser console
Object.assign(window.game, { startLevel, onGameOver, levels: LEVELS });
