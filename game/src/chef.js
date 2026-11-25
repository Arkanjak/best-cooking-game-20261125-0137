// Sizzle & Serve — the chef: movement, carrying, and the little cook.
// The chef walks the floor with WASD/arrows or by clicking a spot, and can
// carry up to two items (one per hand). Hands are drawn above the chef.
export const CHEF_SPEED = 250; // px per second
export const CHEF_RADIUS = 24;

export function createChef() {
  return {
    x: 640, y: 430,           // start in the middle of the floor
    dir: 1,                  // facing: 1 right, -1 left
    moving: false,
    walkPhase: 0,
    target: null,            // click-to-move destination {x, y} or null
    hands: [],               // carried items: { part, state }
  };
}

export function chefHandsFull(chef) {
  return chef.hands.length >= 2;
}

export function chefTake(chef, item) {
  if (chefHandsFull(chef)) return false;
  chef.hands.push(item);
  return true;
}

export function chefDrop(chef, index = 0) {
  if (index < 0 || index >= chef.hands.length) return null;
  return chef.hands.splice(index, 1)[0];
}

export function chefCarries(chef, part, state) {
  return chef.hands.findIndex((h) => h.part === part && (state === undefined || h.state === state));
}

export function updateChef(chef, keys, dt, bounds) {
  let vx = 0;
  let vy = 0;
  if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
  if (keys.has('arrowright') || keys.has('d')) vx += 1;
  if (keys.has('arrowup') || keys.has('w')) vy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) vy += 1;
  if (vx !== 0 || vy !== 0) {
    chef.target = null; // keys override a click destination
    const len = Math.hypot(vx, vy);
    vx /= len; vy /= len;
    chef.x += vx * CHEF_SPEED * dt;
    chef.y += vy * CHEF_SPEED * dt;
    chef.dir = vx < 0 ? -1 : vx > 0 ? 1 : chef.dir;
    chef.moving = true;
    chef.walkPhase += dt * 12;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      chef.target = null;
      chef.moving = false;
    } else {
      chef.x += (dx / dist) * CHEF_SPEED * dt;
      chef.y += (dy / dist) * CHEF_SPEED * dt;
      chef.dir = dx < 0 ? -1 : 1;
      chef.moving = true;
      chef.walkPhase += dt * 12;
    }
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(bounds.minX, Math.min(bounds.maxX, chef.x));
  chef.y = Math.max(bounds.minY, Math.min(bounds.maxY, chef.y));
}

export function drawChef(ctx, chef, t) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : Math.sin(t * 2) * 1.5;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.3);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 26, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f3e2c2';
  ctx.beginPath(); ctx.ellipse(0, 8, 20, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2e7fc2';
  ctx.fillRect(-14, 2, 28, 18);
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -18, 15, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-7, -30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -30, 26, 7);
  // Face: eyes look in the facing direction.
  ctx.fillStyle = '#241505';
  ctx.beginPath(); ctx.arc(chef.dir * 3 - 5, -19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.dir * 3 + 5, -19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a34d1e'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(chef.dir * 3, -13, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Carried items float above the hands.
  chef.hands.forEach((item, i) => {
    const hx = (i === 0 ? -26 : 26);
    const hy = -6 + Math.sin(t * 3 + i * 2) * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(hx, hy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241505';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(item.part.slice(0, 2).toUpperCase(), hx, hy);
  });
  ctx.restore();
}
