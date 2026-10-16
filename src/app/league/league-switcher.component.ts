import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { GameService } from '../game/game.service';
import { crestOf } from './league';
import { LeagueService } from './league.service';
import { SheetCloseComponent } from '../shared/sheet-close.component';

export function openLeagueSwitcher(sheet: MatBottomSheet, currentLeague: string | null) {
  return sheet.open(LeagueSwitcherComponent, { data: currentLeague });
}

/**
 * The league menu, opened from the league's name (canvas R6-menu-ligi): the league at a glance,
 * inviting by its link, and the leagues of this device to switch to (its settings are behind
 * the gear).
 */
@Component({
  selector: 'fl-league-switcher',
  imports: [SheetCloseComponent, MatIconModule, RouterLink, TranslocoPipe],
  template: `
    @if (league(); as league) {
      <header class="head">
        <span class="crest" aria-hidden="true">{{ crest() }}</span>
        <span class="about">
          <b>{{ league.name }}</b>
          <small>
            {{ 'count.players' | transloco: { n: league.players.length } }}
            @if (league.games !== undefined) {
              · {{ 'count.games' | transloco: { n: league.games } }}
            }
          </small>
        </span>
      </header>
      <div class="actions">
        <button class="action" (click)="share()">
          <mat-icon aria-hidden="true">share</mat-icon>
          <span class="name">{{ 'switcher.invite' | transloco }}</span>
        </button>
      </div>
    }
    @if (others().length) {
      <h2 class="fl-kicker">{{ 'switcher.change' | transloco }}</h2>
    }
    <nav>
      @for (league of others(); track league.id) {
        <a
          [routerLink]="['/l', league.id]"
          (click)="close()"
          class="item"
          [class.current]="league.id === current"
          [attr.aria-current]="league.id === current ? 'page' : null"
        >
          <!-- Each league with its crest, as in the rail (evaluation 5). -->
          <span class="crest small" aria-hidden="true">{{ crestFor(league.name) }}</span>
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
      <a routerLink="/leagues" (click)="close()" class="item link">
        <mat-icon aria-hidden="true" class="lead">list</mat-icon>
        <span class="name">{{ 'switcher.manage' | transloco }}</span>
      </a>
    </nav>
    <fl-sheet-close />
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 0 8px;
    }
    h2 {
      margin: 16px 0 6px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0 12px;
    }
    .crest {
      flex: none;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--fl-board);
      color: var(--fl-ink);
      font: 800 0.95rem/1 var(--fl-display);
    }
    .about {
      display: grid;
      min-width: 0;
    }
    .about b {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      font: var(--fl-sheet-title);
    }
    .about small {
      color: var(--fl-ink-2);
    }
    .actions {
      display: grid;
      gap: 6px;
    }
    .action {
      display: flex;
      align-items: center;
      gap: 12px;
      box-sizing: border-box;
      width: 100%;
      min-height: 56px;
      padding: 6px 14px;
      border: 0;
      border-radius: 14px;
      background: var(--fl-card-2);
      color: var(--fl-ink);
      text-align: left;
      text-decoration: none;
      font: inherit;
      cursor: pointer;
    }
    .action mat-icon {
      color: var(--fl-ink);
    }
    .action .name {
      display: grid;
      font: 700 1rem/1.3 var(--fl-display);
    }
    .action small {
      font: 400 0.875rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
    nav {
      display: grid;
    }
    .item {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
      min-height: 56px;
      padding: 6px 4px;
      border-bottom: 1px solid var(--fl-line);
      color: inherit;
      text-decoration: none;
    }
    .name {
      font: 700 1.1rem/1.25 var(--fl-display);
    }
    .crest.small {
      grid-row: 1 / span 2;
      grid-column: 1;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .item .name,
    small {
      grid-column: 2;
    }
    small {
      color: var(--fl-ink-2);
    }
    .item mat-icon {
      grid-row: 1 / span 2;
      grid-column: 3;
    }
    .item mat-icon.lead {
      grid-column: 1;
      justify-self: center;
    }
    .current {
      background: var(--fl-card-2);
      padding-left: 14px;
    }
    .link {
      grid-template-columns: 40px minmax(0, 1fr);
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

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);

  protected readonly current = inject<string | null>(MAT_BOTTOM_SHEET_DATA);

  /** The leagues to switch to: the current one is at the top already. */
  protected readonly others = computed(() =>
    this.leagues().filter((league) => league.id !== this.current),
  );

  /** The current league with its number of games, when the menu is opened from one. */
  protected readonly league = computed(() => this.leagues().find((l) => l.id === this.current));
  protected readonly crest = computed(() => crestOf(this.league()?.name ?? ''));
  protected readonly crestFor = crestOf;

  /** Invites by the league's link: the phone's share sheet, or the clipboard. */
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

  /**
   * The leagues opened on this device, the current one included (with thousands of leagues,
   * never all of them: the rest is one search away on the leagues page).
   */
  protected readonly leagues = computed(() => {
    const all = this._leagueService.leagues() ?? [];
    const ids = [
      ...new Set([...(this.current ? [this.current] : []), ...this._leagueService.recent()]),
    ];
    return (
      ids
        .map((id) => all.find((league) => league.id === id))
        .filter((league): league is NonNullable<typeof league> => !!league)
        // Finished games, as the statistics count them.
        .map((league) => ({
          ...league,
          games: this._gameService.leagueGames(league.id)?.filter((game) => game.end).length,
        }))
    );
  });

  protected close(): void {
    this._ref.dismiss();
  }
}
