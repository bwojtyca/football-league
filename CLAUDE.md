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
- Prefer established, well-liked libraries over home-grown code for solved problems (i18n,
  charts, Firebase bindings, tournament brackets...): they are easier to swap or extend and cost
  nothing to maintain. Write custom code only for what is specific to this app.

## Working on it

- Angular 22 needs Node >= 22.22.3; cloud containers ship 22.22.0. Download Node 24 from
  https://nodejs.org/dist/ into the scratchpad and put it first on `PATH` (see `.nvmrc`).
- `npm ci`, `npm start` (uses the real Firestore), `npm run build`, `npm test` (Vitest).
- Local data: `npm run emulator` (needs Java 21) and `npm run start:emulator`; the emulator uses
  the `demo-football-league` project and never touches production. The emulator does not
  reload rules reliably: restart it after editing `firestore.rules`.
- The `emulator` build configuration only swaps the environment, so it combines with others:
  `ng build -c production,emulator` is the production bundle (with the service worker) against
  the emulator.

## Deploys (everything goes out from `master`)

- A push to `master` builds and publishes GitHub Pages (`.github/workflows/deploy.yml`).
- A change to `firestore.rules` or `firebase.json` on `master` deploys the rules
  (`.github/workflows/firebase.yml`, service account key in the `FIREBASE_SERVICE_ACCOUNT`
  secret, rules-only roles). On other branches the same workflow runs a `--dry-run`.
- Merging to `master` is a production deploy: ask the owner before each merge.

## Data (Firestore project `football-league-b6e95`)

- `leagues/{id}`: `name`, `created`, `players` (ids, only ever added), `archived?`. The 2017
  league is the document `leagues/legacy` ("Najdroższa Liga Świata", archived).
- `players/{id}`: `name`. Documents from 2017 also hold `wins`, `loses` and `id`; these are
  legacy and unused.
- `games/{id}`: `league?`, `players` (ids), `start`, `end?`, `win?` (`'red' | 'blue'`),
  `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`. A game without `league`
  belongs to the league `legacy` (`leagueOf()` in `league/league.ts`).
- Rankings and stats are computed from games, not from player counters (those drifted in 2017).
- The database is publicly readable; `firestore.rules` allows only the writes the app makes
  (create leagues, rename or archive them and add players; create players; create games; one
  goal per update; close a won game; delete running games).
  Every new kind of write needs a rules change, tested on the emulator first.
- Do not bulk-read production data without asking the owner.

## Code map

- Standalone components, signals, zoneless change detection, lazy routes with hash URLs
  (`#/leagues`, `#/l/<league>`, `#/l/<league>/player/<id>`, `#/game/<id>`); `/` opens the
  league used last.
- Libraries: Angular Material 3 (theme in `src/styles.scss`, light and dark), Transloco for
  i18n (`public/i18n/{pl,en}.json`, ICU plurals via `transloco-messageformat`, dates and
  numbers via `transloco-locale`, language kept by `transloco-persist-lang`), rxfire for
  Firestore observables, ng2-charts (Chart.js) for the rating chart, Fontsource and
  `material-icons` for self-hosted fonts, `@angular/service-worker` for offline use and
  installing on phones (a snackbar offers to reload when a new deploy is ready).
- `src/app/firebase.ts`: Firestore instance with a persistent IndexedDB cache.
- `GameService` keeps one live listener on all games; per-league lists, Elo ratings
  (`player/rating.ts`), rankings and stats all derive from it. `scoreGoal()` writes an
  `increment()` (applied locally at once). Once the writes reach the server, the scoring device
  records the result with `closeGame()` (a transaction); a device only watching a decided game
  closes it after 5 s.
- `LeagueService` lists leagues and remembers the last one (localStorage).
- `game/game.ts`, `player/player.ts` and `player/rating.ts` hold the pure scoring, ranking and
  Elo functions.

## Plan (October 2026)

Analysis of the 2017 games, other foosball formats and the first mockups:
https://claude.ai/artifact/RcFTGpWyd4qfBXqF4SSATt (read it with the Artifact tool).

Decisions by the owner:
- Default game stays "to 8". Main ranking is Elo (start 1500, K 24, team = average of its
  players) with the +/- change shown after each game; win % moves to the player profile.
- UI in Polish and English from the start (switchable at runtime), designed for phones first.
- Leagues ("Liga" / "League") group play by place or crowd, e.g. "Biuro X 2026" or a weekend
  trip. Many leagues can run at once, each with its own ranking and stats; players are global
  and can join several leagues. The 2017 games form the read-only league "Najdroższa Liga Świata" (id `legacy`): games
  without a `league` field belong to it, so old documents are never rewritten.
- For now every league is visible to everyone (simplest). Later: Google sign-in with a guest
  mode that joins leagues by link.
- Inside a league people can play any game mode; tournaments (round robin, group stage with
  knockout, draws / draw your partner, king of the table) come later inside leagues.

Stages:
1. (Done.) Leagues with the legacy league, Elo ranking per league, player profile, PL/EN, Material 3
   theme with dark mode, phone portrait layout of the game screen.
2. Match: event log in the game document (each goal with time, player and position), undo,
   swapping positions mid-game (ITSF allows it between goals), modes (to 5/8/10, win by 2,
   timed, best-of series with colour swap), rematch.
3. Tournaments inside leagues.
