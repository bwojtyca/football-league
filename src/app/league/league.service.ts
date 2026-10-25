import { computed, inject, Injectable, Injector, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { user as userChanges } from 'rxfire/auth';
import { collectionData, docData } from 'rxfire/firestore';
import { catchError, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';

import { AUTH, FIRESTORE } from '../firebase';
import { GameService } from '../game/game.service';
import { deviceLeagues, rememberLeague } from './device-leagues';
import { League, currentLeagueId } from './league';

const LAST_LEAGUE_KEY = 'fl.league';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private readonly _db: Firestore = inject(FIRESTORE);
  private readonly _auth = inject(AUTH);
  private readonly _leagues = collection(this._db, 'leagues');
  private readonly _gameService = inject(GameService);
  private readonly _injector = inject(Injector);

  /**
   * The leagues of the signed-in account (anonymous ones too): private leagues, Oct 2026. A
   * new account has none until it creates or joins one.
   */
  private readonly _stored = toSignal(
    userChanges(this._auth).pipe(
      map((user) => user?.uid ?? null),
      distinctUntilChanged(),
      switchMap((uid) =>
        uid
          ? (collectionData(query(this._leagues, where('members', 'array-contains', uid)), {
              idField: 'id',
            }) as Observable<League[]>).pipe(catchError(() => of([] as League[])))
          : of(undefined),
      ),
    ),
  );

  /** Leagues opened by id that are not the account's (an old open one, or just joined). */
  private readonly _byId = new Map<string, Signal<League | null | undefined>>();

  /** Every league that is not deleted, active ones first, newest first; `undefined` while loading. */
  public readonly leagues = computed(() =>
    this._stored()
      ?.filter((league) => !league.deleted)
      .sort(
        (a, b) =>
          Number(!!a.archived) - Number(!!b.archived) ||
          (a.created < b.created ? 1 : a.created > b.created ? -1 : 0),
      ),
  );

  /** Deleted leagues, newest first. */
  public readonly deletedLeagues = computed(() =>
    (this._stored() ?? [])
      .filter((league) => league.deleted)
      .sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0)),
  );

  /** A league, deleted ones included; `undefined` while loading, `null` when there is none. */
  public league(id: string): League | null | undefined {
    const mine = this._stored()?.find((league) => league.id === id);
    if (mine) {
      return mine;
    }
    let one = this._byId.get(id);
    if (!one) {
      // Created on first use, which can be inside a computed: the listener itself is not.
      // `null` when there is no such league, or it is private to others.
      one = untracked(() =>
        toSignal(
          (docData(doc(this._leagues, id), { idField: 'id' }) as Observable<League | undefined>).pipe(
            map((league) => league ?? null),
            catchError(() => of(null)),
          ),
          { injector: this._injector },
        ),
      );
      this._byId.set(id, one);
    }
    return one();
  }

  /** Makes an invitation code to the league (any member may), for a link. */
  public async invite(leagueId: string): Promise<string> {
    const ref = doc(collection(this._leagues, leagueId, 'invites'));
    await setDoc(ref, { created: new Date().toISOString(), by: this._auth.currentUser?.uid ?? '' });
    return ref.id;
  }

  /** Joins a league with an invitation code from a link. */
  public join(leagueId: string, code: string): Promise<void> {
    const uid = this._auth.currentUser?.uid;
    return uid
      ? updateDoc(doc(this._leagues, leagueId), { members: arrayUnion(uid), invite: code })
      : Promise.reject(new Error('not signed in'));
  }

  /** Renames, locks or unlocks, sets the ranking threshold, deletes or restores a league. */
  public update(
    id: string,
    changes: Partial<
      Pick<League, 'name' | 'archived' | 'minGames' | 'deleted' | 'gamesDeleted' | 'admins'>
    >,
  ): Promise<void> {
    return updateDoc(doc(this._leagues, id), changes);
  }

  public createLeague(name: string): { id: string; saved: Promise<void> } {
    const ref = doc(this._leagues);
    return {
      id: ref.id,
      // Its creator is its first member (private leagues): written once the account is there.
      saved: this._account().then((uid) =>
        setDoc(ref, {
          name,
          created: new Date().toISOString(),
          players: [],
          members: [uid],
          // Signed in with Google, its creator owns it (its settings are theirs).
          ...(this._googleUid() && { owner: this._googleUid() }),
        }),
      ),
    };
  }

  /** The account's uid once there is one (`AuthService` signs every visitor in). */
  private _account(): Promise<string> {
    return new Promise((resolve) => {
      const off = onAuthStateChanged(this._auth, (user) => {
        if (user) {
          off();
          resolve(user.uid);
        }
      });
    });
  }

  public addPlayer(leagueId: string, playerId: string): Promise<void> {
    return updateDoc(doc(this._leagues, leagueId), { players: arrayUnion(playerId) });
  }

  /** The signed-in Google account's uid, or `null` (anonymous or nobody). */
  private _googleUid(): string | null {
    const user = this._auth.currentUser;
    return user && !user.isAnonymous ? user.uid : null;
  }

  /** The signed-in Google account becomes the owner of a league that has none. */
  public claim(leagueId: string): Promise<void> {
    const uid = this._googleUid();
    return uid
      ? updateDoc(doc(this._leagues, leagueId), { owner: uid, members: arrayUnion(uid) })
      : Promise.resolve();
  }

  /** Erases a league for good with its games and tournaments (its owner only). */
  public async erase(leagueId: string): Promise<void> {
    for (const name of ['games', 'tournaments']) {
      const all = query(collection(this._db, name), where('league', '==', leagueId));
      const docs = (await getDocs(all)).docs;
      // A batch takes at most 500 writes.
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(this._db);
        docs.slice(i, i + 500).forEach((one) => batch.delete(one.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(this._leagues, leagueId));
  }

  /** Deletes a league (it can be restored), with its games if asked. */
  public async remove(leagueId: string, withGames: boolean): Promise<void> {
    await this.update(leagueId, { deleted: true, gamesDeleted: withGames });
    if (withGames) {
      await this._gameService.setLeagueGamesDeleted(leagueId, true);
    }
  }

  /** Brings a deleted league back, and its games when they were deleted with it. */
  public async restore(leagueId: string): Promise<void> {
    const withGames = !!this.league(leagueId)?.gamesDeleted;
    await this.update(leagueId, { deleted: false, gamesDeleted: false });
    if (withGames) {
      await this._gameService.setLeagueGamesDeleted(leagueId, false);
    }
  }

  /** The league opened last on this device, to come back to it on the next visit. */
  public get lastLeague(): string | null {
    try {
      const id = localStorage.getItem(LAST_LEAGUE_KEY);
      return id && currentLeagueId(id);
    } catch {
      return null;
    }
  }

  public set lastLeague(id: string) {
    try {
      localStorage.setItem(LAST_LEAGUE_KEY, id);
    } catch {
      // Private mode: the app starts on the league list next time.
    }
    if (id) {
      this._remember(id);
    }
  }

  /** Leagues opened on this device, last first: "mine" until there are accounts. */
  public readonly recent = deviceLeagues.asReadonly();

  private _remember(id: string): void {
    // Called from effects: read without tracking.
    untracked(() => rememberLeague(id));
  }
}
