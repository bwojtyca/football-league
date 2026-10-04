// Runs the app's potato ranking (src/app/player/potato.ts, as it is now) over the games of a
// backup (scripts/backup.mjs), game by game, to check the balance of its rules before they
// go live: who holds the title (one of the two weakest by Elo, one of the two strongest, the
// leader), how often it moves, the highest score ever, the top score over time and the
// final table. The aim: the weak get mocked, the strong cannot get cocky.
//
//   node scripts/simulate-potato.mjs <backup dir> [league id]
//
// Without a league id it takes the 2017 games (those without a league).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const [dir, league] = process.argv.slice(2);
if (!dir) {
  throw new Error('Usage: node scripts/simulate-potato.mjs <backup dir> [league id]');
}

const bundle = await build({
  stdin: {
    contents: `export { potatoRanking, POTATO_MIN_GAMES } from './src/app/player/potato';
      export { computeRatings } from './src/app/player/rating';`,
    resolveDir: '.',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'warning',
});
const { potatoRanking, computeRatings, POTATO_MIN_GAMES } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

const value = (v) =>
  'stringValue' in v
    ? v.stringValue
    : 'integerValue' in v
      ? Number(v.integerValue)
      : 'doubleValue' in v
        ? v.doubleValue
        : 'booleanValue' in v
          ? v.booleanValue
          : 'arrayValue' in v
            ? (v.arrayValue.values ?? []).map(value)
            : 'mapValue' in v
              ? decode(v.mapValue.fields ?? {})
              : null;
const decode = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, value(v)]));
const read = (name) => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));

const names = Object.fromEntries(
  read('players').map((doc) => [doc.name.split('/').pop(), doc.fields.name.stringValue]),
);
const games = read('games')
  .map((doc) => ({ id: doc.name.split('/').pop(), ...decode(doc.fields ?? {}) }))
  .filter((game) => game.win && !game.deleted && (league ? game.league === league : !game.league))
  .sort((a, b) => (a.start < b.start ? -1 : 1));

let changes = 0;
let potato;
let record = 0;
const tops = [];
const held = { games: 0, weak: 0, strong: 0, leader: 0 };
for (let i = 1; i <= games.length; i++) {
  const played = games.slice(0, i);
  const rows = potatoRanking(played);
  const now = rows.find((row) => row.isPotato)?.player;
  changes += Number(now !== potato);
  potato = now;
  if (now) {
    // Where the potato stands in the Elo ranking of those with enough games.
    const enough = new Set(
      rows.filter((row) => row.games >= POTATO_MIN_GAMES).map((r) => r.player),
    );
    const byElo = [...computeRatings(played).current]
      .filter(([player]) => enough.has(player))
      .sort((a, b) => b[1] - a[1])
      .map(([player]) => player);
    const place = byElo.indexOf(now);
    held.games++;
    held.weak += Number(place >= byElo.length - 2);
    held.strong += Number(place <= 1);
    held.leader += Number(place === 0);
  }
  const top = Math.max(...rows.map((row) => row.points));
  record = Math.max(record, top);
  if (i % 50 === 0 || i === games.length) {
    tops.push(top);
  }
}
const share = (n) => `${Math.round((100 * n) / held.games)}%`;
console.log(`${games.length} games; the potato title moved ${changes} times; record ${record}`);
console.log(
  `the potato was one of the two weakest ${share(held.weak)} of the time, ` +
    `one of the two strongest ${share(held.strong)}, the leader ${share(held.leader)}`,
);
console.log(`top score every 50 games: ${tops.join(' → ')}`);
console.log(
  'final:',
  potatoRanking(games)
    .map((row) => `${names[row.player] ?? row.player} ${row.points}${row.isPotato ? ' 🥔' : ''}`)
    .join(', '),
);
