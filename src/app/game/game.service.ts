import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  increment,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

import { collectionData, docData, FIRESTORE } from '../firebase';
import { Player } from '../player/player';
import { Game, Position, Team, TeamColor, teamPlayers, winnerOf } from './game';

export interface TeamLineup {
  defence: Player;
  offence: Player;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _db = inject(FIRESTORE);
  private readonly _games = collection(this._db, 'games');

  /**
   * Every game, kept live for the whole session. Rankings, histories and stats are all
   * derived from this one listener; after the first load only changed games arrive.
   */
  public readonly games = toSignal(collectionData<Game>(this._games));

  /** Each player's games, newest first. */
  private readonly _byPlayer = computed(() => {
    const byPlayer = new Map<string, Game[]>();
    const games = [...(this.games() ?? [])].sort((a, b) =>
      a.start < b.start ? 1 : a.start > b.start ? -1 : 0,
    );
    for (const game of games) {
      for (const playerId of new Set(game.players)) {
        const list = byPlayer.get(playerId);
        if (list) {
          list.push(game);
        } else {
          byPlayer.set(playerId, [game]);
        }
      }
    }
    return byPlayer;
  });

  /** A player's games, newest first, or `undefined` while games are loading. */
  public playerGames(playerId: string): Game[] | undefined {
    return this.games() && (this._byPlayer().get(playerId) ?? []);
  }

  public getGame(gameId: string): Observable<Game | null> {
    return docData<Game>(doc(this._games, gameId));
  }

  /**
   * Creates a game. The id is known right away and the game shows up locally at once;
   * `saved` settles when the server has stored it.
   */
  public createGame(red: TeamLineup, blue: TeamLineup): { id: string; saved: Promise<void> } {
    const team = (lineup: TeamLineup): Team => ({
      defence: { player: lineup.defence.id, goals: 0, ownGoals: 0 },
      offence: { player: lineup.offence.id, goals: 0, ownGoals: 0 },
    });
    const teams = { red: team(red), blue: team(blue) };
    const game: Omit<Game, 'id'> = {
      players: [...teamPlayers(teams.red), ...teamPlayers(teams.blue)],
      start: new Date().toISOString(),
      teams,
    };
    const ref = doc(this._games);
    return { id: ref.id, saved: setDoc(ref, game) };
  }

  /**
   * Adds a goal (or own goal). The increment is applied locally at once, so the score
   * changes without waiting for the server, and goals from several devices add up.
   */
  public scoreGoal(
    gameId: string,
    color: TeamColor,
    position: Position,
    ownGoal: boolean,
  ): Promise<void> {
    const field = ownGoal ? 'ownGoals' : 'goals';
    return updateDoc(doc(this._games, gameId), {
      [`teams.${color}.${position}.${field}`]: increment(1),
    });
  }

  /**
   * Records the result of a game that has reached the target score. A transaction makes
   * sure it is recorded once even when several devices try. Resolves with the winner, or
   * `undefined` while the game is not decided.
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
        const winner = winnerOf(game);
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

  public deleteGame(gameId: string): Promise<void> {
    return deleteDoc(doc(this._games, gameId));
  }
}
