import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { lineupOf, lineupPlayers, sideOf, Team, TEAM_COLORS } from '../game/game';
import { GameService } from '../game/game.service';
import { openNewGameDialog } from '../game/game-new/game-new-dialog/game-new-dialog.component';
import { PlayerService } from '../player/player.service';

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Today in a league: how many games, the current run between the same two teams, a rematch. */
@Component({
  selector: 'fl-today-card',
  imports: [MatButtonModule, RouterLink, TranslocoDatePipe, TranslocoPipe],
  template: `
    @if (today(); as today) {
      <section class="today">
        <h2>
          {{
            'today.title'
              | transloco
                : {
                    date: (now | translocoDate: { weekday: 'long', day: 'numeric', month: 'long' }),
                  }
          }}
          · {{ 'count.games' | transloco: { n: today.count } }}
        </h2>
        <p class="run">
          <span class="side red">{{ today.sides[0] }}</span>
          <b>{{ today.wins[0] }}<span class="sep">:</span>{{ today.wins[1] }}</b>
          <span class="side blue">{{ today.sides[1] }}</span>
        </p>
        <div class="actions">
          @if (today.running; as running) {
            <a matButton="filled" class="fl-cta" [routerLink]="['/game', running]">
              <span class="live" aria-hidden="true"></span>{{ 'today.playing' | transloco }}
            </a>
          } @else {
            <button matButton="filled" class="fl-cta" (click)="rematch()">
              {{ 'game.rematch' | transloco }}
            </button>
          }
        </div>
      </section>
    }
  `,
  styles: `
    /* The table's felt, with its centre line and circle. */
    .today {
      display: grid;
      gap: 10px;
      margin: 0 0 12px;
      padding: 12px 14px 14px;
      border-radius: 14px;
      background:
        radial-gradient(
          circle at 50% 54%,
          transparent 33px,
          rgb(255 255 255 / 0.14) 34px 35px,
          transparent 36px
        ),
        linear-gradient(
          90deg,
          transparent calc(50% - 1px),
          rgb(255 255 255 / 0.14) calc(50% - 1px) calc(50% + 1px),
          transparent calc(50% + 1px)
        ),
        var(--fl-felt);
      color: #fff;
    }
    h2 {
      margin: 0;
      font: 700 0.8rem/1.2 var(--fl-display);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgb(255 255 255 / 0.75);
    }
    .run {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-weight: 600;
      line-height: 1.2;
    }
    .side {
      padding-bottom: 2px;
      border-bottom: 3px solid;
    }
    .side.red {
      justify-self: end;
      text-align: right;
      border-color: var(--fl-red-board);
    }
    .side.blue {
      justify-self: start;
      border-color: var(--fl-blue-board);
    }
    .run b {
      font: 800 2.4rem/1 var(--fl-display);
      font-variant-numeric: tabular-nums;
    }
    .sep {
      margin: 0 4px;
      opacity: 0.6;
    }
    .actions {
      display: flex;
      justify-content: center;
    }
    .live {
      width: 8px;
      height: 8px;
      margin-right: 8px;
      border-radius: 50%;
      background: var(--fl-red);
      animation: blink 1.2s ease-in-out infinite;
    }
    @keyframes blink {
      50% {
        opacity: 0.25;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .live {
        animation: none;
      }
    }
  `,
})
export class TodayCardComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);

  public readonly leagueId = input.required<string>();

  protected readonly now = new Date();

  /** Today's games, newest first. */
  private readonly _games = computed(() =>
    (this._gameService.leagueGames(this.leagueId()) ?? []).filter((game) =>
      sameDay(new Date(game.start), this.now),
    ),
  );

  protected readonly today = computed(() => {
    const games = this._games();
    const last = games[0];
    if (!last) {
      return null;
    }
    // The run of games between the same two teams, back from the latest one.
    const sides = TEAM_COLORS.map((color) => sideOf(last.teams[color]));
    const wins = [0, 0];
    for (const game of games) {
      const gameSides = TEAM_COLORS.map((color) => sideOf(game.teams[color]));
      if (!sides.every((side) => gameSides.includes(side))) {
        break;
      }
      if (game.win) {
        wins[sides.indexOf(sideOf(game.teams[game.win]))]++;
      }
    }
    return {
      count: games.length,
      sides: TEAM_COLORS.map((color) => this._names(last.teams[color])),
      wins,
      running: last.end ? null : last.id,
    };
  });

  protected rematch(): void {
    const last = this._games().find((game) => game.end);
    if (last) {
      openNewGameDialog(this._dialog, { leagueId: this.leagueId(), previousGame: last });
    }
  }

  private _names(team: Team): string {
    return lineupPlayers(lineupOf(team))
      .map((player) => this._playerService.getPlayerName(player))
      .join(' & ');
  }
}
