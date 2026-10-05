// Runs the app's potato of the day (src/app/player/potato.ts, as it is now) over the games of a
// backup (scripts/backup.mjs), day by day, to check the balance of its rules before they go
// live: who becomes the potato of the day (one of the two weakest by Elo, one of the two
// strongest, the leader), how often yesterday's potato stays one, how many potatoes there are
// at once, and the days each player ended as the potato. The aim: the weak get mocked, the
// strong cannot get cocky.
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
    contents: `export { dayOf, potatoState } from './src/app/player/potato';
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
const { dayOf, potatoState, computeRatings } = await import(
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
const name = (id) => names[id] ?? id;
const games = read('games')
  .map((doc) => ({ id: doc.name.split('/').pop(), ...decode(doc.fields ?? {}) }))
  .filter((game) => game.win && !game.deleted && (league ? game.league === league : !game.league))
  .sort((a, b) => (a.start < b.start ? -1 : 1));

// Every day finished: "now" is after the last game.
const state = potatoState(games, new Date(Date.parse(games.at(-1).start) + 2 * 86_400_000));
const share = { weak: 0, strong: 0, leader: 0 };
let stayed = 0;
let chances = 0;
let several = 0;
for (const { day, player } of state.potatoes) {
  // Elo and games played at the end of that day.
  const upTo = games.filter((game) => dayOf(game.start) <= day);
  const counts = new Map();
  for (const game of upTo) {
    for (const id of new Set(game.players)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const byElo = [...computeRatings(upTo).current]
    .filter(([id]) => counts.get(id) >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const place = byElo.indexOf(player);
  share.weak += Number(place >= byElo.length - 2);
  share.strong += Number(place >= 0 && place <= 1);
  share.leader += Number(place === 0);
  // Yesterday's potatoes who played that day: did they stay the potato?
  const before = potatoState(upTo, new Date(`${day}T12:00:00`)).holders.map((h) => h.player);
  const played = new Set(upTo.filter((g) => dayOf(g.start) === day).flatMap((g) => g.players));
  for (const holder of before.filter((id) => played.has(id))) {
    chances++;
    stayed += Number(holder === player);
  }
  several += Number(before.length > 1);
}
const n = state.potatoes.length;
const pct = (k) => `${Math.round((100 * k) / n)}%`;
console.log(`${games.length} games on ${n} days`);
console.log(
  `the potato of the day was one of the two weakest ${pct(share.weak)} of the days, ` +
    `one of the two strongest ${pct(share.strong)}, the leader ${pct(share.leader)}`,
);
console.log(`yesterday's potato stayed the potato ${stayed} of ${chances} times they played`);
console.log(`days that began with more than one potato: ${several}`);
console.log(
  'days as the potato:',
  [...state.days]
    .sort((a, b) => b[1] - a[1])
    .map(([id, days]) => `${name(id)} ${days}`)
    .join(', '),
);
console.log(
  'potatoes now:',
  state.holders.map((h) => `${name(h.player)} (since ${h.since})`).join(', '),
);
