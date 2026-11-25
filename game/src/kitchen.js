// Copper Ladle Kitchen 3D — pure game logic.
// No Three.js, no DOM, no localStorage here. The UI layer (main.js) reads
// `state.events` each frame and turns them into sounds / popups / particles.
import {
  CHOPS_NEEDED,
  FIRST_SPAWN_DELAY,
  INGREDIENT_BY_ID,
  INGREDIENT_BY_KEY,
  MAX_ORDERS,
  ORDER_TIME_END,
  ORDER_TIME_START,
  PERFECT_MULTIPLIER,
  PERFECT_THRESHOLD,
  RECIPES,
  RECIPE_BY_ID,
  RUSH_AT,
  RUSH_DURATION,
  RUSH_MULTIPLIER,
  SCORE_PER_COIN,
  SHIFT_SECONDS,
  SPAWN_END,
  SPAWN_START,
  clamp,
  lerp,
} from './config.js';

let nextOrderUid = 1;

export function createGame() {
  return {
    phase: 'title', // 'title' | 'playing' | 'paused' | 'over'
    time: 0, // elapsed seconds in the shift
    shiftLeft: SHIFT_SECONDS,
    orders: [], // { uid, recipeId, timeLeft, timeMax, lastTickSecond }
    plate: [], // { ingredient, chopped }
    held: null, // ingredient id in hand, or null
    chopTarget: null, // { ingredient, progress, chopped } on the board, or null
    coins: 0,
    score: 0,
    dishes: 0,
    combo: 0,
    bestCombo: 0,
    rushUntil: -1, // elapsed time until which rush multiplier is active
    rushCount: 0, // how many rush hours have fired
    spawnTimer: FIRST_SPAWN_DELAY,
    events: [], // consumed by main.js: { type, ... }
  };
}

export function startGame(state) {
  const fresh = createGame();
  Object.assign(state, fresh);
  state.phase = 'playing';
  spawnOrder(state);
  spawnOrder(state);
  pushEvent(state, { type: 'start' });
  return state;
}

export function shiftProgress(state) {
  return clamp(state.time / SHIFT_SECONDS, 0, 1);
}

export function spawnInterval(state) {
  return lerp(SPAWN_START, SPAWN_END, shiftProgress(state));
}

export function orderDuration(state) {
  return lerp(ORDER_TIME_START, ORDER_TIME_END, shiftProgress(state));
}

export function isRush(state) {
  return state.phase === 'playing' && state.time < state.rushUntil;
}

function pushEvent(state, event) {
  state.events.push(event);
}

/** Drain and return all pending events (main.js calls this every frame). */
export function drainEvents(state) {
  const out = state.events;
  state.events = [];
  return out;
}

function pickRecipeId() {
  return RECIPES[Math.floor(Math.random() * RECIPES.length)].id;
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const duration = orderDuration(state);
  const order = {
    uid: nextOrderUid++,
    recipeId: pickRecipeId(),
    timeLeft: duration,
    timeMax: duration,
    lastTickSecond: Math.ceil(duration),
  };
  state.orders.push(order);
  return order;
}

// --- matching ---------------------------------------------------------------

function plateKey(items) {
  return items
    .map((i) => `${i.ingredient}:${i.chopped ? 'c' : 'w'}`)
    .sort()
    .join('|');
}

function recipeKey(recipe) {
  return recipe.steps
    .map((s) => `${s.ingredient}:${s.chopped ? 'c' : 'w'}`)
    .sort()
    .join('|');
}

/** The open order the current plate exactly matches, or null. */
export function matchingOrder(state) {
  if (state.plate.length === 0) return null;
  const key = plateKey(state.plate);
  return state.orders.find((o) => recipeKey(RECIPE_BY_ID[o.recipeId]) === key) || null;
}

/**
 * True when the plate holds an ingredient no open order needs (as a
 * multiset): the plate can never become a match, so the player should
 * trash it. A plate that is a strict subset of some open order is fine.
 */
export function plateMismatches(state) {
  if (state.plate.length === 0) return false;
  return !state.orders.some((o) => {
    const need = RECIPE_BY_ID[o.recipeId].steps.map((s) => `${s.ingredient}:${s.chopped ? 'c' : 'w'}`);
    const have = state.plate.map((i) => `${i.ingredient}:${i.chopped ? 'c' : 'w'}`);
    const remaining = [...need];
    return have.every((h) => {
      const idx = remaining.indexOf(h);
      if (idx < 0) return false;
      remaining.splice(idx, 1);
      return true;
    });
  });
}

// --- player actions ---------------------------------------------------------

export function pickIngredient(state, ingredientId) {
  if (state.phase !== 'playing') return false;
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return false;
  if (state.held) return false; // one thing in hand at a time
  state.held = ingredientId;
  pushEvent(state, { type: 'pop', ingredient: ingredientId });
  return true;
}

export function pickIngredientByKey(state, key) {
  const ing = INGREDIENT_BY_KEY[key];
  return ing ? pickIngredient(state, ing.id) : false;
}

