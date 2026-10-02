import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';

import { PlayerService } from '../../player/player.service';
import { formatDuration } from '../game';
import { GameService } from '../game.service';
import { calculateStats, ratio } from './player-stats';

@Component({
  selector: 'fl-games-stats',
  imports: [NgTemplateOutlet, TranslocoDecimalPipe, TranslocoPipe],
  templateUrl: './games-stats.component.html',
  styleUrl: './games-stats.component.scss',
})
export class GamesStatsComponent {
  private readonly _gameService = inject(GameService);
  protected readonly playerService = inject(PlayerService);

  public readonly leagueId = input.required<string>();
  public readonly playerId = input.required<string>();

  protected readonly stats = computed(() => {
    const games = this._gameService.playerGames(this.leagueId(), this.playerId());
    return games && calculateStats(games, this.playerId());
  });

  protected readonly ratio = ratio;

  protected percent(part: number, total: number): number {
    return ratio(part, total) * 100;
  }

  protected duration(seconds: number, count: number): string {
    return count ? formatDuration(seconds / count) : '–';
  }
}
