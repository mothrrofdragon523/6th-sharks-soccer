// Who's playing on this device: Gabe (PIN-protected; gets the math questions and they're logged)
// or a Guest (no questions, nothing logged). The choice is remembered on the device.
//
// The PIN is stored scrambled so it isn't readable at a glance in the published code. It keeps
// family members from answering as Gabe by accident; it isn't real security.

const KEY = 'sss-player';
const PIN_CHECK = 0xa1d1095a; // scrambled form of Gabe's PIN

export const PLAYERS = {
  gabe: { id: 'gabe', name: 'Gabe', questions: true },
  guest: { id: 'guest', name: 'Guest', questions: false },
};

function scramble(text) { // FNV-1a
  let h = 0x811c9dc5;
  for (const ch of new TextEncoder().encode(`sss:${text}`)) {
    h ^= ch;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function pinMatches(pin) {
  return scramble(pin) === PIN_CHECK;
}

export function savedPlayer() {
  try { return PLAYERS[localStorage.getItem(KEY)] || null; } catch { return null; }
}

export function savePlayer(player) {
  try {
    if (player) localStorage.setItem(KEY, player.id); else localStorage.removeItem(KEY);
  } catch { /* storage unavailable: they'll be asked again next time */ }
}
