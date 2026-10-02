import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { GameMode, Lineup, lineupPlayers, NEW_GAME_MODE } from '../../game/game';
import { ModePickerComponent } from '../../game/mode/mode-picker.component';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { compareNames } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { GameService } from '../../game/game.service';
import { START_RATING, winChance } from '../../player/rating';
import { drawTeams, FORMATS, lineupFrom, seededRandom, TournamentFormat } from '../tournament';

/** Games of a group stage: two groups sharing `teams`, everyone in a group plays once. */
function groupGames(teams: number): number {
  const small = Math.floor(teams / 2);
  const large = teams - small;
  return (small * (small - 1)) / 2 + (large * (large - 1)) / 2;
}
import { TournamentService } from '../tournament.service';

export interface TournamentNewDialogData {
  leagueId: string;
}

export function openTournamentNewDialog(dialog: MatDialog, data: TournamentNewDialogData) {
  return dialog.open<TournamentNewDialogComponent, TournamentNewDialogData>(
    TournamentNewDialogComponent,
    { data, width: '560px', maxWidth: '95vw' },
  );
}

@Component({
  selector: 'fl-tournament-new-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ModePickerComponent,
    TranslocoPipe,
  ],
  templateUrl: './tournament-new-dialog.component.html',
  styleUrl: './tournament-new-dialog.component.scss',
})
export class TournamentNewDialogComponent {
  private readonly _data = inject<TournamentNewDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<TournamentNewDialogComponent>);
  private readonly _leagueService = inject(LeagueService);
  private readonly _playerService = inject(PlayerService);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _gameService = inject(GameService);
  private readonly _transloco = inject(TranslocoService);
  private readonly _notifier = inject(Notifier);
  private readonly _router = inject(Router);

  /** Formats offered as chips; rotating partners is a variant of round robin. */
  protected readonly formats = FORMATS.filter((format) => format !== 'rotation');

  protected readonly format = signal<TournamentFormat>('series');
  protected readonly name = signal('');
  /** How the games are played; king of the table plays short games by default. */
  protected readonly mode = signal<GameMode>(NEW_GAME_MODE);
  private _modeChosen = false;
  protected readonly teamSize = signal(2);
  /** Cup: groups before the knockout stage (0 or 2). */
  protected readonly groups = signal(0);
  /** Series: best of 3 or 5. */
  protected readonly bestOf = signal(3);
  /** Series: teams set by "most even", instead of drawn. */
  private readonly _evenTeams = signal<Lineup[] | null>(null);
  private readonly _seed = signal(Date.now());

  /** League players, by name. */
  protected readonly members = computed(() => {
    const members = new Set(this._leagueService.league(this._data.leagueId)?.players);
    return (this._playerService.players() ?? [])
      .filter((player) => members.has(player.id))
      .sort(compareNames);
  });

  /**
   * Who takes part. A series starts with nobody picked (it is between two teams); the other
   * formats start with everyone in the league.
   */
  private readonly _picked = signal<Set<string> | null>(new Set());
  protected readonly selected = computed(() => {
    const picked = this._picked();
    const all = this.members().map((player) => player.id);
    return picked ? all.filter((id) => picked.has(id)) : all;
  });

  protected readonly size = computed(() =>
    ['dyp', 'rotation'].includes(this.format()) ? 2 : this.teamSize(),
  );

  /** Whether the format plays fixed teams drawn at the start. */
  protected readonly fixedTeams = computed(() =>
    ['series', 'roundRobin', 'cup'].includes(this.format()),
  );

  /** The chip a format belongs to: rotating partners is shown under round robin. */
  protected readonly chip = computed(() =>
    this.format() === 'rotation' ? 'roundRobin' : this.format(),
  );

  /** Fixed teams, drawn from the selected players (a series takes the first two). */
  protected readonly teams = computed<Lineup[]>(() => {
    if (!this.fixedTeams()) {
      return [];
    }
    const even = this._evenTeams();
    const teams =
      even && this.format() === 'series'
        ? even
        : drawTeams(this.selected(), this.size(), seededRandom(this._seed()));
    return this.format() === 'series' ? teams.slice(0, 2) : teams;
  });

  /** How many games the tournament takes, when that is known. */
  protected readonly gameCount = computed(() => {
    const teams = this.teams().length;
    const players = this.selected().length;
    switch (this.format()) {
      case 'series':
        return { key: 'tournament.gamesUpTo', n: this.bestOf() };
      case 'roundRobin':
        return { key: 'tournament.gamesExactly', n: (teams * (teams - 1)) / 2 };
      case 'rotation':
        return { key: 'tournament.gamesExactly', n: Math.ceil((players * (players - 1)) / 4) };
      case 'cup':
        return {
          key: 'tournament.gamesExactly',
          // With groups: the group games, two semi-finals and the final.
          n: this.groups() ? groupGames(teams) + 3 : teams - 1,
        };
      default:
        return { key: 'tournament.gamesOpen', n: 0 };
    }
  });

  /** Names of selected players left without a team in a round robin, if any. */
  protected readonly benched = computed(() => {
    const inTeams = new Set(this.teams().flatMap(lineupPlayers));
    const left = this.selected().filter((player) => !inTeams.has(player));
    return this.fixedTeams() && left.length
      ? left.map((player) => this.playerName(player)).join(', ')
      : null;
  });

  /** Why the tournament cannot start yet, as a translation key. */
  protected readonly problem = computed(() => {
    const count = this.selected().length;
    switch (this.format()) {
      case 'series':
        return count !== 2 * this.size() ? 'tournament.needSeries' : null;
      case 'open':
        return count < 2 ? 'tournament.needOpen' : null;
      case 'king':
        return count < 2 * this.size() + (this.size() === 2 ? 0 : 1) ? 'tournament.needKing' : null;
      case 'dyp':
        return count < 4 ? 'tournament.needDyp' : null;
      case 'rotation':
        return count < 4 || count > 12 ? 'tournament.needRotation' : null;
      case 'roundRobin':
        return this.teams().length < 3 ? 'tournament.needRoundRobin' : null;
      case 'cup':
        return this.teams().length < 3
          ? 'tournament.needRoundRobin'
          : this.groups() && this.teams().length < 6
            ? 'tournament.needGroups'
            : null;
    }
  });

  protected setFormat(format: TournamentFormat): void {
    const wasSeries = this.format() === 'series';
    this.format.set(format);
    if (!this._modeChosen) {
      this.mode.set({ ...NEW_GAME_MODE, target: format === 'king' ? 5 : NEW_GAME_MODE.target });
    }
    // A series is picked player by player; the others start with everyone.
    if (wasSeries !== (format === 'series') && !this._pickedByHand) {
      this._picked.set(format === 'series' ? new Set() : null);
    }
  }

  /** Series: the two most even teams of the four picked players (Elo). */
  protected mostEven(): void {
    const players = this.selected();
    if (players.length !== 4) {
      return;
    }
    const ratings = this._gameService.ratings(this._data.leagueId)?.current;
    const rating = (team: string[]) =>
      team.reduce((sum, id) => sum + (ratings?.get(id) ?? START_RATING), 0) / team.length;
    const [a, b, c, d] = players;
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
    const best = splits.reduce((x, y) =>
      Math.abs(winChance(rating(y[0]), rating(y[1])) - 0.5) <
      Math.abs(winChance(rating(x[0]), rating(x[1])) - 0.5)
        ? y
        : x,
    );
    this._evenTeams.set(best.map(lineupFrom));
  }

  protected setMode(mode: GameMode): void {
    this._modeChosen = true;
    this.mode.set(mode);
  }

  private _pickedByHand = false;

  protected toggle(playerId: string, selected: boolean): void {
    this._pickedByHand = true;
    this._evenTeams.set(null);
    this._picked.update((picked) => {
      const next = new Set(picked ?? this.selected());
      if (selected) {
        next.add(playerId);
      } else {
        next.delete(playerId);
      }
      return next;
    });
  }

  protected redraw(): void {
    this._evenTeams.set(null);
    this._seed.update((seed) => seed + 1);
  }

  protected playerName(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }

  protected teamName(team: Lineup): string {
    return lineupPlayers(team)
      .map((id) => this.playerName(id))
      .join(' & ');
  }

  protected create(): void {
    if (this.problem()) {
      return;
    }
    const format = this.format();
    const now = new Date().toISOString();
    // King of the table: the first queue is drawn at random.
    const players =
      format === 'king'
        ? drawTeams(this.selected(), 1).map((team) => team.defence)
        : this.selected();
    const name =
      this.name().trim() ||
      `${this._transloco.translate(`tournament.format.${format}`)}, ${new Date().toLocaleDateString(
        this._transloco.getActiveLang() === 'pl' ? 'pl-PL' : 'en-GB',
        { day: 'numeric', month: 'short' },
      )}`;
    const { id, saved } = this._tournamentService.create({
      league: this._data.leagueId,
      name,
      format,
      mode: this.mode(),
      teamSize: this.size(),
      entries: this.fixedTeams() ? [] : players.map((player) => ({ player, at: now })),
      ...(this.fixedTeams() && { teams: this.teams() }),
      ...(format === 'cup' && { groups: this.groups() }),
      ...(format === 'series' && { bestOf: this.bestOf() }),
    });
    saved.catch((error) => this._notifier.error('error.newTournament', error));
    this._dialogRef.close(id);
    this._router.navigate(['/l', this._data.leagueId, 't', id]);
  }
}
