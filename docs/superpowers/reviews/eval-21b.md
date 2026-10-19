# Eval round 21 (b) — independent evaluator

Rubric: docs/superpowers/reviews/rubric.md. Inputs: tour-21 screenshots.

## Scores
| Dimension | Score |
|---|---|
| Hierarchy | 8.3 |
| Consistency | 7.3 |
| Readability | 8.0 |
| IA and flow | 7.8 |
| Responsive | 7.8 |
| Real data | 8.8 |
Overall (min) 7.3, mean 8.0.

## Hierarchy (8.3)
- Minor: timeline summary uses plain HTML disc bullets, outside the type system (16-game-finished, awkward-12, all sizes).
- Minor: on Ligi the live-game subtitle of "Biuro 2026" is bold white and wraps 2 lines, louder than the league name (20-leagues phone/wide).
- Minor: "Statystyki ligi" pill sits alone on its own row under the filter tabs, looking like a fourth filter (04-games phone, awkward-04).
- Nit: Obrona/Atak bar is white vs grey, giving arbitrary emphasis to defence (05-league-stats).

## Consistency (7.3)
- Minor: scores in records mix LED and Archivo: "Najwyższa wygrana 8:0" in LED, "Największy powrót z 3:6 na 8:6" in Archivo (05-league-stats all sizes, awkward-05).
- Minor: single-choice selectors in two styles: segmented pill group (ranking, games, profile tabs) vs separate chips (Do 5/8/10 in 25-new-game; stats anchor chips).
- Minor: stat-tile labels bold in "Elo w obronie (13 meczów 2 na 2)" vs regular elsewhere (12-profile-stats).
- Minor: landscape game panel puts back/pause/menu mid-height in the side panel, not top-left as everywhere else (4-desktop/27,28; 5-wide/27,28).
- Minor: "Ty" static pill sits where "To ja" button sits, same shape family, reads as a button (awkward-07-profile vs 11-profile).
- Nit: many left edges on stats pages (15-25 in lefts audit of 05-league-stats, awkward-05).

## Readability (8.0)
- Minor: live card truncates names "Małgorz… & Grzeg…" at 360 px (1-phone-small/awkward-01..03).
- Minor: orphan wraps: dates "25 wrz / 2026", "21 sie / 2026" (1-phone-small/awkward-05), "wygrane – / porażki" (awkward-07).
- Minor: new-game dialog on tablet shrinks position labels ("Atak czerwonych") to ~12 px (3-tablet/25-new-game); desktop tables put Elo delta at ~12 px.
- Nit: rail name labels on game screen cut to "Krzys…", "Małg…" (1-phone-small/awkward-14) though boards show full names.
- Nit: last-5 form dots ~6 px (ranking tables tablet/desktop, profile).

## IA and flow (7.8)
- MAJOR: second "Teraz w lidze" item on phones is a peek tile showing only an icon: a trophy (tournament) or a pause glyph (paused game) right next to the live game, readable as "pause this game"; the tournament/paused game text is off-screen (truncated audit) (1-phone-small & 2-phone 01-03, awkward-01..03). Tablet/desktop stack them fully.
- Minor: duplicated paths on desktop/wide: "Ustawienia ligi" in rail and in league sheet; "Którym graczem jesteś?" in rail and as card on the same screen (4-desktop/01, 5-wide/01).
- Minor: potato view explains nothing up front: Bartek has 3 days as potato but is under "Pozostali" while Filip (2) is potato; rules collapsed at the bottom (03-league-potato).
- Nit: tournament summary "Najlepszy strzelec 10" without unit, next to "4,0 na mecz" (07-tournament).

## Responsive (7.8)
- Minor: desktop profile is one stretched column; record/achievement tiles 490 px wide holding a number and a short label (4-desktop/11-profile), while wide uses two columns.
- Minor: desktop/wide game panel floats in vertical middle; swap buttons narrower than the Cofnij/Samobój buttons above; 14 px panel text beside a 1400 px table (4-desktop/27, 5-wide/27).
- Minor: desktop games list in two masonry columns: chronological order runs down left then right column, date headers misaligned (4-desktop/04-games, 5-wide/04).
- Minor: league sheet as desktop dialog wraps the name to 3 lines in a narrow title column (4-desktop/awkward-13).
- Nit: wide pages leave large dead areas (5-wide/20-leagues).

## Real data (8.8)
- Minor: live card name truncation at 360 (awkward-01..03 phone-small).
- Minor: 62-char league name printed in full (3 lines) inside the profile card at 360, pushing stats down (1-phone-small/awkward-07-profile).
- Nit: game rail labels truncated (awkward-14 phone-small).
Handled well: ties (5,5,7), zero-game players, 15:13, paused game, long tournament names.
