import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { FIGURES, Game, Position, Rod, TeamColor } from '../game';

/** A goal told on the table: whose rod it was and, by figure, which figure on it. */
export interface TableGoal {
  color: TeamColor;
  position: Position;
  rod: Rod;
  man?: number;
}

/** The drawing's size: the table with its rails, and the handles above and below it. */
const WIDTH = 674;
const HEIGHT = 390;
/** The playing field inside the rails. */
const FELT = { x: 16, y: 52, width: 642, height: 286 };

/**
 * The eight rods from the blue goal (left) to the red goal (right), seen from the blue side:
 * red's handles are across the table (top), blue's near (bottom).
 */
const TABLE_RODS: readonly { color: TeamColor; position: Position; rod: Rod; x: number }[] = [
  { color: 'blue', position: 'defence', rod: 'goalie', x: 56.5 },
  { color: 'blue', position: 'defence', rod: 'defence', x: 136.5 },
  { color: 'red', position: 'offence', rod: 'attack', x: 217.5 },
  { color: 'blue', position: 'offence', rod: 'midfield', x: 297.5 },
  { color: 'red', position: 'offence', rod: 'midfield', x: 377.5 },
  { color: 'blue', position: 'offence', rod: 'attack', x: 457.5 },
  { color: 'red', position: 'defence', rod: 'defence', x: 538.5 },
  { color: 'red', position: 'defence', rod: 'goalie', x: 618.5 },
];

/** Where each player's name plate sits on their rail: between their two rods. */
const PLATES: readonly { color: TeamColor; position: Position; x: number }[] = [
  { color: 'red', position: 'offence', x: 297 },
  { color: 'red', position: 'defence', x: 578 },
  { color: 'blue', position: 'defence', x: 96 },
  { color: 'blue', position: 'offence', x: 377 },
];

const TEAM_LOOK = {
  red: { body: '#ff4a3d', foot: '#a8231c', edge: '#ffe9e6', footX: 0 },
  blue: { body: '#4a7bff', foot: '#2c4fb8', edge: '#e8eeff', footX: 17 },
} as const;

const percent = (value: number, of: number) => `${(value / of) * 100}%`;

/**
 * The whole table from above, lengthwise, for goals told by rod or by figure (P42, P43): the
 * rods in table order with their figures and handles, each player's name plate on their rail,
 * and a tap zone per rod or per figure. Figures are numbered from the team's handles. Seen from
 * the red side, everything turns half way, so the near team's plates read upright.
 */
