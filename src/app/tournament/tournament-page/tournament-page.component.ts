import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameListComponent } from '../../game/game-list/game-list.component';
import {
  Game,
  Lineup,
  lineupOf,
  lineupPlayers,
  TeamColor,
  teamScore,
  winsNeeded,
} from '../../game/game';
import { openNewGameDialog } from '../../game/game-new/game-new-dialog/game-new-dialog.component';
import { GameService } from '../../game/game.service';
import { ModeLabelComponent } from '../../game/mode/mode-label.component';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { compareNames } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { TopBarComponent } from '../../shared/top-bar.component';
import { loadBracketsViewer } from '../brackets-viewer';
import { CupState, cupState } from '../cup';
import {
  drawRound,
  kingState,
  playerStandings,
  presentPlayers,
  roundRobinFixtures,
  rotationFixtures,
  seriesState,
  seededRandom,
  teamStandings,
} from '../tournament';
import { TournamentService } from '../tournament.service';

@Component({
  selector: 'fl-tournament-page',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    GameListComponent,
    ModeLabelComponent,
    TopBarComponent,
    TranslocoPipe,
  ],
  templateUrl: './tournament-page.component.html',
  styleUrl: './tournament-page.component.scss',
})
export class TournamentPageComponent {
  private readonly _tournamentService = inject(TournamentService);
  private readonly _gameService = inject(GameService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _playerService = inject(PlayerService);
  private readonly _transloco = inject(TranslocoService);
  private readonly _notifier = inject(Notifier);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);

  private readonly _params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  protected readonly leagueId = computed(() => this._params().get('leagueId') ?? '');

  /** `undefined` while loading, `null` when there is no such tournament. */
  protected readonly tournament = computed(() =>
    this._tournamentService.tournament(this._params().get('tournamentId') ?? ''),
  );

  /** Games of the tournament, oldest first. */
  protected readonly games = computed(() => {
    const tournament = this.tournament();
    return tournament
      ? this._gameService.tournamentGames(tournament.league, tournament.id)
      : undefined;
  });

  protected readonly running = computed(() => this.games()?.find((game) => !game.end));

