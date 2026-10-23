// Online 2-player games. The two devices talk straight to each other (WebRTC), finding each
// other through PeerJS's free public matchmaking server; when a direct link can't be made (some
// home routers and phone networks block it), PeerJS's free relay carries the game instead.
// One device hosts: it gets a 4-digit code and runs the match. The other types the code in to join.
// PeerJS is only loaded when someone picks 2 Players, so the 1-player game never needs it.

const PEERJS = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
const PREFIX = 'sixth-sharks-soccer-'; // the code's full name on the matchmaking server
const CONNECT_WAIT = 12000; // ms to wait for the host to answer
const SILENT_FOR = 8000;    // ms without hearing anything before the other device counts as gone

let loading = null;
function loadPeerJS() {
  if (window.Peer) return Promise.resolve();
  return loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEERJS;
    s.onload = resolve;
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error("Couldn't start online play. Is this device on the internet?"));
    };
    document.head.appendChild(s);
  });
}

// A peer registered with the matchmaking server (under id, or a random id if none)
function openPeer(id) {
  return new Promise((resolve, reject) => {
    const peer = id ? new window.Peer(id, { debug: 0 }) : new window.Peer({ debug: 0 });
    peer.once('open', () => resolve(peer));
    peer.once('error', e => { peer.destroy(); reject(e); });
  });
}

const friendly = e => (e && e.type === 'network' || e && e.type === 'server-error'
  ? new Error("Couldn't reach the game server. Is this device on the internet?") : e);

export class Link {
  constructor({ onOpen, onMessage, onClose }) {
    Object.assign(this, { onOpen, onMessage, onClose });
    this.peer = null;
    this.conn = null;
  }

  // Host: get a code and wait for the other player. Resolves with the code.
  async host() {
    await loadPeerJS();
    for (let tries = 0; tries < 6; tries++) {
      const code = String(1000 + Math.floor(Math.random() * 9000));
      try {
        this.peer = await openPeer(PREFIX + code);
      } catch (e) {
        if (e.type === 'unavailable-id') continue; // someone else has this code: pick another
        throw friendly(e);
      }
      this.peer.on('connection', conn => {
        if (this.conn) { conn.on('open', () => conn.close()); return; } // already have a player
        this.attach(conn);
      });
      // Lost touch with the matchmaking server while waiting: get back on it so the code still works
      this.peer.on('disconnected', () => { if (!this.conn && this.peer && !this.peer.destroyed) this.peer.reconnect(); });
      return code;
    }
    throw new Error("Couldn't get a game code. Try again.");
  }

  // Join the game with this code. Resolves once connected.
  async join(code) {
    await loadPeerJS();
    try {
      this.peer = await openPeer();
    } catch (e) {
      throw friendly(e);
    }
    const conn = this.peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
    await new Promise((resolve, reject) => {
      const notFound = () => reject(new Error(`No game found with code ${code}. Check the code on the other device.`));
      const timer = setTimeout(notFound, CONNECT_WAIT);
      conn.once('open', () => { clearTimeout(timer); resolve(); });
      this.peer.once('error', e => { clearTimeout(timer); e.type === 'peer-unavailable' ? notFound() : reject(friendly(e)); });
    });
    this.attach(conn);
  }

  attach(conn) {
    this.conn = conn;
    this.heard = performance.now();
    conn.on('data', msg => {
      this.heard = performance.now();
      if (msg.type !== 'ping') this.onMessage(msg);
    });
    conn.on('close', () => this.lost());
    conn.on('error', () => this.lost());
    // A ping every second, so a device that's gone quiet (closed, asleep, off the wifi) is noticed
    this.pinger = setInterval(() => {
      if (performance.now() - this.heard > SILENT_FOR) this.lost();
      else this.send({ type: 'ping' });
    }, 1000);
    const ready = () => { this.heard = performance.now(); this.onOpen(); };
    if (conn.open) ready(); else conn.once('open', ready);
  }

  send(msg) {
    if (this.conn && this.conn.open) this.conn.send(msg);
  }

  lost() {
    if (!this.conn) return;
    this.close();
    this.onClose();
  }

  close() {
    clearInterval(this.pinger);
    const { conn, peer } = this;
    this.conn = null;
    this.peer = null;
    try { if (conn) conn.close(); } catch { /* already closed */ }
    try { if (peer) peer.destroy(); } catch { /* already gone */ }
  }
}