@Component({
  selector: 'fl-table',
  imports: [AvatarComponent, TranslocoPipe],
  template: `
    <div class="table" [class.from-red]="fromRed()" [class.own]="own()">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" aria-hidden="true">
        <defs>
          <radialGradient id="fl-felt" cx="50%" cy="50%" r="70%">
            <stop offset="0" stop-color="#157a42" />
            <stop offset="0.6" stop-color="#0d5a31" />
            <stop offset="1" stop-color="#083d21" />
          </radialGradient>
          <linearGradient id="fl-steel" x1="0" x2="1">
            <stop offset="0" stop-color="#5e666c" />
            <stop offset="0.45" stop-color="#e9edf0" />
            <stop offset="1" stop-color="#7c858c" />
          </linearGradient>
        </defs>
        <rect x="0" y="22" width="674" height="346" rx="10" fill="#17191c" />
        <rect x="16" y="52" width="642" height="286" fill="url(#fl-felt)" />
        <g fill="none" stroke="rgb(225 255 235 / 0.5)" stroke-width="2">
          <rect x="23" y="59" width="628" height="272" />
          <line x1="337" y1="59" x2="337" y2="331" />
          <circle cx="337" cy="195" r="43" />
          <path d="M22 115h60v160h-60M652 115h-60v160h60" />
        </g>
        <rect x="0" y="150" width="16" height="90" fill="#000" />
        <rect x="658" y="150" width="16" height="90" fill="#000" />
        @for (rod of rods; track rod.x) {
          <rect
            [attr.x]="rod.x - 3.5"
            [attr.y]="rod.color === 'red' ? 0 : 34"
            width="7"
            height="356"
            fill="url(#fl-steel)"
          />
        }
        @for (figure of figures; track figure.key) {
          @let look = looks[figure.color];
          <g [attr.transform]="'translate(' + (figure.x - 15) + ' ' + (figure.y - 15) + ')'">
            <rect
              [attr.x]="look.footX"
              y="12"
              width="13"
              height="6"
              rx="3"
              [attr.fill]="look.foot"
            />
            <rect
              x="9"
              y="1"
              width="12"
              height="28"
              rx="6"
              [attr.fill]="look.body"
              [attr.stroke]="look.edge"
              stroke-width="1.2"
            />
            <circle cx="15" cy="15" r="5.5" fill="#1b1410" />
          </g>
        }
        <rect x="0" y="22" width="674" height="30" rx="10" fill="#17191c" />
        <rect x="0" y="50" width="674" height="2" style="fill: var(--fl-red-board)" />
        <rect x="0" y="338" width="674" height="30" rx="10" fill="#17191c" />
        <rect x="0" y="338" width="674" height="2" style="fill: var(--fl-blue-board)" />
        @for (rod of rods; track rod.x) {
          <g
            [attr.transform]="
              'translate(' + (rod.x - 10.5) + ' ' + (rod.color === 'red' ? 0 : 368) + ')'
            "
          >
            <rect width="21" height="22" rx="4" fill="#232323" />
            <rect
              [attr.y]="rod.color === 'red' ? 0 : 18"
              width="21"
              height="4"
              [style.fill]="rod.color === 'red' ? 'var(--fl-red-board)' : 'var(--fl-blue-board)'"
            />
          </g>
        }
      </svg>

      @for (plate of plates(); track plate.key) {
        <span
          class="plate plate--{{ plate.color }}"
          [style.left]="plate.left"
          [style.top]="plate.top"
          aria-hidden="true"
        >
          <fl-avatar [playerId]="plate.player" [name]="plate.name" [size]="18" />
          {{ plate.name }}<b>{{ plate.goals }}</b>
        </span>
      }

      @if (detail() === 'rod') {
        @for (rod of rods; track rod.x) {
          @let name = nameOf(rod.color, rod.position);
          <button
            class="hit rod"
            [class.last]="isLast(rod.color, rod.rod)"
            [style.left]="percent(rod.x - 40, width)"
            [style.top]="percent(felt.y, height)"
            [style.width]="percent(80, width)"
            [style.height]="percent(felt.height, height)"
            [disabled]="disabled()"
            (click)="pick(rod)"
            [attr.aria-label]="
              ((own() ? 'game.ownGoalAria' : 'game.goalAria') | transloco: { name }) +
              ' · ' +
              ('rods.' + rod.rod | transloco)
            "
          ></button>
        }
      } @else {
        @for (figure of figures; track figure.key) {
          @let name = nameOf(figure.color, figure.position);
          <button
            class="hit man"
            [class.last]="isLast(figure.color, figure.rod, figure.man)"
            [style.left]="percent(figure.x, width)"
            [style.top]="percent(figure.y, height)"
            [disabled]="disabled()"
            (click)="pick(figure, figure.man)"
            [attr.aria-label]="
              ((own() ? 'game.ownGoalAria' : 'game.goalAria') | transloco: { name }) +
              ' · ' +
              ('rods.' + figure.rod | transloco) +
              ' ' +
              figure.man
            "
          ></button>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      container-type: size;
    }
    .table {
      position: relative;
      width: min(100cqw, calc(100cqh * 674 / 390));
      aspect-ratio: 674 / 390;
    }
    .table.from-red {
      transform: rotate(180deg);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* A player's name and goals on their rail; the far team's face them. */
    .plate {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 5px;
      max-width: 22%;
      height: 6.2%;
      padding: 0 4px 0 3px;
      border-radius: 999px;
      background: #000;
      box-shadow: inset 0 0 0 1px #3a3d41;
      font: 700 clamp(0.6rem, 2.2cqw, 0.85rem) / 1 var(--fl-display);
      white-space: nowrap;
      overflow: hidden;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .plate--red {
      transform: translate(-50%, -50%) rotate(180deg);
    }
    .plate b {
      padding: 0 4px;
      font: 900 1.3em/1 var(--fl-led);
    }
    .plate--red b {
      color: var(--fl-red-board);
    }
    .plate--blue b {
      color: var(--fl-blue-board);
    }
    .hit {
      position: absolute;
      z-index: 3;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      touch-action: manipulation;
    }
    .hit:active {
      background: rgb(255 255 255 / 0.14);
    }
    .hit:disabled {
      cursor: default;
    }
    .hit:focus-visible {
      outline: 3px solid var(--fl-ball);
      outline-offset: -3px;
    }
    .rod {
      border-radius: 6px;
    }
    /* A figure's tap zone, centred on it. */
    .man {
      width: 8.3%;
      height: 12.8%;
      border-radius: 14px;
      transform: translate(-50%, -50%);
    }
    /* The next tap is an own goal; the last goal's rod or figure stays marked. */
    .own .hit {
      box-shadow: inset 0 0 0 2px rgb(255 198 41 / 0.55);
    }
    .hit.last {
      box-shadow: inset 0 0 0 2.5px var(--fl-ball);
    }
  `,
})
export class TableComponent {
  private readonly _players = inject(PlayerService);

