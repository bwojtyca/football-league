import { computed, inject, Injectable, Injector, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  arrayUnion,
  collection,
  doc,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { map, Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { GameService } from '../game/game.service';
import { deviceLeagues } from '../league/device-leagues';
import { ALL_LEAGUES } from '../league/league';
import { Entry, Tournament } from './tournament';

/** Running tournaments first, then newest first. */
function runningNewestFirst(a: Tournament, b: Tournament): number {
  return (
    Number(!!a.end) - Number(!!b.end) ||
    (a.created < b.created ? 1 : a.created > b.created ? -1 : 0)
  );
}

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly _db = inject(FIRESTORE);
  private readonly _gameService = inject(GameService);
  private readonly _tournaments = collection(this._db, 'tournaments');
  private readonly _injector = inject(Injector);

  /** Each league's tournaments once asked for: one listener per league, kept for the session. */
  private readonly _leagues = new Map<string, Signal<Tournament[] | undefined>>();
  /** Single tournaments asked for by id (a tournament's page, a game's tournament name). */
  private readonly _byId = new Map<string, Signal<Tournament | null | undefined>>();

  private _league(leagueId: string): Signal<Tournament[] | undefined> {
    let league = this._leagues.get(leagueId);
    if (!league) {
      // Created on first use, which can be inside a computed: the listener itself is not.
      const stored = untracked(() =>
        toSignal(
          collectionData(query(this._tournaments, where('league', '==', leagueId)), {
            idField: 'id',
          }) as Observable<Tournament[]>,
          { injector: this._injector },
        ),
      );
      league = computed(() => stored()?.filter((one) => !one.deleted).sort(runningNewestFirst));
      this._leagues.set(leagueId, league);
    }
    return league;
  }

  /** "Your leagues" (`ALL_LEAGUES`): those opened on this device, until there are accounts. */
  private readonly _all = computed(() => {
    const lists = deviceLeagues().map((id) => this._league(id)());
    const loaded = lists.filter((list): list is Tournament[] => !!list);
    return loaded.length < lists.length ? undefined : loaded.flat().sort(runningNewestFirst);
  });

  /** Running ones first, newest first; `undefined` while loading. */
  public leagueTournaments(leagueId: string): Tournament[] | undefined {
    return leagueId === ALL_LEAGUES ? this._all() : this._league(leagueId)();
  }

  /** Deleted ones included; `undefined` while loading, `null` when there is no such tournament. */
  public tournament(id: string): Tournament | null | undefined {
    let one = this._byId.get(id);
    if (!one) {
      // `undefined` while it loads, `null` when there is no such document.
      one = untracked(() =>
        toSignal(
          (
            docData(doc(this._tournaments, id), { idField: 'id' }) as Observable<
              Tournament | undefined
            >
          ).pipe(map((tournament) => tournament ?? null)),
          { injector: this._injector },
        ),
      );
      this._byId.set(id, one);
    }
    return one();
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
