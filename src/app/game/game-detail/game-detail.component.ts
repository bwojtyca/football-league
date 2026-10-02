import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval, map, switchMap } from 'rxjs';

import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { formatDuration, POSITIONS, Position, TEAM_COLORS, TeamColor, teamScore } from '../game';
import { GameService } from '../game.service';
import { openNewGameDialog } from '../game-new/game-new-dialog/game-new-dialog.component';

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
  protected readonly playerService = inject(PlayerService);

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

  protected async goal(color: TeamColor, position: Position, ownGoal = false): Promise<void> {
    const game = this.game();
    if (!game || game.end) {
      return;
    }
    const winner = await this._gameService.scoreGoal(game.id, color, position, ownGoal);
    if (winner) {
      alert(`team ${winner} wins!`);
      openNewGameDialog(this._dialog, { previousGame: game });
    }
  }

  protected async remove(): Promise<void> {
    const game = this.game();
    if (!game || game.win || !confirm('Remove this game?')) {
      return;
    }
    await this._gameService.deleteGame(game.id);
    openNewGameDialog(this._dialog, { previousGame: game });
  }

  protected positionName(position: Position): string {
    return position === 'offence' ? 'Attacker' : 'Defender';
  }
}
