import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GameListComponent } from '../../game/game-list/game-list.component';
import { GameService } from '../../game/game.service';
import { GamesStatsComponent } from '../../game/games-stats/games-stats.component';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../avatar/avatar.component';
import { rankPlayers } from '../player';
import { PlayerService } from '../player.service';

@Component({
  selector: 'fl-player-list',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    AvatarComponent,
    GameListComponent,
    GamesStatsComponent,
  ],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.css',
})
export class PlayerListComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _gameService = inject(GameService);
  private readonly _notifier = inject(Notifier);

  protected readonly players = computed(() => {
    const players = this._playerService.players();
    const games = this._gameService.games();
    return players && games && rankPlayers(players, games);
  });
  protected readonly addNew = signal(false);
  protected readonly showStats = signal(false);
  protected readonly newPlayerName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected addPlayer(): void {
    const name = this.newPlayerName.value.trim();
    if (!name) {
      this.newPlayerName.markAsTouched();
      return;
    }
    this._playerService
      .addPlayer(name)
      .catch((error) => this._notifier.error('Could not add the player.', error));
    this.newPlayerName.reset();
    this.addNew.set(false);
  }

  protected toggleStats(): void {
    this.showStats.update((show) => !show);
  }
}
