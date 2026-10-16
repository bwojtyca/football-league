# Independent design evaluation (eval5)

Evaluator: fresh agent, no prior knowledge of the app. Material: eval5 screenshots + .json audits, src/, pl.json, CLAUDE.md (principles + look only), rubric.md.

## Working notes (appended per screen group)

### Contrast ratios computed from src/styles.scss (WCAG relative luminance)

| Pair                                                              | Ratio                     | Verdict                                     |
| ----------------------------------------------------------------- | ------------------------- | ------------------------------------------- |
| --fl-ink #f2f4f0 on --fl-paper #000                               | 18.97                     | pass                                        |
| ink on --fl-card #16181b / --fl-card-2 #202328                    | 16.07 / 14.24             | pass                                        |
| --fl-ink-2 #9aa39d on paper / card / card-2 / sheet #121416       | 8.10 / 6.86 / 6.08 / 7.12 | pass                                        |
| --fl-on-ball #1b1410 on --fl-ball #ffc629                         | 11.58                     | pass                                        |
| white on felt #0d5a31 / felt centre #157a42                       | 8.32 / 5.39               | pass                                        |
| ink-2 on felt #0d5a31                                             | 3.21                      | FAIL for body text (used anywhere on felt?) |
| --fl-red-text #ff5a4e on paper / card                             | 6.82 / 5.78               | pass                                        |
| --fl-blue-text #5c8cff on paper / card                            | 6.65 / 5.63               | pass                                        |
| white on --fl-red #d0433a ("Trwa" pill)                           | 4.62                      | pass (barely)                               |
| white on --fl-blue #3a64d6                                        | 5.28                      | pass                                        |
| --fl-win #5be394 / --fl-loss #ff8a80 on card                      | 10.89 / 7.79              | pass                                        |
| --fl-series-1 #3987e5 / --fl-series-2 #d95926 on card             | 4.89 / 4.58               | pass (graphics need 3:1)                    |
| --fl-line-2 #4a4f4b (outlines, black swatch ring) on paper / card | 2.51 / 2.13               | below 3:1 for UI component boundaries       |
| --fl-line #232623 dividers                                        | 1.37                      | decorative only                             |
| switch idle text #b9c2bc on card-2                                | 8.63                      | pass                                        |

Token palette itself is solid; problems come from opacity tricks and specific components (see below).

### Phone (412) - league pages

- 01 ranking: clear structure (who-are-you prompt, live game, tournament, switch, rows). LED Elo, gold #1. Two header icons (gear = league settings, hamburger = app menu) side by side; legend for dots/title icons sits _below_ the list (after 7+ rows) - a newcomer meets 8 unexplained icons before the legend.
- 02 duets: fold summary "Za mało meczów razem (mniej niż 3), bez miejsca (7)" wraps and the chevron drops alone to its own line.
- 03 potato: kickers "Ziemniaki teraz"/"Pozostali" at x=20 while content is at x=16 (audit lefts 20:2). Rules folded ("Zasady") - the concept is unexplained by default.
- 04 games: a row shown highlighted is the hover state (game-list.component.css .game:hover) - tour artefact, not counted. Time under score ("01:58") has no label; on a sports list "01:58" reads as duration as easily as time of day. "Statystyki ligi" card at top duplicates the ranking-page link.
- 05 league stats: chip jump bar cut with fade (fine). Weekday x hour heat map with only one active hour: one column header "1", day labels take the left half, a single wide column on the right - looks broken/odd with real (narrow) data. Record links ("Darek & Bartek - Celina & Ala") are 15 px tall tap targets (audit small x18). Tiles use Archivo for big numbers while the ranking/players use LED digits for the same kind of number.
- 06 tournaments: one card, rest of screen empty; fine. "Nowy turniej" is a tonal pill at the top, not the yellow ball (yellow + is in the bar).
- 07 tournament: yellow "Nowy mecz" + tonal "Rewanż" top-right, bar "+" goes quiet - consistent. Four identical "Wypisz" (sign out) actions with icons dominate the "W grze" list. Table header small grey.
- 08 players: page has its own heading "Gracze 7" + hint, while Ranking/Games/Tournaments tabs have none - inconsistent tab page headers.
- 10 settings: name field hint "Zapisuje się po wyjściu z pola." rendered in Material's letter-spaced ink style, unlike every other grey hint. Toggle 52x32 (audit small).

