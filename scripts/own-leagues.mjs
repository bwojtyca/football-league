// Makes one Google account the owner and a member of every league that has no owner (owner,
// 25 Oct 2026: "make my account the owner of the test leagues"), so they show on that account's
// deleted-leagues page, to restore or erase. Runs with the project owner's credentials, which
// Firestore does not check against the rules. Leagues that have an owner are left alone.
//
//   node scripts/own-leagues.mjs --uid <account uid> --token "$(gcloud auth print-access-token)"
//                                                               dry run: lists the leagues
//   node scripts/own-leagues.mjs --uid <uid> --apply --token "$(gcloud auth print-access-token)"
//
// The account's uid is on its claimed player (`players/{id}.uid`).

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
};
const apply = args.includes('--apply');
const uid = option('--uid');
const token = option('--token');
const base =
  option('--base') ||
  'https://firestore.googleapis.com/v1/projects/football-league-b6e95/databases/(default)/documents';
if (!uid || !token) {
  throw new Error('Usage: --uid <account uid> --token "$(gcloud auth print-access-token)" [--apply]');
}
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

const leagues = [];
let pageToken = '';
do {
  const response = await fetch(
    `${base}/leagues?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`leagues: ${response.status} ${await response.text()}`);
  }
  const page = await response.json();
  leagues.push(...(page.documents ?? []));
  pageToken = page.nextPageToken ?? '';
} while (pageToken);

const free = leagues.filter((league) => !league.fields?.owner);
for (const league of free) {
  const f = league.fields ?? {};
  console.log(
    `${league.name.split('/').pop()}  "${f.name?.stringValue}"${f.deleted?.booleanValue ? '  (deleted)' : ''}`,
  );
}
console.log(`${leagues.length} leagues, ${free.length} without an owner.`);
if (!apply) {
  console.log('Dry run: nothing written. Add --apply to make the account their owner.');
  process.exit(0);
}

// The account becomes the owner and joins the members (kept if there were any).
const writes = free.map((league) => {
  const members = league.fields?.members?.arrayValue?.values ?? [];
  const values = members.some((value) => value.stringValue === uid)
    ? members
    : [...members, { stringValue: uid }];
  return {
    update: {
      name: league.name,
      fields: { owner: { stringValue: uid }, members: { arrayValue: { values } } },
    },
    updateMask: { fieldPaths: ['owner', 'members'] },
    currentDocument: { exists: true },
  };
});
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
console.log(`${writes.length} leagues now owned by ${uid}.`);
