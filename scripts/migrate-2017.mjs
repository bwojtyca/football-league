// One-off (October 2026): moves the 2017 games, which have no `league` field, into a regular
// league with a generated id, then deletes the `legacy` league softly (`deleted: true`). It is
// one atomic commit through the REST API: everything moves, or nothing does. Only the
// `league` field is added to the games; nothing else in them changes.
//
// The rules forbid changing finished games, so the writes go with the project owner's
// credentials, which Firestore does not check against the rules (no rule is loosened):
//
//   node scripts/backup.mjs                                    first, always
//   node scripts/migrate-2017.mjs                              dry run: checks, prints the plan
//   node scripts/migrate-2017.mjs --apply --token "$(gcloud auth print-access-token)"
//   node scripts/migrate-2017.mjs --rollback --token "$(gcloud auth print-access-token)"
//
// --rollback takes `league` off those games again, restores `legacy` and deletes the new
// league softly. Options: --expect <n> (games to move, default 421), --base <documents URL>
// (default: the production project; the scenarios use the emulator with --token owner).

const NEW_LEAGUE_ID = 'TPaiV5gUYtE68s5MFQsD';
const LEGACY_LEAGUE_ID = 'legacy';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const mode = args.includes('--apply') ? 'apply' : args.includes('--rollback') ? 'rollback' : 'dry';
const expected = Number(option('--expect', '421'));
const token = option('--token', '');
const base = option(
  '--base',
  'https://firestore.googleapis.com/v1/projects/football-league-b6e95/databases/(default)/documents',
);
/** `projects/<project>/databases/(default)/documents`, as document names start. */
const root = base.slice(base.indexOf('projects/'));
const headers = {
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
};

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers });
  if (response.status === 404 && !init.method) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function games() {
  const documents = [];
  let pageToken = '';
  do {
    const page = await request(`/games?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`);
    documents.push(...(page?.documents ?? []));
    pageToken = page?.nextPageToken ?? '';
  } while (pageToken);
  return documents;
}

const update = (name, fields, fieldPaths, exists) => ({
  update: { name, fields },
  ...(fieldPaths && { updateMask: { fieldPaths } }),
  currentDocument: { exists },
});

if (mode !== 'dry' && !token) {
  throw new Error(
    'Writing needs the owner\'s credentials: --token "$(gcloud auth print-access-token)"',
  );
}

const legacy = await request(`/leagues/${LEGACY_LEAGUE_ID}`);
const target = await request(`/leagues/${NEW_LEAGUE_ID}`);
const all = await games();
const legacyName = `${root}/leagues/${LEGACY_LEAGUE_ID}`;
const targetName = `${root}/leagues/${NEW_LEAGUE_ID}`;
let writes;

if (mode === 'rollback') {
  const moved = all.filter((game) => game.fields?.league?.stringValue === NEW_LEAGUE_ID);
  console.log(`Games in ${NEW_LEAGUE_ID} to give back to "legacy": ${moved.length}`);
  if (moved.length !== expected) {
    throw new Error(`Expected ${expected} games, found ${moved.length}: nothing written.`);
  }
  writes = [
    ...moved.map((game) => update(game.name, {}, ['league'], true)),
    update(legacyName, { deleted: { booleanValue: false } }, ['deleted'], true),
    update(targetName, { deleted: { booleanValue: true } }, ['deleted'], true),
  ];
} else {
  const toMove = all.filter((game) => !game.fields?.league);
  const unfinished = toMove.filter((game) => !game.fields?.end);
  console.log(`League "legacy": ${legacy ? legacy.fields.name.stringValue : 'missing'}`);
  console.log(`Games without a league: ${toMove.length} (unfinished: ${unfinished.length})`);
  console.log(`New league ${NEW_LEAGUE_ID}: ${target ? 'ALREADY EXISTS' : 'free'}`);
  if (!legacy || legacy.fields.deleted?.booleanValue) {
    throw new Error('The "legacy" league is missing or deleted: nothing written.');
  }
  if (target) {
    throw new Error(`League ${NEW_LEAGUE_ID} already exists: nothing written.`);
  }
  if (toMove.length !== expected || unfinished.length) {
    throw new Error(
      `Expected ${expected} finished games, found ${toMove.length}: nothing written.`,
    );
  }
  // The new league is the old one with a generated id: same name, date, players and lock.
  const { name, created, players, archived } = legacy.fields;
  writes = [
    update(targetName, { name, created, players, ...(archived && { archived }) }, null, false),
    ...toMove.map((game) =>
      update(game.name, { league: { stringValue: NEW_LEAGUE_ID } }, ['league'], true),
    ),
    update(legacyName, { deleted: { booleanValue: true } }, ['deleted'], true),
  ];
}

console.log(`${writes.length} writes in one commit (${mode}).`);
if (writes.length > 500) {
  throw new Error('A commit takes at most 500 writes.');
}
if (mode === 'dry') {
  console.log('Dry run: nothing written.');
} else {
  const result = await request(':commit', { method: 'POST', body: JSON.stringify({ writes }) });
  console.log(`Committed at ${result.commitTime}.`);
}
