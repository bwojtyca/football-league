import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AvatarComponent } from '../../../player/avatar/avatar.component';
import { compareNames, Player } from '../../../player/player';
import { PlayerService } from '../../../player/player.service';
import { Game, TEAM_COLORS, TeamColor } from '../../game';
import { GameService, TeamLineup } from '../../game.service';
import { HighlightPipe } from '../../highlight.pipe';

export interface GameNewDialogData {
  /** Pre-fills the teams, e.g. for a rematch. */
  previousGame?: Game;
}

/** An autocomplete holds the typed text until a player is picked. */
type PlayerValue = Player | string | null;

function isPlayer(value: unknown): value is Player {
  return !!value && typeof value === 'object' && 'id' in value;
}

function validatePlayer(control: AbstractControl): ValidationErrors | null {
  return isPlayer(control.value) ? null : { validatePlayer: { valid: false } };
}

function createTeam() {
  const form = new FormGroup({
    singlePlayer: new FormControl(false, { nonNullable: true }),
    defence: new FormControl<PlayerValue>(null, validatePlayer),
    offence: new FormControl<PlayerValue>(null, validatePlayer),
  });
  const { singlePlayer, defence, offence } = form.controls;

  singlePlayer.valueChanges.subscribe((single) => {
    if (single) {
      offence.disable();
      offence.setValue('');
    } else {
      offence.enable();
    }
  });

  return {
    form,
    singlePlayer: toSignal(singlePlayer.valueChanges, { initialValue: singlePlayer.value }),
    defence: toSignal(defence.valueChanges, { initialValue: defence.value }),
    offence: toSignal(offence.valueChanges, { initialValue: offence.value }),
  };
}

export function openNewGameDialog(dialog: MatDialog, data?: GameNewDialogData) {
  return dialog.open<GameNewDialogComponent, GameNewDialogData>(GameNewDialogComponent, {
    data,
    maxWidth: '95vw',
  });
}

@Component({
  selector: 'fl-game-new-dialog',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AvatarComponent,
    HighlightPipe,
  ],
  templateUrl: './game-new-dialog.component.html',
  styleUrl: './game-new-dialog.component.scss',
})
export class GameNewDialogComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _gameService = inject(GameService);
  private readonly _router = inject(Router);
  private readonly _dialogRef = inject(MatDialogRef<GameNewDialogComponent>);
  private readonly _data = inject<GameNewDialogData | undefined>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly colors = TEAM_COLORS;
  protected readonly teams = { red: createTeam(), blue: createTeam() };
  protected readonly starting = signal(false);

  protected readonly players = computed(() =>
    this._playerService.players()?.slice().sort(compareNames),
  );

  /** Players already picked anywhere in the form. */
  protected readonly selected = computed(() => {
    const ids = new Set<string>();
    for (const team of Object.values(this.teams)) {
      for (const value of [team.defence(), team.offence()]) {
        if (isPlayer(value)) {
          ids.add(value.id);
        }
      }
    }
    return ids;
  });

  protected readonly mode = computed(() => {
    const { red, blue } = this.teams;
    if (red.singlePlayer() && blue.singlePlayer()) {
      return '1 vs 1';
    }
    if (red.singlePlayer() || blue.singlePlayer()) {
      const defence = (red.singlePlayer() ? red : blue).defence();
      return `Stress test on ${isPlayer(defence) ? defence.name : '...'}`;
    }
    return '2 vs 2';
  });

  constructor() {
    const previousGame = this._data?.previousGame;
    if (previousGame) {
      this._playerService.players$
        .pipe(take(1))
        .subscribe((players) => this._prefill(previousGame, players));
    }
  }

  protected filterPlayers(value: PlayerValue): Player[] {
    const players = this.players() ?? [];
    const name = (isPlayer(value) ? value.name : (value ?? '')).toLowerCase();
    return name ? players.filter((p) => p.name.toLowerCase().startsWith(name)) : players;
  }

  protected displayPlayer(value: PlayerValue): string {
    return isPlayer(value) ? value.name : (value ?? '');
  }

  protected close(): void {
    this._dialogRef.close();
    this._router.navigate(['/']);
  }

  protected switchTeams(): void {
    const red = this.teams.red.form.getRawValue();
    const blue = this.teams.blue.form.getRawValue();
    this.teams.red.form.setValue(blue);
    this.teams.blue.form.setValue(red);
  }

  protected async startGame(): Promise<void> {
    const red = this._lineup('red');
    const blue = this._lineup('blue');
    if (!red || !blue) {
      for (const team of Object.values(this.teams)) {
        team.form.markAllAsTouched();
      }
      return;
    }

    this.starting.set(true);
    try {
      const gameId = await this._gameService.createGame(red, blue);
      this._dialogRef.close(gameId);
      await this._router.navigate(['/game', gameId]);
    } finally {
      this.starting.set(false);
    }
  }

  private _lineup(color: TeamColor): TeamLineup | undefined {
    const { singlePlayer, defence, offence } = this.teams[color].form.getRawValue();
    const attacker = singlePlayer ? defence : offence;
    return isPlayer(defence) && isPlayer(attacker) ? { defence, offence: attacker } : undefined;
  }

  private _prefill(game: Game, players: Player[]): void {
    const find = (id: string) => players.find((player) => player.id === id) ?? null;
    for (const color of TEAM_COLORS) {
      const { defence, offence } = game.teams[color];
      const controls = this.teams[color].form.controls;
      controls.defence.setValue(find(defence.player));
      if (defence.player !== offence.player) {
        controls.offence.setValue(find(offence.player));
      } else {
        controls.singlePlayer.setValue(true);
      }
    }
  }
}
