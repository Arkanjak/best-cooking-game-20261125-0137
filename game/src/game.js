// Sizzle & Serve — Ember Lane Kitchen: the game itself.
// Loop, input, stations, scoring and the order board. A complete lunch-rush
// game: fetch, chop, grill, stack, serve — before the tickets run out.
import { INGREDIENTS, RECIPES, plateMatchesRecipe, partLabel } from './recipes.js';
import { createOrderBoard, updateOrderBoard, ticketTimeLeft, ticketUrgency, findMatchingTicket } from './orders.js';
import { STATIONS, BIN_SLOTS, stationById, stationCenter, nearestStation, drawKitchen, drawStation, roundRect } from './kitchen.js';
import { createChef, updateChef, drawChef, chefHandsFull, chefTake, chefDrop } from './chef.js';
import { drawIngredient } from './food.js';
import { sfx, ensureAudio, toggleMute, isMuted } from './audio.js';
import { applyShotPreset } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const DAY_LENGTH = 180;
const GRILL_TIME = 6;
const BURN_TIME = 5;
const CHOP_HITS = 3;

const state = {
  phase: 'title', // title | playing | over
  time: 0,
  dayTimeLeft: DAY_LENGTH,
  coins: 0,
  combo: 1,
  bestCombo: 1,
  servedCount: 0,
  board: createOrderBoard(),
  chef: createChef(),
  chop: null,      // { part, progress, hits } on the board
  grill: [null, null],
  plate: [],       // parts on the plating counter, in stack order
  keys: new Set(),
  pendingInteract: null,
  toast: '',
  toastTimer: 0,
  stars: 0,
  lastTickSecond: -1,
};

const bounds = { minX: 60, maxX: W - 60, minY: 150, maxY: H - 40 };

function showToast(msg, secs = 2.5) {
  state.toast = msg;
  state.toastTimer = secs;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
}

function hideToast() {
  document.getElementById('toast').classList.remove('show');
}

function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function updateTopbar() {
  document.getElementById('dayClock').textContent =
    'DAY 1 · ' + fmtClock(state.dayTimeLeft);
  document.getElementById('coinPill').textContent = '🪙 ' + state.coins;
  document.getElementById('comboPill').textContent = '🔥 COMBO ×' + state.combo;
  document.getElementById('soundToggle').textContent = isMuted() ? '🔇 sound off' : '🔊 sound on';
}

// ---- interactions ---------------------------------------------------------

function binSlotAt(st, y) {
  const slotH = st.h / BIN_SLOTS.length;
  const idx = Math.floor((y - st.y) / slotH);
  return BIN_SLOTS[Math.max(0, Math.min(BIN_SLOTS.length - 1, idx))];
}