  public readonly game = input.required<Game>();
  public readonly detail = input.required<'rod' | 'man'>();
  /** Seen from the red side: the table turned half way. */
  public readonly fromRed = input(false);
  /** The next tap is an own goal of the player whose rod or figure it is. */
  public readonly own = input(false);
  public readonly disabled = input(false);
  public readonly score = output<TableGoal>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly felt = FELT;
  protected readonly rods = TABLE_RODS;
  protected readonly looks = TEAM_LOOK;
  protected readonly percent = percent;

  /** Every figure on its rod, numbered from its team's handles (red's top, blue's bottom). */
  protected readonly figures = TABLE_RODS.flatMap((rod) => {
    const count = FIGURES[rod.rod];
    return Array.from({ length: count }, (_, k) => ({
      ...rod,
      key: `${rod.x}-${k}`,
      y: FELT.y + ((k + 0.5) * FELT.height) / count,
      man: rod.color === 'red' ? k + 1 : count - k,
    }));
  });

  protected readonly plates = computed(() => {
    const game = this.game();
    return PLATES.map(({ color, position, x }) => {
      const slot = game.teams[color][position];
      return {
        key: `${color}-${position}`,
        color,
        player: slot.player,
        name: this._players.getPlayerName(slot.player),
        goals: slot.goals,
        left: percent(x, WIDTH),
        top: percent(color === 'red' ? 37 : 353, HEIGHT),
      };
    });
  });

  /** The rod (and figure) of the last goal, when it was told that precisely. */
  private readonly _last = computed(() => {
    const last = this.game().events?.at(-1);
    return last && last.type !== 'swap' && last.rod ? last : undefined;
  });

  protected nameOf(color: TeamColor, position: Position): string {
    return this._players.getPlayerName(this.game().teams[color][position].player);
  }

  protected isLast(color: TeamColor, rod: Rod, man?: number): boolean {
    const last = this._last();
    return (
      !!last && last.team === color && last.rod === rod && (man === undefined || last.man === man)
    );
  }

  protected pick(rod: { color: TeamColor; position: Position; rod: Rod }, man?: number): void {
    this.score.emit({ color: rod.color, position: rod.position, rod: rod.rod, man });
  }
}
