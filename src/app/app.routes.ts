import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { LeagueService } from './league/league.service';
import { leaveGuard } from './shared/leave-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // Back to the league opened last on this device, or the list of leagues.
    redirectTo: () => {
      const last = inject(LeagueService).lastLeague;
      return last ? `/l/${last}` : '/leagues';
    },
  },
  {
    path: 'leagues',
    loadComponent: () =>
      import('./league/leagues/leagues.component').then((m) => m.LeaguesComponent),
  },
  {
    // A league's pages share the bottom navigation.
    path: 'l/:leagueId',
    loadComponent: () =>
      import('./league/league-layout.component').then((m) => m.LeagueLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./league/league-page/league-page.component').then((m) => m.LeaguePageComponent),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./league/league-games.component').then((m) => m.LeagueGamesComponent),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./league/league-stats-page.component').then((m) => m.LeagueStatsPageComponent),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./league/league-tournaments.component').then((m) => m.LeagueTournamentsComponent),
      },
      {
        path: 'more',
        loadComponent: () =>
          import('./league/league-hub.component').then((m) => m.LeagueHubComponent),
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./league/league-players.component').then((m) => m.LeaguePlayersComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./league/league-settings/league-settings.component').then(
            (m) => m.LeagueSettingsComponent,
          ),
      },
      {
        path: 'player/:playerId',
        loadComponent: () =>
          import('./player/player-page/player-page.component').then((m) => m.PlayerPageComponent),
      },
      {
        path: 'compare/:a/:b',
        loadComponent: () =>
          import('./stats/compare-page.component').then((m) => m.ComparePageComponent),
      },
      {
        path: 't/:tournamentId',
        loadComponent: () =>
          import('./tournament/tournament-page/tournament-page.component').then(
            (m) => m.TournamentPageComponent,
          ),
      },
    ],
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./player/global-ranking.component').then((m) => m.GlobalRankingComponent),
  },
  {
    path: 'player/:playerId',
    loadComponent: () =>
      import('./player/player-page/player-page.component').then((m) => m.PlayerPageComponent),
  },
  {
    path: 'compare/:a/:b',
    loadComponent: () =>
      import('./stats/compare-page.component').then((m) => m.ComparePageComponent),
  },
  {
    path: 'game/:gameId',
    loadComponent: () =>
      import('./game/game-detail/game-detail.component').then((m) => m.GameDetailComponent),
    canDeactivate: [leaveGuard],
  },
  { path: '**', redirectTo: '' },
];
