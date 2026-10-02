import { Component, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { openNewGameDialog } from '../game/game-new/game-new-dialog/game-new-dialog.component';
import { NEW_GAME_MODE } from '../game/game';
import { GameService } from '../game/game.service';
import { openTournamentNewDialog } from '../tournament/tournament-new-dialog/tournament-new-dialog.component';

export function openNewPlaySheet(sheet: MatBottomSheet, leagueId: string) {
  return sheet.open(NewPlaySheetComponent, { data: leagueId });
}

/** What to play next: one game, a series between two teams, or a tournament. */
@Component({
  selector: 'fl-new-play-sheet',
  imports: [MatIconModule, TranslocoPipe],
  template: `
    <h2 class="fl-kicker">{{ 'play.title' | transloco }}</h2>
    <div class="options">
      <button class="option" (click)="game()">
        <mat-icon aria-hidden="true">sports_soccer</mat-icon>
        <b>{{ 'play.game' | transloco }}</b>
        <small>{{ 'play.gameHint' | transloco }}</small>
      </button>
      <button class="option" (click)="game(true)">
        <mat-icon aria-hidden="true">repeat</mat-icon>
        <b>{{ 'play.series' | transloco }}</b>
        <small>{{ 'play.seriesHint' | transloco }}</small>
      </button>
      <button class="option" (click)="tournament()">
        <mat-icon aria-hidden="true">emoji_events</mat-icon>
        <b>{{ 'play.tournament' | transloco }}</b>
        <small>{{ 'play.tournamentHint' | transloco }}</small>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 0 12px;
    }
    h2 {
      margin: 4px 0 10px;
    }
    .options {
      display: grid;
      gap: 8px;
    }
    .option {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr);
      align-items: center;
      column-gap: 12px;
      min-height: 64px;
      padding: 10px 14px 10px 10px;
      border: 1px solid var(--fl-line);
      border-radius: 12px;
      background: var(--fl-card);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .option:first-child {
      border-color: var(--fl-ball);
      box-shadow: inset 0 0 0 1px var(--fl-ball);
    }
    .option mat-icon {
      grid-row: 1 / span 2;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--fl-card-2);
      font-size: 24px;
    }
    .option:first-child mat-icon {
      background: var(--fl-ball);
      color: var(--fl-on-ball);
    }
    b {
      font: italic 800 1.2rem/1.1 var(--fl-display);
      text-transform: uppercase;
    }
    small {
      color: var(--fl-ink-2);
      line-height: 1.3;
    }
  `,
})
export class NewPlaySheetComponent {
  private readonly _leagueId = inject<string>(MAT_BOTTOM_SHEET_DATA);
  private readonly _ref = inject(MatBottomSheetRef<NewPlaySheetComponent>);
  private readonly _dialog = inject(MatDialog);
  private readonly _gameService = inject(GameService);

  /** A game or a series, with the teams of the league's latest game filled in. */
  protected game(series = false): void {
    this._ref.dismiss();
    const previousGame = this._gameService.leagueGames(this._leagueId)?.[0];
    openNewGameDialog(this._dialog, {
      leagueId: this._leagueId,
      previousGame,
      // The rules of a tournament game stay in the tournament.
      mode: previousGame?.tournament ? NEW_GAME_MODE : undefined,
      series,
    });
  }

  protected tournament(): void {
    this._ref.dismiss();
    openTournamentNewDialog(this._dialog, { leagueId: this._leagueId });
  }
}
