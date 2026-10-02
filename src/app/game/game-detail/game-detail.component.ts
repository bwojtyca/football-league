import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { interval, map, switchMap } from 'rxjs';

import { leagueOf } from '../../league/league';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import {
  formatDuration,
  Game,
  POSITIONS,
  Position,
  TEAM_COLORS,
  TeamColor,
  teamScore,
  winnerOf,
} from '../game';
import { GameService } from '../game.service';
import { openNewGameDialog } from '../game-new/game-new-dialog/game-new-dialog.component';

const CLOSE_FOR_OTHERS_AFTER_MS = 5000;

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
  private readonly _notifier = inject(Notifier);
  private readonly _transloco = inject(TranslocoService);
  protected readonly playerService = inject(PlayerService);

  /** Game this device is already closing, so it is closed (and announced) only once. */
  private _closing?: string;

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

  protected readonly gameTime = computed(() => {
    const game = this.game();
    if (!game) {
      return '';
    }
    const end = game.end ? new Date(game.end).getTime() : this._now();
    return formatDuration((end - new Date(game.start).getTime()) / 1000);
  });

  constructor() {
    // The device that scores the deciding goal closes the game. If it went away before
    // doing so, any device showing the game closes it after a short wait.
    effect((onCleanup) => {
      const game = this.game();
      if (game && !game.end && winnerOf(game) && this._closing !== game.id) {
        const timer = setTimeout(() => {
          this._closing = game.id;
          this._close(game);
        }, CLOSE_FOR_OTHERS_AFTER_MS);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }

  protected change(playerId: string): number | null {
    const change = this._changes()?.get(playerId);
    return change === undefined ? null : Math.round(change);
  }

  protected goal(color: TeamColor, position: Position, ownGoal = false): void {
    const game = this.game();
    if (!game || game.end || winnerOf(game) || this._closing === game.id) {
      return;
    }
    this._gameService.scoreGoal(game.id, color, position, ownGoal).then(
      () => this._closeIfWon(game.id),
      (error) => this._notifier.error('error.goal', error),
    );
  }

  /**
   * Records the result once every goal from this device has reached the server and the
   * score has a winner. Deciding after the writes, not before them, keeps quick taps
   * from slipping past a stale score.
   */
  private async _closeIfWon(gameId: string): Promise<void> {
    await this._gameService.whenSaved();
    const game = this.game();
    if (game?.id !== gameId || game.end || !winnerOf(game) || this._closing === gameId) {
      return;
    }
    this._closing = gameId;
    const winner = await this._close(game);
    if (winner) {
      const team = this._transloco.translate(this.teamNames[winner]);
      alert(this._transloco.translate('game.wins', { team }));
      this.rematch();
    }
  }

  protected rematch(): void {
    const game = this.game();
    const leagueId = this.leagueId();
    if (game && leagueId && this.canRematch()) {
      openNewGameDialog(this._dialog, { leagueId, previousGame: game });
    }
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

  /** Records the result; resolves with the winner once the game is closed. */
  private _close(game: Game): Promise<TeamColor | undefined> {
    return this._gameService.closeGame(game.id).catch((error) => {
      this._closing = undefined;
      this._notifier.error('error.result', error);
      return undefined;
    });
  }
}
