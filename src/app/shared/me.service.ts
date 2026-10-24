import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { PlayerService } from '../player/player.service';
import { AuthService } from './auth.service';

const ME_KEY = 'fl.me';

/**
 * Who plays on this device (canvas R6-kim-jestes): a player chosen once and kept in
 * localStorage. Signed in with Google, the choice is kept on the account instead, so it follows
 * the person to every device (sign-in step 3a). The league page then opens with their place,
 * the ranking marks their row and their profile is one tap away.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly _auth = inject(AuthService);
  private readonly _players = inject(PlayerService);
  private readonly _device = signal<string | null>(read());

  /** The account's player, unless someone else has claimed it meanwhile. */
  private readonly _account = computed(() => {
    const id = this._auth.player();
    const owner = id ? this._players.player(id)?.uid : undefined;
    return id && (!owner || owner === this._auth.uid()) ? id : null;
  });

  /** The player id of whoever uses this device, or `null` before they choose. */
  public readonly id = computed(() => this._account() ?? this._device());

  /** The player is claimed by another account: nobody else may say they are them. */
  public taken(playerId: string): boolean {
    const owner = this._players.player(playerId)?.uid;
    return !!owner && owner !== this._auth.uid();
  }

  /** The player is claimed by this Google account: theirs to dress. */
  public owns(playerId: string): boolean {
    const owner = this._players.player(playerId)?.uid;
    return !!owner && owner === this._auth.uid();
  }

  constructor() {
    effect(() => {
      if (!this._auth.signedIn()) {
        return;
      }
      const account = this._auth.player();
      const device = this._device();
      if (account === null && device && !this.taken(device)) {
        // A first sign-in keeps the choice made on this device before.
        untracked(() => this._auth.setPlayer(device)).catch(() => undefined);
      } else if (account && this._players.player(account) && !this._players.player(account)?.uid) {
        // Chosen before players could be claimed: claim them now.
        untracked(() => this._auth.setPlayer(account)).catch(() => undefined);
      }
    });
  }

  public set(playerId: string | null): void {
    this._device.set(playerId);
    try {
      if (playerId) {
        localStorage.setItem(ME_KEY, playerId);
      } else {
        localStorage.removeItem(ME_KEY);
      }
    } catch {
      // Storage may be off (private mode): the choice lasts until the page is closed.
    }
    this._auth.setPlayer(playerId).catch(() => undefined);
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(ME_KEY);
  } catch {
    return null;
  }
}
