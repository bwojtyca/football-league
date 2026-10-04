import { Component, computed, inject, input, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TranslocoDatePipe, TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { formatDuration, Game } from '../game/game';
import { GameService } from '../game/game.service';
import { timelineOf } from '../game/timeline';
import { PlayerService } from '../player/player.service';
import { cssColor, withAlpha } from '../shared/css-color';
import { hoursAndMinutes, scoreOf, sidesOf } from './format';
import { LeagueService } from '../league/league.service';
import { LinesComponent } from './lines.component';
import { leagueStats, lineStats, ratingTimeline } from './stats';
import { ThirdsComponent } from './thirds.component';
import { leagueTitles } from './titles';
import { TitlesListComponent } from './titles-list.component';

/** A league record: what it is, its value, and the game or player holding it. */
interface RecordRow {
  key: string;
  value: string;
  game?: Game;
  player?: string;
}

/** A league in numbers: totals, when it plays, the table, records, ratings and goal times. */
@Component({
  selector: 'fl-league-stats',
  imports: [
    BaseChartDirective,
    LinesComponent,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterLink,
    ThirdsComponent,
    TitlesListComponent,
    TranslocoDatePipe,
    TranslocoDecimalPipe,
    TranslocoPipe,
  ],
  templateUrl: './league-stats.component.html',
  styleUrl: './league-stats.component.scss',
})
export class LeagueStatsComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _transloco = inject(TranslocoService);
  private readonly _leagueService = inject(LeagueService);

  public readonly leagueId = input.required<string>();

  private readonly _games = computed(() => this._gameService.leagueGames(this.leagueId()));
  protected readonly stats = computed(() => {
    const games = this._games();
    return games && leagueStats(games);
  });

  protected readonly lines = computed(() => lineStats(this._games() ?? []));

  protected readonly titles = computed(() => {
    const games = this._games();
    const ratings = this._gameService.ratings(this.leagueId());
    const minGames = this._leagueService.league(this.leagueId())?.minGames ?? 0;
    return games && ratings ? leagueTitles(games, ratings, minGames) : [];
  });
  protected readonly playerLink = (playerId: string) => ['/l', this.leagueId(), 'player', playerId];

  /** The locale of the language in use, for month and weekday names. */
  private readonly _locale = computed(() =>
    this._transloco.activeLang() === 'pl' ? 'pl-PL' : 'en-GB',
  );

  protected readonly months = computed(() => {
    const format = new Intl.DateTimeFormat(this._locale(), { month: 'short', year: 'numeric' });
    return (this.stats()?.months ?? []).map(({ month, games }) => ({
      label: format.format(new Date(`${month}-15T12:00:00`)),
      games,
    }));
  });

  protected readonly monthsChart = computed((): ChartConfiguration<'bar'>['data'] => {
    const months = this.months();
    return {
      labels: months.map((month) => month.label),
      datasets: [
        {
          data: months.map((month) => month.games),
          backgroundColor: cssColor('--fl-felt'),
          borderRadius: 4,
          borderSkipped: 'start',
          maxBarThickness: 36,
        },
      ],
    };
  });

  protected readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { maxTicksLimit: 4, precision: 0 },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
      },
    },
  };

  /** Games by weekday and hour, over the hours anyone played; weekends only when played. */
  protected readonly week = computed(() => {
    const stats = this.stats();
    if (!stats?.games) {
      return null;
    }
    const played = stats.week.flatMap((day) => day.flatMap((n, hour) => (n ? [hour] : [])));
    const hours = Array.from(
      { length: Math.max(...played) - Math.min(...played) + 1 },
      (_, i) => Math.min(...played) + i,
    );
    const most = Math.max(...stats.week.flat());
    const weekday = new Intl.DateTimeFormat(this._locale(), { weekday: 'short' });
    const days = stats.week
      // 1 January 2024 was a Monday.
      .map((counts, day) => ({
        name: weekday.format(new Date(2024, 0, 1 + day)),
        cells: hours.map((hour) => ({ hour, games: counts[hour], share: counts[hour] / most })),
      }))
      .filter((day, index) => index < 5 || day.cells.some((cell) => cell.games));
    let busiest = { day: '', hour: 0, games: 0 };
    for (const day of days) {
      for (const cell of day.cells) {
        if (cell.games > busiest.games) {
          busiest = { day: day.name, hour: cell.hour, games: cell.games };
        }
      }
    }
    return { hours, days, busiest };
  });

  protected readonly records = computed((): RecordRow[] => {
    const records = this.stats()?.records;
    if (!records) {
      return [];
    }
    const rows: RecordRow[] = [];
    const { longest, shortest, biggestWin, mostGoals, comeback, fastestGoal, streak } = records;
    if (longest) {
      rows.push({
        key: 'leagueStats.longest',
        value: this.time(longest.value),
        game: longest.game,
      });
    }
    if (shortest) {
      rows.push({
        key: 'leagueStats.shortest',
        value: this.time(shortest.value),
        game: shortest.game,
      });
    }
    if (biggestWin) {
      rows.push({
        key: 'leagueStats.biggestWin',
        value: this.score(biggestWin.game),
        game: biggestWin.game,
      });
    }
    if (mostGoals) {
      rows.push({
        key: 'leagueStats.mostGoals',
        value: this.score(mostGoals.game),
        game: mostGoals.game,
      });
    }
    if (comeback) {
      const score = timelineOf(comeback.game)?.comeback?.score;
      rows.push({
        key: 'leagueStats.comeback',
        value: score ? `${score.red}:${score.blue}` : '',
        game: comeback.game,
      });
    }
    if (fastestGoal) {
      rows.push({
        key: 'leagueStats.fastestGoal',
        value: this.time(fastestGoal.value / 1000),
        game: fastestGoal.game,
      });
    }
    if (streak) {
      rows.push({ key: 'leagueStats.streak', value: String(streak.wins), player: streak.player });
    }
    return rows;
  });

  /** Rated players, best first: the one chosen (or the leader) stands out in the chart. */
  protected readonly rated = computed(() =>
    [...(this._gameService.ratings(this.leagueId())?.current ?? [])]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ id, name: this._playerService.getPlayerName(id) })),
  );
  protected readonly chosen = signal<string | null>(null);
  protected readonly focus = computed(() => {
    const chosen = this.chosen();
    return chosen && this.rated().some((p) => p.id === chosen) ? chosen : this.rated()[0]?.id;
  });

  /** Everyone's rating after each game of the league; the focused player in ink, on top. */
  protected readonly ratingChart = computed((): ChartConfiguration<'line'>['data'] | null => {
    const games = this._games();
    const ratings = this._gameService.ratings(this.leagueId());
    if (!games || !ratings) {
      return null;
    }
    const lines = [...ratingTimeline(games, ratings)];
    if (!lines.length || lines[0][1].length < 2) {
      return null;
    }
    const focus = this.focus();
    const ink = cssColor('--fl-ink');
    const muted = withAlpha(cssColor('--fl-ink-2'), 0.35);
    // Chart.js draws the first dataset on top.
    lines.sort(([a], [b]) => Number(b === focus) - Number(a === focus));
    return {
      labels: lines[0][1].map((_, i) => i + 1),
      datasets: lines.map(([player, data]) => ({
        label: this._playerService.getPlayerName(player),
        data,
        borderColor: player === focus ? ink : muted,
        backgroundColor: player === focus ? ink : muted,
        borderWidth: player === focus ? 2.5 : 1.5,
        pointRadius: 0,
        pointHoverRadius: player === focus ? 4 : 0,
      })),
    };
  });

  protected readonly ratingOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
        filter: (item) => item.parsed.y !== null,
      },
    },
    scales: {
      x: { display: false },
      y: { ticks: { maxTicksLimit: 5 }, grid: { color: 'rgba(128, 128, 128, 0.2)' } },
    },
  };

  protected time(seconds: number): string {
    return formatDuration(seconds);
  }

  protected readonly hours = hoursAndMinutes;

  protected percent(part: number, total: number): number {
    return total ? Math.round((part / total) * 100) : 0;
  }

  protected score(game: Game): string {
    return scoreOf(game);
  }

  protected sides(game: Game): string {
    return sidesOf(game, (id) => this.name(id));
  }

  protected name(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }
}
