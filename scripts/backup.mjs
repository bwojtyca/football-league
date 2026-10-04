// Backs up the Firestore data of the app, read through the public REST API (the database
// is publicly readable, so no credentials are needed). Documents are kept exactly as the API
// returns them (typed values, update times), so they can be written back with
// `documents:commit` if ever needed.
//
//   node scripts/backup.mjs [out-dir] [project]
//
// Defaults: ../football-league-backups/<UTC time> and the production project.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const COLLECTIONS = ['leagues', 'players', 'games', 'tournaments'];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = process.argv[2] ?? join('..', 'football-league-backups', stamp);
const project = process.argv[3] ?? 'football-league-b6e95';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

async function list(collection) {
  const documents = [];
  let pageToken = '';
  do {
    const url = `${base}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const response = await fetch(url);
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
