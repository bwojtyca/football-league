import { Injectable } from '@angular/core';
import { Player } from './player';
import { Observable } from 'rxjs/Observable';
import { AngularFirestore } from 'angularfire2/firestore';

@Injectable()
export class PlayerService {
  private _players: Player[];

  constructor(private _db: AngularFirestore) {
  }


  public getPlayers(): Observable<Player[]> {
    return this._db.collection('players').snapshotChanges().map((actions) => {
      const players = actions.map((action): Player => {
        const id = action.payload.doc.id;
        const data = action.payload.doc.data() as Player;
        return { id, ...data } as Player;
      });
      this._players = players;
      return players;
    });
  }

  public getPlayer(playerId: string): Observable<Player> {
    return this.getPlayers().map((players) => players.find((player) => player.id === playerId));
  }

  public getPlayerName(playerId: string): string {
    if (!this._players) {
      return `User id: ${playerId}`;
    }
    return this._players.find((player) => player.id === playerId).name;
  }

  public addPlayer(name: string): void {
    this._db.collection('players').add({ name, wins: 0, loses: 0 });
  }

  public updatePlayer(player: Player): Observable<any> {
    return Observable.fromPromise(this._db.doc(`players/${player.id}`).update(player));
  }

  public deletePlayer(player: Player): Observable<any> {
    return Observable.fromPromise(this._db.doc(`players/${player.id}`).delete());
  }
}
