// Sizzle & Serve — the kitchen: floor plan, stations, and the room's look.
// Stations are rectangles the chef walks up to and uses with E / click.
// Layout (1280x720 canvas): the order board lives at the top, bins along the
// left wall, grill top-right, chopping board centre, plating bottom-centre,
// serving window right wall, trash bottom-left.
export const STATIONS = [
  { id: 'bins',     label: 'Ingredient Bins', x: 24,  y: 150, w: 120, h: 330, color: '#8a5a2b' },
  { id: 'board',    label: 'Chopping Board',  x: 300, y: 300, w: 190, h: 130, color: '#c89a5e' },
  { id: 'grill',    label: 'Grill',           x: 900, y: 150, w: 240, h: 130, color: '#3d3d46' },
  { id: 'plating',  label: 'Plating Counter', x: 500, y: 560, w: 280, h: 110, color: '#b8b0a2' },
  { id: 'serve',    label: 'Serving Window',  x: 1140, y: 300, w: 116, h: 180, color: '#d8a03c' },
  { id: 'trash',    label: 'Trash',           x: 24,  y: 560, w: 110, h: 110, color: '#5c665e' },
];

// Ingredient bins sit inside the bins station, top to bottom.
export const BIN_SLOTS = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'onion'];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

// The chef can use a station when standing just outside its edge.
export function nearStation(chef, st, pad = 46) {
  const cx = Math.max(st.x, Math.min(chef.x, st.x + st.w));
  const cy = Math.max(st.y, Math.min(chef.y, st.y + st.h));
  const dx = chef.x - cx;
  const dy = chef.y - cy;
  return dx * dx + dy * dy < pad * pad;
}

export function nearestStation(chef) {
  let best = null;
  let bestD = Infinity;
  for (const st of STATIONS) {
    if (!nearStation(chef, st)) continue;
    const c = stationCenter(st);
    const d = (chef.x - c.x) ** 2 + (chef.y - c.y) ** 2;
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

export function drawKitchen(ctx, W, H, t) {
  // Floor: warm checker tiles.
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#8a5a33' : '#7d4f2c';
      ctx.fillRect(tx * 80, 120 + ty * 75, 80, 75);
    }
  }
  // Wall band + skirting.
  ctx.fillStyle = '#5e3a1e'; ctx.fillRect(0, 100, W, 22);
  ctx.fillStyle = '#f3e2c2'; ctx.fillRect(0, 118, W, 4);
  // Hanging lamps.
  for (const lx of [240, 640, 1040]) {
    ctx.strokeStyle = '#2c1c10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 52); ctx.stroke();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.arc(lx, 62, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,179,71,0.18)';
    ctx.beginPath(); ctx.arc(lx, 62, 44 + Math.sin(t * 2 + lx) * 3, 0, Math.PI * 2); ctx.fill();
  }
  // Potted herb on the wall.
  ctx.fillStyle = '#b5563a';
  ctx.fillRect(1200, 84, 34, 26);
  ctx.fillStyle = '#5fbf3f';
  ctx.beginPath(); ctx.arc(1217, 78, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1204, 84, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1230, 84, 10, 0, Math.PI * 2); ctx.fill();
}

export function drawStation(ctx, st, highlight, t) {
  ctx.save();
  ctx.fillStyle = st.color;
  roundRect(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.fill();
  ctx.strokeStyle = highlight ? '#ffd75e' : 'rgba(0,0,0,0.45)';
  ctx.lineWidth = highlight ? 4 : 2;
  roundRect(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.stroke();
  if (highlight) {
    ctx.fillStyle = 'rgba(255,215,94,0.25)';
    roundRect(ctx, st.x - 6, st.y - 6, st.w + 12, st.h + 12, 16);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3e0';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(st.label, st.x + st.w / 2, st.y + st.h - 16);
  ctx.restore();
  void t;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
