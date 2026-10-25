// Erases for good the leagues deleted (softly) before leagues had owners, with their games and
// tournaments (owner, 25 Oct 2026: "only Najdroższa Liga Świata should be left"). Ownerless
// leagues cannot be erased from the app, so this runs with the project owner's credentials,
// which Firestore does not check against the rules. Leagues that are not deleted are left alone.
//
//   node scripts/backup.mjs                                   first, always (keeps a copy)
//   node scripts/erase-deleted-leagues.mjs --token "$(gcloud auth print-access-token)"
//                                                             dry run: lists what would go
//   node scripts/erase-deleted-leagues.mjs --apply --token "$(gcloud auth print-access-token)"
//
// Option: --base <documents URL> (default: the production project).

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const apply = args.includes('--apply');
const token = option('--token', '');
const base = option(
  '--base',
  'https://firestore.googleapis.com/v1/projects/football-league-b6e95/databases/(default)/documents',
);
if (!token) {
  throw new Error('Reading private leagues needs credentials: --token "$(gcloud auth print-access-token)"');
}
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

async function list(collection) {
  const documents = [];
  let pageToken = '';
  do {
    const response = await fetch(
      `${base}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(`${collection}: ${response.status} ${await response.text()}`);
    }
    const page = await response.json();
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return documents;
}

const id = (document) => document.name.split('/').pop();
const field = (document, name) => document.fields?.[name] && Object.values(document.fields[name])[0];

const leagues = (await list('leagues')).filter((league) => field(league, 'deleted') === true);
const ids = new Set(leagues.map(id));
const games = (await list('games')).filter((game) => ids.has(field(game, 'league')));
const tournaments = (await list('tournaments')).filter((t) => ids.has(field(t, 'league')));

for (const league of leagues) {
  const of = (documents) => documents.filter((one) => field(one, 'league') === id(league)).length;
  console.log(`${id(league)}  "${field(league, 'name')}"  games ${of(games)}, tournaments ${of(tournaments)}`);
}
console.log(`${leagues.length} deleted leagues, ${games.length} games, ${tournaments.length} tournaments.`);

if (!apply) {
  console.log('Dry run: nothing erased. Add --apply to erase them.');
  process.exit(0);
}

// Games and tournaments first, then the leagues; a commit takes at most 500 writes.
const writes = [...games, ...tournaments, ...leagues].map((document) => ({ delete: document.name }));
for (let i = 0; i < writes.length; i += 500) {
  const response = await fetch(`${base}:commit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ writes: writes.slice(i, i + 500) }),
  });
  if (!response.ok) {
    throw new Error(`commit: ${response.status} ${await response.text()}`);
  }
}
console.log(`Erased ${writes.length} documents.`);
