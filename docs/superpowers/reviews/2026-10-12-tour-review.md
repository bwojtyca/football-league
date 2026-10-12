# Review of every screen (12 Oct 2026)

Source: the first Tour run (`.github/workflows/tour.yml`, run 38305130409): 28 screens, sheets
and dialogs at 360×640, 412×915, 820×1180, 1280×800 and 1920×1080, with lifelike data (seven
players, some in kits, 30 games, a game being played, a tournament, an empty league).
Re-run it with `gh workflow run tour.yml --ref <branch>` and download the `tour` artifact.

The owner's verdict (12 Oct): the UI a little under 7/10; the placement of content 2/10: "I
don't know if a user would know where to click to get something done, or what the app is for at
all, or how to reach the data they look for." This review agrees: the look is not the main
problem, the information architecture is.

## Scores

| Dimension | Score | In one line |
| --- | --- | --- |
| Visual system | 6/10 | A strong idea (the table at night), diluted by overuse of LED digits, felt and emoji. |
| Consistency | 5/10 | Lists, headings, actions and their places differ from screen to screen. |
| Readability | 6/10 | Main numbers read well; rows carry too many unexplained signals; small grey labels. |
| Information architecture | 3/10 | No "me", no purpose stated, a junk-drawer tab, data reachable only by knowing where. |

## What works

- The league page answers "who leads and what is going on now" (`01-league-ranking`).
- "+" → "What are we playing?" is clear (`24-new-play`); a game starts in three taps.
- Entering goals on the table is direct and fast (`27-game-running`); the finished game page
  tells a story (score, Elo changes, timeline, log; `16-game-finished`).
- No screen scrolls sideways at any size (checked on every shot).

## Information architecture (the main problem)

1. **The app never says what it is for.** The first screen is "Leagues" with "New league" as
   its main action and a search (`20-leagues`); someone opening a shared link lands in a
   ranking full of numbers and emoji. Nothing says "it keeps the score of your office
   foosball: who is best, your stats, tournaments".
2. **There is no "me".** Every personal question (where am I, how did I play, my games, my
   stats) needs: find yourself in the ranking, tap your name, pick a tab. The app does not know
   whose phone it is. A device-level "This is me" (pick your player once, kept on the phone, no
   sign-in or rules change) would give a "You" card on the league page, your row highlighted,
   "My games", a direct way to your profile. Canvas P61 "Kim jesteś" has the screen.
3. **The "League" tab is a junk drawer** (`08-league-hub`): the league's name again, players,
   settings, a share button. Its label says nothing about what is inside.
4. **Data hides behind switches and links that do not look like ways in:** league statistics
   behind "List | Statistics" in the Games tab (`04-games`, `05-league-stats`); profiles only by
   tapping a name; the overall ranking behind the gear (`22-app-menu`, which mixes language with
   navigation) and at the bottom of the leagues page; switching league behind the small chevron
   of the title (`23-league-switcher`).
5. **The league page puts controls before content**: two rows of segmented switches (Players |
   Pairs | Potato, then Order: Elo | Win %) before the first row of the ranking.
6. **Jargon without explanation**: "Duety", "Ziemniak", titles (Mur, Snajper, Weteran,
   Maratończyk, Zgrany duet) as emoji in every row, achievements and mishaps. Fun for the
   regulars, opaque for anyone new, and nothing explains them in place.
7. **Empty states do not lead anywhere** (`19-empty-league`): disabled switches, "No games yet:
   Ala, Bartek…", a black screen. No "Play your first game", no word on how the ranking forms.
8. **The new game dialog mixes the game with device settings** (`25-new-game`): goal detail and
   screen orientation every time, a cryptic ⇅ icon in its header; it scrolls on a phone.

## Consistency

- Lists come in four styles: ranking rows with rules (`01`), LED score cards (`04`), cards in a
  group (`08`, `10`), avatar rows with icons (`07` "In play").
- Headings: small grey kickers ("Teraz w lidze", "Liga") next to big bold ones ("Rekordy",
  "Przebieg meczu", "Tabela") for the same level of section.
- The main action moves: "Rematch" top right on a finished game (`16`), "Rematch" + "New game"
  under the title of a tournament (`07`), "+" in the bar elsewhere, "Koszulka" in the profile
  card, "Compare with…" in a row of its own (`11`).
- The felt (green) marks the table, the "now" card, the profile card, the league card, the
  overall ranking link and the finished game: it no longer means "the table".
- Locked achievements have dashed outlines (`11-profile`), against the no-outline rule.

## Readability

- A ranking row carries place, avatar, name, up to five emoji titles, W–L, main position, five
  form dots, Elo and its change (`01`): eight signals, no legend.
- LED digits everywhere (Elo, records, stat tiles, "0 h 19 min") lose their meaning and read
  worse than text; the zero looks like a diamond.
- 0.7–0.75 rem grey labels under numbers (`05`, `12`); the profile's statistics are long tables.
- Small phones: the end boards of the game screen are crowded with two players and their
  figures (`1-phone-small/27`).

## Larger screens

- Tablet (820) is the phone layout stretched: fine for lists, wasteful for the game screen.
- Desktop: the leagues page and the profile are a narrow column in a wide black page
  (`4-desktop/20`, `4-desktop/11`); the leagues page has no rail while the league pages do.

## Proposed direction (to design on the canvas, round 6, then build in steps)

1. **Say what the app is**: a first-visit welcome at `/` (what it does in three lines, "Join a
   league" by link or search, "Start a league"), and a short line on an empty league.
2. **"This is me" on the device** (no sign-in): pick your player once; the league page opens
   with "You: 2nd · 1520 (+12) · form"; your row is marked; "My games" in the games list; the
   profile is one tap away.
3. **Navigation that names what is inside**: League (home: now, you, the ranking's top,
   today's games, statistics teaser) · Games (list with filters: all, mine, today; statistics
   as a section, not a hidden switch) · + · Tournaments · Players or Me. League management
   (players, settings, share, switch league) in one sheet from the league's name. The app menu
   keeps language and the overall ranking, not leagues.
4. **Ranking: content first**: one compact selector (Elo | Win % | Pairs | Potato), rows with
   place, avatar, name, W–L, Elo and change; at most one title icon, a "What do the titles
   mean?" sheet.
5. **Explain the fun parts in place**: the potato's rules and the titles in a sheet one tap
   away; achievements show what was earned, the rest folded.
6. **Empty states with one action**: "Play your first game", "Add players", "Start a
   tournament".
7. **New game: the game first**: lineups, rules, Start; goal detail and screen orientation as
   device settings (remembered, changed on the game screen).
8. Visual polish after the structure: LED only for scores and clocks, felt only for the table
   and "now", one list style, one heading scale, emoji replaced by one icon set.
