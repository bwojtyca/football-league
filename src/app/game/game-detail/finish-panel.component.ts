import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { TeamColor } from '../game';

/**
 * The end of a game: who won, the score, undo of the last goal and "Next", which fills up
 * over the seconds the game screen waits before moving on by itself.
 */
@Component({
  selector: 'fl-finish-panel',
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  host: { role: 'status' },
  template: `
    <mat-icon class="trophy" aria-hidden="true">emoji_events</mat-icon>
    <h2>{{ 'game.wins' | transloco: { team: (teamNames[winner()] | transloco) } }}</h2>
    <p class="final">
      <span class="r">{{ score().red }}</span
      >:<span class="b">{{ score().blue }}</span>
    </p>
    <p class="names">{{ names() }}</p>
    <div class="finish-actions">
      @if (canUndo()) {
        <button matButton="outlined" (click)="undo.emit()">
          <mat-icon>undo</mat-icon>{{ 'game.undoLast' | transloco }}
        </button>
      }
      <button matButton="filled" class="fl-cta" (click)="next.emit()">
        <mat-icon class="countdown" aria-hidden="true">
          <svg viewBox="0 0 20 20">
            <circle class="track" cx="10" cy="10" r="8" />
            <circle class="fill" cx="10" cy="10" r="8" />
          </svg>
        </mat-icon>
        {{ 'game.next' | transloco }}
      </button>
    </div>
  `,
  styleUrl: './finish-panel.component.scss',
})
export class FinishPanelComponent {
  public readonly winner = input.required<TeamColor>();
  public readonly score = input.required<Record<TeamColor, number>>();
  public readonly names = input('');
  public readonly canUndo = input(false);
  public readonly undo = output();
  public readonly next = output();

  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
}
