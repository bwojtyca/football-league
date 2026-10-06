# Football League

Office foosball league app, written in 2017 and revived in October 2026: Angular 22, Angular
Material 22 and the Firebase JS SDK 12 (Firestore only: no backend, no sign-in). Live at
https://bwojtyca.github.io/football-league/. The owner writes in Polish; answer in Polish.

## Principles from the owner

- It is a game for fun among friends. Keep the app simple and the code proportionate; it does
  not need to be "enterprise" grade.
- Stay backward compatible: the 421 games from 2017 must keep working. New fields are optional,
  old documents are never migrated destructively, and old games simply lack new data.
- Starting a game takes at most 3 taps, a rematch 1 tap. Defaults: game to 8 with a two-goal
  lead (since October 2026; games without `mode` stay plain "to 8"), 2 vs 2, no login.
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
- The owner's own machine (an LXC: 2 CPUs, 3 GB RAM, no Java) is too weak for builds, the
  emulator or Playwright: there, only edit, read and run light scripts, and ask before anything
  heavy. Heavy checks run in CI: a push to any branch but `master` runs
  `.github/workflows/check.yml` (unit tests, `ng build -c production,emulator`, then the
  Playwright scenarios in `e2e/` against the emulator with the branch's rules). Read the result
  with `gh run list` / `gh run view --log-failed`, and the screenshots with
  `gh run download <run> -n e2e`. Scenarios run on a Pixel 7 in Polish and take their texts from
  `public/i18n/pl.json` (`t()` in `e2e/tests/helpers.ts`); each creates a league of its own.

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
  - `events` = list of `{ at, type: 'goal' | 'own', team, position, player, rod?, man? }` and
    `{ at, type: 'swap', team }`, `at` in ms since the start. The goal totals in `teams` stay
    and change together with the log, so old views and the 2017 games need no log. `rod`
    (`goalie | defence | midfield | attack`, fitting the position) and `man` (the figure on
    it, from 1 at the team's handles: 1, 2, 5, 3 of them) are there only when the goal was
    entered in that detail, so statistics count what is known and what is not;
  - `series?` = `{ id, bestOf, game }`, `id` being the first game's id; teams swap colours
    from game to game, the series score is counted from the games;
  - `tournament?` = id of the tournament the game belongs to;
  - `deleted?`: hidden from rankings and stats, restorable (any game can be marked; only running
    games are erased for good); `deletedWith?` = `league:<id>` or `tournament:<id>` when it
    was deleted together with one, so restoring that brings back only those games;
  - `paused?` (ISO time the clock stopped) and `pausedFor?` (ms of earlier pauses): the clock,
    time limits and event times count play time only (`playTime()`).
- `tournaments/{id}`: `league`, `name`, `format` (`'series' | 'open' | 'king' | 'dyp' |
  'roundRobin' | 'rotation' | 'cup'`), `created`, `groups?` (cup: 0 or 2), `bestOf?` (series),
  `mode` (as in games), `teamSize` (1 or 2), `entries` (who joined or left, in order:
  `{ player, at, out? }`, append-only), `teams?` (round robin: fixed lineups), `end?`,
  `deleted?` and `gamesDeleted?` (soft delete, as for leagues). `mode` may change while the
  tournament runs and applies to its next games (each game keeps its own `mode`).
  Queues, draws, fixtures and tables are computed from the tournament's games
  (`tournament/tournament.ts`), so devices never have to agree on shared state.
- Rankings and stats are computed from games, not from player counters (those drifted in 2017).
- The database is publicly readable; `firestore.rules` allows only the writes the app makes
  (create leagues, rename or archive them and add players; create players; create games; one
  goal per update with its event, a swap of positions or undoing the last event; close a won
  game; delete running games; create tournaments, append one entry at a time, rename and end
  them, change the rules of their next games while they run, delete and restore them softly).
  Games without `events` keep the pre-2026 behaviour.
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
- The look (`src/styles.scss`), "Nocą": a foosball table at night, one dark scheme
  (`color-scheme: dark`). `--fl-*` tokens: black page (`--fl-paper`), dark cards (`--fl-card`,
  `--fl-card-2`, inset 1.5 px `--fl-line`), the yellow ball (`--fl-ball`, class `fl-cta` on a
  button) for the one main action of a screen, the felt (`--fl-felt-bg`, class `.fl-felt`) for
  the table, the Today card and the profile card, LED panels (`--fl-board-bg`, class
  `.fl-board`) for scores, team fills `--fl-red`/`--fl-blue` and team text/LED colours
  `--fl-red-board`/`--fl-blue-board`, `--fl-chart` for chart bars. Material's `--mat-sys-*`
  colours and component tokens are mapped onto them. Text and headings are Archivo
  (`--fl-display`) in sentence case (`fl-title`, small labels `fl-kicker`); numbers from about
  18 px are Doto LED digits (`--fl-led`, class `.fl-led`; the `Doto Digits` face covers only
  digits and signs, so units and the colon stay Archivo). Fonts come from Fontsource. The
  mockups of this look and of the next phases (UX, then kits and sign-in) are on the canvas
  https://claude.ai/artifact/As2G6VoRzAPeEkLxmbC8Kx; the UI phase's plan is
  `docs/superpowers/plans/2026-10-05-ui-noca.md`.
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
- The new game dialog (canvas P31, full screen on a phone) shows the lineups on a small table;
  tapping a place opens `player-picker-sheet.component.ts` (P32: search, Elo, where each one
  plays; picking someone placed elsewhere swaps the two places; "plays alone"; a new player).
  It suggests the most even split of four players (Elo) when it is clearly more even than the
  chosen one, and chooses what a goal records and the screen's orientation (device settings in
  `game/screen-settings.ts`, read by the game screen). `game/mode/` has the shared rules picker
  and label.
- Game screen (canvas P40–P49, reworked after the owner's round H): a header (back, turn, the
  goal detail as a named pill, series or rules over an LED clock, pause, menu with full screen
  and remove), the table (`table.component.ts`), and a bar with the last move, the undo, "Own
  goal…" and the swaps. Upright, each team's score leads its LED board at its end of the table
  (the board above the table is then only for screen readers and e2e's `score()`); lengthwise
  the score is on an LED board in the panel. After each goal the board of the team it counts
  for flashes "GOL", the scorer and the score; long names slide (`shared/marquee.directive.ts`).
  Every goal is entered on the table seen from above with its figures: who scored taps a rod
  of the scorer, the rod mode the rod, the figure mode the figure. Held portrait the table
  stands (red goal on top, each team's LED board at its end); in the landscape layout
  (`.landscape`, a panel on the right) it lies lengthwise with LED boards on its rails. Quarter
  turns (`fl.rotation`): on a portrait screen 0/2 stand the table from the blue/red side, 1/3
  show the landscape layout turned a quarter by CSS (`.turn-cw`/`.turn-ccw`, for a phone lying
  flat or locked); a landscape screen always shows the landscape layout and a turn swaps
  sides (`fromRed()`). Text never turns upside down. Pausing offers resume, leave for later or
  remove. A decided game shows `FinishPanelComponent` (the blinking score, an Elo preview from
  the current ratings, the series, how it went, "Next" with an LED countdown, undo) for 8 s
  (`FINISH_AFTER_MS`), then any device records the result; the scoring device (or whoever taps
  "Next") moves on. A finished game is a page: the result, its timeline and league facts.
  The goal detail and the turn are read for every game shown (the screen is reused by a
  rematch).
- `TournamentService` lists tournaments; `tournament/tournament.ts` holds the pure logic: king
  of the table queue and streaks, draw-your-partner draws (fewest games first, new partners,
  even teams), round robin fixtures (circle method) and tables. A tournament game sends the
  scoring device back to the tournament page, where the next game starts with one tap.
- `game/game.ts`, `player/player.ts` and `player/rating.ts` hold the pure scoring, ranking and
  Elo functions; `rating.ts` also rates defence and attack separately (2 vs 2 games only).
  `player/records.ts` has the profile records, achievements (clean sheet, comeback from 4
  down, 5 wins in a row, 100th game) and the pairs ("duets") ranking.
- Goal detail: the game screen's pill next to "turn" cycles the detail of new goals
  (`fl.goalDetail` in localStorage: position, rod, figure; the new game dialog sets it too).
  Titles of a league (`stats/titles.ts`: leader, potato, sniper, wall, on fire,
  veteran, marathoner, comeback king, dream team, scoring keeper) show as icons in the
  rankings, on the profile and in the league's statistics; `player/records.ts` has the
  achievements and the mishaps shown on the profile.
- Statistics: `stats/stats.ts` holds the pure functions (league totals, months, weekday ×
  hour, colour and position shares, league records, goal times from the logs, Elo timeline,
  head to head, a player's rules, goal moments and time, tournament summary, a game's place
  among the league's games); `stats/format.ts` the shared formatting. Views: the games tab
  switches between the list and `l/:id/stats` (`league-stats.component`); the comparison of
  two players `l/:id/compare/:a/:b` and `compare/:a/:b` overall (from the profile's "Compare
  with…" and the partners/opponents lists); the profile's stats section; the tournament
  page's summary and the tournaments tab's table (`tournament/winners.ts` names the winners of
  any format, a cup through brackets-manager loaded on demand); the finished game's sheet
  ("Against the league", for 2017 games too). Charts follow the dataviz rules: one hue for
  magnitudes (felt green), emphasis for everyone's Elo (the chosen player in ink, the rest
  grey), `--fl-series-1/2` (validated for colour blindness) for two players. Time counts play
  time without pauses (`gameSeconds()`).

## Where to continue

The living plan with the next increments and the way the owner wants us to work is
`docs/superpowers/plans/2026-10-06-next.md`: read it first in a new session and update it after
every increment (what is done, what comes next).

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
- (Done, then superseded: the redesign "the table and its score sheet". The owner chose the
  "Nocą" look instead; see the look in the code map.)
- The 2017 league: the owner prefers a regular league with a generated id and a one-off
  migration that sets `league` on all 2017 games, so the code needs no special case for games
  without a league (drop `LEGACY_LEAGUE_ID` / `leagueOf()` fallbacks afterwards). The owner
  agreed (3 Oct 2026) on condition of a backup first, and of closing it (dropping the
  fallbacks) only once the app shows the same after the move as before. Ready (merged to
  `master` on 4 Oct 2026, not run yet):
  - `scripts/backup.mjs` (public REST, raw documents; taken 3 Oct 2026 06:25 UTC into
    `../football-league-backups/`: 5 leagues, 7 players, 442 games, 8 tournaments).
  - `scripts/migrate-2017.mjs`: new league `TPaiV5gUYtE68s5MFQsD` (copy of `leagues/legacy`:
    name, created, players, archived), `league` added to the 421 games without one, `legacy`
    deleted softly; one atomic commit of 423 writes, `--rollback` reverses it. It writes with
    the owner's token (`gcloud auth print-access-token`), so no rule is loosened (the agent's
    permission check refuses temporary rules and production writes). Tested on the emulator
    (`e2e/tests/migration-2017.spec.ts`); a dry run on production matches (421 games).
  - `.github/workflows/snapshot.yml` + `e2e/snapshot/`: what the live app shows of the 2017
    league (leagues entry, every ranking view, each profile in the league and overall, games,
    overall ranking) as text; run it (`gh workflow run snapshot.yml`) before and after the move and
    compare the JSON files (they must be equal). Take "before" with the app version that will
    be live during the move.
  - Steps: owner runs `--apply` → rerun the snapshot → compare → if equal, close: drop the
    fallbacks, the migration scenario and the snapshot workflow; else `--rollback`.
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
  title at once). (Live as a ranking view, `player/potato.ts`. The owner's aim (4 Oct 2026):
  "the weak get mocked, the strong cannot get cocky". Since 5 Oct 2026 it is the potato of the
  day, as the group played it in 2017: the weakest of a day (most points in that day's games,
  3+ games) becomes the potato and keeps it until they play a day without being the weakest;
  an absent potato keeps it (several potatoes possible). Day points: loss +1, win −1, shutout
  loss +2, loss as clear favourite +3, loss to a potato +3, a potato's win −2. The ranking
  view shows today's points (the day in progress decides nothing) and days as the potato. On
  the 42 days of 2017 (`node scripts/simulate-potato.mjs <backup dir>`): the potato of the day
  is one of the two weakest 52% of the days, one of the two strongest 21%, the leader 12%;
  yesterday's potato never stays one (they escape the next day they play). Earlier versions:
  a points ranking over each player's last 20 games (4 Oct), and before it one that blew up
  to 10^15 points (losses to the potato fed on each other). Simulate every rule change before
  it goes live.)
- (Done: the finish panel with confetti (canvas-confetti), "Undo last goal" and "Next", which
  fills up and moves on by itself after 8 s.)
- (Done, the model: a game is one match to a win under its rules; a tournament is a set of
  games among chosen players whose format decides who plays next and how the table is counted.
  Formats: series (best of 3/5, moved out of the new game dialog; old `series` games still show
  their series), open, king of the table, draw your partner, round robin with fixed teams or
  rotating partners ("Americano"), cup. The setup dialog states each format's needs and its
  number of games.)
- (Done: deleting a league can delete its games too; restoring brings both back.)

Owner feedback, round I (6 October 2026: scale and polish; designed first on the canvas page
"Runda 4", then built in steps; the owner wants the agent to design, build and self-review in
increments without waiting for confirmation):
- (Done) The app menu (gear in every top bar, `shared/app-menu-sheet.component.ts`) holds what
  belongs to the app: the language, installing on the phone (`shared/install.service.ts`), the
  overall ranking, the leagues. The league hub keeps only the league and shares its link.
- (Done) The leagues page scales: leagues opened on this device (`LeagueService.recent`,
  `fl.recentLeagues`; on a first visit the ones played lately), a search over all leagues by
  name, the new league, the overall ranking, the deleted leagues.
- (Done) Nothing is marked with a border or coloured bar: cards are fills; leaders get a yellow
  place, a player's games W/L letters, running things a badge; provisional ratings turn
  translucent; the finished game and the new game's table lost their coloured rails.
- (Done) Loading: a yellow progress bar on top while a page or the data is on its way
  (`app.component.ts`).
- (Done) "Now in the league" (`league/now-card.component.ts`) replaces the Today card: games being
  played (ticking clock, back to the game), paused games to finish, running tournaments; when
  nothing goes on, the last game named as such with a rematch, and the leader, the potato and
  this week's games.
- (Done) Games can go full screen without the browser's bar (in the game's menu where the
  browser allows it, kept for the next games; `screen-settings.ts`); on an iPhone the app menu
  explains installing instead.
- Next self-review ideas: skeleton rows while lists load, the leagues search on the server once
  there are many leagues, scrolling text on the LED boards.

Owner feedback, round H (5 October 2026, after trying the UX phase; more to come once it is
all ready):
- (Done) Nothing on the game screen is shown turned or mirrored any more: the far team's cells
  and the name plates on the table read upright (they were hard to read).
- (Done) The goal input: the team-tinted cells and rounded rails are gone; every goal is
  entered on the table with its figures (who scored taps a rod of the scorer), upright or
  lengthwise, and the rails and ends are LED boards with the players' names and goals. Still
  open from the owner's idea: scrolling text on the boards, like advertising at a match (the
  league's name, the players' names).
