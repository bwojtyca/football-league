import { InjectionToken } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

import { environment } from '../environments/environment';

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () => {
    // Documents are kept in IndexedDB: later visits render from it straight away and only
    // changes come over the network, and goals scored while offline are sent once back online.
    const db = initializeFirestore(initializeApp(environment.firebase), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    const emulator = environment.firestoreEmulator;
    if (emulator) {
      connectFirestoreEmulator(db, emulator.host, emulator.port);
    }
    return db;
  },
});
