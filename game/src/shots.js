// Sizzle & Serve — screenshot presets: ?shot=1|2|3 seeds a real game state
// so the maker's screenshots show the kitchen at its best. These are the
// game's own states, rendered by its own code — no staged images.
//   shot=1  A busy lunch: three tickets, grill going, plate half-built.
//   shot=2  Dish mid-assembly: chopped veg on the board, patty on the grill.
//   shot=3  The rush: a finished plate at the window, timer nearly gone.
import { spawnTicket } from './orders.js';
import { RECIPES } from './recipes.js';

export function applyShotPreset(state, shot) {
  const now = 0;
  state.dayTimeLeft = shot === 3 ? 24 : shot === 2 ? 96 : 134;
  state.coins = shot === 3 ? 214 : shot === 2 ? 132 : 86;
  state.combo = shot === 3 ? 4 : shot === 2 ? 2 : 1;
  state.servedCount = shot === 3 ? 9 : shot === 2 ? 5 : 3;
  state.board.tickets = [];
  state.board.spawnTimer = 6;
  const n = shot === 1 ? 3 : 3;
  for (let i = 0; i < n; i++) {
    const t = spawnTicket(state.board, now);
    if (t) t.age = [4, 18, 31][i] ?? 8;
  }
  if (shot === 3 && state.board.tickets[0]) state.board.tickets[0].age = state.board.tickets[0].patience - 7;
  // Shot 3's plate is a finished Ember Burger: make sure a ticket asks for it,
  // so the plate reads "matches — SERVE IT!" instead of "stacking…".
  if (shot === 3 && state.board.tickets[1]) {
    state.board.tickets[1].recipe = RECIPES[0];
    state.board.tickets[1].age = 12;
  }
  state.chef.x = shot === 3 ? 1060 : shot === 2 ? 395 : 640;
  state.chef.y = shot === 3 ? 390 : shot === 2 ? 480 : 430;
  state.chef.hands = [];
  if (shot === 1) state.chef.hands = [{ part: 'tomato', state: 'raw' }];
  if (shot === 2) state.chef.hands = [{ part: 'lettuce', state: 'chopped' }];
  if (shot === 3) state.chef.hands = [{ part: 'bun', state: 'ready' }];
  // Chopping board.
  state.chop = shot === 2
    ? { part: 'lettuce', progress: 0.66, hits: 2 }
    : shot === 1
      ? { part: 'tomato', progress: 0.33, hits: 1 }
      : null;
  // Grill slots: up to two patties.
  state.grill = shot === 1
    ? [{ part: 'patty', state: 'raw', cook: 0.45, burnt: 0 }, { part: 'patty', state: 'raw', cook: 0.1, burnt: 0 }]
    : shot === 2
      ? [{ part: 'patty', state: 'raw', cook: 0.85, burnt: 0 }, null]
      : [{ part: 'patty', state: 'grilled', cook: 1, burnt: 0 }, null];
  // Plate on the plating counter.
  state.plate = shot === 1
    ? ['bun', 'patty']
    : shot === 2
      ? ['bun', 'patty', 'tomato']
      : ['bun', 'patty', 'tomato', 'lettuce'];
  state.phase = 'playing';
  state.toast = shot === 3 ? 'Plate ready — serve it at the window!' : shot === 2 ? 'Chop the lettuce, stack the plate!' : '';
  state.toastTimer = state.toast ? 3 : 0;
}
