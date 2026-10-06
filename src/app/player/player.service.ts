import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable, shareReplay } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { Kit } from './kit';
import { Player } from './player';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly _players = collection(inject(FIRESTORE), 'players');

  /** All players of all leagues, kept live so names can be resolved synchronously. */
  public readonly players$ = (
    collectionData(this._players, { idField: 'id' }) as Observable<Player[]>
  ).pipe(shareReplay(1));
  public readonly players = toSignal(this.players$);
  private readonly _byId = computed(() => new Map(this.players()?.map((p) => [p.id, p])));

  public player(playerId: string): Player | undefined {
    return this._byId().get(playerId);
  }

  public getPlayerName(playerId: string): string {
    if (!this.players()) {
      return '…';
    }
    return this._byId().get(playerId)?.name ?? '?';
  }

  /** Creates a player; the id is known right away. */
  public createPlayer(name: string): { id: string; saved: Promise<void> } {
    const ref = doc(this._players);
    return { id: ref.id, saved: setDoc(ref, { name }) };
  }

  /** Dresses a player in a kit (the rules let only the kit of a player change). */
  public setKit(playerId: string, kit: Kit): Promise<void> {
    return updateDoc(doc(this._players, playerId), { kit: { ...kit } });
  }
}
