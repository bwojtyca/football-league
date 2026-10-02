import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe, TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { map } from 'rxjs';

import { GameListComponent } from '../../game/game-list/game-list.component';
import { GamesStatsComponent } from '../../game/games-stats/games-stats.component';
import { GameService } from '../../game/game.service';
import { LeagueService } from '../../league/league.service';
import { FormDotsComponent } from '../../shared/form-dots.component';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { COMEBACK_GOALS, MILESTONE_GAMES, playerRecords, STREAK_WINS } from '../records';
import { cssColor, withAlpha } from '../../shared/css-color';
import { TopBarComponent } from '../../shared/top-bar.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { rankPlayers } from '../player';
import { PlayerService } from '../player.service';
import { START_RATING } from '../rating';

@Component({
  selector: 'fl-player-page',
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
    BaseChartDirective,
    FormDotsComponent,
    GameListComponent,
    GamesStatsComponent,
    RatingChangeComponent,
    TopBarComponent,
    TranslocoDatePipe,
    TranslocoDecimalPipe,
    TranslocoPipe,
  ],
  templateUrl: './player-page.component.html',
  styleUrl: './player-page.component.scss',
})
export class PlayerPageComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _leagueService = inject(LeagueService);

  private readonly _params = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => ({ leagueId: p.get('leagueId') ?? '', playerId: p.get('playerId') ?? '' })),
    ),
    { initialValue: { leagueId: '', playerId: '' } },
  );

  protected readonly leagueId = computed(() => this._params().leagueId);
  protected readonly playerId = computed(() => this._params().playerId);
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));

  /** `undefined` while loading, `null` when the player does not exist. */
  protected readonly player = computed(() => {
    const games = this._gameService.leagueGames(this.leagueId());
    const ratings = this._gameService.ratings(this.leagueId());
    if (!this._playerService.players() || !games || !ratings) {
      return undefined;
    }
    const player = this._playerService.player(this.playerId());
    return player ? rankPlayers([player], games, ratings)[0] : null;
  });

  /** Translation key of the position the player plays most, if any. */
  protected readonly mainPosition = computed(() => {
    let defence = 0;
    let offence = 0;
    for (const game of this._gameService.playerGames(this.leagueId(), this.playerId()) ?? []) {
      for (const team of [game.teams.red, game.teams.blue]) {
        if (team.defence.player === team.offence.player) {
          continue;
        }
        defence += Number(team.defence.player === this.playerId());
        offence += Number(team.offence.player === this.playerId());
      }
    }
    if (!defence && !offence) {
      return null;
    }
    return defence >= offence ? 'player.mostlyDefence' : 'player.mostlyOffence';
  });

  /** Ratings in defence and in attack (2 vs 2 games), for positions played at least once. */
  protected readonly positionRatings = computed(() => {
    const positions = this._gameService.ratings(this.leagueId())?.positions.get(this.playerId());
    return (['defence', 'offence'] as const)
      .filter((position) => positions?.[position].games)
      .map((position) => ({
        key: position === 'defence' ? 'player.inDefence' : 'player.inAttack',
        rating: Math.round(positions![position].rating),
        games: positions![position].games,
      }));
  });

  protected readonly records = computed(() => {
    const games = this._gameService.leagueGames(this.leagueId());
    const history = this._gameService.ratings(this.leagueId())?.history.get(this.playerId());
    return games ? playerRecords(this.playerId(), games, history) : null;
  });

  /** Achievements in display order, earned ones lit. */
  protected readonly achievements = computed(() => {
    const earned = this.records()?.achievements;
    if (!earned) {
      return [];
    }
    return [
      { id: 'shutout', icon: 'block', ...earned.shutout, params: {} },
      { id: 'comeback', icon: 'trending_up', ...earned.comeback, params: { n: COMEBACK_GOALS } },
      { id: 'streak', icon: 'local_fire_department', ...earned.streak, params: { n: STREAK_WINS } },
      {
        id: 'milestone',
        icon: 'military_tech',
        ...earned.milestone,
        params: { n: MILESTONE_GAMES },
      },
    ];
  });

  /** Rating after each game, starting from the initial rating. */
  protected readonly chart = computed((): ChartConfiguration<'line'>['data'] | null => {
    const history = this._gameService.ratings(this.leagueId())?.history.get(this.playerId());
    if (!history || history.length < 2) {
      return null;
    }
    const points = [START_RATING, ...history].map(Math.round);
    const color = cssColor('--fl-win');
    return {
      labels: points.map((_, i) => i),
      datasets: [
        {
          data: points,
          borderColor: color,
          backgroundColor: withAlpha(color, 0.12),
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.2,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { ticks: { maxTicksLimit: 4 }, grid: { color: 'rgba(128, 128, 128, 0.2)' } },
    },
  };
}
