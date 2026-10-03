import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { arrayUnion, collection, doc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { GameService } from '../game/game.service';
import { Entry, Tournament } from './tournament';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly _db = inject(FIRESTORE);
  private readonly _gameService = inject(GameService);
  private readonly _tournaments = collection(this._db, 'tournaments');
  private readonly _all = toSignal(
    collectionData(this._tournaments, { idField: 'id' }) as Observable<Tournament[]>,
  );

  /** Tournaments by league, deleted ones left out: running ones first, newest first. */
  private readonly _byLeague = computed(() => {
    const byLeague = new Map<string, Tournament[]>();
    const sorted = (this._all() ?? [])
      .filter((tournament) => !tournament.deleted)
      .sort(
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

  /** Deleted ones included; `undefined` while loading, `null` when there is no such tournament. */
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

  /** A new name, or new rules for the next games of a running tournament. */
  public update(tournamentId: string, changes: Partial<Pick<Tournament, 'name' | 'mode'>>) {
    return updateDoc(doc(this._tournaments, tournamentId), changes);
  }

  /** Deletes a tournament (it can be restored), with its games if asked. */
  public async remove(tournamentId: string, withGames: boolean): Promise<void> {
    await updateDoc(doc(this._tournaments, tournamentId), {
      deleted: true,
      gamesDeleted: withGames,
    });
    if (withGames) {
      await this._gameService.setTournamentGamesDeleted(tournamentId, true);
    }
  }

  /** Brings a deleted tournament back, and its games when they were deleted with it. */
  public async restore(tournamentId: string): Promise<void> {
    const withGames = !!this.tournament(tournamentId)?.gamesDeleted;
    await updateDoc(doc(this._tournaments, tournamentId), {
      deleted: false,
      gamesDeleted: false,
    });
    if (withGames) {
      await this._gameService.setTournamentGamesDeleted(tournamentId, false);
    }
  }

  public finish(tournamentId: string): Promise<void> {
    return updateDoc(doc(this._tournaments, tournamentId), { end: new Date().toISOString() });
  }

  /**
   * Ends a tournament its games have decided (a final, a series, every fixture played), at the
   * end of its last game. Every device showing it may try; only the first one writes.
   */
  public settle(tournamentId: string, end: string): Promise<void> {
    const ref = doc(this._tournaments, tournamentId);
    return runTransaction(this._db, async (transaction) => {
      const tournament = await transaction.get(ref);
      if (tournament.exists() && !tournament.get('end')) {
        transaction.update(ref, { end });
      }
    });
  }

  private _addEntry(tournamentId: string, entry: Entry): Promise<void> {
    return updateDoc(doc(this._tournaments, tournamentId), { entries: arrayUnion(entry) });
  }
}
