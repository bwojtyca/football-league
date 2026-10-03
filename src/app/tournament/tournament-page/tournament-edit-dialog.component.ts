import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameMode } from '../../game/game';
import { ModePickerComponent } from '../../game/mode/mode-picker.component';
import { Notifier } from '../../notifier';
import { Tournament } from '../tournament';
import { TournamentService } from '../tournament.service';

export function openTournamentEditDialog(dialog: MatDialog, tournament: Tournament) {
  return dialog.open<TournamentEditDialogComponent, Tournament>(TournamentEditDialogComponent, {
    data: tournament,
    width: '480px',
    maxWidth: '95vw',
  });
}

/** Renames a tournament and, while it runs, changes the rules of its next games. */
@Component({
  selector: 'fl-tournament-edit-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ModePickerComponent,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'tournament.edit' | transloco }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>{{ 'tournament.nameLabel' | transloco }}</mat-label>
        <input
          matInput
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
          maxlength="60"
          autocomplete="off"
          required
        />
      </mat-form-field>
      @if (!tournament.end) {
        <h3 class="fl-kicker">{{ 'tournament.nextRules' | transloco }}</h3>
        <fl-mode-picker [(mode)]="mode" />
        <p class="hint">{{ 'tournament.nextRulesHint' | transloco }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
      <button matButton="filled" (click)="save()" [disabled]="!name().trim()">
        {{ 'common.save' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 4px;
    }
    h3 {
      margin: 4px 0 8px;
    }
    .hint {
      margin: 8px 0 0;
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
  `,
})
export class TournamentEditDialogComponent {
  protected readonly tournament = inject<Tournament>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<TournamentEditDialogComponent>);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _notifier = inject(Notifier);

  protected readonly name = signal(this.tournament.name);
  protected readonly mode = signal<GameMode>({ ...this.tournament.mode });

  protected save(): void {
    const name = this.name().trim();
    const changes: Partial<Pick<Tournament, 'name' | 'mode'>> = {};
    if (name && name !== this.tournament.name) {
      changes.name = name;
    }
    if (
      !this.tournament.end &&
      JSON.stringify(this.mode()) !== JSON.stringify(this.tournament.mode)
    ) {
      changes.mode = this.mode();
    }
    if (Object.keys(changes).length) {
      this._tournamentService
        .update(this.tournament.id, changes)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
    this._dialogRef.close();
  }
}
