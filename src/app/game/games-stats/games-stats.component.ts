import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { switchMap } from 'rxjs';

import { PlayerService } from '../../player/player.service';
import { GameService } from '../game.service';
import { calculateStats, ratio } from './player-stats';

@Component({
  selector: 'fl-games-stats',
  imports: [DecimalPipe, MatExpansionModule, MatListModule],
  templateUrl: './games-stats.component.html',
  styleUrl: './games-stats.component.scss',
})
export class GamesStatsComponent {
  private readonly _gameService = inject(GameService);
  protected readonly playerService = inject(PlayerService);

  public readonly playerId = input.required<string>();

  private readonly _games = toSignal(
    toObservable(this.playerId).pipe(switchMap((id) => this._gameService.getPlayerGames(id))),
  );

  protected readonly stats = computed(() => {
    const games = this._games();
    return games && calculateStats(games, this.playerId());
  });

  protected readonly ratio = ratio;
}