### Phone (412) - profile, compare, game details, app-level, dialogs

- 11 profile: card with avatar, "Biuro 2026 · profil ogólny" (the underlined "profil ogólny" is a link to the all-leagues profile; as a label it reads like a description, not a switch). Title chips row cut by a fade ("Maratończyk" clipped). Elo "1520" here is Archivo, while the same number is LED on ranking/players (11-profile vs 01-league-ranking, 08-players).
- 12 profile stats: first two tiles ("Elo w obronie (13 meczów 2 na 2)") use bold labels, the rest regular; some tiles put a sub-value between number and label ("64 / 2,8 na mecz / Strzelone") so the label reads last. Table row labels mix case ("mecze", "wygranych" vs "Strzelone", "Samobóje"). "Gole w częściach meczu" is an h2 here but a small grey kicker in league stats (05). Partner/rival links are 17 px tall (audit small x12), rows ~28 px.
- 13 profile games: W/P badges + Elo change, "you" chip - clear.
- 14 kit editor: full-screen dialog, title at x=24 (pages at 16). Black swatch ring #4a4f4b = 2.13:1 on #16181b card (below 3:1 for a control boundary). Clear yellow "Zapisz koszulkę".
- 15 compare: player colours blue (Ala) / orange (Bartek) right next to red/blue team-coloured LED scores in "Wspólne mecze" - blue means "Ala" in one block and "blue team" in the next. "Zmień" only under the second player.
- 16 game finished: felt card with LED score, Elo deltas, chart, highlights, event log. Yellow "Rewanż" in the top bar. Date and time run together ("15 października 2026 01:58").
- 17 overall ranking / 18 overall profile: consistent with league versions. First row highlighted = hover artefact.
- 19 empty league: good empty state with yellow "Zacznij mecz"; bar "+" goes quiet.
- 20 leagues: clear intro sentence, search, "Na tym urządzeniu", yellow "Nowa liga". The live game appears only as a bold text line ("Trwa mecz: ... vs ..., 2:3"), no live dot/LED like elsewhere; "vs" in Polish UI.
- 21 new league: crest placeholder is a black square with "?", which reads like a help button. Hint in Material letter-spaced style again.
- 22 app menu: language, who-are-you, overall ranking. Sheet content at x=20 vs page 16.
- 23 league switcher: current league has a crest, other leagues in "Zmień ligę" do not (crest on the leagues page and rail) - inconsistent list item.
- 24 new play: "Co gramy?" - Mecz highlighted with a yellow icon, Seria, Turniej; cards. 26 new tournament lists formats as plain rows without cards - same kind of choice list, two looks.
- 25 new game: felt 2x2 lineup, rules chips, toggles, LED summary with win chance, yellow "Zacznij mecz". Player cells give no hint that they can be tapped to change a player. Toggles 52x32 (audit). 3 taps to start (+ > Mecz > Zacznij mecz) - meets the owner's rule.
- 27 game running: header crowded with 6 controls (back, rotate, "Gol: kto strzelił" mode pill, LED clock, pause, menu). "Gol: kto strzelił" looks like an action ("record a goal") but is a setting for the goal detail. The instruction how to score ("gol: dotknij drążka strzelca") is buried in the small grey "Ostatnio" line at the bottom, glued to the last-event label. Swap-positions controls are bare red/blue dots next to a two-line label.
- 28 paused: clear overlay (Pauza, LED score, yellow "Wznów", "Wyjdź, dokończę później", red "Usuń mecz"). Header still shows a separate play button, two resume controls on screen.

### Phone (412) - awkward league