  protected readonly king = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'king' && games ? kingState(tournament, games) : null;
  });

  /** Players taking part (king of the table, draw your partner), by name. */
  protected readonly present = computed(() => {
    const tournament = this.tournament();
    return tournament
      ? [...presentPlayers(tournament.entries).keys()].sort((a, b) =>
          compareNames({ name: this.name(a) }, { name: this.name(b) }),
        )
      : [];
  });

  /** League players who could join. */
  protected readonly absent = computed(() => {
    const present = new Set(this.present());
    const members = this._leagueService.league(this.leagueId())?.players ?? [];
    return members
      .filter((player) => !present.has(player))
      .sort((a, b) => compareNames({ name: this.name(a) }, { name: this.name(b) }));
  });

  private readonly _seed = signal(Date.now());

  /** Draw your partner: the next game, drawn among the players not playing now. */
  protected readonly draw = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    if (tournament?.format !== 'dyp' || !games || this.running() || tournament.end) {
      return undefined;
    }
    const ratings = this._gameService.ratings(tournament.league)?.current ?? new Map();
    // The same draw stays on screen until a game is played or a new draw is asked for.
    const random = seededRandom(this._seed() + games.length);
    return drawRound([...presentPlayers(tournament.entries).keys()], games, ratings, random);
  });

  protected readonly standings = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    if (!tournament || !['dyp', 'open', 'rotation'].includes(tournament.format) || !games) {
      return [];
    }
    const players = new Set([
      ...presentPlayers(tournament.entries).keys(),
      ...games.flatMap((game) => game.players),
    ]);
    return playerStandings([...players], games);
  });

  protected readonly series = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'series' && games ? seriesState(tournament, games) : null;
  });

  protected readonly rotation = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'rotation' && games ? rotationFixtures(tournament, games) : [];
  });

  /** The latest finished game, for a one-tap rematch in an open tournament. */
  protected readonly lastGame = computed(() =>
    this.games()
      ?.filter((game) => game.end)
      .at(-1),
  );

  protected readonly winsNeeded = winsNeeded;

  protected readonly fixtures = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'roundRobin' && games
      ? roundRobinFixtures(tournament, games)
      : [];
  });

  protected readonly table = computed(() => {
    const tournament = this.tournament();
    return tournament?.format === 'roundRobin' ? teamStandings(tournament, this.fixtures()) : [];
  });

  /** Cup: worked out with brackets-manager, which is asynchronous. */
  protected readonly cup = signal<CupState | undefined>(undefined);
  private readonly _bracket = viewChild<ElementRef<HTMLElement>>('bracket');
  private readonly _document = inject(DOCUMENT);

  /** Winners shown once the tournament is over: more than one when they tie at the top. */
  protected readonly winner = computed((): string[] | null => {
    const tournament = this.tournament();
    if (!tournament?.end) {
      return null;
    }
    switch (tournament.format) {
      case 'king': {
        const record = this.king()?.record;
        return record ? [this.lineupName(record.lineup)] : null;
      }
      case 'dyp':
      case 'open':
      case 'rotation': {
        const best = this.standings().filter((row) => row.place === 1 && row.games);
        return best.length ? best.map((row) => this.name(row.player)) : null;
      }
      case 'series': {
        const winner = this.series()?.winner;
        return winner === undefined ? null : [this.teamName(winner)];
      }
      case 'roundRobin': {
        const best = this.table().filter((row) => row.place === 1 && row.games);
        return best.length ? best.map((row) => this.lineupName(tournament.teams![row.team])) : null;
      }
      case 'cup': {
        const champion = this.cup()?.champion;
        return champion === undefined ? null : [this.teamName(champion)];
      }
    }
  });

  constructor() {
    effect((onCleanup) => {
      const tournament = this.tournament();
      const games = this.games();
      if (tournament?.format !== 'cup' || !games) {
        return;
      }
      let current = true;
      onCleanup(() => (current = false));
      cupState(tournament, games).then(
        (state) => current && this.cup.set(state),
        (error) => this._notifier.error('error.tournament', error),
      );
    });
    // Draws the knockout bracket with brackets-viewer whenever it changes.
    effect(() => {
      const bracket = this.cup()?.bracket;
      const element = this._bracket()?.nativeElement;
      if (!bracket || !element) {
        return;
      }
      const data = {
        ...bracket,
        participants: bracket.participants.map((p) => ({
          ...p,
          name: this.teamName(Number(p.name)),
        })),
      };
      loadBracketsViewer(this._document)
        .then((viewer) =>
          viewer.render(data, {
            selector: `#${element.id}`,
            clear: true,
            showSlotsOrigin: false,
            highlightParticipantOnHover: true,
            customRoundName: (info) => this._roundName(info),
            onMatchClick: (match) => this._openMatch(Number(match.id)),
          }),
        )
        .catch((error) => this._notifier.error('error.bracket', error));
    });
  }

  protected name(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }

  protected lineupName(lineup: Lineup): string {
    return lineupPlayers(lineup)
      .map((player) => this.name(player))
      .join(' & ');
  }

  protected gameSide(game: Game, color: TeamColor): string {
    return this.lineupName(lineupOf(game.teams[color]));
  }

  protected score(game: Game): string {
    return `${teamScore(game, 'red')}:${teamScore(game, 'blue')}`;
  }

  protected teamName(index: number): string {
    const team = this.tournament()?.teams?.[index];
    return team ? this.lineupName(team) : '';
  }

  protected lineupPlayers = lineupPlayers;

  protected start(red: Lineup, blue: Lineup): void {
    const tournament = this.tournament();
    if (!tournament || tournament.end) {
      return;
    }
    const { id, saved } = this._gameService.createGame(
      tournament.league,
      red,
      blue,
      tournament.mode,
      {
        tournament: tournament.id,
      },
    );
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._router.navigate(['/game', id]);
  }

  private _roundName(info: { roundNumber: number; fractionOfFinal?: number }): string {
    const fraction = info.fractionOfFinal;
    const key =
      fraction === 1
        ? 'tournament.final'
        : fraction === 1 / 2
          ? 'tournament.semiFinal'
          : fraction === 1 / 4
            ? 'tournament.quarterFinal'
            : 'tournament.round';
    return this._transloco.translate(key, { n: info.roundNumber });
  }

  /** A tap on a bracket match: its game, or a new one when both teams are known. */
  private _openMatch(matchId: number): void {
    const tournament = this.tournament();
    const match = this.cup()?.ready.find((m) => m.matchId === matchId);
    if (!tournament?.teams || !match) {
      return;
    }
    if (match.game) {
      this._router.navigate(['/game', match.game.id]);
    } else if (!this.running() && !tournament.end) {
      this.start(tournament.teams[match.red], tournament.teams[match.blue]);
    }
  }

  /** Open tournament: any game between its players. */
  protected newOpenGame(): void {
    const tournament = this.tournament();
    if (tournament) {
      openNewGameDialog(this._dialog, {
        leagueId: tournament.league,
        tournamentId: tournament.id,
        playerIds: [...presentPlayers(tournament.entries).keys()],
        mode: tournament.mode,
      });
    }
  }

  /** Open tournament: the last game again, colours swapped. */
  protected rematchLast(): void {
    const last = this.lastGame();
    if (last) {
      this.start(lineupOf(last.teams.blue), lineupOf(last.teams.red));
    }
  }

  protected redraw(): void {
    this._seed.update((seed) => seed + 1);
  }

  protected join(playerId: string): void {
    const tournament = this.tournament();
    if (tournament) {
      this._tournamentService
        .join(tournament.id, playerId)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }

  protected leave(playerId: string): void {
    const tournament = this.tournament();
    if (tournament) {
      this._tournamentService
        .leave(tournament.id, playerId)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }

  protected finish(): void {
    const tournament = this.tournament();
    if (tournament && confirm(this._transloco.translate('tournament.finishConfirm'))) {
      this._tournamentService
        .finish(tournament.id)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }
}
