// ===== CONSTANTS =====
const GRID_SIZE = 10;
const SHIPS = [
  { name: 'Portaaviones', size: 5 },
  { name: 'Acorazado',    size: 4 },
  { name: 'Crucero',      size: 3 },
  { name: 'Submarino',    size: 3 },
  { name: 'Destructor',   size: 2 },
];

// ===== STATE =====
let state = {
  phase: 'placement',   // 'placement' | 'battle' | 'gameover'
  playerBoard: [],      // 10x10 array of cell objects
  enemyBoard: [],
  playerShips: [],
  enemyShips: [],
  placedShips: [],      // indices into SHIPS already placed by player
  currentShipIdx: 0,
  horizontal: true,
  playerHits: 0,
  enemyHits: 0,
  playerTurn: true,
};

// ===== INIT =====
function createBoard() {
  return Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => ({
      row: r, col: c,
      hasShip: false,
      shipId: null,
      hit: false,
    }))
  );
}

function initGame() {
  state = {
    phase: 'placement',
    playerBoard: createBoard(),
    enemyBoard: createBoard(),
    playerShips: [],
    enemyShips: [],
    placedShips: [],
    currentShipIdx: 0,
    horizontal: true,
    playerHits: 0,
    enemyHits: 0,
    playerTurn: true,
  };

  renderBoard('player-grid', state.playerBoard, true);
  renderBoard('enemy-grid', state.enemyBoard, false);
  placeEnemyShips();
  updateShipSelect();
  updateUI();

  document.getElementById('ship-controls').style.display = '';
  document.getElementById('start-btn').disabled = true;
  document.getElementById('status-msg').textContent =
    'Coloca tus barcos. Haz clic en tu grilla para posicionarlos.';
  document.getElementById('status-turn').textContent = 'Fase: Colocación';
  document.getElementById('player-hits').textContent = '0';
  document.getElementById('enemy-hits').textContent = '0';
  document.getElementById('enemy-ships').textContent = SHIPS.length;
}

// ===== RENDER =====
function renderBoard(gridId, board, isPlayer) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const data = board[r][c];

      if (data.hit) {
        if (data.hasShip) {
          const ship = (isPlayer ? state.playerShips : state.enemyShips)
            .find(s => s.id === data.shipId);
          cell.classList.add(ship && ship.sunk ? 'sunk' : 'hit');
        } else {
          cell.classList.add('miss');
        }
      } else if (isPlayer && data.hasShip) {
        cell.classList.add('ship');
      }

      if (isPlayer) {
        cell.addEventListener('click', onPlayerCellClick);
        cell.addEventListener('mouseover', onPlayerCellHover);
        cell.addEventListener('mouseout', onPlayerCellOut);
      } else {
        cell.addEventListener('click', onEnemyCellClick);
      }

      grid.appendChild(cell);
    }
  }
}

function updateUI() {
  document.getElementById('player-hits').textContent = state.playerHits;
  document.getElementById('enemy-hits').textContent = state.enemyHits;
  const remaining = state.enemyShips.filter(s => !s.sunk).length;
  document.getElementById('enemy-ships').textContent = remaining;
}

