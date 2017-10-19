import { Component, OnInit } from '@angular/core';
import {PlayerService} from '../../../player/player.service';
import {Player} from '../../../player/player';

@Component({
  selector: 'fl-game-new-dialog',
  templateUrl: './game-new-dialog.component.html',
  styleUrls: ['./game-new-dialog.component.css']
})
export class GameNewDialogComponent implements OnInit {
  public players: Player[];

  constructor(private _playerService: PlayerService) { }

  ngOnInit() {
    this._playerService.getPlayers().subscribe((players) => {
      this.players = players.sort((a, b) => {
        return a.name < b.name ? -1 : 1;
      });
    });
  }

}
