import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, Locator, Page, test } from '@playwright/test';

/**
 * Everything the app shows of the 2017 league, as text: its entry on the leagues page, every
 * ranking view, each player's profile in it and overall, its games and the overall ranking.
 * Taken before and after the 2017 migration, the two files must be the same.
 */
const LEAGUE = 'Najdroższa Liga Świata';
const OUT = join(__dirname, '..', 'snapshots');

test('what the app shows of the 2017 league', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  const shown: Record<string, string> = {};
  const keep = async (key: string, locator: Locator) => {
    shown[key] = (await locator.innerText()).trim();
  };

  await page.goto('#/leagues');
  const link = page.getByRole('link', { name: LEAGUE });
  await expect(link).toHaveCount(1);
  await keep('leagues: entry', link);
  await link.click();
  const rows = page.locator('fl-ranking a.row');
  await expect(rows.first()).toBeVisible();
  await keep('league: page', page.locator('main'));
  await page.screenshot({ path: join(OUT, 'league.png'), fullPage: true });
  await rankingViews(page, 'league', keep);

  // Each player's profile in the league and overall.
  await page.getByRole('radio', { name: 'Gracze' }).click();
  await page.getByRole('radio', { name: 'Elo' }).click();
  const profiles = await rows.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  );
  for (const href of profiles) {
    const player = href.split('/').at(-1)!;
    await page.goto(href);
    await expect(page.locator('main .hero')).toBeVisible();
    await keep(`profile in league: ${player}`, page.locator('main'));
    await page.goto(`#/player/${player}`);
    await expect(page.locator('main .hero')).toBeVisible();
    await keep(`profile overall: ${player}`, page.locator('main'));
  }

  await page.goto('#/leagues');
  await page.getByRole('link', { name: LEAGUE }).click();
  await page.locator('nav.tabs').getByRole('link', { name: 'Mecze' }).click();
  await expect(page.locator('fl-game-list a.game').first()).toBeVisible();
  await keep('league: games', page.locator('main'));

  await page.goto('#/ranking');
  await expect(rows.first()).toBeVisible();
  await rankingViews(page, 'overall', keep);

  const name = process.env['SNAPSHOT'] ?? new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(shown, null, 2));
  console.log(`${Object.keys(shown).length} views saved as ${name}.json`);
});

/** The ranking as players (Elo, win %, potato) and as pairs. */
async function rankingViews(
  page: Page,
  prefix: string,
  keep: (key: string, locator: Locator) => Promise<void>,
): Promise<void> {
  const ranking = page.locator('fl-ranking');
  await keep(`${prefix}: ranking elo`, ranking);
  for (const [key, name] of [
    ['win rate', '% wygranych'],
    ['potato', 'Ziemniak'],
    ['pairs', 'Duety'],
  ]) {
    const option = page.getByRole('radio', { name });
    if (await option.isEnabled()) {
      await option.click();
      await keep(`${prefix}: ranking ${key}`, ranking);
    }
    if (key !== 'pairs') {
      await page.getByRole('radio', { name: 'Elo' }).click();
    }
  }
}
