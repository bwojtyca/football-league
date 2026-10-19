# Per-league data (step 2 of the sign-in research), plan

Owner, 19 Oct 2026: go ahead with the next stages. Order from
`2026-10-19-google-sign-in-research.md`: 1. 2017 migration (done 19 Oct), **2. per-league data**,
3. anonymous + Google sign-in, 4. league owners, 5. members, visibility, invites, 6. App Check.

## Goal

A phone downloads only the leagues it shows, not the whole database, with no visible change.
The services keep their public API (`leagueGames(id)`, `ratings(id)`, `playerGames(...)`,
`seriesGames(...)`, `tournamentGames(...)`, `tournaments(id)`...), so the views stay as they are.

## How

- **Lazy listeners per league.** `GameService` and `TournamentService` hold a map
  `leagueId → signal` filled on first use by `collectionData(query(..., where('league', '==',
  id)))`, kept for the session (switching back is instant; the persistent IndexedDB cache still
  serves later visits). No `orderBy` (sorted on the device), so no composite index is needed.
- **`ALL_LEAGUES` (overall ranking, overall profile, compare overall)** becomes the union of
  the leagues this device knows (the "Na tym urządzeniu" list, `LeagueService` recent ids) —
  until sign-in, where it becomes the user's leagues. The labels say "z twoich lig" instead of
  "ze wszystkich lig". (Open question for the owner in the research: keep the overall ranking
  at all.)
- **Game by id** (`getGame`) stays a document listener: a link to a game works without its
  league loaded.
- **Players and leagues stay whole-collection listeners for now.** Both are small (7 players,
  12 leagues) and the leagues page searches all leagues; they move to by-id / prefix queries
  when sign-in brings membership (step 5), since that is when the rules start to require it.

## Steps (each: build in CI, e2e green, Tour shots checked, then `master`)

1. `GameService`: per-league listeners behind the same API; `ALL_LEAGUES` as the device's
   leagues. Check: league pages, game screen, tournament page, overall ranking, comparison.
2. `TournamentService`: the same.
3. Copy: "ze wszystkich lig" → "z twoich lig" where `ALL_LEAGUES` is shown.
4. Measure: Firestore reads on opening a league before/after (emulator logs in CI, or the
   console's usage tab for production).

## Risks

- Something that silently relied on "all games" (e.g. a profile's partners across leagues, a
  game's "against the league" facts): covered by the e2e scenarios and the Tour; read every
  `ALL_LEAGUES` / `games()` use before the change.
- The game screen opened from a link before its league is loaded: it uses `getGame` (fine);
  its rating preview needs the league's games, which load on demand.
