import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, Locator, Page } from '@playwright/test';

type Translations = { [key: string]: string | Translations };

const pl: Translations = JSON.parse(
  readFileSync(join(__dirname, '../../public/i18n/pl.json'), 'utf8'),
);

/** A Polish text of the app with its `{name}` placeholders filled in (no ICU plurals). */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = key
    .split('.')
    .reduce<string | Translations | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      pl,
    );
  if (typeof text !== 'string') {
    throw new Error(`No translation "${key}"`);
  }
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

/** A short random tag, so every scenario has a league and players of its own. */
export function tag(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Four player names unique to a scenario. */
export function players(id: string): [string, string, string, string] {
  return ['Ala', 'Bartek', 'Celina', 'Darek'].map((name) => `${name} ${id}`) as [
    string,
    string,
    string,
    string,
  ];
}

export async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(__dirname, '..', 'screenshots', `${name}.png`) });
}

/** Creates a league on the leagues page and returns its id. */
export async function createLeague(page: Page, name: string): Promise<string> {
  await page.goto('/#/leagues');
  await page.getByLabel(t('leagues.name')).fill(name);
  await page.getByRole('button', { name: t('leagues.create') }).click();
  await expect(page).toHaveURL(/#\/l\/[^/]+$/);
  return page.url().split('/l/')[1];
}

/** Adds new players from the league's ranking page. */
export async function addPlayers(page: Page, names: string[]): Promise<void> {
  const dialog = page.locator('fl-add-player-dialog');
  for (const name of names) {
    await page.getByRole('button', { name: t('league.addPlayer') }).click();
    await dialog.getByLabel(t('addPlayer.name')).fill(name);
    await dialog.getByRole('button', { name: t('addPlayer.add'), exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('fl-ranking').getByText(name)).toBeVisible();
  }
}

/** "+" in the bottom bar, then a game, a series or a tournament. */
export async function newPlay(page: Page, kind: 'game' | 'series' | 'tournament'): Promise<void> {
  await page.locator('nav.tabs button.play').click();
  await page
    .locator('fl-new-play-sheet button.option')
    .filter({ hasText: t(`play.${kind}`) })
    .click();
}

/** Defence, then offence; one name plays alone. */
export type Teams = Record<'red' | 'blue', [string] | [string, string]>;

/** Fills in the teams of the new game dialog. */
export async function pickTeams(page: Page, teams: Teams): Promise<Locator> {
  const dialog = page.locator('fl-game-new-dialog');
  for (const color of ['red', 'blue'] as const) {
    const [defence, offence] = teams[color];
    const team = dialog.locator(`.team--${color}`);
    const single = team.getByRole('checkbox', { name: t('newGame.onePlayer') });
    if (offence) {
      await single.uncheck();
    } else {
      await single.check();
    }
    await pick(page, team.getByLabel(t('position.defence')), defence);
    if (offence) {
      await pick(page, team.getByLabel(t('position.offence')), offence);
    }
  }
  return dialog;
}

async function pick(page: Page, input: Locator, name: string): Promise<void> {
  await input.fill(name);
  await page.getByRole('option', { name }).click();
  await expect(input).toHaveValue(name);
}

/** Starts a game from "+" and waits for the game screen. */
export async function startGame(page: Page, teams: Teams): Promise<void> {
  await newPlay(page, 'game');
  const dialog = await pickTeams(page, teams);
  await dialog.getByRole('button', { name: t('newGame.start') }).click();
  await expect(page).toHaveURL(/#\/game\/[^/]+$/);
}

/** The score at the top of the game screen, e.g. "3:1". */
export function score(page: Page): Locator {
  return page.locator('header.top .bug');
}

/** Scores goals for a player on the game screen (one playing alone has two goal buttons). */
export async function goal(page: Page, name: string, times = 1): Promise<void> {
  const button = page
    .getByRole('button', { name: t('game.goalAria', { name }), exact: true })
    .first();
  for (let i = 0; i < times; i++) {
    await button.click();
  }
}

/** Scores the goals a player needs to win a game to 8 at 0, then taps "Next". */
export async function win(page: Page, name: string, goals = 8): Promise<void> {
  await goal(page, name, goals);
  await next(page);
}

/** Red or blue wins a game to 8 at 0 (goals of its defender), then "Next". */
export async function winAs(page: Page, color: 'red' | 'blue'): Promise<void> {
  const goal = page
    .getByRole('region', { name: `${t(`team.${color}`)}, ${t('position.defence')}` })
    .locator('button.goal');
  for (let i = 0; i < 8; i++) {
    await goal.click();
  }
  await next(page);
}

async function next(page: Page): Promise<void> {
  const finish = page.locator('fl-finish-panel');
  await expect(finish).toBeVisible();
  await finish.getByRole('button', { name: t('game.next') }).click();
}
