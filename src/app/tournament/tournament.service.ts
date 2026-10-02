import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { arrayUnion, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { Entry, Tournament } from './tournament';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly _tournaments = collection(inject(FIRESTORE), 'tournaments');
  private readonly _all = toSignal(
    collectionData(this._tournaments, { idField: 'id' }) as Observable<Tournament[]>,
  );

  /** Tournaments by league: running ones first, newest first. */
  private readonly _byLeague = computed(() => {
    const byLeague = new Map<string, Tournament[]>();
    const sorted = [...(this._all() ?? [])].sort(
      (a, b) =>
        Number(!!a.end) - Number(!!b.end) ||
        (a.created < b.created ? 1 : a.created > b.created ? -1 : 0),
    );
    for (const tournament of sorted) {
      byLeague.set(tournament.league, [...(byLeague.get(tournament.league) ?? []), tournament]);
    }
    return byLeague;
  });

  /** `undefined` while loading. */
  public leagueTournaments(leagueId: string): Tournament[] | undefined {
    return this._all() && (this._byLeague().get(leagueId) ?? []);
  }

  /** `undefined` while loading, `null` when there is no such tournament. */
  public tournament(id: string): Tournament | null | undefined {
    const all = this._all();
    return all && (all.find((tournament) => tournament.id === id) ?? null);
  }

  public create(tournament: Omit<Tournament, 'id' | 'created'>): {
    id: string;
    saved: Promise<void>;
  } {
    const ref = doc(this._tournaments);
    return {
      id: ref.id,
      saved: setDoc(ref, { ...tournament, created: new Date().toISOString() }),
    };
  }

  public join(tournamentId: string, player: string): Promise<void> {
    return this._addEntry(tournamentId, { player, at: new Date().toISOString() });
  }

  public leave(tournamentId: string, player: string): Promise<void> {
    return this._addEntry(tournamentId, { player, at: new Date().toISOString(), out: true });
  }

  public finish(tournamentId: string): Promise<void> {
    return updateDoc(doc(this._tournaments, tournamentId), { end: new Date().toISOString() });
  }

  private _addEntry(tournamentId: string, entry: Entry): Promise<void> {
    return updateDoc(doc(this._tournaments, tournamentId), { entries: arrayUnion(entry) });
  }
}
