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

- `leagues/{id}`: `name`, `created`, `players` (ids, only ever added), `archived?` (locked: no
  new games, tournaments or players), `minGames?` (fewest games to be ranked), `deleted?`
  (hidden, restorable), `gamesDeleted?` (its games were deleted with it and come back with it). The 2017 league is still the document `leagues/legacy` ("Najdroższa
  Liga Świata"); see the migration note below.
- `players/{id}`: `name`. Documents from 2017 also hold `wins`, `loses` and `id`; these are
  legacy and unused.
- `games/{id}`: `league?`, `players` (ids), `start`, `end?`, `win?` (`'red' | 'blue'`),
  `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`. A game without `league`
  belongs to the league `legacy` (`leagueOf()` in `league/league.ts`). Games started since
  stage 2 also have:
  - `mode` = `{ target, winBy?, max?, minutes? }` (no mode = to 8). The picker combines a
    target (5/8/10), win by 2 without a cap and a time limit (3/5/7/10 min); `max` only
    exists in stage 2 games;
  - `events` = list of `{ at, type: 'goal' | 'own', team, position, player }` and
    `{ at, type: 'swap', team }`, `at` in ms since the start. The goal totals in `teams` stay
    and change together with the log, so old views and the 2017 games need no log;
  - `series?` = `{ id, bestOf, game }`, `id` being the first game's id; teams swap colours
    from game to game, the series score is counted from the games;
  - `tournament?` = id of the tournament the game belongs to;
  - `deleted?`: hidden from rankings and stats, restorable (any game can be marked; only running
    games are erased for good);
  - `paused?` (ISO time the clock stopped) and `pausedFor?` (ms of earlier pauses): the clock,
    time limits and event times count play time only (`playTime()`).
- `tournaments/{id}`: `league`, `name`, `format` (`'series' | 'open' | 'king' | 'dyp' |
  'roundRobin' | 'rotation' | 'cup'`), `created`, `groups?` (cup: 0 or 2), `bestOf?` (series),
  `mode` (as in games), `teamSize` (1 or 2), `entries` (who joined or left, in order:
  `{ player, at, out? }`, append-only), `teams?` (round robin: fixed lineups), `end?`.
  Queues, draws, fixtures and tables are computed from the tournament's games
  (`tournament/tournament.ts`), so devices never have to agree on shared state.
- Rankings and stats are computed from games, not from player counters (those drifted in 2017).
- The database is publicly readable; `firestore.rules` allows only the writes the app makes
  (create leagues, rename or archive them and add players; create players; create games; one
  goal per update with its event, a swap of positions or undoing the last event; close a won
  game; delete running games; create tournaments, append one entry at a time, rename and end
  them). Games without `events` keep the pre-2026 behaviour.
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
- The look (`src/styles.scss`): a foosball table and its score sheet. `--fl-*` tokens: warm
  paper and black ink for pages, the yellow ball (`--fl-ball`, class `fl-cta` on a button) for
  the one main action of a screen, the green felt for the Today card and the overall ranking,
  the dark scoreboard (`--fl-board`) for scores, the game screen and summaries (such blocks set
  `color-scheme: dark`, so every `light-dark()` token inside takes its dark value). Material's
  `--mat-sys-*` colours and component tokens are mapped onto them. Headings are Barlow
  Condensed 800 italic in capitals (`fl-title`, small labels `fl-kicker`); end-to-end checks
  must compare texts case-insensitively, since `innerText` returns the capitals.
- `src/app/firebase.ts`: Firestore instance with a persistent IndexedDB cache.
- `GameService` keeps one live listener on all games; per-league lists, Elo ratings
  (`player/rating.ts`), rankings, series and stats all derive from it. `scoreGoal()` writes an
  `increment()` plus `arrayUnion()` of the event (applied locally at once, works offline);
  `undo()` uses `increment(-1)` and `arrayRemove()`. A decided game waits 5 s for an undo, then
  any device showing it records the result with `closeGame()` (a transaction); the device that
  scored the deciding goal offers a rematch, or the next game of a series. The game screen
  keeps the phone's screen on (Wake Lock API).
- `LeagueService` lists leagues and remembers the last one (localStorage); `update()` changes
  settings. `player/ranking/ranking.component.ts` is the ranking (players by Elo or win %,
  pairs; players below `minGames` listed apart). The league page
  starts with a "Today" card (today's games, the current run between the same two teams, a
  rematch).
- `game/timeline.ts` tells how a logged game went (score after each goal, longest run, biggest
  leads, comeback); the finished game screen opens it in a bottom sheet with a step chart.
- The new game dialog suggests the most even split of four players (Elo) when it is clearly
  more even than the chosen one. `game/mode/` has the shared rules picker and label.
- Game screen: a decided game shows `FinishPanelComponent` for 8 s (`FINISH_AFTER_MS`), then
  any device records the result; the scoring device (or whoever taps "Next") moves on.
- `TournamentService` lists tournaments; `tournament/tournament.ts` holds the pure logic: king
  of the table queue and streaks, draw-your-partner draws (fewest games first, new partners,
  even teams), round robin fixtures (circle method) and tables. A tournament game sends the
  scoring device back to the tournament page, where the next game starts with one tap.
- `game/game.ts`, `player/player.ts` and `player/rating.ts` hold the pure scoring, ranking and
  Elo functions; `rating.ts` also rates defence and attack separately (2 vs 2 games only).
  `player/records.ts` has the profile records, achievements (clean sheet, comeback from 4
  down, 5 wins in a row, 100th game) and the pairs ("duets") ranking.

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
2. (Done.) Match: event log in the game document (each goal with time, player and position), undo,
   swapping positions mid-game (ITSF allows it between goals), modes (to 5/8/10, win by 2,
   timed, best-of series with colour swap), rematch.
3. (Done.) Tournaments inside leagues: king of the table, draw your partner, round robin and a
   cup (knockout, optionally after two groups) built with brackets-manager and drawn with
   brackets-viewer (loaded on demand from `vendor/`; brackets-manager needs the `events`
   polyfill).

After stage 3 the remaining items of the plan artifact were done too: the "Today" card, the
most even lineups, the match timeline, pairs ranking, defence/attack ratings, records and
achievements on the profile. Next: the owner's feedback below.

Owner feedback, to do at the end (after the planned stages):
- (Done: redesign, "the table and its score sheet"; see the look in the code map. Waiting for
  the owner's opinion.)
- The 2017 league: the owner prefers a regular league with a generated id and a one-off
  migration that sets `league` on all 2017 games, so the code needs no special case for games
  without a league (drop `LEGACY_LEAGUE_ID` / `leagueOf()` fallbacks afterwards). Not done yet:
  writing production data in bulk needs the owner's explicit go-ahead in the session (the
  agent's permission check blocked it). Options: a temporary narrow rule that only lets games
  without a league get the new league id (plus deleting `leagues/legacy`), then run a REST
  script; or give the service account the Cloud Datastore User role and run it from Actions.
- (Done: league settings page with rename, lock new games, ranking threshold, delete/restore;
  anyone may use it until sign-in brings a moderator. The owner can unlock "Najdroższa Liga
  Świata" there.)
- (Done: overall ranking `#/ranking` and overall profile `#/player/<id>`, from every league via
  `ALL_LEAGUES`.)
- (Done: games and leagues are deleted softly, with undo and restore, by anyone until sign-in.)
- (Done: win by 2 as a toggle without a cap, any target; timed games with a chosen length;
  pause and resume; the new game dialog's summary of rules, lineups, kind and win chance; an
  always-visible undo bar with precise event texts.)
- (Done: win % next to Elo; a league setting for the fewest games to be ranked.)
- A fun "yolo" ranking (working name) about who is the "ziemniak" (potato: the one who loses
  everything). The group plays for fun and the drive is not to stay the potato, so it is about
  mocking the weakest and sometimes "hating" the strongest. Rules to be designed together; one
  proposal: losing to the current potato costs a lot of points (not necessarily the potato
  title at once). (A first version is live as a ranking view, rules in `POTATO_POINTS` in
  `player/potato.ts` and shown in the app; tune them with the owner.)
- (Done: the finish panel with confetti (canvas-confetti), "Undo last goal" and "Next", which
  fills up and moves on by itself after 8 s.)
- (Done, the model: a game is one match to a win under its rules; a tournament is a set of
  games among chosen players whose format decides who plays next and how the table is counted.
  Formats: series (best of 3/5, moved out of the new game dialog; old `series` games still show
  their series), open, king of the table, draw your partner, round robin with fixed teams or
  rotating partners ("Americano"), cup. The setup dialog states each format's needs and its
  number of games.)
- (Done: deleting a league can delete its games too; restoring brings both back.)
