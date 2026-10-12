// Read aloud: the device's own voice reads questions, answer choices and explanations,
// so reading never gets in the way of the math. It's on unless he turns it off in the menu,
// and the 🔊 button on the question card reads it again any time.

const KEY = 'sss-read-aloud';
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function readAloudOn() {
  if (!canSpeak) return false;
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setReadAloud(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
  if (!on) stop();
}

// iPad Safari only lets a page talk after a tap has started speech once, so the menu's
// buttons call this. The questions pop up later, mid-game, and can then be read out.
let unlocked = false;
export function unlock() {
  if (!canSpeak || unlocked) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}

export function say(text) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text));
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

export function stop() {
  if (canSpeak) speechSynthesis.cancel();
}

// Math the way you'd say it: "3/4 × 20 = ?" becomes "3 fourths times 20 equals what number".
const DENOMS = { 2: ['half', 'halves'], 3: ['third'], 4: ['fourth'], 5: ['fifth'], 6: ['sixth'], 7: ['seventh'], 8: ['eighth'], 9: ['ninth'],
  10: ['tenth'], 12: ['twelfth'], 15: ['fifteenth'], 16: ['sixteenth'], 24: ['twenty-fourth'], 32: ['thirty-second'], 100: ['hundredth'] };
const ordinal = n => {
  const last2 = n % 100, last = n % 10;
  return n + (last2 >= 11 && last2 <= 13 ? 'th' : last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th');
};
const fraction = (top, bottom) => {
  const [one, many = `${one}s`] = DENOMS[bottom] || [ordinal(+bottom)];
  return `${top} ${+top === 1 ? one : many}`;
};
const SUPERS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

export function speakable(text) {
  return String(text)
    .replace(/(\d+) (\d+)\/(\d+)/g, (_, whole, top, bottom) => `${whole} and ${fraction(top, bottom)}`)
    .replace(/(\d+)\/(\d+)/g, (_, top, bottom) => fraction(top, bottom))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, s => {
      const n = [...s].map(c => SUPERS.indexOf(c)).join('');
      return n === '2' ? ' squared' : ` to the power of ${n}`;
    })
    .replace(/(^|\s)\?(?=[\s.]|$)/g, '$1what number')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ')
    .replace(/°F/g, ' degrees')
    .replace(/[[{]/g, '(').replace(/[\]}]/g, ')')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}
