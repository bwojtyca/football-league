import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { MarqueeDirective } from '../../shared/marquee.directive';

import { PlayerService } from '../../player/player.service';
import { FIGURES, Game, GoalDetail, Position, Rod, TeamColor, teamScore } from '../game';

/** A goal told on the table: whose rod it was and, told that precisely, the rod and figure. */
export interface TableGoal {
  color: TeamColor;
  position: Position;
  rod?: Rod;
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

/** Where each player's name sits on their rail's board: between their two rods. */
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
 * The table from above with its figures, where every goal is entered (canvas P42, P43, and
 * the owner's round H): a tap zone per rod (who scored, or which rod) or per figure. Figures are
 * numbered from the team's handles. Lengthwise, the rails are LED boards with each player's
 * name and goals by their rods; upright (a phone held portrait), the table stands with the red
 * goal on top and each team's board at its end. Text always reads upright.
 */
@Component({
  selector: 'fl-table',
  imports: [MarqueeDirective, NgTemplateOutlet, TranslocoPipe],
  template: `
    <div
      class="frame"
      [class.vertical]="vertical()"
      [class.from-red]="fromRed()"
      [class.own]="own()"
    >
      @if (vertical()) {
        <ng-container *ngTemplateOutlet="board; context: { $implicit: ends()[0] }" />
      }
      <div class="pitch">
        <div class="table">
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
              <pattern id="fl-dots" width="5" height="5" patternUnits="userSpaceOnUse">
                <rect width="5" height="5" fill="#0a0b0a" />
                <circle cx="2.5" cy="2.5" r="1.1" fill="#1c1e1c" />
              </pattern>
            </defs>
            <rect x="0" y="22" width="674" height="346" fill="#17191c" />
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
            <!-- The rails: straight LED boards, each edged in its team's colour. -->
            <rect x="0" y="22" width="674" height="30" fill="url(#fl-dots)" />
            <rect x="0" y="50" width="674" height="2" style="fill: var(--fl-red-board)" />
            <rect x="0" y="338" width="674" height="30" fill="url(#fl-dots)" />
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
                  [style.fill]="
                    rod.color === 'red' ? 'var(--fl-red-board)' : 'var(--fl-blue-board)'
                  "
                />
              </g>
            }
          </svg>

          @if (!vertical()) {
            @for (plate of plates(); track plate.key) {
              <span
                class="plate plate--{{ plate.color }}"
                [style.left]="plate.left"
                [style.top]="plate.top"
                aria-hidden="true"
              >
                {{ plate.name }}<b>{{ plate.goals }}</b>
              </span>
            }
          }

          @if (!vertical() && flash(); as goal) {
            <!-- A goal just scored, on the board of the team it counts for. -->
            <div
              class="rail-flash"
              [style.top]="percent(goal.color === 'red' ? 22 : 338, height)"
              [style.height]="percent(30, height)"
              role="status"
            >
              <span class="flash-text">
                <b class="word">{{ 'board.goal' | transloco }}</b>
                {{ goal.who }}
                <span class="score"
                  ><span class="r">{{ goal.red }}</span
                  >:<span class="b">{{ goal.blue }}</span></span
                >
              </span>
            </div>
          }

          @if (detail() === 'man') {
            @for (figure of figures; track figure.key) {
              @let name = nameOf(figure.color, figure.position);
              <button
                class="hit man"
                [attr.data-team]="figure.color"
                [attr.data-position]="figure.position"
                [class.last]="isLast(figure.color, figure.rod, figure.man)"
                [style.left]="percent(figure.x, width)"
                [style.top]="percent(figure.y, height)"
                [disabled]="disabled()"
                (click)="pick(figure, true, figure.man)"
                [attr.aria-label]="
                  ((own() ? 'game.ownGoalAria' : 'game.goalAria') | transloco: { name }) +
                  ' · ' +
                  ('rods.' + figure.rod | transloco) +
                  ' ' +
                  figure.man
                "
              ></button>
            }
          } @else {
            @for (rod of rods; track rod.x) {
              @let name = nameOf(rod.color, rod.position);
              <button
                class="hit rod rod--{{ rod.color }}"
                [attr.data-team]="rod.color"
                [attr.data-position]="rod.position"
                [class.last]="detail() === 'rod' && isLast(rod.color, rod.rod)"
                [style.left]="percent(rod.x - 40, width)"
                [style.top]="percent(felt.y, height)"
                [style.width]="percent(80, width)"
                [style.height]="percent(felt.height, height)"
                [disabled]="disabled()"
                (click)="pick(rod, detail() === 'rod')"
                [attr.aria-label]="
                  ((own() ? 'game.ownGoalAria' : 'game.goalAria') | transloco: { name }) +
                  (detail() === 'rod' ? ' · ' + ('rods.' + rod.rod | transloco) : '')
                "
              ></button>
            }
          }
        </div>
      </div>
      @if (vertical()) {
        <ng-container *ngTemplateOutlet="board; context: { $implicit: ends()[1] }" />
      }
    </div>

    <!-- A team's LED board at its end of the upright table; it flashes the goals it gets. -->
    <ng-template #board let-end>
      @let goal = flash();
      @if (goal && goal.color === end.color) {
        <div class="board board--{{ end.color }} flash" role="status">
          <div class="track" flMarquee>
            <b class="word">{{ 'board.goal' | transloco }}</b>
            <span class="who">{{ goal.who }}</span>
            <span class="score"
              ><span class="r">{{ goal.red }}</span
              >:<span class="b">{{ goal.blue }}</span></span
            >
          </div>
        </div>
      } @else {
        <!-- The team's score first, as the counter at a real table's end. -->
        <div class="board board--{{ end.color }}" aria-hidden="true">
          <b class="count">{{ end.score }}</b>
          <div class="names">
            <div class="track" flMarquee>
              <span class="team">{{ 'team.' + end.color | transloco }}</span>
              @for (player of end.players; track player.position) {
                <span class="who"
                  >{{ player.name }}<b>{{ player.goals }}</b></span
                >
              }
            </div>
          </div>
        </div>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      container-type: size;
    }
    .frame {
      display: grid;
      justify-items: center;
      gap: 8px;
    }
    /* Lengthwise: as wide as the space allows, keeping the table's proportions. */
    .pitch {
      position: relative;
      width: min(100cqw, calc(100cqh * 674 / 390));
      aspect-ratio: 674 / 390;
    }
    .table {
      position: absolute;
      inset: 0;
    }
    .from-red .pitch {
      transform: rotate(180deg);
    }
    /* Upright: the table stands, red goal on top, with a board at each end. */
    .vertical .pitch {
      width: min(100cqw, calc((100cqh - 96px) * 390 / 674));
      aspect-ratio: 390 / 674;
    }
    .vertical .table {
      inset: auto;
      top: 100%;
      left: 0;
      width: calc(100% * 674 / 390);
      height: calc(100% * 390 / 674);
      transform-origin: 0 0;
      transform: rotate(-90deg);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* A player's name and goals in LED letters on their rail's board. */
    .plate {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 6px;
      max-width: 22%;
      transform: translate(-50%, -50%);
      font: 800 clamp(0.6rem, 2.2cqw, 0.9rem) / 1 var(--fl-display);
      color: var(--fl-ink);
      white-space: nowrap;
      overflow: hidden;
      pointer-events: none;
    }
    .from-red .plate {
      transform: translate(-50%, -50%) rotate(180deg);
    }
    .plate b {
      font: 900 1.3em/1 var(--fl-led);
    }
    .plate--red b,
    .board--red b,
    .board--red .team {
      color: var(--fl-red-board);
    }
    .plate--blue b,
    .board--blue b,
    .board--blue .team {
      color: var(--fl-blue-board);
    }
    .board {
      display: flex;
      align-items: center;
      justify-content: safe center;
      gap: 14px;
      width: 100%;
      height: 40px;
      padding: 0 12px;
      overflow: hidden;
      border-radius: 6px;
      background: var(--fl-board-bg);
      font: 800 0.95rem/1 var(--fl-display);
      white-space: nowrap;
    }
    .board .team {
      font-size: 0.75rem;
    }
    .board:not(.flash) {
      gap: 10px;
      height: 48px;
      padding-left: 4px;
    }
    .board .count {
      flex: none;
      min-width: 2ch;
      padding: 0 6px;
      font: 900 2.3rem/1 var(--fl-led);
      text-align: center;
    }
    .names {
      flex: 1;
      min-width: 0;
      display: flex;
      justify-content: safe center;
      overflow: hidden;
    }
    /* Little height (a short phone): slimmer boards leave more of it to the table. */
    @container (max-height: 460px) {
      .frame {
        gap: 5px;
      }
      .board,
      .board:not(.flash) {
        height: 38px;
        font-size: 0.88rem;
      }
      .board .count {
        font-size: 1.8rem;
      }
    }
    .board .track {
      display: flex;
      align-items: center;
      gap: 14px;
      white-space: nowrap;
    }
    /* Too long for the board: slides to its end and back. */
    .track.marquee {
      animation: fl-marquee 7s ease-in-out infinite alternate;
    }
    @keyframes fl-marquee {
      0%,
      15% {
        transform: translateX(0);
      }
      85%,
      100% {
        transform: translateX(var(--shift));
      }
    }
    /* A goal just scored: the board lights up yellow for a few seconds. */
    .flash,
    .rail-flash {
      color: var(--fl-ball);
      animation: fl-flash 0.35s steps(1, end) 3;
    }
    .flash .track {
      gap: 10px;
    }
    .word {
      font: 900 1.35rem/1 var(--fl-led);
    }
    .flash .score,
    .rail-flash .score {
      font: 900 1.2rem/1 var(--fl-led);
    }
    .flash .r,
    .rail-flash .r {
      color: var(--fl-red-board);
    }
    .flash .b,
    .rail-flash .b {
      color: var(--fl-blue-board);
    }
    .rail-flash {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 4;
      display: grid;
      place-items: center;
      background: var(--fl-board-bg);
      font: 800 clamp(0.7rem, 2.4cqw, 1rem) / 1 var(--fl-display);
      pointer-events: none;
    }
    .rail-flash .flash-text {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .from-red .rail-flash .flash-text {
      transform: rotate(180deg);
    }
    @keyframes fl-flash {
      50% {
        opacity: 0.25;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .track.marquee,
      .flash,
      .rail-flash {
        animation: none;
      }
    }
    .board .who {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .board b {
      font: 900 1.3rem/1 var(--fl-led);
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
      background: rgb(255 255 255 / 0.16);
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
      background: rgb(255 198 41 / 0.12);
    }
    .hit.last {
      background: rgb(255 198 41 / 0.24);
    }
  `,
})
export class TableComponent {
  private readonly _players = inject(PlayerService);

  public readonly game = input.required<Game>();
  /** What a tap tells: who scored (a rod of theirs), the rod, or the figure. */
  public readonly detail = input.required<GoalDetail>();
  /** The table standing (a phone held portrait), red goal on top. */
  public readonly vertical = input(false);
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
        name: this._players.getPlayerName(slot.player),
        goals: slot.goals,
        left: percent(x, WIDTH),
        top: percent(color === 'red' ? 37 : 353, HEIGHT),
      };
    });
  });

  /** The boards at the ends of the upright table: the team whose goal is there, on top first. */
  protected readonly ends = computed(() => {
    const game = this.game();
    const end = (color: TeamColor) => {
      const team = game.teams[color];
      const positions: Position[] =
        team.defence.player === team.offence.player ? ['defence'] : ['defence', 'offence'];
      return {
        color,
        score: teamScore(game, color),
        players: positions.map((position) => ({
          position,
          name: this._players.getPlayerName(team[position].player),
          goals: team[position].goals,
        })),
      };
    };
    return this.fromRed() ? [end('blue'), end('red')] : [end('red'), end('blue')];
  });

  private readonly _transloco = inject(TranslocoService);

  /** A goal just scored, shown on the board of the team it counts for for a few seconds. */
  protected readonly flash = signal<{
    color: TeamColor;
    who: string;
    red: number;
    blue: number;
  } | null>(null);
  private _seen?: { id: string; count: number };
  private _flashTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const game = this.game();
      const count = game.events?.length ?? 0;
      const seen = this._seen;
      this._seen = { id: game.id, count };
      // Only a goal that comes in while the table is shown: not the log found on opening it,
      // not an undo, not another game.
      if (!seen || seen.id !== game.id || count <= seen.count) {
        if (seen && (seen.id !== game.id || count < seen.count)) {
          this.flash.set(null);
        }
        return;
      }
      const last = game.events!.at(-1)!;
      if (last.type === 'swap') {
        return;
      }
      const name = this._players.getPlayerName(last.player);
      const from = this._transloco.translate(
        last.position === 'defence' ? 'position.fromDefence' : 'position.fromOffence',
      );
      this.flash.set({
        color: last.type === 'own' ? (last.team === 'red' ? 'blue' : 'red') : last.team,
        who:
          last.type === 'own'
            ? this._transloco.translate('board.own', { name })
            : `${name} ${from}`,
        red: teamScore(game, 'red'),
        blue: teamScore(game, 'blue'),
      });
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => this.flash.set(null), 3500);
    });
  }

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

  /** A tap: the player, and the rod (and figure) when the goal is told that precisely. */
  protected pick(
    rod: { color: TeamColor; position: Position; rod: Rod },
    withRod: boolean,
    man?: number,
  ): void {
    this.score.emit({
      color: rod.color,
      position: rod.position,
      ...(withRod && { rod: rod.rod }),
      ...(man && { man }),
    });
  }
}
