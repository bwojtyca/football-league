# FootballLeague

A table football (foosball) league: players, live game scoring (first team to 8 wins),
game history and per-player statistics. Data lives in Cloud Firestore; there is no backend.

Originally written in 2017 with Angular 4 and angularfire2; revived in 2026 on
Angular 22, Angular Material and the modular Firebase SDK, keeping the same Firestore
data model so the old players and games still show up.

Live version: https://bwojtyca.github.io/football-league/

## Development

Requires Node.js 24 (see `.nvmrc`).

```bash
npm install
npm start            # http://localhost:4200, talks to the real Firestore project
npm test             # unit tests (Vitest)
```

To work without touching real data, run the Firestore emulator (needs Java 21+) and point
the app at it:

```bash
npm run emulator         # Firestore emulator on 127.0.0.1:8080, project demo-football-league
npm run start:emulator   # in a second terminal
```

## Deployment

Every push to `master` builds the app and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). Pages must be enabled once in the repository settings:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Firestore security rules

`firestore.rules` lets anyone read and play, but only through the writes the app makes:
adding players, starting games, scoring one goal at a time, closing a game once it is won
and removing unfinished games. Players cannot be changed or deleted, and finished games
cannot be changed.

Pushing a change to `firestore.rules` or `firebase.json` on `master` deploys the rules
(`.github/workflows/firebase.yml`, also runnable by hand from the Actions tab). It needs a
service account key in the `FIREBASE_SERVICE_ACCOUNT` repository secret, with the roles
Firebase Rules Admin, Cloud Datastore Index Admin and Service Usage Consumer.

### Firebase Hosting

Alternatively, with access to the Firebase project:

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

## Data model

- `leagues/{id}`: `name`, `created`, `players` (ids). Games without a league are the 2017
  history, shown as the read-only "Legacy 2017" league.
- `players/{id}`: `name` (older documents also hold `wins`/`loses` counters, which are no
  longer used: rankings and stats are counted from the games)
- `games/{id}`: `league?`, `players` (ids of everyone playing), `start`, `end?`, `win?`
  (`'red' | 'blue'`), `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`

All games are read through one live listener and kept in the browser (IndexedDB), so later
visits render straight away and only changed games are downloaded. Goals are increments
applied locally at once (also offline) and add up across devices; a transaction records the
result once a team reaches 8, so it is recorded exactly once.
