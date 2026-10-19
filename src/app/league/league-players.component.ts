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
import { MeService } from '../shared/me.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { openAddPlayerDialog } from './add-player-dialog.component';
import { LeagueService } from './league.service';

/**
 * The players tab (canvas R6-gracze): everyone in the league with their kit, games and Elo,
 * the way to each profile, and a new player.
 */
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
    <fl-top-bar [title]="current?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      @if (current === null) {
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      } @else if (!rows()) {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      } @else {
        <!-- Above the list, as "Nowy turniej" on the tournaments tab (evaluation 19). -->
        @if (!current?.archived) {
          <button matButton="tonal" class="add" (click)="addPlayer()">
            <mat-icon>person_add</mat-icon>{{ 'league.addPlayer' | transloco }}
          </button>
        }
        <!-- A list kicker, as the other tabs' lists have (evaluation 5: only this tab had a page
             heading). -->
        <h2 class="fl-kicker list-title">
          {{ 'count.players' | transloco: { n: rows()!.length } }}
        </h2>
        <ul class="players">
          @for (row of rows(); track row.id) {
            <li>
              <a [routerLink]="['/l', leagueId(), 'player', row.id]">
                <fl-avatar [playerId]="row.id" [name]="row.name" [size]="40" />
                <span class="who">
                  <span class="name-line">
                    <b>{{ row.name }}</b>
                    @if (row.id === me.id()) {
                      <span class="you">{{ 'me.you' | transloco }}</span>
                    }
                  </span>
                  <small>
                    @if (row.games) {
                      {{ 'count.games' | transloco: { n: row.games } }}
                    } @else {
                      {{ 'league.unrated' | transloco }}
                    }
                  </small>
                </span>
                @if (row.rating !== null) {
                  <span class="rating">{{ row.rating }}<small>Elo</small></span>
                }
              </a>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    .list-title {
      margin: 8px 0 4px;
    }
    /* The name gives way, the "You" tag stays whole beside it. */
    .name-line {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .you {
      flex: none;
      padding: 1px 7px;
      border-radius: 9px;
      background: var(--fl-ink);
      color: var(--fl-on-ball);
      font: 800 0.75rem/1.4 var(--fl-display);
    }
    .players {
      margin: 0 0 16px;
      padding: 0;
      list-style: none;
    }
    .players li + li {
      border-top: 1px solid var(--fl-line);
    }
    /* Two columns on a wide screen: the right one starts without a rule. */
    @media (min-width: 1000px) {
      .players li + li:nth-child(2) {
        border-top: 0;
      }
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
    /* The one list with full names: they wrap rather than lose the surname (evaluation 19). */
    .who b {
      min-width: 0;
      overflow-wrap: anywhere;
      font: 700 1.05rem/1.3 var(--fl-display);
    }
    .add {
      margin: 4px 0 12px;
    }
    .who small {
      font-size: 0.875rem;
      color: var(--fl-ink-2);
    }
    .rating {
      display: grid;
      justify-items: end;
      gap: 2px;
      font: 800 1.15rem/1 var(--fl-display);
      font-variant-numeric: tabular-nums;
    }
    .rating small {
      color: var(--fl-ink-2);
      font: 600 0.75rem/1 var(--fl-display);
    }
  `,
})
export class LeaguePlayersComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);
  /** Whoever uses this device: their row is marked. */
  protected readonly me = inject(MeService);

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
