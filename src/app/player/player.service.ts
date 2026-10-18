import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable, shareReplay } from 'rxjs';

import { FIRESTORE } from '../firebase';
import { LeagueService } from '../league/league.service';
import { Kit } from './kit';
import { Player } from './player';
import { shortNames } from './short-names';

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

  private readonly _leagues = inject(LeagueService);

  /**
   * Every player's short name: the first name, or "First L." when two in one of their leagues
   * share it; the most specific form any of their leagues needs, so it is the same everywhere.
   */
  private readonly _short = computed(() => {
    const names = new Map((this.players() ?? []).map((player) => [player.id, player.name]));
    const short = new Map<string, string>();
    const keep = (id: string, name: string) => {
      const known = short.get(id);
      if (!known || name.length > known.length) {
        short.set(id, name);
      }
    };
    for (const league of this._leagues.leagues() ?? []) {
      const members = league.players.filter((id) => names.has(id));
      for (const [id, name] of shortNames(new Map(members.map((id) => [id, names.get(id)!])))) {
        keep(id, name);
      }
    }
    // Players of no (visible) league: unique among themselves.
    const rest = [...names].filter(([id]) => !short.has(id));
    for (const [id, name] of shortNames(new Map(rest))) {
      keep(id, name);
    }
    return short;
  });

  /**
   * The one name a player has wherever room is tight (lists, tables, boards, charts), the same
   * on every page (evaluation 9: first name here, full or cut name there), unique in each of
   * their leagues. The full name stays in the profile's header, the players list and tooltips.
   */
  public shortName(playerId: string): string {
    if (!this.players()) {
      return '…';
    }
    return this._short().get(playerId) ?? '?';
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
