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
      <a class="stats" [routerLink]="['/l', leagueId(), 'stats']">
        <mat-icon aria-hidden="true">insights</mat-icon>
        <span class="text">
          <b>{{ 'leagueStats.title' | transloco }}</b>
          <small>{{ 'leagueStats.teaser' | transloco: { n: count() } }}</small>
        </span>
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
      </a>
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
      <fl-game-list
        [leagueId]="leagueId()"
        [playerId]="filter() === 'mine' ? me.id() : null"
        [only]="only()"
        [pageSize]="30"
      />
    </main>
  `,
  styles: `
    .stats {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0 12px;
      padding: 12px 14px;
      border-radius: 16px;
      background: var(--fl-card-2);
      color: var(--fl-ink);
      text-decoration: none;
    }
    .stats mat-icon:first-child {
      color: var(--fl-ink);
    }
    .stats mat-icon:last-child {
      color: var(--fl-ink-2);
    }
    .text {
      flex: 1;
      min-width: 0;
      display: grid;
      line-height: 1.3;
    }
    .text b {
      font: 700 1rem/1.3 var(--fl-display);
    }
    .text small {
      color: var(--fl-ink-2);
      font-size: 0.82rem;
    }
    .filters {
      margin-bottom: 8px;
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
