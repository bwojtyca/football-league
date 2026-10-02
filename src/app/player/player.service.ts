import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { addDoc, collection } from 'firebase/firestore';
import { shareReplay } from 'rxjs';

import { collectionData, FIRESTORE } from '../firebase';
import { Player } from './player';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly _players = collection(inject(FIRESTORE), 'players');

  /** All players, kept live for the whole session so names can be resolved synchronously. */
  public readonly players$ = collectionData<Player>(this._players).pipe(shareReplay(1));
  public readonly players = toSignal(this.players$);
  private readonly _byId = computed(() => new Map(this.players()?.map((p) => [p.id, p])));

  public getPlayerName(playerId: string): string {
    if (!this.players()) {
      return '…';
    }
    return this._byId().get(playerId)?.name ?? `User id: ${playerId}`;
  }

  public addPlayer(name: string): Promise<unknown> {
    return addDoc(this._players, { name, wins: 0, loses: 0 });
  }
}