- a01 ranking: long league name wraps to 2 lines then ellipsis (ok). "Ty" card good. Names cut ("Grzegorz Brzęczy…", "Krzysztof-…" with "Ty" chip). **Title icons vanish for long names**: `.line` in ranking.component.scss is `flex-wrap: wrap; max-height: 1.4em; overflow: hidden`, so icons wrap onto a hidden second line. The leader (Grzegorz, 1595) shows no star; Krzysztof-Maksymilian holds Weteran, Maratończyk, Król powrotów, Zgrany duet (05 stats) and shows none; Tomasz Ołdakowski is a potato (05 stats) without the icon. The legend under the list names 10 titles, most of which appear on no row.
- a02 duets: first names only (consistent with live card), fine. Fold chevron orphaned again.
- a03 potato: fine.
- a04 games: 41 truncated names (audit). Columns are ~140 px so even "Tomasz Ołdakowski" becomes "Tomasz Ołdak…"; live card/duets use first names, games list uses full names cut mid-surname - two naming rules.
- a05 stats: chip row overflow is an inner horizontal scroller (lefts up to 898 are chips), page itself does not scroll sideways. Records wrap long names over 3 lines, readable. Heat map again a single column headed "0".
- a06 players: fine; players without games say "jeszcze bez meczów".
- a07 profile: name wraps in header (ok); "Ty" is a small light pill next to the bigger "Koszulka" button (different heights, looks like a selected toggle).
- a08 profile stats: partner names cut with ellipsis in tables (acceptable).
- a09 compare: header name cut "Krzysztof-Ma…", full name in body - fine.
- a10 tournament: **goals column breaks numbers across lines**: "19–" / "8", "23–" / "16", "13–" / "9", "8–" / "19" (even for short names like Kasia, because a long name widens the name column). A score split over two lines reads as two numbers. Four identical "Wypisz" buttons x8.
- a11 tournaments: long name wraps - fine.
- a12 game finished: names wrap/cut ("Grzegorz Brzęczyszczyki..") inside the felt card - acceptable; uses ".." (two dots) as ellipsis? (looks like a text cut, not "…").
- a13 league menu (switcher, one league): "Zmień ligę" heading followed by nothing but "Wszystkie ligi" - an empty section heading.
- a14 game running: works; last event wraps the full long name - fine.

### Small phone (360)

- 01 ranking: form dots dropped (good adaptation). Ala shows 1 title icon at 360 vs 2 icons + "+2" at 412: titles silently disappear as width shrinks (same `.line` overflow bug; the "+N" count is hidden too).
- 27/28/a14 game running: **score boards cut every name to an initial**: "B..", "G.", "A", "D...", "K..", "Ż", "M.", "G" (audit truncated: Ala, Bartek, Darek, Gosia). The board is only ~225 px wide in a 360 px screen. Two "G" players in the awkward game. Header pill shortens to "kto strzelił" and touches the LED clock (no gap); "Zamień pozycje" becomes "Zamień" next to two dots (swap what?).
- 25 new game: "Zamień drużyny" becomes an unlabeled ⇅ icon; win-chance summary panel is clipped by the sticky "Zacznij mecz" at first view.
- a04 games: names cut to ~10 chars ("Krzysztof-…", "Żaneta Ślę…").
- 05 stats, 11 profile, 20 leagues: hold together; profile stats labels wrap ("wygrane – / porażki").

### Code-level checks

- Small text: labels at 0.75rem (12 px) are used for the game screen's only scoring instruction (`.bar .text small` in game-detail.component.scss: "gol: dotknij drążka strzelca"), the rail name plates (`.vertical .plate` in table.component.ts) and the swap label (`.swaps span`). 12 px is allowed for secondary metadata, but here it carries the core how-to and player identity.
- New-game cells: #ff9a92 on red cell (#372c1c..#393621) 5.97-6.68; #9db8ff on blue cell 5.77-6.63 - pass.
- Avatar initials (size*0.44 = 15.8 px bold at 36 px): white on #a77a0e 3.87, on #c4581d 4.41, on #6b7d1f 4.59 - two avatar colours fail 4.5:1 (name always next to it, so a nit).
- Potato row text #f3dfb5 on #3b2f1b 9.97 - pass.
- Provisional rating at opacity .45: #6d6e6c on black 4.10 (LED digits >= 24 px, so passes as large text).

