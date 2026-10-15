import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { crestOf } from '../league/league';
import { LeagueService } from '../league/league.service';

/**
 * The rail of a wide screen on the pages outside a league (the leagues, the overall ranking and
 * profile): the same rail as a league's pages, without the league's sections (evaluation 2:
 * those pages had no rail and another left edge).
 */
@Component({
  selector: 'fl-app-rail',
  imports: [MatIconModule, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <nav class="fl-rail" [attr.aria-label]="'nav.label' | transloco">
      <a routerLink="/leagues" class="brand">Football League</a>
      @if (leagues().length) {
        <h2 class="fl-kicker">{{ 'leagues.recent' | transloco }}</h2>
        @for (league of leagues(); track league.id) {
          <a [routerLink]="['/l', league.id]" class="league">
            <span class="crest" aria-hidden="true">{{ league.crest }}</span>
            <span class="league-name">{{ league.name }}</span>
          </a>
        }
      }
      <a
        routerLink="/leagues"
        class="league"
        routerLinkActive="current"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        <mat-icon aria-hidden="true">list</mat-icon>{{ 'switcher.manage' | transloco }}
      </a>
      <a routerLink="/ranking" class="league" routerLinkActive="current">
        <mat-icon aria-hidden="true">leaderboard</mat-icon>{{ 'ranking.global' | transloco }}
      </a>
    </nav>
  `,
})
export class AppRailComponent {
  private readonly _leagueService = inject(LeagueService);

  /** The leagues opened on this device, each with its crest. */
  protected readonly leagues = computed(() => {
    const all = this._leagueService.leagues() ?? [];
    return this._leagueService
      .recent()
      .map((id) => all.find((league) => league.id === id))
      .filter((league): league is NonNullable<typeof league> => !!league && !league.deleted)
      .map((league) => ({ id: league.id, name: league.name, crest: crestOf(league.name) }));
  });
}
