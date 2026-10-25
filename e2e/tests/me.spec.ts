import { expect, test } from '@playwright/test';

import { addPlayers, createLeague, first, players, shot, startGame, t, tag, win } from './helpers';

test('"this is me" on the device: the question, the choice, the "You" card and the marked row', async ({
  page,
}) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E to ja ${id}`);
  await addPlayers(page, [a, b]);

  // Nobody chosen yet: the league asks.
  const card = page.locator('fl-you-card');
  await expect(card).toContainText(t('me.title'));
  await card.getByRole('button').click();
  const sheet = page.locator('fl-who-sheet');
  await sheet.getByRole('radio', { name: new RegExp(a) }).click();
  await shot(page, 'me-sheet');
  await sheet.getByRole('button', { name: t('me.confirm', { name: a }) }).click();
  await expect(sheet).toBeHidden();
  await expect(card).toContainText(`${t('me.you')} · ${a}`);

  // After a win: first place, the own row marked in the ranking.
  await startGame(page, { red: [a], blue: [b] });
  await win(page, a);
  await page
    .locator('fl-game-new-dialog')
    .getByRole('button', { name: t('common.cancel') })
    .click();
  await expect(page).toHaveURL(/#\/l\/[^/]+$/);
  await expect(card).toContainText(t('me.place', { n: 1 }));
  await expect(page.locator('fl-ranking .row.me')).toContainText(first(a));
  await shot(page, 'me-league');

  // The card opens the profile, which knows it is yours; the app menu says who plays here.
  await card.getByRole('link').click();
  await expect(page.locator('section.hero .you-tag')).toHaveText(t('me.you'));
  await page.goBack();
  await page.getByRole('button', { name: t('appMenu.open') }).click();
  await expect(page.locator('fl-app-menu fl-account')).toContainText(a.split(' ')[0]);
  await page.keyboard.press('Escape');
  await expect(page.locator('fl-app-menu')).toBeHidden();

  // Games: the statistics on top, and filters for mine, today's and tournament games.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  const games = page.locator('fl-game-list a.game');
  await page.getByRole('radio', { name: t('gameList.mine') }).click();
  await expect(games).toHaveCount(1);
  await page.getByRole('radio', { name: t('gameList.today') }).click();
  await expect(games).toHaveCount(1);
  await page.getByRole('radio', { name: t('gameList.tournament') }).click();
  await expect(page.locator('fl-game-list')).toContainText(t('gameList.noneTournament'));
  await shot(page, 'games-filters');
});
