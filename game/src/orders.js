// Sizzle & Serve — the order board: tickets arrive, tick down, and pay out.
// Tickets carry a recipe, a countdown, and a patience bar the player can read
// at a glance. Pressure grows as the day goes on: tickets arrive faster and
// their timers get shorter.
import { randomRecipe, plateMatchesRecipe } from './recipes.js';

export const MAX_TICKETS = 4;

export function createOrderBoard() {
  return {
    tickets: [],
    spawnTimer: 2.5,   // seconds until the first ticket
    served: 0,
    missed: 0,
    rushLevel: 1,      // rises every 45s of the day
  };
}

// How long a ticket patiently waits, in seconds, at the current rush level.
export function ticketPatience(rushLevel) {
  return Math.max(28, 52 - rushLevel * 5);
}

export function spawnTicket(board, now) {
  if (board.tickets.length >= MAX_TICKETS) return null;
  const recipe = randomRecipe();
  const ticket = {
    id: now + '-' + board.tickets.length + '-' + Math.floor(Math.random() * 1e6),
    recipe,
    bornAt: now,
    patience: ticketPatience(board.rushLevel),
    age: 0,
  };
  board.tickets.push(ticket);
  return ticket;
}

export function updateOrderBoard(board, dt, now) {
  board.spawnTimer -= dt;
  if (board.spawnTimer <= 0) {
    const t = spawnTicket(board, now);
    if (t) {
      board.spawnTimer = 9 - board.rushLevel; // next ticket sooner as rush grows
      if (board.spawnTimer < 3.5) board.spawnTimer = 3.5;
    } else {
      board.spawnTimer = 2;
    }
  }
  const expired = [];
  for (const ticket of board.tickets) {
    ticket.age += dt;
    if (ticket.age >= ticket.patience) expired.push(ticket);
  }
  if (expired.length) {
    board.tickets = board.tickets.filter((t) => !expired.includes(t));
    board.missed += expired.length;
  }
  return expired;
}

// The ticket this plate can satisfy, if any (first match wins).
export function findMatchingTicket(board, plateParts) {
  return board.tickets.find((t) => plateMatchesRecipe(plateParts, t.recipe)) ?? null;
}

export function ticketTimeLeft(ticket) {
  return Math.max(0, ticket.patience - ticket.age);
}

export function ticketUrgency(ticket) {
  const left = ticketTimeLeft(ticket);
  if (left <= 10) return 'critical';
  if (left <= 20) return 'hurried';
  return 'calm';
}
