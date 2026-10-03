import { expect, test } from '@playwright/test';

import { tag } from './helpers';
import { DOCUMENTS, fields, update } from './rest';

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
