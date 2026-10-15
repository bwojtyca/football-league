# Independent evaluations

Each round: the Tour's shots, a fresh evaluator agent briefed with `rubric.md` only (no earlier
reviews or plans), its report saved as `eval-<n>.md`. Overall = the weakest dimension.

| Round | Date | Tour run | Hierarchy | Consistency | Readability | IA and flow | Responsive | Real data | Overall | Mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 14 Oct 2026 | 38458593413 (master 431a788) | 5.8 | 6.0 | 5.0 | 5.3 | 6.0 | 2.3 | 2.3 | 5.1 |
| 2 | 14 Oct 2026 | 38569971370 (master 8057c0e) | 6.75 | 5.0 | 4.25 | 6.0 | 4.0 | 5.5 | 4.0 | 5.25 |
| 3 | 15 Oct 2026 | 38698154807 (master c55c523) | 7.25 | 7.25 | 4.25 | 7.0 | 5.5 | 6.75 | 4.25 | 6.3 |

## Round 1: what to fix (from `eval-1.md`)

Blockers: the game screen's team boards lose players and goal counts with long names; duets
truncate the joined pair so the partner disappears. Majors: the game screen has no first step
and Undo is the only yellow; yellow marks far more than the one main action; the gear opens the
app menu while league settings hide behind the title; the Ranking tab shows no ranking above
the fold on a small phone; page titles cut names shown nowhere else; loss dots at 1.5:1; Elo
changes and losers' names on the felt below 4.5:1; the heatmap's legend says the opposite of
the colours; desktop game panel too small; 1920 px pages a 720 px column. Plus the minors listed
in the report.

## After round 1: fixed (14 Oct 2026, all on `master` at 8057c0e)

- Blockers: the end boards cut each name on its own (avatar and goals always shown); duets cut
  each name on its own.
- Majors: a first-step hint on the game screen and names on the rails upright; Undo tonal; one
  yellow per screen (links, tags, icons, "You", leader's Elo in ink; live = red; the "+" quiet
  on pages with their own main action); the gear opens the league's settings, the app menu has
  its own icon; a compact "now" row so the ranking shows on a small phone; long titles in two
  lines; loss dots as rings; Elo changes on dark chips and losers at 90% white on the felt;
  the heatmap's legend; the desktop game panel (clamp width, big score, 44 px controls); the
  page column and title share one width; two columns for statistics and profile from 1400 px.
- Minors: one dialog header (title on the content edge, close right, back left); Elo and Gole
  everywhere; one wording for "all leagues"; labels at 12 px+; shares add up to 100; no tab
  lit on settings; sheet titles alike; potato view without places, potatoes first; pairs with
  too few games under their own heading; records winners first; full name on the profile card;
  badges felt green, mishaps red; stronger scrim; one month = no chart; no repeated "running".

Round 2 runs on the Tour of 8057c0e (run 38569971370).

## After round 2: fixed (15 Oct 2026, on `master` at c55c523)

- Blockers: the raw key `now.backShort` (CI now runs `scripts/check-i18n.mjs`); live and paused
  games show both teams on lines of their own with each name at most half a line.
- Majors: one shell on a wide screen (the rail on every page but a game, `fl-app-rail` outside
  a league, every page and title at the same left edge); 1120 px pages with their top bar from
  1400 px (statistics, profile, comparison, overall ranking, games in two columns); duets split
  fairly; the undo bar's event on two lines; no sideways scroll at 360 (rules table); the potato
  title as a count when several; counts of finished games everywhere; "Gol: kto strzelił" pill.
- Minors: sheets centred on a wide screen; finished game header over its column; profile card
  without the repeated name; "3 wygrane z rzędu"; "Wróć do turnieju"; chips 40 px with a visible
  container; off switches outlined; pause disc and format icons out of yellow; "Nowa liga" as the
  leagues page's primary; days capitalised; tabs centred; hints 14 px; current player
  highlighted, not underlined; unplayed players last without a place; own goal 48 px on a
  computer; one-line dialog titles; one wording for "who plays here"; stats linked under the
  ranking.

Round 3 runs on the Tour of c55c523 (run 38698154807).

## After round 3: fixed (15 Oct 2026, on `master` at 8977cc2)

- Blocker: the 360 px game header (pause over the clock): icon-only goal-detail pill, a fixed
  clock width, the swap row without its label.
- Majors: times agree ("od 09:18" for a game still on, start times for paused games, a finished
  game's length in words); supporting copy at 14 px; from 1400 px every page 1120 px wide with
  lists in two columns and a top bar spanning the content; the live card as a scoreboard (each
  team on its own line with its goals); moves read first ("Gol z ataku: Ala").
- Minors: form-dots legend; clearer labels (days as the potato, Elo per position for 2-on-2
  games, time to the first goal, players with games); cards a visible step from the page; the
  current player in ink, not a highlight bar; one on one games apart in the positions table;
  folded pairs with too few games; one way to each place (settings by the gear, all leagues in
  the league menu and the rail); no tab lit on statistics; "Wypisz" by the leave icon; a finished
  game next to the rail.

Round 4 runs on the Tour of 8977cc2 (run 38802418867).
