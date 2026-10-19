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
| 8     | 17 Oct 2026 | 39023105447 (master f02b7af) | 7.25      | 6.5         | 7.0         | 7.0         | 7.75       | 6.5       | 6.5     | 7.0  |
| 9     | 18 Oct 2026 | 39042759003 (master 896df59) | 8.5       | 7.0         | 7.5         | 7.8         | 7.8        | 8.3       | 7.0     | 7.8  |
| 10    | 18 Oct 2026 | 39102162418 (master 41c1986) | 7.8       | 7.8         | 7.5         | 7.5         | 7.3        | 7.5       | 7.3     | 7.6  |
| 11    | 18 Oct 2026 | 39122074475 (master acd9da0) | 8.5       | 7.3         | 7.8         | 7.5         | 8.0        | 6.5       | 6.5     | 7.6  |
| 12    | 18 Oct 2026 | 39125505997 (master 6be73c9) | 8.3       | 6.75        | 8.0         | 8.0         | 7.75       | 7.25      | 6.75    | 7.7  |
| 13    | 18 Oct 2026 | 39126966567 (master 60a9f35) | 8.5       | 6.75        | 7.0         | 8.3         | 8.0        | 7.5       | 6.75    | 7.7  |
| 14    | 18 Oct 2026 | 39141874782 (master 252649a) | 8.25      | 7.25        | 7.75        | 8.25        | 8.0        | 8.5       | 7.25    | 8.0  |
| 15    | 18 Oct 2026 | 39143311810 (master fd1317c) | 7.75      | 8.0         | 8.0         | 7.5         | 7.75       | 8.5       | 7.5     | 7.9  |
| 16    | 18 Oct 2026 | 39144699728 (master 20c61cb) | 7.5       | 7.25        | 8.75        | 6.75        | 7.25       | 7.75      | 6.75    | 7.5  |
| 17    | 18 Oct 2026 | 39164611708 (master ba1c8b5) | 8.5       | 7.6         | 7.75        | 8.25        | 8.25       | 8.25      | 7.6     | 8.1  |
| 18    | 19 Oct 2026 | 39166262313 (master 2ee59f4) | 8.0       | 7.4         | 7.5         | 8.6         | 7.0        | 8.0       | 7.0     | 7.75 |
| 19    | 19 Oct 2026 | 39186423441 (master 7c8e5d8) | 8.5       | 7.0         | 6.4         | 8.25        | 8.6        | 7.6       | 6.4     | 7.7  |
| 20    | 19 Oct 2026 | 39187654646 (master d31cc3b) | 8.6       | 7.75        | 8.0         | 8.4         | 8.25       | 8.6       | 7.75    | 8.3  |
| 21    | 19 Oct 2026 | 39212106261 (master 2d769da) | 8.25      | 7.0         | 7.5         | 7.75        | 7.5        | 8.1       | 7.0     | 7.7  |

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

## After round 7: fixed (17 Oct 2026, on the branch at f02b7af)

- Blocker: game lists put two games a row by their own width (container query `games`), so
  the comparison's shared games (a half-width column) stay one a row. Lesson: a component
  inside another layout sizes by its container, never by the viewport.
- Majors: 44 px targets (ranking view switch, comparison names as row-high links, tournament
  summary links); the tournament page names players by first name (initial when shared) and
  breaks only words that cannot fit.
- Minors: players who left a tournament listed and tagged; a one-line ranking legend before
  the list, "+N" on a 3.5:1 pill; ranking columns from 560 px; your row in the potato view;
  record scores in LED; jumps to every stats section; one or two hours of play said under the
  numbers; the finished game on the page column with settings in its rail; a compact
  who-are-you card at 360 px; a ring on the black swatch; no yellow avatar ring; teal and amber
  for two players; "Znajdź ligę".

Round 8 runs on the Tour of f02b7af (run 39023105447); report in `eval-8.md`.

## After round 8: fixed (17 Oct 2026, on the branch at 896df59)

- Majors: ranking rows simplified (short name at every size, one title, wins–losses; on a wide
  ranking the columns named once in a header row, form dots only there; no "+N", no legend
  line); avatar initials from the full name everywhere.
- Minors: a paused game says so in the bar and its goal-detail setting waits; on/chosen/focused
  controls in ink, the leader's place in ink, yellow only for main actions (the tournaments
  tab's "Nowy turniej" is its main action); league invite and settings in the page menu too;
  "Ligi"; "poza turniejem"; 15 px rail names; LED record scores a size up; the finished game's
  header over its text; potato heads on the page edge.
- Tooling: check-i18n reports duplicate keys (found game.detailLevel written twice).

Round 9 runs on the Tour of 896df59 (run 39042759003); report in `eval-9.md`. No blockers, no
majors: the score is a stack of minors (names, navigation).

## After round 9: fixed (18 Oct 2026, on the branch at 5935760)

