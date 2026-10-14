# Design review rubric (independent evaluator)

Owner, 14 Oct 2026: "work until the design is at 8+; the evaluation should be done by a separate,
independent agent with rigorous criteria". This file is that agent's brief. The agent that
builds the app never scores it: each round a fresh evaluator (no memory of earlier rounds, no
access to earlier scores) reads this rubric and the Tour's screenshots and returns scores with
evidence. The builder fixes what was found, re-runs the Tour, and asks a new evaluator.

## What the evaluator gets

- Screenshots of every screen, sheet and dialog from the Tour workflow
  (`.github/workflows/tour.yml`, `e2e/tests/tour.spec.ts`) in five sizes: `1-phone-small`
  (360x640), `2-phone` (412x915), `3-tablet` (820x1180), `4-desktop` (1280x800), `5-wide`
  (1920x1080). `NN-*.png` use an ordinary league (7 players, 30 games); `awkward-*.png` (phone
  small, phone, desktop) use a league built to strain the layout (a 62-character name, 16
  players with very long and very short Polish names, 120 games, 15:13 games, one on one,
  timed, a game being played and one paused, a long tournament name). Full-page shots show the
  fixed bottom bar where the viewport ended: that is an artefact, not a bug.
- Next to every shot a `.json` audit: `lefts` (how many blocks start at each x position, with
  examples), `truncated` (texts cut by an ellipsis), `small` (tap targets under 40 px).
- The code (`src/`), the tokens (`src/styles.scss`), the texts (`public/i18n/pl.json`) and the
  owner's principles (`CLAUDE.md`). The app is in Polish; judge the Polish texts.

## The app in one paragraph

A foosball league app for friends at the office: record games by tapping figures on a drawn
table, an Elo ranking, statistics, tournaments, a "potato of the day". Phones first, used
standing next to the table; no accounts. A first-time user should understand what it is for,
find their league, see where they stand, start a game in at most 3 taps.

## How to score

Score each dimension from 10 down: subtract for every distinct problem found, by severity.

| Severity | Deduction | Meaning |
| --- | --- | --- |
| Blocker | 2 | Misleads, hides or breaks something a user needs (unreadable text, overlapping or cut content that carries meaning, a dead end, an action that cannot be found). |
| Major | 1 | Clearly hurts use or trust (inconsistent placement of a main action, a screen without a clear first step, a layout that falls apart at one size, text under 4.5:1 contrast for body copy). |
| Minor | 0.5 | Polish a professional would ask for before shipping (uneven spacing, a misaligned edge, an orphan word, an inconsistent label). |
| Nit | 0.25 | Taste or tiny detail; at most 1 point of nits per dimension. |

Count the same problem once per dimension, however many screens show it (say how many).
Do not give credit for intentions, history or what the code "means to do": only what the
screenshots show. A score of 8 means: a professional product designer would ship it with only
minor notes; nothing misleads, nothing is hard to find, every size holds together.

Hard thresholds (each violation is at least a Major):
- Text contrast (WCAG 2.2): body text 4.5:1, large text (≥ 24 px, or ≥ 18.7 px bold) and
  icons that carry meaning 3:1. Compute from the tokens when in doubt.
- Tap targets: 44x44 px (Apple) / 48 dp (Material) recommended; under 40 px for a primary or
  frequent control is a Major, inline text links in running text are exempt.
- Body text at least 14 px; labels under 12 px only for secondary metadata.
- No horizontal scroll of the page; no text overlapping other text or controls.
- One primary action per screen, styled as the primary (the yellow "ball").

## Dimensions

1. **Visual hierarchy and system** — is it clear what matters most on each screen? Are type
   sizes, weights, colours and surfaces used with a consistent meaning (the yellow ball for
   the main action, LED digits for scores and clocks, green felt for the table and "now")?
2. **Consistency** — the same thing looks and sits the same everywhere: headers, back and close
   buttons, lists, cards, pills, empty states, dialogs, spacing scale, corner radii, left
   edges (use the `lefts` audit: a page should have few distinct left edges).
3. **Readability** — text size, contrast, line length, truncation (use `truncated`: cut text
   that carries meaning is a problem, cut decoration is not), number formatting, density.
   Judge the awkward league especially.
4. **Information architecture and flow** — does a newcomer understand what the app is for?
   Can a player find their place, their games, a profile, the statistics, a tournament, the
   league's settings, another league? Are names of tabs and buttons clear? Are there dead ends
   or duplicated paths? Is starting a game obvious?
5. **Responsiveness** — does every size use its space well (no stretched phone column on a
   wide screen with empty halves, no cramped phone)? Judge each size; the dimension's score is
   driven by the worst size.
6. **Robustness to real data** — long and short names, many players and games, empty and
   paused states, ties, players without games: nothing breaks, overlaps or reads wrong.

## What to return

1. A table: dimension, score (one decimal), the deductions that made it (severity, one line,
   the screenshot files that show it).
2. The ten most important problems across dimensions, most severe first, each with: what is
   wrong, where (files), why it matters, a concrete fix.
3. An overall score: the lowest dimension score (the product is as good as its weakest part),
   and the mean for information.
4. Anything you could not judge from the material, said plainly.

Be strict and specific. Vague praise or vague criticism is useless; every point needs a file.
