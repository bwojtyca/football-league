import { expect, test } from '@playwright/test';

import { addPlayers, createLeague, goal, players, shot, startGame, t, tag, win } from './helpers';

test('statistics: the league, two players compared, a profile and a game against the league', async ({
  page,
}) => {
  const id = tag();
  const [a, b, c, d] = players(id);
  await createLeague(page, `E2E statystyki ${id}`);
  await addPlayers(page, [a, b, c, d]);

  // Two games with a log: Ala's team wins 8:0, then Darek's team wins 8:1.
  await startGame(page, { red: [a, b], blue: [c, d] });
  await win(page, a);
  await page
    .locator('fl-game-new-dialog')
    .getByRole('button', { name: t('common.cancel') })
    .click();
  await startGame(page, { red: [a, b], blue: [c, d] });
  await goal(page, a);
  await win(page, d);
  await page
    .locator('fl-game-new-dialog')
    .getByRole('button', { name: t('common.cancel') })
    .click();

  // The league's statistics, next to its list of games.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  await page.getByRole('link', { name: t('leagueStats.stats') }).click();
  await expect(page).toHaveURL(/\/stats$/);
  const stats = page.locator('fl-league-stats');
  await expect(stats.getByRole('heading', { name: t('leagueStats.numbers') })).toBeVisible();
  await expect(stats.locator('.fl-tiles').first()).toContainText('2');
  await expect(stats.locator('table.heat')).toBeVisible();
  await expect(stats.getByRole('heading', { name: t('leagueStats.records') })).toBeVisible();
  await expect(stats.locator('.fl-records dt')).toContainText([t('leagueStats.longest')]);
  await expect(stats.getByRole('option')).toHaveCount(4);
  await expect(stats.getByRole('heading', { name: t('leagueStats.goalTimes') })).toBeVisible();
  await expect(stats.getByRole('heading', { name: t('titles.title') })).toBeVisible();
  await expect(stats.locator('fl-titles-list dt').first()).toContainText(t('titles.leader.name'));
  await shot(page, 'stats-league');
  await stats.getByRole('option', { name: d }).click();
  await expect(stats.locator('mat-chip-option', { hasText: d })).toHaveClass(
    /mat-mdc-chip-selected/,
  );
  await page.locator('fl-league-stats canvas').last().scrollIntoViewIfNeeded();
  await shot(page, 'stats-league-elo');

  // Ala against Darek, from Ala's profile.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.ranking') })
    .click();
  await expect(page.locator('fl-ranking .title').first()).toBeVisible();
  // Nothing going on: the league's page names the last game and offers a rematch.
  await expect(page.locator('fl-now-card')).toContainText(t('now.quiet'));
  await shot(page, 'stats-ranking-titles');
  // On a computer: the ranking on the left, the league's "now" on the right.
  const phone = page.viewportSize()!;
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('aside.side fl-now-card')).toBeVisible();
  await shot(page, 'desktop-league');
  await page.setViewportSize(phone);
  // The potato of the day: today's four players, the worst one first.
  await page.getByRole('radio', { name: t('potato.title') }).click();
  await expect(page.locator('.potato-today li')).toHaveCount(4);
  await shot(page, 'stats-potato-today');
  await page.getByRole('radio', { name: t('league.players') }).click();
  const elo = page.getByRole('radio', { name: 'Elo' });
  await elo.click();
  await expect(elo).toHaveAttribute('aria-checked', 'true');
  await page.locator('fl-ranking').getByText(a).click();
  await expect(page.locator('main .hero')).toBeVisible();
  await expect(page.getByRole('heading', { name: t('achievements.mishaps') })).toBeVisible();
  await expect(page.locator('.achievements li.earned').first()).toBeVisible();
  await shot(page, 'profile-overview');
  await page.getByRole('tab', { name: t('player.tabs.stats') }).click();
  await expect(page.getByRole('heading', { name: t('stats.moments') })).toBeVisible();
  await page.getByRole('heading', { name: t('stats.moments') }).scrollIntoViewIfNeeded();
  await shot(page, 'stats-profile');
  await page.getByRole('tab', { name: t('player.tabs.overview') }).click();
  await page.getByRole('button', { name: t('compare.with') }).click();
  await page.getByRole('menuitem', { name: d }).click();
  await expect(page).toHaveURL(/\/compare\/[^/]+\/[^/]+$/);
  await expect(page.locator('p.score')).toHaveText('1 : 1');
  await expect(page.getByText(t('compare.neverTogether'))).toBeVisible();
  await shot(page, 'stats-compare');

  // A game against the league's other games.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.games') })
    .click();
  await page.locator('fl-game-list a.game').last().click();
  await expect(page).toHaveURL(/#\/game\//);
  // A finished game shows how it went and where it stands, right on its page.
  const sheet = page.locator('fl-game-timeline');
  await expect(sheet.getByRole('heading', { name: t('facts.title') })).toBeVisible();
  await expect(sheet.locator('.facts.league li').last()).toContainText(':');
  await shot(page, 'stats-game-facts');
});