function updateShipSelect() {
  const sel = document.getElementById('ship-select');
  sel.innerHTML = '';
  SHIPS.forEach((ship, i) => {
    if (!state.placedShips.includes(i)) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${ship.name} (${ship.size})`;
      sel.appendChild(opt);
    }
  });
  // Set currentShipIdx to first available
  if (sel.options.length > 0) {
    state.currentShipIdx = parseInt(sel.options[0].value);
  }
}

// ===== PLACEMENT =====
function getCells(row, col, size, horizontal) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push(horizontal ? [row, col + i] : [row + i, col]);
  }
  return cells;
}

function isValidPlacement(board, row, col, size, horizontal, excludeShipId = null) {
  const cells = getCells(row, col, size, horizontal);
  for (const [r, c] of cells) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (board[r][c].hasShip && board[r][c].shipId !== excludeShipId) return false;
  }
  return true;
}

function placeShip(board, ships, row, col, size, horizontal, shipName) {
  const id = Date.now() + Math.random();
  const cells = getCells(row, col, size, horizontal);
  cells.forEach(([r, c]) => {
    board[r][c].hasShip = true;
    board[r][c].shipId = id;
  });
  ships.push({ id, name: shipName, size, cells, sunk: false });
  return id;
}

function onPlayerCellClick(e) {
  if (state.phase !== 'placement') return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const sel = document.getElementById('ship-select');
  if (sel.options.length === 0) return;

  state.currentShipIdx = parseInt(sel.value);
  const ship = SHIPS[state.currentShipIdx];

  if (!isValidPlacement(state.playerBoard, row, col, ship.size, state.horizontal)) return;

  placeShip(state.playerBoard, state.playerShips, row, col, ship.size, state.horizontal, ship.name);
  state.placedShips.push(state.currentShipIdx);

  renderBoard('player-grid', state.playerBoard, true);
  updateShipSelect();

  if (state.placedShips.length === SHIPS.length) {
    document.getElementById('start-btn').disabled = false;
    document.getElementById('status-msg').textContent =
      '¡Todos los barcos colocados! Presiona "Iniciar Batalla".';
  } else {
    document.getElementById('status-msg').textContent =
      `Coloca: ${SHIPS[state.currentShipIdx]?.name ?? 'siguiente barco'}`;
  }
}

function onPlayerCellHover(e) {
  if (state.phase !== 'placement') return;
  const sel = document.getElementById('ship-select');
  if (sel.options.length === 0) return;

  state.currentShipIdx = parseInt(sel.value);
  const ship = SHIPS[state.currentShipIdx];
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const valid = isValidPlacement(state.playerBoard, row, col, ship.size, state.horizontal);
  const cells = getCells(row, col, ship.size, state.horizontal);

  clearPreview();
  cells.forEach(([r, c]) => {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const el = getPlayerCell(r, c);
      if (el) el.classList.add(valid ? 'ship-preview' : 'ship-invalid');
    }
  });
}

function onPlayerCellOut() {
  clearPreview();
}

function clearPreview() {
  document.querySelectorAll('#player-grid .ship-preview, #player-grid .ship-invalid')
    .forEach(el => el.classList.remove('ship-preview', 'ship-invalid'));
}

function getPlayerCell(r, c) {
  return document.querySelector(`#player-grid [data-row="${r}"][data-col="${c}"]`);
}

// ===== ENEMY PLACEMENT =====
function placeEnemyShips() {
  SHIPS.forEach(ship => {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (isValidPlacement(state.enemyBoard, row, col, ship.size, horizontal)) {
        placeShip(state.enemyBoard, state.enemyShips, row, col, ship.size, horizontal, ship.name);
        placed = true;
      }
    }
  });
}

// ===== RANDOM PLACEMENT =====
function placePlayerRandom() {
  // Clear existing
  state.playerBoard = createBoard();
  state.playerShips = [];
  state.placedShips = [];

  SHIPS.forEach((ship, i) => {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (isValidPlacement(state.playerBoard, row, col, ship.size, horizontal)) {
        placeShip(state.playerBoard, state.playerShips, row, col, ship.size, horizontal, ship.name);
        state.placedShips.push(i);
        placed = true;
      }
    }
  });

  renderBoard('player-grid', state.playerBoard, true);
  updateShipSelect();
  document.getElementById('start-btn').disabled = false;
  document.getElementById('status-msg').textContent =
    '¡Barcos colocados aleatoriamente! Presiona "Iniciar Batalla".';
}

// ===== BATTLE =====
function startBattle() {
  if (state.placedShips.length < SHIPS.length) return;
  state.phase = 'battle';
  state.playerTurn = true;
  document.getElementById('ship-controls').style.display = 'none';
  document.getElementById('start-btn').disabled = true;
  document.getElementById('status-msg').textContent = '¡La batalla ha comenzado! Ataca la flota enemiga.';
  document.getElementById('status-turn').textContent = 'Turno: Jugador';
}

function onEnemyCellClick(e) {
  if (state.phase !== 'battle' || !state.playerTurn) return;

  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const cell = state.enemyBoard[row][col];

  if (cell.hit) return;

  cell.hit = true;
  let msg = '';

  if (cell.hasShip) {
    state.playerHits++;
    const ship = state.enemyShips.find(s => s.id === cell.shipId);
    const allHit = ship.cells.every(([r, c]) => state.enemyBoard[r][c].hit);
    if (allHit) {
      ship.sunk = true;
      ship.cells.forEach(([r, c]) => {
        const el = document.querySelector(`#enemy-grid [data-row="${r}"][data-col="${c}"]`);
        if (el) { el.className = 'cell sunk'; }
      });
      msg = `¡Hundiste el ${ship.name}!`;
      checkWin();
    } else {
      const el = document.querySelector(`#enemy-grid [data-row="${row}"][data-col="${col}"]`);
      if (el) el.className = 'cell hit';
      msg = '¡Impacto!';
    }
  } else {
    const el = document.querySelector(`#enemy-grid [data-row="${row}"][data-col="${col}"]`);
    if (el) el.className = 'cell miss';
    msg = 'Agua...';
  }

  updateUI();
  document.getElementById('status-msg').textContent = msg;

  if (state.phase === 'battle') {
    state.playerTurn = false;
    document.getElementById('status-turn').textContent = 'Turno: Enemigo';
    setTimeout(enemyTurn, 900);
  }
}

