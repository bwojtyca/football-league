# Eval 20b (independent, rubric.md only)

Shots: tour-20/screenshots/tour/<size>/... (abbrev: ps=1-phone-small, p=2-phone, t=3-tablet, d=4-desktop, w=5-wide)
Contrast checked from tokens/pixels: ink-2 #9aa39d on black 8.1, on card 6.9; date on felt #cfe6d8/#106738 5.3; red/blue labels in new-game cells 6.4/6.2. No contrast failures found.

## 1. Hierarchy and system: 8.3
- Minor: ps/awkward-12 finished game header: yellow "Wróć do turnieju" squeezes the title block, league shows as "Międzynar…".
- Minor: phones (ps/p 01,02,03,19): "Którym graczem jesteś?" card is the first and biggest block, the ranking starts below the fold-half on 360 px.
- Minor: league/tournament records mix LED and Archivo in one value column; "Największy powrót (od stanu) 3:6" in LED reads as a final score (t/05, w/05, p/07).
- Nit: timeline LED mini scores (ps/16, w/16) with hollow 0 glyph, faint.

## 2. Consistency: 7.3
- Minor: stat tile grids leave holes/orphans: p/15 "Razem w drużynie" 2+1, w/05 "W liczbach" 3 + spanning tile + 2, w/12 "Gole" 2 tiles in 3 cols, t/05 "Czas goli" 2 tiles.
- Minor: potato "Pozostali" rows keep an empty rank gutter, unlike every other ranking list (p/03).
- Minor: desktop game panel: "Zamień" pair is not full width under full-width "Cofnij"/"Samobój…" (d/27, w/27).
- Minor: finished game on wide/desktop: event list ends ~120 px before chart and header right edge (w/16, d/16).
- Nit: "Statystyki ligi" entry is a full card on Ranking, a chip on Mecze (p/01 vs p/04).
- Nit: leagues list card subtitle switches from grey meta to bold white "Trwa mecz: …" (p/20).
- Nit: lefts audit 15-25 edges on stats pages (05-league-stats, awkward-05).

## 3. Readability: 7.8
- Minor: "Teraz w lidze" carousel clips the 2nd card mid-word ("T", "C" in p/01-03, p/22; only an icon on ps/01 and ps/awkward-01; audit lists "Turniej piątkowy", "Otwarty · 3 mecze" as truncated).
- Minor: truncation with free space: d/awkward-04 tournament "Wielki Jesienny Turniej o Puc…" with ~300 px empty to the right; ps/awkward-12 "Międzynar…".
- Minor: Polish orphan one-letter words at line ends ("Turniej o / Puchar") in ps/awkward-10 header, ps/awkward-11 card.
- Minor: small labels at desktop/tablet: "Elo", "wygrane – porażki" ~11 px (d/11, w/12), scoreboard "Czerwoni/Niebiescy" ~10 px (t/27, d/27).
- Nit: "Za mało meczów razem (mniej niż 3), bez miejsca (7)" clumsy, wraps (p/02).

## 4. IA and flow: 8.3
- Minor: game screen "Zamień" + two bare arrow buttons, nothing says positions are swapped within red/blue (ps/27, ps/awkward-14, d/27).
- Minor: desktop rail has "Ustawienia ligi" and "Którym graczem jesteś?" (the latter also as a card in the right column) while phones keep settings only in the league sheet; invite is not in the rail (d/01, w/01) - two paths that differ by size.
- Minor: running tournament shows "Wypisz kogoś" and "Poza turniejem (5): …" but no visible way to add a player (p/07, ps/awkward-10), though pl.json has "Dopisz gracza".
- Nit: "Ustawienia ligi" page never names the league (p/10).

## 5. Responsive: 8.5
- Minor: desktop/wide games list stays in a narrow column with an empty right third, and still truncates (d/04, d/awkward-04, w/04).
- Minor: desktop/wide finished game: left column has only a small score card, rest empty while right column runs long (d/16, w/16).
- Minor: wide/desktop profile header spreads three numbers ~360 px apart with 11 px labels (w/12, d/11).

## 6. Real data: 8.0
- Minor: player names cut in compact slots: live card "Małgorz… & Grzeg…" (ps/awkward-01..03), rod plates "Krzys…/Grzeg…/Małgo…" (ps/awkward-14).
- Minor: long tournament name never shown whole on its own page at 360 (2 lines + …, ps/awkward-10); cut in lists (d/awkward-04, ps/awkward-04).
- Minor: long league name takes 3 grey lines of the profile card; "wygrane – / porażki" breaks with a ragged indent (ps/awkward-07).
- Minor: league sheet title runs 5 lines at 360, pushing actions down (ps/awkward-13).

## Overall
| Dimension | Score |
|---|---|
| Hierarchy | 8.3 |
| Consistency | 7.3 |
| Readability | 7.8 |
| IA and flow | 8.3 |
| Responsive | 8.5 |
| Real data | 8.0 |
Overall (min) 7.3, mean 8.0. No blockers, no majors.
