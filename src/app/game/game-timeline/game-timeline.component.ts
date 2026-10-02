import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { PlayerService } from '../../player/player.service';
import { cssColor, withAlpha } from '../../shared/css-color';
import { formatDuration, Game, TEAM_COLORS } from '../game';
import { timelineOf } from '../timeline';

export function openGameTimeline(sheet: MatBottomSheet, game: Game) {
  return sheet.open(GameTimelineComponent, { data: game });
}

/** How a finished game went: the score over time, its runs and comebacks, every goal. */
@Component({
  selector: 'fl-game-timeline',
  imports: [BaseChartDirective, MatBottomSheetModule, TranslocoPipe],
  template: `
    <h2>{{ 'timeline.title' | transloco }}</h2>
    @if (timeline; as story) {
      <div class="canvas">
        <canvas
          baseChart
          type="line"
          [data]="chart()"
          [options]="chartOptions"
          [attr.aria-label]="'timeline.chart' | transloco"
        ></canvas>
      </div>
      <ul class="facts">
        @if (story.comeback; as comeback) {
          <li>
            {{
              'timeline.comeback'
                | transloco
                  : {
                      team: (teamNames[comeback.team] | transloco),
                      score: comeback.score.red + ':' + comeback.score.blue,
                    }
            }}
          </li>
        }
        @if (story.longestRun; as run) {
          <li>
            {{
              'timeline.run' | transloco: { team: (teamNames[run.team] | transloco), n: run.goals }
            }}
          </li>
        }
        @for (color of colors; track color) {
          @if (story.biggestLead[color]; as lead) {
            <li>
              {{
                'timeline.lead'
                  | transloco
                    : {
                        team: (teamNames[color] | transloco),
                        score: lead.score.red + ':' + lead.score.blue,
                      }
              }}
            </li>
          }
        }
      </ul>
      <ol class="goals">
        @for (goal of story.goals; track $index) {
          <li [class]="goal.team">
            <span class="time">{{ time(goal.at) }}</span>
            <span class="who">
              {{ name(goal.player) }}
              <small
                >{{ positionNames[goal.position] | transloco }}
                @if (goal.own) {
                  · {{ 'game.ownGoal' | transloco }}
                }
              </small>
            </span>
            <b class="score"
              ><span class="r">{{ goal.score.red }}</span
              >:<span class="b">{{ goal.score.blue }}</span></b
            >
          </li>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: 8px;
    }
    h2 {
      margin: 4px 0 8px;
      font: italic 800 1.35rem/1.2 var(--fl-display);
      text-transform: uppercase;
    }
    .canvas {
      position: relative;
      height: 150px;
    }
    .facts {
      margin: 12px 0;
      padding-left: 20px;
      display: grid;
      gap: 4px;
    }
    .goals {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .goals li {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding-left: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      border-left: 3px solid transparent;
    }
    .goals li.red {
      border-left-color: var(--fl-red);
    }
    .goals li.blue {
      border-left-color: var(--fl-blue);
    }
    .time {
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .who {
      display: grid;
    }
    .who small {
      color: var(--mat-sys-on-surface-variant);
    }
    .score {
      font: 700 1.05rem/1 var(--fl-display);
      font-variant-numeric: tabular-nums;
    }
    .r {
      color: var(--fl-red-text);
    }
    .b {
      color: var(--fl-blue-text);
    }
  `,
})
export class GameTimelineComponent {
  private readonly _game = inject<Game>(MAT_BOTTOM_SHEET_DATA);
  private readonly _playerService = inject(PlayerService);

  protected readonly colors = TEAM_COLORS;
  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
  protected readonly positionNames = {
    offence: 'position.offence',
    defence: 'position.defence',
  } as const;
  protected readonly timeline = timelineOf(this._game);

  /** Goals of each team over time, as steps. */
  protected readonly chart = computed<ChartConfiguration<'line'>['data']>(() => {
    const goals = this.timeline?.goals ?? [];
    const end = this._game.end
      ? (Date.parse(this._game.end) - Date.parse(this._game.start)) / 60_000
      : (goals.at(-1)?.at ?? 0) / 60_000;
    return {
      datasets: TEAM_COLORS.map((color) => {
        const line = cssColor(color === 'red' ? '--fl-red' : '--fl-blue');
        return {
          data: [
            { x: 0, y: 0 },
            ...goals.map((goal) => ({ x: goal.at / 60_000, y: goal.score[color] })),
            {
              x: Math.max(end, (goals.at(-1)?.at ?? 0) / 60_000),
              y: goals.at(-1)?.score[color] ?? 0,
            },
          ],
          borderColor: line,
          backgroundColor: withAlpha(line, 0.08),
          borderWidth: 2,
          pointRadius: 0,
          stepped: 'after' as const,
        };
      }),
    };
  });

  protected readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: {
        type: 'linear',
        ticks: { callback: (value) => `${value}′`, maxTicksLimit: 6 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, maxTicksLimit: 5 },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
      },
    },
  };

  protected name(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }

  protected time(at: number): string {
    return formatDuration(at / 1000);
  }
}
