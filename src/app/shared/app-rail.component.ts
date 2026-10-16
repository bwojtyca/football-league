import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { GameService } from '../game/game.service';
import { crestOf, leagueOf } from '../league/league';
import { LeagueService } from '../league/league.service';
import { openNewPlaySheet } from '../league/new-play-sheet.component';

/**
 * The rail of a wide screen on the pages outside a league (the leagues, the overall ranking and
 * profile): the same rail as a league's pages, without the league's sections (evaluation 2:
 * those pages had no rail and another left edge). On a game's page, its league is the current
 * one, with its sections, as on the league's pages (evaluation 4: the rail changed there).
 */
@Component({
  selector: 'fl-app-rail',
  imports: [MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <nav class="fl-rail" [attr.aria-label]="'nav.label' | transloco">
      <a routerLink="/leagues" class="brand"
        >Football League<small>{{ 'app.tagline' | transloco }}</small></a
      >
      @if (leagues().length) {
        <h2 class="fl-kicker">{{ 'leagues.recent' | transloco }}</h2>
        @for (league of leagues(); track league.id) {
          <a
            [routerLink]="['/l', league.id]"
            class="league"
            [class.current]="league.id === current()?.id"
          >
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
      @if (current(); as league) {
        <h2 class="fl-kicker">{{ league.name }}</h2>
        @for (tab of tabs; track tab.label) {
          <a [routerLink]="['/l', league.id].concat(tab.path)" class="tab">
            <mat-icon aria-hidden="true">{{ tab.icon }}</mat-icon>
            <span>{{ tab.label | transloco }}</span>
          </a>
        }
      }
      <!-- New play in the league of the page (or the last one), quiet: these pages have their
           own main action. -->
      @if (playLeague(); as leagueId) {
        <button matButton="filled" class="new-play" (click)="newPlay(leagueId)">
          <mat-icon>add</mat-icon>{{ 'nav.new' | transloco }}
        </button>
      }
    </nav>
  `,
})
export class AppRailComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _router = inject(Router);
  private readonly _sheet = inject(MatBottomSheet);

  /** A league's sections, as in its own rail. */
  protected readonly tabs = [
    { path: [], icon: 'leaderboard', label: 'nav.ranking' },
    { path: ['games'], icon: 'scoreboard', label: 'nav.games' },
    { path: ['tournaments'], icon: 'emoji_events', label: 'nav.tournaments' },
    { path: ['players'], icon: 'groups', label: 'nav.players' },
  ];

  private readonly _url = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this._router.url),
    ),
    { initialValue: this._router.url },
  );

  /** The league of the game whose page is open, if any. */
  protected readonly current = computed(() => {
    const gameId = /^\/game\/([^/?]+)/.exec(this._url())?.[1];
    const game = gameId && this._gameService.games()?.find((one) => one.id === gameId);
    const id = game ? leagueOf(game) : null;
    const league = id ? this._leagueService.league(id) : null;
    return league ? { id: league.id, name: league.name } : null;
  });

  /** Where "New play" starts: the page's league, else the one last opened, if open to play. */
  protected readonly playLeague = computed(() => {
    const id = this.current()?.id ?? this._leagueService.lastLeague;
    const league = id ? this._leagueService.league(id) : null;
    return league && !league.archived && !league.deleted && league.players.length >= 2
      ? league.id
      : null;
  });

  protected newPlay(leagueId: string): void {
    openNewPlaySheet(this._sheet, leagueId);
  }

  /** The leagues opened on this device (and the current one), each with its crest. */
  protected readonly leagues = computed(() => {
    const all = this._leagueService.leagues() ?? [];
    const current = this.current()?.id;
    return [...new Set([...(current ? [current] : []), ...this._leagueService.recent()])]
      .map((id) => all.find((league) => league.id === id))
      .filter((league): league is NonNullable<typeof league> => !!league && !league.deleted)
      .map((league) => ({ id: league.id, name: league.name, crest: crestOf(league.name) }));
  });
}
