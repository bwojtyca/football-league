import type { Environment } from './environment.model';

// Local development against the Firestore emulator (`npm run emulator`).
// The `demo-` project id keeps the emulator from ever touching a real project.
export const environment: Environment = {
  firebase: {
    apiKey: 'demo-api-key',
    // Sign-in popups need an auth domain, even when the Auth emulator answers them.
    authDomain: 'demo-football-league.firebaseapp.com',
    projectId: 'demo-football-league',
  },
  firestoreEmulator: { host: '127.0.0.1', port: 8080 },
  authEmulator: 'http://127.0.0.1:9099',
};
