import { NgTemplateOutlet } from '@angular/common';
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
  TEAM_COLORS,
} from '../game/game';
import { GameService } from '../game/game.service';
import { openNewGameDialog } from '../game/game-new/game-new-dialog/game-new-dialog.component';
import { ModeLabelComponent } from '../game/mode/mode-label.component';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { TitleIconComponent } from '../shared/title-icon.component';
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
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    AvatarComponent,
    TitleIconComponent,
    ModeLabelComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  template: `
    @let s = state();
    @if (s.live.length || s.paused.length || s.tournaments.length) {
      <h2 class="fl-kicker">{{ 'now.title' | transloco }}</h2>
      <div class="strip" [class.many]="s.live.length + s.paused.length + s.tournaments.length > 1">
      <!--
        A game being played (on the LED board) or paused: the two teams on lines of their own,
        each name cut fairly, the score, and a chevron (the whole row leads to the game).
      -->
      @for (game of s.live; track game.id) {
        <a class="row live" [routerLink]="['/game', game.id]">
          <span class="tile live-tile" aria-hidden="true">
            <i class="dot"></i><span class="clock">{{ clock(game.game) }}</span>
          </span>
          <ng-container *ngTemplateOutlet="teams; context: { $implicit: game }" />
          <span class="sr-only">{{ 'now.back' | transloco }}</span>
          <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
        </a>
      }
      @for (game of s.paused; track game.id) {
        <a class="row" [routerLink]="['/game', game.id]">
          <mat-icon class="tile" aria-hidden="true">pause</mat-icon>
          <ng-container
            *ngTemplateOutlet="
              teams;
              context: {
                $implicit: game,
                note:
                  'now.paused'
                  | transloco
                    : {
                        date:
                          (game.game.start
                          | translocoDate: { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
                      },
              }
            "
          />
          <span class="sr-only">{{ 'now.finish' | transloco }}</span>
          <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
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
          <span class="action"
            >{{ 'now.open' | transloco }}<mat-icon aria-hidden="true">chevron_right</mat-icon></span
          >
        </a>
      }
      </div>
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
        <span class="side side--red">
          @for (name of last.lineup.red; track $index) {
            <span>{{ name }}</span>
          }
        </span>
        <span class="score"
          ><span class="r">{{ last.score.red }}</span
          ><span class="sep">:</span><span class="b">{{ last.score.blue }}</span></span
        >
        <span class="side side--blue">
          @for (name of last.lineup.blue; track $index) {
            <span>{{ name }}</span>
          }
        </span>
        <span class="buttons">
          <button matButton="filled" class="rematch" (click)="rematch(last.game)">
            <mat-icon>replay</mat-icon>
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
            <span class="person">
              <fl-avatar [playerId]="leader.id" [name]="leader.name" [size]="24" />
              <b>{{ leader.name }}</b>
            </span>
            <span class="num ball">{{ leader.rating }}</span>
          </a>
        }
        @if (s.potato; as potato) {
          <a [routerLink]="['/l', leagueId(), 'player', potato.id]">
            <small>{{ 'now.potato' | transloco }}</small>
            <span class="person">
              <fl-avatar [playerId]="potato.id" [name]="potato.name" [size]="24" />
              <b>{{ potato.name }}</b>
            </span>
            <span class="note"><fl-title-icon name="potato" /></span>
          </a>
        }
        <a [routerLink]="['/l', leagueId(), 'stats']">
          <small>{{ 'now.week' | transloco }}</small>
          <span class="num">{{ s.week }}</span>
          <span class="note">{{ 'now.games' | transloco: { n: s.week } }}</span>
        </a>
      </div>
    }

    <!-- A scoreboard: each team on a line of its own with its goals at the end. -->
    <ng-template #teams let-game let-note="note">
      <span class="text teams">
        @for (color of colors; track color) {
          <span class="team" [class.r]="color === 'red'" [class.b]="color === 'blue'">
            <span class="names">
              @for (name of game.lineup[color]; track $index; let last = $last) {
                <span>{{ name }}</span>
                @if (!last) {
                  <i>&</i>
                }
              }
            </span>
            <b class="pts">{{ game.score[color] }}</b>
          </span>
        }
        @if (note) {
          <small>{{ note }}</small>
        }
      </span>
    </ng-template>
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
    .strip {
      display: grid;
      gap: 8px;
    }
    /* A phone: what is on now in one row of cards to swipe, the next one peeking in, so the
       ranking starts on the first screen (evaluation 10: three cards pushed it below). */
    @media (max-width: 599px) {
      .strip.many {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-padding: 0 16px;
        margin: 0 -16px;
        padding: 0 16px;
        scrollbar-width: none;
      }
      .strip.many > .row {
        flex: 0 0 84%;
        box-sizing: border-box;
        scroll-snap-align: start;
      }
      .strip.many small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--fl-ink-2);
    }
    .last .line {
      color: #cfe6d8;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--fl-red);
      color: #fff;
    }
    /* LED digits, as every clock, at a size they read at (18 px). */
    .clock {
      font: 900 1.15rem/1 var(--fl-led);
      font-variant-numeric: tabular-nums;
      color: var(--fl-ink);
    }
    /* Each player on a line of their own (long names do not wrap into a column of words). */
    .side {
      display: grid;
      min-width: 0;
      font-weight: 700;
      line-height: 1.25;
    }
    .side span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      color: var(--fl-ink-2);
    }
    .buttons {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }
    /* On the felt, both are dark pills: the screen's one yellow is the "+" below. */
    .rematch {
      --mat-button-filled-container-color: rgb(0 0 0 / 0.35);
      --mat-button-filled-label-text-color: #fff;
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
      color: var(--fl-ink);
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
      font-size: 0.875rem;
      color: var(--fl-ink-2);
    }
    .mini {
      font: 900 1rem/1 var(--fl-led);
    }
    .action {
      flex: none;
      display: inline-flex;
      align-items: center;
      font-weight: 800;
      color: var(--fl-ink);
    }
    .action mat-icon {
      color: var(--fl-ink-2);
    }
    /* The game being played: a row on the LED board, a red dot and the clock in its tile. */
    .row.live {
      background: var(--fl-board-bg);
    }
    .live-tile {
      display: grid;
      place-items: center;
      align-content: center;
      gap: 3px;
      width: 52px;
      height: 44px;
      background: var(--fl-board);
    }
    .live-tile .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--fl-red-board);
      animation: fl-live 1.6s ease-in-out infinite;
    }
    @keyframes fl-live {
      50% {
        opacity: 0.3;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .live-tile .dot {
        animation: none;
      }
    }
    .teams {
      gap: 2px;
    }
    .team {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-weight: 700;
    }
    .names {
      flex: 1;
      display: flex;
      gap: 0.3em;
      min-width: 0;
    }
    .team .pts {
      flex: none;
      min-width: 1.4em;
      text-align: right;
      font: 900 1.25rem/1.1 var(--fl-led);
    }
    .team.r .pts {
      color: var(--fl-red-board);
    }
    .team.b .pts {
      color: var(--fl-blue-board);
    }
    .names span {
      flex: 0 1 auto;
      min-width: 0;
      max-width: calc(50% - 0.6em);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .names span:only-of-type {
      max-width: 100%;
    }
    .go {
      flex: none;
      color: var(--fl-ink-2);
    }
    .names i {
      flex: none;
      font-style: normal;
      color: var(--fl-ink-2);
    }
    .team.r {
      color: #ff9a92;
    }
    .team.b {
      color: #9db8ff;
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
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--fl-ink-2);
    }
    .person {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .facts b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .num {
      font: 800 1.15rem/1.1 var(--fl-display);
    }
    .num.ball {
      color: var(--fl-ink);
    }
    .note {
      font-size: 0.875rem;
      color: var(--fl-ink-2);
    }
  `,
})
export class NowCardComponent {
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _dialog = inject(MatDialog);

  protected readonly colors = TEAM_COLORS;

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
    const lineup = (color: TeamColor) =>
      teamPlayers(game.teams[color]).map((id) => this._playerService.shortName(id));
    return {
      id: game.id,
      game,
      red: lineup('red').join(' & '),
      blue: lineup('blue').join(' & '),
      lineup: { red: lineup('red'), blue: lineup('blue') },
      score: { red: teamScore(game, 'red'), blue: teamScore(game, 'blue') },
      mode: isDefaultMode(game.mode) ? null : modeOf(game),
    };
  }
}
