# Eval 13 (in progress)
## Notes (raw, appended as I go)
- 01 ranking: clear. Live card in "Teraz w lidze" truncates names at 360 (awkward-01 1-phone-small: "Małgor… & Grze…"). Second carousel card cut at right edge (intended peek).
- League title truncated to 2 lines + ellipsis (awkward-01 phone-small).
- Game screen (27, awkward-14): rail name plates truncated "Krzys…" at 360 but full names on LED boards -> minor. "kto strzelił" lowercase pill label cryptic. "Zamień" with two icon-only coloured buttons.
- Finished game (16): names on felt not tied to team colours (only score digits coloured).
- Potato (03): brown cards touch each other (no gap); "(7)" orphan in duets fold label (02).
- Games (04): losers in grey, winners bold white; date headers; "Pokaż więcej". OK. Statystyki chip duplicated with Ranking card (two paths, acceptable).
- Stats (05): numbers in tiles Archivo, records' scores LED. "Największy powrót (od stanu) 3:6" ambiguous wording. Name links small (39px tall, inline-ish).
- Tournaments (06): yellow "Nowy turniej" + FAB turns dark: one primary. Good.
- Tournament (07): two CTAs top right (Rewanż ghost + Nowy mecz yellow), table OK.
- Settings (10): dropdown arrow butts against text "meczu▾"; slide toggle 52x32 target. No nav tab active on settings.
- Menus: 22-app-menu (title "Menu", plain list rows) vs awkward-13-league-menu (avatar badge + huge 4-line title + filled card rows + "Ligi" plain row): same items (Zaproś, Ustawienia ligi) styled two ways.
- League switcher (23, chevron) and Menu (22, hamburger) both carry "Zaproś" and "Ustawienia ligi": duplicated actions in two sheets, styled differently (card rows vs plain rows). The switcher header for long name: 5-line title on 360 (awkward-13).
- Profile (11/18): good hero; badges wrap orphan "Zgrany duet"; "Porównaj z…" OK. Profile stats tile label style differs ("Elo w obronie (13 meczów 2 na 2)" bold small vs regular labels elsewhere) (12). "W tym miesiącu" equals "Łącznie" (redundant, data-dependent).
- Compare (15): W/P badges + tiny Elo delta (~11-12px) only in compare game list; league games list has none. Inconsistent game row variants.
- New play (24) / new game (25): clear; 3 taps; summary + yellow CTA. Big empty gap above summary.
- Leagues (20): Biuro 2026 subtitle bold white "Trwa mecz: ..." vs grey regular for the other: emphasis ok but wraps "Ala &/Darek".
- New league (21): helper text wraps at ~70% width. Fine.
- Empty league (19): clear first step, yellow CTA in card and FAB turns dark. Good.

## Scores (final)
| Dimension | Score | Deductions |
|---|---|---|
| Hierarchy | 8.5 | Minor: finished game hero does not scale on tablet/desktop/wide (score LED ~40 px in a 700 px felt card) [16 3-tablet/4-desktop/5-wide]; Minor: profile title badges (Mur, Weteran...) and action buttons (To ja, Koszulka) share one pill style [11, 18 all sizes]; Nit: tournament page offers Rewanż + yellow Nowy mecz + dark FAB "+" [07]; Nit: English brand "Football League" in Polish UI [desktop/wide sidebar] |
| Consistency | 6.8 | Minor: same actions (Zaproś, Ustawienia ligi) in two sheets styled differently [22 vs 23, awkward-13]; Minor: game header label "kto strzelił"/"Zamień" (phone) vs "Zapis: kto strzelił"/"Zamień pozycje" (tablet+) [27]; Minor: one game, several row variants + time formats "7 min 15 s gry" vs "Mecz trwał 07:15" [04 vs 15, 16 5-wide]; Minor: stat tile label styles differ (bold 2-line vs regular) [12]; Minor: live card names aligned on "&" leave gaps "Ala    & Darek", "Bo    & Łukasz" [01 all, awkward-01 4-desktop]; Nits: potato "Pozostali" empty rank gutter, potato cards touching [03, awkward-03]; settings select arrow butts text [10] |
| Readability | 7.0 | Minor: live card names cut at 360 "Małgor… & Grze…" [awkward-01/13 1-phone-small]; Minor: rail plates cut "Krzys…", "Grzeg…" [awkward-14 1-phone-small]; Minor: single-letter Polish words left at line end "Turniej o" [awkward-10]; Minor: values break inside units "18 min / 54 s gry", "24 wrz / 2026", "5 razy · / 13 paź", "wygrane – / porażki" [awkward-12, awkward-05, awkward-07]; Minor: tournament page title truncated with no full name on page [awkward-10]; Nits: "Największy powrót (od stanu) 3:6" ambiguous [05]; tiny Elo deltas in compare rows [15] |
| IA and flow | 8.3 | Minor: settings/invite reachable from hamburger, switcher and (desktop) sidebar: hamburger largely redundant on desktop [22, 23, 4-desktop 22]; Minor: game screen "kto strzelił" pill and icon-only coloured swap arrows do not say what they do [27, awkward-14]; Minor: win/loss dots without legend [11, 15, 3-tablet 01]; Nit: "Nowa rozgrywka" (desktop) vs "+ / Co gramy?" naming |
| Responsive | 8.0 | Minor: finished game at tablet+ (see hierarchy) + empty left column on wide [16]; Minor: games list leaves empty right gutter, "Statystyki ligi" chip floats at the far right not aligned to the list [04 4-desktop/5-wide]; Minor: wide profile hero stretched to 1120 px, stats far apart [11 5-wide]; Nits: wide game panel tiny colon/labels [27 5-wide]; desktop stats tile grid hole [05 4-desktop] |
| Real data | 7.5 | Minor: long names cut in live card and rails [awkward-01, awkward-14 1-phone-small]; Minor: 62-char league name: 2-line ellipsis header, 5-line switcher title [awkward-13 1-phone-small]; Minor: long tournament name wraps under each game row on a different alignment [awkward-04]; Minor: name forms mixed (first name in ranking, full name in compare sentence, truncated full name in players) [awkward-06, awkward-09]; Nits: short-name gap "Bo   & Łukasz" [awkward-01 4-desktop]; potato list gutter [awkward-03] |

Overall (min) 6.8 (Consistency); mean 7.7. No blockers, no majors found.
