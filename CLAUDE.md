# Football League

Office foosball league app, written in 2017 and revived in October 2026: Angular 22, Angular
Material 22 and the Firebase JS SDK 12 (Firestore only: no backend, no sign-in). Live at
https://bwojtyca.github.io/football-league/. The owner writes in Polish; answer in Polish.

## Principles from the owner

- It is a game for fun among friends. Keep the app simple and the code proportionate; it does
  not need to be "enterprise" grade.
- Stay backward compatible: the 421 games from 2017 must keep working. New fields are optional,
  old documents are never migrated destructively, and old games simply lack new data.
- Starting a game takes at most 3 taps, a rematch 1 tap. Defaults stay: game to 8, 2 vs 2, no login.
- Test suites are not a priority ("we work live"): build, check the change in the app, and use
  the Firestore emulator for anything that touches data or security rules.

## Working on it

- Angular 22 needs Node >= 22.22.3; cloud containers ship 22.22.0. Download Node 24 from
  https://nodejs.org/dist/ into the scratchpad and put it first on `PATH` (see `.nvmrc`).
- `npm ci`, `npm start` (uses the real Firestore), `npm run build`, `npm test` (Vitest).
- Local data: `npm run emulator` (needs Java 21) and `npm run start:emulator`; the emulator uses
  the `demo-football-league` project and never touches production.

## Deploys (everything goes out from `master`)

- A push to `master` builds and publishes GitHub Pages (`.github/workflows/deploy.yml`).
- A change to `firestore.rules` or `firebase.json` on `master` deploys the rules
  (`.github/workflows/firebase.yml`, service account key in the `FIREBASE_SERVICE_ACCOUNT`
  secret, rules-only roles). On other branches the same workflow runs a `--dry-run`.
- Merging to `master` is a production deploy: ask the owner before each merge.

## Data (Firestore project `football-league-b6e95`)

- `players/{id}`: `name`. Documents from 2017 also hold `wins`, `loses` and `id`; these are
  legacy and unused.
- `games/{id}`: `players` (ids), `start`, `end?`, `win?` (`'red' | 'blue'`),
  `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`.
- Rankings and stats are computed from games, not from player counters (those drifted in 2017).
- The database is publicly readable; `firestore.rules` allows only the writes the app makes
  (create players, create games, one goal per update, close a won game, delete running games).
  Every new kind of write needs a rules change, tested on the emulator first.
- Do not bulk-read production data without asking the owner.

## Code map

- Standalone components, signals, zoneless change detection.
- `src/app/firebase.ts`: Firestore instance (persistent IndexedDB cache) and the
  `collectionData` / `docData` helpers.
- `GameService` keeps one live listener on all games; `playerGames()` and the ranking derive from
  it. `scoreGoal()` writes an `increment()` (applied locally at once); `closeGame()` records the
  result in a transaction. A device only watching a decided game closes it after 5 s.
- `game/game.ts` and `player/player.ts` hold the pure scoring and ranking functions.

## Plan (October 2026)

Analysis of the 2017 games, other foosball formats and the first mockups:
https://claude.ai/artifact/RcFTGpWyd4qfBXqF4SSATt (read it with the Artifact tool).

Decisions by the owner:
- Default game stays "to 8". Main ranking is Elo (start 1500, K 24, team = average of its
  players) with the +/- change shown after each game; win % moves to the player profile.
- UI in Polish and English from the start (switchable at runtime), designed for phones first.
- Leagues ("Liga" / "League") group play by place or crowd, e.g. "Biuro X 2026" or a weekend
  trip. Many leagues can run at once, each with its own ranking and stats; players are global
  and can join several leagues. The 2017 games form the read-only "Legacy 2017" league: games
  without a `league` field belong to it, so old documents are never rewritten.
- For now every league is visible to everyone (simplest). Later: Google sign-in with a guest
  mode that joins leagues by link.
- Inside a league people can play any game mode; tournaments (round robin, group stage with
  knockout, draws / draw your partner, king of the table) come later inside leagues.

Stages:
1. Leagues with the legacy league, Elo ranking per league, player profile, PL/EN, Material 3
   theme with dark mode, phone portrait layout of the game screen.
2. Match: event log in the game document (each goal with time, player and position), undo,
   swapping positions mid-game (ITSF allows it between goals), modes (to 5/8/10, win by 2,
   timed, best-of series with colour swap), rematch.
3. Tournaments inside leagues.
