# BUILD-STATE — best-cooking-game-20261125-0137

- Bounty: "Make the best cooking game", $250, Games
- Slug: best-cooking-game-20261125-0137
- Fee: FREE (requirements API entry_fee null, verified 2026-11-25 ~10:09 WIB)
- Published: 2026-11-25T01:37:00Z; entries close Wed 2026-11-25 20:37 WIB
- Builder session id: c5ba3781-89b8-4c00-9bb7-82886a379da0
- Init: `makefun anchor 675fb881761540481fe213ff2bb36d0eb2d5dbe6 round 34257618`
- Anchor (root commit): 675fb881761540481fe213ff2bb36d0eb2d5dbe6
- Code commit: ffd1548b44aa4f697129db762e0ba0b56d5a2f07
- Repo: https://github.com/Arkanjak/best-cooking-game-20261125-0137
- Branch: submission
- Workdir: ~/workspace/makefun/best-cooking-game-20261125-0137/

## Entry

**Sizzle & Serve — Ember Lane Kitchen.** Original 2D canvas lunch-rush
cooking game, fully offline (no network, no libraries, all art drawn and
all sound synthesised in code). Order board with ticket timers, ingredient
bins, chopping board (mash E), grill (6s cook, 5s to burn), plating
counter, serving window, combos, 3-minute day with star rating.
4 recipes: Ember Burger, Cheesy Melt, Garden Stack, Double Ember.

## Verification

- Playwright headless Chromium: 0 console/page errors; full playtest
  (start, walk, grab ingredient) passed.
- Screenshots: 3 real renders of the game's own code via `?shot=1|2|3`
  (1280x860, ~98–100 KiB each, under the 256 KiB cap):
  1-kitchen-rush.jpg (cover), 2-mid-assembly.jpg, 3-serve-ready.jpg.
- Logic unit checks: plateMatchesRecipe / findMatchingTicket pass/fail
  correctly (shuffled parts match, partial plate does not).
- main.ts run from 2 cwds (workdir + home): byte-identical trees,
  dossier.json sha256 bc474ef2167b518ffff4a35a3580acdfadf72cb0db442d4863e98075bcaca723.
- main.ts written in 2 messages (v1 full write + genuine validation edit
  in a later message); game files revised in later messages (orders.js
  findMatchingTicket fix, toast/board/shot fixes after screenshot review).

## Flags

None.

## Coordinator TODO (do NOT do as builder)

- Bundle / check / submit with the kit CLI.
- Fill submission id + claim code in SUBMISSION.md.
