# Eval round 18 (evaluator A)

Rubric: docs/superpowers/reviews/rubric.md. Scores below are filled in as found.

Shots: S = tour-18/screenshots/tour. 1 = 1-phone-small, 2 = 2-phone, 3 = 3-tablet, 4 = 4-desktop, 5 = 5-wide.

## 1. Visual hierarchy and system: 8.3 (8.25)
- Minor: the leagues list shows a running game as bold white text ("Trwa mecz: ...") instead of the felt/LED "now" look used everywhere else (2/20-leagues).
- Minor: on desktop and wide screens the finished game's result card shrinks to a 400 px block with small LED digits, and the goal list takes over the page, so the result is no longer the main thing (5/16-game-finished, 4/16).
- Minor: in record lists the LED scores (8:0, 3:6) are thin and lighter than the bold Archivo values in the same right column (2/05-league-stats, 2/07-tournament, 2/11-profile Rekordy).
- Nit: the "how it went" bullets (•) look like raw HTML compared with the rest of the UI (2/16, 1/awkward-12).

## 2. Consistency: 7.0
- Minor: on desktop and wide the rail holds league switching ("Na tym urządzeniu") and "Ustawienia ligi", but on phones they live only in the sheet under the league name, which the owner set as their only place (4/*, 5/* vs 2/23-league-switcher).
- Minor: goal-event rows change layout: on the phone the score sits at the right edge, on wide screens it sits next to the time on the left (2/16 vs 5/16).
- Minor: names change by screen: first name only in the ranking, stats, tournament and compare screens ("Anna", "Grzegorz"), full name in the players list and the profile title ("Anna Maria", "Grzegorz Brzęczyszczykiewicz") (1/awkward-01 vs 1/awkward-06, 4/awkward-06).
- Minor: the potato "now" cards are stacked about 1 px apart and touch each other, while every other card list has gaps (2/03-league-potato, 1/awkward-03-potato).
- Minor: the labels of the stat tiles differ: "Elo w obronie (13 meczów 2 na 2)" is small, bold and wraps, while other tiles use regular labels (2/12-profile-stats).
- Nit: the finished game's header has no title, unlike every other subpage (2/16).
- Nit: the arrow of the settings select touches its text ("Od pierwszego meczu▾") (2/10-settings).

## 3. Readability: 7.0
- Minor: at 360 px the live game card truncates players: "Małgorz… & Grzeg…" (1/awkward-01, -02, -03, -13).
- Minor: at 360 px the rotated names along the table are cut: "Krzys…", "Grzeg…", "Małgo…" (1/awkward-14-game-running).
- Minor: the players list truncates long names even on a 1280 px desktop where there is room ("Krzysztof-Maksymilian Brzęczyszczyki…", 4/awkward-06-players; two names on 1/2 awkward-06).
- Minor: Polish line breaks: a single-letter word left at the end of a line ("Turniej o" in 1/awkward-11 and 1/awkward-10), "wygrane –" breaking before " porażki" with a stray indent (1/awkward-07-profile), and a date split as "24 wrz / 2026" (1/awkward-05-stats).
- Minor: short names used as links have tiny tap areas: "Xi" 13x39, "Bo" 18x39 (json for 1/2/4 awkward-05-stats and awkward-10).
- Nit: "4 min 0 s" (1/awkward-05-stats).
- Nit: vertical names on the table's sides are slow to read (2/27, 3/27).

## 4. Information architecture and flow: 8.5
- Minor: on phones "Teraz w lidze" is a horizontal carousel whose second card (the tournament or the paused game) peeks only as an icon, so "Otwórz" and the paused game are effectively hidden (2/01-league-ranking, 1/awkward-01, against 3/01 where they stack).
- Minor: on the game screen, "Zamień" with two arrow buttons in team colours does not say what gets swapped (positions within a team) (2/27-game-running, 4/27, 1/awkward-14).
- Nit: two ways to start a tournament on the tournaments tab, the tonal "Nowy turniej" and the yellow "+" (2/06-tournaments).
- Nit: "Którym graczem jesteś?" is shown as a page card and also as a menu or rail item at the same time (2/22-app-menu, 4/01).

## 5. Responsiveness: 6.5
- MAJOR: at 1280x800 with two leagues on the device, the rail overflows: the section labels "Na tym urządzeniu" and "Wyjazd w góry" are clipped under the items, and "Nowa rozgrywka" is squashed to 26 px (4/19-empty-league, 23, 24, 25, 26, 27, 28; json small "232x26 addNowa rozgrywka"; 5/19 at 1080 px tall is fine).
- MAJOR: at 360 px the game header overflows: the round background of the menu button is cut by the right edge, there is no gutter, and the clock touches the "Zapis: strzelec" pill. This is the most used screen (1/27-game-running, 1/awkward-14).
- Minor: on desktop and wide the profile is one stretched column: the three stats spread over about 1000 px, the Elo chart is flat and stretched, and the record tiles are 490 px wide with little in them (4/11-profile).
- Minor: on wide screens the finished game's goal rows are about 700 px wide with their content in the left 200 px (5/16-game-finished).
- Minor: the desktop stats grid has holes: "W liczbach" is a 3-column grid with an empty cell, and the "Czas goli" tiles fill 2/3 of the width (4/05-league-stats).

## 6. Robustness to real data: 7.3 (7.25)
- MAJOR: the rail cannot hold more than one league at 800 px tall (same evidence as in Responsiveness); a realistic user with 3 or 4 leagues gets worse overlap.
- Minor: long names are truncated in three places at 360 px or on desktop: the live card, the table's sides and the players list (see Readability).
- Minor: narrow tap targets for short names ("Xi", "Bo") (awkward-05 json).
- Minor: a 62-character league name turns the league sheet's header into 5 lines, which pushes its actions down (1/awkward-13-league-menu).
- Nit: "4 min 0 s".

## Overall
Overall (lowest) = 6.5 (Responsiveness). Mean = 44.5 / 6 = 7.4.
Could not judge: hover and focus states, motion, landscape phones, the English texts, content hidden under the fixed bottom bar in full-page shots.
