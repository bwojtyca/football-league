import { Component } from '@angular/core';

import { GameNewComponent } from '../game/game-new/game-new.component';
import { PlayerListComponent } from '../player/player-list/player-list.component';

@Component({
  selector: 'fl-dashboard',
  imports: [PlayerListComponent, GameNewComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {}