**Correction to earlier notes:** ranking/players Elo numbers are Archivo 800 (`.rating b` in ranking.component.scss), not LED. Big numbers are Archivo everywhere outside scores/clocks, so the "LED vs Archivo" remarks above for 05/11 are withdrawn.

### Tablet (820)

- 01 ranking: 720 px column, extra "mecze / wygranych" columns appear - good use of width. 04 games: narrow centred stack inside the column, fine. 05 stats: 4-wide tiles, heat map single column. 11 profile, 27 game running: hold together (portrait table, header spread with clock alone in the centre). No defects beyond those seen on phones.

### Desktop (1280)

- Rail (brand "Football League / Liga piłkarzyków" in English, device leagues, all leagues, league tabs, yellow "Nowa rozgrywka"). Rail content changes by page: "Ranking ogólny" appears on leagues/game pages (20, 16) but not on league pages (01); the new-play button is absent on the game page.
- 01-03 ranking views: two columns (list + cards) - good. 04 games: list in CSS columns, read column by column, columns unbalanced (left ends ~1940 px, right ~1750 px).
- 05 stats (1280): one stretched column 992 px wide; title/record label and value ~700 px apart; tiles leave a ragged second row (5 + 2). Two columns only from 1400 px (5-wide/05 is fine).
- 06 tournaments: single card, rest empty (data-driven, not counted).
- 07 tournament: **section split by CSS columns**: "Podsumowanie" heading + tiles at the bottom of the left column, its records ("Najlepszy strzelec"...) at the top of the right column without a heading. Same on 5-wide/07. In awkward-10 the split falls elsewhere - the layout depends on content length.
- 08 players: 2-column grid; right column's first row has an extra top border (`.players li + li` in league-players.component.ts).
- 10 settings: two columns, fine. 11/12 profile: profile stats tables stretched (name at x=245, value at x=1118).
- 14 kit, 21 new league, 25 new game: centred dialogs with X - good. 22/23/24: sheets become centred modals with no close control.
- 19 empty league: card centred at x=408 while every league page aligns to x=272 (lefts 408/426).
- 20 leagues: yellow "Nowa liga" stretched to 992 px.
- 26 new tournament: dialog cuts off after "Każdy z każdym"; "Puchar" is below the fold with no scroll cue.
- 27/28 game: landscape layout, table + panel; works. Score panel shows team names only.
- awkward-01: leader star visible here (wider), but Krzysztof-Maksymilian (4 titles) still shows none; legend lists Weteran/Maratończyk that no row shows.
- awkward-04: 36 truncated names even in the 2-column desktop list.
- awkward-06 players: "Ty" chip sits inside the ellipsised name, so only a white sliver shows after "Brzęczyszczykiewic…" (chip is inside `<b>` with overflow hidden).
- awkward-10 tournament: goals column breaks again at 1280: "23–/16", "15–/13", "21–/20", "11–/13", "22–/26".
- awkward-12/14: fine.

### Wide (1920)

- Page column 1120 px centred beside the rail; ranking, stats (2 columns), profile (2 columns) use the width well.
- 27 game running: 1500 px table, the side panel's score digits ~70 px and tiny header icons - the score (main information) is small for the screen.
- 07 tournament: same orphaned "Podsumowanie" split. 20 leagues: yellow bar 1120 px wide.

---

## Final report (rubric format)

Screens are cited by size folder and file name: `P` = 2-phone, `S` = 1-phone-small, `T` = 3-tablet, `D` = 4-desktop, `W` = 5-wide; `a` = awkward-.

### 1. Scores

