import { Component, Input, OnInit } from '@angular/core';
import { Game } from '../game';
import { PlayerService } from '../../player/player.service';
import { GameService } from '../game.service';

@Component({
  selector: 'fl-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.css']
})
export class GameListComponent implements OnInit {
  @Input() public playerId?: string;
  public games: Game[];

  constructor(private _playerService: PlayerService,
    private _gameService: GameService) {
  }

  public ngOnInit() {
    this._gameService.getPlayerGames(this.playerId).subscribe((games) => {
      this.games = games.sort((game1: Game, game2: Game) => {
        const start1 = new Date(game1.start).getTime();
        const start2 = new Date(game2.start).getTime();
        return start1 > start2 ? -1 : start1 < start2 ? 1 : 0;
      });
    });
  }

  private getPlayerName(playerId) {
    return playerId === this.playerId ?
      `<strong>${this._playerService.getPlayerName(playerId)}</strong>` : this._playerService.getPlayerName(playerId);
  }

  public teamName(team) {
    const players = [this.getPlayerName(team.defence.player)];
    if (team.defence.player !== team.offence.player) {
      players.push(this.getPlayerName(team.offence.player));
    }
    return `${players.join(' & ')}`;
  }

  public scoreSummary(game) {
    const teamRedScore =
      game.teams.red.defence.goals +
      game.teams.red.offence.goals +
      game.teams.blue.defence.ownGoals +
      game.teams.blue.offence.ownGoals;
    const teamBlueScore =
      game.teams.blue.defence.goals +
      game.teams.blue.offence.goals +
      game.teams.red.defence.ownGoals +
      game.teams.red.offence.ownGoals;

    return `${teamRedScore}:${teamBlueScore}`;
  }

  public getIcon(game) {
    if (!game.win) {
      return 'games';
    } else if ((game.win === 'blue' &&
      (game.teams.blue.defence.player === this.playerId || game.teams.blue.offence.player === this.playerId)) ||
      (game.win === 'red' && (game.teams.red.defence.player === this.playerId || game.teams.red.offence.player === this.playerId))
    ) {
      return 'thumb_up';
    }
    return 'thumb_down';
  }

  public getClass(game) {
    if (!game.win) {
      return 'in-progress';
    } else if ((game.win === 'blue' &&
      (game.teams.blue.defence.player === this.playerId || game.teams.blue.offence.player === this.playerId)) ||
      (game.win === 'red' && (game.teams.red.defence.player === this.playerId || game.teams.red.offence.player === this.playerId))
    ) {
      return 'win';
    }
    return 'lost';
  }

  public gameType(game) {
    let type = '-';

    switch (game.players.length) {
      case 2:
        type = '1 vs 1';
        break;
      case 3:
        type = 'Stress test';
        break;
      case 4:
        type = '2 vs 2';
        break;
    }

    return type;
  }
}
