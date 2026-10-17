# Design evaluation, round 8 (independent evaluator)

Material: eval8/ screenshots and audits (5 sizes), src/, src/styles.scss, public/i18n/pl.json, CLAUDE.md principles + "The look".
Findings are appended per screen group as the work progresses; the scored table is at the end.

## Contrast ratios computed from src/styles.scss (WCAG relative luminance)

| Pair                                                                | Ratio                     | Verdict                                 |
| ------------------------------------------------------------------- | ------------------------- | --------------------------------------- |
| --fl-ink #f2f4f0 on --fl-paper #000                                 | 18.97                     | pass                                    |
| --fl-ink on --fl-card #16181b                                       | 16.07                     | pass                                    |
| --fl-ink-2 #9aa39d on paper / card / card-2 #202328 / sheet #121416 | 8.10 / 6.86 / 6.08 / 7.12 | pass                                    |
| switch off-segment #b9c2bc on card-2                                | 8.63                      | pass                                    |
| --fl-on-ball #1b1410 on --fl-ball #ffc629                           | 11.58                     | pass                                    |
| --fl-red-text #ff5a4e on paper / card                               | 6.82 / 5.78               | pass                                    |
| --fl-blue-text #5c8cff on paper / card                              | 6.65 / 5.63               | pass                                    |
| white on --fl-red #d0433a ("Trwa" pill, red cells)                  | 4.62                      | pass, barely                            |
| white on --fl-blue #3a64d6                                          | 5.28                      | pass                                    |
| white on felt #0d5a31 / felt centre #157a42                         | 8.32 / 5.39               | pass                                    |
| --fl-ink-2 on felt #0d5a31                                          | 3.21                      | FAILS for body text if used on the felt |
| --fl-win #5be394 / --fl-loss #ff8a80 on card                        | 10.89 / 7.79              | pass                                    |
| --fl-chart #3fb36e on paper                                         | 7.88                      | pass                                    |
| --fl-line-2 #4a4f4b on card (control edges)                         | 2.13                      | under 3:1 for a control boundary        |
| --fl-line #232623 on paper (row dividers)                           | 1.37                      | decorative only                         |
| field outline #6a706c on card                                       | 3.51                      | pass (1.4.11)                           |
| provisional rating: ink at opacity .45 on black (= #6d6e6c)         | ~3.9                      | passes only as large text (21.6 px/800) |

The token palette itself is sound: every main text pair clears 4.5:1. Problems found below come from
size, opacity and specific overrides, not from the base palette.

## Group A: league home / ranking views (01, 02, 03) -- all sizes

Seen: 2-phone 01/02/03 (cropped and full), 1-phone-small 01, 3-tablet 01, 4-desktop 01/02/03, 5-wide 01.

- Major (Visual hierarchy / IA): the Elo ranking needs a printed legend to be read:
  "Ostatnie mecze: ● wygrana ○ porażka · ikony: tytuły ligi, +N: kolejne (więcej pod ?)"
  (pl.json ranking.legendTitles). It reads like a developer note, is the busiest line on the
  screen, and on 360 px it shrinks to "ikony: tytuły ligi, +N: kolejne (więcej pod ?)" without
  saying what the icons are. Each row carries name + 1-3 title icons + an outlined "+1/+2/+3"
  chip + record + "głównie atak/obrona" + 5 form dots + Elo + delta = 9 signals in 60 px.
  Files: 2-phone/01, 1-phone-small/01, 3-tablet/01, 4-desktop/01, 5-wide/01.
- Minor (Readability, Polish grammar): the per-row column labels say "mecze" under every number:
  "16 mecze", "13 mecze", "17 mecze", "12 mecze" are ungrammatical (must be "meczów"); only
  "23 mecze" is right. The label is repeated in every row instead of once as a column head
  (pl.json ranking.colGames "mecze"). Files: 3-tablet/01, 4-desktop/01, 5-wide/01.
- Minor (Consistency): potato view column heads "Ziemniaki teraz", "Pozostali", "Dni jako ziemniak"
  start at x=20 while every other block starts at 16 (lefts audit: '20': 2 on 2-phone/03,
  1-phone-small/03; '276': 2 vs '272' on 4-desktop/03).
- Minor (Visual hierarchy): Elo, win % and duet % are set in Archivo 800, while the look says
  numbers of this size are LED digits; the same page shows LED digits only in the "Teraz w lidze"
  card. Not wrong in itself, but the system rule ("LED for numbers from ~18 px") is applied to
  scores only, so the ranking's biggest numbers look like a different product than the score
  board. Files: 2-phone/01-02, 4-desktop/01-02. (Counted as a nit, see table.)
- Minor (Responsiveness): on 4-desktop/02 (duets) a row is 584 px wide with the pair name at the
  left and only "71%" at the far right (≈400 px of nothing between), while the Elo view on the same
  width fills the row with games / win % / form columns. Duets get no extra columns on wide screens.
- Nit (IA): the desktop rail groups "Znajdź ligę" and "Ranking ogólny" under the heading "Na tym
  urządzeniu" (on this device), which they are not. Files: 4-desktop/_, 5-wide/_.
- Nit (Consistency): the desktop top bar keeps the phone hamburger (top right) although the rail
  already holds the same destinations. Files: 4-desktop/01-05, 5-wide/01.
- Good: clear first screen on phone (league name with switcher, who-are-you prompt, live game on
  an LED panel, tournament, ranking, yellow "+" in the bottom bar). Ties shown as "2, 2, 4" and
  "7, 7, 9, 9, 11, 11". No truncation, no small targets in the audits for 01-03 at any size.
  Wide (1920) keeps a 1120 px column with a right sidebar; nothing stretched.

## Group B: games list and league statistics (04, 05) -- all sizes

Seen: 2-phone 04/05 (all crops), 4-desktop 04/05, plus audits for 1-phone-small/3-tablet/5-wide.

- Minor (Responsiveness): 4-desktop/04 and 5-wide/04 put a day's games two per row; every day
  with an odd number of games leaves an empty right half (8 of 13 days on 4-desktop/04), the day
  heading sits over the left column only, and chronology zig-zags (left, right, next line left).
  The page reads as a checkerboard of holes.
- Minor (Responsiveness): 4-desktop/05 statistics tiles leave a hole (third slot of the last row
  after "Gracze z meczami"), and the "Czas goli" tiles in the right column are squeezed to ~155 px
  so "średni czas do 1. gola" / "średnio między golami" wrap to two lines while the rest of the
  column is empty.
- Minor (Visual hierarchy/consistency): in "Rekordy ligi" the values column mixes Archivo 800
  ("8 min 28 s", "15 s", "6") with small thin LED scores ("8:0", "8:6", "3:6"), which look lighter
  and smaller than their neighbours and right-align on a different optical edge. Files: 2-phone/05
  (crop 2), 4-desktop/05.
- Minor (IA/tap targets): name links inside title and record lines are 21-38 px wide and 39 px
  tall, often two side by side separated only by a comma ("Ala, Darek", "Filip, Gosia"); the audit
  flags 18 of them on every size (05-league-stats.json 'small': "21x39 Ala", "26x39 Filip" ...).
  They are not running text but list items, so the inline-link exemption does not really apply.
- Minor (Readability): orphan words: "Mur · najmniej straconych goli na mecz w obronie (od 5" /
  "meczów)" and "Zgrany duet ... (od 5" / "meczów razem)". File: 2-phone/05.
- Nit (Consistency): the duet threshold differs between screens without explanation: ranking
  "Duety" ranks pairs from 3 games together, the "Zgrany duet" title needs 5. Files: 2-phone/02,
  2-phone/05.
- Good: the phone games list is very scannable (winners bold white, losers grey, LED score centred,
  day headings, "Trwa" pill for a live game, tournament name in the meta line). Stats has an anchor
  chip row with a fade showing it scrolls, tiles, split bars, an Elo chart with one highlighted
  line in ink and the rest grey.
- Artefact, not deducted: 2-phone/04 shows the hover background on one game (mouse left there).

## Group C: tournaments list and a tournament (06, 07)

Seen: 2-phone 06/07, 4-desktop 06/07, audits for all sizes.

- Minor (IA): the Turnieje tab has two "+" actions with different looks and overlapping meaning:
  the tonal "+ Nowy turniej" pill at the top and the yellow "+" (phone bar) / yellow "Nowa
  rozgrywka" (desktop rail), which opens "Co gramy?" that also offers a tournament. The page's own
  main action is styled as secondary while a generic one is the ball. Files: 2-phone/06,
  4-desktop/06. (On the tournament page itself this is handled well: "Nowy mecz" is the ball and
  the bar's "+" / the rail's button turn quiet, 2-phone/07 crop 1, 4-desktop/07.)
- Nit (Consistency): "Rewanż" + "Nowy mecz" are right-aligned under a left-aligned title and meta
  line (2-phone/07 lefts: 127/272 vs 16), the only right-aligned button row in the app's pages.
- Same records-column mix of Archivo values and thin LED "8:1" as in league stats (2-phone/07,
  4-desktop/07), counted once in group B.
- Good: one clear primary per tournament screen, table with shared places, "W grze (4)" with a
  quiet "Wypisz kogoś", the games list reused unchanged (consistent). Desktop splits table/players
  and summary/games into two balanced columns.

## Group D: players, settings, profile, kit, compare (08, 10, 11-15)

Seen: 2-phone 08/10/11/12/13/14/15 (all crops), 4-desktop 08/10/11/12/14/15.

- Minor (Consistency): sibling destinations have different headers on desktop: Ranking / Mecze /
  Turnieje / Gracze show the league title with its switcher and the hamburger, while "Ustawienia
  ligi", also a rail tab and highlighted as active, shows a back arrow as if it were a sub-page
  (4-desktop/10 vs 4-desktop/08). On the phone, settings is not in the bar at all, so the back arrow
  makes sense there, but the desktop inherits it.
- Minor (Responsiveness): on 4-desktop/11-13 the profile card and the Przegląd / Statystyki / Mecze
  switch stretch over 990 px: three segments of 330 px each, a 40 px avatar at one end, the three
  key numbers spread 320 px apart, and the two record tiles per row are 490 px wide holding a single
  digit. The phone design is scaled up rather than laid out for the width.
- Minor (Consistency): tile grids leave holes whenever the count does not fill the row: 2-phone/12
  ("3 min 15 s Średni czas gola" alone), 2-phone/15 ("17–19 gole" alone), 4-desktop/12 (Gole 2 of
  3, Turnieje 2 of 3, "Gole, które coś znaczyły" 5 of 6), 4-desktop/05 (counted with group B under
  Responsiveness; here counted once for Consistency as the shared tile component behaviour).
- Minor (Consistency): within one tile set the labels change weight: the Elo-by-position tiles on
  the profile use bold labels ("Elo w obronie (13 meczów 2 na 2)") while every other tile label is
  regular (2-phone/12, 4-desktop/12).
- Minor (Visual hierarchy): records tiles mix a heavy Archivo "1552" with a thin LED "8:0" side by
  side (2-phone/11, 4-desktop/11), so the LED value reads weaker although it is the highlight.
  (Same root as the records column in group B; counted once there for Hierarchy.)
- Nit (Readability): "Mecze / Wygranych" column heads: "Wygranych" alone is elliptical Polish
  (should be "% wygranych" as in the ranking switch). Files: 2-phone/12, 4-desktop/12.
- Nit: settings switch is 52x32 (audit 'small': "52x32" on every size, 10-settings.json); rare
  control, so only a nit.
- Good: profile tabs separate overview, stats and games; current player shown on a chip in game
  lists with a W/P tile and the Elo change; the compare page has a clear head-to-head LED score,
  win chance in a colour-blind-safe teal/amber pair, and the shared games list. Kit editor is a
  tidy full-screen sheet with one yellow "Zapisz koszulkę".

## Group E: starting, playing, pausing and finishing a game (24, 25, 26, 27, 28, 16)

Seen: 2-phone 24/25/26/27/28/16, 1-phone-small 27, 3-tablet 27, 4-desktop 16/24/25/27/28, 5-wide 27.

- Minor (IA / misleading state): while paused, the scoring instruction stays lit: "Dotknij drążka
  gracza, który strzelił." is at full strength under the pause card on the phone (2-phone/28,
  1-phone-small/28), and on desktop the whole right panel stays live-looking: the score board, the
  "Zapis: kto strzelił" selector and the hint are undimmed while Cofnij / Samobój are dimmed
  (4-desktop/28). A paused screen still tells you to tap a rod.