| Dimension                         | Score          | Deductions (severity, problem, files)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual hierarchy and system       | **7.3** (7.25) | Minor: eight identical "Wypisz" buttons with icons outweigh the tournament table (P/07, P/a10, D/07). Minor: blue means "Ala" in compare and "blue team" in the LED scores right below (P/15, D/15). Minor: Games tab opens with a stats card above the filter and the games (P/04, T/04, D/04). Minor: game screen header crammed with 6 controls; at 360 the mode pill touches the clock (P/27, S/27). Nits: English brand "Football League" in a Polish UI (all D/W); two resume controls while paused (P/28, D/28); live game on the leagues page is a bold sentence, not the live dot/LED used elsewhere (P/20, D/20).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Consistency                       | **5.5**        | Minor: only the Players tab has a page heading and hint; Ranking/Games/Tournaments have none (P/08 vs P/04, P/06). Minor: stats building blocks vary - bold vs regular tile labels, label after sub-value, "Gole w częściach meczu" as h2 vs kicker, "mecze/wygranych" vs "Strzelone/Samobóje" (P/12 vs P/05). Minor: choice lists in two looks (cards in "Co gramy?", plain rows in "Nowy turniej"; other leagues without crests in the switcher) (P/24, P/26, P/23). Minor: dialogs have a close X, sheets have none - also on desktop where sheets become centred modals (P/22-24, D/22-24 vs D/14, D/25). Minor: desktop rail changes content by page ("Ranking ogólny", new-play button) (D/01 vs D/16, D/20). Minor: two naming rules - first names (live card, duets, chips) vs full names cut mid-surname (games list) (P/a01, P/a02, P/a04). Minor: desktop empty-league card centred at x=408 while all league pages align at 272 (D/19). Nits (capped at 1): dialog content at x=24 vs pages at 16 (P/14, P/25); Material's letter-spaced field hints (P/10, P/21); "Ty" pill smaller than the buttons beside it (P/a07); extra top border on the right players column (D/08); fold chevron dropped to its own line (P/02, P/a02). |
| Readability                       | **6.3** (6.25) | Major: tournament table splits goal scores over two lines ("19–" / "8", "23–" / "16") (P/a10, D/a10). Major: at 360 px the game scoreboards cut every name to an initial ("B..", "G.", "A", "D...", two "G"s) (S/27, S/28, S/a14; audit truncated: Ala, Bartek, Darek, Gosia). Minor: games list cuts full names to ~10-14 chars on phones and even on desktop (P/a04: 41 cuts, D/a04: 36, S/a04). Minor: the only scoring instruction and the rail name plates are 12 px (`.bar .text small`, `.vertical .plate`) (P/27, T/27). Minor: unlabeled clock times read like durations ("01:58" under scores; "15 października 2026 01:58" with no separator) (P/04, P/16). Nit: white initials on two avatar colours fail 4.5:1 (#a77a0e 3.87, #c4581d 4.41) (P/01 "FI"-type avatars, avatar.component.ts).                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Information architecture and flow | **5.0**        | Major: the game screen has no clear first step - "how to score" is a 12 px grey fragment glued to the "Ostatnio" label, while the header pill "Gol: kto strzelił" looks like the action but is a setting (P/27, S/27, T/27, D/27). Minor: gear (league settings) next to hamburger (language, who-am-I, overall ranking) - users must guess which holds what (P/01, P/22). Minor: the legend for 10 title icons and the form dots comes after the whole list; potato rules are folded (P/01, P/a01, P/03). Minor: "Seria" is both a play type and a tournament format (P/24, P/26). Minor: on desktop the "Puchar" format is below the dialog's fold with no scroll cue (D/26). Minor: "Biuro 2026 · profil ogólny" - the underlined link reads as a label, not a switch (P/11, D/11). Minor: new-game player cells give no hint that tapping changes a player (P/25, D/25). Minor: partner/rival/record links are 15-17 px tall standalone targets (audits P/05 x18, P/12 x12, P/a08 x24). Nits: "Zmień ligę" heading with no leagues under it (P/a13, D/a13); "vs" in Polish copy (P/20).                                                                                                                                                   |
| Responsiveness                    | **6.3** (6.25) | Major: CSS columns tear sections apart - tournament "Podsumowanie" heading + tiles bottom-left, its records top-right without a heading; game list read column by column with unbalanced columns (D/07, W/07, D/04). Major: 360 px game screen - scoreboards ~225 px wide with empty margins, names cut to initials, mode pill touching the clock (S/27, S/28, S/a14). Minor: at 1280 stats/profile stats/compare are one stretched column - label and value ~700 px apart, ragged tile rows (D/05, D/12, D/15). Minor: wide game screen - score digits ~70 px and tiny header icons next to a 1500 px table (W/27, D/27). Minor: "Nowa liga" stretched into a 992/1120 px yellow bar (D/20, W/20). Nit: 360 px new game - "Zamień drużyny" becomes an unlabeled icon and the win-chance panel is clipped behind the sticky CTA (S/25).                                                                                                                                                                                                                                                                                                                                                                                                       |
| Robustness to real data           | **6.8** (6.75) | Major: title icons vanish when a name is long or the row narrows (`.line { flex-wrap: wrap; max-height: 1.4em; overflow: hidden }`): leader star missing for Grzegorz on phones, Krzysztof-Maksymilian's 4 titles never shown at any size, potato Tomasz without the icon, Ala loses icons and "+2" at 360; the legend names titles no row shows (P/a01, S/a01, S/01, D/a01 vs P/a05). Major: goal scores wrap in the tournament table once a long name widens the name column (P/a10, D/a10). Minor: "Ty" chip sits inside the ellipsised name - a white sliver after "…" on desktop, hidden on phones (D/a06, P/a06). Minor: weekday x hour heat map with one active hour renders a single column headed "1"/"0" with labels taking half the width (P/05, P/a05, D/05, W/05). Nit: live card cuts mid-pair "Małgor… & Grzegorz" at 360 (S/a01).                                                                                                                                                                                                                                                                                                                                                                                             |

**Overall: 5.0** (lowest dimension: Information architecture and flow). **Mean: 6.2** (7.25 + 5.5 + 6.25 + 5.0 + 6.25 + 6.75 = 37.0 / 6 = 6.17).

### 2. The ten most important problems

1. **No clear first step on the game screen** (Major, IA). P/27, S/27, T/27, D/27. The instruction "gol: dotknij drążka strzelca" is 12 px grey (`.bar .text small` in game-detail.component.scss) inside the "Ostatnio · …" line, while the header pill "Gol: kto strzelił" looks like a "record goal" button but is the goal-detail setting. This is the app's core interaction, used standing at the table. Fix: before the first goal, show a short instruction over or under the table at 16 px+ ("Dotknij drążka, z którego padł gol"), then hide it; keep "Ostatnio" only for the last event. Turn the pill into a labelled setting ("Zapis: kto strzelił ▾") or move it into the ⋮ menu / new-game "Ekran i zapis goli".
2. **Title icons silently disappear** (Major, Robustness). P/a01, S/a01, S/01, D/a01. `.line` in ranking.component.scss wraps icons onto a hidden second line. The leader, the potato and Krzysztof-Maksymilian's four titles (Weteran, Maratończyk, Król powrotów, Zgrany duet) are invisible, while the legend under the list names them. Fix: stop wrapping: `flex-wrap: nowrap`, name `<b>` gets `flex: 0 1 auto; min-width: 0` with ellipsis, icons `flex: none`; if space runs out show at most one icon plus "+N". Never let the name push icons out.
3. **Goal scores break over two lines in the tournament table** (Major, Readability + Robustness). P/a10, D/a10. "19–8" shows as "19–" over "8". Fix: `white-space: nowrap` and tabular numerals on the goals cell, a fixed or min width for numeric columns, and let the name column wrap or ellipsise instead.
4. **CSS columns tear sections apart on desktop and wide** (Major, Responsiveness). D/07, W/07, D/04. "Podsumowanie" heading and tiles end the left column, its records start the right column without a heading; the games list reads down then up and the columns are unbalanced. Fix: replace `columns: 2` with an explicit two-column grid that places whole sections (table + players left; summary + games right), keep `break-inside: avoid` on whole sections including their headings, and lay the games list out as a 2-column grid in reading order (or one column).
5. **360 px scoreboards cut names to an initial** (Major, Readability + Responsiveness). S/27, S/28, S/a14. "B..", "G.", "A", two "G"s while ~70 px each side is empty. Fix: let the boards span the full width (the rails already do), drop the avatars below 380 px, or stack the two names; use first names only (the rails show the same names).
6. **Desktop stats as one stretched column** (Minor, Responsiveness). D/05, D/12, D/15. Label and value ~700 px apart, ragged tiles. Fix: switch to the two-column stats layout from 1000 px (it already exists from 1400 px), or cap record/table rows at ~640 px.
7. **Inconsistent overlay and page patterns** (Minor, Consistency). P/22-24 and D/22-24 (sheets without close while dialogs have one), P/08 vs P/04/P/06 (only Players has a page heading), D/19 (empty card at x=408), D/01 vs D/16/D/20 (rail changes content). Fix: give centred desktop sheets the same close disc as dialogs; give each tab the same header treatment (all with a heading or none); align the empty state at the page's left edge; keep the rail identical on every page (always "Ranking ogólny", always the new-play button, quiet when the page has its own CTA).
8. **Two naming rules and heavy truncation in lists** (Minor, Readability/Consistency). P/a04, D/a04, S/a04 vs P/a01/P/a02. Fix: in the games list (and finished-game card), use first name + surname initial ("Krzysztof-M. B.") or first names, as the live card and duets do; put the full name in the title attribute and on the game page.
9. **Gear vs hamburger and other IA ambiguities** (Minor, IA). P/01, P/22, P/11, P/24 vs P/26, D/26. Fix: merge the app menu into one entry (e.g. ⋮ with "Ustawienia ligi", "Język", "Którym graczem jesteś?", "Ranking ogólny"), rename "profil ogólny" to "Pokaż ze wszystkich lig", keep "Seria" in one place (the "Co gramy?" sheet) and make sure every format in the tournament dialog is visible or visibly scrollable.
10. **Unlabeled and unexplained numbers and icons** (Minor, Readability/IA). P/04, P/16, P/01, P/05. "01:58" under a score reads as a duration; the icon/dot legend sits below a long list; the heat map with one active hour shows a single column headed "1". Fix: prefix times ("o 01:58") and use "15 października 2026, 01:58"; move the legend into the "?" sheet next to the switch (or show it before the list); when fewer than ~3 hours have games, replace the heat map with one sentence ("Gracie zwykle w poniedziałki o 1:00").

### 3. Overall

- **Overall score (lowest dimension): 5.0** - information architecture and flow.
- **Mean: 6.2.**
- What works: a coherent dark "table at night" look; token contrast is strong (ink 18.97:1, ink-2 8.10/6.86/6.08:1, ball 11.58:1, team text 5.6-6.8:1); one yellow primary per screen, consistently applied (bar "+" goes quiet when a page has its own CTA); starting a game takes 3 taps (+, Mecz, Zacznij mecz); good empty state and "Ty" card; no horizontal page scroll anywhere (wide lefts in a05 are inner chip scrollers).

### 4. What I could not judge

- Interaction and motion: tapping rods/figures, the hit zones' real size, swipe-to-dismiss of sheets, focus order, keyboard use, screen-reader labels, the finish panel's countdown and confetti (no screenshot of a just-decided game), toasts/undo snackbars, the ranking "?" help sheet, the player picker, the who-am-I sheet, the add-player dialog.
- Landscape phone and the quarter-turn layouts (`.turn-cw` / `.turn-ccw`), rod/figure goal detail modes, timed-game clock behaviour, series flow, cup brackets (no cup tournament in the tour).
- Real tap-target sizes of Material toggles (audit reports 52x32 for the element; the label may extend the target).
- English UI; the light theme (not offered).
- Whether the highlighted rows in P/04, T/04 and P/17 are only hover states - the code says `.game:hover` / row hover, so I did not count them.
