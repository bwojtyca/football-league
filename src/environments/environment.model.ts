import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  firebase: FirebaseOptions;
  /** When set, Firestore talks to a local emulator instead of the real project. */
  firestoreEmulator?: { host: string; port: number };
}
