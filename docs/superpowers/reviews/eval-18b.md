# Eval 18b (in progress)

## Notes so far (ordinary league, phone 412 + desktop/wide spot checks)
- Desktop 1280x800 rail with 2 leagues collapses: section labels "Na tym urządzeniu"/"<liga>" clipped by items, "Nowa rozgrywka" squashed to 26 px (audit small 232x26): 4-desktop/19,23,24,25,26,27,28.
- Potato cards abut with no gap (2-phone/03).
- Column alignment differs between profile stats tables (Pozycje / Kolory / Partnerzy) (2-phone/12).
- Profile stats "Łącznie" == "W tym miesiącu" (redundant tile) (2-phone/12).
- Toggle switches 52x32 (settings, new game) audit.
- Inline name links 39 px tall, "Xi" 13 px wide (stats).
- "Którym graczem jesteś?" repeated: card + ☰ menu (+rail on desktop).
- Games list low density: ~95 css px per game on phone (30 games = 3600 css px).

## Scores
| Dimension | Score | Deductions |
|---|---|---|
| Hierarchy | 7.8 | Major: rail CTA "Nowa rozgrywka" squashed to 26 px at 1280x800 with 2 leagues (4-desktop/19,23-28). Minor: record values mix LED (8:0) and Archivo (8 min 28 s, 6) in one list (2-phone/05,07). Minor: wide finished game, result card small, chart dominates (5-wide/16). Nit: static "Ty" chip styled like buttons beside it (awkward-07). |
| Consistency | 7.8 | Minor: goal log row order differs phone vs wide (2-phone/16 vs 5-wide/16). Minor: column positions differ across profile stat tables (2-phone/12). Minor: game header differs by size (rotate + team labels on tablet/desktop only) (3-tablet/27 vs 2-phone/27). Minor: potato cards abut with no gap (2-phone/03). Nit: live-game subtitle bold white in leagues list (2-phone/20). |
| Readability | 8.0 | Minor: blue team names truncated in live card at 360 (1-phone-small/awkward-01,13). Minor: rail names truncated on game screen at 360 (awkward-14). Minor: standalone name links 13-59 px wide x 39 px (stats/tournament audits). Nits: orphan "2026" / split "wygrane –/porażki" (awkward-05,07); 11 px role labels in wide new game dialog (5-wide/25). |
| IA and flow | 8.8 | Minor: "Którym graczem jesteś?" in 3 places (card, menu, rail). Minor: finished game screen has no title/context (2-phone/16). Nit: "Wypisz kogoś" grey text-only action (2-phone/07). |
| Responsive | 7.5 | Major: desktop rail collapse (labels clipped, CTA 26 px) (4-desktop/19,23-28). Major: 360 game header overflows, ⋮ cut at right edge, clock touches pill (1-phone-small/27, awkward-14). Minor: wide 1920 single 760 px column with empty right half on games/finished game (5-wide/04,16). |
| Real data | 8.8 | Minor: long league name makes profile hero ~360 css px, tabs below fold; sheet title 5 lines (1-phone-small/awkward-07,08,13). Minor: "Łącznie" equals "W tym miesiącu" tile (2-phone/12). Nit: Elo lines touch top gridline (awkward-05). |

Overall (min): 7.5. Mean: 8.1.
