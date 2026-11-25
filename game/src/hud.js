// Copper Ladle Kitchen 3D — all DOM overlay: top HUD bar, order tickets,
// popups, rush banner, title / pause / game-over screens, bin labels.
import { formatTime, INGREDIENT_BY_ID, RECIPE_BY_ID } from './config.js';

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function createHud(callbacks) {
  const root = document.getElementById('hud');
  const overlayRoot = document.getElementById('overlay');
  const binRoot = document.getElementById('bin-labels');
  const cursorLabel = document.getElementById('cursor-label');
  const mismatchEl = document.getElementById('mismatch');

  // --- top bar --------------------------------------------------------------
  const topBar = el('div', 'top-bar');
  topBar.appendChild(el('div', 'game-title', 'COPPER LADLE KITCHEN'));
  const coinsEl = el('div', 'stat coins-stat');
  coinsEl.innerHTML = '<span class="coin-icon">●</span><span id="coins-value">0</span>';
  const scoreEl = el('div', 'stat', 'SCORE ');
  const scoreValue = el('span', '', '0');
  scoreValue.id = 'score-value';
  scoreEl.appendChild(scoreValue);
  const shiftEl = el('div', 'stat', 'SHIFT ');
  const shiftValue = el('span', '', '3:00');
  shiftValue.id = 'shift-value';
  shiftEl.appendChild(shiftValue);
  const comboEl = el('div', 'combo-badge', 'COMBO x2');
  comboEl.id = 'combo-badge';
  comboEl.style.display = 'none';
  const pauseBtn = el('button', 'hud-btn', 'II');
  pauseBtn.id = 'pause-btn';
  pauseBtn.title = 'Pause (P)';
  pauseBtn.addEventListener('click', () => callbacks.onPause());
  const muteBtn = el('button', 'hud-btn', '♪');
  muteBtn.id = 'mute-btn';
  muteBtn.title = 'Mute (M)';
  muteBtn.addEventListener('click', () => callbacks.onMute());
  topBar.append(coinsEl, scoreEl, shiftEl, comboEl, pauseBtn, muteBtn);
  root.appendChild(topBar);

  // --- order board ----------------------------------------------------------
  const board = el('div', 'order-board');
  board.id = 'order-board';
  root.appendChild(board);

  // --- centre popup + rush banner -------------------------------------------
  const popup = el('div', 'popup');
  popup.id = 'popup';
  popup.style.display = 'none';
  root.appendChild(popup);
  const banner = el('div', 'rush-banner');
  banner.id = 'rush-banner';
  banner.style.display = 'none';
  banner.textContent = 'RUSH HOUR! 1.5x COINS';
  root.appendChild(banner);
  const readyLabel = el('div', 'ready-label', 'READY TO SERVE!');
  readyLabel.id = 'ready-label';
  readyLabel.style.display = 'none';
  root.appendChild(readyLabel);

  // --- overlays ---------------------------------------------------------------
  const titleScreen = el('div', 'screen title-screen');
  titleScreen.id = 'title-screen';
  titleScreen.innerHTML =
    '<h1>COPPER LADLE KITCHEN</h1>' +
    '<p class="subtitle">A cozy 3D cooking game — serve hungry customers before their tickets run out!</p>' +
    '<p class="howto">1-6 pick ingredient • click board to chop • click plate or SPACE to add</p>' +
    '<p class="howto">SERVE a glowing ticket • X trash • P pause • M mute • R restart</p>' +
    '<p class="start-hint">CLICK TO START</p>' +
    '<p class="start-hint small">(or press Space / Enter)</p>';
  overlayRoot.appendChild(titleScreen);

  const pauseScreen = el('div', 'screen pause-screen');
  pauseScreen.id = 'pause-screen';
  pauseScreen.style.display = 'none';
  pauseScreen.innerHTML = '<h1>PAUSED</h1><p>press P to resume</p>';
  overlayRoot.appendChild(pauseScreen);

  const overScreen = el('div', 'screen over-screen');
  overScreen.id = 'over-screen';
  overScreen.style.display = 'none';
  overlayRoot.appendChild(overScreen);

  // --- bin labels (positioned by main.js from 3D projections) ----------------
  const binLabelEls = {};
  for (const ing of Object.values(INGREDIENT_BY_ID)) {
    const label = el('div', 'bin-label');
    label.innerHTML =
      `<strong>${ing.name}</strong><br>[${ing.key}] ` + (ing.needsChop ? 'chop first' : 'ready');
    binRoot.appendChild(label);
    binLabelEls[ing.id] = label;
  }

  let popupTimer = 0;
  let bannerTimer = 0;
  let lastTicketSig = null;

  function ticketSignature(state, matching) {
    // Include the matching order's uid so tickets rebuild the moment the
    // plate becomes (or stops being) a match for an order.
    return state.orders.map((o) => `${o.uid}:${o.recipeId}`).join('|') +
      `|match:${matching ? matching.uid : 'none'}`;
  }

  function buildTickets(state, matching) {
    board.innerHTML = '';
    if (state.orders.length === 0) {
      board.appendChild(el('div', 'waiting', 'Waiting for hungry customers...'));
      return;
    }
    for (const order of state.orders) {
      const recipe = RECIPE_BY_ID[order.recipeId];
      const ticket = el('div', 'ticket');
      ticket.dataset.uid = String(order.uid);
      // Only the one ticket the plate actually matches is ready.
      const ready = !!matching && matching.uid === order.uid && state.plate.length > 0;
      if (ready) ticket.classList.add('ready');
      const head = el('div', 'ticket-head');
      head.appendChild(el('span', 'ticket-name', recipe.name));
      head.appendChild(el('span', 'ticket-coins', `${recipe.coins} coins`));
      ticket.appendChild(head);
      const icons = el('div', 'ticket-icons');
      for (const step of recipe.steps) {
        const ing = INGREDIENT_BY_ID[step.ingredient];
        const dot = el('span', 'ing-dot', step.chopped ? 'C' : '');
        dot.style.background = ing.color;
        dot.title = `${ing.name}${step.chopped ? ' (chopped)' : ''}`;
        icons.appendChild(dot);
      }
      if (recipe.bowl) icons.appendChild(el('span', 'bowl-note', 'bowl'));
      ticket.appendChild(icons);
      const timeRow = el('div', 'ticket-time');
      const timeText = el('span', 'ticket-seconds', `${Math.ceil(order.timeLeft)}s`);
      const bar = el('div', 'ticket-bar');
      const fill = el('div', 'ticket-fill');
      bar.appendChild(fill);
      timeRow.append(timeText, bar);
      ticket.appendChild(timeRow);
      if (ready) {
        const serveBtn = el('button', 'serve-btn', 'SERVE');
        serveBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          callbacks.onServe();
        });
        ticket.appendChild(serveBtn);
      }
      board.appendChild(ticket);
    }
  }

  function update(state, info) {
    document.getElementById('coins-value').textContent = String(state.coins);
    scoreValue.textContent = String(state.score);
    shiftValue.textContent = formatTime(state.shiftLeft);
    shiftValue.classList.toggle('low', state.shiftLeft < 30);
    if (state.combo >= 2) {
      comboEl.style.display = '';
      comboEl.textContent = `COMBO x${state.combo}`;
    } else {
      comboEl.style.display = 'none';
    }
    muteBtn.textContent = info.muted ? '✕' : '♪';
    muteBtn.classList.toggle('muted', !!info.muted);

    const sig = ticketSignature(state, info.matching);
    if (sig !== lastTicketSig) {
      lastTicketSig = sig;
      buildTickets(state, info.matching);
    }
    // Per-frame ticket timers (cheap text/width updates).
    for (const order of state.orders) {
      const ticket = board.querySelector(`[data-uid="${order.uid}"]`);
      if (!ticket) continue;
      const frac = Math.max(0, order.timeLeft / order.timeMax);
      const secs = ticket.querySelector('.ticket-seconds');
      if (secs) secs.textContent = `${Math.ceil(order.timeLeft)}s`;
      const fill = ticket.querySelector('.ticket-fill');
      if (fill) {
        fill.style.width = `${frac * 100}%`;
        fill.style.background = frac > 0.5 ? '#2e9e4f' : frac > 0.25 ? '#e8a91c' : '#d43d2a';
      }
      ticket.classList.toggle('urgent', order.timeLeft <= 5);
      const serveBtn = ticket.querySelector('.serve-btn');
      // Only the ticket the plate matches keeps its SERVE button visible.
      if (serveBtn) {
        serveBtn.style.display = info.matching && info.matching.uid === order.uid ? '' : 'none';
      }
    }

    readyLabel.style.display = info.matching ? '' : 'none';
    mismatchEl.style.display = info.mismatch ? '' : 'none';
    if (popupTimer > 0) {
      popupTimer -= info.dt;
      if (popupTimer <= 0) popup.style.display = 'none';
    }
    if (bannerTimer > 0) {
      bannerTimer -= info.dt;
      if (bannerTimer <= 0) banner.style.display = 'none';
    }
  }

  function showPopup(main, sub) {
    popup.innerHTML = '';
    popup.appendChild(el('div', 'popup-main', main));
    if (sub) popup.appendChild(el('div', 'popup-sub', sub));
    popup.style.display = '';
    popupTimer = 1.6;
  }

  function showBanner() {
    banner.style.display = '';
    bannerTimer = 3;
  }

  function setPhase(phase, stats) {
    titleScreen.style.display = phase === 'title' ? '' : 'none';
    pauseScreen.style.display = phase === 'paused' ? '' : 'none';
    if (phase === 'over') {
      overScreen.style.display = '';
      overScreen.innerHTML =
        '<h1>SHIFT COMPLETE!</h1>' +
        `<p>Dishes served: <strong>${stats.dishes}</strong></p>` +
        `<p>Coins: <strong>${stats.coins}</strong></p>` +
        `<p>Score: <strong>${stats.score}</strong></p>` +
        `<p>Best combo: <strong>x${stats.bestCombo}</strong></p>` +
        `<p>Best score: <strong>${stats.bestScore}</strong></p>` +
        '<p class="start-hint">Press R to play again</p>';
    } else {
      overScreen.style.display = 'none';
    }
  }

  function setBinLabelPos(ingredientId, x, y) {
    const label = binLabelEls[ingredientId];
    if (!label) return;
    label.style.left = `${x - 55}px`;
    // The caller projects the bin's front-bottom edge, so the label only
    // needs a small gap to sit directly underneath the bin.
    label.style.top = `${y + 6}px`;
  }

  function setCursorLabel(text, x, y) {
    if (!text) {
      cursorLabel.style.display = 'none';
      return;
    }
    cursorLabel.style.display = '';
    cursorLabel.textContent = text;
    cursorLabel.style.left = `${x + 14}px`;
    cursorLabel.style.top = `${y + 10}px`;
  }

  return {
    update,
    showPopup,
    showBanner,
    setPhase,
    setBinLabelPos,
    setCursorLabel,
  };
}
