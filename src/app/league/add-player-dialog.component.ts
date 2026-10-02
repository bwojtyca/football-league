import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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

import { Notifier } from '../notifier';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { compareNames, Player } from '../player/player';
import { PlayerService } from '../player/player.service';
import { LeagueService } from './league.service';

export interface AddPlayerData {
  leagueId: string;
}

export function openAddPlayerDialog(dialog: MatDialog, data: AddPlayerData) {
  return dialog.open<AddPlayerDialogComponent, AddPlayerData>(AddPlayerDialogComponent, {
    data,
    width: '400px',
    maxWidth: '95vw',
  });
}

/** Adds a new player to a league, or one who already plays in another league. */
@Component({
  selector: 'fl-add-player-dialog',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    AvatarComponent,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'addPlayer.title' | transloco }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>{{ 'addPlayer.name' | transloco }}</mat-label>
        <input
          matInput
          [formControl]="name"
          [matAutocomplete]="auto"
          maxlength="50"
          autocomplete="off"
          (keydown.enter)="addNew()"
        />
        <mat-autocomplete
          #auto
          [displayWith]="displayName"
          (optionSelected)="addExisting($event.option.value)"
        >
          @for (player of suggestions(); track player.id) {
            <mat-option [value]="player">
              <span class="option">
                <fl-avatar [playerId]="player.id" [name]="player.name" [size]="28" />
                <span
                  >{{ player.name }}<small>{{ 'addPlayer.existing' | transloco }}</small></span
                >
              </span>
            </mat-option>
          }
        </mat-autocomplete>
        @if (name.hasError('required')) {
          <mat-error>{{ 'addPlayer.required' | transloco }}</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
      <button matButton="filled" (click)="addNew()">{{ 'addPlayer.add' | transloco }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .full {
      width: 100%;
      margin-top: 4px;
    }
    .option {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .option small {
      display: block;
      font-size: 11px;
      color: var(--fl-ink-2);
    }
  `,
})
export class AddPlayerDialogComponent {
  private readonly _data = inject<AddPlayerData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<AddPlayerDialogComponent>);
  private readonly _leagueService = inject(LeagueService);
  private readonly _playerService = inject(PlayerService);
  private readonly _notifier = inject(Notifier);

  protected readonly name = new FormControl<string | Player>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  private readonly _typed = toSignal(this.name.valueChanges, { initialValue: '' });

  /** Players from other leagues whose name starts with what was typed. */
  protected readonly suggestions = computed(() => {
    const typed = this._typed();
    const text = (typeof typed === 'string' ? typed : '').trim().toLowerCase();
    const members = new Set(this._leagueService.league(this._data.leagueId)?.players);
    if (!text) {
      return [];
    }
    return (this._playerService.players() ?? [])
      .filter((p) => !members.has(p.id) && p.name.toLowerCase().startsWith(text))
      .sort(compareNames)
      .slice(0, 6);
  });

  protected displayName(value: string | Player | null): string {
    return typeof value === 'string' ? value : (value?.name ?? '');
  }

  protected addExisting(player: Player): void {
    this._add(player.id, Promise.resolve());
  }

  protected addNew(): void {
    const value = this.name.value;
    const name = (typeof value === 'string' ? value : value.name).trim();
    if (!name) {
      this.name.setValue('');
      this.name.markAsTouched();
      return;
    }
    const { id, saved } = this._playerService.createPlayer(name);
    this._add(id, saved);
  }

  private _add(playerId: string, created: Promise<void>): void {
    Promise.all([created, this._leagueService.addPlayer(this._data.leagueId, playerId)]).catch(
      (error) => this._notifier.error('error.addPlayer', error),
    );
    this._dialogRef.close(playerId);
  }
}
