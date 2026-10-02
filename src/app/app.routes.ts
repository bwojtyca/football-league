import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { LeagueService } from './league/league.service';

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
    path: 'l/:leagueId',
    loadComponent: () =>
      import('./league/league-page/league-page.component').then((m) => m.LeaguePageComponent),
  },
  {
    path: 'l/:leagueId/settings',
    loadComponent: () =>
      import('./league/league-settings/league-settings.component').then(
        (m) => m.LeagueSettingsComponent,
      ),
  },
  {
    path: 'l/:leagueId/player/:playerId',
    loadComponent: () =>
      import('./player/player-page/player-page.component').then((m) => m.PlayerPageComponent),
  },
  {
    path: 'l/:leagueId/t/:tournamentId',
    loadComponent: () =>
      import('./tournament/tournament-page/tournament-page.component').then(
        (m) => m.TournamentPageComponent,
      ),
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
    path: 'game/:gameId',
    loadComponent: () =>
      import('./game/game-detail/game-detail.component').then((m) => m.GameDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
