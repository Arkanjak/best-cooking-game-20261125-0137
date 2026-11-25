// Sizzle & Serve — the recipe book: every dish on Ember Lane's menu.
// Each recipe lists the finished parts a plate must hold, in any order.
// Part ids: bun, patty (grilled), tomato (chopped), lettuce (chopped),
// cheese, onion (chopped). Raw patty and whole veg can never be served.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a94f', chop: false, grill: false },
  patty:   { name: 'Patty',   color: '#8a4b2d', chop: false, grill: true  },
  tomato:  { name: 'Tomato',  color: '#e23b2e', chop: true,  grill: false },
  lettuce: { name: 'Lettuce', color: '#5fbf3f', chop: true,  grill: false },
  cheese:  { name: 'Cheese',  color: '#ffcf3d', chop: false, grill: false },
  onion:   { name: 'Onion',   color: '#e8d8f0', chop: true,  grill: false },
};

export const RECIPES = [
  {
    id: 'ember-burger', name: 'Ember Burger', price: 24, emoji: '🍔',
    parts: ['bun', 'patty', 'tomato', 'lettuce'],
    blurb: 'The house classic. Flame-grilled, garden-fresh.',
  },
  {
    id: 'cheesy-melt', name: 'Cheesy Melt', price: 26, emoji: '🧀',
    parts: ['bun', 'patty', 'cheese', 'onion'],
    blurb: 'Extra cheese, sweet onion, zero regrets.',
  },
  {
    id: 'garden-stack', name: 'Garden Stack', price: 18, emoji: '🥗',
    parts: ['bun', 'tomato', 'lettuce', 'cheese'],
    blurb: 'No grill, all crunch. The vegetarian rush favourite.',
  },
  {
    id: 'double-ember', name: 'Double Ember', price: 38, emoji: '🍔🍔',
    parts: ['bun', 'patty', 'patty', 'cheese'],
    blurb: 'Two patties, one very hungry customer.',
  },
];

// A part is servable only once it has been prepped the way the recipe needs.
export function needsPrep(part) {
  if (part === 'patty') return 'grilled';
  if (INGREDIENTS[part]?.chop) return 'chopped';
  return 'ready';
}

export function partLabel(part, state) {
  const base = INGREDIENTS[part]?.name ?? part;
  if (state === 'raw') return 'Raw ' + base;
  if (state === 'grilled') return 'Grilled ' + base;
  if (state === 'chopped') return 'Chopped ' + base;
  if (state === 'burnt') return 'Burnt ' + base;
  return base;
}

// True when the plate's parts match the recipe exactly (order free).
export function plateMatchesRecipe(plateParts, recipe) {
  if (plateParts.length !== recipe.parts.length) return false;
  const have = [...plateParts].sort();
  const want = [...recipe.parts].sort();
  return have.every((p, i) => p === want[i]);
}

export function randomRecipe(rng = Math.random) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}
