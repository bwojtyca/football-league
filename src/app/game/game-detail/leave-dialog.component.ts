import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoPipe } from '@jsverse/transloco';

export type LeaveChoice = 'pause' | 'leave' | 'stay';

export function openLeaveDialog(dialog: MatDialog) {
  return dialog.open<LeaveDialogComponent, void, LeaveChoice>(LeaveDialogComponent, {
    maxWidth: '95vw',
    width: '400px',
  });
}

/** Leaving a running game: pause its clock first, leave it running, or stay. */
@Component({
  selector: 'fl-leave-dialog',
  imports: [MatButtonModule, MatDialogModule, TranslocoPipe],
  template: `
    <h2 mat-dialog-title>{{ 'game.leaveTitle' | transloco }}</h2>
    <mat-dialog-content>{{ 'game.leaveText' | transloco }}</mat-dialog-content>
    <mat-dialog-actions class="actions">
      <button matButton="filled" class="fl-cta" [mat-dialog-close]="'pause'">
        {{ 'game.leavePause' | transloco }}
      </button>
      <button matButton="outlined" [mat-dialog-close]="'leave'">
        {{ 'game.leaveRunning' | transloco }}
      </button>
      <button matButton [mat-dialog-close]="'stay'">{{ 'game.leaveStay' | transloco }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .actions {
      display: grid;
      gap: 8px;
    }
    .actions button {
      margin: 0;
    }
  `,
})
export class LeaveDialogComponent {}
