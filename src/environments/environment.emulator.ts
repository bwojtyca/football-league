import type { Environment } from './environment.model';

// Local development against the Firestore emulator (`npm run emulator`).
// The `demo-` project id keeps the emulator from ever touching a real project.
export const environment: Environment = {
  firebase: {
    apiKey: 'demo-api-key',
    projectId: 'demo-football-league',
  },
  firestoreEmulator: { host: '127.0.0.1', port: 8080 },
};
