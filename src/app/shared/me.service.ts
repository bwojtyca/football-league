import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

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
  private readonly _device = signal<string | null>(read());

  /** The player id of whoever uses this device, or `null` before they choose. */
  public readonly id = computed(() => this._auth.player() ?? this._device());

  constructor() {
    // A first sign-in keeps the choice made on this device before.
    effect(() => {
      const device = this._device();
      if (this._auth.signedIn() && this._auth.player() === null && device) {
        untracked(() => this._auth.setPlayer(device)).catch(() => undefined);
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
