import { Match, HOME, AWAY, shotLevel, goalShot, scoringChance } from './sim.js';
import { View } from './view.js';
import { Input } from './input.js';
import { Link } from './net.js';
import { snapshot, Mirror, SNAPSHOT_EVERY } from './sync.js';
import { LEVELS } from './levels.js';
import { QuestionDeck, drawGraph, sameAnswer, howFarOff } from './questions.js';
import { HomeworkDeck } from './homework.js';
import { logAnswer, flush as flushLog } from './log.js';
import { PLAYERS, pinMatches, savedPlayer, savePlayer } from './player.js';
import { canSpeak, readAloudOn, setReadAloud, unlock as unlockSpeech, say, stop as stopSpeech } from './speech.js';
import { findSubtraction, numberLine } from './numberline.js';

const $ = id => document.getElementById(id);
const match = new Match();
const view = new View($('scene'), match);
// Buttons work this device's team, or (on the joining device in an online game) go to the host
const input = new Input(match, {
  press: key => button('press', key),
  release: key => button('release', key),
});
function button(type, key) {
  if (online && !online.host) { if (online.playing) online.link.send({ type, key }); }
  else match[type](myTeam, key);
}
window.game = { match, view }; // handy for poking at the game from the browser console

// Kit check: open the game with ?kits in the address to line all 16 players up close to the
// camera (the Sharks in front, the Eagles in a staggered row behind), for checking how
// the kits look on a particular phone or tablet.
if (new URLSearchParams(location.search).has('kits')) {
  view.ready.then(() => {
    match.state = 'kitcheck';
    match.players.forEach((p, i) => {
      const row = Math.floor(i / 8);
      Object.assign(p, { x: (i % 8 - 3.5 + row * 0.5) * 22, y: -row * 40, vx: 0, vy: 0, angle: Math.PI / 2 }); // facing the camera
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
let myTeam = HOME;                    // the team this device plays (online, it can be the Eagles)
let online = null;                    // an online game: { link, host, playing, sides } (see "2 Players online")
let homeworkSeen = null;              // online: Gabe's homework progress, sent from his device

let currentLevel = null;

function beginGame(level, questionSet, label) {
  currentLevel = level;
  deck = level.homework ? new HomeworkDeck(level.homework) : new QuestionDeck(questionSet);
  stats = { right: 0, total: 0 };
  game = {
    player: player.name,
    mode: (online ? '2 Players · ' : '') + (series ? `Championship · Game ${series.game}` : level.name),
    set: LEVELS.find(l => l.questions === questionSet).name, // which season's questions
    gameId: new Date().toISOString(),
  };
  flushLog(); // send anything left over from last time
  // Only Gabe gets (and logs) math questions, on whichever device he's playing
  match.setPilots(online
    ? [HOME, AWAY].map(team => ({ team, questions: online.sides[sideOf(team)].questions }))
    : [{ team: HOME, questions: player.questions }]);
  $('rule').textContent = label;
  homeworkSeen = null;
  if (online && !online.host) { shareHomework(); return; } // the host runs the match and sends it over
  match.startMatch(level);
  if (online) {
    online.playing = true;
    online.link.send({ type: 'start', level: level.id, game: series ? series.game : 0, label });
    shareHomework();
  }
}

// Online, Gabe's device tells the other one how he's doing on his homework, for its answers list
function shareHomework() {
  if (online && player.questions && currentLevel.homework) {
    online.link.send({ type: 'homework', status: { ...deck.progress.status } });
  }
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
  series: $('result-series'), main: $('result-main'), menu: $('result-menu'), review: $('result-review'),
};
let resultAction = null; // what the main button does

function onGameOver() {
  if (game.ended) return; // count each game once
  game.ended = true;
  const { home, away } = match.score;
  const won = myTeam === HOME ? home > away : away > home;
  let title = won ? 'YOU WIN!' : 'TOO BAD!';
  let seriesText = '';
  let mainLabel = won ? 'Play Again' : 'Try Again';
  // Online, the joining device asks the host to start the next game
  const askHost = () => online && online.link.send({ type: 'again' });
  const guest = online && !online.host;
  resultAction = guest ? askHost : () => startLevel(series ? series.level : currentLevel);

  if (series) {
    series.wins[home > away ? 'home' : 'away']++;
    const { home: s, away: e } = series.wins;
    if (Math.max(s, e) >= 2) {
      series.done = true;
      title = won ? 'CHAMPIONS! 🏆' : 'TOO BAD!';
      seriesText = s > e ? `The Sharks win the Championship ${s}–${e}!` : `The Eagles win the Championship ${e}–${s}.`;
    } else {
      seriesText = s === e ? `The series is tied ${s}–${e}. On to Game ${series.game + 1}!`
        : s > e ? `Sharks lead the series ${s}–${e}` : `Eagles lead the series ${e}–${s}`;
      mainLabel = `Next Game ▶`;
      resultAction = guest ? askHost : nextSeriesGame;
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
  result.review.hidden = !currentLevel.homework;
  result.el.hidden = false;
  if (won) startFireworks(series && series.done ? 2 : 1);
}

function closeResult(action) {
  result.el.hidden = true;
  stopFireworks();
  action();
}
result.main.addEventListener('click', () => closeResult(resultAction));
result.menu.addEventListener('click', () => closeResult(() => {
  if (online) { online.link.send({ type: 'menu' }); backToLobby(); return; } // both go back to the lobby
  series = null;
  match.toMenu();
  showMenuStep('mode');
}));
window.addEventListener('keydown', e => {
  if (result.el.hidden || !review.el.hidden || e.code !== 'Enter') return;
  e.preventDefault();
  closeResult(resultAction);
});

// ---------- Homework answers: every problem on the worksheet, to finish the paper copy ----------
const review = { el: $('review'), title: $('review-title'), list: $('review-list') };
const REVIEW_STATUS = {
  first: ['⭐ First try', 'first'],
  solved: ['✓ Got it', 'solved'],
  shown: ['Answer shown', 'shown'],
  paper: ['✏️ Write this one on paper', 'paper'],
  notebook: ['✏️ In your notebook', 'paper'],
};

function showReview() {
  const { homework } = currentLevel;
  review.title.textContent = homework.title;
  review.list.replaceChildren(...homework.problems.map(p => {
    const li = document.createElement('li');
    // Online, the other player sees how Gabe's doing from his device
    const status = homeworkSeen ? homeworkSeen[p.n] || null : deck.status(p.n);
    const [label, cls] = REVIEW_STATUS[p.paper ? 'paper' : p.notebook ? (status ? 'notebook' : null) : status] || ['Not asked yet', 'none'];
    li.innerHTML = '<div class="review-top"><strong class="num"></strong><span class="chip"></span></div>'
      + '<p class="q"></p><p class="a">Answer: <strong></strong></p><p class="why"></p>';
    li.querySelector('.num').textContent = `#${p.n}`;
    li.querySelector('.chip').textContent = label;
    li.querySelector('.chip').classList.add(cls);
    li.querySelector('.q').textContent = p.q;
    li.querySelector('.a strong').textContent = p.a;
    li.querySelector('.why').textContent = p.why || '';
    if (p.notebook) { li.querySelector('.a').remove(); li.querySelector('.why').remove(); } // his own words, no answer to copy
    return li;
  }));
  review.el.hidden = false;
  review.el.querySelector('.review-card').scrollTop = 0;
}
result.review.addEventListener('click', showReview);
$('review-close').addEventListener('click', () => { review.el.hidden = true; });

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

// ---------- Start menu ----------
// Who's playing on this device → 1 Player or 2 Players → for 1 Player, pick a season; for
// 2 Players, start a game (and share its code) or join one, then pick a season in the lobby.
const menu = $('menu');
const levelList = $('levels');
for (const level of LEVELS) {
  const card = document.createElement('button');
  card.className = `level level-${level.id}`;
  card.style.setProperty('--c', level.color);
  card.disabled = true;
  card.dataset.empty = level.homework && !level.homework.problems.length ? '1' : '';
  card.innerHTML = `<span class="icon">${level.icon}</span><h2></h2><p></p>`;
  card.querySelector('h2').textContent = level.name;
  card.querySelector('p').textContent = level.desc;
  card.addEventListener('click', () => {
    if (match.state !== 'menu') return;
    unlockSpeech();
    if (online && !online.host) online.link.send({ type: 'pick', level: level.id }); // the host starts it
    else startLevel(level);
  });
  levelList.appendChild(card);
}

// The player models are large, so wait for them before the first kick-off
let loaded = false;
view.ready.finally(() => {
  loaded = true;
  for (const card of levelList.children) card.disabled = !!card.dataset.empty;
  $('menu-sub').textContent = menuTitle(menuStep);
});

// The menu shows one step at a time
const STEPS = ['who', 'pin', 'mode', 'online', 'join', 'hosting', 'lobby'];
const BACK = { seasons: '‹ Back', online: '‹ Back', join: '‹ Back', hosting: 'Cancel', lobby: 'Leave game' };
let menuStep = null;

function menuTitle(step) {
  if ((step === 'seasons' || step === 'lobby') && !loaded) return 'Loading players…';
  return {
    who: "Who's playing?",
    pin: "Enter Gabe's PIN",
    mode: 'How do you want to play?',
    seasons: 'Choose your season',
    online: 'Play against someone on another device',
    join: 'Type in the code from the other device',
    hosting: 'Getting a game code…',
    lobby: 'Pick a season to kick off (either of you can)',
  }[step];
}

// note: a line under the title, e.g. why we've come back here
function showMenuStep(step = player ? 'mode' : 'who', note = '') {
  menuStep = step;
  for (const s of STEPS) $(s).hidden = s !== step;
  levelList.hidden = step !== 'seasons' && step !== 'lobby';
  $('playing-as').hidden = step !== 'mode' && step !== 'seasons';
  $('menu-sub').textContent = menuTitle(step);
  showNote(note);
  $('menu-back').hidden = !BACK[step];
  $('menu-back').textContent = BACK[step] || '';
  if (step === 'mode' || step === 'seasons') {
    $('playing-as-name').textContent = player.name;
    $('playing-as-note').textContent = player.questions ? '' : ' (no math questions)';
    showReadAloud();
  }
  if (step === 'pin') {
    $('pin-input').value = '';
    $('pin-error').hidden = true;
    $('pin-input').focus();
  }
  if (step === 'join') {
    $('join-code').value = '';
    $('join-go').disabled = false;
    $('join-code').focus();
  }
  if (step === 'lobby') showLobby();
}

function showNote(note) {
  $('menu-note').textContent = note;
  $('menu-note').hidden = !note;
}

function choosePlayer(p) {
  player = p;
  savePlayer(p);
  showMenuStep('mode');
}

$('mode-one').addEventListener('click', () => showMenuStep('seasons'));
$('mode-two').addEventListener('click', () => showMenuStep('online'));
$('menu-back').addEventListener('click', () => {
  if (menuStep === 'join' || menuStep === 'hosting') { leaveOnline(); showMenuStep('online'); }
  else { leaveOnline(); showMenuStep('mode'); } // seasons, online, or leaving the lobby
});

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
// Read aloud on or off, for whoever answers the questions on this device
function showReadAloud() {
  $('read-aloud-wrap').hidden = !canSpeak || !player.questions;
  $('read-aloud').textContent = `🔊 Read every question: ${readAloudOn() ? 'On' : 'Off'}`;
}
$('read-aloud').addEventListener('click', () => {
  unlockSpeech();
  setReadAloud(!readAloudOn());
  showReadAloud();
});

$('switch-player').addEventListener('click', () => {
  player = null;
  savePlayer(null);
  showMenuStep('who');
});
showMenuStep();

// ---------- 2 Players online ----------
// One device hosts: it runs the match and sends snapshots of it (sync.js). The other joins with
// the code, sends its joystick and buttons, and draws the snapshots. Gabe can be on either device:
// his questions are asked (and logged) on his own device, and only the shot goes to the host.
// online.sides: { home, away }, each { name, questions, host } (host: on the hosting device)
const mirror = new Mirror(match);
const sideOf = team => (team === AWAY ? 'away' : 'home');
const otherTeam = () => (myTeam === HOME ? AWAY : HOME);
const nameOf = team => (online ? online.sides[sideOf(team)].name : player.name);

function setTeam(team) {
  myTeam = team;
  view.team = team;
}

function goOnline(host) {
  leaveOnline();
  const link = new Link({
    onOpen: () => { if (!host) link.send({ type: 'hello', name: player.name, questions: player.questions }); },
    onMessage: msg => { try { onlineMessage(msg); } catch (e) { showError(e); } },
    onClose: lostOpponent,
  });
  online = { link, host, playing: false, sides: null };
  return link;
}

function leaveOnline() {
  if (!online) return;
  online.link.close(); // the other device notices it's gone
  online = null;
  mirror.reset();
  setTeam(HOME);
}

// The other device left, or the connection dropped: back to the menu, wherever we were
function lostOpponent() {
  if (!online) return;
  online = null;
  mirror.reset();
  setTeam(HOME);
  endGameScreens();
  series = null;
  match.setPilots([{ team: HOME }]);
  match.toMenu();
  showMenuStep('mode', 'The other player left, or the connection dropped.');
}

// After a game, both devices go back to the lobby to pick the next one
function backToLobby() {
  endGameScreens();
  series = null;
  online.playing = false;
  mirror.reset();
  match.toMenu();
  showMenuStep('lobby');
}

function endGameScreens() {
  if (current) { current = null; stopSpeech(); }
  stopWatching();
  quiz.el.hidden = true;
  result.el.hidden = true;
  review.el.hidden = true;
  stopFireworks();
}

$('online-host').addEventListener('click', async () => {
  const link = goOnline(true);
  showMenuStep('hosting');
  $('host-code').textContent = '· · · ·';
  try {
    const code = await link.host();
    if (!online || online.link !== link) return; // cancelled while waiting
    $('host-code').textContent = code;
    $('menu-sub').textContent = 'Waiting for the other player to join…';
  } catch (e) {
    if (!online || online.link !== link) return;
    leaveOnline();
    showMenuStep('online', e.message || "Couldn't start a game. Try again.");
  }
});

$('online-join').addEventListener('click', () => showMenuStep('join'));
$('join').addEventListener('submit', async e => {
  e.preventDefault();
  const code = $('join-code').value.trim();
  if (!/^\d{4}$/.test(code)) { showNote('The code is 4 numbers.'); return; }
  const link = goOnline(false);
  $('join-go').disabled = true;
  $('menu-sub').textContent = 'Connecting…';
  showNote('');
  try {
    await link.join(code); // then the host sends the lobby
  } catch (err) {
    if (!online || online.link !== link) return;
    leaveOnline();
    showMenuStep('join', err.message || "Couldn't connect. Try again.");
  }
});

// The lobby: who's on which team. Either player can swap the teams round.
function showLobby() {
  if (!online || !online.sides) return;
  const label = s => `${s.name}${s.host === online.host ? ' (you)' : ''}`;
  $('lobby-home').textContent = label(online.sides.home);
  $('lobby-away').textContent = label(online.sides.away);
}

function sendLobby() {
  online.link.send({ type: 'lobby', sides: online.sides });
  useLobby(online.sides);
}

function useLobby(sides) {
  online.sides = sides;
  setTeam(sides.home.host === online.host ? HOME : AWAY);
  if (menuStep === 'lobby') showLobby();
}

$('lobby-swap').addEventListener('click', () => {
  if (!online || match.state !== 'menu') return;
  if (online.host) swapSides(); else online.link.send({ type: 'swap' });
});

function swapSides() {
  const { home, away } = online.sides;
  online.sides = { home: away, away: home };
  sendLobby();
}

function onlineMessage(msg) {
  if (!online) return;
  // Gabe's question card and homework progress come from whichever device he's on
  if (msg.type === 'quiz') { if (msg.card) showWatching(msg.card); else stopWatching(); return; }
  if (msg.type === 'homework') { if (!player.questions) homeworkSeen = msg.status; return; }
  if (online.host) {
    const them = otherTeam();
    switch (msg.type) {
      case 'hello': // someone joined
        online.sides = {
          home: { name: player.name, questions: player.questions, host: true },
          away: { name: msg.name, questions: !!msg.questions, host: false },
        };
        sendLobby();
        showMenuStep('lobby');
        break;
      case 'move': { const c = match.pilot(them); if (c) c.move = { x: msg.x, y: msg.y, mag: msg.mag }; break; }
      case 'press': match.press(them, msg.key); break;
      case 'release': match.release(them, msg.key); break;
      case 'answer': // their question's answered: take the shot
        if (match.state === 'question' && match.pendingShot && match.pendingShot.team === them) match.answerShot(msg.style);
        break;
      case 'skip': if (match.state === 'question') match.skipQuestion(); break;
      case 'swap': if (match.state === 'menu') swapSides(); break;
      case 'pick': { // they chose the season
        const level = LEVELS.find(l => l.id === msg.level);
        if (level && match.state === 'menu' && menuStep === 'lobby') startLevel(level);
        break;
      }
      case 'again': if (!result.el.hidden) closeResult(resultAction); break; // Play Again / Next Game
      case 'menu': backToLobby(); break;
    }
    return;
  }
  switch (msg.type) {
    case 'lobby':
      useLobby(msg.sides);
      if (!online.playing && menuStep !== 'lobby') showMenuStep('lobby');
      break;
    case 'start': { // the host kicked off a game
      const level = LEVELS.find(l => l.id === msg.level);
      endGameScreens();
      if (!msg.game) series = null;
      else {
        if (msg.game === 1 || !series) series = { level, game: 0, wins: { home: 0, away: 0 }, done: false };
        series.game = msg.game;
      }
      mirror.reset();
      online.playing = true;
      beginGame(level, msg.game ? level.series[msg.game - 1] : level.questions, msg.label);
      break;
    }
    case 'snap': if (online.playing) mirror.push(msg, performance.now()); break;
    case 'menu': backToLobby(); break;
  }
}

// The joining device sends its joystick when it changes (and now and then anyway)
let sentMove = { x: 0, y: 0, mag: 0, at: 0 };
function sendMove(move, now) {
  const changed = Math.abs(move.x - sentMove.x) + Math.abs(move.y - sentMove.y) + Math.abs(move.mag - sentMove.mag) > 0.03;
  if (!(changed && now - sentMove.at > 33) && now - sentMove.at < 300) return;
  const r = v => Math.round(v * 100) / 100;
  sentMove = { x: r(move.x), y: r(move.y), mag: r(move.mag), at: now };
  online.link.send({ type: 'move', x: sentMove.x, y: sentMove.y, mag: sentMove.mag });
}

// ---------- Watching Gabe's questions ----------
// Online, the other player sees Gabe's question card as he answers it (what he's asked, what he
// taps or types, and the answer and explanation), in case he needs a hand. It's only to look at:
// he answers on his own device. His device sends the card whenever anything on it changes.
let sharedCard = 'null';
let watching = false;

function cardNow() {
  if (!current || quiz.el.hidden) return null;
  const { question } = current;
  const mark = el => (el.classList.contains('right') ? 'right' : el.classList.contains('wrong') ? 'wrong' : '');
  const entry = quiz.choices.querySelector('.entry');
  return {
    q: question.q, tag: quiz.level.textContent, lvl: quiz.level.className, odds: quiz.odds.textContent,
    graph: question.graph || null,
    kind: question.notebook ? 'notebook' : question.typed ? 'typed' : 'choices',
    choices: [...quiz.choices.querySelectorAll('.choice')].map(b => ({ text: b.querySelector('.text').textContent, mark: mark(b), off: b.disabled })),
    entry: entry && { text: entry.textContent, mark: mark(entry) },
    result: quiz.result.hidden ? null : {
      verdict: quiz.verdict.textContent, cls: quiz.verdict.className, why: quiz.why.textContent,
      line: quiz.line.hidden ? null : current.line,
    },
  };
}

// Called every frame: send his card when it's changed (and that it's gone once he shoots)
function shareCard() {
  if (!online || !online.playing) return;
  const card = JSON.stringify(cardNow());
  if (card === sharedCard) return;
  sharedCard = card;
  online.link.send({ type: 'quiz', card: JSON.parse(card) });
}

function showWatching(card) {
  if (current) return; // never over our own question
  const first = !watching || quiz.q.textContent !== card.q;
  watching = true;
  quiz.el.hidden = false;
  quiz.el.classList.add('watching');
  quiz.el.classList.toggle('has-graph', !!card.graph);
  quiz.el.classList.toggle('typed', card.kind === 'typed');
  quiz.title.textContent = `👀 ${nameOf(otherTeam())}'s shot: watching`;
  quiz.q.textContent = card.q;
  quiz.level.textContent = card.tag;
  quiz.level.className = card.lvl;
  quiz.odds.textContent = card.odds;
  quiz.graph.hidden = !card.graph;
  if (card.graph && first) drawGraph(quiz.graph, card.graph);
  quiz.speak.hidden = true;
  quiz.go.hidden = true;
  if (card.kind === 'choices') {
    quiz.choices.replaceChildren(...card.choices.map((c, i) => {
      const b = document.createElement('button');
      b.className = `choice ${c.mark}`;
      b.classList.toggle('off', c.off && !c.mark);
      b.disabled = true;
      b.innerHTML = '<span class="key"></span><span class="text"></span>';
      b.querySelector('.key').textContent = 'ABCDEF'[i];
      b.querySelector('.text').textContent = c.text;
      return b;
    }));
  } else {
    const note = document.createElement('p');
    note.className = 'notebook-note';
    if (card.kind === 'notebook') {
      note.textContent = `${nameOf(otherTeam())} writes this answer in his notebook.`;
      quiz.choices.replaceChildren(note);
    } else {
      const entry = document.createElement('div');
      entry.className = `entry ${card.entry ? card.entry.mark : ''}`;
      entry.textContent = card.entry ? card.entry.text : '?';
      note.textContent = 'He types his answer on his number pad.';
      quiz.choices.replaceChildren(entry, note);
    }
  }
  const r = card.result;
  quiz.result.hidden = !r;
  if (r) {
    quiz.verdict.textContent = r.verdict;
    quiz.verdict.className = r.cls;
    quiz.why.textContent = r.why;
    quiz.line.hidden = !r.line;
    if (r.line) {
      const { svg, caption } = numberLine(r.line);
      quiz.line.querySelector('.line-svg').innerHTML = svg;
      quiz.line.querySelector('.line-caption').textContent = caption;
    }
  }
}

function stopWatching() {
  if (!watching) return;
  watching = false;
  quiz.el.classList.remove('watching');
  if (!current) quiz.el.hidden = true;
}

// Closing the page: tell the other device straight away rather than letting it wait
window.addEventListener('pagehide', () => { if (online) online.link.close(); });

// ---------- Shot questions: answer right and it's a goal, wrong and it misses ----------
const quiz = {
  el: $('quiz'), q: $('quiz-q'), level: $('quiz-level'), graph: $('quiz-graph'),
  choices: $('quiz-choices'), result: $('quiz-result'), verdict: $('quiz-verdict'),
  why: $('quiz-why'), go: $('quiz-go'), speak: $('quiz-speak'), line: $('quiz-line'), odds: $('quiz-odds'),
  title: $('quiz-title'),
};
let current = null; // { question, correct: null | boolean, typed: digits entered so far }

function askQuestion() {
  input.releaseAll();
  stopWatching();
  quiz.title.textContent = '⚽ SHOT ON GOAL!';
  const { distance, fraction } = match.pendingShot;
  const metres = Math.round(distance);
  const zone = shotLevel(fraction);
  const question = deck.next(zone); // homework ignores this and goes in worksheet order
  // His chance of scoring from here, with a right answer and with a wrong one
  const odds = { right: scoringChance(fraction, zone, true), wrong: scoringChance(fraction, zone, false) };
  current = { question, odds, metres, correct: null, typed: '', tries: 0, given: [] };
  quiz.el.hidden = false;
  quiz.el.classList.toggle('has-graph', !!question.graph);
  quiz.q.textContent = question.q;
  quiz.level.textContent = question.tag || `${question.level.toUpperCase()} · ${metres} m`;
  quiz.level.className = `lvl-${question.level}`;
  const pct = p => `${Math.round(p * 100)}%`;
  quiz.odds.textContent = question.notebook ? `Chance to score: ${pct(odds.right)}` // no right or wrong here
    : `Chance to score: ${pct(odds.right)} if you get it right, ${pct(odds.wrong)} if not`;
  quiz.graph.hidden = !question.graph;
  if (question.graph) drawGraph(quiz.graph, question.graph);
  quiz.result.hidden = true;
  quiz.line.hidden = true;
  quiz.speak.hidden = !canSpeak;
  quiz.el.classList.toggle('typed', question.typed);
  if (readAloudOn()) say(questionSpeech());
  if (question.notebook) { showNotebook(); return; }
  if (question.typed) { showNumberPad(); return; }
  quiz.choices.replaceChildren(...question.choices.map((text, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = '<span class="key"></span><span class="text"></span>';
    b.querySelector('.key').textContent = 'ABCDEF'[i];
    b.querySelector('.text').textContent = text;
    b.addEventListener('click', () => answer(i));
    return b;
  }));
}

// ---------- Read aloud: the question and its choices, or what he got and why ----------
function questionSpeech() {
  const { q, choices } = current.question;
  const ask = /[.?!]$/.test(q) && !/[=×÷+−] ?\?$/.test(q) ? q : `${q}.`; // a pause before the choices
  return [ask, ...choices.map((c, i) => `${'ABCDEF'[i]}: ${c}.`)].join(' ');
}

function resultSpeech() {
  const caption = quiz.line.hidden ? '' : quiz.line.querySelector('.line-caption').textContent;
  return [quiz.verdict.textContent.replace(/[⚽👍]/gu, ''), quiz.why.textContent, caption].filter(Boolean).join(' ');
}

quiz.speak.addEventListener('click', () => {
  if (!current) return;
  say(quiz.result.hidden ? questionSpeech() : resultSpeech());
});

// Notebook questions (like science): he writes the answer in his notebook and taps the button.
// There's no right or wrong in the game; it counts as right, so he gets the right-answer chance.
function showNotebook() {
  const note = document.createElement('p');
  note.className = 'notebook-note';
  note.textContent = 'Write your answer in your notebook, then tap the button.';
  const done = document.createElement('button');
  done.className = 'notebook-done';
  done.textContent = '✏️ I wrote it in my notebook';
  done.addEventListener('click', notebookDone);
  quiz.choices.replaceChildren(note, done);
}

function notebookDone() {
  if (!current || current.correct !== null || !current.question.notebook) return;
  quiz.choices.querySelector('.notebook-done').disabled = true;
  attempt('written in notebook', true);
}

// Typed answers (Times Tables facts and some homework): an on-screen number pad, so no choices
// give the answer away and the iPad keyboard doesn't pop up over the game. A keyboard's number
// keys work too. Homework adds a decimal point, a fraction bar, a minus sign and a comma (for
// lists like "−12, −1, 0, 3"; or a colon instead, when the answer is a ratio like 2:5), and room
// for longer answers.
const KEYS = '0123456789';
const HOMEWORK_KEYS = '0123456789./−,:';

function showNumberPad() {
  const { homework } = current.question;
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
  const digit = n => key(n, () => typeKey(String(n)));
  const sym = c => key(c, () => typeKey(c));
  if (homework) { // four columns: the extra keys down the right-hand side
    pad.classList.add('homework');
    const ratio = String(current.question.rightAnswer).includes(':');
    pad.append(digit(1), digit(2), digit(3), key('⌫', eraseDigit, 'erase'),
      digit(4), digit(5), digit(6), sym('−'),
      digit(7), digit(8), digit(9), sym(ratio ? ':' : ','),
      sym('.'), digit(0), sym('/'), key('✓', submitTyped, 'enter'));
  } else {
    pad.append(...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit),
      key('⌫', eraseDigit, 'erase'), digit(0), key('✓', submitTyped, 'enter'));
  }
  quiz.choices.replaceChildren(entry, pad);
  showTyped();
}

function showTyped() {
  const entry = quiz.choices.querySelector('.entry');
  entry.classList.remove('wrong');
  entry.textContent = current.typed || '?';
  quiz.choices.querySelector('.enter').disabled = !current.typed;
}

function typeKey(k) {
  if (!current || current.correct !== null) return;
  const { homework } = current.question;
  if (k === '-') k = '−'; // a keyboard's hyphen is the minus sign
  if (!(homework ? HOMEWORK_KEYS : KEYS).includes(k)) return;
  if (current.typed.length >= (homework ? 14 : 3)) return; // 12 × 12 = 144 is the biggest fact
  current.typed = current.typed === '0' && k !== '.' ? k : current.typed + k;
  showTyped();
}

function eraseDigit() {
  if (!current || current.correct !== null) return;
  current.typed = current.typed.slice(0, -1);
  showTyped();
}

function submitTyped() {
  if (!current || current.correct !== null || !current.typed) return;
  const entry = quiz.choices.querySelector('.entry');
  const given = current.typed;
  const { rightAnswer, accept = [] } = current.question;
  const right = [rightAnswer, ...accept].some(a => sameAnswer(given, a));
  if (!attempt(given, right)) { // try again: his wrong answer stays red until he types
    current.typed = '';
    entry.classList.add('wrong');
    quiz.choices.querySelector('.enter').disabled = true;
    return;
  }
  entry.classList.add(right ? 'right' : 'wrong');
  quiz.choices.querySelectorAll('.pad-key').forEach(b => { b.disabled = true; });
}

function answer(i) {
  if (!current || current.correct !== null) return;
  const { question } = current;
  const buttons = [...quiz.choices.children];
  if (buttons[i].disabled) return; // already tried that one
  const right = i === question.answer;
  buttons[i].classList.add(right ? 'right' : 'wrong');
  buttons[i].disabled = true;
  if (!attempt(question.choices[i], right)) return;
  buttons.forEach((b, k) => {
    b.disabled = true;
    if (k === question.answer) b.classList.add('right');
  });
}

// Homework gives him 2 tries, with no clock: a wrong answer gets "try again", and after a second
// miss it shows the right answer and how to get it, so he doesn't keep practising it wrong.
// Only a right answer on the first try boosts his chance to score, so guessing doesn't pay.
const HOMEWORK_TRIES = 2;

// One go at the question. Returns false if he gets to try again, true once it's settled.
function attempt(given, right) {
  current.tries++;
  current.given.push(given);
  if (!right && current.question.homework && current.tries < HOMEWORK_TRIES) {
    const left = HOMEWORK_TRIES - current.tries;
    quiz.verdict.textContent = `Not quite. Try again! (${left} ${left === 1 ? 'try' : 'tries'} left)`;
    quiz.verdict.className = 'no';
    quiz.why.textContent = '';
    quiz.go.hidden = true;
    quiz.result.hidden = false;
    if (readAloudOn()) say(quiz.verdict.textContent);
    return false;
  }
  record(given, right);
  return true;
}

// Whether the shot goes in is a roll of the dice: his chance (current.odds) depends on how far out
// he is, goes up with a right answer (first try) and halves with a wrong one.
// It decides the shot (see SHOTS in sim.js): a right answer that scores is a header, a volley
// or a low strike; a wrong one that scores just gets hit in. Misses are cooler the closer he got:
// a bicycle kick off the bar, a volley off the post, or a blast over the bar. Answers that aren't
// numbers can't be "nearly right", so they get the volley. Headers, volleys and bicycle kicks only
// happen near goal (TRICK_RANGE); from further out it's a plain strike, into the net or over the bar.
const TRICK_RANGE = 25; // metres
function shotStyle(given, right, firstTry) {
  const scores = Math.random() < (firstTry ? current.odds.right : current.odds.wrong);
  if (current.metres > TRICK_RANGE) return scores ? 'strike' : 'blast';
  if (scores) return firstTry ? goalShot() : 'strike';
  if (right) return 'bicycle'; // right but unlucky, or homework: got there on a retry
  const off = howFarOff(given, current.question.rightAnswer);
  if (off === null) return 'volley';
  return off <= 0.1 ? 'bicycle' : off <= 0.5 ? 'volley' : 'blast';
}

// Score, log and explain an answer, whether it was picked or typed.
function record(given, right) {
  const { question } = current;
  const firstTry = right && current.tries === 1;
  current.correct = firstTry;
  current.style = shotStyle(given, right, firstTry);
  stats.total++;
  if (current.correct) stats.right++;
  if (question.homework) {
    deck.done(question.n, firstTry ? 'first' : right ? 'solved' : 'shown');
    shareHomework();
    logAnswer({
      kind: 'homework',
      player: game.player,
      gameId: game.gameId,
      worksheet: currentLevel.homework.title,
      n: question.n,
      skill: question.skill,
      question: question.q,
      tries: current.tries,
      answers: current.given.join(' → '),
      correctAnswer: question.rightAnswer,
      firstTry,
      solved: right,
    });
  } else {
    logAnswer({
      ...game,
      level: question.level,
      skill: question.skill,
      question: question.q,
      answer: given,
      correctAnswer: question.rightAnswer,
      right: current.correct,
    });
  }
  quiz.verdict.textContent = question.notebook ? 'Nice work! ✏️ Now take your shot.'
    : firstTry ? 'Correct! ⚽'
    : right ? `You got it! 👍 Get it on the first try for the best chance to score.`
    : current.style === 'bicycle' ? `So close! It's ${question.rightAnswer}.`
    : `Not quite. It's ${question.rightAnswer}.`;
  quiz.verdict.className = right ? 'yes' : 'no';
  quiz.why.textContent = question.notebook ? '' : question.why;
  showNumberLine(firstTry ? null : findSubtraction(question.q, question.why));
  if (readAloudOn()) say(resultSpeech());
  quiz.go.textContent = current.correct ? 'SHOOT! ⚽' : 'Take the shot';
  quiz.go.hidden = false;
  quiz.result.hidden = false;
}

// Missed it? If there's a subtraction in it, show that step on a number line.
function showNumberLine(sub) {
  if (current) current.line = sub; // (for sharing his card online)
  quiz.line.hidden = !sub;
  if (!sub) return;
  const { svg, caption } = numberLine(sub);
  quiz.line.querySelector('.line-svg').innerHTML = svg;
  quiz.line.querySelector('.line-caption').textContent = caption;
}

function takeShot() {
  if (!current || current.correct === null) return;
  const { style } = current;
  current = null;
  quiz.el.hidden = true;
  stopSpeech();
  if (online && !online.host) online.link.send({ type: 'answer', style }); // the host takes the shot
  else match.answerShot(style);
}

quiz.go.addEventListener('click', takeShot);
window.addEventListener('keydown', e => {
  if (!current) return;
  if (current.correct !== null) {
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { e.preventDefault(); takeShot(); }
    return;
  }
  if (current.question.notebook) {
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) { e.preventDefault(); notebookDone(); }
    return;
  }
  if (current.question.typed) {
    if (e.key.length === 1) typeKey(e.key);
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
  a: $('btn-a'), b: $('btn-b'), s: $('btn-s'), t: $('btn-t'),
};

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function updateHud() {
  const inMenu = match.state === 'menu';
  menu.hidden = !inMenu;
  document.body.classList.toggle('in-menu', inMenu);
  setText(hud.score, `${match.score.home} – ${match.score.away}`);

  // Online, while the other player answers a question, say so
  let banner = match.banner;
  const shot = match.pendingShot;
  if (match.state === 'question' && shot && shot.team !== myTeam) {
    banner = { title: 'SHOT ON GOAL!', sub: `${nameOf(shot.team)} is answering a question…` };
  }
  hud.banner.hidden = !banner;
  if (banner) {
    setText(hud.bannerTitle, banner.title);
    setText(hud.bannerSub, banner.sub);
  }
  const toast = match.toast && (!match.toast.team || match.toast.team === myTeam) ? match.toast : null;
  hud.toast.hidden = !toast;
  if (toast) setText(hud.toast, toast.text);

  const pilot = match.pilot(myTeam);
  if (!pilot) return;
  // Buttons change between attacking and defending, like FC Mobile
  // and become the keeper's choices while your keeper has the ball
  const attack = match.attacking(myTeam);
  const keeper = match.pilotsKeeper(myTeam);
  if (keeper && keeper.goalKick) {
    setText(hud.a, 'SHORT'); setText(hud.b, 'LONG'); setText(hud.s, '');
  } else if (keeper) {
    setText(hud.a, 'THROW'); setText(hud.b, 'KICK'); setText(hud.s, 'ROLL');
  } else {
    setText(hud.a, attack ? 'PASS' : 'SWITCH');
    setText(hud.b, attack ? 'SHOOT' : 'TACKLE');
    setText(hud.s, 'SPRINT');
  }
  hud.b.classList.toggle('defend', !attack && !keeper);
  // SHOOT's ring shows how hard the question will be from where he is
  const shooting = attack && !keeper;
  const me = pilot.controlled;
  const zone = shooting ? shotLevel(match.shotFraction(me)) : null;
  hud.b.classList.toggle('off', shooting && !zone);
  for (const lvl of ['easy', 'medium', 'hard']) hud.b.classList.toggle(`zone-${lvl}`, zone === lvl);
  hud.s.classList.toggle('off', !!(keeper && keeper.goalKick));
  hud.t.classList.toggle('off', !!keeper);
  hud.t.classList.toggle('tired', !keeper && match.t < me.trickReadyAt);

  // Stamina bar over your player's head whenever it isn't full
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
  hud.s.classList.toggle('tired', me.exhausted && !keeper);

  hud.power.hidden = !pilot.charging;
  if (pilot.charging) {
    const pos = view.screenPos(me, 3.0);
    hud.power.style.left = `${pos.x}px`;
    hud.power.style.top = `${pos.y}px`;
    const pw = match.power(myTeam);
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
    `player: ${player ? player.name : '-'}  questions: ${player ? player.questions : '-'}  online: ${online ? (online.host ? 'host' : 'joined') : 'no'}`,
    `ball: ${b.owner ? `${b.owner.team.name} ${b.owner.num}` : 'loose'}  you: ${myTeam.name} ${match.pilot(myTeam)?.controlled?.num}`,
    `question card: ${quiz.el.hidden ? 'hidden' : 'showing'}  zoom: ${window.visualViewport ? window.visualViewport.scale.toFixed(2) : '?'}`,
  ].join('\n');
}

let last = performance.now();
let lastState = match.state;
let lastSnap = 0;
function frame(now) {
  requestAnimationFrame(frame); // first, so one bad frame can't stop the game
  try {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    const move = input.readMove();
    let gameDt;
    if (online && !online.host) {
      // Joined an online game: draw the host's match, a moment behind, and send our joystick
      gameDt = 0;
      if (online.playing) {
        const before = match.t;
        if (mirror.apply(now)) gameDt = Math.min(Math.max(match.t - before, 0), 0.1); // slow motion comes with it
        sendMove(move, now);
      }
    } else {
      const mine = match.pilot(myTeam);
      if (mine) mine.move = move;
      gameDt = dt * match.timeScale; // slow motion for the big moments
      match.update(gameDt);
      if (online && online.playing && now - lastSnap >= SNAPSHOT_EVERY) {
        lastSnap = now;
        online.link.send(snapshot(match, now));
      }
    }
    if (match.state !== lastState) {
      lastState = match.state;
      // A question for whoever's playing on this device (online, the other one might be shooting)
      if (match.state === 'question' && match.pendingShot && match.pendingShot.team === myTeam) {
        try { askQuestion(); } catch (e) {
          showError(e); quiz.el.hidden = true; current = null;
          if (online && !online.host) online.link.send({ type: 'skip' }); else match.skipQuestion();
        }
      }
      if (match.state === 'over' && game) onGameOver();
    }
    view.update(gameDt);
    updateHud();
    shareCard();
    if (debugBox) updateDebug(now);
  } catch (e) {
    showError(e);
  }
}
requestAnimationFrame(frame);

// More handles for testing from the browser console
Object.assign(window.game, { startLevel, onGameOver, levels: LEVELS });
