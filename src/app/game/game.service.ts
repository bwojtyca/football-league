import { AngularFirestore } from 'angularfire2/firestore';
import { Injectable } from '@angular/core';
import { Game } from './game';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class GameService {
  private _games: Game[];

  constructor(
    private _db: AngularFirestore
  ) {
  }

  public getGames(): Observable<Game[]> {
    return this._db.collection('games').snapshotChanges().map((actions) => {
      const games = actions.map((action): Game => {
        const id = action.payload.doc.id;
        const data = action.payload.doc.data() as Game;
        return { id, ...data } as Game;
      });
      this._games = games;
      return games;
    });
  }

  public getGame(gameId: string): Observable<Game> {
    return this.getGames().map((games) => games.find((game) => game.id === gameId));
  }

  public getPlayerGames(playerId: string): Observable<Game[]> {
    return this.getGames().map((games) => games.filter((game) => game.players.includes(playerId)));
  }

  public createGame(teamRed: any, teamBlue: any): Observable<any> {
    const game = {
      players: [teamRed.defence.id, teamBlue.defence.id],
      start: new Date().toISOString(),
      teams: {
        red: {
          defence: {
            player: teamRed.defence.id,
            goals: 0,
            ownGoals: 0
          },
          offence: {
            player: teamRed.offence.id,
            goals: 0,
            ownGoals: 0
          }
        },
        blue: {
          defence: {
            player: teamBlue.defence.id,
            goals: 0,
            ownGoals: 0
          },
          offence: {
            player: teamBlue.offence.id,
            goals: 0,
            ownGoals: 0
          }
        }
      }
    };

    if (teamRed.defence.id !== teamRed.offence.id) {
      game.players.push(teamRed.offence.id);
    }

    if (teamBlue.defence.id !== teamBlue.offence.id) {
      game.players.push(teamBlue.offence.id);
    }

    return Observable.fromPromise(this._db.collection('games').add(game));
  }

  public updateGame(game: Game): Observable<any> {
    return Observable.fromPromise(this._db.doc(`games/${game.id}`).update(game));
  }

  public deleteGame(game: Game): Observable<any> {
    return Observable.fromPromise(this._db.doc(`games/${game.id}`).delete());
  }
}
