import { Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

/** Covers the table of a paused game: resume, leave it for later or remove it. */
@Component({
  selector: 'fl-pause-overlay',
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <mat-icon class="big" aria-hidden="true">pause_circle</mat-icon>
    <b>{{ 'game.pausedTitle' | transloco }}</b>
    <small>{{ 'game.pausedHint' | transloco }}</small>
    <div class="actions">
      <button matButton="filled" class="fl-cta" (click)="resume.emit()">
        <mat-icon>play_arrow</mat-icon>{{ 'game.resume' | transloco }}
      </button>
      <button matButton="outlined" (click)="leave.emit()">
        {{ 'game.leaveLater' | transloco }}
      </button>
      <button matButton class="remove" (click)="remove.emit()">
        {{ 'game.remove' | transloco }}
      </button>
    </div>
  `,
  styleUrl: './pause-overlay.component.scss',
})
export class PauseOverlayComponent {
  public readonly resume = output();
  public readonly leave = output();
  public readonly remove = output();
}
