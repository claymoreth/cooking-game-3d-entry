// Copper Ladle Kitchen 3D — game loop + wiring: kitchen state, Three.js
// scene, DOM HUD, input and audio. No game rules live here; see kitchen.js.
import { BEST_SCORE_KEY, INGREDIENT_BY_ID } from './config.js';
import {
  clickBoard,
  clickPlate,
  createGame,
  drainEvents,
  matchingOrder,
  pickIngredient,
  pickIngredientByKey,
  plateMismatches,
  serve,
  spaceAction,
  startGame,
  tick,
  togglePause,
  trashAll,
} from './kitchen.js';
import { createKitchenScene } from './scene.js';
import { createHud } from './hud.js';
import { attachInput } from './input.js';
import { createSoundManager } from './audio.js';

const canvas = document.getElementById('game');
const app = document.getElementById('app');
const state = createGame();
const scene = createKitchenScene(canvas);
const sound = createSoundManager();

let bestScore = 0;
try {
  bestScore = Number(localStorage.getItem(BEST_SCORE_KEY) || 0) || 0;
} catch (e) {
  bestScore = 0;
}

function saveBestScore() {
  if (state.score > bestScore) {
    bestScore = state.score;
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    } catch (e) {
      // Best score is a nice-to-have; the game must not break without storage.
    }
  }
}

function beginShift() {
  startGame(state);
  lastHeld = undefined; // force held-mesh refresh
  scene.setHeld(null);
  hud.setPhase('playing');
}

const hud = createHud({
  onPause: () => doPause(),
  onMute: () => doMute(),
  onServe: () => doServe(),
});

function doPause() {
  if (state.phase !== 'playing' && state.phase !== 'paused') return;
  togglePause(state);
  hud.setPhase(state.phase);
}

function doMute() {
  sound.toggleMute();
}

function doServe() {
  const result = serve(state);
  if (result) scene.spawnCoins();
}

function doStartIfTitle() {
  if (state.phase === 'title') beginShift();
}

attachInput(canvas, scene, {
  onGesture: () => sound.ensure(),
  onPointerMove: (ndcX, ndcY, clientX, clientY) => {
    scene.updateHeldFromPointer(ndcX, ndcY);
    const rect = app.getBoundingClientRect();
    const label = state.held
      ? INGREDIENT_BY_ID[state.held].name
      : state.chopTarget && state.chopTarget.chopped
        ? `Chopped ${INGREDIENT_BY_ID[state.chopTarget.ingredient].name} — click the plate`
        : state.chopTarget
          ? `Chopping ${INGREDIENT_BY_ID[state.chopTarget.ingredient].name}… (${state.chopTarget.progress}/3)`
          : null;
    hud.setCursorLabel(label, clientX - rect.left, clientY - rect.top);
  },
  onCanvasClick: (ndcX, ndcY) => {
    if (state.phase === 'title') {
      doStartIfTitle();
      return;
    }
    if (state.phase !== 'playing') return;
    const action = scene.pick(ndcX, ndcY);
    if (!action) return;
    if (action.startsWith('bin-')) {
      pickIngredient(state, action.slice(4));
    } else if (action === 'board') {
      clickBoard(state);
    } else if (action === 'plate') {
      clickPlate(state);
    } else if (action === 'trash') {
      trashAll(state);
    }
  },
  onPickKey: (key) => {
    if (state.phase === 'playing') pickIngredientByKey(state, key);
  },
  onSpace: () => {
    if (state.phase === 'title') {
      doStartIfTitle();
      return;
    }
    if (state.phase === 'playing') spaceAction(state);
  },
  onEnter: () => {
    if (state.phase === 'title') doStartIfTitle();
  },
  onTrash: () => {
    if (state.phase === 'playing') trashAll(state);
  },
  onPause: () => doPause(),
  onMute: () => doMute(),
  onRestart: () => {
    if (state.phase === 'title' || state.phase === 'over') beginShift();
  },
});

// Bin labels: the camera never moves, so project the bin positions once
// (and again on resize, in case the canvas is scaled).
function placeBinLabels() {
  for (const ingId of Object.keys(scene.binPositions)) {
    // Project the bin's front-bottom edge (just below the counter top,
    // just in front of the bin's front face) so the label sits directly
    // underneath the bin instead of covering its ingredient stack.
    const [x, , z] = scene.binPositions[ingId];
    const p = scene.project([x, 0.82, z + 0.62]);
    hud.setBinLabelPos(ingId, p.x, p.y);
  }
}
placeBinLabels();
window.addEventListener('resize', placeBinLabels);

// --- debug hook (required for coordinator verification) ----------------------
window.__copperLadle3d = {
  get state() {
    return {
      phase: state.phase,
      time: state.time,
      shiftLeft: state.shiftLeft,
      orders: state.orders.map((o) => ({ recipeId: o.recipeId, timeLeft: o.timeLeft, timeMax: o.timeMax })),
      plate: state.plate.map((i) => ({ ...i })),
      held: state.held,
      chopTarget: state.chopTarget ? { ...state.chopTarget } : null,
      chopProgress: state.chopTarget ? state.chopTarget.progress : 0,
      coins: state.coins,
      score: state.score,
      dishes: state.dishes,
      combo: state.combo,
    };
  },
};

let lastHeld;
let lastPhase = state.phase;
let lastTime = performance.now();

function handleEvents() {
  for (const ev of drainEvents(state)) {
    switch (ev.type) {
      case 'chop':
        scene.swingKnife();
        sound.chop();
        break;
      case 'chopped':
        sound.ding();
        break;
      case 'pop':
        sound.pop();
        break;
      case 'buzz':
        sound.buzz();
        break;
      case 'trash':
        break;
      case 'tick':
        sound.tick();
        break;
      case 'serve':
        scene.spawnCoins();
        sound.serve();
        hud.showPopup(
          `+${ev.coins} coins`,
          ev.perfect ? 'PERFECT!' : ev.rush ? 'RUSH BONUS!' : null,
        );
        break;
      case 'order-lost':
        sound.buzz();
        hud.showPopup('ORDER LOST', null);
        app.classList.add('shake');
        window.setTimeout(() => app.classList.remove('shake'), 300);
        break;
      case 'rush':
        sound.ding();
        hud.showBanner();
        break;
      case 'shift-over':
        saveBestScore();
        hud.setPhase('over', {
          dishes: state.dishes,
          coins: state.coins,
          score: state.score,
          bestCombo: state.bestCombo,
          bestScore,
        });
        break;
      default:
        break;
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  tick(state, dt);
  handleEvents();

  if (state.phase !== lastPhase) {
    lastPhase = state.phase;
    if (state.phase === 'paused') hud.setPhase('paused');
    else if (state.phase === 'playing') hud.setPhase('playing');
  }

  if (state.held !== lastHeld) {
    lastHeld = state.held;
    scene.setHeld(state.held);
  }

  scene.sync(state, !!matchingOrder(state));
  scene.update(dt, state);
  hud.update(state, {
    dt,
    muted: sound.muted,
    // The matching ORDER (object) — not a boolean — so the HUD can light
    // up exactly the ticket the plate matches.
    matching: matchingOrder(state),
    mismatch: plateMismatches(state),
  });
  scene.render();
  requestAnimationFrame(frame);
}

hud.setPhase('title');
requestAnimationFrame(frame);
