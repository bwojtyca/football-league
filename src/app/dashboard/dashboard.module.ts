import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from './dashboard.component';
import {PlayerModule} from '../player/player.module';
import {GameModule} from '../game/game.module';


@NgModule({
  imports: [
    CommonModule,
    PlayerModule,
    GameModule
  ],
  exports: [
    DashboardComponent
  ],
  declarations: [
    DashboardComponent
  ]
})
export class DashboardModule {
}
