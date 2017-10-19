import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Game} from './game';

@Injectable()
export class GameService {
  private _games: Game[];

  constructor() {
    this._games = [{
      players: [1, 2],
      start: new Date().toISOString(),
      teams: [{
        color: 'red',
        offence: {
          player: 1,
          goals: 0,
          ownGoals: 0
        },
        defence: {
          player: 1,
          goals: 0,
          ownGoals: 0
        }
      }, {
        color: 'blue',
        offence: {
          player: 2,
          goals: 0,
          ownGoals: 0
        },
        defence: {
          player: 2,
          goals: 0,
          ownGoals: 0
        }
      }]
    }];
  }

  public getGames(playerId?: number) {
    return Observable.of(
      playerId ?
        this._games.filter((game) => game.players.includes(playerId)) :
        this._games
    );
  }

}
