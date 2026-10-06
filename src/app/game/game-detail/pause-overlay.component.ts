import { Component, input, output } from '@angular/core';
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
    @if (score(); as score) {
      <span class="score" aria-hidden="true"
        ><span class="r">{{ score.red }}</span><span class="sep">:</span
        ><span class="b">{{ score.blue }}</span></span
      >
    }
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
  /** The score, since the table's boards are under the overlay. */
  public readonly score = input<{ red: number; blue: number }>();
  public readonly resume = output();
  public readonly leave = output();
  public readonly remove = output();
}
