import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { AvatarComponent } from '../../player/avatar/avatar.component';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { TeamColor } from '../game';

/** A player of the decided game and the Elo change the result will bring. */
export interface FinishPlayer {
  id: string;
  name: string;
  change: number;
}

/**
 * The end of a game, over the table: who won, the score blinking on the LED panel, what the
 * result does to everyone's Elo, how the game went, "Next" counting down the seconds the game
 * screen waits before moving on by itself, and the undo of the last goal.
 */
@Component({
  selector: 'fl-finish-panel',
  imports: [AvatarComponent, MatButtonModule, MatIconModule, RatingChangeComponent, TranslocoPipe],
  host: { role: 'status' },
  template: `
    <section class="card">
      <div class="head">
        <h2>{{ 'game.wins' | transloco: { team: (teamNames[winner()] | transloco) } }}</h2>
        <p class="final">
          <span class="r">{{ score().red }}</span
          ><span class="sep">:</span><span class="b">{{ score().blue }}</span>
        </p>
        @if (note()) {
          <p class="note">{{ note() }}</p>
        }
        <button class="how" (click)="timeline.emit()">{{ 'timeline.title' | transloco }}</button>
      </div>
      @if (players().length) {
        <dl class="changes">
          @for (player of players(); track player.id) {
            <div>
              <fl-avatar [playerId]="player.id" [name]="player.name" [size]="32" />
              <dt>{{ player.name }}</dt>
              <dd><fl-change [value]="player.change" /></dd>
            </div>
          }
        </dl>
      }
      <div class="actions">
        <button matButton="filled" class="fl-cta next" (click)="next.emit()">
          {{ 'game.next' | transloco }}
          <span class="countdown" aria-hidden="true"
            ><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span
            ><span>2</span><span>1</span><span>0</span></span
          >
        </button>
        @if (canUndo()) {
          <button matButton="outlined" class="undo" (click)="undo.emit()">
            <mat-icon>undo</mat-icon>{{ 'game.undoLast' | transloco }}
          </button>
        }
        @if (last()) {
          <p class="last">{{ 'game.lastGoal' | transloco: { event: last() } }}</p>
        }
      </div>
    </section>
  `,
  styleUrl: './finish-panel.component.scss',
})
export class FinishPanelComponent {
  public readonly winner = input.required<TeamColor>();
  public readonly score = input.required<Record<TeamColor, number>>();
  /** Winners first, each with the Elo change the result brings. */
  public readonly players = input<FinishPlayer[]>([]);
  /** Where a series stands after this game. */
  public readonly note = input('');
  /** The last event, as told in the log. */
  public readonly last = input('');
  public readonly canUndo = input(false);
  public readonly undo = output();
  public readonly next = output();
  public readonly timeline = output();

  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
}
