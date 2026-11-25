// Sizzle & Serve — Ember Lane Kitchen: the hand-in program (Node 22, stdlib).
// It copies this repository's game/ and screenshots/ into /output and writes
// /output/dossier.json with buildDossier from the vendored make.fun library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: the same repository always writes the same
// bytes, so the grader's two runs agree byte for byte.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

// Resolve everything from this file's own directory, never from the cwd:
// the grader may run main.ts from another working directory.
const here = import.meta.dirname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

if (!existsSync(gameDir)) throw new Error('game/ is missing from the repository');
if (!existsSync(join(gameDir, 'index.html'))) throw new Error('game/index.html is missing');
// The gate needs 3 or 4 screenshots: fail fast here instead of handing in
// an entry the scorer would refuse.
if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing from the repository');
const shotFiles = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}

// Start from a clean output directory so stale files never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The dossier is built from the copied output, exactly as the sealed scorer
// rebuilds it — same library, same caps, so the two agree byte for byte.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
