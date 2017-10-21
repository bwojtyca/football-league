import { PlayerService } from './../../player/player.service';
import { GameService } from './../game.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '../game';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { Player } from '../../player/player';

@Component({
  selector: 'fl-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.css']
})
export class GameDetailComponent implements OnInit {
  public game: Game;
  public scoreSummary: any;
  public gameTime: string;
  public players: {[playerId: string]: Player};
  private _targetScore = 8;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _gameService: GameService,
    private _playerService: PlayerService,
    private _router: Router
  ) { }

  public ngOnInit() {
    this._clearGame();
    this._activatedRoute.params.subscribe((params) => {
      this._clearGame();
      this._gameService.getGame(params.gameId).subscribe((game) => {
        this.game = game;
        this._calculateScore();
        this._calculateTime();

        if (!this.game.end) {
          Observable.interval(1000).subscribe((time) => {
            this._calculateTime();
          });
        }
        this.game.players.forEach((playerId) => {
          this._playerService.getPlayer(playerId).subscribe((player) => {
            this.players[playerId] = player;
          });
        });
      });
    });
  }

  public goal(team: Game['teams'][0], position: string): void {
    if (!this.game || this.game.end) {
      return;
    }
    ++team[position].goals;
    this._gameService.updateGame(this.game);
    this._calculateScore(true);
  }

  public owngoal(team: Game['teams'][0], position: string): void {
    if (!this.game || this.game.end) {
      return;
    }
    ++team[position].ownGoals;
    this._gameService.updateGame(this.game);
    this._calculateScore(true);
  }

  private _clearGame() {
    this.players = {};
    this.game = null;
    this.scoreSummary = {
      red: 0,
      blue: 0
    };
    this.gameTime = '';

    this._calculateScore();
    this._calculateTime();
  }

  private _calculateScore(checkResults?: boolean) {
    if (!this.game) {
      return;
    }
    const redScore = this.game.teams[0].defence.goals +
      this.game.teams[0].offence.goals +
      this.game.teams[1].defence.ownGoals +
      this.game.teams[1].offence.ownGoals;

    const blueScore = this.game.teams[1].defence.goals +
      this.game.teams[1].offence.goals +
      this.game.teams[0].defence.ownGoals +
      this.game.teams[0].offence.ownGoals;

    this.scoreSummary = {
      red: redScore,
      blue: blueScore
    };

    if (checkResults && !this.game.end) {
      if (redScore >= this._targetScore) {
        this._handleWin(0);
      }
      if (blueScore >= this._targetScore) {
        this._handleWin(1);
      }
    }
  }

  private _handleWin(winIndex) {
    const lostIndex = winIndex === 0 ? 1 : 0;
    this.game.end = new Date().toISOString();
    this.game.win = this.game.teams[winIndex].color;
    this._gameService.updateGame(this.game);

    this.players[this.game.teams[winIndex].defence.player].wins++;
    this._playerService.updatePlayer(this.players[this.game.teams[winIndex].defence.player]);

    if (this.game.teams[winIndex].defence.player !== this.game.teams[winIndex].offence.player) {
      this.players[this.game.teams[winIndex].offence.player].wins++;
      this._playerService.updatePlayer(this.players[this.game.teams[winIndex].offence.player]);
    }

    this.players[this.game.teams[lostIndex].defence.player].loses++;
    this._playerService.updatePlayer(this.players[this.game.teams[lostIndex].defence.player]);

    if (this.game.teams[lostIndex].defence.player !== this.game.teams[lostIndex].offence.player) {
      this.players[this.game.teams[lostIndex].offence.player].loses++;
      this._playerService.updatePlayer(this.players[this.game.teams[lostIndex].offence.player]);
    }

    alert(`team ${this.game.win} wins!`);
    this._router.navigate(['/']);
  }

  private _calculateTime() {
    if (!this.game) {
      return;
    }
    const now = (this.game.end ? new Date(this.game.end) : new Date()).getTime();

    const time = Math.floor((now - new Date(this.game.start).getTime()) / 1000);
    const seconds = time % 60;
    const minutes = (time - seconds) / 60;
    this.gameTime = `${minutes === 0 ? '00' : minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
}
