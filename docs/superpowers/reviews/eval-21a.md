# Eval round 21 (evaluator A)

Scored by rubric.md (deductions from 10). Paths relative to tour-21/screenshots/tour/.
No blockers, no majors found. Contrast checked from tokens/pixels: ink-2 on cards 6.1-6.9:1,
team text on board 6.2-6.4:1, white on "Trwa" red 4.62:1, felt hero text 5.7:1 (all pass).

## 1. Hierarchy and system: 8.25
- Minor: new-game lineup card draws a vertical "halfway line" between columns while teams are rows (red top, blue bottom), so the table metaphor reads the wrong way. 25-new-game (all sizes).
- Minor: "Statystyki ligi" on the games tab is a pill of the same shape and fill as the filter segment right above it; reads as a fourth filter, not a link. 2-phone/04-games, awkward-04-games.
- Minor: compare page "Zmień" is bare bold text with no button affordance. 15-compare, awkward-09-compare.
- Nit: game timeline uses default HTML bullets; event times are Archivo while the score next to them is LED. 16-game-finished.

## 2. Consistency: 6.75
- Minor: scores rendered in LED digits in some rows and Archivo in others of the same list ("8:0", "8:6" LED vs "z 3:6 na 8:6" Archivo; stat tiles all Archivo). 05-league-stats, 07-tournament, 11-profile.
- Minor: settings use an old Material outlined select with caret and an outlined text field; the rest of the app uses pills/segments/cards. 10-settings.
- Minor: two adjacent tables on profile stats put their columns at different x (Obrona/Atak vs Czerwoni/Niebiescy). 2-phone/12-profile-stats.
- Minor: desktop/wide rail lists "Ustawienia ligi" and "Ligi", which on phone/tablet live only in the league sheet; the overall profile's rail drops "Którym graczem jesteś?". 4-desktop/01, 5-wide/18-overall-profile.
- Minor: game panel on desktop/wide: "Cofnij"/"Samobój" full width, the two swap buttons half width and left-aligned under a centred label. 4-desktop/27, 5-wide/27, awkward-14.
- Nit: leagues list: a league with a running game swaps its grey "n graczy · n meczów" line for bold white text. 2-phone/20-leagues.
- Nit: profile-stats Elo tiles use bold 2-line labels with parentheses, other tiles regular labels. 12-profile-stats.
- Nit: potato view drops place numbers and indents "Pozostali" to a different left edge than the other ranking views. 03-league-potato.

## 3. Readability: 7.0
- Minor: player names cut at 360 px in the "Teraz w lidze" card ("Małgorz… & Grzeg…") and on the game rails ("Krzys…", "Grzeg…", "Małg…"). 1-phone-small/awkward-01, awkward-14.
- Minor: long names cut in headers: game subtitle "Międzynar…", tournament title cut after 2 lines, league title "Działu…". awkward-12, awkward-10, awkward-01 (phone-small, desktop).
- Minor: line breaks: duet names leave "&" hanging at a line end ("Krzysztof &" / "Grzegorz"); "wygrane – / porażki" wraps with an indent. awkward-02-duets, awkward-07-profile.
- Minor: ranking segment at 360 px: "Ziemniak" touches the pill's right edge. 1-phone-small/01, awkward-02.
- Minor: profile stats "Strzelone 3,1 / 2,4" without the "na mecz" unit (the tiles above say "2,8 na mecz"). 12-profile-stats.
- Nit: form dots (6-8 px, colour plus fill) are tiny for meaning-carrying icons. 01 desktop, 11-profile.

## 4. IA and flow: 7.75
- Minor: compare: "Wspólne mecze" mixes games as teammates and as rivals, and the W/P badge and Elo delta belong to the first player only, which nothing says. awkward-09-compare.
- Minor: new game at 360x640: the goal detail/screen options (and "Anuluj") sit below the pinned summary with no scroll cue. 1-phone-small/25 vs 2-phone/25.
- Minor: game header at 360 px: the goal-detail chip shrinks to icon + chevron with no label. 1-phone-small/awkward-14.
- Minor: phone "Teraz w lidze": the second card (tournament or paused game) shows only an icon at the screen edge; name cut. 1-phone-small/01, 2-phone/01, awkward-01.
- Nit: new-game dialog has both an X and an "Anuluj" button. 25-new-game JSON.

## 5. Responsive: 7.25
- Minor: wide/desktop profile: small avatar, three stats spread across 1100 px, full-width segment. 5-wide/11, 5-wide/18.
- Minor: desktop game-finished: short hero card on the left with a big empty area under it, events run long on the right. 4-desktop/16, 5-wide/16.
- Minor: tablet game screen: portrait table about half the width, 13 px controls and hint, small team labels. 3-tablet/27, 3-tablet/16.
- Minor: desktop games list in two masonry columns: dates run down the left column and then start again on the right. 4-desktop/04, 5-wide/04.
- Minor: 1280x800 rail with two leagues: the language switch is cut at the bottom edge (the rail scrolls, but nothing shows it). 4-desktop/19, 4-desktop/23.
- Nit: desktop stats "W liczbach" grid leaves an empty slot. 4-desktop/05.

## 6. Real data: 7.5
- Minor: long names cut in the now card and on the rails. awkward-01, awkward-14 (phone-small).
- Minor: the 62-character league name is cut in page headers and the game subtitle. awkward-12, awkward-10.
- Minor: the league sheet title wraps to 5 lines of about 28 px, pushing its actions down. 1-phone-small/awkward-13.
- Minor: compare game row: a long tournament name pushes the Elo delta onto its own orphan line. awkward-09-compare.
- Nit: duet "&" orphan. awkward-02.
- Nit: "wygrane – porażki" wraps with an indent. awkward-07.
Handled well: shared places (5, 5, 7), 15:13, paused/running, 0-game league, players under the games threshold.

## Overall
Overall (lowest): 6.75 (Consistency). Mean: 7.42.
