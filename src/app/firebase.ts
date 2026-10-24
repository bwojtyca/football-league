import { inject, InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

import { environment } from '../environments/environment';

/** The one Firebase app, shared by Firestore and Auth. */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => initializeApp(environment.firebase),
});

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () => {
    // Documents are kept in IndexedDB: later visits render from it straight away and only
    // changes come over the network, and goals scored while offline are sent once back online.
    const db = initializeFirestore(inject(FIREBASE_APP), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    const emulator = environment.firestoreEmulator;
    if (emulator) {
      connectFirestoreEmulator(db, emulator.host, emulator.port);
    }
    return db;
  },
});

/** Sign-in: anonymous for everyone, Google for those who want an account. */
export const AUTH = new InjectionToken<Auth>('AUTH', {
  providedIn: 'root',
  factory: () => {
    const auth = getAuth(inject(FIREBASE_APP));
    if (environment.authEmulator) {
      connectAuthEmulator(auth, environment.authEmulator, { disableWarnings: true });
    }
    return auth;
  },
});
