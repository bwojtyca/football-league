import { Injectable, signal } from '@angular/core';

/**
 * What the "+" does on the page shown: a page with a play of its own (a tournament's next game)
 * registers it, other pages leave the "+" to open "What are we playing?" (evaluation 15: on a
 * tournament the yellow "+" ignored the tournament).
 */
@Injectable({ providedIn: 'root' })
export class PagePlayService {
  private readonly _action = signal<(() => void) | null>(null);
  public readonly action = this._action.asReadonly();

  /** Sets the page's play; the returned function clears it, unless another page set its own. */
  public register(action: (() => void) | null): () => void {
    this._action.set(action);
    return () => {
      if (this._action() === action) {
        this._action.set(null);
      }
    };
  }
}
