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
          <small>{{ 'count.games' | transloco: { n: today.count } }}</small>
        </h2>
        <p class="run">
          <span class="side">{{ today.sides[0] }}</span>
          <b>{{ today.wins[0] }} : {{ today.wins[1] }}</b>
          <span class="side">{{ today.sides[1] }}</span>
        </p>
        <div class="actions">
          @if (today.running; as running) {
            <a matButton="filled" [routerLink]="['/game', running]">{{
              'today.playing' | transloco
            }}</a>
          } @else {
            <button matButton="filled" (click)="rematch()">{{ 'game.rematch' | transloco }}</button>
          }
        </div>
      </section>
    }
  `,
  styles: `
    .today {
      display: grid;
      gap: 6px;
      margin: 0 0 12px;
      padding: 12px 16px 14px;
      border-radius: 20px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    h2 {
      margin: 0;
      font: 700 1.05rem/1.2 var(--fl-display);
    }
    h2 small {
      margin-left: 6px;
      font: 400 0.85rem/1 inherit;
    }
    .run {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 600;
    }
    .run .side:first-child {
      text-align: right;
    }
    .run b {
      font: 700 1.6rem/1 var(--fl-display);
      font-variant-numeric: tabular-nums;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
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