/** Click the chopping board: put a held chop-needed ingredient down, or chop. */
export function clickBoard(state) {
  if (state.phase !== 'playing') return false;
  if (state.held) {
    const ing = INGREDIENT_BY_ID[state.held];
    if (!ing.needsChop) return false; // ready ingredients never go on the board
    if (state.chopTarget) return false; // board already busy
    state.chopTarget = { ingredient: state.held, progress: 0, chopped: false };
    state.held = null;
    pushEvent(state, { type: 'pop' });
    return true;
  }
  if (state.chopTarget && !state.chopTarget.chopped) {
    state.chopTarget.progress += 1;
    pushEvent(state, { type: 'chop', progress: state.chopTarget.progress });
    if (state.chopTarget.progress >= CHOPS_NEEDED) {
      state.chopTarget.chopped = true;
      pushEvent(state, { type: 'chopped', ingredient: state.chopTarget.ingredient });
    }
    return true;
  }
  return false;
}

/** Click the plate: add the held ready ingredient, or the chopped board item. */
export function clickPlate(state) {
  if (state.phase !== 'playing') return false;
  // A chopped item on the board goes on the plate.
  if (state.chopTarget && state.chopTarget.chopped) {
    addToPlate(state, state.chopTarget.ingredient, true);
    state.chopTarget = null;
    return true;
  }
  if (!state.held) return false;
  const ing = INGREDIENT_BY_ID[state.held];
  if (ing.needsChop) {
    // Unchopped ingredients belong on the board, not the plate.
    return clickBoard(state);
  }
  addToPlate(state, state.held, false);
  state.held = null;
  return true;
}

function addToPlate(state, ingredientId, chopped) {
  state.plate.push({ ingredient: ingredientId, chopped });
  pushEvent(state, { type: 'pop', ingredient: ingredientId });
  if (plateMismatches(state)) {
    pushEvent(state, { type: 'buzz' });
  }
}

/** X / trash: throw away the plate, the held item and the board item. */
export function trashAll(state) {
  if (state.phase !== 'playing') return false;
  if (state.plate.length === 0 && !state.held && !state.chopTarget) return false;
  state.plate = [];
  state.held = null;
  state.chopTarget = null;
  pushEvent(state, { type: 'trash' });
  pushEvent(state, { type: 'buzz' });
  return true;
}

/** Serve the order the plate matches. Returns the serve result or null. */
export function serve(state) {
  if (state.phase !== 'playing') return null;
  const order = matchingOrder(state);
  if (!order) return null;
  const recipe = RECIPE_BY_ID[order.recipeId];
  const perfect = order.timeLeft > PERFECT_THRESHOLD * order.timeMax;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const rush = isRush(state);
  // Base, then perfect +50%, then combo multiplier, then rush 1.5x —
  // rounded once at the end, per spec.
  const earned = Math.round(
    recipe.coins * (perfect ? PERFECT_MULTIPLIER : 1) * state.combo * (rush ? RUSH_MULTIPLIER : 1),
  );
  state.coins += earned;
  state.score += earned * SCORE_PER_COIN;
  state.dishes += 1;
  state.orders = state.orders.filter((o) => o.uid !== order.uid);
  state.plate = [];
  const result = { type: 'serve', recipeId: recipe.id, coins: earned, perfect, combo: state.combo, rush };
  pushEvent(state, result);
  return result;
}

/** Space: serve if the plate matches, else chop, else add to the plate. */
export function spaceAction(state) {
  if (state.phase !== 'playing') return null;
  if (matchingOrder(state)) return serve(state);
  if (state.chopTarget && !state.chopTarget.chopped) {
    clickBoard(state);
    return { type: 'chop' };
  }
  if (state.chopTarget && state.chopTarget.chopped) {
    clickPlate(state);
    return { type: 'plate' };
  }
  if (state.held) {
    clickPlate(state);
    return { type: 'plate' };
  }
  return null;
}

// --- clock ------------------------------------------------------------------

export function tick(state, dt) {
  if (state.phase !== 'playing') return;
  state.time += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);

  // Rush hour at 60s and 120s: 12s of 1.5x coins + up to 3 orders at once.
  for (const at of RUSH_AT) {
    if (state.rushCount < RUSH_AT.indexOf(at) + 1 && state.time >= at) {
      state.rushCount += 1;
      state.rushUntil = state.time + RUSH_DURATION;
      pushEvent(state, { type: 'rush', until: state.rushUntil });
      for (let i = 0; i < 3; i++) spawnOrder(state);
    }
  }

  // Periodic order spawns.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = spawnInterval(state);
  }

  // Order countdowns.
  const lost = [];
  for (const order of state.orders) {
    order.timeLeft -= dt;
    const whole = Math.ceil(order.timeLeft);
    if (whole !== order.lastTickSecond) {
      order.lastTickSecond = whole;
      if (whole <= 5 && whole > 0) pushEvent(state, { type: 'tick', seconds: whole });
    }
    if (order.timeLeft <= 0) lost.push(order);
  }
  for (const order of lost) {
    state.orders = state.orders.filter((o) => o.uid !== order.uid);
    state.combo = 0;
    pushEvent(state, { type: 'order-lost', recipeId: order.recipeId });
  }

  if (state.time >= SHIFT_SECONDS) {
    state.phase = 'over';
    state.shiftLeft = 0;
    pushEvent(state, { type: 'shift-over' });
  }
}

export function togglePause(state) {
  if (state.phase === 'playing') {
    state.phase = 'paused';
    return true;
  }
  if (state.phase === 'paused') {
    state.phase = 'playing';
    return true;
  }
  return false;
}
