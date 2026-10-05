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
  await choose(page.getByRole('radio', { name: 'Gracze' }));
  await choose(page.getByRole('radio', { name: 'Elo' }));
  // Players below the threshold are plain links after the ranked rows.
  const profiles = await page
    .locator('fl-ranking a.row, fl-ranking .others a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  for (const href of profiles) {
    const player = href.split('/').at(-1)!;
    await page.goto(href);
    await keepProfile(page, `profile in league: ${player}`, keep);
    await page.goto(`#/player/${player}`);
    await keepProfile(page, `profile overall: ${player}`, keep);
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

/** The ranking as players (Elo, win %), potatoes and pairs. */
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
      await choose(option);
      await keep(`${prefix}: ranking ${key}`, ranking);
    }
    if (key === 'win rate') {
      await choose(page.getByRole('radio', { name: 'Elo' }));
    } else if (key === 'potato') {
      await choose(page.getByRole('radio', { name: 'Gracze' }));
    }
  }
}

/** Every part of a profile: overview, statistics and games. */
async function keepProfile(
  page: Page,
  prefix: string,
  keep: (key: string, locator: Locator) => Promise<void>,
): Promise<void> {
  await expect(page.locator('main .hero')).toBeVisible();
  for (const [key, name] of [
    ['overview', 'Przegląd'],
    ['stats', 'Statystyki'],
    ['games', 'Mecze'],
  ]) {
    await page.getByRole('tab', { name }).click();
    await keep(`${prefix} ${key}`, page.locator('main'));
  }
}

/** Picks an option of a switch and waits until the page shows it. */
async function choose(option: Locator): Promise<void> {
  await option.click();
  await expect(option).toHaveAttribute('aria-checked', 'true');
}
