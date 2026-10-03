import { expect, Page, test } from '@playwright/test';

import {
  addPlayers,
  createLeague,
  goal,
  newPlay,
  pickTeams,
  players,
  shot,
  t,
  tag,
  win,
} from './helpers';

/** An open tournament of two players with one game won by the first, 8:0. */
async function openTournamentWithAGame(page: Page, a: string, b: string): Promise<string> {
  await newPlay(page, 'tournament');
  await page
    .locator('fl-tournament-new-dialog')
    .getByRole('button', { name: t('tournament.start') })
    .click();
  await expect(page).toHaveURL(/\/t\/[^/]+$/);
  const url = page.url();
  await page.getByRole('button', { name: t('league.newGame') }).click();
  const dialog = await pickTeams(page, { red: [a], blue: [b] });
  await dialog.getByRole('button', { name: t('newGame.start') }).click();
  await win(page, a);
  await expect(page).toHaveURL(url);
  return url;
}

async function menu(page: Page, item: string): Promise<void> {
  await page
    .locator('fl-top-bar')
    .getByRole('button', { name: t('common.menu') })
    .click();
  await page.getByRole('menuitem', { name: item }).click();
}

test('a running tournament: a new name and rules for its next games; deleted with its games and restored', async ({
  page,
}) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E edycja ${id}`);
  await addPlayers(page, [a, b]);
  const url = await openTournamentWithAGame(page, a, b);

  await menu(page, t('tournament.edit'));
  const edit = page.locator('fl-tournament-edit-dialog');
  await edit.getByLabel(t('tournament.nameLabel')).fill(`Finał ${id}`);
  await edit.getByRole('option', { name: t('modes.to', { target: 5 }) }).click();
  await shot(page, 'tournament-edit');
  await edit.getByRole('button', { name: t('common.save') }).click();
  await expect(page.locator('fl-top-bar h1')).toHaveText(`Finał ${id}`);
  await expect(page.locator('p.meta')).toContainText(t('modes.to', { target: 5 }));

  // The next game is played to 5; the first one keeps its 8 goals.
  await page.getByRole('button', { name: t('game.rematch') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await goal(page, a, 5);
  const finish = page.locator('fl-finish-panel');
  await expect(finish).toBeVisible();
  await finish.getByRole('button', { name: t('game.next') }).click();
  await expect(page).toHaveURL(url);
  await expect(page.locator('fl-game-list a.game .score')).toHaveText(['0:5', '8:0']);

  await menu(page, t('tournament.delete'));
  const remove = page.locator('fl-tournament-delete-dialog');
  await remove.getByRole('checkbox', { name: t('tournament.deleteGames', { n: 2 }) }).check();
  await shot(page, 'tournament-delete');
  await remove.getByRole('button', { name: t('tournament.delete') }).click();
  await expect(page).toHaveURL(/\/tournaments$/);
  await expect(page.getByText(`Finał ${id}`)).toHaveCount(0);
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  await expect(page.locator('fl-game-list a.game')).toHaveCount(0);

  await page.goto(url);
  await expect(page.locator('.note')).toContainText(t('tournament.deletedNote'));
  await page.getByRole('button', { name: t('common.restore') }).click();
  await expect(page.locator('fl-game-list a.game')).toHaveCount(2);
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.tournaments') })
    .click();
  await expect(page.getByText(`Finał ${id}`)).toBeVisible();
});

test('an ended tournament: renamed, then deleted without its games', async ({ page }) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E koniec ${id}`);
  await addPlayers(page, [a, b]);
  await openTournamentWithAGame(page, a, b);

  page.once('dialog', (confirm) => confirm.accept());
  await menu(page, t('tournament.finish'));
  await expect(page.locator('.note')).toContainText(t('tournament.ended'));

  await menu(page, t('tournament.edit'));
  const edit = page.locator('fl-tournament-edit-dialog');
  await expect(edit.locator('fl-mode-picker')).toHaveCount(0);
  await edit.getByLabel(t('tournament.nameLabel')).fill(`Po wszystkim ${id}`);
  await edit.getByRole('button', { name: t('common.save') }).click();
  await expect(page.locator('fl-top-bar h1')).toHaveText(`Po wszystkim ${id}`);

  await menu(page, t('tournament.delete'));
  await page
    .locator('fl-tournament-delete-dialog')
    .getByRole('button', { name: t('tournament.delete') })
    .click();
  await expect(page).toHaveURL(/\/tournaments$/);
  await expect(page.locator('.tournaments .empty')).toHaveText(t('tournament.none'));
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  await expect(page.locator('fl-game-list a.game')).toHaveCount(1);
});
