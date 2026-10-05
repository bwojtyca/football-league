import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { teamPlayers, TEAM_COLORS } from '../game/game';
import { GameService } from '../game/game.service';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { compareNames } from '../player/player';
import { PlayerService } from '../player/player.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { openAddPlayerDialog } from './add-player-dialog.component';
import { LeagueService } from './league.service';

/** The league's players (canvas P16, before accounts and roles): games, Elo, a new player. */
@Component({
  selector: 'fl-league-players',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    TopBarComponent,
    TranslocoPipe,
  ],
  template: `
    @let current = league();
    <fl-top-bar [title]="'hub.players' | transloco" [back]="['/l', leagueId(), 'more']">
      @if (current && !current.archived) {
        <button
          matIconButton
          (click)="addPlayer()"
          [attr.aria-label]="'league.addPlayer' | transloco"
        >
          <mat-icon>person_add</mat-icon>
        </button>
      }
    </fl-top-bar>
    <main class="page">
      @if (current === null) {
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      } @else if (!rows()) {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      } @else {
        <h2 class="fl-kicker">
          {{ 'hub.inLeague' | transloco: { n: rows()!.length } }}
        </h2>
        <ul class="players">
          @for (row of rows(); track row.id) {
            <li>
              <a [routerLink]="['/l', leagueId(), 'player', row.id]">
                <fl-avatar [playerId]="row.id" [name]="row.name" [size]="40" />
                <span class="who">
                  <b>{{ row.name }}</b>
                  <small>
                    @if (row.games) {
                      {{ 'count.games' | transloco: { n: row.games } }}
                    } @else {
                      {{ 'league.unrated' | transloco }}
                    }
                  </small>
                </span>
                @if (row.rating !== null) {
                  <span class="rating">{{ row.rating }}</span>
                }
              </a>
            </li>
          }
        </ul>
        @if (!current?.archived) {
          <button matButton="outlined" class="add" (click)="addPlayer()">
            <mat-icon>person_add</mat-icon>{{ 'league.addPlayer' | transloco }}
          </button>
        }
      }
    </main>
  `,
  styles: `
    h2 {
      margin: 4px 0 6px;
    }
    .players {
      margin: 0 0 16px;
      padding: 0;
      list-style: none;
    }
    .players li + li {
      border-top: 1px solid var(--fl-line);
    }
    .players a {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 60px;
      color: inherit;
      text-decoration: none;
    }
    .who {
      flex: 1;
      display: grid;
      min-width: 0;
    }
    .who b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: 700 1.05rem/1.3 var(--fl-display);
    }
    .who small {
      font-size: 0.8rem;
      color: var(--fl-ink-2);
    }
    .rating {
      font: 900 1.3rem/1 var(--fl-led);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class LeaguePlayersComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));

  /** Every player of the league by name, with their games and Elo in it. */
  protected readonly rows = computed(() => {
    const league = this.league();
    const players = this._playerService.players();
    const games = this._gameService.leagueGames(this.leagueId());
    if (!league || !players || !games) {
      return undefined;
    }
    const played = new Map<string, number>();
    for (const game of games) {
      if (game.end) {
        for (const color of TEAM_COLORS) {
          for (const id of teamPlayers(game.teams[color])) {
            played.set(id, (played.get(id) ?? 0) + 1);
          }
        }
      }
    }
    const ratings = this._gameService.ratings(league.id)?.current;
    const members = new Set(league.players);
    return players
      .filter((player) => members.has(player.id))
      .sort(compareNames)
      .map((player) => ({
        id: player.id,
        name: player.name,
        games: played.get(player.id) ?? 0,
        rating: ratings?.has(player.id) ? Math.round(ratings.get(player.id)!) : null,
      }));
  });

  protected addPlayer(): void {
    openAddPlayerDialog(this._dialog, { leagueId: this.leagueId() });
  }
}