function interact() {
  if (state.phase !== 'playing') return;
  const chef = state.chef;
  const st = nearestStation(chef);
  if (!st) return;
  ensureAudio();
  if (st.id === 'bins') {
    if (chefHandsFull(chef)) { sfx.error(); showToast('Hands full! Serve or trash something first.'); return; }
    const part = binSlotAt(st, chef.y);
    chefTake(chef, { part, state: 'raw' });
    sfx.pickup();
    showToast('Picked up ' + INGREDIENTS[part].name + ' — chop it or grill it!');
  } else if (st.id === 'board') {
    if (state.chop) {
      state.chop.hits += 1;
      state.chop.progress = state.chop.hits / CHOP_HITS;
      sfx.chop();
      if (state.chop.hits >= CHOP_HITS) {
        state.chop = { part: state.chop.part, progress: 1, hits: CHOP_HITS, done: true };
        sfx.ding();
        showToast(INGREDIENTS[state.chop.part].name + ' chopped! Pick it up with E.');
      }
    } else {
      const idx = chef.hands.findIndex((h) => INGREDIENTS[h.part]?.chop && h.state === 'raw');
      if (idx < 0) { sfx.error(); showToast('Bring a raw tomato, lettuce or onion to chop.'); return; }
      const item = chefDrop(chef, idx);
      state.chop = { part: item.part, progress: 0, hits: 0, done: false };
      sfx.chop();
      showToast('Chopping ' + INGREDIENTS[item.part].name + ' — mash E!');
    }
    if (state.chop?.done) {
      if (!chefHandsFull(chef)) {
        chefTake(chef, { part: state.chop.part, state: 'chopped' });
        state.chop = null;
        sfx.pickup();
      }
    }
  } else if (st.id === 'grill') {
    const free = state.grill.findIndex((g) => g === null);
    const rawIdx = chef.hands.findIndex((h) => h.part === 'patty' && h.state === 'raw');
    const doneIdx = state.grill.findIndex((g) => g && (g.state === 'grilled' || g.state === 'burnt'));
    if (doneIdx >= 0 && !chefHandsFull(chef)) {
      const g = state.grill[doneIdx];
      state.grill[doneIdx] = null;
      if (g.state === 'burnt') { sfx.error(); showToast('Burnt patty! Bin it — customers hate charcoal.'); }
      else { sfx.pickup(); showToast('Grilled patty ready — stack it on the plate!'); }
      chefTake(chef, { part: 'patty', state: g.state });
    } else if (rawIdx >= 0 && free >= 0) {
      chefDrop(chef, rawIdx);
      state.grill[free] = { part: 'patty', state: 'raw', cook: 0, burnt: 0 };
      sfx.sizzle();
      showToast('Patty on the grill — watch it, it burns!');
    } else if (doneIdx < 0 && rawIdx < 0) {
      sfx.error(); showToast('Bring a raw patty to grill.');
    } else {
      sfx.error(); showToast('Grill is full — wait for a patty to finish.');
    }
  } else if (st.id === 'plating') {
    if (chef.hands.length > 0) {
      const item = chef.hands[0];
      if (item.state === 'raw' || item.state === 'burnt') {
        sfx.error(); showToast('That needs prepping first — chop it or grill it!');
        return;
      }
      chefDrop(chef, 0);
      state.plate.push(item.part);
      sfx.pickup();
      showToast('Stacked ' + partLabel(item.part, item.state) + ' on the plate.');
    } else if (state.plate.length > 0) {
      const part = state.plate.pop();
      chefTake(chef, { part, state: part === 'patty' ? 'grilled' : INGREDIENTS[part]?.chop ? 'chopped' : 'ready' });
      sfx.pickup();
    } else {
      sfx.error(); showToast('Plate is empty — stack ingredients on it first.');
    }
  } else if (st.id === 'serve') {
    servePlate();
  } else if (st.id === 'trash') {
    if (chef.hands.length === 0) { sfx.error(); showToast('Nothing to throw away.'); return; }
    const item = chefDrop(chef, 0);
    sfx.chop();
    showToast('Binned the ' + partLabel(item.part, item.state) + '.');
  }
}

function servePlate() {
  if (state.plate.length === 0) { sfx.error(); showToast('Nothing on the plate to serve!'); return; }
  const match = findMatchingTicket(state.board, state.plate);
  if (!match) {
    state.combo = 1;
    sfx.error();
    showToast('No ticket wants this dish — check the order board!');
    return;
  }
  const left = ticketTimeLeft(match);
  const timeBonus = Math.round((left / match.patience) * 12);
  const earned = (match.recipe.price + timeBonus) * state.combo;
  state.coins += earned;
  state.servedCount += 1;
  state.board.tickets = state.board.tickets.filter((t) => t !== match);
  state.board.served += 1;
  state.plate = [];
  sfx.serve(); sfx.coin();
  showToast(`Served ${match.recipe.name}! +${earned} coins${state.combo > 1 ? ' (combo ×' + state.combo + ')' : ''}`, 3);
  state.combo = Math.min(5, state.combo + 1);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
}

// ---- update ---------------------------------------------------------------

function update(dt) {
  state.time += dt;
  if (state.phase !== 'playing') return;
  state.dayTimeLeft -= dt;
  const elapsed = DAY_LENGTH - state.dayTimeLeft;
  state.board.rushLevel = 1 + Math.floor(elapsed / 45);
  const sec = Math.ceil(state.dayTimeLeft);
  if (sec <= 10 && sec !== state.lastTickSecond && sec > 0) {
    state.lastTickSecond = sec;
    sfx.tick();
  }
  updateChef(state.chef, state.keys, dt, bounds);
  if (state.pendingInteract) {
    const st = stationById(state.pendingInteract);
    if (st && nearestStation(state.chef) === st) {
      state.pendingInteract = null;
      interact();
    } else if (state.chef.target === null) {
      state.pendingInteract = null; // arrived nowhere near it
    }
  }
  const expired = updateOrderBoard(state.board, dt, state.time);
  if (expired.length) {
    state.combo = 1;
    sfx.burn();
    showToast(`A customer walked out! ${expired.length} ticket${expired.length > 1 ? 's' : ''} expired.`, 3);
  }
  // Grill cooking.
  state.grill.forEach((g) => {
    if (!g) return;
    if (g.state === 'raw') {
      g.cook += dt / GRILL_TIME;
      if (g.cook >= 1) { g.cook = 1; g.state = 'grilled'; sfx.ding(); showToast('Patty grilled! Grab it before it burns.'); }
    } else if (g.state === 'grilled') {
      g.burnt += dt;
      if (g.burnt >= BURN_TIME) { g.state = 'burnt'; sfx.burn(); showToast('A patty burnt on the grill!'); }
    }
  });
  if (state.toastTimer > 0) {
    state.toastTimer -= dt;
    if (state.toastTimer <= 0) hideToast();
  }
  if (state.dayTimeLeft <= 0) {
    state.dayTimeLeft = 0;
    state.phase = 'over';
    state.stars = state.servedCount >= 12 ? 3 : state.servedCount >= 8 ? 2 : state.servedCount >= 4 ? 1 : 0;
    sfx.gameOver();
  }
  updateTopbar();
}

