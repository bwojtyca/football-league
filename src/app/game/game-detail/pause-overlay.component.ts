import { Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

/** Covers the teams of a paused game, with the way back to it. */
@Component({
  selector: 'fl-pause-overlay',
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <mat-icon aria-hidden="true">pause_circle</mat-icon>
    <b>{{ 'game.pausedTitle' | transloco }}</b>
    <small>{{ 'game.pausedHint' | transloco }}</small>
    <button matButton="filled" (click)="resume.emit()">
      <mat-icon>play_arrow</mat-icon>{{ 'game.resume' | transloco }}
    </button>
  `,
  styleUrl: './pause-overlay.component.scss',
})
export class PauseOverlayComponent {
  public readonly resume = output();
}
