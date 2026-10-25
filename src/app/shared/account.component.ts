import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { Notifier } from '../notifier';
import { AuthService } from './auth.service';

/**
 * The Google account in the page menu and the rail: "Sign in with Google" (the player chosen
 * on this device then follows the person to every device), or the account and "Sign out".
 */
@Component({
  selector: 'fl-account',
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  host: { '[class.compact]': 'compact()' },
  template: `
    @if (auth.signedIn()) {
      <div class="row">
        <mat-icon aria-hidden="true">account_circle</mat-icon>
        <span class="label">
          <b>{{ auth.name() }}</b>
          <small>{{ 'auth.google' | transloco }}</small>
        </span>
        <button matButton (click)="signOut()">{{ 'auth.signOut' | transloco }}</button>
      </div>
    } @else {
      <button class="row" (click)="signIn()" [disabled]="auth.user() === undefined">
        <mat-icon aria-hidden="true">login</mat-icon>
        <span class="label">
          <b>{{ 'auth.signIn' | transloco }}</b>
          <small>{{ 'auth.signInHint' | transloco }}</small>
        </span>
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .row {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
      box-sizing: border-box;
      width: 100%;
      min-height: 56px;
      padding: 4px;
      border: 0;
      background: none;
      color: var(--fl-ink);
      text-align: left;
      font: 700 1rem/1.25 var(--fl-display);
      cursor: pointer;
    }
    .row mat-icon {
      justify-self: center;
      color: var(--fl-ink-2);
    }
    .label {
      display: grid;
      min-width: 0;
    }
    .label b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .label small {
      font: 400 0.875rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
    /* In the rail of a wide screen: a row like the rail's others (owner, 25 Oct 2026: the
       two-line menu row looked broken there). */
    :host(.compact) .row {
      grid-template-columns: 24px minmax(0, 1fr) auto;
      min-height: 44px;
      padding: 0 4px 0 12px;
      border-radius: 12px;
      color: var(--fl-ink-2);
      font: 600 0.9375rem/1.25 var(--fl-display);
    }
    :host(.compact) button.row:hover {
      background: var(--fl-card-2);
    }
    :host(.compact) .label small {
      display: none;
    }
    :host(.compact) .label b {
      font-weight: 600;
    }
    :host(.compact) .row button {
      --mat-button-text-container-height: 32px;
      --mat-button-text-horizontal-padding: 8px;
      font-size: 0.8125rem;
    }
  `,
})
export class AccountComponent {
  /** One line, as the rail's rows. */
  public readonly compact = input(false);
  protected readonly auth = inject(AuthService);
  private readonly _notifier = inject(Notifier);

  protected signIn(): void {
    this.auth.signInWithGoogle().catch((error) => this._notifier.error('error.signIn', error));
  }

  protected signOut(): void {
    this.auth.signOut().catch((error) => this._notifier.error('error.signIn', error));
  }
}
