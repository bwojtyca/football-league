# Football League: independent design evaluation (round: eval1)

Evaluator: an independent agent with no stake in the app and no access to earlier scores. Material: the Tour screenshots and `.json` audits in `scratchpad/eval1/<size>/`, `src/styles.scss`, the component styles under `src/app`, `public/i18n/pl.json`, and the owner's principles in `CLAUDE.md`. File references are relative to `scratchpad/eval1/`. Severities follow the rubric: Blocker 2, Major 1, Minor 0.5, Nit 0.25 (at most 1 point of nits per dimension).

What I looked at: every `2-phone` and `4-desktop` screenshot and every `awkward-*` shot in all three sizes. Long full-page shots were cropped to full resolution so they could be read. At `1-phone-small`, `3-tablet` and `5-wide` I looked at the ranking, games, profile, statistics, running game and leagues pages, plus several others.

Hover artefacts are not counted. One row in the games list and in the overall ranking has a lighter background. That is `.game:hover` (`game-list.component.css:18`), left over from where the test's mouse pointer sat. The fixed bottom bar showing up in the middle of full-page shots is not counted either.

## Contrast computed from the tokens (WCAG 2.x relative luminance)

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--fl-ink` #f2f4f0 on `--fl-paper` #000 / `--fl-card` #0b0c0d / `--fl-card-2` #17191c | 18.97 / 17.69 / 15.91 | pass |
| `--fl-ink` on `--fl-dialog` #16181a / `--fl-sheet` #121416 | 16.08 / 16.68 | pass |
| `--fl-ink-2` #9aa39d on paper / card / card-2 | 8.10 / 7.55 / 6.79 | pass |
| `--fl-ink-2` on dialog / sheet | 6.87 / 7.12 | pass |
| `--fl-on-ball` #1b1410 on `--fl-ball` #ffc629 | 11.58 | pass |
| `--fl-red-board` #ff5a4e / `--fl-blue-board` #5c8cff on `--fl-board` #0a0b0a | 6.41 / 6.24 | pass |
| the same on an unlit LED dot #1c1e1c (worst case) | 5.45 / 5.31 | pass |
| white on `--fl-red` #d0433a / `--fl-blue` #3a64d6 | 4.62 / 5.28 | pass (narrowly for red) |
| `--fl-win` #5be394 / `--fl-loss` #ff8a80 on card | 11.99 / 8.58 | pass |
| `.fl-switch` idle text #b9c2bc on card-2 | 9.65 | pass |
| **loss dot of the form row #2a2d31 on paper / card / card-2** (`shared/form-dots.component.ts`) | **1.52 / 1.42 / 1.27** | **fail** (meaningful graphic, needs 3:1) |
| **`--fl-loss` #ff8a80 (Elo change, 12 px) on felt #157a42 / #0d5a31** | **2.36 / 3.64** | **fail** (needs 4.5:1) |
| **`--fl-win` #5be394 (Elo change, 12 px) on felt #157a42 / #0d5a31** | **3.30 / 5.10** | **fail at the lit centre** |
| **loser's name rgb(255 255 255 / .75) on felt centre #157a42** (`game-detail.component.scss:497`) | **3.78** | **fail** (15 px bold needs 4.5:1) |
| provisional rating, ink at 45 % opacity on paper | 4.10 | passes only as large text |
| role labels #ff9a92 / #9db8ff on the new-game slots | 5.95 / 5.77 | pass |

The token palette itself is sound. Every failure comes from a value that bypasses the tokens: the hard-coded loss dot, opacity on text, and win/loss colours placed on the felt.

## 1. Scores

| Dimension | Score | Deductions (severity, problem, files) |
| --- | --- | --- |
| **1. Visual hierarchy and system** | **5.8** | **Major:** the yellow "ball" is not kept for the one main action. Several screens have two or three yellow filled buttons at once: "Wróć do meczu" with the yellow FAB (`2-phone/01`, `02`, `03`, `awkward-01`), "Zacznij mecz" with the FAB (`19-empty-league`), "+ Nowy mecz" with the FAB or "Nowa rozgrywka" (`07-tournament`, `4-desktop/07`), "Wznów" with "Cofnij" (`28-game-paused`). Yellow is also used for text links ("Wybierz", "Otwórz", "Dokończ", "profil ogólny"), status pills ("Trwa"), the active tab, the leader's rank and Elo, the "Ty" tag, the clock digits and the achievement discs. Up to nine yellow elements share one screen (`awkward-01`). · **Major:** on the game screen the only yellow, primary-styled control is "Cofnij" (undo, a corrective action), while the screen's real main action, recording a goal, has no visual weight (`27-game-running` at all sizes). · **Major:** the Ranking tab shows almost no ranking above the fold. At 360x640 the first row starts at about y=538, under the bottom bar; at 412x915 about 2.5 rows are visible. The status cards push it down (`1-phone-small/01`, `2-phone/01`, `awkward-01`). · **Minor:** mishaps ("Wpadki") use the same yellow discs as achievements, so negative events read as rewards (`11-profile`, `awkward-07`). · **Minor:** the scrim behind sheets and dialogs is weak; the yellow CTAs underneath stay bright, so the sheet barely separates from the page (`23-league-switcher`, `24-new-play`, `4-desktop/24`, `4-desktop/25`). · **Nit:** "Mecze w miesiącach" with one month of data is a full-width chart with a single bar (`05-league-stats`). |
| **2. Consistency** | **6.0** | **Minor:** the header actions change from page to page. Ranking and Players have add-player plus gear; Games and Tournaments have the gear only; a tournament has ⋮ plus gear; a finished game has "Rewanż" plus ⋮ and no gear; the settings page shows a gear that points elsewhere. The gear is a filled circle while the add-player icon is bare (`01`, `04`, `07`, `08`, `10`, `16`). · **Minor:** dialog headers: the close button sits 4 px from the screen edge, the title is butted against it (x=46) and the content starts at x=24, against 16 on pages. Three dialogs have a circled close button; "Nowa liga" has a bare one (`14-kit-editor`, `21-new-league`, `25-new-game`, `26-new-tournament`; `lefts` 4/24/46). · **Minor:** the sheets disagree with each other. "Co gramy?" uses a small grey kicker as its title; "Biuro 2026" and "Aplikacja" use large headings. In the league sheet the "Ustawienia ligi" card runs to the right screen edge while the card above keeps a 16 px margin, and "Zmień ligę" rows are plain text under carded rows (`22`, `23`, `24`, `awkward-13`, `1-phone-small/23`). · **Minor:** on tablet and larger, the page title is not aligned with the content column: title at x=16 against content at 50 (`3-tablet/01`, `11`); x=272 against 408 (`4-desktop/11`, `05`, `07`); x=272 against 728 (`5-wide/11`). · **Minor:** terminology shifts. The tournament table says "Bramki" where every other screen says "Gole". One number is called "rating" (profile: "rating", "Najwyższy rating", "Rating po każdym meczu") and "Elo" (ranking, "1538 Elo", "Elo w czasie") (`07`, `11`, `05`). · **Minor:** heading levels disagree. The profile Overview uses large section headings ("Rekordy", "Osiągnięcia"); the profile Statistics tab uses small grey kickers for sections of the same weight ("Gole", "Czas", "Pozycje", "Partnerzy") (`11` vs `12-profile-stats`). · **Minor:** on desktop the Leagues page uses another shell (no sidebar, title at x=16, column at 280–1000) from every league page (sidebar) (`4-desktop/20` vs `4-desktop/01`). · **Nit:** the tournaments list says "Trwa" twice, as the section label and as a pill on the only card (`06-tournaments`). · **Nit:** the Players page has two add-player controls (header icon and "Dodaj gracza") (`08-players`). |
| **3. Readability** | **5.0** | **Major:** the heatmap legend is inverted. "Godzina rozpoczęcia meczu; ciemniej znaczy więcej meczów" sits under a map where the brightest cell is the busiest: `color-mix(... calc(12% + share*88%), transparent)` in `league-stats.component.scss:30` (`05-league-stats`, `awkward-05`, `4-desktop/05`, `5-wide/05`). · **Major:** the loss dots of the form row are #2a2d31 on black, 1.52:1 (1.27:1 on card-2), so a five-game form reads as two or three dots (`01`, `11`, `17`, `awkward-01`, `4-desktop/01`, `awkward-07`). · **Major:** the finished game's felt card: Elo changes at 12 px are 2.36:1 (loss) and 3.30:1 (win) at the lit centre, and the losers' names are 3.78:1. Red text on green also fails red-green colour blindness (`16-game-finished`, `awkward-12`). · **Minor:** meaningful labels below 12 px: the Elo change under each rating and the "mecze"/"wygranych" column labels at 11.2 px (`ranking.component.scss:119`, `:316`), profile stat labels at 11.5 px (`player-page.component.scss:105`), new-game role labels at 11.2 px, the "Ty" tag at 11.2 px (`01`, `4-desktop/01`, `11`, `25`). · **Minor:** unclear or backward copy. "00:32 / gol średnio co" reads backwards; "Do zdobycia (2)" under "Wpadki" invites people to "earn" mishaps; the tournament table's "M" and "W" are unexplained; "Ranking od · Wszyscy" gives no unit (`05`, `11`, `07`, `10`). · **Minor:** two duration formats side by side. "05:50 Średni mecz" sits next to "2 h 55 min Czas gry"; "19 min Czas gry" and "18:54 gry" appear on other pages (`05`, `07`, `awkward-12`). · **Nit:** "Jędrzej , Natalia Nowak , Wiktor" has a space before each comma (`awkward-01`). · **Nit:** "Początek 30 % · Środek 34 % · Koniec 37 %" adds up to 101 % (`05`). |
| **4. Information architecture and flow** | **5.3** | **Major:** the gear, the universal settings icon, is on every page but opens the app menu ("Aplikacja": language, who you are, overall ranking, leagues). League settings sit only behind the league title's chevron sheet, and the gear still shows on "Ustawienia ligi" itself (`22-app-menu`, `23-league-switcher`, `10-settings`). · **Major:** the game screen has no first step. Nothing says "tap the rod or figure of whoever scored", players' names are not on the rods in portrait, and the only prominent button is Undo, so a first-time user does not know how to record a goal (`27-game-running` at all sizes, `3-tablet/27`, `4-desktop/27`). · **Minor:** statistics are a card at the top of the "Mecze" tab, and the bottom bar has no statistics entry. Navigation state also contradicts the page: on league statistics the Mecze tab is lit, on league settings the Ranking tab is lit (`04`, `05`, `10`). · **Minor:** the potato view gives rank "1" to the player with the most potato days (Bartek, not a potato now), while the current potatoes are highlighted at rank 2. "1" reads as the winner (`03-league-potato`, `awkward-03`). · **Minor:** Duets lists the unranked pairs (under 3 games) straight after the ranked ones with no heading, so 100 % rows sit under a 25 % row. The rule is only explained in a footnote at the bottom; with 16 players the list is about 6,000 px long (`02-league-duets`, `awkward-02`). · **Minor:** a newcomer gets no orientation. The Leagues page never says what the app is for; the desktop sidebar is branded "Football League" in English and labels the list "Na tym telefonie" on a computer (`20-leagues`, `4-desktop/01`, `4-desktop/20`). · **Minor:** the same destination appears under different names and in duplicate. "Ligi: moje, szukaj, nowa" and "Wszystkie ligi, szukaj albo załóż nową" are one place; Players and Ranking both list everyone with their Elo; there are two add-player entries (`22`, `23`, `08`, `01`). · **Nit:** "Ranking od" with the value "Wszyscy" does not say it counts games (`10-settings`). |
| **5. Responsiveness** | **6.0** | **Major:** on desktop and wide screens the game screen's panel is a fixed column of about 188 px pressed into the top right. The LED score is about 190x75 px, "Ostatnio" and "Zamień pozycje" are about 11 px, "Samobój…" is 26 px tall, and the header buttons are 36x36 (audit `small`). 400–700 px under the panel stay empty. At 1920 the score, which people glance at from the table, is tiny (`4-desktop/27`, `28`, `awkward-14`; `5-wide/27`, `28`). · **Major:** at 1920 the content pages are a single 720 px column with about 470 px of black on each side. This covers the profile, games, statistics, tournament and settings, and the page title floats 450 px left of its content (`5-wide/04`, `05`, `11`, `07`, `10`). · **Major:** at 360 px the game screen's team bar cuts the second player's goal count even with short names ("Gosia" and a partial "0") (`1-phone-small/27`, `28`). · **Minor:** the tablet (820) gets the phone layout, with 12 px tab labels on a wide bottom bar and a title out of line with the content column (`3-tablet/01`, `11`, `04`). · **Minor:** on desktop, "Co gramy?" opens as a phone-style bottom sheet anchored to the middle column over the ranking, behind a weak scrim (`4-desktop/24`). |
| **6. Robustness to real data** | **2.3** | **Blocker:** the game screen's team bars hard-clip long names with no ellipsis and push the partner and both players' goal tallies out of view. Phone shows "Krzysztof-Maksymilian Brzęc", then nothing; 360 px shows "Małgorzata Zielińska-N"; desktop shows "Krzysztof-Maksymilian Brzęczys" with its goal count gone and the "2" after "Grzegorz…" half cut (`1-phone-small/awkward-14`, `2-phone/awkward-14`, `4-desktop/awkward-14`). · **Blocker:** a duet's label is one string truncated at its end, so a long first name hides the partner. Six of the top ten pairs read "Krzysztof-Maksymilian Br…" and the pairs cannot be told apart (`2-phone/awkward-02`, `1-phone-small/awkward-02`, `4-desktop/awkward-02`; `truncated` has 52–61 entries on phones). · **Major:** page titles truncate the entity's name and the full name appears nowhere else on the page. The profile shows "Krzysztof-Maksymilia…" and its card shows the league instead; the tournament shows "Wielki Jesienny T…"; the league shows "Międzynarodowa Li…" (`awkward-07`, `awkward-10`, `awkward-01`). · **Minor:** the profile's partner and rival tables break their values across lines ("5 / meczów", "100% / wygranych") with ragged row heights, and the names are cut (`2-phone/awkward-08`, `1-phone-small/awkward-08`). · **Minor:** records print the score in red:blue order, so "Najwyższa wygrana 0:8" and "1:8" read as losses and "Największy powrót 7:12" is ambiguous (`awkward-05`, `awkward-10`). · **Minor:** on phones the ranking cuts names to the first word ("Krzysztof-…" in the user's own row) because the form dots and title icons have a fixed width, and Żaneta's potato icon is lost to truncation (`awkward-01`, `awkward-03`). · **Minor:** the games list cuts ordinary names ("Tomasz Ołdak…", 17 characters) at 412 px because each name column is about 125 px (`2-phone/awkward-04`, `awkward-10`, `awkward-09`). · **Minor:** the long league name wraps to four lines in the profile card and splits the "profil ogólny" link across lines (`awkward-07`). · **Nit:** ellipsis styles vary: "…" in lists, ".." on the finished game ("Brzęczyszczyki.."), a hard clip on the game bars (`awkward-12`, `awkward-14`). |

**Overall score: 2.3** (the lowest dimension, Robustness). **Mean: 5.1** ((5.8 + 6.0 + 5.0 + 5.3 + 6.0 + 2.3) / 6 = 5.07).

Holding up: the token palette passes contrast everywhere it is used as intended. The empty league has a clear first step ("Zacznij mecz"), ties share places (2, 2, 4, 4), paused and running games are distinct in lists, players with no games are handled, and a game starts in three taps (FAB, "Mecz", "Zacznij mecz").

## 2. The ten most important problems (most severe first)

1. **Blocker: the game screen hides players and goals with long names.**
   - Where: `*/awkward-14-game-running.png` at all three sizes; also `1-phone-small/27-game-running.png` with ordinary names ("Gosia 0" cut).
   - Why it matters: this is the screen used during play. The red bar shows one clipped name; the second player and both players' goal counts are not there, and there is no ellipsis to show anything is missing.
   - Fix: lay each player out as an item with `min-width: 0`, the name `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`, and the avatar and goal digit `flex: none`, so the tally never leaves the bar. Below about 420 px, show a short form ("Krzysztof-M. B.") or the first name only and stack the two players on two lines. Use one ellipsis rule everywhere.

2. **Blocker: duets lose the partner's name.**
   - Where: `2-phone/awkward-02-league-duets.png`, `1-phone-small/awkward-02`, `4-desktop/awkward-02`.
   - Why it matters: the pairs ranking has one job, saying which pair is which. Six of the top ten rows read "Krzysztof-Maksymilian Br…".
   - Fix: give each name its own line, or its own truncating span (`A …` & `B …`, each `max-width: 50%`), or use short names ("Krzysztof-M. B. & Żaneta Ś.-W."). Never truncate the joined string.

3. **Major: the game screen has no first step, and Undo is styled as the main action.**
   - Where: `27-game-running.png` at all sizes; `28-game-paused.png` (then two yellow buttons).
   - Why it matters: a newcomer standing at the table sees a drawing of rods, no hint and one yellow button, which undoes. Hierarchy and flow both point away from "record a goal".
   - Fix: until the device's first goal, show a one-line hint on the felt ("Dotknij pręta albo zawodnika, który strzelił"). Show the scorers' names on their rods or handles in portrait, as on the desktop rails. Make "Cofnij" a tonal pill (it is a correction) and keep yellow for the next goal, or for nothing.

4. **Major: yellow no longer marks the one main action.**
   - Where: `2-phone/01`, `03`, `07`, `19`, `28`; `awkward-01` (nine yellow elements); `4-desktop/01`, `07`.
   - Why it matters: the rubric's hard rule is "one primary action per screen, styled as the yellow ball". Here yellow means action, status, link, active tab, leader, "you" and achievement at the same time, so nothing stands out, including the FAB.
   - Fix: allow one filled yellow per screen. On league pages that is the FAB (or "Nowa rozgrywka" on desktop), and "Wróć do meczu", "Zacznij mecz" and "Nowy mecz" become tonal. Text actions ("Wybierz", "Otwórz", "Dokończ") use `--fl-ink` with a chevron. "Trwa" becomes a felt-green or LED pill, the leader's Elo goes to ink with the star, the "Ty" tag goes tonal, and achievement discs go to felt green or gold outline.

5. **Major: the settings icon opens something else, and league settings are hidden.**
   - Where: `22-app-menu.png`, `23-league-switcher.png`, `10-settings.png`.
   - Why it matters: "where are the league's settings?" is a core task. The gear on every page opens "Aplikacja" (language, identity, overall ranking), while league settings sit behind the title chevron. The gear even shows on the league settings page.
   - Fix: on league pages the gear opens "Ustawienia ligi" directly. Move the app menu behind a different icon (person or ⋯) or into the leagues page. Hide or disable the gear on the settings page.

6. **Major: the Ranking tab shows no ranking above the fold on small phones.**
   - Where: `1-phone-small/01-league-ranking.png` (first row at y=538 of 640, under the bottom bar); `2-phone/01` and `awkward-01` (2–2.5 rows).
   - Why it matters: "see where they stand" is one of four newcomer goals in the brief, and the tab named Ranking opens on three status cards.
   - Fix: fold "Teraz w lidze", paused games and the running tournament into one compact strip of one line per item with a "Wróć"/"Dokończ" chevron. Turn "Którym graczem jesteś?" into a small row, or show it in place of the "Ty" row in the list. Target: at least four ranking rows visible at 360x640 with a game running.

7. **Major: page titles cut the name and nothing on the page shows it in full.**
   - Where: `2-phone/awkward-07-profile.png` ("Krzysztof-Maksymilia…", and the card shows the league, not the player), `awkward-10` ("Wielki Jesienny T…"), `awkward-01` ("Międzynarodowa Li…").
   - Why it matters: the profile is where you check whose page you are on, and the full name appears nowhere.
   - Fix: let titles wrap to two lines (`-webkit-line-clamp: 2`) at a slightly smaller size when long, or repeat the full name as the first line of the profile and tournament cards.

8. **Major: loss dots are invisible.**
   - Where: `2-phone/01`, `11`, `17`, `awkward-01`, `4-desktop/01`; `shared/form-dots.component.ts` (`#2a2d31` on black is 1.52:1, on card-2 1.27:1).
   - Why it matters: "Ostatnie mecze: ●●○○●" reads as three games, and the form row is decorative noise without a legend.
   - Fix: draw a loss as a hollow ring with a 1.5 px `--fl-ink-2` border (8.1:1 on black) or as `--fl-loss` at full strength, keep wins filled ink, and explain the dots in "Jak czytać ranking".

