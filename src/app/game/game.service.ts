import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocFromServer,
  increment,
  runTransaction,
  setDoc,
  updateDoc,
  waitForPendingWrites,
  writeBatch,
} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { map, Observable } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { ALL_LEAGUES, leagueOf } from '../league/league';
import { computeRatings, Ratings } from '../player/rating';
import {
  decidedWinner,
  Game,
  playTime,
  GameEvent,
  GameMode,
  Lineup,
  Position,
  Series,
  swapPositions,
  Team,
  TeamColor,
  teamPlayers,
} from './game';

/** Milliseconds of play so far (pauses left out), as logged with each event. */
function elapsed(game: Pick<Game, 'start' | 'paused' | 'pausedFor'>): number {
  return playTime(game, Date.now());
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _db = inject(FIRESTORE);
  private readonly _games = collection(this._db, 'games');

  private readonly _stored = toSignal(
    collectionData(this._games, { idField: 'id' }) as Observable<Game[]>,
  );

  /**
   * Every game that is not deleted, kept live for the whole session. Rankings, histories and
   * stats are all derived from this one listener; after the first load only changed games
   * arrive.
   */
  public readonly games = computed(() => this._stored()?.filter((game) => !game.deleted));

  /** Each league's games, newest first; `ALL_LEAGUES` has every game. */
  private readonly _byLeague = computed(() => {
    const byLeague = new Map<string, Game[]>();
    const games = [...(this.games() ?? [])].sort((a, b) =>
      a.start < b.start ? 1 : a.start > b.start ? -1 : 0,
    );
    for (const game of games) {
      const league = leagueOf(game);
      const list = byLeague.get(league);
      if (list) {
        list.push(game);
      } else {
        byLeague.set(league, [game]);
      }
    }
    byLeague.set(ALL_LEAGUES, games);
    return byLeague;
  });

  /** Elo ratings of every league. */
  private readonly _ratings = computed(() => {
    const ratings = new Map<string, Ratings>();
    for (const [league, games] of this._byLeague()) {
      ratings.set(league, computeRatings(games));
    }
    return ratings;
  });

  /** A league's games, newest first, or `undefined` while games are loading. */
  public leagueGames(leagueId: string): Game[] | undefined {
    return this.games() && (this._byLeague().get(leagueId) ?? []);
  }

  /** A player's games in a league, newest first, or `undefined` while games are loading. */
  public playerGames(leagueId: string, playerId: string): Game[] | undefined {
    return this.leagueGames(leagueId)?.filter((game) => game.players.includes(playerId));
  }

  /** Games of the series `game` belongs to, oldest first. */
  public seriesGames(game: Pick<Game, 'league' | 'series'>): Game[] | undefined {
    const id = game.series?.id;
    return id
      ? this.leagueGames(leagueOf(game))
          ?.filter((other) => other.series?.id === id)
          .reverse()
      : undefined;
  }

  /** Games of a tournament, oldest first. */
  public tournamentGames(leagueId: string, tournamentId: string): Game[] | undefined {
    return this.leagueGames(leagueId)
      ?.filter((game) => game.tournament === tournamentId)
      .reverse();
  }

  public ratings(leagueId: string): Ratings | undefined {
    return this.games() && (this._ratings().get(leagueId) ?? computeRatings([]));
  }

  public getGame(gameId: string): Observable<Game | null> {
    return (
      docData(doc(this._games, gameId), { idField: 'id' }) as Observable<Game | undefined>
    ).pipe(map((game) => game ?? null));
  }

  /**
   * Creates a game. The id is known right away and the game shows up locally at once;
   * `saved` settles when the server has stored it. A `series` without an id starts a new
   * series with this game.
   */
  public createGame(
    leagueId: string,
    red: Lineup,
    blue: Lineup,
    mode: GameMode,
    {
      series,
      tournament,
    }: { series?: Omit<Series, 'id'> & { id?: string }; tournament?: string } = {},
  ): { id: string; saved: Promise<void> } {
    const team = (lineup: Lineup): Team => ({
      defence: { player: lineup.defence, goals: 0, ownGoals: 0 },
      offence: { player: lineup.offence, goals: 0, ownGoals: 0 },
    });
    const ref = doc(this._games);
    const teams = { red: team(red), blue: team(blue) };
    const game: Omit<Game, 'id'> = {
      league: leagueId,
      players: [...teamPlayers(teams.red), ...teamPlayers(teams.blue)],
      start: new Date().toISOString(),
      teams,
      mode: { ...mode },
      events: [],
      ...(series && { series: { ...series, id: series.id ?? ref.id } }),
      ...(tournament && { tournament }),
    };
    return { id: ref.id, saved: setDoc(ref, game) };
  }

  /**
   * Adds a goal (or own goal) and logs it. The increment is applied locally at once, so the
   * score changes without waiting for the server, and goals from several devices add up.
   */
  public scoreGoal(
    game: Game,
    color: TeamColor,
    position: Position,
    ownGoal: boolean,
  ): Promise<void> {
    const field = ownGoal ? 'ownGoals' : 'goals';
    const event: GameEvent = {
      at: elapsed(game),
      type: ownGoal ? 'own' : 'goal',
      team: color,
      position,
      player: game.teams[color][position].player,
    };
    return updateDoc(doc(this._games, game.id), {
      [`teams.${color}.${position}.${field}`]: increment(1),
      // Games started by an older version of the app keep no log.
      ...(game.events && { events: arrayUnion(event) }),
    });
  }

  /** The defender and the attacker of a team change places (allowed between goals). */
  public swapPositions(game: Game, color: TeamColor): Promise<void> {
    const event: GameEvent = { at: elapsed(game), type: 'swap', team: color };
    return updateDoc(doc(this._games, game.id), {
      [`teams.${color}`]: swapPositions(game.teams[color]),
      events: arrayUnion(event),
    });
  }

  /** Takes back the last goal or swap. The rules refuse it if anything happened since. */
  public undo(game: Game): Promise<void> {
    const last = game.events?.at(-1);
    if (!last) {
      return Promise.resolve();
    }
    const revert =
      last.type === 'swap'
        ? { [`teams.${last.team}`]: swapPositions(game.teams[last.team]) }
        : {
            [`teams.${last.team}.${last.position}.${last.type === 'own' ? 'ownGoals' : 'goals'}`]:
              increment(-1),
          };
    return updateDoc(doc(this._games, game.id), { ...revert, events: arrayRemove(last) });
  }

  /** Stops the clock; the game can be finished later. */
  public pause(game: Game): Promise<void> {
    return updateDoc(doc(this._games, game.id), { paused: new Date().toISOString() });
  }

  public resume(game: Game): Promise<void> {
    if (!game.paused) {
      return Promise.resolve();
    }
    const pause = Math.max(0, Date.now() - Date.parse(game.paused));
    return updateDoc(doc(this._games, game.id), {
      paused: deleteField(),
      pausedFor: Math.round((game.pausedFor ?? 0) + pause),
    });
  }

  /** Settles when every write made on this device so far has reached the server. */
  public whenSaved(): Promise<void> {
    return waitForPendingWrites(this._db);
  }

  /**
   * Records the result of a decided game: on goals, or for a timed game by the team ahead
   * when the time is up. A transaction makes sure it is recorded once even when several
   * devices try. Resolves with the winner, or `undefined` while the game is not decided.
   */
  public async closeGame(gameId: string): Promise<TeamColor | undefined> {
    const ref = doc(this._games, gameId);
    try {
      return await runTransaction(this._db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) {
          return undefined;
        }
        const game = snapshot.data() as Omit<Game, 'id'>;
        if (game.end) {
          return game.win;
        }
        const winner = decidedWinner(game, Date.now());
        if (winner) {
          transaction.update(ref, { end: new Date().toISOString(), win: winner });
        }
        return winner;
      });
    } catch (error) {
      // When another device closes the game first, the rules refuse this write instead of
      // letting the transaction retry; the game is closed all the same.
      const game = (await getDocFromServer(ref)).data() as Omit<Game, 'id'> | undefined;
      if (game?.end) {
        return game.win;
      }
      throw error;
    }
  }

  /** Hides (or brings back) every game of a league, deleted ones included when restoring. */
  public async setLeagueGamesDeleted(leagueId: string, deleted: boolean): Promise<void> {
    const games = (this._stored() ?? []).filter(
      (game) => leagueOf(game) === leagueId && !!game.deleted !== deleted,
    );
    // A batch takes at most 500 writes.
    for (let i = 0; i < games.length; i += 500) {
      const batch = writeBatch(this._db);
      for (const game of games.slice(i, i + 500)) {
        batch.update(doc(this._games, game.id), { deleted });
      }
      await batch.commit();
    }
  }

  /** Hides a game from rankings and stats, or brings it back. */
  public setDeleted(gameId: string, deleted: boolean): Promise<void> {
    return updateDoc(doc(this._games, gameId), { deleted });
  }

  public deleteGame(gameId: string): Promise<void> {
    return deleteDoc(doc(this._games, gameId));
  }
}