- One short name per player everywhere (`PlayerService.shortName()`: the first name, "First L."
  when two in one of their leagues share it), in lists, tables, boards, charts and tournament
  summaries; the full name stays in the profile header, the players list and tooltips.
- Score separators at `--fl-ink-2` (they were 2.4:1); tournament summary names link to profiles.

Round 10 runs on the Tour of 41c1986 (run 39102162418), before round 9's fixes; report in
`eval-10.md`. (Rounds 9 and 10 were run by two sessions on the same day.)

## After round 10: fixed (18 Oct 2026, on the branch at ab31c7a)

- Majors: a wide game list keeps one game a row in date order, its details at the row's right
  end (two a row left holes after odd days); on a phone, "Now in the league" is one row of cards
  to swipe (the next one peeking in) and the You card drops its third line, so the ranking
  starts on the first screen.
- Minors: one-letter Polish words (a, i, o, u, w, z) joined to the next word by a no-break space
  in `pl.json`; close discs on the 16 px gutter of sheets, the close glyph on a dialog's 24 px
  content edge.

Round 11 runs on the Tour of acd9da0 (run 39122074475, with two follow-ups: the now strip's
names, wide rows from the page edge); report in `eval-11.md`.

## After round 11: fixed (18 Oct 2026)

- Blocker: the comparison's win chance keeps each percentage by its player (the name gives way,
  short names as elsewhere); split bars no longer widen the page with a long name.
- Majors: the Tour shot the page menu on the leagues page, where it has no league; it now shoots
  it on a league page, where it holds the league's invite and settings. Wide game lists and goal
  logs put the details next to the score instead of across the page.
- Minors: dialog text without Material's extra letter spacing; "Change" under both compared
  players and short names in the comparison's header; dates never break ("13 paź 2026",
  "od 15 paź").

Round 12 runs on the Tour of 6be73c9 (run 39125505997); report in `eval-12.md`.

## After round 12: fixed (18 Oct 2026)

- Majors: from 1400 px the finished game is two columns (the result, sticky, beside how it
  went); a wide game list is at most 760 px, a row's width; the league switcher shows the whole
  league name, the profile wraps it, and every clipped league name has it as a tooltip.
- Minors: the goal log uses short names like the rest; units stay with their numbers
  ("54 s gry", "5 razy", "7 min 15 s"); the Tour moves the mouse away before each shot, so a
  leftover hover no longer reads as a highlight.

Round 13 runs on the Tour of 60a9f35 (run 39126966567); report in `eval-13.md`. First round
without a blocker or a major: the overall is a sum of minors (consistency, readability).

## After round 13: fixed (18 Oct 2026)

- One label per control on every screen: the goal-detail pill names its level ("kto
  strzelił"), the swap row says "Zamień" and each swap button names its team in a tooltip.
- The league switcher's invite and settings are rows like the page menu's (they were cards).
- One duration format: "Na tle ligi" in words, like the game's own length; durations, and
  "wygrane – porażki", never break.
- Live card names flow without holes; profile titles are labels, not pills; the comparison
  uses short names in its sentences too.

Round 14 runs on the Tour of 252649a (run 39141874782); report in `eval-14.md`. Mean 8.0, the
first time; no blocker or major.

## After round 14: fixed (18 Oct 2026)

- The "+" is the yellow ball on every league page; a page's own action (a tournament's next
  game, a new tournament, a league's first game) is tonal, so the rule "one yellow" holds
  without the "+" changing colour from tab to tab.
- Goal-detail levels in sentence case ("Kto strzelił"), as in the new game dialog.
- "Own goal…" as wide as its label, lighter than "Undo".
- The tournament's tightest defence says "2,0 na mecz" and then who.
- The games tab's filters and statistics link as wide as its list.

Round 15 runs on the Tour of fd1317c (run 39143311810); report in `eval-15.md`. Its major came
from round 14's fix: the "+" was yellow everywhere, but on a tournament page it ignored the
tournament while the page's own action had turned grey.

## After round 15: fixed (18 Oct 2026)

- The "+" does the page's play (`shared/page-play.service.ts`): on a tournament page it starts
  the tournament's next game (king of the table, the draw, a series' next game, a new game of an
  open tournament); elsewhere it opens "What are we playing?". One colour, one place, and the
  yellow ball does what the page is about.
- The empty league's first step is a visible button (tonal on the card's grey had vanished).
- An open tournament's buttons at the left edge, as other pages' actions.
- A tournament's name under a game on one line, cut, with the full name as a tooltip.

Round 16 runs on the Tour of 20c61cb (run 39144699728); report in `eval-16.md`. Both its
majors contradict earlier rounds (the tournament page's yellow action vs a "+" of one colour,
round 14; league actions in one sheet vs settings in the page menu, round 11): left to the
owner.

## After round 16: fixed (18 Oct 2026)

- The finished game says each side's colour and who won ("Czerwoni · wygrana").
- The comparison's head-to-head LED pair is labelled "Wygrane mecze" (it read as goals).
- The finished game is two columns from 1200 px (1280 px left a band empty).
- A wide game list cuts a long tournament name inside its row.
- Form dots explain themselves on hover; "Profil ze wszystkich lig ›".

