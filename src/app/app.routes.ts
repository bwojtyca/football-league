import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { GameDetailComponent } from './game/game-detail/game-detail.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'game/:gameId', component: GameDetailComponent },
  { path: '**', redirectTo: '' },
];
