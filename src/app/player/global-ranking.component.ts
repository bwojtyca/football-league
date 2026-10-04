import { Component, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameService } from '../game/game.service';
import { ALL_LEAGUES } from '../league/league';
import { leagueTitles, titlesByPlayer } from '../stats/titles';
import { TopBarComponent } from '../shared/top-bar.component';
import { rankPlayers } from './player';
import { PlayerService } from './player.service';
import { RankingComponent } from './ranking/ranking.component';

/** One ranking over every league: Elo, win %, pairs and the potato, from all games. */
@Component({
  selector: 'fl-global-ranking',
  imports: [MatProgressSpinnerModule, RankingComponent, TopBarComponent, TranslocoPipe],
  template: `
    <fl-top-bar [title]="'ranking.global' | transloco" back="/leagues" />
    <main class="page">
      <p class="hint">{{ 'ranking.globalHint' | transloco }}</p>
      @if (players(); as players) {
        <fl-ranking
          [players]="players"
          [games]="games()"
          [playerLink]="playerLink"
          [titles]="titles()"
        />
      } @else {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      }
    </main>
  `,
  styles: `
    .hint {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
  `,
})
export class GlobalRankingComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);

  protected readonly games = computed(() => this._gameService.leagueGames(ALL_LEAGUES) ?? []);
  protected readonly playerLink = (playerId: string) => ['/player', playerId];

  /** Titles over all leagues, shown next to the names. */
  protected readonly titles = computed(() => {
    const ratings = this._gameService.ratings(ALL_LEAGUES);
    return ratings ? titlesByPlayer(leagueTitles(this.games(), ratings)) : new Map();
  });

  /** Everyone who played at least once, ranked across leagues. */
  protected readonly players = computed(() => {
    const games = this._gameService.leagueGames(ALL_LEAGUES);
    const ratings = this._gameService.ratings(ALL_LEAGUES);
    const all = this._playerService.players();
    if (!games || !ratings || !all) {
      return undefined;
    }
    const played = new Set(games.flatMap((game) => game.players));
    return rankPlayers(
      all.filter((player) => played.has(player.id)),
      games,
      ratings,
    );
  });
}
