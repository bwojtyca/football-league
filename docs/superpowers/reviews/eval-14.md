# Eval 14 (independent)

## Working notes (in progress)
- Phone ranking, game, new game, finished, paused, games, stats, tournament, players, settings, menu, switcher, leagues, empty, kit, new league, new tournament reviewed.
- Desktop/wide ranking, games, profile, stats, game running reviewed.
Candidate findings:
- Desktop/wide games list: list 760px, "Statystyki ligi" pinned to far right edge, time column floats (4-desktop/04-games, 5-wide/04-games)
- Duplicated paths: hamburger menu and title switcher both hold Invite + Settings; desktop sidebar + hamburger (22-app-menu, 23-league-switcher, 4-desktop/01)
- Main action naming: "+"/"Co gramy?" (phone) vs "Nowa rozgrywka" (desktop)
- FAB yellow on most tabs, grey on Turnieje & empty league (06, 07, 19)
- "kto strzelił" lowercase pill vs "Kto strzelił · Pionowo" (27, 25)
- New game dialog: big empty gap on phone (25-new-game)
- Leagues list: Biuro card subtitle bold white "Trwa mecz..." vs grey meta on other card (20-leagues)
- Small phone awkward: names truncated in Teraz w lidze card and rails (1-phone-small/awkward-01, awkward-14)
- Desktop secondary text ~13px; 11px labels on game board (Czerwoni/Niebiescy, Zamień) (3-tablet/27, 4-desktop/27)

## Scores
| Dimension | Score | Deductions |
|---|---|---|
| Hierarchy | 8.3 | m: "Samobój…" is the largest bottom control on the game screen, heavier than Cofnij (27-game-running all sizes); m: "Statystyki ligi" chip on Games tab sits on its own row with filter weight (2-phone/04-games); m: desktop/wide game side panel text 13-14px beside a huge table (4-desktop/27, 5-wide/27); n: numbers mix LED/Archivo in records (05-league-stats) |
| Consistency | 7.3 | m: main action called "+ / Co gramy?" on phone/tablet, "Nowa rozgrywka" on desktop (2-phone/24, 4-desktop/01); m: "kto strzelił" lowercase pill vs "Kto strzelił · Pionowo" (27 vs 25; pl.json l.274 vs l.205); m: FAB yellow on Ranking/Mecze/Gracze, grey on Turnieje/tournament/empty league (2-phone/06,07,19 vs 01,04,08); m: stat-tile labels: bold 2-line small vs regular (awkward-08-profile-stats vs 05-league-stats); n: leagues list card subtitle bold white vs grey meta (20-leagues); n: goal log score column right on phone, left on desktop (2-phone/16 vs 4-desktop/awkward-12); n: 14-23 left edges on stats (05 json) |
| Readability | 7.8 | m: truncated names on 360px: "Małgor… & Grze…", rails "Krzys…/Grzeg…/Małgo…" (1-phone-small/awkward-01, awkward-14); m: own identity line truncated "Ty · Krzysztof-Maksymilian Brzęczyszczyk…" and players list (awkward-01, awkward-06 all sizes); m: desktop/tablet secondary text 11-13px (W-L, prompts, "Czerwoni/Niebiescy", "Zamień") (3-tablet/27, 4-desktop/01, 4-desktop/27); m: "Najszczelniejsza obrona 2 / Piotr · straconych goli na mecz w obronie" reads backwards, no unit (2-phone/awkward-10-tournament); n: form dots unexplained (11-profile) |
| IA and flow | 8.3 | m: hamburger "Menu" and title switcher both hold Invite + Ustawienia ligi; desktop adds sidebar + hamburger (2-phone/22, 23, 4-desktop/01); m: league stats has three entries (chip on Games, card under Ranking, none in nav) and its page lights no tab (2-phone/04, 01, 05); n: Gracze tab repeats ranking data (08-players); n: finished game page has no title/league context (16-game-finished); n: "Którym graczem jesteś?" duplicated in card and menu (01, 22) |
| Responsive | 8.0 | m: desktop/wide games list 760px while filter row and "Statystyki ligi" stretch to 1120; time column floats (4-desktop/04, 5-wide/04); m: wide game screen side panel offset and small, large black bands (5-wide/27); m: phone dialogs leave half-screen voids (2-phone/25-new-game, 21-new-league); n: desktop finished-game column leaves right 260px empty (4-desktop/awkward-12); n: wide ranking/content narrow centred (5-wide/01) |
| Real data | 8.5 | m: small-phone truncation of names in "Teraz w lidze" and on rails (1-phone-small/awkward-01, -14); m: long-name identity truncation (awkward-01/06); n: orphan "Wiktor" line in "Mniej niż 5 meczów" (1-phone-small/awkward-01); n: profile meta wraps 3 lines with long league name (2-phone/awkward-08) |

Overall (lowest): 7.3 (Consistency). Mean: 8.0.
