import { expect, test } from '@playwright/test';

import { addPlayers, createLeague, newPlay, players, shot, t, tag } from './helpers';

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
  await nav.getByRole('link', { name: t('nav.more') }).click();
  await expect(page).toHaveURL(/\/more$/);

  await page.getByRole('radio', { name: 'English' }).click();
  await expect(nav.getByRole('link', { name: 'Games' })).toBeVisible();
  await page.getByRole('radio', { name: 'Polski' }).click();
  await expect(nav.getByRole('link', { name: t('nav.games') })).toBeVisible();

  await nav.getByRole('link', { name: t('nav.ranking') }).click();
  await page.getByRole('button', { name: t('switcher.open', { name }) }).click();
  const switcher = page.locator('fl-league-switcher');
  await expect(switcher.getByText(name)).toBeVisible();
  await switcher.getByRole('link', { name: t('switcher.manage') }).click();
  await expect(page).toHaveURL(/#\/leagues$/);
  await expect(page.getByRole('link', { name })).toBeVisible();
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
