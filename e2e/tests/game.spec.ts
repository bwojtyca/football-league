import { expect, test } from '@playwright/test';

import {
  addPlayers,
  createLeague,
  goal,
  players,
  score,
  shot,
  startGame,
  t,
  tag,
} from './helpers';

test('a game: goals, undo, a swap, an own goal, pause, leaving, the finish and a rematch', async ({
  page,
}) => {
  const id = tag();
  const [a, b, c, d] = players(id);
  await createLeague(page, `E2E mecz ${id}`);
  await addPlayers(page, [a, b, c, d]);
  await startGame(page, { red: [a, b], blue: [c, d] });

  const bar = page.locator('footer.bar');
  await expect(bar).toContainText(t('game.event.none'));
  await goal(page, a);
  await expect(score(page)).toHaveText('1:0');
  await expect(bar).toContainText(
    t('game.event.goal', { name: a, from: t('position.fromDefence') }),
  );
  await bar.getByRole('button', { name: t('game.undo'), exact: true }).click();
  await expect(score(page)).toHaveText('0:0');
  await expect(bar).toContainText(t('game.event.none'));

  // Red swap positions: Ala goes to attack.
  await page.getByRole('button', { name: `${t('game.swap')}: ${t('team.red')}` }).click();
  await expect(bar).toContainText(t('game.event.swap', { team: t('team.red') }));
  await goal(page, a);
  await expect(bar).toContainText(
    t('game.event.goal', { name: a, from: t('position.fromOffence') }),
  );
  await page.getByRole('button', { name: t('game.ownGoalAria', { name: c }), exact: true }).click();
  await expect(score(page)).toHaveText('2:0');
  await shot(page, 'game-running');

  await page.getByRole('button', { name: t('game.pause'), exact: true }).click();
  const overlay = page.locator('fl-pause-overlay');
  await expect(overlay).toBeVisible();
  await shot(page, 'game-paused');
  await overlay.getByRole('button').click();
  await expect(overlay).toBeHidden();

  // Leaving a running game asks first.
  const back = page.locator('header.top').getByRole('link', { name: t('common.back') });
  const leave = page.locator('fl-leave-dialog');
  await back.click();
  await leave.getByRole('button', { name: t('game.leaveStay') }).click();
  await expect(page).toHaveURL(/#\/game\//);
  await back.click();
  await leave.getByRole('button', { name: t('game.leavePause') }).click();
  await expect(page).toHaveURL(/#\/l\/[^/]+$/);
  await page.locator('fl-today-card').getByRole('link', { name: t('today.playing') }).click();
  await expect(overlay).toBeVisible();
  await overlay.getByRole('button').click();

  await page.getByRole('button', { name: t('game.rotate') }).click();
  expect(await page.evaluate(() => localStorage.getItem('fl.rotation'))).toBe('1');
  await shot(page, 'game-rotated');

  await goal(page, a, 6);
  const finish = page.locator('fl-finish-panel');
  await expect(finish).toContainText(t('game.wins', { team: t('team.red') }));
  await expect(score(page)).toHaveText('8:0');
  await shot(page, 'game-finish');
  await finish.getByRole('button', { name: t('game.undoLast') }).click();
  await expect(finish).toBeHidden();
  await expect(score(page)).toHaveText('7:0');
  await goal(page, a);
  await finish.getByRole('button', { name: t('game.next') }).click();

  // The device that scored the last goal offers a rematch with the same teams.
  const rematch = page.locator('fl-game-new-dialog');
  await expect(rematch).toBeVisible();
  await expect(rematch.locator('.summary .matchup')).toContainText(`${b} & ${a}`);
  await shot(page, 'game-rematch');
  await rematch.getByRole('button', { name: t('common.cancel') }).click();
  await expect(page).toHaveURL(/#\/l\/[^/]+$/);

  await page.locator('nav.tabs').getByRole('link', { name: t('nav.games') }).click();
  await expect(page.locator('fl-game-list a.game')).toHaveCount(1);
  await expect(page.locator('fl-game-list a.game .score')).toHaveText('8:0');
});

test('one on one, and a game that is removed while it runs', async ({ page }) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E 1na1 ${id}`);
  await addPlayers(page, [a, b]);
  await startGame(page, { red: [a], blue: [b] });
  await goal(page, b, 2);
  await expect(score(page)).toHaveText('0:2');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('header.top button.more').click();
  await page.getByRole('menuitem', { name: t('game.remove') }).click();
  // Removing a running game offers a new one instead.
  await expect(page.locator('fl-game-new-dialog')).toBeVisible();
  await page.locator('fl-game-new-dialog').getByRole('button', { name: t('common.cancel') }).click();
  await expect(page).toHaveURL(/#\/l\/[^/]+$/);
  await page.locator('nav.tabs').getByRole('link', { name: t('nav.games') }).click();
  await expect(page.locator('fl-game-list a.game')).toHaveCount(0);
});
