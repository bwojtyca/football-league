import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { openNewGameDialog } from './game-new-dialog/game-new-dialog.component';

@Component({
  selector: 'fl-game-new',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './game-new.component.html',
  styleUrl: './game-new.component.css',
})
export class GameNewComponent {
  private readonly _dialog = inject(MatDialog);

  protected readonly opened = signal(false);

  protected openDialog(): void {
    this.opened.set(true);
    openNewGameDialog(this._dialog)
      .afterClosed()
      .subscribe(() => this.opened.set(false));
  }
}
