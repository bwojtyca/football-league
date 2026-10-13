import { Component, computed, inject, signal } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameService } from '../game/game.service';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { PlayerService } from '../player/player.service';
import { MeService } from '../shared/me.service';
import { openAddPlayerDialog } from './add-player-dialog.component';
import { LeagueService } from './league.service';

export interface WhoSheetData {
  leagueId: string;
}

export function openWhoSheet(sheet: MatBottomSheet, data: WhoSheetData) {
  return sheet.open<WhoSheetComponent, WhoSheetData>(WhoSheetComponent, { data });
}

/**
 * "Which player are you?" (canvas R6-kim-jestes): the league's players, most games first; the
 * choice is kept on this device only (`MeService`), so nothing needs an account.
 */
@Component({
  selector: 'fl-who-sheet',
  imports: [MatButtonModule, MatIconModule, AvatarComponent, TranslocoPipe],
  template: `
    <h2 class="title">{{ 'me.title' | transloco }}</h2>
    <p class="hint">{{ 'me.hint' | transloco }}</p>
    <div class="options" role="radiogroup" [attr.aria-label]="'me.title' | transloco">
      @for (row of players(); track row.id) {
        <button
          class="option"
          role="radio"
          [attr.aria-checked]="picked() === row.id"
          (click)="picked.set(row.id)"
        >
          <fl-avatar [playerId]="row.id" [name]="row.name" [size]="40" />
          <span class="text">
            <b>{{ row.name }}</b>
            <small>{{ 'count.games' | transloco: { n: row.games } }}</small>
          </span>
          <i class="dot" aria-hidden="true"></i>
        </button>
      }
    </div>
    <button class="add" (click)="add()">
      <mat-icon aria-hidden="true">person_add</mat-icon>{{ 'me.notListed' | transloco }}
    </button>
    <button matButton="filled" class="fl-cta wide" [disabled]="!picked()" (click)="confirm()">
      @if (pickedName(); as name) {
        {{ 'me.confirm' | transloco: { name } }}
      } @else {
        {{ 'me.choose' | transloco }}
      }
    </button>
    @if (me.id()) {
      <button matButton class="clear" (click)="clear()">{{ 'me.clear' | transloco }}</button>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
    }
    .title {
      margin: 0;
      font: var(--fl-sheet-title);
    }
    .hint {
      margin: 0 0 4px;
      color: var(--fl-ink-2);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .options {
      display: grid;
      gap: 6px;
    }
    .option,
    .add {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      min-height: 56px;
      padding: 6px 12px;
      border: 0;
      border-radius: 14px;
      background: var(--fl-card);
      color: var(--fl-ink);
      text-align: left;
      font: inherit;
      cursor: pointer;
    }
    .option[aria-checked='true'] {
      background: var(--fl-card-2);
      box-shadow: inset 0 0 0 2px var(--fl-ball);
    }
    .text {
      flex: 1;
      min-width: 0;
      display: grid;
      line-height: 1.25;
    }
    .text b {
      font: 700 1rem/1.25 var(--fl-display);
    }
    .text small {
      color: var(--fl-ink-2);
    }
    .dot {
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      box-shadow: inset 0 0 0 2px var(--fl-line-2);
    }
    .option[aria-checked='true'] .dot {
      box-shadow: inset 0 0 0 7px var(--fl-ball);
    }
    .add {
      background: none;
      color: var(--fl-ball);
      font-weight: 700;
    }
    .wide {
      width: 100%;
      --mat-button-filled-container-height: 52px;
    }
    .clear {
      justify-self: center;
    }
  `,
})
export class WhoSheetComponent {
  private readonly _ref = inject(MatBottomSheetRef<WhoSheetComponent>);
  private readonly _dialog = inject(MatDialog);
  private readonly _leagueId = inject<WhoSheetData>(MAT_BOTTOM_SHEET_DATA).leagueId;
  private readonly _leagues = inject(LeagueService);
  private readonly _games = inject(GameService);
  private readonly _players = inject(PlayerService);
  protected readonly me = inject(MeService);

  /** The league's players, those with the most games first. */
  protected readonly players = computed(() => {
    const ids = this._leagues.league(this._leagueId)?.players ?? [];
    const games = this._games.leagueGames(this._leagueId) ?? [];
    return ids
      .map((id) => ({
        id,
        name: this._players.getPlayerName(id),
        games: games.filter((game) => game.end && game.players.includes(id)).length,
      }))
      .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
  });

  protected readonly picked = signal<string | null>(this.me.id());
  protected readonly pickedName = computed(() => {
    const id = this.picked();
    return id ? (this.players().find((row) => row.id === id)?.name ?? null) : null;
  });

  protected confirm(): void {
    this.me.set(this.picked());
    this._ref.dismiss();
  }

  protected clear(): void {
    this.me.set(null);
    this._ref.dismiss();
  }

  /** Not on the list: add the player to the league, and they are the one on this phone. */
  protected add(): void {
    this._ref.dismiss();
    openAddPlayerDialog(this._dialog, { leagueId: this._leagueId })
      .afterClosed()
      .subscribe((playerId?: string) => {
        if (playerId) {
          this.me.set(playerId);
        }
      });
  }
}
