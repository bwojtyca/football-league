import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { interval, map } from 'rxjs';

import {
  formatDuration,
  Game,
  isDefaultMode,
  modeOf,
  playTime,
  teamPlayers,
  teamScore,
  TeamColor,
} from '../game/game';
import { GameService } from '../game/game.service';
import { openNewGameDialog } from '../game/game-new/game-new-dialog/game-new-dialog.component';
import { ModeLabelComponent } from '../game/mode/mode-label.component';
import { potatoState } from '../player/potato';
import { PlayerService } from '../player/player.service';
import { TournamentService } from '../tournament/tournament.service';

/**
 * The top of a league's page (canvas round 4): what is going on now, one tap away (games being
 * played, paused ones to finish, running tournaments); when nothing is, the last game, clearly
 * named as such, with a rematch, and a few facts of the league.
 */
@Component({
  selector: 'fl-now-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ModeLabelComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  template: `
    @let s = state();
    @if (s.live.length || s.paused.length || s.tournaments.length) {
      <h2 class="fl-kicker">{{ 'now.title' | transloco }}</h2>
      @for (game of s.live; track game.id) {
        <a class="live" [routerLink]="['/game', game.id]">
          <span class="line">
            <span class="badge">{{ 'now.live' | transloco }}</span>
            <span class="clock">{{ clock(game.game) }}</span>
            @if (game.mode; as mode) {
              <span class="rules">· <fl-mode-label [mode]="mode" /></span>
            }
          </span>
          <span class="side side--red">{{ game.red }}</span>
          <span class="score"
            ><span class="r">{{ game.score.red }}</span
            ><span class="sep">:</span><span class="b">{{ game.score.blue }}</span></span
          >
          <span class="side side--blue">{{ game.blue }}</span>
          <span class="go">{{ 'now.back' | transloco }}</span>
        </a>
      }
      @for (game of s.paused; track game.id) {
        <a class="row" [routerLink]="['/game', game.id]">
          <mat-icon class="tile" aria-hidden="true">pause</mat-icon>
          <span class="text">
            <b
              >{{ game.red }}
              <span class="mini"
                ><span class="r">{{ game.score.red }}</span
                >:<span class="b">{{ game.score.blue }}</span></span
              >
              {{ game.blue }}</b
            >
            <small>{{
              'now.paused'
                | transloco
                  : {
                      date:
                        (game.game.paused ?? game.game.start
                        | translocoDate: { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
                    }
            }}</small>
          </span>
          <span class="action">{{ 'now.finish' | transloco }}</span>
        </a>
      }
      @for (tournament of s.tournaments; track tournament.id) {
        <a class="row" [routerLink]="['/l', leagueId(), 't', tournament.id]">
          <mat-icon class="tile ball" aria-hidden="true">emoji_events</mat-icon>
          <span class="text">
            <b>{{ tournament.name }}</b>
            <small
              >{{ 'tournament.format.' + tournament.format | transloco }} ·
              {{ 'count.games' | transloco: { n: tournament.games } }}</small
            >
          </span>
          <span class="action">{{ 'now.open' | transloco }}</span>
        </a>
      }
    } @else if (s.last; as last) {
      <h2 class="fl-kicker">{{ 'now.quiet' | transloco }}</h2>
      <section class="last">
        <span class="line"
          >{{
            last.game.start | translocoDate: { weekday: 'long', hour: '2-digit', minute: '2-digit' }
          }}
          @if (last.mode; as mode) {
            · <fl-mode-label [mode]="mode" />
          }
        </span>
        <span class="side side--red">{{ last.red }}</span>
        <span class="score"
          ><span class="r">{{ last.score.red }}</span
          ><span class="sep">:</span><span class="b">{{ last.score.blue }}</span></span
        >
        <span class="side side--blue">{{ last.blue }}</span>
        <span class="buttons">
          <button matButton="filled" class="fl-cta" (click)="rematch(last.game)">
            {{ 'game.rematch' | transloco }}
          </button>
          <a matButton class="how" [routerLink]="['/game', last.game.id]">{{
            'now.howItWent' | transloco
          }}</a>
        </span>
      </section>
      <div class="facts">
        @if (s.leader; as leader) {
          <a [routerLink]="['/l', leagueId(), 'player', leader.id]">
            <small>{{ 'now.leader' | transloco }}</small>
            <b>{{ leader.name }}</b>
            <span class="num ball">{{ leader.rating }}</span>
          </a>
        }
        @if (s.potato; as potato) {
          <a [routerLink]="['/l', leagueId(), 'player', potato.id]">
            <small>{{ 'now.potato' | transloco }}</small>
            <b>{{ potato.name }}</b>
            <span class="note">🥔</span>
          </a>
        }
        <a [routerLink]="['/l', leagueId(), 'stats']">
          <small>{{ 'now.week' | transloco }}</small>
          <span class="num">{{ s.week }}</span>
          <span class="note">{{ 'now.games' | transloco: { n: s.week } }}</span>
        </a>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
    }
    :host:empty {
      display: none;
    }
    h2 {
      margin: 2px 0 0;
    }
    .live,
    .last {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 6px 10px;
      padding: 12px 14px;
      border-radius: 16px;
      color: var(--fl-ink);
      text-decoration: none;
    }
    .live {
      background: var(--fl-board-bg);
    }
    .last {
      background: var(--fl-felt-bg);
    }
    .line {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--fl-ink-2);
    }
    .last .line {
      color: #cfe6d8;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
    }
    .clock {
      font: 900 0.95rem/1 var(--fl-led);
      color: var(--fl-ball);
    }
    .side {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 700;
      line-height: 1.25;
    }
    .side--red {
      text-align: right;
      color: #ff9a92;
    }
    .side--blue {
      color: #9db8ff;
    }
    .last .side--red,
    .last .side--blue {
      color: #fff;
    }
    .score {
      padding: 4px 8px 2px;
      border-radius: 10px;
      background: var(--fl-board);
      font: 900 2rem/1 var(--fl-led);
      font-variant-numeric: tabular-nums;
    }
    .score .r,
    .mini .r {
      color: var(--fl-red-board);
    }
    .score .b,
    .mini .b {
      color: var(--fl-blue-board);
    }
    .score .sep {
      margin: 0 3px;
      font: 800 1.2rem/1 var(--fl-display);
      color: var(--fl-line-2);
    }
    .go {
      grid-column: 1 / -1;
      justify-self: center;
      margin-top: 4px;
      padding: 10px 22px;
      border-radius: 20px;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
      font-weight: 800;
    }
    .buttons {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }
    .how {
      --mat-button-text-label-text-color: #fff;
      background: rgb(0 0 0 / 0.3);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 56px;
      padding: 6px 12px;
      border-radius: 14px;
      background: var(--fl-card);
      color: var(--fl-ink);
      text-decoration: none;
    }
    .tile {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--fl-card-2);
      display: grid;
      place-items: center;
      color: var(--fl-ink-2);
    }
    .tile.ball {
      color: var(--fl-ball);
    }
    .text {
      flex: 1;
      display: grid;
      min-width: 0;
      line-height: 1.25;
    }
    .text b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .text small {
      font-size: 0.78rem;
      color: var(--fl-ink-2);
    }
    .mini {
      font: 900 1rem/1 var(--fl-led);
    }
    .action {
      flex: none;
      font-weight: 800;
      color: var(--fl-ball);
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
      gap: 8px;
    }
    .facts a {
      display: grid;
      align-content: start;
      gap: 2px;
      padding: 10px;
      border-radius: 14px;
      background: var(--fl-card);
      color: var(--fl-ink);
      text-decoration: none;
      min-width: 0;
    }
    .facts small {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--fl-ink-2);
    }
    .facts b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .num {
      font: 900 1.15rem/1.1 var(--fl-led);
    }
    .num.ball {
      color: var(--fl-ball);
    }
    .note {
      font-size: 0.78rem;
      color: var(--fl-ink-2);
    }
  `,
})
export class NowCardComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _dialog = inject(MatDialog);

  public readonly leagueId = input.required<string>();

  private readonly _now = toSignal(interval(1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  protected readonly state = computed(() => {
    const leagueId = this.leagueId();
    const games = this._gameService.leagueGames(leagueId) ?? [];
    const running = games.filter((game) => !game.end);
    const tournaments = (this._tournamentService.leagueTournaments(leagueId) ?? [])
      .filter((tournament) => !tournament.end && !tournament.deleted)
      .map((tournament) => ({
        ...tournament,
        games: games.filter((game) => game.tournament === tournament.id).length,
      }));
    const ratings = this._gameService.ratings(leagueId)?.current;
    const leaderId = ratings
      ? [...ratings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      : undefined;
    const potatoId = potatoState(games).holders[0]?.player;
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return {
      live: running.filter((game) => !game.paused).map((game) => this._row(game)),
      paused: running.filter((game) => game.paused).map((game) => this._row(game)),
      tournaments,
      last: games.find((game) => game.end) && this._row(games.find((game) => game.end)!),
      leader: leaderId
        ? {
            id: leaderId,
            name: this._playerService.getPlayerName(leaderId),
            rating: Math.round(ratings!.get(leaderId)!),
          }
        : null,
      potato: potatoId ? { id: potatoId, name: this._playerService.getPlayerName(potatoId) } : null,
      week: games.filter((game) => game.end && new Date(game.start) >= monday).length,
    };
  });

  /** The time played in a running game, ticking. */
  protected clock(game: Game): string {
    return formatDuration(playTime(game, this._now()) / 1000);
  }

  protected rematch(game: Game): void {
    openNewGameDialog(this._dialog, { leagueId: this.leagueId(), previousGame: game });
  }

  private _row(game: Game) {
    const names = (color: TeamColor) =>
      teamPlayers(game.teams[color])
        .map((id) => this._playerService.getPlayerName(id))
        .join(' & ');
    return {
      id: game.id,
      game,
      red: names('red'),
      blue: names('blue'),
      score: { red: teamScore(game, 'red'), blue: teamScore(game, 'blue') },
      mode: isDefaultMode(game.mode) ? null : modeOf(game),
    };
  }
}
