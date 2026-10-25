// Backs up the Firestore data of the app through the REST API. Documents are kept exactly as
// the API returns them (typed values, update times), so they can be written back with
// `documents:commit` if ever needed. Leagues are private since Oct 2026, so a full backup needs
// the project owner's credentials (without them only what anyone may read is saved).
//
//   node scripts/backup.mjs [out-dir] [project] [--token "$(gcloud auth print-access-token)"]
//
// Defaults: ../football-league-backups/<UTC time> and the production project.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const COLLECTIONS = ['leagues', 'players', 'games', 'tournaments'];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const args = process.argv.slice(2);
const tokenAt = args.indexOf('--token');
const token = tokenAt >= 0 ? args.splice(tokenAt, 2)[1] : '';
const out = args[0] ?? join('..', 'football-league-backups', stamp);
const project = args[1] ?? 'football-league-b6e95';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

async function list(collection) {
  const documents = [];
  let pageToken = '';
  do {
    const url = `${base}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const response = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    if (!response.ok) {
      throw new Error(`${collection}: ${response.status} ${await response.text()}`);
    }
    const page = await response.json();
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return documents;
}

await mkdir(out, { recursive: true });
const summary = { project, at: new Date().toISOString(), counts: {} };
for (const collection of COLLECTIONS) {
  const documents = await list(collection);
  summary.counts[collection] = documents.length;
  await writeFile(join(out, `${collection}.json`), JSON.stringify(documents, null, 1));
}
await writeFile(join(out, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(out, summary.counts);
