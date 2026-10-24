import { computed, inject, Injectable, signal, untracked } from '@angular/core';
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
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

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
  private readonly _stored = toSignal(
    collectionData(this._leagues, { idField: 'id' }) as Observable<League[]>,
  );

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
    const leagues = this._stored();
    return leagues && (leagues.find((league) => league.id === id) ?? null);
  }

  /** Renames, locks or unlocks, sets the ranking threshold, deletes or restores a league. */
  public update(
    id: string,
    changes: Partial<Pick<League, 'name' | 'archived' | 'minGames' | 'deleted' | 'gamesDeleted'>>,
  ): Promise<void> {
    return updateDoc(doc(this._leagues, id), changes);
  }

  public createLeague(name: string): { id: string; saved: Promise<void> } {
    const ref = doc(this._leagues);
    return {
      id: ref.id,
      // Signed in with Google, its creator owns it (its settings are theirs).
      saved: setDoc(ref, {
        name,
        created: new Date().toISOString(),
        players: [],
        ...(this._googleUid() && { owner: this._googleUid() }),
      }),
    };
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
    return uid ? updateDoc(doc(this._leagues, leagueId), { owner: uid }) : Promise.resolve();
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
