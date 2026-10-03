import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { map } from 'rxjs';

import { teamOf } from '../game/game';
import { GameListComponent } from '../game/game-list/game-list.component';
import { GameService } from '../game/game.service';
import { ALL_LEAGUES } from '../league/league';
import { LeagueService } from '../league/league.service';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { compareNames, rankPlayers, Result } from '../player/player';
import { PlayerService } from '../player/player.service';
import { START_RATING, winChance } from '../player/rating';
import { cssColor } from '../shared/css-color';
import { FormDotsComponent } from '../shared/form-dots.component';
import { TopBarComponent } from '../shared/top-bar.component';
import { compareLink } from './compare-link';
import { headToHead, ratingTimeline } from './stats';

/** Two players head to head: against each other, together, and their ratings over time. */
@Component({
  selector: 'fl-compare-page',
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    FormDotsComponent,
    GameListComponent,
    TopBarComponent,
    TranslocoDecimalPipe,
    TranslocoPipe,
  ],
  templateUrl: './compare-page.component.html',
  styleUrl: './compare-page.component.scss',
})
export class ComparePageComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _leagueService = inject(LeagueService);

  private readonly _params = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => ({
        leagueId: params.get('leagueId') ?? ALL_LEAGUES,
        a: params.get('a') ?? '',
        b: params.get('b') ?? '',
      })),
    ),
    { initialValue: { leagueId: '', a: '', b: '' } },
  );
  protected readonly leagueId = computed(() => this._params().leagueId);
  protected readonly a = computed(() => this._params().a);
  protected readonly b = computed(() => this._params().b);
  protected readonly compareLink = compareLink;

  private readonly _games = computed(() => this._gameService.leagueGames(this.leagueId()));

  /** Both players as the ranking sees them; `undefined` while loading, `null` if one is unknown. */
  protected readonly players = computed(() => {
    const games = this._games();
    const ratings = this._gameService.ratings(this.leagueId());
    if (!games || !ratings || !this._playerService.players()) {
      return undefined;
    }
    const a = this._playerService.player(this.a());
    const b = this._playerService.player(this.b());
    if (!a || !b) {
      return null;
    }
    const [first, second] = [a, b].map((p) => rankPlayers([p], games, ratings)[0]);
    return { a: first, b: second };
  });

  protected readonly h2h = computed(() => {
    const games = this._games();
    return games ? headToHead(games, this.a(), this.b()) : null;
  });

  /** The first player's last results against the second, oldest first. */
  protected readonly form = computed((): Result[] =>
    (this.h2h()?.against.list ?? [])
      .slice(-5)
      .map((game) => (teamOf(game, this.a()) === game.win ? 'W' : 'L')),
  );

  /** Chance of the first player to beat the second one on one, from their ratings. */
  protected readonly chance = computed(() => {
    const players = this.players();
    return players
      ? Math.round(
          winChance(players.a.rating ?? START_RATING, players.b.rating ?? START_RATING) * 100,
        )
      : null;
  });

  /** Other players to compare the first one with. */
  protected readonly others = computed(() => {
    const leagueId = this.leagueId();
    const ids =
      leagueId === ALL_LEAGUES
        ? [...(this._gameService.ratings(ALL_LEAGUES)?.current.keys() ?? [])]
        : (this._leagueService.league(leagueId)?.players ?? []);
    return ids
      .filter((id) => id !== this.a() && id !== this.b())
      .map((id) => ({ id, name: this._playerService.getPlayerName(id) }))
      .sort(compareNames);
  });

  protected readonly colors = computed(() => ({
    a: cssColor('--fl-series-1'),
    b: cssColor('--fl-series-2'),
  }));

  /** Both ratings after each game of the league. */
  protected readonly chart = computed((): ChartConfiguration<'line'>['data'] | null => {
    const games = this._games();
    const ratings = this._gameService.ratings(this.leagueId());
    const players = this.players();
    if (!games || !ratings || !players) {
      return null;
    }
    const lines = ratingTimeline(games, ratings);
    const a = lines.get(this.a());
    const b = lines.get(this.b());
    if (!a && !b) {
      return null;
    }
    const colors = this.colors();
    const length = (a ?? b)!.length;
    return {
      labels: Array.from({ length }, (_, i) => i + 1),
      datasets: [
        { player: players.a.name, data: a, color: colors.a },
        { player: players.b.name, data: b, color: colors.b },
      ]
        .filter((line) => line.data)
        .map((line) => ({
          label: line.player,
          data: line.data!,
          borderColor: line.color,
          backgroundColor: line.color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        })),
    };
  });

  protected readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { filter: (item) => item.parsed.y !== null },
    },
    scales: {
      x: { display: false },
      y: { ticks: { maxTicksLimit: 5 }, grid: { color: 'rgba(128, 128, 128, 0.2)' } },
    },
  };

  protected percent(part: number, total: number): number {
    return total ? Math.round((part / total) * 100) : 0;
  }

  protected playerLink(id: string): string[] {
    return this.leagueId() === ALL_LEAGUES
      ? ['/player', id]
      : ['/l', this.leagueId(), 'player', id];
  }
}
