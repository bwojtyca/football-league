# FootballLeague

A table football (foosball) league: leagues for each office or crowd, live game scoring
(to 8 by default; also to 5 or 10, win by two, 5-minute games and best-of series), undo of
the last goal and swapping positions mid-game, an Elo ranking with the change after every game, game history and
per-player statistics, in Polish and English. Built for phones; it can be installed from the
browser and opens offline. Data lives in Cloud Firestore; there is no backend.

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
creating leagues and adding players to them, adding players, starting games, scoring one
goal at a time (logged in the game), swapping positions, undoing the last event, closing a
game once it is won and removing unfinished games. Players cannot be changed or deleted,
nobody can be removed from a league, and finished games cannot be changed.

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

- `leagues/{id}`: `name`, `created`, `players` (ids), `archived?`. Games without a league
  are the 2017 history and belong to the archived league `leagues/legacy`
  ("Najdroższa Liga Świata").
- `players/{id}`: `name` (older documents also hold `wins`/`loses` counters, which are no
  longer used: rankings and stats are counted from the games)
- `games/{id}`: `league?`, `players` (ids of everyone playing), `start`, `end?`, `win?`
  (`'red' | 'blue'`), `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`;
  newer games also have `mode` (`{ target, winBy?, max?, minutes? }`, no mode = to 8),
  `events` (goals, own goals and position swaps, in order, with the time since the start)
  and `series?` (`{ id, bestOf, game }`)

All games are read through one live listener and kept in the browser (IndexedDB), so later
visits render straight away and only changed games are downloaded. Goals are increments
applied locally at once (also offline) and add up across devices; a transaction records the
result once a team reaches 8, so it is recorded exactly once.

Ratings are Elo, counted from each league's games: everyone starts at 1500, K = 24, a team
is rated as the average of its players and both players of a team gain or lose the same
amount. Ratings from fewer than 10 games are marked as provisional.

Interface texts are in `public/i18n/{pl,en}.json` (Transloco, ICU message format).
