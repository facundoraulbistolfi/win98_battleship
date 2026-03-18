// ============================================================
// Batalla Naval 98 — Vanilla JS (ported from React)
// 12×12 grid, power-ups, sound, AI, 2-player local
// ============================================================

// ===== CONSTANTS =====
const G = 12;
const SHIPS = [
  { name: "Portaaviones", size: 5, reward: "bomb" },
  { name: "Acorazado",    size: 4, reward: "cross" },
  { name: "Crucero",      size: 3, reward: "radar" },
  { name: "Submarino",    size: 3, reward: "radar" },
  { name: "Destructor",   size: 2, reward: "radar" },
];
const INIT_PUPS = { bomb: 0, radar: 1, cross: 0 };
const FACE = { normal: "\u{1F642}", pressed: "\u{1F62E}", win: "\u{1F60E}", lose: "\u{1F635}", think: "\u{1F914}", hit: "\u{1F608}", hurt: "\u{1F62C}" };

// ===== SOUND ENGINE =====
const SFX = (() => {
  let ctx = null, muted = false, unlocked = false;
  const getCtx = () => {
    if (!ctx || ctx.state === "closed") ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const unlock = () => {
    if (unlocked) return;
    try { const c = getCtx(), buf = c.createBuffer(1, 1, c.sampleRate), src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination); src.start(0); unlocked = true; } catch(e) {}
  };
  if (typeof window !== "undefined") {
    const doUnlock = () => { unlock(); window.removeEventListener("touchstart", doUnlock); window.removeEventListener("click", doUnlock); };
    window.addEventListener("touchstart", doUnlock, { once: true });
    window.addEventListener("click", doUnlock, { once: true });
  }
  const noise = (duration, volume = 0.15) => {
    const c = getCtx(), len = c.sampleRate * duration, buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * volume;
    return buf;
  };
  const play = (fn) => { if (muted) return; try { fn(getCtx()); } catch(e) {} };
  return {
    click: () => play(c => { const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.setValueAtTime(800, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.05); g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06); o.connect(g); g.connect(c.destination); o.start(c.currentTime); o.stop(c.currentTime + 0.06); }),
    hit: () => play(c => { const nSrc = c.createBufferSource(); nSrc.buffer = noise(0.25, 0.4); const nG = c.createGain(); nG.gain.setValueAtTime(0.5, c.currentTime); nG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25); const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(3000, c.currentTime); f.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.2); nSrc.connect(f); f.connect(nG); nG.connect(c.destination); nSrc.start(c.currentTime); const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(120, c.currentTime); o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15); g.gain.setValueAtTime(0.35, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2); o.connect(g); g.connect(c.destination); o.start(c.currentTime); o.stop(c.currentTime + 0.2); }),
    miss: () => play(c => { const nSrc = c.createBufferSource(); nSrc.buffer = noise(0.2, 0.2); const nG = c.createGain(); nG.gain.setValueAtTime(0.2, c.currentTime); nG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(2000, c.currentTime); f.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.15); f.Q.value = 2; nSrc.connect(f); f.connect(nG); nG.connect(c.destination); nSrc.start(c.currentTime); const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(500, c.currentTime); o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12); g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15); o.connect(g); g.connect(c.destination); o.start(c.currentTime); o.stop(c.currentTime + 0.15); }),
    sunk: () => play(c => { [0, 0.12, 0.24].forEach((t, i) => { const freq = [523, 659, 784][i]; const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = freq; g.gain.setValueAtTime(0.15, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.15); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.15); }); }),
    bigBoom: () => play(c => { const nSrc = c.createBufferSource(); nSrc.buffer = noise(0.4, 0.5); const nG = c.createGain(); nG.gain.setValueAtTime(0.55, c.currentTime); nG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4); const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(4000, c.currentTime); f.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.35); nSrc.connect(f); f.connect(nG); nG.connect(c.destination); nSrc.start(c.currentTime); const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(80, c.currentTime); o.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.3); g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35); o.connect(g); g.connect(c.destination); o.start(c.currentTime); o.stop(c.currentTime + 0.35); }),
    radar: () => play(c => { [0, 0.1].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(i === 0 ? 1200 : 1600, c.currentTime + t); g.gain.setValueAtTime(0.12, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.15); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.15); }); }),
    win: () => play(c => { [0, 0.12, 0.24, 0.36, 0.55].forEach((t, i) => { const freq = [523, 659, 784, 1047, 1047][i]; const dur = i === 4 ? 0.4 : 0.14; const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = freq; g.gain.setValueAtTime(i === 4 ? 0.18 : 0.13, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + dur); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + dur); }); }),
    lose: () => play(c => { [0, 0.25, 0.5, 0.75].forEach((t, i) => { const freq = [400, 350, 300, 220][i]; const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.value = freq; g.gain.setValueAtTime(0.12, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.28); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.28); }); }),
    error: () => play(c => { [0, 0.08].forEach(t => { const o = c.createOscillator(), g = c.createGain(); o.type = "square"; o.frequency.value = 300; g.gain.setValueAtTime(0.1, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.06); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.06); }); }),
    toggle: () => { muted = !muted; return muted; },
    isMuted: () => muted,
  };
})();

