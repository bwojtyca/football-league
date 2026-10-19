import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { Notifier } from '../notifier';
import { TopBarComponent } from '../shared/top-bar.component';
import { openAddPlayerDialog } from './add-player-dialog.component';
import { crestOf, currentLeagueId } from './league';
import { LeagueService } from './league.service';
import { openNewPlaySheet } from './new-play-sheet.component';
import { PagePlayService } from '../shared/page-play.service';
import { RailAppComponent } from '../shared/rail-app.component';
import { GameService } from '../game/game.service';

type Section = 'ranking' | 'games' | 'tournaments' | 'players' | 'none';

/**
 * A league's pages with the bottom navigation: ranking, games, the "new play" button,
 * tournaments and the league's hub (players, settings, language).
 */
@Component({
  selector: 'fl-league-layout',
  imports: [
    NgTemplateOutlet,
    RailAppComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    RouterOutlet,
    TopBarComponent,
    TranslocoPipe,
  ],
  template: `
    @let current = league();
    @if (current === null) {
      <fl-top-bar title="" back="/leagues" />
      <main class="page">
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      </main>
    } @else if (current === undefined) {
      <div class="loader"><mat-spinner [diameter]="40" /></div>
    } @else if (current.deleted) {
      <fl-top-bar [title]="current.name" [switcher]="current.id" />
      <main class="page">
        <p class="note">{{ 'league.deletedNote' | transloco }}</p>
        <button matButton="filled" (click)="restore()">{{ 'common.restore' | transloco }}</button>
      </main>
    } @else {
      <div class="content"><router-outlet /></div>
      <!-- On a wide screen (P80): a rail with the leagues and this league's sections. -->
      <nav class="fl-rail" [attr.aria-label]="'nav.label' | transloco">
        <a routerLink="/leagues" class="brand"
          >Football League<small>{{ 'app.tagline' | transloco }}</small></a
        >
        <h2 class="fl-kicker">{{ 'leagues.recent' | transloco }}</h2>
        @for (league of railLeagues(); track league.id) {
          <a
            [routerLink]="['/l', league.id]"
            class="league"
            [class.current]="league.id === current.id"
            [attr.aria-current]="league.id === current.id ? 'page' : null"
          >
            <span class="crest" aria-hidden="true">{{ league.crest }}</span>
            <span class="league-name" [attr.title]="league.name">{{ league.name }}</span>
          </a>
        }
        <a routerLink="/leagues" class="league">
          <mat-icon aria-hidden="true">list</mat-icon>{{ 'switcher.manage' | transloco }}
        </a>
        <!-- The same rail on every page (evaluation 5: this link came and went). -->
        <a routerLink="/ranking" class="league">
          <mat-icon aria-hidden="true">leaderboard</mat-icon>{{ 'ranking.global' | transloco }}
        </a>
        <h2 class="fl-kicker">{{ current.name }}</h2>
        @for (tab of tabs; track tab.section) {
          <ng-container *ngTemplateOutlet="link; context: { $implicit: tab }" />
        }
        <!-- The league's settings live under its name, at every size (owner, 18 Oct 2026). -->
        <button
          matButton="filled"
          class="new-play"
          [class.fl-cta]="!quietPlay()"
          (click)="newPlay()"
          [disabled]="current.archived"
        >
          <mat-icon>add</mat-icon>{{ 'nav.new' | transloco }}
        </button>
        <fl-rail-app [leagueId]="current.id" />
      </nav>
      <nav class="tabs" [attr.aria-label]="'nav.label' | transloco">
        @for (tab of tabs.slice(0, 2); track tab.section) {
          <ng-container *ngTemplateOutlet="link; context: { $implicit: tab }" />
        }
        <button
          class="play"
          [class.quiet]="quietPlay()"
          (click)="newPlay()"
          [disabled]="current.archived"
          [attr.aria-label]="'nav.new' | transloco"
        >
          <mat-icon>add</mat-icon>
        </button>
        @for (tab of tabs.slice(2); track tab.section) {
          <ng-container *ngTemplateOutlet="link; context: { $implicit: tab }" />
        }
      </nav>
    }

    <ng-template #link let-tab>
      <a
        [routerLink]="['/l', leagueId()].concat(tab.path)"
        class="tab"
        [class.active]="section() === tab.section"
        [attr.aria-current]="section() === tab.section ? 'page' : null"
      >
        <mat-icon aria-hidden="true">{{ tab.icon }}</mat-icon>
        <span>{{ tab.label | transloco }}</span>
      </a>
    </ng-template>
  `,
  styles: `
    .content {
      padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    }
    .note {
      margin: 0 0 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--fl-card-2);
      color: var(--fl-ink-2);
    }
    .empty {
      color: var(--fl-ink-2);
    }
    /* The bottom navigation, on the dark scoreboard, with the yellow ball in the middle. */
    .tabs {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: stretch;
      height: 68px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: var(--fl-card);
      color: var(--fl-ink);
      box-shadow: inset 0 1px 0 var(--fl-line);
    }
    .tabs .tab {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 2px;
      color: var(--fl-ink-2);
      text-decoration: none;
      font: 700 0.75rem/1 var(--fl-display);
    }
    /* The current tab: ink and a pill behind its icon (yellow is the "+" alone). */
    .tabs .tab.active {
      color: var(--fl-ink);
    }
    .tabs .tab mat-icon {
      box-sizing: content-box;
      padding: 2px 16px;
      border-radius: 14px;
    }
    .tabs .tab.active mat-icon {
      background: var(--fl-card-2);
    }
    .play {
      justify-self: center;
      align-self: start;
      width: 66px;
      height: 66px;
      margin-top: -22px;
      display: grid;
      place-items: center;
      border: 5px solid var(--fl-paper);
      border-radius: 50%;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
      cursor: pointer;
    }
    .play mat-icon {
      width: 32px;
      height: 32px;
      font-size: 32px;
    }
    /* A page with its own yellow action (a tournament's next game, owner 18 Oct 2026; an empty
       league's first game): the "+" steps back there, and only there. */
    .play.quiet {
      background: var(--fl-card-2);
      color: var(--fl-ink);
    }
    .play:disabled {
      background: var(--fl-card-2);
      color: var(--fl-ink-2);
      cursor: default;
    }
    .play:focus-visible,
    .tabs .tab:focus-visible {
      outline: 3px solid var(--fl-ball);
      outline-offset: 2px;
    }
    /* A wide screen: the rail (global styles, .fl-rail) instead of the bottom bar. */
    @media (min-width: 1000px) {
      .content {
        margin-left: 256px;
        padding-bottom: 24px;
      }
      .tabs {
        display: none;
      }
    }
  `,
})
export class LeagueLayoutComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _notifier = inject(Notifier);
  private readonly _sheet = inject(MatBottomSheet);
  private readonly _dialog = inject(MatDialog);
  private readonly _router = inject(Router);

  protected readonly tabs = [
    { section: 'ranking', path: [], icon: 'leaderboard', label: 'nav.ranking' },
    { section: 'games', path: ['games'], icon: 'scoreboard', label: 'nav.games' },
    {
      section: 'tournaments',
      path: ['tournaments'],
      icon: 'emoji_events',
      label: 'nav.tournaments',
    },
    { section: 'players', path: ['players'], icon: 'groups', label: 'nav.players' },
  ] as const;

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );

  /** The leagues in the rail of a wide screen, each with its crest. */
  protected readonly railLeagues = computed(() => {
    const all = this._leagueService.leagues() ?? [];
    const ids = [...new Set([this.leagueId(), ...this._leagueService.recent()])];
    return ids
      .map((id) => all.find((league) => league.id === id))
      .filter((league): league is NonNullable<typeof league> => !!league)
      .map((league) => ({ id: league.id, name: league.name, crest: crestOf(league.name) }));
  });

  /** `undefined` while loading, `null` when there is no such league. */
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));

  private readonly _url = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this._router.url),
    ),
    { initialValue: this._router.url },
  );

  protected readonly quietPlay = computed(() => {
    const parts = this._url().split('?')[0].split('/');
    return (
      parts[3] === 't' ||
      (parts.length <= 3 && this._gameService.leagueGames(this.leagueId())?.length === 0)
    );
  });
  /** The section the page belongs to: statistics to the games, profiles to the players; the
   * settings (reached from the gear) to none. */
  protected readonly section = computed<Section>(() => {
    const part = this._url().split('?')[0].split('/')[3] ?? '';
    return part === 'games'
      ? 'games'
      : part === 'tournaments' || part === 't'
        ? 'tournaments'
        : part === 'players' || part === 'player' || part === 'compare'
          ? 'players'
          : part === 'settings' || part === 'stats'
            ? 'none'
            : 'ranking';
  });

  constructor() {
    // An old link to the 2017 league opens it at its new id.
    effect(() => {
      const id = this.leagueId();
      if (id && currentLeagueId(id) !== id) {
        void this._router.navigateByUrl(
          this._router.url.replace(`/l/${id}`, `/l/${currentLeagueId(id)}`),
          { replaceUrl: true },
        );
      }
    });
    effect(() => {
      const league = this.league();
      if (league && !league.deleted) {
        this._leagueService.lastLeague = this.leagueId();
      } else if (league !== undefined && this._leagueService.lastLeague === this.leagueId()) {
        // A remembered league that is gone (or deleted) no longer opens on start.
        this._leagueService.lastLeague = '';
      }
    });
  }

  /** A game, a series or a tournament; a league without players gets its players first. */
  private readonly _pagePlay = inject(PagePlayService);
  private readonly _gameService = inject(GameService);

  protected newPlay(): void {
    const league = this.league();
    if (!league || league.archived) {
      return;
    }
    const page = this._pagePlay.action();
    if (page) {
      page();
    } else if (league.players.length < 2) {
      openAddPlayerDialog(this._dialog, { leagueId: league.id });
    } else {
      openNewPlaySheet(this._sheet, league.id);
    }
  }

  protected restore(): void {
    this._leagueService
      .restore(this.leagueId())
      .catch((error) => this._notifier.error('error.league', error));
  }
}
