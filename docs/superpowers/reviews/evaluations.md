# Independent evaluations

Each round: the Tour's shots, a fresh evaluator agent briefed with `rubric.md` only (no earlier
reviews or plans), its report saved as `eval-<n>.md`. Overall = the weakest dimension.

| Round | Date        | Tour run                     | Hierarchy | Consistency | Readability | IA and flow | Responsive | Real data | Overall | Mean |
| ----- | ----------- | ---------------------------- | --------- | ----------- | ----------- | ----------- | ---------- | --------- | ------- | ---- |
| 1     | 14 Oct 2026 | 38458593413 (master 431a788) | 5.8       | 6.0         | 5.0         | 5.3         | 6.0        | 2.3       | 2.3     | 5.1  |
| 2     | 14 Oct 2026 | 38569971370 (master 8057c0e) | 6.75      | 5.0         | 4.25        | 6.0         | 4.0        | 5.5       | 4.0     | 5.25 |
| 3     | 15 Oct 2026 | 38698154807 (master c55c523) | 7.25      | 7.25        | 4.25        | 7.0         | 5.5        | 6.75      | 4.25    | 6.3  |
| 4     | 16 Oct 2026 | 38802418867 (master 8977cc2) | 7.5       | 5.75        | 6.5         | 5.75        | 6.75       | 6.75      | 5.75    | 6.5  |
| 5     | 16 Oct 2026 | 38838805463 (master 1f4d76c) | 7.3       | 5.5         | 6.3         | 5.0         | 6.3        | 6.8       | 5.0     | 6.2  |
| 6     | 17 Oct 2026 | 38865369501 (master 4e9a5ca) | 8.5       | 7.0         | 6.0         | 6.75        | 5.5        | 5.5       | 5.5     | 6.55 |
| 7     | 17 Oct 2026 | 39005288451 (master d011c1d) | 8.3       | 5.5         | 6.0         | 7.0         | 4.0        | 6.8       | 4.0     | 6.25 |

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

## After round 4: fixed (16 Oct 2026, on the branch at 9bdcb6c)

- Major: the rail's league sections are rows like the leagues above them (the bottom bar's tab
  style no longer leaks into the rail); the game page's rail shows its league and sections.
- Minors: short labels for the game screen's controls at 360 px and a tap hint after the first
  goal; the hamburger only on pages without a back arrow; yellow kept to the main action (tabs,
  clock, the rail's quiet button in grey); one centred 1120 px column with its top bar on every
  page next to the rail, lists in two columns from 1000 px, a 380 px side column; one tile
  pattern (number over a sentence-case label) for league stats, profile records and stats;
  durations in words, goals with a dash, whole percentages, tile numbers never wrap; short names
  in the live card, the duets and the table's plates and boards; end boards as wide as the
  table; duet avatars side by side; two-letter crests; the potato view with one days column;
  "Wstrzymany · start"; a compact profile card (pills on one line, titles on one scrolled
  line); the profile's player on a chip in game lists, bold only for winners; dates on the Elo
  chart and its chips on one scrolled row; a numbered scale under the heat map; no month in the
  goal-log note; close buttons always on a disc; the new game dialog without stretched gaps;
  tablet sheets as wide as the page; the live clock in Archivo digits.

Round 5 runs on the Tour of 1f4d76c (run 38838805463); report in `eval-5.md`.

## After round 5: fixed (16 Oct 2026, on the branch at 5f5638c and after)

- Majors: the game screen's first step (a sentence over the last move all game; goal detail as
  a labelled setting with a menu; the turn in the menu on narrow phones); ranking title icons
  never wrap away (the name gives way, hidden titles counted); tournament goals never break;
  end boards span the width at 360 px (no avatars under 380 px); wide pages use grids of whole
  sections (tournament: play and table beside summary and games; a day's games in two columns).
- Minors: statistics in two columns from 1000 px; one page menu (league settings first, no
  gear); the legend in the "?" sheet; "Seria" only in "Co gramy?"; tournament formats as cards;
  "ze wszystkich lig ›"; a hint that new-game places change; taller name links; game lists with
  first names (initial when shared) and "o 01:58"; avatar colours at 4.5:1; close discs on every
  sheet; Players tab with a list kicker; the same rail everywhere; the empty league at the left
  edge; tiles as number, label, qualifier; sentence-case headers; compare in teal and orange,
  goals with a dash; one resume while paused; a bigger score on big screens; heat map only with
  3+ hours; fold chevrons on their line; 16 px dialog edges; short "Zamień" at 360; no "vs".

Round 6 runs on the Tour of 4e9a5ca (run 38865369501); report in `eval-6.md`.

## After round 6: fixed (17 Oct 2026, on the branch at d011c1d)

- Blocker and majors: the league menu header (counts under the name, room for the close disc);
  phone rankings with short names, form dots under the name and one title (+N on a labelled
  pill), duet names wrapping whole; the compact game header up to 440 px; the new game summary
  in the footer above "Start"; the wide profile's statistics in two columns and games two a row.
- Minors: settings in the league menu and the desktop rail (the app menu keeps app things);
  swap buttons with a team-coloured swap icon; the bottom panel inert while paused; clock, hint
  and last move grow on bigger screens; the live clock in LED at 18 px; numbers kept with units;
  profile titles wrap whole; field outlines 3.5:1; the players list labels Elo; tables on the
  page edges; potato since-lines wrap; new play in the app rail only on a game's page.
- Left for later: the desktop games grid leaves a hole after an odd day; record scores in
  Archivo rather than LED.

Round 7 runs on the Tour of d011c1d (run 39005288451); report in `eval-7.md`. Its blocker (the
compare page's shared games in a two-column grid inside a half-width column) came from round
6's fix: grids follow the viewport, not their container. Without it and the tap targets the
overall would be 5.5.
