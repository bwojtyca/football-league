# Eval 19b (independent, rubric.md)

Paths: S = tour-19/screenshots/tour/{1-phone-small,2-phone,3-tablet,4-desktop,5-wide}

## 1. Visual hierarchy and system: 8.5
- Minor: records and stat grids mix thin LED scores with heavy Archivo numbers in one column/grid ("8:0" LED next to "1552"/"8 min 28 s" bold): 05-league-stats (all sizes), 11-profile, 18-overall-profile, 07-tournament.
- Minor: finished-game page has no title or league context; on tablet/wide the felt hero is a small cluster in a big card (16-game-finished tablet, desktop, wide).
- Nit: on phones the "Którym graczem jesteś?" card + "Teraz w lidze" strip push the ranking to the lower half of the first screen (1-phone-small/01, 2-phone/01).
- Nit: "Wypisz kogoś" is a grey text-only action with weak affordance (07-tournament, awkward-10).

## 2. Consistency: 7.0
- Major: "Nowy turniej" format cards render in the browser default sans (Arial/Liberation) instead of Archivo: descriptions and "od N osób" (26-new-tournament, all sizes). Cause: `button.format` in tournament-new-dialog.component.scss lacks `font: inherit` (other sheets have it).
- Minor: switches sit left of their label in the new-game dialog (25-new-game) but right of the text in settings (10-settings).
- Minor: player names differ by screen: ranking/duets/tournament show first names ("Anna", "Grzegorz"), Players list shows full names truncated ("Anna Maria", "Grzegorz Brzęczyszczyk…"), you-card full name (awkward-01 vs awkward-06, small and phone).
- Minor: the "add" action moves: "Nowy turniej" grey pill above the list (06-tournaments), "Dodaj gracza" grey pill below the list (08-players).
- Nit: league monograms "B" vs "WW"/"ML" (20-leagues, 23-league-switcher).
- Nit: leagues list subtitle is bold white for a live game but grey regular otherwise (20-leagues).

## 3. Readability: 6.3
- Blocker: "Kiedy gramy" heatmap: weekday row labels (pon., czw., sob., niedz.) are overlapped by the first column of cells, and hour labels 10-23 run together into "1011121314…" (awkward-05-stats on 1-phone-small, 2-phone; labels still overlapped on 4-desktop).
- Minor: player names on the game table rails are rotated 90° and truncated on small phones ("Krzys…", "Grzeg…", "Małgo…") (27-game-running phone/tablet, awkward-14 small).
- Minor: on 360 px the goal-detail chip in the game header loses its text and shows only a person icon + caret (1-phone-small/awkward-14).
- Minor: desktop/tablet secondary type drops to ~10-12 px (chart axes, "Obrona/Atak" in goal log, Elo deltas, table headers) (4-desktop/01, 16; 3-tablet/16).
- Nit: awkward wraps: "Elo w obronie (13 / meczów 2 na 2)", "wygrane – / porażki" (2-phone/12, small awkward-07).
- Nit: default browser disc bullets in "Przebieg meczu" summary (16-game-finished all sizes).

## 4. IA and flow: 8.0
- Minor: "Zamień" + two icon-only arrow buttons on the game screen do not say what is swapped (positions of red / of blue) (27-game-running all sizes).
- Minor: new-game dialog on desktop says "Ekran i zapis goli: Kto strzelił · Pionowo" while the desktop game screen is always landscape (4-desktop/25 vs 27).
- Minor: finished game / game screens drop league context: no tab or rail item highlighted, no league name (16-game-finished desktop/wide; phone has no bottom bar).
- Nit: the start action has three names: "+" (bottom bar), "Nowa rozgrywka" (rail), "Co gramy?" (sheet).
- Nit: "Którym graczem jesteś?" appears in card, ☰ menu and rail at once (01, 22, desktop rail).

## 5. Responsiveness: 8.8
- Minor: finished game on tablet/wide: hero card stretched with a small centred cluster, empty column under it on wide, goal log's right edge (x≈610 tablet, ≈1520 wide) not aligned with chart/header edge (3-tablet/16, 5-wide/16).
- Minor: tablet/desktop single sparse pages (06-tournaments, 19-empty-league tablet) leave most of the viewport empty; tablet does not use the two-column lists desktop uses.
- Nit: tablet game screen keeps the phone-size LED score (~30 px) on an 820 px screen (3-tablet/27).

## 6. Robustness to real data: 7.8
- Major: the stress league (games around midnight → 24 hour columns) breaks the heatmap: overlapping weekday labels, merged hour numbers (awkward-05-stats, phone small/phone/desktop).
- Minor: name truncation: live card "Małgorz… & Grzeg…" (awkward-01 small), Players list surnames cut, rails "Krzys…" (awkward-06, awkward-14).
- Minor: 62-char league name makes the profile card header three lines before "Profil ze wszystkich lig" (1-phone-small/awkward-07).
- Nit: long tournament title truncated to two lines in its own page header (awkward-10 small).

Overall (min): 6.3 · mean: 7.7
