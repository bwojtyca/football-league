import { Component, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { openWhoSheet } from '../league/who-sheet.component';
import { Notifier } from '../notifier';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { PlayerService } from '../player/player.service';
import { AuthService } from './auth.service';
import { MeService } from './me.service';

/**
 * Who uses the app, in one place (owner, 25 Oct 2026): the player (in their kit), the Google
 * account under it, and signing in or out beside it. Tapping the player picks another one.
 * In the page menu, and one line shorter at the foot of a wide screen's rail.
 */
@Component({
  selector: 'fl-account',
  imports: [AvatarComponent, MatButtonModule, MatIconModule, TranslocoPipe],
  host: { '[class.compact]': 'compact()' },
  template: `
    <button class="who" (click)="who()" [disabled]="!leagueId()">
      @if (me.id(); as id) {
        <fl-avatar [playerId]="id" [name]="players.getPlayerName(id)" [size]="compact() ? 32 : 40" />
      } @else {
        <mat-icon class="nobody" aria-hidden="true">person_pin</mat-icon>
      }
      <span class="label">
        <b>{{ me.id() ? players.shortName(me.id()!) : ('me.deviceNone' | transloco) }}</b>
        <small>{{ auth.signedIn() ? auth.email() : ('auth.noAccount' | transloco) }}</small>
      </span>
    </button>
    @if (auth.signedIn()) {
      <button matButton class="action" (click)="signOut()">{{ 'auth.signOut' | transloco }}</button>
    } @else {
      <button
        matButton
        class="action"
        (click)="signIn()"
        [disabled]="auth.user() === undefined"
        [attr.aria-label]="'auth.signIn' | transloco"
      >
        {{ 'auth.signInShort' | transloco }}
      </button>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 8px;
    }
    .who {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: center;
      column-gap: 12px;
      min-height: 56px;
      padding: 4px;
      border: 0;
      border-radius: 12px;
      background: none;
      color: var(--fl-ink);
      text-align: left;
      cursor: pointer;
    }
    .who:disabled {
      cursor: default;
    }
    .who:not(:disabled):hover {
      background: var(--fl-card-2);
    }
    .nobody {
      justify-self: center;
      color: var(--fl-ink-2);
    }
    .label {
      display: grid;
      min-width: 0;
    }
    .label b,
    .label small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .label b {
      font: 700 1rem/1.25 var(--fl-display);
    }
    .label small {
      font: 400 0.8125rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
    /* The rail of a wide screen: a smaller face, the text a size down. */
    :host(.compact) .who {
      grid-template-columns: 32px minmax(0, 1fr);
      column-gap: 10px;
      min-height: 48px;
      padding: 4px 8px;
    }
    :host(.compact) .label b {
      font-size: 0.9375rem;
    }
    :host(.compact) .action {
      --mat-button-text-container-height: 32px;
      --mat-button-text-horizontal-padding: 8px;
      font-size: 0.8125rem;
    }
  `,
})
export class AccountComponent {
  protected readonly auth = inject(AuthService);
  protected readonly me = inject(MeService);
  protected readonly players = inject(PlayerService);
  private readonly _sheet = inject(MatBottomSheet);
  private readonly _notifier = inject(Notifier);

  /** One line shorter, for the rail. */
  public readonly compact = input(false);
  /** The league whose players to pick from (the page's, or the last one opened). */
  public readonly leagueId = input<string | null>(null);

  protected who(): void {
    const leagueId = this.leagueId();
    if (leagueId) {
      openWhoSheet(this._sheet, { leagueId });
    }
  }

  protected signIn(): void {
    this.auth.signInWithGoogle().catch((error) => this._notifier.error('error.signIn', error));
  }

  protected signOut(): void {
    this.auth.signOut().catch((error) => this._notifier.error('error.signIn', error));
  }
}
