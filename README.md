# 🍳 Sizzle & Serve — Ember Lane Kitchen

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-ff6b4a)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![game](https://img.shields.io/badge/game-playable%20offline-5fbf3f)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Make the best cooking game** — a $250 make.fun bounty entry. A complete,
original lunch-rush cooking game that runs entirely offline in a desktop
browser: static files under `game/`, no network requests, no libraries.

## The game

You run Ember Lane Kitchen, a tiny diner with a huge lunch rush. Tickets
land on the order board with a countdown — fetch ingredients from the bins,
chop veg on the board, grill patties on the stove (don't let them burn!),
stack the dish on the plate, and serve it at the window before the customer
walks out. Combos pay extra; the rush level climbs every 45 seconds.

- **Move:** WASD / arrow keys, or click anywhere to walk there
- **Interact:** E, Space, or click a station (it glows when you're close)
- **Chop:** mash E at the chopping board (3 hits)
- **Grill:** patties take 6s, then burn after 5s — grab them in time
- **Menu:** Ember Burger · Cheesy Melt · Garden Stack · Double Ember
- **Day:** 3 minutes, then your star rating (serve 12+ dishes for 3★)

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots in `screenshots/` are real renders of the game's own code
(`?shot=1|2|3` seeds a busy kitchen, a dish mid-assembly, and the final rush).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
into `/output` and writes `/output/dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Referral

Built with make.fun — referral code `ne0pfbnn`.

## License

MIT — see [LICENSE](LICENSE).
