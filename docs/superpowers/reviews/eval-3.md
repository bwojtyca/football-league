# Design evaluation, round "eval3" (independent evaluator)

Brief: docs/superpowers/reviews/rubric.md. Material: scratchpad/eval3 screenshots and audits,
src/ (tokens in src/styles.scss), public/i18n/pl.json, CLAUDE.md principles + "The look".

Status: complete. Scores and the ten problems are at the end of this file.

## Contrast computed from tokens (WCAG relative luminance)

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--fl-ink` #f2f4f0 on paper #000 | 18.97 | ok |
| `--fl-ink-2` #9aa39d on #000 / card #0b0c0d / card-2 #17191c / dialog #16181a / sheet #121416 | 8.10 / 7.55 / 6.79 / 6.87 / 7.12 | ok |
| switch idle text #b9c2bc on #17191c | 9.65 | ok |
| `--fl-on-ball` #1b1410 on ball #ffc629 | 11.58 | ok |
| white on `--fl-red` #d0433a / `--fl-blue` #3a64d6 | 4.62 / 5.28 | ok (red barely) |
| `--fl-red-text` #ff5a4e / `--fl-blue-text` #5c8cff on #000 | 6.82 / 6.65 | ok |
| `--fl-win` #5be394 / `--fl-loss` #ff8a80 on card | 11.99 / 8.58 | ok |
| white on felt #157a42 (lightest) / #0d5a31 | 5.39 / 8.32 | ok |
| slot role text #ff9a92 on red slot #372e1d, #9db8ff on blue slot #153d47 | 6.55 / 6.00 | ok |
| potato row: ink-2 on #3b2f1b, #f3dfb5 on #3b2f1b | 5.04 / 9.97 | ok |
| provisional rating: ink at opacity .45 (= #6d6e6c) on #000, 21.6 px bold (large) | 4.10 | ok for large text |
| avatar initials white on #a77a0e / #c4581d (2 of 12 avatar colours) | 3.87 / 4.41 | below 4.5 for ~14-16 px bold initials (minor) |
| card #0b0c0d on paper #000 (surface separation) | 1.07 | cards barely visible; crest #0a0b0a on card #0b0c0d invisible |
| `--fl-line-2` #4a4f4b on #000 (Elo chart "others" lines are similar greys) | 2.51 | decorative de-emphasis, acceptable |

Text contrast is not the problem of this app: every body text pair measured passes 4.5:1.

## Phone (412) and small phone (360): league pages

- 01 ranking (2-phone, 1-phone-small): clear list; but the form dots (5 filled/empty circles) and
  the title icons after names (star, handshake, shield, medal "+2", potato, target, flame) carry
  meaning with no label on the ranking; the profile labels the dots "Ostatnie mecze" but the
  ranking does not. On 360x640 the ranking starts at y=375: only 2 players above the bottom bar,
  under "Którym graczem jesteś?", "Teraz w lidze" and the tournament card (1-phone-small/01).
- Header: gear without a background next to a hamburger in a filled circle (two styles of icon
  button side by side) on every league page (01-08, 19); the tournament page puts a kebab next to
  the hamburger (07): two "more" menus side by side, and the league switcher sheet (23) repeats
  "Ustawienia ligi" that the gear already opens; the app menu (22) repeats "Ranking ogólny" and
  "Wszystkie ligi" that the leagues page shows as cards.
- The central "+" of the bottom bar is the yellow ball on most pages but a dark grey disc on the
  tournament page (07) and the empty league (19), so the same control changes its look by page.
- Cards: link cards use two fills without a rule: "Którym graczem jesteś?" and "Statystyki ligi"
  #17191c, the tournament card, tournaments list and league cards #0b0c0d (1.07:1 against the
  page: barely a card). Measured on 2-phone/01, 06, 20.
- Statistics are entered from the Ranking page ("Statystyki ligi" card at the end of the list),
  but the page then highlights the "Mecze" tab (2-phone/05): the tab bar says you are somewhere
  else than where you came from. The same card also opens the Games tab (04): two paths, one tab.
- 04 games: running game shows "Trwa 09:18" where 09:18 is the start time, while the "Teraz w
  lidze" card shows "04:25" as elapsed time (01); 07:12 / 06:47 under finished games are start
  times. The colon is used for a score (8:5), goals for:against (tournament "Gole 22:12", 07),
  a time of day (07:12) and a duration (07:15 gry, 05:50 Średni mecz). Worst on the finished game
  (16): "14 października 2026 07:12 · 07:15 gry" reads as a range 07:12-07:15.
- 05 league stats: tiles put the value above the label; profile records (11) put the label above
  the value; profile stats (12) use label-above-value rows without tiles. Three anatomies for
  "a number with a label". Tiles leave an empty cell (row 3 of "W liczbach", "Czas goli").
  Names inside records are inline links 15-17 px tall (audit `small`: 10-12 per stats page).
  Elo chart has no time axis.
- 07 tournament: leave-tournament is an unlabeled "logout" icon repeated per player; "Gole 22:12".
- 11 profile: achievements break before a lone "z" ("3 wygrane z / rzędu"), "wygrane – /
  porażki" breaks at the dash on 360 (1-phone-small/11). "1551 w obronie" / "1476 w ataku" (12)
  are Elo values without the word Elo. In 12, the tables "Pozycje" and "Kolory" have different
  column widths (value columns at x≈614 vs ≈549 of 824), and "strzelone" means total in "Gole"
  but per game in "Pozycje".
- 13 profile games: the player's own name sits in a grey pill that stretches to the column edge
  (e.g. "Ala" pill 250 px wide), which reads like an empty input.
- 25 new game: large uneven gaps (≈50 px under "Zasady", ≈90 px above the summary board).
- 27 game running (2-phone): the main action, recording a goal, has no visible label once the
  first goal is in (tap a rod); the yellow colour on this screen is the clock, not an action.

### Small phone (360) game screen: BLOCKER

- 1-phone-small/27-game-running, 28-game-paused, awkward-14-game-running: the pause/resume
  button is drawn over the LED clock ("04:■3", "04:▶4", "09:■0"). The clock is unreadable and
  the pause control sits on top of digits. The header holds back, rotate, "Gol: Kto strzelił"
  pill, clock, pause and menu in 360 px; at 412 it just fits.

## Awkward league (360 / 412)

- Live "Teraz w lidze" card: "Krzy… & Żane… / Małg… & Grze…" (360), "Krzys… & Żanet… / Małgo… &
  Grzeg…" (1280 desktop, right column has room), paused card "Xi & Anna…" (1-phone-small,
  2-phone, 4-desktop awkward-01/03). Names cut to 4-5 letters on every size.
- Game screen 360 (awkward-14): the clock is overprinted by the pause button ("09:■0"); the
  last-event line is cut mid-event: "Krzysztof-Maksymilian Brzęczyszczykiewicz strze…", the one
  line that says what "Cofnij" will undo. The blue "Zamień pozycje" button runs off the right
  edge at 360 (pixel at x=359 css is still the button fill #17191c, no rounded end, no gutter):
  1-phone-small/27, 28, awkward-14.
- Game lists (awkward-04): 49 (360) / 42 (412) truncations, e.g. "Krzysztof-…", "Żaneta Ślę…",
  "Małgorzata …", "Grzegorz B…"; first names survive, acceptable but dense.
- Same paused game: "Wstrzymany 08:43" in the games list vs "Wstrzymany: czwartek, 08:53" on the
  live card; same running game "Trwa 09:14" vs "09:10" elapsed (1-phone-small/awkward-04 vs -01).
- Ranking 360 (awkward-01): stats columns and form dots are dropped (good adaptation); shared
  places "5, 5, 7" are right; "Mniej niż 5 meczów: Jędrzej, Natalia Nowak, / Wiktor" orphan.
- Duets (awkward-02): every pair is listed, ~90 rows, 6,200 css px tall on a phone; the
  "Za mało meczów razem" group (1-4 games) is most of it and is not folded.
- Profile stats (awkward-08): "1524 w obronie (47 meczów)", "1499 w ataku (10 meczów)" (=57) but
  the "Pozycje" table says "mecze 52 / 15" (=67) for a player with 62 games (1-on-1 games counted
  in both columns). Three counts that do not agree on one screen. "Turnieje: rozegrane 1,
  wygrane 0" while that tournament is still running.
- Finished game 360 (awkward-12): left names truncate ("Grzegorz Brzęczyszc…"), right names wrap
  ("Tomasz / Ołdakowski"): two treatments in one card. Tournament table 360 (awkward-10) wraps
  names to two lines, a third treatment.
- Stats (awkward-05): heatmap "Kiedy gramy" with one start hour becomes seven identical bright
  bars under a lone "5"; hour labels lack ":00"; Elo chart has no time axis.
- Tournament header 360 (awkward-10): title wraps to two lines with ellipsis next to a kebab and
  a hamburger (two overflow menus side by side).

## Desktop (1280), wide (1920), tablet (820)

- Desktop shell: rail (brand, device leagues, "Wszystkie ligi", league tabs, yellow "Nowa
  rozgrywka") + page column 720 px from x=272. Ranking pages add a right column (x=924-1264);
  other tabs do not, so the hamburger sits at x≈1252 on Ranking but x≈980 on Turnieje, Gracze,
  Ustawienia, profile (4-desktop/01 vs 06, 08, 10, 11); on 1920 it jumps 1380 vs 980.
- Finished game (4-desktop/16, 5-wide/16, awkward-12) drops the rail and centres a 720 column:
  the only page with a different shell and alignment; navigation reduces to a back arrow.
- Wide 1920: players (5-wide/08), leagues (20), tournaments (06), settings (10), tournament (07),
  overall ranking (17) keep a 720 px column next to the rail and leave ~930 px (48 % of the
  screen) black on the right. Statistics (05), profile (11) and compare (15) do use two columns
  (good), so the wide treatment is applied to some pages only.
- Stats wide (5-wide/05): "Kiedy gramy" heatmap stretches two hour columns to ~180 px cells.
- Compare (4-desktop/15, 5-wide/15, awkward-09): "Razem w drużynie" tiles fill half the column
  and break "2–2" across lines ("wygranych · 2–" / "2"); the player's own name in the shared
  games list sits in a grey bar that spans the empty half of the column and reads like a loading
  skeleton (also 4-desktop/13, 2-phone/13).
- New game dialog at 1280x800 (4-desktop/25) and 360x640 (1-phone-small/25): the summary board
  with the win chance is cut under the sticky "Zacznij mecz"; new tournament dialog at 1280x800
  (4-desktop/26) cuts the sixth format ("Puchar") with no scroll cue.
- League switcher (4-desktop/23): three row styles in one sheet (filled cards for invite and
  settings, a bare text row for the other league, a divider row for "Wszystkie ligi").
- Game running desktop/wide (4-desktop/27, 5-wide/27): good use of space (table + side panel);
  clock 20 px yellow LED is the most saturated element; recording a goal (tap a rod) has no label.
- Tablet 820 (3-tablet/01, 04, 05, 11, 20, 25, 27): phone layout centred in a 720 column with the
  bottom bar; holds together, no defects beyond those shared with phones.
- Body text sizes from code: `.fl-stats .hint`, `.rules`, dialog and settings descriptions,
  mode-picker explanation ("Od 7:7 gra toczy się…"), tournament format descriptions use 0.85rem =
  13.6 px (below the 14 px body minimum); game-list meta 0.78rem = 12.5 px (metadata, allowed);
  live-card clock is Doto LED at 0.85rem = 13.6 px (the look itself says LED only from ~18 px);
  rail names on the drawn table clamp down to 0.6rem = 9.6 px at 360 (duplicated in the score
  bars, so secondary).

---

# Scores

Paths are relative to `scratchpad/eval3/`. B = Blocker (-2), M = Major (-1), m = Minor (-0.5),
n = Nit (-0.25).

| Dimension | Score | Deductions |
| --- | --- | --- |
| 1. Visual hierarchy and system | **7.3** (7.25) | m: the yellow "ball" is a general accent, not just the main action: the game clock (the most saturated thing on the game screen), the active nav tab, rank 1, toggles, selection rings and the kit number are all yellow (2-phone/27, 4-desktop/27, 5-wide/27, 2-phone/01, 1-phone-small/14) · m: LED digits for scores are applied unevenly: LED in lists, the live card and the head-to-head, Archivo for the same kind of number in league records "8:0 / 8:6 / 3:6", tournament summary "8:1", tournament table "Gole 22:12" and profile "8:0"; the live-card clock is LED at 13.6 px, under the look's own ~18 px floor (2-phone/05, 07, 11, 01) · m: surfaces barely separate: card #0b0c0d on paper #000 is 1.07:1; league crests (#0a0b0a on #0b0c0d) disappear, so "WWG" and "B" float at different x (2-phone/20, 4-desktop/20, 2-phone/06) · m: the "this player" highlight in game lists is a grey bar across the empty half of the column and looks like a loading skeleton (2-phone/13, 4-desktop/13, 4-desktop/15, 5-wide/15, 4-desktop/awkward-09) · m: phone ranking page: three stacked cards ("Którym graczem jesteś?", live game, tournament) push the ranking down; at 360x640 it starts at y≈375 and two rows are visible (1-phone-small/01, 1-phone-small/awkward-01, 2-phone/01) · n: the bar's "+" and the rail's "Nowa rozgrywka" change from yellow to grey/white on some pages (2-phone/07, 19, 4-desktop/07, 19) |
| 2. Consistency | **7.3** (7.25) | m: header controls vary: bare gear next to a filled hamburger, kebab next to hamburger on the tournament page (two overflow menus), kebab only on the finished game; the hamburger moves from x≈1252 (Ranking) to x≈980 (other tabs) at 1280, and from 1380 to 980 at 1920 (2-phone/01, 07, 16; 4-desktop/01 vs 06, 08, 10; 5-wide/01 vs 08) · m: a number with its label has three layouts: value over label in tiles, label over value in profile records, a label-over-value grid without cards in profile stats. Tile grids leave holes ("W liczbach" row 2), the compare tiles fill half the width and the tournament tiles fill all of it (2-phone/05, 11, 12, 15, 07; 4-desktop/15) · m: tables on one page use different column grids (Pozycje, Kolory, Partnerzy; tournament table centred, profile tables right-aligned) (4-desktop/12, 4-desktop/awkward-08, 2-phone/07) · m: one kind of navigation card gets two fills ("Statystyki ligi", "Ranking ogólny" and "Którym graczem" #17191c; league and tournament cards #0b0c0d); the switcher sheet mixes three row styles (2-phone/01, 06, 20; 4-desktop/20, 23) · m: the finished game page drops the rail and centres its column, unlike every other page (4-desktop/16, 5-wide/16, 4-desktop/awkward-12) · n: segmented controls differ: full-width profile tabs, content-width ranking and games switches, and stats section chips that look like filter chips (2-phone/11, 01, 04, 05) |
| 3. Readability | **4.3** (4.25) | B: at 360 px the pause button is drawn over the LED clock ("04:■3", "09:■0"): the time is unreadable and a control overlaps text (1-phone-small/27, 28, awkward-14) · M: times are ambiguous and contradict each other: the same running game reads "Trwa 09:18" (start time) in the games list and "04:25" (elapsed) on the live card; the paused game reads "08:43" vs "czwartek, 08:53"; the finished game shows "07:12 · 07:15 gry"; durations (05:50, 08:28) look like times of day (2-phone/01 vs 04, 1-phone-small/awkward-01 vs awkward-04, 2-phone/16, 4-desktop/awkward-12) · M: body and supporting copy at 0.85rem = 13.6 px, under the 14 px minimum: stats hints and legends, potato rules, the rules explanation in the new game dialog, tournament format descriptions, settings descriptions (2-phone/05, 03, 25, 26, 10) · m: text that carries meaning is truncated: live-card names, the last-event line, game-list names (49 and 42 truncations at 360 and 412) (1-phone-small/awkward-01, awkward-04, awkward-14) · m: bad line breaks: "2–" / "2", "3 wygrane z / rzędu", "wygrane – / porażki", "…Natalia Nowak, / Wiktor" (4-desktop/15, 5-wide/15, 4-desktop/awkward-09, 1-phone-small/11, 1-phone-small/awkward-01) · m: metrics without labels: form dots and title icons in the ranking (explained only behind "?"), potato "3 dni" with no column header, "1551 w obronie" with no "Elo", the tile "Grali 7", and "00:34 pierwszy gol średnio po", which reads backwards (2-phone/01, 03, 12, 05) · n: avatar initials, white on #a77a0e, are 3.87:1 and on #c4581d 4.41:1 (4-desktop/awkward-01 "ŻŚ"; avatar.component.ts) |
| 4. Information architecture and flow | **7.0** | m: overlapping navigation: the league title (switcher: settings, all leagues), the gear (settings) and the hamburger (app menu: overall ranking, all leagues, "which player") all sit in one header; the rail on desktop adds a fourth path. On the leagues page the app menu repeats that page's own cards (2-phone/22, 23; 4-desktop/22, 23) · m: Statistics opens from the Ranking tab (card at the end) and from the Games tab (card at the top), and the stats page then marks "Mecze" as active (2-phone/05, 3-tablet/05, 4-desktop/05, 5-wide/05) · m: the tournament page has two "new" actions: the yellow "Nowy mecz" (a tournament game) and the bar's "+" or the rail's "Nowa rozgrywka" (a league game). "Seria" is offered both in "Co gramy?" and as a format of "Nowy turniej" (2-phone/07, 24, 26; 4-desktop/07) · m: the tournament's per-player "leave" action is a bare logout icon on every row (2-phone/07, 4-desktop/07, 4-desktop/awkward-10) · m: the first screen does not say what the app is: an English brand "Football League" (it suggests soccer) in a Polish UI, then "Ligi", a search and "Nowa liga" (2-phone/20, 4-desktop/20) · m: on the running game screen the main action (tap the rod or figure that scored) has no visible prompt once play has started; "Gol: Kto strzelił" is a setting that looks like a status line (2-phone/27, 3-tablet/27, 4-desktop/27). Positive: start a game in 3 taps (+, Mecz, Zacznij mecz), a rematch in 1, a clear empty state |
| 5. Responsiveness | **5.5** | B: the 360 px game header overflows and the pause button lands on the clock (1-phone-small/27, 28, awkward-14) · M: at 1920 most pages keep a 720 px column left-aligned next to the rail, leaving ~930 px (48 %) empty on the right: players, leagues, tournaments, tournament, settings, overall ranking; the finished game is centred with ~600 px empty on each side (5-wide/06, 07, 08, 10, 17, 20, 16) · m: at 360 the blue "Zamień pozycje" button runs off the right edge (1-phone-small/27, 28, awkward-14) · m: at 360x640 the ranking starts below three cards, with two players visible (1-phone-small/01, 1-phone-small/awkward-01) · m: short viewports cut dialog content: the new game's chance board under the sticky "Zacznij mecz" at 360x640 and 1280x800; the new tournament's sixth format at 1280x800 with no scroll cue (1-phone-small/25, 4-desktop/25, 4-desktop/26) |
| 6. Robustness to real data | **6.8** (6.75) | M: long names wreck the live "Teraz w lidze" card at every size, including 1280 with room to spare ("Krzys… & Żanet… / Małgo… & Grzeg…", "Anna…"); at 360 the last-event line loses the event itself ("…strze…") (1-phone-small/awkward-01, 2-phone/awkward-01, 4-desktop/awkward-01, 4-desktop/awkward-03, 1-phone-small/awkward-14) · m: position counts do not add up once 1-on-1 games exist: "Pozycje: mecze 52 / 15" (=67) for 62 games, next to "w obronie (47 meczów)" and "w ataku (10 meczów)" (=57) (4-desktop/awkward-08, 2-phone/awkward-08) · m: duets list every pair (~90 rows, ~6,200 css px on a phone) and do not fold the 1-4-game pairs (2-phone/awkward-02, 4-desktop/awkward-02) · m: the heatmap degenerates when few start hours exist: one "5" column of seven identical bars, or two 180 px columns (4-desktop/awkward-05, 2-phone/awkward-05, 5-wide/05) · m: long names get three treatments: truncated on one side of the finished-game card, wrapped on the other, wrapped in the tournament table (1-phone-small/awkward-12, 1-phone-small/awkward-10) · n: "Turnieje: rozegrane 1, wygrane 0" while that tournament is still running (4-desktop/awkward-08). Positive: shared places (5, 5, 7), paused and running states, an empty league with a clear CTA, 15:13 scores, 1-on-1 games and a 62-character league name all hold |

**Overall (lowest dimension): 4.3 (Readability).** Mean for information: (7.25 + 7.25 + 4.25 +
7.0 + 5.5 + 6.75) / 6 = **6.3**.

Without the 360 px header overlap (one Blocker in two dimensions) the lowest dimension would be
Responsiveness at 7.5 and Readability at 6.25. The single largest lever is the game header at
small widths; the next are the time formats and the 13.6 px body text.

# Ten most important problems (most severe first)

1. **Game header overlaps the clock at 360 px (Blocker).** Where: 1-phone-small/27, 28,
   awkward-14. The pause button (left edge x=266 css) is drawn over the LED clock, which reads
   "04:■3" or "09:■0", and the blue swap button runs off the right edge. Why: the clock is the
   timer of timed games, and the header is the most-used screen while people stand at the table.
   Fix: below ~400 px, show the goal-detail pill as an icon button (or move it into the menu);
   give `.clock` `flex: none` and a min-width of 5ch; let only the pill shrink (`min-width: 0;
   overflow: hidden`). Lay out the bottom row with a 16 px right gutter, with the two swap dots
   inside one 2-segment control.
2. **Times that contradict each other (Major).** Where: 2-phone/01 ("04:25") vs 2-phone/04
   ("Trwa 09:18") for the same game; 1-phone-small/awkward-01 vs awkward-04 ("08:53" vs "08:43"
   for the paused game); 2-phone/16 ("07:12 · 07:15 gry"). Why: a time of day, an elapsed time
   and a duration all look like `mm:ss`, so people read the wrong number. Fix: write the start
   as "start 09:18" or "o 09:18", elapsed play as "gra 4:25" (LED, with a timer icon), and
   durations as "7 min 15 s" (or "7:15 min" in tables). On the finished game: "śr., 14 paź ·
   start 07:12 · 7 min 15 s".
3. **Body text at 13.6 px (Major, hard threshold).** Where: hints and legends on 2-phone/05, the
   potato rules (03), the rules explanation in the new game dialog (25), format descriptions in
   the new tournament dialog (26), settings descriptions (10). In code: `.fl-stats .hint`,
   `.rules`, mode-picker, tournament-new-dialog, league-settings, all `font-size: 0.85rem`. Why:
   below the 14 px minimum on a phone held at arm's length. Fix: a single `--fl-body-small:
   0.875rem` token for supporting copy, and 12-13 px only for metadata (dates, counts).
4. **Wide screens are left half-empty (Major).** Where: 5-wide/06, 07, 08, 10, 17, 20 (720 px
   column, ~930 px black on the right); 5-wide/16 (finished game centred with no rail). Why: at
   1920 the product looks like a stretched phone, and the rubric names this case. Fix: from 1400
   px give every page a two-column layout or a centred column. For example: Gracze = list + the
   selected player's summary; Ligi and Turnieje = a 2-column card grid; Turniej = table and
   players on the left, summary and games on the right; settings and overall ranking centred in
   the area right of the rail.
5. **The live card truncates names to 4-5 letters (Major).** Where: 1-phone-small/awkward-01,
   2-phone/awkward-01, 4-desktop/awkward-01 and awkward-03; the last event "…strze…" in
   1-phone-small/awkward-14. Why: "Teraz w lidze" is the first thing on the league page, and
   "Ostatnio" tells what "Cofnij" will undo. Fix: show first names (or first name + surname
   initial) in the live card and put each team on its own line at full width before the score.
   Let "Ostatnio" wrap to two lines and put the event first: "Gol z obrony: Krzysztof-Maksymilian
   B.".
6. **Metrics and icons without labels (Minor, several screens).** Where: 2-phone/01 (form dots,
   title icons), 03 (potato "3 dni" with no header), 12 ("1551 w obronie" with no Elo), 05
   ("Grali 7"; "00:34 pierwszy gol średnio po"). Fix: a one-line legend under the ranking switch
   ("●○ ostatnie 5 meczów · ikony = tytuły ligi"), column headers in the potato view ("dni
   ziemniakiem"), "Elo w obronie 1551", "7 graczy", "pierwszy gol średnio po 34 s".
7. **Navigation paths overlap, and Statistics has no home tab (Minor).** Where: 2-phone/22, 23
   (title, gear and hamburger), 2-phone/05 and 4-desktop/05 ("Mecze" active on stats), 2-phone/07
   (the "+" next to the yellow "Nowy mecz" inside a tournament). Fix: put settings and "all
   leagues" in the title switcher only and drop the gear. Keep the hamburger for app items
   (language, which player, overall ranking). Keep the tab you came from active on the stats page,
   or move Statistics under Ranking only. Inside a tournament, hide the bar's "+" or make it
   start a tournament game.
8. **The small phone is cramped (Minor x2).** Where: 1-phone-small/01 and awkward-01 (the ranking
   starts at y≈375 of 640), 1-phone-small/25 (the chance board is cut by the sticky button). Fix:
   after the first dismissal, collapse "Którym graczem jesteś?" into a one-line chip (or move it
   into the menu). Merge the live game and the running tournament into one compact "Teraz" row
   below 400 px. Give dialog bodies a bottom padding equal to the sticky footer's height.
9. **Inconsistent page chrome (Minor).** Where: 4-desktop/01 vs 06, 08, 10 (the hamburger jumps
   272 px), 2-phone/07 (kebab + hamburger), 4-desktop/16 and 5-wide/16 (no rail, centred). Fix:
   one header pattern on every page: back or title on the left, page actions in one kebab, the
   app menu at a fixed x (the right edge of the content area, including the right column). Keep
   the rail on the finished game.
10. **Counts that do not add up, and lists that do not fold (Minor).** Where:
    4-desktop/awkward-08 (52 + 15 vs 62 games; 47 + 10), 2-phone/awkward-02 (~90 duet rows).
    Fix: show 1-on-1 games as their own column ("1 na 1") in the Pozycje and Kolory tables, and
    use the same game counts in the Elo tiles. In Duety, show the ranked pairs and fold "Za mało
    meczów razem" behind a "Pokaż N par" toggle.

Also worth fixing (not in the ten): the own-name highlight that looks like a skeleton bar
(2-phone/13, 4-desktop/15), with a fix of `display: inline-block` on the highlighted name or a
bold name with a small yellow dot instead of a bar; the yellow clock (render it in
`--fl-on-board` white so yellow stays for actions); card fill #0b0c0d too close to black
(raise to ~#121416 or add the 1.5 px `--fl-line` inset the look describes); "2–2" breaking
(use a non-breaking en dash or `white-space: nowrap` on the record).

# What I could not judge

- Anything that moves: taps, ripples, the finish panel's countdown and confetti, the first-goal
  hint ("Dotknij drążka…"), scrolling inside dialogs, sheet animations, snackbars and undo.
- The first-run experience: `welcome.*` texts exist in pl.json ("Wyniki piłkarzyków w Twojej
  lidze") but no screenshot shows them, so I judged the newcomer path from the leagues page as
  shot (20-leagues, with two leagues already on the device).
- Phone landscape and the quarter-turn layouts (`.turn-cw` / `.turn-ccw`); goal detail by rod
  and figure on the drawn table (only "Kto strzelił" is shown).
- Tournament formats other than "Otwarty" (no cup bracket, king of the table, draw or round
  robin screens), the series flow, the player picker sheet, add player, delete or archive and
  restore, error, offline and loading states.
- The English UI, keyboard and screen-reader use, focus rings, and real-world legibility of the
  dark palette in a bright office (contrast was computed, not seen on a device).
- The awkward league at 820 and 1920 (no awkward shots at those sizes).
