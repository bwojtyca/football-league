import { Injectable, signal } from '@angular/core';

const ME_KEY = 'fl.me';

/**
 * Who plays on this device (canvas R6-kim-jestes): a player chosen once and kept in
 * localStorage, without an account. The league page then opens with their place, the ranking
 * marks their row and their profile is one tap away. Nothing is written to the database.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly _id = signal<string | null>(read());

  /** The player id of whoever uses this device, or `null` before they choose. */
  public readonly id = this._id.asReadonly();

  public set(playerId: string | null): void {
    this._id.set(playerId);
    try {
      if (playerId) {
        localStorage.setItem(ME_KEY, playerId);
      } else {
        localStorage.removeItem(ME_KEY);
      }
    } catch {
      // Storage may be off (private mode): the choice lasts until the page is closed.
    }
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(ME_KEY);
  } catch {
    return null;
  }
}
