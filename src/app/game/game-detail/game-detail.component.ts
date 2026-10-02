import { Component, computed, effect, HostListener, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, interval, map, switchMap } from 'rxjs';

import { leagueOf } from '../../league/league';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { cssColor } from '../../shared/css-color';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { LeaveGuarded } from '../../shared/leave-guard';
import { keepScreenOn } from '../../shared/wake-lock';
import {
  decidedWinner,
  formatDuration,
  Game,
  isDefaultMode,
  lineupOf,
  lineupPlayers,
  modeOf,
  playTime,
  POSITIONS,
  Position,
  seriesScore,
  TEAM_COLORS,
  TeamColor,
  teamScore,
  timeLeft,
} from '../game';
import { GameService } from '../game.service';
import { openNewGameDialog } from '../game-new/game-new-dialog/game-new-dialog.component';
import { openGameTimeline } from '../game-timeline/game-timeline.component';
import { ModeLabelComponent } from '../mode/mode-label.component';
import { FinishPanelComponent } from './finish-panel.component';
import { openLeaveDialog } from './leave-dialog.component';
import { PauseOverlayComponent } from './pause-overlay.component';

/** A decided game waits this long (for an undo, or "Next") before its result is recorded. */
const FINISH_AFTER_MS = 8000;

@Component({
  selector: 'fl-game-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    FinishPanelComponent,
    ModeLabelComponent,
    PauseOverlayComponent,
    RatingChangeComponent,
    TranslocoPipe,
  ],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent implements LeaveGuarded {
  private readonly _gameService = inject(GameService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _dialog = inject(MatDialog);
  private readonly _bottomSheet = inject(MatBottomSheet);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);
  private readonly _notifier = inject(Notifier);
  private readonly _transloco = inject(TranslocoService);
  protected readonly playerService = inject(PlayerService);

  /** Game this device is already closing, so it is closed (and announced) only once. */
  private _closing?: string;
  /** Game scored on this device: when it ends, this device offers the rematch. */
  private _scoredHere?: string;
  /** Game whose win was already celebrated on this device. */
  private _celebrated?: string;

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

  /** Where the back arrow leads: the tournament of the game, or its league. */
  protected readonly backLink = computed(() => {
    const game = this.game();
    const leagueId = this.leagueId();
    return game?.tournament ? ['/l', leagueId, 't', game.tournament] : ['/l', leagueId];
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
      return { time: formatDuration(playTime(game, now) / 1000), golden: false };
    }
    return { time: formatDuration(Math.ceil(left)), golden: left <= 0 };
  });

  /** Rules shown next to the clock; nothing for the usual game to 8. */
  protected readonly mode = computed(() => {
    const game = this.game();
    return game && !isDefaultMode(game.mode) ? modeOf(game) : null;
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

  /** Names of the winning team (decided or finished). */
  protected readonly winners = computed(() => {
    const game = this.game();
    const winner = this.decided() ?? game?.win;
    return game && winner
      ? lineupPlayers(lineupOf(game.teams[winner]))
          .map((player) => this.playerService.getPlayerName(player))
          .join(' & ')
      : '';
  });

  constructor() {
    // A decided game shows the finish panel for a few seconds (time to undo the last goal or
    // tap "Next"); then any device showing it records the result, and the device used for
    // scoring moves on.
    effect((onCleanup) => {
      const game = this.game();
      if (game && this.decided() && this._closing !== game.id) {
        const timer = setTimeout(
          () => this._closeDecided(game.id, this._scoredHere === game.id),
          FINISH_AFTER_MS,
        );
        onCleanup(() => clearTimeout(timer));
      }
    });
    // Confetti in the winners' colour, once per decided game.
    effect(() => {
      const game = this.game();
      const winner = this.decided();
      if (game && winner && this._celebrated !== game.id) {
        this._celebrated = game.id;
        this._celebrate(winner);
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

  /** "Next" on the finish panel: record the result now and move on. */
  protected next(): void {
    const game = this.game();
    if (game && this.decided()) {
      this._closeDecided(game.id, true);
    }
  }

  /** A game whose clock runs: started, not decided, not paused. */
  private _running(): boolean {
    const game = this.game();
    return !!game && !game.end && !game.paused && !game.deleted && !this.decided();
  }

  /** Leaving a running game asks whether to pause it first. */
  public canLeave(): boolean | Promise<boolean> {
    if (!this._running()) {
      return true;
    }
    return firstValueFrom(openLeaveDialog(this._dialog).afterClosed()).then((choice) => {
      if (choice === 'pause') {
        this.pause();
      }
      return choice === 'pause' || choice === 'leave';
    });
  }

  /** Closing the tab or the browser during a running game asks the browser to confirm. */
  @HostListener('window:beforeunload', ['$event'])
  protected warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this._running()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected pause(): void {
    const game = this.game();
    if (game && !game.end && !game.paused) {
      this._gameService.pause(game).catch((error) => this._notifier.error('error.pause', error));
    }
  }

  protected resume(): void {
    const game = this.game();
    if (game?.paused) {
      this._gameService.resume(game).catch((error) => this._notifier.error('error.pause', error));
    }
  }

  protected goal(color: TeamColor, position: Position, ownGoal = false): void {
    const game = this.game();
    if (!game || game.end || game.paused || this.decided()) {
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

  protected showTimeline(): void {
    const game = this.game();
    if (game?.events) {
      openGameTimeline(this._bottomSheet, game);
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
    const { id, saved } = this._gameService.createGame(
      leagueId,
      lineupOf(game.teams.blue),
      lineupOf(game.teams.red),
      modeOf(game),
      { series: { ...game.series, game: next } },
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
    if (game.tournament) {
      this._router.navigate(this.backLink());
    } else {
      openNewGameDialog(this._dialog, { leagueId, previousGame: game });
    }
  }

  /** Deletes a finished game (it can be restored), with an undo right away. */
  protected deleteFinished(): void {
    const game = this.game();
    if (!game?.end || !confirm(this._transloco.translate('game.deleteConfirm'))) {
      return;
    }
    this._setDeleted(game.id, true);
    this._snackBar
      .open(this._transloco.translate('game.deleted'), this._transloco.translate('game.undo'), {
        duration: 8000,
      })
      .onAction()
      .subscribe(() => this._setDeleted(game.id, false));
  }

  protected restore(): void {
    const game = this.game();
    if (game) {
      this._setDeleted(game.id, false);
    }
  }

  private async _celebrate(winner: TeamColor): Promise<void> {
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.65 },
      colors: [cssColor(winner === 'red' ? '--fl-red' : '--fl-blue'), cssColor('--fl-ball')],
      disableForReducedMotion: true,
    });
  }

  private _setDeleted(gameId: string, deleted: boolean): void {
    this._gameService
      .setDeleted(gameId, deleted)
      .catch((error) => this._notifier.error('error.remove', error));
  }

  /**
   * Records the result once every goal from this device has reached the server. With
   * `moveOn` (the device used for scoring, or someone tapped "Next") it then goes back to the
   * tournament, or offers a rematch unless a series goes on.
   */
  private async _closeDecided(gameId: string, moveOn: boolean): Promise<void> {
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
    if (!winner || !moveOn) {
      return;
    }
    // In a tournament the next game is set up on the tournament page.
    if (game.tournament) {
      this._router.navigate(this.backLink());
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
