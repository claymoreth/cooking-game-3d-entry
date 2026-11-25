// Copper Ladle Kitchen 3D — shared constants (no DOM, no Three.js here).
export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export const PALETTE = {
  cream: '#f7e8c9',
  wood: '#8a5a2b',
  woodDark: '#6f4520',
  gold: '#e8a91c',
  red: '#d43d2a',
  green: '#2e9e4f',
  ink: '#3a2a18',
};

// Tuning — these numbers are part of the spec, do not change casually.
export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const FIRST_SPAWN_DELAY = 4;
export const SPAWN_START = 14; // seconds, at shift start
export const SPAWN_END = 8; // seconds, at shift end
export const ORDER_TIME_START = 45; // seconds, at shift start
export const ORDER_TIME_END = 35; // seconds, at shift end
export const CHOPS_NEEDED = 3;
export const RUSH_AT = [60, 120]; // elapsed seconds when rush hour starts
export const RUSH_DURATION = 12; // seconds of 1.5x coins
export const RUSH_MULTIPLIER = 1.5;
export const PERFECT_THRESHOLD = 0.5; // >50% of order time left
export const PERFECT_MULTIPLIER = 1.5;
export const SCORE_PER_COIN = 10;
export const BEST_SCORE_KEY = 'copper-ladle-best';

// 6 ingredients. `key` is the keyboard digit, `needsChop` means it must
// go through the chopping board before it can go on the plate.
export const INGREDIENTS = [
  { id: 'tomato', name: 'Tomato', key: '1', needsChop: true, color: '#e0483e' },
  { id: 'lettuce', name: 'Lettuce', key: '2', needsChop: true, color: '#5cb85c' },
  { id: 'cheese', name: 'Cheese', key: '3', needsChop: false, color: '#f2c230' },
  { id: 'mushroom', name: 'Mushroom', key: '4', needsChop: true, color: '#cbb49a' },
  { id: 'pasta', name: 'Pasta', key: '5', needsChop: false, color: '#f0d48a' },
  { id: 'onion', name: 'Onion', key: '6', needsChop: true, color: '#d9c2e8' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
export const INGREDIENT_BY_KEY = Object.fromEntries(INGREDIENTS.map((i) => [i.key, i]));

// 4 recipes. A step is { ingredient, chopped }: the plate must contain
// exactly these items, in any order, to match the order.
export const RECIPES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    coins: 60,
    bowl: false,
    steps: [
      { ingredient: 'lettuce', chopped: true },
      { ingredient: 'tomato', chopped: true },
      { ingredient: 'cheese', chopped: false },
    ],
  },
  {
    id: 'tomato-pasta',
    name: 'Tomato Pasta',
    coins: 80,
    bowl: false,
    steps: [
      { ingredient: 'pasta', chopped: false },
      { ingredient: 'tomato', chopped: true },
      { ingredient: 'cheese', chopped: false },
    ],
  },
  {
    id: 'mushroom-soup',
    name: 'Mushroom Soup',
    coins: 70,
    bowl: true,
    steps: [
      { ingredient: 'mushroom', chopped: true },
      { ingredient: 'onion', chopped: true },
    ],
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    coins: 90,
    bowl: false,
    steps: [
      { ingredient: 'cheese', chopped: false },
      { ingredient: 'tomato', chopped: true },
      { ingredient: 'mushroom', chopped: true },
    ],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// 3D zone positions (world units). The work table top is at y = 1.
export const POS = {
  camera: [0, 8.2, 10.5],
  cameraLookAt: [0, 0.6, -0.4],
  board: [-3.4, 1.0, 0.1],
  plate: [0, 1.0, 0.1],
  stove: [3.4, 1.0, 0.1],
  trash: [1.9, 1.0, 0.55],
  // Ingredient bins along the front counter, near the camera.
  bins: {
    tomato: [-5.0, 0.55, 2.7],
    lettuce: [-3.0, 0.55, 2.7],
    cheese: [-1.0, 0.55, 2.7],
    mushroom: [1.0, 0.55, 2.7],
    pasta: [3.0, 0.55, 2.7],
    onion: [5.0, 0.55, 2.7],
  },
};

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