- (Done) Title icons in the rankings show a tooltip (name and why), not a bare `title`.
- (Done) Bug: a goal by figure did not register in a win-by-2 game. Cause: the rematch (and
  the next game of a series) reuses the game screen, which read the goal detail and the turn
  only once; it now reads them for every game (e2e in `game.spec.ts`).
- After the redesign: streamline the app's flow once more; some screens and transitions make
  no sense, things hide behind menus or repeat in several views, some mechanics are unclear or
  hard to reach.

Owner feedback, round G (4 October 2026):
- (Done, e2e) Goals can tell their rod or figure, besides the position (see the code map);
  one tap per goal, undo as before, the detail chosen on the game screen and kept on the
  device; a game may mix all three. Statistics: goals by rod and figure with how many are
  known (profile, league statistics).
- The potato rules: the owner asked for losses of the strong to cost more and for losses to
  the potato to hurt more the bigger the potato is; after a first version blew up, balanced
  by simulation (see above). The redesign is done in another window.
- (Done) Everything deployed on 4 Oct 2026, the migration tools merged to `master`; only
  `master` is left on GitHub.
- The 2017 migration: the owner asked whether the agent can run it itself. It needs owner
  credentials (none on the LXC): either the owner runs the script with a gcloud token, or
  gives the rules-deploy service account the "Cloud Datastore User" role, after which a
  workflow can run it (on the owner's explicit go).
- (Done) Merged branches deleted; `claude/next` is the working branch.
- (Done, e2e, rules) Restoring a league or tournament with its games brings back only the
  games deleted with it (`deletedWith`); older deletions restore everything as before.
- (Done, e2e) More achievements (first win, big comeback, 3/5/10 in a row, David and Goliath,
  hat-trick, solo, goalkeeper goal, golden goal, never give up, sweet revenge, 10/50/100/250
  games) and mishaps (under the table, own goal, 5 losses in a row); league titles.
- Sign-in later.

Owner feedback, round F (October 2026). Status is kept here after every commit, so a new
session can pick up where the last one stopped:
- (Done) Shared places on ties ("1, 1, 3") in every ranking and tournament table
  (`shared/places.ts`, `withPlaces()` in `tournament/tournament.ts`); a tournament can have
  several winners.
- (Done) Ranking switches: Players / Pairs, and for players Elo / win % / potato.
- (Done) Win by 2 is the default of new games and tournaments (`NEW_GAME_MODE`); games without
  a mode keep "to 8" (`DEFAULT_MODE`), and the rules label is hidden for both.
- (Done) Countdown ring of "Next" on the finish panel centred (a `mat-icon`) with a track.
- (Done, checked on the emulator with `navF.js`) Mobile navigation: `league/league-layout.component.ts`
  holds a league's pages (`l/:id` ranking, `games`, `tournaments`, `more` (the league's hub),
  `players`, `settings`, `player/:id`, `t/:id`) with a bottom bar Ranking / Games / + /
  Tournaments / League. The title of a league page opens the league switcher (bottom sheet).
  The 3-dot menu is gone; the language is in the hub (`shared/language-switch.component.ts`)
  and at the bottom of the leagues page.