// ===== SVG ICONS =====
const svgIcon = (inner, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" style="display:block">${inner}</svg>`;
const ICONS = {
  mine: (sz) => svgIcon('<rect x="7" y="0" width="2" height="3" fill="#000"/><rect x="7" y="13" width="2" height="3" fill="#000"/><rect x="0" y="7" width="3" height="2" fill="#000"/><rect x="13" y="7" width="3" height="2" fill="#000"/><rect x="2" y="2" width="2" height="2" fill="#000"/><rect x="12" y="2" width="2" height="2" fill="#000"/><rect x="2" y="12" width="2" height="2" fill="#000"/><rect x="12" y="12" width="2" height="2" fill="#000"/><rect x="4" y="4" width="8" height="8" rx="1" fill="#000"/><rect x="5" y="5" width="2" height="2" fill="#fff"/>', sz),
  water: (sz) => svgIcon('<rect x="1" y="6" width="2" height="2" fill="#0000ff"/><rect x="3" y="5" width="2" height="2" fill="#0000ff"/><rect x="5" y="6" width="2" height="2" fill="#0000ff"/><rect x="7" y="7" width="2" height="2" fill="#0000ff"/><rect x="9" y="6" width="2" height="2" fill="#0000ff"/><rect x="11" y="5" width="2" height="2" fill="#0000ff"/><rect x="13" y="6" width="2" height="2" fill="#0000ff"/><rect x="0" y="10" width="2" height="2" fill="#4444ff"/><rect x="2" y="9" width="2" height="2" fill="#4444ff"/><rect x="4" y="10" width="2" height="2" fill="#4444ff"/><rect x="6" y="11" width="2" height="2" fill="#4444ff"/><rect x="8" y="10" width="2" height="2" fill="#4444ff"/><rect x="10" y="9" width="2" height="2" fill="#4444ff"/><rect x="12" y="10" width="2" height="2" fill="#4444ff"/>', sz),
  ship: (sz) => svgIcon('<rect x="2" y="2" width="12" height="12" fill="#808080"/><rect x="2" y="2" width="12" height="1" fill="#a0a0a0"/><rect x="2" y="2" width="1" height="12" fill="#a0a0a0"/><rect x="2" y="13" width="12" height="1" fill="#404040"/><rect x="13" y="2" width="1" height="12" fill="#404040"/><rect x="5" y="5" width="6" height="6" fill="#606060"/>', sz),
  flag: (sz) => svgIcon('<rect x="7" y="3" width="2" height="10" fill="#000"/><polygon points="3,3 7,3 7,8 3,5.5" fill="#ff0000"/><rect x="4" y="13" width="8" height="2" fill="#000"/><rect x="5" y="12" width="6" height="1" fill="#000"/>', sz),
};

// ===== GRID HELPERS =====
const mkGrid = () => Array.from({ length: G }, () => Array.from({ length: G }, () => ({ ship: null, hit: false, miss: false })));
const mkFlags = () => Array.from({ length: G }, () => Array.from({ length: G }, () => false));
const cloneG = g => g.map(r => r.map(c => ({ ...c })));
const cloneFlags = f => f.map(r => [...r]);

const canPlace = (g, r, c, sz, h) => {
  for (let i = 0; i < sz; i++) {
    const rr = h ? r : r + i, cc = h ? c + i : c;
    if (rr >= G || cc >= G || g[rr][cc].ship !== null) return false;
  }
  return true;
};

const doPlace = (g, r, c, sz, h, si) => {
  const n = cloneG(g);
  for (let i = 0; i < sz; i++) { const rr = h ? r : r + i, cc = h ? c + i : c; n[rr][cc].ship = si; }
  return n;
};

const randomPlace = () => {
  let g = mkGrid();
  for (let si = 0; si < SHIPS.length; si++) {
    let ok = false, att = 0;
    while (!ok && att < 3000) {
      const h = Math.random() > 0.5, r = Math.floor(Math.random() * G), c = Math.floor(Math.random() * G);
      if (canPlace(g, r, c, SHIPS[si].size, h)) { g = doPlace(g, r, c, SHIPS[si].size, h, si); ok = true; }
      att++;
    }
  }
  return g;
};

const shipSunk = (g, si) => {
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) if (g[r][c].ship === si && !g[r][c].hit) return false;
  return true;
};

const countSunk = g => { let n = 0; for (let i = 0; i < SHIPS.length; i++) if (shipSunk(g, i)) n++; return n; };
const allSunk = g => countSunk(g) === SHIPS.length;

const doRadar = (flags, grid, r, c) => {
  const f = cloneFlags(flags); let found = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < G && cc >= 0 && cc < G && grid[rr][cc].ship !== null && !grid[rr][cc].hit) { f[rr][cc] = true; found++; }
  }
  return { flags: f, found };
};

const areaAttack = (grid, r, c, type) => {
  const g = cloneG(grid); let cells = [];
  if (type === "bomb") { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) cells.push([r + dr, c + dc]); }
  else { cells = [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1],[r-2,c],[r+2,c],[r,c-2],[r,c+2]]; }
  let anyHit = false;
  cells.forEach(([rr, cc]) => { if (rr >= 0 && rr < G && cc >= 0 && cc < G && !g[rr][cc].hit && !g[rr][cc].miss) { if (g[rr][cc].ship !== null) { g[rr][cc].hit = true; anyHit = true; } else g[rr][cc].miss = true; } });
  return { grid: g, anyHit };
};

const getAIMove = (grid, hits) => {
  if (hits.length > 0) {
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [hr, hc] of hits) for (const [dr, dc] of dirs) {
      const nr = hr + dr, nc = hc + dc;
      if (nr >= 0 && nr < G && nc >= 0 && nc < G && !grid[nr][nc].hit && !grid[nr][nc].miss) return [nr, nc];
    }
  }
  let a = [];
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) if (!grid[r][c].hit && !grid[r][c].miss && (r + c) % 2 === 0) a.push([r, c]);
  if (!a.length) for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) if (!grid[r][c].hit && !grid[r][c].miss) a.push([r, c]);
  return a.length ? a[Math.floor(Math.random() * a.length)] : null;
};

// ===== STATE =====
const S = {
  phase: "menu",  // menu | placing | passing | playing | gameover
  mode: null,     // ai | local
  grids: [mkGrid(), mkGrid()],
  flags: [mkFlags(), mkFlags()],
  pups: [{ ...INIT_PUPS }, { ...INIT_PUPS }],
  activePU: null,
  curPlayer: 0,
  placingP: 0,
  curShip: 0,
  horiz: true,
  face: FACE.normal,
  winner: null,
  aiHits: [],
  rewarded: [new Set(), new Set()],
  timer: 0,
  timerOn: false,
  menuOpen: null,
  activeTab: "player",
  showConfirm: false,
  passMsg: "",
  passNext: null,
  radarResult: null,
  hoverCells: [],
  hoverValid: false,
  locked: false,
  muted: false,
};