function resetGame() {
  state.phase = 'playing';
  state.time = 0;
  state.dayTimeLeft = DAY_LENGTH;
  state.coins = 0;
  state.combo = 1;
  state.bestCombo = 1;
  state.servedCount = 0;
  state.board = createOrderBoard();
  state.chef = createChef();
  state.chop = null;
  state.grill = [null, null];
  state.plate = [];
  state.pendingInteract = null;
  hideToast();
  updateTopbar();
  showToast('Lunch rush! First ticket in a few seconds — grab a bun!');
}

// ---- drawing ---------------------------------------------------------------

function drawOrderBoard() {
  const x0 = 16, y0 = 8, w = W - 32, h = 100;
  ctx.fillStyle = '#2c1c10';
  roundRect(ctx, x0, y0, w, h, 12); ctx.fill();
  ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2;
  roundRect(ctx, x0, y0, w, h, 12); ctx.stroke();
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('📋 ORDER BOARD', x0 + 14, y0 + 18);
  ctx.fillStyle = '#d9b48f';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText(`Served ${state.servedCount} · Walked out ${state.board.missed} · Rush level ${state.board.rushLevel}`, x0 + 170, y0 + 18);
  const tickets = state.board.tickets;
  if (tickets.length === 0) {
    ctx.fillStyle = '#8a6f52';
    ctx.font = 'italic 15px "Trebuchet MS", sans-serif';
    ctx.fillText('No orders yet — the lunch crowd is on its way…', x0 + 14, y0 + 62);
    return;
  }
  tickets.forEach((t, i) => {
    const tx = x0 + 14 + i * 300;
    const ty = y0 + 32;
    const tw = 286, th = 58;
    const urg = ticketUrgency(t);
    ctx.fillStyle = urg === 'critical' ? '#5e1a12' : urg === 'hurried' ? '#5e4312' : '#f3e2c2';
    roundRect(ctx, tx, ty, tw, th, 8); ctx.fill();
    ctx.strokeStyle = urg === 'critical' ? '#ff5a3c' : '#c9a582';
    ctx.lineWidth = urg === 'critical' ? 3 : 1.5;
    roundRect(ctx, tx, ty, tw, th, 8); ctx.stroke();
    ctx.fillStyle = urg === 'critical' ? '#ffe9a8' : '#2c1c10';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${t.recipe.emoji} ${t.recipe.name}`, tx + 10, ty + 18);
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.fillText(t.recipe.parts.map((p) => INGREDIENTS[p].name).join(' + '), tx + 10, ty + 38);
    // Patience bar.
    const left = ticketTimeLeft(t);
    const frac = left / t.patience;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(tx + 10, ty + 48, tw - 20, 6);
    ctx.fillStyle = frac > 0.5 ? '#5fbf3f' : frac > 0.25 ? '#ffb347' : '#ff5a3c';
    ctx.fillRect(tx + 10, ty + 48, (tw - 20) * frac, 6);
    ctx.fillStyle = urg === 'critical' ? '#ffe9a8' : '#7a5a3a';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fmtClock(left), tx + tw - 10, ty + 18);
    ctx.textAlign = 'left';
  });
}

function drawStations() {
  const near = state.phase === 'playing' ? nearestStation(state.chef) : null;
  for (const st of STATIONS) drawStation(ctx, st, near === st, state.time);
  // Bin contents.
  const bins = stationById('bins');
  BIN_SLOTS.forEach((part, i) => {
    const cy = bins.y + 28 + i * 52;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, bins.x + 10, cy - 20, bins.w - 20, 40, 8); ctx.fill();
    drawIngredient(ctx, part, part === 'patty' ? 'raw' : 'ready', bins.x + 34, cy, 13);
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(INGREDIENTS[part].name, bins.x + 54, cy);
  });
  // Grill slots + flames.
  const grill = stationById('grill');
  state.grill.forEach((g, i) => {
    const gx = grill.x + 62 + i * 116;
    const gy = grill.y + 52;
    ctx.fillStyle = '#22222a';
    roundRect(ctx, gx - 52, gy - 34, 104, 68, 10); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
    roundRect(ctx, gx - 52, gy - 34, 104, 68, 10); ctx.stroke();
    if (g) {
      if (g.state === 'raw' || g.state === 'grilled') {
        ctx.fillStyle = `rgba(255,${g.state === 'raw' ? 120 : 90},30,${0.25 + 0.35 * Math.abs(Math.sin(state.time * 6 + i))})`;
        ctx.beginPath(); ctx.ellipse(gx, gy + 18, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
      }
      drawIngredient(ctx, 'patty', g.state, gx, gy - 2, 26);
      const frac = g.state === 'raw' ? g.cook : g.state === 'grilled' ? 1 - g.burnt / BURN_TIME : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(gx - 40, gy + 26, 80, 6);
      ctx.fillStyle = g.state === 'burnt' ? '#ff5a3c' : g.state === 'grilled' ? '#ffb347' : '#5fbf3f';
      ctx.fillRect(gx - 40, gy + 26, 80 * Math.max(0, frac), 6);
      if (g.state === 'grilled') {
        ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('READY!', gx, gy - 32);
      } else if (g.state === 'burnt') {
        ctx.fillStyle = '#ff8a70'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('BURNT!', gx, gy - 32);
      }
    } else {
      ctx.fillStyle = '#777';
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('empty', gx, gy);
    }
  });
  // Chopping board.
  const board = stationById('board');
  if (state.chop) {
    drawIngredient(ctx, state.chop.part, state.chop.done ? 'chopped' : 'raw', board.x + board.w / 2, board.y + 44, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(board.x + 30, board.y + 78, board.w - 60, 8);
    ctx.fillStyle = state.chop.done ? '#5fbf3f' : '#ffb347';
    ctx.fillRect(board.x + 30, board.y + 78, (board.w - 60) * state.chop.progress, 8);
    ctx.fillStyle = '#fff3e0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(state.chop.done ? 'CHOPPED — take it!' : `CHOP ${state.chop.hits}/${CHOP_HITS}`, board.x + board.w / 2, board.y + 100);
  } else {
    ctx.fillStyle = '#8a6f52'; ctx.font = 'italic 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('bring veg to chop', board.x + board.w / 2, board.y + 48);
  }
  // Plate on the plating counter.
  const pl = stationById('plating');
  const px = pl.x + pl.w / 2, py = pl.y + 46;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(px, py + 12, 86, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.ellipse(px, py + 10, 66, 11, 0, 0, Math.PI * 2); ctx.fill();
  state.plate.forEach((part, i) => {
    drawIngredient(ctx, part, part === 'patty' ? 'grilled' : INGREDIENTS[part]?.chop ? 'chopped' : 'ready', px, py + 8 - i * 16, 20);
  });
  if (state.plate.length === 0) {
    ctx.fillStyle = '#8a6f52'; ctx.font = 'italic 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('empty plate', px, py - 6);
  } else {
    const match = state.board.tickets.find((t) => plateMatchesRecipe(state.plate, t.recipe));
    ctx.fillStyle = match ? '#2f7a1e' : '#a34d1e';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(match ? `✓ matches ${match.recipe.name} — SERVE IT!` : 'stacking… check the tickets', px, py + 34);
  }
  // Serving window bell.
  const sv = stationById('serve');
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath(); ctx.arc(sv.x + sv.w / 2, sv.y + 40, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.arc(sv.x + sv.w / 2, sv.y + 34, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(sv.x + sv.w / 2 - 14, sv.y + 34, 28, 5);
  // Trash can lid.
  const tr = stationById('trash');
  ctx.fillStyle = '#3d4a42';
  ctx.fillRect(tr.x + 28, tr.y + 26, 54, 52);
  ctx.fillRect(tr.x + 22, tr.y + 18, 66, 10);
}

function drawTitle() {
  ctx.fillStyle = 'rgba(20,10,4,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffb347';
  ctx.font = '900 64px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍳 SIZZLE & SERVE', W / 2, 240);
  ctx.fillStyle = '#fff3e0';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText('Ember Lane Kitchen', W / 2, 284);
  ctx.font = '17px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffe9c4';
  ctx.fillText('One tiny diner. One huge lunch rush. Chop, grill, stack and serve', W / 2, 330);
  ctx.fillText('every ticket before its timer runs out — and mind the grill, it burns!', W / 2, 356);
  ctx.fillStyle = '#2c1c10';
  roundRect(ctx, W / 2 - 190, 396, 380, 62, 14); ctx.fill();
  ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 3;
  roundRect(ctx, W / 2 - 190, 396, 380, 62, 14); ctx.stroke();
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('▶  CLICK OR PRESS ENTER TO COOK', W / 2, 432);
  ctx.fillStyle = '#d9b48f';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText('WASD / Arrows to move · E or Click to use a station · R to restart', W / 2, 500);
  ctx.fillText('Recipes: Ember Burger · Cheesy Melt · Garden Stack · Double Ember', W / 2, 524);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(20,10,4,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffb347';
  ctx.font = '900 52px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍽️  DAY OVER!', W / 2, 230);
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fff3e0';
  ctx.fillText(`You served ${state.servedCount} dishes and earned 🪙 ${state.coins}`, W / 2, 290);
  ctx.fillText(`Best combo ×${state.bestCombo} · ${state.board.missed} customer${state.board.missed === 1 ? '' : 's'} walked out`, W / 2, 326);
  ctx.font = '44px sans-serif';
  ctx.fillText('★'.repeat(state.stars) + '☆'.repeat(3 - state.stars), W / 2, 386);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText(state.stars === 3 ? 'Three stars! Ember Lane is the talk of the town!' :
    state.stars === 2 ? 'Two stars — the regulars are coming back!' :
    state.stars === 1 ? 'One star — a solid first shift. Faster tomorrow!' :
    'No stars yet — the grill forgives, the tickets do not. Try again!', W / 2, 432);
  ctx.fillStyle = '#d9b48f';
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('Press R or click to cook another day', W / 2, 486);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawKitchen(ctx, W, H, state.time);
  drawStations();
  drawChef(ctx, state.chef, state.time);
  drawOrderBoard();
  // Day timer bar under the board.
  const frac = state.dayTimeLeft / DAY_LENGTH;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(16, 112, W - 32, 8);
  ctx.fillStyle = frac > 0.3 ? '#ffb347' : '#ff5a3c';
  ctx.fillRect(16, 112, (W - 32) * frac, 8);
  // Hint when idle near nothing.
  if (state.phase === 'playing' && !nearestStation(state.chef)) {
    ctx.fillStyle = 'rgba(20,10,4,0.6)';
    ctx.font = '14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Walk up to a station (it glows) and press E — start at the ingredient bins on the left', W / 2, H - 12);
  }
  if (state.phase === 'title') drawTitle();
  if (state.phase === 'over') drawGameOver();
}

// ---- input ----------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'enter' && state.phase === 'title') { ensureAudio(); resetGame(); return; }
  if (k === 'r' && (state.phase === 'over' || state.phase === 'playing')) { resetGame(); return; }
  if (k === 'e' || k === ' ') { interact(); return; }
  if (k === 'm') { toggleMute(); updateTopbar(); return; }
  state.keys.add(k);
});
window.addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  if (state.phase === 'title') { resetGame(); return; }
  if (state.phase === 'over') { resetGame(); return; }
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  const y = ((e.clientY - rect.top) / rect.height) * H;
  const clicked = STATIONS.find((st) => x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h);
  if (clicked) {
    const c = stationCenter(clicked);
    state.chef.target = { x: Math.max(bounds.minX, Math.min(bounds.maxX, c.x)), y: Math.max(bounds.minY, Math.min(bounds.maxY, c.y + clicked.h / 2 + 30)) };
    state.pendingInteract = clicked.id;
  } else {
    state.chef.target = { x: Math.max(bounds.minX, Math.min(bounds.maxX, x)), y: Math.max(bounds.minY, Math.min(bounds.maxY, y)) };
    state.pendingInteract = null;
  }
});

document.getElementById('soundToggle').addEventListener('click', () => {
  ensureAudio();
  toggleMute();
  updateTopbar();
});

// Screenshot presets (?shot=1|2|3) — real game states for the maker's shots.
const shotParam = new URLSearchParams(window.location.search).get('shot');
if (shotParam) {
  resetGame();
  applyShotPreset(state, Number(shotParam) || 1);
  updateTopbar();
  if (state.toast) showToast(state.toast, 3); // sync the DOM toast to the preset
}

// ---- main loop --------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
updateTopbar();
requestAnimationFrame(frame);