## The owner's rulings (18 Oct 2026)

Three points the evaluators kept reversing, settled by the owner:
1. A tournament's page: its next game is the yellow ball, the bottom bar's "+" is quiet there
   (only there; the "+" still starts the tournament's next game).
2. A league's invite, settings and switching live only under its name; the page menu (☰) holds
   the app's things (language, who you are, overall ranking) and is gone on a wide screen,
   where the rail ends with who you are and the language (`shared/rail-app.component.ts`).
3. From round 17, each round has two independent evaluators; the score is their average, and
   what both name is fixed first.

Round 17 runs on the Tour of ba1c8b5 (run 39164611708) with two evaluators (`eval-17a.md`:
overall 7.25, mean 8.04; `eval-17b.md`: 7.75, 8.2); the table holds their average. Neither found
a blocker or a major.

## After round 17: fixed (18 Oct 2026), what both evaluators named

- Form dots read without a legend: a win is a green dot, a loss a red ring (the W/P tags'
  colours), with the legend as a tooltip.
- Every sheet's rows share one left edge (a 40 px icon slot), the league sheet and the menu.
- An empty league's first game is the yellow ball and the "+" steps back there, as on a
  tournament's page.
- The goal-detail setting is named as one: "Zapis: strzelec / linia / zawodnik".
- The rail's "Grasz jako" keeps its icon and a short name; live card names a size down on a
  narrow phone; swap buttons at most 96 px wide; "Pokaż więcej" under the middle of a wide list.

Round 18 runs on the Tour of 2ee59f4 (run 39166262313) with two evaluators (`eval-18a.md`:
overall 6.5, mean 7.4; `eval-18b.md`: 7.5, 8.1). Both majors were regressions of round 17:
the rail's new foot (who you are, language) overflowed a 1280x800 rail, and "Zapis: strzelec"
was too long for a 360 px game header.

## After round 18: fixed (19 Oct 2026)

- Nothing in the rail shrinks; a short screen scrolls the rail.
- Under 400 px the goal-detail pill is its icon (its name in its label and menu).
- One goal-log layout at every size, at most 560 px wide; potato cards apart; short name links
  with 40 px wide targets; whole minutes without "0 s".

Round 19 runs on the Tour of 7c8e5d8 (run 39186423441) with two evaluators (`eval-19a.md`:
overall 6.5, mean 7.75; `eval-19b.md`: 6.3, 7.7). Both found one blocker the awkward league's
24 hours bring out: the "Kiedy gramy" heat map drew the day labels under its first column.

## After round 19: fixed (19 Oct 2026)

- Blocker: the heat map's day column has its width on the first row too (a fixed table takes
  its widths from there); on a phone every third hour is named.
- Buttons inherit the app's font (the tournament format cards were in Arial).
- The finished game has a title: "Mecz", its league and its series in a smaller line (the frozen
  clock is gone; the result card says how long it was).
- "Dodaj gracza" above the players list, as "Nowy turniej"; full names in that list wrap.

Round 20 runs on the Tour of d31cc3b (run 39187654646) with two evaluators (`eval-20a.md`:
overall 8.0, mean 8.54, the first evaluator to put every dimension at 8; `eval-20b.md`: 7.25,
8.0). No blocker or major; only Consistency (7.75) is under 8 on average.

## After round 20: fixed (19 Oct 2026), what both evaluators named

- A wide game list puts whole days in two columns from 960 px, read down then across (the
  760 px list left a third of the page empty); between 760 and 959 px one column of wide rows.
- "Teraz w lidze" on a phone: the next card peeks by its tile only, never mid-word.
- The swaps say what they do: "Zamień pozycje" over two buttons named by team.
- "Największy powrót: z 7:12 na 15:13" in words; the win streak with its unit.
- The goal log as wide as the chart above it.

Round 21 runs on the Tour of 2d769da (run 39212106261) with two evaluators (`eval-21a.md`:
overall 6.75, mean 7.4; `eval-21b.md`: 7.25, 8.0). Some findings undo round 20's (days in two
columns read out of order; the now strip's peek is "only an icon" where it was "cut mid-word").

## After round 21: fixed (19 Oct 2026), what both evaluators named

- Every score in the records in LED digits, the comeback too.
- League settings are no longer in the desktop rail (the owner's ruling: league things under
  its name at every size).
- In the game's side panel the swaps span the panel as "Cofnij" and "Samobój…" do.
- A wide game list is one column again (760 px); the profile's overview is two columns from
  1200 px.
- Left as is: the now strip on phones (rounds 10, 20 and 21 want three different things).

## Closed (19 Oct 2026)

The owner closed the loop after round 21: the averages had settled around 8 (7.7–8.3) with no
blocker or major since round 20, and the evaluators were reversing each other's minors. Round
21's fixes are on `master` (b21d757).

