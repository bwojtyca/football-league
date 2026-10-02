import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval, map, switchMap } from 'rxjs';

import { AvatarComponent } from '../../player/avatar/avatar.component';
import { Notifier } from '../../notifier';
import { PlayerService } from '../../player/player.service';
import {
  addGoal,
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
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
  ],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent {
  private readonly _gameService = inject(GameService);
  private readonly _dialog = inject(MatDialog);
  private readonly _notifier = inject(Notifier);
  protected readonly playerService = inject(PlayerService);

  /** Game this device is already closing, so it is closed (and announced) only once. */
  private _closing?: string;

  protected readonly colors = TEAM_COLORS;
  protected readonly positions = POSITIONS;

  /** `undefined` while loading, `null` when the game does not exist. */
  protected readonly game = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((params) => this._gameService.getGame(params.get('gameId') ?? '')),
    ),
  );

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

  protected goal(color: TeamColor, position: Position, ownGoal = false): void {
    const game = this.game();
    if (!game || game.end || winnerOf(game) || this._closing === game.id) {
      return;
    }
    const decides = !!winnerOf(addGoal(game, color, position, ownGoal));
    if (decides) {
      this._closing = game.id;
    }
    this._gameService.scoreGoal(game.id, color, position, ownGoal).then(
      async () => {
        if (!decides) {
          return;
        }
        // The goal has reached the server, so the result can be recorded there.
        const winner = await this._close(game);
        if (winner) {
          alert(`team ${winner} wins!`);
          openNewGameDialog(this._dialog, { previousGame: game });
        }
      },
      (error) => {
        if (decides) {
          this._closing = undefined;
        }
        this._notifier.error('Could not save the goal.', error);
      },
    );
  }

  protected remove(): void {
    const game = this.game();
    if (!game || game.win || !confirm('Remove this game?')) {
      return;
    }
    this._gameService
      .deleteGame(game.id)
      .catch((error) => this._notifier.error('Could not remove the game.', error));
    openNewGameDialog(this._dialog, { previousGame: game });
  }

  /** Records the result; resolves with the winner once the game is closed. */
  private _close(game: Game): Promise<TeamColor | undefined> {
    return this._gameService.closeGame(game.id).catch((error) => {
      this._closing = undefined;
      this._notifier.error('Could not save the result.', error);
      return undefined;
    });
  }

  protected positionName(position: Position): string {
    return position === 'offence' ? 'Attacker' : 'Defender';
  }
}