let timerInterval = null;

// ===== HELPERS =====
const isMobile = () => window.innerWidth < 620;

const calcCellSize = () => {
  const mob = isMobile();
  const maxGW = mob ? window.innerWidth - 28 : Math.min(420, (window.innerWidth - 60) / 2);
  return Math.max(18, Math.min(30, Math.floor((maxGW - 36) / G)));
};

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "className") e.className = v;
    else if (k === "innerHTML") e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const ch of children) {
    if (ch == null) continue;
    if (typeof ch === "string") e.appendChild(document.createTextNode(ch));
    else if (Array.isArray(ch)) ch.forEach(c => c && e.appendChild(c));
    else e.appendChild(ch);
  }
  return e;
};

// ===== RENDER ENGINE =====
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (S.phase === "menu") app.appendChild(renderMenu());
  else if (S.phase === "passing") app.appendChild(renderPassScreen());
  else app.appendChild(renderGame());
}

// ===== MENU =====
function renderMenu() {
  const mob = isMobile();
  return el("div", { style: { minHeight: "100vh", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" } },
    el("div", { className: "win", style: { width: mob ? "100%" : "380px" } },
      // Title
      el("div", { className: "titlebar" },
        el("span", { className: "titlebar-text" }, "\u{1F4A3} ", el("span", {}, "Batalla Naval"))
      ),
      // Body
      el("div", { style: { padding: "20px", textAlign: "center" } },
        el("div", { style: { fontSize: "28px", marginBottom: "4px" } }, "\u{1F6A2}"),
        el("div", { style: { fontSize: "16px", fontWeight: "bold", marginBottom: "2px" } }, "BATALLA NAVAL"),
        el("div", { style: { fontSize: "10px", color: "#666", marginBottom: "16px" } }, "Edición Windows 98 \u2014 Mapa 12\u00D712"),
        // Rules
        el("div", { style: { border: "3px solid", borderColor: "#808080 #fff #fff #808080", padding: "12px", marginBottom: "12px", textAlign: "left", fontSize: "10px", lineHeight: "1.7" }, innerHTML: "\u{1F4A3} <b>Power-Ups</b> \u2014 Hundí barcos para ganar Bomba 3\u00D73, Cruz y más Radar<br>\u{1F6A9} <b>Radar</b> \u2014 Escaneá 3\u00D73 y marca barcos con banderas. No gasta turno. Empezás con 1<br>\u{1F4A5} <b>Turno extra</b> \u2014 Si pegás, tirás de nuevo" }),
        // Buttons
        el("div", { style: { display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" } },
          el("button", { className: "btn", style: { width: "220px", padding: "6px 10px" }, onClick: () => { SFX.click(); startGame("ai"); } }, "\u{1F5A5}\uFE0F vs Computadora"),
          el("button", { className: "btn", style: { width: "220px", padding: "6px 10px" }, onClick: () => { SFX.click(); startGame("local"); } }, "\u{1F465} 2 Jugadores (local)")
        ),
        el("div", { style: { fontSize: "9px", color: "#888", marginTop: "8px" } }, "En 2 jugadores ven ambos tableros. El activo se ilumina, el otro se grisea.")
      ),
      // Status bar
      el("div", { style: { borderTop: "2px solid #808080", padding: "2px 6px", fontSize: "10px", color: "#666", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        el("span", {}, "v2.2"),
        el("span", { style: { cursor: "pointer", fontSize: "13px" }, onClick: () => { S.muted = SFX.toggle(); render(); } }, S.muted ? "\u{1F507}" : "\u{1F50A}")
      )
    )
  );
}

// ===== PASS SCREEN =====
function renderPassScreen() {
  return el("div", { style: { minHeight: "100vh", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" } },
    el("div", { className: "dialog-overlay" },
      el("div", { className: "win dialog" },
        el("div", { className: "titlebar" },
          el("span", { className: "titlebar-text" }, "\u{1F504} ", el("span", {}, "Batalla Naval"))
        ),
        el("div", { className: "dialog-body" },
          el("div", { className: "icon" }, "\u{1F648}"),
          el("div", { className: "msg" }, S.passMsg),
          el("div", { className: "sub" }, "Asegurate de que no vea tu tablero"),
          el("button", { className: "btn", style: { padding: "6px 24px" }, onClick: handlePassConfirm }, "Listo")
        )
      )
    )
  );
}

// ===== GAME SCREEN =====
function renderGame() {
  const mob = isMobile();
  const cellSz = calcCellSize();
  const iconSz = Math.max(12, cellSz - 6);

  const myPups = S.pups[S.curPlayer];
  const enemyGrid = S.grids[1 - S.curPlayer];
  const myGrid = S.grids[S.curPlayer];
  const isMyTurn = S.mode === "ai" ? S.curPlayer === 0 && !S.locked : true;
  const isWin = S.winner === S.curPlayer || (S.mode === "ai" && S.winner === 0);

  const root = el("div", { style: { minHeight: "100vh", background: "#008080", display: "flex", alignItems: mob ? "flex-start" : "center", justifyContent: "center", padding: mob ? "4px" : "16px", boxSizing: "border-box" }, onClick: () => { if (S.menuOpen) { S.menuOpen = null; render(); } } });

  const win = el("div", { className: "win", style: { width: mob ? "100%" : "auto", maxWidth: mob ? "100%" : "none" } });

  // ===== Title Bar =====
  const titleText = "Batalla Naval" + (S.mode === "local" ? ` \u2014 Jugador ${S.curPlayer + 1}` : "");
  win.appendChild(el("div", { className: "titlebar" },
    el("div", { className: "titlebar-text" }, "\u{1F4A3} ", el("span", {}, titleText)),
    el("div", { className: "titlebar-btns" },
      el("button", { className: "titlebar-btn" }, "_"),
      el("button", { className: "titlebar-btn" }, "\u25A1"),
      el("button", { className: "titlebar-btn" }, "\u00D7")
    )
  ));

  // ===== Menu Bar =====
  win.appendChild(renderMenuBar());

  // ===== Control Bar =====
  const leftLabel = S.mode === "local" ? "J1" : "ENEMIGO";
  const leftVal = S.mode === "local" ? SHIPS.length - countSunk(S.grids[1]) : SHIPS.length - countSunk(enemyGrid);
  const rightLabel = S.mode === "local" ? "J2" : "PROPIOS";
  const rightVal = S.mode === "local" ? SHIPS.length - countSunk(S.grids[0]) : SHIPS.length - countSunk(myGrid);

  win.appendChild(el("div", { className: "control-bar" },
    el("div", { className: "control-bar-inner" },
      renderLED(leftLabel, leftVal),
      el("button", { className: "face-btn", onClick: () => { S.showConfirm = true; render(); },
        onMousedown: () => { S.face = FACE.pressed; render(); },
        onMouseup: () => { S.face = S.winner !== null ? FACE.win : FACE.normal; render(); },
      }, S.face),
      renderLED(rightLabel, rightVal)
    )
  ));

  // ===== Game Area =====
  const body = el("div", { className: "game-body" });
  const area = el("div", { className: "game-area" });

  // Placement info
  if (S.phase === "placing" && S.curShip < SHIPS.length) {
    const ship = SHIPS[S.curShip];
    const info = el("div", { className: "place-info" });
    info.innerHTML = `${S.mode === "local" ? `J${S.placingP + 1}: ` : ""}Ubicá el <b>${ship.name}</b> (${ship.size} casillas)`;
    const btnRow = el("div", { className: "btn-row" });
    btnRow.appendChild(el("button", { className: "btn", onClick: () => { S.horiz = !S.horiz; render(); } }, S.horiz ? "\u2194 Horizontal" : "\u2195 Vertical"));
    btnRow.appendChild(el("button", { className: "btn", onClick: autoPlaceShips }, "Al azar"));
    info.appendChild(btnRow);
    area.appendChild(info);
  }

  // Game Over banner
  if (S.phase === "gameover") {
    const banner = el("div", { className: "gameover-banner" });
    banner.appendChild(el("div", { className: "titlebar" },
      el("span", { className: "titlebar-text" }, (isWin ? "\u{1F3C6}" : "\u{1F480}") + " ", el("span", {}, isWin ? "Victoria" : "Derrota"))
    ));
    const gbody = el("div", { className: "gameover-body" });
    gbody.appendChild(el("span", { className: "face" }, isWin ? FACE.win : FACE.lose));
    const info = el("div", { className: "info" });
    const msgText = S.mode === "local" ? `\u00A1Jugador ${S.winner + 1} gana!` : isWin ? "\u00A1Hundiste toda la flota!" : "Tu flota fue destruida.";
    info.appendChild(el("b", {}, msgText));
    info.appendChild(el("div", { className: "time" }, `Tiempo: ${S.timer}s`));
    gbody.appendChild(info);
    banner.appendChild(gbody);
    const btns = el("div", { className: "gameover-btns" });
    btns.appendChild(el("button", { className: "btn", onClick: () => startGame(S.mode) }, "Revancha"));
    btns.appendChild(el("button", { className: "btn", onClick: resetToMenu }, "Menú"));
    banner.appendChild(btns);
    area.appendChild(banner);
  }

  // Status msg
  if (S.phase === "playing" || S.phase === "placing") {
    const msg = el("div", { className: "status-msg" + (S.locked ? " locked" : "") });
    msg.textContent = statusMsg();
    if (S.phase === "playing") {
      const t = el("span", { style: { fontWeight: "normal", color: "#666", marginLeft: "8px" } }, `\u23F1 ${S.timer}s`);
      msg.appendChild(t);
    }
    area.appendChild(msg);
  }

  // Radar toast
  if (S.radarResult) {
    const isClean = S.radarResult.includes("limpia");
    area.appendChild(el("div", { className: `radar-toast ${isClean ? "clean" : "found"}` }, S.radarResult));
  }

  // Power-Up bar
  if (S.phase === "playing" && isMyTurn) {
    const puBar = renderPUBar(myPups);
    if (puBar) area.appendChild(puBar);
  }

  // ===== GRIDS =====
  if (S.mode === "local" && (S.phase === "playing" || S.phase === "gameover")) {
    if (mob) {
      // Tabs
      const tabs = el("div", { className: "tab-row" });
      tabs.appendChild(el("button", { className: `btn ${S.activeTab === "j1" ? "active" : ""}`, onClick: () => { S.activeTab = "j1"; render(); } }, "J1 ataca"));
      tabs.appendChild(el("button", { className: `btn ${S.activeTab === "j2" ? "active" : ""}`, onClick: () => { S.activeTab = "j2"; render(); } }, "J2 ataca"));
      area.appendChild(tabs);
      area.appendChild(el("div", { className: "grid-center" },
        S.activeTab === "j1"
          ? renderGridEl(S.grids[1], true, "J1 ATACA", cellSz, iconSz, { flagsParam: S.flags[0], disabled: S.curPlayer !== 0 })
          : renderGridEl(S.grids[0], true, "J2 ATACA", cellSz, iconSz, { flagsParam: S.flags[1], disabled: S.curPlayer !== 1 })
      ));
    } else {
      area.appendChild(el("div", { className: "grids-row" },
        renderGridEl(S.grids[1], true, "J1 ATACA", cellSz, iconSz, { flagsParam: S.flags[0], disabled: S.curPlayer !== 0 }),
        renderGridEl(S.grids[0], true, "J2 ATACA", cellSz, iconSz, { flagsParam: S.flags[1], disabled: S.curPlayer !== 1 })
      ));
    }
  } else if (mob && (S.phase === "playing" || S.phase === "gameover")) {
    const tabs = el("div", { className: "tab-row" });
    tabs.appendChild(el("button", { className: `btn ${S.activeTab === "player" ? "active" : ""}`, onClick: () => { S.activeTab = "player"; render(); } }, "Tu Flota"));
    tabs.appendChild(el("button", { className: `btn ${S.activeTab === "enemy" ? "active" : ""}`, onClick: () => { S.activeTab = "enemy"; render(); } }, "Enemiga"));
    area.appendChild(tabs);
    area.appendChild(el("div", { className: "grid-center" },
      S.activeTab === "player" ? renderGridEl(myGrid, false, "TU FLOTA", cellSz, iconSz) : renderGridEl(enemyGrid, true, "FLOTA ENEMIGA", cellSz, iconSz)
    ));
  } else if (mob && S.phase === "placing") {
    area.appendChild(el("div", { className: "grid-center" },
      renderGridEl(S.grids[S.placingP], false, S.mode === "local" ? `FLOTA J${S.placingP + 1}` : "TU FLOTA", cellSz, iconSz)
    ));
  } else {
    const row = el("div", { className: "grids-row" });
    if (S.phase === "placing") {
      row.appendChild(renderGridEl(S.grids[S.placingP], false, S.mode === "local" ? `FLOTA J${S.placingP + 1}` : "TU FLOTA", cellSz, iconSz));
    } else {
      row.appendChild(renderGridEl(myGrid, false, "TU FLOTA", cellSz, iconSz));
    }
    if (S.phase === "playing" || S.phase === "gameover") {
      row.appendChild(renderGridEl(enemyGrid, true, "FLOTA ENEMIGA", cellSz, iconSz));
    }
    area.appendChild(row);
  }

  // Ship legend
  area.appendChild(renderShipLegend(mob));

  body.appendChild(area);
  win.appendChild(body);

  // ===== Status Bar =====
  win.appendChild(renderStatusBar(mob));

  root.appendChild(win);

  // ===== Confirm Dialog =====
  if (S.showConfirm) root.appendChild(renderConfirmDialog());

  return root;
}

// ===== COMPONENTS =====

function renderLED(label, value) {
  const s = String(Math.max(0, value)).padStart(2, "0");
  const wrap = el("div", { className: "led-wrap" });
  wrap.appendChild(el("span", { className: "led-label" }, label));
  const led = el("div", { className: "led" });
  for (const d of s) led.appendChild(el("span", { className: "led-digit" }, d));
  wrap.appendChild(led);
  return wrap;
}

function renderMenuBar() {
  const bar = el("div", { className: "menubar", onClick: (e) => e.stopPropagation() });

  // Juego menu
  const juegoWrap = el("div", { style: { position: "relative" } });
  const juegoBtn = el("button", { className: `menu-trigger ${S.menuOpen === "juego" ? "active" : ""}`, onClick: (e) => { e.stopPropagation(); S.menuOpen = S.menuOpen === "juego" ? null : "juego"; render(); } }, "Juego");
  juegoWrap.appendChild(juegoBtn);
  if (S.menuOpen === "juego") {
    const dd = el("div", { className: "menu-dropdown" });
    dd.appendChild(el("button", { className: "menu-item", onClick: () => { S.showConfirm = true; S.menuOpen = null; render(); } }, "Nuevo juego"));
    dd.appendChild(el("div", { className: "menu-sep" }));
    dd.appendChild(el("button", { className: "menu-item", onClick: () => { resetToMenu(); } }, "Volver al menú"));
    juegoWrap.appendChild(dd);
  }
  bar.appendChild(juegoWrap);

  // Ayuda menu
  const ayudaWrap = el("div", { style: { position: "relative" } });
  const ayudaBtn = el("button", { className: `menu-trigger ${S.menuOpen === "ayuda" ? "active" : ""}`, onClick: (e) => { e.stopPropagation(); S.menuOpen = S.menuOpen === "ayuda" ? null : "ayuda"; render(); } }, "Ayuda");
  ayudaWrap.appendChild(ayudaBtn);
  if (S.menuOpen === "ayuda") {
    const dd = el("div", { className: "menu-dropdown menu-help", innerHTML: `<b>Batalla Naval v2.2 \u2014 12\u00D712</b>
${ICONS.mine(12)} impacto \u00B7 ${ICONS.water(12)} agua \u00B7 ${ICONS.flag(12)} detectado<br>
Hundí barcos para ganar power-ups<br>
\u{1F6A9} Radar: escaneá 3\u00D73, marca con banderas<br>
\u{1F4A3} Bomba: ataque 3\u00D73<br>
\u271B Cruz: ataque en + (9 celdas)<br>
Si pegás, tirás de nuevo` });
    ayudaWrap.appendChild(dd);
  }
  bar.appendChild(ayudaWrap);

  return bar;
}

function renderPUBar(pups) {
  const items = [
    { key: "radar", label: "\u{1F6A9} Radar", count: pups.radar },
    { key: "cross", label: "\u271B Cruz", count: pups.cross },
    { key: "bomb",  label: "\u{1F4A3} Bomba", count: pups.bomb },
  ];
  if (!items.some(i => i.count > 0)) return null;

  const bar = el("div", { className: "pu-bar" });
  bar.appendChild(el("span", { className: "pu-label" }, "POWER-UPS:"));
  for (const it of items) {
    if (it.count > 0) {
      bar.appendChild(el("button", {
        className: `btn ${S.activePU === it.key ? "active" : ""}`,
        style: { fontSize: "11px", padding: "3px 8px" },
        onClick: () => { SFX.click(); S.activePU = S.activePU === it.key ? null : it.key; render(); }
      }, `${it.label} x${it.count}`));
    }
  }
  if (S.activePU) {
    bar.appendChild(el("span", { className: "pu-hint" },
      S.activePU === "radar" ? "Escaneá 3x3 (no gasta turno)" : "Elegí dónde atacar"));
  }
  return bar;
}

function renderGridEl(grid, isEnemy, label, cellSz, iconSz, opts = {}) {
  const { flagsParam, disabled } = opts;
  const mob = isMobile();
  const hcw = cellSz + (mob ? 2 : 4);
  const rlw = Math.max(16, cellSz - 6);
  const flags = flagsParam || S.flags[S.curPlayer];

  const wrap = el("div", { className: `grid-wrap ${disabled ? "grid-disabled" : ""}` });
  wrap.appendChild(el("div", { className: "grid-label" }, label));

  const outer = el("div", { className: "grid-outer" });

  // Col labels
  const colRow = el("div", { className: "grid-cols", style: { paddingLeft: rlw + "px" } });
  for (let i = 0; i < G; i++) {
    colRow.appendChild(el("div", { className: "col-lbl", style: { width: hcw + "px", fontSize: mob ? "7px" : "9px" } }, String.fromCharCode(65 + i)));
  }
  outer.appendChild(colRow);

  // Rows
  for (let r = 0; r < G; r++) {
    const row = el("div", { className: "grid-row", style: { display: "flex", alignItems: "center" } });
    row.appendChild(el("div", { className: "row-lbl", style: { width: rlw + "px", fontSize: mob ? "7px" : "9px" } }, String(r + 1)));

    for (let c = 0; c < G; c++) {
      const cell = grid[r][c];
      const isHov = S.hoverCells.some(([rr, cc]) => rr === r && cc === c);
      const isMyTurn = S.mode === "ai" ? S.curPlayer === 0 && !S.locked : true;

      // Determine cell classes and background
      let cls = "cell";
      let bg = "#c0c0c0";
      if (cell.hit && cell.ship !== null) { cls += " cell-flat cell-hit"; }
      else if (cell.miss) { cls += " cell-flat cell-miss"; }
      else {
        cls += " cell-raised";
        if (!isEnemy && cell.ship !== null) bg = "#808080";
      }

      if (isHov && S.phase === "placing" && !isEnemy) {
        bg = S.hoverValid ? "#6a96d4" : "#d46a6a";
      }
      if (isEnemy && S.activePU && isHov) {
        bg = S.activePU === "radar" ? "#90ee90" : "#ffa500";
      }

      const cursor = (!isEnemy && S.phase === "placing") || (isEnemy && S.phase === "playing" && isMyTurn) ? "pointer" : "default";

      const cellEl = el("div", {
        className: cls,
        style: { width: cellSz + "px", height: cellSz + "px", background: bg, cursor: cursor },
        onClick: () => {
          if (!isEnemy && S.phase === "placing") handlePlaceClick(r, c);
          if (isEnemy && S.phase === "playing" && !disabled) playerShoot(r, c);
        },
        onMouseenter: () => {
          if (!isEnemy && S.phase === "placing") handlePlaceHover(r, c);
          if (isEnemy && S.activePU && !mob && !disabled) { S.hoverCells = [[r, c]]; render(); }
        },
        onMouseleave: () => {
          if (S.phase === "placing" || S.activePU) { S.hoverCells = []; render(); }
        }
      });

      // Cell content
      if (cell.hit && cell.ship !== null) cellEl.innerHTML = ICONS.mine(iconSz);
      else if (cell.miss) cellEl.innerHTML = ICONS.water(iconSz);
      else if (isEnemy && flags[r] && flags[r][c] && !cell.hit) cellEl.innerHTML = ICONS.flag(iconSz);
      else if (!isEnemy && cell.ship !== null) cellEl.innerHTML = ICONS.ship(iconSz - 2);

      row.appendChild(cellEl);
    }
    outer.appendChild(row);
  }

  wrap.appendChild(outer);
  return wrap;
}

function renderShipLegend(mob) {
  const enemyGrid = S.grids[1 - S.curPlayer];
  const legend = el("div", { className: "ship-legend" });
  for (let i = 0; i < SHIPS.length; i++) {
    const ship = SHIPS[i];
    const sunk = S.phase !== "placing" && shipSunk(enemyGrid, i) && enemyGrid.some(r => r.some(c => c.ship === i));
    const item = el("div", { className: `ship-legend-item ${sunk ? "sunk" : ""}` });

    const nameEl = el("span", { style: { fontWeight: S.curShip === i && S.phase === "placing" ? "bold" : "normal" } }, mob ? ship.name.slice(0, 3) : ship.name);
    item.appendChild(nameEl);

    const dots = el("span", { style: { display: "flex", gap: "1px" } });
    for (let j = 0; j < ship.size; j++) {
      dots.appendChild(el("span", { className: "ship-dot", style: { background: sunk ? "#f00" : "#808080" } }));
    }
    item.appendChild(dots);

    if (sunk) {
      const reward = ship.reward === "bomb" ? "\u{1F4A3}" : ship.reward === "cross" ? "\u271B" : "\u{1F6A9}";
      item.appendChild(el("span", { style: { fontSize: "8px" } }, `\u2192${reward}`));
    }
    legend.appendChild(item);
  }
  return legend;
}

function renderStatusBar(mob) {
  const myPups = S.pups[S.curPlayer];
  const isMyTurn = S.mode === "ai" ? S.curPlayer === 0 && !S.locked : true;
  const isWin = S.winner === S.curPlayer || (S.mode === "ai" && S.winner === 0);

  let statusText;
  if (S.phase === "placing") statusText = `Barcos: ${S.curShip}/${SHIPS.length}`;
  else if (S.phase === "gameover") statusText = isWin ? "Victoria" : "Derrota";
  else if (S.mode === "local") statusText = `Turno J${S.curPlayer + 1}`;
  else statusText = S.locked ? "Turno enemigo" : "Tu turno";

  const bar = el("div", { className: "statusbar" });
  bar.appendChild(el("div", { className: "statusbar-panel flex" }, statusText));
  bar.appendChild(el("div", { className: "statusbar-panel" }, `\u{1F6A9}${myPups.radar} \u271B${myPups.cross} \u{1F4A3}${myPups.bomb}`));
  bar.appendChild(el("div", { className: "statusbar-panel right", style: { width: mob ? "45px" : "65px" } }, `\u23F1${S.timer}s`));
  bar.appendChild(el("div", { className: "statusbar-panel click", onClick: () => { S.muted = SFX.toggle(); render(); } }, S.muted ? "\u{1F507}" : "\u{1F50A}"));
  return bar;
}

function renderConfirmDialog() {
  return el("div", { className: "dialog-overlay" },
    el("div", { className: "win dialog" },
      el("div", { className: "titlebar" },
        el("span", { className: "titlebar-text" }, "\u26A0\uFE0F ", el("span", {}, "Batalla Naval"))
      ),
      el("div", { style: { padding: "12px 16px" } },
        el("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" } },
          el("span", { style: { fontSize: "32px" } }, "\u26A0\uFE0F"),
          el("span", { style: { fontSize: "12px" } }, "\u00BFQuerés abandonar la partida?")
        ),
        el("div", { style: { display: "flex", justifyContent: "center", gap: "8px" } },
          el("button", { className: "btn", style: { minWidth: "75px" }, onClick: () => startGame(S.mode) }, "Sí"),
          el("button", { className: "btn", style: { minWidth: "75px" }, onClick: () => { S.showConfirm = false; render(); } }, "No")
        )
      )
    )
  );
}

function statusMsg() {
  if (S.phase === "placing") return (S.mode === "local" ? `J${S.placingP + 1}: ` : "") + "Ubicá tus barcos";
  if (S.phase !== "playing") return "";
  if (S.mode === "ai") {
    if (S.face === FACE.hit) return "\u{1F4A5} \u00A1Impacto! Tirás de nuevo";
    if (S.face === FACE.hurt) return "\u{1F4A5} \u00A1Te pegaron! Tiran de nuevo...";
    if (S.locked) return "\u23F3 Turno enemigo...";
    if (S.activePU) return `Usando ${S.activePU.toUpperCase()}`;
    return "\u25B6 Tu turno";
  }
  if (S.face === FACE.hit) return `\u{1F4A5} J${S.curPlayer + 1} tira de nuevo`;
  if (S.activePU) return `J${S.curPlayer + 1}: ${S.activePU.toUpperCase()}`;
  return `\u25B6 Turno J${S.curPlayer + 1}`;
}

// ===== GAME ACTIONS =====

function startGame(mode) {
  clearInterval(timerInterval);
  Object.assign(S, {
    mode: mode, phase: "placing",
    grids: [mkGrid(), mode === "ai" ? randomPlace() : mkGrid()],
    flags: [mkFlags(), mkFlags()],
    pups: [{ ...INIT_PUPS }, { ...INIT_PUPS }],
    activePU: null, curPlayer: 0, placingP: 0, curShip: 0, horiz: true,
    face: FACE.normal, winner: null, aiHits: [],
    rewarded: [new Set(), new Set()],
    timer: 0, timerOn: false, menuOpen: null, activeTab: "player",
    showConfirm: false, radarResult: null, hoverCells: [], locked: false,
  });
  render();
}

function resetToMenu() {
  clearInterval(timerInterval);
  Object.assign(S, { phase: "menu", mode: null, showConfirm: false, timerOn: false, menuOpen: null });
  render();
}

function finishPlacing() {
  const mob = isMobile();
  if (S.mode === "ai") {
    S.phase = "playing"; S.timerOn = true; S.curPlayer = 0; S.activeTab = mob ? "enemy" : "player";
    startTimer();
    render();
  } else {
    if (S.placingP === 0) {
      S.phase = "passing"; S.passMsg = "Pasale el dispositivo al Jugador 2"; S.passNext = "place2";
    } else {
      S.phase = "passing"; S.passMsg = "Pasale el dispositivo al Jugador 1 para empezar"; S.passNext = "startPlay";
    }
    render();
  }
}

function handlePassConfirm() {
  const mob = isMobile();
  if (S.passNext === "place2") {
    S.placingP = 1; S.curShip = 0; S.horiz = true; S.phase = "placing";
  } else if (S.passNext === "startPlay") {
    S.curPlayer = 0; S.phase = "playing"; S.timerOn = true;
    S.activeTab = mob ? "j1" : "player";
    startTimer();
  }
  render();
}

function autoPlaceShips() {
  S.grids[S.placingP] = randomPlace();
  S.curShip = SHIPS.length;
  SFX.click();
  render();
  finishPlacing();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (S.timerOn) { S.timer = Math.min(S.timer + 1, 999); render(); }
  }, 1000);
}

function handlePlaceClick(r, c) {
  if (S.phase !== "placing" || S.curShip >= SHIPS.length) return;
  const sz = SHIPS[S.curShip].size;
  if (!canPlace(S.grids[S.placingP], r, c, sz, S.horiz)) { SFX.error(); return; }
  SFX.click();
  S.grids[S.placingP] = doPlace(S.grids[S.placingP], r, c, sz, S.horiz, S.curShip);
  S.hoverCells = [];
  S.curShip++;
  render();
  if (S.curShip >= SHIPS.length) finishPlacing();
}

function handlePlaceHover(r, c) {
  if (S.phase !== "placing" || S.curShip >= SHIPS.length || isMobile()) return;
  const sz = SHIPS[S.curShip].size, cells = [];
  for (let i = 0; i < sz; i++) { const rr = S.horiz ? r : r + i, cc = S.horiz ? c + i : c; if (rr < G && cc < G) cells.push([rr, cc]); }
  S.hoverCells = cells;
  S.hoverValid = canPlace(S.grids[S.placingP], r, c, sz, S.horiz);
  render();
}

function checkRewards(attacker, targetGrid) {
  let anySunk = false;
  for (let si = 0; si < SHIPS.length; si++) {
    if (shipSunk(targetGrid, si) && !S.rewarded[attacker].has(si)) {
      S.rewarded[attacker].add(si);
      S.pups[attacker][SHIPS[si].reward]++;
      anySunk = true;
    }
  }
  if (anySunk) setTimeout(() => SFX.sunk(), 100);
}

function clearHitFlags(playerIdx, grid) {
  const f = S.flags[playerIdx];
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) if (grid[r][c].hit) f[r][c] = false;
}

function endTurn() {
  S.activePU = null;
  if (S.mode === "ai") {
    S.locked = true; render();
    setTimeout(() => doAITurn(), 600);
  } else {
    const next = 1 - S.curPlayer;
    const mob = isMobile();
    S.curPlayer = next; S.activePU = null; S.face = FACE.normal; S.locked = false; S.radarResult = null;
    S.activeTab = mob ? (next === 0 ? "j1" : "j2") : S.activeTab;
    render();
  }
}

function endGame(w) {
  clearInterval(timerInterval);
  const isWinner = S.mode === "ai" ? w === 0 : true;
  setTimeout(() => isWinner ? SFX.win() : SFX.lose(), 300);
  S.winner = w; S.face = FACE.win; S.phase = "gameover"; S.timerOn = false; S.locked = false;
  render();
}

// ===== PLAYER SHOOT =====
function playerShoot(r, c) {
  if (S.phase !== "playing" || S.winner || S.locked) return;
  if (S.mode === "ai" && S.curPlayer !== 0) return;

  const ei = 1 - S.curPlayer;
  const eg = S.grids[ei];
  if (eg[r][c].hit || eg[r][c].miss) { SFX.error(); return; }

  // RADAR
  if (S.activePU === "radar") {
    SFX.radar();
    const result = doRadar(S.flags[S.curPlayer], eg, r, c);
    S.flags[S.curPlayer] = result.flags;
    S.pups[S.curPlayer].radar--;
    S.activePU = null;
    S.radarResult = result.found > 0 ? `\u{1F6A9} Radar: ${result.found} barco${result.found > 1 ? "s" : ""} detectado${result.found > 1 ? "s" : ""}!` : "\u{1F4E1} Radar: zona limpia";
    render();
    setTimeout(() => { S.radarResult = null; render(); }, 2000);
    return;
  }

  // BOMB / CROSS
  if (S.activePU === "bomb" || S.activePU === "cross") {
    SFX.bigBoom();
    const res = areaAttack(eg, r, c, S.activePU);
    S.grids[ei] = res.grid;
    S.pups[S.curPlayer][S.activePU]--;
    S.activePU = null;
    checkRewards(S.curPlayer, res.grid);
    clearHitFlags(S.curPlayer, res.grid);
    if (allSunk(res.grid)) { endGame(S.curPlayer); return; }
    if (res.anyHit) { S.face = FACE.hit; render(); return; }
    render(); endTurn(); return;
  }

  // NORMAL SHOT
  const g = cloneG(eg);
  const cell = g[r][c];
  const wasHit = cell.ship !== null;
  if (wasHit) { cell.hit = true; S.face = FACE.hit; SFX.hit(); } else { cell.miss = true; S.face = FACE.normal; SFX.miss(); }
  S.grids[ei] = g;
  checkRewards(S.curPlayer, g);
  clearHitFlags(S.curPlayer, g);
  if (allSunk(g)) { endGame(S.curPlayer); return; }
  if (wasHit) { render(); return; } // extra turn
  render(); endTurn();
}

// ===== AI TURN =====
function doAITurn() {
  const mob = isMobile();
  S.face = FACE.think;
  if (mob) S.activeTab = "player";
  render();

  setTimeout(() => {
    const target = S.grids[0];
    const aiP = S.pups[1];
    let usedPU = null;

    if (aiP.bomb > 0 && S.aiHits.length >= 2 && Math.random() < 0.6) usedPU = "bomb";
    else if (aiP.cross > 0 && S.aiHits.length >= 1 && Math.random() < 0.4) usedPU = "cross";

    if (usedPU) {
      const center = S.aiHits.length > 0 ? S.aiHits[0] : getAIMove(target, S.aiHits);
      if (!center) { S.locked = false; render(); return; }
      SFX.bigBoom();
      const res = areaAttack(target, center[0], center[1], usedPU);
      S.grids[0] = res.grid; aiP[usedPU]--;
      checkRewards(1, res.grid);
      for (let si = 0; si < SHIPS.length; si++) if (shipSunk(res.grid, si)) S.aiHits = S.aiHits.filter(([hr, hc]) => res.grid[hr][hc].ship !== si);
      for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) {
        if (res.grid[r][c].hit && !target[r][c].hit && res.grid[r][c].ship !== null && !S.aiHits.some(([hr, hc]) => hr === r && hc === c)) S.aiHits.push([r, c]);
      }
      S.face = res.anyHit ? FACE.hurt : FACE.normal;
      render();
      if (allSunk(res.grid)) { setTimeout(() => SFX.lose(), 300); S.winner = 1; S.face = FACE.lose; S.phase = "gameover"; S.timerOn = false; S.locked = false; render(); return; }
      if (res.anyHit) { setTimeout(() => doAITurn(), 700); return; }
      S.curPlayer = 0; S.locked = false; S.face = FACE.normal;
      if (mob) setTimeout(() => { S.activeTab = "enemy"; render(); }, 800); else render();
      return;
    }

    if (aiP.radar > 0 && S.aiHits.length === 0 && Math.random() < 0.4) {
      aiP.radar--;
      setTimeout(() => doAITurn(), 300); return;
    }

    const move = getAIMove(target, S.aiHits);
    if (!move) { S.locked = false; render(); return; }
    const [mr, mc] = move;
    const g = cloneG(target); const cell = g[mr][mc];
    if (cell.ship !== null) {
      cell.hit = true; S.aiHits.push([mr, mc]);
      if (shipSunk(g, cell.ship)) S.aiHits = S.aiHits.filter(([hr, hc]) => g[hr][hc].ship !== cell.ship);
      S.face = FACE.hurt; SFX.hit();
    } else { cell.miss = true; S.face = FACE.normal; SFX.miss(); }
    S.grids[0] = g;
    checkRewards(1, g);
    render();
    if (allSunk(g)) { setTimeout(() => SFX.lose(), 300); S.winner = 1; S.face = FACE.lose; S.phase = "gameover"; S.timerOn = false; S.locked = false; render(); return; }
    if (cell.ship !== null) { setTimeout(() => doAITurn(), 700); return; }
    S.curPlayer = 0; S.locked = false;
    if (mob) setTimeout(() => { S.activeTab = "enemy"; render(); }, 800); else render();
  }, 500);
}

// ===== KEYBOARD =====
window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") { S.horiz = !S.horiz; render(); }
});

// ===== RESIZE =====
window.addEventListener("resize", () => { if (S.phase !== "menu") render(); });

// ===== INIT =====
document.addEventListener("DOMContentLoaded", render);