- Minor (Readability): on the portrait table the names that tell whose rod is whose are 12 px bold
  text rotated 90° in the rails (table.component.ts: clamp(0.75rem, 1.8cqw, 1.4rem) bottoms out at
  12 px on 360-820 px wide screens). These labels are the key to the main input ("Dotknij drążka
  gracza, który strzelił"), read at arm's length next to a real table. Files: 1-phone-small/27,
  2-phone/27, 3-tablet/27 (tablet has room for twice the size).
- Minor (Visual hierarchy): the yellow of the ball is also the "on" colour of switches ("Przewaga 2
  goli" in 2-phone/25, 4-desktop/25), the selected ring of kit swatches (2-phone/14) and the
  icon tile of "Mecz" in "Co gramy?" (2-phone/24). On the new game screen the switch and the CTA
  are both yellow, so the "one yellow thing = the main action" rule is diluted exactly where it
  matters most.
- Minor (Responsiveness/Consistency): 4-desktop/16 finished game: the content column ends at x≈1020
  but the header's "Rewanż" (the screen's main action) sits at x≈1120-1226, far right of the
  content it belongs to, and the goal log rows stretch 720 px with the time at one end and the
  score at the other.
- Nit (Consistency): the goal-detail pill reads "kto strzelił" (lower case, no prefix) on phones
  (2-phone/27, 1-phone-small/27) but "Zapis: kto strzelił" on tablet/desktop (3-tablet/27,
  4-desktop/27).
- Nit: "Przewaga 2 goli" / "Na czas" switches 52x32 (audit 'small' on every 25-new-game.json); the
  label beside them is part of the control, so only a nit.
- Good: "+" → "Mecz" → "Zacznij mecz" is three taps, with the last lineup prefilled and a clear
  summary board (2 na 2, rules, win chance). The new game's lineup is drawn on the felt in true
  table geometry. The running game has an LED clock, LED team scores with per-player goals, an
  always-visible "Ostatnio: Gol z ataku: Darek" + "Cofnij", and a landscape layout on wide screens
  that uses the full width (4-desktop/27, 5-wide/27). Pause offers Wznów (ball) / Wyjdź / Usuń.
  The finished game shows LED score on felt, Elo changes per player, a step chart and the goal log.

## Group F: leagues, app menu, switcher, new league, overall views, empty league (17-23)

Seen: 2-phone 17/18/19/20/21/22/23, 4-desktop 19/20/22/23, 5-wide 18, audits for all.

- Minor (IA): on the phone, "Ustawienia ligi" and "Zaproś" live only in the sheet behind the league
  title's chevron, which looks like (and is mostly) a league switcher; the hamburger ("Aplikacja")
  holds language, "Którym graczem jesteś?" and "Ranking ogólny" but no league settings. A newcomer
  looking for settings opens the hamburger and does not find them. Files: 2-phone/22, 2-phone/23.
- Minor (Consistency): the leagues page is titled "Ligi" but every link to it says "Znajdź ligę"
  (desktop rail, switcher sheet). Files: 4-desktop/20, 2-phone/23, 2-phone/20.
- Minor (IA, duplicated paths): "Ranking ogólny" is reachable three ways on one desktop screen
  (rail, the page's "Wszystkie ligi razem" card, the hamburger sheet) and twice on phone
  (page card + hamburger). Files: 4-desktop/20, 4-desktop/22, 2-phone/20, 2-phone/22.
- Minor (Consistency): the live state of a league is shown three different ways: LED panel with a
  red dot on the league home ("Teraz w lidze", 2-phone/01), a red "Trwa" pill in game lists
  (2-phone/04), and plain bold white text that wraps to two lines on the leagues page ("Trwa mecz:
  Bartek & Gosia – Ala & Darek, 2:3", 2-phone/20, 4-desktop/20), where it also replaces the grey
  "N graczy · N meczów" subtitle the other card has.
- Nit (Readability): the ranking legend says "ikony: tytuły ligi" on "Ranking ogólny", which is not a
  league (2-phone/17).
- Nit (Consistency): the "Aplikacja" sheet's rows start at x=20, the other sheets at 16 (lefts
  audit 22-app-menu.json '20': 3 vs 23-league-switcher.json '16': 5).
- Nit (Consistency): the "Którym graczem jesteś?" card is on the empty league on phone (2-phone/19)
  but not on desktop (4-desktop/19).
- Good: the leagues page explains the app in one sentence ("Wyniki, ranking i turnieje waszych
  piłkarzyków. Otwórz swoją ligę albo załóż nową."), then search, this device's leagues, a yellow
  "Nowa liga". The empty league has a clear first step (one yellow "Zacznij mecz", the bar's "+"
  goes quiet). New league is a 2-step wizard with an example in the hint.

## Group G: the awkward league (awkward-01 … awkward-14 on 1-phone-small, 2-phone, 4-desktop)

Seen: every 2-phone awkward shot (cropped), 1-phone-small awkward-01/09/14, 4-desktop awkward-01/03/05/07/10/12/14.

- Major (Robustness): on 4-desktop/awkward-01 the Elo ranking switches to full names and gives
  them ~130 px, so names are cut hard: "Krzyszt… [Ty]", "Grzegorz Brzęc…", "Małgorzata
  Zielińska-…", "Tomasz Ołdako…", "Żaneta Ślęczko…" (audit 'truncated' lists all five). The phone
  shows unambiguous short names ("Krzysztof", "Grzegorz") uncut (2-phone/awkward-01). The widest
  screen shows the least of each name, and the current user's own first name is cut to 7 letters.
- Minor (Robustness): one person, several names on neighbouring screens: "Anna" in the Elo ranking
  vs "Anna Maria" in the potato view and players list; "Grzegorz" vs "Grzegorz Brzęczyszczykie…";
  the tournament table says "Piotr" while its own summary says "Piotr Wiśniewski"; game boards
  say "Krzysztof" while "Ostatnio" says "Krzysztof-Maksymilian Brzęczyszczykiewicz". Files:
  2-phone/awkward-01, -03, -06, -10, -14.
- Minor (Robustness): avatar initials change with the name form: Żaneta Ślęczkowska-Wójtowicz is
  "ŻS" in the ranking and players list but "ŻA" on the game screen and in the tournament's player
  list (avatar.component.ts builds initials from whatever name it is given). Files:
  2-phone/awkward-01 vs 2-phone/awkward-14, 4-desktop/awkward-10.
- Minor (Readability, Polish): tournament table marks players who left as "wypisany" under
  Kasia and Ola (should be "wypisana"); the app has no gender, so the word needs to be neutral.
  Files: 2-phone/awkward-10, 4-desktop/awkward-10.
- Minor (Robustness): compare on 360 px: the win-chance labels break so the left label reads
  "Krzysztof-Maksymilian / Brzęczyszczykiewicz 62%" and the right one puts "38%" on line 1 and "Bo"
  on line 2; the header above truncates the same name to "Krzysztof-…" while the body prints it in
  full twice, and the form line wraps with its dots floating beside the second line
  (1-phone-small/awkward-09, 2-phone/awkward-09).
- Minor (Robustness): finished game card with long names: "Grzegorz / Brzęczyszczyki.." (two
  periods, not an ellipsis) and "Tomasz / Ołdakowski" wrap to two lines, so the four player rows
  no longer line up across the score (2-phone/awkward-12).
- Minor (Robustness): meaning cut on 360 px: the live card shows "Małgor… & Grzegorz"
  (1-phone-small/awkward-01, audit 'truncated': "Małgorzata"), the rod label reads "Małgor…" and the
  undo context reads "Gol z obrony: Krzysztof- / Maksymilian…" (1-phone-small/awkward-14).
- Minor (Visual hierarchy): on 1-phone-small/awkward-01 the "Ranking" tab shows the you-card, a
  live game, a paused game, the tournament card and the legend before the first ranking row, which
  starts at y≈550 of 640 (one row peeks above the bar). Even the ordinary league leaves room for
  only two rows on 360x640 (1-phone-small/01).
- Nit (Readability): orphan "czasie" in "120 meczów · rekordy, kiedy gramy, Elo w / czasie"
  (2-phone/awkward-01) – same family as the orphans in group B.
- Good: the 62-character league name wraps to two lines in the header and truncates cleanly in
  the rail and the switcher; 15:13 scores fit in LED boxes everywhere; ties ("5, 5, 7"); players
  without games read "jeszcze bez meczów" and sit under "Mniej niż 5 meczów"; paused game appears as
  "Wstrzymany" in lists and on the league home; the "Moje" filter appears once "Ty" is chosen; long
  record lines wrap instead of overflowing; no horizontal scroll anywhere.

## Other sizes checked (1-phone-small, 3-tablet, 5-wide)

1-phone-small 01/04/05/11/20/27, 3-tablet 01/04/05/11/20/27, 5-wide 01/05/18/20/27: everything
holds together; no horizontal scroll, no overlap. Tablet is the phone layout in a 720 px column
(acceptable; the full-width 720 px "Nowa liga" ball is heavy). 5-wide keeps a centred 1120 px
column beside the rail, with two columns for stats and profile, and a landscape game screen.

---

# Final report (rubric format)

Where a severity or dimension below differs from the working notes above (e.g. a note first logged
as Minor and scored as a Nit, or the desktop hamburger nit folded into the duplicated-paths Minor),
this table is the one that counts.

## 1. Scores

Severity: Major −1, Minor −0.5, Nit −0.25 (nits capped at 1 per dimension). Each problem is counted
once per dimension.

| Dimension                            | Score          | Deductions (severity, problem, files)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Visual hierarchy and system       | **7.3** (7.25) | Major: the Elo row carries ~9 signals and needs the printed legend "Ostatnie mecze: ● wygrana ○ porażka · ikony: tytuły ligi, +N: kolejne (więcej pod ?)" (2-phone/01, 1-phone-small/01, 3-tablet/01, 4-desktop/01, 5-wide/01, 2-phone/17). Minor: the ball's yellow also marks switches that are on, the selected swatch ring, the focused field and the "Mecz" tile, so it no longer means "the main action" (2-phone/25, 4-desktop/25, 2-phone/14, 2-phone/21, 2-phone/24). Minor: thin LED scores beside heavy Archivo values in records columns and tiles (2-phone/05, 4-desktop/05, 2-phone/07, 2-phone/11, 4-desktop/11). Minor: on 360x640 the "Ranking" tab shows 1-2 ranking rows above the bar, after the cards (1-phone-small/01, 1-phone-small/awkward-01). Nit: Elo and % set in Archivo although the look gives numbers of this size LED digits (2-phone/01, 4-desktop/01).                                                                                                                                                                                                                                 |
| 2. Consistency                       | **6.5**        | Minor: potato column heads at x=20 vs 16 everywhere else (lefts audit: 2-phone/03, 1-phone-small/03, 4-desktop/03 '276' vs '272'). Minor: on desktop "Ustawienia ligi" is a rail tab but has a back arrow header, its sibling tabs have the league title and switcher (4-desktop/10 vs 4-desktop/08). Minor: tile grids leave holes when the count does not fill a row (2-phone/12, 2-phone/15, 4-desktop/05, 4-desktop/12). Minor: a league's live game is a bold white sentence that wraps and replaces the grey subtitle on the leagues page, while elsewhere it is an LED card or a "Trwa" pill (2-phone/20, 4-desktop/20 vs 2-phone/01, 2-phone/04). Minor: the page is titled "Ligi" but every link to it says "Znajdź ligę" (4-desktop/20, 2-phone/23). Nits (capped at 1): pill label "kto strzelił" vs "Zapis: kto strzelił" (2-phone/27 vs 3-tablet/27); the only right-aligned button row (2-phone/07); "Aplikacja" sheet rows at x=20 (22-app-menu.json); you-card on the phone's empty league but not the desktop's (2-phone/19 vs 4-desktop/19); bold labels only on the Elo-by-position tiles (2-phone/12). |
| 3. Readability                       | **7.0**        | Minor: "16 mecze", "13 mecze", "17 mecze", "12 mecze" (pl.json ranking.colGames as a per-row unit; 3-tablet/01, 4-desktop/01, 5-wide/01, 4-desktop/awkward-01). Minor: "wypisany" under Kasia and Ola (2-phone/awkward-10, 4-desktop/awkward-10). Minor: the rod-owner labels on the portrait table are 12 px bold text turned 90° (clamp(0.75rem, 1.8cqw, …) bottoms out), "Małgor…" on 360 (1-phone-small/27, 2-phone/27, 3-tablet/27, 1-phone-small/awkward-14). Minor: orphan words ("(od 5 / meczów)", "Elo w / czasie") (2-phone/05, 2-phone/awkward-01). Nits (capped at 1): "Wygranych" as a column head (2-phone/12); ".." instead of "…" (2-phone/awkward-12); 13.3 px record/role line in ranking rows (unstyled `small`); "ikony: tytuły ligi" on "Ranking ogólny" (2-phone/17). Every main text pair clears 4.5:1 (table above).                                                                                                                                                                                                                                                                              |
| 4. Information architecture and flow | **7.0**        | Minor: on the phone, "Ustawienia ligi" and "Zaproś" exist only in the sheet behind the league title's chevron; the hamburger has neither (2-phone/22, 2-phone/23). Minor: "Ranking ogólny" is reached 3 ways on one desktop screen, and the hamburger is the only place to switch language (4-desktop/20, 4-desktop/22, 2-phone/20). Minor: on the Turnieje tab the page's own "+ Nowy turniej" is tonal while the generic yellow "+" also leads to a tournament (2-phone/06, 4-desktop/06). Minor: paused game still says "Dotknij drążka gracza, który strzelił." and keeps the score board and the "Zapis" selector live (2-phone/28, 4-desktop/28). Minor: name links 13-38 px wide (39 px tall) side by side in title and record lines, 18 per stats page ('small' in 05-league-stats.json and awkward-05: "13x39 Xi", "18x39 Bo", "21x39 Ala"). Nits: the rail puts "Znajdź ligę" and "Ranking ogólny" under "Na tym urządzeniu" (4-desktop/*); switches are 52x32 (10-settings.json, 25-new-game.json).                                                                                                             |
| 5. Responsiveness                    | **7.8** (7.75) | Minor: desktop games two per row: odd days leave empty right halves, chronology zig-zags, day headings sit over one column (4-desktop/04, 5-wide/04). Minor: desktop profile is the phone design stretched: a 990 px three-segment switch, single digits in 490 px tiles, three key numbers 320 px apart (4-desktop/11, 12, 13). Minor: finished game on desktop: "Rewanż" sits at x≈1120-1226, outside the 750 px content column, and goal rows are 720 px wide with time and score at the ends (4-desktop/16, 4-desktop/awkward-12). Minor: desktop stats squeeze the "Czas goli" tiles to ~155 px so their labels wrap while the column is otherwise empty (4-desktop/05, 4-desktop/awkward-05). Nit: duet rows on desktop are a name and a % with ~400 px between them (4-desktop/02).                                                                                                                                                                                                                                                                                                                                 |
| 6. Robustness to real data           | **6.5**        | Major: desktop ranking cuts full names to ~130 px ("Krzyszt… [Ty]", "Grzegorz Brzęc…", "Tomasz Ołdako…") while the phone shows short names uncut (4-desktop/awkward-01, audit 'truncated'). Minor: one person under several names on neighbouring screens ("Anna"/"Anna Maria", "Piotr"/"Piotr Wiśniewski" on one tournament page) (2-phone/awkward-01, -03, -06, -10, -14). Minor: initials "ŻS" vs "ŻA" for the same player (2-phone/awkward-01 vs -14, 4-desktop/awkward-10). Minor: compare on 360: "38%" and "Bo" on different lines, header "Krzysztof-…" vs full name twice in the body (1-phone-small/awkward-09). Minor: finished card with long names wraps and misaligns, ".." (2-phone/awkward-12). Minor: meaning cut on 360: "Małgor… & Grzegorz", "Gol z obrony: Krzysztof-Maksymilian…" (1-phone-small/awkward-01, -14).                                                                                                                                                                                                                                                                                   |

## 2. The ten most important problems (most severe first)

1. **Desktop ranking cuts player names (Major, Robustness).** 4-desktop/awkward-01: "Krzyszt…",
   "Grzegorz Brzęc…", "Małgorzata Zielińska-…", "Tomasz Ołdako…", "Żaneta Ślęczko…" in a 584 px
   column, while 2-phone/awkward-01 shows "Krzysztof" and "Grzegorz" whole. _Why:_ on the biggest
   screen you can read the least of who is who, including your own name. _Fix:_ use the same short
   unique name in the desktop rows as on the phone (full name in `title` and on the profile), and
   give the name a minimum width (~180 px) by dropping the per-row "mecze/wygranych" labels into one
   header row or moving games / win % under the name.
2. **The ranking row needs a legend to be read (Major, Hierarchy).** 2-phone/01 and every size:
   name + 1-3 title icons + outlined "+N" chip + record + "głównie atak/obrona" + 5 form dots + Elo
   - delta, explained by the line "Ostatnie mecze: ● wygrana ○ porażka · ikony: tytuły ligi, +N:
     kolejne (więcej pod ?)". _Why:_ the main screen of the app reads like a data table with
     footnotes; on 360 px the legend shrinks and stops explaining the dots. _Fix:_ show one title
     icon at most (the rest on the profile), drop the "+N" chip, move "głównie atak/obrona" to the
     profile, label the form dots once as a column head ("Forma") and move the legend into the "?"
     sheet.
3. **The paused game still tells you to score (Minor, IA).** 2-phone/28, 4-desktop/28: under the
   pause card "Dotknij drążka gracza, który strzelił." stays lit; on desktop the score board and
   "Zapis: kto strzelił" stay undimmed. _Why:_ it contradicts the state the screen is in, during
   the most-used flow. _Fix:_ while paused, replace the hint with "Pauza – wznów, żeby zapisywać
   gole" (or hide it) and dim the board and the selector the same way as Cofnij / Samobój.
4. **One player, several names and initials (Minor ×2, Robustness).** "Anna" (ranking) vs "Anna
   Maria" (potato, players); tournament table "Piotr" vs its summary "Piotr Wiśniewski"; avatar "ŻS"
   (ranking) vs "ŻA" (game screen, tournament) (2-phone/awkward-01, -03, -10, -14). _Why:_ people
   recognise each other by the label and the badge; changing them per screen erodes trust. _Fix:_
   one display-name function per league (shortest unique form) used in every list, table, board,
   summary and the potato view; always build initials from the full name.
5. **Rod-owner labels are 12 px and turned sideways (Minor, Readability).** 1-phone-small/27,
   2-phone/27, 3-tablet/27; "Małgor…" on 1-phone-small/awkward-14. _Why:_ they tell you which rod
   to tap for which player, read at arm's length next to a real table; the tablet has room for twice
   the size. _Fix:_ raise the clamp minimum to 15-16 px and let it grow with table height, or set
   the names horizontally beside the handles, and use the short name so it never truncates.
6. **The ball's yellow is not reserved for the main action (Minor, Hierarchy).** "Przewaga 2 goli"
   switch track (2-phone/25, 4-desktop/25), swatch selection ring (2-phone/14), focused field
   outline (2-phone/21), "Mecz" icon tile (2-phone/24). On the new game screen a switch and the CTA
   are both yellow. _Fix:_ switches on = ink track with dark handle (or felt green), selection and
   focus rings in ink/white, the "Mecz" tile tonal; keep yellow only on `fl-cta` and the FAB.
7. **Desktop layouts are the phone layouts made wider (Minor ×4, Responsiveness).** Games two per
   row with holes and zig-zag order (4-desktop/04); a 990 px profile switch and 490 px single-digit
   tiles (4-desktop/11-13); "Rewanż" outside the content column on the finished game
   (4-desktop/16); squeezed "Czas goli" tiles in an empty column (4-desktop/05). _Fix:_ keep games in
   one centred column per day (max ~640 px) or put days, not games, in columns; cap the profile
   switch at ~480 px and lay out profile card + chart side by side; align the finished game header
   to the content column (or put "Rewanż" inside the felt card); let stats tiles span the column.
8. **League settings are hidden on the phone (Minor, IA).** 2-phone/22 (hamburger: language, "Którym
   graczem jesteś?", "Ranking ogólny") vs 2-phone/23 (the title's sheet holds "Zaproś" and
   "Ustawienia ligi"). _Why:_ the chevron reads as a league switcher; a newcomer looks for settings
   in the menu. _Fix:_ add "Ustawienia ligi" and "Zaproś" to the hamburger sheet when inside a
   league (or a gear in the league header), and rename the link "Znajdź ligę" to "Ligi" to match the
   page it opens.
9. **"16 mecze" (Minor, Readability).** pl.json `ranking.colGames: "mecze"` printed under each number
   (3-tablet/01, 4-desktop/01, 5-wide/01): "16 mecze", "13 mecze", "17 mecze", "12 mecze" are wrong
   Polish (only "23 mecze" is right). _Fix:_ one header row ("Mecze", "% wygr.") above the columns,
   or an ICU plural per value ("{n, plural, one {mecz} few {mecze} many {meczów} other {meczu}}").
10. **"wypisany" under women's names (Minor, Readability).** 2-phone/awkward-10, 4-desktop/awkward-10
    (Kasia, Ola). _Fix:_ a neutral form ("poza turniejem", "wypisano") or an icon with a tooltip.

(Next in line: compare labels breaking on 360 px, 1-phone-small/awkward-09; narrow side-by-side name
links in stats, 05-league-stats.json 'small'; Turnieje tab's tonal "Nowy turniej" next to the yellow
"+", 2-phone/06; "Ranking ogólny" three times on one desktop screen, 4-desktop/20.)

## 3. Overall

- **Overall score (lowest dimension): 6.5** (Consistency and Robustness to real data).
- Mean for information: (7.25 + 6.5 + 7.0 + 7.0 + 7.75 + 6.5) / 6 = **7.0**.

The base is solid: the token palette passes contrast everywhere (lowest main text pair 4.62:1 white
on --fl-red), there is no horizontal scroll, no overlapping text, starting a game is 3 taps with
the last lineup prefilled, every screen has one yellow action, and the LED/felt language is applied
with care. What keeps it under 8 is a long tail of minors plus two Majors: name handling on wide
screens, and a ranking row that needs a legend.

## 4. What I could not judge from the material

- Hit zones of the table's rods and figures (only the drawing is visible), and how scoring feels
  standing at a real table; landscape rotation and the quarter-turn modes on a real phone.
- Motion and timing: the 8 s finish panel with confetti and the "Next" countdown is not in the tour
  (16-game-finished is the later game page), LED blinking, sheet animations, loading skeletons.
- 16-game-finished and all game screens are captured at viewport height only; the rest of the goal
  log and anything below it was not seen.
- Sheets and dialogs not in the tour: the ranking "?" help, the player picker, add player, delete
  league/tournament, the timeline sheet, the expanded "Zasady" and "Ekran i zapis goli" folds,
  tournament formats other than "Otwarty" (king, draw, round robin, the cup bracket), the
  2017 league, offline/update snackbars, error states.
- The English UI, keyboard focus order, screen reader output, and hover/focus states (except one
  accidental hover in 2-phone/04, not counted).
