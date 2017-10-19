import {Component, Input, OnInit} from '@angular/core';
import {Game} from '../game';
import {PlayerService} from '../../player/player.service';
import {GameService} from '../game.service';

@Component({
  selector: 'fl-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.css']
})
export class GameListComponent implements OnInit {
  @Input() public playerId?: number;
  public games: Game[];

  constructor(private _playerService: PlayerService,
              private _gameService: GameService) {
  }

  public ngOnInit() {
    this._gameService.getGames(this.playerId).subscribe((games) => {
      this.games = games;
    });
  }

  public teamName(team) {
    const players = [this._playerService.getPlayerName(team.defence.player)];
    if (team.defence.player !== team.offence.player) {
      players.push(this._playerService.getPlayerName(team.offence.player));
    }
    return `${players.join(' $ ')}`;
  }

  public scoreSummary(game) {
    const teamRedScore =
      game.teams[0].defence.goals +
      game.teams[0].offence.goals +
      game.teams[1].defence.ownGoals +
      game.teams[1].offence.ownGoals;
    const teamBlueScore =
      game.teams[1].defence.goals +
      game.teams[1].offence.goals +
      game.teams[0].defence.ownGoals +
      game.teams[0].offence.ownGoals;

    return `${teamRedScore}:${teamBlueScore}`;
  }

  public gameType(game) {
    let type: string = '-';

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
