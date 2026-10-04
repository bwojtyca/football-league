import { APIRequestContext, expect, test } from '@playwright/test';

import { tag } from './helpers';

/**
 * Writes the app never makes, straight to the emulator's REST API without credentials, so
 * `firestore.rules` decides them like for any visitor.
 */
const DOCUMENTS =
  'http://127.0.0.1:8080/v1/projects/demo-football-league/databases/(default)/documents';

type Value = string | number | boolean | Value[] | { [key: string]: Value };

function encode(value: Value): object {
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return { integerValue: String(value) };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encode) } };
  }
  return { mapValue: { fields: fields(value) } };
}

function fields(data: Record<string, Value>): Record<string, object> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));
}

/** Updates the given fields of a document; returns the HTTP status (403 when refused). */
async function update(
  request: APIRequestContext,
  path: string,
  data: Record<string, Value>,
): Promise<number> {
  const mask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${key}`)
    .join('&');
  const response = await request.patch(`${DOCUMENTS}/${path}?${mask}`, {
    data: { fields: fields(data) },
  });
  return response.status();
}

test('tournaments: what may change while running and after the end', async ({ request }) => {
  const id = `rules-${tag()}`;
  const created = await request.post(`${DOCUMENTS}/tournaments?documentId=${id}`, {
    data: {
      fields: fields({
        league: 'rules-league',
        name: 'Reguły',
        format: 'open',
        created: new Date().toISOString(),
        mode: { target: 8, winBy: 2 },
        teamSize: 2,
        entries: [],
      }),
    },
  });
  expect(created.status()).toBe(200);
  const path = `tournaments/${id}`;

  // Running: new rules for the next games, a new name, deleted and restored.
  expect(await update(request, path, { mode: { target: 5 } })).toBe(200);
  expect(await update(request, path, { name: 'Nowa nazwa' })).toBe(200);
  expect(await update(request, path, { deleted: true, gamesDeleted: true })).toBe(200);
  expect(await update(request, path, { deleted: false, gamesDeleted: false })).toBe(200);
  // Never: another format, other teams, broken rules, a deleted flag that is not a flag.
  expect(await update(request, path, { format: 'cup' })).toBe(403);
  expect(await update(request, path, { teams: [] })).toBe(403);
  expect(await update(request, path, { mode: { target: 99 } })).toBe(403);
  expect(await update(request, path, { deleted: 'yes' })).toBe(403);
  expect(await update(request, path, { name: '' })).toBe(403);

  // Ended: a new name and deleting still work, the rules and the players are fixed.
  expect(await update(request, path, { end: new Date().toISOString() })).toBe(200);
  expect(await update(request, path, { name: 'Po końcu' })).toBe(200);
  expect(await update(request, path, { mode: { target: 8 } })).toBe(403);
  expect(
    await update(request, path, { entries: [{ player: 'x', at: new Date().toISOString() }] }),
  ).toBe(403);
  expect(await update(request, path, { end: new Date().toISOString() })).toBe(403);
  expect(await update(request, path, { deleted: true, gamesDeleted: false })).toBe(200);
});

test('goal events: a rod and a figure only where they fit', async ({ request }) => {
  const id = `rods-${tag()}`;
  const team = (player: string, goals = 0): Value => ({
    defence: { player, goals, ownGoals: 0 },
    offence: { player, goals: 0, ownGoals: 0 },
  });
  expect(
    await create(request, `games/${id}`, {
      league: 'rules-league',
      players: ['p1', 'p2'],
      start: new Date().toISOString(),
      teams: { red: team('p1'), blue: team('p2') },
      mode: { target: 8 },
      events: [],
    }),
  ).toBe(200);
  /** The first goal of the game, by the red defender, told as `event`. */
  const goal = (event: Record<string, Value>) =>
    update(request, `games/${id}`, {
      teams: { red: team('p1', 1), blue: team('p2') },
      events: [
        { at: 1000, type: 'goal', team: 'red', position: 'defence', player: 'p1', ...event },
      ],
    });
  expect(await goal({ rod: 'midfield' })).toBe(403);
  expect(await goal({ rod: 'goalie', man: 2 })).toBe(403);
  expect(await goal({ man: 1 })).toBe(403);
  expect(await goal({ rod: 'defence', man: 3 })).toBe(403);
  expect(await goal({ rod: 'defence', man: 2 })).toBe(200);
});

test('games deleted with a league or tournament remember it', async ({ request }) => {
  const id = `deleted-${tag()}`;
  const team = (player: string): Value => ({
    defence: { player, goals: 0, ownGoals: 0 },
    offence: { player, goals: 0, ownGoals: 0 },
  });
  expect(
    await create(request, `games/${id}`, {
      league: 'rules-league',
      players: ['p1', 'p2'],
      start: new Date().toISOString(),
      teams: { red: team('p1'), blue: team('p2') },
      events: [],
    }),
  ).toBe(200);
  expect(await update(request, `games/${id}`, { deleted: true, deletedWith: 'league:x' })).toBe(
    200,
  );
  expect(await update(request, `games/${id}`, { deletedWith: 5 })).toBe(403);
  expect(await update(request, `games/${id}`, { deleted: false, start: 'x' })).toBe(403);
});
