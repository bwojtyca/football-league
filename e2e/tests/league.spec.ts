import { expect, test } from '@playwright/test';

import {
  addPlayers,
  createLeague,
  newPlay,
  players,
  shot,
  startGame,
  t,
  tag,
  win,
} from './helpers';

test('a new league: players, the bottom navigation, language and the league switcher', async ({
  page,
}) => {
  const id = tag();
  const name = `E2E liga ${id}`;
  await createLeague(page, name);
  await addPlayers(page, players(id).slice(0, 2));
  await shot(page, 'league-ranking');

  const nav = page.locator('nav.tabs');
  await nav.getByRole('link', { name: t('nav.games') }).click();
  await expect(page).toHaveURL(/\/games$/);
  await nav.getByRole('link', { name: t('nav.tournaments') }).click();
  await expect(page).toHaveURL(/\/tournaments$/);
  await nav.getByRole('link', { name: t('nav.league') }).click();
  await expect(page).toHaveURL(/\/more$/);
  await shot(page, 'league-hub');

  await page.getByRole('radio', { name: 'English' }).click();
  await expect(nav.getByRole('link', { name: 'Games' })).toBeVisible();
  await page.getByRole('radio', { name: 'Polski' }).click();
  await expect(nav.getByRole('link', { name: t('nav.games') })).toBeVisible();

  await nav.getByRole('link', { name: t('nav.ranking') }).click();
  // On a wide screen the league's sections move to a rail on the left.
  const phone = page.viewportSize()!;
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('nav.rail')).toBeVisible();
  await expect(nav).toBeHidden();
  await shot(page, 'desktop');
  await page.setViewportSize(phone);
  await page.getByRole('button', { name: t('switcher.open', { name }) }).click();
  const switcher = page.locator('fl-league-switcher');
  await expect(switcher.getByText(name)).toBeVisible();
  await switcher.getByRole('link', { name: t('switcher.manage') }).click();
  await expect(page).toHaveURL(/#\/leagues$/);
  await expect(page.getByRole('link', { name })).toBeVisible();
  await shot(page, 'leagues');
  await page.getByRole('button', { name: t('leagues.new') }).click();
  await page.locator('fl-league-new-dialog').getByLabel(t('leagues.name')).fill('Biuro 2026');
  await page.getByRole('button', { name: t('leagueNew.next') }).click();
  await shot(page, 'league-new');
});

test('the language can be switched on the leagues page', async ({ page }) => {
  await page.goto('/#/leagues');
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Leagues', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Polski' }).click();
  await expect(page.getByRole('heading', { name: t('leagues.title'), exact: true })).toBeVisible();
});

test('cancelling a new game from "+" stays on the page', async ({ page }) => {
  const id = tag();
  await createLeague(page, `E2E anuluj ${id}`);
  await addPlayers(page, players(id).slice(0, 2));
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  await newPlay(page, 'game');
  await page
    .locator('fl-game-new-dialog')
    .getByRole('button', { name: t('common.cancel') })
    .click();
  await expect(page.locator('fl-game-new-dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/games$/);
});

test('restoring a league with its games leaves a game deleted on its own deleted', async ({
  page,
}) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E przywróć ${id}`);
  await addPlayers(page, [a, b]);
  for (let i = 0; i < 2; i++) {
    await startGame(page, { red: [a], blue: [b] });
    await win(page, a);
    await page
      .locator('fl-game-new-dialog')
      .getByRole('button', { name: t('common.cancel') })
      .click();
  }
  const nav = page.locator('nav.tabs');
  const games = page.locator('fl-game-list a.game');
  await nav.getByRole('link', { name: t('nav.games') }).click();
  await expect(games).toHaveCount(2);

  // One game deleted on its own...
  await games.first().click();
  page.once('dialog', (confirm) => confirm.accept());
  await page.locator('header.top button.more').click();
  await page.getByRole('menuitem', { name: t('game.remove') }).click();
  await expect(page.locator('.deleted-note')).toBeVisible();
  await page.goBack();
  await expect(games).toHaveCount(1);

  // ...then the league with its games, and back again.
  await nav.getByRole('link', { name: t('nav.league') }).click();
  await page.getByRole('link', { name: t('settings.title') }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await shot(page, 'league-settings');
  await page.getByRole('button', { name: t('settings.archiveOrDelete') }).click();
  const dialog = page.locator('fl-league-delete-dialog');
  await dialog.getByRole('radio').last().check();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: t('settings.delete') }).click();
  await expect(page).toHaveURL(/#\/leagues$/);
  await page.getByRole('button', { name: t('game.undo') }).click();
  await page.getByRole('link', { name: `E2E przywróć ${id}` }).click();
  await nav.getByRole('link', { name: t('nav.games') }).click();
  await expect(games).toHaveCount(1);
});
