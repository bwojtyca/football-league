import {Injectable} from '@angular/core';
import {Player} from './player';
import {Observable} from 'rxjs';
import {AngularFirestore} from 'angularfire2/firestore';

@Injectable()
export class PlayerService {
  private _players: Player[];

  constructor(private _db: AngularFirestore) {
  }

  public addPlayer(name: string): void {
    this._db.collection('players').add({name, wins: 0, loses: 0});
  }

  public getPlayers(): Observable<Player[]> {
    return this._db.collection('players').snapshotChanges().map((actions) => {
      const players = actions.map((action): Player => {
        const id = action.payload.doc.id;
        const data = action.payload.doc.data() as Player;
        return {id, ...data} as Player;
      });
      this._players = players;
      return players;
    });
  }

  public getPlayerName(id: string): string {
    if (!this._players) {
      return `User id: ${id}`;
    }
    return this._players.find((player) => player.id === id).name;
  }
}