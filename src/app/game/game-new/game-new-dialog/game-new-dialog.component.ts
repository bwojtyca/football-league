import { Component, computed, inject, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { openAddPlayerDialog } from '../../../league/add-player-dialog.component';
import { LeagueService } from '../../../league/league.service';
import { Notifier } from '../../../notifier';
import { AvatarComponent } from '../../../player/avatar/avatar.component';
import { compareNames } from '../../../player/player';
import { PlayerService } from '../../../player/player.service';
import { TournamentService } from '../../../tournament/tournament.service';
import { START_RATING, winChance } from '../../../player/rating';
import {
  Game,
  GameMode,
  GOAL_DETAILS,
  GoalDetail,
  Lineup,
  NEW_GAME_MODE,
  Position,
  TEAM_COLORS,
  TeamColor,
} from '../../game';
import { GameService } from '../../game.service';
import { ModeLabelComponent } from '../../mode/mode-label.component';
import { ModePickerComponent } from '../../mode/mode-picker.component';
import {
  readDetail,
  readRotation,
  saveDetail,
  saveRotation,
  setFullscreen,
  wantsFullscreen,
} from '../../screen-settings';
import { openPlayerPicker, PickerOption, PickerResult } from '../player-picker-sheet.component';

export interface GameNewDialogData {
  leagueId: string;
  /** Pre-fills the teams, e.g. for a rematch. */
  previousGame?: Game;
  /** A game of this (open) tournament, between its players only, by its rules. */
  tournamentId?: string;
  playerIds?: string[];
  mode?: GameMode;
  /** Starts a series (a tournament of two teams, best of 3 or 5) with its first game. */
  series?: boolean;
}

/** Who holds the two places of a team; `alone` when one player covers both. */
interface Places {
  defence: string | null;
  offence: string | null;
  alone: boolean;
}

/** The places of each team as laid out on the table: red across, blue near. */
const PLACE_ORDER: Record<TeamColor, readonly Position[]> = {
  red: ['offence', 'defence'],
  blue: ['defence', 'offence'],
};

const NO_ONE: Places = { defence: null, offence: null, alone: false };

export function openNewGameDialog(dialog: MatDialog, data: GameNewDialogData) {
  return dialog.open<GameNewDialogComponent, GameNewDialogData>(GameNewDialogComponent, {
    data,
    width: '560px',
    maxWidth: '100vw',
    panelClass: 'fl-full-on-phone',
  });
}

@Component({
  selector: 'fl-game-new-dialog',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
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
  private readonly _dialog = inject(MatDialog);
  private readonly _sheet = inject(MatBottomSheet);
  private readonly _dialogRef = inject(MatDialogRef<GameNewDialogComponent>);
  private readonly _data = inject<GameNewDialogData>(MAT_DIALOG_DATA);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _transloco = inject(TranslocoService);

  protected readonly colors = TEAM_COLORS;
  protected readonly placeOrder = PLACE_ORDER;
  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
  protected readonly inputModes = GOAL_DETAILS;

  /** Who plays where; a rematch starts from the previous game's teams. */
  protected readonly places = signal<Record<TeamColor, Places>>(
    this._data.previousGame
      ? placesOf(this._data.previousGame)
      : { red: { ...NO_ONE }, blue: { ...NO_ONE } },
  );

  /** Places left empty when "Start" was tapped. */
  protected readonly showMissing = signal(false);

  /** How the game is played; a rematch keeps the rules of the previous game. */
  protected readonly mode = signal<GameMode>({
    ...(this._data.mode ?? this._data.previousGame?.mode ?? NEW_GAME_MODE),
  });

  /** A series of games between these two teams instead of a single game. */
  protected readonly series = !!this._data.series;
  protected readonly bestOf = signal(3);

  /** How much a goal tells on the game screen, and whether it stands upright (this device). */
  protected readonly inputMode = signal<GoalDetail>(readDetail());
  protected readonly upright = signal(readRotation() % 2 === 0);

  /** Players of the league, by name. */
  protected readonly players = computed(() => {
    const members = new Set(
      this._data.playerIds ?? this._leagueService.league(this._data.leagueId)?.players,
    );
    return this._playerService
      .players()
      ?.filter((p) => members.has(p.id))
      .sort(compareNames);
  });

  private readonly _ratings = computed(() => this._gameService.ratings(this._data.leagueId));

  /** The players of a team, once its places are filled. */
  private _team(color: TeamColor): string[] | null {
    const { defence, offence, alone } = this.places()[color];
    if (!defence || (!alone && !offence)) {
      return null;
    }
    return alone || defence === offence ? [defence] : [defence, offence!];
  }

  /** Who plays with whom, once both teams are picked. */
  protected readonly lineupNames = computed(() => {
    const red = this._team('red');
    const blue = this._team('blue');
    const names = (ids: string[]) => ids.map((id) => this.name(id)).join(' & ');
    return red && blue ? { red: names(red), blue: names(blue) } : null;
  });

  /** Chance of the red team to win, from the players' ratings; `null` until both teams are set. */
  protected readonly redChance = computed(() => {
    const red = this._team('red');
    const blue = this._team('blue');
    return red && blue ? Math.round(winChance(this._rating(red), this._rating(blue)) * 100) : null;
  });

  /**
   * With four players picked, the most even way to split them into two teams, when it is
   * clearly more even than the current one. Players keep their positions where possible.
   */
  protected readonly suggestion = computed(() => {
    const { red, blue } = this.places();
    const picked = [red.defence, red.offence, blue.defence, blue.offence];
    if (red.alone || blue.alone || !picked.every((id) => !!id)) {
      return null;
    }
    const [a, b, c, d] = picked as string[];
    if (new Set([a, b, c, d]).size < 4) {
      return null;
    }
    const unevenness = ([x, y]: string[][]) =>
      Math.abs(winChance(this._rating(x), this._rating(y)) - 0.5);
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
    const lineup = (team: string[]) => {
      const defender = team.find((id) => id === a || id === c) ?? team[0];
      return { defence: defender, offence: team.find((id) => id !== defender)! };
    };
    return {
      red: lineup(redTeam),
      blue: lineup(blueTeam),
      chance: Math.round(winChance(this._rating(redTeam), this._rating(blueTeam)) * 100),
    };
  });

  /** Kind of game the lineups describe, and the lonely player of a stress test. */
  protected readonly kind = computed(() => {
    const { red, blue } = this.places();
    if (red.alone && blue.alone) {
      return { key: 'newGame.mode1v1', name: '' };
    }
    if (red.alone || blue.alone) {
      const defence = (red.alone ? red : blue).defence;
      return { key: 'newGame.modeStress', name: defence ? this.name(defence) : '…' };
    }
    return { key: 'newGame.mode2v2', name: '' };
  });

  protected name(id: string): string {
    return this._playerService.getPlayerName(id);
  }

  /** The player in a place (the defender also holds the attack of a team playing alone). */
  protected holder(color: TeamColor, position: Position): string | null {
    const places = this.places()[color];
    return position === 'offence' && places.alone ? places.defence : places[position];
  }

  protected isMissing(color: TeamColor, position: Position): boolean {
    return this.showMissing() && !this.holder(color, position);
  }

  /** Opens the picker for a place; picking someone placed elsewhere swaps the two places. */
  protected pick(color: TeamColor, position: Position): void {
    const current = this.places()[color][position];
    const options: PickerOption[] = (this.players() ?? []).map((player) => {
      const where = this._placeOf(player.id);
      const here = where?.color === color && where.position === position;
      return {
        id: player.id,
        name: player.name,
        rating: this._ratings()?.current.has(player.id)
          ? Math.round(this._ratings()!.current.get(player.id)!)
          : null,
        note: here
          ? this._transloco.translate('newGame.current')
          : where
            ? this._transloco.translate(`newGame.inSlot.${where.color}.${where.position}`)
            : this._mostly(player.id),
        placed: !!where && !here,
      };
    });
    openPlayerPicker(this._sheet, {
      title: this._transloco.translate(`newGame.slot.${color}.${position}`),
      current: current ? this.name(current) : undefined,
      options,
      canBeAlone: position === 'offence',
    })
      .afterDismissed()
      .subscribe((result?: PickerResult) => {
        if (!result) {
          return;
        }
        if ('alone' in result) {
          this._update(color, (places) => ({ ...places, offence: null, alone: true }));
        } else if ('add' in result) {
          openAddPlayerDialog(this._dialog, { leagueId: this._data.leagueId })
            .afterClosed()
            .subscribe((id?: string) => id && this._place(color, position, id));
        } else {
          this._place(color, position, result.player);
        }
      });
  }

  /** Cancel: a rematch offered on the game screen leads back to the league, elsewhere it stays. */
  protected close(): void {
    this._dialogRef.close();
    if (this._router.url.startsWith('/game/')) {
      this._router.navigate(['/l', this._data.leagueId]);
    }
  }

  protected useSuggestion(suggestion: {
    red: { defence: string; offence: string };
    blue: { defence: string; offence: string };
  }): void {
    this.places.set({
      red: { ...suggestion.red, alone: false },
      blue: { ...suggestion.blue, alone: false },
    });
  }

  protected teamLabel(team: { defence: string; offence: string }): string {
    return `${this.name(team.defence)} & ${this.name(team.offence)}`;
  }

  protected switchTeams(): void {
    const { red, blue } = this.places();
    this.places.set({ red: blue, blue: red });
  }

  protected startGame(): void {
    const red = this._lineup('red');
    const blue = this._lineup('blue');
    if (!red || !blue) {
      this.showMissing.set(true);
      return;
    }
    this._saveScreen();
    // The tap that starts the game may open full screen, if chosen before (browsers need one).
    if (wantsFullscreen()) {
      setFullscreen(true, false);
    }

    const tournament = this.series ? this._createSeries(red, blue) : this._data.tournamentId;
    const { id, saved } = this._gameService.createGame(
      this._data.leagueId,
      red,
      blue,
      this.mode(),
      { tournament },
    );
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._dialogRef.close(id);
    this._router.navigate(['/game', id]);
  }

  /** The game screen opens as chosen here: upright or sideways, on the same side as before. */
  private _saveScreen(): void {
    const redSide = readRotation() >= 2;
    saveDetail(this.inputMode());
    saveRotation((redSide ? 2 : 0) + (this.upright() ? 0 : 1));
  }

  /** The series as a tournament of the two teams; its first game is played at once. */
  private _createSeries(red: Lineup, blue: Lineup): string {
    const lang = this._transloco.getActiveLang() === 'pl' ? 'pl-PL' : 'en-GB';
    const date = new Date().toLocaleDateString(lang, { day: 'numeric', month: 'short' });
    const { id, saved } = this._tournamentService.create({
      league: this._data.leagueId,
      name: `${this._transloco.translate('tournament.format.series')}, ${date}`,
      format: 'series',
      mode: this.mode(),
      teamSize: red.defence === red.offence && blue.defence === blue.offence ? 1 : 2,
      entries: [],
      teams: [red, blue],
      bestOf: this.bestOf(),
    });
    saved.catch((error) => this._notifier.error('error.newTournament', error));
    return id;
  }

  private _lineup(color: TeamColor): Lineup | undefined {
    const team = this._team(color);
    return team ? { defence: team[0], offence: team[1] ?? team[0] } : undefined;
  }

  private _rating(team: string[]): number {
    const current = this._ratings()?.current;
    return team.reduce((sum, id) => sum + (current?.get(id) ?? START_RATING), 0) / team.length;
  }

  /** Where a player already plays in these lineups. */
  private _placeOf(id: string): { color: TeamColor; position: Position } | undefined {
    for (const color of TEAM_COLORS) {
      for (const position of ['defence', 'offence'] as const) {
        if (this.holder(color, position) === id) {
          return { color, position };
        }
      }
    }
    return undefined;
  }

  /** "Mostly defence" or "mostly attack", from the 2 vs 2 games in the league. */
  private _mostly(id: string): string {
    const positions = this._ratings()?.positions.get(id);
    if (!positions || positions.defence.games === positions.offence.games) {
      return '';
    }
    const mostly = positions.defence.games > positions.offence.games ? 'defence' : 'offence';
    return this._transloco.translate(`newGame.mostly.${mostly}`);
  }

  /** Puts a player in a place; if they held another, its holder moves there. */
  private _place(color: TeamColor, position: Position, id: string): void {
    const from = this._placeOf(id);
    const replaced = this.places()[color][position];
    if (from) {
      this._update(from.color, (places) =>
        from.position === 'offence'
          ? { ...places, offence: replaced, alone: false }
          : { ...places, defence: replaced },
      );
    }
    this._update(color, (places) =>
      position === 'offence'
        ? { ...places, offence: id, alone: false }
        : { ...places, defence: id },
    );
    this.showMissing.set(false);
  }

  private _update(color: TeamColor, change: (places: Places) => Places): void {
    this.places.update((all) => ({ ...all, [color]: change(all[color]) }));
  }
}

/** The places of a previous game's teams. */
function placesOf(game: Game): Record<TeamColor, Places> {
  const places = (color: TeamColor): Places => {
    const { defence, offence } = game.teams[color];
    return defence.player === offence.player
      ? { defence: defence.player, offence: null, alone: true }
      : { defence: defence.player, offence: offence.player, alone: false };
  };
  return { red: places('red'), blue: places('blue') };
}
