import { expect, Page, test } from '@playwright/test';

import {
  addPlayers,
  chooseFormat,
  createLeague,
  goal,
  newPlay,
  pickTeams,
  players,
  shot,
  t,
  tag,
  win,
  winAs,
} from './helpers';

const TOURNAMENT_URL = /#\/l\/[^/]+\/t\/[^/]+$/;

test('an open tournament: teams picked for each game, the table and a one-tap rematch', async ({
  page,
}) => {
  const id = tag();
  const [a, b, c, d] = players(id);
  await createLeague(page, `E2E otwarty ${id}`);
  await addPlayers(page, [a, b, c, d]);

  await newPlay(page, 'tournament');
  const setup = page.locator('fl-tournament-new-dialog');
  await shot(page, 'tournament-formats');
  await chooseFormat(page, 'open');
  await expect(
    setup.getByRole('heading', { name: t('tournament.players', { n: 4 }) }),
  ).toBeVisible();
  await shot(page, 'tournament-new-open');
  await setup.getByRole('button', { name: t('tournament.start') }).click();
  await expect(page).toHaveURL(TOURNAMENT_URL);

  await page.getByRole('button', { name: t('league.newGame') }).click();
  const dialog = await pickTeams(page, { red: [a, b], blue: [c, d] });
  await dialog.getByRole('button', { name: t('newGame.start') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await win(page, c);

  // The scoring device goes back to the tournament.
  await expect(page).toHaveURL(TOURNAMENT_URL);
  await expect(page.locator('table.table tr.first')).toHaveCount(2);
  await expect(page.locator('table.table tr.first').first()).toContainText(/Celina|Darek/);
  await shot(page, 'tournament-open-table');

  await page.getByRole('button', { name: t('game.rematch') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await win(page, a);
  await expect(page).toHaveURL(TOURNAMENT_URL);
  await expect(page.locator('fl-game-list a.game')).toHaveCount(2);
});

test('a series from "+": best of 3 with colours swapped, then its winner', async ({ page }) => {
  const id = tag();
  const [a, b, c, d] = players(id);
  await createLeague(page, `E2E seria ${id}`);
  await addPlayers(page, [a, b, c, d]);

  await newPlay(page, 'series');
  const dialog = await pickTeams(page, { red: [a, b], blue: [c, d] });
  await expect(dialog.getByRole('heading', { name: t('newGame.seriesTitle') })).toBeVisible();
  await dialog.getByRole('button', { name: t('newGame.startSeries') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await win(page, a);

  await expect(page).toHaveURL(TOURNAMENT_URL);
  const card = page.locator('.card.series');
  await expect(card.locator('.vs')).toHaveText('1 : 0');
  await card.getByRole('button', { name: t('tournament.startGame', { n: 2 }) }).click();
  await expect(page).toHaveURL(/#\/game\//);
  // Game 2: the teams swap colours, Ala's team plays blue.
  await expect(
    page.getByRole('region', { name: `${t('team.blue')}, ${t('position.defence')}` }),
  ).toContainText(a);
  await win(page, a);

  await expect(page).toHaveURL(TOURNAMENT_URL);
  await expect(card.locator('.vs')).toHaveText('2 : 0');
  await expect(card).toContainText(t('tournament.seriesWinner', { name: `${a} & ${b}` }));
  // A decided series ends by itself, with a summary of its games.
  await expect(page.locator('.note')).toContainText(t('tournament.ended'));
  await expect(page.locator('fl-tournament-summary')).toContainText(t('tournamentStats.scorer'));
  await expect(page.getByRole('button', { name: t('tournament.finish') })).toHaveCount(0);
  await shot(page, 'series-won');

  // The tournaments tab lists it as finished, with its winners.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.tournaments') })
    .click();
  await expect(page.locator('.tournament .winners')).toContainText(`${a} & ${b}`);
  await shot(page, 'league-tournaments');
});

test('an open tournament: cancelling a new game and removing a running one stay in it', async ({
  page,
}) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E usuń ${id}`);
  await addPlayers(page, [a, b]);
  await newPlay(page, 'tournament');
  await chooseFormat(page, 'open');
  await page
    .locator('fl-tournament-new-dialog')
    .getByRole('button', { name: t('tournament.start') })
    .click();
  await expect(page).toHaveURL(TOURNAMENT_URL);
  const tournament = page.url();

  await page.getByRole('button', { name: t('league.newGame') }).click();
  await page
    .locator('fl-game-new-dialog')
    .getByRole('button', { name: t('common.cancel') })
    .click();
  await expect(page.locator('fl-game-new-dialog')).toBeHidden();
  expect(page.url()).toBe(tournament);

  await page.getByRole('button', { name: t('league.newGame') }).click();
  const dialog = await pickTeams(page, { red: [a], blue: [b] });
  await dialog.getByRole('button', { name: t('newGame.start') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await goal(page, a);
  page.once('dialog', (confirm) => confirm.accept());
  await page.locator('header.top button.more').click();
  await page.getByRole('menuitem', { name: t('game.remove') }).click();
  await expect(page).toHaveURL(TOURNAMENT_URL);
  await expect(page.locator('fl-leave-dialog')).toHaveCount(0);
  await expect(page.locator('fl-game-list a.game')).toHaveCount(0);
});

/** Sets up a one-on-one tournament of everyone in the league, in a format with fixed teams. */
async function oneOnOne(page: Page, format: 'cup' | 'roundRobin'): Promise<void> {
  await newPlay(page, 'tournament');
  const setup = page.locator('fl-tournament-new-dialog');
  await chooseFormat(page, format);
  await setup.getByRole('option', { name: t('newGame.mode1v1') }).click();
  await setup.getByRole('button', { name: t('tournament.everyone') }).click();
  await shot(page, `tournament-new-${format}`);
  await setup.getByRole('button', { name: t('tournament.start') }).click();
  await expect(page).toHaveURL(TOURNAMENT_URL);
}

/** Plays the fixtures offered on the tournament page, red winning each, until none is left. */
async function playAll(page: Page, games: number): Promise<void> {
  for (let i = 0; i < games; i++) {
    await page
      .getByRole('button', { name: t('tournament.play') })
      .first()
      .click();
    await expect(page).toHaveURL(/#\/game\//);
    await winAs(page, 'red');
    await expect(page).toHaveURL(TOURNAMENT_URL);
  }
}

test('a cup of three ends by itself when the final is won', async ({ page }) => {
  const id = tag();
  await createLeague(page, `E2E puchar ${id}`);
  await addPlayers(page, players(id).slice(0, 3));
  await oneOnOne(page, 'cup');
  await expect(page.locator('#cup-bracket .match').first()).toBeVisible();
  await shot(page, 'cup-start');

  await playAll(page, 2);
  await expect(page.locator('.note')).toContainText(t('tournament.ended'));
  await expect(page.getByRole('button', { name: t('tournament.finish') })).toHaveCount(0);
  await expect(page.getByRole('button', { name: t('tournament.play') })).toHaveCount(0);
  await shot(page, 'cup-won');
});

test('a round robin ends by itself when every fixture is played', async ({ page }) => {
  const id = tag();
  await createLeague(page, `E2E każdy ${id}`);
  await addPlayers(page, players(id).slice(0, 3));
  await oneOnOne(page, 'roundRobin');

  await playAll(page, 2);
  await expect(page.locator('.note')).toHaveCount(0);
  await playAll(page, 1);
  await expect(page.locator('.note')).toContainText(t('tournament.ended'));
  await expect(page.locator('table.table tbody tr')).toHaveCount(3);
  await shot(page, 'round-robin-done');
});
