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

import { Lineup, lineupPlayers, MODES, ModeName } from '../../game/game';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { compareNames } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { drawTeams, FORMATS, seededRandom, TournamentFormat } from '../tournament';
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
  private readonly _transloco = inject(TranslocoService);
  private readonly _notifier = inject(Notifier);
  private readonly _router = inject(Router);

  protected readonly formats = FORMATS;
  protected readonly modes = Object.keys(MODES) as ModeName[];

  protected readonly format = signal<TournamentFormat>('king');
  protected readonly name = signal('');
  /** Ready-made mode; king of the table plays short games by default. */
  protected readonly modeName = signal<ModeName>('to5');
  private _modeChosen = false;
  protected readonly teamSize = signal(2);
  /** Cup: groups before the knockout stage (0 or 2). */
  protected readonly groups = signal(0);
  private readonly _seed = signal(Date.now());

  /** League players, by name. */
  protected readonly members = computed(() => {
    const members = new Set(this._leagueService.league(this._data.leagueId)?.players);
    return (this._playerService.players() ?? [])
      .filter((player) => members.has(player.id))
      .sort(compareNames);
  });

  /** Who takes part; everyone in the league until someone is unselected. */
  private readonly _unselected = signal(new Set<string>());
  protected readonly selected = computed(() =>
    this.members()
      .map((player) => player.id)
      .filter((id) => !this._unselected().has(id)),
  );

  protected readonly size = computed(() => (this.format() === 'dyp' ? 2 : this.teamSize()));

  /** Whether the format plays fixed teams drawn at the start. */
  protected readonly fixedTeams = computed(() => ['roundRobin', 'cup'].includes(this.format()));

  /** Round robin and cup teams, drawn from the selected players. */
  protected readonly teams = computed<Lineup[]>(() =>
    this.fixedTeams() ? drawTeams(this.selected(), this.size(), seededRandom(this._seed())) : [],
  );

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
      case 'king':
        return count < 2 * this.size() + (this.size() === 2 ? 0 : 1) ? 'tournament.needKing' : null;
      case 'dyp':
        return count < 4 ? 'tournament.needDyp' : null;
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
    this.format.set(format);
    if (!this._modeChosen) {
      this.modeName.set(format === 'king' ? 'to5' : 'to8');
    }
  }

  protected setMode(name: ModeName): void {
    this._modeChosen = true;
    this.modeName.set(name);
  }

  protected toggle(playerId: string, selected: boolean): void {
    this._unselected.update((unselected) => {
      const next = new Set(unselected);
      if (selected) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  protected redraw(): void {
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
      mode: { ...MODES[this.modeName()] },
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
