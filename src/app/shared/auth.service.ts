import { computed, effect, inject, Injectable } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AuthError,
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { deleteField, doc, writeBatch } from 'firebase/firestore';
import { authState } from 'rxfire/auth';
import { docData } from 'rxfire/firestore';
import { map, Observable, of, switchMap } from 'rxjs';

import { AUTH, FIRESTORE } from '../firebase';
import { PlayerService } from '../player/player.service';

/** What a Google account keeps: the player it is (`users/{uid}`). */
interface Account {
  player?: string;
}

/**
 * Who is signed in (sign-in step 3a, 19–24 Oct 2026). Every visitor gets an anonymous account
 * without a screen; signing in with Google links it (a Google popup, which works on GitHub
 * Pages, unlike a redirect), so nothing done before is lost. A Google account keeps the
 * player it is, on every device. The rules do not ask for an account yet (step 3b).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _auth = inject(AUTH);
  private readonly _db = inject(FIRESTORE);
  private readonly _players = inject(PlayerService);

  /** `undefined` until Firebase knows, `null` when nobody is signed in (not even anonymously). */
  public readonly user = toSignal(authState(this._auth), { initialValue: undefined });

  /** Signed in with Google (not only anonymously). */
  public readonly signedIn = computed(() => {
    const user = this.user();
    return !!user && !user.isAnonymous;
  });

  /** The account's uid (anonymous or not). */
  public readonly uid = computed(() => this.user()?.uid ?? null);

  /** The account's name to show (the Google name, else the e-mail). */
  public readonly name = computed(() => {
    const user = this.user();
    return user && !user.isAnonymous ? (user.displayName ?? user.email ?? '') : null;
  });

  /** The player a Google account is: `undefined` while loading or without an account. */
  public readonly player = toSignal(
    toObservable(this.user).pipe(
      switchMap((user) =>
        user && !user.isAnonymous
          ? (docData(doc(this._db, 'users', user.uid)) as Observable<Account | undefined>).pipe(
              map((account) => account?.player ?? null),
            )
          : of(undefined),
      ),
    ),
    { initialValue: undefined },
  );

  constructor() {
    // Everyone has an account, anonymous until they sign in (offline: tried again next time).
    effect(() => {
      if (this.user() === null) {
        signInAnonymously(this._auth).catch(() => undefined);
      }
    });
  }

  /** Signs in with Google; `false` when the popup was closed or blocked. */
  public async signInWithGoogle(): Promise<boolean> {
    const provider = new GoogleAuthProvider();
    const current = this._auth.currentUser;
    try {
      if (current?.isAnonymous) {
        await linkWithPopup(current, provider);
      } else {
        await signInWithPopup(this._auth, provider);
      }
      return true;
    } catch (error) {
      const code = (error as AuthError).code;
      // The Google account was used here before: switch to it (the anonymous one had nothing).
      if (code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(error as AuthError);
        if (credential) {
          await signInWithCredential(this._auth, credential);
          return true;
        }
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return false;
      }
      throw error;
    }
  }

  /** Signs out; the effect above gives the device a new anonymous account. */
  public signOut(): Promise<void> {
    return signOut(this._auth);
  }

  /**
   * Keeps on the Google account which player it is, and claims that player (one account, one
   * player; the rules check both in the same write). Nothing for an anonymous account.
   */
  public setPlayer(playerId: string | null): Promise<void> {
    const user = this._auth.currentUser;
    if (!user || user.isAnonymous) {
      return Promise.resolve();
    }
    const batch = writeBatch(this._db);
    const updated = new Date().toISOString();
    batch.set(
      doc(this._db, 'users', user.uid),
      playerId ? { player: playerId, updated } : { updated },
    );
    if (playerId && this._players.player(playerId)?.uid !== user.uid) {
      batch.update(doc(this._db, 'players', playerId), { uid: user.uid });
    }
    const before = this.player();
    if (before && before !== playerId && this._players.player(before)?.uid === user.uid) {
      batch.update(doc(this._db, 'players', before), { uid: deleteField() });
    }
    return batch.commit();
  }
}
