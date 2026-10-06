import { computed, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { arrayUnion, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { GameService } from '../game/game.service';
import { League } from './league';

const LAST_LEAGUE_KEY = 'fl.league';
const RECENT_KEY = 'fl.recentLeagues';
/** How many leagues opened on this device the leagues page lists. */
const RECENT_COUNT = 8;

function readRecent(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private readonly _leagues = collection(inject(FIRESTORE), 'leagues');
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
      saved: setDoc(ref, { name, created: new Date().toISOString(), players: [] }),
    };
  }

  public addPlayer(leagueId: string, playerId: string): Promise<void> {
    return updateDoc(doc(this._leagues, leagueId), { players: arrayUnion(playerId) });
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
    if (id) {
      this._remember(id);
    }
  }

  /** Leagues opened on this device, last first: "mine" until there are accounts. */
  public readonly recent = signal(readRecent());

  private _remember(id: string): void {
    // Called from effects: read without tracking, and leave the list alone when it is the same.
    const recent = untracked(() => this.recent());
    if (recent[0] === id) {
      return;
    }
    const ids = [id, ...recent.filter((other) => other !== id)].slice(0, RECENT_COUNT);
    this.recent.set(ids);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
    } catch {
      // Not remembered: private mode or storage blocked.
    }
  }
}
