import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, Page, test } from '@playwright/test';

import { tag } from './helpers';
import { create, DOCUMENTS, OWNER, read, update, Value } from './rest';

const SCRIPT = join(__dirname, '../../scripts/migrate-2017.mjs');
const NEW_LEAGUE_ID = readFileSync(SCRIPT, 'utf8').match(/NEW_LEAGUE_ID = '(\w+)'/)![1];

function migrate(...args: string[]): string {
  return execFileSync('node', [SCRIPT, '--base', DOCUMENTS, '--expect', '2', ...args], {
    encoding: 'utf8',
  });
}

/** A 2017 game: no league, no mode, no events; one on one, finished. */
function oldGame(red: string, blue: string, score: [number, number], end: string) {
  const side = (player: string, goals: number): Value => ({
    defence: { player, goals, ownGoals: 0 },
    offence: { player, goals: 0, ownGoals: 0 },
  });
  return {
    players: [red, blue],
    start: end,
    end,
    win: score[0] > score[1] ? 'red' : 'blue',
    teams: { red: side(red, score[0]), blue: side(blue, score[1]) },
  };
}

/** What the ranking of a league shows, as text. */
async function ranking(page: Page, league: string): Promise<string> {
  await page.goto(`/#/l/${league}`);
  await expect(page.locator('fl-ranking a.row')).toHaveCount(3);
  return page.locator('fl-ranking').innerText();
}

test('the 2017 migration moves the games without a league and can be rolled back', async ({
  page,
  request,
}) => {
  const id = tag();
  const [a, b, c] = ['Jerzy', 'Simon', 'Jacek'].map((name) => `old-${name}-${id}`);
  for (const player of [a, b, c]) {
    expect(await create(request, `players/${player}`, { name: player.split('-')[1] })).toBe(200);
  }
  expect(
    await create(request, 'leagues/legacy', {
      name: 'Najdroższa Liga Świata',
      created: '2017-10-23T11:39:43.496Z',
      players: [a, b, c],
      archived: true,
    }),
  ).toBe(200);
  // The rules never let a finished game be written, so the 2017 games are set up as admin.
  const games = [
    oldGame(a, b, [8, 3], '2017-10-24T10:00:00.000Z'),
    oldGame(c, a, [5, 8], '2017-10-25T10:00:00.000Z'),
  ];
  for (const [index, game] of games.entries()) {
    expect(await create(request, `games/old-${id}-${index}`, game, OWNER)).toBe(200);
  }
  expect(await update(request, `games/old-${id}-0`, { league: NEW_LEAGUE_ID })).toBe(403);

  const before = await ranking(page, 'legacy');
  expect(migrate()).toContain('Dry run: nothing written.');
  expect(await read(request, `leagues/${NEW_LEAGUE_ID}`)).toBeNull();

  expect(migrate('--apply', '--token', 'owner')).toContain('Committed');
  const legacy = await read(request, 'leagues/legacy');
  const moved = await read(request, `leagues/${NEW_LEAGUE_ID}`);
  expect(legacy?.['deleted']).toEqual({ booleanValue: true });
  expect(moved).toEqual({
    name: legacy?.['name'],
    created: legacy?.['created'],
    players: legacy?.['players'],
    archived: legacy?.['archived'],
  });
  for (const index of [0, 1]) {
    const game = await read(request, `games/old-${id}-${index}`);
    expect(game?.['league']).toEqual({ stringValue: NEW_LEAGUE_ID });
    expect(Object.keys(game ?? {}).sort()).toEqual(
      ['end', 'league', 'players', 'start', 'teams', 'win'].sort(),
    );
  }
  // The app shows the same ranking in the new league; the old one is gone from the list.
  expect(await ranking(page, NEW_LEAGUE_ID)).toBe(before);
  await page.goto('/#/leagues');
  await expect(page.getByRole('link', { name: 'Najdroższa Liga Świata' })).toHaveCount(1);
  // Running it again changes nothing.
  expect(() => migrate('--apply', '--token', 'owner')).toThrow();

  expect(migrate('--rollback', '--token', 'owner')).toContain('Committed');
  expect((await read(request, 'leagues/legacy'))?.['deleted']).toEqual({ booleanValue: false });
  expect((await read(request, `games/old-${id}-0`))?.['league']).toBeUndefined();
  expect(await ranking(page, 'legacy')).toBe(before);
});
