import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { arrayUnion, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { League } from './league';

const LAST_LEAGUE_KEY = 'fl.league';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private readonly _leagues = collection(inject(FIRESTORE), 'leagues');
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

  /** A league, deleted ones included; `undefined` while loading, `null` when there is none. */
  public league(id: string): League | null | undefined {
    const leagues = this._stored();
    return leagues && (leagues.find((league) => league.id === id) ?? null);
  }

  /** Renames, locks or unlocks, sets the ranking threshold, deletes or restores a league. */
  public update(
    id: string,
    changes: Partial<Pick<League, 'name' | 'archived' | 'minGames' | 'deleted'>>,
  ): Promise<void> {
    return updateDoc(doc(this._leagues, id), changes);
  }

  public createLeague(name: string): { id: string; saved: Promise<void> } {
    const ref = doc(this._leagues);
    return {
      id: ref.id,
      saved: setDoc(ref, { name, created: new Date().toISOString(), players: [] }),
    };
  }

  public addPlayer(leagueId: string, playerId: string): Promise<void> {
    return updateDoc(doc(this._leagues, leagueId), { players: arrayUnion(playerId) });
  }

  /** The league opened last on this device, to come back to it on the next visit. */
  public get lastLeague(): string | null {
    try {
      return localStorage.getItem(LAST_LEAGUE_KEY);
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
  }
}
