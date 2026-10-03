import { expect, test } from '@playwright/test';

import { addPlayers, createLeague, players, shot, t, tag } from './helpers';

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
