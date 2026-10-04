import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
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
import {
  ACHIEVEMENTS,
  AchievementId,
  BIG_COMEBACK_GOALS,
  COMEBACK_GOALS,
  GAME_MILESTONES,
  LONG_STREAK_WINS,
  LOSS_STREAK,
  MISHAPS,
  playerRecords,
  SHORT_STREAK_WINS,
  STREAK_WINS,
  UNDERDOG_CHANCE,
} from '../records';
import { leagueTitles, titlesByPlayer } from '../../stats/titles';
import { ALL_LEAGUES } from '../../league/league';
import { compareLink } from '../../stats/compare-link';
import { cssColor, withAlpha } from '../../shared/css-color';
import { TopBarComponent } from '../../shared/top-bar.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { compareNames, rankPlayers } from '../player';
import { PlayerService } from '../player.service';
import { START_RATING } from '../rating';

/** How each achievement looks: its icon, its name (`key`) and the numbers in it. */
const BADGES: Record<AchievementId, { icon: string; key: string; params: object }> = {
  firstWin: { icon: 'star', key: 'firstWin', params: {} },
  shutout: { icon: 'block', key: 'shutout', params: {} },
  comeback: { icon: 'trending_up', key: 'comeback', params: { n: COMEBACK_GOALS } },
  bigComeback: { icon: 'rocket_launch', key: 'comeback', params: { n: BIG_COMEBACK_GOALS } },
  streak3: { icon: 'whatshot', key: 'streak', params: { n: SHORT_STREAK_WINS } },
  streak: { icon: 'local_fire_department', key: 'streak', params: { n: STREAK_WINS } },
  streak10: { icon: 'auto_awesome', key: 'streak', params: { n: LONG_STREAK_WINS } },
  giantKiller: {
    icon: 'bolt',
    key: 'giantKiller',
    params: { n: Math.round(UNDERDOG_CHANCE * 100) },
  },
  hatTrick: { icon: 'filter_3', key: 'hatTrick', params: {} },
  solo: { icon: 'person', key: 'solo', params: {} },
  goalieGoal: { icon: 'sports_handball', key: 'goalieGoal', params: {} },
  goldenGoal: { icon: 'timer', key: 'goldenGoal', params: {} },
  marathon: { icon: 'directions_run', key: 'marathon', params: {} },
  revenge: { icon: 'replay', key: 'revenge', params: {} },
  games10: { icon: 'military_tech', key: 'milestone', params: { n: GAME_MILESTONES.games10 } },
  games50: { icon: 'military_tech', key: 'milestone', params: { n: GAME_MILESTONES.games50 } },
  milestone: {
    icon: 'military_tech',
    key: 'milestone',
    params: { n: GAME_MILESTONES.milestone },
  },
  games250: { icon: 'military_tech', key: 'milestone', params: { n: GAME_MILESTONES.games250 } },
  underTable: { icon: 'table_restaurant', key: 'underTable', params: {} },
  ownGoal: { icon: 'sports_soccer', key: 'ownGoal', params: {} },
  lossStreak: { icon: 'trending_down', key: 'lossStreak', params: { n: LOSS_STREAK } },
};

@Component({
  selector: 'fl-player-page',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
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
      // Without a league in the address, the profile covers every league.
      map((p) => ({
        leagueId: p.get('leagueId') ?? ALL_LEAGUES,
        playerId: p.get('playerId') ?? '',
      })),
    ),
    { initialValue: { leagueId: '', playerId: '' } },
  );

  protected readonly leagueId = computed(() => this._params().leagueId);
  protected readonly playerId = computed(() => this._params().playerId);
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
  protected readonly overall = computed(() => this.leagueId() === ALL_LEAGUES);
  protected readonly backLink = computed(() =>
    this.overall() ? '/ranking' : `/l/${this.leagueId()}`,
  );

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

  /** Players to compare with: the league's (everyone rated, overall), by name. */
  protected readonly comparable = computed(() => {
    const ids = this.overall()
      ? [...(this._gameService.ratings(ALL_LEAGUES)?.current.keys() ?? [])]
      : (this.league()?.players ?? []);
    return ids
      .filter((id) => id !== this.playerId())
      .map((id) => ({ id, name: this._playerService.getPlayerName(id) }))
      .sort(compareNames);
  });
  protected readonly compareLink = compareLink;

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
    const ratings = this._gameService.ratings(this.leagueId());
    const history = ratings?.history.get(this.playerId());
    return games ? playerRecords(this.playerId(), games, history, ratings?.changes) : null;
  });

  /** Titles the player holds now in this league (or overall). */
  protected readonly titles = computed(() => {
    const games = this._gameService.leagueGames(this.leagueId());
    const ratings = this._gameService.ratings(this.leagueId());
    const minGames = this.overall() ? 0 : (this.league()?.minGames ?? 0);
    return games && ratings
      ? (titlesByPlayer(leagueTitles(games, ratings, minGames)).get(this.playerId()) ?? [])
      : [];
  });

  /** Achievements, then mishaps, in display order; earned ones lit. */
  protected readonly achievements = computed(() => this._badges(ACHIEVEMENTS));
  protected readonly mishaps = computed(() => this._badges(MISHAPS));

  private _badges(ids: readonly AchievementId[]) {
    const earned = this.records()?.achievements;
    return earned ? ids.map((id) => ({ id, ...BADGES[id], ...earned[id] })) : [];
  }

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
