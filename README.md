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

Alternatively, with access to the Firebase project:

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

## Data model

- `players/{id}`: `name`, `wins`, `loses`
- `games/{id}`: `players` (ids, for `array-contains` queries), `start`, `end?`, `win?`
  (`'red' | 'blue'`), `teams.{red|blue}.{defence|offence}` = `{ player, goals, ownGoals }`

Goals and results are written in a Firestore transaction, so scoring from several devices
at once cannot lose a goal or count a result twice.
