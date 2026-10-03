import { expect, test } from '@playwright/test';

import {
  addPlayers,
  createLeague,
  newPlay,
  pickTeams,
  players,
  shot,
  t,
  tag,
  win,
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
  await expect(setup.getByRole('heading', { name: t('tournament.players', { n: 4 }) })).toBeVisible();
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
  await shot(page, 'series-won');
});
