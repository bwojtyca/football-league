import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  MatExpansionModule, MatListModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
  MatProgressSpinnerModule
} from '@angular/material';
import {PlayerListComponent} from './player-list/player-list.component';
import {GameModule} from '../game/game.module';
import {PlayerService} from './player.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    GameModule
  ],
  exports: [
    PlayerListComponent
  ],
  declarations: [
    PlayerListComponent
  ],
  providers: [
    PlayerService
  ]
})
export class PlayerModule {
}
