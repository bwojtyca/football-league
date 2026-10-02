import { Component, computed, inject, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { PlayerService } from '../../player/player.service';
import { Game, Team, teamOf, teamPlayers, teamScore } from '../game';
import { GameService } from '../game.service';

const LIMIT = 10;

@Component({
  selector: 'fl-game-list',
  imports: [MatListModule, RouterLink],
  templateUrl: './game-list.component.html',
  styleUrl: './game-list.component.css',
})
export class GameListComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _gameService = inject(GameService);

  public readonly playerId = input.required<string>();
  /** Show only the latest games. */
  public readonly limit = input(false);

  protected readonly games = computed(() => {
    const games = this._gameService.playerGames(this.playerId()) ?? [];
    return (this.limit() ? games.slice(0, LIMIT) : games).map((game) => ({
      id: game.id,
      result: this._result(game),
      score: `${teamScore(game, 'red')}:${teamScore(game, 'blue')}`,
      red: this._names(game.teams.red),
      blue: this._names(game.teams.blue),
    }));
  });

  private _names(team: Team) {
    return teamPlayers(team).map((id) => ({
      name: this._playerService.getPlayerName(id),
      current: id === this.playerId(),
    }));
  }

  private _result(game: Game): 'in-progress' | 'win' | 'lost' {
    if (!game.win) {
      return 'in-progress';
    }
    return teamOf(game, this.playerId()) === game.win ? 'win' : 'lost';
  }
}