function enemyTurn() {
  if (state.phase !== 'battle') return;

  // Simple AI: hunt mode if there's a hit, else random
  let row, col;
  const unhitCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!state.playerBoard[r][c].hit) unhitCells.push([r, c]);
    }
  }

  // Look for adjacent unhit cells near existing hits
  const hitCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = state.playerBoard[r][c];
      if (cell.hit && cell.hasShip) {
        const ship = state.playerShips.find(s => s.id === cell.shipId);
        if (ship && !ship.sunk) hitCells.push([r, c]);
      }
    }
  }

  let candidates = [];
  if (hitCells.length > 0) {
    hitCells.forEach(([hr, hc]) => {
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        const nr = hr + dr, nc = hc + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE &&
            !state.playerBoard[nr][nc].hit) {
          candidates.push([nr, nc]);
        }
      });
    });
  }

  if (candidates.length > 0) {
    [row, col] = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    [row, col] = unhitCells[Math.floor(Math.random() * unhitCells.length)];
  }

  const cell = state.playerBoard[row][col];
  cell.hit = true;
  let msg = '';

  if (cell.hasShip) {
    state.enemyHits++;
    const ship = state.playerShips.find(s => s.id === cell.shipId);
    const allHit = ship.cells.every(([r, c]) => state.playerBoard[r][c].hit);
    if (allHit) {
      ship.sunk = true;
      ship.cells.forEach(([r, c]) => {
        const el = document.querySelector(`#player-grid [data-row="${r}"][data-col="${c}"]`);
        if (el) { el.className = 'cell sunk'; }
      });
      msg = `¡El enemigo hundió tu ${ship.name}!`;
      checkLoss();
    } else {
      const el = document.querySelector(`#player-grid [data-row="${row}"][data-col="${col}"]`);
      if (el) el.className = 'cell hit';
      msg = '¡El enemigo te impactó!';
    }
  } else {
    const el = document.querySelector(`#player-grid [data-row="${row}"][data-col="${col}"]`);
    if (el) el.className = 'cell miss';
    msg = 'El enemigo falló.';
  }

  updateUI();
  document.getElementById('status-msg').textContent = msg;

  if (state.phase === 'battle') {
    state.playerTurn = true;
    document.getElementById('status-turn').textContent = 'Turno: Jugador';
  }
}

function checkWin() {
  if (state.enemyShips.every(s => s.sunk)) {
    state.phase = 'gameover';
    showDialog('¡Victoria!', '🏆 ¡Hundiste toda la flota enemiga!\n¡Eres el almirante de la victoria!');
    document.getElementById('status-turn').textContent = 'Fase: Fin de partida';
  }
}

function checkLoss() {
  if (state.playerShips.every(s => s.sunk)) {
    state.phase = 'gameover';
    showDialog('¡Derrota!', '💀 ¡El enemigo hundió toda tu flota!\nMejor suerte en la próxima batalla.');
    document.getElementById('status-turn').textContent = 'Fase: Fin de partida';
  }
}

// ===== DIALOG =====
function showDialog(title, msg) {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-msg').textContent = msg;
  document.getElementById('dialog-overlay').style.display = 'flex';
}

function closeDialog() {
  document.getElementById('dialog-overlay').style.display = 'none';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  initGame();

  document.getElementById('rotate-btn').addEventListener('click', () => {
    state.horizontal = !state.horizontal;
    document.getElementById('rotate-btn').textContent =
      state.horizontal ? 'Rotar (H)' : 'Rotar (V)';
  });

  document.getElementById('random-btn').addEventListener('click', placePlayerRandom);

  document.getElementById('clear-btn').addEventListener('click', () => {
    state.playerBoard = createBoard();
    state.playerShips = [];
    state.placedShips = [];
    renderBoard('player-grid', state.playerBoard, true);
    updateShipSelect();
    document.getElementById('start-btn').disabled = true;
    document.getElementById('status-msg').textContent =
      'Coloca tus barcos. Haz clic en tu grilla para posicionarlos.';
  });

  document.getElementById('start-btn').addEventListener('click', startBattle);
  document.getElementById('new-game-btn').addEventListener('click', initGame);

  document.getElementById('ship-select').addEventListener('change', (e) => {
    state.currentShipIdx = parseInt(e.target.value);
  });

  document.getElementById('dialog-ok').addEventListener('click', closeDialog);
  document.getElementById('dialog-close').addEventListener('click', closeDialog);

  // Title bar controls (cosmetic)
  document.getElementById('close-btn').addEventListener('click', () => {
    showDialog('Salir', '¿Seguro que quieres cerrar el juego?\n(Recarga la página para volver a jugar)');
  });
});
