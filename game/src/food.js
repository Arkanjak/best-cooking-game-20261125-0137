// Sizzle & Serve — food art: every ingredient drawn on canvas, no image files.
// Each draw function paints one item centred at (x, y) at radius r, so the
// kitchen, the plate and the tickets all share one look.
import { INGREDIENTS } from './recipes.js';

export function drawIngredient(ctx, part, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (part === 'bun') drawBun(ctx, r);
  else if (part === 'patty') drawPatty(ctx, r, state);
  else if (part === 'tomato') drawTomato(ctx, r, state);
  else if (part === 'lettuce') drawLettuce(ctx, r, state);
  else if (part === 'cheese') drawCheese(ctx, r);
  else if (part === 'onion') drawOnion(ctx, r, state);
  else drawMystery(ctx, r);
  if (state === 'burnt') {
    ctx.fillStyle = 'rgba(20,10,5,0.45)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a0d05'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBun(ctx, r) {
  ctx.fillStyle = '#e8a94f';
  ctx.beginPath(); ctx.ellipse(0, r * 0.15, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7cd7d';
  ctx.beginPath(); ctx.ellipse(0, -r * 0.18, r * 0.92, r * 0.62, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff2cf';
  for (const [sx, sy] of [[-0.45, -0.35], [0, -0.55], [0.45, -0.35], [-0.2, -0.15], [0.25, -0.2]]) {
    ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPatty(ctx, r, state) {
  const cooked = state === 'grilled';
  ctx.fillStyle = cooked ? '#6e3418' : '#c98a6b';
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cooked ? '#4a2010' : '#a86a4e';
  for (const gx of [-0.5, 0, 0.5]) {
    ctx.fillRect(gx * r - r * 0.05, -r * 0.45, r * 0.1, r * 0.9);
  }
  if (cooked) {
    ctx.fillStyle = 'rgba(255,190,90,0.25)';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.7, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTomato(ctx, r, state) {
  ctx.fillStyle = '#e23b2e';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0665a';
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.45, 0, Math.PI * 2); ctx.fill();
  if (state === 'chopped') {
    ctx.strokeStyle = '#8f1d12'; ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, r * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.6, -r * 0.6); ctx.lineTo(-r * 0.6, r * 0.6); ctx.stroke();
  } else {
    ctx.fillStyle = '#3f9e2e';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.3, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLettuce(ctx, r, state) {
  ctx.fillStyle = '#5fbf3f';
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.38, a, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = '#8ed96a';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
  if (state === 'chopped') {
    ctx.strokeStyle = '#2f7a1e'; ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.stroke();
  }
}

function drawCheese(ctx, r) {
  ctx.fillStyle = '#ffcf3d';
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.55); ctx.lineTo(-r, -r * 0.2);
  ctx.lineTo(0, -r * 0.8); ctx.lineTo(r, -r * 0.2); ctx.lineTo(r, r * 0.55);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8a90c';
  for (const [hx, hy] of [[-0.4, 0.1], [0.25, -0.15], [0.45, 0.3], [-0.1, 0.35]]) {
    ctx.beginPath(); ctx.arc(hx * r, hy * r, r * 0.11, 0, Math.PI * 2); ctx.fill();
  }
}

function drawOnion(ctx, r, state) {
  ctx.fillStyle = '#efe2f5';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a8d8'; ctx.lineWidth = Math.max(1.5, r * 0.06);
  for (const rr of [0.65, 0.4, 0.18]) {
    ctx.beginPath(); ctx.arc(0, 0, r * rr, 0, Math.PI * 2); ctx.stroke();
  }
  if (state === 'chopped') {
    ctx.strokeStyle = '#9a6fb0'; ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, r * 0.6); ctx.stroke();
  }
}

function drawMystery(ctx, r) {
  ctx.fillStyle = '#999';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `bold ${r}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, r * 0.05);
}

export function ingredientColor(part) {
  return INGREDIENTS[part]?.color ?? '#999';
}
