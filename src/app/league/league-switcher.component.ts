import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameService } from '../game/game.service';
import { LeagueService } from './league.service';

export function openLeagueSwitcher(sheet: MatBottomSheet, currentLeague: string | null) {
  return sheet.open(LeagueSwitcherComponent, { data: currentLeague });
}

/** The leagues to switch to, the overall ranking and the way to all leagues and a new one. */
@Component({
  selector: 'fl-league-switcher',
  imports: [MatIconModule, RouterLink, TranslocoPipe],
  template: `
    <h2 class="fl-kicker">{{ 'switcher.title' | transloco }}</h2>
    <nav>
      @for (league of leagues(); track league.id) {
        <a
          [routerLink]="['/l', league.id]"
          (click)="close()"
          class="item"
          [class.current]="league.id === current"
          [attr.aria-current]="league.id === current ? 'page' : null"
        >
          <span class="name">{{ league.name }}</span>
          <small>
            {{ 'count.players' | transloco: { n: league.players.length } }}
            @if (league.games !== undefined) {
              · {{ 'count.games' | transloco: { n: league.games } }}
            }
          </small>
          @if (league.id === current) {
            <mat-icon aria-hidden="true">check</mat-icon>
          }
        </a>
      }
      <a routerLink="/ranking" (click)="close()" class="item link">
        <mat-icon aria-hidden="true">leaderboard</mat-icon>
        <span class="name">{{ 'ranking.global' | transloco }}</span>
      </a>
      <a routerLink="/leagues" (click)="close()" class="item link">
        <mat-icon aria-hidden="true">add</mat-icon>
        <span class="name">{{ 'switcher.manage' | transloco }}</span>
      </a>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 0 8px;
    }
    h2 {
      margin: 4px 0 8px;
    }
    nav {
      display: grid;
    }
    .item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
      min-height: 56px;
      padding: 6px 4px;
      border-bottom: 1px solid var(--fl-line);
      color: inherit;
      text-decoration: none;
    }
    .name {
      font: italic 800 1.2rem/1.2 var(--fl-display);
      text-transform: uppercase;
    }
    small {
      grid-column: 1;
      color: var(--fl-ink-2);
    }
    .item mat-icon {
      grid-row: 1 / span 2;
      grid-column: 2;
    }
    .current {
      box-shadow: inset 4px 0 0 var(--fl-ball);
      padding-left: 14px;
    }
    .link {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .link mat-icon {
      grid-column: 1;
      grid-row: 1;
      color: var(--fl-ink-2);
    }
    .link .name {
      font-style: normal;
      font-size: 1.05rem;
    }
  `,
})
export class LeagueSwitcherComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _ref = inject(MatBottomSheetRef<LeagueSwitcherComponent>);

  protected readonly current = inject<string | null>(MAT_BOTTOM_SHEET_DATA);

  protected readonly leagues = computed(() =>
    this._leagueService
      .leagues()
      ?.map((league) => ({ ...league, games: this._gameService.leagueGames(league.id)?.length })),
  );

  protected close(): void {
    this._ref.dismiss();
  }
}
