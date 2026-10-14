# Independent evaluations

Each round: the Tour's shots, a fresh evaluator agent briefed with `rubric.md` only (no earlier
reviews or plans), its report saved as `eval-<n>.md`. Overall = the weakest dimension.

| Round | Date | Tour run | Hierarchy | Consistency | Readability | IA and flow | Responsive | Real data | Overall | Mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 14 Oct 2026 | 38458593413 (master 431a788) | 5.8 | 6.0 | 5.0 | 5.3 | 6.0 | 2.3 | 2.3 | 5.1 |

## Round 1: what to fix (from `eval-1.md`)

Blockers: the game screen's team boards lose players and goal counts with long names; duets
truncate the joined pair so the partner disappears. Majors: the game screen has no first step
and Undo is the only yellow; yellow marks far more than the one main action; the gear opens the
app menu while league settings hide behind the title; the Ranking tab shows no ranking above
the fold on a small phone; page titles cut names shown nowhere else; loss dots at 1.5:1; Elo
changes and losers' names on the felt below 4.5:1; the heatmap's legend says the opposite of
the colours; desktop game panel too small; 1920 px pages a 720 px column. Plus the minors listed
in the report.

## After round 1: fixed (14 Oct 2026, all on `master` at 8057c0e)

- Blockers: the end boards cut each name on its own (avatar and goals always shown); duets cut
  each name on its own.
- Majors: a first-step hint on the game screen and names on the rails upright; Undo tonal; one
  yellow per screen (links, tags, icons, "You", leader's Elo in ink; live = red; the "+" quiet
  on pages with their own main action); the gear opens the league's settings, the app menu has
  its own icon; a compact "now" row so the ranking shows on a small phone; long titles in two
  lines; loss dots as rings; Elo changes on dark chips and losers at 90% white on the felt;
  the heatmap's legend; the desktop game panel (clamp width, big score, 44 px controls); the
  page column and title share one width; two columns for statistics and profile from 1400 px.
- Minors: one dialog header (title on the content edge, close right, back left); Elo and Gole
  everywhere; one wording for "all leagues"; labels at 12 px+; shares add up to 100; no tab
  lit on settings; sheet titles alike; potato view without places, potatoes first; pairs with
  too few games under their own heading; records winners first; full name on the profile card;
  badges felt green, mishaps red; stronger scrim; one month = no chart; no repeated "running".

Round 2 runs on the Tour of 8057c0e (run 38569971370).
