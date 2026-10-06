import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameService } from '../game/game.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { LeagueService } from './league.service';

/** Up to three initials of a league's name, as its crest until leagues get one. */
export function crestOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

/**
 * The league's hub (canvas P14, round 4), the last tab of the bottom bar: the league at a
 * glance, its players, statistics and settings, and a link to share it. What belongs to the
 * app (language, other leagues) is in the app menu.
 */
@Component({
  selector: 'fl-league-hub',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    TopBarComponent,
    TranslocoPipe,
  ],
  template: `
    @let current = league();
    <fl-top-bar [title]="current?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      @if (current === null) {
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      } @else if (!current) {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      } @else {
        <section class="hero fl-felt">
          <span class="crest" aria-hidden="true">{{ crest() }}</span>
          <span class="about">
            <b>{{ current.name }}</b>
            <small>
              {{ 'count.players' | transloco: { n: current.players.length } }} ·
              {{ 'count.games' | transloco: { n: games() } }}
              @if (current.archived) {
                · {{ 'leagues.archive' | transloco }}
              }
            </small>
          </span>
        </section>

        <h2 class="fl-kicker">{{ 'hub.league' | transloco }}</h2>
        <nav class="rows">
          <a [routerLink]="['/l', current.id, 'players']">
            <mat-icon aria-hidden="true">groups</mat-icon>
            <span
              ><b>{{ 'hub.players' | transloco }}</b
              ><small>{{ 'count.players' | transloco: { n: current.players.length } }}</small></span
            >
            <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
          </a>
          <a [routerLink]="['/l', current.id, 'settings']">
            <mat-icon aria-hidden="true">tune</mat-icon>
            <span
              ><b>{{ 'settings.title' | transloco }}</b
              ><small>{{ 'hub.settingsHint' | transloco }}</small></span
            >
            <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
          </a>
        </nav>

        <button matButton="filled" class="share" (click)="share()">
          <mat-icon>share</mat-icon>{{ 'hub.share' | transloco }}
        </button>
      }
    </main>
  `,
  styles: `
    .hero {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 18px;
      background: var(--fl-felt-bg);
    }
    .crest {
      flex: none;
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--fl-board);
      color: var(--fl-ball);
      font: 800 1.1rem/1 var(--fl-display);
    }
    .about {
      display: grid;
      min-width: 0;
    }
    .about b {
      font: 800 1.25rem/1.2 var(--fl-display);
    }
    .about small {
      color: #cfe6d8;
    }
    h2 {
      margin: 8px 0 6px;
    }
    .rows {
      display: grid;
      margin-bottom: 16px;
      border-radius: 16px;
      background: var(--fl-card);
    }
    .rows a {
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 60px;
      padding: 8px 12px 8px 16px;
      color: inherit;
      text-decoration: none;
    }
    .rows a + a {
      border-top: 1px solid var(--fl-line);
    }
    .rows span {
      flex: 1;
      display: grid;
      min-width: 0;
    }
    .rows b {
      font: 700 1rem/1.3 var(--fl-display);
    }
    .rows small {
      font-size: 0.8rem;
      color: var(--fl-ink-2);
    }
    .rows .mat-icon {
      color: var(--fl-ink-2);
    }
    .share {
      width: 100%;
      --mat-button-filled-container-height: 52px;
      --mat-button-filled-container-color: var(--fl-card-2);
      --mat-button-filled-label-text-color: var(--fl-ink);
    }
    .share .mat-icon {
      color: var(--fl-ball);
    }
  `,
})
export class LeagueHubComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
  protected readonly crest = computed(() => crestOf(this.league()?.name ?? ''));
  protected readonly games = computed(
    () => this._gameService.leagueGames(this.leagueId())?.length ?? 0,
  );

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);

  /** Shares the league's address (the phone's share sheet), or copies it. */
  protected async share(): Promise<void> {
    const league = this.league();
    if (!league) {
      return;
    }
    const url = `${location.origin}${location.pathname}#/l/${league.id}`;
    if (navigator.share) {
      await navigator.share({ title: league.name, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    this._snackBar.open(this._transloco.translate('hub.copied'), undefined, { duration: 2500 });
  }
}
