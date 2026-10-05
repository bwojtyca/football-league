import { Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { FIGURES, Position, Rod, RODS, TeamColor } from '../game';

/** Flex directions clockwise: right, down, left, up. */
const DIRECTIONS = ['row', 'column', 'row-reverse', 'column-reverse'] as const;

/** A direction (index in `DIRECTIONS`) after the table is turned `rotation` quarter turns. */
function turned(direction: number, rotation: number): string {
  return DIRECTIONS[(direction + rotation) % 4];
}

/**
 * The tap zone of a player told down to the rod or the figure: the player's two rods side by
 * side as on the table (seen from the blue side the red goal is on the right, so red's
 * goalkeeper sits right and blue's left), each a button, or its figures, numbered from the
 * side of the team's handles. Everything turns with the table.
 */
@Component({
  selector: 'fl-goal-pad',
  imports: [TranslocoPipe],
  template: `
    <div class="rods" [style.flex-direction]="rodsDirection()" [class.armed]="armed()">
      @for (rod of rods(); track rod) {
        @if (detail() === 'rod') {
          <button
            class="hit rod"
            (click)="score.emit({ rod })"
            [attr.aria-label]="label() + ' · ' + ('rods.' + rod | transloco)"
          >
            <span class="name">{{ 'rods.' + rod | transloco }}</span>
            <b>{{ counts()[rod] ?? 0 }}</b>
          </button>
        } @else {
          <div class="rod">
            <span class="name">{{ 'rods.' + rod | transloco }}</span>
            <div class="men" [style.flex-direction]="menDirection()">
              @for (man of figures(rod); track man) {
                <button
                  class="hit man"
                  (click)="score.emit({ rod, man })"
                  [attr.aria-label]="label() + ' · ' + ('rods.' + rod | transloco) + ' ' + man"
                >
                  {{ man }}
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 0;
    }
    .rods {
      display: flex;
      gap: 6px;
      height: 100%;
    }
    .rod {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      min-height: 0;
    }
    .name {
      font: 600 0.75rem/1.1 var(--fl-display);
      text-align: center;
      color: rgb(255 255 255 / 0.78);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .men {
      flex: 1;
      display: flex;
      gap: 4px;
      min-height: 0;
    }
    .hit {
      flex: 1;
      min-width: 0;
      min-height: 0;
      border: 0;
      border-radius: 12px;
      background: rgb(0 0 0 / 0.3);
      box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
      color: #fff;
      cursor: pointer;
      touch-action: manipulation;
      transition: transform 80ms ease-out;
    }
    .hit:active {
      transform: scale(0.96);
      background: rgb(0 0 0 / 0.42);
    }
    button.rod {
      display: grid;
      align-content: center;
      gap: 4px;
      padding: 4px;
    }
    button.rod b {
      font: 900 clamp(1.9rem, 6vh, 3.4rem)/1 var(--fl-led);
      font-variant-numeric: tabular-nums;
    }
    /* A figure: a round button on its rod. */
    .man {
      border-radius: 999px;
      font: 900 1.2rem/1 var(--fl-led);
    }
    /* Choosing who scored the own goal. */
    .armed .hit {
      box-shadow: inset 0 0 0 2px var(--fl-ball);
    }
  `,
})
export class GoalPadComponent {
  public readonly detail = input.required<'rod' | 'man'>();
  public readonly color = input.required<TeamColor>();
  public readonly position = input.required<Position>();
  /** Quarter turns of the table, as on the game screen. */
  public readonly rotation = input(0);
  /** Goals of each rod in this game, shown when told by rod. */
  public readonly counts = input<Partial<Record<Rod, number>>>({});
  /** The next tap is an own goal. */
  public readonly armed = input(false);
  /** Accessible start of each button's name, e.g. "Goal: Ala". */
  public readonly label = input('');
  public readonly score = output<{ rod: Rod; man?: number }>();

  protected readonly rods = computed(() => RODS[this.position()]);

  /** Red's rods run right to left from its goal, blue's left to right (before turning). */
  protected readonly rodsDirection = computed(() =>
    turned(this.color() === 'red' ? 2 : 0, this.rotation()),
  );

  /** Figure 1 sits at the team's own side: red's at the top, blue's at the bottom. */
  protected readonly menDirection = computed(() =>
    turned(this.color() === 'red' ? 1 : 3, this.rotation()),
  );

  protected figures(rod: Rod): number[] {
    return Array.from({ length: FIGURES[rod] }, (_, i) => i + 1);
  }
}
