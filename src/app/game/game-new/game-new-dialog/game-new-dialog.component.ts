import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { GameService } from './../../game.service';
import { PlayerService } from '../../../player/player.service';
import { Player } from '../../../player/player';
import { FormControl, FormGroup } from '@angular/forms';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/startWith';
import { Router } from '@angular/router';
@Component({
  selector: 'fl-game-new-dialog',
  templateUrl: './game-new-dialog.component.html',
  styleUrls: ['./game-new-dialog.component.css']
})
export class GameNewDialogComponent implements OnInit {
  public players: Player[];
  public teamRed: FormGroup;
  public teamBlue: FormGroup;
  public filteredPlayers: any;
  public selected: {[playerId: string]: boolean};
  private _selectedValues: {[positionInTeam: string]: string};

  constructor(
    private _playerService: PlayerService,
    private _gameService: GameService,
    private _router: Router,
    private _dialogRef: MatDialogRef<GameNewDialogComponent>,
  ) {
    this.teamRed = new FormGroup({
      singlePlayer: new FormControl(false),
      defence: new FormControl(null, this._validatePlayer),
      offence: new FormControl(null, this._validatePlayer)
    });
    this.teamBlue = new FormGroup({
      singlePlayer: new FormControl(),
      defence: new FormControl(null, this._validatePlayer),
      offence: new FormControl(null, this._validatePlayer)
    });
  }

  public ngOnInit() {
    this._selectedValues = {};
    this.selected = {};

    this._playerService.getPlayers().delay(20).subscribe((players) => {
      this._handlePlayers(players);
    });
  }

  public close() {
    this._dialogRef.close();
  }

  private _handlePlayers(players) {
    this.players = players.sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    this.filteredPlayers = {
      red: {
        def: this.teamRed.controls.defence.valueChanges.startWith(null).map((player) => this._filterPlayers(player)),
        off: this.teamRed.controls.offence.valueChanges.startWith(null).map((player) => this._filterPlayers(player))
      },
      blue: {
        def: this.teamBlue.controls.defence.valueChanges.startWith(null).map((player) => this._filterPlayers(player)),
        off: this.teamBlue.controls.offence.valueChanges.startWith(null).map((player) => this._filterPlayers(player))
      }
    };
    this._prepareForm();
  }

  private _filterPlayers(player?: Player | any): Player[] {
    if (!this.players) {
      return null;
    }

    const name = player && player.name ? player.name : player;
    const filteredPlayers = name ? this.players.filter(
      (p) => p.name.toLowerCase().indexOf(name.toLowerCase()) === 0
    ) : this.players.slice();

    return filteredPlayers;
  }

  private _prepareForm() {
    this.teamRed.controls.singlePlayer.valueChanges.subscribe((singlePlayer) => {
      if (singlePlayer) {
        this.teamRed.controls.offence.disable();
        this.teamRed.controls.offence.setValue('');
      } else {
        this.teamRed.controls.offence.enable();
      }
    });
    this.teamRed.controls.defence.valueChanges.subscribe((player) => {
      this._updateSelected('teamRed', 'defence', player);
    });
    this.teamRed.controls.offence.valueChanges.subscribe((player) => {
      this._updateSelected('teamRed', 'offence', player);
    });

    this.teamBlue.controls.singlePlayer.valueChanges.subscribe((singlePlayer) => {
      if (singlePlayer) {
        this.teamBlue.controls.offence.disable();
        this.teamBlue.controls.offence.setValue('');
      } else {
        this.teamBlue.controls.offence.enable();
      }
    });
    this.teamBlue.controls.defence.valueChanges.subscribe((player) => {
      this._updateSelected('teamBlue', 'defence', player);
    });
    this.teamBlue.controls.offence.valueChanges.subscribe((player) => {
      this._updateSelected('teamBlue', 'offence', player);
    });
  }

  private _validatePlayer(c: FormControl) {
    return c.value && c.value.id ? null : {
      validatePlayer: {
        valid: false
      }
    };
  }

  private _updateSelected(team, position, player) {
    this._selectedValues[`${team}/${position}`] = player && player.id ? player.id : null;
    this.selected = Object.keys(this._selectedValues).reduce((total, key) => {
      if (this._selectedValues[key]) {
        total[this._selectedValues[key]] = true;
      }
      return total;
    }, {});
  }

  public autocompleteDisplay(player) {
    return player && player.name && player.name !== '' ? player.name : '';
  }

  public startGame() {
    if (this.teamRed.valid && this.teamBlue.valid) {
      const teamRed = {
        defence: this.teamRed.controls.defence.value,
        offence: this.teamRed.controls.singlePlayer.value ? this.teamRed.controls.defence.value : this.teamRed.controls.offence.value
      };
      const teamBlue = {
        defence: this.teamBlue.controls.defence.value,
        offence: this.teamBlue.controls.singlePlayer.value ? this.teamBlue.controls.defence.value : this.teamBlue.controls.offence.value
      };

      this._gameService.createGame(teamRed, teamBlue).subscribe((results) => {
        this._router.navigate(['/game', results.id]);
        this.close();
      });
    } else {
      this.teamRed.controls.defence.markAsTouched();
      this.teamRed.controls.offence.markAsTouched();
      this.teamBlue.controls.defence.markAsTouched();
      this.teamBlue.controls.offence.markAsTouched();
    }
  }
}

