import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

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

  protected readonly stats = computed(() => {
    const games = this._gameService.playerGames(this.playerId());
    return games && calculateStats(games, this.playerId());
  });

  protected readonly ratio = ratio;
}
