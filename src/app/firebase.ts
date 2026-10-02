import { InjectionToken } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  DocumentReference,
  Firestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  Query,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

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

/** Live list of the documents matching `query`, each with its document id in `id`. */
export function collectionData<T extends { id: string }>(query: Query): Observable<T[]> {
  return new Observable<T[]>((subscriber) =>
    onSnapshot(
      query,
      (snapshot) => subscriber.next(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as T)),
      (error) => subscriber.error(error),
    ),
  );
}

/** Live document with its id in `id`, or `null` while it does not exist. */
export function docData<T extends { id: string }>(ref: DocumentReference): Observable<T | null> {
  return new Observable<T | null>((subscriber) =>
    onSnapshot(
      ref,
      (snapshot) =>
        subscriber.next(snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null),
      (error) => subscriber.error(error),
    ),
  );
}