- (Done, checked) "+" opens "What are we playing?" (`league/new-play-sheet.component.ts`):
  a game (teams of the latest game filled in), a series (the new game dialog with `series: true`
  creates a `series` tournament of the two chosen teams and starts game 1) or a tournament.
- (Done, checked with `guardF.js`) Tournament dialog without the series format, open by
  default; fixed teams (round robin, cup) made in the order players are picked (1st+2nd,
  3rd+4th...), with "Draw" and "Even out" (Elo: best with weakest); the hints explain open (you
  pick each game's teams) vs draw your partner (the app draws them).
- (Done) Pause overlay: the "Resume" icon was yellow on yellow (the big icon's style leaked).
- (Done, checked with `guardF.js`) Leaving a running game asks whether to pause it
  (`shared/leave-guard.ts` on `game/:gameId`, `leave-dialog.component.ts`: pause and leave /
  leave / stay), and closing the tab warns (`beforeunload`) while the clock runs. End-to-end
  scenarios that `page.goto` away from a running game must answer that dialog.
- (Done, e2e `tournament-edit.spec.ts`, rules checked in `rules.spec.ts`) The tournament page's
  3-dot menu: "Name and rules" (`tournament-edit-dialog.component.ts`: rename; while running,
  the rules of the next games), "End tournament", "Delete tournament"
  (`tournament-delete-dialog.component.ts`: with or without its games; undo in a snackbar,
  "Restore" on the deleted tournament's page).
- (Done, e2e) Tournaments decided by their games end by themselves: the final of a cup, a series,
  every fixture of a round robin or rotating partners (`_decidedAt` on the tournament page,
  `TournamentService.settle()`: a transaction, `end` = the end of the last game). In the bracket
  the games to play now are outlined (`data-match-status` 2/3, styles in `src/styles.scss`),
  their round is named "... · now", and teams knocked out fade.
- (Done, e2e) "Cancel" in the new game dialog goes back to the league only from the game screen;
  removing a running game does not ask whether to pause it first.
- (Done, checked with `rotateF.js`; reworked in the UX phase, see the code map) Game screen as
  a 2x2 table turned in quarter steps (button next to back, kept in localStorage
  `fl.rotation`). From the blue side: top left red offence, top right red defence, bottom left
  blue defence, bottom right blue offence. Cells keep the DOM order (red offence, red defence,
  blue offence, blue defence) and get their grid area from `area()`; each team's swap button
  sits on the line between its two cells (`swapSpot()`).
- (Done, e2e `stats.spec.ts`, deployed) Statistics in four parts, as proposed to
  and approved by the owner: league statistics, two players compared, more on the profile
  (time, rules, goal moments, tournaments), tournaments and games against the league (see the
  code map). Next proposal to the owner: recording the rod each goal came from (see the
  session's message), which needs a rules change for the goal events.
- (Done) Tournament dialog: "Everyone" picks all players not yet picked (after those picked).
- (Done) The Playwright scenarios live in `e2e/` and run in CI on every branch (see "Working on
  it"). Round F and the statistics were deployed on 3 Oct 2026 (rules first, then the app).
- The 2017 migration (see above) is ready; the owner postponed it (3 Oct 2026: "the database
  doesn't bother us for now").
- The redesign (owner, 5 Oct 2026): first the UI ("Nocą", live 5 Oct, plan in
  `docs/superpowers/plans/2026-10-05-ui-noca.md`), then the UX (navigation and screens from the
  canvas's "Flow aplikacji" page), then new features (kits, sign-in) on the new UI and UX. The
  owner lets finished work with a green Check go to `master` (5 Oct). UX steps, in order:
  1. game screen (live 5 Oct, `docs/superpowers/plans/2026-10-05-ux-game.md`); 2. the new game
  with a player picker (live 5 Oct); 3. the league's hub instead of "More" (`l/:id/more`,
  `league-hub.component.ts`), its players (`players`) and settings (`settings`, archive or
  delete in a dialog), the ranking with one switch (players, pairs, potato), games by day,
  tournaments running and finished with winners, jumps on the statistics (all live 5 Oct);
  4. the leagues page with crests, a running game and deleted leagues to restore, and the new
  league in two steps (`league-new-dialog.component.ts`: name, then who plays) (live 5 Oct;
  app settings P66 wait for more than the language); 5. a finished game's page (result,
  timeline and league facts inline) and the profile in tabs Overview / Statistics / Games
  (live 5 Oct);
  6. a new tournament starts with its format (cards with what each needs; a series goes to the
  new game) (live 5 Oct; the running and finished pages P52–P54 were close already); 7. the
  desktop layout.
