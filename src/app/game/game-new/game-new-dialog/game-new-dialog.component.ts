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
import { TranslocoPipe } from '@jsverse/transloco';
import { take } from 'rxjs';

import { LeagueService } from '../../../league/league.service';
import { Notifier } from '../../../notifier';
import { AvatarComponent } from '../../../player/avatar/avatar.component';
import { compareNames, Player } from '../../../player/player';
import { PlayerService } from '../../../player/player.service';
import { START_RATING, winChance } from '../../../player/rating';
import { Game, GameMode, Lineup, modeOf, TEAM_COLORS, TeamColor } from '../../game';
import { GameService } from '../../game.service';
import { HighlightPipe } from '../../highlight.pipe';
import { ModeLabelComponent } from '../../mode/mode-label.component';
import { ModePickerComponent } from '../../mode/mode-picker.component';

export interface GameNewDialogData {
  leagueId: string;
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

export function openNewGameDialog(dialog: MatDialog, data: GameNewDialogData) {
  return dialog.open<GameNewDialogComponent, GameNewDialogData>(GameNewDialogComponent, {
    data,
    width: '700px',
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
    ModeLabelComponent,
    ModePickerComponent,
    TranslocoPipe,
  ],
  templateUrl: './game-new-dialog.component.html',
  styleUrl: './game-new-dialog.component.scss',
})
export class GameNewDialogComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _router = inject(Router);
  private readonly _notifier = inject(Notifier);
  private readonly _dialogRef = inject(MatDialogRef<GameNewDialogComponent>);
  private readonly _data = inject<GameNewDialogData>(MAT_DIALOG_DATA);

  protected readonly colors = TEAM_COLORS;
  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
  protected readonly teams = { red: createTeam(), blue: createTeam() };

  /** How the game is played; a rematch keeps the rules of the previous game. */
  protected readonly mode = signal<GameMode>({ ...modeOf(this._data.previousGame ?? {}) });

  /** Who plays with whom, once both teams are picked. */
  protected readonly lineupNames = computed(() => {
    const names = (color: TeamColor) => {
      const { singlePlayer, defence, offence } = this.teams[color];
      const players = singlePlayer() ? [defence()] : [defence(), offence()];
      return players.every(isPlayer) ? players.map((p) => (p as Player).name).join(' & ') : null;
    };
    const red = names('red');
    const blue = names('blue');
    return red && blue ? { red, blue } : null;
  });

  /** Players of the league, by name. */
  protected readonly players = computed(() => {
    const members = new Set(this._leagueService.league(this._data.leagueId)?.players);
    return this._playerService
      .players()
      ?.filter((p) => members.has(p.id))
      .sort(compareNames);
  });

  /** Chance of the red team to win, from the players' ratings; `null` until both teams are set. */
  protected readonly redChance = computed(() => {
    const ratings = this._gameService.ratings(this._data.leagueId)?.current;
    const team = (color: TeamColor) => {
      const { singlePlayer, defence, offence } = this.teams[color];
      const ids = [defence(), singlePlayer() ? defence() : offence()];
      if (!ids.every(isPlayer)) {
        return null;
      }
      const unique = [...new Set(ids.map((p) => (p as Player).id))];
      return (
        unique.reduce((sum, id) => sum + (ratings?.get(id) ?? START_RATING), 0) / unique.length
      );
    };
    const red = team('red');
    const blue = team('blue');
    return red === null || blue === null ? null : Math.round(winChance(red, blue) * 100);
  });

  /**
   * With four players picked, the most even way to split them into two teams, when it is
   * clearly more even than the current one. Players keep their positions where possible.
   */
  protected readonly suggestion = computed(() => {
    const { red, blue } = this.teams;
    const picked = [red.defence(), red.offence(), blue.defence(), blue.offence()];
    if (red.singlePlayer() || blue.singlePlayer() || !picked.every(isPlayer)) {
      return null;
    }
    const [a, b, c, d] = picked as Player[];
    if (new Set([a, b, c, d].map((p) => p.id)).size < 4) {
      return null;
    }
    const ratings = this._gameService.ratings(this._data.leagueId)?.current;
    const rating = (team: Player[]) =>
      team.reduce((sum, p) => sum + (ratings?.get(p.id) ?? START_RATING), 0) / team.length;
    const unevenness = ([x, y]: Player[][]) => Math.abs(winChance(rating(x), rating(y)) - 0.5);
    const splits = [
      [
        [a, b],
        [c, d],
      ],
      [
        [a, c],
        [b, d],
      ],
      [
        [a, d],
        [b, c],
      ],
    ];
    const best = splits.reduce((x, y) => (unevenness(y) < unevenness(x) ? y : x));
    if (best === splits[0] || unevenness(splits[0]) - unevenness(best) < 0.03) {
      return null;
    }
    // The current red defender stays red; defenders stay in defence where they can.
    const [redTeam, blueTeam] = best[0].includes(a) ? best : [best[1], best[0]];
    const lineup = (team: Player[]) => {
      const defender = team.find((p) => p === a || p === c) ?? team[0];
      return { defence: defender, offence: team.find((p) => p !== defender)! };
    };
    return {
      red: lineup(redTeam),
      blue: lineup(blueTeam),
      chance: Math.round(winChance(rating(redTeam), rating(blueTeam)) * 100),
    };
  });

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

  /** Kind of game the form describes, and the lonely player of a stress test. */
  protected readonly kind = computed(() => {
    const { red, blue } = this.teams;
    if (red.singlePlayer() && blue.singlePlayer()) {
      return { key: 'newGame.mode1v1', name: '' };
    }
    if (red.singlePlayer() || blue.singlePlayer()) {
      const defence = (red.singlePlayer() ? red : blue).defence();
      return { key: 'newGame.modeStress', name: isPlayer(defence) ? defence.name : '…' };
    }
    return { key: 'newGame.mode2v2', name: '' };
  });

  constructor() {
    const previousGame = this._data.previousGame;
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
    this._router.navigate(['/l', this._data.leagueId]);
  }

  protected useSuggestion(suggestion: {
    red: { defence: Player; offence: Player };
    blue: { defence: Player; offence: Player };
  }): void {
    for (const color of TEAM_COLORS) {
      const controls = this.teams[color].form.controls;
      controls.defence.setValue(suggestion[color].defence);
      controls.offence.setValue(suggestion[color].offence);
    }
  }

  protected teamLabel(team: { defence: Player; offence: Player }): string {
    return `${team.defence.name} & ${team.offence.name}`;
  }

  protected switchTeams(): void {
    const red = this.teams.red.form.getRawValue();
    const blue = this.teams.blue.form.getRawValue();
    this.teams.red.form.setValue(blue);
    this.teams.blue.form.setValue(red);
  }

  protected startGame(): void {
    const red = this._lineup('red');
    const blue = this._lineup('blue');
    if (!red || !blue) {
      for (const team of Object.values(this.teams)) {
        team.form.markAllAsTouched();
      }
      return;
    }

    const { id, saved } = this._gameService.createGame(this._data.leagueId, red, blue, this.mode());
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._dialogRef.close(id);
    this._router.navigate(['/game', id]);
  }

  private _lineup(color: TeamColor): Lineup | undefined {
    const { singlePlayer, defence, offence } = this.teams[color].form.getRawValue();
    const attacker = singlePlayer ? defence : offence;
    return isPlayer(defence) && isPlayer(attacker)
      ? { defence: defence.id, offence: attacker.id }
      : undefined;
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
