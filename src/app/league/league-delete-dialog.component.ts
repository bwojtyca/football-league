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
import { MatRadioModule } from '@angular/material/radio';
import { TranslocoPipe } from '@jsverse/transloco';

export interface LeagueDeleteData {
  name: string;
  games: number;
  archived: boolean;
}

/** What to do: archive (no new games), or delete, with or without the league's games. */
export type LeagueDeleteChoice = { archive: true } | { delete: true; withGames: boolean };

export function openLeagueDeleteDialog(dialog: MatDialog, data: LeagueDeleteData) {
  return dialog.open<LeagueDeleteDialogComponent, LeagueDeleteData, LeagueDeleteChoice>(
    LeagueDeleteDialogComponent,
    { data, width: '440px', maxWidth: '95vw' },
  );
}

/** Archive or delete a league (canvas P19); both can be undone. */
@Component({
  selector: 'fl-league-delete-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatRadioModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'settings.question' | transloco: { name: data.name } }}</h2>
    <mat-dialog-content>
      <mat-radio-group [(ngModel)]="choice" class="choices">
        @if (!data.archived) {
          <mat-radio-button value="archive">
            <b>{{ 'settings.archive' | transloco }}</b>
            <small>{{ 'settings.archiveHint' | transloco }}</small>
          </mat-radio-button>
        }
        <mat-radio-button value="delete">
          <b>{{ 'settings.deleteOption' | transloco }}</b>
          <small>{{ 'settings.deleteHint' | transloco }}</small>
        </mat-radio-button>
      </mat-radio-group>
      @if (choice() === 'delete') {
        <mat-checkbox [(ngModel)]="withGames">
          {{ 'settings.deleteGames' | transloco: { n: data.games } }}
        </mat-checkbox>
        <p class="hint">
          {{ (withGames() ? 'settings.deleteGamesHint' : 'settings.keepGamesHint') | transloco }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
      <button matButton="filled" [class.delete]="choice() === 'delete'" (click)="confirm()">
        {{ (choice() === 'delete' ? 'settings.delete' : 'settings.archive') | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .choices {
      display: grid;
      gap: 8px;
      margin-bottom: 8px;
    }
    .choices b {
      display: block;
    }
    .choices small {
      display: block;
      color: var(--fl-ink-2);
    }
    .hint {
      margin: 0 0 0 40px;
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
    .delete {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
    }
  `,
})
export class LeagueDeleteDialogComponent {
  protected readonly data = inject<LeagueDeleteData>(MAT_DIALOG_DATA);
  private readonly _ref = inject(MatDialogRef<LeagueDeleteDialogComponent, LeagueDeleteChoice>);

  protected readonly choice = signal<'archive' | 'delete'>(
    this.data.archived ? 'delete' : 'archive',
  );
  protected readonly withGames = signal(false);

  protected confirm(): void {
    this._ref.close(
      this.choice() === 'archive'
        ? { archive: true }
        : { delete: true, withGames: this.withGames() },
    );
  }
}
