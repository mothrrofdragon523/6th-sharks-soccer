// Answer log: every question answered goes to the progress Google Sheet.
// Answers wait in this device's storage until they're sent, so nothing is lost when offline.
import { LOG_URL } from './config.js';

const KEY = 'sss-answer-log';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(queue) {
  try { localStorage.setItem(KEY, JSON.stringify(queue)); } catch { /* storage unavailable */ }
}

let sending = false;

export function logAnswer(entry) {
  const queue = load();
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, time: new Date().toISOString(), ...entry });
  save(queue);
  flush();
}

export async function flush() {
  if (!LOG_URL || sending || !navigator.onLine) return;
  const batch = load();
  if (!batch.length) return;
  sending = true;
  try {
    // Plain-text POST so the browser sends it straight to Google without a CORS check.
    // The response can't be read in this mode, so reaching the server counts as delivered;
    // the sheet ignores repeats by id if a batch is ever sent twice.
    await fetch(LOG_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(batch) });
    const sent = new Set(batch.map(e => e.id));
    save(load().filter(e => !sent.has(e.id)));
  } catch {
    // Offline or unreachable: keep them and try again later
  } finally {
    sending = false;
  }
}

export function pendingCount() {
  return load().length;
}

window.addEventListener('online', flush);
flush();
