import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {GameNewDialogComponent} from './game-new-dialog/game-new-dialog.component';

@Component({
  selector: 'fl-game-new',
  templateUrl: './game-new.component.html',
  styleUrls: ['./game-new.component.css']
})
export class GameNewComponent implements OnInit {
  public opened: boolean;

  constructor(private _dialog: MatDialog) {
  }

  ngOnInit() {
  }

  public openDialog() {
    this.opened = true;
    const dialogRef = this._dialog.open(GameNewDialogComponent, {
      // width: '250px',
      // data: { name: this.name, animal: this.animal }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.opened = false;
    });
  }

}
