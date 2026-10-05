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
import { openNewGameDialog } from '../../game/game-new/game-new-dialog/game-new-dialog.component';
import { ModePickerComponent } from '../../game/mode/mode-picker.component';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { compareNames } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { GameService } from '../../game/game.service';
import { START_RATING } from '../../player/rating';
import { drawTeams, FORMATS, TournamentFormat } from '../tournament';
import { TournamentService } from '../tournament.service';

/** Games of a group stage: two groups sharing `teams`, everyone in a group plays once. */
function groupGames(teams: number): number {
  const small = Math.floor(teams / 2);
  const large = teams - small;
  return (small * (small - 1)) / 2 + (large * (large - 1)) / 2;
}

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
  private readonly _dialog = inject(MatDialog);

  /**
   * Formats offered as chips; rotating partners is a variant of round robin. A series is
   * started from "+" (the new game dialog), where its two teams are picked.
   */
  protected readonly formats = FORMATS.filter(
    (format) => format !== 'rotation' && format !== 'series',
  );

  protected readonly format = signal<TournamentFormat>('open');

  /** First how you play (P50), then the players and rules of that format (P51). */
  protected readonly step = signal<1 | 2>(1);
  protected readonly pickable = [
    { format: 'series', icon: '' },
    { format: 'open', icon: 'groups' },
    { format: 'king', icon: 'military_tech' },
    { format: 'dyp', icon: 'casino' },
    { format: 'roundRobin', icon: 'grid_view' },
    { format: 'cup', icon: 'account_tree' },
  ] as const;

  /** A series is two teams, picked in the new game; the other formats go on to their setup. */
  protected pick(format: TournamentFormat): void {
    if (format === 'series') {
      this._dialogRef.close();
      openNewGameDialog(this._dialog, { leagueId: this._data.leagueId, series: true });
      return;
    }
    this.setFormat(format);
    this.step.set(2);
  }
  protected readonly name = signal('');
  /** How the games are played; king of the table plays short games by default. */
  protected readonly mode = signal<GameMode>(NEW_GAME_MODE);
  private _modeChosen = false;
  protected readonly teamSize = signal(2);
  /** Cup: groups before the knockout stage (0 or 2). */
  protected readonly groups = signal(0);
  /** Fixed teams in another order than picked: drawn or evened out. */
  private readonly _arranged = signal<string[] | null>(null);

  /** League players, by name. */
  protected readonly members = computed(() => {
    const members = new Set(this._leagueService.league(this._data.leagueId)?.players);
    return (this._playerService.players() ?? [])
      .filter((player) => members.has(player.id))
      .sort(compareNames);
  });

  /**
   * Who takes part, in the order they were picked; `null` is everyone in the league. Fixed
   * teams start with nobody picked, as the order of picking makes the teams.
   */
  private readonly _picked = signal<string[] | null>(null);
  protected readonly selected = computed(() => {
    const members = new Set(this.members().map((player) => player.id));
    return (this._picked() ?? [...members]).filter((id) => members.has(id));
  });

  protected readonly size = computed(() =>
    ['dyp', 'rotation'].includes(this.format()) ? 2 : this.teamSize(),
  );

  /** Whether the format plays fixed teams, made when it starts. */
  protected readonly fixedTeams = computed(() => ['roundRobin', 'cup'].includes(this.format()));

  /** The chip a format belongs to: rotating partners is shown under round robin. */
  protected readonly chip = computed(() =>
    this.format() === 'rotation' ? 'roundRobin' : this.format(),
  );

  /** Fixed teams in the order the players were picked: 1st with 2nd, 3rd with 4th... */
  protected readonly teams = computed<Lineup[]>(() => {
    if (!this.fixedTeams()) {
      return [];
    }
    const order = this._arranged() ?? this.selected();
    const size = this.size();
    const teams: Lineup[] = [];
    for (let i = 0; i + size <= order.length; i += size) {
      teams.push({ defence: order[i], offence: order[i + size - 1] });
    }
    return teams;
  });

  /** How many games the tournament takes, when that is known. */
  protected readonly gameCount = computed(() => {
    const teams = this.teams().length;
    const players = this.selected().length;
    switch (this.format()) {
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
      default:
        return null;
    }
  });

  protected setFormat(format: TournamentFormat): void {
    const wasFixed = this.fixedTeams();
    this.format.set(format);
    if (!this._modeChosen) {
      this.mode.set({ ...NEW_GAME_MODE, target: format === 'king' ? 5 : NEW_GAME_MODE.target });
    }
    // Fixed teams are made by picking players one by one; the others start with everyone.
    if (wasFixed !== this.fixedTeams() && !this._pickedByHand) {
      this._picked.set(this.fixedTeams() ? [] : null);
    }
  }

  /** Teams drawn at random from the picked players. */
  protected redraw(): void {
    const order = [...this.selected()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this._arranged.set(order);
  }

  /** Even teams (Elo): the best player with the weakest, the second with the second weakest... */
  protected evenOut(): void {
    const ratings = this._gameService.ratings(this._data.leagueId)?.current;
    const rating = (id: string) => ratings?.get(id) ?? START_RATING;
    const sorted = [...this.selected()].sort((a, b) => rating(b) - rating(a));
    if (this.size() === 1) {
      this._arranged.set(sorted);
      return;
    }
    const order: string[] = [];
    for (let i = 0, j = sorted.length - 1; i < j; i++, j--) {
      order.push(sorted[i], sorted[j]);
    }
    this._arranged.set(order);
  }

  protected setMode(mode: GameMode): void {
    this._modeChosen = true;
    this.mode.set(mode);
  }

  private _pickedByHand = false;

  /** Picks everyone not picked yet, after those already picked. */
  protected pickEveryone(): void {
    this._pickedByHand = true;
    this._arranged.set(null);
    const picked = this.selected();
    this._picked.set([
      ...picked,
      ...this.members()
        .map((player) => player.id)
        .filter((id) => !picked.includes(id)),
    ]);
  }

  protected toggle(playerId: string, selected: boolean): void {
    this._pickedByHand = true;
    this._arranged.set(null);
    this._picked.update((picked) => {
      const rest = (picked ?? this.selected()).filter((id) => id !== playerId);
      return selected ? [...rest, playerId] : rest;
    });
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
    });
    saved.catch((error) => this._notifier.error('error.newTournament', error));
    this._dialogRef.close(id);
    this._router.navigate(['/l', this._data.leagueId, 't', id]);
  }
}
