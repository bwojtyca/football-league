# Eval 17a (independent, rubric.md)

Paths: S = 1-phone-small, P = 2-phone, T = 3-tablet, D = 4-desktop, W = 5-wide.

## 1. Visual hierarchy and system: 8.5
- Minor: the records columns mix LED digits (8:0, 8:6, 3:6) with Archivo values (8 min 28 s, 15 s, 6) in one right-aligned column; the profile's Records tiles do the same (1552 next to 8:0). Files: P/05-league-stats, P/07-tournament, P/11-profile, W/05.
- Minor: empty league: the card's only action "Zacznij mecz" is black on a dark card, the weakest button style, for the one thing the screen asks you to do. Files: P/19-empty-league.
- Minor: phone game screen: the match score is two small LED digits in the strip corners, and the most prominent header control is the "Kto strzelił ▾" mode pill, which reads like a heading. Files: S/27, P/27, S/awkward-14.

## 2. Consistency: 7.3 (7.25)
- Minor: the league sheet has two left edges: Zaproś/Ustawienia (icon x≈32, text x≈58 CSS) vs league row/Ligi (icon x≈40, text x≈72). Files: P/23-league-switcher, P/awkward-13-league-menu.
- Minor: "you" has four forms: the "To ja" button, the "Ty" pill (in the ranking and on the profile, where it sits beside the "Koszulka" button and looks like one), "Grasz jako: …" in the rail, and the "Ty · …" card. Files: P/11-profile, S/awkward-07, D/awkward-06, S/awkward-01.
- Minor: one player shows under different names: "Krzysztof" (ranking, games) vs "Krzysztof-Maksymili…" (players) vs the full name (Ty card, profile); "Anna" vs "Anna Maria". Files: S/awkward-01, S/awkward-06, D/awkward-06.
- Minor: profile stats: the Elo tiles use bold small labels, other tiles regular ones; the Pozycje and Kolory tables, one under the other, have different column x positions. Files: P/12-profile-stats.
- Nit: sheet title inset differs (Menu x≈21 vs league sheet x≈16 CSS). Files: P/22, P/23.
- Nit: "Statystyki ligi" in Games is a chip under the filter segment, so it reads like a filter; in Ranking it is a card. Files: P/04-games, P/01.
- Nit: on the leagues page one row's subtitle is "4 gracze · 0 meczów" in grey, the other bold white "Trwa mecz: …" wrapping onto 2 lines. Files: P/20-leagues.

## 3. Readability: 7.5
- Minor: names cut where they matter: the live card "Małgor… & Grze…" at 360, and the rail labels on the game table "Krzys…", "Grzeg…", "Małgo…". Files: S/awkward-01..03, S/awkward-14.
- Minor: the players list (the only place listing full names) cuts surnames: "Krzysztof-Maksymili…", "Grzegorz Brzęczyszczyk…", "Żaneta Ślęczkowska-Wój…". Files: S/awkward-06, P/awkward-06.
- Minor: the "Ostatnie 5 / Ostatnie mecze" dots ●○ have no legend anywhere. Files: D/01, T/01, P/11, P/15.
- Minor: values without a unit or with ambiguous meaning: "Największy powrót (od stanu) 3:6", "Strzelone 3,1 / 2,4" (per game?), "Mur 5,1 na mecz" (conceded), "Najdłuższa seria wygranych 6". Files: P/05, P/12, S/awkward-05.
- Nit: Polish orphans: the single-letter "o" ends a title line ("Turniej o / Puchar…"), and "5 razy ·" ends a line with the date wrapped. Files: S/awkward-10, S/awkward-07.
- Nit: on desktop and wide, metadata is 11–12 px ("Czerwoni/Niebiescy" on the game panel, achievement dates, "Elo" under numbers). Files: D/27, W/11.

## 4. IA and flow: 8.8 (8.75)
- Minor: the desktop rail's "Na tym urządzeniu" heading groups the current league with "Ligi" and "Ranking ogólny", which are not device-specific; on the leagues page the rail repeats the league list shown in the main area. Files: D/01, D/20, W/01.
- Minor: game screen controls do not say what they do: "Kto strzelił ▾" (a goal-detail level, worded as a question) and "Zamień" with two arrow-only buttons (swap within red / blue?). Files: P/27, T/27, D/27.
- Nit: the finished game screen has no title or context (league or tournament) beyond the back arrow. Files: P/16, S/awkward-12.

## 5. Responsiveness: 8.3 (8.25)
- Minor: desktop/wide finished game: a 400 px summary card on the left with an empty void beneath it while the goal log runs long on the right. Files: D/awkward-12, D/16, W/16.
- Minor: wide/desktop games list: a narrow column inside the container, with meta pushed to a far right column and about a third of the width unused. Files: W/04-games, D/04-games.
- Minor: tablet game screen: the table is a narrow centre strip with wide black bands; the bottom controls are unevenly stretched (swap buttons about 300 px, "Samobój…" small) and the labels are 11 px. Files: T/27, T/28.
- Nit: phone kit editor: a large empty gap between the swatches and "Zapisz koszulkę". Files: P/14.

## 6. Robustness to real data: 8.0
- Minor: rail "Grasz jako: Krzysztof-Maksymilian Brzęczyszczykiewicz" wraps to 3 lines and the avatar is clipped to a sliver. Files: D/awkward-06, D/awkward-12.
- Minor: the 62-character league name takes 2 lines plus an ellipsis in the header, 4 lines at sheet-title size in the league sheet (pushing the actions down), and 3 lines in the profile card's meta. Files: S/awkward-01, P/awkward-13, S/awkward-07.
- Minor: the live game card cuts two of four names at 360 although the row has room. Files: S/awkward-01.
- Nit: the tournament page title is cut with an ellipsis and the full name appears nowhere on the page. Files: S/awkward-10.
- Nit: the summary tile label "Gole na mecz" wraps at 360. Files: S/awkward-10.

## Overall
Min = 7.3 (Consistency, 7.25). Mean = 8.04. No blockers, no majors.
