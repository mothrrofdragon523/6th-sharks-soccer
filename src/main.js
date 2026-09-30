import { Match, HOME } from './sim.js';
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

function beginGame(level, questionSet, label) {
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

// Tap after the final whistle: the next Championship game, or back to the menu
match.onContinue = () => {
  if (series && !series.done) nextSeriesGame();
  else { series = null; match.toMenu(); }
};

// Add the math score (and the series score) to the final-whistle banner
function onGameOver() {
  const { home, away } = match.score;
  const math = player.questions ? `  ·  Math: ${stats.right} of ${stats.total} right` : '';
  if (!series) {
    match.setBanner(match.banner.title, `${home} – ${away}${math}  ·  Tap to continue`);
    return;
  }
  const winner = home > away ? 'home' : 'away';
  series.wins[winner]++;
  const s = `Series ${series.wins.home} – ${series.wins.away}`;
  if (series.wins[winner] >= 2) {
    series.done = true;
    const name = winner === 'home' ? HOME.name : match.players.find(p => p.team !== HOME).team.name;
    match.setBanner(`${name} WIN THE CHAMPIONSHIP! 🏆`, `${s}${math}  ·  Tap to continue`);
  } else {
    match.setBanner(match.banner.title, `${s}${math}  ·  Tap for Game ${series.game + 1}`);
  }
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
let current = null; // { question, correct: null | boolean }

function askQuestion() {
  input.releaseAll();
  const question = deck.next(Math.max(match.score.home, match.score.away));
  current = { question, correct: null };
  quiz.el.hidden = false;
  quiz.el.classList.toggle('has-graph', !!question.graph);
  quiz.q.textContent = question.q;
  quiz.level.textContent = question.level.toUpperCase();
  quiz.level.className = `lvl-${question.level}`;
  quiz.graph.hidden = !question.graph;
  if (question.graph) drawGraph(quiz.graph, question.graph);
  quiz.result.hidden = true;
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

function answer(i) {
  if (!current || current.correct !== null) return;
  const { question } = current;
  current.correct = i === question.answer;
  stats.total++;
  if (current.correct) stats.right++;
  logAnswer({
    ...game,
    level: question.level,
    skill: question.skill,
    question: question.q,
    answer: question.choices[i],
    correctAnswer: question.choices[question.answer],
    right: current.correct,
  });
  [...quiz.choices.children].forEach((b, k) => {
    b.disabled = true;
    if (k === question.answer) b.classList.add('right');
    else if (k === i) b.classList.add('wrong');
  });
  quiz.verdict.textContent = current.correct ? 'Correct! ⚽' : `Not quite. It's ${question.choices[question.answer]}.`;
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
  const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyA', 'KeyB', 'KeyC', 'KeyD'].indexOf(e.code) % 4;
  if (current.correct === null && i >= 0 && !e.repeat) answer(i);
  else if (current.correct !== null && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); takeShot(); }
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

let last = performance.now();
let lastState = match.state;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  match.move = input.readMove();
  match.update(dt);
  if (match.state !== lastState) {
    if (match.state === 'question') askQuestion();
    if (match.state === 'over') onGameOver();
    lastState = match.state;
  }
  view.update(dt);
  updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
