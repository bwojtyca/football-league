import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslocoPipe } from '@jsverse/transloco';

export interface TournamentDeleteData {
  name: string;
  /** How many games the tournament has. */
  games: number;
}

export function openTournamentDeleteDialog(dialog: MatDialog, data: TournamentDeleteData) {
  return dialog.open<TournamentDeleteDialogComponent, TournamentDeleteData, { withGames: boolean }>(
    TournamentDeleteDialogComponent,
    { data, width: '420px', maxWidth: '95vw' },
  );
}

/** Asks before deleting a tournament, and whether its games go with it. */
@Component({
  selector: 'fl-tournament-delete-dialog',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, TranslocoPipe],
  template: `
    <h2 mat-dialog-title>{{ 'tournament.delete' | transloco }}</h2>
    <mat-dialog-content>
      <p>{{ 'tournament.deleteConfirm' | transloco: { name: data.name } }}</p>
      @if (data.games) {
        <mat-checkbox [ngModel]="withGames()" (ngModelChange)="withGames.set($event)">
          {{ 'tournament.deleteGames' | transloco: { n: data.games } }}
        </mat-checkbox>
        <p class="hint">
          {{
            (withGames() ? 'tournament.deleteGamesHint' : 'tournament.keepGamesHint') | transloco
          }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
      <button matButton="filled" class="delete" (click)="confirm()">
        {{ 'tournament.delete' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    p {
      margin: 0 0 8px;
    }
    .hint {
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
    .delete {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
    }
  `,
})
export class TournamentDeleteDialogComponent {
  protected readonly data = inject<TournamentDeleteData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<TournamentDeleteDialogComponent>);

  protected readonly withGames = signal(false);

  protected confirm(): void {
    this._dialogRef.close({ withGames: this.withGames() });
  }
}
