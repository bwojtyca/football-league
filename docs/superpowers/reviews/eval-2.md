# Independent design review (eval2), 14 Oct 2026

Material: `eval2/<size>/*.png` + `.json` audits (5 sizes, 27 ordinary + 14 awkward shots), `src/`, `src/styles.scss`,
`public/i18n/pl.json`, CLAUDE.md principles and "The look". Scored per `docs/superpowers/reviews/rubric.md`.
File names below are `<size>/<shot>`; `2-phone/01` = `eval2/2-phone/01-league-ranking.png`, `awk-NN` = `awkward-NN-*`.

Every 2-phone and 4-desktop shot and every awkward shot was viewed (long shots cut into 750-CSS-px strips);
1-phone-small, 3-tablet and 5-wide were viewed for ranking, games, stats, profile, game running, leagues, finished game,
new game and tournament.

## 1. Scores

| Dimension | Score | Deductions (severity, problem, files) |
| --- | --- | --- |
| Visual hierarchy and system | **6.8** (6.75) | Minor: yellow ball diluted, yellow also on active tab, leader's rank, clock, kit LED, all six format icons, "Mecz" tile; paused screen puts a non-tappable yellow disc above the yellow "Wznów" (28, 26, 24, 14, all sizes) · Minor: the Ranking tab's ranking starts under 3–4 equal-weight cards; at 360×640 one row shows on the awkward league (1-phone-small/awk-01, 2-phone/01) · Minor: finished game at tablet/wide: 40-px LED score in a 720×200 felt card, the result is not the dominant element (3-tablet/16, 4-desktop/16, 5-wide/16) · Minor: unselected rule chips have no container (#17191c on #16181a = 1.01:1) and the off toggle outline is 2.13:1, so "Do 5/Do 10/Na czas" read as text (25, all sizes) · Minor: profile repeats the name in the top bar and the card, four lines for a long name (11–13, 18, awk-07) · Minor: Leagues page has no primary; "Nowa liga" is a grey bar as heavy as the league cards (20, all sizes) · Nit: scores are LED in lists but Archivo in records/tables ("8:0", "15:13", "22:12") (05, 07, 11) |
| Consistency | **5.0** | Major: desktop/wide shell and left edge jump per page: title at x=272 (ranking views, 19), 408 (games, stats, tournaments, players, settings, profile), 280 with no sidebar (17, 18, 20, 16); 19 has title at 272 and card at 408 (lefts audits; 4-desktop/01 vs 04 vs 17) · Minor: header right side differs: gear+hamburger, hamburger only, kebab+hamburger side by side (07), kebab without hamburger (16, 27) · Minor: close buttons: X in a filled circle (14, 25, 26) vs bare X (21) · Minor: one concept, three labels: "Którym graczem jesteś?" (01), "Kim jesteś na tym telefonie?" (22), "To ja"/"Ty" (11, awk-01) · Minor: stat blocks in three styles: value-over-label tiles (05, 07), lower-case label-over-value without tiles (12), tables with header rows vs units repeated per cell (awk-08 "Zasady" vs "Partnerzy") · Minor: day headers "Dziś, środa…", "Wczoraj, wtorek…" capitalised, "poniedziałek, 12 października" not (04, 07, 13, 15) · Minor: profile tabs: labels left-aligned inside equal segments ("Przegląd" at the left of a 370-px pill on 5-wide/11), other segmented controls hug their labels · Minor: underline means "link" in stats/records (05, 12) but "this player" in game lists (13, 15) · Nit: league monograms bare text / dark tile / yellow (20, 23, awk-13) · Nit: desktop sheets size to content, 512 px vs 854 px (4-desktop/23 vs awk-13) |
| Readability | **4.3** (4.25) | Blocker: the live-game card's action label is the raw key `now.backShort` on every league home, all sizes (01–03, awk-01–03, 23, 24, awk-13); key used in `src/app/league/now-card.component.ts:81`, missing from pl.json and en.json · Blocker: live card names cut to initials or slivers: "B.. & G.." / "A. & D..." (2-phone/01), only "&" / "&" (1-phone-small/01), "\| & (" (4-desktop/01–03, 5-wide/01); readable only at 820 px; paused row drops the opponents ("Bo & Łukasz 3:2 …", 1-phone-small/awk-01) · Minor: "3 wygranych z rzędu" (11, awk-07; `pl.json:437` has no plural, should be "3 wygrane"), plus line-final "z" · Minor: explanatory copy at 12.8–13.6 px (ranking/duets rule footnote `.hint` 0.8rem, heatmap caption, stats sub-lines 0.85rem) (02, 05) · Minor: numbers broken across lines: "wygranych · 2–/2" (4-desktop/15), "Gole · 10,6 na/mecz" (05, all sizes), "Do zera ·/23%" (5-wide/05) · Nit: Doto "0" draws as a diamond ("8:◊", "1:◊") (04, 16) |
| Information architecture and flow | **6.0** | Major: recording a goal, the core action, has no visible instruction on the running game: the table is the button, the only chip says "Pozycja" (goal-detail level, not the action); someone joining a running game is not told what to tap (27, awk-14, all sizes) · Minor: statistics hide under the "Mecze" tab (card above the games list) and the stats page keeps "Mecze" lit (04, 05) · Minor: redundant paths: settings via gear and league sheet; "Wszystkie ligi" via hamburger, league sheet, sidebar; the app menu on the Leagues page repeats the page; the league sheet gives "Wszystkie ligi" a "+" icon that reads "add" (22, 23, awk-13) · Minor: form dots ●○○●● in ranking, profile and compare have no legend, colour or order cue (01, 11, 15, 17) · Minor: potato view has no positions and its big number ("2 dni") no header (03, awk-03) · Minor: after a tournament game the primary is the bare noun "Turniej" (awk-12) · Nit: "Kim jesteś na tym telefonie?" on desktop (4-desktop/22) · Nit: "Seria" offered both in "Co gramy?" and in "Nowy turniej" (24, 26) |
| Responsiveness | **4.0** | Major: the live card only works at 820 px; phone and desktop/wide right column cut the names (01–03 at 1, 2, 4, 5) · Major: horizontal page scroll at 360: profile "Zasady" table ("54% wygranych") runs through the gutter, document 361 px (1-phone-small/awk-08 .json width 361, PNG 722 px) · Major: at 1920 the header sits on a 720-px column while the content uses 1120: title at x=733, content at 528, menu 212 px inside the content edge (5-wide/05, 11–13, 15) · Major: phone columns on wide: games, leagues, overall ranking, finished game are 720-px columns with ~470–600 px empty each side; on the finished game back and "Rewanż" sit at the window edges, >500 px from the content (5-wide/04, 16, 17, 20; 4-desktop/16) · Minor: desktop menus are phone bottom sheets docked bottom-centre, far from their top-right/sidebar triggers (4-desktop/22–24) · Minor: 360 cramping: "Nowy / mecz" title wraps beside "Zamień drużyny" (1-phone-small/25); "+12" runs into "13–10" (1-phone-small/11) · Minor: desktop game panel: "Samobój…" 299×26 px (audit), panel vertically centred, misaligned with the table; at 1920 a 370-px panel with 13-px text beside a 1520-px table (4-desktop/27, 5-wide/27) · Minor: small tap targets (non-primary): rule chips 53×36 (25), "profil ogólny" 91×24 (11–14), partner/rival links ~40×17 (12), Elo-chart chips 32 px (05), swap buttons 36×40 at 360 (1-phone-small/27) |
| Robustness to real data | **5.5** | Major: duet names: long partner keeps ~20 characters, short names become an initial: "B. & Małgorzata Zielińska…", "K… & Małgorzata Zieliń…", "Małgorzata Zielińsk… & O."; "Xi", "Bo", "Ola" in `truncated` (99 entries at 2-phone, 115 at 360) (awk-02) · Major: undo bar "Ostatnio: Krzysztof-Maksymilian Brzęczysz…" loses the event the user must check before "Cofnij" (1-phone-small, 2-phone awk-14) · Major: shared title misleads: "8 dni jako ziemniak" beside Bo, Żaneta, Tomasz whose counts are 8, 6, 3 (awk-05 vs awk-03) · Minor: counts disagree: "31 meczów" vs "30" (23 vs 04/05), "122" vs "120" (awk-13 vs awk-04/05), "13 Gracze" vs "Gracze 16" (awk-05 vs awk-06) · Minor: tournament table places players with no games ("9." 0 0 0:0) above players who played (awk-10) · Nit: score boards change width with name length (27 vs awk-14) · Nit: two-dot ellipsis "Brzęczyszczyki..", "G.." (awk-12, 01) |

**Overall: 4.0** (lowest dimension: Responsiveness). **Mean: 5.25** ((6.75 + 5.00 + 4.25 + 6.00 + 4.00 + 5.50) / 6 = 31.50 / 6).

## Contrast ratios computed (WCAG, from tokens and sampled pixels)

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--fl-ink` #f2f4f0 on `--fl-paper` #000 | 18.97 | pass |
| `--fl-ink-2` #9aa39d on #000 / card #0b0c0d / card-2 #17191c / dialog #16181a / sheet #121416 | 8.10 / 7.55 / 6.79 / 6.87 / 7.12 | pass |
| `--fl-ink-2` on potato row #3b2f1b | 5.04 | pass |
| potato name #f3dfb5 on #3b2f1b | 9.97 | pass |
| `--fl-red-board` #ff5a4e on board #0a0b0a / on #000 | 6.41 / 6.82 | pass |
| `--fl-blue-board` #5c8cff on board #0a0b0a / on card-2 | 6.24 / 5.58 | pass |
| new game role text #ff9a92 on sampled cell #372b1c; #9db8ff on #123542 | 6.75 / 6.65 | pass |
| white on `--fl-red` #d0433a ("Trwa" pill) | 4.62 | pass (just) |
| `--fl-on-ball` #1b1410 on `--fl-ball` #ffc629 | 11.58 | pass |
| W badge #5be394 on #123524; P badge #ff8a80 on #3a1714 | 8.24 / 7.01 | pass |
| nav inactive `--fl-ink-2` on #0b0c0d; active `--fl-ball` | 7.55 / 12.46 | pass |
| unselected chip #17191c on dialog #16181a (component boundary) | 1.01 | fails 3:1 non-text |
| off toggle outline #4a4f4b on #16181a | 2.13 | fails 3:1 non-text |
| provisional rating, ink at 45% on black (#6d6e6c), large bold | 4.10 | pass for large text |

Text contrast is not the problem in this build; the token set is sound.

## 2. The ten most important problems

1. **Raw translation key on every league home** (Blocker). The live-game card's action reads `now.backShort`
   at every size (2-phone/01–03, 23, 24; awk-01–03, awk-13; 4-desktop/01–03; 5-wide/01). The key is used at
   `src/app/league/now-card.component.ts:81` and exists in neither `public/i18n/pl.json` nor `en.json`. It is the
   first bold label a returning player sees. Fix: add `now.backShort` ("Wróć" / "Back"), and add a build-time check
   that every key used in templates exists in both files (Transloco has a keys-manager / missing-key handler that
   can fail CI).
2. **Who is playing is unreadable in the live card** (Blocker). Names shrink to "B.. & G..", to bare "&" at 360,
   and to slivers "| & (" in the desktop/wide right column; the paused row drops the opponents entirely. Only the
   tablet shows "Bartek & Gosia". Fix: stack the card: names on their own full-width line(s) above or below the
   clock+score; drop the text action (the whole card is a link, keep the chevron); on the 340-px desktop column put
   the score on a second row. Never truncate a two-name team below first names.
3. **Desktop and wide shells are inconsistent** (Major). Titles start at 272, 408 or 280 px depending on the page;
   overall ranking/profile, leagues and the finished game drop the sidebar; at 1920 the header uses a 720-px column
   while stats/profile content uses 1120 px (title x=733 vs content x=528). Fix: one shell for all pages on ≥1024 px
   (sidebar always, with "Wszystkie ligi" and "Ranking ogólny" in it), and drive header and content from the same
   `--fl-page-max` per page (set it on the page host, not on an inner element).
4. **Recording a goal has no visible instruction once a game is running** (Major). The core action of the app is
   "tap the table", but at 2:3 nothing says so and the only chip reads "Pozycja" (27, awk-14). Fix: keep a one-line
   hint in the "Ostatnio" bar until the first undo-free goal on this device ("Dotknij drążka gracza, który strzelił"),
   rename the chip to "Zapis: pozycja" / "Zapis goli: pozycja", and give the rails a subtle tap affordance (pressed
   state, ripple) visible in the first seconds.
5. **Duet and undo-bar truncation destroys short names and events** (Major ×2). "B. & Małgorzata Zielińska…",
   "Małgorzata Zielińsk… & O." (awk-02), "Ostatnio: Krzysztof-Maksymilian Brzęczysz…" (awk-14). Fix: give each name
   in a pair `flex: 0 1 auto; min-width: min(max-content, 40%)` (or first name + surname initial for both), and let
   the undo text wrap to two lines or shorten the name to "Krzysztof-M. B." so the verb and position survive.
6. **Horizontal scroll at 360 px** (Major, hard threshold). The profile "Zasady" table overruns the gutter
   (1-phone-small/awk-08: document width 361). Fix: use the same 3-column table with header row as "Partnerzy",
   drop the repeated "meczów"/"wygranych" from cells, and give the first column `min-width: 0` with wrapping.
7. **Wide screens get a phone column** (Major). Games, leagues, overall ranking and the finished game are 720-px
   strips in 1920 with ~500 px of black each side; the finished game's back and "Rewanż" sit at the window edges
   (5-wide/04, 16, 17, 20). Fix: on ≥1400 px give the games list two columns (list + selected game detail or the
   stats summary), put the finished game's actions in the content column's header, and widen leagues to a 2–3
   column card grid.
8. **Shared titles and counts read wrong** (Major + Minor). "8 dni jako ziemniak" beside three potatoes with 8/6/3
   days (awk-05); "31 meczów" vs "30" (23 vs 05), "122" vs "120", "13 Gracze" vs "Gracze 16". Fix: show the value
   per holder ("Bo 8 · Żaneta 6 · Tomasz 3") or only the top holder with "+2"; count finished games everywhere or
   label the sheet "31 meczów (1 trwa)"; label the stats tile "Grało".
9. **The yellow ball and primary actions are diluted** (Minor ×2 in hierarchy). Yellow marks the active tab,
   leader's rank, clock, kit number, all six tournament-format icons and a decorative pause disc above the yellow
   "Wznów"; meanwhile the Leagues page has no primary at all. Fix: reserve `--fl-ball` fills for the one CTA; use ink
   or felt green for format icons and the pause disc; make "Nowa liga" the `fl-cta` when the device has no league,
   otherwise keep it secondary but make league rows the clear first step.
10. **Desktop uses phone sheets and small targets** (Minor ×2). App menu, league switcher and "Co gramy?" open as
    bottom sheets far from their triggers (4-desktop/22–24); "Samobój…" is 26 px tall in the desktop game panel, rule
    chips 36 px, "profil ogólny" 24 px, table links 17 px. Fix: use `mat-menu` anchored to the trigger on ≥1024 px and
    a centred dialog for "Co gramy?"; set a 44-px minimum on chips, the own-goal button and text links in tables
    (padding, not font size).

## 3. Overall

- Overall score (lowest dimension): **4.0** (Responsiveness), with Readability close behind at 4.25.
- Mean, for information: **5.25**.
- What holds up well: text contrast (all body/secondary pairs ≥ 5:1), the 3-tap start (+ → Mecz → Zacznij mecz),
  the tablet layouts, empty league state, the new game dialog's chance panel, the game timeline, and the consistent
  LED/felt language on game screens.

## 4. What I could not judge

- The first-run experience of a device with no league (the Tour starts with leagues already on the device), so I
  cannot say whether a newcomer learns what the app is for before the Leagues page.
- The 0:0 state of the game screen: `pl.json` has `game.firstStep.*` hints that may show before the first goal;
  the Tour only shows 2:3 and 6:6.
- The finish panel with countdown, the rematch flow, tournament formats other than "Otwarty" (brackets, king of the
  table), the timed-game clock, landscape phones, English UI, and dialogs such as delete/restore and add player.
- Hover/focus states: the lighter rows in 2-phone/04 (8:5) and 17 (Ala) match the `:hover/:focus-visible` style in
  `game-list.component.css` / `ranking.component.scss`, so I treated them as capture artefacts, not a bug; on touch
  phones a sticky hover may still appear in real use.
- Motion, loading states and real-device rendering of the Doto font at 1× density.
## Working notes (appended as I go; where they differ from sections 1–4, sections 1–4 win: e.g. the highlighted rows were later traced to the :hover style)

### 2-phone pass (all 41 shots viewed) and first desktop shots

- RAW I18N KEY: the "Teraz w lidze" live-game card shows the literal key `now.backShort` as its action label on every
  ranking view (01/02/03, awkward-01/02/03/13, 23, 24 at every size). Confirmed: `src/app/league/now-card.component.ts:81`
  uses `'now.backShort'`, the key exists in neither `public/i18n/pl.json` nor `en.json` (pl `now` has: title, live, back,
  paused, finish, open, quiet, howItWent, leader, potato, week, games).
- LIVE CARD NAMES: same card truncates 4-6 letter names to one letter ("B.. & G..", "A. & D...") on phone; on desktop
  (4-desktop/01, 02, 03) the names column is a sliver: "| & (" / ", & |" -- nobody can read who is playing (cropped x3 to confirm).
- Duet names (awkward-02 at 1-phone-small/2-phone): short names cut to an initial while the long partner keeps 20 chars:
  "B. & Małgorzata Zielińska…", "K… & Małgorzata Zieliń…", "Małgorzata Zielińsk… & O.", even "Xi"/"Bo"/"Ola" are in `truncated`
  (99 entries at 2-phone, 115 at 1-phone-small).
- awkward-14 game running: undo bar "Ostatnio: Krzysztof-Maksymilian Brzęczysz…" -- the event itself (goal/own goal, from where)
  is cut, which is exactly what the user must read before tapping "Cofnij".
- Potato title in league stats (awkward-05): "8 dni jako ziemniak" next to three names (Bo, Żaneta, Tomasz) -- 8 is Bo's
  value only (potato view shows 8/6/3). Value reads as shared.
- Counts disagree: league switcher "7 graczy · 31 meczów" (23) vs stats "30 Mecze" (05) and "Statystyki ligi 30 meczów" (04);
  awkward: "122 mecze" (awkward-13) vs "120 meczów"/"120 Mecze"; stats "13 Gracze" vs "Gracze 16".
- Grammar: profile achievements "3 wygranych z rzędu" (11-profile, awkward-07): pl.json line 437 `"{n} wygranych z rzędu"`
  has no plural (3 needs "wygrane"). Line-final single-letter "z" (orphan) in the same tiles.
- Day headers: "Dziś, środa…", "Wczoraj, wtorek…" capitalised but "poniedziałek, 12 października" lower case (04, 13, 15).
- Games list: one row (04 "Darek Ala 8:5", awkward-04 "15:13") has a lighter background with no legend; overall ranking
  (17) highlights Ala's row with no "Ty" label, while awkward-01 shows a "Ty" pill. Unexplained highlights.
- Form dots (●○) in ranking rows and profile have no legend and no colour; which end is newest is not said.
- Two overflow menus side by side on the tournament page (kebab + hamburger, 07) and the finished game (kebab only,
  no hamburger) -- header right side differs per page.
- Stat presentation differs: league stats tiles = value over label (05), profile stats = lower-case label over value without
  tile (12), "Zasady" table repeats units per cell while "Partnerzy" uses header row (awkward-08).
- New game (25): rule chips "Do 5/Do 8/Do 10" 53x36 px (audit `small`), unselected chips have nearly no fill; big empty bands
  under "Zasady" label and above the chance panel.
- Game screen running (27): after the first goal nothing on screen says where to tap to record a goal (the hint
  `game.firstStep.*` exists in pl.json but is not visible at 2:3); "Pozycja" chip label is ambiguous (it is the goal-detail level).
- Paused (28): decorative yellow pause disc above the yellow "Wznów" -- two yellow things, one not tappable.
- App menu on the Leagues page (22) repeats the page ("Wszystkie ligi", "Ranking ogólny"); league switcher (23) uses a "+" icon
  for "Wszystkie ligi" (plus reads as "add").
- Leagues page (20): league tiles inconsistent (WWG has no tile fill, B has one; Biuro card lighter) and subtitles mix grey
  meta with bold white live-game text.
- Finished tournament game (awkward-12): the primary is just "Turniej" (ambiguous verb-less label).