9. **Major: the finished game's felt fails contrast, and the statistics heatmap says the opposite of what it shows.**
   - Where: `16-game-finished.png`, `awkward-12` (Elo change #ff8a80 on felt 2.36:1, #5be394 3.30:1, losers' names 3.78:1); `05-league-stats.png`, `awkward-05` ("ciemniej znaczy więcej meczów" while brighter cells mean more).
   - Why it matters: the Elo change after each game is a feature the owner asked for, and here it is the least readable number on the screen. A reversed legend actively misleads.
   - Fix: put the changes on small dark LED chips (`--fl-board`, where the same colours reach 6+:1) or write them in white with an arrow. Show losers at 90 % white. Change the hint to "jaśniej znaczy więcej meczów", add a three-step scale, and show the count in the busiest cell.

10. **Major: large screens waste space and shrink the game.**
    - Where: `4-desktop/27`, `28`, `awkward-14` and `5-wide/27` (a 188 px panel, tiny score, 26–36 px controls, 400–700 px empty under the panel); `5-wide/04`, `05`, `11`, `07` (a 720 px column with about 470 px of black on each side, the title 450 px away).
    - Why it matters: a laptop or TV next to the table is a natural setup, and the score is the one number everyone reads from a distance.
    - Fix: size the panel with `clamp(240px, 22vw, 380px)`, make the LED score at least 64 px tall, make every panel control at least 44 px, and centre the table and panel vertically. From 1440 px, give the profile and statistics two columns (card and charts | records and achievements), or raise `.page` max-width to about 1100 px and align the page title to the content column.

Further Majors in the table but not in the top ten: none beyond those above. The "1-phone-small" score-bar clip is part of item 1.

## 3. Overall

- **Overall (lowest dimension): 2.3** (Robustness to real data).
- Mean for information: **5.1**.
- Per dimension: Visual hierarchy 5.8, Consistency 6.0, Readability 5.0, Information architecture 5.3, Responsiveness 6.0, Robustness 2.3.

The two Blockers alone (items 1 and 2) take Robustness from 6.3 to 2.3. Both are local CSS changes. Fixing them and items 3–9 would put every dimension around 7–8.

## 4. What I could not judge

- **Interaction and motion:** hover, focus and pressed states; the finish panel's 8 s countdown and confetti; the undo snackbar; transitions; how the game screen responds to a tap. Screenshots are static.
- **Whether tapping a rod in "Pozycja" mode really records the right player:** I inferred the tap targets from the audit's `Gol: <name>` buttons, not from use.
- **The English UI:** only Polish was captured.
- **Screen readers and keyboard focus order:** I saw the `sr-only` text for the form dots in code, but did not test it.
- **Landscape phones:** the turned layouts (`.turn-cw` / `.turn-ccw`) and the goal-detail modes "Którą linią" and "Którym zawodnikiem" on the whole table were not in the shots.
- **Dialogs and sheets not captured:** the "Jak czytać ranking" (?) help content, the add-player dialog, the tournament edit and delete dialogs, the second step of the new-league wizard, the identity picker ("Wybierz"), the compare menu, and an archived (locked) league.
- **The actual font rendering on devices:** the Doto LED digits at about 16 px (the event-log scores on `16-game-finished`) looked legible at 2x, but I cannot verify them at 1x on a real phone.
- **Performance and loading:** the skeleton, the progress bar and offline behaviour are not visible in the shots.
