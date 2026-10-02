import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

import { collectionData, docData, FIRESTORE } from '../firebase';
import { Player } from '../player/player';
import { Game, opponent, Position, Team, TeamColor, teamPlayers, winnerOf } from './game';

export interface TeamLineup {
  defence: Player;
  offence: Player;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _db = inject(FIRESTORE);
  private readonly _games = collection(this._db, 'games');

  public getGame(gameId: string): Observable<Game | null> {
    return docData<Game>(doc(this._games, gameId));
  }

  public getPlayerGames(playerId: string): Observable<Game[]> {
    return collectionData<Game>(query(this._games, where('players', 'array-contains', playerId)));
  }

  /** Creates a game and resolves with its id. */
  public async createGame(red: TeamLineup, blue: TeamLineup): Promise<string> {
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
    const ref = await addDoc(this._games, game);
    return ref.id;
  }

  /**
   * Records a goal (or own goal). When it decides the game, the game is closed and
   * both teams' win/loss counters are updated in the same transaction, so taps from
   * several devices can neither lose a goal nor count a result twice.
   *
   * Resolves with the winning colour when this goal ended the game.
   */
  public scoreGoal(
    gameId: string,
    color: TeamColor,
    position: Position,
    ownGoal: boolean,
  ): Promise<TeamColor | undefined> {
    const ref = doc(this._games, gameId);
    return runTransaction(this._db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) {
        return undefined;
      }
      const game = { ...snapshot.data(), id: snapshot.id } as Game;
      if (game.end) {
        return undefined;
      }

      const field = ownGoal ? 'ownGoals' : 'goals';
      const value = game.teams[color][position][field] + 1;
      game.teams[color][position][field] = value;
      const update: Record<string, unknown> = { [`teams.${color}.${position}.${field}`]: value };

      const winner = winnerOf(game);
      if (winner) {
        update['end'] = new Date().toISOString();
        update['win'] = winner;
        for (const playerId of teamPlayers(game.teams[winner])) {
          transaction.update(doc(this._db, 'players', playerId), { wins: increment(1) });
        }
        for (const playerId of teamPlayers(game.teams[opponent(winner)])) {
          transaction.update(doc(this._db, 'players', playerId), { loses: increment(1) });
        }
      }
      transaction.update(ref, update);
      return winner;
    });
  }

  public deleteGame(gameId: string): Promise<void> {
    return deleteDoc(doc(this._games, gameId));
  }
}
