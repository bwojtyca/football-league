import { APIRequestContext, expect, test } from '@playwright/test';

import { tag } from './helpers';
import { create, DOCUMENTS, fields, update, Value } from './rest';

// Writes the app never makes, straight to the emulator without credentials, so
// `firestore.rules` decides them like for any visitor.

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

test('players: only their kit may change, and only to a kit the app can draw', async ({
  request,
}) => {
  const id = `kit-${tag()}`;
  const path = `players/${id}`;
  const kit = (data: Record<string, Value>): Record<string, Value> => ({ kit: data });
  expect(await create(request, path, { name: 'Koszulka' })).toBe(200);
  // Only the player themself dresses: nobody before a Google account claims them.
  expect(await update(request, path, kit({ pattern: 'plain', c1: 'red', c2: 'blue' }))).toBe(403);
  const owner = await token(request, `kit-${tag()}`);
  expect(await claim(request, owner, id)).toBe(200);
  const as = { Authorization: `Bearer ${owner.idToken}` };

  expect(
    await update(request, path, kit({ pattern: 'stripes', c1: 'white', c2: 'black', num: 10 }), as),
  ).toBe(200);
  expect(await update(request, path, kit({ pattern: 'plain', c1: 'red', c2: 'blue' }), as)).toBe(200);
  // Never: another name or counter, a colour outside the palette, an unknown pattern, a number
  // out of 1–99, a field the app does not know, a kit missing a colour, a kit that is no map.
  expect(await update(request, path, { name: 'Ktoś inny' }, as)).toBe(403);
  expect(await update(request, path, { wins: 5 }, as)).toBe(403);
  expect(await update(request, path, kit({ pattern: 'plain', c1: '#ff00ff', c2: 'blue' }), as)).toBe(
    403,
  );
  expect(await update(request, path, kit({ pattern: 'dots', c1: 'red', c2: 'blue' }), as)).toBe(403);
  expect(
    await update(request, path, kit({ pattern: 'plain', c1: 'red', c2: 'blue', num: 100 }), as),
  ).toBe(403);
  expect(
    await update(request, path, kit({ pattern: 'plain', c1: 'red', c2: 'blue', num: 0 }), as),
  ).toBe(403);
  expect(
    await update(request, path, kit({ pattern: 'plain', c1: 'red', c2: 'blue', logo: 'x' }), as),
  ).toBe(403);
  expect(await update(request, path, kit({ pattern: 'plain', c1: 'red' }), as)).toBe(403);
  expect(await update(request, path, { kit: 'red' }, as)).toBe(403);
});

/** An ID token from the Auth emulator: anonymous, or a Google account. */
async function token(
  request: APIRequestContext,
  google?: string,
): Promise<{ uid: string; idToken: string }> {
  const base = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
  const response = google
    ? await request.post(`${base}/accounts:signInWithIdp?key=demo-api-key`, {
        data: {
          requestUri: 'http://localhost',
          returnSecureToken: true,
          postBody: `providerId=google.com&id_token=${encodeURIComponent(
            JSON.stringify({ sub: google, email: `${google}@example.com` }),
          )}`,
        },
      })
    : await request.post(`${base}/accounts:signUp?key=demo-api-key`, {
        data: { returnSecureToken: true },
      });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  return { uid: body.localId, idToken: body.idToken };
}

/** One atomic write of an account and its player's claim, as the app does it. */
async function claim(
  request: APIRequestContext,
  auth: { uid: string; idToken: string },
  player: string,
  release?: string,
): Promise<number> {
  const root = DOCUMENTS.slice(DOCUMENTS.indexOf('projects/'));
  const writes: object[] = [
    {
      update: {
        name: `${root}/users/${auth.uid}`,
        fields: fields({ player, updated: new Date().toISOString() }),
      },
    },
    {
      update: { name: `${root}/players/${player}`, fields: fields({ uid: auth.uid }) },
      updateMask: { fieldPaths: ['uid'] },
    },
  ];
  if (release) {
    writes.push({
      update: { name: `${root}/players/${release}`, fields: {} },
      updateMask: { fieldPaths: ['uid'] },
    });
  }
  const response = await request.post(`${DOCUMENTS}:commit`, {
    data: { writes },
    headers: { Authorization: `Bearer ${auth.idToken}` },
  });
  return response.status();
}

test('accounts: a Google account claims one free player, and only it dresses them', async ({
  request,
}) => {
  const ala = `rules-ala-${tag()}`;
  const ola = `rules-ola-${tag()}`;
  expect(await create(request, `players/${ala}`, { name: 'Ala' })).toBe(200);
  expect(await create(request, `players/${ola}`, { name: 'Ola' })).toBe(200);
  const updated = new Date().toISOString();

  // No account, or an anonymous one: nothing is kept or claimed.
  expect(await create(request, `users/nobody-${tag()}`, { updated })).toBe(403);
  const anonymous = await token(request);
  expect(await claim(request, anonymous, ala)).toBe(403);

  // A Google account claims Ala; its account must say so in the same write.
  const first = await token(request, `g1-${tag()}`);
  const asFirst = { Authorization: `Bearer ${first.idToken}` };
  expect(await update(request, `players/${ala}`, { uid: first.uid }, asFirst)).toBe(403);
  expect(await claim(request, first, ala)).toBe(200);

  // Another account cannot take her, nor write someone else's account.
  const second = await token(request, `g2-${tag()}`);
  const asSecond = { Authorization: `Bearer ${second.idToken}` };
  expect(await claim(request, second, ala)).toBe(403);
  expect(await create(request, `users/${first.uid}x`, { updated }, asSecond)).toBe(403);

  // Ala's kit is now her owner's alone; unclaimed Ola's is nobody's to change.
  const kit = { pattern: 'plain', c1: 'red', c2: 'white' };
  expect(await update(request, `players/${ala}`, { kit })).toBe(403);
  expect(await update(request, `players/${ala}`, { kit }, asSecond)).toBe(403);
  expect(await update(request, `players/${ala}`, { kit }, asFirst)).toBe(200);
  expect(await update(request, `players/${ola}`, { kit }, asFirst)).toBe(403);

  // Moving to Ola lets Ala go in the same write; then the second account may take Ala.
  expect(await claim(request, first, ola, ala)).toBe(200);
  expect(await claim(request, second, ala)).toBe(200);
});
