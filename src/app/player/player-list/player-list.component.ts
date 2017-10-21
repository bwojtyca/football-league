import {Component, OnInit} from '@angular/core';
import {Player} from '../player';
import {PlayerService} from '../player.service';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'fl-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.css']
})
export class PlayerListComponent implements OnInit {
  public players: Player[];
  public addNew: boolean;
  public newPlayerName: FormControl;
  public loading: boolean;

  constructor(private _playerService: PlayerService) {
    this.addNew = false;
    this.newPlayerName = new FormControl('', [Validators.required]);
  }

  public ngOnInit() {
    this.loading = true;
    this._playerService.getPlayers().subscribe((players) => {
      this.players = players;
      this._calculatePlayers();
      this._sortPlayers();
      this.loading = false;
    });
  }

  public addPlayer() {
    this._playerService.addPlayer(this.newPlayerName.value);
    this.newPlayerName.reset();
    this.addNew = false;
  }

  public getErrorMessage() {
    return this.newPlayerName.hasError('required') ? 'You must enter a value' : null;
  }

  private _calculatePlayers() {
    this.players.forEach((player) => {
      player.games = player.wins + player.loses;
      player.winRatio = player.games ? Math.round((player.wins / player.games) * 10000) / 100 : 0;
    });
  }

  private _sortPlayers() {
    this.players.sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }).sort((a, b) => {
      return a.winRatio > b.winRatio ? -1 : a.winRatio <  b.winRatio ? 1 : 0;
    });
  }
}
