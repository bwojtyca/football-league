import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameListComponent } from '../game/game-list/game-list.component';
import { GameService } from '../game/game.service';
import { MeService } from '../shared/me.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { LeagueService } from './league.service';

type Filter = 'all' | 'mine' | 'today' | 'tournament';

/**
 * A league's games, newest first (canvas R6-mecze): its statistics in sight at the top, and
 * filters for one's own games (on a device that knows who plays), today's and tournament ones.
 */
@Component({
  selector: 'fl-league-games',
  imports: [MatIconModule, RouterLink, GameListComponent, TopBarComponent, TranslocoPipe],
  template: `
    <fl-top-bar [title]="league()?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      <!-- The filters first, the statistics beside them: the games are the page (evaluation 5:
           a card above them pushed them down). -->
      <div class="head">
        <div
          class="fl-switch filters"
          role="radiogroup"
          [attr.aria-label]="'gameList.filter' | transloco"
        >
          @for (option of filters(); track option) {
            <button
              role="radio"
              [attr.aria-checked]="filter() === option"
              (click)="filter.set(option)"
            >
              {{ 'gameList.' + option | transloco }}
            </button>
          }
        </div>
        @if (count()) {
          <a class="stats" [routerLink]="['/l', leagueId(), 'stats']">
            <mat-icon aria-hidden="true">insights</mat-icon>{{ 'leagueStats.title' | transloco }}
          </a>
        }
      </div>
      <fl-game-list
        [leagueId]="leagueId()"
        [playerId]="filter() === 'mine' ? me.id() : null"
        [only]="only()"
        [pageSize]="30"
      />
    </main>
  `,
  styles: `
    /* As wide as the list, so the statistics end where the games end (evaluation 14); a wide
       list spans the column in two columns of days (evaluation 20). */
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 12px;
      margin: 4px 0 8px;
    }
    .stats {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 14px 0 10px;
      border-radius: 20px;
      background: var(--fl-card-2);
      color: var(--fl-ink);
      text-decoration: none;
      font: 700 0.875rem/1 var(--fl-display);
    }
    .stats mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }
    .filters {
      max-width: 100%;
      overflow-x: auto;
    }
  `,
})
export class LeagueGamesComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  protected readonly me = inject(MeService);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
  protected readonly count = computed(
    () => this._gameService.leagueGames(this.leagueId())?.filter((game) => game.end).length ?? 0,
  );

  protected readonly filter = signal<Filter>('all');
  protected readonly only = computed(() => {
    const filter = this.filter();
    return filter === 'today' || filter === 'tournament' ? filter : null;
  });
  /** "Mine" only on a device that knows who plays here. */
  protected readonly filters = computed<Filter[]>(() => {
    const me = this.me.id();
    return me && this.league()?.players.includes(me)
      ? ['all', 'mine', 'today', 'tournament']
      : ['all', 'today', 'tournament'];
  });
}
