import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { interval, map, switchMap } from 'rxjs';

import { leagueOf } from '../../league/league';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { keepScreenOn } from '../../shared/wake-lock';
import {
  decidedWinner,
  formatDuration,
  Game,
  modeName,
  modeOf,
  POSITIONS,
  Position,
  seriesScore,
  Team,
  TEAM_COLORS,
  TeamColor,
  teamScore,
  timeLeft,
} from '../game';
import { GameService, TeamLineup } from '../game.service';
import { openNewGameDialog } from '../game-new/game-new-dialog/game-new-dialog.component';

/** A decided game waits this long for an undo before its result is recorded. */
const UNDO_WINDOW_MS = 5000;

@Component({
  selector: 'fl-game-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    RatingChangeComponent,
    TranslocoPipe,
  ],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent {
  private readonly _gameService = inject(GameService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _dialog = inject(MatDialog);
  private readonly _router = inject(Router);
  private readonly _notifier = inject(Notifier);
  private readonly _transloco = inject(TranslocoService);
  protected readonly playerService = inject(PlayerService);

  /** Game this device is already closing, so it is closed (and announced) only once. */
  private _closing?: string;
  /** Game scored on this device: when it ends, this device offers the rematch. */
  private _scoredHere?: string;

  protected readonly colors = TEAM_COLORS;
  protected readonly positions = POSITIONS;
  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
  protected readonly positionNames = {
    offence: 'position.offence',
    defence: 'position.defence',
  } as const;

  /** `undefined` while loading, `null` when the game does not exist. */
  protected readonly game = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((params) => this._gameService.getGame(params.get('gameId') ?? '')),
    ),
  );

  protected readonly leagueId = computed(() => {
    const game = this.game();
    return game ? leagueOf(game) : null;
  });

  protected readonly canRematch = computed(() => {
    const leagueId = this.leagueId();
    const league = leagueId ? this._leagueService.league(leagueId) : null;
    return !!league && !league.archived;
  });

  /** Rating change of each player, once the game is finished. */
  private readonly _changes = computed(() => {
    const game = this.game();
    const leagueId = this.leagueId();
    return game?.end && leagueId
      ? this._gameService.ratings(leagueId)?.changes.get(game.id)
      : undefined;
  });

  protected readonly score = computed(() => {
    const game = this.game();
    return {
      red: game ? teamScore(game, 'red') : 0,
      blue: game ? teamScore(game, 'blue') : 0,
    };
  });

  private readonly _now = toSignal(interval(1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  /** Winner of a running game that is over (on goals, or when the time is up). */
  protected readonly decided = computed(() => {
    const game = this.game();
    return game && !game.end ? decidedWinner(game, this._now()) : undefined;
  });

  /** Time played, or for a running timed game the time left; `golden` on a tie after it. */
  protected readonly clock = computed(() => {
    const game = this.game();
    if (!game) {
      return { time: '', golden: false };
    }
    const now = game.end ? Date.parse(game.end) : this._now();
    const left = game.end ? undefined : timeLeft(game, now);
    if (left === undefined) {
      return { time: formatDuration((now - Date.parse(game.start)) / 1000), golden: false };
    }
    return { time: formatDuration(Math.ceil(left)), golden: left <= 0 };
  });

  /** Mode shown next to the clock; nothing for the usual game to 8. */
  protected readonly modeLabel = computed(() => {
    const game = this.game();
    const mode = game ? modeOf(game) : null;
    const name = mode && modeName(mode);
    if (!mode || name === 'to8') {
      return null;
    }
    return name
      ? { key: `modes.${name}`, target: mode.target }
      : { key: 'modes.custom', target: mode.target };
  });

  protected readonly series = computed(() => {
    const game = this.game();
    if (!game?.series) {
      return null;
    }
    const games = this._gameService.seriesGames(game) ?? [];
    const score = seriesScore(game, games);
    const { bestOf, game: number } = game.series;
    // Only the latest game of an unfinished series leads to the next one.
    const isLatest = games.at(-1)?.id === game.id;
    const next = game.end && !score.winner && isLatest && number < bestOf ? number + 1 : null;
    return { ...score, bestOf, number, next };
  });

  protected readonly lastEvent = computed(() => {
    const game = this.game();
    return game && !game.end ? game.events?.at(-1) : undefined;
  });

  constructor() {
    // A decided game gives everyone a few seconds to undo the last goal; then any device
    // showing it records the result.
    effect((onCleanup) => {
      const game = this.game();
      if (game && this.decided() && this._closing !== game.id) {
        const timer = setTimeout(() => this._closeDecided(game.id), UNDO_WINDOW_MS);
        onCleanup(() => clearTimeout(timer));
      }
    });
    keepScreenOn(() => {
      const game = this.game();
      return !!game && !game.end;
    });
  }

  protected change(playerId: string): number | null {
    const change = this._changes()?.get(playerId);
    return change === undefined ? null : Math.round(change);
  }

  protected canSwap(game: Game, color: TeamColor): boolean {
    const team = game.teams[color];
    return (
      !game.end && !!game.events && !this.decided() && team.defence.player !== team.offence.player
    );
  }

  protected goal(color: TeamColor, position: Position, ownGoal = false): void {
    const game = this.game();
    if (!game || game.end || this.decided()) {
      return;
    }
    this._scoredHere = game.id;
    this._gameService
      .scoreGoal(game, color, position, ownGoal)
      .catch((error) => this._notifier.error('error.goal', error));
  }

  protected swap(color: TeamColor): void {
    const game = this.game();
    if (game && this.canSwap(game, color)) {
      this._gameService
        .swapPositions(game, color)
        .catch((error) => this._notifier.error('error.swap', error));
    }
  }

  protected undo(): void {
    const game = this.game();
    if (game && !game.end && game.events?.length) {
      this._gameService.undo(game).catch((error) => this._notifier.error('error.undo', error));
    }
  }

  protected rematch(): void {
    const game = this.game();
    const leagueId = this.leagueId();
    if (game && leagueId && this.canRematch()) {
      openNewGameDialog(this._dialog, { leagueId, previousGame: game });
    }
  }

  /** Starts the next game of the series: the teams swap colours and keep their positions. */
  protected nextInSeries(): void {
    const game = this.game();
    const next = this.series()?.next;
    const leagueId = this.leagueId();
    if (!game?.series || !next || !leagueId) {
      return;
    }
    const lineup = (team: Team): TeamLineup => ({
      defence: team.defence.player,
      offence: team.offence.player,
    });
    const { id, saved } = this._gameService.createGame(
      leagueId,
      lineup(game.teams.blue),
      lineup(game.teams.red),
      modeOf(game),
      { ...game.series, game: next },
    );
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._router.navigate(['/game', id]);
  }

  protected remove(): void {
    const game = this.game();
    const leagueId = this.leagueId();
    if (
      !game ||
      !leagueId ||
      game.win ||
      !confirm(this._transloco.translate('game.removeConfirm'))
    ) {
      return;
    }
    this._gameService
      .deleteGame(game.id)
      .catch((error) => this._notifier.error('error.remove', error));
    openNewGameDialog(this._dialog, { leagueId, previousGame: game });
  }

  /**
   * Records the result once every goal from this device has reached the server. The device
   * used for scoring then offers a rematch, unless a series goes on.
   */
  private async _closeDecided(gameId: string): Promise<void> {
    await this._gameService.whenSaved();
    const game = this.game();
    if (
      game?.id !== gameId ||
      game.end ||
      !decidedWinner(game, Date.now()) ||
      this._closing === gameId
    ) {
      return;
    }
    this._closing = gameId;
    const winner = await this._gameService.closeGame(gameId).catch((error) => {
      this._closing = undefined;
      this._notifier.error('error.result', error);
      return undefined;
    });
    if (!winner || this._scoredHere !== gameId) {
      return;
    }
    const played = (this._gameService.seriesGames(game) ?? []).map((other) =>
      other.id === gameId ? { ...other, win: winner } : other,
    );
    if (!game.series || seriesScore(game, played).winner) {
      this.rematch();
    }
  }
}
